# Incident response runbook

| | |
|---|---|
| **Status** | Draft (2026-10-19). Fill in the named contacts and review with counsel before relying on it. |
| **Why** | CERT-In's directions (April 2022) apply now: report listed incidents within 6 hours and keep logs for 180 days. DPDP Rule 7 adds breach notices once the Rules commence (about 13–14 May 2027). The trust page (`/trust`) promises this process. |
| **Research** | `reports/LogisticsEdge growth roadmap India.md`, trust and compliance section |

## 1. Who does what

| Role | Person | Backup | Contact |
|---|---|---|---|
| Incident lead (decides severity, owns the clock) | _to fill_ | _to fill_ | _to fill_ |
| CERT-In point of contact (registered with CERT-In) | _to fill_ | _to fill_ | _to fill_ |
| Customer communications | _to fill_ | _to fill_ | _to fill_ |
| Engineering on call | _to fill_ | _to fill_ | _to fill_ |

Public intake: security@logisticsedge.io (see `public/.well-known/security.txt`).

## 2. The clocks

| From | Deadline | Who to tell | What |
|---|---|---|---|
| Noticing a reportable incident | **6 hours** | CERT-In (incident@cert-in.org.in or its portal) | The CERT-In incident form: what, when, systems affected, indicators. Data breaches and leaks are on CERT-In's list. |
| Becoming aware of a personal-data breach (DPDP, from May 2027) | **Without delay** | Each affected person, and the Data Protection Board | Nature, extent, timing and likely consequences; what we are doing; what they can do; our contact. |
| Same | **72 hours** | Data Protection Board | Detailed report: facts, cause, mitigation, people responsible, notices sent. |
| Breach of a customer's workspace data (we are their processor) | **Without delay** | The customer (the Data Fiduciary) | Everything they need to meet their own DPDP notices. Our DPA promises this. |

DPDP has no minimum-severity threshold: any personal-data breach is notifiable once the Rules apply.

## 3. Steps

1. **Contain.** Revoke exposed keys (`AUTH_SECRET`, database and Ably credentials), rotate session signing, block abusive IPs, and take affected features offline if needed.
2. **Start the clock.** Write down when the incident was noticed. Open an incident document with a timeline.
3. **Assess.** Systems, tenants and data categories affected: drivers' locations, licence numbers, consignee names, leads' phone numbers.
4. **Report.** CERT-In within 6 hours if it is on CERT-In's list. Affected customers without delay. From May 2027, DPDP notices as in §2.
5. **Preserve evidence.** Export logs before they roll off. Don't wipe affected systems until evidence is copied.
6. **Recover and review.** Fix the cause, restore service, and write a post-incident review within 10 working days.

## 4. Logging and time (to set up)

- Keep application, access and database logs centrally for **1 year**. That meets CERT-In's 180 days now and DPDP Rule 8(3)'s one-year floor later. Today Vercel and Neon keep logs only for their default periods, so this needs a log drain.
- Sync clocks to NTP. Managed hosts already do; any self-hosted service must use the NIC or NPL time servers, as CERT-In requires.

## 5. Customer notice template

> Subject: Security incident affecting your LogisticsEdge workspace
>
> On [date and time IST] we found [what happened]. It affected [data categories] for [scope]. We [containment steps]. You may need to [actions for the customer, e.g. notify drivers]. We will update you by [time]. Questions: security@logisticsedge.io, [phone].
