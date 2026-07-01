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

severityFilter.addEventListener("change", renderIncidents);

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
setInterval(updateSimulation, 2600);
