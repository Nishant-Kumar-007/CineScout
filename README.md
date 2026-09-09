# 🎬 CineScout: Production Intelligence for Indian Cinema

> **From Screenplay to Shoot-Ready Intelligence.**

CineScout transforms screenplay scenes into shoot-ready production intelligence with zero simulated or fake data. Powered by **Google Gemini** and **Parallel Live Web Search**, the agent decomposes scenes, searches the real world, evaluates production constraints, and recommends actionable shooting strategies tailored to Indian cinema standards (Bollywood, Sandalwood, Tollywood, Kollywood, Mollywood, & Pan-India).

---

## 🌟 The Core Loop

```
                         USER
                           │
                    (Screenplay Scene)
                           │
                           ▼
                     Google Gemini
             (Deconstructs Requirements)
                           │
                           ▼
                  Parallel Live Search
              (Real-World Live Web Data)
                           │
                           ▼
                    Gemini Reasoning
             (Evaluates Tradeoffs & Risks)
                           │
                           ▼
             Production Intelligence Report
                           │
                           ▼
                     Filmmaker Pivot
             ("What if we shoot in Hyderabad?")
                           │
                           ▼
                  Parallel Re-Search Loop
```

---

## 🚀 Key Features

1. **Scene Input Console**: Screenplay editor with preloaded Indian cinema benchmarks (Bengaluru Mill Chase, Mumbai Sassoon Docks, Hyderabad Fort Heist).
2. **Live Agent Execution Trace**: Real-time streaming status badges (`✓ Scene analyzed`, `⌕ Parallel Search: [Query]`, `✓ 6 live sources found`, `✓ Locations compared`).
3. **Genuine Real-World Grounding**: 100% backed by Parallel Live Web Search with verifiable links and citations (Deccan Herald, City Police portals, Ministry of I&B).
4. **Location Candidates Matrix**: Side-by-side comparison across Visual Fit (%), Logistical Feasibility, Safety Risk, and Day Rates in **₹ (INR)**.
5. **Top Recommendation Card**: The "Why" behind the decision—highlights risks bypassed and why alternative scouted locations placed second.
6. **Indian Regulatory Compliance**: FFO / NFDC single-window clearance, City Police Commissioner NOCs, Traffic Police permissions, and Fire clearance steps.
7. **Equipment & Stunt Protocols**: Camera/lighting packages (Arri Alexa LF / Sony FX9 / Astera), real Indian rental houses (Anand Cine Services, Prime Focus), and Stunt Master Association protocols.
8. **Interactive Follow-up Loop**: Ask any logistical what-if; the agent triggers a secondary Parallel search and compares the delta in costs, permits, and risks.

---

## 🛠️ Tech Stack

* **AI Reasoning**: Google Gemini (`gemini-3.1-flash-lite` / `gemini-3.5-flash-lite` / `gemini-3.6-flash`) via `google-genai`
* **Real-World Web Search**: Parallel Live Web Search API (`https://api.parallel.ai/v1beta/search`)
* **Backend**: FastAPI + Uvicorn (Python 3.14)
* **Frontend**: Vanilla HTML5, CSS3 (Command Center Dark Theme), JavaScript ES6

---

## 🏁 Quickstart

### 1. Configure Environment
Add your API keys to `.env`:
```ini
GEMINI_API_KEY=your_gemini_api_key
PARALLEL_API_KEY=your_parallel_api_key
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Launch CineScout
```bash
python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Open in Browser
Visit **`http://127.0.0.1:8000/`** to begin scouting.

---

## ☁️ Deploy to Google Cloud Run (Public Web Access)

CineScout is fully containerized and production-ready for **Google Cloud Run**. Anyone with the generated Cloud Run URL can access and run production scouts.

### Fast Track: Deploy via Google Cloud Console (Continuous Deployment from GitHub)

1. Open [Google Cloud Run Console](https://console.cloud.google.com/run).
2. Click **Create Service**.
3. Choose **"Continuously deploy from a repository"** and click **Set up with Cloud Build**.
4. Select repository: **`Nishant-Kumar-007/CineScout`** (Branch: `^main$`).
5. Set Build Type to **Dockerfile** (source location: `/Dockerfile`).
6. Under **Authentication**, choose **"Allow unauthenticated invocations"** for public access.
7. Under **Container, Volumes, Networking, Security** &rarr; **Variables & Secrets**, add:
   * `GEMINI_API_KEY`: Your Google Gemini API Key
   * `PARALLEL_API_KEY`: Your Parallel Live Search API Key
8. Click **Create**.

Google Cloud Build will package the container, configure autoscaling, and provide your permanent public HTTPS URL (e.g., `https://cinescout-xxxxxx-uc.a.run.app`).

---

## ▲ Deploy to Vercel (1-Click Public Web Access)

CineScout is configured with native Vercel serverless Python support via `api/index.py` and `vercel.json`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FNishant-Kumar-007%2FCineScout&env=GEMINI_API_KEY,PARALLEL_API_KEY&project-name=cinescout&repo-name=cinescout)

### Fast Track: Deploy via Vercel Dashboard

1. Go to **[vercel.com/new](https://vercel.com/new)**.
2. Click **Import** next to your GitHub repository **`Nishant-Kumar-007/CineScout`**.
3. Under **Environment Variables**, add:
   * **`GEMINI_API_KEY`**: `your_gemini_api_key`
   * **`PARALLEL_API_KEY`**: `your_parallel_api_key`
4. Click **Deploy**.

Vercel will build and launch your live URL (e.g. `https://cinescout.vercel.app`) in under 45 seconds!
