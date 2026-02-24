# **API Endpoints Interface Contract**

BelgeKalkanı MVP (Minimum Viable Product) sürümü için tasarlanan bu kapsamlı arayüz sözleşmesi, UBL-TR 1.2 standartlarına dayalı e-Fatura işleme, deterministik kural motoru değerlendirmesi, kanıt paketi (evidence pack) oluşturma ve kriptografik Merkle ağacı tabanlı denetim günlüğü (audit log) doğrulama süreçlerini yöneten FastAPI/Python tabanlı RESTful mimarinin teknik spesifikasyonlarını tanımlamaktadır.1 Sistem, yapılandırılmış XML verileri ile yapılandırılmamış dokümanlar arasındaki entegrasyonu sağlarken, insan bilişsel darboğazlarını (human cognitive bottlenecks) ortadan kaldırmayı hedefleyen kapalı bir programatik döngü içerisinde çalışır.1  
Tasarlanan mimari, dış istemciler ve iç mikroservisler arasında durum bilgisiz (stateless) etkileşimleri zorunlu kılar. Gelen her ticari belge, sistem içerisinde "ticari gerçeğin değiştirilemez dijital bir yansıması" (immutable digital reflection of the commercial truth) olarak kabul edilen düzleştirilmiş kanonik bir JSON şemasına dönüştürülür.1 Bu dönüştürme işlemi, veri giriş uyuşmazlıklarını ve yer değiştirme farklılıklarını önlemek adına matematiksel olarak katı kurallara bağlanmıştır.1 Aşağıdaki bölümler, bu ekosistemin dış dünyaya açılan uç noktalarının (endpoints), kimlik doğrulama şemalarının, veri gizleme algoritmalarının ve Açıklanabilir Yapay Zeka (Explainable AI \- XAI) destekli denetim mekanizmalarının detaylı bir analizini sunmaktadır.

## **1\. Base URL & Authentication (Kimlik Doğrulama)**

RESTful mimarinin temel yapı taşı olan ağ geçidi (API Gateway), tüm gelen istekleri standartlaştırılmış bir taban dizin üzerinden yönlendirir ve şifreli taşıma katmanı (TLS 1.3) üzerinden uçtan uca veri güvenliği sağlar.  
**Base URL:**  
/api/v1/docguard  
Sistem, dağıtık mikroservis mimarilerinde sıklıkla karşılaşılan güvenlik zafiyetlerini engellemek amacıyla çift katmanlı bir kimlik doğrulama (Authentication) ve yetkilendirme (Authorization) şeması uygulamaktadır.1 Bu yapı, hem kurum içi bileşenlerin hem de dış entegratörlerin sisteme güvenli bir biçimde erişmesini koordine eder.  
Dış istemciler, API ile iletişim kurabilmek için endüstri standardı olan JSON Web Token (JWT) tabanlı Bearer Token veya yüksek güvenlikli statik API Keys kullanmak zorundadır. Yetkilendirme başlıkları (Authorization headers), her HTTP isteğinde zorunlu olarak bulunmalıdır. Kimlik bilgisi eksik, hatalı veya süresi geçmiş olan istekler, sistemin iş mantığı katmanına (business logic layer) ulaşmadan doğrudan API ağ geçidi tarafından 401 Unauthorized veya 403 Forbidden HTTP durum kodları ile reddedilir.  
İç sistemler ve mikroservisler arası iletişim ise, Herkes İçin Güvenli Üretim Kimlik Çerçevesi (Secure Production Identity Framework for Everyone \- SPIFFE) standartlarına uygun SPIFFE Doğrulanabilir Kimlik Belgeleri (SVIDs) kullanılarak gerçekleştirilir.1 Bu yaklaşım, günlük kaydı (audit log) üreten her bir servisin kimliğinin, ağ topolojisinden bağımsız olarak kriptografik yöntemlerle kanıtlanmasını sağlar.1  
Sistem genelindeki kriptografik imzalama işlemleri (örneğin log kayıtlarının Ed25519 ile imzalanması), uygulamanın çalışma belleğinden tamamen izole edilmiş, Federal Bilgi İşleme Standartları (FIPS) 140-3 Seviye 3 uyumlu bir Donanımsal Güvenlik Modülü (Hardware Security Module \- HSM) içerisinde yürütülür.1 Bu donanımsal tecrit, anahtar sızıntılarını fiziksel olarak imkansız hale getirerek sıfır güven (zero-trust) mimarisinin temellerini oluşturur.  
**Security Scheme Definitions:**

* Authorization: Bearer \<JWT\_Token\>  
* X-API-Key: \<Client\_Specific\_API\_Key\>  
* X-SPIFFE-ID: spiffe://docguard.internal/services/\<service\_name\> (İç iletişim için)

## **2\. Endpoint: Ingest & Analyze (POST /api/v1/analyze)**

Bu uç nokta, BelgeKalkanı mimarisinin ana giriş kapısıdır. Temel işlevi, GİB (Gelir İdaresi Başkanlığı) standartlarına uygun UBL-TR 1.2 formatındaki XML e-Fatura belgelerini sisteme kabul etmek, bu belgeleri yapısal bütünlük testinden geçirmek, hassas verileri maskelemek ve son olarak deterministik kural motoru (Rule Engine) aracılığıyla derinlemesine bir analize tabi tutmaktır.1  
**HTTP Method:** POST  
**Endpoint Path:** /api/v1/analyze

### **İstek Yapısı ve Veri İşleme (Request Payload)**

İstemci, XML tabanlı e-Fatura belgesini ikili veri akışı (binary stream) olarak sunucuya iletmekle yükümlüdür. Bu veri aktarımı, multipart/form-data içerik türü kullanılarak gerçekleştirilir.  
**Request Form Data:**

* file (Required): application/xml MIME tipinde, UBL-TR 1.2 şemasına uygun elektronik fatura dokümanı.

İstek alındığında, sistem hiyerarşik XML verilerini düzleştirilmiş bir kanonik JSON şemasına (Canonical JSON Schema) dönüştürür. Bu süreç, karmaşık XML düğümlerinin (nodes) deterministik bir şekilde taranmasını gerektirir. Örneğin, satıcı firmanın kurumsal unvanını tespit etmek için sistemin cac:AccountingSupplierParty düğümünden başlayarak cac:Party, cac:PartyName ve nihayetinde cbc:Name bileşenine kadar inmesi şarttır.1 Bu katı yapısal gezinme (rigid structural traversal), veri madenciliği hatalarını sıfıra indirmeyi amaçlar.1

### **Veri Gizleme ve Mahremiyet (Entity Masking)**

Kanonik JSON oluşturulduktan sonra, ticari gerçeğin dijital yansıması üzerinden kesin kurumsal kimlik doğrulaması (parti kimliği) yapılır.1 Ancak sistem, GDPR (General Data Protection Regulation) ve KVKK (Kişisel Verilerin Korunması Kanunu) gereksinimleri doğrultusunda, kanıt paketi yanıtını oluşturmadan önce hassas kişisel ve kurumsal tanımlayıcıları (Personal Identifiable Information \- PII) maskelemek zorundadır.1  
Aşağıda listelenen İngilizce JSON anahtarlarına karşılık gelen veriler, API yanıtı oluşturulmadan önce geri döndürülemez bir şekilde anonimleştirilir 1:

* supplier.vkn: Satıcıyı temsil eden 10 haneli Vergi Kimlik Numarası. (Örn: \*\*\*\*\*\*7890)  
* supplier.tckn: Satıcı şahıs şirketi ise kullanılan 11 haneli TC Kimlik Numarası.  
* customer.vkn: Alıcı kurumun 10 haneli Vergi Kimlik Numarası.  
* payment.iban: Ön ödemeler için en önemli finansal yönlendirme parametresi olan Uluslararası Banka Hesap Numarası. (Örn: TR\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*1234)  
* payment.bic: İşletme Tanımlayıcı Kodu.  
* supplier.contact.phone & supplier.contact.email: Doğrudan iletişim kanalları.

Bu veriler sistemin iç işleyişinde *Tüzel Kişi Müşteri Bilgi Formu* veya *Limit Onay Bildirimi (LOB)* gibi belgelere karşı çapraz doğrulama ve işlem hacmi kontrolleri için kullanılırken, loglara ve API yanıtlarına asla açık metin (plaintext) olarak yansıtılmaz.1

### **Deterministik Kural Motoru ve Kanıt Paketi (Rule Engine & Evidence Pack)**

Kanonikleştirilmiş ve doğrulanmış veri seti, BelgeKalkanı'nın deterministik kural motoruna iletilir. Bu motor, belgeleri iki temel kategori altında inceler: Kesin Kontroller (Hard Checks \- H Serisi) ve Bağlamsal Sinyaller (Context Checks \- C Serisi).1 Her bir kural, tetiklenme durumunda bir kanıt paketi (evidence pack) içerisine dahil edilecek adli verileri (forensic data) üretir.1  
Aşağıdaki tablo, kural motorunun işlettiği çekirdek mantığı, beklenen veri setlerini ve tolerans mekanizmalarını detaylandırmaktadır.1 Bu kuralların çıktıları, doğrudan /api/v1/analyze yanıtındaki JSON formatına yansıtılır.

| Kural Kimliği (Rule ID) | Kategori | İnceleme Amacı (Intent) | Tetiklenme Koşulu (Trigger Condition) | Kanıt Alanları (Evidence Fields) | Hata Önleme ve Tolerans (Mitigation) |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **H001** | Hard | UBL-TR 1.2 şemasının doğrulanması. | metadata.ubl\_version\!= "2.1" OR metadata.customization\_id\!= "TR1.2" | metadata.ubl\_version, metadata.customization\_id | UBL-TR şeması ihlal edilemez, hatalı belgeler anında reddedilir. |
| **H002** | Hard | Her kalemin net tutarları toplamının genel toplam ile matematiksel eşitliğinin sağlanması. | abs(sum(lines.net\_amount) \- totals.line\_extension) \> 0 | totals.line\_extension, lines.net\_amount | Ondalık yuvarlama farkları için sistem 0.01 birimlik katı bir matematiksel tolerans uygular. |
| **H003** | Hard | Alt vergi kalemlerinin toplamının, beyan edilen toplam vergi ile eşleşmesi. | abs(sum(tax.subtotals.tax\_amount) \- tax.total\_tax\_amount) \> 0 | tax.total\_tax\_amount, tax.subtotals.tax\_amount | Vergi yuvarlamaları için genellikle 2 ondalık hassasiyet referans alınır. |
| **H004** | Hard | Ödenecek net tutarın, kalemler, indirimler, eklemeler ve vergiler üzerinden hesaplanması. | abs(totals.payable\_amount \- (totals.line\_extension \+ totals.charge\_total \- totals.allowance\_total \+ tax.total\_tax\_amount)) \> 0 | totals.payable\_amount, totals.line\_extension, totals.allowance\_total, tax.total\_tax\_amount | İnce huylu indirim hesaplamalarındaki ondalık sapmalar için çok dar bir eşik (0.01) kullanılır. |
| **H005** | Hard | Elektronik faturaların e-İrsaliye referanslarına sahip olması zorunluluğu. | references.despatch\_id dizisinin boş veya tanımsız olması. | references.despatch\_id | Kısmi teslimatlar kabul edilse de asgari bir (1) geçerli referans şarttır. |
| **H006** | Hard | Referans gösterilen tüm irsaliyelerin, fatura kesim tarihinden önce veya aynı gün düzenlenmiş olması. | any references.despatch\_date\[i\] \> document.issue\_date | references.despatch\_date, document.issue\_date | UTC ve yerel zaman dilimi farkları sistem tarafından hesaplanarak standardize edilir. |
| **H007** | Hard | Tedarikçi Vergi/Kimlik numarasının algoritmik modüler doğrulaması. | (supplier.tckn mevcut AND mod10(supplier.tckn) ≠ 0\) OR (supplier.vkn mevcut AND length(supplier.vkn) ≠ 10\) | supplier.vkn, supplier.tckn | TCKN kullanımında Mod-10 algoritması işletilir, VKN'de 10 hane kontrolü yapılır. |
| **H008** | Hard | Finansal tahsilat için sunulan Uluslararası Banka Hesap Numarasının (IBAN) yapısı. | payment.iban mevcut AND mod97(payment.iban) ≠ 1 | payment.iban | TR formatı dışındaki yapılar ve Mod-97 kontrolünden geçemeyen veriler kesin hataya neden olur. |
| **H009** | Hard | Aynı Evrensel Benzersiz Tanımlayıcı (UUID) ile yapılan mükerrer başvuruların engellenmesi. | Aynı metadata.uuid verisinin veritabanında daha önce işlenmiş olması. | metadata.uuid | Tekrarlayan fatura gönderimlerinde UUID kesinlikle güncellenmiş olmalıdır. |
| **H011** | Hard | Fatura numarasının GİB tarafından atanan regülatif formatının doğrulanması. | length(document.id) ≠ 16 OR desen uyuşmazlığı | document.id | Format kesinlikle 16 alfanümerik karakterden oluşmalıdır. |
| **H012** | Hard | Tarih formatlarının bölgesel varyasyonlardan arındırılıp küresel standarda oturtulması. | document.issue\_date veya irsaliye tarihlerinin geçerli olmaması. | document.issue\_date, references.despatch\_date | Tüm tarih serileştirmeleri geçerli ISO-8601 UTC formatına zorlanır. |
| **C001** | Context | Bir faturada beklenen ortalama satır sayısının çok üzerinde ürün kalemi bulunması. | len(lines) \> 20 | lines.line\_id (Satır sayısı) | Lojistik olarak büyük sevkiyatlarda bu durum normal karşılanabileceği için otomatik red yerine insan onayı istenir. |
| **C002** | Context | Fatura üzerinde Türk Lirası (TRY) dışındaki para birimlerinin kullanımı. | document.currency\_code\!= "TRY" | document.currency\_code | İhracat veya uluslararası ticarette beklenen bir durum olsa da risk bağlamında incelenir. |
| **C004** | Context | Faturada uygulanan iskonto (indirim) veya yükleme (ek ücret) tutarlarının net tutarın yarısını geçmesi. | İskonto veya yükleme toplamının totals.line\_extension değerinin %50'sinden büyük olması. | totals.allowance\_total, totals.charge\_total, totals.line\_extension | Aşırı yüksek promosyonlar ticari anomali işareti sayılır, bu nedenle sistem 0.5 (%50) oranında uyarır. |
| **C006** | Context | Faturayı kesen kurum ile alıcı kurumun aynı VKN veya TCKN numarasına sahip olması durumu. | supplier.vkn \== customer.vkn OR supplier.tckn \== customer.tckn | supplier.vkn, customer.vkn, supplier.tckn, customer.tckn | Aynı şirketler grubuna ait kurum içi transferler olabileceği gibi fatura sahteciliği potansiyeli de taşır. |
| **C007** | Context | İrsaliye teslim tarihi ile faturanın resmileşme tarihinin aynı güne denk gelmesi. | min(references.despatch\_date) \>= document.issue\_date | references.despatch\_date, document.issue\_date | Çok hızlı faturalandırmalar sistem tarafından gün farkı ≤ 0 olarak saptanır. |

Kural motorunun sonuçları, her belgenin inceleme önceliğini belirleyen İnceleme Öncelik Skoru (Review Priority Score \- RPS) adlı bir matematiksel modelleme üzerinden değerlendirilir.1 Tetiklenen her "Hard" (Kesin) kural için belgeye 10 puan atanırken, her "Context" (Bağlamsal) kural için 1 puan atanır.1 Elde edilen total\_score değeri eşik seviyeleri ile karşılaştırılır: Toplam puan 0–9 aralığında ise "Düşük" (Low), 10–29 aralığında ise "Orta" (Medium) ve puan ≥ 30 ise "Yüksek" (High) risk olarak sınıflandırılır.1 Yüksek öncelikli belgeler işlem durdurulmasına yol açmaz, ancak kurum içi uzmanlar tarafından manuel müdahale gerektiren el ilanları olarak raporlanır.1

### **Yanıt Yapısı (Response Payload \- 200 OK)**

Kural motoru analizini tamamladığında, API dış istemciye yapılandırılmış, deterministik ve maskelenmiş verilerden oluşan detaylı bir JSON yanıtı döner. Bu yanıtın kalbinde evidence\_pack (kanıt paketi) yer alır. Kanıt paketi, UBL-TR XML içindeki spesifik lokasyonları gösteren "JSON Pointers" (RFC 6901\) dizinlerini barındırır.1 Bu pointer mekanizması, dış denetçilerin ve Açıklanabilir Yapay Zeka (XAI) birimlerinin hatanın kaynağını milisaniyeler içerisinde tespit etmesine olanak tanır.1  
Ayrıca, yanıt içerisinde yer alan evidence\_pack\_hash ve input\_file\_hash değerleri, SHA-256 kriptografik özetleme fonksiyonu kullanılarak elde edilir.1 Bu algoritmaların tutarlılığını sağlamak adına, JSON verisi özetlenmeden önce RFC 8785 JSON Canonicalization Scheme (Kanonikleştirme Şeması) protokollerine tabi tutularak anahtarların alfabetik sıralanması ve gereksiz boşlukların kaldırılması sağlanır.1  
**Response Schema Model (application/json):**

JSON

{  
  "document\_metadata": {  
    "file\_name": "Invoice\_TR\_2026\_001.xml",  
    "ubl\_version": "2.1",  
    "customization\_id": "TR1.2",  
    "document\_id": "GIB2026000000123",  
    "document\_uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",  
    "issue\_date": "2026-02-23T12:00:00Z",  
    "currency\_code": "TRY"  
  },  
  "masked\_entities": {  
    "supplier": {  
      "vkn": "\*\*\*\*\*\*7890",  
      "tckn": null,  
      "name": "TEKNO TİCARET LİMİTED ŞİRKETİ",  
      "contact": {  
        "phone": "+90 (5\*\*) \*\*\* \*\* 99",  
        "email": "i\*\*\*@t\*\*\*.com.tr"  
      }  
    },  
    "customer": {  
      "vkn": "\*\*\*\*\*\*4321",  
      "name": "GLOBAL LOJİSTİK A.Ş."  
    },  
    "payment": {  
      "iban": "TR\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*1234",  
      "bic": "TR\*\*\*\*\*\*"  
    }  
  },  
  "analysis\_results": {  
    "status": "FLAGGED\_FOR\_MANUAL\_REVIEW",  
    "triggered\_rules":.net\_amount"  
        \],  
        "trigger\_values": {  
          "totals.line\_extension": 15000.50,  
          "calculated\_sum": 15000.55,  
          "variance": 0.05  
        },  
        "json\_pointers":  
      },  
      {  
        "rule\_id": "C004",  
        "category": "Context",  
        "name": "Yüksek İskonto/Yükleme Oranı",  
        "intent": "Indicated if the total discount or additional fee is more than 50% of the net amount",  
        "evidence\_fields": \[  
          "totals.allowance\_total",  
          "totals.line\_extension"  
        \],  
        "trigger\_values": {  
          "totals.allowance\_total": 8000.00,  
          "totals.line\_extension": 15000.50,  
          "ratio": 0.533  
        },  
        "json\_pointers":  
      }  
    \]  
  },  
  "rps\_data": {  
    "hard\_check\_points": 10,  
    "context\_check\_points": 1,  
    "total\_score": 11,  
    "priority\_category": "Medium"  
  },  
  "evidence\_pack\_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",  
  "input\_file\_hash": "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",  
  "processed\_at": "2026-02-23T15:39:00Z"  
}

## **3\. Endpoint: Generate Narration (POST /api/v1/narrate)**

Denetim süreçlerinde elde edilen ham JSON verileri, karmaşık mantıksal yapıları sebebiyle sistem operatörleri ve iç kontrolörler tarafından her zaman anında anlaşılamayabilir. Bu noktada /api/v1/narrate uç noktası devreye girerek, önceden oluşturulmuş bir kanıt paketi özetine (evidence pack hash) dayanarak deterministik bir anlatım metni (narration) sentezlenmesi için yerleşik ve izole bir Büyük Dil Modelini (LLM) tetikler.1  
**HTTP Method:** POST  
**Endpoint Path:** /api/v1/narrate

### **Açıklanabilir Yapay Zeka (XAI) ve Anlatım Politikaları**

Yapay zeka modellerinin ticari finansman belgelerini yorumlarken en büyük risklerinden biri, halüsinasyon olarak bilinen, gerçek dışı veya doğal dildeki muğlak ifadeler üreterek semantik kaymaya (semantic drift) neden olmasıdır.1 Bu riskleri sıfıra indirmek ve Açıklanabilir Yapay Zeka (Explainable AI \- XAI) yönergelerine uymak için sistem, Eş Anlamlısız Anlatım Politikası (No-Synonyms Narration Policy) adı verilen çok katı bir denetim çerçevesi işletir.1  
Bu politikaya göre, LLM veya herhangi bir otomatik aracı ajanın, veri şemasındaki tanımlayıcıları günlük dile veya doğal dil eş anlamlılarına dönüştürmesi kesinlikle yasaktır.1 Örneğin; bir kural ihlalinde LLM'in genel ve yuvarlak bir ifadeyle *"Vergi numarası çok kısa kalmış"* demesine izin verilmez. Sistem, veri sözleşmesine harfiyen sadık kalmak zorundadır ve bunun yerine *"supplier.vkn uzunluğu 9 karakterdir, bu değer beklenen 10 karakter sınırından küçüktür"* şeklinde deterministik bir adli anlatım çıktısı üretmelidir.1 Bu katılık, oluşturulan anlatımların doğrudan resmi denetim izine (audit\_trace) dahil edilmesini mümkün kılar ve modelin çıktı öngörülebilirliğini maksimize eder.1

### **İstek Yapısı (Request Payload)**

İstemci, narrasyon sürecini başlatmak için evidence\_pack\_hash verisini sağlamalıdır. Çoğu durumda, sistem bu özet üzerinden arka plandaki veritabanından gerekli kanıt paketini (evidence pack) otomatik olarak çeker. Ancak, modelin tetikleyicilerle çalışabilmesi için ek bağlam (narration\_context) sağlanabilir.  
**Request Schema Model (application/json):**

JSON

{  
  "evidence\_pack\_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",  
  "language": "tr",  
  "narration\_context": {  
    "rule\_ids": \["H002", "C004"\],  
    "evidence\_pointers": {  
      "totals.line\_extension": 15000.50,  
      "calculated\_sum": 15000.55,  
      "totals.allowance\_total": 8000.00  
    }  
  }  
}

### **Yanıt Yapısı (Response Payload \- 200 OK)**

Yanıt olarak dönülen JSON objesi, audit\_trace isimli bir dizi (array) içerir. Bu dizi, LLM tarafından insan ve yapay zeka ajanları tarafından denetlenebilecek şekilde (human and AI explainability) üretilmiş deterministik adım adım mantık anlatımlarını içerir.1 Bu anlatım metinleri daha sonra değiştirilemez denetim kayıtlarına mühürlenecektir.  
**Response Schema Model (application/json):**

JSON

{  
  "evidence\_pack\_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",  
  "audit\_trace":.net\_amount dizisindeki değerlerin matematiksel toplamı 15000.55 olarak hesaplanırken, faturadaki totals.line\_extension değeri 15000.50 olarak beyan edilmiştir. Bu durum, belirlenen 0.01 eşik toleransını aşan 0.05 tutarında matematiksel sapma yaratmıştır."  
    },  
    {  
      "step\_sequence": 2,  
      "rule\_reference": "C004",  
      "narration\_text": "Yüksek İskonto/Yükleme Oranı kuralı (C004) tetiklenmiştir. totals.allowance\_total değeri olan 8000.00 tutarı, totals.line\_extension değeri olan 15000.50 tutarına bölündüğünde 0.533 oranı elde edilmiştir. Bu oran, izin verilen azami 0.5 sınırını aştığı için bağlamsal risk kategorisinde değerlendirilmiştir."  
    }  
  \],  
  "llm\_model\_version": "docguard-xai-v1.2",  
  "generated\_at": "2026-02-23T15:39:05Z"  
}

## **4\. Endpoint: Verify Audit Log (GET /api/v1/audit/{invoice\_id\_hash})**

BelgeKalkanı mimarisi, doğrulama sonuçlarını yalnızca geçici belleklerde işlemekle kalmaz, kurumsal uyumluluk ve geriye dönük adli incelemeler için kriptografik olarak güvene alınmış, Yalnızca Eklenebilir Denetim Günlüğü (Append-only Audit Log) altyapısında saklar.1 Bu altyapının dış dünya ile etkileşim noktası /api/v1/audit/{invoice\_id\_hash} uç noktasıdır.  
**HTTP Method:** GET  
**Endpoint Path:** /api/v1/audit/{invoice\_id\_hash}

### **Kriptografik Denetim, Merkle Ağaçları ve Kanıtlar**

Bu uç nokta üzerinden dış denetçiler, belirli bir faturanın tüm yaşam döngüsünün ve değerlendirme sonucunun bütünlüğünü kontrol edebilirler. Güvenlik, Doğrusal Karma Zincirleri (Linear Hash Chains) ve Merkle Ağaçlarının (Merkle Trees) melez bir mimaride birleştirilmesiyle sağlanır.1  
Kayıtların gerçek zamanlı ardışık bütünlüğü (real-time sequential integrity), her yeni girdinin (![][image1]), kendisinden önceki girdinin kriptografik özetini (![][image2]) barındıran bir prev\_hash alanı ile oluşturulması ve ardından SHA-256 ile özetlenerek ($H\_i \= H(H\_{i-1} |  
| m\_i)$) birbirine mühürlenmesi ile elde edilir.1 Bu yaklaşım sayesinde, geçmişteki herhangi bir kayıtta tek bir bitin dahi değiştirilmesi, domino etkisi yaratarak mevcut zincirin kırılmasına neden olur ve tahrifat anında tespit edilir.  
İkinci katman olan Merkle Ağaçları ise hiyerarşik ikili (binary) bir karma yapısı sunar. Yaprak düğümler (leaf nodes) veri bloklarının (yani her bir log kaydının) özetlerini barındırırken, yaprak olmayan her düğüm doğrudan altındaki iki çocuğunun özetini tutar.1 Tüm bu yapı tek ve nihai bir Merkle Kökü (Merkle Root) ile son bulur. Sistem, periyodik olarak bu Merkle Kökünü Harici Sistemlere (örneğin kamuya açık bir blokzincirine veya WORM depolamaya) mühürleyerek İmzalanmış Ağaç Başı (Signed Tree Head \- STH) oluşturur.1  
Dış denetçiler bu uç nokta üzerinden faturanın Merkle Ağacına dahil olup olmadığını İmzalanmış Kapsama Kanıtı (Inclusion Proof) ile doğrular.1 ![][image3] büyüklüğünde bir log dosyasında belirli bir girdiyi kanıtlamak için yalnızca ![][image4] adet kardeş karma (sibling hashes) değerine –yani Merkle Path dizisine– ihtiyaç duyulur.1 Denetçi, leaf\_hash bilgisini alır, API'den dönen Merkle yolu üzerindeki her kardeş özet ile iteratif olarak yeniden hesaplama yapar ve çıkan nihai sonucu yayınlanmış olan STH ile karşılaştırır.1 Sonuçlar tam olarak eşleşiyorsa, kaydın orijinal günlüğün değiştirilmemiş ve meşru bir parçası olduğu matematiksel olarak kanıtlanmış olur.1 Benzer şekilde, Tutarlılık Kanıtları (Consistency Proofs) kullanılarak günlüğün hiçbir zaman aralığında manipüle edilmediği, yalnızca ileriye dönük eklemelerle büyütüldüğü doğrulanır.1

### **Log Şeması Katılığı ve Kanonikleştirme**

Geriye dönük uyumluluğun kırılmaması için sistem Draft-07 JSON Schema (Şema) kurallarını uygular.1 Bir alan (field) şemaya bir kez eklendiğinde, geçmiş sistemleri (historical parsers) bozabilecek hiçbir silme veya dönüştürme işlemi yapılamaz.1 Bununla birlikte, JSON yapılarındaki önemsiz boşluk (whitespace) değişikliklerinin veya alanların sözlük sırasındaki farklılıklarının hatalı bir manipülasyon (false tamper alarm) sinyali üretmesini engellemek için, sistem istisnasız RFC 8785 JSON Canonicalization Scheme (Kanonikleştirme Şeması) uygular.1 Bu işlem, anahtarları (keys) her zaman alfabetik sıraya dizer ve boşlukları silerek karma algoritmalarına giren girdiyi tek bir sabit (deterministic) kalıba döker.1  
**Path Parameters:**

* invoice\_id\_hash (Required): doc\_uuid (UBL-TR cbc:UUID) veya invoice\_id (GİB Fatura No) verisinin SHA-256 özetlenmiş halidir. Açık veri (plaintext) fatura kimlikleri URL üzerinde geçirilmez.

### **Yanıt Yapısı (Response Payload \- 200 OK)**

API yanıtı, sistemin zaman damgalarını, kanıt paketlerini (evidence pack) ve Merkle kanıt dizilerini barındırır.1 ISO-8601 UTC olarak kaydedilen zaman damgaları (timestamps), mutlak bir sıralama (temporal ordering) temin etmek için Ağ Zaman Protokolü (Network Time Protocol \- NTP) aracılığıyla senkronize edilir.1  
Ayrıca yanıt içerisinde, yukarıda açıklanan "No-Synonyms Narration Policy" 1 yönergelerine uygun olarak LLM tarafından üretilmiş audit\_trace anlatım adımları ve ağırlıklandırılmış skor olan rps\_data objesi 1 bulunur.  
**Response Schema Model (application/json):**

JSON

{  
  "validation\_status": "VERIFIED\_AND\_ANCHORED",  
  "audit\_record": {  
    "entry\_id": "7132a67e-8c90-418a-b152-7b791448651a",  
    "timestamp": "2026-02-23T15:36:00Z",  
    "sequence\_number": 1048576,  
    "prev\_hash": "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2a3",  
    "doc\_uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",  
    "invoice\_id": "GIB2026000000123",  
    "actor\_identity": "spiffe://docguard.internal/services/analyzer",  
    "input\_file\_hash": "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",  
    "evidence\_pack": {  
      "rules\_applied": \["H002", "C004"\],  
      "json\_pointers":  
    },  
    "rps\_data": {  
      "total\_score": 11,  
      "priority\_category": "Medium",  
      "weights": {"Hard": 10, "Context": 1}  
    },  
    "audit\_trace":.net\_amount dizisindeki değerlerin matematiksel toplamı 15000.55 olarak hesaplanırken, faturadaki totals.line\_extension değeri 15000.50 olarak beyan edilmiştir."  
      }  
    \],  
    "signature": "e5b8d29b0a8c2f74e6b7d2f4a1c5e9d3b2a8f6c4e1b7d5a9c3f2e8d1a6b4c7f0"  
  },  
  "merkle\_proof": {  
    "leaf\_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",  
    "merkle\_path": \[  
      "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",  
      "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"  
    \],  
    "signed\_tree\_head": "c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3a4b5"  
  },  
  "cryptographic\_mechanisms": {  
    "canonicalization\_scheme": "RFC 8785 JSON Canonicalization Scheme",  
    "hashing\_algorithm": "SHA-256",  
    "signature\_algorithm": "Ed25519"  
  }  
}

## **5\. Standard Error Responses (Hata Dönüşleri)**

API hataları, entegratörlerin sistem entegrasyonlarını programatik olarak düzeltmelerini sağlamak amacıyla HTTP/1.1 durum kodları ve IETF standartlarından olan RFC 7807 (Problem Details for HTTP APIs) formatına kesin surette uygun olarak döndürülür.1 BelgeKalkanı mimarisinin katılığı göz önüne alındığında, UBL-TR uyumsuzlukları ve XML ayrıştırma süreçlerinde iki temel hata kodu (400 ve 422\) kapı tutucu (gatekeeper) görevini üstlenir. Bu ayrım, hatalı veya eksik (garbage-in) verilerin sistemin işlem hattına (pipeline) girmesini ve ardından Yalnızca Eklenebilir Denetim Günlüğünü (Append-only Audit Log) kirletmesini baştan engeller.1

### **400 Bad Request (Schema Validation Failed)**

İstemci tarafından gönderilen HTTP isteğinin yapısında (syntax), beklenen şema sözleşmelerinde (schema contract) veya veri sarmalama (multipart/form-data) kurallarında fiziksel bir hata varsa tetiklenir. Örneğin, içerik tipi application/pdf olarak gönderilen bir belge, kanonikleştirme aşamasına dahi geçmeden API ağ geçidinde (gateway) reddedilir. Ayrıca, RFC 8785 kanonikleştirmesi (JSON Canonicalization) esnasında yaşanan herhangi bir girdi formatı hatası (örneğin bozuk karakter kodlamaları) doğrudan bu hatayı döndürür.  
**Response Schema Model (application/json):**

JSON

{  
  "type": "https://api.docguard.internal/errors/bad-request",  
  "title": "Bad Request \- Schema Validation Failed",  
  "status": 400,  
  "detail": "The provided payload violates the structural boundaries defined in the OpenAPI specification.",  
  "instance": "/api/v1/analyze",  
  "validation\_errors": \[  
    {  
      "loc": \["body", "file"\],  
      "msg": "Invalid MIME type provided. Expected application/xml, but received application/pdf.",  
      "type": "type\_error.mimetype\_mismatch"  
    }  
  \]  
}

### **422 Unprocessable Entity (Business Logic / XML Parsing Failed)**

İstek fiziksel olarak kusursuz biçimlendirilmiş olsa da, iç mantıksal yapı bütünlüğü (business logic) işlenemeyecek kadar kusurluysa sistem 422 Unprocessable Entity döner. Bu durum özellikle GİB UBL-TR 1.2 hiyerarşisinde zorunlu olan düğümlerin (nodes) eksikliğinde yaşanır.1  
Örneğin, cac:AccountingSupplierParty düğümünün altında zorunlu olan cbc:CompanyID alanının yer almaması durumunda 1 sistem, kanonik JSON objesindeki supplier.vkn alanını çıkaramayacaktır.1 Bu tarz yapısal körlük durumlarında kural motorunu zorlamak yerine sistem işlemi derhal iptal eder. Ayrıca, kural motoru belgenin kabul edilmesini imkansız kılan mutlak (Hard \- H Serisi) hatalar saptadığında (örneğin **H001: UBL-TR Versiyon Uyuşmazlığı** veya **H011: Fatura Kimlik Formatı** 1) belge reddedilerek Merkle ağacına yazılma süreci atlanır.  
**Response Schema Model (application/json):**

JSON

{  
  "type": "https://api.docguard.internal/errors/unprocessable-entity",  
  "title": "Unprocessable Entity \- Business Logic Failure",  
  "status": 422,  
  "detail": "UBL-TR 1.2 XML parsing aborted due to severe schema non-compliance or critical business rule violations.",  
  "instance": "/api/v1/analyze",  
  "validation\_errors":,  
      "msg": "Mandatory aggregate component 'CompanyID' mapped to canonical key 'supplier.vkn' is missing from the XML envelope.",  
      "type": "value\_error.missing\_node"  
    },  
    {  
      "loc": \["rule\_engine", "H001"\],  
      "msg": "metadata.ubl\_version mismatch. Expected '2.1' with customization\_id 'TR1.2'. Processing securely aborted.",  
      "type": "business\_rule.critical\_violation"  
    }  
  \]  
}

#### **Alıntılanan çalışmalar**

1. Audit Log Design and Implementation Report.md

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAYCAYAAAARfGZ1AAABDklEQVR4XmNgGAWjYOQAAyCeCcTcUD4vENcCcREQM8IUAUEZEC8AYmkkMbyAFYgPA7EfEP8H4mYGiAEgUA8V0wLim0DMDMRSUDEZqBq84CCUTmCAaGpESIF9ABJ7hCQGAiCxEjQxrADkfRAAuQykCRkkYREDuR4kpo0mDgIf0AVgAKThGJoYyMXohoN8hi4GAqC4CUYXhAGQBg8sYrBgQxZ7iyaGF0QwYHcNSMwei5gLlP0dSm9jgFjIAuWjgMsMmIZjC28bJLFqIFYBYjEgVgbis0DsD5VDAX+AeDKa2BwgfocmBgIgF4IsCEQTR3cI1YAnAyS10QT8AGJZIN6HLkENUAjEpxiIzLWjgHYAAFmgN68cJUyVAAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACcAAAAYCAYAAAB5j+RNAAABUUlEQVR4Xu2WPUoEQRCFn2iiwoZGGnkCU8EDqKCB4CWMRDAUdA9gZGpqbrCJoLGKYuoR/P9ndwPRKqpGluf00M7utMl88JJ6DfW2prpZoKbmf9kXvYq+enTj3pDolrxH0YL7ycia53EC8xpspEAnpM0v2XCKglfOGqz5EhuOel0upkJ3LDSZOZi3w0Yqss+2LFqELfy869S90Z/TidHm16IN0qZ7oalWTrZvoeehaN+euRDJjOiMi3ncITyZWZjXZAN2w1e4GMGWaA+R4Yo+2xHMG2OjT7YREW4Y1vyv71tL9CAaYSOSqHC7sOarbMBuZ164CdG06AJ2u8ug4c65mHEgehM9wSagi/3p3rjo3Wvq6ZkOfgfh0O0CHfacUzSc/rhK0PdPn56yaLjQKvWNTnJKdMxGJBruiouDYh220JNsRPAB+9t1L3pB+UtVUzMQvgHIgWGMnisnDAAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAXCAYAAAA/ZK6/AAAAlUlEQVR4XmNgGAWDCegC8Twg5obyeYG4AYgnADETVAwO2IF4KxBHA/F/IG4G4gVQuXqoGArYC6VhGhqR5EA2YWgohdLXGDAls7GIwQFIoh2L2GU0MTCQYIBIgpwAA3xQMQUofypCCsJBtxpZrBqIlZDkGP4C8VdkASAoYIBo0AfiS2hyDBZAzIouyACJHwN0wVFACAAA3qgdBAlcrcAAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAYCAYAAAC8/X7cAAACDklEQVR4Xu2WMUgdQRCGRyGoSIgGiYiSwkKxMEUsrUyhFoJFCBpiI5JCxEosxELFQhALQRsLQ+oQxEILYwJBxCpdgjbBRhQhiIggCok6f3b2nDe3B08UfAfvg5+7+Wdu7+be7t4jypPn3qi1Rlo4Yl2JUstzSnkDzyjlDTyllDdQTuEGCljTrH3WlMlpWlmfWD0Sf2edRdnb0cj6wCqV+DFrnDXLKhQvRqiBZvFKJPY1L6IK1yC8UYkXJQY41st5thSxVlnvyF0/yfoouTHxgoQaQNxlvH7xPZsmBohnjJct3+ToG5hQOfwS9l4RtgFMl1Cxf+NvJf4jsQbxF+Nly7Actyk+7kDAi7AN7JpYox/QTzNPjcTY1e4Cxtgy3on4QWwDyyb2YI7Cx1z3/BLP3wCL0FLNOieX7zO5EKhrD3gjxouoJFeAKQKqJG6KKhwd4hdL/J7VfZNOZE6d43qspSSw7uzLe6M8bPnzKvefBnIFFcr7yrpUMUDNZxXXifeDtcFaIbftPlE19iu/ZmLLT4rnMa73DnUCXLAOWHvkkvhv5OkkdyH0j9WmcgAN+7zVgqrTnJJrOIm/lPmLgUd0M26Zyd0JDIjtzfKK4m8R+DWUM+Bh/LrR4IsZetCk+gfDfy9alPdavCHlgWN1/lud5wR4WGy9S+Q+OJYdVq8I+fXMdG7zkuILfDCjIk+KuQYdjIw3J9wJhgAAAABJRU5ErkJggg==>