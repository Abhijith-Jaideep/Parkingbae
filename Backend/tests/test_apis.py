# tests/test_api_integration_schema.py
import pytest
import server

server.app.config.update(TESTING=True)

@pytest.fixture
def client():
    with server.app.test_client() as c:
        yield c

# Unit test for fetching Parking Data 
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

    row = data[0]
    assert set(row.keys()) == expected

    assert isinstance(row["RoadSegmentID"], int)
    assert isinstance(row["KerbsideID"], int)
    assert isinstance(row["RoadSegmentDescription"], str)
    assert isinstance(row["Latitude"], (int, float))
    assert isinstance(row["Longitude"], (int, float))
    assert isinstance(row["LastUpdated"], str)  
    assert isinstance(row["Location"], str)
    assert isinstance(row["Zone_ID"], str)  
    assert isinstance(row["ParkingZone"], str)
    assert isinstance(row["Restriction_Days"], str)
    assert isinstance(row["Time_Restrictions_Start"], str)
    assert isinstance(row["Time_Restrictions_Finish"], str)
    assert isinstance(row["Restriction_Display"], str)

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

    assert isinstance(row["Year"], int)
    assert isinstance(row["Number_of_cars_vic"], int)
    assert isinstance(row["Attrition_rate"], (int, float))
