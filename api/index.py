import sys
import logging
from pathlib import Path

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from fastapi import Request, HTTPException
from backend.server import (
    app,
    health,
    get_sample_scenes,
    analyze_scene,
    ask_followup,
    SceneAnalyzeRequest,
    FollowUpRequest
)

logger = logging.getLogger("cinescout.vercel")

@app.api_route("/api", methods=["GET", "POST", "OPTIONS"])
async def handle_vercel_api(request: Request):
    """
    Universal Vercel Serverless Dispatcher:
    Handles routed requests forwarded via vercel.json rewrite (?route=...)
    as well as direct /api calls.
    """
    route = request.query_params.get("route", "").strip("/")
    
    # If no explicit route query param, check x-matched-path or request path
    if not route:
        matched = request.headers.get("x-matched-path", "")
        if "health" in matched:
            route = "health"
        elif "sample_scenes" in matched:
            route = "sample_scenes"
        elif "analyze" in matched:
            route = "analyze"
        elif "followup" in matched:
            route = "followup"

    if route == "health" or not route:
        return await health()
    elif route == "sample_scenes":
        return await get_sample_scenes()
    elif route == "analyze":
        if request.method != "POST":
            raise HTTPException(status_code=405, detail="Method Not Allowed")
        body = await request.json()
        req = SceneAnalyzeRequest(**body)
        return await analyze_scene(req)
    elif route == "followup":
        if request.method != "POST":
            raise HTTPException(status_code=405, detail="Method Not Allowed")
        body = await request.json()
        req = FollowUpRequest(**body)
        return await ask_followup(req)
    else:
        raise HTTPException(status_code=404, detail=f"Route not found: {route}")
