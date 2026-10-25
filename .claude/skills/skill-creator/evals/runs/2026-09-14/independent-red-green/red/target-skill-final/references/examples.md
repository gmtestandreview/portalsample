# Incident Review Examples

## Example 1: Expired upstream certificate

Payment API outage caused by an expired upstream certificate. The review should
distinguish certificate rotation ownership from alerting coverage.

## Example 2: Retry storms

Payment API outage caused by retry storms. The review should distinguish client
retry behavior from backend queue saturation.

## Example 3: Database failover

Payment API outage caused by database failover. The review should distinguish
failover duration from stale connection pool handling.
