✅ 03 — Canonical Output — Evaluation Framework for Hybrid Rule Engine.md

Module Metadata
- Module Name: Evaluation Strategy Report
- Source File ID: Evaluation Framework for Hybrid Rule Engine.md
- Version: Not explicitly stated

Purpose
- UBL-TR e-Fatura ve UBL-TR 1.2 canonical JSON üzerinde çalışan hibrit değerlendirme mimarisi için audit-oriented evaluation çerçevesi tanımlamak.
- Deterministik rule engine çıktılarının Draft-07 JSON Schema altında cryptographically auditable Evidence Pack üretmesini doğrulamak.
- LLM narration katmanında factual representation ve No-Synonyms Narration Policy uygulanmasını doğrulamak.
- Offline ve online değerlendirme planları ile threshold calibration, drift detection, shadow regression ve continuous feedback döngüsü kurmak.
- MASAK, VUK, BDDK ve privacy gereksinimleri altında forensically sound değerlendirme artefaktları üretmek.

MVP Scope
- MVP Boundary Principle:
  - Sistem hibrittir: deterministik rule engine + probabilistic LLM narration.
  - Evidence Pack, deterministik kanıt nesnesidir ve Draft-07 JSON Schema ile validation altındadır.
  - LLM narration katmanı No-Synonyms sözleşmesine bağlıdır; canonical path adları birebir korunur.
- Ingestion Scope:
  - UBL-TR 1.2 canonical JSON payloadları.
  - Golden Set: canonical JSON + human-annotated Evidence Pack + deterministik narrative outputs.
  - Online telemetri: OpenTelemetry Sidecar, queue metrikleri, trigger hızları.
  - Auditor feedback girdileri: Finding Card, disposition kayıtları, version metadata.
- MVP Extraction Boundaries (Explicitly Mapped Fields)

| Category | Document | Extracted Fields (as stated) |
| --- | --- | --- |
| Hard Checks (H001-H015) | Canonical JSON | `metadata.ubl_version`, `totals.line_extension`, `lines.net_amount`, `tax.total_tax_amount`, `supplier.tckn`, `payment.iban` |
| Context Checks (C001-C008) | Canonical JSON | `lines`, `document.currency_code`, `totals.allowance_total`, `e_irsaliye.deliveredQuantity` |
| Graph Signals (G001-G008) | Canonical JSON / graph context | `payment.iban`, `ISSUED_TO` edges, `PAID_VIA` edges, `supplier.vkn`, `timestamps` |
| Drift sentinel | Incoming payload | `tax.subtotals.scheme_id` |
| Finding Card evidence fields | Evidence Pack / UI | Rule ID (`check_id`), canonical fields, metrics, JSON Pointer paths |
| Audit log metadata | Telemetry log | `entry_id` (UUID v4), ISO-8601 UTC timestamp, `prev_hash`, version metadata |
- MVP Validations (Computational Core)
  - Golden Set stratified evaluation across H001-H015, C001-C008, G001-G008.
  - ATL/BTL threshold calibration:
    - H002/H004 default tolerance baseline: `0.0`
    - C004 allowance ratio baseline: `0.5`
    - C004 daha hassas test: `0.4`
    - H004 daha gevşek test tolerance: `0.01`
    - C001 threshold test artışı: `20 -> 30`
  - Online runtime validation:
    - p95 latency: `< 100 ms`
    - G006 için path depth gözlemi: `path depth > 3`
    - Trigger velocity monitoring windows: `1-hour`, `24-hour`, `7-day`
    - C002 için sapma alarm örneği: historical baseline’a göre `> 2 standard deviations`
  - LLM determinism/fidelity validation:
    - `temperature = 0.0`
    - `Exact Match ratio = 1.0`
    - Shadow kıyasında lexical metrics: `ROUGE-L`, `Exact Match`
  - RPS dağılım validation:
    - Hard checks için örnek ağırlık: `10`
    - Context checks için örnek ağırlık: `1`

Actors & Core Entities
- Actors

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
| --- | --- | --- |
| Deterministic rule engine | Deterministik validation katmanı | H/C/G kontrolleri çalıştırma, Evidence Pack üretme |
| LLM narration module | Narration katmanı | Evidence Pack temelli açıklama üretimi, No-Synonyms uyumu |
| Human auditor | Manual review katmanı | Finding Card inceleme ve disposition seçimi |
| Data science team | Calibration/tuning katmanı | ATL/BTL tuning, eşik güncellemesi, tuning batch analizi |
| Prompt engineers | Narration iyileştirme katmanı | LLM prompt template revizyonu |
| Compliance / external auditors | Denetim katmanı | Immutable kayıtlar üzerinden inclusion/consistency evidence doğrulaması |

- Core Entities (Canonical)

| Entity | Definition (from input) | Primary Identifiers / Fields |
| --- | --- | --- |
| Golden Set | Offline gating için stratified evaluation veri havuzu | Rule family dağılımı + doğrulanmış kanıtlar |
| Evidence Pack | Deterministik ve şema kontrollü kanıt çıktısı | `check_id`, `fields`, `metrics`, JSON paths |
| Composite Review Priority Score (RPS) | Evidence Pack ağırlıklı risk puanı | Hard/Context ağırlıkları ve dağılım metrikleri |
| Finding Card | Auditor UI nesnesi | Rule ID, narrative, canonical fields, metrics, JSON Pointer |
| Rule pack versions | Semantic versioning ile yönetilen kural setleri | v0.1, v0.2 |
| Immutable evaluation log | Kriptografik bağlı log kayıtları | `entry_id`, timestamp, `prev_hash`, version metadata |

Workflows
- Workflow A — Offline evaluation plan

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
| --- | --- | --- | --- | --- |
| 1 | Golden Set oluşturma | Rule engine team / audit reviewers | Canonical payload + human-annotated evidence | Rule-family kapsama validation |
| 2 | ATL/BTL calibration koşuları | Rule engine team | Threshold tuning çıktıları | Precision/recall ve queue etkisi validation |
| 3 | Adversarial strategy koşuları | Evaluation system | Malformed/edge-case payloadlar | Parser, matematik, prompt resilience validation |
| 4 | LLM lexical/factual değerlendirme | LLM evaluator + deterministic matcher | Narrative outputs | No-Synonyms ve claim-to-evidence consistency check |
| 5 | Determinism kontrolü | LLM inference pipeline | Tekrarlı narrative outputs | temperature=0.0 altında Exact Match 1.0 validation |

- Workflow B — Online evaluation plan

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
| --- | --- | --- | --- | --- |
| 1 | Canlı telemetri toplama | OpenTelemetry Sidecar | Runtime telemetry | Latency, queue depth, backpressure validation |
| 2 | Trigger velocity monitoring | Telemetry system | Rule firing windows | 1h/24h/7d sapma ve >2 stddev alarm logic |
| 3 | Drift monitoring | Drift monitor + auditor feedback | Drift events | Schema/Covariate/Concept drift validation |
| 4 | Shadow deployment regression | v0.1 + v0.2 engines/prompts | İkili Evidence Pack ve narrative çıktıları | Regression delta + ROUGE-L/Exact Match kıyası |
| 5 | Immutable pipeline logging | Audit pipeline | Evaluation artifacts + logs | Hash linkage, inclusion proof, consistency proof evidence |

- Workflow C — Feedback loop design

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
| --- | --- | --- | --- | --- |
| 1 | Manual queue routing | RPS triage + human auditor | Finding Card | Manual threshold üstü kayıtların yönlendirme doğrulaması |
| 2 | Disposition capture | Human auditor | Disposition records | True Positive / False Positive / Benign Anomaly ayrımı |
| 3 | Tuning batch ve prompt revizyonu | Data science + prompt engineers | Calibration updates | Threshold ve narrative discrepancy azaltma validation |
| 4 | Versioned release | Release/governance process | Versioned rule pack + schema updates | Semantic versioning + Draft-07 contract uyumu |
| 5 | Rollback circuit breaker | Governance controls | Release health metrics | Rule Precision ve LLM Faithfulness eşiklerine göre rollback |

Canonical Consistency Checks (MVP)
- Golden Set Stratification Table

| Rule Family | Evaluation Intent | Canonical Fields Evaluated | Target Topology |
| --- | --- | --- | --- |
| Hard Checks (H001-H015) | Teknik, regülatif ve matematiksel bütünlük validation | `metadata.ubl_version`, `totals.line_extension`, `lines.net_amount`, `tax.total_tax_amount`, `supplier.tckn`, `payment.iban` | VKN/TCKN modül kontrolleri (H007), IBAN (H008), H003 precision sınırları, H005 e-Despatch referans eksikliği |
| Context Checks (C001-C008) | Operasyonel anomaly/discrepancy validation | `lines`, `document.currency_code`, `totals.allowance_total`, `e_irsaliye.deliveredQuantity` | C001 line-item threshold, C004 allowance ratio, C008 volumetric mismatch senaryoları |
| Graph Signals (G001-G008) | Çoklu belge ağ topolojilerinde yapısal discrepancy validation | `payment.iban`, `ISSUED_TO`, `PAID_VIA`, `supplier.vkn`, `timestamps` | G001 shared IBAN, G004 A->B->C->A cycle, G005 lexical overlap |

- Adversarial Strategy Table

| Threat Category | Edge Case Vectors | Target Rules/Components |
| --- | --- | --- |
| Parsing and Structural Anomalies | XXE (AC-01), Billion Laughs (AC-04), namespace collisions (AC-08) | UBL-TR Parser, H001, Canonical JSON Validator |
| Logic and Mathematical Evasion | `0.0001` discrepancy enjeksiyonu, zero-width karakterler | H004, H003, H010 |
| Adversarial Prompt Injection | Free-text içinde adversarial talimatlar | LLM Prompt Template, Evidence Pack Schema alan eşlemesi, Draft-07 schema gate |
| Entity Fragmentation and Circularity | İsim varyasyonu ile entity maskleme, karşılıklı faturalama döngüleri | G005, G008, `payment.iban`, Levenshtein, `ISSUED_TO` cycles |

- Drift Vectors Table

| Drift Vector | Operational Definition | Detection Mechanism & Impact |
| --- | --- | --- |
| Schema Drift | Upstream kaynaklardan gelen JSON yapısında değişim | Incoming payload vs schema registry comparison |
| Covariate (Data) Drift | Sayısal/kategorik dağılım kaymaları | K-S test + PSI; `totals.payable_amount`, `lines.quantity` gibi alanlar |
| Concept / Logic Drift | Girdi ile anomalous outcome ilişkisi değişimi | Auditor feedback üzerinden kural mantığı güncelleme ihtiyacı |

- Metrics Table

| Metric Name | Definition | Unit | Window | MVP Target |
| --- | --- | --- | --- | --- |
| Rule Precision | Tetiklenen kuralların actionable anomaly oranı | Ratio | 24-Hour Rolling | `0.95` rollback threshold (feedback loop) |
| Rule Recall (Hard Checks) | H-serisi non-compliance yakalama oranı | Ratio | 7-Day Rolling | Not explicitly stated in this file: Numeric target in text |
| Rule Recall (Context/Graph) | C/G-serisi anomaly yakalama oranı | Ratio | 30-Day Rolling | Not explicitly stated in this file: Numeric target in text |
| False Positive Rate (FPR) | Benign belgelerin yüksek RPS ile işaretlenme oranı | Ratio | 24-Hour Rolling | Not explicitly stated in this file: Numeric target in text |
| Processing Latency (p95) | Canonical ingestion’dan signed Evidence Pack’e uçtan uca süre | Milliseconds | 1-Hour Rolling | `< 100 ms` |
| Evidence Schema Compliance | Evidence Pack’in Draft-07 şemaya uyum oranı | Percentage | Real-Time | Not explicitly stated in this file: Numeric target in text |
| LLM Faithfulness Score | Narrative claim’lerinin fields/metrics ile eşleşme oranı | Ratio | 24-Hour (Sampled) | `1.0` rollback threshold (feedback loop) |
| Lexical Fidelity (No-Synonyms) | Canonical path adlarının birebir korunma oranı | Ratio | 24-Hour (Sampled) | Not explicitly stated in this file: Numeric target in text |
| LLM Determinism Rate | Aynı Evidence Pack için narrative stabilitesi | Ratio | Ad-Hoc (Offline) | Exact Match ratio `1.0` |
| Review Priority Score (RPS) Mean | Toplam akışın ortalama risk skoru | Integer | 24-Hour Rolling | Not explicitly stated in this file: Baseline numeric value |
| Schema/Data Drift Rate | Dağılım kayması gösteren canonical alan oranı | Percentage | 7-Day Rolling | Not explicitly stated in this file: Numeric target in text |

- Minimum Dataset Requirements
  - Rule family başına istatistiksel minimum: `384`.
  - Operasyonel yuvarlanmış minimum: `400`.
  - Toplam offline dataset minimumu: `>= 1200` UBL-TR payload.

| Rule Taxonomy | Minimum Count | Stratification Strategy | Sampling Strategy |
| --- | --- | --- | --- |
| Hard Checks (H-Series) | 400 | 200 compliant + 100 minor boundary failures + 100 strict format violations | Heavily synthetic |
| Context Checks (C-Series) | 400 | 200 normal + 100 edge-case anomalies + 100 extreme threshold breaches | Hybrid blend (real + synthetic) |
| Graph Signals (G-Series) | 400 subgraphs | 10-50 interconnected invoices ile 400 unique topology | Heavily real data |

Evidence Output Contract
- Output Artifacts (as stated)
  - Deterministic Evidence Pack.
  - LLM-generated narrative.
  - Telemetry metadata.
  - Finding Card and disposition records.

- JSON Payload — Canonical Field Set

| Field Group | Included Fields (Minimum) | Notes / Constraints (from input) |
| --- | --- | --- |
| Evidence core | `check_id`, `fields`, `metrics`, JSON paths arrays | Draft-07 JSON Schema validation required |
| Telemetry identity | `entry_id` (UUID v4), timestamp, `prev_hash` | Log entries cryptographically linked |
| Versioning | Rule version (e.g., `0.1`, `0.2`) + Evidence Pack version metadata | Audit replay için gerekli |
| Feedback capture | Disposition code, linguistic failure flags | Auditor review ve tuning batch için kullanılır |
| Regression comparison | v0.1-v0.2 check/metrics/path divergence kayıtları | Regression delta olarak loglanır |

Implementation Notes (storage-neutral)
- OpenTelemetry Sidecar pattern kullanılarak core engine performansı bozulmadan telemetri toplanır.
- Shadow deployment modelinde v0.1 ve v0.2 aynı payload üzerinde paralel çalıştırılır.
- Regression delta; `check_id`, metrics ve JSON paths divergence üzerinden tutulur.
- RFC 8785 deterministic canonicalization başarısızlıkları telemetri alarmı üretir.
- Hybrid Immutable Pipeline öğeleri metinsel olarak belirtilmiştir: SHA-256 linear hash chain (`prev_hash`), Merkle Hash Trees, WORM storage, FIPS 140-3 Level 3 HSM.

Operational Notes
- Trigger velocity monitoring pencereleri: `1-hour`, `24-hour`, `7-day`.
- Rule-level anomaly logic örneği: C002 trigger oranı historical baseline’a göre `> 2 standard deviations` olduğunda alarm.
- RPS dağılımı manuel queue etkisi açısından sürekli izlenir.
- Feedback loop mekanikleri:
  - Finding Card içerikleri: Rule ID, deterministic narrative, canonical fields, metrics, JSON Pointer paths.
  - Disposition kodları: True Positive, False Positive, Benign Anomaly.
  - C001 tuning örneği: `len(lines) > 20` -> `len(lines) > 50`.
  - Prompt tuning örneği: VKN, TCKN, IBAN, KDV, UBL-TR terimlerinin verbatim kullanımı.
- Privacy/data handling:
  - KVKK, GDPR, MASAK, BDDK bağlamında real data değerlendirme öncesi irreversible pseudonymization uygulanır.
  - `supplier.vkn`, `supplier.tckn`, `customer.vkn`, `payment.iban` alanları rotated salt ile cryptographic hashing altında tutulur.
  - G-series relational evaluation için hashing deterministik olmalıdır.
  - Calibration tamamlandığında test ortamındaki gerçek veriden türetilmiş setler purge edilir; uzun dönem saklama izole archive tier’de yürütülür.
- Governance/rollback:
  - Rule Precision `< 0.95` veya LLM Faithfulness `< 1.0` durumunda automated rollback trigger uygulanır.
  - Production deployment için explicit multi-signature governance protocol onayı gerekir.

Open Questions
- Not explicitly stated in this file: Manual review threshold için kesin RPS sayısal eşik değeri.
- Not explicitly stated in this file: Rule Recall (Hard/Context/Graph), FPR, Evidence Schema Compliance, Lexical Fidelity, Drift Rate için metinsel MVP sayısal hedefler.
- Not explicitly stated in this file: ROUGE-L kabul eşiği.
- Not explicitly stated in this file: Regression delta acceptance tolerance sınırları.
- Not explicitly stated in this file: Multi-signature governance protocol imzacı sayısı/rol dağılımı.
