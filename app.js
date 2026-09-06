const dbName = "dreamwall-db";
const dbVersion = 1;
const storeName = "entries";

const wall = document.querySelector("#wall");
const emptyState = document.querySelector("#empty-state");
const composer = document.querySelector("#composer");
const form = document.querySelector("#entry-form");
const mediaInput = document.querySelector("#media-input");
const mediaPreview = document.querySelector("#media-preview");
const fileDrop = document.querySelector("#file-drop");
const cropControls = document.querySelector("#crop-controls");
const cropXInput = document.querySelector("#crop-x");
const cropYInput = document.querySelector("#crop-y");
const cropZoomInput = document.querySelector("#crop-zoom");
const captionInput = document.querySelector("#entry-caption");
const entryTemplate = document.querySelector("#entry-template");
const searchPanel = document.querySelector("#search-panel");
const searchInput = document.querySelector("#search-input");

let selectedType = "photo";
let selectedCategory = "other";
let selectedFile = null;
let previewUrl = null;
let editingEntry = null;
let activeCategory = "all";
let activeStatus = "all";
let crop = { aspect: "portrait", x: 50, y: 35, zoom: 1 };

const cropAspects = {
  portrait: "4 / 5",
  square: "1 / 1",
  wide: "16 / 9",
};

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getEntries() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt - a.createdAt));
    request.onerror = () => reject(request.error);
  });
}

async function saveEntry(entry) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, "readwrite").objectStore(storeName).put(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function removeEntry(id) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(storeName, "readwrite").objectStore(storeName).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function chooseLayout(entry) {
  const layouts = [
    { width: "91%", left: "0%", mobileWidth: "94%", mobileLeft: "-2%", rotate: "-1.2deg" },
    { width: "46%", left: "48%", mobileWidth: "59%", mobileLeft: "38%", rotate: "3deg" },
    { width: "71%", left: "7%", mobileWidth: "88%", mobileLeft: "0%", rotate: "-1.6deg" },
    { width: "55%", left: "31%", mobileWidth: "73%", mobileLeft: "18%", rotate: "1.7deg" },
    { width: "76%", left: "13%", mobileWidth: "91%", mobileLeft: "4%", rotate: "-2.4deg" },
  ];
  const number = Number.parseInt(entry.id.replace(/\D/g, "").slice(-4), 10) || 0;
  return layouts[number % layouts.length];
}

function addMedia(element, entry) {
  const frame = element.querySelector(".media-frame");
  if (entry.type === "note") {
    const note = document.createElement("p");
    note.className = "note-text";
    note.textContent = entry.caption;
    frame.append(note);
    return;
  }

  const url = URL.createObjectURL(entry.file);
  if (entry.type === "video") {
    const video = document.createElement("video");
    video.src = url;
    video.preload = "metadata";
    video.playsInline = true;
    frame.append(video);
    const play = document.createElement("button");
    play.className = "video-play";
    play.type = "button";
    play.textContent = "▷";
    play.setAttribute("aria-label", "Play video");
    play.addEventListener("click", () => {
      if (video.paused) { video.play(); play.hidden = true; }
      else { video.pause(); play.hidden = false; }
    });
    video.addEventListener("click", () => play.click());
    video.addEventListener("ended", () => { play.hidden = false; });
  } else {
    const entryCrop = entry.crop || { aspect: "portrait", x: 50, y: 35, zoom: 1 };
    const cropMedia = document.createElement("div");
    cropMedia.className = "crop-media";
    applyCropStyles(cropMedia, entryCrop);
    const image = document.createElement("img");
    image.src = url;
    image.alt = entry.caption || "A memory on my Dreamwall";
    cropMedia.append(image);
    frame.append(cropMedia);
  }
}

function applyCropStyles(target, currentCrop) {
  target.style.setProperty("--crop-aspect", cropAspects[currentCrop.aspect] || cropAspects.portrait);
  target.style.setProperty("--crop-x", `${currentCrop.x}%`);
  target.style.setProperty("--crop-y", `${currentCrop.y}%`);
  target.style.setProperty("--crop-zoom", currentCrop.zoom);
}

function updateCropPreview() {
  const cropMedia = mediaPreview.querySelector(".crop-media");
  if (cropMedia) applyCropStyles(cropMedia, crop);
}

function setCrop(nextCrop) {
  crop = { ...crop, ...nextCrop };
  cropXInput.value = crop.x;
  cropYInput.value = crop.y;
  cropZoomInput.value = crop.zoom;
  document.querySelectorAll(".aspect-option").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.cropAspect === crop.aspect);
  });
  updateCropPreview();
}

function formatCreatedAt(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(new Date(timestamp));
}

function renderEntry(entry) {
  const element = entryTemplate.content.firstElementChild.cloneNode(true);
  const layout = chooseLayout(entry);
  element.classList.add(`entry--${entry.type}`);
  element.dataset.id = entry.id;
  element.style.setProperty("--entry-width", layout.width);
  element.style.setProperty("--entry-left", layout.left);
  element.style.setProperty("--mobile-width", layout.mobileWidth);
  element.style.setProperty("--mobile-left", layout.mobileLeft);
  element.style.setProperty("--entry-rotate", layout.rotate);
  element.querySelector(".entry-created").dateTime = new Date(entry.createdAt).toISOString();
  element.querySelector(".entry-created").textContent = formatCreatedAt(entry.createdAt);
  const achievedBadge = element.querySelector(".achieved-badge");
  achievedBadge.hidden = !entry.achieved;
  element.querySelector(".media-frame").append(achievedBadge);
  element.querySelector(".entry-caption").textContent = entry.type === "note" ? "" : entry.caption || "";
  addMedia(element, entry);

  const menu = element.querySelector(".entry-menu");
  const actions = element.querySelector(".entry-actions");
  const achievedButton = element.querySelector(".toggle-achieved");
  achievedButton.textContent = entry.achieved ? "Mark as unfinished" : "Mark as achieved";
  menu.addEventListener("click", () => { actions.hidden = !actions.hidden; });
  element.querySelector(".edit-entry").addEventListener("click", () => openComposer(entry));
  achievedButton.addEventListener("click", async () => {
    await saveEntry({ ...entry, achieved: !entry.achieved, achievedAt: entry.achieved ? null : Date.now() });
    renderWall(searchInput.value);
  });
  element.querySelector(".delete-entry").addEventListener("click", async () => {
    if (!window.confirm("Remove this piece from your wall?")) return;
    await removeEntry(entry.id);
    renderWall(searchInput.value);
  });
  return element;
}

async function renderWall(query = "") {
  wall.querySelectorAll(".entry").forEach((entry) => entry.remove());
  const entries = await getEntries();
  const normalizedQuery = query.trim().toLowerCase();
  const displayed = entries.filter((entry) => {
    const matchesSearch = entry.caption.toLowerCase().includes(normalizedQuery);
    const matchesCategory = activeCategory === "all" || (entry.category || "other") === activeCategory;
    const matchesStatus = activeStatus === "all" || (activeStatus === "achieved" ? entry.achieved : !entry.achieved);
    return matchesSearch && matchesCategory && matchesStatus;
  });
  displayed.forEach((entry) => wall.append(renderEntry(entry)));
  emptyState.hidden = entries.length !== 0 || Boolean(normalizedQuery);
  if (entries.length && !displayed.length && (normalizedQuery || activeCategory !== "all" || activeStatus !== "all")) {
    emptyState.hidden = false;
    emptyState.querySelector("h2").textContent = activeStatus === "achieved" ? "No achieved dreams here yet." : activeCategory === "all" ? "Nothing here yet." : `Nothing in ${activeCategory} yet.`;
    emptyState.querySelector("p").textContent = normalizedQuery ? "Try a different word, feeling, or place." : "Add a dream here, or return to your free wall.";
  } else {
    emptyState.querySelector("h2").textContent = "Leave a trace of what matters.";
    emptyState.querySelector("p").textContent = "Add a photograph, a small thought, or a moving moment. This wall lives only in this browser.";
  }
}

function setEntryType(type) {
  selectedType = type;
  document.querySelectorAll(".type-option").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.entryType === type);
  });
  const needsMedia = type !== "note";
  fileDrop.hidden = !needsMedia;
  mediaPreview.hidden = !needsMedia || !selectedFile;
  cropControls.hidden = type !== "photo" || !selectedFile;
  captionInput.placeholder = type === "note" ? "A thought worth pinning down…" : "The little thing I don’t want to forget…";
}

function setCategory(category) {
  selectedCategory = category;
  document.querySelectorAll(".category-option").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.entryCategory === category);
  });
}

function showPreview(file) {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  selectedFile = file || null;
  mediaPreview.replaceChildren();
  if (!file) { mediaPreview.hidden = true; return; }
  previewUrl = URL.createObjectURL(file);
  const isVideo = file.type.startsWith("video/");
  const media = document.createElement(isVideo ? "video" : "img");
  media.src = previewUrl;
  if (isVideo) {
    media.controls = true;
    mediaPreview.append(media);
  } else {
    media.alt = "Your selected upload";
    const cropMedia = document.createElement("div");
    cropMedia.className = "crop-media";
    applyCropStyles(cropMedia, crop);
    cropMedia.append(media);
    mediaPreview.append(cropMedia);
  }
  mediaPreview.hidden = false;
  cropControls.hidden = selectedType !== "photo" || isVideo;
}

function resetComposer() {
  form.reset();
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  selectedFile = null;
  previewUrl = null;
  mediaPreview.replaceChildren();
  mediaPreview.hidden = true;
  setCrop({ aspect: "portrait", x: 50, y: 35, zoom: 1 });
  cropControls.hidden = true;
  setEntryType("photo");
  setCategory("other");
  editingEntry = null;
  document.querySelector("#composer-kicker").textContent = "New piece";
  document.querySelector("#save-label").textContent = "Pin it to my wall";
}

function openComposer(entry = null) {
  resetComposer();
  if (entry) {
    editingEntry = entry;
    document.querySelector("#composer-kicker").textContent = "Edit piece";
    document.querySelector("#save-label").textContent = "Save changes";
    captionInput.value = entry.caption || "";
    setEntryType(entry.type);
    setCategory(entry.category || "other");
    setCrop(entry.crop || { aspect: "portrait", x: 50, y: 35, zoom: 1 });
    if (entry.file) showPreview(entry.file);
  }
  composer.showModal();
}

document.querySelectorAll("[data-open-composer]").forEach((button) => button.addEventListener("click", () => openComposer()));
document.querySelector("#add-entry").addEventListener("click", () => openComposer());
document.querySelector("#close-composer").addEventListener("click", () => { composer.close(); resetComposer(); });
document.querySelectorAll(".type-option").forEach((button) => button.addEventListener("click", () => setEntryType(button.dataset.entryType)));
document.querySelectorAll(".category-option").forEach((button) => button.addEventListener("click", () => setCategory(button.dataset.entryCategory)));
document.querySelectorAll(".aspect-option").forEach((button) => button.addEventListener("click", () => setCrop({ aspect: button.dataset.cropAspect })));
cropXInput.addEventListener("input", () => setCrop({ x: Number(cropXInput.value) }));
cropYInput.addEventListener("input", () => setCrop({ y: Number(cropYInput.value) }));
cropZoomInput.addEventListener("input", () => setCrop({ zoom: Number(cropZoomInput.value) }));
mediaInput.addEventListener("change", () => showPreview(mediaInput.files[0]));

["dragenter", "dragover"].forEach((eventName) => fileDrop.addEventListener(eventName, (event) => { event.preventDefault(); fileDrop.classList.add("is-dragging"); }));
["dragleave", "drop"].forEach((eventName) => fileDrop.addEventListener(eventName, (event) => { event.preventDefault(); fileDrop.classList.remove("is-dragging"); }));
fileDrop.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files[0];
  if (!file || !(file.type.startsWith("image/") || file.type.startsWith("video/"))) return;
  showPreview(file);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const caption = captionInput.value.trim();
  if (selectedType === "note" && !caption) { captionInput.focus(); return; }
  if (selectedType !== "note" && !selectedFile) { fileDrop.focus(); return; }
  const existingFile = editingEntry?.file || null;
  await saveEntry({
    ...editingEntry,
    id: editingEntry?.id || crypto.randomUUID(),
    type: selectedType,
    category: selectedCategory,
    caption,
    file: selectedType === "note" ? null : selectedFile || existingFile,
    crop: selectedType === "photo" ? { ...crop } : null,
    createdAt: editingEntry?.createdAt || Date.now(),
  });
  composer.close();
  resetComposer();
  await renderWall(searchInput.value);
});

document.querySelector("#search-toggle").addEventListener("click", () => {
  const open = searchPanel.hidden;
  searchPanel.hidden = !open;
  document.querySelector("#search-toggle").setAttribute("aria-expanded", String(open));
  if (open) searchInput.focus();
});
searchInput.addEventListener("input", () => renderWall(searchInput.value));
document.querySelector("#clear-search").addEventListener("click", () => { searchInput.value = ""; renderWall(); searchInput.focus(); });
document.querySelectorAll(".category-filter").forEach((button) => button.addEventListener("click", () => {
  activeCategory = button.dataset.categoryFilter;
  document.querySelectorAll(".category-filter").forEach((filter) => {
    const active = filter === button;
    filter.classList.toggle("is-active", active);
    filter.setAttribute("aria-pressed", String(active));
  });
  renderWall(searchInput.value);
}));
document.querySelectorAll(".status-filter").forEach((button) => button.addEventListener("click", () => {
  activeStatus = button.dataset.statusFilter;
  document.querySelectorAll(".status-filter").forEach((filter) => {
    const active = filter === button;
    filter.classList.toggle("is-active", active);
    filter.setAttribute("aria-pressed", String(active));
  });
  renderWall(searchInput.value);
}));

renderWall().catch((error) => {
  console.error(error);
  emptyState.hidden = false;
  emptyState.querySelector("h2").textContent = "Your browser needs local storage enabled.";
});
