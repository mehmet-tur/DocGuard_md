# **Review Priority Scoring and Triage Framework for UBL-TR Document Consistency**

The digital transformation of the Turkish commercial landscape, spearheaded by the Revenue Administration (Gelir İdaresi Başkanlığı – GİB), has fundamentally shifted the mechanisms of trade verification. The transition from legacy paper-based invoicing to the e-Fatura and e-İrsaliye ecosystems under the UBL-TR 1.2 standard has created a data-rich environment that demands sophisticated, algorithmic oversight.1 In the high-stakes domain of trade finance and participation banking, the ability to rapidly distinguish between a minor clerical error and a systemic financial inconsistency is paramount for operational stability. This report delineates a comprehensive Review Priority Scoring (RPS) and Triage Framework, designed to automate the initial assessment of document integrity while providing a deterministic, explainable path for human-in-the-loop intervention.1

## **Theoretical Framework of Priority Scoring Models**

The central challenge in document consistency auditing is the aggregation of heterogeneous signals into a singular, actionable priority metric. Traditional audit systems often rely on binary pass/fail outcomes, which fail to capture the nuanced risks inherent in complex trade packs consisting of multiple invoices, waybills, and financial contracts.1 To address this, current research highlights three primary scoring architectures: weighted additive models, saturating or capped models, and tiered hierarchical models.3

### **Comparative Analysis of Weighted Additive and Saturating Models**

The weighted additive model operates on a linear principle where the final score is the simple sum of the weights assigned to each triggered rule. This model is favored in environments where each anomaly is considered independent and its cumulative impact is linear.4 In the context of UBL-TR validation, an additive approach ensures that every discrepancy—whether a VKN format error or a mathematical rounding difference—contributes to the overall risk profile.1 However, the primary limitation of pure additivity is the risk of "score inflation" in documents with high line counts. For example, a single invoice with 500 lines might trigger dozens of minor context-based warnings, resulting in a priority score that suggests critical fraud when the underlying issue is merely a data-heavy legitimate transaction.1  
Conversely, saturating or capped models introduce non-linear constraints. These models apply a maximum limit (cap) on the contribution of specific categories of rules or even individual checks. This architectural choice prevents "noise" from overwhelming "signal." In a saturating framework, once a certain threshold of Context checks is met, additional triggers in that category no longer increase the priority score.6 This ensures that the triage queue is not dominated by complex but low-risk documents, keeping the focus of senior auditors on documents that exhibit "Hard" structural failures or significant "Graph" anomalies.1

### **The Bounded Review Priority Score Calculation**

To ensure operational consistency across diverse financial institutions, the Review Priority Score (RPS) must be normalized to a standard scale. This normalization allows for the establishment of uniform Service Level Agreements (SLAs) and triage queues regardless of the specific number of rules implemented in the system.8 The proposed formula utilizes a category-weighted saturating approach, where the score is a function of triggered Hard (H), Context (C), and Graph (G) signals, subject to both category-level and global caps.1  
The mathematical representation of the total Priority Score (![][image1]) is defined as:  
![][image2]  
where the contribution of each category is bounded by its respective cap (![][image3]):  
![][image4]  
In this formula, ![][image5] represents the weight of an individual rule and ![][image6] is the indicator function that returns 1 if the rule is triggered. For the UBL-TR domain, the recommended caps are 70 for Hard checks, 40 for Context checks, and 40 for Graph signals.1 This ensures that while a critical Hard failure (e.g., a VKN checksum failure) can immediately propel a document into the high-priority queue, the total score remains interpretable and bounded, preventing the "infinite risk" problem of purely additive systems.6

## **Domain Rule Extraction and Deep Analysis**

The integrity of the triage framework rests upon the quality of the rules extracted from the UBL-TR canonical schema and the broader trade finance regulatory requirements. These rules are categorized based on their impact on document validity and systemic risk.1

### **Hard Consistency Checks (H-Series)**

Hard checks represent the non-negotiable technical and legal requirements for an e-Fatura to be considered valid under GİB standards. Any failure in this category suggests a fundamental structural error or a deliberate attempt to bypass the UBL-TR 1.2 schema constraints.1

| Rule ID | Name | Category | Trigger Condition (Metrics) | Canonical Fields Involved |
| :---- | :---- | :---- | :---- | :---- |
| H001 | UBL-TR Versiyon Uyuşmazlığı | Hard | metadata.ubl\_version\!= "2.1" OR metadata.customization\_id\!= "TR1.2" | metadata.ubl\_version, metadata.customization\_id |
| H002 | Kalem Tutarı Tutarlılığı | Hard | abs(sum(lines.net\_amount) \- totals.line\_extension) \> 0.01 | totals.line\_extension, lines.net\_amount |
| H003 | Vergi Toplamı Tutarlılığı | Hard | abs(sum(tax.subtotals.tax\_amount) \- tax.total\_tax\_amount) \> 0.01 | tax.total\_tax\_amount, tax.subtotals.tax\_amount |
| H004 | Ödenecek Tutar Tutarlılığı | Hard | abs(totals.payable\_amount \- (totals.line\_extension \+ totals.charge\_total \- totals.allowance\_total \+ tax.total\_tax\_amount)) \> 0.01 | totals.payable\_amount, totals.line\_extension, totals.allowance\_total, totals.charge\_total, tax.total\_tax\_amount |
| H005 | e-İrsaliye Referans Eksikliği | Hard | references.despatch\_id is empty or undefined | references.despatch\_id |
| H006 | İrsaliye Zaman Tutarsızlığı | Hard | any(references.despatch\_date\[i\] \> document.issue\_date) | references.despatch\_date, document.issue\_date |
| H007 | Tedarikçi Kimlik Doğrulama | Hard | (supplier.vkn exists and length\!= 10\) OR (supplier.tckn exists and\!mod10) | supplier.vkn, supplier.tckn |
| H008 | IBAN Yapı Doğrulama | Hard | payment.iban exists and mod97(payment.iban)\!= 1 | payment.iban |
| H009 | Çift Sunum Tespiti | Hard | metadata.uuid exists more than once in the system | metadata.uuid |
| H010 | Kalem Ürün Açıklama Eksikliği | Hard | Any lines.item\_name is empty or missing | lines.item\_name |
| H011 | Fatura Kimlik Formatı | Hard | length(document.id)\!= 16 OR regex mismatch /^\[A-Z0-9\]{16}$/ | document.id |
| H012 | Tarih Formatı Hatası | Hard | document.issue\_date or despatch\_date is not valid ISO-8601 | document.issue\_date, references.despatch\_date |
| H013 | KDV Kodu Uyumsuzluğu | Hard | tax.subtotals.scheme\_id not in registered VAT/SCT codes | tax.subtotals.scheme\_id |
| H014 | Döviz Kodu Formatı | Hard | document.currency\_code does not match ISO-4217 pattern | document.currency\_code |
| H015 | Miktar Kod Uyumsuzluğu | Hard | unit\_code \== "C62" AND quantity % 1\!= 0 | lines.unit\_code, lines.quantity |

These rules ensure that the foundational data on which all financial decisions are made is accurate. For instance, the H007 check for VKN (Vergi Kimlik Numarası) and TCKN (T.C. Kimlik Numarası) ensures that the legal entities involved in a transaction actually exist and are correctly identified, which is a prerequisite for any factoring or murabaha workflow.1 A failure here is considered critical because it prevents the deterministic cross-referencing of the supplier against official registration records or the bank’s internal Limit Approval Notification (LOB).1

### **Context-Aware Triage Signals (C-Series)**

Context checks identify anomalies that suggest operational risk or suspicious commercial behavior. Unlike Hard checks, a trigger here does not necessarily mean the document is invalid, but rather that it warrants closer inspection to understand the business context.1

| Rule ID | Name | Category | Trigger Condition (Metrics) | Canonical Fields Involved |
| :---- | :---- | :---- | :---- | :---- |
| C001 | Kalem Sayısı Aykırılığı | Context | len(lines) \> 20 | lines.line\_id |
| C002 | Yabancı Para Kullanımı | Context | document.currency\_code\!= "TRY" | document.currency\_code |
| C003 | Yabancı IBAN | Context | payment.iban exists AND prefix\!= "TR" | payment.iban |
| C004 | Yüksek İskonto/Yükleme Oranı | Context | (allowance\_total / line\_extension) \> 0.5 | totals.allowance\_total, totals.line\_extension |
| C005 | Çifte Kimlik Kullanımı | Context | Supplier has both VKN and TCKN, or has neither | supplier.vkn, supplier.tckn |
| C006 | Aynı VKN/TCKN | Context | supplier.vkn \== customer.vkn | supplier.vkn, customer.vkn |
| C007 | Hızlı Fatura-İrsaliye Zamanlaması | Context | min(references.despatch\_date) \>= document.issue\_date | references.despatch\_date, document.issue\_date |
| C008 | Volumetrik Tutarsızlık | Context | sum(e\_irsaliye.deliveredQuantity)\!= sum(lines.quantity) | lines.quantity, e\_irsaliye.deliveredQuantity |

Contextual signals like C004 are vital for identifying potential over-invoicing or hidden fees. If the allowance\_total (indirim) represents more than 50% of the line\_extension (kalem toplamı), it suggests a transaction that deviates significantly from standard retail or wholesale practices.1 Similarly, C007 flags "rapid" invoicing where the goods appear to be delivered and billed on the same day or with an inverted timeline, which is a common indicator in "paper trading" where no physical goods actually move.1

### **Graph-Based Verification Signals (G-Series)**

Graph signals represent a paradigm shift from document-centric validation to relationship-centric analysis. By modeling transactions as edges between VKN nodes, the system can identify patterns that are invisible when looking at a single e-Fatura.1

| Rule ID | Name | Category | Trigger Pattern (Metrics) | Evidence Metrics |
| :---- | :---- | :---- | :---- | :---- |
| G001 | Çapraz Satıcı IBAN Paylaşımı | Graph | Multiple distinct VKNs share a single IBAN node | unique\_sellers\_count, shared\_iban |
| G002 | Yeni Bağlantı Yüksek Tutar | Graph | First-time edge with amount \> 3x historical median | relationship\_age, amount\_variance |
| G003 | Yoğun Zaman Kümelenmesi | Graph | \>N invoices between two nodes in \<24-hour window | temporal\_density, edge\_count |
| G004 | Yönlü Döngüsel Faturalama | Graph | Closed path (A → B → C → A) with minimal net transfer | path\_sequence, net\_volume\_difference |
| G005 | Leksikal Kimlik Çakışması | Graph | High name similarity \+ different VKNs \+ shared IBAN | levenshtein\_score, shared\_iban |
| G006 | Yol Uzunluğu Aykırılığı | Graph | Invoice chain \> 3 hops without intermediate waybills | path\_depth, missing\_despatch\_markers |
| G007 | Kurumlar Arası VKN Çakışması | Graph | Supplier VKN appears in authorized contact metadata | overlapping\_vkn, field\_location |
| G008 | Karşılıklı Ticaret Dengesi | Graph | Symmetric invoicing (A→B, B→A) with near-zero net | net\_balance, temporal\_alignment |

The G001 signal (Çapraz Satıcı IBAN Paylaşımı) is a high-confidence indicator of centralized financial control or potential intermediary hubs. In a standard B2B environment, each legal entity maintains its own banking credentials. When the system detects multiple distinct VKNs directing payments to the same TR-formatted IBAN, it flags a "hub-and-spoke" topology that may be used to aggregate receivables or obscure the final destination of funds.1

## **Evidence Pack JSON Schema and Decomposition**

To maintain a robust audit trail, every trigger must be backed by an Evidence Pack that adheres to a strict JSON Schema (Draft-07). This ensures that the data used to calculate the Review Priority Score is immutable, machine-readable, and verifiable by downstream AI agents or human auditors.1

### **Design Best Practices for Financial Consistency Data**

The design of the Evidence Pack schema follows a "No Additional Properties" policy to ensure maximum strictness. Every field, from the check\_id to the specific metrics involved, must be explicitly defined and typed. This prevents "data leakage" and ensures that the score decomposition is always deterministic.1 Furthermore, the schema treats types as executable contracts, using regex patterns for formats like UUIDs and dates to prevent the ingestion of malformed values that could lead to logic errors in the scoring engine.1

JSON

{  
  "$schema": "http://json-schema.org/draft-07/schema\#",  
  "title": "EvidencePack",  
  "description": "Deterministic evidence structure for UBL-TR consistency checks.",  
  "type": "object",  
  "properties": {  
    "check\_id": {  
      "type": "string",  
      "pattern": "^\[HCG\]\[0-9\]{3}$"  
    },  
    "check\_type": {  
      "type": "string",  
      "enum":  
    },  
    "description": { "type": "string" },  
    "fields": {  
      "type": "object",  
      "description": "Values extracted directly from the e-Fatura canonical paths.",  
      "additionalProperties": true  
    },  
    "metrics": {  
      "type": "object",  
      "description": "Computed quantitative metrics supporting the check.",  
      "additionalProperties": false,  
      "properties": {  
        "discrepancy\_value": { "type": "number" },  
        "line\_count": { "type": "number" },  
        "allowance\_ratio": { "type": "number" },  
        "unique\_vkn\_count": { "type": "number" }  
      }  
    },  
    "paths": {  
      "type": "array",  
      "items": { "type": "string" },  
      "description": "JSON Pointers to the source UBL-TR nodes."  
    },  
    "audit\_trace": {  
      "type": "array",  
      "items": { "type": "string" },  
      "description": "Sequential steps taken by the rule engine to reach a finding."  
    }  
  },  
  "required": \["check\_id", "check\_type", "fields", "metrics"\],  
  "additionalProperties": false  
}

### **Deterministic Narration and The No-Synonyms Policy**

To support explainability without introducing ambiguity, the framework enforces a strictly neutral No-Synonyms Narration Policy. All generated explanations must use the exact identifiers found in the JSON data. For instance, the system must always use "IBAN" instead of "bank account," and "VKN" instead of "tax number".1 This ensures that the audit report is machine-verifiable; a secondary validation script can confirm that every term used in the human-readable narrative corresponds to a specific key-value pair in the underlying Evidence Pack.1  
A Finding Card in the audit report thus bridges the gap between raw data and professional insight, presenting the check\_id (e.g., H002), the relevant fields (e.g., totals.line\_extension), and the audit\_trace (e.g., "Calculated sum of lines net\_amount as 110.00; found variance of 10.00 against stated extension") in a scan-friendly format.1

## **Operational Triage and Queue Management**

The resulting Review Priority Score is the primary driver for workflow orchestration. By mapping score ranges to specific triage queues and SLAs, the organization can optimize its human resources, focusing senior talent on high-risk, high-value discrepancies.8

### **Triage Queue Thresholds and SLAs**

The triage engine categorizes documents into three distinct bands, each with its own performance targets and escalation paths. These bands are calibrated to reflect the institutional risk appetite and the legal timeframes associated with Turkish trade finance (e.g., the strictly stipulated timeframes for Murabaha document submission).2

| Priority Band | Score Range | Review Queue | Target SLA | Escalation Path |
| :---- | :---- | :---- | :---- | :---- |
| **High** | 60 – 100 | Critical / Forensic | \< 1 Hour | Immediate referral to Head of Risk or Legal. |
| **Medium** | 25 – 59 | Standard Auditor | \< 4 Hours | Level-2 Reviewer; required waybill verification. |
| **Low** | 0 – 24 | Auto-Close / Audit Only | N/A | Logged for monthly Population Stability review. |

Documents in the High-Priority queue are often those that have triggered multiple Hard checks (e.g., H002 and H007) or high-impact Graph signals like G004 (Circular Trading). The 1-hour SLA is critical here, especially in the context of Murabaha, where delayed documentation can render a transaction non-compliant with participation banking standards, necessitating "immediate corrective action".1

### **Score Decomposition and Finding Ranking**

When a document reaches an auditor, the triage dashboard provides a full decomposition of the priority score. This decomposition ranks individual triggers by their contribution to the total score, allowing the auditor to quickly identify the "smoking gun" among dozens of potential anomalies.13 A document might have a high score because of one catastrophic Hard failure (e.g., H009 duplicate UUID) or because of a dense cluster of contextual and graph signals (e.g., G003 temporal density \+ C004 high discount). The dashboard highlights these different risk profiles using distinctive visual indicators, ensuring the professional peer can immediately grasp the nature of the inconsistency.13

## **Calibration, Drift, and Failure Handling**

No scoring system is static. As trade patterns evolve—for instance, during peak retail seasons or when new tax codes are introduced by GİB—the distribution of anomalies will shift. To prevent the "erosion of trust" in the automated scores, the system implements continuous calibration and robust failure handling.1

### **Population Stability Index (PSI) for Calibration**

The framework uses the Population Stability Index (PSI) as a univariate drift metric to monitor whether the incoming document population is significantly different from the baseline (training) population.16 This is crucial in trade finance, where a sudden increase in foreign currency usage (C002) or foreign IBANs (C003) might be due to a genuine market shift rather than an increase in fraudulent activity.16  
The PSI is calculated across 10-20 quantile-based bins of the Review Priority Score. The interpretation of the results guides the recalibration of the model weights (![][image5]) 16:

* **PSI \< 0.1:** No significant shift; the model remains valid.  
* **0.1 ![][image7] PSI \< 0.25:** Moderate shift; requires investigation into specific features (e.g., check if C001 triggers are increasing due to larger batch sizes).  
* **PSI ![][image8] 0.25:** Significant shift; triggers a mandatory retraining of the scoring weights and a review of the category caps to prevent triage queue saturation.18

### **Deterministic Failure and Exception Handling**

Operational failures—such as low-quality OCR scans of the Alacak Bildirim Formu (AB-NTR) or timeouts in the graph query engine—are handled deterministically. The system does not "suppress" these failures; instead, it incorporates them into the priority score.1

* **OCR Confidence Gating:** If the OCR extraction of invoice numbers from the AB-NTR falls below a predefined confidence threshold, the H011 (Invoice ID) check is marked as a "Deterministic Failure," and the document is automatically assigned a default high-risk weight for that check.2  
* **Missing Field Tolerance:** If a canonical field like payment.iban is missing, the engine records a specific "Field Missing" audit trace and continues with the remaining checks. This prevents a single missing field from halting the entire validation pipeline.1  
* **Graph Timeouts:** For high-volume transaction clusters that might cause ![][image9] complexity in G-series checks, the engine uses horizontal scaling (via Kubernetes/KEDA) and in-memory streaming to ensure SLAs are met. If a timeout occurs, the G-signal is reported as "Unevaluated," and a placeholder weight is added to ensure the document remains visible in the triage queue.1

## **Nuanced Insights into Turkish Trade Finance Consistency**

The implementation of this framework in the Turkish market has revealed second-order insights into the relationship between e-Transformation and systemic risk.

### **The Impact of E-Waybill (e-İrsaliye) Maturation**

A critical insight gained from the extraction of rules H005, H006, and C008 is the growing importance of "logistical synchronization." While early e-Fatura systems focused purely on financial amounts, the mandatory inclusion of despatch\_id and the requirement for the waybill date to precede the invoice date (H006) has created a "physical-financial bridge".1 The system has observed that "Volumetric Inconsistency" (C008), where billed quantities differ from delivered quantities, is often a more accurate predictor of long-term credit defaults than simple mathematical errors (H002), as it indicates potential breakdown in the supply chain or the inflation of receivables for credit lines.1

### **Lexical Identity and The "Hub-and-Spoke" Risk**

The use of the Levenshtein distance in G005 (Leksikal Kimlik Çakışması) has highlighted a specific risk pattern in Turkish family-owned conglomerates. These entities often have multiple subsidiaries with nearly identical names and shared back-office functions, leading to shared IBANs.1 While legitimate in a corporate group context, this pattern mirrors fraud techniques used for "identity obfuscation." The scoring engine provides the nuance here: if the shared IBAN is verified against the bank’s internal customer records as a "Holding Account," the priority contribution is lowered, whereas if it is an unverified account, the priority is maximized.1

### **The Evolution of SHAP-Based Explainability in Triage**

Moving forward, the integration of additive feature attribution (like SHAP values) into the Evidence Pack will allow for even more granular "Why this document?" questions.3 By visualizing the "waterfall" of score contributions—starting from the baseline of a perfectly consistent document and adding the specific "shoves" from Hard, Context, and Graph signals—the framework provides professional peers with a transparent, intuitive map of the risk landscape.3 This transparency is not just an operational feature; it is a regulatory requirement for "Trustworthy AI" in the financial sector, ensuring that every triage decision is justifiable to both the GİB and the financial institution's internal compliance committee.14  
In conclusion, the Review Priority Scoring and Triage Framework represents a sophisticated, data-contract-driven approach to UBL-TR document verification. By combining the deterministic rigor of Hard checks with the relational insight of Graph signals and the operational discipline of saturating additive scoring, it provides a scalable solution for the modern trade finance environment.1 The adherence to the No-Synonyms policy and the strict JSON schema ensures that as the system scales to millions of invoices per month, its decisions remain grounded in a factual, machine-verifiable truth.1

#### **Alıntılanan çalışmalar**

1. UBL-TR Invoice Canonical Schema Report.md  
2. What SLA Tiers Justify Premium Pricing for Production-Grade Finance Close Agents?, erişim tarihi Şubat 19, 2026, [https://www.getmonetizely.com/articles/what-sla-tiers-justify-premium-pricing-for-production-grade-finance-close-agents](https://www.getmonetizely.com/articles/what-sla-tiers-justify-premium-pricing-for-production-grade-finance-close-agents)  
3. Explainable AI-driven customer churn prediction: a multi-model ensemble approach with SHAP-based feature analysis \- Frontiers, erişim tarihi Şubat 19, 2026, [https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2026.1748799/full](https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2026.1748799/full)  
4. Additive-feature-attribution methods: a review on explainable artificial intelligence for fluid dynamics and heat transfer \- arXiv, erişim tarihi Şubat 19, 2026, [https://arxiv.org/html/2409.11992v1](https://arxiv.org/html/2409.11992v1)  
5. Development of scoring system for risk stratification in clinical medicine: a step-by-step tutorial, erişim tarihi Şubat 19, 2026, [https://atm.amegroups.org/article/view/16442/html](https://atm.amegroups.org/article/view/16442/html)  
6. Using ODG Risk Assessment Score for CM Triage, erişim tarihi Şubat 19, 2026, [https://www.odgbymcg.com/help/Disability/Content/ODG/PDFLibrary/ODG%20RAS%20for%20CM%20Triage%208-24.pdf](https://www.odgbymcg.com/help/Disability/Content/ODG/PDFLibrary/ODG%20RAS%20for%20CM%20Triage%208-24.pdf)  
7. Risk Assessment Matrix: How to Calculate & Use a Risk Matrix Effectively \- Vector Solutions, erişim tarihi Şubat 19, 2026, [https://www.vectorsolutions.com/resources/blogs/risk-matrix-calculations-severity-probability-risk-assessment/](https://www.vectorsolutions.com/resources/blogs/risk-matrix-calculations-severity-probability-risk-assessment/)  
8. Service Level Management: How to Manage SLAs \- InvGate, erişim tarihi Şubat 19, 2026, [https://invgate.com/itsm/service-level-management](https://invgate.com/itsm/service-level-management)  
9. How to Develop a Service Level Agreement for Third-Party Providers \- Ncontracts, erişim tarihi Şubat 19, 2026, [https://www.ncontracts.com/nsight-blog/service-level-agreement-sla-for-vendors](https://www.ncontracts.com/nsight-blog/service-level-agreement-sla-for-vendors)  
10. Risk Severity Calculations \- Palo Alto Networks, erişim tarihi Şubat 19, 2026, [https://docs.paloaltonetworks.com/saas-agent-security/administration/respond-to-security-recommendations/risk-severity-calculations](https://docs.paloaltonetworks.com/saas-agent-security/administration/respond-to-security-recommendations/risk-severity-calculations)  
11. Service Level Agreement Explained | SLA Types, Metrics & Software \- Infraon, erişim tarihi Şubat 19, 2026, [https://infraon.io/blog/service-level-agreement/](https://infraon.io/blog/service-level-agreement/)  
12. SLA Best Practices: How to Set and Manage Customer Expectations \- Pylon, erişim tarihi Şubat 19, 2026, [https://www.usepylon.com/blog/sla-best-practices](https://www.usepylon.com/blog/sla-best-practices)  
13. From Atlassian JSON to Actionable Audit Insights \- Graylog, erişim tarihi Şubat 19, 2026, [https://graylog.org/post/from-atlassian-json-to-actionable-audit-insights/](https://graylog.org/post/from-atlassian-json-to-actionable-audit-insights/)  
14. Structured Output Generation in LLMs: JSON Schema and Grammar-Based Decoding | by Emre Karatas | Medium, erişim tarihi Şubat 19, 2026, [https://medium.com/@emrekaratas-ai/structured-output-generation-in-llms-json-schema-and-grammar-based-decoding-6a5c58b698a6](https://medium.com/@emrekaratas-ai/structured-output-generation-in-llms-json-schema-and-grammar-based-decoding-6a5c58b698a6)  
15. Operationalizing SLA Enforcement: A Practical Guide for MSPs \- NinjaOne, erişim tarihi Şubat 19, 2026, [https://www.ninjaone.com/blog/operationalizing-sla-enforcement/](https://www.ninjaone.com/blog/operationalizing-sla-enforcement/)  
16. Population Stability Index (PSI) \- The Agile Brand Guide®, erişim tarihi Şubat 19, 2026, [https://agilebrandguide.com/wiki/ai-terms/population-stability-index-psi/](https://agilebrandguide.com/wiki/ai-terms/population-stability-index-psi/)  
17. Document Management Best Practices for High-Volume Workflows \- Cincom Systems, erişim tarihi Şubat 19, 2026, [https://www.cincom.com/blog/ccm/document-management-best-practices/](https://www.cincom.com/blog/ccm/document-management-best-practices/)  
18. Population Stability Index (PSI) \- GeeksforGeeks, erişim tarihi Şubat 19, 2026, [https://www.geeksforgeeks.org/data-science/population-stability-index-psi/](https://www.geeksforgeeks.org/data-science/population-stability-index-psi/)  
19. Population Stability Index (PSI): What You Need To Know \- Arize AI, erişim tarihi Şubat 19, 2026, [https://arize.com/blog-course/population-stability-index-psi/](https://arize.com/blog-course/population-stability-index-psi/)  
20. Real-Time Trade Finance Document Processing with AI, erişim tarihi Şubat 19, 2026, [https://cleareye.ai/transform-trade-finance-document-processing-real-time/](https://cleareye.ai/transform-trade-finance-document-processing-real-time/)  
21. Confidence-Gated Reasoning Methods \- Emergent Mind, erişim tarihi Şubat 19, 2026, [https://www.emergentmind.com/topics/confidence-gated-reasoning](https://www.emergentmind.com/topics/confidence-gated-reasoning)  
22. Types of explainable AI, erişim tarihi Şubat 19, 2026, [https://courses.minnalearn.com/en/courses/trustworthy-ai/preview/explainability/types-of-explainable-ai/](https://courses.minnalearn.com/en/courses/trustworthy-ai/preview/explainability/types-of-explainable-ai/)  
23. Trade-offs in Financial AI: Explainability in a Trilemma with Accuracy and Compliance, erişim tarihi Şubat 19, 2026, [https://arxiv.org/html/2602.01368v1](https://arxiv.org/html/2602.01368v1)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACkAAAAYCAYAAABnRtT+AAABsUlEQVR4Xu2WOywFURCGx7MQEaEVHZVCLaLSolDQiFYUoqARvYh3NB6R3ERIFDQUEiHRqIgElShVFCQUEs9/nDN2dvbuNleyW9wv+bLnzJndM7t79kFUpMgvzXAVdqnYmGqnSgX8guuwBnbAbzgJX1ReqnBB7TZILj5hg2mQI1dMPjjOVzl1uJCkIjOBFDlnB7LEDAWFiiuhjIwwQtFCb0MZGaOT4tdpuQ0UCD+U+5R/rj96bcCzSdEdZ+GiicXxAetsMIZpuGGDQjcctUHPOEWL5Jd9vYnFYfdNgk+o0QaFC7hng55PCh6eYQqv1SFJApdwm9wJVMIHlacLLYFPcAf2wH41lnhCcqBqE9+l6KewllwhGn3wJvjm2/NwQY0xOpevXJtv89yJRd7DUvhMLpHPlLc5lSPwxHo9LsEb1W+lYDK+C3o98vf/TvV1UVPk/hf+BZ5Yr0eeSP8pHcItNabh/oDpC++wQfULQg486LfnFH4zyDi/oqQtV/qIggeD1/kZ7PN9yV3224I4hqewRcUeyRVwomLMK7xW/TJyd4KXUxW5q7fmxw7glW8XKZJpfgDFDG+LfFMNFgAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,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>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACEAAAAYCAYAAAB0kZQKAAABZElEQVR4Xu2VPS8EURSGj6iIxHYKiUKi1Kiswh8QkWhoJCLRS1SbKJQqQiFoVSqFUiui0KDz1foqaFQ+39c5k72Oy6w1s4lknuTJzn3P5N4zd+/OihT8IzrhDFyH3UE+EFznxiZ8g2dwCPbAVXgFy1bLFS7wCtt9AVRE68e+kCXPkv6UrI/6MCseRBdo8QVHWpN10ys6+akvRMitiRfRyWPnoGGwgdyesFYa2USbD0izaAM3vhDhr43y6+bPP0otO9EPJ334S5bgsg8TLkSb4K7EYH7rQzAo+hbdgVOWNcF7uAVH4LjlyYPSa8u+wCJfVr6RPnjnMjILD+x6G+7ZdbijnC/8n0nb7Q92pdrto31Of7qjSmzCOXgejMN7SvLDeagHnvBYE8wm3DhhEa4E40zwTRyJ7mSXjdfgPhyzMV+IHbBV9JBnAv/ELuEJXLCM54mL8WBysSe4YbVheAjnbVxQ8C3vd6xSC+j/nQwAAAAASUVORK5CYII=>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAABPCAYAAABWMpmUAAAOgklEQVR4Xu3dC9A9cx3H8a+k0k1UozTxT5IwumASDZEpXRWR0QWhSDQ1XUTTTdG9RqWL4t+FUlIphSimwnRVJlLDf5TIPaXQ/fdp9+v5Pt9nz/PseZ495zmX92vmN2d/v91zzu6ePWe/53fZNQMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAfhyWCzDV/psLAADA8rozF2DqbVPSrbkQAAAsj3NLOiEXAsXvcgEAABi+P5Z0di4EAjWNrpELAQDA8NBPCQs5vqTbciEAABiO/Us6JhcCDRTYPysXAgCAwbq7UbuG9l5pHC8AAAzdL40TMPrD8QIAwJDp5HtcLgTm8a2SPpsLAQDAYFxo1JZgcThuAAAYEp1078iFQAs6djRYBQAADJhOutvnQqAFHTvUsgEAMASccLFYq4zjBwCAgdvXpuOE+42SrirpD1bdzeGakq6t05/6THo+Ku+06vjZJc8AAADd+UdJV+bCCeXNd4sJUO9b0pds5vkvmj17avn1+xQAAwCAAdHJ9n25cEL92WYCrk3SvH4sNuibVOwPYMI9o6RPl7RzKHt/mJ5047T9G+cCTAydaLfLhRNsKbVs0b9KenAunFJd7E8AI+iCkm4v6W6hbAer+ob0+6XfOheMgS63v41Nc8E8trRqHbQubu26rAtN6+I/9mpaQTtdBQrr2eI+24eXdJ3NDX62tdH90xHF9V49zevHt3PBGFvKfojHAIAJ8Wvr/cV+mfWe18tluWDEdb39baijdVsKIrUOR6byrtaraV1OL+nfuRA9+cmxiwD3mdb/Z/sCq56zayr/TV3+wFQ+irSOvh9VUzbNNrJqEIXuDbpYen6/xxGAEfYEq77UP8wzgn6+9E+38QrYut7+trp4zS5eQ7p6nWnWZYB7hPX3mRxovZe/2XrPG0UesI3TOnftipLeUtJttrSATbeomub9CEycNj+Ocf5OVo3KurqkHUO5rGvVshqir1qCp82ebetYNYx/ZUn3mj3r/95a0odLumdJ55X091lzzbax6l/jMal8z5I+VNLLS3pISa+uy9WUuIVVQZm/3w5WvY73Uet3+2W1kt5b0tlWBaix/ICSTqjz2o6TrLpEQ6TaA72m9pGSrFXSm0v6fJ3/VEnr19P7WbXNp9Z55+ulbdG8x4Z5Whdd6fx4q0bSyYutOhH4e4hq7fK6yOusem6mfXeJVdse7VbS4Taz7U+yatvvcdcSaOt8m3vM9eId9tfMM2r6LugG8uPEv5NK907zpslfbGkBm1/aA8CEaBOwRFp28zCtwM29ti5TPxpNv6phngIJD+xU7S8qU16BhYI6Xx89PrqeVv+tb9bTuf/WG+r8WSV9sJ7+nFVBlW+fBy3n1XkP+vrdfnUE1/J+gjzXZq7/pODE318BzKFWBYrK+0lT26wbM6tM+0RJHmbVP2qV31LSjfW0KIjV9H/qvPN1V98l7cPfl3RTPU/r4s/T/hIFa3F7tS7+ucR1EQXdeb9o2/0zEM1XQCwK8LwJRuugZlzf9i6aCYelKfD8Qklr3LVEFYgquI5ygOuv85E6r9c51toFsPM10Wda7re5MHiTzW0mHXX6bvlx2nY/DNLjrfrTFMV+n6+xme9Yl5YasL3eRmP/AehIvz+KWtb/9W5W5yPlm5pEVf7UkFcA489Vc2R8na/Y7E7Sp9jc9zm4pKNDPm7H12ymz87FoVziiVcWs/0vbCjLea2zU61iXGaPlHfPsapcNYaqyVKtoVN5U8CW5TLl48lEtWtNy2Qb2NzynNdnEMsUAOZllFdAPSj6LLRNOSlgX2lV4PUZa64tbDJf4Kl98v16udzUmANcf53LbeZ1dLxqmYUCWP0JyvuxyWOsWk61s5PmFVZtm5IGBC0XfY77WLUeal0Q/4P5SKsGBWhawVXXlhqwqcWhzXEEYEz4j+J88qirJ9tMTVV+rvK9AramJGeEaTnNqup8p3lNP9rxOZr+echHcbncmblpG7K4/U3LqulWtXlOyzw05L9Yl7leAduzrLlcVN42YHtPyqvW0imQyc/LefEO4E41a03Lqcy3XU24eZm8PuNAJ+Km7YjH11Z1mdPnnZ/T63XiH40m/7S5z2vyU2u33LjyrgNK8RgeFtX0+R9HrYMH2vkP2F5WfRZt6bftibmwgQK22EoRKWhcyPNsso8PYOp4f5n5rhCupjanZX+V8pHyTU00eblM89Vs6U2OeV58TxeX0/SPQz7SifZdVtVynDd71qK2P7u1pHNCXss8KORzrZaP6Mu6CNi0jE4oTsvEy03kdZGcl9zsrJqipuVU5tuuZt28jPLjFrD1Cjw/EPJqCo7L5ABXer3OQvtDy+TnNdEyf82FSe5n2o8Nc8GQ+ejotvtjULxGzWn6hpBXc3f8/ZhvXf215lvGKWBTt4rsUdbu+WrRaLMcgDGiL7VuhdOLLm3hj/EHwH9Q5bn1o/Kr6mn1w3Iq935kmX7wXlrSG0t6ic2+FprouerfFT2iLneaVtNqk/tbNf/r1jzYoe32i5ZtWj/1WYr5+Zohd0/5j9WPXQRsKlNzaszH2r6mmrKmdVGNRix/R8qLfwa+7epLl5dRPtY+9kNN7itzYaJ9e2fL1FavwDNuh/owxWVygCu9XmehgK1tDZuaTrsamZqpdmYUaFCP9oUG8CwX1bJ9POS1PrHm66Iw3cbbrd09PhWw+QCqxaCGDZhQ+vHPTYrqqxa/8Oq8HIOGO2zmx9RPQvqR8efoQrTOh5j7D69OZt+tpzeu511Yl51ss/vl+HrM9y9WedUC9aL58/2wttl+UW1S3Ad729xllFf/IqcRlXEZNa0or9rEg0paUZfvX5erX0ym8qaATSM23XF1WaT8M+pp7fOmYMDXRVbUjxrsoXIFu07bnj+DU0PeL/AbKX9iKmtL27sc1w9bYc3bEQO23H+zqYZtRUOZ8gvdcsr70C3Ea2uajheVXZ/K9Ifpb1YNevH9qtfQd3OVzQwo0Wt6irRsHmwxaFoHHVfLKe+HnD+rftRv2y9s/t+hfui3VAMaIr2H+kQu1A9S6MMGTDD11Yo/1hoBmXnnaiV14Nc1oxRoOf2oq0+X5t8nlIv6evhzffScqPkwvq+nT4ZlVKul9VG5ahXi5TQUOCrgUsonKacall41fK7N9osCV18m9m9TcKOmEu2ja6x6T112QeulMjWdOh+x6T/225d0rc0897C6XPQDrZO4kvqgOXXm16hD399NTdFea6ekQQxqGva883XxMp0MfF3i3RXEPwOl/BlovfUc7QO9hrZdeW1/3HYNOFFw4DWX6tjtQYOOEYmfg4LaYeoVeCrQcTvVZa4pwO31OiemsuxSm/u8XrSc+nrloC022Tl/TV3+ZedUpuMovmfT++s4bCofFH3PNfhguZ1u1Yhf8RHuCthlVf0o3grQ1T7S9zoOvhK9x8+s3chfRokC6FyvH5Ve5W3FE/35YRrLY4XNfKZPsaqPlPrjKIkeFTg4jfCdRhol3e+xr6YzDcxRc1sTjabNtZXqF6r75spKm6k9U/cGBdXLSQOX4rGw3HSsqtuG05/MA0Le6U9V7JIwCG2PDQV7bZcFgFb0o5JPNEfZ0vvn6HX3Kel+NrffGYZPJ+F4qRKJg0lWhml5fspPiyOt+xOtXjPS90FdFjao83o/NbepXF0D1M/ymfW8KNeaD4IuzK3a2nHU9efWRK0az86FDVQzOIz1ATBlVDtwlVWX+FAzXBc1YvqxOtOqa2Zh+amJR81xTs2msZ+jPi81Wyto8EEsskmYngbzDT5ZLO1TNbuLmtPUhKqmaHWe9wssO3Ur0OfQ1NfullzQsUOs6me5FMs1YELH83U2uyaua953LY4E70VdEbo+jgAAU+JKq0brvrvOK3DQ5Vg+atUdBXRLLtGJSUH75nV+mqhvqE60w6jNGiVqEo/9BBdDf9B0QWdUxxABGwAAA6QT7ba5cII1jcjuV9vRtdOCgA0AgAHTiXah67VNEm2vLka8GApsdbkSvUavUeLTiIANAIAB0wCNpQ66GRceWHSRUPHLzPS6NBEAAOjAgTYdAYgulK27jOhacrpQcg7AeiUtq4BWz9MgBb2GatlQ8TuTNI30BQAAHZqGgA2DcYVx/AAAMBQ64ebrpwFt6NhZ6uVRAABACzrp6tp1QL907OheogAAYMB0xwGatbAYHDcAAAyRTry6E8GkObGkE0o63qp7Xq41e3ZPp5Z0Wi7ELNo/ugg1AAAYksttvGpLTrL2t5WL26Ug49KQn8+PcgFmGafjBQCAiTHOJ+ANSzrKqttOrWcz98KUvF053wsBW28XW/v9CAAAOnRYSW/LhSPoRquui+bWKWmXkM9iYKHrht0Q8pq3e5g+PMyLAdvNVu2bS+q87kWq+9RqsMZGddk00b7aLRcCAIDhGJdak7ieN4XpJlr2yyVdV9IZaZ54wCZNAVu8ddeF9aO/v/rETVvAdmxJt+dCAAAwPHvb6AdtB5d0ZshfVNIDUlo9zI/boxGxunl7tEeYjgHbBfWjnq+bxnsSvYcCRc1TDd9CtMxBuXBMTcutzAAAGGmqRVItyqhSkLRmST+o8yeHeU1iwHZOysteYfqIMO21aT8JZU7NobK1zdxHc5OSTi9p3ZI2K+k7Je1Q0n5WNaV+tV5unGk7VsuFAABgecQ+YqNGAdfaJW0Zyq4P09FWVi2/XZ3fs86vUdKmddlx9eP3rApIFHApELvaqkEM4rVt+9aPeg3V4h1a0o512folbVHStiUdHZaTSaiVepxxH1UAAEaORluOG9X+3LN+HKZdw7TeX9S/7ZB6+pSS7l9PjysPcAEAAMaWRqDq0iLyCasGM6jWTi6zqn8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMO3+B9Uq+qUqkswMAAAAAElFTkSuQmCC>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAXCAYAAAALHW+jAAAA5ElEQVR4XmNgGAWjYHCB2UCciC4IBApI7EIgFkTi4wS/gJgZiP8DsROS+DOoGAjA5D8hpLGDZQwQxSAA0uCAkALz1yHxTwPxZyQ+VlALpbsZEK4BASYoXxdJTAOIpyLxQeADGh8OQJqnI/HXQMWQwQk0Pk4Ac40CkhiI/wOJDxNDBg5ofBQAUqyFxv+CxAdFlg0SfzEQzwDiACQxFAAKi+dAzM0A8VoOA8RQeyB2BOKbCKUM7lAaJM+BJI4BlIA4Dk3MjQHV5TAAS0ZUAyuBuAqIfdAlyAUvoPRGFFEKgRG6wAgEAHejK1gMJmPFAAAAAElFTkSuQmCC>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAYCAYAAAAlBadpAAAAnElEQVR4XmNgGAUwwIwuQAiANNQA8X8gzkKTwwtuAPE6IPZjIEMzMhipmnPQBYkFIM256IJQYAPEG9EFkQFIcx66IBQYA7EUuiAyAGkuQBckFoA0F6ILAsEbIP6DLogMRBggmnvQxPuhNEgOA6wG4tdA/ASIH0Ppl0D8C0mNIBD/ReKTBE4CcSS6ILEA5uR9KKJEAlDOu48uOAQBACJJJAdEsZBdAAAAAElFTkSuQmCC>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAXCAYAAADUUxW8AAAAiklEQVR4XmNgGAXEAEZ0AWKAIxD/B+IWdAl8IJYBoikHXQIfqGSAaApCl8AHpgDxPyC2QJfAB9YD8Q8gVkKXIARyGSBOtEKXIAWUMEAMCUaXIAVEMUAMyUaXIAXYMUAMaUOXIAWoAPFPIJ6DLkEKEATi/eiCAwekgdibSIyR8kSA2JxIrAnVM1QBAIF7GAsULSKVAAAAAElFTkSuQmCC>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAXCAYAAADUUxW8AAAAiElEQVR4XmNgGAVkAVcg/g/EWegSpABrBogh3egSpABVIP4JxMvQJUgBIkD8HogPoUuQAjiA+D4QXwNiZjQ5ooAYEH8A4h3oEviAOhD/AuKF6BL4gB0DJOTb0CXwgUgGMuI8lwGiyQ9dghBoAGIjdMHBD6SB2JtIbAHVAwegZGhOJNaE6hmqAADk7RfSbVOfYwAAAABJRU5ErkJggg==>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAYCAYAAAC4CK7hAAACUElEQVR4Xu2XzatPQRzGH29RIpSXKGyIchdWwkJRskcU6VohxUIWVpf8A7euhZVEpGxZKkpYWHgpC8oCC6/FQuT9+5g51/c8M+N3fr/O77K4n3q6Z57vd+bMzJmZ31xgnL7wzPTTdEkD/4LlajTko3t+YnruymSFlLtiiem06ZRppsRycDZ7hXW3xOe1sey5axoQryPDCA3tieXFptemz6MZKa9Mc9XskaNIB0LoTVczx0SE5BsaiHwz/VATYcAcaFuwDyvVNDajvgSLsIGnajo2IuRsEp/eAvF65b5plZoOvmuRmp4XyH9OT/XFLjtvYfTa4Kxpfnw+4nwP98pNNSs2IHTmuvjKbIS89847Z/riyh5uzjP4s65nmI4j7EFOiueA6ZBp0LQP5f24E3+ZuK8IwWkaEHYj5N1z3nfTBVeumGq6atqFUOckwoyToeh5WPZ6Vw/X0LqjVJU78Rghb7/zqk4q1+LfaiAnXIxfpsn7SmTrzkPzgeTyWN4rHuERSh4hrXMw43UD6yarZ1IMfNKAsA0hT49meoPieRi/Jd6H6PcK6/KrJuRmWinl0PPLRmG8+sX23jHxuiHXj990mqHqMjdFAwj+eTUjO5C2u915cxCuP92ibdZg8IGaxhuEU63ERZSPyodIX3rFeS99oCFbkbaZ8BYh6Q7CnuHzmlpGylKUG+aVZkQ8flXmU7Mk1gTut9tqtgU7xR/LsaC0xFvhMNL/H/rBepRvEa3BZZQ9EluEt4jJavaD0l5pA94UVqvZLyaYlqnZEuvUGOd/5hfZ9JT5b1845QAAAABJRU5ErkJggg==>