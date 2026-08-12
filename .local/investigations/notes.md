# Healthcare Invoice Assurance Runtime Investigation

- Anchor: `uipathlabs / Playground / AMER Presales/HLS`, folder key `79d872b0-bee1-4264-a6de-3e780f4e4239`; process `InvoiceAssurancePersistence`, release key `dd273b1c-d925-45d0-b1b6-b719cd972819`.
- Expected outcome: run the contracted live persistence suite and then the authenticated end-to-end demo.
- Reproduction: starting the release with `--runtime-type Serverless` returned HTTP 409: `Cloud - Serverless runtime license selected. There are no Cloud - Serverless runtimes configured on the templates in this folder.` No job was created.
- Runtime evidence: `hia-runtime-machine-list.json` reports zero machine templates in HLS. `hia-runtime-license-info.json` reports spare tenant Unattended and NonProduction capacity, separating tenant licensing from folder host assignment.
- Cause: the selected HLS folder has no execution template supporting the explicitly selected Cloud Serverless runtime.
- Documented alternative: the persistence SDD permits Studio Web serverless debug with folder entity scope for development verification.
- Browser evidence: Chrome is running, but `hia-browser-extension-check.json` reports the ChatGPT browser extension is not installed/enabled in the active Default profile, so Codex cannot operate the already-authenticated Studio Web tab.
- Temporary-data disposition: seed Main record `c934bc6c-6e94-f111-9b33-7c1e522150ac` was deleted with SuccessCount 1; fresh post-cleanup queries returned Main 0, LineItems 0, Activity 0.
