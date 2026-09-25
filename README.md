# Into the wired

*how do you resolve an identity crisis in the virtual world?*

A single-page interactive explainer of TLS termination, Diffie-Hellman and certificate verification, drawn as technical sheets. Built from a design spec and an HTML prototype, both kept locally (not committed).

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build + typecheck
```

## Deploying (Vercel)

It's a standard Next.js app with no build settings to change. `/api/chain` runs on the Node.js runtime, because it opens real TLS connections.

- **Git:** push this folder to a GitHub repo, then import it at vercel.com/new (framework preset: Next.js).
- **CLI:** run `npx vercel` once to link the project, then `npx vercel --prod`.

No environment variables are required. `NEXT_PUBLIC_SHOW_SLOTS=1` only turns on the asset-slot debug toggle.

## Owner to-dos

- **Article URL:** `ARTICLE_URL` in [lib/config.ts](lib/config.ts) points to `/scripta/tls-offloading-by-a-dummy` on the portfolio. It returned 404 on 25 Sep 2026, so publish the article before sharing the site.
- **Assets:** still missing `card_01–03.webp` and `interlude_wires.webp` in `public/lain/`. Those slots show animated static until the files exist. Originals of everything else live in `source-assets/`, which is gitignored and not deployed.
- **Music rights:** the player serves the full Duvet mp3 publicly once deployed.

## Layout

| Path | What |
|---|---|
| `app/` | layout (fonts, global overlays), page, 404, OG image, `globals.css` tokens/keyframes, `api/chain` live endpoint |
| `components/frame` | Sheet, TitleCard, Rail, TitleBlock |
| `components/layer01…04` | one folder per section (`layer01/geometry.ts` holds the wide and phone drawings) |
| `components/apparition` | asset slots: static canvas, image swap, `flicker()` via ref |
| `components/global` | boot screen, idle overlay, media player, hum, corner controls, footer |
| `lib/motion.ts` | `ease`, `anim`, `sleep`: reduced-motion aware and abortable |
| `lib/chainBuild.ts` | pure builder: TLS probe → simplified `s_client` lines (used by the API and the fixtures) |
| `public/lain`, `public/audio` | processed assets served by the site |
| `source-assets/` | originals (not deployed) |

## Notes

- **The live chain differs from the spec's sample.** github.com serves two intermediates (a cross-signed Sectigo E46). The terminal prints every depth; the diagram draws the one that sealed the leaf and notes the extra. incomplete-chain.badssl.com negotiates P-256, not X25519.
- **CSS Modules scope animation names.** Modules that use shared keyframes repeat them locally.
- **After moving the project, reinstall.** A moved `node_modules` keeps absolute paths that break `next/font` under Turbopack. Run `rm -rf node_modules .next && npm ci`.
