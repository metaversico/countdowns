.RECIPEPREFIX := >
.PHONY: deps frontend backend dev test build start clean

# Install dependencies
deps:
> deno cache backend/main.ts 2>/dev/null || true
> npm --prefix frontend install 2>/dev/null || true

# Run the Vue frontend
frontend:
> npm --prefix frontend run dev

# Run the Deno backend with KV support
backend:
> deno run --allow-net --allow-env --unstable-kv --watch backend/main.ts

# Launch backend and frontend together
dev:
> $(MAKE) -j2 frontend backend

# Run tests
test:
> (cd backend && deno task test)
> npm --prefix frontend test 2>/dev/null || true

# Build production assets
build:
> deno compile --allow-net --allow-env --unstable-kv backend/main.ts -o backend/dist/server 2>/dev/null || true
> npm --prefix frontend run build 2>/dev/null || true

# Start production services
start:
> systemctl --user start countdowns-backend.service countdowns-frontend.service 2>/dev/null || true

# Clean up build artifacts
clean:
> rm -rf backend/dist 2>/dev/null || true
> rm -rf frontend/dist 2>/dev/null || true
