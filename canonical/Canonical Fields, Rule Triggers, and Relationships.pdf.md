✅ 03 — Canonical Output — Canonical Fields, Rule Triggers, and Relationships.pdf

Module Metadata
- Module Name: Canonical Fields, Rule Triggers, and Relationships
- Source File ID: Canonical Fields, Rule Triggers, and Relationships.pdf
- Version: Not explicitly stated in this file.

Purpose
- Defines canonical e-Fatura JSON field sets for UBL-TR 1.2 context.
- Maps canonical invoice fields to graph nodes and graph edges.
- Defines rule trigger conditions for H002, H007, C001, C004, and G001.
- Defines Evidence Pack JSON Schema (Draft-07) structure for deterministic evidence output.
- Defines audit-oriented finding content blocks and deterministic narration constraints.

MVP Scope
- MVP Boundary Principle: Rule evaluation and evidence production are based on canonical field values, explicit trigger formulas, and schema-bound evidence payloads.
- Ingestion Scope:
  - Canonical invoice JSON fields (metadata, document, party, totals, tax, lines, references).
  - Graph derivation inputs (VKN/TCKN, IBAN, UUID, despatch references).
  - Rule trigger conditions and worked example evidence payloads.
- Canonical Field Groups:

| Group | Example Canonical Fields (as stated) |
|---|---|
| Metadata | metadata.ubl_version, metadata.customization_id, metadata.uuid |
| Document | document.invoice_id, document.issue_date, document.currency_code |
| Party Identifiers | supplier.vkn, supplier.tckn, supplier.name, customer.vkn, customer.name |
| Totals & Tax | tax.total_tax_amount, totals.line_extension, totals.payable_amount, totals.allowance_total, totals.charge_total |
| Line Items | lines.net_amount, lines.quantity, lines.unit_code, lines.item_name |
| References & Payment | references.despatch_id, payment.iban |
| Graph Edges | ISSUED_TO (issue_date, payable_amount, currency), PAID_VIA (last_used_date, frequency_count) |

Actors & Core Entities
- Actors:

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
|---|---|---|
| LLM | Deterministic narration producer | Uses exact field names/values from Evidence Pack JSON |
| Auditors / AI agents | Downstream evidence consumers | Interprets schema-constrained evidence and trace fields |

- Core Entities (Canonical):

| Entity | Definition (from input) | Primary Identifiers / Fields |
|---|---|---|
| Rule/Signal Check | Triggered validation unit | check_id, check_type |
| Evidence Pack | Draft-07 JSON payload for rule/signal evidence | fields, metrics, paths, audit_trace |
| Graph Node | Canonical entity node | supplier/customer by VKN/TCKN, payment.iban, metadata.uuid, references.despatch_id |
| Graph Edge | Canonical relationship edge | ISSUED_TO, PAID_VIA |
| Finding Card | Audit report finding block | Rule/Signal ID, Evidence Summary, Canonical Fields, Computed Metrics, Canonical Paths, Audit Trace |

Canonical Consistency Checks (MVP)
- Check Catalog (Closed-Loop):

| Check Group | Check Name | Inputs | Comparison / Validation | Evidence Output (what must be logged) |
|---|---|---|---|---|
| HARD | H002 line-item amount consistency | lines[].net_amount, totals.line_extension | abs(sum(lines[].net_amount) - totals.line_extension) > 0 | Compared totals, computed sum, canonical paths, audit_trace |
| HARD | H007 supplier ID validation | supplier.vkn, supplier.tckn | non-10-digit VKN or 11-digit TCKN failing Mod-10 checksum | Supplier ID values and validation trace |
| CONTEXT | C001 line count check | lines | len(lines) > 20 | line_count metric, /lines path, audit_trace |
| CONTEXT | C004 high allowance/charge ratio | totals.allowance_total, totals.charge_total, totals.line_extension | (totals.allowance_total / totals.line_extension) > 0.5 | allowance_ratio metric, compared totals, paths |
| GRAPH | G001 cross-seller shared IBAN | payment.iban and seller entities | One IBAN connected to >=2 distinct seller VKN/TCKN nodes | unique_sellers metric, IBAN and seller list, path |

- Worked Examples (Explicit):

| Check ID | Trigger Condition (as stated) | Evidence Fields/Metrics/Paths (as stated) |
|---|---|---|
| H002 | abs(sum(lines[].net_amount) - totals.line_extension) > 0 | fields: totals.line_extension, lines[].net_amount; metrics: sum_net_amount; paths: /totals/line_extension, /lines/0/net_amount, /lines/1/net_amount |
| H007 | supplier VKN/TCKN format validation failure (example: supplier.vkn length = 9, expected 10) | fields: supplier.vkn, supplier.name; metrics: {}; paths: /supplier/vkn |
| C001 | len(lines) > 20 | fields: lines[].line_id; metrics: line_count = 21; paths: /lines |
| C004 | (totals.allowance_total / totals.line_extension) > 0.5 | fields: totals.allowance_total, totals.charge_total, totals.line_extension; metrics: allowance_ratio = 0.60; paths: /totals/allowance_total, /totals/line_extension |
| G001 | One IBAN linked to >=2 distinct seller entities | fields: iban, seller_vkns, seller_names; metrics: unique_sellers = 2; paths: /payment/iban |

Evidence Output Contract
- Output Artifacts (as stated):
  - Evidence Pack JSON payload per triggered check.
  - Finding-card content blocks for audit report output.

- Evidence Pack JSON Schema (Draft-07):

| Property | Type | Required/Optional | Notes |
|---|---|---|---|
| check_id | string | Required | Pattern: ^[HC]?[0-9]{3}$ |
| check_type | string | Required | Enum: HARD, CONTEXT, GRAPH |
| description | string | Optional | Short summary text |
| fields | object | Required | Canonical fields and values from invoice; snippet shows additionalProperties: true |
| metrics | object | Required | Computed metrics; snippet shows additionalProperties: true |
| paths | array<string> | Optional | JSON Pointer paths used in evaluation |
| audit_trace | array<string> | Optional | Evaluation steps/notes |

- Schema-level constraints (as stated):
  - required: check_id, check_type, fields, metrics
  - additionalProperties: false at top level

- No-Synonyms Narration Policy:
  - Use exact field names and values from JSON; no synonym replacement for identifiers.
  - Use “IBAN” and do not replace with “bank account”.
  - Use “VKN” and do not replace with “tax ID”.
  - Use “UBL-TR” and do not replace with “Turkish e-invoice standard”.
  - Preserve acronyms such as KDV verbatim.
  - Refer to canonical keys exactly as written (example stated: totals.payable_amount).

Operational Notes
- The document presents schema guidance as an executable contract approach.
- The document states schema versioning should be applied when fields or rules change.
- Audit report content is described with fixed headers and finding-card components.

Open Questions
- Not explicitly stated in this file: Module version value.
- Not explicitly stated in this file: authoritative resolution for fields/metrics strictness, because descriptive text and schema snippet differ on additionalProperties behavior.
- Not explicitly stated in this file: complete production check catalog beyond the explicitly worked examples and listed trigger set.
