# Development Guide

## Prerequisites
- [Deno](https://deno.land/) and [Node.js](https://nodejs.org/) with npm
- [Podman](https://podman.io/) for containerized services
- `make` for task automation

## Environment
Set typical variables in your shell or a `.env` file consumed by the backend:

- `DATABASE_URL` – connection string for PostgreSQL
- `PORT` – API port (defaults to 8000)

## Common Tasks
The `Makefile` wraps everyday commands so contributors don't have to memorize scripts.

| Command | Description |
|---------|-------------|
| `make deps` | install backend and frontend dependencies |
| `make db` | launch PostgreSQL via Podman and run migrations |
| `make dev` | start backend (`deno run --watch`) and frontend (`vite serve`) with hot reload |
| `make test` | run Deno and frontend unit tests |
| `make build` | produce optimized frontend assets and backend binaries |
| `make start` | start production services using systemd unit files |
| `make clean` | stop containers and remove generated artifacts |

## Hot Reload Workflow
`make dev` runs both the Vue dev server and the Deno API with file watchers. Changes to either codebase are reflected immediately in the browser without manual restarts, enabling fast iteration.

## Separation of Concerns
- **frontend/** contains the Vue application organized by features and components.
- **backend/** holds Deno modules with clear boundaries for routing, data access, and domain logic.
- **specs/** documents feature RFCs to guide implementation and testing.

Follow this guide to keep contributions consistent and easy to review.
