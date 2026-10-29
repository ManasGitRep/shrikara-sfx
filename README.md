# Shrikara SFX · Website

Premium wedding and event special effects, based in Indore.
Instagram: [@shrikara_sfx](https://www.instagram.com/shrikara_sfx/)

This repository holds the **client preview**, with three versions of the site:

| Path | Version |
|---|---|
| `/` | Preview page for choosing a version |
| `/version-1/` | Classic: calm, elegant reveals |
| `/version-2/` | Cinematic: word-by-word headlines, gold ornaments, pinned services story |
| `/version-3/` | Cinematic Plus: version 2 plus an opening firework, four sparkular fountains and more intense effects |

The site is plain HTML, CSS and JavaScript, with no build step and no libraries.

## Deploy on Vercel

1. Go to vercel.com, choose **Add New → Project**, and import this repository.
2. Set **Framework Preset** to **Other**. Leave the build command and output directory empty.
3. Click **Deploy**.

`vercel.json` makes `/version-1` redirect to `/version-1/`, so each version's files load correctly.

## Editing

Each version folder is a complete site:

- `js/config.js`: booking contacts, map embed and budget options
- `index.html`: all page text and gallery items
- `assets/work/`: put real event photos here (see the comments in `index.html`)

## Before the real launch

- Keep only the version the client chooses, and move its files to the repository root.
- Remove the `<meta name="robots" content="noindex, nofollow">` line from its `index.html` so Google can list the site.
- Replace `assets/img/logo.png` with the original high-resolution logo.
