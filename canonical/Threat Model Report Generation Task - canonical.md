✅ 03 — Canonical Output — Threat Model Report Generation Task.md

Module Metadata
- Module Name: Threat Model Report
- Source File ID: Threat Model Report Generation Task.md
- Version:

Purpose
- Model the e-Fatura canonical processing lifecycle from ingestion through narration and audit trace production.
- Define trusted processing components and the abuse-case exposure surface of each component.
- Define trust boundaries and boundary transition controls across Regulatory, Commercial, and Financial zones.
- Define deterministic Hard/Context checks and graph signals used for consistency check and discrepancy detection.
- Define Evidence Pack generation and deterministic narration constraints for human audit review.
- Define priority handling using the Priority (P1–P4) catalog and Review Priority Scoring (RPS) references.

MVP Scope
- MVP Boundary Principle:
  - Document lifecycle is analyzed from external ingestion to final narrated finding for human auditors, with abuse-case mapping across trust boundaries.
- Ingestion Scope:
  - Inbound UBL-TR XML (e-Fatura) enters through Regulatory Boundary controls.
  - XML is resolved and traversed in internal processing components before normalization to canonical JSON.
  - Rule/signal findings are emitted as Evidence Pack outputs and narrated under deterministic constraints.
- MVP Extraction Boundaries (Explicitly Mapped Fields):

| Category | Document | Extracted Fields (as stated) |
|---|---|---|
| Canonical Financial Core | UBL-TR canonical JSON | `totals.payable_amount`, `totals.line_extension`, tax totals, allowance/charge values |
| Canonical Identity | UBL-TR canonical JSON | `supplier.vkn`, `supplier.tckn`, party identifiers |
| Canonical Routing | UBL-TR canonical JSON | `payment.iban` |
| Canonical Logistics Link | UBL-TR canonical JSON | `references.despatch_id`, `references.despatch_date` |
| Canonical UUID Linkage | UBL-TR canonical JSON | `metadata.uuid` |
| Narration Input Surface | Canonical JSON | `lines.item_name` and description fields |
| Evidence Pack Core | Evidence Pack JSON | `check_id`, `fields`, `metrics`, `paths`, `audit_trace` |

- MVP Validations (Computational Core):
  - Hard checks: version/customization validation, mathematical consistency checks, identity checks, routing checks, logistics linkage checks.
  - Context checks: item-count, allowance ratio, timing and volumetric discrepancy checks, cross-border signal checks, identity-overlap checks.
  - Graph signals: shared IBAN hubs, circular/symmetric topology checks, temporal density, lexical identity conflict, path-length anomaly.
  - Boundary controls: parser hardening, DTD/entity blocking, schema enforcement, cryptographic audit-trace integrity controls.

Actors & Core Entities
- Actors:

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
|---|---|---|
| GİB | Regulatory boundary owner | Provides legally binding signed UBL-TR document flow |
| Supplier / Buyer | Commercial boundary actors | Generate and receive trade documents linked by e-İrsaliye and e-Fatura references |
| Bank / Factor | Financial boundary owner | Runs canonical processing, validation, triage, and audit workflows |
| Engineering teams | Technical control actor | Implement component hardening and control sets |
| Compliance teams | Governance actor | Align controls and review evidence outputs |
| Human auditors / senior auditors | Human-in-the-loop actor | Review Evidence Card outputs and manual queue findings |

- Core Entities (Canonical):

| Entity | Definition (from input) | Primary Identifiers / Fields |
|---|---|---|
| Abuse Case | Specific scenario where intended behavior is overridden or integrity is compromised | `AC-01` … `AC-14` |
| Control Set | Technical/procedural package to neutralize an abuse case | Abuse-case-specific controls |
| Priority | Hierarchical urgency class | `P1`–`P4` |
| Evidence Pack | Structured machine-verifiable finding object | `check_id`, `fields`, `metrics`, `paths`, `audit_trace` |
| Evidence Card | Auditor-facing review artifact | `check_id`, discrepancy summary, canonical field values, `audit_trace` |

- Component Taxonomy:

| Component | Role | Boundary Placement |
|---|---|---|
| Namespace Resolver | Resolves required UBL-TR namespaces and prevents silent data omission | Financial Institution processing core |
| DOM Traversal Engine | Executes rigid XPath navigation over hierarchical XML | Financial Institution processing core |
| Normalization Layer (Canonical Mapper) | Flattens nested XML nodes into typed canonical JSON | Financial Institution processing core |
| Deterministic Rule Engine | Executes Hard and Context controls for consistency check outputs | Financial Institution processing core |
| Graph Relationship Builder | Builds node-edge relations and emits graph discrepancy signals | Financial Institution processing core |
| LLM Narration Engine | Produces human-readable finding text under deterministic constraints | Financial Institution processing core |
| Evidence Pack Generator | Produces structured audit trace payloads | Financial Institution processing core |

Workflows
- Trust Boundaries:

| Boundary | Description | Key Risks/Controls (as stated) |
|---|---|---|
| Regulatory Boundary | GİB-owned zone where UBL-TR 1.2 XML and Mali Mühür constraints apply | Mali Mühür verification and schema-conformance controls at ingestion |
| Commercial Boundary | Supplier/Buyer zone where e-İrsaliye anchors trade activity | e-İrsaliye reference matching and chronology linkage controls |
| Financial Boundary | Bank/Factor processing zone where XML is transformed and validated | Canonical JSON schema enforcement and deterministic rule/signal evaluation |

- Boundary Transition Mapping:

| Transition ID | Source | Destination | Required Internal Validation Focus |
|---|---|---|---|
| TR-01 | GİB Portal | Ingestion Gateway | Mali Mühür (XMLDSig) verification, QR validation, UBL-TR 1.2 schema check |
| TR-02 | Ingestion Gateway | DOM Traversal Engine | XXE disabling, DTD rejection, maximum document-size enforcement |
| TR-03 | DOM Engine | Normalization Layer | Strict XPath mapping to canonical JSON; remove XSLT/embedded scripts |
| TR-04 | Canonical JSON | Deterministic Rule Engine | RPS formula application references; category caps (70/40/40); Hard/Context rule execution |
| TR-05 | Evidence Pack | LLM Narration Engine | PII redaction, No-Synonyms policy enforcement, Spotlighting of untrusted fields |
| TR-06 | Narrated Finding | Audit Trail | Cryptographic hash chaining, RFC 6962-style inclusion proof references, UUIDv7 timestamping |

- Processing Sequence:

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Ingestion and namespace resolution | Namespace Resolver | UBL-TR XML | Namespace visibility and structural integrity checks |
| 2 | XML traversal and extraction | DOM Traversal Engine | XPath-selected canonical inputs | Parser safety and deterministic extraction checks |
| 3 | Canonicalization | Normalization Layer | Canonical JSON | Type and field-shape consistency checks |
| 4 | Deterministic evaluation | Rule Engine | H/C check outputs | Mathematical and structural validation evidence |
| 5 | Graph evaluation | Graph Builder | G-series signal outputs | Topology and relationship discrepancy evidence |
| 6 | Evidence synthesis | Evidence Pack Generator | Evidence Pack | Deterministic evidence payload consistency |
| 7 | Narration and review | LLM Narration Engine, auditors | Evidence Card / narrated finding | No-Synonyms deterministic narration and human review controls |

Canonical Consistency Checks (MVP)
- Hard / Context / Graph Control Catalog:

| Check Group | Check Name | Inputs | Comparison / Validation | Evidence Output (what must be logged) |
|---|---|---|---|---|
| Hard | H001 UBL-TR Version Mismatch | Version/customization fields | Version and customization consistency check | Version/customization discrepancy evidence |
| Hard | H002 Line Extension Amount Consistency | `lines.net_amount`, `totals.line_extension` | Sum-to-total consistency check | Absolute difference evidence |
| Hard | H003 Tax Total Consistency | Tax subtotal/total fields | Tax aggregation consistency check | Tax discrepancy evidence |
| Hard | H004 Payable Amount Consistency | Line extension, charges, allowances, taxes, payable | Final payable consistency check | Payable discrepancy evidence |
| Hard | H007 Supplier Authentication | `supplier.vkn` / `supplier.tckn` | VKN format and TCKN Mod-10 validation | Identity validation evidence |
| Hard | Checksum Enforcement (IBAN) | `payment.iban` | Mod-97 structure validation as hard-check control in checklist | Routing discrepancy evidence |
| Hard | H005 Logistics Anchor | `references.despatch_id` | Link financial claim to physical delivery advice | Linkage discrepancy evidence |
| Context | C001 Abnormal Item Count | `len(lines)` | Trigger when line count exceeds 20 | Context discrepancy evidence |
| Context | C004 High Discount/Charge Ratio | `totals.allowance_total`, `totals.line_extension` | Trigger when ratio exceeds 50% | Ratio metric evidence |
| Context | C007 Rapid Invoice-Despatch Timing | Invoice and despatch dates | Same-day timing risk signal | Timing discrepancy evidence |
| Context | C008 Volumetric Inconsistency | Delivered vs invoiced quantity | Cross-document quantity consistency check | Quantity discrepancy evidence |
| Graph | G001 Shared IBAN Hub | VKN/TCKN nodes, IBAN nodes | Multi-seller to single-IBAN topology check | Hub evidence |
| Graph | G004 Directed Circular Path | Invoice edge topology | Closed-loop cycle detection | Cycle evidence |
| Graph | G008 Mutual Billing Symmetry | Bi-directional invoice edges | Symmetric trade topology check | Symmetry evidence |
| Graph | G003 Temporal Density | Time-distributed invoice generation | High-density burst detection | Temporal density evidence |
| Graph | G005 Lexical Identity Conflict | Name similarity + shared identifiers | Lexical conflict consistency check | Similarity evidence |
| Graph | G006 Path Length Anomaly | Path depth with logistics markers | Detect ownership-hop chains without corresponding logistics markers; source notes real-time depth limit context (typically 5 hops) and bypass risk beyond that | Path-depth discrepancy evidence |

- Abuse Case Catalog:

| Abuse Case ID | Taxonomy Component | Abuse Case Description | Priority |
|---|---|---|---|
| AC-01 | DOM Traversal Engine | XML external-entity payloads embedded in malformed UBL-TR DTD structures to extract local or internal resources | P1 |
| AC-02 | LLM Narration Engine | Indirect prompt content embedded in untrusted canonical fields (`lines.item_name`) to alter narration behavior | P1 |
| AC-03 | Evidence Generator | PII exposure risk in audit traces where VKN/TCKN/IBAN values are not sufficiently protected for downstream access contexts | P1 |
| AC-04 | DOM Traversal Engine | Recursive entity expansion payload causing parser memory exhaustion (Billion Laughs DoS) | P2 |
| AC-05 | Evidence Generator | Cryptographic hash-chain discontinuity enabling silent deletion/modification attempts in high-priority records | P2 |
| AC-06 | Normalization Layer | UBL/customization metadata spoofing attempting to bypass version compliance checks | P2 |
| AC-07 | Graph Builder | Entity fragmentation via lexical name variation masking graph linkage | P3 |
| AC-08 | Namespace Resolver | Namespace-collision shadowing of legitimate financial fields | P3 |
| AC-09 | Rule Engine | Manipulation of total-consistency inputs to hide surcharge-like discrepancies | P2 |
| AC-10 | Normalization Layer | Duplicate UUID resubmission bypass attempt | P3 |
| AC-11 | DOM Traversal Engine | Malformed PDF logic payload in hybrid processing path affecting OCR/IDP pipeline | P2 |
| AC-12 | DOM Traversal Engine | SSRF via external DTD references probing cloud metadata endpoints | P1 |
| AC-13 | LLM Narration Engine | System-prompt leakage attempt through crafted evidence content | P3 |
| AC-14 | Rule Engine | Sequential threshold probing to infer rule-scoring behavior | P4 |

- Detailed Control Sets (Expanded in source):
  - AC-01 Control Set:
    - Disable DTDs and external entity resolution in XML parsing libraries.
    - Apply minimal XML hardening rules: disable external DTD loading, parameter entities, and XInclude.
    - Run SAST checks for parser configuration weaknesses before deployment.
    - Reject XML inputs containing `ENTITY` or `SYSTEM` keywords through server-side input validation.
  - AC-02 Control Set:
    - Apply Spotlighting to separate untrusted external content from system prompt context.
    - Enforce No-Synonyms Narration Policy with fixed vocabulary constraints.
    - Apply staged injection detection: regex pattern matching, ML semantic classifiers, LLM intent analysis.
    - Require human-in-the-loop review for high-risk operations triggered by LLM-generated narrative outputs.
  - AC-03 Control Set:
    - Deploy gateway-level PII redaction processor in telemetry and narration pipeline.
    - Use synthetic data swapping for format-preserving replacements of VKN/TCKN values.
    - Centralize re-identification behind secure vault access with auditable reason codes.
    - Execute adversarial leak tests to validate resistance against reconstruction from context.
  - AC-04 Control Set:
    - Enable secure XML processing mode to restrict entity expansion and recursion.
    - Enforce strict XML size/complexity limits prior to core processing.
    - Use streaming parsing approaches where possible to reduce memory amplification effects.
  - AC-05 Control Set:
    - Use hash-based integrity chaining (each entry includes prior entry SHA-256 hash).
    - Anchor root hash externally (immutable ledger or HSM-bound anchoring references).
    - Store logs on WORM or remote-logging channels for tamper-resilient retention.

Neutral Language Mapping (Normalization Rule)
- Standard Legacy Term Mapping:

| Standard Legacy Term | Reporting Standard Term | Definition in the e-Fatura Ecosystem |
|---|---|---|
| Threat | Abuse Case | Specific technical/logical scenario overriding intended behavior or compromising integrity |
| Recommended Control | Control Set | Package of safeguards and procedural constraints for neutralization |
| Risk Rating | Priority | P1–P4 urgency classification |
| Mitigation | Control Set | Architectural/programmatic adjustment reducing residual risk |

- No-Synonyms Narration Policy (explicit source rules):
  - Use exact field names and values from canonical JSON / Evidence Pack.
  - Use `IBAN` instead of generic bank-account wording.
  - Use `VKN` instead of generic tax-ID wording.
  - Keep generation fully factual and consistent with evidence payload data only.

Evidence Output Contract
- Output Artifacts (as stated):
  - Evidence Pack (structured JSON) for every triggered rule or signal.
  - Evidence Card for senior auditor review queue.
- JSON Payload — Canonical Field Set:

| Field Group | Included Fields (Minimum) | Notes / Constraints (from input) |
|---|---|---|
| Trigger Identity | `check_id` | Deterministic identifier of triggered rule/signal |
| Canonical Values | `fields` | Canonical field values used in evaluation |
| Computed Evidence | `metrics` | Computed discrepancy metrics |
| Forensic Pointers | `paths` | JSON pointers to source nodes/fields |
| Review Narrative Trace | `audit_trace` | Deterministic logic-step narration aligned with no-synonyms policy |

Implementation Notes (storage-neutral)
- XML hardening controls include DTD/entity disabling, parser hardening, and schema-conformance checks.
- Graph integrity controls include lexical normalization, bridge-key isolation, and periodic deep scans for long-range cycles.
- Audit integrity controls include cryptographic chaining, external anchoring, and append-like immutable retention patterns.
- Security checklist controls cover component hardening, rule logic, narration governance, and forensic logging safeguards.

Operational Notes
- Context checks route to human review rather than automatic rejection.
- Review safeguards include auditing human overrides for high-priority findings and dual-review for manually cleared Hard-failure cases.
- RPS references include category caps (70/40/40) and maximum score reference (150) in the source description.
- Future-facing notes include February 2026 technical update readiness and post-quantum cryptography migration planning references.

Open Questions
- Not explicitly stated: module version identifier.
- Not explicitly stated: full textual rendering of RPS formula (formula is image-embedded).
- Not explicitly stated: complete Draft-07 Evidence Pack schema field constraints in a single consolidated schema block.
- Not explicitly stated: a single centralized threshold table for all H/C/G checks.
