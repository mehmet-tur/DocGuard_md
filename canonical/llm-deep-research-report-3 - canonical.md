✅ 03 — Canonical Output — llm-deep-research-report-3.md

Module Metadata
- Module Name: LLM Deployment & Safety ADR
- Source File ID: llm-deep-research-report-3.md
- Version: Not explicitly stated.

Purpose
- DocGuard / BelgeKalkanı MVP’de LLM katmanını narrator-only ve deterministik çıktı sınırlarıyla tanımlamak.
- UBL-TR 1.2 tabanlı deterministik doğrulama hattı ile LLM anlatım hattı arasındaki rol ayrımını netleştirmek.
- PII koruması için Tokenization Gateway katmanını zorunlu veri sınırı olarak konumlandırmak.
- No-Synonyms ve temperature=0.0 politikaları ile tekrar üretilebilir anlatı davranışını standartlaştırmak.
- Prompt injection ve PII leakage riskleri için çok katmanlı kontrol setini belirlemek.

MVP Scope
- MVP Boundary Principle:
  - LLM yalnızca anlatım üretir; karar, skor, kabul/red mantığı üretmez.
  - LLM yalnızca tokenized/redacted Evidence Pack üzerinden çalışır.
  - Deterministic Rule Engine ve Evidence Pack Generator olmadan narration akışı başlatılamaz.
- Ingestion Scope:
  - UBL-TR XML’den türetilmiş Canonical JSON ve Evidence Pack girdileri.
  - Tokenization Gateway sonrası maskelenmiş alanlar.
  - İç ağda çalışan LLM hizmeti (on-prem / VPC-isolated, no external API calls).
- MVP Extraction Boundaries (Explicitly Mapped Fields):

| Category | Document | Extracted Fields (as stated) |
|---|---|---|
| Canonical identifiers | Evidence Pack/Canonical JSON | `check_id`, `check_type`, `metrics`, `paths`, canonical JSON paths |
| Sensitive identifiers (tokenized) | Tokenization Gateway | `VKN_[HASH]`, `TCKN_[HASH]`, `IBAN_[INDEX]`, `COMPANY_[INDEX]`, `EMAIL_[HASH]`, `PHONE_[HASH]` |
| Runtime determinism knobs | LLM runtime | `temperature=0.0`, no-synonyms policy |
| Infra profile | Deployment | `vLLM (v0.5.0+)`, optional `llama.cpp` fallback, on-prem/VPC isolated execution |

Actors & Core Entities
- Actors:

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
|---|---|---|
| Deterministic Rule Engine | Decision source | Rule evaluation and deterministic evidence production |
| Evidence Pack Generator | Evidence producer | Structured, machine-verifiable finding payload |
| Tokenization Gateway | Privacy boundary | PII redaction/tokenization before LLM ingestion |
| LLM Narration Engine | Narrator | Deterministic narration from masked evidence only |
| Output Validator | Output gate | Schema, lexical fidelity, and contradiction checks |

- Core Entities:

| Entity | Definition (from input) | Primary Identifiers / Fields |
|---|---|---|
| Canonical JSON | Deterministic commercial truth representation | Canonical JSON field set from UBL-TR pipeline |
| Evidence Pack | Deterministic finding object | `check_id`, `check_type`, `metrics`, `paths`, evidence fields |
| Tokenization mapping store | Isolated reverse-lookup store | HSM-encrypted mapping records |
| Deterministic Narration Prompt | Lexical boundary policy | No interpretation/no synonyms constraints |

Workflows
- Workflow A — Deterministic Narration Flow

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Deterministic rules run | Deterministic Rule Engine | Canonical JSON | Rule-level consistency check |
| 2 | Evidence generated | Evidence Pack Generator | Evidence Pack | Evidence completeness validation |
| 3 | PII tokenization/redaction | Tokenization Gateway | Tokenized Evidence Pack | PII masking validation |
| 4 | Narration generation | LLM Narration Engine | Narrative output | No-synonyms and determinism validation |
| 5 | Output gate | Output Validator | Accepted/rejected output | Draft-07/schema/field-fidelity validation |

- Workflow B — Prompt Injection Mitigation Flow

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Untrusted field detection | Tokenization Gateway | Candidate text segments | Untrusted field spotlighting validation |
| 2 | Deterministic prompt enforcement | LLM Runtime | Narration prompt | No instruction override acceptance validation |
| 3 | Post-generation verification | Output Validator | Narrative output | Contradiction/mismatch and schema validation |

Canonical Consistency Checks (MVP)
- Check Catalog (Closed-Loop):

| Check Group | Check Name | Inputs | Comparison / Validation | Evidence Output |
|---|---|---|---|---|
| Role separation | Narrator-only enforcement | Evidence Pack + LLM output | LLM decision mutation is disallowed | Role-boundary validation evidence |
| Lexical fidelity | No-Synonyms enforcement | LLM output + canonical field names | Canonical identifiers must remain unchanged | Lexical mismatch evidence |
| Determinism | Temperature lock | Same input replay | Same input -> same output validation | Replay consistency evidence |
| Privacy boundary | Tokenization gate | Raw evidence fields | Raw PII must not pass into narration context | PII masking evidence |
| Output contract | Schema/contract gate | Narration payload | Draft-07-compatible output validation | Rejection/acceptance evidence |

Evidence Output Contract
- Output Artifacts (as stated):
  - Tokenized/redacted Evidence Pack.
  - Deterministic narration output.
  - Validation gate pass/fail record.

- JSON Payload — Canonical Field Set:

| Field Group | Included Fields (Minimum) | Notes / Constraints (from input) |
|---|---|---|
| Evidence identity | `check_id`, `check_type` | Deterministic traceability keys |
| Evidence metrics | `metrics`, `paths` | Canonical evidence references |
| Tokenized PII | `VKN_`, `TCKN_`, `IBAN_`, `COMPANY_`, `EMAIL_`, `PHONE_` | Must be masked before LLM ingestion |
| Narration metadata | Determinism/no-synonyms compliance flags | Output validator must enforce |

Implementation Notes (storage-neutral)
- Inference runtime as stated: `vLLM (v0.5.0+)` with optional `llama.cpp` fallback.
- Runtime determinism lock: `temperature=0.0`.
- Zero-exfiltration stance: no external LLM API calls.
- Reverse-lookup/token mapping store is isolated and HSM-encrypted.

Operational Notes
- On-prem / VPC-isolated deployment profile is stated.
- Auditability path includes OpenTelemetry collection and canonicalized audit-hash operations.
- Session-scoped token lifecycle and auto-purge after report generation are stated.

Open Questions
- Not explicitly stated in this file: complete required/optional matrix for narration payload fields.
- Not explicitly stated in this file: explicit collision-handling workflow details for truncated token display values.
- Not explicitly stated in this file: fixed numeric threshold for automatic Human-in-the-Loop escalation.
