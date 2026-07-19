# Spends marketing site

Static site for **Spends** — published at **https://0xlonewolf.github.io/**

Built with Next.js (static export) from the source in
[`0xlonewolf/Finance`](https://github.com/0xlonewolf/Finance) under `website/`.

## Deploy

From the Finance repo:

```bash
cd website
NEXT_PUBLIC_BASE_PATH="" npm ci && NEXT_PUBLIC_BASE_PATH="" npm run build
# then copy website/out/* into this repo root (preserving .git) and push to main
```

GitHub Pages source: branch `main` / root. `.nojekyll` is committed so `_next/` assets are served.
