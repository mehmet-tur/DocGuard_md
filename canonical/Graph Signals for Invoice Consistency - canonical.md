✅ 03 — Canonical Output — Graph Signals for Invoice Consistency.md

Module Metadata
- Module Name: Graph & Relationship Signals Report
- Source File ID: Graph Signals for Invoice Consistency.md
- Version: Not explicitly stated

Purpose
- e-Fatura ve e-İrsaliye doğrulamasını belge-içi kontrolden ilişki-merkezli analize genişletmek.
- UBL-TR kanonik alanlarını çok modlu node/edge grafına eşleyerek geçmiş ilişki örüntülerinde discrepancy tespit etmek.
- G001–G008 sinyal kataloğu ile ilişki tabanlı consistency check çıktıları üretmek.
- MVP’de dış veri kaynağı olmadan, yalnızca sistem içi tarihsel veri ile graph signal evidence üretmek.
- Signal çıktılarının AI veya insan inceleme modülleri için nötr ve izlenebilir Evidence Pack formatında sunulmasını tanımlamak.

MVP Scope
- MVP Boundary Principle:
  - Belge-merkezli validation yerine ilişki-merkezli graph analizi uygulanır.
  - Sinyaller binary reddetme kararı üretmez; sonraki verification adımları için evidence üretir.
  - Harici veri kaynaklarına bağımlılık olmadan, sistem içi tarihsel kayıtlarla çalışır.
- Ingestion Scope:
  - UBL-TR kanonik alanlarından node üretimi: VKN, TCKN, IBAN, UUID, Despatch ID, kurumsal isim.
  - UBL-TR taraflarından edge üretimi: `cac:AccountingSupplierParty`, `cac:AccountingCustomerParty`, `cac:PaymentMeans`.
  - İlişki öznitelikleri: issue_date, issue_time, payable_amount, currency ve ilgili metadata alanları.
- MVP Extraction Boundaries (Explicitly Mapped Fields)

| Category | Document | Extracted Fields (as stated) |
| --- | --- | --- |
| Node identity | UBL-TR canonical JSON | `supplier.vkn`, `customer.vkn`, `supplier.tckn`, `customer.tckn` |
| Financial endpoint | UBL-TR canonical JSON | `payment.iban` |
| Document identity | UBL-TR canonical JSON | `metadata.uuid` |
| Logistics reference | UBL-TR canonical JSON | `references.despatch_id` |
| Lexical identity | UBL-TR canonical JSON | `supplier.name`, `customer.name` |
| Edge attributes | UBL-TR canonical JSON | `issue_date`, `issue_time`, `payable_amount`, `currency`, relationship metadata |
- MVP Validations (Computational Core)
  - Shared IBAN hub yapılarında çoklu satıcı bağlantısı validation.
  - Yeni ticari bağlantıda tutar seviyesi discrepancy (G002: `payable_amount > 3x historical median`).
  - Yoğun zaman kümelenmesi (`<24` saat penceresi) validation.
  - Yönlü döngüsel faturalama yolunda cycle validation.
  - Leksikal kimlik benzerliği + ortak IBAN eşleşmesi validation.
  - Çok sıçramalı yol ve ara Despatch ID eksikliği discrepancy kontrolü.
  - Karşılıklı ticaret dengesi ve net fark değerlendirmesi.

Out of Scope
- MVP aşamasında native graph database (ör. Neo4j, ArangoDB) zorunluluğu.
- Harici veri kaynakları ile zenginleştirme.

Actors & Core Entities
- Actors

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
| --- | --- | --- |
| Relationship verification system | Graph üretim ve sinyal yürütme | Kayıtlardan node/edge çıkarımı ve sinyal çalıştırma |
| SQL query layer | Path ve döngü analizi | Recursive CTE ile cycle/path validation |
| AI or human review modules | Sonraki inceleme adımı | Signal evidence üzerinden değerlendirme |

- Core Entities (Canonical)

| Entity | Definition (from input) | Primary Identifiers / Fields |
| --- | --- | --- |
| Entity (VKN) node | Kurumsal aktör düğümü | `supplier.vkn`, `customer.vkn` |
| Entity (TCKN) node | Gerçek kişi/şahıs işletmesi düğümü | `supplier.tckn`, `customer.tckn` |
| Financial (IBAN) node | Ödeme varış noktası | `payment.iban` |
| Document (UUID) node | İşlem kaydının immutable belge düğümü | `metadata.uuid` |
| Logistics (Despatch) node | Fiziksel sevkiyat referansı | `references.despatch_id` |
| Corporate Name node | Leksikal kimlik doğrulaması için isim düğümü | `supplier.name`, `customer.name` |
| ISSUED_TO edge | Seller -> Buyer finansal yükümlülük ilişkisi | `issue_date`, `payable_amount`, `currency` |
| PAID_VIA edge | Seller -> IBAN ödeme ilişkisi | `last_used_date`, `frequency_count` |
| LINKED_TO edge | Document -> Despatch ilişki bağı | `reference_type`, `issue_date` |
| DECLARED_BY edge | VKN -> kurumsal isim eşlemesi | `validity_start`, `validity_end` |
| SAME_CONTACT edge | Ortak iletişim metadata’sından türetilen ilişki | `contact_email`, `phone_number` |

Canonical Consistency Checks (MVP)
- Check Catalog (Closed-Loop)

| Check Group | Check Name | Inputs | Comparison / Validation | Evidence Output (what must be logged) |
| --- | --- | --- | --- | --- |
| G001 | Çapraz Satıcı IBAN Paylaşımı | PAID_VIA edges, Seller VKN nodes, IBAN node | Bir IBAN’a birden fazla distinct Seller VKN bağlantısı validation | VKN listesi, VKN başına hacim, IBAN first/last seen tarihleri |
| G002 | Yeni Bağlantı Yüksek Tutar | First-time ISSUED_TO edge, payable_amount, buyer historical median | `payable_amount > 3x` Buyer historical median validation | payable_amount, historical_median, buyer_vkn, seller_vkn, relationship age |
| G003 | Yoğun Zaman Kümelenmesi | ISSUED_TO edge timestamps | `<24` saat penceresinde edge yoğunluğu validation | Edge count, temporal variance, cumulative payable_amount, issue_time sequence |
| G004 | Yönlü Döngüsel Faturalama | ISSUED_TO path set | `(A)->(B)->(C)->(A)` kapalı yol validation | UUID path, VKN sequence, net volume difference, hop timestamps |
| G005 | Leksikal Kimlik Çakışması | Name similarity, VKN pairs, shared IBAN | Yüksek leksikal benzerlik + farklı VKN + ortak IBAN discrepancy kontrolü | Levenshtein distance, shared IBAN, VKN pair, total turnover |
| G006 | Yol Uzunluğu Aykırılığı | Invoice path, Despatch references | `>3` hop zincirde ara Despatch ID eksikliği validation | Path depth, intermediary VKN list, missing despatch_date markers |
| G007 | Kurumlar Arası VKN Çakışması | Supplier VKN context, contact/authorized metadata context | Aynı VKN’nin farklı rol bağlamlarında görünmesi discrepancy kontrolü | Overlapping VKN, field location, two-entity transaction volume |
| G008 | Karşılıklı Ticaret Dengesi | Bidirectional ISSUED_TO edges, payable_amount sets | `(A)->(B)` ve `(B)->(A)` near-identical payable_amount karşılaştırması | Net balance, amount variance, unit code overlap, temporal alignment |

Evidence Output Contract
- Output Artifacts (as stated)
  - Graph signal sonuçlarını taşıyan yapılandırılmış JSON Evidence Pack.
  - Node, edge ve tarihsel metrikleri içeren explainability kayıtları.

- JSON Payload — Canonical Field Set

| Field Group | Included Fields (Minimum) | Notes / Constraints (from input) |
| --- | --- | --- |
| Signal identity | Signal ID, Signal Name | G001–G008 kataloguyla birebir eşleşmelidir. |
| Graph structure evidence | Node/edge references, path data | İlişki örüntüsünü izlenebilir şekilde göstermelidir. |
| Metrics | Hacim, tarih, varyans, yaş, net denge vb. | Sinyal tablosunda tanımlı metrikler kullanılmalıdır. |
| Explainability text | Signal-specific açıklama metni | Nötr ve açıklayıcı olmalıdır. |

- Example Evidence (G002) — Compact Table

| Field | Value (as stated) |
| --- | --- |
| Signal ID | G002 |
| Signal Name | Yeni Bağlantı Yüksek Tutar |
| Edge Detail | (Seller: VKN_X) --> (Buyer: VKN_Y) |
| Invoice Detail | ID: ABC2024000000001, Amount: ₺2,500,000 |
| Buyer Context | Historical Median: ₺15,000; Max Historical: ₺80,000 |
| Relative Volatility | 166.6x |
| Relationship Age | 0 days |

Implementation Notes (storage-neutral)
- MVP depolama yaklaşımı PostgreSQL adjacency tables + recursive CTE ile tanımlanmıştır.
- `graph_nodes` ve `graph_edges` ayrımı ile komşuluk sorguları ve yol analizi desteklenir.
- G004 için WITH RECURSIVE yaklaşımı ve pratik MVP sınırı olarak `depth < 5` örneği verilmiştir.
- G003 ve G001 gibi yüksek frekanslı toplulaştırmalar için materialized view yaklaşımı belirtilmiştir.
- Hub detection örneğinde `PAID_VIA` üzerinden `COUNT(DISTINCT source_node) > 1` koşulu ile IBAN hub gösterimi verilmiştir.

Operational Notes
- Materialized view yenilemesi periyodik olarak (ör. nightly veya batch ingestion sonrası) belirtilmiştir.
- Signal çıktıları doğrudan son karar yerine sonraki validation/inceleme akışına evidence sağlar.

Open Questions
- Not explicitly stated: G001–G008 için üretim ortamında tekil eşik konfigürasyonlarının merkezi parametre dosyası.
- Not explicitly stated: Evidence Pack JSON şemasının required alan listesi ve sürümleme yöntemi.
- Not explicitly stated: False positive mitigation maddelerinin zorunlu/opsiyonel işletim kuralı.
- Not explicitly stated: Materialized view refresh için sabit bir zamanlama değeri.
