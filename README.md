# MediShield SOC

MediShield SOC is a public-safe healthcare cybersecurity dashboard inspired by SIEM and SOC workflows. It simulates hospital telemetry, incident triage, compliance signals, asset exposure, and risk scoring without using real patient, clinical, or security data.

## Features

- Healthcare-focused SOC command center
- Simulated SIEM alert stream and triage workflow
- Department risk matrix with likelihood and consequence scoring
- HIPAA, NIST CSF, and ISO 27001 posture cards
- Medical device and hospital system asset monitoring
- Responsive static frontend ready for Vercel

## Run Locally

Open `index.html` directly in a browser, or run a simple static server:

```bash
npx serve .
```

## Deploy

This project is designed for Vercel static hosting. Import the GitHub repository in Vercel and keep the default static settings.

## Safety Note

This app is an educational simulator. It does not collect, process, or display real protected health information, live logs, credentials, vulnerabilities, or exploit steps.
