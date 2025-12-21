.PHONY: up down logs test db-shell

# Start the full system (App + DB) in background
up:
	docker-compose up --build -d

# Stops everything
down:
	docker-compose down

# View logs
logs:
	docker-compose logs -f

# Enter the database container
db-shell:
	docker exec -it abac_postgres psql -U postgres -d abac_db

# Run End-to-End Tests
test:
	docker-compose exec app npm run test:e2e
