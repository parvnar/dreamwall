# Dreamwall

> A private, local-first digital dream board for collecting the places, experiences, objects, and ideas worth working toward.

Dreamwall is an experimental personal-product concept: part scrapbook, part vision board, and deliberately not a productivity dashboard. It uses an editorial, freeform wall rather than a rigid card grid, allowing each dream to feel more like a memory or a pinned keepsake.

## Why I built it

I am an MBA student exploring how product thinking, design judgment, and AI-assisted development can turn an idea into a usable digital experience. Dreamwall is a hobby project and a practical experiment in defining a product direction, iterating from visual references, and working confidently with modern web code alongside AI.

## What it demonstrates

- Product concept development from an initial visual prototype
- A deliberately non-standard, editorial interface for a personal-use product
- AI-assisted frontend development and iterative debugging
- Local-first thinking for private personal content
- Clear UX decisions around content creation, editing, filtering, and achievement tracking

## Features

- Add photos, videos, or text-only thoughts
- Write a short personal caption for each dream
- Choose a photo crop: portrait, square, or wide
- Move and zoom the image focal point so the saved wall matches the preview
- Organize entries into Places, Experiences, Collectibles, Tech, or Other
- Start on the free wall, then filter by category and status
- Mark a dream as achieved with an on-image achievement stamp
- Edit captions, review creation time, search entries, or remove an item
- Keep all entries and uploaded media in the current browser profile

## Built with

- Semantic HTML
- Modern CSS, including responsive layouts and custom visual treatments
- Vanilla JavaScript
- IndexedDB for local browser storage
- Google Fonts: Playfair Display, Inter, Caveat, and DM Mono

## Run locally

Open `index.html` in a modern browser. For the most reliable local-storage behavior, serve the folder with a small local web server:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Privacy

Dreamwall has no account, server, analytics, or cloud sync. Photos, videos, and entries remain in IndexedDB within the browser profile where they were added. Clearing browser site data, changing browsers, or switching devices removes access to that local wall.

This repository contains the application source code only. No personal entries or uploaded media are committed.

## Project status

Dreamwall is an actively evolving personal project. Planned explorations include backup/export tools, a more personalized opening message, and a private hosted version for personal use.
