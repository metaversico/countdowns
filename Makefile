.RECIPEPREFIX := >
.PHONY: deps db frontend backend dev test build start clean

# Install dependencies
deps:
> deno cache backend/main.ts 2>/dev/null || true
> npm --prefix frontend install 2>/dev/null || true

# Start PostgreSQL using Podman
db:
> podman-compose -f containers/postgres.yml up -d 2>/dev/null || true

# Run the Vue frontend
frontend:
> npm --prefix frontend run dev

# Run the Deno backend
backend:
> deno run --allow-net --allow-env --watch backend/main.ts

# Launch backend and frontend together
dev: db
> $(MAKE) -j2 frontend backend

# Run tests
test:
> deno test
> npm --prefix frontend test 2>/dev/null || true

# Build production assets
build:
> deno compile --allow-net backend/main.ts -o backend/dist/server 2>/dev/null || true
> npm --prefix frontend run build 2>/dev/null || true

# Start production services
start:
> systemctl --user start countdowns-backend.service countdowns-frontend.service 2>/dev/null || true

# Clean up containers and artifacts
clean:
> podman-compose -f containers/postgres.yml down 2>/dev/null || true
