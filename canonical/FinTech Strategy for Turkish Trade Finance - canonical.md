✅ 03 — Canonical Output — FinTech Strategy for Turkish Trade Finance.md

Module Metadata
- Module Name: Business Model & Pricing Strategy
- Source File ID: FinTech Strategy for Turkish Trade Finance.md
- Version: Not explicitly stated

Purpose
- Türkiye ticaret finansmanı operasyonlarında belge inceleme darboğazını tanımlamak ve 45 dakika ortalama manuel akıştan 3 saniye hedefli doğrulama akışına geçiş stratejisini açıklamak.
- Katılım bankaları ve bağımsız faktoring şirketleri için farklı iş modeli ve hız/risk gereksinimlerine göre segment bazlı değer önerisi sunmak.
- İnceleme Önceliği Puanlaması (Review Priority Scoring (RPS)) ile manuel kapasitenin risk odaklı triyajla yönlendirilmesini tanımlamak.
- On-Premise Enterprise License ve işlem bazlı API/SaaS modellerini kapsayan İkili B2B Fiyatlandırma Stratejisi oluşturmak.
- GTM akışında sentetik veri PoC, pilot validasyon ve ölçekleme fazlarını metrik odaklı kurgulamak.

MVP Scope
- MVP Boundary Principle:
  - Çekirdek hedef, ticaret finansmanı belge değerlendirme sürecindeki 45 dakika ortalama manuel akışı 3 saniye hedefli karar destek/validation akışına indirmektir.
  - RPS yaklaşımı tüm işlemleri otomatik sonuçlandırma amacı taşımaz; insan inceleme kapasitesini riskli kümelere yönlendirme amacı taşır.
  - Segmentasyon temelli fiyatlandırma uygulanır: Katılım bankaları için On-Premise Enterprise License, faktoring için işlem bazlı API/SaaS.
- Ingestion Scope:
  - Belge setleri: e-Fatura, Konşimento, gümrük beyannamesi, sevk irsaliyesi, menşe şahadetnamesi, proforma fatura, çek/senet bordrosu.
  - Dosya formatları: PDF, JPEG, TIFF, PNG.
  - Yükleme kanalları: API, web arayüzü (UI), e-posta entegrasyonu.
  - İşleme girdileri: OCR/NLP ile çıkarılan kritik alanlar (VKN, tarih, fatura numarası, toplam tutar, ETTN).
- MVP Extraction Boundaries (Explicitly Mapped Fields)

| Category | Document | Extracted Fields (as stated) |
| --- | --- | --- |
| OCR/NLP extraction | Ticaret finansmanı belge seti | VKN, Tarih, Fatura Numarası, Toplam Tutar, ETTN |
| JSON response payload | API Response | Tarih, Meblağ, VKN, İrsaliye No |
| JSON response payload | API Response | Confidence yüzdeleri |
| JSON response payload | API Response | Anomaly listesi |
| JSON response payload | API Response | GİB ve MFKS çapraz doğrulama sonuçları |
| JSON response payload | API Response | RPS skoru (0-100, renk kodlu) |
- MVP Validations (Computational Core)
  - SHA-256 ve pHash ile mükerrerlik/manipülasyon validation.
  - RPS triyaj eşikleri: 0-20 (Yeşil), 21-65 (Sarı), 66-100 (Kırmızı).
  - OCR confidence doğrulaması (%99+ düşük risk, örnek orta riskte %85).
  - Tarih/miktar/alan consistency check (ör. belge tarihi discrepancy, ilişkisel veri mismatch).
  - GİB ve MFKS çapraz doğrulama sonuçlarının iş akışına dahil edilmesi.
  - 3 saniye içinde JSON yanıt üretimi hedefinin operasyonel validasyonu.

Out of Scope
- Tek tip (one-size-fits-all) fiyatlandırma modeli.
- Tier 1 faktoring paketinde ERP entegrasyon desteği.

Actors & Core Entities
- Actors

| Actor | Role in Workflows | Key Responsibilities / Artifacts |
| --- | --- | --- |
| Katılım bankaları | On-Premise kurumsal kullanıcı | On-Premise kurulum, lisans, SLA ve kurumsal entegrasyon akışının yürütülmesi |
| Bağımsız faktoring şirketleri | API/SaaS kullanıcı | İşlem bazlı API çağrıları, hızlı triyaj ve operasyonel kapasite artırımı |
| Operasyon uzmanı | Manuel review aktörü | Sarı/Kırmızı triyajdaki alan bazlı validation |
| Uyum/İç Kontrol/Şube Yönetimi | Alarm değerlendirme aktörü | Yüksek riskli discrepancy alarmlarının değerlendirilmesi |
| BelgeKalkanı API Gateway | Entegrasyon bileşeni | Belge alımı, işleme, JSON response döndürme |

- Core Entities (Canonical)

| Entity | Definition (from input) | Primary Identifiers / Fields |
| --- | --- | --- |
| Review Priority Scoring (RPS) | 0-100 aralığında risk puanlama ve triyaj mekanizması | Skor aralıkları: 0-20, 21-65, 66-100 |
| Triyaj karar katmanları | Renk kodlu operasyon yönlendirme yapısı | Yeşil, Sarı, Kırmızı |
| On-Premise Enterprise License | Katılım bankalarına yönelik CapEx ağırlıklı model | Kurulum, yıllık lisans, SLA, özel geliştirme kalemleri |
| Transaction-Based Tiered API | Faktoringe yönelik OpEx ağırlıklı model | Tier 1-4 hacim/fiyat yapısı |
| API JSON response | Sistem çıktısı | Ham alanlar, confidence, anomaly listesi, GİB/MFKS sonucu, RPS |

Workflows
- Workflow A — Geleneksel 45 Dakikalık İş Akışı

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
| --- | --- | --- | --- | --- |
| 1 | Fiziksel/Dijital tasnif ve veri hazırlığı (5 dk) | Operasyon uzmanı | PDF/JPEG/TIFF belge setleri | Belge türü ayrımı ve DYS aktarım consistency check |
| 2 | Gözle doğrulama ve okuma (10 dk) | Operasyon uzmanı | Belge metin/tarih/unvan alanları | Görsel alan doğrulama |
| 3 | Çapraz eşleştirme ve rasyonalite kontrolü (15 dk) | Operasyon uzmanı | Fatura, irsaliye, CMR, tutar hesapları | Miktar/tutar discrepancy kontrolü |
| 4 | Dış sistem sorguları (10 dk) | Operasyon uzmanı | GİB, MFKS, TGB sonuçları | Dış kaynak doğrulama consistency check |
| 5 | Nihai karar ve veri girişi (5 dk) | Operasyon uzmanı | Core banking/ERP kayıtları | Manuel karar ve kayıt bütünlüğü validation |

- Workflow B — 3 Saniyelik Otomatize Doğrulama Hattı

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
| --- | --- | --- | --- | --- |
| 1 | Görüntü işleme + OCR | Belge işleme hattı | Girdi belge seti | OCR doğruluk ve okunabilirlik validation |
| 2 | NLP extraction | Çıkarım katmanı | Sayısallaştırılmış metin | Anahtar alan extraction consistency check |
| 3 | Hashing + mükerrerlik kontrolü | Kriptografik kontrol katmanı | SHA-256, pHash çıktıları | Mükerrerlik/manipülasyon discrepancy tespiti |
| 4 | Deterministik kural + asenkron entegrasyon | Kural motoru + entegrasyon servisleri | GİB/MFKS/TGB yanıtları | Kural ve dış yanıt çapraz validation |

- Workflow C — Entegrasyon ve Response Akışı

| Step | Event | Actor(s) | Documents Produced / Used | Required Internal Validation Focus |
| --- | --- | --- | --- | --- |
| 1 | ERP/DYS’den API Gateway’e yük aktarma | Müşteri sistemi + API Gateway | PDF/TIFF/PNG belge | Push/Webhook aktarım bütünlüğü validation |
| 2 | Pipeline yürütme | BelgeKalkanı servisleri | OCR/RPS/çapraz kontrol çıktıları | İşlem ardışıklığı consistency check |
| 3 | JSON response döndürme (maks. 3 saniye) | API Gateway | JSON response | Zaman bütçesi ve alan bütünlüğü validation |
| 4 | Aksiyon entegrasyonu | Müşteri iş akışı | EFT tetikleme veya uyarı pop-up | RPS tabanlı aksiyon doğrulaması |

Canonical Consistency Checks (MVP)
- Check Catalog (Closed-Loop)

| Check Group | Check Name | Inputs | Comparison / Validation | Evidence Output (what must be logged) |
| --- | --- | --- | --- | --- |
| RPS Triyaj | Risk band mapping | RPS score | 0-20 / 21-65 / 66-100 aralık validation | RPS bandı ve aksiyon kaydı |
| OCR Quality | Confidence validation | OCR output | Confidence seviyesine göre triyaj discrepancy kontrolü | Confidence yüzdesi ve alan kaydı |
| Duplicate/Manipulation | SHA-256 + pHash control | Kritik alanlar + belge görseli | Hash/pHash benzerlik mismatch kontrolü | Çakışma/benzerlik evidence kaydı |
| Cross-Source | External result consistency | GİB/MFKS/TGB sonuçları | Çapraz doğrulama sonucu ile belge alanlarının comparison | Kaynak bazlı validation sonucu |
| Relational | Field-date-content checks | Fatura/irsaliye/proforma/konşimento alanları | Tarih/mal tanımı/tutar consistency check | Uyuşmazlık alanları ve anomaly kaydı |

Evidence Output Contract
- Output Artifacts (as stated)
  - Standart JSON response.
  - RPS tabanlı triyaj kararı.
  - Uyarı/alarm bildirimleri (yüksek riskli discrepancy durumlarında).

- JSON Payload — Canonical Field Set

| Field Group | Included Fields (Minimum) | Notes / Constraints (from input) |
| --- | --- | --- |
| Extracted text fields | Tarih, Meblağ, VKN, İrsaliye No | İşlenmiş belge verilerinden döndürülür |
| Confidence | OCR/okuma güven yüzdeleri | Triyaj kararına etki eder |
| Anomaly set | Tespit edilen anomaly dizisi | Alan bazlı discrepancy kayıtları |
| Cross validation | GİB sonucu, MFKS sonucu | Çapraz doğrulama çıktıları |
| Risk summary | RPS skoru (0-100) + renk kodu | Operasyonel aksiyon için kullanılır |

Implementation Notes (storage-neutral)
- Mimari konumlandırma: Microservices + RESTful API endpoints.
- Aktarım güvenliği: Asimetrik Kriptografi + mTLS.
- Segment bazlı dağıtım: Katılım bankaları için On-Premise, faktoring için API/SaaS.
- Banka entegrasyonu için Docker/Kubernetes kurulum yaklaşımı belirtilmiştir.

Operational Notes
- Dual B2B Pricing Strategy
  - Model 1: On-Premise Enterprise License (Katılım bankaları)

| Hizmet Kalemi | Fiyat | Model/Frekans | Kapsam (as stated) |
| --- | --- | --- | --- |
| Platform Kurulumu ve Entegrasyon | $85,000 | Tek seferlik | Docker/Kubernetes kurulum, core banking/ERP entegrasyonu, yük/sızma testleri, güvenlik konfigürasyonu |
| Yıllık Kurumsal Kullanım Lisansı | $120,000 / yıl | Yıllık peşin | Sınırsız belge işleme, RPS/OCR lisansları, sınırsız kullanıcı erişimi |
| SLA, Bakım ve Güncelleme | $24,000 / yıl | Yıllık | 7/24 L3 destek, regülasyon değişimlerine göre kural güncelleme, model ağırlık güncelleme |
| Özel Modül ve Belge Geliştirme | $1,200 / adam-gün | Proje bazlı | Yeni doküman türü tanımlama/öğretme |

  - Model 2: Transaction-based API/SaaS (Bağımsız faktoring)

| Hacim Kademesi | API Birim Fiyatı | Hedef Segment | Kapsam Dışı / Ekstra |
| --- | --- | --- | --- |
| Tier 1: 0-5,000 belge/ay | 12.00 TRY / belge | Küçük/butik/yeni dijital faktoring | Standart SLA, temel RPS, ERP entegrasyon desteği yok |
| Tier 2: 5,001-25,000 belge/ay | 9.50 TRY / belge | Orta ölçekli İstanbul faktoring | Gelişmiş SLA, anında OCR, çoklu format, mükerrerlik kontrolü, öncelikli telefon destek |
| Tier 3: 25,001-100,000 belge/ay | 6.50 TRY / belge | Büyük ve yüksek hacimli faktoring | 7/24 genişletilmiş SLA, ERP entegrasyon danışmanlığı, özel dashboard |
| Tier 4: 100,000+ belge/ay | 4.00 TRY / belge | Pazar lideri kurumsal faktoring | VPC tahsisi, TAM, özelleştirilmiş RPS model eğitimi |

- GTM ve pilot operasyon notları
  - Faz 1: Sentetik veri PoC (100,000 sentetik belge üretimi ve senaryo enjeksiyonu).
  - Faz 2: İstanbul merkezli orta ölçekli faktoring pilotu.
  - Gölge Modu: İlk ay manuel süreçle paralel çalıştırma ve karar karşılaştırması.
  - Faz 3: VC ölçekleme metrikleri (CAC, LTV, brüt kar marjı).

Open Questions
- Not explicitly stated: 3 saniye hedefinin p95/p99 ölçüm metodu ve resmi SLA metrik tanımı.
- Not explicitly stated: RPS hesaplama formülü ve her parametrenin ağırlık katsayıları.
- Not explicitly stated: GİB/MFKS/TGB entegrasyonlarında hata/timeout fallback davranışı.
- Not explicitly stated: On-Premise ve API/SaaS dağıtımları için ortak minimum teknik kapasite gereksinimleri.
- Not explicitly stated: Web-Dashboard üzerinden yürütülen akışta alan bazlı audit logging şeması.
