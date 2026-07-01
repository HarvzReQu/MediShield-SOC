# MediShield SOC

MediShield SOC is a public-safe healthcare cybersecurity dashboard inspired by SIEM and SOC workflows. It simulates hospital telemetry, incident triage, compliance signals, asset exposure, and risk scoring without using real patient, clinical, or security data.

## Features

- Healthcare-focused SOC command center
- Simulated SIEM alert stream and triage workflow
- Live public vulnerability intelligence from CISA KEV and NVD
- Transparent healthcare relevance and priority scoring model
- Department risk matrix with likelihood and consequence scoring
- HIPAA, NIST CSF, and ISO 27001 posture cards
- Medical device and hospital system asset monitoring
- Responsive static frontend ready for Vercel

## Public Data Sources

- CISA Known Exploited Vulnerabilities Catalog: exploited CVEs observed in the wild and tracked by CISA.
- NIST National Vulnerability Database CVE API: public CVE records, descriptions, CVSS metrics, and modified dates.

The dashboard converts those feeds into healthcare-focused signals using a transparent scoring model. The score considers known exploitation, ransomware association, healthcare keyword relevance, recency, and CVSS severity. It is not a diagnosis of a real hospital environment.

## Run Locally

Open `index.html` directly in a browser, or run a simple static server:

```bash
npx serve .
```

## Deploy

This project is designed for Vercel hosting. The frontend is static, and `/api/intel` is a serverless route that fetches public CISA KEV and NVD data.

## Safety Note

This app is an educational simulator. It does not collect, process, or display real protected health information, live hospital logs, credentials, or exploit steps. The public intelligence layer uses open vulnerability metadata only.
