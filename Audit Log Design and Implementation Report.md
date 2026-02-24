# **Append-only Audit Log Design Report**

## **Comparative Analysis of Tamper-Evident Architectures**

The selection of a cryptographic architecture for audit logging requires a rigorous evaluation of the trade-offs between sequential integrity, verification efficiency, and infrastructure complexity. Modern forensic requirements dictate that a log must not only be immutable but also independently verifiable by third parties without requiring access to the original production environment. This comparative analysis examines three dominant architectural paradigms: linear cryptographic hash chains, policy-driven Write-Once-Read-Many (WORM) storage, and hierarchical Merkle-style hash trees.

### **Cryptographic Hash Chains and Linear Integrity**

The cryptographic hash chain is the foundational primitive for achieving forward security in digital record-keeping. In this model, each log entry is inextricably linked to its predecessor through a recursive hashing process. For any given entry ![][image1], the system computes a digest ![][image2] by concatenating the hash of the previous entry ![][image3] with the current message ![][image1], expressed mathematically as ![][image4], where ![][image5] denotes a secure, collision-resistant hash function such as SHA-256.1 This linear dependency ensures that any alteration to a historical record ![][image6] (where ![][image7]) propagates through every subsequent link, effectively breaking the chain and making tampering immediately detectable.3  
While hash chains offer high simplicity and low computational overhead during the "append" operation, they present significant challenges during the "verify" operation. To prove the integrity of the ![][image8]\-th record, an auditor is required to recompute all ![][image8] hashes from the genesis block onward, a process with ![][image9] complexity.5 For high-volume environments—such as those processing millions of e-invoice (e-Fatura) validations—this linear cost becomes a bottleneck for real-time auditing. Furthermore, hash chains are vulnerable to "truncation attacks" where an adversary deletes the most recent entries of the log. Because the internal links of the remaining records remain consistent, the auditor may not realize that the tail of the log has been discarded unless the head of the chain is periodically anchored to a trusted external system.1

### **Write-Once-Read-Many (WORM) Storage Systems**

WORM storage represents a shift from mathematical integrity to infrastructure-level policy enforcement. In this paradigm, immutability is guaranteed by the storage medium or the cloud-service provider rather than by the application logic. Technologies such as AWS S3 Object Lock and Azure Immutable Blob Storage allow organizations to set retention periods during which data cannot be overwritten or deleted.7 These systems are often classified into "Compliance" and "Governance" modes. In Compliance mode, the lock is absolute, preventing even the root administrative account from altering the data, which satisfies the most stringent regulatory requirements such as SEC Rule 17a-4(f) and FINRA Rule 4511\.8  
WORM systems excel in protecting against bulk deletion and ransomware attacks, but they operate at a coarse granularity. They ensure that an object, once written, remains unchanged, but they do not inherently provide proof of sequential completeness or the order of operations.10 Without an accompanying cryptographic layer, an administrator could potentially omit a log entry before it is written to the WORM bucket, creating a gap in the audit trail that would be invisible to the infrastructure-level lock. Consequently, WORM is best utilized as a physical enforcement layer that complements a cryptographic integrity layer.12

### **Hierarchical Merkle-Style Hash Trees**

Merkle trees provide a sophisticated mechanism for batching and verifying log entries with logarithmic efficiency. A Merkle tree is a binary hash tree where each leaf node is a hash of a data block, and each non-leaf node is the hash of its direct children.13 This hierarchy culminates in a single "Merkle Root" which acts as a compact cryptographic commitment for the entire set of records.15 The primary advantage of this structure is the "Inclusion Proof," which allows an auditor to verify that a specific entry exists within a log of size ![][image10] by checking only ![][image11] sibling hashes.14  
This architectural choice is particularly robust for "transparency logs" where multiple stakeholders (e.g., banks, buyers, and regulators) need to verify specific subsets of a log without revealing or processing the entire dataset.6 Merkle trees also support "Consistency Proofs," which verify that a log has only been appended to and that no historical data has been altered between two points in time.14 While more complex to implement than simple hash chains, the scalability and proof-efficiency of Merkle trees make them the industry standard for verifiable auditing in distributed systems.20

### **Comparative Assessment of Architectural Primitives**

The following table compares the three designs across key operational and security dimensions, highlighting their suitability for an append-only audit log:

| Dimension | Hash Chain | WORM Storage | Merkle Tree |
| :---- | :---- | :---- | :---- |
| **Integrity Model** | Linear mathematical linkage | Policy-driven infrastructure lock | Hierarchical mathematical tree |
| **Verification Efficiency** | **![][image9]** \- Slow for large logs | ![][image12] \- Limited to object existence | ![][image13] \- Highly efficient |
| **Tamper Granularity** | Detects any modification | Prevents deletion/overwrite | Detects inclusion and gaps |
| **Implementation Complexity** | Low \- Minimal state required | Moderate \- IAM/Bucket configuration | High \- Requires tree management |
| **Storage Overhead** | Minimal \- 1 hash per entry | Zero \- Infrastructure feature | Moderate \- Storage for tree nodes |
| **Proof Portability** | Low \- Requires full log replay | Zero \- No cryptographic proof | High \- Compact inclusion proofs |
| **Regulatory Standing** | Accepted for internal control | Mandatory for SEC/FINRA/GİB | Standard for transparency logs |

1

## **Recommended MVP Architecture: The Hybrid Immutable Pipeline**

Based on the comparative analysis and the specific requirements of the Turkish trade finance ecosystem (UBL-TR 1.2), the recommended architecture for the MVP is a hybrid layered system. This design utilizes hash chains for real-time sequential integrity, Merkle trees for efficient batch verification, and WORM storage for permanent, tamper-proof archival. This multi-layered approach ensures that the system is resilient to both administrative compromise and high-volume processing demands.

### **Rationale for the Hybrid Approach**

The decision to adopt a hybrid model is driven by the need to balance immediate "forward security" with long-term "forensic efficiency." In the e-invoice validation process, rules must be evaluated sequentially to determine the "Review Priority Score" (RPS).22 A hash chain provides an immediate, low-latency method to bind these evaluations together as they occur. However, because an auditor may need to verify a single disputed invoice among millions, the addition of a Merkle tree layer allows for the generation of compact proofs that can be shared with external parties without exposing the entire audit log.6  
Furthermore, anchoring the cryptographic root hashes into WORM storage addresses the "separation of duties" principle. The application layer handles the cryptographic construction, while the infrastructure layer (e.g., AWS S3 Object Lock) provides a physical barrier against deletion, even if the application's service account is compromised.9 This satisfies the GİB (Revenue Administration) requirements for immutable record-keeping while providing the technical transparency needed for automated trade finance workflows.22

### **Architectural Components and Data Flow**

The architecture follows a "Sidecar" pattern to ensure that the audit logic does not impact the performance of the core invoicing engine. The pipeline is divided into three primary stages: ingestion, processing, and archival.

1. **Ingestion Stage:** The e-invoice engine emits "Evidence Packs" for every HARD, CONTEXT, and GRAPH check performed on a UBL-TR document.22 These events are captured by an OpenTelemetry collector, which uses a persistent disk-backed queue to ensure no data is lost during network partitions or service restarts.10  
2. **Processing Stage:** The hashing service retrieves events from the queue and applies a deterministic canonicalization (RFC 8785\) to the JSON payloads. It then computes a SHA-256 hash for the entry and links it to the previous hash, creating a linear chain. Periodically, these chained entries are aggregated into a Merkle tree.3  
3. **Archival Stage:** The raw log entries, the Merkle tree nodes, and the periodic signed roots are exported to a WORM-enabled S3 bucket. The roots are also "anchored" by publishing them to a secondary, independent system—such as a dedicated security account or a distributed ledger—to provide a tamper-evident "timestamp" that prevents retroactive history modification.6

### **Integration with Review Priority Scoring (RPS)**

The audit log is not merely a record of data but a record of decision-making logic. The architecture explicitly integrates the "Review Priority Score" (RPS), which is a weighted metric derived from the triggered rules. Hard Checks (H-Series) carry the highest weights (e.g., 10 points), while Context Signals (C-Series) carry lower weights (e.g., 1 point).22 The audit log entry captures the raw signals, the category weights, and the final RPS calculation.22 This allows an auditor to reconstruct the "path to intervention" and verify why a specific invoice was flagged for manual review or rejected by the system.22

## **Audit Log Entry Specification and Schema Design**

The audit log entry is the fundamental unit of evidence. To ensure interoperability between the logging system, third-party auditors, and AI-driven forensic agents, the entry must follow a strict data contract. The design utilizes a Draft-07 JSON Schema to enforce type safety and mandatory fields.22

### **Core Schema Definition and Data Fields**

Each audit log entry must be a self-contained cryptographic object. The schema is designed to be "append-only," meaning that once a version of the schema is deployed, fields can be added but never removed or modified in a way that breaks historical parsers.

| Field Name | Data Type | Forensic Utility and Requirement |
| :---- | :---- | :---- |
| entry\_id | UUID v4 | Provides a unique, non-sequential identifier for global tracing.4 |
| timestamp | ISO-8601 | The UTC time of the event, synchronized via NTP for temporal ordering.24 |
| sequence\_number | UInt64 | A monotonic counter to detect missing or reordered entries.4 |
| prev\_hash | SHA-256 | The hash of the prior entry, establishing the linear chain.1 |
| doc\_uuid | UUID | The cbc:UUID from the UBL-TR invoice, linking the log to the document.22 |
| invoice\_id | String(16) | The mandatory GİB-formatted invoice ID for regulatory cross-reference.22 |
| actor\_identity | String | SPIFFE-compliant identifier for the service that generated the entry.6 |
| input\_file\_hash | SHA-256 | The digest of the raw XML/JSON source to prove document integrity.10 |
| evidence\_pack | Object | The strict findings of the validation engine (rules, metrics, paths).22 |
| rps\_data | Object | The components (weights, caps, score) used to calculate the priority score.22 |
| audit\_trace | Array | A narrative list of logic steps for human/AI explainability.22 |
| signature | Ed25519 | The cryptographic signature of the producer for non-repudiation.2 |

### **Deterministic Hashing and Canonicalization**

A primary challenge in JSON-based audit logs is that semantically identical objects can produce different hashes if the field order or whitespace differs. To resolve this, the MVP mandates the use of RFC 8785 (JSON Canonicalization Scheme).3 Before any hash is computed or signature is applied, the JSON entry is transformed into a standard representation where keys are sorted alphabetically and all unnecessary whitespace is removed. This ensures that an auditor recomputing the hash from the log entry will always arrive at the same digest as the producer, preventing false tamper alarms.3

### **The Evidence Pack and Explainability**

The evidence\_pack sub-object is the core of the forensic record. It includes not only the values that triggered a rule (e.g., a discrepancy between lines.net\_amount and totals.line\_extension) but also the "JSON Pointers" to the exact locations in the UBL-TR XML where the data was found.22  
The architecture also implements a "No-Synonyms Narration Policy." This policy dictates that the audit\_trace field must use exact identifiers from the data schema. For example, instead of saying "The tax ID is too short," the trace must state "The supplier.vkn length is 9, which is less than the required 10".22 This deterministic language is crucial for "Explainable AI" (XAI) requirements, ensuring that when an LLM or an automated agent narrates a finding to a user, it remains strictly faithful to the underlying data contract.3

## **Cryptographic Key Management and Identity**

The security of the append-only log is entirely dependent on the protection of the private keys used to sign the entries. If an adversary gains control of the signing key, they can generate fraudulent log entries that appear legitimate to the auditor. Therefore, the MVP employs a centralized, hardware-backed key management strategy.

### **Hardware Security Modules and FIPS 140-3 Compliance**

All cryptographic operations, including key generation and signing, must take place within a Hardware Security Module (HSM). The architecture utilizes AWS KMS or Azure Key Vault, configured for FIPS 140-3 Level 3 compliance.26 At this level, the HSM provides physical tamper-evidence and ensures that private keys can never be exported in plaintext. When the e-invoice engine needs to sign an entry, it sends the hash to the KMS Sign API; the HSM performs the operation and returns the digital signature, ensuring the private key remains isolated from the application memory.27

### **Lifecycle, Rotation, and Alias Management**

The management of keys follows a strict lifecycle to minimize the impact of a potential compromise. The system implements "Alias Swapping" for key rotation.29 The application signs logs using a persistent alias (e.g., alias/log-signer). Every 90 days, a new key version is generated, and the alias is updated to point to the new key. This allows the system to continue operating without code changes while reducing the volume of data signed by any single key.30  
Historical public keys are never deleted; they are moved to a "Deactivated" state in the KMS, allowing auditors to verify older logs while preventing the keys from being used for new signatures.32 The deletion of a key is a "privileged action" requiring multi-person approval (quorum) and a mandatory 7-to-30 day waiting period to prevent accidental or malicious data loss.27

### **Access Control and Identity Attestation**

Access to the signing keys is governed by identity-based policies. The MVP utilizes SPIFFE (Secure Production Identity Framework for Everyone) to provide verifiable identities to the workloads.6 Before the KMS allows a service to use a signing key, the service must present a valid SVID (SPIFFE Verifiable Identity Document). This ensures that only the authorized e-invoice validation service can produce logs. Furthermore, the "Separation of Duties" is enforced by ensuring that the account used to *produce* logs has no permission to *manage* the keys or *configure* the WORM storage buckets.31

## **Auditor Verification Workflows**

The verification workflow is the process by which an independent auditor confirms that the log is complete, accurate, and untampered. The hybrid design supports two primary verification modes: "Real-time Streaming Verification" and "Post-hoc Forensic Audit."

### **Inclusion Proofs and Spot-Checking**

When an auditor needs to verify a specific transaction—for instance, to confirm that a trade finance applicant's invoice passed all HARD checks—the system provides a Merkle Inclusion Proof.

1. **Data Retrieval:** The auditor receives the log entry for the invoice, the entry's leaf hash, and the Merkle Path (a list of sibling hashes).14  
2. **Path Reconstruction:** The auditor recomputes the hash of the entry and iteratively combines it with the hashes in the path.13  
3. **Root Comparison:** The auditor compares the final recomputed hash with the "Signed Tree Head" (STH) that was previously published to a trusted location.18 If the hashes match, it is mathematically certain that the entry was part of the original log and has not been modified.15

### **Consistency Proofs and Chain Integrity**

To verify that the entire log is an unbroken, append-only sequence, the auditor performs a Consistency Proof between two points in time (![][image14] and ![][image15]). This proof demonstrates that the Merkle Root at ![][image14] is a prefix of the tree at ![][image15].14 This prevents "history rewriting" attacks where an adversary might present a consistent log for the current period but has surreptitiously removed records from a prior period.19 The proof involves checking that the hashes of the "old" subtrees are correctly incorporated into the "new" larger tree structure.19

### **Public-Key Verification and Non-Repudiation**

Every verification step is anchored by the producer's public key. Because the logs are signed with an asymmetric key (e.g., Ed25519), the auditor can prove not only that the data is untampered but specifically *who* produced it.3 This provides non-repudiation, which is critical in legal disputes involving e-invoice validity or trade finance fraud. The auditor does not need to trust the logging service itself; they only need to trust the root of the public key infrastructure (PKI) used to issue the signing certificates.21

## **Resilience and Failure Handling**

An append-only log is only useful if it is highly available and resilient to corruption. The architecture must handle failures gracefully, ensuring that audit events are never lost and that tampering is always detectable.

### **Persistent Queuing and Write Safety**

The "Dual Write" problem—where a business transaction succeeds but the audit log write fails—is mitigated through the "Outbox Pattern" and persistent queuing. Before an invoice validation is finalized, the audit event is written to a local "Outbox" table in the application's primary database within the same transaction.4 A background relay service then reads from this table and pushes the event to the OpenTelemetry persistent queue. This ensures that as long as the database transaction succeeds, the audit trail is guaranteed to eventually reach the append-only storage.4

### **Key Compromise and Recovery Procedures**

In the event that a signing key is suspected of being compromised, the system triggers an emergency revocation and recovery protocol:

1. **Immediate Revocation:** The key is disabled in the KMS, preventing any further signatures from being generated.31  
2. **Incident Logging:** A "Key Compromise Event" is appended to the log (using a new key) to mark the point in time where the integrity of previous logs may be in question.31  
3. **Forensic Quarantine:** All log entries signed by the compromised key during the "window of vulnerability" are flagged for manual forensic review. The auditor must cross-reference these logs against secondary data sources (e.g., database backups or GİB's own records) to identify any fraudulent entries.30  
4. **Re-signing (Optional):** If the data itself is verified to be accurate, the records may be re-signed with a new, secure key to restore their verifiable status, though the original compromised signatures are retained as evidence.30

### **Mitigating "Resurrection" and "Truncation" Attacks**

A "Resurrection Attack" occurs when an adversary deletes a record and then later "resurrects" it with different data, while a "Truncation Attack" involves deleting the most recent records. To prevent these, the system utilizes "Persistent Authenticated Dictionaries" (PADs) and frequent anchoring.34 By publishing the Merkle Root to an external, immutable system (like a public blockchain or a specialized WORM vault in a different cloud region) every few minutes, the "tamper window" is significantly narrowed.25 An attacker would have to compromise both the primary logging system and the external anchoring system simultaneously to successfully hide a truncation or resurrection.1

### **Failure Analysis and Recovery Table**

The following table summarizes the response strategies for various failure modes in the audit log pipeline:

| Failure Scenario | Recovery Mechanism | Forensic Impact |
| :---- | :---- | :---- |
| **Collector Crash** | Persistent disk queue resumes transfer upon restart.10 | No data loss; logs delayed but complete. |
| **KMS API Timeout** | Exponential backoff and retry; local buffering.30 | Latency increase; sequential order preserved. |
| **S3 Bucket Lockdown** | Secondary region failover; emergency storage.7 | High availability; audit trail remains intact. |
| **NTP Clock Drift** | Flag as anomaly; use monotonic sequence for ordering.4 | Temporal ordering verifiable via sequence. |
| **Logic Bug in Rule** | Versioning and Evidence Pack allow for retroactive fix.22 | Decisions traceable to specific rule version. |
| **Database Corruption** | Replay Merkle logs from the WORM archival layer.6 | Full state recovery of business data. |

1

## **Strategic Outlook and Design Evolution**

The hybrid append-only audit log design provides a robust foundation for the e-Fatura and trade finance ecosystem. By combining the immediate forward integrity of hash chains with the scalable verification of Merkle trees and the physical enforcement of WORM storage, the architecture addresses the most critical forensic and regulatory challenges. The integration of "Review Priority Scoring" and "Evidence Packs" ensures that the log is not just a passive repository but an active tool for explainable decision-making and automated triage.  
As the ecosystem evolves, the design is positioned to incorporate advanced primitives such as "Zero-Knowledge Proofs" (ZKPs) for privacy-preserving audits and "Post-Quantum Cryptography" (PQC) to protect against future adversarial capabilities.2 The transition from destructive operations (rollbacks and deletions) to non-destructive, append-only state transitions ensures a complete and unaccountable historical record, making the system a "Cryptographic Flight Recorder" for financial transactions. This design provides the necessary trust and transparency for banks, regulators, and businesses to operate with confidence in a fully digital economy.

#### **Alıntılanan çalışmalar**

1. Tamper-Evident Devices \- Emergent Mind, erişim tarihi Şubat 19, 2026, [https://www.emergentmind.com/topics/tamper-evident-devices](https://www.emergentmind.com/topics/tamper-evident-devices)  
2. Immutable Audit Log Architecture \- Emergent Mind, erişim tarihi Şubat 19, 2026, [https://www.emergentmind.com/topics/immutable-audit-log](https://www.emergentmind.com/topics/immutable-audit-log)  
3. Building Tamper-Evident Audit Trails for Algorithmic Trading: A Deep Dive into Hash Chains and Merkle Trees \- DEV Community, erişim tarihi Şubat 19, 2026, [https://dev.to/veritaschain/building-tamper-evident-audit-trails-for-algorithmic-trading-a-deep-dive-into-hash-chains-and-3lh6](https://dev.to/veritaschain/building-tamper-evident-audit-trails-for-algorithmic-trading-a-deep-dive-into-hash-chains-and-3lh6)  
4. How do you enforce immutability and append‑only audit trails? \- Design Gurus, erişim tarihi Şubat 19, 2026, [https://www.designgurus.io/answers/detail/how-do-you-enforce-immutability-and-appendonly-audit-trails](https://www.designgurus.io/answers/detail/how-do-you-enforce-immutability-and-appendonly-audit-trails)  
5. Building Tamper-Evident Audit Trails: A Developer's Guide to Cryptographic Logging for AI Systems \- DEV Community, erişim tarihi Şubat 19, 2026, [https://dev.to/veritaschain/building-tamper-evident-audit-trails-a-developers-guide-to-cryptographic-logging-for-ai-systems-4o64](https://dev.to/veritaschain/building-tamper-evident-audit-trails-a-developers-guide-to-cryptographic-logging-for-ai-systems-4o64)  
6. Verifiable Audit Logs. The Missing Primitives for Trustworthy… | by Andrew Stevens | Medium, erişim tarihi Şubat 19, 2026, [https://medium.com/@andrew\_sakura/verifiable-audit-logs-1cd98f637c00](https://medium.com/@andrew_sakura/verifiable-audit-logs-1cd98f637c00)  
7. AWS S3 vs. Azure Blob: Enterprise Storage Decision Guide 2025, erişim tarihi Şubat 19, 2026, [https://blog.purestorage.com/purely-educational/aws-s3-vs-azure-blob/](https://blog.purestorage.com/purely-educational/aws-s3-vs-azure-blob/)  
8. Overview of immutable storage for blob data \- Azure \- Microsoft, erişim tarihi Şubat 19, 2026, [https://learn.microsoft.com/en-us/azure/storage/blobs/immutable-storage-overview](https://learn.microsoft.com/en-us/azure/storage/blobs/immutable-storage-overview)  
9. S3 Object Lock | Trend Micro, erişim tarihi Şubat 19, 2026, [https://www.trendmicro.com/trendaivisiononecloudriskmanagement/knowledge-base/aws/S3/object-lock.html](https://www.trendmicro.com/trendaivisiononecloudriskmanagement/knowledge-base/aws/S3/object-lock.html)  
10. How to Build an Immutable Audit Log Pipeline Using OpenTelemetry and Append-Only Storage \- OneUptime, erişim tarihi Şubat 19, 2026, [https://oneuptime.com/blog/post/2026-02-06-immutable-audit-log-pipeline-otel/view](https://oneuptime.com/blog/post/2026-02-06-immutable-audit-log-pipeline-otel/view)  
11. Tamper-proof logs | Identification for Development \- ID4D \- World Bank, erişim tarihi Şubat 19, 2026, [https://id4d.worldbank.org/guide/tamper-proof-logs](https://id4d.worldbank.org/guide/tamper-proof-logs)  
12. S3 Versioning and Object Lock \- S3 Data Protection, erişim tarihi Şubat 19, 2026, [https://objectfirst.com/blog/how-object-first-uses-the-s3-versioning-and-object-lock/](https://objectfirst.com/blog/how-object-first-uses-the-s3-versioning-and-object-lock/)  
13. Merkle Tree and Hash Chain Data Structures with difference \- GeeksforGeeks, erişim tarihi Şubat 19, 2026, [https://www.geeksforgeeks.org/dsa/merkle-tree-and-hash-chain-data-structures-with-difference/](https://www.geeksforgeeks.org/dsa/merkle-tree-and-hash-chain-data-structures-with-difference/)  
14. Marvelous Merkle Trees \- Pangea Cloud, erişim tarihi Şubat 19, 2026, [https://pangea.cloud/blog/marvelous-merkle-trees/](https://pangea.cloud/blog/marvelous-merkle-trees/)  
15. Merkle Trees: Building Blocks of Blockchain Trust \- Lightspark, erişim tarihi Şubat 19, 2026, [https://www.lightspark.com/glossary/merkle-tree](https://www.lightspark.com/glossary/merkle-tree)  
16. Comprehensive Guide to Merkle Trees, Merkle Proofs, and Merkle Roots \- Cyfrin, erişim tarihi Şubat 19, 2026, [https://www.cyfrin.io/blog/what-is-a-merkle-tree-merkle-proof-and-merkle-root](https://www.cyfrin.io/blog/what-is-a-merkle-tree-merkle-proof-and-merkle-root)  
17. Merkle tree \- Wikipedia, erişim tarihi Şubat 19, 2026, [https://en.wikipedia.org/wiki/Merkle\_tree](https://en.wikipedia.org/wiki/Merkle_tree)  
18. Trustworthy AI Agents: Verifiable Audit Logs \- Sakura Sky, erişim tarihi Şubat 19, 2026, [https://www.sakurasky.com/blog/missing-primitives-for-trustworthy-ai-part-5/](https://www.sakurasky.com/blog/missing-primitives-for-trustworthy-ai-part-5/)  
19. Merkle Tree | CrowdStrike \- Pangea, erişim tarihi Şubat 19, 2026, [https://pangea.cloud/docs/audit/merkle-trees](https://pangea.cloud/docs/audit/merkle-trees)  
20. RFC 6962: Certificate Transparency, erişim tarihi Şubat 19, 2026, [https://www.rfc-editor.org/rfc/rfc6962.html](https://www.rfc-editor.org/rfc/rfc6962.html)  
21. How Does Certificate Transparency Work? \- ivision Research Blog, erişim tarihi Şubat 19, 2026, [https://research.ivision.com/how-does-certificate-transparency-work.html](https://research.ivision.com/how-does-certificate-transparency-work.html)  
22. Review Priority Scoring and Triage.md  
23. Tamper Detection in Audit Logs \- Christian Collberg, erişim tarihi Şubat 19, 2026, [https://collberg.cs.arizona.edu/content/research/papers/snodgrass04tamper.pdf](https://collberg.cs.arizona.edu/content/research/papers/snodgrass04tamper.pdf)  
24. Are Electronic Signatures HIPAA Compliant? Requirements, Tools, and Best Practices, erişim tarihi Şubat 19, 2026, [https://www.accountablehq.com/post/are-electronic-signatures-hipaa-compliant-requirements-tools-and-best-practices](https://www.accountablehq.com/post/are-electronic-signatures-hipaa-compliant-requirements-tools-and-best-practices)  
25. HARDLOG: Practical Tamper-Proof System Auditing Using a Novel Audit Device \- Microsoft, erişim tarihi Şubat 19, 2026, [https://www.microsoft.com/en-us/research/wp-content/uploads/2022/04/hardlog-sp22.pdf](https://www.microsoft.com/en-us/research/wp-content/uploads/2022/04/hardlog-sp22.pdf)  
26. Overview of Key Management in Azure | Microsoft Learn, erişim tarihi Şubat 19, 2026, [https://learn.microsoft.com/en-us/azure/security/fundamentals/key-management](https://learn.microsoft.com/en-us/azure/security/fundamentals/key-management)  
27. AWS Key Management Service, erişim tarihi Şubat 19, 2026, [https://docs.aws.amazon.com/kms/latest/developerguide/overview.html](https://docs.aws.amazon.com/kms/latest/developerguide/overview.html)  
28. Asymmetric keys in AWS KMS \- AWS Key Management Service \- AWS Documentation, erişim tarihi Şubat 19, 2026, [https://docs.aws.amazon.com/kms/latest/developerguide/symmetric-asymmetric.html](https://docs.aws.amazon.com/kms/latest/developerguide/symmetric-asymmetric.html)  
29. How to Build Key Management Practices \- OneUptime, erişim tarihi Şubat 19, 2026, [https://oneuptime.com/blog/post/2026-01-30-key-management-practices/view](https://oneuptime.com/blog/post/2026-01-30-key-management-practices/view)  
30. AWS KMS: The Smart Way to Handle Cloud Encryption at Scale \- CloudOptimo, erişim tarihi Şubat 19, 2026, [https://www.cloudoptimo.com/blog/aws-kms-the-smart-way-to-handle-cloud-encryption-at-scale/](https://www.cloudoptimo.com/blog/aws-kms-the-smart-way-to-handle-cloud-encryption-at-scale/)  
31. Explore 8 Best Practices for Cryptographic Key Management \- GlobalSign, erişim tarihi Şubat 19, 2026, [https://www.globalsign.com/en/blog/8-best-practices-cryptographic-key-management](https://www.globalsign.com/en/blog/8-best-practices-cryptographic-key-management)  
32. CMS Key Management Handbook | CMS Information Security and Privacy Program, erişim tarihi Şubat 19, 2026, [https://security.cms.gov/learn/cms-key-management-handbook](https://security.cms.gov/learn/cms-key-management-handbook)  
33. Key management best practices for AWS KMS \- AWS Prescriptive Guidance, erişim tarihi Şubat 19, 2026, [https://docs.aws.amazon.com/prescriptive-guidance/latest/aws-kms-best-practices/key-management.html](https://docs.aws.amazon.com/prescriptive-guidance/latest/aws-kms-best-practices/key-management.html)  
34. It's a Feature, Not a Bug: Secure and Auditable State Rollback for Confidential Cloud Applications \- arXiv, erişim tarihi Şubat 19, 2026, [https://arxiv.org/html/2511.13641v1](https://arxiv.org/html/2511.13641v1)  
35. Chapter 5\. AuditVerify (Audit Log Verification) | Command-Line Tools Guide, erişim tarihi Şubat 19, 2026, [https://docs.redhat.com/en/documentation/red\_hat\_certificate\_system/9/html/command-line\_tools\_guide/auditverify](https://docs.redhat.com/en/documentation/red_hat_certificate_system/9/html/command-line_tools_guide/auditverify)  
36. Audit Logs Are Not Optional: The Hidden Backbone of Reliable Data Platforms, erişim tarihi Şubat 19, 2026, [https://medium.com/@thedatatrait/audit-logs-are-not-optional-the-hidden-backbone-of-reliable-data-platforms-1824953762ab](https://medium.com/@thedatatrait/audit-logs-are-not-optional-the-hidden-backbone-of-reliable-data-platforms-1824953762ab)  
37. CEK-13: Key Revocation \- CSF Tools, erişim tarihi Şubat 19, 2026, [https://csf.tools/reference/cloud-controls-matrix/v4-0/cek/cek-13/](https://csf.tools/reference/cloud-controls-matrix/v4-0/cek/cek-13/)  
38. How does digital identity management handle certificate revocation and key management?, erişim tarihi Şubat 19, 2026, [https://www.tencentcloud.com/techpedia/127252](https://www.tencentcloud.com/techpedia/127252)  
39. Rethinking Tamper-Evident Logging: A High-Performance, Co-Designed Auditing System \- DART Lab, erişim tarihi Şubat 19, 2026, [https://dartlab.org/assets/pdf/nitro.pdf](https://dartlab.org/assets/pdf/nitro.pdf)  
40. Features | AWS Key Management Service (KMS), erişim tarihi Şubat 19, 2026, [https://aws.amazon.com/kms/features/](https://aws.amazon.com/kms/features/)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAYCAYAAAARfGZ1AAABDklEQVR4XmNgGAWjYOQAAyCeCcTcUD4vENcCcREQM8IUAUEZEC8AYmkkMbyAFYgPA7EfEP8H4mYGiAEgUA8V0wLim0DMDMRSUDEZqBq84CCUTmCAaGpESIF9ABJ7hCQGAiCxEjQxrADkfRAAuQykCRkkYREDuR4kpo0mDgIf0AVgAKThGJoYyMXohoN8hi4GAqC4CUYXhAGQBg8sYrBgQxZ7iyaGF0QwYHcNSMwei5gLlP0dSm9jgFjIAuWjgMsMmIZjC28bJLFqIFYBYjEgVgbis0DsD5VDAX+AeDKa2BwgfocmBgIgF4IsCEQTR3cI1YAnAyS10QT8AGJZIN6HLkENUAjEpxiIzLWjgHYAAFmgN68cJUyVAAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAYCAYAAAAcYhYyAAAA1ElEQVR4XmNgGNaAEYhV0QVJAe+A+D8UUwQuM1DBEJABF9EFSQUgQ/zRBUkBQQwIr4AMWgXE0Qhp4gDIGyBD/gCxJlQMxF8GV0EEwBYzf7GI4QUgxWFYxA6iiYHAQ3QBEPBjwLQRlPBAYuZo4iDQiC4AAqcZMA2ZjUUMLwApvopF7BaU/RJKewDxUSBOgPJRAEhDMBYxLyBmBeItULH5QOwLxOdhimBAjAG7sxcxQMTPoYn/AGJpNDGSATYLSQINDJAAt0MTJwkIAPFTIC5AlxgFqAAAdEExAeEmthAAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACIAAAAYCAYAAACfpi8JAAABC0lEQVR4XmNgGAVDBDACsSq6IL3BOyD+D8UDDi4zDBKHgBxxEV1wIADIIf7ogvQGQQyIaAE5ZhUQRyOk6QdAUQJyyB8g1oSKgfjL4CroBLDlmL9YxGgOQBaGYRE7iCYGAg/RBYgE3ED8AV0QGfgxYPocVLiBxMzRxEGgEV2ACDCVAWIWuj0o4DQDpoLZWMQoBTDP4QQgyatYxG5B2S+htAcQHwXiBCifVECUQ4KxiHkBMSsQb4GKzQdiXyA+D1NEIsDrEDEG7JKLGCDi59DEfwCxNBL/OwGMDPA6hFRAiUFUc0gDAyQR26GJEwuo5hABIH4KxAXoEkSAXwyQpsYbIH4PxM2o0qNgFOAHAKEfRcUcxUbnAAAAAElFTkSuQmCC>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAI4AAAAYCAYAAAAswsVWAAAEK0lEQVR4Xu2ZW6hNQRjHP8q13B5cInUeXPLkwYMkRHLLXaFE5MkTxYPy4loI5UHJpXMQD55JlOJBHtxvuZOEyP1+Z/5nZs6Z898ze6+17L3PYP3qa6/5f7PWmvn2rDXfzBLJycnJyaku/ViIhD5U7k/lSjGGhVK0UNaXxX+cXywYYojFDypfpXKlaK3sDYshXooOYiiQsfFMdGBtmz8o22x8Z5W9c3yo99j4XJ4q68qixBMLvv9tKleSacrOsRjiihQ2NmaWi27vdHYY4PvGomGe6MEXIoZY8P3vUrnS4P7dWfSBipdYjJgXUhhcyxDRvnXsMMDXg0WHGGLBfbtH5UqzUNknFn2goVNYjJhi08kx0b727FD0lPB5lhhiwW2s9sAB3IYC8Lq3lRCwg8rmNLqjBO0NzcPFBtVeZV9ZdIglFtx+38DZIfrNYBmrbL+ygY42VHSfVzhaUtCGCSy64LWMSt+VDTAaygcaasTFItHt26JsoujOjXcMvi8NtZuCZBnBDRFLLHjg3KfyA9GrP9TDlIz+YiVoNeRxj5TNNfWR9GMRkQY8YEdZdPE9oXbVkoVZyvYFDKO/Tlmtst3KdinbWn9WcrAiQtuWki1Ttsf4VjfUbgp8a1h0KHcsssL344Fz3fz62ms1N7ndZrQ03BA9QIPggjM92knSQNELVQlfsCw2v2nHDgN8C1h0SBOLOmXDWEzIYRYI7p87cDopqzHHqDe60dWgHSftldGZOgn34Yj4z6lnshQ67etuMOlgFQtVxrYtS34D4JvPoiFtLLLkDZtE5058H4b97sCxzJbCegDaCI+GtzFTrA8Y3L7r13NGCp07PVoa8ARsTGFr9WmJWCK6bfiTfcBXLPmFPzT4KxGLEKWuyX5fcoyphOvhbcraIKO1Ir0UmA6RG3nBBa95tFvmGPkEGKfslISf1mrxWgoDYxku2hfavwHwI9fykTQWbZRdUHbTlLMQ6oOF/b6BgzqnSXtodBdsHlptvbJukqwPn0VP/V5wwRkeDSsVjNBDRqtVNkn0zZoTtI0DY7ko2teRHQ5YHSEgPpLG4r3jy0qpc9nv2zlGnVEejf9saLbt9htYkj7AN5VFgJHnOxErH+jnSUfAe5FWLbCUxNsGO8ZI9D6KnkYAlp1vRb9WYTj29QvUiN+XNhYblG13yniLYac1ZIzvXi7sv0Pl0EYmtN6kYcsCOreD+8D4rp+Jsl2omUE/urCYkj+NRanz2W+ny3LC93BB4v2ExSysFP2EI4/421ksOhfISltlP81x1ngU+9MA++2+Tbko1Qfcv9j3vMR0Fj0lYFXzL4Cd4Q4spgDTdpZ8DzuxmGqfi55WQ1/weeBcpnI5CPVhpLITLOY0wn9OTHACj62CatBS0n+a+O/A5h6+78QItj9cQru75aY5Pujm5OTkBPgNze5VT6Ev33AAAAAASUVORK5CYII=>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAYCAYAAAD3Va0xAAAAzklEQVR4Xu2SMQ5BQRCGf1EhcSCJAyChcwnlSxyAA7iB1iEUao3eERC8oKAQZjKz4k12F9Hul/zN+/682cwukPiVKeVEebxlo65E2Rp3oLTVe3FFHwuIq1th4clcXFmhxIYUGECKXSsUdjf70QfvJDSxCXEjK3y4o/coHcgyW5qlusqrHYGLa0pmMlQXOm0Bt5/QlX69nx3CExsQN7bCR+zoc4irWmEpQ4p/v58JpNi3AnJLH380o5wpR8qeklPu6mqUi35jx50r5GkkEo4nVItCIl5coUMAAAAASUVORK5CYII=>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAYCAYAAAAPtVbGAAABHklEQVR4Xu2RMUtCURiGj0hT+Ac0pEEQdAlcBZcGpyAMcZR+gklLRIQ/wUlwCHFubWiKwDnQiNacc3UR832v5+LHdw+XOxg4nAcevPc595x7z9EYj8eTlDM4gMf2PgPvYQemwofALXyCOdEScQTf4QX8gz2zXYg82FaC3zANs7ad2GcS8WZ/22Y7+XE3FOyI7Uc0wtZVLRYeC+GXcrLk2tG4G7ay6iPbY+EDE9W4Az2RO9WNNOCXjhpOrDtaeJyy/apGPmFLRwkHXV/HVnO0c3u9VJ3k4Qsci7GAqYm+xPV/VEW7gwUxxl6Bp/AVPouxgBXsqzaEC9UIj4oLXop2ZRtf/G/MYBMWTXT3e0MuHF7fiLYX1uL6A87FvecA2QDYdUCPSvS9OwAAAABJRU5ErkJggg==>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAYCAYAAABjswTDAAABaElEQVR4Xu2UvS9EQRTFLxIJxSYatQgqfwBalQaJBJGIWohmG7VIUGk0KgqNUilR+wd8RRQSiVZoxEeCe3bm2XnnZbMzYyOvmF9y8mbOeZm9O+/OiCQSBdpUg2yWkUfVt1WZOFAtsgkupVzF4kujnm0OAIJrNltIl6qDzVhQ7DybLWBI9aY6JD+aBSm2wIZqirwQxsWsucWBB8Ni+rWdA3Ar9WK7Vfeqiur19w1/lsSstcqBJzuqCdWmFDewBsw7VY/qxHrv1vdlXcz7MxwE8mCfF9Lg92GeqvY58GBX9aUa5SAC3AB9doyasHYOHCoEV/Z5lo+bciTmAPVz8AcmpcGu3kg+wHjPmfuS7fAIBxF8qD7ZBCjOvV8xP7bjF8f3pSpmjWkOAnB7P3fIEczSfEVM/5w7fihzYtZa5qAJA1L/0vjjuJVq9DpBRtYvz+THMiamPXBv+/IkpoY1Dv4LbEwnm4lEIhHGD1HPTMx/AhWPAAAAAElFTkSuQmCC>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAXCAYAAAA/ZK6/AAAAlUlEQVR4XmNgGAWDCegC8Twg5obyeYG4AYgnADETVAwO2IF4KxBHA/F/IG4G4gVQuXqoGArYC6VhGhqR5EA2YWgohdLXGDAls7GIwQFIoh2L2GU0MTCQYIBIgpwAA3xQMQUofypCCsJBtxpZrBqIlZDkGP4C8VdkASAoYIBo0AfiS2hyDBZAzIouyACJHwN0wVFACAAA3qgdBAlcrcAAAAAASUVORK5CYII=>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAYCAYAAAC8/X7cAAACV0lEQVR4Xu2Wy0tVURTGVw+joAQHljjIBtXEQRPBYVTgoJGKg0ARw4nQoL8haiJNGjRwJJLUoAYNQiIlqVkNhGiiNgh8QJgVRfRA7bE+1z627nf3vse450KEP/jgrG/txzl777vuFtnh/+MkG1XSwcbf0KIaUd1U1VMuxi82CmCf6hObedwQe5n+EB9VvVV932pRzoqqkc3AqOqz2JjQWEnW+CF/8tA5l+tSzbg4yW6xzk85EdhQ/WRT7EPxgXn4F4wxrTrOZgB9jrDJoNFrNh1npXx1ALwm8phdqoeq+2Ltu0vTm6Q+DAyqvrHpWZbKA4Bsh+45rzl4eVxWtYXn1C5ghysR67PJabHkE/KZBrF2H513S7Xm4hTv3TP6YxxfGFC9hl0cA33OswnWxZL7OUH0ibV74Tz8+G67OIVfPZxzxPPOu6M66OIYWKhHbILUljKvxNoNOQ/xVRfHwPl/QB7PuZ3551QLbB6W8sFSxNohvkge48+/99D3eoi3cwxRBHh+2RPMir9wpUesHZdYeAPkMR/YCGQL0qq6RrkYExL5ABBbWSbVBt4VNolYPzAllkPpPkC5GLOSWAz8VacmAYti+TpOiPnjbDr2qh6zGcjKcqW5PbgJTLKZgUFesqmsilWpFKgeqSsGjuc71XNOOL5K/vHNwDt2sunBZGj0TGxQPLeXtCjnmMRX8K7YzqL+o+6j3MY4pbrEZoLYPIWAgfEnV0suqN6wWRQoiUtsFgwWKe++VRW4xxxisyDOSP41pxBqcUZRqb6wWStwZTjBZpX0srHDv8RvIgOZoWhg2tUAAAAASUVORK5CYII=>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAYCAYAAAD3Va0xAAAA3UlEQVR4XmNgGAWkgnlA/BmI/0PxAhRZCPjLgJAHYWdUaVSArBAb2AfEKuiC6IARiLcD8XoGiEFBqNJggMsCFJAPxCZQNi5X/UEXwAbeIrE/MEAM4kMSUwPiTiQ+ToDsAlA4gPg3kcSWATEPEh8rAIXPZjQxdO9h8yoGQA4fZDGQ5m4o/xeSHE7wDl0ACmCu0gbiFjQ5rACXs3czQOTuATEnmhwGYAHiveiCUMDEgBlWWAEzEL8B4pPoEkjgGxB/RxdEBquA+CMDJP2A0g0oL2ED+kCcjS44CkYBEAAABi803bhnVOIAAAAASUVORK5CYII=>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEEAAAAYCAYAAACldpB6AAADBklEQVR4Xu2XS8hNURTHF8kzRPLIY2DgkRgwESMSkkIGiPoSikRKiYxMKMxkYGCOJIXkMfjIkJmiiCSPEvJ+P9bf3uu76/7POt+93Nt3De6v/t2z/2vvffY+Z5+91xVp0+Z/ZiEbDVJ3fxPZaBGbVbvZbJC+qjdsel6qfmW1mvGqp2w6Xqh+SPl4r0klBj1zsRWqW65cYILEnfY0GEN/NokdquuS6u6hmPGdjQzajGLTGCmtfwhzVF/YDMDKBWWrYbrqEJuZDapPbBrDJe6wJ/km9e0FNs7b+Xqai4ETqiHkeUrnOUziYC/VQdUT1QGKebD7nlKty+VO1ceuaH3g/gPYJDCec/l6kKQ27yrhP0Tz8CC+hE0QPYS52bOBWZ0ZXTXSoODtzeXjuQzwOzlf12KwFO8fsV01y5V/SmqHcRhYUd3xVXWJTRA9BJRXkbcl+8YNKgOUD5NXi3lS7CfC9gNjsaR2tjqmqPZXwiF3VY/YBPwQsPSjQdmbX5PLOLK4HsqXyavFein2ExHVgWf+SUmfSXdclLifwkN4QGWPn6R9Msa4XMZp8zd0SPn9jN6qC2wqRyW13Zh/a4E+wnr8EM5S2egnyce3b9gujYwMvziimLGqz5LiOKaY2RLfz7NTUr0ItIXqOWLvqF6xCZBAoBPbYMbkst+EwNLsW0KzSbW6Ei7liLtGe+wtHn4JEW/ZcDyU1H4fBwLwMsLPdaqkTkY476qk3deDOqddeVL2bkrK4s5LOlKHujqcjWJnjiYMDzl+xAJJ8YEcyFieUyvbBKi3nE0sIeTrj1XPpXoHXiapEYScfZGLATw0i7OOuXoenOt4aAzaYMkz71WvJS1hXJflK4jVQ/QCGgId4oxn5kt8M9tTInZJ/RP5V/Dp+j9VTQET8omKgZ08mmxZfQPxPmw2EfQ/ms1GsXwCyY6xMnu8tLGkjfvu2oPk5x6bTQJj7GSzmWDCOFbPqLZSDOBYQkIEIX6lOlwFNlacOs0EK/MDmz3JTClumtuqahTpYKNB1rLRpk2R39KszpkzNip/AAAAAElFTkSuQmCC>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAYCAYAAACIhL/AAAAB60lEQVR4Xu2WPUtcQRSGj4pioyAYFQu10b9gKUawSKVgEVBEsfEDv8A/ILYWKVJYK8bCWkKsTGcjSJqIRSAqiB+EWIji93k5d2X23Rnn6q5g4QMv6zznODtz9+6dFXnn7dHCIkIni+fQqFnQfNVUUs3HPYsUlGnOWMb4IvZm/cm4QXOsuXzsyOVI84Glw4xmhGVCt2aLpY9isYX95ELCjeaOpdhGsAFmRXMlNicyml3OAvValgya/rB0+CjW00Eero4cE1vgkOaCpcuBxO+hzBVedVx94mLEFgiC87SJFTfIM1Viff8dtyj2McZIu8BPLMG1WLGcC0SfWN+24241y844RJoFYqM/WAL8c/DyOuyK9Q07DuM5ZxwCfWMsiR3NX5Y1kn6Bvj6MB8n5QN84S+K75M4vJYl88huk9Ij18SMIboCcD/RNsCTWxLNA4LsyTKgHbpalB/RNsSR+a/6xBDhqfG+eYU+sXsoFMb/E0gP6plkSOKnWWWbABL9YKidi3/IQ3+TpIxBUi80/zwUCPV0sXU7FmjbF7kn83ZrVkUuThK8+HujYIA6B/eQVZ3bouRmaJ28wMR7i+fBZc8iyUEyKXaF8wCZj53le4JdOBcuUtEv8mC0IL7mH8APknOVrUaRpZhmhl8U7heQB2J5+NM6vLT4AAAAASUVORK5CYII=>

[image13]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEwAAAAYCAYAAABQiBvKAAADXUlEQVR4Xu2YS8hNURTHl1fkGXlFeRWRDGRADBTCzICBkCgDGaA+EyNJoUyUZ8qEyKNMxICUN8krjAzI+/0m78f6f+vse9ddZ+1zr9s9H7fur1bf2f+1zt77rLPv2vt8RA0a1BvDrFBnDLfC3zCQbTvbZrauxufx2wrMECv851xmG2XFcmwkefj5SXsA23O2L4WINM/Yeqn2K5I+vCTmzQu2nxQf/xQVfbAnpe5mrZPRXFqTBKNDjx9sv6xIklgk1IJEexNuCZaznSYZf6XxBfA8HlPZPlnRA53fsaJiEknMZKND62s00Jv+XcKwwkFsleFnt8GKCtzT34qah+R3rAkr8KDS+iWaRw+K+/ImjHsruR6pfGAfZddl1LKzVgxMJOn0pNEt3Uni3iptF9s31daEeI9xbDfZjrFNM75AN7ZVJDW1PdtYto9sm3SQQyu2w8k1ahHm8KHobiY2r8Bsyoj5TuLsYB2GeSRx15WG4rpHtTWxhD2l4gOBE2yPVBusJ7m3MxVXKsZBcr0+NUvZxqg26i7uQSIDeOZyRMeBI+pU3CaJW6w0tNeotsZL2H5HA9DWmvYK1UYZ8O7zCPUrMJ3k3vCScNbSY8VwxwuF2XUavDi0Fxot4CUM7WtGA9ixdCyul6j2zkSrBC9Ozx0vrZJjA+JTv7o2ieOzdRhmkcTZIwe0BUYLxBJ2zmgAdVHHIoFXVBvbPOpXObAxHbEis4Wk/0XJ30pAXBcrAp39GLEYaKutmBBL2D2jAdv/JZK4UH+8ezyaSDYUjzDGV+uIYOde4B1lOJn7JP521kGi77ZiQh8Svy62WCneWNAwD92uhvdWUNyl7BdsyZwDnDesSPKZkbWj7KX4J9MIkn57Kq1jos1V2pxE02BlvWa7wHacZJwZJRFpppD0gzE8wm6bqksOMyk9pxQvSYIuktQ0XOPsk8Ug8jvGsn/M9oDkGKF3LtQZHCVwH+yo8gUOUdFvzQP17Q1JknG9rtRdoJI6CM6TvKxcwEOgXtWKbVT689RgrB1WzAGM45WgmrCMZCXViqtsZ6yYgOJ/wIo1ZgLFv15qBo4B7hZcJfiC0IlpS/LplvuDkIyN8XInVl+qZTDbVpJ/0+AchQ/9vEFtHW3FvMDxYagV64zxVmjQoOX4A3BT9KRdMdkUAAAAAElFTkSuQmCC>

[image14]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAYCAYAAAAYl8YPAAAA1ElEQVR4Xu2TKw4CMRRFL5+gCYYtYFkHggSBZgfgcCRsAIdiGYRN8AtrQPMJISAw8F4eor0pQ6d6TnLN6fSmfTMDFKSylLxzJBN9oB9wvLEVcB4N2MlcyrBNB/LKkYXLSlIiN4KVdcnXJDNyHkMWwhXh69QlTZb/CM0riQqsaMsLKYxhZR1ecGhL1ixD3JF9xYlkjsiymHlNEVGmrz5mXlFlC1jZgDyjZRuWSk/yhH1b5290bi/8vq6W7VimomV7lqloWei/zc1DcpGcJDdJ1V8uyMMHKsk72GpRijAAAAAASUVORK5CYII=>

[image15]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAYCAYAAAAYl8YPAAAA7ElEQVR4XmNgGAXkgs1A/J8EjBeAFIRhEUPXqIFFDAUIMUBchgyYGCCaLqCJg8AjdAFksBWIGdHEChgghvmjibMBcR+aGArIRxcAgvcM2L0jAMTi6IKEALbwIgswM0AMOoMuQQ4oZ4AY5o0uAQXxDBD5b0CsjCaHAT4z4PaiHRDLQNnsDBB1rAhpTIAvvOYxoMqB2D1IfBQAinpSwguk1gddEAZmM0AUJKCJYwOpQPwBXTCIARKYoLT1FopB4faLAbd3eYD4KbogueAcErsMiU0y+MgACYYkIC4FYmsUWRLAJgZEbOOL9VFAJAAA0mNAVkiMrRoAAAAASUVORK5CYII=>