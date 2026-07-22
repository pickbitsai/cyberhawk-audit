# CyberHawk Demo Video

The repository includes a self-contained, captioned 16:9 product demo at `demo/index.html`. It uses sanitized aggregate measurements from the July 22, 2026 local run and never displays repository names, source paths, or canary tokens.

## Story

The 30-second cut follows the complete workflow:

1. Point CyberHawk at a local folder.
2. Discover dependency manifests without executing the project.
3. Match installed versions to structured OSV advisories.
4. Evaluate lockfile evidence under the zero-trust policy.
5. Turn one finding into a typed, human-approved remediation request.
6. Rescan until the finding is verified closed and record unexpected canary handling.
7. Review the persistent local dashboard and open-source call to action.

## Preview

```powershell
npm run demo:serve
```

Open `http://127.0.0.1:8790/demo/`. Add `?autoplay=0` to stop automatic scene changes, then call `showCyberHawkScene(0)` through `showCyberHawkScene(6)` from the browser console for still capture.

## Render

Install the development dependency, then render the captioned WebM and poster:

```powershell
npm install
npm run demo:video
```

Outputs:

- `demo/output/cyberhawk-demo.webm`
- `demo/output/cyberhawk-demo-poster.png`

The video is silent by design so it works muted on a landing page. The captions carry the complete story.

## Optional voiceover

> Most of our code does not live in one perfect repository. Point CyberHawk at a folder and it discovers the dependency surfaces without installing or executing the project. Structured OSV advisories show what is vulnerable. The zero-trust gate separates exact locked artifacts from incomplete evidence and active package scripts. Findings become typed remediation requests, not free-form commands. A fix stays pending until repeated complete scans prove it absent, while defensive canaries record unexpected automation. The result is a private, persistent vulnerability-response dashboard you can run locally. CyberHawk is open source.

## Publishing

Use the `<video>` element with `controls`, `muted`, `playsinline`, and `preload="metadata"`. Do not claim the controlled canary hit was an attack. Keep the measured-run date beside the results and link to the open-source repository.
