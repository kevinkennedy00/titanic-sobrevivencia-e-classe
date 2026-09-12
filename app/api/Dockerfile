FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app
COPY app/api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/api/app ./app
COPY train.csv ./train.csv
COPY 06_membros_equipe ./06_membros_equipe

ENV DATASET_PATH=/app/train.csv \
    TEAM_PATH=/app/06_membros_equipe

EXPOSE 8080
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
