# KMForge — End-to-End Connected Flow

The full lifecycle of an order, from costing to dispatch, showing how Sales,
Production, and Procurement/Inbound connect — including the two loops that make
it a *system* rather than separate screens:

- **Buy → store → make loop:** a component a job needs isn't in store → a PO is raised → goods
  are received (GRN) → inspected (Inward QC) → stocked → the job can now reserve it.
- **Rework loop:** a QA gate fails → it re-opens → the batch is re-inspected before it can close.

```mermaid
flowchart TD
  %% ===== SALES =====
  CS["Cost Sheet<br/>live BOM costing"]:::sell
  Q["Quotation<br/>S00001 · draft"]:::sell
  SENT["Sent to customer"]:::sell
  SO["Order confirmed<br/>S00001 · sale"]:::sell
  CS --> Q --> SENT --> SO

  %% ===== NET REQUIREMENTS =====
  SO --> NET{"Finished good<br/>in free stock?"}:::dec
  NET -->|"Enough on shelf"| DEL
  NET -->|"Short by N (or all)"| MO

  %% ===== MAKE =====
  MO["Manufacturing Order<br/>WH/MO/00001 · mixer x N"]:::make
  SUBMO["Sub-assembly MO<br/>WH/MO/00002 · motor"]:::make
  MO -->|"BOM needs a motor"| SUBMO
  MO --> CHK{"Components<br/>in store?"}:::dec
  SUBMO --> CHK
  CHK -->|"Yes"| REQ["Material Requisition<br/>reserve FIFO for this job"]:::make
  CHK -->|"No - shortfall"| PO
  REQ --> BUILD["Build on the line"]:::make
  BUILD --> QA{"QA Gates<br/>in-process + finished"}:::dec
  QA -->|"Fail - rework, gate re-opens"| QA
  QA -->|"Pass both"| FG["Finished goods<br/>into store"]:::make
  FG --> DEL["Delivery to customer<br/>WH/OUT/00001"]:::ship

  %% ===== BUY / INBOUND =====
  PO["Purchase Order / RFQ<br/>P00001 · vendor"]:::buy
  POC["PO confirmed"]:::buy
  GRN["Goods Receipt Note<br/>WH/IN/00001"]:::buy
  IQC{"Inward Quality<br/>Inspection"}:::dec
  STORE["Received to store<br/>FIFO stock"]:::buy
  HELD["Held · return to vendor"]:::stop
  PO --> POC --> GRN --> IQC
  IQC -->|"Reject"| HELD
  IQC -->|"Accept lot"| STORE
  STORE -->|"now available"| CHK

  classDef sell fill:#d7e2e8,stroke:#3f5d6b,color:#152730;
  classDef make fill:#f0dcc4,stroke:#b0642c,color:#3a1e0c;
  classDef buy fill:#e7dcc9,stroke:#8f6a3a,color:#33260f;
  classDef ship fill:#dcece1,stroke:#2e7a50,color:#173a25;
  classDef dec fill:#f6f2ea,stroke:#8a8072,color:#201c15;
  classDef stop fill:#f4e2dd,stroke:#b0402c,color:#3a140c;
```

## The three lanes

| Lane | Screens | Documents |
|------|---------|-----------|
| **Sales** | Cost Sheets · Orders & Quotes | `S#####` |
| **Production** | Production · Material Requisition · Quality Gates · Can I Build? | `WH/MO/#####`, `WH/OUT/#####` |
| **Procurement / Inbound** | Purchasing · Goods Receipt | `P#####`, `WH/IN/#####` |

## Reading order (the happy path)

1. Price the product on its **Cost Sheet**; that price flows into a **Quotation**.
2. Confirm the quote → **Sales Order**. The system checks stock (*net requirements*).
3. If short, a **Manufacturing Order** is raised — plus a nested **sub-assembly MO** for the motor.
4. The job needs components: those in store are **reserved (FIFO)**; those short trigger a **Purchase Order**.
5. The PO is confirmed → a **Goods Receipt (GRN)** appears → **Inward Quality Inspection** accepts or rejects the lot.
6. Accepted goods land in the **store (FIFO)** and become available to the waiting job.
7. The job builds, passes the mandatory **QA Gates**, and the finished goods move to stock.
8. Finished goods are **delivered** to the customer.
