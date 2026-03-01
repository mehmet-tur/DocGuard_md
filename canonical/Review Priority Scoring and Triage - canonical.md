✅ 03 — Canonical Output — Review Priority Scoring and Triage.md

Module Metadata
- Module Name: Review Priority Scoring and Triage Framework for UBL-TR Document Consistency
- Source File ID: Review Priority Scoring and Triage.md
- Version: Not explicitly stated: module version.

Purpose
- Define a deterministic Review Priority Scoring (RPS) and triage framework for UBL-TR document consistency evaluation.
- Compare weighted additive and saturating/capped scoring architectures for queue stability.
- Define Hard (H), Context (C), and Graph (G) rule families and trigger logic.
- Define strict Evidence Pack schema constraints for machine-verifiable auditability.
- Define triage queue bands, SLAs, calibration, drift handling, and deterministic exception behavior.

MVP Scope
- MVP Boundary Principle:
  - Category-weighted saturating scoring with category caps to prevent noise-driven score inflation and preserve signal prioritization.
- Ingestion Scope:
  - Canonical UBL-TR consistency signals from Hard, Context, and Graph rule families.
  - Evidence Pack payloads used by AI agents and human auditors.
- MVP Extraction Boundaries (Explicitly Mapped Fields):

| Category | Document | Extracted Fields (as stated) |
|---|---|---|
| Hard checks | Canonical fields | `metadata.ubl_version`, `metadata.customization_id`, `totals.line_extension`, `lines.net_amount`, `tax.total_tax_amount`, `tax.subtotals.tax_amount`, `totals.payable_amount`, `references.despatch_id`, `references.despatch_date`, `document.issue_date`, `supplier.vkn`, `supplier.tckn`, `payment.iban`, `metadata.uuid`, `lines.item_name`, `document.id`, `document.currency_code`, `tax.subtotals.scheme_id`, `lines.unit_code`, `lines.quantity` |
| Context checks | Canonical fields | `lines.line_id`, `document.currency_code`, `payment.iban`, `totals.allowance_total`, `totals.line_extension`, `supplier.vkn`, `supplier.tckn`, `customer.vkn`, `references.despatch_date`, `document.issue_date`, `e_irsaliye.deliveredQuantity`, `lines.quantity` |
| Graph signals | Graph + evidence metrics | `unique_sellers_count`, `shared_iban`, `relationship_age`, `amount_variance`, `temporal_density`, `edge_count`, `path_sequence`, `net_volume_difference`, `levenshtein_score`, `path_depth`, `missing_despatch_markers`, `overlapping_vkn`, `field_location`, `net_balance`, `temporal_alignment` |
| Evidence Pack schema | Evidence Pack | `check_id`, `check_type`, `description`, `fields`, `metrics`, `paths`, `audit_trace` |

- MVP Validations (Computational Core):
  - Category-weighted saturating RPS calculation with category caps.
  - Hard rule consistency checks for non-negotiable structural/legal conditions.
  - Context signal validation for operational-risk anomalies routed to review.
  - Graph signal validation for network/topology anomalies.
  - Draft-07 Evidence Pack schema validation with strict no-extra-properties policy.
  - Drift monitoring and deterministic failure-handling logic in triage pipeline.

Actors & Core Entities
- Actors:

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
|---|---|---|
| Rule engine | Deterministic scoring actor | Executes H/C/G trigger logic and computes RPS contributions |
| Triage engine | Queue orchestration actor | Maps score bands to review queues and SLAs |
| Senior auditors / human reviewers | Human-in-the-loop actor | Review high and medium queues with finding decomposition |
| AI narrative layer | Explanation actor | Produces no-synonyms deterministic finding text tied to Evidence Pack |

- Core Entities:

| Entity | Definition (from source) | Primary Identifiers / Fields |
|---|---|---|
| Review Priority Score (RPS) | Category-weighted bounded score used for triage routing | H/C/G weighted contributions and category caps |
| Hard checks (H-series) | Non-negotiable structural/legal consistency checks | `H001`–`H015` |
| Context checks (C-series) | Operational-risk signals requiring contextual review | `C001`–`C008` |
| Graph signals (G-series) | Relationship-centric anomaly signals | `G001`–`G008` |
| Evidence Pack | Strict Draft-07 output contract for each trigger | `check_id`, `check_type`, `fields`, `metrics`, `paths`, `audit_trace` |
| Finding Card | Auditor-facing summary artifact | `check_id`, selected fields, `audit_trace` narrative |

Workflows
- Score and Triage Workflow:

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Rule/signal evaluation | Rule engine | Canonical field inputs | Deterministic trigger consistency checks |
| 2 | Bounded scoring | Rule engine | Category contributions | Saturating cap validation |
| 3 | Evidence generation | Rule engine | Evidence Pack | Schema-constrained evidence production |
| 4 | Queue assignment | Triage engine | Priority band mapping | SLA-consistent routing |
| 5 | Human review | Auditors | Finding Cards + decomposition panel | High-contribution discrepancy focus |
| 6 | Calibration and drift review | Calibration process | PSI analysis and threshold review inputs | Drift-handling validation |

Canonical Consistency Checks (MVP)
- Bounded Review Priority Score parameters (source-stated):

| Parameter | Value / Rule (as stated) |
|---|---|
| Hard cap | 70 |
| Context cap | 40 |
| Graph cap | 40 |
| Hard rule weight | 10 (per source recommendation section) |
| Context rule weight | 1 (per source recommendation section) |
| Graph rule weight | 5 (standardized bounded model contribution) |

- Hard Consistency Checks (H-Series):

| Rule ID | Name | Category | Trigger Condition (Metrics) | Canonical Fields Involved |
|---|---|---|---|---|
| H001 | UBL-TR Versiyon Uyuşmazlığı | Hard | `metadata.ubl_version != "2.1" OR metadata.customization_id != "TR1.2"` | `metadata.ubl_version`, `metadata.customization_id` |
| H002 | Kalem Tutarı Tutarlılığı | Hard | `abs(sum(lines.net_amount) - totals.line_extension) > 0.01` | `totals.line_extension`, `lines.net_amount` |
| H003 | Vergi Toplamı Tutarlılığı | Hard | `abs(sum(tax.subtotals.tax_amount) - tax.total_tax_amount) > 0.01` | `tax.total_tax_amount`, `tax.subtotals.tax_amount` |
| H004 | Ödenecek Tutar Tutarlılığı | Hard | `abs(totals.payable_amount - (totals.line_extension + totals.charge_total - totals.allowance_total + tax.total_tax_amount)) > 0.01` | `totals.payable_amount`, `totals.line_extension`, `totals.allowance_total`, `totals.charge_total`, `tax.total_tax_amount` |
| H005 | e-İrsaliye Referans Eksikliği | Hard | `references.despatch_id is empty or undefined` | `references.despatch_id` |
| H006 | İrsaliye Zaman Tutarsızlığı | Hard | `any(references.despatch_date[i] > document.issue_date)` | `references.despatch_date`, `document.issue_date` |
| H007 | Tedarikçi Kimlik Doğrulama | Hard | `(supplier.vkn exists and length != 10) OR (supplier.tckn exists and !mod10)` | `supplier.vkn`, `supplier.tckn` |
| H008 | IBAN Yapı Doğrulama | Hard | `payment.iban exists and mod97(payment.iban) != 1` | `payment.iban` |
| H009 | Çift Sunum Tespiti | Hard | `metadata.uuid exists more than once in the system` | `metadata.uuid` |
| H010 | Kalem Ürün Açıklama Eksikliği | Hard | `Any lines.item_name is empty or missing` | `lines.item_name` |
| H011 | Fatura Kimlik Formatı | Hard | `length(document.id) != 16 OR regex mismatch /^[A-Z0-9]{16}$/` | `document.id` |
| H012 | Tarih Formatı Hatası | Hard | `document.issue_date or despatch_date is not valid ISO-8601` | `document.issue_date`, `references.despatch_date` |
| H013 | KDV Kodu Uyumsuzluğu | Hard | `tax.subtotals.scheme_id not in registered VAT/SCT codes` | `tax.subtotals.scheme_id` |
| H014 | Döviz Kodu Formatı | Hard | `document.currency_code does not match ISO-4217 pattern` | `document.currency_code` |
| H015 | Miktar Kod Uyumsuzluğu | Hard | `unit_code == "C62" AND quantity % 1 != 0` | `lines.unit_code`, `lines.quantity` |

- Context-Aware Triage Signals (C-Series):

| Rule ID | Name | Category | Trigger Condition (Metrics) | Canonical Fields Involved |
|---|---|---|---|---|
| C001 | Kalem Sayısı Aykırılığı | Context | `len(lines) > 20` | `lines.line_id` |
| C002 | Yabancı Para Kullanımı | Context | `document.currency_code != "TRY"` | `document.currency_code` |
| C003 | Yabancı IBAN | Context | `payment.iban exists AND prefix != "TR"` | `payment.iban` |
| C004 | Yüksek İskonto/Yükleme Oranı | Context | `(allowance_total / line_extension) > 0.5` | `totals.allowance_total`, `totals.line_extension` |
| C005 | Çifte Kimlik Kullanımı | Context | `Supplier has both VKN and TCKN, or has neither` | `supplier.vkn`, `supplier.tckn` |
| C006 | Aynı VKN/TCKN | Context | `supplier.vkn == customer.vkn` | `supplier.vkn`, `customer.vkn` |
| C007 | Hızlı Fatura-İrsaliye Zamanlaması | Context | `min(references.despatch_date) >= document.issue_date` | `references.despatch_date`, `document.issue_date` |
| C008 | Volumetrik Tutarsızlık | Context | `sum(e_irsaliye.deliveredQuantity) != sum(lines.quantity)` | `lines.quantity`, `e_irsaliye.deliveredQuantity` |

- Graph-Based Verification Signals (G-Series):

| Rule ID | Name | Category | Trigger Pattern (Metrics) | Evidence Metrics |
|---|---|---|---|---|
| G001 | Çapraz Satıcı IBAN Paylaşımı | Graph | Multiple distinct VKNs share a single IBAN node | `unique_sellers_count`, `shared_iban` |
| G002 | Yeni Bağlantı Yüksek Tutar | Graph | First-time edge with amount > 3x historical median | `relationship_age`, `amount_variance` |
| G003 | Yoğun Zaman Kümelenmesi | Graph | >N invoices between two nodes in <24-hour window | `temporal_density`, `edge_count` |
| G004 | Yönlü Döngüsel Faturalama | Graph | Closed path (A -> B -> C -> A) with minimal net transfer | `path_sequence`, `net_volume_difference` |
| G005 | Leksikal Kimlik Çakışması | Graph | High name similarity + different VKNs + shared IBAN | `levenshtein_score`, `shared_iban` |
| G006 | Yol Uzunluğu Aykırılığı | Graph | Invoice chain > 3 hops without intermediate waybills | `path_depth`, `missing_despatch_markers` |
| G007 | Kurumlar Arası VKN Çakışması | Graph | Supplier VKN appears in authorized contact metadata | `overlapping_vkn`, `field_location` |
| G008 | Karşılıklı Ticaret Dengesi | Graph | Symmetric invoicing (A->B, B->A) with near-zero net | `net_balance`, `temporal_alignment` |

Evidence Output Contract
- Output Artifacts (as stated):
  - Evidence Pack (Draft-07 schema-governed deterministic payload).
  - Finding Card rendering with `check_id`, relevant fields, and `audit_trace` for reviewer context.
- Evidence Pack schema summary (source-stated key fields):

| Field | Type/Format | Constraint (pattern/min/max) | Meaning (as stated) |
|---|---|---|---|
| `check_id` | string | pattern `^[HCG][0-9]{3}$` | Triggered rule/signal identifier |
| `check_type` | string | enum: `HARD`, `CONTEXT`, `GRAPH` | Classification of evaluation |
| `description` | string | none stated | Concise check summary |
| `fields` | object | `additionalProperties: true` | Values extracted from e-Fatura canonical paths |
| `metrics` | object | `additionalProperties: false`; includes numeric properties (`discrepancy_value`, `line_count`, `allowance_ratio`, `unique_vkn_count`) | Computed quantitative support metrics |
| `paths` | array[string] | JSON pointers to source UBL-TR nodes | Forensic traceability |
| `audit_trace` | array[string] | none stated | Sequential logic steps to finding |

- Evidence Pack required constraints (source-stated):
  - `required`: `check_id`, `check_type`, `fields`, `metrics`.
  - `additionalProperties: false`.

Operational Notes
- Triage Queue Thresholds & SLAs:

| Priority Band | Score Range | Review Queue | Target SLA | Escalation Path |
|---|---|---|---|---|
| High | 60 – 100 | Critical / Forensic | < 1 Hour | Immediate referral to Head of Risk or Legal |
| Medium | 25 – 59 | Standard Auditor | < 4 Hours | Level-2 Reviewer; required waybill verification |
| Low | 0 – 24 | Auto-Close / Audit Only | N/A | Logged for monthly Population Stability review |

- PSI drift thresholds (source-stated bands):

| PSI Band | Interpretation | Operational Response |
|---|---|---|
| `PSI < 0.1` | No significant shift | Model remains valid |
| `0.1 <= PSI < 0.25` | Moderate shift | Investigate feature-level shift contributors |
| `PSI >= 0.25` | Significant shift | Mandatory retraining of scoring weights and cap review |

- Deterministic failure handling (source-stated examples):
  - OCR confidence gating can mark H011 as deterministic failure and assign default high-risk contribution for that check.
  - Missing field tolerance records explicit “Field Missing” audit trace and continues remaining checks.
  - Graph timeout handling can mark G-signal as “Unevaluated” and add placeholder weight to preserve queue visibility.

Open Questions
- Not explicitly stated: module version value.
- Not explicitly stated: full textual equations for bounded score formula (equations in source are image-embedded).
- Not explicitly stated: exact numeric OCR confidence threshold for deterministic failure gating.
