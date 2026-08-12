from flask import Flask, jsonify
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import requests
import os, time, threading
from collections import defaultdict
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)

# Origins allowed to call the API.
#
# This used to be a hardcoded list holding only the custom domain. When that
# domain lapsed and the frontend moved to its Render URL, every request was
# refused by CORS and the map rendered "Failed to fetch" even though the API
# was healthy. Reading it from the environment means the next deployment URL
# is a config change, not a code change and a redeploy.
DEFAULT_ORIGINS = [
    "https://www.parkingbae.me",
    "https://parkingbae.me",
    "https://parkingbae-1.onrender.com",
]

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", ",".join(DEFAULT_ORIGINS)).split(",")
    if origin.strip()
]

CORS(app, resources={
    r"/car_ownership":   {"origins": ALLOWED_ORIGINS},
    r"/parking":         {"origins": ALLOWED_ORIGINS},
    r"/sensors_merged":  {"origins": ALLOWED_ORIGINS},
}, supports_credentials=False)


DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"sslmode": "require"}
)

# API for retrieving real time occupancy data 
REAL_TIME_PARKING_API_URL = os.getenv(
    "REAL_TIME_PARKING_API_URL"
)

# Function to recursively call API to retrieve all 3309 rows as API has query limit of 100 rows 
# The /records endpoint caps a page at 100 rows, so reading ~6,300 sensors
# through it meant 64 sequential requests plus a 0.2s courtesy sleep between
# each: roughly 20 to 30 seconds before the map could draw anything. The same
# portal exposes /exports/json, which returns the whole dataset in one
# request in about a second.
EXPORT_URL = REAL_TIME_PARKING_API_URL.replace("/records", "/exports/json")

# Occupancy only changes every few minutes, so serving a recent copy is fine
# and spares both the portal and the visitor a round trip.
#
# A background thread refreshes this on a timer, so no request ever waits on
# the portal. Previously the refresh happened inline on whichever request
# found the cache expired, which meant that visitor paid the full upstream
# cost. When the export was failing and the paging fallback ran instead, that
# was roughly 50 seconds.
_REFRESH_INTERVAL_SECONDS = 60
_sensor_cache = {"rows": None, "fetched_at": 0.0, "source": None}
_sensor_lock = threading.Lock()
_refresher_started = False


def _fetch_via_pages():
    """Fallback if the bulk export is unavailable. The original approach."""
    all_rows = []
    offset = 0
    batch = 100
    while True:
        r = requests.get(
            REAL_TIME_PARKING_API_URL,
            params={"select": "*", "limit": batch, "offset": offset},
            timeout=30,
        )
        r.raise_for_status()
        rows = r.json().get("results", [])
        if not rows:
            break
        all_rows.extend(rows)
        if len(rows) < batch:
            break
        offset += batch
        time.sleep(0.2)
    return all_rows


def _refresh_sensor_cache():
    """Fetch the sensor rows once and store them. Never raises.

    Which path was used is logged, because a silent fall back to paging is
    the difference between a one second response and a fifty second one, and
    from the outside the two are indistinguishable.
    """
    started = time.time()
    try:
        r = requests.get(EXPORT_URL, timeout=90)
        r.raise_for_status()
        rows = r.json()
        if not isinstance(rows, list):
            raise ValueError("export did not return a list")
        source = "export"
    except Exception as e:
        print(f"[sensors] bulk export failed ({e}), falling back to paging", flush=True)
        try:
            rows = _fetch_via_pages()
            source = "paging"
        except Exception as e2:
            # Keep serving whatever is already cached rather than blanking the map.
            print(f"[sensors] paging fallback failed too ({e2})", flush=True)
            return False

    with _sensor_lock:
        _sensor_cache["rows"] = rows
        _sensor_cache["fetched_at"] = time.time()
        _sensor_cache["source"] = source

    print(
        f"[sensors] refreshed {len(rows)} rows via {source} "
        f"in {time.time() - started:.1f}s",
        flush=True,
    )
    return True


def _refresh_loop():
    while True:
        try:
            _refresh_sensor_cache()
        except Exception as e:  # a crash here would silently freeze the data
            print(f"[sensors] refresh loop error ({e})", flush=True)
        time.sleep(_REFRESH_INTERVAL_SECONDS)


def _ensure_refresher():
    """Start the background thread once, inside whichever process serves
    requests. Starting it at import time would not survive gunicorn's fork
    when --preload is used, since threads are not inherited by the children.
    """
    global _refresher_started
    with _sensor_lock:
        if _refresher_started:
            return
        _refresher_started = True
    threading.Thread(target=_refresh_loop, name="sensor-refresh", daemon=True).start()


def fetch_all_city_records(force=False):
    """Return the cached rows. Only the very first caller can ever block."""
    _ensure_refresher()

    if force:
        _refresh_sensor_cache()

    with _sensor_lock:
        rows = _sensor_cache["rows"]

    if rows is None:
        # Cold start: a request arrived before the first refresh completed.
        # Fetch inline this once so the response is data rather than an error.
        _refresh_sensor_cache()
        with _sensor_lock:
            rows = _sensor_cache["rows"]

    return rows or []


# Sign plate restrictions are effectively static, so they are cached for much
# longer than the sensor readings. Without this every map load paid for a
# round trip to the database to fetch the same ~1,800 rows.
_PARKING_TTL_SECONDS = 900
_parking_cache = {"rows": None, "fetched_at": 0.0}


# Function to retrieve rows of parking dataset from databse for merging with real-time data
def get_parking_rows():
    now = time.time()
    if (
        _parking_cache["rows"] is not None
        and now - _parking_cache["fetched_at"] < _PARKING_TTL_SECONDS
    ):
        return _parking_cache["rows"]

    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM parking_data"))
        rows = [dict(row) for row in result.mappings()]

    _parking_cache["rows"] = rows
    _parking_cache["fetched_at"] = now
    return rows

# Function to merge real-time data with dataset from databse 
def merge_sensors_with_parking(sensor_rows, parking_rows, key: str):
    # Function for stripping whitespace and converting to str 
    def norm(v): return None if v is None else str(v).strip()
    # Create index for parking dataset
    p_index = defaultdict(list)
    for p in parking_rows:
        pv = norm(p.get(key))
        if pv is not None:
            p_index[pv].append(p)
    # Merging loop:
    merged = []
    for s in sensor_rows: # For each row in sensor 
        sv = norm(s.get(key)) # Retrieve key value 
        matches = p_index.get(sv, []) # Match with index 
        merged.append({
            "sensor": s,
            "parking_sign_rows": matches,        
            "parking_sign_count": len(matches)   
        })
    return merged



@app.route("/car_ownership")
def get_car_ownership():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM vic_car_ownership_data"))       
        rows = [dict(row) for row in result.mappings()]
    return jsonify(rows)

@app.route("/parking")
def get_parking():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM parking_data"))
        rows = [dict(row) for row in result.mappings()]
    return jsonify(rows)

@app.route("/sensors")
def get_sensors():
    try:
        rows = fetch_all_city_records()
        print(f"Fetched {len(rows)} sensor rows total")
        return jsonify(rows)  
    except requests.HTTPError as e:
        return jsonify({"error": "city_api_error", "detail": str(e)}), 502
    except Exception as e:
        return jsonify({"error": "server_error", "detail": str(e)}), 500


# Endpoint for merged data
@app.route("/sensors_merged")
def sensors_merged():
    MERGE_KEY = "zone_number"   # Key for merging 
    try: # Fetch data 
        sensors = fetch_all_city_records()
        parking = get_parking_rows()
        # Debugging 
        """
        if sensors:
            print(f"[merge] sensors keys: {list(sensors[0].keys())[:12]}")
        if parking:
            print(f"[merge] parking keys: {list(parking[0].keys())[:12]}")
        if not sensors:
            return jsonify({"error": "no_sensor_rows"}), 200
        """
        merged = merge_sensors_with_parking(sensors, parking, MERGE_KEY)
        merged = [m for m in merged if m["parking_sign_count"] > 0]  # keep only matched

        with _sensor_lock:
            fetched_at = _sensor_cache["fetched_at"]
            source = _sensor_cache["source"]

        return jsonify({
            "merge_key": MERGE_KEY,
            "sensor_count": len(sensors),
            "parking_count": len(parking),
            "merged_count": len(merged),
            # How old the occupancy readings are, so the client can say so
            # rather than implying the map is live to the second.
            "data_age_seconds": round(time.time() - fetched_at) if fetched_at else None,
            "data_source": source,
            "results": merged
        })
    except requests.HTTPError as e:
        return jsonify({"error": "city_api_error", "detail": str(e)}), 502
    except Exception as e:
        return jsonify({"error": "server_error", "detail": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
