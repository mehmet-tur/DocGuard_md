✅ 03 — Canonical Output — Audit Log Design and Implementation Report.md

Module Metadata
- Module Name: Append-only Audit Log Design Report
- Source File ID: Audit Log Design and Implementation Report.md
- Version: Not explicitly stated in this file.

Purpose
- Compares tamper-evident architecture primitives for append-only audit logging.
- Defines an MVP hybrid pipeline for e-Fatura audit evidence integrity and verification.
- Specifies audit log entry data contract fields for deterministic verification.
- Defines verification workflows for inclusion proof and consistency proof validation.
- Defines resilience and recovery mechanisms for logging pipeline failure scenarios.

MVP Scope
- MVP Boundary Principle:
  - The architecture combines hash-chain sequential integrity, Merkle-based proof efficiency, and WORM archival immutability.
- Ingestion Scope:
  - Evidence Packs emitted for HARD, CONTEXT, and GRAPH checks on UBL-TR documents.
  - OpenTelemetry collector ingestion with persistent disk-backed queue.
- Comparative Assessment of Architectural Primitives:

| Dimension | Hash Chain | WORM Storage | Merkle Tree |
| :---- | :---- | :---- | :---- |
| **Integrity Model** | Linear mathematical linkage | Policy-driven infrastructure lock | Hierarchical mathematical tree |
| **Verification Efficiency** | Slow for large logs (linear replay) | Limited to object existence | Highly efficient (logarithmic proof) |
| **Tamper Granularity** | Detects any modification | Prevents deletion/overwrite | Detects inclusion and gaps |
| **Implementation Complexity** | Low - Minimal state required | Moderate - IAM/Bucket configuration | High - Requires tree management |
| **Storage Overhead** | Minimal - 1 hash per entry | Zero - Infrastructure feature | Moderate - Storage for tree nodes |
| **Proof Portability** | Low - Requires full log replay | Zero - No cryptographic proof | High - Compact inclusion proofs |
| **Regulatory Standing** | Accepted for internal control | Mandatory for SEC/FINRA/GİB | Standard for transparency logs |

- Recommended MVP Architecture: The Hybrid Immutable Pipeline
  - Uses hash chains for real-time sequential integrity.
  - Uses Merkle trees for efficient batch verification and compact external proofs.
  - Uses WORM storage for permanent tamper-resistant archival.
  - Uses layered separation where application handles cryptographic construction and infrastructure enforces storage immutability.
- MVP Validations (Computational Core):
  - Deterministic canonicalization and hash computation validation before chaining.
  - prev_hash linkage validation for append sequence continuity.
  - Merkle inclusion proof validation against published Signed Tree Head.
  - Merkle consistency proof validation between two time points.
  - Signature validation for producer non-repudiation evidence.
  - Review Priority Scoring (RPS) reconstruction validation from stored rule signals and weights.

Actors & Core Entities
- Actors:

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
|---|---|---|
| e-invoice engine | Evidence producer | Emits Evidence Packs for HARD/CONTEXT/GRAPH checks |
| OpenTelemetry collector | Ingestion collector | Captures events and persists queue during partition/restart cases |
| Hashing service | Processing service | Canonicalizes payload, computes SHA-256, links chain, batches Merkle tree |
| Archival storage service | Archive layer | Stores raw logs, Merkle nodes, signed roots in WORM storage |
| Auditor | Independent verifier | Performs inclusion, consistency, and signature validation steps |
| KMS/HSM-backed signer | Cryptographic signer | Signs log entries and enforces key isolation controls |

- Core Entities:

| Entity | Definition (from input) | Primary Identifiers / Fields |
|---|---|---|
| Audit log entry | Fundamental unit of cryptographic evidence | entry_id, timestamp, sequence_number, prev_hash, doc_uuid, invoice_id, actor_identity, input_file_hash, evidence_pack, rps_data, audit_trace, signature |
| Evidence Pack | Validation findings sub-object for forensic explainability | rules, metrics, paths, JSON Pointers |
| Signed Tree Head (STH) | Published root commitment for verification | Merkle Root + signature context |
| Merkle Path | Inclusion proof inputs | Sibling hashes for entry verification |
| Chain link | Sequential integrity pointer | prev_hash + current entry hash relationship |

Workflows
- Workflow A - Architectural Components and Data Flow

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Ingestion Stage | e-invoice engine, OpenTelemetry collector | Evidence Packs | Queue durability validation under network/service failures |
| 2 | Processing Stage | Hashing service | Canonical JSON entry, SHA-256 digest, chain link, Merkle batches | Canonicalization consistency check and chain-link validation |
| 3 | Archival Stage | Archival storage service | Raw logs, Merkle nodes, signed roots, anchored root copies | Archive immutability validation and anchoring completeness check |

- Workflow B - Inclusion Proofs and Spot-Checking

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Data retrieval | Auditor | Log entry, leaf hash, Merkle Path | Retrieved artifact completeness validation |
| 2 | Path reconstruction | Auditor | Recomputed path hashes | Iterative hash-combine validation |
| 3 | Root comparison | Auditor | Recomputed root vs published STH | Inclusion consistency check |

- Workflow C - Consistency Proofs and Chain Integrity

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
|---|---|---|---|---|
| 1 | Select two time points | Auditor | Old/new tree states | Prefix relationship validation scope |
| 2 | Verify subtree incorporation | Auditor | Consistency proof hashes | Append-only growth consistency check |
| 3 | Confirm continuity | Auditor | Verification result | Historical gap/discrepancy detection |

Canonical Consistency Checks (MVP)
- Check Catalog (closed-loop):

| Check Group | Check Name | Inputs | Comparison / Validation | Evidence Output |
|---|---|---|---|---|
| Chain Integrity | Linear hash chain continuity | prev_hash, current hash | Recursive linkage validation | Broken-link discrepancy evidence |
| Canonicalization | Deterministic JSON form | JSON entry payload | RFC 8785 canonicalization before hashing | Canonical form evidence for recomputation |
| Inclusion | Merkle inclusion proof | Leaf hash, Merkle Path, STH | Recomputed root equals published root | Inclusion validation evidence |
| Consistency | Merkle append-only growth | Old/new tree states + proof | Old tree is prefix of new tree | Consistency validation evidence |
| Signature | Producer authenticity | Entry payload + signature + public key | Asymmetric signature verification | Non-repudiation evidence |
| Scoring Traceability | RPS reconstruction | Triggered rules, category weights, final score | Stored weights/signals match final score | Decision-path evidence |

Evidence Output Contract
- Audit Log Entry Specification and Schema Design:

| Field Name | Data Type | Forensic Utility and Requirement |
| :---- | :---- | :---- |
| entry_id | UUID v4 | Provides a unique, non-sequential identifier for global tracing. |
| timestamp | ISO-8601 | The UTC time of the event, synchronized via NTP for temporal ordering. |
| sequence_number | UInt64 | A monotonic counter to detect missing or reordered entries. |
| prev_hash | SHA-256 | The hash of the prior entry, establishing the linear chain. |
| doc_uuid | UUID | The cbc:UUID from the UBL-TR invoice, linking the log to the document. |
| invoice_id | String(16) | The mandatory GİB-formatted invoice ID for regulatory cross-reference. |
| actor_identity | String | SPIFFE-compliant identifier for the service that generated the entry. |
| input_file_hash | SHA-256 | The digest of the raw XML/JSON source to prove document integrity. |
| evidence_pack | Object | The strict findings of the validation engine (rules, metrics, paths). |
| rps_data | Object | The components (weights, caps, score) used to calculate the priority score. |
| audit_trace | Array | A narrative list of logic steps for human/AI explainability. |
| signature | Ed25519 | The cryptographic signature of the producer for non-repudiation. |

- Evidence Pack and explainability constraints:
  - evidence_pack includes triggered-value evidence plus JSON Pointer locations.
  - audit_trace follows No-Synonyms Narration Policy using exact schema identifiers.

Implementation Notes (storage-neutral)
- Uses a Sidecar pattern to isolate audit logic from core invoicing engine performance path.
- Uses persistent disk-backed queue at ingestion.
- Uses periodic Merkle aggregation over chained entries.
- Uses WORM-enabled archival plus independent anchoring location.
- Uses centralized hardware-backed key management for signing operations.
- Uses alias-based key rotation every 90 days with retained historical public-key verification capability.
- Uses SPIFFE/SVID identity checks for key usage authorization and separation-of-duties controls.
- Uses Outbox Pattern and persistent queuing for dual-write failure mitigation, as stated.

Operational Notes
- Failure Analysis and Recovery Table:

| Failure Scenario | Recovery Mechanism | Forensic Impact |
| :---- | :---- | :---- |
| **Collector Crash** | Persistent disk queue resumes transfer upon restart. | No data loss; logs delayed but complete. |
| **KMS API Timeout** | Exponential backoff and retry; local buffering. | Latency increase; sequential order preserved. |
| **S3 Bucket Lockdown** | Secondary region failover; emergency storage. | High availability; audit trail remains intact. |
| **NTP Clock Drift** | Flag as anomaly; use monotonic sequence for ordering. | Temporal ordering verifiable via sequence. |
| **Logic Bug in Rule** | Versioning and Evidence Pack allow for retroactive fix. | Decisions traceable to specific rule version. |
| **Database Corruption** | Replay Merkle logs from the WORM archival layer. | Full state recovery of business data. |

- Key compromise recovery sequence is explicitly defined with revocation, compromise event logging, forensic quarantine, and optional re-signing.
- Frequent external anchoring is used to reduce truncation/resurrection attack window.

Open Questions
- Not explicitly stated in this file: concrete anchoring interval value for publishing Merkle roots.
- Not explicitly stated in this file: exact retention duration configuration for WORM archival.
- Not explicitly stated in this file: full JSON Schema keyword-level definition beyond field table and canonicalization requirement.
- Not explicitly stated in this file: exact queue sizing and backpressure thresholds for ingestion collector.
