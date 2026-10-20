# Data processing agreement (template)

> **Draft for legal review (2026-10-19).** A starting point aligned with India's DPDP Act 2023 and DPDP Rules 2025, not legal advice. Have counsel review it before sending it to a customer.

**Between** [Customer legal name, GSTIN] ("Customer", the Data Fiduciary) **and** LogisticsEdge Technologies Pvt. Ltd., Plot No. 12, Vibhuti Khand, Gomti Nagar, Lucknow 226010 ("LogisticsEdge", the Data Processor).

## 1. Subject and duration
LogisticsEdge processes personal data on the Customer's behalf to provide the LogisticsEdge service under the subscription terms, for as long as the subscription lasts and until the data is deleted under §9.

## 2. Data and people
| Data principals | Personal data |
|---|---|
| Drivers | Name, phone number, licence number and expiry, document-verification status, trip location (latitude, longitude, time, speed and accuracy when reported) while a trip link is open |
| Consignees and receivers | Name, delivery location, delivery confirmation |
| Customer's own customers | Contact names, phone numbers, email addresses, GSTIN, addresses |
| Customer's staff | Name, email, phone, sign-in activity |

## 3. Instructions
LogisticsEdge processes the data only on the Customer's documented instructions, meaning the service as configured by the Customer, and for no purpose of its own. It tells the Customer if an instruction appears to break the law.

## 4. Confidentiality
Only staff who need access get it, and they are bound by confidentiality.

## 5. Security (DPDP Rule 6)
LogisticsEdge maintains reasonable security safeguards, including:
- encryption in transit (HTTPS with HSTS);
- passwords stored as bcrypt hashes;
- workspace isolation (scoped queries and database row-level security);
- access control and expiring sessions;
- logging and monitoring, with logs kept for at least one year;
- backups through its database provider.

The current list is at `/trust`.

## 6. Sub-processors
The Customer authorises the sub-processors listed at `/trust` (Neon, Vercel, Ably, OpenStreetMap tile servers, and analytics tools on the public website only). LogisticsEdge gives [30] days' notice before adding a sub-processor that handles Customer data, binds each one to obligations no weaker than these, and stays responsible for them.

## 7. Breaches
LogisticsEdge tells the Customer **without delay**, and in any case within [24] hours, after becoming aware of a breach of Customer personal data. It provides what the Customer needs for its own notices to data principals and the Data Protection Board (Rule 7), and reports to CERT-In as its directions require.

## 8. Help with rights and requests
LogisticsEdge helps the Customer answer data principals' requests (access, correction, erasure, grievance) and Board inquiries, through the product where possible.

## 9. Return and deletion
At the end of the subscription, or on request, LogisticsEdge returns or deletes Customer personal data within [30] days. The exceptions are logs and records the law requires it to keep, held for at least one year under Rule 8(3), and backups, which expire on their normal cycle.

## 10. Location
Data is stored in Singapore (Neon on AWS ap-southeast-1; Vercel sin1) unless the Customer and LogisticsEdge agree otherwise in writing. Transfers follow any restrictions the Central Government notifies under section 16 of the Act.

## 11. Audits
LogisticsEdge answers reasonable security questionnaires and, once available, shares third-party audit summaries (VAPT, ISO 27001) under NDA.

Signed for the Customer: ______  Signed for LogisticsEdge: ______  Date: ______
