✅ 03 — Canonical Output — Araştırma Planı Güncellemesi ve Doğrulayıcı Ekleme.md

Module Metadata
- Module Name: Finansal Kural Motorları ve UBL-TR e-Fatura İşleme Sistemleri İçin Kapsamlı Mimari ve Yönetişim Raporu
- Source File ID: Araştırma Planı Güncellemesi ve Doğrulayıcı Ekleme.md
- Version: Not explicitly stated in this file.

Purpose
- Defines a UBL-TR 1.2 to canonical JSON processing architecture for deterministic validation.
- Defines H-Serisi, C-Serisi, and G-Serisi validation framework for invoice consistency check and discrepancy evidence.
- Defines Review Priority Scoring (RPS) triage model for operational review prioritization.
- Defines Evidence Pack data-contract constraints and LLM narration consistency requirements.
- Defines KVKK, MASAK, BDDK, TTK-aligned PII handling and retention lifecycle approach.
- Defines observability, alerting, and runbook automation flow for operational validation continuity.

MVP Scope
- MVP Boundary Principle:
  - UBL-TR XML is transformed into canonical JSON, evaluated by deterministic rule logic, and emitted as Evidence Pack outputs under strict schema constraints.
- Ingestion Scope:
  - UBL-TR 1.2 XML payload parsing and canonical field mapping.
  - Deterministic H/C/G validation over canonical JSON.
  - RPS scoring and triage assignment.
  - Evidence Pack creation and narration generation constraints.
  - PII protection controls and audit-log security layers.
  - OpenTelemetry, Prometheus, Alertmanager, and runbook automation operational controls.
- Canonical field mapping (explicitly stated paths):

| Category | Document | Extracted Fields (as stated) |
|---|---|---|
| Metadata | UBL-TR canonical JSON | metadata.ubl_version, metadata.customization_id, metadata.uuid, document.issue_date |
| Party identity | UBL-TR canonical JSON | supplier.vkn, customer.vkn, supplier.tckn |
| Financial totals | UBL-TR canonical JSON | tax.total_tax_amount, totals.line_extension, totals.payable_amount, totals.charge_total, totals.allowance_total |
| Line items | UBL-TR canonical JSON | lines.net_amount, lines.quantity, lines.unit_code, lines.item_name |
| Payment & references | UBL-TR canonical JSON | payment.iban, references.despatch_id, references.despatch_date |

- MVP Validations (Computational Core):
  - Hard validation for structural, mathematical, and format rules (H001-H015).
  - Context validation for operational anomaly signals (C001-C008).
  - Graph-based relationship validation (G001 explicitly; G004 and G005 mentioned).
  - RPS saturation scoring with category caps and triage thresholds.
  - Evidence Pack schema validation with additionalProperties: false at root.
  - No-Synonyms narration validation with exact field-name preservation.
  - PII masking/tokenization/pseudonymization controls for audit and log outputs.
  - Latency and trigger-rate observability thresholds with automated runbook response.

Actors & Core Entities
- Actors:

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
|---|---|---|
| Deterministic rule engine | Core validator | Executes H/C/G checks and emits Evidence Pack artifacts |
| Human reviewer / denetçi | Triage reviewer | Reviews context/graph-triggered items and audit evidence |
| LLM narration component | Evidence narrator | Produces deterministic finding text from Evidence Pack only |
| Compliance function | Privacy/governance control | Approves sensitive decryption or exceptional PII access under defined controls |
| OpenTelemetry/Prometheus/Alertmanager stack | Observability control plane | Detects latency, error-rate, and leakage-related anomalies; triggers runbooks |
| Runbook automation | Remediation executor | Executes predefined self-healing steps under alert conditions |

- Core Entities:

| Entity | Definition (from input) | Primary Identifiers / Fields |
|---|---|---|
| Canonical JSON | Deterministic projection of UBL-TR XML | metadata.*, document.*, supplier.*, customer.*, tax.*, totals.*, lines.*, payment.*, references.* |
| Hard Checks (H-Serisi) | Deterministic hard validation rules | H001-H015 |
| Context Checks (C-Serisi) | Contextual anomaly validations | C001-C008 |
| Graph Signals (G-Serisi) | Network relationship validations | G001 (explicit), G004, G005 |
| Review Priority Scoring (RPS) | Weighted saturated triage score | Category weights, category caps, total score, triage band |
| Evidence Pack | Executable data contract output | check_id, fields, metrics, paths |
| audit_trace narration | Deterministic explanation artifact | exact identifiers, no synonyms |

Workflows
- Workflow A - UBL-TR Processing and Validation Flow

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Parse and canonicalize | Processing pipeline | UBL-TR XML -> canonical JSON | Type safety and mapped-field consistency check |
| 2 | Execute H/C/G checks | Deterministic rule engine | Triggered rule outputs | Rule-condition validation and discrepancy evidence |
| 3 | Compute RPS | Rule engine | RPS score and triage class | Weight/cap/threshold validation |
| 4 | Build Evidence Pack | Rule engine | Structured JSON evidence contract | Schema consistency check and path evidence generation |
| 5 | Generate narration | LLM narration component | Finding cards / narrative summary | No-Synonyms validation and evidence-only narration constraint |
| 6 | Persist audit evidence | Audit/logging layer | Immutable log artifacts | Hashing, chaining, and identity trace consistency check |

- Workflow B - Observability and Runbook Automation

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Collect telemetry | OpenTelemetry + metrics/log layers | Spans, traces, metrics, logs | Signal completeness and contextual trace correlation |
| 2 | Evaluate alert rules | Prometheus + Alertmanager | Alert events | Threshold/window validation |
| 3 | Trigger remediation | Runbook automation | YAML-driven action steps | Action sequencing validation |
| 4 | Verify recovery | Runbook automation + metrics checks | Post-action metrics state | Recovery-condition consistency check |
| 5 | Escalate if unresolved | Alertmanager/on-call | Escalation event | Failure-condition validation |

Canonical Consistency Checks (MVP)
- H-Serisi catalog (as stated):

| Check ID | Check Name | Trigger Condition (as stated) | Evidence Focus |
|---|---|---|---|
| H001 | UBL-TR Versiyon Uyuşmazlığı | metadata.ubl_version != "2.1" OR metadata.customization_id != "TR1.2" | metadata.ubl_version, metadata.customization_id |
| H002 | Kalem Tutarı Tutarlılığı | abs(sum(lines.net_amount) - totals.line_extension) > 0 | lines.net_amount, totals.line_extension |
| H003 | Vergi Toplamı Tutarlılığı | abs(sum(tax.subtotals.tax_amount) - tax.total_tax_amount) > 0 | tax.subtotals.tax_amount, tax.total_tax_amount |
| H004 | Ödenecek Tutar Tutarlılığı | abs(totals.payable_amount - (totals.line_extension + totals.charge_total - totals.allowance_total + tax.total_tax_amount)) > 0 | totals.payable_amount and component totals |
| H005 | e-İrsaliye Referans Eksikliği | references.despatch_id empty/undefined | references.despatch_id |
| H006 | İrsaliye Zaman Tutarsızlığı | any references.despatch_date[i] > document.issue_date | references.despatch_date, document.issue_date |
| H007 | Tedarikçi Kimlik Doğrulama | (supplier.tckn present AND mod10 mismatch) OR (supplier.vkn present AND length != 10) | supplier.tckn, supplier.vkn |
| H008 | IBAN Yapı Doğrulama | payment.iban present AND mod97(payment.iban) != 1 | payment.iban |
| H009 | Çift Sunum Tespiti | Duplicate metadata.uuid | metadata.uuid |
| H010 | Ürün Açıklama Eksikliği | Any lines.item_name empty/missing | lines.item_name |
| H011 | Fatura Kimlik Formatı | length(document.id) != 16 OR pattern mismatch | document.id |
| H012 | Tarih Formatı Hatası | Date fields not ISO-8601 compliant | date fields |
| H013 | KDV Kodu Uyumsuzluğu | tax.subtotals.scheme_id not in authorized code list | tax.subtotals.scheme_id |
| H014 | Döviz Kodu Formatı | document.currency_code fails ^[A-Z]{3}$ | document.currency_code |
| H015 | Miktar Kod Uyumsuzluğu | lines[i].unit_code == "C62" AND lines[i].quantity % 1 != 0 | lines.unit_code, lines.quantity |

- C-Serisi catalog (as stated):

| Check ID | Check Name | Trigger Condition (as stated) | Evidence Focus |
|---|---|---|---|
| C001 | Kalem Sayısı Aykırılığı | len(lines) > 20 | lines |
| C002 | Yabancı Para Kullanımı | document.currency_code != "TRY" | document.currency_code |
| C003 | Yabancı IBAN Kullanımı | payment.iban first 2 chars not "TR" | payment.iban |
| C004 | Yüksek İskonto Oranı | allowance/charge exceeds 50% of net total (> 0.5) | totals.allowance_total, totals.charge_total, totals.line_extension |
| C005 | Çifte Kimlik Kullanımı | supplier.vkn and supplier.tckn both present or both absent | supplier.vkn, supplier.tckn |
| C006 | Aynı VKN/TCKN | supplier.vkn == customer.vkn OR supplier.tckn == customer.tckn | supplier/customer VKN/TCKN |
| C007 | Hızlı Fatura-İrsaliye Zamanlaması | min(references.despatch_date) >= document.issue_date | references.despatch_date, document.issue_date |
| C008 | Volumetrik Tutarsızlık | sum(e_irsaliye.deliveredQuantity) != sum(lines.quantity) | deliveredQuantity, lines.quantity |

- G-Serisi details (explicitly stated):

| Check ID | Check Name | Trigger Condition (as stated) | Evidence Focus |
|---|---|---|---|
| G001 | Çapraz Satıcı IBAN Paylaşımı | One IBAN node connected via PAID_VIA edges to multiple distinct VKN/TCKN nodes | payment.iban, seller identities, graph edges |
| G004 | Döngüsel ticaret tespiti | Mentioned as graph vector; circular path pattern discussed | Circular path evidence |
| G005 | Sözcüksel kimlik örtüşmesi | Mentioned as graph vector | Identity-overlap evidence |

- RPS scoring (as stated):

| Item | Value / Rule (as stated) |
|---|---|
| Total score cap | 100 |
| H-Serisi cap | 70 |
| C-Serisi cap | 40 |
| G-Serisi cap | 40 |
| Triage - Low | 0-9 |
| Triage - Medium | 10-29 |
| Triage - High | >=30 |

- Operational validation thresholds (as stated):

| Signal | Threshold / Window |
|---|---|
| Latency budget | p95 latency 100 ms |
| Trigger-rate anomaly | Sudden increase of two standard deviations |
| Error-rate alert example | 5xx ratio > 0.01 (5m window expression shown) |
| Runbook trigger example | db.client.connections.usage > 0.95 |
| Post-remediation check | value < 0.7 after 120 seconds |

Evidence Output Contract
- Evidence Pack contract (as stated):

| Field Group | Included Fields (as stated) | Constraints (as stated) |
|---|---|---|
| Rule identity | check_id | Included in evidence object |
| Field evidence | fields | Canonical values tied to triggered validation |
| Computed evidence | metrics | Computed numeric/context metrics |
| Traceability paths | paths | JSON Pointer paths to exact source locations |
| Schema boundary | Root object | additionalProperties: false |

- Explicit path evidence example (as stated):
  - ["/totals/line_extension", "/lines/0/net_amount"] for H002 evidence mapping.
- No-Synonyms narration policy (as stated):
  - Narration must remain limited to Evidence Pack JSON content.
  - Field names/metrics/proper names cannot be replaced with synonyms.
  - Examples explicitly prohibited in narration substitution: "IBAN" -> "banka hesabı", "VKN" -> "vergi numarası", totals.payable_amount -> "genel tutar".
  - Determinism evaluation condition: temperature=0.0 with Exact Match Ratio = 1.0.

Implementation Notes (storage-neutral)
- Uses JSON Schema Draft-07 for strict canonical data-contract enforcement.
- Uses deterministic parser and rule evaluation on canonical JSON fields.
- Uses tiered data lifecycle with operational and archive layers.
- Uses tokenization, dynamic data masking, and pseudonymization as separate protection controls.
- Uses WORM + hash chain + Merkle tree in audit log layer with SPIFFE/SVID identity checks for signing/key operations.

Operational Notes
- Privacy and retention constraints (as stated):

| Framework | Requirement (as stated) |
|---|---|
| KVKK | Storage limitation and minimization; delete/anonymize when purpose ends |
| MASAK | Keep transaction records at least 8 years after relationship end |
| TTK | Keep core financial records 10 years |
| BDDK | Keep external audit working papers at least 5 years |

- PII controls and AC-03 scenario:
  - VKN, TCKN, IBAN are treated as PII with elevated protection requirements.
  - AC-03 describes PII leakage risk in audit traces when raw sensitive values appear in logs/evidence.
  - Protection layers: tokenization, dynamic masking, pseudonymization with HSM-backed key protection and RBAC-gated exceptional access.
- Observability stack and runbook control:
  - LGTM stack is explicitly listed (Loki, Grafana, Tempo, Mimir/Prometheus).
  - OpenTelemetry spans/traces and BatchSpanProcessor use are explicitly stated.
  - PromQL-based RED metrics and alert gating (`for: 5m`, keep_firing_for) are explicitly stated.
  - Runbook sequence is explicitly stated: log event, restart pgbouncer, wait 120 seconds, metric_check, then on_failure escalation.

Open Questions
- Not explicitly stated in this file: full textual RPS equation terms shown in image-based formula lines.
- Not explicitly stated in this file: full explicit catalog definitions for all G-Serisi IDs beyond G001 and mentions of G004/G005.
- Not explicitly stated in this file: explicit JSON Schema keyword set beyond Draft-07 and root additionalProperties: false note.
- Not explicitly stated in this file: exact WORM retention configuration values for each storage tier.
- Not explicitly stated in this file: exact SLA targets for p99 latency beyond the stated 100 ms p95 budget.
