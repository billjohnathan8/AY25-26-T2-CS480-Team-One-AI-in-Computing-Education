import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse

from .config import get_settings
from .database import init_db
from .routers import analytics, auth, courses, detection, imports, students, submissions

CONTRACT_FILE = Path(__file__).resolve().parents[2] / "documentation" / "api-contracts" / "main-service.yaml"


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        swagger_ui_parameters={
            "urls": [
                {"name": "Main Service (Live)", "url": "/openapi.json"},
                {"name": "Main Service Contract", "url": "/contracts/main-service.yaml"},
            ]
        },
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allow_origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def _startup() -> None:
        init_db()

    @app.get("/healthz")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/contracts/main-service.yaml", include_in_schema=False)
    def contract():
        if CONTRACT_FILE.exists():
            return FileResponse(CONTRACT_FILE)
        return PlainTextResponse(json.dumps(app.openapi()), media_type="application/json")

    app.include_router(auth.router)
    app.include_router(courses.router)
    app.include_router(students.router)
    app.include_router(detection.router)
    app.include_router(submissions.router)
    app.include_router(analytics.router)
    app.include_router(imports.router)

    return app


app = create_app()
