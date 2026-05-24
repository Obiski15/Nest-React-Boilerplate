# Variables
DC=docker compose
PNPM=pnpm
TURBO=npx turbo

# Infrastructure Management
.PHONY: up
up: ## Start all services in the background
	$(DC) up -d

.PHONY: down
down: ## Stop and remove all containers and volumes
	$(DC) down -v

.PHONY: restart
restart: ## Restart all services
	$(DC) restart

.PHONY: services
services: ## Spin up only the infrastructure (DB, Redis)
	$(DC) up -d db redis

.PHONY: stop
stop: ## Stop all running containers without removing them
	$(DC) stop

.PHONY: logs
logs: ## Tail logs for all services
	$(DC) logs -f

.PHONY: db-shell
db-shell: ## Access the Postgres shell
	$(DC) exec db psql -U postgres -d ai-powered-transparent-aid-system

.PHONY: redis-cli
redis-cli: ## Access Redis CLI
	$(DC) exec redis redis-cli

.PHONY: redis-flush
redis-flush: ## Clear all data in Redis
	$(DC) exec redis redis-cli flushall

# Development Flow
.PHONY: dev
dev: ## Run all apps in development mode via Turbo
	$(PNPM) dev

.PHONY: build
build: ## Build all apps and packages
	$(PNPM) build

.PHONY: clean
clean: ## Remove all build artifacts and node_modules
	rm -rf node_modules
	rm -rf apps/**/node_modules
	rm -rf apps/**/.next
	rm -rf apps/**/dist
	rm -rf .turbo

# Quality Control
.PHONY: lint
lint: ## Run linter across the monorepo
	$(PNPM) lint

.PHONY: format
format: ## Format all files with Prettier
	$(PNPM) format

.PHONY: type-check
type-check: ## Run TypeScript type checking
	$(PNPM) type-check

# Help
.PHONY: help
help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help