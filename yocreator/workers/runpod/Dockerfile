# GPU WORKER DOCKERFILE
FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04

RUN apt update && apt install -y python3 python3-pip ffmpeg git

WORKDIR /app
COPY . .

RUN pip install -r server/python/requirements.txt || true

CMD ["bash", "workers/runpod/start.sh"]
