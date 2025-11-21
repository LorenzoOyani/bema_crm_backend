# Phase 1 — Proof of Concept Summary  
**Flow-to-Flow Communication + Node.js PoC + PostgreSQL JSONB Logging**

---

## Overview

Phase 1 validates the end-to-end communication loop between:

1. **Flow A** → receives external input  
2. **Flow B** → receives forwarded JSON from Flow A  
3. **Node.js PoC backend** (located in the `n8n-poc-end-to-end-test` directory)  
4. **PostgreSQL (`flow_logs` table with JSONB`)**

This phase proves that the system can reliably perform:

- Webhook ingestion  
- Workflow-to-workflow communication  
- Clean JSON forwarding  
- Node.js processing  
- JSONB persistence in PostgreSQL  
- Structured JSON API output  

This establishes the foundation required for advanced automation, logging, email triggers, and campaign logic in later phases.

---

## Components Validated

### 1. Flow A Webhook (Entry Point)

- Receives external requests from cURL/Postman.
- Extracts request body from `$json["body"]`.
- Forwards only the relevant data to Flow B.
- Works with both test (`/webhook-test/...`) and production (`/webhook/...`) URLs when active.

---

### 2. Flow A → Flow B Communication

Flow A sends a `POST` request to Flow B’s production webhook:

## http://localhost:5678/webhook/phase-1-flow-b


Confirmed that:

- Flow B receives clean JSON forwarded from Flow A.
- Switching between workflows in the n8n sidebar does **not** affect production webhooks.
- Flow A and Flow B can operate independently as separate workflows.

---

### 3. Flow B Webhook (Receiver)

- Accepts the JSON forwarded from Flow A.
- Wraps the data in a structured response:

```json

```
{
  "source": "Flow B",
  "receivedFromA": { ... }
}

4. Flow B → Node.js PoC Backend

Flow B forwards its processed payload:

POST http://app:3000/api/test/flow_logs


The Node.js backend (found in the Node.js PoC setup page inside the project directory):

Receives JSON via req.body

Inserts logs into the flow_logs table using JSONB

Returns a confirmation:

{
  "success": true,
  "id": <log_id>,
  "storedPayload": { ... }
}

5. PostgreSQL JSONB Logging

The table structure:

```
payload     JSONB NOT NULL,
note        TEXT,
created_at  TIMESTAMP DEFAULT NOW()
```

Confirmed records include fully structured JSON:

Example (Flow A → Flow B → Node):

````
{
  "source": "Flow B",
  "receivedFromA": {
    "source": "Flow A",
    "receivedFromB": {
      "data": { "hello": "world" },
      "testId": "flow_test_1"
    }
  }
}

````

Example (Curl → Flow B → Node):

```
{
  "source": "Flow B",
  "receivedFromA": {
    "from": "curl",
    "message": "phase 1 test"
  }
}
```

These confirm clean JSONB storage with no [object Object] errors.

What Phase 1 Proves

✔ The webhook pipeline works
✔ Flow-to-flow communication is stable and production-ready
✔ Node.js backend successfully receives and logs JSON
✔ PostgreSQL JSONB preserves nested data correctly
✔ The architecture defined in the Nodejs PoC is valid
✔ Ready for Phase 2 automation rules, subscriber models, templates, and campaign scheduling

```