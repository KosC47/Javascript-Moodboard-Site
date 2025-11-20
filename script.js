"use strict";

/**
 * script.js
 * ----------
 * This script controls the Moodboard page.
 * It:
 *  - Builds a grid of random images from Picsum
 *  - "Generate" button to create a new moodboard
 *  - "Toggle Gap" button to toggle spacing between images
 *  - Regenerates the board when the window is resized
 */

//  The element that contains all the moodboard tiles, the overlay that is shown while the images are generating and the ratio so i dont request huge images.
const board = document.getElementById("board");
const veil = document.getElementById("veil");
const dpr = Math.min(window.devicePixelRatio || 1, 2);

// unique seed so Picsum returns different images
function seed() {
  return (
    (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)) +
    "-" +
    Date.now()
  );
}

// Estimate current column width in CSS pixels. Reads CSS variable cols and the actual column gap, then calculates how wide each column is based on the width
function columnWidthPx(container) {
  const cols =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--cols")
    ) || 6;
  const gap = parseFloat(getComputedStyle(container).columnGap) || 0;
  const total = container.clientWidth;
  return (total - gap * (cols - 1)) / cols;
}

// build a Picsum URL sized for this column width and chosen height, This makes sure we only request images at the size we actually want to show
function imageUrl(colWidthCssPx, heightCssPx) {
  const W = Math.max(1, Math.round(colWidthCssPx * dpr));
  const H = Math.max(1, Math.round(heightCssPx * dpr));
  return `https://picsum.photos/seed/${seed()}/${W}/${H}`;
}

// preload one image, returns promise then resolves with img element when ready was also
// was also an attempt to improve the render smoothness and just overall quickness with decode
function preload(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        if (img.decode) await img.decode();
      } catch {}
      resolve(img);
    };
    img.onerror = reject;
    img.src = src;
  });
}

// Main generator
/**
 * Generates the entire moodboard.
 * Steps:
 *  - Marks the board as busy and shows the veil
 *  - Calculates column width
 *  - Builds a list of image URLs with different heights
 *  - Preloads images
 *  - Wraps each image in a <figure class="item"> and adds it to the board
 *
 */
async function generateBoard(count = 80) {
  if (!board || !veil) return;

  // show veil + mark busy
  board.setAttribute("aria-busy", "true");
  veil.classList.add("show");

  const frag = document.createDocumentFragment();
  const colW = columnWidthPx(board);

  // a few different aspect ratios
  const ratios = [0.75, 0.85, 1.0, 1.15, 1.3, 1.5, 1.65];

  // build URLs first, then preload all images
  const urls = Array.from({ length: count }, () => {
    const h = colW * ratios[Math.floor(Math.random() * ratios.length)];
    return imageUrl(colW, h);
  });

  let images = [];
  try {
    images = await Promise.all(urls.map(preload));
  } catch (e) {
    console.warn("Some images failed to preload:", e);
  }

  // put images into <figure class="item"> wrappers
  images.forEach((img) => {
    const fig = document.createElement("figure");
    fig.className = "item";
    img.alt = ""; // decorative
    img.loading = "lazy";
    fig.appendChild(img);
    frag.appendChild(fig);
  });

  // swap content at once, then fade back in
  board.classList.add("dim"); // fade board under the veil
  board.innerHTML = "";
  board.appendChild(frag);

  // remove veil and dim
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      board.classList.remove("dim");
      veil.classList.remove("show");
      board.setAttribute("aria-busy", "false");
    });
  });
}

// Events
/**
 * Hook up the "Generate" button so it rebuilds the board when clicked.
 */
document
  .getElementById("regen")
  .addEventListener("click", () => generateBoard());

/**
 * Hook up the "Toggle Gap" button.
 * It toggles the CSS variable then regenerates the board.
 */

document.getElementById("toggleGap").addEventListener("click", () => {
  // toggle between 0px and 4px gutters, then regenerate
  const root = document.documentElement.style;
  const current = getComputedStyle(document.documentElement)
    .getPropertyValue("--gutter")
    .trim();
  root.setProperty("--gutter", current === "0px" ? "4px" : "0px");
  generateBoard();
});

// rebuild on resize
let t;
addEventListener("resize", () => {
  clearTimeout(t);
  t = setTimeout(() => generateBoard(), 120);
});

// first load
generateBoard();
