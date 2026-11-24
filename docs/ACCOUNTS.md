# Create or connect the accounts

Give this page and `AGENTS.md` to your coding agent. It describes the account work before `SETUP.md`. Provider screens change. Use current official pages and verify the signed-in account at every step instead of guessing button names or IDs.

The human owns every account. An agent can open the forms, enter non-secret profile details with permission, connect tools, and prepare resources. The human should approve legal terms, email verification, MFA, payment choices, and WHOOP's consent screen. Do not invent identity details or accept a subscription just to finish setup. Use secure credential forms or a password manager, never a coding prompt or repository file.

## GitHub

Use your own account and fork this repository, or use GitHub's template feature when available. A private copy is recommended during setup. Confirm the owner namespace, repository visibility, and default branch. If a coding agent has a GitHub connector, authorize only the repository access needed for this task. Do not grant access to every private repository merely for convenience.

## WHOOP developer access

Official walkthrough: https://developer.whoop.com/docs/developing/getting-started/

1. Open the Developer Dashboard through that official page. Its sign-in redirects to WHOOP identity and uses the operator's own WHOOP account credentials. This is not a separate shared account owned by the agent.
2. If the operator has no WHOOP account, let them complete account creation and any membership/device decisions themselves. Do not buy a membership or device automatically.
3. Complete developer registration and create a team if the dashboard asks. Use operator-approved team/app/contact details. The current docs allow up to five apps; do not delete an existing app to make room.
4. Defer final app creation until the Vercel production URL is verified. The dashboard requires a redirect URI that matches the OAuth request, at least one scope, and app details. Use `SETUP.md` for this template's scope set, privacy page, and real callback URL.
5. Store the returned client ID/secret securely in the operator's deployment. Never use a maintainer's app, client credentials, or callback.

A coding agent may help prepare this setup, but should not silently consent to health access or represent that WHOOP has approved a public app. Each operator must check API terms, brand use, and approval tiers.

## Vercel

Official starting guide: https://vercel.com/docs/getting-started-with-vercel

1. Sign in or create the operator's own Vercel account, often through their GitHub identity. Let the human complete identity checks and terms.
2. Confirm the personal/team workspace and current plan. Do not add a payment method or upgrade without explicit approval.
3. Import the operator's fork/template repository. If Vercel asks for GitHub installation access, select only the intended repository when possible.
4. If the coding agent uses a Vercel connector, authorize it for the same workspace. An existing Composio or agent connection may already provide access; verify it rather than creating duplicates.
5. Deploy initially without credentials, verify fail-closed behavior and the real HTTPS production URL, then follow `SETUP.md` for production-only environment variables. Do not enable preview access to production credentials.

## Neon

Official signup guide: https://neon.com/docs/get-started/signing-up

1. Sign in or create the operator's own Neon account. Complete human verification and terms as needed.
2. Confirm workspace, region, quotas, and plan. Create a new isolated project/database for this connector only. Stop before a paid resource or plan change unless approved.
3. Connect an agent's Neon integration only if needed, with the narrowest available scope. A Vercel integration is optional; do not automatically attach unrelated existing databases.
4. Apply the reviewed schema to the new database. Use the direct/unpooled TLS connection string for `DATABASE_URL`, stored only as a production secret. Do not paste it into chat or commit it.

## Composio, optional routing

Official guide: https://docs.composio.dev/docs/extending-sessions/custom-mcp

1. If the operator wants Composio routing, sign in or create their own account/project. Verify account ownership, billing, and the current plan. Private custom toolkits currently require Pro; stop for the operator's decision if they do not have it.
2. Composio can connect GitHub, Vercel, and Neon to help a capable coding agent provision resources, or the agent can use existing direct provider connections. Do not reconnect working accounts or request broader permissions without need.
3. Use a secure secret store for the operator's Composio key. The project key used to register a toolkit is not the connector bearer key and is not a WHOOP credential.
4. After deployment and WHOOP verification, add the final `/mcp` as a custom API-key toolkit private to the operator's stable user ID. Complete its returned connection link and verify the account/tool list and consumer read. Detailed request shape is in `SETUP.md`.

Without Composio, an MCP client that supports authenticated remote HTTP may connect directly to the verified `/mcp` endpoint with the bearer header. Client compatibility must be tested; do not assume every local/STDIO-only client can use this endpoint. There is no anonymous or shared fallback.

## Report back to the operator

Return the verified repository and deployment URLs, account labels used, isolated database status, test results, private-toolkit verification if selected, costs/plan decisions, and any remaining manual step. Never report secrets or health records as proof. Set up monitoring only as a separate approved task.
