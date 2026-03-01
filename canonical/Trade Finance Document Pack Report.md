✅ 03 — Canonical Output — Trade Finance Document Pack Report.md

Module Metadata
- Module Name: Domain Workflow & Document Pack Report
- Source File ID: Trade Finance Document Pack Report.md
- Version: Not explicitly stated.

Purpose
- Describe two workflows: Conventional Factoring (Alacak Devri) and Participation Banking Murabaha.
- Define core ecosystem actors and their workflow roles.
- Define the document pack, technical fields, and relevance for consistency check / validation.
- Define pain points with automation ratings.
- Define anomaly patterns for closed-loop internal comparisons.
- Define MVP scope boundary for ingestion, computational validation, and output/interface boundaries.

MVP Scope
- MVP Boundary Principle: Internal, document-to-document cross-verification within a single uploaded application dossier; no external data dependence in MVP.
- Ingestion Scope:
  - Structured: UBL-TR 1.2 XML for e-Fatura and e-İrsaliye.
  - Unstructured: PDF extraction limits explicitly defined for Alacak Bildirim Formu (AB-NTR), Tüzel Kişi Müşteri Bilgi Formu, Murabaha Satış Sözleşmesi, Konşimento.
- MVP Extraction Boundaries (Explicitly Mapped Fields):

| Category | Document | Extracted Fields (as stated) |
|---|---|---|
| Envelope Metadata | e-Fatura / e-İrsaliye | `cbc:UBLVersionID`, `cbc:CustomizationID`, `cbc:UUID`, `cbc:IssueDate`, `cbc:InvoiceTypeCode` |
| Party Identification | e-Fatura | `cac:AccountingSupplierParty`, `cac:AccountingCustomerParty`, `cbc:ID` with `schemeID="VKN"` / `schemeID="TCKN"` |
| Financial Totals | e-Fatura | `cac:LegalMonetaryTotal/cbc:PayableAmount` |
| Line Items | e-Fatura | `cac:InvoiceLine` entries: `cbc:InvoicedQuantity`, `cbc:LineExtensionAmount`, `cac:Item/cbc:Name` |
| Document Linkage | e-Fatura | `cac:DespatchDocumentReference/cbc:ID`, associated `cbc:IssueDate` |
| OCR Scope 1 | Alacak Bildirim Formu (AB-NTR) | Applicant Name, Applicant VKN, Invoice Numbers, Invoice Amounts, IBAN |
| OCR Scope 2 | Tüzel Kişi Müşteri Bilgi Formu | Corporate Name, VKN/TCKN strings |
| OCR/NLP Scope 3 | Murabaha Satış Sözleşmesi / Konşimento | Document execution dates, goods descriptions for semantic comparison, quantitative measurements (gross weight/unit counts) |

- MVP Validations (Computational Core):
  - Deterministic exact-match comparisons between structured XML fields and OCR-extracted fields.
  - Exact mathematical comparison between XML `PayableAmount` and OCR-extracted AB-NTR assignment amounts.
  - Internal duplication indexing by immutable hash of `cbc:UUID` + `cac:AccountingSupplierParty/cac:PartyIdentification/cbc:ID`.
  - Bounded semantic similarity check: `cac:InvoiceLine/cac:Item/cbc:Name` against goods-description text in transport/Murabaha documents.

Out of Scope
- External third-party database integration in MVP.
- Cross-institution consortium-level duplicate checks in MVP.
- Live real-time API calls to GİB backend portals in MVP.
- Deep bidirectional legacy core banking write-back integration in MVP.
- Semantic processing outside bounded goods-description similarity scope (broader sentiment analysis, legal validity evaluation, external web scraping).

Actors & Core Entities
- Actors:

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
|---|---|---|
| Satıcı | Commercial origin actor | Generates e-Fatura and e-İrsaliye; presents documents for liquidity workflow |
| Alıcı | Buyer/debtor actor | Receives goods; settles payable amount at maturity/deferred schedule |
| Faktor | Conventional factoring institution | Evaluates counterparties, issues LOB, validates document pack, performs preliminary disbursement and collection cycle |
| Katılım Bankası | Participation banking institution | Acquires title before resale; executes Murabaha Satış Sözleşmesi process |
| Gelir İdaresi Başkanlığı (GİB) | Central e-document routing authority | Mandatory routing/technical validation channel for structured UBL-TR XML documents |
| Özel Entegratör | Technical bridge actor | Signing, envelope generation, ERP-to-GİB transmission in mandated UBL-TR formats |
| Credit Insurer (Kredi Sigorta Şirketi) | Optional risk actor | Alıcı due diligence and credit-ceiling support |
| Client Administrators | Operational review actor | Manual/semi-automated cross-referencing and evidence interpretation |

- Core Entities (Canonical):

| Entity | Definition (from input) | Primary Identifiers / Fields |
|---|---|---|
| e-Fatura | Central structured financial document | `cbc:ID`, `cbc:UUID`, `cbc:IssueDate`, `cac:LegalMonetaryTotal/cbc:PayableAmount`, `cac:DespatchDocumentReference`, line and tax nodes |
| e-İrsaliye | Structured physical movement record | `cbc:ID`, `cbc:IssueDate`, shipment party nodes, `cbc:DeliveredQuantity` |
| Alacak Bildirim Formu (AB-NTR) | Assignment instrument for alacak devri | Applicant/debtor names, assigned invoice IDs, invoice amounts, IBAN |
| Limit Onay Bildirimi (LOB) | Internal limit boundary document | AFH, BİH, financing ratio |
| Tüzel Kişi Müşteri Bilgi Formu | Corporate identity intake document | Corporate name, VKN/TCKN, signatory data, address data |
| Konşimento | Unstructured transport document | Shipper/consignee, routing, ports, gross weight, product descriptions |
| Murabaha Satış Sözleşmesi | Murabaha contract document | Müşteri adı, malın cinsi, satış bedeli, kâr oranı |
| Document Integrity & Evidence Report | Primary output artifact | Structured JSON payload + human-readable PDF summary |

Workflows
- Workflow A: Conventional Factoring (Alacak Devri)
  - Canonical Sequence:

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Başvuru and onboarding | Satıcı, Faktor | Application package, Tüzel Kişi Müşteri Bilgi Formu | Foundational identity/signature authority evidence |
| 2 | Entity evaluation and limit allocation | Faktor | LOB (AFH/BİH/financing ratio) | Financial boundary evidence for later comparisons |
| 3 | Physical fulfillment and e-İrsaliye generation | Satıcı, Özel Entegratör, GİB, Alıcı | e-İrsaliye | Physical movement timestamp and quantity evidence |
| 4 | Commercial realization and e-Fatura issuance | Satıcı, Alıcı | e-Fatura with despatch reference | e-İrsaliye reference linkage validation |
| 5 | Assignment of receivables (temlik) | Satıcı, Faktor | AB-NTR + finalized e-Fatura set | Assigned invoice number/amount consistency checks |
| 6 | Documentary validation and preliminary disbursement | Faktor, Client Administrators | Full submitted pack | Structural and mathematical consistency validation before ön ödeme |
| 7 | Maturity cycle and final settlement | Alıcı, Faktor, Satıcı | Settlement cycle records | Final payable and settlement loop consistency check |

  - Key Validation Obligations (Pack-Internal)
  - e-İrsaliye `cbc:IssueDate` must logically/temporally precede or match linked e-Fatura issuance chronology.
  - e-Fatura `cac:DespatchDocumentReference/cbc:ID` must exact-match e-İrsaliye `cbc:ID`.
  - Supplier identity fields (VKN/TCKN) must pass exact-match consistency checks across XML and OCR-extracted forms.
  - `PayableAmount` and assigned amounts must pass exact mathematical validation.
  - IBAN in XML payment node and AB-NTR payout instructions must pass consistency check.

- Workflow B: Participation Banking Murabaha (Islamic Trade Finance)
  - Canonical Sequence:

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Procurement identification and vekalet establishment | Alıcı, Katılım Bankası, Satıcı | Vekalet arrangement context | Sequence precondition evidence for transaction setup |
| 2 | Asset acquisition and title transfer to Katılım Bankası | Katılım Bankası, Satıcı | Supplier invoice billed to Katılım Bankası, transport/transfer records | Ownership evidence before resale step |
| 3 | Murabaha Satış Sözleşmesi execution | Katılım Bankası, Alıcı | Murabaha Satış Sözleşmesi | Contract data consistency and chronology evidence |
| 4 | Transfer of goods and documentary submission | Alıcı, Katılım Bankası | Final commercial fatura, Murabaha Satış Sözleşmesi, e-İrsaliye, relevant transfer/title documents | Cross-document goods/sequence consistency checks |
| 5 | Deferred settlement cycle | Alıcı, Katılım Bankası | Deferred installment settlement records | Deferred payment sequence and required-document timing evidence |

  - Key Validation Obligations (Pack-Internal)
  - Title transfer to Katılım Bankası must be evidenced before Murabaha resale contract execution.
  - Goods descriptions across invoice/transport/contract documents must pass bounded semantic consistency check.
  - Contract and invoice/despatch dates must pass chronological consistency check.

Document Pack Canonical Table

| Document Type | Technical Format / Standard | Canonical Fields (as stated) | Primary Uses in Consistency Check / Validation |
|---|---|---|---|
| e-Fatura | UBL-TR 1.2 XML | `cbc:UBLVersionID`, `cbc:CustomizationID`, `cbc:ID`, `cbc:UUID`, `cbc:IssueDate`, `cbc:IssueTime`, supplier ID nodes (VKN/TCKN), `cac:LegalMonetaryTotal/cbc:PayableAmount`, `cac:DespatchDocumentReference/cbc:ID`, `cac:InvoiceLine/cac:Item/cbc:Name`, `cac:TaxTotal/cbc:TaxAmount`, `cbc:DocumentCurrencyCode` | Identity, amount, chronology, linkage, and tax consistency checks |
| e-İrsaliye | UBL-TR 1.2 XML | `cbc:ID`, `cbc:IssueDate`, despatch/delivery party nodes, shipment goods nodes, `cbc:DeliveredQuantity` | Physical movement evidence and chronology/quantity comparisons |
| Alacak Bildirim Formu (AB-NTR) | PDF / semi-structured scan | Applicant name, debtor name, assigned invoice IDs, invoice amounts, IBAN | Assignment consistency checks against XML identifiers and amounts |
| Limit Onay Bildirimi (LOB) | PDF / structured internal document | AFH, BİH, financing ratio | Limit-bound consistency check for submitted invoice totals |
| Tüzel Kişi Müşteri Bilgi Formu | PDF / standardized intake form | Corporate name, VKN/TCKN, authorized signatories, address fields | Corporate identity consistency checks |
| Konşimento | PDF / unstructured transport document | Shipper, consignee, vessel/voyage/routing, loading/discharge ports, gross weight, product descriptions | Quantity/semantic/time consistency checks |
| Murabaha Satış Sözleşmesi | PDF / legal contract | Müşteri adı, malın cinsi, satış bedeli, kâr oranı | Murabaha chronology and goods-description consistency checks |

Canonical Consistency Checks (MVP)
- Check Catalog (Closed-Loop)

| Check Group | Check Name | Inputs | Comparison / Validation | Evidence Output (what must be logged) |
|---|---|---|---|---|
| Pattern Alpha | Version and Customization Framework Mismatches | `cbc:UBLVersionID`, `cbc:CustomizationID` | Presence/format recognition consistency check | Structural anomaly marker with envelope evidence |
| Pattern Alpha | Cryptographic UUID Asymmetry | XML `cbc:UUID`, OCR UUID from visual representation | Exact string comparison | Deterministic mismatch evidence |
| Pattern Beta | VKN / TCKN Misalignment Markers | XML supplier `cbc:ID` + OCR VKN/TCKN from AB-NTR and Tüzel Kişi Müşteri Bilgi Formu | Character-for-character consistency check | Identity mismatch evidence |
| Pattern Beta | Financial Routing (IBAN) Discrepancy | XML payment IBAN and AB-NTR IBAN | Exact consistency check | Routing discrepancy evidence |
| Pattern Gamma | Retroactive Despatch Reference Anomalies | e-Fatura issue date and despatch reference issue date | Chronological sequence validation | Sequence anomaly marker |
| Pattern Gamma | Murabaha Title Sequence Violations | Murabaha contract signature date and supplier invoice issue date to Katılım Bankası | Ownership-before-contract sequence validation | Chronological discrepancy evidence |
| Pattern Delta | Calculated vs. Stated Total Divergence | Invoice line extension values, tax values, `cbc:PayableAmount` | Programmatic recalculation and equality validation | Mathematical anomaly record |
| Pattern Delta | Cross-Document Volumetric Quantity Mismatch | e-Fatura `cbc:InvoicedQuantity`, e-İrsaliye `cbc:DeliveredQuantity`, Konşimento quantity/weight values | Cross-document quantity consistency check | Quantity mismatch evidence |
| Pattern Epsilon | Commercial Good Divergence Markers | e-Fatura item-name text and Murabaha/Konşimento descriptions | Semantic similarity consistency check | Semantic mismatch evidence with confidence output |
| Computational Boundary | Internal Duplication Indexing | `cbc:UUID` + supplier ID hash | Internal duplicate presentation validation | Duplicate index evidence |

Evidence Output Contract
- Output Artifacts (as stated)
  - Document Integrity & Evidence Report as structured JSON payload.
  - Human-readable PDF summary for Client Administrators.
- JSON Payload — Canonical Field Set

| Field Group | Included Fields (Minimum) | Notes / Constraints (from input) |
|---|---|---|
| Structured Identity Fields | XML supplier/customer IDs (VKN/TCKN), OCR identity fields from AB-NTR and Tüzel Kişi Müşteri Bilgi Formu | Used for deterministic identity consistency checks |
| Structured Financial Fields | XML `PayableAmount`, line amounts, tax totals, OCR assignment amounts, LOB boundaries | Used for deterministic mathematical validation and limit comparisons |
| Chronology and Linkage Fields | Despatch IDs/dates, invoice issue fields, Murabaha execution date fields | Used for sequence and linkage validation |
| Routing Fields | XML payment IBAN and AB-NTR IBAN | Used for disbursement routing consistency check |
| Semantic and Quantity Fields | Item descriptions, transport/contract descriptions, invoiced/delivered quantities, gross weights/unit counts | Used for bounded semantic and volumetric checks |
| Check Results | Enumerated mismatch, mathematical error, chronological impossibility, sequence anomaly markers | Evidence-oriented output only |

- PDF Summary — Canonical Content Blocks
  - Human-readable summary of identified mismatch/discrepancy findings.

Implementation Notes (storage-neutral)
- Internal duplicate index is client-specific and based on immutable hash of UUID + supplier identity.
- Ingestion and extraction scope is explicitly bounded to defined XML nodes and defined PDF archetypes.
- Semantic analysis scope is explicitly bounded to goods-description comparison only.

Operational Notes
- MVP integration is specified as standalone modular REST API processing uploaded XML/PDF arrays.
- Engine output is evidence generation; workflow decision and execution remain with human operational hierarchy.

Open Questions
- Module version is not explicitly stated.
- Exact JSON field-by-field schema of the Document Integrity & Evidence Report is not explicitly stated.
- Semantic confidence threshold for pass/fail is not explicitly stated.
- OCR confidence threshold and rejection criteria are not explicitly stated.
- Detailed PDF summary template blocks beyond human-readable summary are not explicitly stated.
