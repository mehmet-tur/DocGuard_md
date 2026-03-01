✅ 03 — Canonical Output — Deep Research_ Compliance & Data Retention.md

Module Metadata
- Module Name: Compliance & Data Retention Report
- Source File ID: Deep Research_ Compliance & Data Retention.md
- Version: Not explicitly stated in this file.

Purpose
- Türkiye ve Avrupa Ekonomik Alanı kapsamındaki çok katmanlı regülasyonların (özellikle KVKK, GDPR, BDDK, MASAK, VUK, TTK) veri işleme ve saklama etkilerini birlikte tanımlamak.
- UBL-TR e-Fatura/e-Arşiv akışlarında bulunan PII alanlarının envanterini, canonical alan eşlemelerini ve risk sınıflarını ortaya koymak.
- Data minimization ile zorunlu saklama süreleri arasındaki çelişkiyi, uygulanabilir retention policy şablonu ile yönetmek.
- Evidence Pack üretimi ve LLM anlatım hattında PII leakage riskini azaltmak için redaction/pseudonymization yaklaşımını tanımlamak.
- MVP lansmanı öncesi compliance checklist ve sponsor banka denetim hazırlık beklentilerini sıralamak.

MVP Scope
- MVP Boundary Principle:
  - Data minimization ilkesi ile kanuni retention zorunluluklarının birlikte uygulanması gerekir.
  - UBL-TR kaynaklı PII alanları sistematik maskeleme/pseudonymization kontrolünden geçmelidir.
  - LLM anlatımına sadece maskelenmiş Evidence Pack içeriği verilmelidir.
- Ingestion Scope:
  - UBL-TR XML tabanlı e-Fatura/e-Arşiv belgeleri.
  - Canonical JSON alanları ve Evidence Pack üretim çıktıları.
  - Audit log, dashboard ve reviewer queue’lara giden izleme çıktıları.
  - KYC/KYB, transaction monitoring ve STR süreçlerine bağlı kimlik/işlem verileri.
- MVP Extraction Boundaries (Explicitly Mapped Fields)

| Category | Document | Extracted Fields (as stated) |
| --- | --- | --- |
| Party identity | UBL-TR Invoice | `supplier.vkn`, `customer.vkn` |
| Party identity | UBL-TR Invoice | `supplier.tckn`, `customer.tckn` |
| Party naming | UBL-TR Invoice | `supplier.name`, `customer.name` |
| Payment identifiers | UBL-TR Invoice | `payment.iban`, `payment.bic` |
| Contact vectors | UBL-TR Invoice | `supplier.contact.phone`, `supplier.contact.email` |
| Delivery location | UBL-TR Invoice | `delivery.street`, `delivery.city` |
| Product text | UBL-TR Invoice | `lines.item_name` |
- MVP Validations (Computational Core)
  - Rule H007 ile VKN/TCKN format ve mod-10 validation.
  - Rule H008 ile IBAN Mod-97 validation.
  - Rule C003 ile TR dışı IBAN ülke kodu kontrolü.
  - Rule C005/C006 ve Signal G005 bağlamında kimlik/ilişki discrepancy kontrolleri.
  - Rule H010 kapsamında `lines.item_name` alanı mevcutluk kontrolü.
  - Draft-07 JSON Schema zorunluluğu ve `additionalProperties: false` kısıtı.
  - XML parser hardening: DTD/ENTITY/SYSTEM vektörlerinin reddi ve XXE önleme.
  - Redaction middleware adımıyla PII düğümlerinin maskelenmesi (LLM öncesi).

Out of Scope
- Saf anonymization ile geri izlenebilirliğin tamamen kaldırıldığı işlem izleme yaklaşımı (transaction monitoring için operasyonel olarak uygun olmadığı belirtilmiştir).
- Non-production ortamlarda gerçek ve maskelenmemiş PII kullanımı.

Actors & Core Entities
- Actors

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
| --- | --- | --- |
| KVKK | Veri koruma otoritesi | Consent, minimization ve VERBIS uyum gereksinimleri |
| BDDK | Bankacılık düzenleyici otoritesi | Bilgi sistemleri, denetim evrakı saklama ve güvenlik kontrolleri |
| MASAK | Finansal suç izleme otoritesi | KYC/KYB, STR ve uzun dönem işlem log saklama gereksinimleri |
| GİB | Vergi ve e-belge standardı otoritesi | UBL-TR e-Fatura/e-Arşiv canonical doğrulama ve arşivleme çerçevesi |
| Rule engine | Deterministik kontrol katmanı | Rule tetikleme, Evidence Pack üretimi |
| Redaction middleware | Masking/pseudonymization katmanı | Evidence Pack içindeki PII düğümlerini maskeleme |
| LLM narrator | Narration katmanı | Maskelenmiş Evidence Pack üzerinden açıklama üretimi |
| CCO / DPO / legal representatives | Sınırlı arşiv erişim aktörleri | Extended retention katmanına koşullu erişim |

- Core Entities (Canonical)

| Entity | Definition (from input) | Primary Identifiers / Fields |
| --- | --- | --- |
| Regulation summary matrix | Regülasyonların retention ve operasyon etkisi tablosu | Framework, authority, mandate, retention, impact |
| UBL-TR PII inventory | UBL-TR içinde kritik PII alanları | VKN, TCKN, IBAN, ad/iletişim/adres alanları |
| Evidence Pack (Draft-07 JSON) | Rule tetikleme çıktısı | Rule parametreleri, tetiklenen alanlar, risk gerekçesi |
| Retention policy template | Saklama-yok etme yönetişim şablonu | Objective, principles, retention matrix, access, destruction |
| MVP compliance checklist | Lansman öncesi uyum kontrol listesi | Domain, milestone, operational action, authority |

Workflows
- Workflow A — Redaction Middleware Sequence (Raw Evidence Pack -> Masked -> LLM)

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
| --- | --- | --- | --- | --- |
| 1 | Rule engine ham UBL-TR XML üzerinde kontrol hesapları yapar | Rule engine | Raw UBL-TR data | Finansal ve kimlik kuralları doğruluk validation |
| 2 | Tetiklenen kural için structured Evidence Pack üretilir | Rule engine | Draft-07 JSON Evidence Pack | Kural/alan eşleşme validation |
| 3 | Redaction middleware Evidence Pack’i yakalar ve PII düğümlerine FPE veya size-preserving masking uygular | Redaction middleware | Masked Evidence Pack | PII node tespiti ve masking completeness validation |
| 4 | Sadece maskelenmiş Evidence Pack LLM context’ine verilir | LLM narrator | Masked narrative output | No-Synonyms altında maskeli değerlerin korunumu |

- Workflow B — Statutory Retention and Access Lifecycle

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
| --- | --- | --- | --- | --- |
| 1 | Primary purpose bitiminde verinin operasyonel katmandan ayrılması | Data governance owners | Segregated archive candidate set | Storage limitation uyumu validation |
| 2 | Extended retention katmanına taşıma ve şifreleme/pseudonymization | Archive/security layer | Encrypted/pseudonymized archive data | Retention süreleri ve arşiv bütünlüğü validation |
| 3 | Erişim yalnızca CCO/DPO/legal rollere koşullu verilir | Access governance | Access request + immutable log | RBAC/MFA ve inquiry-subpoena şart doğrulaması |
| 4 | Süre dolduğunda onaylı yok etme/anonymization protokolü uygulanır | Data destruction process | Certificate/log of destruction | Irreversible destruction evidence validation |

Canonical Consistency Checks (MVP)
- Regulation Summary Table

| Regulatory Framework | Managing Authority | Core Mandates | Mandatory Retention Period | Architectural Impact |
| --- | --- | --- | --- | --- |
| KVKK (Law No. 6698) | Personal Data Protection Authority (KVKK) | Lawfulness, fairness, purpose limitation, minimization, explicit consent, data subject rights | Purpose süresiyle sınırlı; amaç bitince erase/destroy/anonymize | CMP, dynamic masking, VERBIS kayıt gereksinimi |
| GDPR (EU 2016/679) | European Data Protection Board (EDPB) | Privacy by design/default, storage limitation, security of processing | En kısa gerekli süre; otomatik review/erase/pseudonymize limitleri | Pseudonymization, end-to-end encryption, RoPA, audit trails |
| BDDK IT Regulation (Law No. 5411) | BDDK | Sistem dayanıklılığı, veri yerelleştirme, outsourcing yönetişimi | Yetkili dış denetim çalışma evrakı için minimum 5 yıl | Vulnerability scanning, encrypted transmission, TPRM, endpoint koruması |
| MASAK (Law No. 5549) | MASAK | Transaction monitoring, STR, KYC/KYB | İş ilişkisi bitiminden sonra 8 yıl | Biometric/document verification entegrasyonu, immutable evidentiary storage |
| VUK (Law No. 213) | GİB | Elektronik finansal belge düzenleme, validation, arşivleme | 5 yıl | Canonical XML’in immutable ve cryptographic sealing ile arşivlenmesi |
| TTK (Law No. 6102) | Ministry of Trade | Ticari defter ve kurumsal kayıt saklama | 10 yıl | Uzun süreli erişilebilir cold storage mimarisi |

- Check Catalog (Closed-Loop)

| Check Group | Check Name | Inputs | Comparison / Validation | Evidence Output (what must be logged) |
| --- | --- | --- | --- | --- |
| Identity structure | H007 VKN/TCKN validation | `supplier.vkn`, `customer.vkn`, `supplier.tckn`, `customer.tckn` | Format ve mod-10 kontrolü | Rule trigger evidence |
| Bank account structure | H008 IBAN validation | `payment.iban` | Mod-97 ve TR format kontrolü | Rule trigger evidence |
| Cross-border indicator | C003 Yabancı IBAN | `payment.iban` | Ülke kodu `TR` dışı mismatch kontrolü | Context trigger evidence |
| Product text completeness | H010 item name check | `lines.item_name` | Alan mevcutluk/boşluk kontrolü | Rule trigger evidence |
| Data contract | Draft-07 schema gate | Evidence Pack JSON | `additionalProperties: false` ve şema uygunluk validation | Schema acceptance/rejection evidence |
| XML input hardening | XXE/ENTITY/SYSTEM rejection | Incoming XML payload | DTD, external entities ve keyword whitelist kontrolü | Input rejection evidence |
| PII masking gate | Pre-LLM redaction | Raw Evidence Pack | PII nodes masked mi kontrolü | Masking evidence and sanitized output trace |

- MVP Compliance Checklist (as stated)

| Compliance Domain | Milestone / Requirement | Operational Action Required | Regulatory Authority |
| --- | --- | --- | --- |
| Corporate Governance & Licensing | Legal Entity Structuring | TTK uyumlu kurumsal yapı, sermaye, şeffaf ortaklık, BDDK beklentilerine uygun sözleşme seti | BDDK / Ministry of Trade |
| Corporate Governance & Licensing | License Scope Determination | MVP sınıfını (e-money, payment service, open banking under Law No. 6493) net tanımlama | CBRT |
| Corporate Governance & Licensing | Compliance Officer Designation | Adı belirli iç sorumlu atama (CCO) | BDDK / MASAK |
| Data Privacy & KVKK Adherence | VERBIS System Registration | Kişisel veri işleme öncesi VERBIS kaydı ve kategori/amaç/süre belgelemesi | KVKK |
| Data Privacy & KVKK Adherence | Consent Management Platform (CMP) | Granular, informed, revocable consent toplama | KVKK |
| Data Privacy & KVKK Adherence | Data Mapping & Transparent Notices | Uçtan uca veri haritalama ve açık privacy notices | KVKK |
| Financial Crimes & AML (MASAK) | KYC/KYB Identity Verification | Güncel MASAK gereksinimlerine uygun güçlü kimlik doğrulama | MASAK |
| Financial Crimes & AML (MASAK) | Transaction Monitoring Thresholds | Gerçek zamanlı izleme ve threshold tabanlı enhanced due diligence tetikleme | MASAK |
| Financial Crimes & AML (MASAK) | Suspicious Transaction Reporting (STR) | Şüpheli aktivite tespitinden sonra 10 iş günü içinde STR gönderim hattı | MASAK |
| Information Security & Resilience | PCI-DSS Certification | PAN/cardholder data varsa PCI-DSS, segmentasyon, TLS 1.2+, MFA | PCI Security Standards Council |
| Information Security & Resilience | Third-Party Risk Assessment (TPRM) | Harici API/cloud/SaaS envanteri ve güvenlik değerlendirmesi | BDDK / Internal Audit |

Evidence Output Contract
- Output Artifacts (as stated)
  - Draft-07 JSON Evidence Pack.
  - Masked Evidence Pack.
  - LLM narrative output (masked values üzerinden).
  - Immutable audit ledger erişim/log kayıtları.

- JSON Payload — Canonical Field Set

| Field Group | Included Fields (Minimum) | Notes / Constraints (from input) |
| --- | --- | --- |
| Rule context | Triggered field nodes and rule parameters | Draft-07 JSON schema under strict contract |
| PII-sensitive nodes | VKN/TCKN/IBAN ve ilgili kimlik alanları | LLM öncesi redaction middleware zorunludur |
| Schema controls | Top-level `additionalProperties: false` | Yetkisiz alan enjeksiyonunu engellemek için belirtilmiştir |
| Access trace | Access request and immutable access log entries | Extended retention erişimi koşullu ve loglu olmalıdır |

Implementation Notes (storage-neutral)
- Tiered data lifecycle yaklaşımı belirtilmiştir: aktif fazda operational DB, amaç bitince operasyonelden purge ve segregated archive.
- Extended retention için şifreleme/pseudonymization ve HSM/secure key management ile anahtar ayrıştırması belirtilmiştir.
- XML parser hardening (DTD disable, XInclude/parameter entity disable, lexical whitelisting) belirtilmiştir.
- Draft-07 schema gate ve end-to-end TLS 1.2/1.3 ile mikroservis veri transferi belirtilmiştir.

Operational Notes
- Statutory Retention Matrix (Article 3) süreleri belirtilmiştir:
  - Electronic Invoices (e-Fatura/e-Arşiv): 5 yıl.
  - Commercial Accounting Records & Main Ledgers: 10 yıl.
  - KYC/KYB Identification Documents & Profiles: 8 yıl.
  - Information Systems Audit Working Papers: 5 yıl.
  - Website Traffic & Digital Connection Logs: 2 yıl.
  - General Assembly Meeting Minutes & Share Registers: 10 yıl.
- Bank audit readiness alanında governance, outsourcing compliance ve systems architecture evidence başlıkları altında dokümantasyon beklentileri belirtilmiştir.

Open Questions
- Not explicitly stated in this file: Redaction middleware için zorunlu performans eşiği (latency/throughput).
- Not explicitly stated in this file: Draft-07 Evidence Pack’in tam required alan listesi.
- Not explicitly stated in this file: Masking teknikleri için tercih önceliği (FPE vs deterministic tokenization) karar matrisi.
- Not explicitly stated in this file: Archive tier için fiziksel ortam/teknoloji standardı.
