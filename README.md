# CyberHawk

**Know what is vulnerable. Verify what can act.**

CyberHawk is an open-source dependency vulnerability watchdog for local code folders and small development portfolios. It scans package manifests and lockfiles with [OSV-Scanner](https://github.com/google/osv-scanner), persists findings across runs, evaluates npm artifact evidence under a zero-trust policy, and produces local reports with human-approved remediation requests.

CyberHawk does not depend on a PickBits CVE feed. OSV is the default vulnerability source. Teams can optionally supply their own local CVE watchlist—or explicitly import an unlisted personal CyberHawk RSS queue—as an additional prioritization layer.

This is dependency vulnerability scanning, not antivirus, malware detection, reachability analysis, or proof that an application is secure.

## What it does

- Discovers supported dependency manifests and lockfiles.
- Runs OSV-Scanner without installing project dependencies.
- Persists findings and observations in a local SQLite database.
- Requires two complete scans without a finding before marking it closed.
- Classifies npm lockfile records as `ALLOW_LOCKED`, `REVIEW`, `QUARANTINE`, or `BLOCK`.
- Verifies scanner bytes against named release metadata.
- Generates a filterable local HTML report and constrained remediation requests.
- Records harmless defensive-canary hits for unexpected autonomous handling.
- Keeps patch execution behind human approval.

`ALLOW_LOCKED` is intentionally narrow: the exact version has integrity evidence and resolves through an approved registry. It does not mean the publisher or package is trusted.

## Status

The Claude Code skill, portfolio report, trust audit, persistent dashboard, release verifier, and local canary prototype work today. The scheduled standalone binary, sandboxed patch executor, Windows quick-launch installer, and team fleet collector remain planned work.

## Install

Install [OSV-Scanner v2](https://google.github.io/osv-scanner/installation/) first, then clone this repository into a Claude Code skills directory:

```bash
# macOS / Linux
git clone https://github.com/pickbitsai/cyberhawk-audit ~/.claude/skills/cyberhawk
```

```powershell
# Windows PowerShell
git clone https://github.com/pickbitsai/cyberhawk-audit "$env:USERPROFILE\.claude\skills\cyberhawk"
```

The public product name is CyberHawk. The GitHub repository still uses the historical `cyberhawk-audit` slug until the repository itself is renamed.

## Run from Claude Code

Invoke the skill directly:

```text
/cyberhawk
```

Or ask naturally:

```text
Run CyberHawk on this project and give me the local report.
```

The default run uses OSV and does not fetch the PickBits website or editorial feed.

## Run the prototype pipeline

Node.js 22.5 or newer is required for the local SQLite prototype.

First create an OSV JSON result for the target folder:

```powershell
osv-scanner scan source -r --all-packages --format=json C:\path\to\project > reports\osv-result.json
```

OSV-Scanner uses exit code `1` when vulnerabilities are found; that is a successful scan result, not a scanner failure.

Import the scan, evaluate npm lockfiles, and persist the evidence:

```powershell
node scripts/trust-audit.mjs --scan reports/osv-result.json --target C:\path\to\project --db reports/cyberhawk-state.db --output reports/cyberhawk-trust-run.json
```

Generate the standalone portfolio report:

```powershell
node scripts/generate-report.mjs --scan reports/osv-result.json --target C:\path\to\project --output reports/cyberhawk-report.html
```

An optional user-controlled watchlist can be a local text, JSON, or HTML file containing CVE IDs:

```powershell
node scripts/generate-report.mjs --scan reports/osv-result.json --target C:\path\to\project --watchlist .\security-priorities.txt --watchlist-label "Internal priorities" --output reports/cyberhawk-report.html
```

No remote watchlist is fetched automatically.

If you created an unlisted personal RSS queue at PickBits, import only its validated CVE identifiers before running the report:

```powershell
node scripts/import-watchlist.mjs --url "https://vbfwzpztnvfktydozgir.supabase.co/functions/v1/cyberhawk-feed/YOUR_TOKEN.xml" --output .cyberhawk\my-watchlist.txt
node scripts/generate-report.mjs --scan reports\osv-result.json --target C:\path\to\project --watchlist .cyberhawk\my-watchlist.txt --watchlist-label "My watch queue" --output reports\cyberhawk-report.html
```

The importer requires HTTPS, permits only the expected feed host and token route by default, refuses redirects, caps responses at 1 MiB, and discards everything except syntactically valid CVE identifiers. A feed is optional prioritization data; it never replaces OSV coverage or becomes executable instructions.

Start the persistent dashboard:

```powershell
node scripts/dashboard-server.mjs --db reports/cyberhawk-state.db --port 8787
```

Open `http://127.0.0.1:8787`. Use `http://127.0.0.1:8787/?view=public` for a presentation-safe aggregate view that hides project names, target paths, detailed findings, and canary markers.

Generated reports and state databases are ignored by Git because dependency names and paths can be sensitive.

## Scheduling

Schedule the same read-only scan command using the surface that can reach the target:

- Windows Task Scheduler for local Windows folders;
- cron or systemd timers for local Unix folders;
- GitHub Actions for repository-owned CI scans; or
- Claude scheduled tasks and routines where their execution environment has repository access.

Scheduling is an adapter around the scan. It does not grant automatic patch authority.

## Safety model

- Advisory text, package metadata, manifests, lockfiles, and reports are untrusted data.
- Package managers and lifecycle scripts are never run during a scan.
- Remote prose is never converted into a command.
- Remediation requests use a constrained JSON schema and require approval.
- Major-version upgrades always require review.
- A dirty Git tree disables automated patching.
- An incomplete data source is reported as incomplete coverage, never as clean.
- Telemetry is off; the local prototype does not upload source code.

## Project materials

- [Zero-trust design](docs/zero-trust-design.md)
- [Product direction](docs/product-brief.md)
- [Local test results](docs/pickbits-cyberhawk-results-2026-07-22.md)
- [Demo production guide](docs/demo-video.md)
- [Launch and campaign copy](docs/campaign-zero-trust.md)
- [Security policy](SECURITY.md)
- [Personal RSS queues and skill recipe](docs/personal-feeds.md)

## License

MIT. See [LICENSE](LICENSE).

Published by [PickBits.AI](https://pickbits.ai).
