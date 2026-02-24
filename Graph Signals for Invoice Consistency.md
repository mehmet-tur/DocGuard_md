# **Graph & Relationship Signals Report**

The verification of electronic commercial documents, specifically the e-Fatura and e-İrsaliye within the Turkish regulatory framework, has traditionally relied upon deterministic "Hard Checks" that evaluate the internal consistency of a single XML file against the UBL-TR 1.2 schema standards.1 While these methods effectively ensure that the tutar tutarlılığı (amount consistency) and parti kimliği (party identity) comply with Gelir İdaresi Başkanlığı (GİB) requirements, they are inherently limited by their transactional isolation.1 A more robust verification methodology involves the transition from document-centric validation to relationship-centric analysis, where the data is modeled as a multi-modal graph.3 By representing the economic interactions across a historical repository of invoices as a network of nodes and edges, it is possible to identify systemic inconsistencies and relationship-based discrepancies that would otherwise remain invisible to row-level analysis.5 This report provides an exhaustive technical specification for an MVP graph-based verification system designed to analyze Turkish trade finance data using canonical fields, without reliance on external data sources.

## **Section 1: Graph Schema Definition**

The foundational architecture of the relationship verification system rests upon the mapping of UBL-TR canonical JSON fields into a formal graph schema. This schema must be capable of representing the diverse entities involved in Turkish trade, including corporate taxpayers (VKN), individual entrepreneurs (TCKN), financial endpoints (IBAN), and the documents that bind them (Invoice ID/UUID).1 The schema is structured into a nodes table and an edges table, optimized for storage in a relational environment such as PostgreSQL while supporting the complex path-traversal queries required for relationship signals.7

### **1.1 Multi-Modal Node Definitions**

Nodes in the trade finance graph are categorized into several entity types, each derived from specific tags within the UBL-TR XML structure.1 The normalization of these nodes is critical to ensure that entities are not fragmented due to minor lexical variations in the input data.

| Node Type | Canonical Field Mapping | Normalization Logic | Functional Role in Graph |
| :---- | :---- | :---- | :---- |
| **Entity (VKN)** | supplier.vkn, customer.vkn | 10-digit integer string, leading zero preservation. | The primary actor node representing a legal corporation.1 |
| **Entity (TCKN)** | supplier.tckn, customer.tckn | 11-digit string; must pass Modulo-10 validation. | Represents a natural person or sole proprietorship. |
| **Financial (IBAN)** | payment.iban | 26-character alphanumeric; removal of spaces; TR prefix. | Represents the settlement destination for funds.1 |
| **Document (UUID)** | metadata.uuid | Lowercase 36-character hex string. | The immutable instance of a transaction record.1 |
| **Logistics (Despatch)** | references.despatch\_id | 16-character alphanumeric GİB format (e.g., IRS2024...). | Bridges the financial claim to a physical delivery note.1 |
| **Corporate Name** | supplier.name, customer.name | Case-insensitive; removal of "LTD. ŞTİ.", "A.Ş." suffixes. | Used for lexical identity consistency checks.1 |

The interaction between these nodes creates a "knowledge layer" where an IBAN is not just a field but a shared resource that may connect seemingly unrelated VKNs. Similarly, the references.despatch\_id serves as a join key that connects the e-Fatura node to an e-İrsaliye relationship, allowing for temporal consistency checks across the supply chain.1

### **1.2 Edge and Relationship Topology**

Edges represent the directional flow of value, documentation, or ownership between nodes. In the Turkish e-document context, edges are primarily extracted from the cac:AccountingSupplierParty, cac:AccountingCustomerParty, and cac:PaymentMeans blocks of the UBL-TR XML.1

| Edge Type | Source Node | Target Node | Attributes (Metadata) | Description |
| :---- | :---- | :---- | :---- | :---- |
| **ISSUED\_TO** | Entity (Seller) | Entity (Buyer) | issue\_date, payable\_amount, currency | A financial obligation created by an e-Fatura.1 |
| **PAID\_VIA** | Entity (Seller) | IBAN | last\_used\_date, frequency\_count | Links a seller to a specific bank account.1 |
| **LINKED\_TO** | Document (UUID) | Despatch ID | reference\_type, issue\_date | Correlates an invoice with a delivery note.1 |
| **DECLARED\_BY** | Entity (VKN) | Corporate Name | validity\_start, validity\_end | Maps a tax ID to its registered corporate title.1 |
| **SAME\_CONTACT** | Entity (A) | Entity (B) | contact\_email, phone\_number | An inferred edge based on shared communication metadata.12 |

The mapping of these relationships allows for second-order insights. For example, a PAID\_VIA edge that points to an IBAN used by multiple non-related VKNs creates a "hub" node, which may indicate a central processing point that is inconsistent with the decentralized nature of standard B2B trade.6

## **Section 2: MVP Graph Signal Catalog**

The design of graph signals focuses on identifying relationship-based inconsistencies using only historical data within the system.3 These signals are non-deterministic and are intended to provide evidence for further verification rather than binary rejection.1

| Signal ID | Signal Name | Graph Pattern Description | Evidence Output (Fields/Metrics) | Explainability Template | False Positive Mitigation |
| :---- | :---- | :---- | :---- | :---- | :---- |
| **G001** | Çapraz Satıcı IBAN Paylaşımı | Multiple distinct Seller VKN nodes share a single IBAN node via PAID\_VIA edges.12 | List of VKNs, total volume per VKN, first/last seen dates for IBAN usage. | "The IBAN \[iban\] is utilized by \[N\] different VKNs. Standard trade practice involves unique bank identifiers per legal entity." | Exclude known joint venture accounts or conglomerate subsidiary structures. |
| **G002** | Yeni Bağlantı Yüksek Tutar | A first-time ISSUED\_TO edge between a Seller and Buyer where payable\_amount \> 3x the Buyer's historical median.13 | payable\_amount, historical\_median, buyer\_vkn, seller\_vkn, relationship age. | "This represents the first connection between Seller \[V1\] and Buyer \[V2\]. The amount is significantly higher than the buyer's history." | Check for capital equipment unit codes (e.g., machinery) which are naturally high-value and rare. |
| **G003** | Yoğun Zaman Kümelenmesi | A dense cluster of ISSUED\_TO edges between two nodes within a \<24 hour window.17 | Edge count, temporal variance, cumulative payable\_amount, issue\_time sequence. | "\[N\] invoices were issued within \[H\] hours between these entities, which may be inconsistent with physical delivery logistics." | Retailers often batch daily small-value sales into multiple e-Arşiv Faturaları; apply a line\_item count threshold. |
| **G004** | Yönlü Döngüsel Faturalama | A closed path (A)-\>(B)-\>(C)-\>(A) where each edge is an ISSUED\_TO relationship.4 | UUID path, VKN sequence, net volume difference, timestamps of each hop. | "A circular path was identified: \[A\] \-\> \-\> \[C\] \-\> \[A\]. The net value transfer across the loop is minimal." | Common in inter-company service level agreements (SLAs) or barter-based trade in specific industrial zones. |
| **G005** | Leksikal Kimlik Çakışması | Entities with high lexical similarity in Name but different VKN sharing the same IBAN.1 | Levenshtein distance, shared IBAN, VKN pair, total turnover. | "Entities \[V1\] and \[V2\] share nearly identical names and settlement endpoints, suggesting a non-distinct operational identity." | Holding companies often have "Group Company A" and "Group Company B"; cross-check city codes. |
| **G006** | Yol Uzunluğu Aykırılığı | An invoice chain exceeding 3 hops where intermediate Despatch ID references are missing.4 | Path depth, intermediary VKN list, missing despatch\_date markers. | "The goods transfer involves \[N\] hops without corresponding e-İrsaliye markers for intermediate entities." | Commodity trading (e.g., energy or grain) where ownership changes multiple times before final delivery. |
| **G007** | Kurumlar Arası VKN Çakışması | A VKN appearing as Supplier in one context and as Contact/Authorized VKN in another entity's metadata.1 | Overlapping VKN, field location, transaction volume of both entities. | "VKN \[X\] appears as an independent supplier but is also listed as a control contact for entity." | Professional accountants or 3rd-party logistics (3PL) providers often manage metadata for multiple clients. |
| **G008** | Karşılıklı Ticaret Dengesi | Symmetric invoicing (A)-\>(B) and (B)-\>(A) with near-identical payable\_amount.4 | Net balance, amount variance, unit code overlap, temporal alignment. | "Entities \[A\] and have issued reciprocal invoices for nearly identical amounts, resulting in a zero net settlement." | Standard practice for corporate chargebacks or reciprocal service agreements in shared office spaces. |

### **2.1 Deep Insight: The Mechanism of IBAN Convergence**

The G001 signal (IBAN Convergence) identifies a structural inconsistency that is frequently overlooked in transactional auditing. In a healthy commercial environment, a bank account is a dedicated resource of a legal entity. When the graph reveals a single IBAN node connected to multiple Entity nodes (VKNs), it suggests a centralization of the settlement process.10 From a verification perspective, this creates a "hub-and-spoke" topology where the financial risk is concentrated at the hub (the IBAN holder), while the commercial risk is dispersed across the spokes (the sellers). If the sellers are small-to-medium enterprises (SMEs) and the IBAN is held by a third-party non-financial entity, it indicates a discrepancy in the stated payment flow of the e-Fatura.13 This is particularly relevant for Murabaha proxy verification, where the bank must ensure that the payment is made directly to the supplier of the goods, not an undisclosed intermediary.1

### **2.2 Deep Insight: Temporal Clumping vs. Logistical Reality**

The G003 signal (Temporal Density) focuses on the "heartbeat" of the commercial relationship. In the Turkish system, the e-İrsaliye must ideally precede or accompany the e-Fatura. If the graph displays a high density of invoices (e.g., 20 invoices between Entity A and Entity B in 10 minutes) with no corresponding Despatch ID sequence, it represents a volumetric discrepancy.1 The implication here is that the documentation is being generated to fulfill a financial reporting requirement or to exhaust a credit line rather than to document the movement of physical goods. The graph pattern for this is a "multi-edge" between two nodes where the attribute issue\_time has a variance approaching zero.

## **Section 3: MVP Storage Design**

Storing and querying these relationship signals does not necessitate a dedicated graph database (e.g., Neo4j or ArangoDB) for an MVP. Given the structured nature of UBL-TR data and the existing investment in relational systems, a PostgreSQL-based approach using **Adjacency Tables** and **Recursive Common Table Expressions (CTEs)** is the most storage-efficient and explainable design.7

### **3.1 Relational Graph Schema (PostgreSQL)**

The graph is materialized from the canonical JSON store into two optimized tables. This separation allows for indexing strategies that support both neighborhood lookups and path traversals.7

#### **Table 1: graph\_nodes (Entity Registry)**

This table acts as the unique registry for all nodes in the system.

| Column Name | Data Type | Index Type | Description |
| :---- | :---- | :---- | :---- |
| node\_id | UUID | PRIMARY KEY | Internal system identifier. |
| entity\_key | TEXT | B-TREE | The actual VKN, IBAN, or UUID value.1 |
| node\_type | VARCHAR(20) | B-TREE | Discriminator: 'ENTITY', 'IBAN', 'DESPATCH', 'DOC'. |
| normalized\_val | TEXT | GIN (Trigram) | Normalized name for lexical similarity checks.21 |
| first\_seen | TIMESTAMP | \- | Metadata for relationship aging. |

#### **Table 2: graph\_edges (Relationship Ledger)**

This table stores the directional connections and their associated UBL-TR metadata.

| Column Name | Data Type | Index Type | Description |
| :---- | :---- | :---- | :---- |
| edge\_id | SERIAL | PRIMARY KEY | Unique edge record ID. |
| source\_node | UUID | FK \-\> nodes | The origin of the relationship. |
| target\_node | UUID | FK \-\> nodes | The destination of the relationship. |
| edge\_type | VARCHAR(20) | B-TREE | Type: 'ISSUED\_TO', 'PAID\_VIA', 'LINKED\_TO'. |
| amount | NUMERIC(18,2) | \- | The payable\_amount from canonical JSON.1 |
| issued\_at | TIMESTAMP | B-TREE | The issue\_date and issue\_time. |
| metadata | JSONB | GIN | Stores unit codes, tax codes, and currency codes.1 |

### **3.2 Query Engineering: Path Traversal in SQL**

To implement signals like G004 (Circular Trading), the system utilizes WITH RECURSIVE queries. This approach allows the engine to find cycles of arbitrary depth without needing a native graph language.22  
**Mathematical Evaluation of Cycles:** A cycle is detected when a path ![][image1] exists such that ![][image2]. In PostgreSQL, this is achieved by maintaining an ARRAY of visited node IDs to prevent infinite recursion and to identify the return to the origin.24

SQL

WITH RECURSIVE find\_cycles AS (  
    \-- Anchor: Start with all 'ISSUED\_TO' edges  
    SELECT source\_node, target\_node, ARRAY\[source\_node\] AS path, 1 AS depth  
    FROM graph\_edges  
    WHERE edge\_type \= 'ISSUED\_TO'

    UNION ALL

    \-- Recursive Step: Join to the next hop  
    SELECT e.source\_node, e.target\_node, fc.path |

| e.source\_node, fc.depth \+ 1  
    FROM graph\_edges e  
    INNER JOIN find\_cycles fc ON e.source\_node \= fc.target\_node  
    WHERE fc.depth \< 5 \-- Practical limit for MVP  
    AND e.source\_node\!= ALL(fc.path) \-- Avoid internal loops  
)  
SELECT \* FROM find\_cycles WHERE target\_node \= path; \-- Cycle detected

### **3.3 Efficiency via Materialized Views**

For signals requiring high-frequency aggregation, such as G003 (Temporal Clumping) or G001 (IBAN sharing), **Materialized Views** are used to pre-calculate node degrees and neighborhood densities.26  
**Hub Detection View:**

SQL

CREATE MATERIALIZED VIEW mv\_iban\_hubs AS  
SELECT target\_node as iban\_id, COUNT(DISTINCT source\_node) as seller\_count  
FROM graph\_edges  
WHERE edge\_type \= 'PAID\_VIA'  
GROUP BY 1  
HAVING COUNT(DISTINCT source\_node) \> 1;

This view is refreshed periodically (e.g., nightly or upon batch ingestion) to provide near-instantaneous validation during the e-Fatura submission workflow.27

## **Section 4: Evidence Examples**

The output of a graph signal is an **Evidence Pack**. This is a structured JSON object that encapsulates the specific nodes, edges, and historical metrics that triggered the discrepancy check.21 The evidence must be neutral and purely descriptive to serve as a reference for subsequent AI or human review modules.

### **4.1 Example 1: Shared IBAN Across Unrelated Sellers (G001)**

This example details a situation where a corporate entity and a sole proprietorship share a single settlement endpoint.

| Field Name | Evidence Value |
| :---- | :---- |
| **Signal ID** | G001 |
| **Signal Name** | Çapraz Satıcı IBAN Paylaşımı |
| **Primary Hub Node** | IBAN: TR56...0001 (Active since 2023-01-10) |
| **Connected VKN 1** | 1234567890 (Demir Lojistik Ltd. Şti.) |
| **Connected VKN 2** | 98765432101 (Ahmet Demir \- TCKN-based Entity) |
| **Shared Metadata** | Both entities share the same contact phone number 0212XXXXXXX. |
| **Historical Volume** | VKN 1: ₺2.4M (85 invoices); VKN 2: ₺120k (3 invoices). |
| **Consistency Status** | Inconsistent: Shared settlement endpoint between distinct legal structures. |
| **Explainability** | "The IBAN TR56...0001 has been observed receiving payments for both a Limited company and an individual TCKN-based entity. This suggests a consolidated financial control point that is inconsistent with the independent identity of the sellers." |

### **4.2 Example 2: Circular Invoicing Loop (G004)**

This example shows a three-entity reciprocal trade loop identified within a single tax period.

| Field Name | Evidence Value |
| :---- | :---- |
| **Signal ID** | G004 |
| **Signal Name** | Yönlü Döngüsel Faturalama |
| **Cycle Path** | (VKN\_A) \-\> (VKN\_B) \-\> (VKN\_C) \-\> (VKN\_A) |
| **Hop 1 (A-\>B)** | UUID: a1-b2..., Date: 2024-05-01, Amount: ₺100,000 |
| **Hop 2 (B-\>C)** | UUID: c3-d4..., Date: 2024-05-05, Amount: ₺105,000 |
| **Hop 3 (C-\>A)** | UUID: e5-f6..., Date: 2024-05-10, Amount: ₺98,000 |
| **Net Variance** | 7.1% (Calculated as ![][image3] across the cycle). |
| **Consistency Status** | Inconsistent: Reciprocal financial flow with no external net settlement. |
| **Explainability** | "A directed cycle was identified involving three entities. The invoices were issued in a chronological sequence (1st, 5th, and 10th of the month) with a cumulative net transfer of only ₺7,000 despite a gross volume of ₺303,000. This is inconsistent with standard linear supply chain activity." |

### **4.3 Example 3: Novelty Discrepancy (G002)**

This example flags a high-value invoice appearing in a brand-new trading relationship.

| Field Name | Evidence Value |
| :---- | :---- |
| **Signal ID** | G002 |
| **Signal Name** | Yeni Bağlantı Yüksek Tutar |
| **Edge Detail** | (Seller: VKN\_X) \--\> (Buyer: VKN\_Y) |
| **Invoice Detail** | ID: ABC2024000000001, Amount: ₺2,500,000 |
| **Buyer Context** | Historical Median: ₺15,000; Max Historical: ₺80,000. |
| **Relative Volatility** | 166.6x (Amount relative to Buyer's median). |
| **Relationship Age** | 0 days (First interaction recorded in system). |
| **Explainability** | "The invoice represents the initiation of a new commercial relationship. The payable\_amount is 166 times higher than the buyer's established transaction median, indicating a significant volumetric discrepancy for an initial engagement." |

## **Conclusion: Synthesis of Relationship Dynamics**

The transition to graph-based relationship signals represents a maturing of the e-Fatura verification ecosystem. While Hard Checks ensure the technical validity of the UBL-TR 1.2 XML, relationship signals provide the commercial context necessary for high-fidelity trade finance decisions.1 The use of recursive path analysis and hub-and-spoke detection allows for the identification of structural inconsistencies that row-based database queries cannot feasibly compute. By persisting these signals within a PostgreSQL adjacency schema, the system maintains high storage efficiency while enabling the generation of detailed, explainable evidence packs.7 Future iterations of this framework may incorporate Graph Neural Networks (GNNs) to learn latent embeddings of VKN nodes, but the current MVP provides a robust, rule-based foundation grounded in the empirical commercial truth of the Turkish trade network.4

#### **Alıntılanan çalışmalar**

1. UBL-TR Invoice Canonical Schema Report.md  
2. E-Invoicing in Turkey: Rules, Compliance & GİB Requirements \- Flick Network, erişim tarihi Şubat 19, 2026, [https://www.flick.network/en-tr/e-invoicing-in-turkey](https://www.flick.network/en-tr/e-invoicing-in-turkey)  
3. Pattern Detection with Graphs \- TigerGraph, erişim tarihi Şubat 19, 2026, [https://www.tigergraph.com/glossary/pattern-detection-with-graphs/](https://www.tigergraph.com/glossary/pattern-detection-with-graphs/)  
4. Uncovering Hidden Tax Fraud with Graph Neural Networks | by Lathika Sakthivel \- Medium, erişim tarihi Şubat 19, 2026, [https://medium.com/@lathikasakthivel126/uncovering-hidden-tax-fraud-with-graph-neural-networks-7303425147ea](https://medium.com/@lathikasakthivel126/uncovering-hidden-tax-fraud-with-graph-neural-networks-7303425147ea)  
5. Automated Invoice Data Extraction: Using LLM and OCR \- arXiv, erişim tarihi Şubat 19, 2026, [https://arxiv.org/pdf/2511.05547](https://arxiv.org/pdf/2511.05547)  
6. Leveraging Graph Networks in FinCrime Investigations \- Lucinity, erişim tarihi Şubat 19, 2026, [https://lucinity.com/blog/leveraging-graph-networks-in-fincrime-investigations](https://lucinity.com/blog/leveraging-graph-networks-in-fincrime-investigations)  
7. Implementing Hierarchical Data Structures in PostgreSQL: LTREE vs Adjacency List vs Closure Table \- DEV Community, erişim tarihi Şubat 19, 2026, [https://dev.to/dowerdev/implementing-hierarchical-data-structures-in-postgresql-ltree-vs-adjacency-list-vs-closure-table-2jpb](https://dev.to/dowerdev/implementing-hierarchical-data-structures-in-postgresql-ltree-vs-adjacency-list-vs-closure-table-2jpb)  
8. Representing graphs in PostgreSQL with SQL/PGQ | EDB, erişim tarihi Şubat 19, 2026, [https://www.enterprisedb.com/blog/representing-graphs-postgresql-sqlpgq](https://www.enterprisedb.com/blog/representing-graphs-postgresql-sqlpgq)  
9. UBL Formatı Nedir? XML Fatura Nedir ve Nasıl Görüntülenir? \- Figopara, erişim tarihi Şubat 19, 2026, [https://figopara.com/blog/ubl-formati-ve-xml-fatura-nedir-nasil-acilir](https://figopara.com/blog/ubl-formati-ve-xml-fatura-nedir-nasil-acilir)  
10. What are the key features of modern trade finance? \- TaperPay, erişim tarihi Şubat 19, 2026, [https://taperpay.com/en/what-are-the-key-features-of-modern-trade-finance/](https://taperpay.com/en/what-are-the-key-features-of-modern-trade-finance/)  
11. UBL Formatı Nedir? UBL Formatı Nasıl Kullanılır? \- Bizigo, erişim tarihi Şubat 19, 2026, [https://bizigo.com/tr-tr/sozluk/ubl-formati-nedir-ubl-formati-nasil-kullanilir](https://bizigo.com/tr-tr/sozluk/ubl-formati-nedir-ubl-formati-nasil-kullanilir)  
12. How Graph-Based Rules Outsmart Modern Fraud \- Blog \- Unit21, erişim tarihi Şubat 19, 2026, [https://www.unit21.ai/blog/the-network-strikes-back-how-graph-based-rules-outsmart-modern-fraud](https://www.unit21.ai/blog/the-network-strikes-back-how-graph-based-rules-outsmart-modern-fraud)  
13. One Dataset, Many Products: How Trade Signals Unlock Fintech for Global SMBs, erişim tarihi Şubat 19, 2026, [https://www.europeanfinancialreview.com/one-dataset-many-products-how-trade-signals-unlock-fintech-for-global-smbs/](https://www.europeanfinancialreview.com/one-dataset-many-products-how-trade-signals-unlock-fintech-for-global-smbs/)  
14. Synthetic Pattern Generation and Detection of Financial Activities using Graph Autoencoders \- arXiv, erişim tarihi Şubat 19, 2026, [https://arxiv.org/html/2601.21446v1](https://arxiv.org/html/2601.21446v1)  
15. Fighting Financial Fraud with Graph Technology \- Graph Database & Analytics \- Neo4j, erişim tarihi Şubat 19, 2026, [https://neo4j.com/blog/fraud-detection/fighting-financial-fraud-with-graph-technology/](https://neo4j.com/blog/fraud-detection/fighting-financial-fraud-with-graph-technology/)  
16. Drive P2P performance: 6 procure-to-pay KPIs you need to know \- Stampli, erişim tarihi Şubat 19, 2026, [https://www.stampli.com/blog/accounts-payable/procure-to-pay-kpis/](https://www.stampli.com/blog/accounts-payable/procure-to-pay-kpis/)  
17. A Graph Theoretical Approach for Identifying Fraudulent Transactions in Circular Trading \- UPV, erişim tarihi Şubat 19, 2026, [https://personales.upv.es/thinkmind/dl/conferences/dataanalytics/data\_analytics\_2017/data\_analytics\_2017\_2\_30\_60050.pdf](https://personales.upv.es/thinkmind/dl/conferences/dataanalytics/data_analytics_2017/data_analytics_2017_2_30_60050.pdf)  
18. Detecting Patterns of Interaction in Temporal Hypergraphs via Edge Clustering \- arXiv, erişim tarihi Şubat 19, 2026, [https://arxiv.org/html/2506.03105v1](https://arxiv.org/html/2506.03105v1)  
19. Graph analytics—Powering the Game Against Money Laundering | Oracle Europe, erişim tarihi Şubat 19, 2026, [https://www.oracle.com/europe/financial-services/aml-financial-crime-compliance/graph-analytics-powers-the-game/](https://www.oracle.com/europe/financial-services/aml-financial-crime-compliance/graph-analytics-powers-the-game/)  
20. Store Trees As Materialized Paths \- Database Tip \- SQL for Devs, erişim tarihi Şubat 19, 2026, [https://sqlfordevs.com/tree-as-materialized-path](https://sqlfordevs.com/tree-as-materialized-path)  
21. GraphXAIN: Narratives to Explain Graph Neural Networks \- arXiv, erişim tarihi Şubat 19, 2026, [https://arxiv.org/html/2411.02540v3](https://arxiv.org/html/2411.02540v3)  
22. USING KEY in Recursive CTEs \- DuckDB, erişim tarihi Şubat 19, 2026, [https://duckdb.org/2025/05/23/using-key](https://duckdb.org/2025/05/23/using-key)  
23. Learn to Use a Recursive CTE in SQL Query \- StrataScratch, erişim tarihi Şubat 19, 2026, [https://www.stratascratch.com/blog/learn-to-use-a-recursive-cte-in-sql-query](https://www.stratascratch.com/blog/learn-to-use-a-recursive-cte-in-sql-query)  
24. Using a recursive CTE to traverse a general undirected cyclic graph | YugabyteDB Docs, erişim tarihi Şubat 19, 2026, [https://docs.yugabyte.com/stable/api/ysql/the-sql-language/with-clause/traversing-general-graphs/undirected-cyclic-graph/](https://docs.yugabyte.com/stable/api/ysql/the-sql-language/with-clause/traversing-general-graphs/undirected-cyclic-graph/)  
25. Driving Business Insights with Recursive CTEs in DBSQL | by Databricks SQL SME, erişim tarihi Şubat 19, 2026, [https://medium.com/dbsql-sme-engineering/driving-business-insights-with-recursive-ctes-in-dbsql-00ad222fa0be](https://medium.com/dbsql-sme-engineering/driving-business-insights-with-recursive-ctes-in-dbsql-00ad222fa0be)  
26. Documentation: 18: 39.3. Materialized Views \- PostgreSQL, erişim tarihi Şubat 19, 2026, [https://www.postgresql.org/docs/current/rules-materializedviews.html](https://www.postgresql.org/docs/current/rules-materializedviews.html)  
27. View vs Materialized View in databases: Differences and Use cases \- DbVisualizer, erişim tarihi Şubat 19, 2026, [https://www.dbvis.com/thetable/view-vs-materialized-view-in-databases-differences-and-use-cases/](https://www.dbvis.com/thetable/view-vs-materialized-view-in-databases-differences-and-use-cases/)  
28. Creating a Fast Time-Series Graph With Postgres Materialized Views \- Tiger Data, erişim tarihi Şubat 19, 2026, [https://www.tigerdata.com/blog/creating-a-fast-time-series-graph-with-postgres-materialized-views](https://www.tigerdata.com/blog/creating-a-fast-time-series-graph-with-postgres-materialized-views)  
29. Explainable AI with Graph Databases \- TigerGraph, erişim tarihi Şubat 19, 2026, [https://www.tigergraph.com/glossary/explainable-ai-with-graph-databases/](https://www.tigergraph.com/glossary/explainable-ai-with-graph-databases/)  
30. (PDF) Graph Neural Networks for Multi-Layered Financial Crime Network Detection: An Explainable AI Framework for Anti-Money Laundering \- ResearchGate, erişim tarihi Şubat 19, 2026, [https://www.researchgate.net/publication/400137739\_Graph\_Neural\_Networks\_for\_Multi-Layered\_Financial\_Crime\_Network\_Detection\_An\_Explainable\_AI\_Framework\_for\_Anti-Money\_Laundering](https://www.researchgate.net/publication/400137739_Graph_Neural_Networks_for_Multi-Layered_Financial_Crime_Network_Detection_An_Explainable_AI_Framework_for_Anti-Money_Laundering)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKEAAAAYCAYAAACSlJ0LAAADyUlEQVR4Xu2aW6hNQRjHP/c7uZWQSyElSZKiyAOSB4oHL3QOQh54k1zqCClPJEnCcX1QyAsib0IiSolIJEKuSeT+/c1azqz/WZez9tpn77W2+dXXWfP/ZvbMN2vWrFkzR8ThcDgcxWUUC45cMpqFWuE3C47cclNtLItx7FT7KOYmw76ovSPt5L/c1eGVWn8WHbkG46Ybi0n4A44ZKka/yI4KsVjtNYuO3DNT7TOLSWCgXWPRI2qAVgLUO4BFRyHAvRvEYhQLxRSYxQ6li1RvEA6U6tTrKA9YG15hMYp7En2zz4jxzWNHBTii9o1Fiw1qi0g7ROmsjFTbp9bW0saprbPStUK5Y/UntxYRNdNNF6PvYkeF+Kl2nEWP795ftG+qd73USzd46axsVVuptk2C/RPVX0WmtWJtcVm/og9q79W+eum7an2tfHEcjbHDao1qB9UOqO1X6/S3VDxowxYWxfxGd+8aeaZZPgzcBiudBewQgCcS7MwZlK4FWivWFpX1p8wl7MgBaFc9i8om7y+2lzjIvRJcDGObAA9XWtqoDfeuUQe/Dex6T3npR2rtLL0opIk1LSjbmUXmgWSrpDVBu+pYtID/BWnYU/TZozZJssWHjzWUt9dJuN7uXV+2dDzIWeqqNkmxlgJ+rweLDDKVo+N2pLSeplgsaNdmFi3gn0vaHUrjKc8S30NpXt6eKeC7TunETs8pSbGWAv9eKMiE10geQduwpgxjiDQPcLWYbR2buEEI30YWCZTFOtkGa+YwMGuE1TVbbQyLxHoWiDq1XixadBQTfxTliBVHcRfUlqudELPGf275wwjrjwDY4kCmFezICQg06oYDtB1bCAD7mWEPU9wgfCvGt5YdFjckWP6SWlcrbfNYzBaHjV9/VBsAbjz8q9jhgcGX9Bu+fyI7PMoR6zMx/5xg54lr03yJ8e9W+yQmeJwT43jlVyBHPhgmMUEoc6Sp8/GEhhE3CDGAcXOesoO4L031jCCfD44X8aEUxlkxX51RYIbBAI4Dx6bYgooCs+1tFi3KFesxCc7aUX0Lrkr0KVyhQJC9WUxB3CD0Oc9CSnCDsccG8FoM237CLJMHssaKvkSMYIKYgR0F8nZgsYisEfMaKJWkQVivNpjFFPRROy1mzbZM7VzA20RcGypF1liBHQc+AvFh2GhpPlMk/rSrcPyQ0r440QlYbrwRs/QI2/h+yUJK/FeXbQxepf1YrAJZY8V+3y0rvUDMgUbYPxvj0KA9i0Un7OYWBZzJ/k9g73Q8i7UAXqv/280sKpNZcDgcDgfzB6jhBM3PX9IYAAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD0AAAAYCAYAAABJA/VsAAABkUlEQVR4Xu2WTStEURjHH5K35ANQSg3ZSLJnJQsLG1srNVlZi4giZcVCkjAin0H5BiZSNoqFEqW8ZKGUxP9xzuW5zzUz5yYzl86vft3nZc7tPPd0b0Pk8Xg8Ho/nLzABh1RtU+VJoAWuwnJR64BjInfixV7fYLeNh20+bfMkMAtH4ByZvQVwLPOCrMM6G/PCHtF7pZ8NvZ3HLZiBG2T2sAarPlbl5tFeLyg8ZK/KCzJpr4sUXbgCG0XeCQ9EXkzKYLONeZ9LohfUYsOLrlXtRsRTcJlKN3RAH5m9ynea43mRO8M3GlC1Y5XPULyhF2Jab5bl5Yyip6pP3Ykmit5oFDaoWtyhfwPe54OqPYu4He7BNNwl8824Ev0QfDP+9DM18Fz0AnjorC4WGX7o8oD2Ya3IL2EbhX+jD/STfjJNlp/Ud/DQh7pYAk7pa68p1WN24LjIcw7tAg99pIsJhIestHEXvBO92PDQ+uOWROTJ8n75A50RNWee4D28JfMnoSLcTgzVFH4FB+EJbBU1j8fzj3gHup9cwVaIzKkAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADoAAAAVCAYAAAAXQf3LAAACJElEQVR4Xu2Xz0tVURDHJzPRBMPAcGEpZGlYq6BF+A/YJigkF+kycBO4SQo3htv2KlISagQJ4iIKxY3QQqhNGhoSRUhEWFJKavnj+31nznvzTg/f0xbJ7X7hw505M/fHO++ce2dEoqmlcCCKOgCuhoP/tR6CT6AULIDnoB+cAs/AKjjik8XN4DfwGFwGTSY2C8bBFfAOfDCxXMV7vgaXwBOwqeOvwDCYVJ96ChZBvvrnxJ1/I5lhdFPcBe1DbYEzat8G3UHM6ze4qPaIGfc5NjcXDeqR55WpfR98V9vHqGPgJHgpbsKpj6DW5PwhBg6pXaS+F//lerU7wLyJZbpgjaQ/mNfPLHidBivGXwNVxg/vGfoD4E4wlpRN7hS3nL1sjHZz4Ifi6rgVDu5CQ+Im1Mve4x7oMX4DmDM+xfyCYCyharBsfO7JSrXrwA9QLG5Wx8AJjXE5vwDX1OcNuJx45KqgMv2z2bTT6qLN/fhZfT7rcTCRzMg8+Ql1gUbj+83v9VXccqAOgg1xL6PD4Bfo1dh7MANKxH3X+DLai9aN3SLpq+MBeCupiWgDU6BC/UJxezZWrCiImzbKxIoVK1Z0xUKfFRWrIlYubPvOgnbQJ66VsmJnxG7pDWiVVJuVB6bFlXgs7UYlvYn4p2LfytKQr3RfrrEetq94diDlah8VV0Z62bwverwgrv4+L/vwU2Ef6K645t3LxtgkXDd+ph/ySP6uA5JtYgm44v7QYEcAAAAASUVORK5CYII=>