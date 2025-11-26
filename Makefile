# Makefile for Bema CRM PoC – Docker + Postgres automation

COMPOSE       ?= docker compose
DB_SERVICE    ?= db
DB_USER       ?= postgres
DB_NAME       ?= bema_crm_table_schema
SCHEMA_FILE   ?= sql/schema.sql

.PHONY: up down restart logs ps db-shell db-schema db-reset build db-wait

## Start Docker containers
up:
	$(COMPOSE) up -d

## Stop containers (keep database volume)
down:
	$(COMPOSE) down

## Restart containers
restart:
	$(COMPOSE) down
	$(COMPOSE) up -d

## Show running services
ps:
	$(COMPOSE) ps

## Stream logs (use: make logs SERVICE=app)
logs:
	$(COMPOSE) logs -f $(SERVICE)

## Build app image
build:
	$(COMPOSE) build

## Wait for Postgres to be ready
db-wait:
	@echo "Waiting for Postgres to be ready..."
	@$(COMPOSE) exec -T $(DB_SERVICE) sh -c '\
	  until pg_isready -U $(DB_USER) -d $(DB_NAME) > /dev/null 2>&1; do \
	    echo "  Postgres not ready yet..."; \
	    sleep 1; \
	  done; \
	  echo "Postgres is ready." \
	'

## Open interactive psql shell
db-shell:
	$(COMPOSE) exec -it $(DB_SERVICE) psql -U $(DB_USER) -d $(DB_NAME)

## Apply schema manually
db-schema: db-wait
	$(COMPOSE) exec -T $(DB_SERVICE) psql -U $(DB_USER) -d $(DB_NAME) < $(SCHEMA_FILE)

## Reset DB (removes volume, recreates, applies schema)
db-reset:
	$(COMPOSE) down -v
	$(COMPOSE) up -d
	$(MAKE) db-schema
