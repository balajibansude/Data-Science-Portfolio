FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    MPLCONFIGDIR=/app/.config/matplotlib

WORKDIR /app

RUN addgroup --system app && adduser --system --ingroup app app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini .

# Startup script: run DB migrations then start the API server
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

RUN mkdir -p /app/data/uploads /app/data/reports /app/data/models /app/.config/matplotlib && chown -R app:app /app

USER app
EXPOSE 8000

CMD ["./entrypoint.sh"]
