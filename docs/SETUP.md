# Setup on your own accounts

This guide deploys a single-owner connector. It is not an invitation to connect to anyone else's service. All example values are placeholders.

## 1. Review ownership, permissions, and costs

Use your own GitHub, Vercel, Neon, Composio, and WHOOP developer accounts. A coding agent may already have provider connections, or you can use each dashboard/CLI. Confirm the target account and team before writing anything. Review current plans and quotas. In particular, Composio documents private custom toolkits as requiring Pro. Stop before purchases, upgrades, credit-card collection, or other new financial obligations.

Review WHOOP API and brand terms before naming, publishing, or operating an app. A disclaimer is not a trademark license. New WHOOP apps currently begin in Sandbox with up to 10 members, but this code supports only one owner. A multi-user service needs a different security and data model.

## 2. Prepare a fresh repository and isolated database

1. Fork or copy this template into your own account. Keep it private during setup. Do not copy any `.env`, credential files, deployment metadata, real API responses, or another project's git history.
2. Run `npm ci --ignore-scripts`, `npm run check`, `npm test`, and `npm run scan`.
3. Create a **new dedicated Neon database/project**. Never run the schema against an unrelated database.
4. Inspect `schema.sql`, then apply it once using your own secure database client. No migration runs automatically.
5. Obtain the direct/unpooled Postgres connection string with TLS. The refresh lock is session-scoped across transactions, so transaction pooling is not supported.

## 3. Deploy locked down first

Import your repository into your own Vercel account. Use Node.js 22 or newer and the included `vercel.json`. Deploy without production credentials first. Unconfigured sensitive routes must fail closed. Record the actual production HTTPS origin, not a guessed domain or preview alias.

Set these values as server-side, **production-only** environment variables using a secure workflow:

| Variable | Value |
| --- | --- |
| `APP_ORIGIN` | Actual HTTPS origin, with no path/query/credentials |
| `DATABASE_URL` | Direct/unpooled TLS connection string for the isolated database |
| `TOKEN_ENCRYPTION_KEY` | Cryptographically random 32-byte key encoded as 64 hex characters |
| `CONNECTOR_API_KEY` | Unique high-entropy random bearer secret |
| `WHOOP_CLIENT_ID` | Your WHOOP developer app client ID |
| `WHOOP_CLIENT_SECRET` | Your WHOOP developer app secret |

Create random secrets with a password manager or secure local program and write them directly to private storage. Do not print them, put them into a coding prompt, paste them into an issue, use them as URL parameters, or include them in preview environments. Keep an encrypted recovery copy of the encryption key. Losing it makes saved tokens unreadable. This template does not include a key-rotation migration.

Before authorizing, edit the `/privacy` page in `api/index.js` so it accurately describes your processors, assistant, support contact, retention, and logging configuration. Its default text is a starting point, not a privacy policy for a public multi-user product. Inspect the rendered page on your real deployment.

**Logging gate:** review Vercel, proxies, analytics, error tracking, and log drains for callback-query retention. OAuth codes and state appear in the callback URL. This handler does not log them and redirects to a clean URL, but the hosting provider may record request metadata. Redact/disable capture where possible and review access and retention. Do not authorize until you have accepted and documented the actual logging behavior. Never enable body/header logging for health endpoints.

## 4. Create your WHOOP app and authorize yourself

In your own WHOOP Developer Dashboard, create the app after confirming the real deployment URL. Register:

- Redirect/callback: your actual production origin followed by `/oauth/callback`.
- Privacy: your actual production origin followed by `/privacy`.

No example domain in this repository is usable as a callback. Configure the app's client ID/secret, redeploy, and request these scopes:

`read:sleep read:recovery read:cycles read:workout read:profile read:body_measurement offline`

This version validates the exact full scope set. To reduce scopes, update `SCOPES`, tool exposure, token validation, documentation, and tests together before consenting. It must not silently request more access later.

Using a secure authenticated HTTP client, POST `/oauth/start` with `Authorization: Bearer <your connector key>`. Treat the returned authorization URL as short-lived sensitive data. Open it yourself, check the app and scopes, and complete WHOOP login and consent. The callback stores encrypted tokens and redirects to `/connected`. That page means the tokens were saved, not that verification passed. State is hashed, expires after 10 minutes, and is consumed once.

WHOOP's current OAuth page describes an eight-character state; this implementation uses a stronger random 64-hex-character state. Confirm provider acceptance in your own deployment rather than weakening it automatically.

## 5. Add your private Composio toolkit

Use the official [Custom MCP guide](https://docs.composio.dev/docs/extending-sessions/custom-mcp). This server uses API-key bearer authentication, **not** DCR OAuth. WHOOP OAuth is handled separately by the connector.

Create a custom toolkit in your own Composio project using the API or SDK. The current REST operation is `POST https://backend.composio.dev/api/v3.1/custom/toolkits`, with your Composio project key in its documented authentication header. A request body has this shape:

```json
{
  "name": "My wearable connector",
  "mcp_url": "https://YOUR-VERIFIED-DEPLOYMENT/mcp",
  "auth_schemes": [{
    "mode": "API_KEY",
    "headers": {"Authorization": "Bearer {{generic_api_key}}"}
  }],
  "user_id": "YOUR-OWN-COMPOSIO-USER-ID"
}
```

Replace the endpoint with your verified final HTTPS `/mcp` URL, without redirects. Do not put secrets in the URL. Use your own stable Composio user ID to make this private. **Do not use `all`**, which shares the toolkit across the project. Private toolkits currently require Pro; if creation returns a plan/access error, stop rather than silently sharing it or upgrading.

Save the returned toolkit slug and complete the returned connection link yourself. Supply your connector key through the protected credential form. Never give Composio the WHOOP password, WHOOP refresh/access tokens, database URL, or token-encryption key. The authenticated account should sync 11 tools. Sync again after reviewed tool changes, not on every request.

Add the returned custom toolkit to sessions for that same Composio user. Verify the account is private and choose it explicitly when multiple connections exist. Tool slugs and connection IDs are generated for your installation; do not reuse someone else's values. The MCP endpoint is internet reachable, but authenticated. Private Composio visibility is an additional boundary, not a substitute for bearer auth.

## 6. Verify before you trust it

Record success/failure without retaining health responses in logs:

- Anonymous `/mcp`, `/status`, `/oauth/start`, `/verify`, and `/disconnect` calls are denied.
- `initialize`, `ping`, and `tools/list` work only with caller auth; 11 tools are listed.
- Consent has completed; authenticated GET `/status` reports authorization. `verified:false` is intentional: status is not a health test.
- Authenticated POST `/verify` performs a real forced refresh and cycle read. Require `refreshed:true` and `read_ok:true`; zero records can be legitimate.
- Test one request from each of cycles, sleep, recovery, workouts, profile, and body-measurement families through your actual Composio consumer path. Inspect and then discard private output. Pending/unscorable data must stay pending/unscorable.
- Exercise OAuth state expiry/replay and simultaneous token refreshes against a **separate test database** with synthetic provider responses. The inherited unit suite mocks database operations and is not proof of real Postgres concurrency.
- Test the disconnect/revoke/reconnect lifecycle on your own account, then verify anonymous reads remain impossible. This changes your authorization, so do it deliberately.
- Confirm no health data, secrets, or callback query strings reached logs beyond the documented provider metadata behavior.

The template's local suite does not establish a live connection. An MCP metadata success does not establish WHOOP consent or refresh success. Do not claim monitoring is installed because a server is deployed.

## 7. Disconnect and remove

Authenticated POST `/disconnect` attempts WHOOP revocation and deletes active local credential and OAuth-state rows. Check `remote_revoked`. If false, remove the app in WHOOP yourself; deletion alone does not confirm provider revocation. Then remove the Composio connection, revoke/rotate the connector key, and remove unneeded Vercel/Neon resources. Provider backups and operational logs follow those providers' retention settings. Remove private temporary credential and response files.

## Routes

| Route | Method | Access |
| --- | --- | --- |
| `/health` | GET | Public generic liveness/config hint, no data |
| `/privacy` | GET | Public deployment policy |
| `/connected` | GET | Public generic completion notice |
| `/oauth/start` | POST | Bearer auth; one-use authorization URL |
| `/oauth/callback` | GET | One-use expiring OAuth state |
| `/status` | GET | Bearer auth; authorization flag only |
| `/verify` | POST | Bearer auth; explicit refresh/read |
| `/disconnect` | POST | Bearer auth; revoke/delete |
| `/mcp` | POST | Bearer auth; fixed read tool allowlist |

The same connector key controls reads and management actions. This is for one trusted owner and client. Do not expose that key to untrusted agents or turn this into a multi-user service without redesign.
