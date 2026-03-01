✅ 03 — Canonical Output — SRE & Compliance Report Generation.md

Module Metadata
- Module Name: Monitoring & Observability Schema Report
- Source File ID: SRE & Compliance Report Generation.md
- Version:

Purpose
- Define observability architecture for deterministic validation of UBL-TR e-Fatura processing.
- Define canonicalization, telemetry, and security-boundary controls from ingestion to audit trace persistence.
- Define cryptographic audit-trail schema and integrity mechanisms (linear hash chain + Merkle + anchoring).
- Define H/C/G rule-family observability and Evidence Pack schema contracts.
- Define performance SLA, RPS prioritization model, alerting rules, and runbook automation actions.
- Define PII masking and tiered retention lifecycle aligned with KVKK, MASAK, BDDK, TTK, and VUK references in source text.

MVP Scope
- MVP Boundary Principle:
  - High-security deterministic auditability where each processing step is converted into mathematically and logically verifiable evidence.
- Ingestion Scope:
  - Raw UBL-TR 1.2 XML payload ingestion and DOM traversal.
  - Namespace resolution for `Invoice-2`, `cac`, `cbc`, `ext`, `sig`.
  - Canonical JSON mapping for direct rule-engine and telemetry consumption.
  - OpenTelemetry capture of Evidence Pack and rule-trigger events with disk-backed persistence.
- MVP Extraction Boundaries (Explicitly Mapped Fields):

| Category | Document | Extracted Fields (as stated) |
|---|---|---|
| Canonical Mapping | UBL-TR XML -> canonical JSON | `/Invoice/cac:LegalMonetaryTotal/cbc:PayableAmount -> totals.payable_amount` |
| Canonical Mapping | UBL-TR XML -> canonical JSON | `/Invoice/cbc:UUID -> document.uuid` |
| Canonical Mapping | UBL-TR XML -> canonical JSON | `/Invoice/cac:DespatchDocumentReference/cbc:ID -> references.despatch_id[]` |
| Hard Rule Inputs | Canonical JSON | `lines.net_amount`, `totals.line_extension`, `totals.payable_amount`, tax totals, `supplier.vkn`/`supplier.tckn`, `payment.iban`, `lines.item_name`, `references.despatch_id`, `references.despatch_date` |
| Context Rule Inputs | Canonical JSON | `len(lines)`, `totals.allowance_total / totals.line_extension`, `e_irsaliye.deliveredQuantity`, `lines.quantity`, currency code, IBAN country prefix, buyer/seller identity overlap inputs |
| Graph Rule Inputs | Graph store from canonical fields | VKN/TCKN nodes, IBAN nodes, `ISSUED_TO`, `PAID_VIA`, `SAME_CONTACT` edges, path depth and temporal-density inputs |
| Evidence Contract Inputs | Evidence Pack | `check_id`, `check_type`, `fields`, `metrics`, `paths`, `audit_trace` |
| Audit Trail Inputs | Cryptographic audit log | `entry_id`, `timestamp`, `sequence_number`, `prev_hash`, `doc_uuid`, `invoice_id`, `actor_identity`, `input_file_hash`, `evidence_pack`, `rps_data`, `audit_trace`, `signature` |

- MVP Validations (Computational Core):
  - XML parser and namespace security checks with XXE/DTD protections.
  - Hard rule validations (H001, H002, H003, H004, H005, H006, H007, H008, H010, H013).
  - Context rule validations (C001, C002, C003, C004, C005, C006, C008).
  - Graph signal validations (G001, G003, G004, G005, G006, G008).
  - Canonical payload and Evidence Pack schema validation (`additionalProperties: false` contracts).
  - Cryptographic audit-trail continuity validation (prev-hash chaining + Merkle inclusion/consistency evidence).
  - SLA validation for rule-engine p95 latency below 100 ms.

Out of Scope
- Direct code or model-weight updates to live production are architecturally forbidden.
- Weighted Additive RPS model is explicitly not used; saturating/capped model is used instead.

Actors & Core Entities
- Actors:

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
|---|---|---|
| Ingestion Layer | Parsing actor | XML ingest, DOM traversal, canonical field extraction |
| OpenTelemetry Collector | Telemetry actor | Collects rule triggers and Evidence Pack events |
| Persistent Queue Layer | Durability actor | Disk-backed event buffering during network partitions/restarts |
| Sidecar Telemetry Layer | Isolation actor | Continuous telemetry without interfering with core engine performance |
| Rule Engine | Validation actor | Executes H/C checks and emits deterministic outputs |
| Graph Engine | Relationship actor | Computes graph topology signals (G-series) |
| LLM Narration Engine | Narration actor | Deterministic narrative generation under no-synonyms constraints |
| SOC / Manual Review | Human-in-the-loop actor | Reviews queue prioritized by RPS |
| Operations Teams | Release governance actor | Shadow deployment, rollback, threshold tuning |
| HSM / Key Custody Controls | Cryptographic control actor | Signature operations, key rotation, root-anchor handling |

- Core Entities (Canonical):

| Entity | Definition (from input) | Primary Identifiers / Fields |
|---|---|---|
| Canonical Data Model | Flattened JSON model from UBL-TR XML | `totals.payable_amount`, `document.uuid`, `references.despatch_id[]`, other canonical fields |
| Evidence Pack | Deterministic rule/signal output payload | `check_id`, `check_type`, `fields`, `metrics`, `paths`, `audit_trace` |
| Cryptographic Audit Log Entry | Append-only immutable audit record | `entry_id`, `prev_hash`, `doc_uuid`, `invoice_id`, `signature`, etc. |
| RPS Score Record | Review-priority data object | `score`, `hard_weight`, `context_weight`, `graph_weight` |
| Signed Tree Head (STH) | Periodic Merkle-root anchor artifact | Outbound anchor for truncation-resilient verification |

Workflows
- Workflow A: Ingestion, Canonicalization, and Telemetry Capture

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | XML ingestion and namespace resolution | Ingestion Layer | UBL-TR XML | Parser safety and namespace consistency checks |
| 2 | Canonical mapping | Ingestion Layer | Canonical JSON | Field-mapping integrity checks |
| 3 | Rule/signal execution | Rule Engine, Graph Engine | H/C/G outputs | Deterministic consistency check evidence |
| 4 | Evidence generation | Rule Engine | Evidence Pack | Draft-07 schema conformity and deterministic typing |
| 5 | Telemetry emission | OpenTelemetry Collector + Sidecar | Events/traces/metrics/logs | Lossless capture and non-blocking pipeline behavior |
| 6 | Durable buffering | Persistent Queue Layer | Buffered telemetry batches | Data-loss prevention during restart/partition conditions |

- Workflow B: Cryptographic Audit Trail Construction

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Entry construction | Audit pipeline | Audit log entry JSON | Required-field and pattern checks |
| 2 | Linear chaining | Audit pipeline | `prev_hash` linked record | Chain continuity consistency check |
| 3 | Merkle aggregation | Audit pipeline | Merkle tree nodes/roots | Inclusion/consistency proof support |
| 4 | External anchoring | Audit pipeline, WORM/HSM-linked storage | Signed Tree Head (STH) anchors | Truncation-attack resistance evidence |
| 5 | Canonicalization before persist | Audit pipeline | RFC 8785-normalized JSON | False tamper alarm prevention due to field order/whitespace |

- Workflow C: Alerting and Runbook Response

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Alert rule evaluation | Monitoring stack | PromQL/LogQL conditions | Threshold and time-window consistency checks |
| 2 | Alert trigger | Alerting stack | Alert events with severity/service | Correct routing to response path |
| 3 | Automated action execution | Runbook automation | Scenario step logs | Action-order and completion evidence |
| 4 | Shadow validation and release control | Ops teams | v0.1 vs v0.2 parallel outputs | Regression delta and fidelity checks before promotion |
| 5 | Rollback / key maintenance | Ops + HSM controls | Rollback records, key-rotation records, STH publication | Cryptographic and release-governance integrity evidence |

Canonical Consistency Checks (MVP)
- H/C/G Rule Family Observability:

| Check Group | Check Name | Inputs | Comparison / Validation | Evidence Output (what must be logged) |
|---|---|---|---|---|
| Hard | H001 Version/Customization | UBL version + customization values | `2.1` and `TR1.2` consistency check | Version mismatch evidence |
| Hard | H002 Line Amount Consistency | `sum(lines.net_amount)` vs `totals.line_extension` | `abs(sum - total) > 0` trigger logic | Numeric discrepancy evidence |
| Hard | H003 Tax Total Consistency | Tax component totals | Tax aggregation consistency check | Tax discrepancy evidence |
| Hard | H004 Payable Consistency | Total payable equation inputs | Final payable consistency check | Payable discrepancy evidence |
| Hard | H005/H006 Despatch Linkage | `references.despatch_id`, `references.despatch_date`, invoice date | Physical-logistics linkage and chronology checks | Linkage/timing discrepancy evidence |
| Hard | H007 Supplier Identity | VKN/TCKN values | Mod-10 identity validation | Identity discrepancy evidence |
| Hard | H008 IBAN Structure | `payment.iban` | Mod-97 validation | Routing discrepancy evidence |
| Hard | H010 Item Name Presence | `lines.item_name` | Non-empty value validation | Missing-content evidence |
| Hard | H013 Tax Scheme Registration | `scheme_id` | Membership check against listed tax categories | Tax-code discrepancy evidence |
| Context | C001 Item Count | `len(lines)` | Trigger when count > 20 | Context discrepancy evidence |
| Context | C004 Allowance Ratio | `totals.allowance_total / totals.line_extension` | Trigger when ratio > 0.5 | Ratio metric evidence |
| Context | C008 Volumetric Consistency | `e_irsaliye.deliveredQuantity` vs `lines.quantity` | Quantity consistency check | Volumetric discrepancy evidence |
| Context | C002 Foreign Currency | Currency field | Non-TRY context check | Currency signal evidence |
| Context | C003 Foreign IBAN | IBAN country prefix | Non-TR prefix check | Routing-context evidence |
| Context | C005/C006 Identity Overlap | Buyer/seller identity values | Same-identity overlap checks | Identity-overlap evidence |
| Graph | G001 Shared IBAN Hub | Seller nodes + IBAN node edges | Hub-and-spoke topology check | Shared-IBAN evidence |
| Graph | G004 Circular Billing | Directed invoice edges | Circular path detection | Cycle evidence |
| Graph | G008 Mutual Billing Symmetry | A↔B edge pairs | Symmetry detection | Symmetry evidence |
| Graph | G003 Temporal Density | Time-windowed invoice events | Burst-density check (e.g., high volume in short window) | Temporal-density evidence |
| Graph | G005 Lexical Identity Conflict | Name similarity + shared IBAN | Levenshtein-based lexical conflict check | Similarity and linkage evidence |
| Graph | G006 Path-Length Anomaly | Graph path depth and despatch markers | Trigger for `path depth > 3` without logistics markers | Path-depth discrepancy evidence |

- RPS Model Details (source-stated values):

| Parameter | Value / Rule (as stated) |
|---|---|
| Hard rule weight | 10 points per rule |
| Context rule weight | 1 point per rule |
| Hard cap | 70 |
| Context cap | 40 |
| Graph cap | 40 |
| Manual review threshold reference | RPS > 30 (queue high-priority routing reference) |
| Calibration modes | BTL (threshold tightening) and ATL (threshold relaxation) tests |

- Alert Catalog (PromQL/LogQL excerpts summarized):

| Alert Name | Trigger Condition | Severity | Action Hint (as stated) |
|---|---|---|---|
| RuleEngine_p95_Latency_SLA_Exceeded | p95 rule-engine latency > 100 ms for 3m | critical | Check computational exhaustion risks and path-depth load (G006 context) |
| RPS_ManualReviewQueue_Exhaustion | Median `rps_score_distribution` over 15m > 30 for 10m | high | Initiate emergency ATL recalibration to reduce queue pressure |
| RuleTriggerVelocity_Anomaly_C002 | C002 trigger velocity deviates > 2 standard deviations from 7-day baseline for 15m | warning | Investigate covariate drift vs normalization/parser discrepancy |
| GraphTraversal_PathDepth_Exceeded | `graph_traversal_depth_max{rule_family="G006"} > 3` for 1m | high | Investigate circular-chain intensity and computational bound pressure |

Neutral Language Mapping (Normalization Rule)
- No-Synonyms Narration Policy (explicit source examples):
  - Use `payment.iban` instead of generic “satıcının banka hesabı”.
  - Use `supplier.vkn` instead of generic “vergi numarası”.
  - Use `totals.allowance_total / totals.line_extension` instead of paraphrased wording.
  - Keep KDV, TCKN, VKN verbatim.
  - Bind narration to exact schema identifiers for deterministic and verifiable evidence language.

Evidence Output Contract
- Output Artifacts (as stated):
  - Evidence Pack (Draft-07 strict executable data contract).
  - Cryptographic Audit Log Entry (append-only immutable log schema).
- JSON Payload — Canonical Field Set (Cryptographic Audit Log):

| Field | Type/Format | Constraint (pattern/min/max) | Meaning (as stated) |
|---|---|---|---|
| `entry_id` | string / uuid | format `uuid` | Global trace identifier |
| `timestamp` | string / date-time | ISO-8601 UTC | Temporal ordering |
| `sequence_number` | integer | minimum `0` | Monotonic counter for missing/reordered entry detection |
| `prev_hash` | string | hex-64 pattern | Prior-entry SHA-256 chain link |
| `doc_uuid` | string / uuid | format `uuid` | Link to source UBL-TR document UUID |
| `invoice_id` | string | `maxLength:16`, alphanumeric 16-char pattern | Regulatory invoice identifier |
| `actor_identity` | string | none specified | SPIFFE-compliant workload identity reference |
| `input_file_hash` | string | hex-64 pattern | SHA-256 source-file digest |
| `evidence_pack` | object | none specified | Nested deterministic findings payload |
| `rps_data.score` | number | required within `rps_data` | Final calculated RPS value |
| `rps_data.hard_weight` | number | none specified | Hard component contribution |
| `rps_data.context_weight` | number | none specified | Context component contribution |
| `rps_data.graph_weight` | number | none specified | Graph component contribution |
| `audit_trace` | array[string] | none specified | Deterministic logic-step narrative list |
| `signature` | string | none specified | Ed25519 signature reference |

- Audit Log Schema Constraints (explicit):
  - `required`: `entry_id`, `timestamp`, `sequence_number`, `prev_hash`, `doc_uuid`, `invoice_id`, `actor_identity`, `input_file_hash`, `evidence_pack`, `signature`.
  - `additionalProperties: false`.

- JSON Payload — Canonical Field Set (Evidence Pack):

| Field | Type/Format | Constraint (pattern/min/max) | Meaning (as stated) |
|---|---|---|---|
| `check_id` | string | pattern `^[HCG]?[0-9]{3}$` | Deterministic triggered rule/signal ID |
| `check_type` | string | enum declared (values not shown in source snippet) | Routing classification in triage architecture |
| `description` | string | none specified | Concise summary of executed check |
| `fields` | object | `additionalProperties: true` | Exact canonical fields that triggered anomaly |
| `metrics` | object | `additionalProperties: true` | Computed numeric metrics |
| `paths` | array[string] | item pattern `^/.*` | JSON Pointer traceability paths |
| `audit_trace` | array[string] | none specified | Sequential logic steps under no-synonyms policy |

- Evidence Pack Schema Constraints (explicit):
  - `required`: `check_id`, `check_type`, `fields`, `metrics`, `paths`.
  - `additionalProperties: false`.

Implementation Notes (storage-neutral)
- OpenTelemetry collector is integrated with a persistent disk-backed queue to reduce data-loss risk during partition/restart conditions.
- Sidecar pattern is used to keep continuous telemetry flow without direct interference with core rule-engine performance.
- SPIFFE SVID identity model is used so only cryptographically authorized workloads produce telemetry/log outputs.
- RFC 8785 canonicalization is applied before persistent write to prevent whitespace/order-driven hash mismatch alerts.
- Cryptographic trail combines linear `prev_hash` chaining, Merkle aggregation, periodic STH anchoring, and WORM storage references.
- Append-only schema governance is stated: no field deletion and no existing field type changes.

Operational Notes
- SLA target: p95 rule execution latency must remain below 100 ms.
- Shadow deployment process compares active engine and candidate engine outputs; any deterministic mismatch is logged as Regression Delta.
- LLM fidelity controls include temperature `0.0` and Exact Match baseline ratio `1.0`; rollout is canceled and rolled back when confidence-interval violation conditions are met.
- Multi-signature governance is required for production promotion approvals.
- HSM operational controls include 90-day key rotation and controlled access via FIDO2 MFA-based ephemeral tokens.
- Runbook Automation Scenarios:

| Scenario | Trigger Alert | Condition | Actions (Step 1..n) (as stated) |
|---|---|---|---|
| Latency SLA Violation Mitigation | `RuleEngine_p95_Latency_SLA_Exceeded` | p95 execution latency > 100 ms sustained for 3m | (1) Horizontal scaling for DOM/graph pipeline, (2) graceful degradation with asynchronous LLM narration and deterministic rule-engine prioritization |
| Queue Overflow and Manual Triage Backpressure Handling | `RPS_ManualReviewQueue_Exhaustion` | Queue depth critical or median RPS > 30 | (1) API-gateway rate limiting for low-priority payloads, (2) traffic shaping + emergency ATL recalibration (example: C001 item limit 20->30) |
| LLM Narrative Fidelity Degradation (Hallucination Prevention) | `LLM_ExactMatch_Confidence_Interval_Violation` | Exact Match ratio drops > 2% from baseline 1.0 during shadow tests | (1) Roll back to last stable prompt/model version, (2) isolate discrepant Evidence Packs/narratives for urgent XAI investigation |
| Cryptographic Root Anchor and Key Maintenance | `Scheduled_HSM_Key_Rotation` | 90-day lifespan of Ed25519 Merkle signing key expires | (1) Generate new keypair inside FIPS 140-3 Level 3 HSM boundary, (2) publish outgoing-key final STH to WORM-enabled cold archive |

- PII Tiered Retention Lifecycle:

| Tier | Purpose | Retention (years) | Protection (masking/pseudonymization/HSM) (as stated) |
|---|---|---|---|
| Hot (Sıcak / Operasyonel) | Active invoice/payment operational processing phase | Active commercial phase duration | Dynamic Data Masking in production systems |
| Warm (Ilık / Denetim) | Audit working papers and tax-document retention after operational deletion | Minimum 5 years | Operational-system deletion after completion; retained for audit/regulatory needs |
| Cold (Soğuk / Derin Arşiv) – MASAK scope | Customer identity and transaction logs | 8 years | WORM isolation; aggressive pseudonymization or ciphertext; HSM key custody; RBAC-governed reverse access for authorized legal/compliance use |
| Cold (Soğuk / Derin Arşiv) – TTK scope | Core accounting/share-register records | 10 years | WORM isolation; aggressive pseudonymization or ciphertext; HSM key custody; RBAC-governed reverse access for authorized legal/compliance use |

Open Questions
- Not explicitly stated: module version identifier.
- Not explicitly stated: exact enum values for Evidence Pack `check_type` (enum declared but values omitted in source snippet).
- Not explicitly stated: complete field list for the `pii_redaction_and_retention_pipeline` example (`target_fields` section is truncated).
- Not explicitly stated: numeric retention period for Hot tier.
