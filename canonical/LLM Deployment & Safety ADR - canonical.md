✅ 03 — Canonical Output — LLM Deployment & Safety ADR.md

Module Metadata
- Module Name: LLM Deployment & Safety ADR
- Source File ID: LLM Deployment & Safety ADR.md
- Version: Not explicitly stated

Purpose
- Ticari finansman doküman paketlerinde deterministik kural motoru ile LLM anlatım katmanı arasında net görev ayrımı tanımlamak.
- e-Fatura, e-İrsaliye, AB-NTR, LOB ve ilgili belge setlerinden üretilen kanıtların denetçi odaklı anlatıma dönüştürülmesini standardize etmek.
- UBL-TR 1.2 hiyerarşik XML verisinin Canonical JSON Schema formatına dönüştürülmesi sonrası doğrulama akışını tanımlamak.
- KVKK, BDDK, MASAK, TTK, VUK bağlamında veri gizliliği ve denetim izi gereksinimlerini işletim modeline bağlamak.
- No-Synonyms Narration Policy, JSON Schema doğrulaması ve çok aşamalı giriş tarama mekanizmaları ile anlatım katmanında tutarlılık kontrolünü güçlendirmek.

MVP Scope
- MVP Boundary Principle:
  - LLM karar motoru değildir; yalnızca deterministik olarak üretilmiş Evidence Pack içeriğini anlatı formatına dönüştüren narrator katmanıdır.
  - LLM yeni çıkarım üretemez, deterministik bulguyu değiştiremez, kural motorunun üretmediği veriyi tamamlayamaz.
- Ingestion Scope:
  - Structured ve yarı-structured ticari belge içeriği: e-Fatura, e-İrsaliye, AB-NTR, LOB, Murabaha Satış Sözleşmesi ve ilgili işlem dokümanları.
  - UBL-TR 1.2 XML katmanları: `cac`, `cbc`, `ext`, `sig` düğümlerinden kanonik modele dönüşen alanlar.
  - Deterministik doğrulama çıktıları: Hard (H-series), Context (C-series), graph analizleri, JSON pointer ve kural sonuçları.
  - Tokenization Gateway sonrası maskelenmiş veri akışı ve anlatım girdisi.
- MVP Extraction Boundaries (Explicitly Mapped Fields)

| Group | Canonical Paths/Fields | Notes (as stated) |
| --- | --- | --- |
| Document references | `cac:DespatchDocumentReference`, `references.despatch_id` | e-Fatura ile e-İrsaliye referans eşleştirmesi için kullanılır. |
| Monetary totals | `cac:LegalMonetaryTotal/cbc:PayableAmount` | Tutarların limit ve diğer belgelerle consistency check için kullanımı belirtilmiştir. |
| Party identifiers | `supplier.vkn`, `customer.vkn`, `supplier.tckn`, `customer.tckn` | Parti kimliği ve belge zinciri validation için belirtilmiştir. |
| Payment identifiers | `payment.iban` | Ödeme akışı consistency check için kullanılan kanonik alandır. |
| Document identity/date | `document.uuid`, `document.issue_date` | Anlatımda eşanlam kullanılmadan aynı alan adlarıyla geçirilmesi zorunlu örneklerdendir. |
| Tokenized identifiers | `VKN_`, `TCKN_`, `IBAN_`, `COMPANY_`, `EMAIL_`, `PHONE_` | Tokenization Gateway bölümünde maskelenmiş gösterim olarak verilmiştir. |
- MVP Validations (Computational Core)
  - UBL-TR XML’den Canonical JSON Schema dönüşümünde düğüm çözümleme validation.
  - e-İrsaliye kimlikleri ile e-Fatura referans alanları arasında eşleşme consistency check.
  - Finansal tutar alanlarının limit ve belge içi/arası discrepancy kontrolü.
  - Evidence Pack içinde JSON Pointers, hata metrikleri ve kural ID’lerinin deterministik üretimi.
  - No-Synonyms Enforcement: alan adlarının birebir korunması (`supplier.vkn`, `payment.iban`, `document.issue_date`, `document.uuid`, `references.despatch_id`).
  - JSON Schema Validator (Draft-07) ile çıktı şema validation; şema dışı çıktıların gateway tarafından reddi.
  - Multi-Stage Detection Pipeline ile güvenilmeyen serbest metin içeriklerinde injection validation.
  - High-risk findings için Human-in-the-Loop onayı.

Out of Scope
- Dış LLM API çağrıları (OpenAI, Anthropic, Cohere) ve sınır ötesi veri aktarımı.
- LLM’in deterministik karar üretmesi veya karar sonucunu değiştirmesi.
- LLM katmanının açık metin PII verisine doğrudan erişmesi.

Actors & Core Entities
- Actors

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
| --- | --- | --- |
| Deterministic Rule Engines | Birincil doğrulama katmanı | Hard (H-series), Context (C-series), graph analizleri ve deterministik bulgu üretimi. |
| DOM Traversal Engine / XPath layer | Dönüşüm katmanı | UBL-TR XML hiyerarşisinden Canonical JSON modeline alan çıkarımı. |
| Evidence Pack generator | Kanıt üretim katmanı | JSON Pointers, hata metrikleri, kural ID’leri ile read-only kanıt yapısı üretimi. |
| Tokenization Gateway | Veri gizliliği katmanı | PII alanlarını deterministik token’lara dönüştürme ve ters eşleme yönetimi. |
| LLM Narration Engine | Anlatım katmanı | Sadece Evidence Pack içeriğini açıklanabilir rapor metnine dönüştürme. |
| Sentinel Model | İzole denetmen katman | Aşama 3 niyet analizinde şüpheli girdiyi ana anlatım motoruna gitmeden engelleme. |
| Risk analyst (Human-in-the-Loop) | Manuel inceleme katmanı | High-risk findings için nihai manuel validation. |

- Core Entities (Canonical)

| Entity | Definition (from input) | Primary Identifiers / Fields |
| --- | --- | --- |
| Evidence Pack | Deterministik kural motorunun değiştirilemez kanıt çıktısı | JSON Pointers, error metrics, rule IDs |
| Canonical JSON Schema | UBL-TR XML’den düzleştirilmiş standart veri modeli | `supplier.vkn`, `payment.iban`, `document.uuid`, `references.despatch_id` |
| Tokenization mapping store | Token ile gerçek değer eşlemesini tutan ayrı güvenli katman | Deterministic hash tokenları ve reverse lookup girdileri |
| Multi-Stage Detection Pipeline | Güvenilmeyen metinleri LLM öncesi tarayan çok aşamalı kontrol hattı | Spotlighting, Aşama 1, Aşama 2, Aşama 3, No-Synonyms enforcement, Human-in-the-Loop |

Workflows
- Workflow A — Deterministic Validation to Narration

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
| --- | --- | --- | --- | --- |
| 1 | UBL-TR XML çözümleme ve kanonik modele dönüştürme | DOM Traversal Engine / XPath layer | UBL-TR input, Canonical JSON | Düğüm/alan eşlemesi consistency check |
| 2 | Kural çalıştırma ve bulgu üretimi | Deterministic Rule Engines | Canonical JSON | Hard/Context/graph doğrulama ve mismatch tespiti |
| 3 | Kanıt paketi üretimi | Evidence Pack generator | Evidence Pack | JSON Pointer, metrik, kural ID bütünlüğü validation |
| 4 | PII maskeleme | Tokenization Gateway | Tokenized evidence input | Deterministic token üretimi ve kapsam validation |
| 5 | Narration üretimi | LLM Narration Engine | Tokenized Evidence Pack | Narrator-only kuralı ve no-synonyms uyumu |
| 6 | Çıktı kapı kontrolü | Gateway validator | Narrative output | Draft-07 şema validation, uygunsuzsa gateway rejection |
| 7 | Yüksek riskli bulgu incelemesi | Human-in-the-Loop | High-risk finding output | Manuel onay validation |

- Workflow B — Multi-Stage Detection Pipeline

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
| --- | --- | --- | --- | --- |
| 1 | Spotlighting | Tokenization Gateway | Untrusted text segments | Güvenilmeyen metnin belirteçlerle çevrelenmesi |
| 2 | Aşama 1 – Regex-based Pattern Matching | Deterministic scanning layer | Candidate text | Bilinen enjeksiyon dizilerinin regex ile validation |
| 3 | Aşama 2 – ML-based Semantic Classifiers | Classifier model | Candidate text | Kılık değiştirmiş şüpheli dil örüntüsü validation |
| 4 | Aşama 3 – LLM-based Intent Analysis | Sentinel Model | Candidate text | Niyet analizi; şüpheli ise ana motora geçişin engellenmesi |
| 5 | No-Synonyms Enforcement + Schema gate | LLM output gate | Narrative JSON | Alan adı sadakati ve Draft-07 şema validation |
| 6 | High-risk escalation | Human-in-the-Loop | High-risk output | Manuel inceleme ve onay |

Canonical Consistency Checks (MVP)
- Check Catalog (Closed-Loop)

| Check Group | Check Name | Inputs | Comparison / Validation | Evidence Output (what must be logged) |
| --- | --- | --- | --- | --- |
| Role Boundary | Narrator-only separation | Evidence Pack, LLM output | LLM’in karar değiştirmediğinin validation | Role-boundary pass/fail evidence |
| Lexical Determinism | No-Synonyms Enforcement | LLM output, canonical field dictionary | `supplier.vkn`, `payment.iban`, `document.issue_date`, `document.uuid`, `references.despatch_id` birebir kullanım kontrolü | Alan-adı mismatch kayıtları |
| Output Contract | Draft-07 JSON Schema gate | LLM output JSON | Şema uygunluk validation; uygunsuz çıktının gateway rejection | Schema validation sonucu + rejection reason |
| Injection Safety | Spotlighting boundary check | Untrusted text segments | Belirteçler arası içeriğin talimat olarak işlenmemesi doğrulaması | Boundary tagging evidence |
| Injection Safety | Aşama 1 – Regex-based Pattern Matching | Candidate text | Bilinen örüntülerin regex ile tespiti | Pattern match evidence |
| Injection Safety | Aşama 2 – ML-based Semantic Classifiers | Candidate text | Semantik şüpheli içerik sınıflandırması validation | Classifier score/evidence |
| Injection Safety | Aşama 3 – LLM-based Intent Analysis | Candidate text | Sentinel model niyet analizi | Intent analysis evidence ve engelleme kaydı |
| Privacy | Deterministic tokenization consistency | PII fields, token outputs | Aynı oturumda aynı girdinin aynı token değerini üretme validation | Token mapping consistency evidence |
| Escalation | Human-in-the-Loop trigger | High-risk findings | High-risk bulguların manuel onaya düşmesi validation | Escalation evidence |

Evidence Output Contract
- Output Artifacts (as stated)
  - Read-only, machine-readable Evidence Pack.
  - Denetçi/uyum uzmanı için Evidence Pack temelli narration çıktısı.
  - Security Violation bayrağı (şüpheli niyet tespitinde).
  - Kriptografik denetim izi girdileri.

- JSON Payload — Canonical Field Set

| Field Group | Included Fields (Minimum) | Notes / Constraints (from input) |
| --- | --- | --- |
| Rule evidence | JSON Pointers, rule IDs, error metrics | Deterministik kural çıktısını temsil eder. |
| Canonical identifiers | `document.uuid`, `references.despatch_id`, `supplier.vkn`, `payment.iban` | Narration katmanında alan adları eşanlamsız kullanılmalıdır. |
| Security pipeline | Spotlighting markers, stage outcomes, security violation flag | Aşama 1/2/3 sonuçları ve engelleme kararları evidence olarak tutulur. |
| Schema gate | Draft-07 validation status, rejection status | Şema dışı çıktılar gateway tarafından reddedilir. |
| Tokenization | Token values (`VKN_`, `TCKN_`, `IBAN_`, `COMPANY_`, `EMAIL_`, `PHONE_`) | Token yaşam döngüsü session-only olarak belirtilmiştir. |

- Required/Optional matrix governance:
  - Belge bazlı required/optional alan matrisi için `cannonical.md` §3.2, §3.4 ve API canonical payload tabloları referans alınır.

Implementation Notes (storage-neutral)
- Operating model on-premise / VPC-isolated / air-gapped seçenekleriyle tanımlanmıştır.
- Inference katmanı için vLLM (v0.5.0+) ve GPU olmayan senaryoda llama.cpp alternatifi belirtilmiştir.
- Quantization stratejisi MVP için 4-bit (Q4_K_M), üretim için 8-bit (Q8_0) olarak tanımlanmıştır.
- Kural yürütme, JSON pointer çıkarımı ve Evidence Pack üretimi dahil toplam işlem için p95 gecikme hedefi 100 milisaniye altı olarak belirtilmiştir.
- Telemetri akışı Sidecar Pattern ve persistent disk-backed queue ile asenkron toplanacak şekilde belirtilmiştir.
- Servis kimliği için SPIFFE tabanlı SVID sertifikaları belirtilmiştir.

Operational Notes
- Cryptographic audit trail: append-only log, linear hash chain (prev_hash), Merkle Hash Tree, RFC 8785 canonicalization.
- Kriptografik imzalama işlemlerinin FIPS 140-3 Seviye 3 uyumlu HSM içinde yürütülmesi belirtilmiştir.
- WORM depolama modunda 5 ila 10 yıl arası yasal saklama yaklaşımı belirtilmiştir.
- Token reverse lookup verisinin HSM-encrypted ayrı veritabanında tutulduğu belirtilmiştir.
- Token lifespan yönetimi session-only ve rapor üretimi sonrası auto-purge olarak belirtilmiştir.
- Şema reddi dönüş formatı RFC 7807 problem-details yapısı (`422`) ile uyumlu olacak şekilde standartlaştırılır.
- Truncated hash çakışma yönetimi: full SHA-256 + 8-character display alias birlikte saklanır.
- Human-in-the-Loop devreye giriş eşiği: `RPS >= 60`.
- No-Synonyms sözlüğü sürüm kaynağı: `config/no_synonyms_dictionary.yaml` (`v1.0`).

Open Questions
- Closed in D3: required/optional matrisi, şema rejection formatı, hash çakışma yönetimi, Human-in-the-Loop eşiği ve no-synonyms sözlük sürüm kaynağı standartlaştırıldı.
