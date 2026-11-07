# Production deployment

This repository builds the Greek Reader Angular application and its Node.js SSR server into a container. The Docker Compose deployment is maintained separately; this document describes the frontend container contract for that Compose project.

## Container

The root `Dockerfile` uses Bun 1.4.2 to install the locked dependencies and produce the Angular production build. The final image runs the generated SSR server with Node 22 and contains production dependencies only.

- Container port: `4000` by default (`PORT` can override it).
- Start command: `node dist/greek-reader/server/server.mjs`.
- Public frontend host: `greek-reader.modulrza.app` (TLS and host routing are provided by the deployment reverse proxy).
- SSR allowed host: `greek-reader.modulrza.app` is included in Angular's production host allowlist to prevent unrecognized Host headers from being rendered.
- Build context: this repository root, so Compose should build with this directory as its context and `Dockerfile` as the file.

Example standalone build and run:

```sh
docker build -t greek-reader-frontend .
docker run --rm -p 4000:4000 \
  -e API_BASE_URL=https://greek-reader-api.modulrza.app \
  greek-reader-frontend
```

The production image defaults `API_BASE_URL` to the production API host. Compose should set `API_BASE_URL` from the deployment's shared `.env` file so the value is explicit and can be changed without rebuilding the frontend image.

## Runtime API URL configuration

`API_BASE_URL` is a public URL, not a secret. It is consumed in two places:

1. The SSR Angular application reads it from the Node process environment. This is used for API calls made while rendering on the server.
2. The Express server exposes the same value at `/runtime-config.js`, with `Cache-Control: no-store`. `src/index.html` loads that script before the Angular browser bundle, and the browser API client uses the configured URL.

The default outside the production container is `http://localhost:3000` for local development. Trailing slashes are removed before the URL is used. The API base URL should be an origin/base path without a trailing slash, for example `https://greek-reader-api.modulrza.app`.

The API is hosted separately at `greek-reader-api.modulrza.app`. API CORS, session-cookie, and CSRF settings are managed with the backend deployment. Since the browser calls the API host directly, frontend proxy routing does not replace the backend's required CORS/cookie configuration.

## Compose integration

The separate Compose project should:

- Build this image from this repository's root context.
- Provide `API_BASE_URL` from the shared Compose `.env` file.
- Publish or attach container port `4000` to the reverse proxy for `greek-reader.modulrza.app`.
- Preserve `greek-reader.modulrza.app` as the request `Host` header when proxying to the SSR container; Angular's SSR host validation uses the allowlist in `angular.json`.
- Keep the frontend container on the deployment network needed by the reverse proxy. Browser API calls use the public API hostname.

No frontend credentials or secrets are needed in the image or its runtime environment. Authentication uses browser session cookies and an in-memory CSRF token; the sensitive session handling is owned by the API.

## Local production check

Build with `docker build -t greek-reader-frontend .`, run the container with `API_BASE_URL` set, then open the frontend and check `/runtime-config.js` to confirm it returns the configured public API URL. This repository's Angular production build also inlines external Google Fonts, so an image build needs network access to `fonts.googleapis.com` unless font inlining is changed.
