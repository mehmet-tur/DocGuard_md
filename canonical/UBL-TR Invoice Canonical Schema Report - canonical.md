✅ 03 — Canonical Output — UBL-TR Invoice Canonical Schema Report.md

Module Metadata
- Module Name: UBL-TR Invoice Canonical Schema Report
- Source File ID: UBL-TR Invoice Canonical Schema Report.md
- Version: Not explicitly stated.

Purpose
- Define namespace-aware extraction and normalization of UBL-TR 1.2 e-Fatura XML into canonical JSON.
- Provide exhaustive XPath-to-canonical field mapping with type and required/optional status.
- Define canonical JSON schema architecture using JSON Schema Draft 7 constraints.
- Define deterministic normalization rules (temporal synthesis, numeric casting/rounding, boolean resolution, code extraction, unit-code preservation).
- Define deterministic mathematical verification protocols for tutar tutarlılığı.
- Define modulus-based validation for party identity and IBAN.
- Define parse-time validation checklist and edge-case remediation catalog.

MVP Scope
- MVP Boundary Principle: Not explicitly stated.
- Ingestion Scope:
  - Structured: UBL-TR 1.2 e-Fatura XML parsing with namespace registry and DOM traversal.
- MVP Extraction Boundaries (Explicitly Mapped Fields):

| Group | Canonical Paths/Fields | Notes (as stated) |
|---|---|---|
| Metadata | `metadata.ubl_version`, `metadata.customization_id`, `metadata.profile_id` | UBL and localization/business profile envelope fields |
| Document | `document.invoice_id`, `document.uuid`, `document.issue_date`, `document.issue_time`, `document.type_code`, `document.currency_code`, `document.period_start`, `document.period_end` | Core invoice identity, chronology, type, currency, period fields |
| Supplier | `supplier.vkn`, `supplier.tckn`, `supplier.name`, `supplier.contact.phone`, `supplier.contact.email` | Party identity and contact fields |
| Customer | `customer.vkn`, `customer.name` | Buyer identity fields listed in mapping table |
| Delivery | `delivery.street`, `delivery.city`, `delivery.address_line` | Delivery location fields |
| Payment | `payment.means_code`, `payment.payment_id`, `payment.iban`, `payment.bic`, `payment.terms_note` | Settlement/routing fields |
| References | `references.despatch_id[]`, `references.despatch_date[]` | Physical movement linkage fields |
| Tax | `tax.total_tax_amount`, `tax.subtotals.taxable_base`, `tax.subtotals.tax_amount`, `tax.subtotals.percent`, `tax.subtotals.scheme_id` | Tax totals/subtotals extraction fields |
| Totals | `totals.line_extension`, `totals.tax_exclusive`, `totals.tax_inclusive`, `totals.allowance_total`, `totals.charge_total`, `totals.payable_amount` | Monetary total fields |
| Lines | `lines.line_id`, `lines.quantity`, `lines.unit_code`, `lines.net_amount`, `lines.allowance.is_charge`, `lines.allowance.reason_code`, `lines.allowance.amount`, `lines.allowance.multiplier`, `lines.item_name`, `lines.tax_percent` | Line-level quantity, valuation, allowance/charge, semantic, and tax fields |

- MVP Validations (Computational Core):
  - Not explicitly stated.

Actors & Core Entities
- Actors:

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
|---|---|---|
| Programmatic parser / ingestion engine | Extraction actor | Namespace mapping and XPath traversal of UBL-TR XML |
| Parsing/normalization engine | Transformation actor | Convert deep XML structure into canonical JSON with deterministic transformations |
| Verification algorithm / extraction engine | Validation actor | Execute parse-time structural, chronological, mathematical, identity, semantic, and routing checks |
| Client Administrators | Review actor | Manual review context referenced for operational document-pack validation |

- Core Entities (Canonical):

| Entity | Definition (from input) | Primary Identifiers / Fields |
|---|---|---|
| UBL-TR 1.2 XML (e-Fatura) | Source hierarchical structured document | Namespace-prefixed nodes under Invoice/cac/cbc/ext/sig |
| Canonical JSON | Flattened normalized representation for deterministic validation | `metadata`, `document`, `supplier`, `customer`, `delivery`, `references`, `payment`, `tax`, `totals`, `lines` |
| JSON Schema Draft 7 definition | Canonical structure/type/pattern contract | Required sets, regex patterns, numeric precision (`multipleOf: 0.01`), `additionalProperties: false` |
| Parse-Time Validation Checklist | Pre-commit validation sequence | 7-step gateway checks |
| Edge Case Catalog | Structural remediation matrix | Defined edge-case manifestations and normalization strategies |

Workflows
- Workflow: Exhaustive Parse-Time Validation Checklist
  - Canonical Sequence:

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Foundational Envelope and Syntax Verification | Parser | UBL-TR XML | Verify `cbc:UBLVersionID` contains `2.1` and `cbc:CustomizationID` contains `TR1.2` |
| 2 | Cryptographic Hash Isolation | Parser | `cbc:UUID` | Isolate/format-check UUID for internal duplication indexing use |
| 3 | Identity Equivalence Confirmation | Verification algorithm | Supplier `cbc:ID` (10/11 digit identity) | Modulus-10 validation and mapping for OCR cross-reference |
| 4 | Temporal Chronological Sequencing | Verification algorithm | `document.issue_date`, `references.despatch_date[]` | Validate physical despatch chronology versus invoice issuance |
| 5 | Absolute Monetary Recalculation | Verification algorithm | `lines.net_amount`, `totals.line_extension`, `tax.total_tax_amount`, `totals.payable_amount` | Programmatic monetary recalculation for tutar tutarlılığı |
| 6 | Semantic Commodity Validation | Verification algorithm | `lines.item_name` | Validate presence of meaningful natural-language item strings for downstream semantic checks |
| 7 | Financial Routing Integrity | Verification algorithm | `payment.iban` and AB-NTR comparison target | Structural and modulus validation of routing field prior to comparison loop |

  - Key Validation Obligations (Pack-Internal)
  - Namespace registry must be resolved before XPath evaluation.
  - Envelope/version/customization values must pass consistency check at parse time.
  - Identity strings must pass arithmetic validation before downstream comparisons.
  - Monetary totals must pass deterministic recomputation checks.
  - Routing field must pass structural validation before disbursement-related comparison.

Canonical Consistency Checks (MVP)
- Check Catalog (Closed-Loop)

| Check Group | Check Name | Inputs | Comparison / Validation | Evidence Output (what must be logged) |
|---|---|---|---|---|
| Parse-Time Checklist | Foundational Envelope and Syntax Verification | `cbc:UBLVersionID`, `cbc:CustomizationID` | Required value/format consistency check | Invalid envelope/customization evidence |
| Parse-Time Checklist | Cryptographic Hash Isolation | `cbc:UUID` | Format and extraction consistency check | UUID extraction/format evidence |
| Parse-Time Checklist | Identity Equivalence Confirmation | Supplier party ID field | Modulus-10 arithmetic validation | Identity discrepancy evidence |
| Parse-Time Checklist | Temporal Chronological Sequencing | `document.issue_date`, `references.despatch_date[]` | Date-order consistency check | Chronological discrepancy evidence |
| Parse-Time Checklist | Absolute Monetary Recalculation | `lines.net_amount`, totals/tax fields | Deterministic arithmetic validation | Monetary discrepancy evidence |
| Parse-Time Checklist | Semantic Commodity Validation | `lines.item_name` | Presence/meaningful string validation | Semantic-field discrepancy evidence |
| Parse-Time Checklist | Financial Routing Integrity | `payment.iban` | Structural + Modulus-97 validation | Routing discrepancy evidence |
| Normalization Rules | Temporal Data Synthesis and ISO-8601 Formatting | `IssueDate`, `IssueTime` | Deterministic merge into ISO-8601 UTC string | Normalized timestamp evidence |
| Normalization Rules | Numeric Type Casting and Arbitrary Precision Rounding | Monetary string nodes | Numeric cast + half-up rounding to two decimals | Rounded-value evidence |
| Normalization Rules | Boolean Resolution of Financial Modifiers | `cbc:ChargeIndicator` | Case-normalized boolean resolution | Boolean-cast evidence |
| Normalization Rules | Codified Rationale Extraction | Tax/payment code nodes | Direct code extraction without transformation | Code extraction evidence |
| Normalization Rules | Volumetric Measurement Standardization | `InvoicedQuantity/@unitCode`, quantity value | Attribute extraction + numeric casting | Quantity/unit evidence |
| Edge Case Catalog | Orphaned Financial Allowances | `AllowanceTotalAmount` + missing allowance details | Preserve amount + synthetic reason insertion strategy | Format discrepancy record |
| Edge Case Catalog | Cascading Tevkifat Modifiers | Nested tax subtotal arrays | Flatten to distinct subtotal objects | Recalculation-path evidence |
| Edge Case Catalog | Unit Dimension Mismatches | Non-standard unit identifiers | Preserve non-standard unit code string | Unit-code discrepancy evidence |
| Edge Case Catalog | Omission of Payment Mechanisms | Missing payment/account nodes | Nullify `payment` object without placeholder data | Severe routing discrepancy evidence |
| Edge Case Catalog | Contradictory Currency Parameters | Document currency vs inline currencyIDs | Detect contradiction and emit discrepancy array | Currency discrepancy evidence |
| Edge Case Catalog | ZATCA-style Prepayment Compression | Multiple item objects compressed in one line | Restrict capture to primary item and log inconsistency | Structural discrepancy evidence |

Evidence Output Contract
- Output Artifacts (as stated)
  - Canonical JSON object constrained by schema architecture.
  - Parse-time discrepancy/inconsistency records prior to evidence database commit.
  - Explicit discrepancy report array for contradictory currency parameters.
- JSON Payload — Canonical Field Set

| Field Group | Included Fields (Minimum) | Notes / Constraints (from input) |
|---|---|---|
| Metadata | `ubl_version`, `customization_id`, `profile_id` | Schema constraints include const/pattern/required checks |
| Document | `invoice_id`, `uuid`, `issue_date`, `type_code`, `currency_code`, optional period fields | Pattern/format constraints defined in schema block |
| Supplier / Customer | Identity and name fields | `anyOf` requirement structure for VKN/TCKN + name |
| Delivery / References | Delivery location + despatch arrays | Optional groups used in chronology/linkage checks |
| Payment | Means, payment ID, IBAN, BIC, terms note | Optional object; routing checks applied when available |
| Tax / Totals | Tax totals/subtotals and legal monetary totals | Numeric precision constraints (`multipleOf: 0.01`) |
| Lines | Line IDs, item names, quantity/unit, net amount, tax/allowance-charge fields | Minimum line cardinality and required line fields in schema |

Implementation Notes (storage-neutral)
- Canonical structure is explicitly described as flattened JSON derived from deep XML traversal.
- Schema uses strict type/pattern constraints and `additionalProperties: false` to bound payload shape.
- Normalization and validation are designed as deterministic preprocessing for downstream consistency checks.

Operational Notes
- Parse-time validation sequence is positioned as the gateway before committing data to the evidence database.

Open Questions
- MVP boundary definition is not explicitly stated.
- Full `profile_id` enum values are not explicitly provided in the included schema snippet.
- Mathematical formula expressions in the verification section are image-based; complete textual formulas are not explicitly stated.
- Global tolerance policy beyond two-decimal rounding is not explicitly stated.
