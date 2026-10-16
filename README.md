# fmatches-runner-scripts

Figma Plugin API scripts for the fmatches web redesign.

- `latest.js` — the script the fmatches Runner plugin fetches and runs. First line is always a step marker, e.g. `// step 59 · ticker variants`.
- `plugin/` — the fmatches Runner plugin source (manifest.json, code.js, ui.html).

Runner fetch URL:
`https://raw.githubusercontent.com/denizdumbak/fmatches-runner-scripts/main/latest.js`

The plugin converts this raw URL to the GitHub contents API (no CDN cache, always the latest commit) and falls back to raw only if the API fails; the status line says which source was used.
