✅ 03 — Canonical Output — Database Schema & ERD Report.md

Module Metadata
- Module Name: Database Schema & ERD Report
- Source File ID: Database Schema & ERD Report.md
- Version: Not explicitly stated in this file.

Purpose
- Yüksek hacimli OLTP işleme ile denetlenebilirlik ve değiştirilemezlik gereksinimlerini aynı ilişkisel şema içinde birlikte karşılamak.
- İşlemsel tablolar ile append-only denetim izi katmanını fiziksel/mantıksal olarak ayrıştırarak performans izolasyonu sağlamak.
- PII içeriğini deterministik tokenization ile operasyonel veritabanı dışında tutmak ve eşleştirme/graph analizini tokenlar üzerinden yürütmek.
- Evidence Pack üretimini esnek JSONB/JSON depolama ile yönetirken sorgu performansını indeksleme ve TOAST mekanizmalarıyla korumak.
- ERD ilişkileri üzerinden invoices, evidence_packs, audit_logs ve graph_edges etkileşimini ACID bütünlüğüyle tanımlamak.

MVP Scope
- MVP Boundary Principle:
  - İşlemsel veriler ve audit izleri ayrı katmanlarda yönetilir.
  - audit_logs tablosu mantıksal olarak append-only olacak şekilde zorunlu kontrol altındadır.
  - PII alanları veritabanına düz metin olarak yazılmaz; deterministik tokenlar üzerinden işlenir.
- Ingestion Scope:
  - invoices tablosuna finansal belge metadata ve durum bilgileri.
  - evidence_packs tablosuna rule çıktıları, triggers_json ve risk_score.
  - audit_logs tablosuna olay, hash zinciri alanları ve signature.
  - graph_edges tablosuna varlıklar arası edge kayıtları (source/target/type/weight/last_seen).
- MVP Extraction Boundaries (Explicitly Mapped Fields)

| Category | Document | Extracted Fields (as stated) |
| --- | --- | --- |
| Invoices core fields | invoices | `id`, `invoice_uuid`, `issue_date`, `masked_supplier_id`, `masked_customer_id`, `total_amount`, `currency`, `status` |
| Evidence fields | evidence_packs | `id`, `invoice_id`, `rule_pack_version`, `triggers_json`, `risk_score`, `created_at` |
| Audit chain fields | audit_logs | `id`, `event_type`, `previous_hash`, `payload_hash`, `current_hash`, `timestamp`, `signature` |
| Graph edge fields | graph_edges | `source_entity_id`, `target_entity_id`, `edge_type`, `weight`, `last_seen` |
- MVP Validations (Computational Core)
  - invoices tarafında veri tipi ve kısıtlar: `invoice_uuid UNIQUE NOT NULL`, `issue_date NOT NULL`, `total_amount NUMERIC(19,4)/DECIMAL(19,4)`.
  - evidence_packs tarafında referans bütünlüğü: `invoice_id` foreign key.
  - `triggers_json` için JSONB/JSON yapısı + GIN indeksleme yaklaşımı.
  - audit hash zinciri tutarlılığı: `previous_hash` -> `current_hash` bağının doğrulanması.
  - Append-only enforcement:
    - `BEFORE UPDATE OR DELETE OR TRUNCATE ON audit_logs` koşulunda EXCEPTION fırlatma.
    - `audit_logs` üzerinde yalnızca `INSERT` ve `SELECT`; `UPDATE/DELETE/TRUNCATE/ALTER` yetkileri verilmez.
  - graph_edges için CTE/`WITH RECURSIVE` traversal ve cycle detection yaklaşımı.

Out of Scope
- Harici graph veritabanına (ör. Neo4j/Amazon Neptune) veri dışa aktarımlı mimari.

Actors & Core Entities
- Actors

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
| --- | --- | --- |
| Deterministik kural motoru | Ana işleme katmanı | invoices üzerinde analiz, evidence_packs üretimi |
| Veritabanı motoru (PostgreSQL/MySQL) | ACID ve veri saklama katmanı | Kısıt/indeks/partition yönetimi |
| Auditor daemons | Zincir doğrulama katmanı | audit_logs hash zinciri validation |
| DBA | Operasyon/performans katmanı | İndeks, partition, bakım işlemleri (append-only kurallarına tabi) |
| Mikroservisler | Olay üretim katmanı | audit_logs kayıtları ve event akışı |

- Core Entities (Canonical)

| Table | Purpose | Key Columns/Constraints (as stated) |
| --- | --- | --- |
| invoices | İşlemsel fatura merkezi | `id` PK BIGINT, `invoice_uuid` UNIQUE NOT NULL, `issue_date` partition key, token alanları, `total_amount` NUMERIC/DECIMAL, `status` |
| evidence_packs | Deterministik kanıt paketi deposu | `invoice_id` FK, `rule_pack_version`, `triggers_json` (JSONB/JSON), `risk_score`, `created_at` |
| audit_logs | Append-only denetim izi | `current_hash` UNIQUE, `previous_hash`, `payload_hash`, `signature`, `timestamp`; update/delete/truncate engelli model |
| graph_edges | İlişki ağı kenar listesi | `source_entity_id`, `target_entity_id`, `edge_type`, `weight` default 1.0, `last_seen`; ileri/geri traversal indeksleri |

Workflows
- Workflow A — Invoice to Evidence to Audit Atomic Unit

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
| --- | --- | --- | --- | --- |
| 1 | invoice kaydı eklenir | Rule engine + DB | invoices row | Temel kısıtlar ve tip doğrulaması |
| 2 | analiz tamamlanır, evidence_packs yazılır | Rule engine | evidence_packs row | FK bütünlüğü ve kural versiyon bağlamı validation |
| 3 | audit_logs zincir halkası eklenir | Microservice + DB | audit_logs row | previous/current hash zinciri ve signature bütünlüğü validation |
| 4 | işlem atomik blokta tamamlanır | DB transaction engine | BEGIN...COMMIT/ROLLBACK | Kısmi kayıt oluşmaması kontrolü |

- Workflow B — Append-Only Enforcement

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
| --- | --- | --- | --- | --- |
| 1 | Yetkisiz UPDATE/DELETE/TRUNCATE girişimi | DB trigger/rule layer | audit_logs target operation | `BEFORE UPDATE OR DELETE OR TRUNCATE` -> EXCEPTION doğrulaması |
| 2 | Yetki kontrolü | DB privilege layer | GRANT/REVOKE state | Sadece INSERT/SELECT izinlerinin aktif olması |
| 3 | Yüksek güvenlik depolama yönlendirmesi | Storage/tablespace layer | audit_logs tablespace | WORM destekli fiziksel izolasyon yaklaşımı |

- Workflow C — Graph Edge Maintenance and Traversal

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
| --- | --- | --- | --- | --- |
| 1 | Edge upsert | Graph write logic | graph_edges row | `ON CONFLICT (source, target, type) DO UPDATE` davranışı |
| 2 | Traversal query | Recursive SQL layer | CTE result set | Cycle detection ve visited path kontrolü |
| 3 | Temporal decay | Scheduled jobs | Updated `weight`, `last_seen` | Zamanla ağırlık azaltma ve pruning tutarlılığı |

- ERD Relationship Table

| From Table | To Table | Relationship | Join Keys (as stated) |
| --- | --- | --- | --- |
| invoices | evidence_packs | 1-to-N (`engine_generates`) | `invoices.id` -> `evidence_packs.invoice_id` |
| invoices | audit_logs | 1-to-N (`immutable_history_trigger`) | `audit_logs.doc_uuid` -> `invoices.invoice_uuid` |
| invoices | graph_edges | N-to-M (`nodes_extracted_from`) | Masked token node extraction; explicit SQL join key not stated |
| graph_edges | graph_edges | N-to-N (`network_traversal`) | Self-referencing adjacency traversal (explicit key pair not stated) |

Canonical Consistency Checks (MVP)
- Check Catalog (Closed-Loop)

| Check Group | Check Name | Inputs | Comparison / Validation | Evidence Output (what must be logged) |
| --- | --- | --- | --- | --- |
| Schema constraints | invoices key/type checks | invoices rows | PK/UNIQUE/NOT NULL ve numeric precision validation | Constraint pass/fail evidence |
| Referential integrity | evidence_packs FK check | `invoice_id` + invoices | FK eşleşme validation | FK violation evidence |
| JSON evidence indexing | triggers_json queryability | evidence_packs JSON | GIN + jsonpath erişim doğrulaması | Query plan/scan evidence |
| Audit immutability | Append-only trigger rule | audit_logs DML attempts | BEFORE UPDATE/DELETE/TRUNCATE exception validation | Rejected operation evidence |
| Privilege enforcement | Revoked destructive privileges | DB role grants | UPDATE/DELETE/TRUNCATE/ALTER yetki yokluğu validation | Permission audit evidence |
| Cryptographic chain | previous/current hash continuity | audit_logs sequence | Zincir kırığı mismatch tespiti | Integrity discrepancy evidence |
| Graph traversal safety | Recursive cycle control | graph_edges recursive queries | Döngü tespit ve sonsuz traversal engeli validation | Traversal/cycle evidence |
| Graph edge uniqueness | Edge duplication control | graph_edges rows | `UNIQUE(source_entity_id, target_entity_id, edge_type)` validation | Duplicate-edge rejection evidence |

Evidence Output Contract
- Output Artifacts (as stated)
  - invoices kayıtları.
  - evidence_packs kayıtları (`triggers_json`, `risk_score`, `rule_pack_version`).
  - audit_logs append-only kayıtları (`previous_hash`, `payload_hash`, `current_hash`, `signature`).
  - graph_edges ilişki kayıtları (`edge_type`, `weight`, `last_seen`).

- JSON Payload — Canonical Field Set

| Field Group | Included Fields (Minimum) | Notes / Constraints (from input) |
| --- | --- | --- |
| Evidence payload body | `triggers_json` | JSONB/JSON yapı; GIN indeksleme stratejisi belirtilmiştir |
| Evidence context | `rule_pack_version`, `risk_score`, `created_at` | Replay/traceability bağlamı |
| Audit chain payload | `event_type`, `previous_hash`, `payload_hash`, `current_hash`, `timestamp`, `signature` | Zincir ve imza bütünlüğü için zorunlu alanlar |

Implementation Notes (storage-neutral)
- invoices için `issue_date` tabanlı Range Partitioning (aylık partition örnekleri) belirtilmiştir.
- Composite indexing stratejileri belirtilmiştir:
  - invoices için token + tarih odaklı sorgu paternleri.
  - graph_edges için forward ve backward traversal indeksleri.
- evidence_packs için JSONB/JSON + GIN + TOAST yaklaşımı belirtilmiştir.
- Graph traversal için `WITH RECURSIVE` ve cycle detection yaklaşımı belirtilmiştir.

Operational Notes
- Append-only denetim modeli için üç katmanlı kontrol mekanizması belirtilmiştir:
  - Trigger/Rule engeli,
  - Privilege revocation,
  - Fiziksel depolama izolasyonu.
- ACID transaction bütünlüğüyle invoice-evidence-audit adımlarının atomik yürütülmesi belirtilmiştir.
- HA/streaming replication senaryolarında token ve hash tabanlı veri akışı yaklaşımı belirtilmiştir.
- Partition bakım varsayılanı: aylık otomatik partition oluşturma.
- Hash zinciri doğrulama varsayılanı: saatlik zamanlanmış doğrulama görevi.

Open Questions
- Closed in D3: `audit_logs.doc_uuid -> invoices.invoice_uuid`, `graph_edges` uniqueness kuralı, partition sıklığı ve hash doğrulama zamanlaması standartlaştırıldı.
