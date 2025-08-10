from flask import Flask, jsonify
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os
from flask_cors import CORS, cross_origin

load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/car_ownership": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]},
    r"/parking": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}
})

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"sslmode": "require"}
)

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


if __name__ == "__main__":
    app.run(port = 5000, debug=True)
