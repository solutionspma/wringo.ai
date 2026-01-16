from flask import Flask, request, jsonify
from inference import run_voice

app = Flask(__name__)

@app.route("/generate", methods=["POST"])
def generate():
    payload = request.json
    result = run_voice(payload)
    return jsonify({"path": result})

if __name__ == "__main__":
    app.run(port=5002)
