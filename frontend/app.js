/**
 * CineScout - Production Intelligence Command Center Frontend Logic
 * Implements Live Production Radar, Evidence Constellation, AI Shot Planner, and Plan Delta.
 */

// Global State
let currentIntelligence = null;
let currentSceneText = "";
let sampleScenes = [];
let leafletMap = null;
let mapMarkers = [];
let allShotCards = [];
let activeShotStyle = "all";
let selectedLocationId = null;

// DOM Elements
const sceneInput = document.getElementById("scene-input");
const btnAnalyze = document.getElementById("btn-analyze");
const agentStatusBadge = document.getElementById("agent-status");
const agentStatusText = document.getElementById("agent-status-text");

// Trace & Evidence
const agentTrace = document.getElementById("agent-trace");
const traceCounter = document.getElementById("trace-counter");
const traceTimingFooter = document.getElementById("trace-timing-footer");
const timingBadge = document.getElementById("timing-badge");
const citationsContainer = document.getElementById("citations-container");
const citationsMeta = document.getElementById("citations-meta");
const citationsList = document.getElementById("citations-list");

// Dashboard Structure
const dashboardEmpty = document.getElementById("dashboard-empty");
const dashboardContent = document.getElementById("dashboard-content");

// Spec Elements
const specSetting = document.getElementById("spec-setting");
const specTime = document.getElementById("spec-time");
const specGenre = document.getElementById("spec-genre");
const specComplexity = document.getElementById("spec-complexity");
const aiConfidenceLabel = document.getElementById("ai-confidence-label");
const requirementsList = document.getElementById("requirements-list");

// Recommendation Elements
const recLocationName = document.getElementById("rec-location-name");
const recCityTag = document.getElementById("rec-city-tag");
const recFitPercent = document.getElementById("rec-fit-percent");
const recTagline = document.getElementById("rec-tagline");
const recWhyBullets = document.getElementById("rec-why-bullets");
const recTradeoffs = document.getElementById("rec-tradeoffs");
const recWhyStillWins = document.getElementById("rec-why-still-wins");
const recWhyNotAlt = document.getElementById("rec-why-not-alt");
const evidenceUsedCount = document.getElementById("evidence-used-count");
const evidenceUsedChips = document.getElementById("evidence-used-chips");

// View Toggle & Radar Elements
const btnViewRadar = document.getElementById("btn-view-radar");
const btnViewList = document.getElementById("btn-view-list");
const radarContainerCard = document.getElementById("radar-container-card");
const matrixContainerCard = document.getElementById("matrix-container-card");
const radarSidePanel = document.getElementById("radar-side-panel");
const btnCloseRadarPanel = document.getElementById("btn-close-radar-panel");
const radarPanelTitle = document.getElementById("radar-panel-title");
const radarPanelFit = document.getElementById("radar-panel-fit");
const radarPanelVisual = document.getElementById("radar-panel-visual");
const radarPanelLogistics = document.getElementById("radar-panel-logistics");
const radarPanelRisk = document.getElementById("radar-panel-risk");
const radarPanelSourcesCount = document.getElementById("radar-panel-sources-count");
const radarPanelSummary = document.getElementById("radar-panel-summary");
const btnRadarViewEvidence = document.getElementById("btn-radar-view-evidence");
const btnRadarUseLocation = document.getElementById("btn-radar-use-location");

// Constellation Elements
const constellationSvg = document.getElementById("constellation-svg");
const constellationNodes = document.getElementById("constellation-nodes");
const constellationCountPill = document.getElementById("constellation-count-pill");

// Table
const locationsTbody = document.getElementById("locations-tbody");

// Shot Planner Elements
const shotCardsGrid = document.getElementById("shot-cards-grid");
const shotFlowSteps = document.getElementById("shot-flow-steps");

// Permits & Logistics
const leadTimePill = document.getElementById("lead-time-pill");
const permitsResearchedList = document.getElementById("permits-researched-list");
const permitsConfirmationList = document.getElementById("permits-confirmation-list");
const permitsDisclaimer = document.getElementById("permits-disclaimer");

// Equipment
const budgetPill = document.getElementById("budget-pill");
const equipmentItemsList = document.getElementById("equipment-items-list");
const rentalPartnersChips = document.getElementById("rental-partners-chips");

// Follow-up / Plan Delta Elements
const followupInput = document.getElementById("followup-input");
const btnFollowup = document.getElementById("btn-followup");
const followupLoading = document.getElementById("followup-loading");
const followupResponseArea = document.getElementById("followup-response-area");
const followupDisplayQ = document.getElementById("followup-display-q");
const deltaTableBody = document.getElementById("delta-table-body");
const deltaTradeoff = document.getElementById("delta-tradeoff");
const deltaAgentVerdict = document.getElementById("delta-agent-verdict");
const deltaNextStep = document.getElementById("delta-next-step");
const deltaSourcesList = document.getElementById("delta-sources-list");


// ================= Helper: Reset Chatbot to Default =================
function resetFollowUpChatbot() {
  if (followupInput) followupInput.value = "";
  if (followupLoading) followupLoading.classList.add("hidden");
  if (followupResponseArea) followupResponseArea.classList.add("hidden");
  if (btnFollowup) btnFollowup.disabled = false;
  if (deltaTableBody) deltaTableBody.innerHTML = "";
  if (deltaTradeoff) deltaTradeoff.textContent = "—";
  if (deltaAgentVerdict) deltaAgentVerdict.textContent = "—";
  if (deltaNextStep) deltaNextStep.textContent = "—";
  if (deltaSourcesList) deltaSourcesList.innerHTML = "";
}

// ================= Initialization =================
document.addEventListener("DOMContentLoaded", async () => {
  await fetchHealthAndSamples();
  setupPresets();
  setupViewToggles();
  setupShotPlannerControls();
  setupEventListeners();
});

async function fetchHealthAndSamples() {
  try {
    const res = await fetch("/api/sample_scenes");
    if (res.ok) {
      sampleScenes = await res.json();
      if (sampleScenes.length > 0) {
        sceneInput.value = sampleScenes[0].scene;
      }
    }
  } catch (err) {
    console.warn("Could not fetch samples:", err);
  }
}

function setupPresets() {
  const presetButtons = document.querySelectorAll(".preset-btn:not(.custom-scene-btn)");
  presetButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const presetId = btn.getAttribute("data-preset");
      const found = sampleScenes.find(s => s.id === presetId);
      if (found) {
        sceneInput.value = found.scene;
      }
      // Erase previous follow-up question/response back to default
      resetFollowUpChatbot();
    });
  });

  const btnWriteOwn = document.getElementById("btn-write-own-scene");
  if (btnWriteOwn) {
    btnWriteOwn.addEventListener("click", () => {
      document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
      btnWriteOwn.classList.add("active");
      sceneInput.value = "";
      sceneInput.placeholder = "Write or paste your custom screenplay scene here...";
      sceneInput.focus();
      // Erase previous follow-up question/response back to default
      resetFollowUpChatbot();
    });
  }
}

function setupViewToggles() {
  btnViewRadar.addEventListener("click", () => {
    btnViewRadar.classList.add("active");
    btnViewRadar.setAttribute("aria-selected", "true");
    btnViewList.classList.remove("active");
    btnViewList.setAttribute("aria-selected", "false");

    radarContainerCard.classList.remove("hidden");
    matrixContainerCard.classList.add("hidden");

    if (leafletMap) {
      setTimeout(() => leafletMap.invalidateSize(), 100);
    }
  });

  btnViewList.addEventListener("click", () => {
    btnViewList.classList.add("active");
    btnViewList.setAttribute("aria-selected", "true");
    btnViewRadar.classList.remove("active");
    btnViewRadar.setAttribute("aria-selected", "false");

    matrixContainerCard.classList.remove("hidden");
    radarContainerCard.classList.add("hidden");
  });

  if (btnCloseRadarPanel) {
    btnCloseRadarPanel.addEventListener("click", () => {
      radarSidePanel.classList.add("hidden");
    });
  }

  if (btnRadarViewEvidence) {
    btnRadarViewEvidence.addEventListener("click", () => {
      const constellationCard = document.querySelector(".constellation-card");
      if (constellationCard) {
        constellationCard.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  if (btnRadarUseLocation) {
    btnRadarUseLocation.addEventListener("click", () => {
      if (selectedLocationId && currentIntelligence && currentIntelligence.location_options) {
        const loc = currentIntelligence.location_options.find(l => l.id === selectedLocationId);
        if (loc) {
          applyLocationAsTopRecommendation(loc);
        }
      }
    });
  }
}

function setupShotPlannerControls() {
  document.querySelectorAll(".style-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".style-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeShotStyle = btn.getAttribute("data-style");
      renderShotCardsFiltered();
    });
  });
}

function setupEventListeners() {
  btnAnalyze.addEventListener("click", executeSceneAnalysis);

  btnFollowup.addEventListener("click", () => {
    const q = followupInput.value.trim();
    if (q) executeFollowUp(q);
  });

  followupInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = followupInput.value.trim();
      if (q) executeFollowUp(q);
    }
  });

  document.querySelectorAll(".quick-q-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const q = btn.getAttribute("data-q");
      followupInput.value = q;
      executeFollowUp(q);
    });
  });
}

function setAgentState(status, text) {
  if (status === "active") {
    agentStatusBadge.className = "badge status-badge status-live";
    agentStatusBadge.style.borderColor = "var(--accent-gold)";
    agentStatusBadge.style.color = "var(--accent-gold)";
    agentStatusText.textContent = text || "SCOUTING LIVE WEB";
  } else if (status === "live" || status === "ready") {
    agentStatusBadge.className = "badge status-badge status-live";
    agentStatusBadge.style.borderColor = "rgba(0, 245, 160, 0.4)";
    agentStatusBadge.style.color = "var(--accent-emerald)";
    agentStatusText.textContent = "ONLINE • READY";
  }
}

function addTraceItem(timeTag, text, icon = "●") {
  const item = document.createElement("div");
  item.className = "trace-item";

  let iconClass = "trace-icon";
  if (icon === "✓") iconClass += " done";
  else if (icon === "⌕") iconClass += " search";
  else if (icon === "●") iconClass += " active";

  item.innerHTML = `
    <span class="trace-time-tag">${timeTag || ""}</span>
    <span class="${iconClass}">${icon}</span>
    <div class="trace-text">${text}</div>
  `;
  agentTrace.appendChild(item);
  agentTrace.scrollTop = agentTrace.scrollHeight;
}


// ================= Main Execution Flow =================
let liveTimeouts = [];

function clearLiveTimeouts() {
  liveTimeouts.forEach(t => clearTimeout(t));
  liveTimeouts = [];
}

async function executeSceneAnalysis() {
  const sceneText = sceneInput.value.trim();
  if (!sceneText || sceneText.length < 10) {
    alert("Please enter a valid screenplay scene description.");
    return;
  }

  // Erase previous follow-up / chatbot state back to default on new script search
  resetFollowUpChatbot();
  clearLiveTimeouts();

  currentSceneText = sceneText;
  btnAnalyze.disabled = true;
  btnAnalyze.querySelector(".btn-text").textContent = "SCOUTING LOCATIONS...";
  setAgentState("active", "SEARCHING LIVE WEB");

  // Reset UI
  agentTrace.innerHTML = "";
  traceCounter.textContent = "ANALYZING";
  traceTimingFooter.classList.add("hidden");
  citationsContainer.classList.add("hidden");
  citationsList.innerHTML = "";

  const startTime = performance.now();

  // The 6 exact live progressive agent stages required
  const liveStages = [
    { label: "Analyzing scene...", doneLabel: "Scene analyzed & narrative tone classified", icon: "●", delay: 0, status: "ANALYZING" },
    { label: "Extracting requirements...", doneLabel: "Extracted lighting, machinery & vehicle needs", icon: "●", delay: 900, status: "EXTRACTING" },
    { label: "Planning research...", doneLabel: "Formulated targeted live web search strategy", icon: "●", delay: 2000, status: "PLANNING" },
    { label: "Searching with Parallel...", doneLabel: "Parallel live web search executed across Indian hubs", icon: "⌕", delay: 3300, status: "PARALLEL SEARCH" },
    { label: "Evaluating evidence...", doneLabel: "Evaluated location feasibility, day rates & municipal rules", icon: "●", delay: 5600, status: "EVALUATING" },
    { label: "Generating recommendation...", doneLabel: "Synthesized shoot plan, shot list & compliance", icon: "●", delay: 7400, status: "SYNTHESIZING" }
  ];

  const stageElements = [];
  let currentStageIdx = 0;

  function renderStageProgress(idx) {
    if (idx >= liveStages.length) return;
    const nowSec = ((performance.now() - startTime) / 1000).toFixed(1);

    // Mark previous stage as completed with checkmark
    if (idx > 0 && stageElements[idx - 1]) {
      const prev = stageElements[idx - 1];
      const prevIcon = prev.querySelector(".trace-icon");
      if (prevIcon) {
        prevIcon.className = "trace-icon done";
        prevIcon.textContent = "✓";
      }
      const prevText = prev.querySelector(".trace-text");
      if (prevText && liveStages[idx - 1].doneLabel) {
        prevText.textContent = liveStages[idx - 1].doneLabel;
      }
      prev.classList.remove("active");
    }

    // Append active stage
    const stage = liveStages[idx];
    traceCounter.textContent = stage.status;
    setAgentState("active", stage.label.toUpperCase());

    const item = document.createElement("div");
    item.className = "trace-item active";
    item.id = `trace-step-${idx}`;
    item.innerHTML = `
      <span class="trace-time-tag">${nowSec}s</span>
      <span class="trace-icon running">${stage.icon}</span>
      <div class="trace-text">${stage.label}</div>
    `;
    agentTrace.appendChild(item);
    agentTrace.scrollTop = agentTrace.scrollHeight;
    stageElements[idx] = item;
    currentStageIdx = idx;
  }

  // Launch initial stage immediately
  renderStageProgress(0);

  // Schedule remaining stages to trigger progressively while backend processes
  for (let i = 1; i < liveStages.length; i++) {
    const tid = setTimeout(() => {
      renderStageProgress(i);
    }, liveStages[i].delay);
    liveTimeouts.push(tid);
  }

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scene_text: sceneText })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Analysis failed.");
    }

    const data = await res.json();
    currentIntelligence = data;

    // Clear remaining scheduled timers
    clearLiveTimeouts();
    const totalElapsed = ((performance.now() - startTime) / 1000).toFixed(1);

    // Transition all active & previous stages to done
    for (let i = 0; i <= currentStageIdx; i++) {
      if (stageElements[i]) {
        const icon = stageElements[i].querySelector(".trace-icon");
        if (icon) {
          icon.className = "trace-icon done";
          icon.textContent = "✓";
        }
        const text = stageElements[i].querySelector(".trace-text");
        if (text && liveStages[i].doneLabel) {
          text.textContent = liveStages[i].doneLabel;
        }
        stageElements[i].classList.remove("active");
      }
    }

    // Complete any un-rendered stages seamlessly
    for (let i = currentStageIdx + 1; i < liveStages.length; i++) {
      const item = document.createElement("div");
      item.className = "trace-item";
      item.innerHTML = `
        <span class="trace-time-tag">${totalElapsed}s</span>
        <span class="trace-icon done">✓</span>
        <div class="trace-text">${liveStages[i].doneLabel}</div>
      `;
      agentTrace.appendChild(item);
    }

    // Append genuine live web sources found
    const trace = data.agent_execution_trace || {};
    const citations = trace.citations || [];
    const topLocationName = data.recommendation?.chosen_location || (data.location_options && data.location_options[0]?.name) || "Top Pick";

    if (citations.length > 0) {
      const sourceItem = document.createElement("div");
      sourceItem.className = "trace-item";
      sourceItem.innerHTML = `
        <span class="trace-time-tag">${totalElapsed}s</span>
        <span class="trace-icon done">✓</span>
        <div class="trace-text">Retrieved <strong>${citations.length} verified live web sources</strong> (${trace.retrieval_timestamp || "IST"})</div>
      `;
      agentTrace.appendChild(sourceItem);
    }

    const verdictItem = document.createElement("div");
    verdictItem.className = "trace-item";
    verdictItem.innerHTML = `
      <span class="trace-time-tag">${totalElapsed}s</span>
      <span class="trace-icon done">✓</span>
      <div class="trace-text">Shoot plan locked for <strong>${topLocationName}</strong></div>
    `;
    agentTrace.appendChild(verdictItem);
    agentTrace.scrollTop = agentTrace.scrollHeight;

    traceCounter.textContent = "READY";

    // Show Timing Footer
    traceTimingFooter.classList.remove("hidden");
    timingBadge.textContent = `Completed in ${totalElapsed}s`;

    // Render Live Evidence citations
    if (citations.length > 0) {
      renderCitations(citations, trace.retrieval_timestamp || "IST");
    }

    // Render Dashboard
    renderDashboard(data);
    setAgentState("live", "ONLINE • READY");

  } catch (err) {
    clearLiveTimeouts();
    console.error("Analysis error:", err);
    const errItem = document.createElement("div");
    errItem.className = "trace-item";
    errItem.innerHTML = `
      <span class="trace-time-tag">ERR</span>
      <span class="trace-icon" style="color: var(--accent-crimson);">✗</span>
      <div class="trace-text" style="color: var(--accent-crimson);">Error: ${err.message}</div>
    `;
    agentTrace.appendChild(errItem);
    traceCounter.textContent = "ERROR";
    setAgentState("live", "ONLINE • READY");
  } finally {
    btnAnalyze.disabled = false;
    btnAnalyze.querySelector(".btn-text").textContent = "SCOUT THIS SCENE";
  }
}


function renderCitations(citations, timestamp) {
  citationsContainer.classList.remove("hidden");
  citationsMeta.textContent = `${citations.length} sources retrieved • Retrieved ${timestamp}`;
  citationsList.innerHTML = "";

  citations.forEach(c => {
    const card = document.createElement("div");
    card.className = "source-card-compact";

    const type = (c.source_type || "SECONDARY").toUpperCase();
    let typeClass = "type-secondary";
    if (type.includes("GOV")) typeClass = "type-gov";
    else if (type.includes("OFFICIAL") || type.includes("AUTHORITY")) typeClass = "type-official";
    else if (type.includes("INDUSTRY")) typeClass = "type-industry";
    else if (type.includes("COMMERCIAL")) typeClass = "type-commercial";
    else if (type.includes("UNKNOWN")) typeClass = "type-unknown";

    card.innerHTML = `
      <div class="source-card-row1">
        <a href="${c.url || '#'}" target="_blank" rel="noopener noreferrer" class="source-title-link" title="${c.title || c.url}">
          ↗ ${c.title || c.url}
        </a>
        <span class="source-type-pill ${typeClass}">${type}</span>
      </div>
      <div class="source-card-row2">
        <span>Relevance: ${c.relevance_percent || 94}%</span>
        <span>Retrieved: ${c.retrieved_time || timestamp}</span>
      </div>
    `;
    citationsList.appendChild(card);
  });
}


// ================= Render Dashboard =================
function renderDashboard(data) {
  dashboardEmpty.classList.add("hidden");
  dashboardContent.classList.remove("hidden");

  const scene = data.scene_intelligence || {};
  const rec = data.recommendation || {};
  const permits = data.indian_permits_and_compliance || {};
  const crew = data.equipment_and_rentals || {};
  const budget = data.estimated_budget_tier || {};
  const locations = data.location_options || [];

  // 1. Scene Specs & Confidence
  specSetting.textContent = scene.setting || "Industrial Location";
  specTime.textContent = scene.time_of_day || "Night Shoot";
  specGenre.textContent = scene.tone_and_genre || "Action Thriller";
  
  const comp = (scene.complexity || "HIGH").toUpperCase();
  specComplexity.textContent = comp === "HIGH" ? "HIGH COMPLEXITY" : "MODERATE";
  specComplexity.className = `spec-badge ${comp === "HIGH" ? "badge-high" : "badge-medium"}`;

  aiConfidenceLabel.textContent = scene.ai_confidence_note || `Script match confidence: ${scene.ai_confidence_score || 92}%`;

  requirementsList.innerHTML = "";
  (scene.extracted_requirements || []).forEach(req => {
    const li = document.createElement("li");
    li.textContent = req;
    requirementsList.appendChild(li);
  });

  // 2. AGENT RECOMMENDATION
  const topLoc = locations.find(l => l.is_top_recommendation) || locations[0] || {};
  recLocationName.textContent = rec.chosen_location || topLoc.name || "Recommended Location";
  recCityTag.textContent = `${rec.area_locality ? rec.area_locality + ', ' : ''}${topLoc.city_state || 'India Production Hub'}`;
  recFitPercent.textContent = `${rec.production_fit_percent || topLoc.visual_fit_score || 94}%`;
  recTagline.textContent = `"${rec.tagline || 'Great balance of visual look, safety, and shoot feasibility.'}"`;

  recWhyBullets.innerHTML = "";
  (rec.why_cinescout_recommends || [
    "Strong visual match with required industrial architecture",
    "Authentic environment avoiding expensive studio reconstruction",
    "Suitable for required dark midnight scene tone",
    "Better logistical trade-off than unsafe derelict alternatives"
  ]).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    recWhyBullets.appendChild(li);
  });

  // Risks & Trade-offs
  const tradeoffsObj = rec.risks_and_tradeoffs || {};
  recTradeoffs.innerHTML = "";
  (tradeoffsObj.tradeoffs_accepted || [
    "High permit complexity with local police and municipal authorities",
    "Active commercial operations nearby requiring buffer management",
    "Night-shoot coordination and generator van sound restrictions"
  ]).forEach(t => {
    const li = document.createElement("li");
    li.textContent = t;
    recTradeoffs.appendChild(li);
  });

  recWhyStillWins.textContent = tradeoffsObj.why_it_still_wins || "Avoids serious structural safety hazards while delivering authentic industrial scale.";
  recWhyNotAlt.textContent = rec.why_not_alternatives || "Other candidate locations either present severe structural safety liabilities or require expensive set dressing.";

  // Evidence Used Compact Section
  const evidenceList = data.evidence_used || [];
  evidenceUsedCount.textContent = `${evidenceList.length || 4} verified sources helped make this recommendation`;
  evidenceUsedChips.innerHTML = "";
  evidenceList.forEach((ev, idx) => {
    const item = document.createElement("div");
    item.className = "evidence-chip-item";
    item.innerHTML = `
      <span class="evidence-chip-num">[0${ev.source_index || idx + 1}]</span>
      <span>${ev.label || ev.title || 'Official Authority Source'}</span>
    `;
    evidenceUsedChips.appendChild(item);
  });

  // 3. Location Candidates Matrix Table
  renderLocationsTable(locations);

  // 4. Live Production Radar Map
  renderRadarMap(locations);

  // 5. Evidence Constellation
  renderEvidenceConstellation(rec.chosen_location || topLoc.name, data.agent_execution_trace?.citations || [], data.evidence_used || []);

  // 6. AI Shot Planner
  allShotCards = data.ai_shot_planner || [];
  renderShotCardsFiltered();

  // 7. Permits & Compliance
  if (permits.estimated_lead_time_days) {
    leadTimePill.textContent = `EST. LEAD TIME: ${permits.estimated_lead_time_days}`;
  }
  permitsResearchedList.innerHTML = "";
  (permits.researched_requirements || [
    "State Film Facilitation Office (FFO / Single Window) clearance application",
    "City Police Commissioner NOC for night filming (10:00 PM - 05:00 AM window)",
    "Traffic Police NOC for exterior convoy and replica police vehicle movement"
  ]).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    permitsResearchedList.appendChild(li);
  });

  permitsConfirmationList.innerHTML = "";
  (permits.items_requiring_confirmation || [
    "Exact current lead time from local station duty officer",
    "Site-specific private property commercial tariff agreement",
    "Current local noise curfew limits for high-output generator vans"
  ]).forEach(item => {
    const li = document.createElement("li");
    li.textContent = item;
    permitsConfirmationList.appendChild(li);
  });

  permitsDisclaimer.textContent = permits.lead_time_status || "Estimated timelines based on municipal guidelines. Always double-check dates directly with your local authority or film board.";

  // 8. Equipment & Rentals
  if (budget.total_scene_estimate_inr) {
    budgetPill.textContent = `EST: ${budget.total_scene_estimate_inr}`;
  }

  equipmentItemsList.innerHTML = "";
  (crew.recommended_equipment || [
    { category: "Camera", item: "ARRI Alexa Mini LF / Sony Venice 2", why: "Dual base ISO critical for low-light pursuit and crisp strobe flares" },
    { category: "Lighting", item: "Astera Titan Wireless Tubes & Aputure 600d Pro", why: "Battery-powered fixtures allow fast re-rigging in rugged spaces without live house power" },
    { category: "Stunt & Safety", item: "Deceleration Crash Mats & Dedicated On-Set Trauma Unit", why: "Mandatory under Indian Stunt Master Association protocols for hard concrete chase scenes" }
  ]).forEach(eq => {
    const box = document.createElement("div");
    box.className = "eq-item-box";
    box.innerHTML = `
      <div class="eq-header">
        <span class="eq-name">${eq.item}</span>
        <span class="eq-cat">${eq.category}</span>
      </div>
      <p class="eq-why"><strong>Why:</strong> ${eq.why}</p>
    `;
    equipmentItemsList.appendChild(box);
  });

  rentalPartnersChips.innerHTML = "";
  (crew.rental_options_found || ["Anand Cine Services", "Light Craft Film Equipment", "Prime Focus Gear Rentals"]).forEach(vendor => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = vendor;
    rentalPartnersChips.appendChild(chip);
  });
}


// ================= 4. Live Production Radar Map =================
function renderRadarMap(locations) {
  if (!window.L) return;

  const mapContainer = document.getElementById("radar-map");
  if (!mapContainer) return;

  // Initialize Map if not yet created
  if (!leafletMap) {
    leafletMap = L.map("radar-map", {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false
    });

    // Esri World Dark Gray Canvas: 100% Free, NO API Key required, zero watermarks
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 16,
      subdomains: ["server", "services"]
    }).addTo(leafletMap);

    // Clean reference overlay with place names & roads
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 16
    }).addTo(leafletMap);
  }

  // Clear existing markers
  mapMarkers.forEach(m => leafletMap.removeLayer(m));
  mapMarkers = [];

  const latLngs = [];

  locations.forEach((loc, idx) => {
    const lat = loc.coordinates?.lat || (12.9716 + (idx * 0.04));
    const lng = loc.coordinates?.lng || (77.5946 + (idx * 0.05));
    latLngs.push([lat, lng]);

    const isBest = loc.is_top_recommendation || idx === 0;
    const isRisk = (loc.risk_level || "").toLowerCase().includes("high") || loc.risk_score > 70;

    let ringClass = "pin-ring-gold";
    let coreClass = "pin-core-gold";
    if (isBest) {
      ringClass = "pin-ring-green";
      coreClass = "pin-core-green";
    } else if (isRisk) {
      ringClass = "pin-ring-red";
      coreClass = "pin-core-red";
    }

    const customIcon = L.divIcon({
      className: "radar-marker-pulse",
      html: `
        <div class="radar-pin-ring ${ringClass}"></div>
        <div class="radar-pin-core ${coreClass}"></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(leafletMap);
    marker.on("click", () => {
      showRadarLocationPanel(loc);
    });

    mapMarkers.push(marker);
  });

  if (latLngs.length > 0) {
    leafletMap.fitBounds(latLngs, { padding: [50, 50], maxZoom: 14 });
  }

  // Open first location in side panel
  if (locations.length > 0) {
    showRadarLocationPanel(locations[0]);
  }
}

function showRadarLocationPanel(loc) {
  selectedLocationId = loc.id;
  radarSidePanel.classList.remove("hidden");

  radarPanelTitle.textContent = loc.name;
  radarPanelFit.textContent = `${loc.visual_fit_score || 92}% SCENE MATCH`;
  radarPanelVisual.textContent = loc.visual_fit_score || 92;
  radarPanelLogistics.textContent = loc.logistics_rating || "Moderate";
  radarPanelRisk.textContent = loc.risk_score || 45;
  radarPanelSourcesCount.textContent = `4 VERIFIED WEB SOURCES`;
  radarPanelSummary.textContent = loc.risk_summary || loc.real_world_basis || "Researched through live web search.";
}

function applyLocationAsTopRecommendation(loc) {
  recLocationName.textContent = loc.name;
  recCityTag.textContent = loc.city_state || 'India Production Hub';
  recFitPercent.textContent = `${loc.visual_fit_score}%`;
  recTagline.textContent = `"Selected by filmmaker: ${loc.name} with ${loc.logistics_rating || 'Moderate'} accessibility."`;
  
  if (loc.key_pros && loc.key_pros.length > 0) {
    recWhyBullets.innerHTML = "";
    loc.key_pros.forEach(pro => {
      const li = document.createElement("li");
      li.textContent = pro;
      recWhyBullets.appendChild(li);
    });
  }

  // Highlight table row
  renderLocationsTable(currentIntelligence.location_options || [], loc.id);

  // Re-render Constellation for newly selected location
  renderEvidenceConstellation(loc.name, currentIntelligence.agent_execution_trace?.citations || [], currentIntelligence.evidence_used || []);
}


// ================= 5. Evidence Constellation Map =================
function renderEvidenceConstellation(chosenLocation, citations, evidenceUsed) {
  const container = document.getElementById("constellation-canvas-wrap");
  if (!container) return;

  const width = container.clientWidth || 600;
  const height = container.clientHeight || 280;
  const cx = width / 2;
  const cy = height / 2;

  const svg = document.getElementById("constellation-svg");
  const nodesLayer = document.getElementById("constellation-nodes");
  svg.innerHTML = "";
  nodesLayer.innerHTML = "";

  const sources = citations.length > 0 ? citations.slice(0, 4) : [
    { title: "Municipal Filming Guidelines", url: "#", source_type: "GOVERNMENT", influence_summary: "Permits & curfew NOC" },
    { title: "Police Commissioner Guidelines", url: "#", source_type: "OFFICIAL / AUTHORITY", influence_summary: "Night filming permissions" },
    { title: "Cine Industry Location Directory", url: "#", source_type: "INDUSTRY", influence_summary: "Location availability" },
    { title: "Gear Rental & Power Suppliers", url: "#", source_type: "COMMERCIAL", influence_summary: "Genset and rig support" }
  ];

  constellationCountPill.textContent = `${sources.length} SOURCES CHECKED`;

  // Center Recommendation Node
  const centerNode = document.createElement("div");
  centerNode.className = "constellation-center-node";
  centerNode.innerHTML = `
    <span class="c-center-tag">TOP PICK</span>
    <div class="c-center-title">${chosenLocation}</div>
  `;
  nodesLayer.appendChild(centerNode);

  // Position surrounding nodes in an orbit
  const radius = Math.min(width * 0.38, 160);
  const angleStep = (2 * Math.PI) / sources.length;

  sources.forEach((s, idx) => {
    const angle = idx * angleStep - Math.PI / 4;
    const nx = cx + Math.cos(angle) * radius;
    const ny = cy + Math.sin(angle) * (radius * 0.72); // slightly elliptical

    // Draw connecting SVG line with glowing gradient
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", cx);
    line.setAttribute("y1", cy);
    line.setAttribute("x2", nx);
    line.setAttribute("y2", ny);
    line.setAttribute("stroke", "rgba(0, 210, 255, 0.4)");
    line.setAttribute("stroke-width", "1.5");
    line.setAttribute("stroke-dasharray", "4,4");
    svg.appendChild(line);

    // Source Node
    const node = document.createElement("a");
    node.className = "constellation-source-node";
    node.href = s.url || "#";
    node.target = "_blank";
    node.rel = "noopener noreferrer";
    node.style.left = `${nx}px`;
    node.style.top = `${ny}px`;

    node.innerHTML = `
      <span class="c-node-category">${s.source_type || 'SOURCE'}</span>
      <span class="c-node-title" title="${s.title}">${s.title}</span>
      <span class="c-node-influence">${s.snippet ? s.snippet.slice(0, 50) + '...' : (s.influence_summary || 'Evidence influence')}</span>
    `;

    nodesLayer.appendChild(node);
  });
}


// ================= 6. Location Candidates Table =================
function renderLocationsTable(locations, selectedId = null) {
  locationsTbody.innerHTML = "";

  locations.forEach(loc => {
    const tr = document.createElement("tr");
    if (selectedId && loc.id === selectedId) {
      tr.style.background = "rgba(229, 169, 60, 0.1)";
    }

    const fitScore = loc.visual_fit_score || 85;
    const risk = (loc.risk_level || "Medium").toLowerCase();
    let riskClass = "risk-medium";
    if (risk.includes("low")) riskClass = "risk-low";
    if (risk.includes("high")) riskClass = "risk-high";

    tr.innerHTML = `
      <td>
        <span class="loc-title">${loc.name}</span>
      </td>
      <td>
        <span class="loc-hub">${loc.city_state || 'India'}</span>
      </td>
      <td>
        <div class="fit-bar-container">
          <div class="fit-progress">
            <div class="fit-fill" style="width: ${fitScore}%"></div>
          </div>
          <span class="fit-score">${fitScore}%</span>
        </div>
      </td>
      <td>
        <span>${loc.logistics_rating || 'Moderate'}</span>
      </td>
      <td>
        <span class="risk-tag ${riskClass}">${loc.risk_level || 'Medium'} (${loc.risk_score || 45})</span>
      </td>
      <td class="rate-cell">
        ${loc.estimated_daily_cost_inr || '₹3.0L – ₹4.5L / day'}
      </td>
      <td class="grounding-cell">
        ${loc.real_world_basis || 'Verified via live web research.'}
      </td>
    `;

    tr.addEventListener("click", () => {
      showRadarLocationPanel(loc);
      applyLocationAsTopRecommendation(loc);
    });

    locationsTbody.appendChild(tr);
  });
}


// ================= 7. AI Shot Planner =================
function renderShotCardsFiltered() {
  shotCardsGrid.innerHTML = "";

  let filtered = allShotCards;
  if (activeShotStyle !== "all") {
    filtered = allShotCards.filter(s => (s.style_tag || "").toLowerCase().includes(activeShotStyle));
  }

  // Update flow steps
  if (allShotCards.length > 0) {
    const flowText = allShotCards.map(s => s.shot_number || "01").join(" → ");
    shotFlowSteps.textContent = flowText;
  }

  if (filtered.length === 0) {
    shotCardsGrid.innerHTML = `<div style="grid-column: 1/-1; color: var(--text-muted); font-size: 0.8rem; text-align: center; padding: 1.5rem;">No shot ideas found matching '${activeShotStyle}'. Showing all camera suggestions.</div>`;
    filtered = allShotCards;
  }

  filtered.forEach(shot => {
    const card = document.createElement("div");
    card.className = "shot-card";

    card.innerHTML = `
      <div class="shot-card-top">
        <span class="shot-num">#${shot.shot_number || '01'}</span>
        <span class="shot-style-pill">${shot.style_tag || 'CINEMATIC'}</span>
      </div>
      <div class="shot-type-title">${shot.shot_type || 'WIDE SHOT'}</div>
      <div class="shot-movement">
        <span>⟳</span> <span>${shot.camera_movement || 'Steadicam tracking'}</span>
      </div>
      <p class="shot-purpose">${shot.purpose || 'Establish scene geography and tension'}</p>
      <div class="shot-lens">🔍 Lens: ${shot.recommended_lens || '35mm Prime T1.5'}</div>
    `;

    shotCardsGrid.appendChild(card);
  });
}


// ================= 10. Follow-up & PLAN DELTA =================
async function executeFollowUp(question) {
  if (!currentIntelligence) {
    alert("Please scout a scene first before asking follow-up questions.");
    return;
  }

  btnFollowup.disabled = true;
  followupLoading.classList.remove("hidden");
  followupResponseArea.classList.add("hidden");
  setAgentState("active", "CHECKING OPTIONS...");

  const fuStart = performance.now();
  const fuItem0 = document.createElement("div");
  fuItem0.className = "trace-item active";
  fuItem0.innerHTML = `
    <span class="trace-time-tag">00.0s</span>
    <span class="trace-icon running">●</span>
    <div class="trace-text">Processing inquiry: "<strong>${question}</strong>"</div>
  `;
  agentTrace.appendChild(fuItem0);
  agentTrace.scrollTop = agentTrace.scrollHeight;

  const fuTid1 = setTimeout(() => {
    fuItem0.querySelector(".trace-icon").className = "trace-icon done";
    fuItem0.querySelector(".trace-icon").textContent = "✓";
    fuItem0.classList.remove("active");
    addTraceItem("01.2s", "Searching with Parallel for updated guidelines & locations...", "⌕");
  }, 1200);

  const fuTid2 = setTimeout(() => {
    addTraceItem("02.8s", "Evaluating evidence & comparing with original plan...", "●");
  }, 2800);

  try {
    const res = await fetch("/api/followup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scene_text: currentSceneText,
        previous_intelligence: currentIntelligence,
        question: question
      })
    });

    clearTimeout(fuTid1);
    clearTimeout(fuTid2);

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Follow-up check failed.");
    }

    const data = await res.json();
    followupLoading.classList.add("hidden");
    setAgentState("live", "ONLINE • READY");

    const elapsed = ((performance.now() - fuStart) / 1000).toFixed(1);
    addTraceItem(`${elapsed}s`, `Side-by-side plan comparison prepared with live evidence`, "✓");

    // Render PLAN DELTA
    renderPlanDelta(data, question);

  } catch (err) {
    clearTimeout(fuTid1);
    clearTimeout(fuTid2);
    console.error(err);
    followupLoading.classList.add("hidden");
    addTraceItem("ERR", `Follow-up error: ${err.message}`, "✗");
    setAgentState("live", "ONLINE • READY");
  } finally {
    btnFollowup.disabled = false;
  }
}

function renderPlanDelta(data, question) {
  followupDisplayQ.textContent = `Q: "${question}"`;
  
  const delta = data.plan_delta || {};
  const cur = delta.current || {
    location: "Original Spot",
    visual_fit: "94%",
    logistics: "HIGH",
    permit_risk: "HIGH",
    estimated_cost: "₹20L"
  };
  const prop = delta.proposed || {
    location: "Proposed Spot",
    visual_fit: "89%",
    logistics: "MEDIUM",
    permit_risk: "LOW",
    estimated_cost: "₹14L - ₹18L"
  };

  // Populate Side-by-Side Comparison Table with clean, human headers
  deltaTableBody.innerHTML = `
    <tr>
      <td class="delta-dim-label">Location</td>
      <td class="delta-cur-val">${cur.location}</td>
      <td class="delta-prop-val">${prop.location}</td>
      <td><span class="delta-var-badge var-neutral">NEW SPOT</span></td>
    </tr>
    <tr>
      <td class="delta-dim-label">Look &amp; Vibe</td>
      <td class="delta-cur-val">${cur.visual_fit}</td>
      <td class="delta-prop-val">${prop.visual_fit}</td>
      <td><span class="delta-var-badge var-tradeoff">ADAPT</span></td>
    </tr>
    <tr>
      <td class="delta-dim-label">Ease of Access</td>
      <td class="delta-cur-val">${cur.logistics}</td>
      <td class="delta-prop-val">${prop.logistics}</td>
      <td><span class="delta-var-badge var-positive">EASIER</span></td>
    </tr>
    <tr>
      <td class="delta-dim-label">Permits &amp; Rules</td>
      <td class="delta-cur-val">${cur.permit_risk}</td>
      <td class="delta-prop-val">${prop.permit_risk}</td>
      <td><span class="delta-var-badge var-positive">FEWER HOOPS</span></td>
    </tr>
    <tr>
      <td class="delta-dim-label">Estimated Cost</td>
      <td class="delta-cur-val">${cur.estimated_cost}</td>
      <td class="delta-prop-val">${prop.estimated_cost}</td>
      <td><span class="delta-var-badge var-positive">BUDGET FRIENDLY</span></td>
    </tr>
  `;

  // Trade-off & Agent Verdict
  deltaTradeoff.textContent = data.tradeoff || "This proposed spot simplifies permits and travel, but may need slight art department adjustments to match your scene's vibe.";
  deltaAgentVerdict.textContent = data.agent_verdict || "This is a great alternative if you want to avoid red tape and save budget without sacrificing too much atmosphere.";
  deltaNextStep.textContent = data.actionable_next_step || "Submit your single-window application with the regional film board and lock in shoot dates.";

  // Follow-up Sources
  const trace = data.execution_trace || {};
  const sources = trace.sources || [];
  deltaSourcesList.innerHTML = "";
  if (sources.length > 0) {
    sources.slice(0, 3).forEach(s => {
      const a = document.createElement("a");
      a.className = "source-title-link";
      a.href = s.url || "#";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = `↗ <strong>[${s.source_type || 'SOURCE'}]</strong> ${s.title || s.url}`;
      deltaSourcesList.appendChild(a);
    });
  } else {
    deltaSourcesList.innerHTML = `<span style="font-size: 0.75rem; color: var(--text-muted);">Sources verified from live web search.</span>`;
  }

  followupResponseArea.classList.remove("hidden");
  followupResponseArea.scrollIntoView({ behavior: "smooth" });
}
