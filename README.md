# cyberhawk-audit

A [Claude Code](https://claude.com/claude-code) skill that audits your project against the current week's [PickBits CyberHawk](https://pickbits.ai/cyberhawk/) CVE digest.

It fetches the latest digest, scans your repo with [`osv-scanner`](https://github.com/google/osv-scanner), cross-references the results, and proposes version-bump patches for any package that matches a CVE in this week's list.

## Install

```bash
claude skill add pickbitsai/cyberhawk-audit
```

## Use

In any project:

```
/cyberhawk-audit
```

Or just ask Claude Code to "run a cyberhawk audit" / "check this repo against the latest CVEs".

## Requirements

- [Claude Code](https://claude.com/claude-code)
- [`osv-scanner`](https://github.com/google/osv-scanner) on your PATH
  - macOS/Linux: `brew install osv-scanner`
  - Windows (Scoop): `scoop install osv-scanner`
  - Or download from the [releases page](https://github.com/google/osv-scanner/releases)

## What it does

1. Fetches `https://pickbits.ai/cyberhawk/latest.json` — the current week's digest.
2. Detects your project's lockfiles (npm, pnpm, yarn, pip, poetry, go, cargo, maven, bundler).
3. Runs `osv-scanner` against the source tree.
4. Reports CVEs in the intersection — i.e., vulnerabilities in your repo that appear in this week's digest.
5. On confirmation, creates a branch and applies safe (non-major) version bumps. Never pushes.

## Guardrails

- Never applies a major version bump without confirmation.
- Never modifies source code — only manifests + lockfiles.
- Never pushes a branch.
- Stops if the digest fetch fails (no stale-data fallback).

## License

MIT. See [LICENSE](LICENSE).

## About

Published by [PickBits.AI](https://pickbits.ai). New digest every Friday.
