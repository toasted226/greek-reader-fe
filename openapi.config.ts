import { defineConfig } from 'ng-openapi';

/**
 * ng-openapi generator configuration.
 *
 * `dateType: 'string'` keeps `format: date` / `format: date-time` parameters as
 * plain strings instead of `Date` objects. The generator serialises `Date`
 * values with `toISOString()` (a full datetime), but the API declares its date
 * filters (`minDate`, `maxDate` on `GET /lemmas`) as `format: date` and binds
 * them to `DateOnly`, which expects `YYYY-MM-DD`. With `string` the generated
 * client accepts the date-only wire format directly, so callers no longer need
 * to hand-build query params.
 *
 * Response date fields (e.g. `uploadedAt`, `createdAt`) are strings as well;
 * parse them at the boundary when a `Date` is needed.
 *
 * Requires the backend to be running (it serves the spec):
 *   bun run generate:api
 */
export default defineConfig({
  input: 'http://localhost:3000/openapi/v1.json',
  output: './src/api',
  options: {
    dateType: 'string',
    enumStyle: 'enum',
  },
});
