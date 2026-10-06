# SubhOne Unified Backend Architecture

## Target boundary

```text
                  ┌──────────────────────┐
                  │   PostgreSQL / Neon  │
                  │ authoritative state  │
                  └──────────┬───────────┘
                             │ transaction + outbox
                  ┌──────────▼───────────┐
                  │  Unified API Server  │
                  │ auth / RBAC / rules  │
                  │ orders / products    │
                  │ users / inventory    │
                  └───────┬───────┬──────┘
                          │       │
                 REST/JSON│       │WebSocket + replay
                          │       │
              ┌───────────▼─┐   ┌─▼─────────────┐
              │ Web frontend │   │ Mobile client │
              │ React/Vite   │   │ Native/WebView│
              └──────────────┘   └───────────────┘
```

The web and mobile clients do **not** import Neon, `pg`, SQL, or database SDKs. They consume the same versioned API and realtime event contract.

## Why this fixes the current project

The supplied project currently has:
- direct Neon SQL imports under `src/lib/neon.ts`;
- Neon/Supabase-compatible data access in UI-facing modules;
- localStorage as an order synchronization fallback;
- browser-only BroadcastChannel events;
- an Android WebView bundling a snapshot of the web application's UI;
- order creation already moved partly into `/api/create-order`, but other domains still bypass the API.

Those mechanisms make synchronization device-local and make presentation changes leak into data access.

## API rules

- `/api/v1/...` is the only application data boundary.
- Every mutation is authenticated and authorized server-side.
- Prices, stock, role restrictions, totals, approval status and order transitions are server authoritative.
- Idempotency keys prevent duplicate orders.
- Database transactions lock stock rows before decrementing.
- Responses are DTOs, not raw table dumps.
- API versions are additive: `/api/v1`, then `/api/v2`.

## Realtime rules

PostgreSQL transaction -> `event_outbox` -> `pg_notify` -> backend -> WebSocket.

The outbox is durable. A client reconnects with its last event cursor and calls `GET /api/v1/events?after=<cursor>` before resuming the WebSocket stream. Therefore a temporary mobile disconnect does not silently lose state changes.

The client should treat realtime events as **invalidations**, not as permission to mutate local business state blindly. After an event, refetch the affected resource using the API.

## Frontend decoupling

### Web
`src/lib/apiClient.ts` -> `/api/v1/*`

### Android/native
`ApiClient` -> `https://api.example.com/api/v1/*`

Both clients share:
- endpoint contracts
- auth token format
- DTO schemas
- event names
- business semantics

They do not share:
- components
- screens
- navigation
- CSS
- state-management implementation
- database code

## Migration sequence

1. Rotate every secret currently present in source/.env examples.
2. Deploy this backend with server-only `DATABASE_URL`.
3. Run `001_event_outbox.sql`.
4. Move products, users, retailers, addresses, orders, delivery, reviews and settings behind `/api/v1`.
5. Replace frontend `supabase.from(...)` and `sql\`...\`` calls with `apiClient`.
6. Replace `orderEvents.ts` BroadcastChannel as the source of truth with WebSocket + event cursor.
7. Keep localStorage only for non-authoritative UI preferences/cart drafts.
8. Rebuild Android so it points to the API independently of the website bundle.
9. Add contract tests for web/mobile against the same API.
10. Remove database URLs and SQL imports from `src/` and enforce this in CI.

## Security

Never put `DATABASE_URL` in a `VITE_` variable. Anything prefixed `VITE_` is client-visible.

The uploaded project also contains credential-like values in environment examples. Rotate the Neon database credential, MongoDB credential, and any exposed Google Maps key before production deployment.

## Operational requirements

- PostgreSQL backups/PITR enabled.
- Connection pooling.
- Structured request/event logs.
- Health and readiness endpoints.
- Rate limiting on authentication and order creation.
- Audit log for admin mutations.
- Monitoring for failed outbox delivery and WebSocket disconnect spikes.
- Automated API contract tests.
