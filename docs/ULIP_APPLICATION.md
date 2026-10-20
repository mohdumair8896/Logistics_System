# ULIP application pack

| | |
|---|---|
| **Status** | Ready for the owner to file (2026-10-19). Filing needs the company's GSTIN, an authorised signatory and an NDA on stamp paper, so it can't be done from the code. |
| **Why** | ULIP (Unified Logistics Interface Platform, NLDSL/DPIIT) gives approved companies government APIs for vehicle registration (VAHAN), driving licences (SARATHI), FASTag toll crossings and e-way bill lookups. It unlocks roadmap items 17 (replace the manual "document verified" flag) and 30 (FASTag crossings on trips). |
| **Research** | `reports/LogisticsEdge growth roadmap India.md`, India integrations section. Steps come from third-party guides, because the official goulip.in documentation could not be read during research; check it when you register. |

## Steps
1. Register at **goulip.in** as an "Industry Player" with the company GSTIN and an authorised contact.
2. Submit the use case below and pick the APIs.
3. Sign the NDA on **₹100 non-judicial stamp paper** and post it to NLDSL as instructed. Third-party guides report no government fee.
4. Sandbox access usually follows in **7–14 working days**. Build against the sandbox, then apply for a production review.

## APIs to request
| API | What it returns | How LogisticsEdge uses it |
|---|---|---|
| VAHAN/01 (vehicle details by registration number) | RC details, fitness, insurance and permit validity | Check a truck when it is added and before allocation; warn on lapsed fitness, insurance or permit |
| SARATHI/01 (licence by number + date of birth) | Licence validity, class, expiry | Replace the manual "document verified" flag; keep expiry alerts accurate |
| FASTAG/02 (toll crossings by vehicle) | Toll plazas crossed with time | Add crossings to the trip timeline as fallback location points |
| EWAYBILL/01 (e-way bill details) | E-way bill validity and vehicle | Show validity on the trip and warn before expiry (generation and extension go through a GSP; see roadmap item 16) |

## Use-case text (draft)
> LogisticsEdge is transport management software for Indian road-freight operators: fleet owners, transporters and 3PLs. Operators record bookings, allocate trucks and drivers, track trips through a link on the driver's phone, record proof of delivery and raise GST invoices. We request VAHAN and SARATHI to verify vehicles and driver licences when an operator adds them and before a trip is allocated, replacing manual checks. We request FASTag crossings to show toll-plaza crossings on the operator's trip timeline. We request e-way bill details to warn operators before an e-way bill expires during a trip. Data is used only inside the operator's own workspace, for that operator's vehicles, drivers and trips, and is not sold or shared. Lookups are logged per workspace.

## Data handling to state in the application
- Lookups only for vehicles, drivers and trips the operator has added to their workspace.
- Results stored in the operator's workspace; access limited to that workspace (row-level security).
- Data stored in Singapore (Neon on AWS ap-southeast-1); say so if asked about localisation.
- Contact for ULIP correspondence: _to fill_.
