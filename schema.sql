-- Run ONLY against the dedicated new WHOOP project, never any existing project.
CREATE TABLE whoop_owner (
  id integer PRIMARY KEY CHECK (id=1),
  token_cipher text NOT NULL,
  needs_reconnect boolean NOT NULL DEFAULT false
);
CREATE TABLE whoop_oauth_states (
  hash text PRIMARY KEY,
  expires_at timestamptz NOT NULL
);
