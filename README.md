# countdowns

Simple viral app allowing users to create and share countdowns.

## Backend

A Deno [Hono](https://hono.dev/) API lives in `backend/`.

### Run the server

```bash
cd backend
deno task dev
```

This starts an HTTP server exposing:

- `GET /api/countdowns` – list existing countdowns
- `POST /api/countdowns` – create a new countdown

### Run tests

```bash
cd backend
deno task test
```
