(() => {
  "use strict";

  const parts = [
    "assets/thumb-parts/part1.txt",
    "assets/thumb-parts/part2.txt",
    "assets/thumb-parts/part3.txt"
  ];

  async function loadThumbnail() {
    const images = [...document.querySelectorAll("[data-dewify-seller-thumb]")];
    if (!images.length) return;

    try {
      const chunks = await Promise.all(parts.map(async (path) => {
        const response = await fetch(path, { credentials: "omit" });
        if (!response.ok) throw new Error("Thumbnail image part failed: " + path);
        return (await response.text()).trim();
      }));

      const base64 = chunks.join("");
      if (base64.length !== 8608 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+$/.test(base64)) {
        throw new Error("Thumbnail image data is incomplete.");
      }

      const imageUrl = "data:image/webp;base64," + base64;
      images.forEach((image) => {
        image.src = imageUrl;
        image.dataset.thumbnailLoaded = "true";
      });
    } catch (error) {
      console.warn("DEWIFY thumbnail fallback is being used:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadThumbnail, { once: true });
  } else {
    loadThumbnail();
  }
})();