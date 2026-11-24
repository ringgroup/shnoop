# Security

This is a single-owner template, not an audited multi-tenant service. Do not submit credentials, health records, OAuth URLs, database strings, or private deployment details in public issues. If an incident involves your own deployment, revoke affected access with your providers and rotate credentials through secure channels. Maintainers do not need your keys to inspect a synthetic reproduction.

## Boundaries

- All sensitive routes require the connector bearer secret. OAuth callback access instead requires short-lived one-use random state.
- The same bearer secret can read health data and trigger authorization, verification, and disconnect. Only give it to trusted clients. Separate read/admin credentials are future work.
- Tokens are AES-256-GCM encrypted before database storage. The encryption key lives outside the database. This does not protect against a compromised running server or an operator with both secrets.
- A session advisory lock serializes refresh attempts. An uncertainty marker is committed before a rotating-token request. Ambiguous refresh outcomes require reconnect rather than reusing a potentially spent refresh token.
- Health tool paths are fixed and input is bounded. There is no arbitrary URL proxy or SQL tool.
- The database contains active encrypted credentials and hashed OAuth states, not health history or conversations. Hosting logs, database backups, Composio, and assistant retention are separate processor boundaries.

## Known gaps and operator duties

Real database concurrency, OAuth state replay/expiry, disconnect lifecycle, provider logging, and client compatibility need deployment-specific integration testing. Unit tests use mocks. There has been no independent security audit.

Callback query parameters can appear in provider request metadata. Disable/redact capture where possible, restrict access/retention, and document actual behavior before consent. The privacy page must reflect the deployment, including its real support route. No body/header logging should be added to health or credential routes.

No application-level rate limiter, multi-user isolation, automated secret rotation, or database migration system is included. Use appropriate hosting protections without exposing credentials or blocking the OAuth callback. Keep dependencies and Node.js patched. Production secrets must not be available to preview builds or untrusted pull requests.

The included scanner is a local heuristic for obvious secrets and accidental deployment identifiers. It can miss secrets and flag synthetic fixtures. It is not a security audit, not a substitute for manual review, and not a replacement for provider secret scanning. Before public release, inspect all files **and commit metadata/history**, run a maintained secret scanner, and review privacy/brand/license obligations. Never make the production repository public as a shortcut.
