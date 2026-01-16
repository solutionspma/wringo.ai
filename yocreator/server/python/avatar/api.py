from flask import Flask, request, jsonify
from render import run_avatar

app = Flask(__name__)

@app.route("/generate", methods=["POST"])
def generate():
    payload = request.json
    result = run_avatar(payload)
    return jsonify({"path": result})

if __name__ == "__main__":
    app.run(port=5003)
