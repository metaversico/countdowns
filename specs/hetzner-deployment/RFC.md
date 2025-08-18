# Hetzner Deployment RFC

## Objective
Deploy the Countdown application on a Hetzner Cloud server using Podman containers managed by systemd with Caddy as the front controller.

## Components
- **Container images**
  - `backend`: Deno API exposing countdown endpoints.
  - `frontend`: Caddy image serving the built Vue app and proxying `/api` to the backend.
  - `postgres`: Official Postgres image for persistence.
- **Systemd units** run each container with Podman.
- **Terraform** provisions the Hetzner server and feeds it cloud-init user data.
- **Cloud-init** installs Podman and writes the systemd unit files before enabling them.

## Trade-offs
- Single-server architecture keeps costs and complexity low but offers no high availability.
- Embedding service definitions in cloud-init simplifies bootstrap but couples OS image and application rollout.
- Running Postgres in a container eases setup yet lacks managed backups.

## Open Questions
- What domain name and TLS certificate approach should Caddy use?
- Which container registry will host the built images?
- Should the database run on the same host or use an external service?
- How will secrets (DB password, API keys) be provided securely?
- What server size and region best meet expected load and latency requirements?

## Decisions Needed
- Confirm Hetzner server type and location.
- Define container registry and CI pipeline for publishing images.
- Establish DNS and TLS strategy.
- Choose a backup approach for persistent volumes.
- Provide required environment variables for the services.

## Testability
- `terraform plan` produces expected infrastructure changes.
- Cloud-init bootstraps Podman and starts all systemd services.
- Accessing the server over HTTP serves the Vue app and proxies API requests to the backend.
