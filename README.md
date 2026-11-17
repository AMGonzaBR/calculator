# Calculator Microservices

Each arithmetic operation runs as its own microservice. The browser UI calls a gateway (local) or Amazon API Gateway (AWS).

The original browser-only calculator is preserved in [`legacy/static-calculator/`](legacy/static-calculator/).

## Architecture

```text
Browser UI (frontend/)
        |
        v
 API Gateway / local gateway
        |
   +----+----+----+----+
   |    |    |    |    |
  add  sub  mul  div
```

Request body for every operation:

```json
{ "a": 10, "b": 2 }
```

Success response:

```json
{ "result": 12, "operation": "add", "a": 10, "b": 2 }
```

## Local run

Requires Node.js 18+.

```bash
npm start
```

This starts:

| Service   | URL                         |
|-----------|-----------------------------|
| Gateway   | http://localhost:3000       |
| Add       | http://localhost:3001       |
| Subtract  | http://localhost:3002       |
| Multiply  | http://localhost:3003       |
| Divide    | http://localhost:3004       |

Open [`frontend/index.html`](frontend/index.html) in your browser. Optional query param:

```text
frontend/index.html?api=http://localhost:3000
```

Example call:

```bash
curl -X POST http://localhost:3000/add -H "Content-Type: application/json" -d "{\"a\":2,\"b\":3}"
```

## AWS hosting for the operation microservices

**Recommended for this project**

| Piece | AWS service | Role |
|-------|-------------|------|
| Public HTTP entry | **Amazon API Gateway** (HTTP API) | Routes `/add`, `/subtract`, `/multiply`, `/divide` |
| Each operation | **AWS Lambda** (one function per op) | Stateless compute that scales to zero |
| UI (static files) | **Amazon S3** (+ CloudFront later) | Hosts `frontend/` |

Why this fit: tiny, independent, pay-per-use services. Matches “one microservice per operation”.

**Other AWS options**

- **ECS Fargate** / **App Runner** — always-on containers
- **Elastic Beanstalk** — simpler managed deploy, heavier than needed
- **EKS** — Kubernetes; overkill for four endpoints

### Deploy with SAM (when ready)

From the repo root (requires [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)):

```bash
sam build -t infra/template.yaml
sam deploy --guided -t infra/template.yaml
```

Then point the frontend at the API output URL:

```text
frontend/index.html?api=https://YOUR_API.execute-api.REGION.amazonaws.com/prod
```

## Branching

- `main` — original static calculator (protected)
- `feature/microservices-calculator` — this microservices version
