"""
CineScout - FastAPI Production Intelligence Server
Serves the CineScout Command Center and Agent Endpoints
"""
import os
import sys
import logging
from pathlib import Path
from dotenv import load_dotenv

# Ensure root is in path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

load_dotenv(ROOT_DIR / ".env")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from backend.agent import CineScoutAgent

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cinescout.server")

app = FastAPI(
    title="CineScout API",
    description="From Screenplay to Shoot-Ready Intelligence (Indian Cinema Standards)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Agent lazily
_agent: Optional[CineScoutAgent] = None

def get_agent() -> CineScoutAgent:
    global _agent
    if _agent is None:
        _agent = CineScoutAgent()
    return _agent


class SceneAnalyzeRequest(BaseModel):
    scene_text: str = Field(..., min_length=10, description="The screenplay scene text")


class FollowUpRequest(BaseModel):
    scene_text: str
    previous_intelligence: Dict[str, Any]
    question: str


@app.get("/api/health")
async def health():
    gemini_configured = bool(os.getenv("GEMINI_API_KEY"))
    parallel_configured = bool(os.getenv("PARALLEL_API_KEY"))
    from backend.agent import PRIMARY_GEMINI_MODEL
    return {
        "status": "ready" if (gemini_configured and parallel_configured) else "misconfigured",
        "gemini_ready": gemini_configured,
        "parallel_ready": parallel_configured,
        "region": "India Cinema Standards (Pan-India)",
        "model": PRIMARY_GEMINI_MODEL
    }


@app.get("/api/sample_scenes")
async def get_sample_scenes():
    """Curated Indian cinema screenplay scenes matching CineScout specification."""
    return [
        {
            "id": "bengaluru-textile-mill",
            "title": "Bengaluru — Industrial Chase",
            "hub": "Bengaluru, Karnataka (Sandalwood / Pan-India)",
            "genre": "Gritty Crime Thriller",
            "scene": "A detective chases a suspect through an abandoned textile mill in Bengaluru at midnight. The scene requires a large industrial interior, period-looking machinery, emergency lighting, a police vehicle, and permission for a night shoot."
        },
        {
            "id": "mumbai-docks-noir",
            "title": "Mumbai — Dockyard Smuggling",
            "hub": "Mumbai, Maharashtra (Bollywood)",
            "genre": "Neo-Noir Action",
            "scene": "EXT. SASSOON DOCKS, SOUTH MUMBAI - 02:30 AM. Heavy monsoon rain lashes against rusted trawlers. Under flickering sodium-vapor floodlights, an undercover customs officer corners an arms courier behind towering fish-freezer crates. Requires rain-machines, wet-down tankers, Mumbai Port Trust NOC, and specialized marine gear protection."
        },
        {
            "id": "hyderabad-heritage-fort",
            "title": "Hyderabad — Fortress Heist",
            "hub": "Hyderabad, Telangana (Tollywood / Pan-India)",
            "genre": "High-Octane Action Heist",
            "scene": "INT/EXT. DECCAN FORTRESS COURTYARD, HYDERABAD - DUSK. An elite thief swings down a centuries-old carved stone archway into a torchlit courtyard during a crowded traditional festival. Requires heritage preservation clearance (ASI/State Archaeology), fire-stunt safety NOC, crowd control for 200 extras, and heavy generator power outside the historic precinct."
        }
    ]



@app.post("/api/analyze")
async def analyze_scene(req: SceneAnalyzeRequest):
    """Executes the full CineScout agent pipeline."""
    try:
        agent = get_agent()
        result = agent.analyze_scene(req.scene_text)
        return result
    except Exception as e:
        logger.error(f"Scene analysis failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/followup")
async def ask_followup(req: FollowUpRequest):
    """Executes an interactive follow-up with dynamic Parallel re-search."""
    try:
        agent = get_agent()
        result = agent.follow_up(
            scene_text=req.scene_text,
            previous_intelligence=req.previous_intelligence,
            user_question=req.question
        )
        return result
    except Exception as e:
        logger.error(f"Follow-up reasoning failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# Serve static frontend files
FRONTEND_DIR = ROOT_DIR / "frontend"
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    async def serve_index():
        return FileResponse(str(FRONTEND_DIR / "index.html"))


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.server:app", host=host, port=port, reload=False)
