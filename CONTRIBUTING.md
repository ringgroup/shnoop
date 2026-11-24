# Contributing

Small, clear pull requests are welcome. Explain the change, include synthetic tests, and update docs when behavior changes.

Run `npm ci --ignore-scripts`, `npm run check`, `npm test`, and `npm run scan` before submitting. Do not include credentials, real health responses, personal names, private deployment addresses, or production screenshots. Use fixtures and reserved example domains. Dependencies and migrations need review; nothing should provision paid resources automatically.

Security-sensitive changes should describe their threat model and failure behavior. Never open a public issue containing a live secret or private data. See `SECURITY.md`.

Contributions are made under the MIT license. No promise is made about support or release timing. Private deployments do not sync here automatically: review, sanitize, and scan each change before sharing it.
