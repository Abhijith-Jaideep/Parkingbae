from flask import Flask, jsonify
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import requests
import os, time 
from collections import defaultdict
from flask_cors import CORS, cross_origin

load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/car_ownership": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]},
    r"/parking": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]},
    r"/sensors_merged": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}
})

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
def fetch_all_city_records():
    all_rows = []
    offset = 0
    batch = 100  

    # Query for retrieving total number of rows 
    meta = requests.get(REAL_TIME_PARKING_API_URL, params={"select": "kerbsideid", "limit": 1}, timeout=30)
    meta.raise_for_status()
    total = meta.json().get("total_count")

    # Continuously call API until all rows retrieved 
    while True:
        params = {"select": "*", "limit": batch, "offset": offset}
        r = requests.get(REAL_TIME_PARKING_API_URL, params=params, timeout=30)
        r.raise_for_status()
        payload = r.json()
        rows = payload.get("results", [])
        if not rows:
            break
        
        all_rows.extend(rows)
        print(f"Fetched {len(rows)} rows in this page (total so far: {len(all_rows)}/{total})")

        if len(rows) < batch:  # last page
            break

        offset += batch
        time.sleep(0.2)  # Buffer to not get blocked 
    return all_rows


# Function to retrieve rows of parking dataset from databse for merging with real-time data 
def get_parking_rows():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM parking_data"))
        return [dict(row) for row in result.mappings()]

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
    app.run(port = 5000, debug=True)
