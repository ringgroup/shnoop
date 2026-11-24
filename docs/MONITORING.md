# Optional monitoring, separate from deployment

This connector only answers authenticated reads. It installs no scheduler, webhook receiver, voice delivery, or notification channel. The webhook-signature utility is unit-tested groundwork, not a live webhook route.

If you add monitoring, start with an explicit plan agreed with the operator: timezone, awake hours, check frequency, delivery channel, what merits a message, and retention. An assistant-side hourly pull while awake is a possible starting point, not a provider refresh guarantee. Follow current API rate limits and backoff. Stop on authorization failure, rate limiting, or ambiguous refresh, and report the gap rather than repeatedly reconnecting.

## Interpret records carefully

- Fetch small, bounded pages. Keep IDs, `updated_at`, and `score_state`; never treat pending or unscorable data as normal values.
- Match recovery to its `sleep_id` and physiological cycle. Use a completed non-nap sleep plus scored recovery as a morning reporting signal, not proof the person is awake.
- Deduplicate reports by cycle and record revision. Remain quiet on unchanged data.
- Establish a recent scored baseline before describing a change as unusual for that person. A few records do not establish a baseline.
- Summaries should explain what stands out, not repeat every number. Ask for context when the data cannot explain a change. A possible association with sleep, training, or self-reported feelings is not a diagnosis or measured stress.
- Show freshness when it affects meaning. Summary heart rates are not a live pulse, and resting heart rate is not an hourly vital-sign feed.

Keep conversations and health history out of this database. Compute trends from the source on demand with bounded pagination. Persistent snapshots need a separate retention and consent design. Never post private summaries to issues, public dashboards, or a shared Composio toolkit.

If implementing WHOOP webhooks later, consult the current official webhook docs. Validate the exact raw body, signature, timestamp, owner binding, event type, size, and replay identity. Implement delete events and deduplication. A webhook only signals that data changed; it does not by itself deliver a user notification.

Official references:

- https://developer.whoop.com/docs/developing/webhooks/
- https://developer.whoop.com/docs/developing/rate-limiting/
- https://developer.whoop.com/api/
