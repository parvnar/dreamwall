# Dreamwall

A private, local-first digital dream board. It has no account, server, or paid dependency: entries and uploaded media are stored in the browser's IndexedDB on the device where you add them.

## Run it locally

Open `index.html` in a modern browser. For the most reliable local-storage behavior, serve the folder with a small local web server, for example:

```powershell
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## What it does

- Add a photo with an optional one-line handwritten caption
- Frame each photo before saving: choose portrait, square, or wide, then move and zoom the crop
- Add a video with an optional caption
- Pin a text-only thought
- Drag and drop media into the composer
- Categorize dreams into Places, Experiences, Collectibles, Tech, or Other
- Start on the free wall, then filter by category
- Search captions, edit text, and mark a dream as achieved with an on-photo achievement stamp
- Filter every category by All, To achieve, or Achieved
- See the date and time each dream was first pinned
- Remove an item from the wall
- Keep all content local to the current browser profile

## Important privacy and backup note

Clearing browser site data, changing browsers, or using another device will not carry the wall with you. There is intentionally no cloud synchronization yet. Before any hosting or multi-device version, the next useful addition is an export/import backup feature.
