const incidents = [
  {
    severity: "critical",
    title: "Impossible travel against EHR administrator",
    detail: "SSO login observed from Manila and Frankfurt within 11 minutes.",
    source: "Identity",
  },
  {
    severity: "high",
    title: "Radiology workstation beaconing pattern",
    detail: "PACS subnet endpoint matched suspicious DNS interval behavior.",
    source: "Network",
  },
  {
    severity: "medium",
    title: "Infusion pump firmware policy drift",
    detail: "14 devices missed the approved biomedical patch baseline.",
    source: "Medical IoT",
  },
  {
    severity: "high",
    title: "Claims API token reused from new ASN",
    detail: "Service credential generated abnormal volume after midnight.",
    source: "Cloud",
  },
  {
    severity: "medium",
    title: "Nurse station shared-account spike",
    detail: "Emergency department access pattern exceeded behavioral threshold.",
    source: "EHR",
  },
];

const departments = [
  ["ER", 82],
  ["EHR", 68],
  ["PACS", 74],
  ["IoT", 57],
  ["API", 43],
  ["IAM", 63],
];

const incidentList = document.querySelector("#incidentList");
const severityFilter = document.querySelector("#severityFilter");
const runTriage = document.querySelector("#runTriage");
const pauseFeed = document.querySelector("#pauseFeed");
const incidentCount = document.querySelector("#incidentCount");
const riskScore = document.querySelector("#riskScore");
const barChart = document.querySelector("#barChart");
const intelList = document.querySelector("#intelList");
const refreshIntel = document.querySelector("#refreshIntel");
const publicSignalCount = document.querySelector("#publicSignalCount");
const highPriorityCount = document.querySelector("#highPriorityCount");
const modelScore = document.querySelector("#modelScore");
const intelUpdated = document.querySelector("#intelUpdated");
const toggleGuide = document.querySelector("#toggleGuide");
const guideDialog = document.querySelector("#guideDialog");
const closeGuide = document.querySelector("#closeGuide");

let paused = false;
let triaged = 0;

function renderIncidents() {
  const selected = severityFilter.value;
  const visible = incidents.filter((incident) => selected === "all" || incident.severity === selected);

  incidentList.innerHTML = visible
    .map(
      (incident, index) => `
        <div class="incident ${incident.severity}">
          <span class="severity">${incident.severity}</span>
          <div>
            <strong>${incident.title}</strong>
            <small>${incident.detail}</small>
          </div>
          <button type="button" data-index="${index}" aria-label="Assign ${incident.title}">Assign</button>
        </div>
      `,
    )
    .join("");
}

function renderBars() {
  barChart.innerHTML = departments
    .map(
      ([label, value]) => `
        <div class="bar">
          <span style="height: ${value}%"></span>
          <small>${label}</small>
        </div>
      `,
    )
    .join("");
}

function updateSimulation() {
  if (paused) return;

  const openIncidents = Math.max(7, 18 - triaged + Math.round(Math.random() * 3));
  const currentRisk = Math.max(42, 71 - triaged * 4 + Math.round(Math.random() * 5));

  incidentCount.textContent = openIncidents;
  riskScore.textContent = currentRisk;
}

function formatDate(dateLike) {
  if (!dateLike) return "Unknown date";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(dateLike));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fallbackIntel() {
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPublicSignals: 3,
      criticalOrHigh: 2,
      averagePriority: 76,
    },
    items: [
      {
        id: "CVE public feed unavailable",
        source: "Local fallback",
        title: "Public feeds could not be reached from this browser session",
        vendor: "MediShield SOC",
        product: "Demo continuity",
        summary: "The deployed version uses a Vercel API route to load CISA KEV and NVD. This fallback keeps the UI usable when opened directly from the file system.",
        published: new Date().toISOString(),
        priority: 76,
        severity: "high",
        healthcareSignal: 1,
        url: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
      },
    ],
  };
}

function renderIntel(data) {
  const items = data.items || [];

  publicSignalCount.textContent = data.summary?.totalPublicSignals ?? items.length;
  highPriorityCount.textContent = data.summary?.criticalOrHigh ?? items.filter((item) => item.priority >= 70).length;
  modelScore.textContent = data.summary?.averagePriority ?? "--";
  intelUpdated.textContent = `Updated ${formatDate(data.generatedAt)}`;

  intelList.innerHTML = items
    .map((item) => {
      const summary = item.summary || "No summary available.";
      const priorityReason = item.source === "CISA KEV"
        ? "Known exploited vulnerability"
        : `CVSS ${item.cvss || "n/a"} public vulnerability record`;

      return `
        <div class="intel-item ${escapeHtml(item.severity)}">
          <span class="priority"><b>${escapeHtml(item.priority)}</b>${escapeHtml(item.severity)}</span>
          <div>
            <strong>${escapeHtml(item.id)} - ${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(summary).slice(0, 150)}${summary.length > 150 ? "..." : ""}</small>
            <div class="intel-meta">
              <span>${escapeHtml(item.source)}</span>
              <span>${escapeHtml(item.vendor)} / ${escapeHtml(item.product)}</span>
              <span>${escapeHtml(priorityReason)}</span>
              <span>Healthcare signal: ${escapeHtml(item.healthcareSignal)}</span>
              <span>Published: ${formatDate(item.published)}</span>
            </div>
          </div>
          <a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">Open</a>
        </div>
      `;
    })
    .join("");
}

async function loadIntel() {
  refreshIntel.disabled = true;
  refreshIntel.textContent = "Refreshing";

  try {
    const response = await fetch("/api/intel");
    if (!response.ok) throw new Error("Public feed API unavailable");
    const data = await response.json();
    renderIntel(data);
  } catch (error) {
    renderIntel(fallbackIntel());
  } finally {
    refreshIntel.disabled = false;
    refreshIntel.textContent = "Refresh";
  }
}

severityFilter.addEventListener("change", renderIncidents);
refreshIntel.addEventListener("click", loadIntel);

toggleGuide.addEventListener("click", () => {
  guideDialog.showModal();
});

closeGuide.addEventListener("click", () => {
  guideDialog.close();
});

runTriage.addEventListener("click", () => {
  triaged = Math.min(triaged + 2, 8);
  runTriage.textContent = "Triage Running";
  setTimeout(() => {
    runTriage.textContent = "Run Triage";
    updateSimulation();
  }, 700);
});

pauseFeed.addEventListener("click", () => {
  paused = !paused;
  pauseFeed.textContent = paused ? ">" : "II";
  pauseFeed.setAttribute("aria-label", paused ? "Resume event feed" : "Pause event feed");
});

incidentList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  button.textContent = "Assigned";
  button.disabled = true;
  triaged = Math.min(triaged + 1, 8);
  updateSimulation();
});

renderIncidents();
renderBars();
loadIntel();
setInterval(updateSimulation, 2600);
