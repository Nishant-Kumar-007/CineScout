"""
CineScout - Parallel Live Web Search Tool
Authenticates with PARALLEL_API_KEY to retrieve live, factual web intelligence 
for Indian film locations, permitting rules, municipal guidelines, and equipment rentals.
"""
import os
import logging
import httpx
from typing import List, Dict, Any, Optional

logger = logging.getLogger("cinescout.search")

PARALLEL_API_URL = "https://api.parallel.ai/v1beta/search"


def search_parallel(objective: str, search_queries: List[str], max_results: int = 10) -> Dict[str, Any]:
    """
    Executes a real-time live web search using Parallel AI API.
    
    Args:
        objective: The research goal (e.g., 'Scout abandoned industrial mills and night shooting rules in India')
        search_queries: Targeted query strings to execute against live web index
        max_results: Max results to return
        
    Returns:
        Dict containing raw results, status, query details, and formatted citations.
    """
    api_key = os.getenv("PARALLEL_API_KEY", "").strip()
    if not api_key:
        raise ValueError("PARALLEL_API_KEY is not set in environment or .env file.")

    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json"
    }

    payload = {
        "objective": objective,
        "search_queries": search_queries[:4]  # Parallel accepts focused query sets
    }

    try:
        with httpx.Client(timeout=25.0) as client:
            response = client.post(PARALLEL_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        raw_results = data.get("results", [])
        cleaned_results = []

        for item in raw_results[:max_results]:
            excerpts = item.get("excerpts", [])
            snippet = " ".join(excerpts) if isinstance(excerpts, list) else str(excerpts or "")
            cleaned_results.append({
                "title": item.get("title", "Untitled Source"),
                "url": item.get("url", ""),
                "publish_date": item.get("publish_date", ""),
                "snippet": snippet[:1000]  # token-optimized excerpt
            })

        return {
            "success": True,
            "objective": objective,
            "queries": search_queries,
            "total_found": len(cleaned_results),
            "results": cleaned_results
        }

    except httpx.HTTPStatusError as e:
        logger.error(f"Parallel API HTTP error {e.response.status_code}: {e.response.text}")
        return {
            "success": False,
            "error": f"Parallel API HTTP {e.response.status_code}: {e.response.text}",
            "objective": objective,
            "queries": search_queries,
            "results": []
        }
    except Exception as e:
        logger.error(f"Parallel Search failed: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "objective": objective,
            "queries": search_queries,
            "results": []
        }


def format_search_for_prompt(search_output: Dict[str, Any]) -> str:
    """Formats Parallel search results into a clean grounding context for Gemini reasoning."""
    if not search_output.get("success") or not search_output.get("results"):
        return f"No search results found for objective: {search_output.get('objective', '')}"

    lines = [f"### REAL-WORLD LIVE WEB FINDINGS (via Parallel Search)"]
    lines.append(f"Objective: {search_output.get('objective')}")
    lines.append(f"Queries executed: {', '.join(search_output.get('queries', []))}\n")

    for idx, r in enumerate(search_output.get("results", []), 1):
        lines.append(f"[{idx}] Title: {r['title']}")
        lines.append(f"    URL: {r['url']}")
        if r.get('publish_date'):
            lines.append(f"    Date: {r['publish_date']}")
        lines.append(f"    Verified Intelligence: {r['snippet']}\n")

    return "\n".join(lines)
