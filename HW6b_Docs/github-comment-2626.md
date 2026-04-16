Hi, I'm interested in working on this issue. I've spent some time studying the codebase and wanted to share what I found along with my proposed approach before diving in.

## What Already Exists

- The `Incident` model already has `startTime` and `endTime` fields, with `startTime` being immutable and `endTime` defaulting to `null`.
- `evaluateMonitorAction()` in `SuperSimpleQueueHelper` only sets `shouldCreateIncident` when `statusChanged` is `true`, so consecutive failed pings that don't cause a status transition don't trigger new incident creation.
- `handleIncident()` in `incidentService` checks `findActiveByMonitorId()` before creating a new incident. If an active incident already exists for that monitor, it returns the existing one instead of creating a duplicate.
- The auto-resolve path correctly sets `endTime` and `status=false` when a monitor recovers.
- The frontend already splits active and resolved incidents into separate API calls and tables, so active incidents naturally appear at the top.
- A `getIncidentsDuration()` utility exists that calculates duration from `startTime`/`endTime` and is used in the incident details dialog and summary cards.

## Remaining Gaps I Identified

1. The incidents table does not display a **duration column**, even though the duration utility already exists. Adding this would help users quickly see how long outages lasted.
2. The `startTime` column in the table currently renders `createdAt` instead of `startTime`. These are nearly identical but `startTime` is semantically correct for this feature.
3. Active incidents show `"-"` for the end time column. An **"Ongoing" indicator** would make it clearer which incidents need attention.
4. `startTime` and `endTime` are set using `Date.now().toString()` (a numeric string), but the schema type is `Date`. Mongoose coerces this, but it should be cleaned up for consistency.
5. There is no protection against **race conditions** if two checks for the same monitor arrive concurrently — both could try to create an incident. A unique compound index on `(monitorId, status)` or using `findOneAndUpdate` with upsert could address this.
6. There are currently **no tests** for `incidentService` at all. I plan to add unit tests covering deduplication, resolution, re-failure after recovery, and edge cases.

## My Plan

- Verify and harden the existing backend deduplication logic, fix the `Date` consistency issue, and add race condition protection
- Add a duration column to the incidents table and improve the UX for active incidents
- Write unit tests for `handleIncident()` and `evaluateMonitorAction()` covering all key scenarios
- Run full regression, lint, and manual testing before submitting a PR

Does this approach sound good, or would you prefer a different direction?
