
def test_root_endpoint_status(client):
    res = client.get("/")
    assert res.status_code == 200

def test_root_endpoint_body(client):
    res = client.get("/")
    assert b"backend server" in res.data.lower()
