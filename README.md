# Shnoop 🌱

**Your wearable data. Your accounts. Your little corner of the cloud.**

A self-hosted, read-only MCP connector, built for recommended use with a WHOOP developer account. Ready for you or your coding agent to set up. Fork the code, deploy it to your own Vercel and Neon accounts, then connect your own private Composio toolkit.

A gift from the RingGroup founder. Made to be forked, understood, and improved. 💚

> This project is independent and is not affiliated with, endorsed by, or sponsored by WHOOP. WHOOP is a trademark of its owner. No WHOOP logos are included.

## 💬 Small server, useful questions

- "How did I sleep?"
- "Show my latest recovery, HRV, and resting heart rate."
- "Compare my recent workout summaries."

The server exposes 11 read tools across cycles, sleep, recovery, workouts, profile, and body measurements. It uses the official WHOOP API, not private app endpoints. This is synced summary data, not live heart rate, Stress Monitor, medical advice, or emergency monitoring. A missing or pending score is not a normal reading.

## 🧰 Bring your own everything

```text
Your coding agent -> your GitHub, Vercel, and Neon accounts (setup)
Your assistant -> your private Composio toolkit -> your Vercel /mcp
                                                |          |
                                      WHOOP API/OAuth   your Neon DB
```

RingGroup does not host your deployment, receive your credentials, or provide a shared backend. Your hosting, database, Composio, WHOOP, and assistant providers process the data needed for their roles. Composio can see returned health data and the connector key. Your assistant may retain its conversation history under its own settings.

**The code is free under MIT. Running it is not guaranteed to be free.** You need your own GitHub, Vercel, Neon, Composio, and WHOOP developer accounts, plus an eligible WHOOP membership/device for meaningful data. Composio's current docs say private custom toolkits require Pro. Review all provider plans, limits, and terms before setup. No paid plan or resource should be purchased without your approval.

## 🚀 Start here

Give your coding agent [AGENTS.md](AGENTS.md), the [account setup guide](docs/ACCOUNTS.md), and ask:

> Set up this connector on my own accounts. Follow docs/ACCOUNTS.md and docs/SETUP.md and stop before any charge or public release. Keep all credentials out of chat, source control, command output, and build logs. Ask me to complete WHOOP consent myself. Report tests and the final private connection without exposing my data.

Or follow the [step-by-step setup](docs/SETUP.md) yourself. You do not need Composio to deploy the server. Composio is the private routing layer added after deployment; a coding agent can use already-connected provider tools or provider dashboards/CLIs for setup.

### Local checks

Requires Node.js 22 or newer.

```sh
npm ci --ignore-scripts
npm run check
npm test
npm run scan
```

Tests use synthetic fixtures. They do not contact WHOOP or a production database. Real OAuth, token refresh, database concurrency, and the selected client must be tested in **your** deployment. See [verification](docs/SETUP.md#6-verify-before-you-trust-it).

## 📦 What's in the box?

| Path | Purpose |
| --- | --- |
| `api/index.js` | Vercel handler, OAuth lifecycle, authenticated MCP |
| `lib/security.js` | Caller auth, encrypted token envelope, scope/input checks |
| `lib/store.js` | Single-owner token store and refresh locking |
| `lib/read-tools.js` | Fixed allowlist of 11 read tools |
| `schema.sql` | Schema for a new, isolated database |
| `docs/SETUP.md` | Deploy, consent, private Composio, verify, disconnect |
| `docs/MONITORING.md` | Optional monitoring design and limits |
| `SECURITY.md` | Threat model, limitations, safe reporting |

The database stores an encrypted credential record and hashed, expiring OAuth states. It does not store health history or conversations. Refresh tokens stay on the server. A bearer connector key protects every sensitive route. Treat that key like a password: it grants health reads and connection-management access.

## 🔒 Intentional boundaries

- One owner per deployment. This is not a multi-user SaaS or an OAuth server for MCP clients.
- No scheduler, voice delivery, webhooks endpoint, automatic coaching, or push notifications are installed by this repository.
- No automatic database migrations, account creation, plan upgrades, or paid provisioning.
- No production credentials, personal data, telemetry endpoint, or private deployment addresses are included.
- The MIT license covers this code, not WHOOP's API/data, trademarks, or provider services. Each operator must meet those services' terms and approval requirements.

## 🌿 Grow it with us

Bug fixes, tests, clearer docs, and small improvements are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). Please use synthetic data in issues and pull requests. Never post health records or credentials.

This template can improve alongside private deployments, but nothing automatically syncs from a private service into this repository. Every change needs a fresh review and secret scan.

## 📚 Official references

- [WHOOP OAuth](https://developer.whoop.com/docs/developing/oauth/)
- [WHOOP API terms and brand restrictions](https://developer.whoop.com/api-terms-of-use/)
- [WHOOP app approval](https://developer.whoop.com/docs/developing/app-approval/)
- [Composio Custom MCP](https://docs.composio.dev/docs/extending-sessions/custom-mcp)

Checked November 24, 2026. Provider UI, pricing, scopes, and approval rules can change.
