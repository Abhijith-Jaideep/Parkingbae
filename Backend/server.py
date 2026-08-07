from flask import Flask, jsonify
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import requests
import os, time 
from collections import defaultdict
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
from flask_cors import CORS

ALLOWED_ORIGINS = [
    "https://www.parkingbae.me",
    "https://parkingbae.me"

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
_CACHE_TTL_SECONDS = 120
_sensor_cache = {"rows": None, "fetched_at": 0.0}


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


def fetch_all_city_records(force=False):
    now = time.time()
    if (
        not force
        and _sensor_cache["rows"] is not None
        and now - _sensor_cache["fetched_at"] < _CACHE_TTL_SECONDS
    ):
        return _sensor_cache["rows"]

    try:
        r = requests.get(EXPORT_URL, timeout=60)
        r.raise_for_status()
        rows = r.json()
        if not isinstance(rows, list):
            raise ValueError("export did not return a list")
    except Exception as e:
        # Never fail the request just because the bulk endpoint misbehaved.
        print(f"[sensors] bulk export failed ({e}), falling back to paging")
        rows = _fetch_via_pages()

    _sensor_cache["rows"] = rows
    _sensor_cache["fetched_at"] = now
    return rows


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

        return jsonify({
            "merge_key": MERGE_KEY,
            "sensor_count": len(sensors),
            "parking_count": len(parking),
            "merged_count": len(merged),   
            "results": merged
        })
    except requests.HTTPError as e:
        return jsonify({"error": "city_api_error", "detail": str(e)}), 502
    except Exception as e:
        return jsonify({"error": "server_error", "detail": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
