from flask import Flask, request, jsonify
from generate import run_video

app = Flask(__name__)

@app.route("/generate", methods=["POST"])
def generate():
    payload = request.json
    result = run_video(payload)
    return jsonify({"path": result})

if __name__ == "__main__":
    app.run(port=5004)
