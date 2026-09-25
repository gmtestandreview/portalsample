# Incident Review Examples

## Certificate Expiry

Payment API outage caused by an expired upstream certificate. The review must distinguish certificate rotation ownership (who owns the rotation schedule) from alerting coverage (who owns the alert that should have fired before expiry).

## Retry Storm

Payment API outage caused by retry storms. The review must distinguish client retry behavior (the triggering cause) from backend queue saturation (the amplifying factor that extended the outage).

## Database Failover

Payment API outage caused by database failover. The review must distinguish failover duration (time to promote replica) from stale connection pool handling (client-side delay in reconnecting after failover).
