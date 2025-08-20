# Countdowns

A simple viral web app for creating and sharing countdowns.

## Features
- Public landing page with hero section, feature highlights, and feeds for new, soon expiring, and finished countdowns.
- Create custom countdowns with a title, social accounts, descriptive text, image URL, call‑to‑action link, and an expiration set by duration or specific date/time.
- Backend enforces a rate limit of **10 countdowns per 3 minutes** to curb spam.

## Tech Stack
- **Frontend:** [Vue](https://vuejs.org/) powered by Vite for instant hot reloads.
- **Backend:** [Deno](https://deno.land/) with Deno KV for data persistence.
- **Containerization:** Podman for local services and production deployments.
- **Daemons:** systemd unit files manage production processes.

## Development
The project uses a `Makefile` to orchestrate common tasks and keep the developer experience consistent.

```bash
# install dependencies for backend and frontend
make deps

# run backend & frontend with hot reload
make dev

# run linting and tests
make test

# build optimized assets and binaries
make build

# launch production services using systemd
make start
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for a deeper dive into workflow details.

## Project Structure
```
├── backend/      # Deno source with KV data persistence
├── containers/   # Podman container definitions
├── frontend/     # Vue application
├── scripts/      # Utility scripts
├── specs/        # Feature RFCs and design notes
├── systemd/      # Production service unit files
├── Makefile      # Task runner for dev and deploy
├── DEVELOPMENT.md
└── README.md
```

## Contributing
Feature ideas and design discussions live under `specs/**/RFC.md`. Each RFC captures objectives, trade‑offs, data flow, and testability to ensure changes remain well‑scoped and reviewable.
