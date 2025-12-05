# Course Integrity Monitor

Microservices demo that ingests course metadata, students, and quiz submissions, scores each answer with a PyTorch- and Ollama-powered detector, and surfaces analytics about probable AI usage.

## Services

| Service | Tech | Responsibilities |
| --- | --- | --- |
| `main-service` | FastAPI + SQLModel | CRUD for courses, topics, students, submissions, analytics, caching |
| `ai-pipeline` | FastAPI + PyTorch + Ollama + MLflow | Feature extraction, heuristic + learned detection, telemetry logging |
| `frontend` | React + TypeScript + Vite | Import flows, dashboards, and risk visualizations |
| Infra | Docker Compose, PostgreSQL, Redis, Ollama, MLflow | Persistence, caching, model inference, experiment tracking |

## First-time setup (required)

Follow every step the first time you clone the repo to avoid missing dependencies.

1. **Install prerequisites**
   - Python 3.11 (with `pip` and `venv`)
   - Node.js 20+ / npm 10+
   - Docker Desktop with the Compose plugin
   - Git
2. **Clone and enter the repository**
   ```bash
   git clone <repo-url>
   cd AY25-26\ T2\ CS480\ Team\ One\ AI\ in\ Computing\ Education  # adjust for your shell
   ```
3. **Create a shared virtual environment and install Python deps**
   ```bash
   python -m venv .venv
   # Windows PowerShell
   .\.venv\Scripts\Activate.ps1
   # macOS/Linux
   source .venv/bin/activate
   python -m pip install --upgrade pip
   pip install -r main-service/requirements.txt -r ai-pipeline/requirements.txt
   ```
4. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```
5. **Create env files**
   - Copy `frontend/.env.example` to `frontend/.env`; leave `VITE_API_URL=http://localhost:8000` unless you remap the backend.
   - (Optional) add `main-service/.env` and `ai-pipeline/.env` to override defaults such as `DATABASE_URL`, `AI_PIPELINE_URL`, `REDIS_URL`, `OLLAMA_HOST`, `OLLAMA_MODEL`, or `CORS_ALLOW_ORIGINS`.
6. **Prime Docker assets**
   ```bash
   docker compose pull
   docker compose run --rm ollama ollama pull llama3
   ```
   The first command downloads base images. The second pre-downloads the default Ollama model so the AI pipeline is ready as soon as it starts.
7. **Bring the stack up once**
   ```bash
   docker compose up --build
   ```
   On the first run Docker builds the app images, installs PyTorch wheels, runs SQLModel migrations, and finalizes the Ollama model cache. Keep the stack running or stop it with `Ctrl+C` after everything reports healthy.
8. **Smoke-test**
   - Visit `http://localhost:5173` for the UI.
   - Check `http://localhost:8000/docs` (main service) and `http://localhost:8001/docs` (AI pipeline).
   - Optionally run `pytest main-service/tests` inside the virtualenv to confirm API flows pass.

Ports exposed during local runs:

- Frontend dashboard: http://localhost:5173
- FastAPI backend: http://localhost:8000 (Swagger at `/docs`)
- AI pipeline: http://localhost:8001 (Swagger at `/docs`)
- PostgreSQL: `localhost:5432` (`app/app`)
- Redis: `localhost:6379`
- MLflow UI: http://localhost:5000
- Ollama: http://localhost:11434 (models download on first inference if you skipped the pre-pull)

## Running the stack

### Docker Compose (recommended)

```bash
docker compose up --build
```

Set `FRONTEND_API_URL=http://<backend-host>:8000` before `docker compose up` if you want the built frontend to call a non-default backend.

### Local development with hot reload

1. Start infrastructure once (Postgres, Redis, MLflow, Ollama) with `docker compose up postgres redis mlflow ollama`.
2. In an activated virtualenv:
   - **Main service**  
     ```bash
     cd main-service
     uvicorn app.main:app --reload --port 8000
     ```  
     Set `DATABASE_URL`, `REDIS_URL`, `AI_PIPELINE_URL=http://localhost:8001`, and `CORS_ALLOW_ORIGINS=http://localhost:5173` inside `main-service/.env` when running outside Compose.
   - **AI pipeline**  
     ```bash
     cd ai-pipeline
     uvicorn app:app --reload --port 8001
     ```  
     Ensure an Ollama daemon is reachable at `OLLAMA_HOST` (the Compose `ollama` service publishes on `http://localhost:11434`).
3. **Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   The dev server proxies API calls to `VITE_API_URL`.

## Environment variables

Key settings (all optional thanks to sensible defaults):

| Location | Variable | Purpose |
| --- | --- | --- |
| main-service | `DATABASE_URL` | SQLAlchemy connection string (`postgresql+psycopg://app:app@postgres:5432/courses` in Compose, SQLite otherwise) |
| main-service | `REDIS_URL` | Redis URI for caching analytics (set to `redis://localhost:6379/0` when running Redis locally) |
| main-service | `AI_PIPELINE_URL` | Base URL for `/api/detect` and analytics enrichment |
| main-service | `CORS_ALLOW_ORIGINS` | Comma-separated list of allowed origins for the React app |
| ai-pipeline | `OLLAMA_HOST` / `OLLAMA_MODEL` | Upstream Ollama endpoint and model name (defaults to `llama3`) |
| ai-pipeline | `MLFLOW_TRACKING_URI`, `ENABLE_MLFLOW` | Toggle and configure MLflow logging (`file:./mlruns` when developing locally) |
| frontend | `VITE_API_URL` | Main-service base URL used by the Vite dev server and build step |
| docker-compose | `FRONTEND_API_URL` | Build arg that injects the backend base URL into the production frontend image |

## Data import expectations

- Courses and topics accept JSON or CSV arrays shaped like the UI samples, or XLSX/CSV uploads via drag-and-drop cards.
- Student imports support CSV (`name,email`) or JSON. Emails are normalized during upsert.
- Quiz submissions accept JSON entries or PDF/CSV uploads. PDF uploads are automatically OCR'd with `pdfplumber` before running detection.

Analytics endpoints aggregate flagged activity per course/topic, power the My Courses catalog tiles, and correlate AI usage with final scores to highlight at-risk cohorts and individuals. The React UI mirrors that flow: instructors authenticate, browse course cards, drag-and-drop registrar data, and see updated risk dashboards seconds later.

## API contracts

Canonical OpenAPI contracts live in `documentation/api-contracts`:

- `main-service.yaml` - CRUD + analytics backend
- `ai-pipeline.yaml` - inference and training microservice

Each FastAPI app exposes these contracts inside Swagger UI via the "Static Contract" dropdown, so you can compare the committed spec with the live schema.
