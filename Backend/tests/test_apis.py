# tests/test_api_integration_schema.py
import pytest
import server

server.app.config.update(TESTING=True)

@pytest.fixture
def client():
    with server.app.test_client() as c:
        yield c

def test_parking_schema(client):
    resp = client.get("/parking")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) > 0

    expected = {
        "RoadSegmentID",
        "KerbsideID",
        "RoadSegmentDescription",
        "Latitude",
        "Longitude",
        "LastUpdated",
        "Location",
        "Zone_ID",
        "ParkingZone",
        "Restriction_Days",
        "Time_Restrictions_Start",
        "Time_Restrictions_Finish",
        "Restriction_Display",
    }

    row_keys = set(data[0].keys())
    # exact match (fail if extra/missing)
    assert row_keys == expected

def test_car_ownership_schema(client):
    resp = client.get("/car_ownership")
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) > 0

    expected = {"Year", "Number_of_cars_vic", "Attrition_rate"}
    row_keys = set(data[0].keys())
    assert row_keys == expected
