✅ 03 — Canonical Output — Runbook Oluşturma Talimatları.md

Module Metadata
- Module Name: Deployment & Ops Runbook (MVP)
- Source File ID: Runbook Oluşturma Talimatları.md
- Version: Not explicitly stated: module version.

Purpose
- Define MVP deployment, operations, rollback, incident response, backup/restore, and access-management runbook for BelgeKalkanı.
- Define deterministic rollout safety using shadow deployment pipelines and regression comparison.
- Define configuration/secrets governance with semantic versioning, Draft-07 schema contracts, and cryptographic custody controls.
- Define severity classification and intervention timelines for operational discrepancy management.
- Define routine statistical and cryptographic maintenance tasks for ongoing consistency check quality.

MVP Scope
- MVP Boundary Principle:
  - MVP runs as an independent modular REST API focused on internal document-to-document consistency check / validation.
  - The system is positioned as an analytical observation tool; it does not perform automated workflow execution decisions.
- Ingestion Scope:
  - Inbound UBL-TR payload copies from core-banking streams are sent to active production and shadow environment in parallel during release validation.
  - Evidence output comparison is performed between active version (example `v0.1`) and candidate version (example `v0.2`).
- MVP Validations (Computational Core):
  - Shadow deployment comparison of active and candidate outputs.
  - Regression Delta logging for any discrepancy in triggered operational interfaces, mathematical metrics, or JSON path arrays.
  - LLM output comparison using ROUGE-L and Exact Match metrics over statistically meaningful random Evidence Pack samples.
  - Confidence-interval gate for deployment cancelation when narrative metrics exceed predefined confidence boundaries.
  - Rollback trigger checks for Rule Precision and LLM Faithfulness Score degradation conditions.

Out of Scope
- Real-time external database integrations in MVP.
- Real-time API integrations to Gelir İdaresi Başkanlığı (GİB) backend portals in MVP.
- Direct-to-production code/model deployment updates.

Actors & Core Entities
- Actors:

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
|---|---|---|
| Data Science team | Candidate-change proposer | Proposes threshold/model updates; cannot unilaterally deploy to production |
| Engineering team | Candidate implementation actor | Prepares release candidate artifacts and validation changes |
| DevOps/SRE | Operational execution actor | Operates shadow pipelines, rollback mechanics, and runtime interventions |
| Compliance Officer (CCO) | Governance actor | Participates in escalation, approval, and regulatory closure workflows |
| C-Suite / S-Seviye | Executive escalation actor | Receives critical (SEV-1) escalation and approves high-severity actions |
| Client Administrators | Read-only consumer actor | Consumes Document Integrity & Evidence Report outputs; cannot modify evidence logs |
| API Gateway | Traffic control actor | Switches traffic only after required governance approvals; enforces rollback rerouting |
| HSM control boundary | Cryptographic custody actor | Holds private keys for Merkle anchoring, signatures, and key rotation lifecycle |

- Core Entities:

| Entity | Definition (from source) | Primary Identifiers / Fields |
|---|---|---|
| Shadow Environment | Isolated parallel environment for release-candidate validation against live data copies | Candidate semantic versions (example: `v0.2`) |
| Regression Delta | Any discrepancy between active and candidate outputs during shadow comparison | Check mismatch evidence, metric discrepancy, JSON path discrepancy |
| Document Integrity & Evidence Report | Primary analytical output consumed by Client Administrators | Structured JSON + PDF summary references in source text |
| Rule Pack Configuration | Externalized threshold configuration surface | C001 limit example `20`, C004 ratio example `0.5`, manual review threshold example `>=30` |
| Semantic Version Tagging | Mandatory version metadata attached to produced outputs | Example `"version": "0.1"` |
| Multi-Signature Governance Protocol | Deployment authorization protocol requiring independent cryptographic approvals | Manifest signatures from isolated operational roles |
| WORM storage | Immutable persistence layer for evidence and cryptographic anchors | Append-like immutable archival behavior |
| Merkle Hash Trees | Cryptographic anchoring structure for payload, Evidence Pack, and narrative artifacts | Root verification and immutable integrity proofs |

Workflows
- Deployment Procedure:

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Candidate preparation | Data Science, Engineering | Proposed versioned rule/model update | Candidate readiness for shadow validation |
| 2 | Shadow deployment | DevOps/SRE | Candidate deployed to isolated parallel environment | No direct production exposure |
| 3 | Dual-track live-copy feed | API/Gateway pipeline | Copied live UBL-TR payload streams to active + shadow | Input equivalence for deterministic comparison |
| 4 | Evidence comparison | Validation pipeline | Active vs candidate Evidence Pack outputs | Regression Delta detection (metrics, check mismatch, JSON paths) |
| 5 | Narrative evaluation | LLM validation pipeline | ROUGE-L, Exact Match score outputs | Confidence-interval gate on narrative consistency |
| 6 | Governance approval | Multi-role approvers | Deployment manifest signatures | Multi-signature completion before traffic cutover |
| 7 | Traffic switch | API Gateway | Changelog + persistent audit updates | Controlled switch to approved version |

- Rollback Procedure:

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Live telemetry watch | Runtime monitoring | Rule Precision, LLM Faithfulness Score metrics | Degradation detection against stated thresholds |
| 2 | Trigger evaluation | Circuit-breaker logic | Trigger evidence | Rule Precision < 0.95 or LLM Faithfulness Score < 1.0 condition checks |
| 3 | Automatic rollback | API Gateway + runtime controls | Traffic reroute to previous stable version | Immediate containment of discrepancy propagation |
| 4 | Immutable logging | Audit pipeline | WORM log entry with trigger statistics | Post-event reproducibility and forensic trace |
| 5 | Investigation phase | Data Science + SRE | Root-cause investigation records | Verified correction before new candidate proposal |

- Incident Response Phases:

| Phase | Trigger Focus | Primary Owner | Required Internal Validation Focus |
|---|---|---|---|
| Faz 1: Tanımlama ve Ön Triyaj | Classify incident source (infrastructure vs model/schema drift) and severity | On-call SRE + Data Science Lead | Severity classification and rollback-state verification |
| Faz 2: Regüle Edilmiş Tırmandırma ve Sınırlandırma | Escalate and contain high-impact integrity events | CCO + C-Suite | Controlled external communication and evidence-flow containment |
| Faz 3: İyileştirme ve Adli Analiz | Isolate faulty payload intervals and validate remediation in shadow | Chief Data Scientist + Senior DevOps | Schema drift comparison and signed remediation record |
| Faz 4: Olay Sonrası İnceleme ve Yasal Kapanış | Produce immutable post-mortem and closure package | CCO | Reproducibility proof and formal closure reporting |

Canonical Consistency Checks (MVP)

| Check Group | Check Name | Inputs | Comparison / Validation | Evidence Output (what must be logged) |
|---|---|---|---|---|
| Deployment Validation | Shadow Output Parity | Active vs candidate Evidence Packs | Deterministic comparison | Regression Delta record when mismatch/discrepancy appears |
| Deployment Validation | Narrative Metric Consistency | LLM outputs from active vs shadow prompts | ROUGE-L and Exact Match comparison | Metric evidence and confidence-interval breach flag |
| Rollback Safety | Rule Precision Guard | Live Rule Precision metric | Trigger when `Rule Precision < 0.95` | Auto-rollback trigger evidence |
| Rollback Safety | LLM Faithfulness Guard | LLM Faithfulness Score | Trigger when score `< 1.0` | Auto-rollback trigger evidence |
| Config Governance | Versioned Config Enforcement | Semantic version tags + threshold manifests | Versioned control consistency check | Version-tag audit evidence |
| Cryptographic Integrity | Merkle/WORM Integrity Check | Anchored artifacts and root verification | Cryptographic integrity validation | Root verification evidence and immutable log proof |
| Access Governance | Multi-Signature Deployment Authorization | Deployment manifest signatures | Separation-of-duties validation | Signature-completion evidence |

Evidence Output Contract
- Output Artifacts (as stated):
  - Document Integrity & Evidence Report.
  - Evidence Pack outputs used for active-vs-shadow comparison.
  - Persistent immutable logs (WORM) for deployment and rollback events.
- Output Field Notes (explicitly stated in source):
  - Semantic version metadata is injected into produced reports (example `"version": "0.1"`).
  - Shadow comparison includes check mismatch (`check_id mismatch`), metric deltas, and JSON path deltas.

Operational Notes
- Severity Level table defines SEV-1 to SEV-4 operational impact and response windows.
- Access model enforces least privilege with RBAC and read-only consumption for Client Administrators.
- Multi-Signature Governance Protocol requires independent signatures from designated isolated roles (example roles explicitly listed in source: Lead Data Scientist, Senior DevOps Engineer, Compliance Officer).
- Key management and custody details explicitly stated:
  - HSM-based custody for private cryptographic materials.
  - 90-day automatic key rotation.
  - Access via hardware MFA devices such as FIDO2 using short-lived time-bound tokens.
- Routine checklist includes daily drift/schema checks and weekly shadow/regression and Merkle/root verification controls.

Open Questions
- Not explicitly stated: module version value.
- Not explicitly stated: temperature=0.0 setting (this exact setting is not present in this source file).
- Not explicitly stated: numeric confidence-interval bounds for ROUGE-L / Exact Match gate conditions.
- Not explicitly stated: a dedicated MVP Extraction Boundaries mapping table.
- Not explicitly stated: FIPS 140-3 Level 3 qualifier for the HSM boundary in this source file.
