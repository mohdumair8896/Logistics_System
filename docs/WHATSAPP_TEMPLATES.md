# WhatsApp Business: setup and message templates

| | |
|---|---|
| **Status** | Ready to submit (2026-10-19). Opening the account needs Meta Business verification, a phone number and a BSP contract, so it can't be done from the code. Have a native speaker review the Hindi before submitting. |
| **Deadlines** | WhatsApp accounts must move to **INR billing by 31 Dec 2026**. Since **1 Oct 2026**, utility messages inside the 24-hour customer-service window are charged too. |
| **Cost** | Utility template about **₹0.115** per message before GST (marketing about ₹0.86). About 5 utility messages per trip comes to roughly **₹0.68 per trip** including GST. BSPs (AiSensy, Interakt, Gupshup) add a platform fee or markup. |
| **Research** | `reports/LogisticsEdge growth roadmap India.md`, item 12 (account) and item 18 (notifications) |

## Setup
1. Verify the business in Meta Business Manager (legal name, GSTIN, address: Plot No. 12, Vibhuti Khand, Gomti Nagar, Lucknow 226010).
2. Choose a BSP, or Meta's Cloud API directly; register a number that isn't already on the WhatsApp app.
3. Set billing to INR.
4. Submit the templates below in the **Utility** category, each in English and Hindi.
5. Put the number in `NEXT_PUBLIC_WHATSAPP_NUMBER` so the website's WhatsApp buttons appear.

## Utility templates
Variables are `{{1}}`, `{{2}}` and so on. Keep links on our domain.

### 1. `driver_trip_link`: to the driver when a trip is allocated
- **en:** Hello {{1}}, you have trip {{2}} from {{3}} to {{4}}. Open this link when you start, and keep it open while driving so {{5}} can see where the load is: {{6}}. Tracking stops when the trip is closed.
- **hi:** नमस्ते {{1}}, आपकी ट्रिप {{2}} {{3}} से {{4}} तक है। गाड़ी चलाते समय यह लिंक खोलकर रखें ताकि {{5}} देख सके कि माल कहाँ है: {{6}}। ट्रिप पूरी होने पर ट्रैकिंग बंद हो जाएगी।

### 2. `customer_tracking_link`: to the consignor or consignee when the trip starts
- **en:** Your load {{1}} from {{2}} to {{3}} is on the way with vehicle {{4}}. Track it here, no login needed: {{5}}
- **hi:** आपका माल {{1}} ({{2}} से {{3}}) गाड़ी {{4}} से रवाना हो गया है। यहाँ ट्रैक करें, लॉगिन की ज़रूरत नहीं: {{5}}

### 3. `out_for_delivery`
- **en:** Load {{1}} is near {{2}} and expected for delivery today. The driver is {{3}}.
- **hi:** माल {{1}} {{2}} के पास है और आज डिलीवरी होने की उम्मीद है। ड्राइवर: {{3}}।

### 4. `delivered_pod`
- **en:** Load {{1}} was delivered at {{2}} and received by {{3}}. Proof of delivery: {{4}}
- **hi:** माल {{1}} {{2}} पर डिलीवर हो गया, {{3}} ने प्राप्त किया। डिलीवरी का प्रमाण: {{4}}

### 5. `invoice_ready`
- **en:** Invoice {{1}} for trip {{2}} is ready: {{3}}. Amount {{4}}. GST on this freight is payable by you under reverse charge.
- **hi:** ट्रिप {{2}} का बिल {{1}} तैयार है: {{3}}। राशि {{4}}। इस भाड़े पर GST रिवर्स चार्ज के तहत आपको देना है।

Template 5's GST line applies to reverse-charge invoices only. Use a variant without it for forward-charge invoices (roadmap item 9).
