# Frontend/Backend Integration Spec

## Overview
The Countdown application consists of a Deno backend that exposes a REST API and a Vue frontend that consumes it.  This spec describes the integration points between the two layers and the tests required to validate them.

## API
The backend exposes the following endpoints:

- `GET /api/countdowns` – returns an array of `Countdown` objects.
- `POST /api/countdowns` – accepts a `CountdownInput` JSON payload and returns the created `Countdown`.

### Data Types
```ts
interface CountdownInput {
  title: string;
  expiration: string; // ISO date
}

interface Countdown extends CountdownInput {
  id: string;
  createdAt: string;
}
```
The frontend must use the `expiration` field name to match the backend.  Earlier versions used `expiresAt` which caused integration issues.

## Frontend Service Layer
Create a service module `src/services/countdowns.ts` that wraps the API calls.  It should provide:

- `listCountdowns(): Promise<Countdown[]>` – calls `GET /api/countdowns`.
- `createCountdown(input: CountdownInput): Promise<Countdown>` – posts to `POST /api/countdowns`.

Components import these helpers instead of using `axios` directly.  This centralises API access and simplifies mocking in tests.

## Components
- `App.vue` fetches countdowns on mount via `listCountdowns()`.
- `CountdownForm.vue` creates a countdown using `createCountdown()` and emits `created` when finished.
- `CountdownList.vue` displays items, reading `item.expiration`.

## Tests
Use Vitest with `@vue/test-utils` and mocked modules.

- **Service tests**: verify `listCountdowns()` and `createCountdown()` call the correct endpoints and return data.
- **Component tests**:
  - `CountdownForm.vue` submits data through the service and emits `created`.
  - `CountdownList.vue` renders the passed in `expiration` values (existing test updated).

These tests ensure the frontend correctly integrates with the backend API and will guard against regressions in contract or field names.
