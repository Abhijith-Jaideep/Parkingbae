# tests/test_api_integration_schema.py
import pytest
import server
import re

server.app.config.update(TESTING=True)

@pytest.fixture
def client():
    with server.app.test_client() as c:
        yield c


TIME_RE = re.compile(r"^\d{2}:\d{2}:\d{2}$")

# Unit test for fetching Parking Data 
def test_parking_schema(client):
    resp = client.get("/parking")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) > 0

    required = {
        "zone_number",
        "Restriction_Days",
        "Restriction_Display",
        "Time_Restrictions_Start",
        "Time_Restrictions_Finish",
    }
    row = data[0]
    assert required.issubset(set(row.keys())), f"Missing keys from parking row: {required - set(row.keys())}"

    # Types / formats
    assert isinstance(row["zone_number"], int), "zone_number should be int"
    assert isinstance(row["Restriction_Days"], str) and row["Restriction_Days"], "Restriction_Days should be non-empty str"
    assert isinstance(row["Restriction_Display"], str) and row["Restriction_Display"], "Restriction_Display should be non-empty str"

    assert isinstance(row["Time_Restrictions_Start"], str) and TIME_RE.match(row["Time_Restrictions_Start"]), \
        "Time_Restrictions_Start should be HH:MM:SS"
    assert isinstance(row["Time_Restrictions_Finish"], str) and TIME_RE.match(row["Time_Restrictions_Finish"]), \
        "Time_Restrictions_Finish should be HH:MM:SS"
        
        
# Unit test for fetching car ownership data
def test_car_ownership_schema(client):
    resp = client.get("/car_ownership")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) > 0

    expected = {"Year", "Number_of_cars_vic", "Attrition_rate"}
    row = data[0]
    assert set(row.keys()) == expected

    assert isinstance(row["Year"], int), "Year should be int"
    assert isinstance(row["Number_of_cars_vic"], int), "Number_of_cars_vic should be int"
    assert isinstance(row["Attrition_rate"], (int, float)), "Attrition_rate should be int or float"
    
# Unit test for fetching real-time parking sensor data 
def test_sensors_schema(client):
    resp = client.get("/sensors")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list), "/sensors should return a list"
    assert len(data) > 0, "No sensor data returned"

    row = data[0]
    required_keys = {
        "kerbsideid",
        "lastupdated",
        "location",
        "status_description",
        "status_timestamp",
        "zone_number",
    }
    assert required_keys.issubset(row.keys()), f"Missing keys: {required_keys - set(row.keys())}"

    # Type checks
    assert isinstance(row["kerbsideid"], int), "kerbsideid should be int"
    assert isinstance(row["lastupdated"], str) and row["lastupdated"], "lastupdated should be non-empty string"
    assert isinstance(row["status_description"], str) and row["status_description"], "status_description should be non-empty string"
    assert isinstance(row["status_timestamp"], str) and row["status_timestamp"], "status_timestamp should be non-empty string"
    assert row["zone_number"] is None or isinstance(row["zone_number"], int), "zone_number should be int or None"

    # location should be a dict with lat/lon
    assert isinstance(row["location"], dict), "location should be a dict"
    assert "lat" in row["location"] and isinstance(row["location"]["lat"], (int, float)), "lat missing or wrong type"
    assert "lon" in row["location"] and isinstance(row["location"]["lon"], (int, float)), "lon missing or wrong type"


# Unit test for merged sensor data with parking data 
def test_sensors_merged_schema(client):
    resp = client.get("/sensors_merged")
    assert resp.status_code == 200
    payload = resp.get_json()

    # Top-level keys
    required_top = {"merge_key", "sensor_count", "parking_count", "merged_count", "results"}
    assert required_top.issubset(payload.keys()), f"Missing top-level keys: {required_top - set(payload.keys())}"

    # Type checks for top-level
    assert isinstance(payload["merge_key"], str)
    assert isinstance(payload["sensor_count"], int)
    assert isinstance(payload["parking_count"], int)
    assert isinstance(payload["merged_count"], int)
    assert isinstance(payload["results"], list)
    # assert payload["merged_count"] == payload["sensor_count"]

    # Check at least one result
    if payload["results"]:
        merged_row = payload["results"][0]
        required_merged_keys = {"sensor", "parking_sign_rows", "parking_sign_count"}
        assert required_merged_keys.issubset(merged_row.keys()), \
            f"Missing merged row keys: {required_merged_keys - set(merged_row.keys())}"

        # sensor object schema
        sensor = merged_row["sensor"]
        assert isinstance(sensor, dict), "sensor should be a dict"
        assert "kerbsideid" in sensor and isinstance(sensor["kerbsideid"], int), "sensor.kerbsideid should be int"
        assert "zone_number" in sensor, "sensor.zone_number missing"

        # parking_sign_rows should be a list
        assert isinstance(merged_row["parking_sign_rows"], list), "parking_sign_rows should be list"
        assert isinstance(merged_row["parking_sign_count"], int), "parking_sign_count should be int"
