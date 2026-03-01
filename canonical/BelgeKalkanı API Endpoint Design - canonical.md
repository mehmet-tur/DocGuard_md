✅ 03 — Canonical Output — BelgeKalkanı API Endpoint Design.md

Module Metadata
- Module Name: API Endpoints Interface Contract
- Source File ID: BelgeKalkanı API Endpoint Design.md
- Version: Not explicitly stated in this file.

Purpose
- Defines the BelgeKalkanı MVP API contract for UBL-TR 1.2 e-Fatura ingestion and analysis.
- Defines deterministic rule-engine evaluation and Evidence Pack-oriented response behavior.
- Defines deterministic narration generation from evidence-oriented inputs.
- Defines append-only audit verification response structure for cryptographic integrity validation.
- Defines standardized error response behavior for structural validation and processing discrepancies.

MVP Scope
- MVP Boundary Principle: Stateless endpoint interactions with deterministic canonical JSON transformation, rule validation, and evidence-centric outputs.
- Ingestion Scope:
  - POST /api/v1/analyze: accepts UBL-TR 1.2 XML e-Fatura via multipart/form-data.
  - POST /api/v1/narrate: accepts evidence_pack_hash and narration context for deterministic narration.
  - GET /api/v1/audit/{invoice_id_hash}: accepts hashed identifier for audit verification response.
- Base URL & Authentication:

| Item | Requirement (as stated) |
|---|---|
| Base URL | /api/v1/docguard |
| Transport Security | TLS 1.3 |
| External Authentication | Authorization: Bearer <JWT_Token> or X-API-Key |
| Internal Service Identity | X-SPIFFE-ID header and SPIFFE SVID-based internal communication |
| Gateway Rejection Behavior | Missing/invalid/expired credentials are rejected at gateway with 401 or 403 before business logic |
| Signing Isolation | Ed25519 signing operations are performed in HSM FIPS 140-3 Seviye 3 isolation |

- MVP Validations (Computational Core):
  - UBL-TR 1.2 schema validation and canonical JSON transformation.
  - PII masking validation before response generation for supplier.vkn, supplier.tckn, customer.vkn, payment.iban, payment.bic, supplier.contact.phone, supplier.contact.email.
  - Deterministic H-series and C-series rule validation.
  - Review Priority Scoring (RPS) validation with defined weights and thresholds.
  - JSON canonicalization via RFC 8785 prior to SHA-256 hashing where stated.
  - Append-only audit integrity validation via linear hash linkage and Merkle proof material.

Actors & Core Entities
- Actors:

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
|---|---|---|
| Dış istemci / entegratör | API caller | Sends analyze and narrate requests with required payload shape and auth headers |
| API Gateway | Gatekeeper | Applies authentication and early structural validation before processing |
| Deterministik kural motoru | Validation executor | Evaluates H/C rules, produces evidence-oriented rule outputs and RPS data |
| İç mikroservisler | Internal processing services | Use SPIFFE identity context and participate in audit record generation |
| LLM narrasyon bileşeni | Narration generator | Produces deterministic audit_trace narration from evidence scope |
| Dış denetçi | Audit verifier | Uses audit response to validate inclusion and integrity evidence |

- Core Entities (Canonical):

| Entity | Definition (from input) | Primary Identifiers / Fields |
|---|---|---|
| UBL-TR XML girdi | Analyze endpoint input document | file (application/xml), UBL-TR 1.2 conformity |
| Canonical JSON | Deterministic flattened invoice representation | metadata.*, document.*, supplier.*, customer.*, payment.*, totals.*, tax.*, references.*, lines.* |
| Evidence Pack | Rule-trigger evidence content | triggered_rules content, evidence_fields, trigger_values, json_pointers |
| Review Priority Scoring (RPS) | Priority scoring model | hard_check_points, context_check_points, total_score, priority_category |
| Audit record | Append-only verification record | entry_id, sequence_number, prev_hash, doc_uuid, invoice_id, input_file_hash, evidence_pack, rps_data, audit_trace, signature |
| Merkle proof block | Inclusion proof content | leaf_hash, merkle_path, signed_tree_head |
| Problem details error payload | Standard error response contract | type, title, status, detail, instance, validation_errors |

Workflows
- Workflow A — Ingest & Analyze (POST /api/v1/analyze)

  - Canonical Sequence:

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Receive multipart XML | Dış istemci, API Gateway | UBL-TR XML file | Authentication and request-structure validation |
| 2 | Canonical transformation | Processing services | Canonical JSON | Deterministic extraction and mapping consistency check |
| 3 | Entity masking | Processing services | Masked canonical view | PII masking validation before outbound payload |
| 4 | Rule evaluation | Deterministik kural motoru | Rule outputs and Evidence Pack fields | H/C trigger condition validation and discrepancy evidence |
| 5 | Scoring and response | Rule engine, API Gateway | Analyze response JSON | RPS threshold validation and response-shape consistency check |

  - Request Payload:

| Field | Type/Format | Required? | Notes (as stated) |
|---|---|---|---|
| file | multipart/form-data, application/xml | Yes | UBL-TR 1.2 compatible electronic invoice document |

  - Response Payload (200 OK):

| Field | Type/Format | Required? | Notes (as stated) |
|---|---|---|---|
| document_metadata | object | Not explicitly stated | Includes file_name, ubl_version, customization_id, document_id, document_uuid, issue_date, currency_code |
| masked_entities | object | Not explicitly stated | Includes masked supplier/customer/payment identifiers and contact data |
| analysis_results | object | Not explicitly stated | Includes status and triggered_rules entries |
| rps_data | object | Not explicitly stated | Includes hard/context points, total_score, priority_category |
| evidence_pack_hash | string | Not explicitly stated | SHA-256 based evidence hash |
| input_file_hash | string | Not explicitly stated | SHA-256 based input file hash |
| processed_at | datetime string | Not explicitly stated | Processing timestamp |

- Workflow B — Generate Narration (POST /api/v1/narrate)

  - Canonical Sequence:

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Receive narration request | Dış istemci, API Gateway | narration payload | Authentication and request-shape validation |
| 2 | Resolve evidence context | Internal services | evidence_pack by hash | Hash-to-evidence consistency check |
| 3 | Deterministic narration generation | LLM narrasyon bileşeni | audit_trace sequence | No-synonyms and evidence-bound narration validation |
| 4 | Return narration response | API Gateway | Narration response JSON | Response field consistency check |

  - Request Payload:

| Field | Type/Format | Required? | Notes (as stated) |
|---|---|---|---|
| evidence_pack_hash | string | Yes | Client must provide this value to start narration process |
| language | string | Not explicitly stated | Example value: tr |
| narration_context | object | Not explicitly stated | Example includes rule_ids and evidence_pointers |

  - Response Payload (200 OK):

| Field | Type/Format | Required? | Notes (as stated) |
|---|---|---|---|
| evidence_pack_hash | string | Not explicitly stated | Hash reference for narrated evidence |
| audit_trace | array<object> | Not explicitly stated | Includes step_sequence, rule_reference, narration_text |
| llm_model_version | string | Not explicitly stated | Example model version provided |
| generated_at | datetime string | Not explicitly stated | Narration generation timestamp |

- Workflow C — Verify Audit Log (GET /api/v1/audit/{invoice_id_hash})

  - Canonical Sequence:

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Receive hash-based query | Dış denetçi, API Gateway | invoice_id_hash path parameter | Parameter presence validation and auth validation |
| 2 | Retrieve append-only record | Internal services | audit_record | Sequence and prev_hash consistency check |
| 3 | Build Merkle proof response | Internal services | merkle_proof block | Inclusion proof reconstruction consistency check |
| 4 | Return verification payload | API Gateway | audit verification JSON | Cryptographic mechanism field consistency check |

  - Request Payload:

| Field | Type/Format | Required? | Notes (as stated) |
|---|---|---|---|
| invoice_id_hash | path parameter, SHA-256 hash string | Yes | Hash of doc_uuid (UBL-TR cbc:UUID) or invoice_id; plaintext IDs are not passed in URL |

  - Response Payload (200 OK):

| Field | Type/Format | Required? | Notes (as stated) |
|---|---|---|---|
| validation_status | string | Not explicitly stated | Example value: VERIFIED_AND_ANCHORED |
| audit_record | object | Not explicitly stated | Includes entry_id, timestamp, sequence_number, prev_hash, doc_uuid, invoice_id, actor_identity, input_file_hash, evidence_pack, rps_data, audit_trace, signature |
| merkle_proof | object | Not explicitly stated | Includes leaf_hash, merkle_path, signed_tree_head |
| cryptographic_mechanisms | object | Not explicitly stated | Includes canonicalization_scheme, hashing_algorithm, signature_algorithm |

Canonical Consistency Checks (MVP)
- Deterministic Rule Catalog:

| Check ID | Category | Trigger Condition (as stated) | Evidence Fields (as stated) |
|---|---|---|---|
| H001 | Hard | metadata.ubl_version != "2.1" OR metadata.customization_id != "TR1.2" | metadata.ubl_version, metadata.customization_id |
| H002 | Hard | abs(sum(lines.net_amount) - totals.line_extension) > 0 | totals.line_extension, lines.net_amount |
| H003 | Hard | abs(sum(tax.subtotals.tax_amount) - tax.total_tax_amount) > 0 | tax.total_tax_amount, tax.subtotals.tax_amount |
| H004 | Hard | abs(totals.payable_amount - (totals.line_extension + totals.charge_total - totals.allowance_total + tax.total_tax_amount)) > 0 | totals.payable_amount, totals.line_extension, totals.allowance_total, tax.total_tax_amount |
| H005 | Hard | references.despatch_id array is empty or undefined | references.despatch_id |
| H006 | Hard | any references.despatch_date[i] > document.issue_date | references.despatch_date, document.issue_date |
| H007 | Hard | (supplier.tckn exists AND mod10(supplier.tckn) != 0) OR (supplier.vkn exists AND length(supplier.vkn) != 10) | supplier.vkn, supplier.tckn |
| H008 | Hard | payment.iban exists AND mod97(payment.iban) != 1 | payment.iban |
| H009 | Hard | Same metadata.uuid already processed in database | metadata.uuid |
| H011 | Hard | length(document.id) != 16 OR pattern mismatch | document.id |
| H012 | Hard | document.issue_date or despatch dates are invalid | document.issue_date, references.despatch_date |
| C001 | Context | len(lines) > 20 | lines.line_id |
| C002 | Context | document.currency_code != "TRY" | document.currency_code |
| C004 | Context | allowance or charge total > 50% of totals.line_extension | totals.allowance_total, totals.charge_total, totals.line_extension |
| C006 | Context | supplier.vkn == customer.vkn OR supplier.tckn == customer.tckn | supplier.vkn, customer.vkn, supplier.tckn, customer.tckn |
| C007 | Context | min(references.despatch_date) >= document.issue_date | references.despatch_date, document.issue_date |

- Review Priority Scoring (RPS):
  - Hard check points: 10 per triggered Hard rule.
  - Context check points: 1 per triggered Context rule.
  - Priority thresholds: 0-9 Low, 10-29 Medium, >=30 High.

- Standard Error Responses (RFC 7807):

| Status | When | Fields included (as stated) |
|---|---|---|
| 400 Bad Request | Request syntax/schema/form-data validation mismatch or canonicalization input format failure | type, title, status, detail, instance, validation_errors (loc, msg, type) |
| 422 Unprocessable Entity | Request format acceptable but XML/business-logic processing cannot proceed due to required node/rule discrepancy | type, title, status, detail, instance, validation_errors (loc, msg, type) |

Evidence Output Contract
- Output Artifacts (as stated):
  - Analyze response payload with masked entities, triggered rule evidence, RPS, and hashes.
  - Narrate response payload with deterministic audit_trace sequence.
  - Audit verification payload with audit_record, merkle_proof, and cryptographic_mechanisms.

- JSON Payload — Canonical Field Set:

| Field Group | Included Fields (Minimum) | Notes / Constraints (from input) |
|---|---|---|
| Analyze Metadata | file_name, ubl_version, customization_id, document_id, document_uuid, issue_date, currency_code | Example response object under document_metadata |
| Masked Entities | supplier(vkn/tckn/name/contact), customer(vkn/name), payment(iban/bic) | PII masking applied before output |
| Rule Evidence | analysis_results.status, triggered_rules[*].rule_id/category/name/intent/evidence_fields/trigger_values/json_pointers | Triggered rule evidence content is returned in analyze response |
| RPS | hard_check_points, context_check_points, total_score, priority_category | Weighted scoring model is explicitly defined |
| Hashes & Time | evidence_pack_hash, input_file_hash, processed_at | Hashing references SHA-256 and canonicalization context |
| Narration | evidence_pack_hash, audit_trace[*], llm_model_version, generated_at | audit_trace items include step_sequence, rule_reference, narration_text |
| Audit Verification | validation_status, audit_record, merkle_proof, cryptographic_mechanisms | Includes linear hash chain and Merkle proof related fields |
| Error Payload | type, title, status, detail, instance, validation_errors | RFC 7807-aligned structure |

Operational Notes
- Architecture is described as stateless between external clients and internal microservices.
- Audit records are described as append-only and cryptographically linked.
- Merkle tree inclusion evidence and signed tree head concepts are described for external verification.
- RFC 8785 canonicalization is stated for deterministic hashing input preparation.
- Timestamp recording is described in ISO-8601 UTC with NTP synchronization.

Open Questions
- Not explicitly stated in this file: complete required/optional markers for response payload fields across all endpoints.
- Not explicitly stated in this file: rate limiting policy.
- Not explicitly stated in this file: idempotency behavior for POST endpoints.
- Not explicitly stated in this file: maximum payload size and timeout limits.
- Not explicitly stated in this file: whether language and narration_context are mandatory or optional in /api/v1/narrate.
