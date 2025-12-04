## Course Integrity Monitor

Microservices demo that ingests course metadata, students, and quiz submissions, scores each answer with a PyTorch + Ollama powered detector, and surfaces analytics about probable AI usage.

### Services

| Service | Tech | Responsibilities |
| --- | --- | --- |
| `main-service` | FastAPI + SQLModel | CRUD for courses, topics, students, submissions, analytics with Redis caching |
| `ai-pipeline` | FastAPI + PyTorch + Ollama + MLflow | Feature extraction, heuristic model inference, telemetry logging |
| `frontend` | React + TypeScript + Vite | CSV/JSON import UX, live analytics, risk dashboards |
| Infra | Docker Compose, PostgreSQL, Redis, Ollama, MLflow | Persistence, caching, model inference backing |

### Running locally

```bash
docker compose up --build
```

The stack exposes the following ports:

- Frontend dashboard: http://localhost:5173
- FastAPI backend: http://localhost:8000/docs
- AI pipeline: http://localhost:8001/docs
- PostgreSQL: `localhost:5432` (`app/app`)
- Redis: `localhost:6379`
- MLflow UI: http://localhost:5000
- Ollama: http://localhost:11434 (model downloads happen on first run)

### Developer workflow

1. Create and activate a Python 3.11 env.
2. Install backend dependencies: `pip install -r main-service/requirements.txt`.
3. Start the FastAPI app: `uvicorn app.main:app --reload`.
4. `cd frontend && npm install && npm run dev` for the React UI.
5. The AI pipeline runs via `uvicorn app:app --reload --port 8001` inside the `ai-pipeline` folder.

### Data import expectations

- Courses and topics accept JSON or CSV arrays with the fields shown in the UI samples, or drag-and-drop XLSX/CSV uploads via the new file import cards.
- Student imports support CSV (`name,email`) or JSON. Emails are normalized during upsert.
- Quiz submissions accept JSON entries or PDF/CSV uploads. PDF uploads will be OCR’d with `pdfplumber` before being pushed through the detection pipeline.

Analytics endpoints aggregate flagged activity per course/topic, surface the “My Courses” catalog tiles, and correlate AI usage with final scores to highlight at-risk cohorts and individuals. The React UI now mirrors the user flows in the provided diagrams: instructors authenticate, browse course cards, drag-and-drop registrar data, and see updated risk dashboards seconds later.

### First-time setup

1. **Install prerequisites**  
   - Python 3.11+ with `venv`  
   - Node.js 20+ / npm 10+  
   - Docker Desktop (with Compose)  
   - [Ollama](https://ollama.com/) runtime and at least one model (e.g., `ollama pull llama3`)
2. **Clone and bootstrap**  
   ```bash
   git clone <repo-url>
   cd CS480
   python -m venv .venv && .venv\Scripts\activate  # PowerShell, adjust for macOS/Linux
   pip install -r main-service/requirements.txt
   cd frontend && npm install && cd ..
   ```
3. **Environment variables**  
   - Copy `frontend/.env.example` to `frontend/.env` and adjust `VITE_API_URL` if you change backend addresses.
   - (Optional) create `main-service/.env` to override `DATABASE_URL`, `AI_PIPELINE_URL`, etc.
4. **Seed Docker dependencies**  
   ```bash
   docker compose pull
   ```
   This pre-fetches Postgres, Redis, MLflow, and Ollama images to avoid first-run delays.
5. **Bring up the stack** with `docker compose up --build`. The first run downloads Ollama models and PyTorch wheels, so expect a longer build.

### API contracts

Canonical OpenAPI contracts live in `documentation/api-contracts`:

- `main-service.yaml` — CRUD/analytics backend
- `ai-pipeline.yaml` — inference + training microservice

Each FastAPI app exposes these contracts inside SwaggerUI via the “Static Contract” dropdown option, so you can compare the committed spec with the live schema.
