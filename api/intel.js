const CISA_KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
const NVD_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";

const healthcareTerms = [
  "medical",
  "health",
  "hospital",
  "patient",
  "clinical",
  "ehr",
  "pacs",
  "insulin",
  "infusion",
  "radiology",
  "cardiac",
  "medtronic",
  "abbott",
  "philips",
  "siemens",
  "ge healthcare",
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function daysBetween(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return 9999;
  return Math.floor((Date.now() - date.getTime()) / 86400000);
}

function textScore(text) {
  const lower = text.toLowerCase();
  return healthcareTerms.reduce((score, term) => score + (lower.includes(term) ? 1 : 0), 0);
}

function priorityFromKev(vulnerability) {
  let score = 58;
  const text = `${vulnerability.vendorProject} ${vulnerability.product} ${vulnerability.vulnerabilityName} ${vulnerability.shortDescription}`;

  score += textScore(text) * 8;
  score += vulnerability.knownRansomwareCampaignUse === "Known" ? 18 : 0;
  score += daysBetween(vulnerability.dateAdded) <= 30 ? 12 : 0;
  score += daysBetween(vulnerability.dueDate) >= 0 ? 8 : 0;

  return clamp(score, 0, 100);
}

function metricFromCve(cve) {
  const metrics = cve.metrics || {};
  const cvss =
    metrics.cvssMetricV40?.[0] ||
    metrics.cvssMetricV31?.[0] ||
    metrics.cvssMetricV30?.[0] ||
    metrics.cvssMetricV2?.[0] ||
    null;

  return {
    baseScore: cvss?.cvssData?.baseScore || 0,
    severity: cvss?.cvssData?.baseSeverity || cvss?.baseSeverity || "UNKNOWN",
  };
}

function priorityFromCve(cve) {
  const description = cve.descriptions?.find((item) => item.lang === "en")?.value || "";
  const metric = metricFromCve(cve);
  let score = metric.baseScore * 8;

  score += textScore(description) * 7;
  score += daysBetween(cve.lastModified) <= 30 ? 8 : 0;
  score += daysBetween(cve.published) <= 120 ? 6 : 0;

  return clamp(Math.round(score), 0, 100);
}

function severityFromScore(score) {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function nvdWindow() {
  const end = new Date();
  const start = new Date(end.getTime() - 100 * 86400000);
  return {
    start: start.toISOString().replace(/\.\d{3}Z$/, ".000Z"),
    end: end.toISOString().replace(/\.\d{3}Z$/, ".000Z"),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "MediShield-SOC/1.0 public cybersecurity dashboard",
    },
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function getKev() {
  const kev = await fetchJson(CISA_KEV_URL);
  const items = kev.vulnerabilities
    .map((vulnerability) => {
      const priority = priorityFromKev(vulnerability);

      return {
        id: vulnerability.cveID,
        source: "CISA KEV",
        title: vulnerability.vulnerabilityName,
        vendor: vulnerability.vendorProject?.trim() || "Unknown",
        product: vulnerability.product || "Unknown",
        summary: vulnerability.shortDescription,
        published: vulnerability.dateAdded,
        dueDate: vulnerability.dueDate,
        ransomware: vulnerability.knownRansomwareCampaignUse,
        priority,
        severity: severityFromScore(priority),
        healthcareSignal: textScore(
          `${vulnerability.vendorProject} ${vulnerability.product} ${vulnerability.vulnerabilityName} ${vulnerability.shortDescription}`,
        ),
        url: `https://nvd.nist.gov/vuln/detail/${vulnerability.cveID}`,
      };
    })
    .sort((a, b) => b.priority - a.priority || new Date(b.published) - new Date(a.published))
    .slice(0, 8);

  return {
    version: kev.catalogVersion,
    released: kev.dateReleased,
    count: kev.count,
    items,
  };
}

async function getNvd() {
  const { start, end } = nvdWindow();
  const params = new URLSearchParams({
    keywordSearch: "medical",
    lastModStartDate: start,
    lastModEndDate: end,
    resultsPerPage: "12",
  });
  const nvd = await fetchJson(`${NVD_URL}?${params.toString()}`);

  const items = (nvd.vulnerabilities || [])
    .map(({ cve }) => {
      const description = cve.descriptions?.find((item) => item.lang === "en")?.value || "No description available.";
      const metric = metricFromCve(cve);
      const priority = priorityFromCve(cve);

      return {
        id: cve.id,
        source: "NVD",
        title: cve.id,
        vendor: cve.sourceIdentifier || "NVD",
        product: "CVE record",
        summary: description,
        published: cve.published,
        lastModified: cve.lastModified,
        cvss: metric.baseScore,
        nvdSeverity: metric.severity,
        priority,
        severity: severityFromScore(priority),
        healthcareSignal: textScore(description),
        url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
      };
    })
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 6);

  return {
    timestamp: nvd.timestamp,
    totalResults: nvd.totalResults,
    items,
  };
}

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");

  try {
    const [kev, nvd] = await Promise.all([getKev(), getNvd()]);
    const items = [...kev.items, ...nvd.items].sort((a, b) => b.priority - a.priority).slice(0, 10);
    const averagePriority = Math.round(items.reduce((sum, item) => sum + item.priority, 0) / Math.max(items.length, 1));

    response.status(200).json({
      generatedAt: new Date().toISOString(),
      sources: {
        cisaKev: kev,
        nvd,
      },
      model: {
        name: "MediShield public-risk prioritizer",
        type: "transparent feature scoring",
        features: ["known exploitation", "ransomware use", "healthcare keyword relevance", "recency", "CVSS severity"],
        note: "This is model-assisted prioritization for public data, not a prediction from private hospital telemetry.",
      },
      summary: {
        totalPublicSignals: items.length,
        averagePriority,
        criticalOrHigh: items.filter((item) => item.severity === "critical" || item.severity === "high").length,
      },
      items,
    });
  } catch (error) {
    response.status(502).json({
      error: "Unable to refresh public intelligence feeds.",
      detail: error.message,
      generatedAt: new Date().toISOString(),
    });
  }
};
