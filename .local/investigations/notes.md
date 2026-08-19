# Investigation: solution debug provisioning failure

## Anchor

- Environment: UiPath Automation Cloud, Studio Web solution `HealthcareInvoiceAssurance`.
- Debug folder from error: `joseph.rumpza@uipath.com's workspace/Debug_HealthcareInvoiceAssurance`.
- Failed resources: `ContractComplianceAgent` and `ProjectCostLookupApi`.
- Exact server message: `This process's package is not available anymore. Changes are not possible.`

## Signals

- Failure occurs during solution debug creation/resource provisioning, before Flow execution.
- `HealthcareInvoiceAssurance.uipx` still registers both source projects.
- Both generated package resources have empty `files` arrays and their process resources reference generated package keys.
- The API workflow was successfully run directly earlier, so an existing HLS platform deployment is available independently of the stale debug-folder resource.

## Candidate assessment

1. Stale debug-folder process resources reference backing package revisions that have been removed.
   - Supported by the exact Orchestrator error for both processes.
   - Supported by the failure being scoped to `Debug_HealthcareInvoiceAssurance`, not `AMER Presales/HLS`.
2. Missing solution source projects.
   - Contradicted: both projects remain registered in `HealthcareInvoiceAssurance.uipx` and their source directories exist.
3. Flow logic/runtime defect.
   - Contradicted: provisioning failed before the Flow instance was created.

## Resolution alignment

- UiPath Studio Web documentation states solution debugging provisions resources into `Debug_[Solution Name]` and that Debug configuration can bind a solution resource to an existing UiPath Platform resource in another folder.
- Minimal non-destructive resolution: override the two debug resources to use the existing `AMER Presales/HLS` deployments, then retry provisioning.
- Destructive cleanup of the debug folder is not the first action; official documentation confirms debug deployments and their resources are ephemeral and subject to cleanup, but override avoids deletion.

## Verification checklist

- Cause named: stale debug process references whose backing packages are unavailable.
- Evidence pinned: exact error names both processes and the `Debug_HealthcareInvoiceAssurance` folder.
- Runtime/platform evidence: Studio Web provisioning error screenshot supplied by user.
- Resolution aligned: Debug configuration supports selecting existing Platform resources for debugging.
- Causal precedence: the debug deployment attempted to upgrade pre-existing resources; Orchestrator rejected the update because each process's package was unavailable; therefore Flow startup never occurred.
- Fix scope: change only the debug bindings for the two named resources.

## Self-verify

- Specific cause: pass.
- Evidence distinguishes source absence: pass; source projects exist.
- Resolution alignment: pass against official Studio Web debugging documentation.
- Causal precedence: pass; no Flow execution occurred before provisioning failure.

## 2026-08-18 coded Action App upgrade InstallError
- Anchor: app key ba95adf6-2114-4243-800c-64d39269658e; folder key 0e94dc5e-161a-44c8-8a42-2bb571b8d353; error Failed to update external client redirect URI, HTTP 400.
- H1: requested/deployment-derived redirect URI is invalid or conflicts with registered redirect URIs. Source: coded-app redirect-uri playbook. Confirm: source app config and external-app redirect list mismatch or invalid URI. Eliminate: exact required URI already valid and registered.
- H2: backing External Application is stale, inaccessible, or rejects updates independently of the URI. Source: upstream Identity dependency from coded-app overview. Confirm: external-app get failure/missing client or state indicating non-updatable client. Eliminate: client resolves and exposes expected public-client configuration.
- H3: solution app resource identity/binding is stale or duplicated, so upgrade targets the wrong app/client association. Source: upstream/elsewhere candidate from solution deployment context. Confirm: resource key/package/client mappings disagree across solution files. Eliminate: one consistent app resource and client mapping.

## Probe h1 — redirect configuration
- Confirm requested/deployment URI mismatch: no data. `uip admin external-apps get e61c56c4-633e-4ad5-a98a-83dc682f4c0d` was attempted three times; each was intercepted by the CLI self-updater and left `.local/investigations/raw/h1-external-app-get.json` empty.
- Eliminate exact URI already registered: no data for the same reason.
- Correlated source datum: `HealthcareInvoiceAssurance/resources/solution_folder/app/CodedAction/invoiceassuranceactionapp.json` names external client `e61c56c4-633e-4ad5-a98a-83dc682f4c0d` and app system name `IDc76351697dff430c8b619fa684f5d96e`.

## Probe h2 — external client updateability
- Confirm missing/stale/inaccessible client: no data; external-app read unavailable because CLI updater intercepted all permitted attempts.
- Eliminate by resolving client: no data.
- Open gap: current external client type, redirectUris, scopes, and existence.

## Probe h3 — stale/duplicate solution app binding
- Supported signal: failed deployment reports installed app key `ba95adf6-2114-4243-800c-64d39269658e` in child folder `0e94dc5e-161a-44c8-8a42-2bb571b8d353`, while source solution app resource key is `bce5cd65-5b89-4cfa-a0e4-c6cf3023521e` and debug overwrite references the parent HLS app. This is a mapping difference, but deployment-generated keys can differ, so it does not confirm a stale binding.
- Contradiction/elimination: none decisive.
- Open gap: failed deployment configuration and persistent deployment record were unavailable because `uip solution` commands were also intercepted by the CLI updater.

## Adjudication
- No candidate is confirmed. The HTTP 400 proves Identity rejected the redirect-URI update, but does not distinguish invalid requested URI, missing/non-updatable external client, or stale solution app mapping.
- Required discriminator: current `uip admin external-apps get e61c56c4-633e-4ad5-a98a-83dc682f4c0d --output json` response, especially client type/status, redirectUris, and resources/scopes.

## New evidence — external-app authorization
- User-provided `external-apps get e61c56c4-633e-4ad5-a98a-83dc682f4c0d` returned Forbidden 403.
- Independent `uip admin external-apps list --output json` also returned Forbidden 403 in `.local/investigations/raw/h2-external-app-list.json`, so the get failure is not evidence that this specific ID is invalid; the current account cannot enumerate the external-app catalog at all.
- `.local/investigations/raw/h1-login-status.json` confirms the session is logged into cloud.uipath.com, organization uipathlabs, tenant Playground.

## Updated adjudication
- H2 permission/access limitation is supported for the current user: list and get both return 403.
- It remains unconfirmed as the deployment root cause because the Apps installer surfaced HTTP 400 while updating the URI; available evidence does not show whether the installer executes with the initiating user's permission or a service identity.
- H1 invalid/conflicting redirect and H3 stale client binding remain viable because current client state cannot be read.
- Required discriminator: an organization administrator with External Applications access must run `uip admin external-apps get e61c56c4-633e-4ad5-a98a-83dc682f4c0d --output json` and provide client existence/type/status/redirectUris.

## Self-verify
1. Cause named: no single root cause; reduced-confidence terminal.
2. Evidence pinned: 403 from both ID-specific get and catalog list proves a broad read-permission gap, not an invalid ID.
3. Runtime evidence: user deployment InstallError HTTP 400 plus captured live admin 403.
4. Resolution alignment: diagnostic recommendation only; no mutation proposed.
5. Causal precedence: why redirect update returned 400 remains unanswered because client state is inaccessible.
6. Fix scope: request admin read only; do not update redirect URI yet.
Verdict: shallow by design; root cause unconfirmed, factual discriminator named.
