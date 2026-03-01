# DocGuard Canonical Specification

This file is the single canonical manifest for the repository.  
The goal is reconstructability: if all file contracts below are respected, the project can be re-established end-to-end.

## 1) Canonical Authoring Rules (Mandatory)

1. Use exact field names from canonical JSON. Do not rename fields.
2. Use deterministic language for findings and outputs.
3. Use no synonyms for regulated terms and acronyms. Keep `VKN`, `TCKN`, `IBAN`, `KDV`, `UBL-TR` verbatim.
4. For structured outputs, enforce strict schema and explicit types.
5. Prefer `additionalProperties: false` for top-level contracts.
6. Keep rule IDs stable (`Hxxx`, `Cxxx`, `Gxxx`).
7. Keep canonical JSON pointer paths stable (for evidence and audit).
8. Keep threshold logic deterministic (same input -> same trigger result).
9. Keep compliance terms aligned with KVKK, BDDK, MASAK, TTK, VUK narratives in source documents.
10. If documents conflict, resolve by precedence in Section 2.

## 2) Source-of-Truth Precedence (Conflict Resolution)

1. `cannonical.md` (this file): global contract, naming, reconstruction scope.
2. `UBL-TR Invoice Canonical Schema Report.md`: XPath -> canonical field mapping and normalization logic.
3. `Review Priority Scoring and Triage.md`: RPS and triage mathematics.
4. `Graph Signals for Invoice Consistency.md`: graph model, graph signals, graph storage model.
5. `BelgeKalkanı API Endpoint Design.md`: service interface contract.
6. `Database Schema & ERD Report.md`: persistence schema and table relationships.
7. `Threat Model Report Generation Task.md`: trust boundaries and abuse-case controls.
8. `LLM Deployment & Safety ADR.md`: production ADR for narrator-only LLM policy.
9. `llm-deep-research-report-3.md`: extended ADR deep-dive and implementation details.
10. `SRE & Compliance Report Generation.md` and `Runbook Oluşturma Talimatları.md`: observability and operations.
11. Business and domain files: strategy and workflow context.
12. `docguard-ui/*`: UI prototype contract.
13. PDF files: publication artifacts derived from markdown sources.

## 3) Core Canonical Data Contract (Project Minimum)

### 3.1 Required canonical JSON namespaces
- `metadata.*`
- `document.*`
- `supplier.*`
- `customer.*`
- `payment.*`
- `references.*`
- `tax.*`
- `totals.*`
- `lines[]`

### 3.2 Required high-signal fields
- `metadata.ubl_version`
- `metadata.customization_id`
- `metadata.uuid`
- `document.invoice_id`
- `document.issue_date`
- `document.currency_code`
- `supplier.vkn`
- `supplier.tckn`
- `customer.vkn`
- `payment.iban`
- `tax.total_tax_amount`
- `totals.line_extension`
- `totals.payable_amount`
- `lines[].net_amount`
- `lines[].quantity`
- `lines[].unit_code`
- `lines[].item_name`

### 3.3 Required rule-trigger anchors
- `H002`: `abs(sum(lines[].net_amount) - totals.line_extension) > tolerance`
- `H007`: supplier ID format/checksum violations for `supplier.vkn` / `supplier.tckn`
- `C001`: `len(lines) > threshold`
- `C004`: `(totals.allowance_total / totals.line_extension) > threshold`
- `G001`: one `payment.iban` linked to multiple distinct seller IDs

### 3.4 Required Evidence Pack shape
- `check_id` (string)
- `check_type` (`HARD` | `CONTEXT` | `GRAPH`)
- `fields` (object, canonical field-value map)
- `metrics` (object, numeric computations)
- `paths` (array of JSON pointer strings)
- `audit_trace` (array, deterministic trace text)

## 4) File-by-File Canonical Contracts

### 4.1 `README.md`
- Canonical purpose: repository landing identifier.
- Required content: project name (`DocGuard_md`) and pointer to `cannonical.md` in future revisions.
- Depends on: none.
- Reconstruction rule: never contradict contracts in this manifest.

### 4.2 `cannonical.md`
- Canonical purpose: global data, rule, and file contracts.
- Required content:
- deterministic naming rules
- no-synonyms policy
- evidence pack shape
- per-file contracts (this section)
- Depends on: all authoritative markdown design docs.
- Reconstruction rule: update first when model, schema, rule, or file-role changes.

### 4.3 `UBL-TR Invoice Canonical Schema Report.md`
- Canonical purpose: definitive extraction and normalization dictionary.
- Required content:
- namespace resolution mechanics
- exhaustive XPath mapping table to canonical fields
- canonical JSON schema architecture
- deterministic normalization rules
- monetary verification protocol
- Depends on: UBL-TR 1.2 structure and Turkish e-Fatura constraints.
- Reconstruction rule: parser implementation must be generated from this mapping and type constraints.

### 4.4 `Graph Signals for Invoice Consistency.md`
- Canonical purpose: graph model for cross-document consistency and fraud signals.
- Required content:
- node definitions (entity, invoice, IBAN, reference objects)
- edge topology (e.g., ISSUED_TO, PAID_VIA)
- MVP graph signal catalog (`G`-series)
- graph storage design
- Depends on: canonical fields from UBL schema report.
- Reconstruction rule: graph DB schema and graph evaluators must use the exact node/edge semantics.

### 4.5 `Review Priority Scoring and Triage.md`
- Canonical purpose: bounded risk scoring and queue prioritization.
- Required content:
- weighted/saturating RPS model
- caps and category aggregation logic
- H/C/G contribution strategy
- triage thresholds and queue policy
- Depends on: rule packs and graph signal outputs.
- Reconstruction rule: queue assignment logic must reproduce RPS behavior exactly.

### 4.6 `BelgeKalkanı API Endpoint Design.md`
- Canonical purpose: API interface contract for ingest, analyze, narrate, and audit operations.
- Required content:
- base URL and auth model (`JWT`, `X-API-Key`, internal SPIFFE identity)
- request/response contracts for `/api/v1/analyze`
- narration endpoint contract
- deterministic evidence output contract
- Depends on: canonical field schema, rule engine, masking policy.
- Reconstruction rule: OpenAPI/FastAPI routes must map 1:1 to documented payload behavior.

### 4.7 `Database Schema & ERD Report.md`
- Canonical purpose: persistence model and relational integrity.
- Required content:
- table definitions: `invoices`, `evidence_packs`, `audit_logs`, `graph_edges`
- PK/FK relationship logic and ERD narrative
- append-only expectations for audit table
- Depends on: API contract and evidence pack schema.
- Reconstruction rule: DB migration files must preserve table intent and relationships from this report.

### 4.8 `Threat Model Report Generation Task.md`
- Canonical purpose: security architecture, trust boundaries, and abuse-case controls.
- Required content:
- component taxonomy
- trust boundary definitions
- hard/context control risks
- prompt-injection and PII leakage cases
- mitigations aligned to deterministic pipeline
- Depends on: API, LLM ADR, SRE, compliance documents.
- Reconstruction rule: every runtime control must be traceable to a named threat scenario.

### 4.9 `LLM Deployment & Safety ADR.md`
- Canonical purpose: production decision record for LLM usage constraints.
- Required content:
- narrator-only LLM role
- zero-trust deployment assumptions
- no external exfiltration stance
- determinism lock (`temperature=0.0`) and no-synonyms enforcement
- Depends on: threat model, evaluation framework, compliance report.
- Reconstruction rule: LLM service must not own decisioning, scoring, or approval logic.

### 4.10 `llm-deep-research-report-3.md`
- Canonical purpose: expanded technical deep-dive for the same ADR domain.
- Required content:
- detailed rationale and implementation notes
- tokenization gateway and masking strategy
- prompt-injection controls
- Depends on: same sources as `LLM Deployment & Safety ADR.md`.
- Reconstruction rule: treat as implementation supplement; if conflict exists, `LLM Deployment & Safety ADR.md` wins.

### 4.11 `SRE & Compliance Report Generation.md`
- Canonical purpose: observability, auditability, and compliance-aware telemetry model.
- Required content:
- OpenTelemetry pipeline expectations
- disk-backed buffering strategy
- cryptographic audit trace schema notes
- monitoring metrics and operational checks
- Depends on: API/event flow, audit log architecture.
- Reconstruction rule: telemetry keys and trace propagation must remain deterministic and replay-safe.

### 4.12 `Runbook Oluşturma Talimatları.md`
- Canonical purpose: operations playbook for deployment and incident handling.
- Required content:
- deployment steps
- config/secrets management
- rollback procedure
- severity table
- backup/restore
- access management
- Depends on: SRE and security controls.
- Reconstruction rule: production runbook must keep these operational stages and controls.

### 4.13 `Audit Log Design and Implementation Report.md`
- Canonical purpose: tamper-evident audit design decision basis.
- Required content:
- hash chain model
- WORM model
- Merkle-tree model
- hybrid recommendation for MVP
- Depends on: compliance retention and verification requirements.
- Reconstruction rule: append-only audit implementation must provide both tamper evidence and practical verification.

### 4.14 `Deep Research_ Compliance & Data Retention.md`
- Canonical purpose: legal/regulatory retention and PII handling baseline.
- Required content:
- regulation summary matrix
- PII inventory
- retention policy template
- lifecycle and access-control requirements
- Depends on: jurisdiction and sector controls.
- Reconstruction rule: data lifecycle policy in code and infra must satisfy this matrix.

### 4.15 `Trade Finance Document Pack Report.md`
- Canonical purpose: end-to-end document workflow map and actor interactions.
- Required content:
- workflow A (conventional factoring)
- workflow B (participation banking/murabaha)
- document relevance table
- pain-point and automation rating analysis
- Depends on: trade-finance operating model.
- Reconstruction rule: ingestion and validation stages must cover listed document-pack dependencies.

### 4.16 `Trade Finance Document Pack Report.pdf`
- Canonical purpose: publication/export artifact of the trade-finance workflow report.
- Required content: visual freeze of markdown report.
- Depends on: `Trade Finance Document Pack Report.md`.
- Reconstruction rule: regenerate from markdown when source content changes.

### 4.17 `Canonical Fields, Rule Triggers, and Relationships.pdf`
- Canonical purpose: publication/export artifact for canonical data and rule narrative.
- Required content: visual freeze aligned with canonical field/rule documentation.
- Depends on: `cannonical.md` and linked rule/schema reports.
- Reconstruction rule: regenerate after canonical rule or field contract changes.

### 4.18 `Evaluation Framework for Hybrid Rule Engine.md`
- Canonical purpose: evaluation methodology for deterministic checks and narration quality.
- Required content:
- offline/online evaluation plans
- metrics table and minimum datasets
- feedback loop
- explicit no-synonyms and determinism tests
- Depends on: rule engine outputs and LLM narration pipeline.
- Reconstruction rule: release criteria must include deterministic replay and lexical fidelity checks.

### 4.19 `FinTech Strategy for Turkish Trade Finance.md`
- Canonical purpose: business strategy, pricing orientation, and market segmentation context.
- Required content:
- ecosystem segment analysis
- participation-bank and factoring dynamics
- architecture-to-value linkage
- pricing/go-to-market framing
- Depends on: domain workflow and operations model.
- Reconstruction rule: business layer assumptions should align with technical system constraints.

### 4.20 `Araştırma Planı Güncellemesi ve Doğrulayıcı Ekleme.md`
- Canonical purpose: integrated research blueprint combining architecture, validation, governance.
- Required content:
- canonical model narrative
- hard/context/graph controls
- RPS prioritization logic
- operational and threat considerations
- Depends on: UBL schema, rule, graph, compliance, SRE, ADR files.
- Reconstruction rule: use as integrated narrative map; do not treat as lower-level schema authority.

### 4.21 `docguard-ui/index.html`
- Canonical purpose: frontend structural contract (multi-screen prototype).
- Required content:
- navbar navigation links with `data-screen`
- screen containers with IDs: `screen-dashboard`, `screen-triage`, `screen-review`, `screen-reports`
- interaction anchors used by JS:
- `logo`, `dropzone`, `browseBtn`, `uploadProgress`, `progressFill`, `progressPercent`, `progressStatus`, `progressFilename`
- `recentTable`, `triageBody`, `triageSearch`
- `btnReject`, `btnApprove`, `btnBenign`, `btnLLMFeedback`
- `successModal`, `modalMessage`, `modalNextBtn`, `modalQueueBtn`
- `toastContainer`
- Depends on: `docguard-ui/style.css`, `docguard-ui/app.js`.
- Reconstruction rule: IDs/classes required by JS must remain stable.

### 4.22 `docguard-ui/style.css`
- Canonical purpose: design-system and layout contract.
- Required content:
- root design tokens (`--bg-*`, `--text-*`, `--space-*`, `--radius-*`, `--shadow-*`)
- shared component classes used in HTML (`.screen`, `.nav-link`, `.metric-card`, `.rps-badge`, `.finding-card`, `.toast`, etc.)
- responsive behavior for desktop/mobile usability
- Depends on: class names from `index.html` and dynamic states from `app.js`.
- Reconstruction rule: CSS class names and token semantics must stay aligned with HTML/JS selectors.

### 4.23 `docguard-ui/app.js`
- Canonical purpose: deterministic UI interaction logic and mock workflow state.
- Required content:
- bootstrap calls on `DOMContentLoaded`
- hash-based navigation (`initNavigation`)
- metric counter animation (`initMetricCounters`)
- upload simulation and progress states (`initDropzone`, `simulateUpload`)
- table population (`populateRecentTable`, `populateTriageTable`)
- filtering/search (`initFilterChips`, `initTriageSearch`)
- review decision workflow and modal handling (`initDisposition`)
- session timer (`initReviewTimer`)
- toast messaging (`showToast`)
- static demo dataset `triageData` with signal codes and RPS labels
- Depends on: IDs/classes in `index.html` and classes in `style.css`.
- Reconstruction rule: selector names and data attributes must remain synchronized with HTML.

## 5) Project Re-establishment Sequence (Deterministic Build Order)

1. Establish domain context from:
- `Trade Finance Document Pack Report.md`
- `FinTech Strategy for Turkish Trade Finance.md`
- `Araştırma Planı Güncellemesi ve Doğrulayıcı Ekleme.md`

2. Establish core canonical data model from:
- `UBL-TR Invoice Canonical Schema Report.md`
- `cannonical.md`

3. Establish detection logic from:
- `Review Priority Scoring and Triage.md`
- `Graph Signals for Invoice Consistency.md`

4. Establish service and storage from:
- `BelgeKalkanı API Endpoint Design.md`
- `Database Schema & ERD Report.md`
- `Audit Log Design and Implementation Report.md`

5. Establish security/compliance controls from:
- `Threat Model Report Generation Task.md`
- `Deep Research_ Compliance & Data Retention.md`
- `SRE & Compliance Report Generation.md`
- `Runbook Oluşturma Talimatları.md`

6. Establish narration layer from:
- `LLM Deployment & Safety ADR.md`
- `llm-deep-research-report-3.md`
- `Evaluation Framework for Hybrid Rule Engine.md`

7. Establish operator-facing prototype from:
- `docguard-ui/index.html`
- `docguard-ui/style.css`
- `docguard-ui/app.js`

8. Regenerate publication artifacts:
- `Canonical Fields, Rule Triggers, and Relationships.pdf`
- `Trade Finance Document Pack Report.pdf`

## 6) Change Control Rules

1. Any new field in canonical JSON requires updates in:
- `UBL-TR Invoice Canonical Schema Report.md`
- `cannonical.md`
- impacted rule/API/DB files

2. Any new rule ID requires updates in:
- rule/scoring files
- API response contract
- evaluation metrics
- UI signal labels (if shown)

3. Any UI selector rename requires synchronized updates in:
- `docguard-ui/index.html`
- `docguard-ui/style.css`
- `docguard-ui/app.js`

4. Any compliance policy change requires synchronized updates in:
- compliance report
- threat model
- runbook
- ADR/evaluation where relevant

5. PDF artifacts must be regenerated after source markdown updates.
