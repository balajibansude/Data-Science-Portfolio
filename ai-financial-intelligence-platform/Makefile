.PHONY: api-dev api-test web-dev web-lint docker-up docker-down

api-dev:
	uvicorn app.main:app --app-dir backend --reload

api-test:
	PYTHONPATH=backend pytest backend/tests

web-dev:
	cd frontend && npm run dev

web-lint:
	cd frontend && npm run lint

docker-up:
	docker compose up --build

docker-down:
	docker compose down
