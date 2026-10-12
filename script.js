"use strict";

(() => {
  const config = window.COSMO_CONFIG || {};
  const isHttps = value => {
    try { return new URL(value).protocol === "https:"; } catch { return false; }
  };
  if (isHttps(config.codeUrl)) {
    document.querySelectorAll("[data-code-link]").forEach(link => { link.href = config.codeUrl; });
  }
  if (isHttps(config.paperUrl)) {
    const paper = document.getElementById("paper-link");
    paper.href = config.paperUrl;
    paper.target = "_blank";
    paper.rel = "noopener noreferrer";
    paper.removeAttribute("aria-disabled");
    paper.removeAttribute("tabindex");
    paper.querySelector(".soon").remove();
    paper.classList.add("available");
    document.getElementById("paper-note").textContent = "The preprint is available via the Paper button above.";
  }

  const videoId = /^[\w-]{11}$/.test(config.videoId || "") ? config.videoId : "LvttKb8bCho";
  document.querySelectorAll("[data-video-link]").forEach(link => {
    link.href = `https://www.youtube.com/watch?v=${videoId}`;
  });
  document.querySelectorAll("[data-video-player] .video-poster").forEach(button => {
    button.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
      iframe.title = "CoSMO: Open-World Safe Robot Navigation — research demonstration";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      button.closest("[data-video-player]").replaceChildren(iframe);
    });
  });

  let toastTimer;
  function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 3000);
  }
  document.getElementById("copy-citation").addEventListener("click", async () => {
    const citation = document.getElementById("bibtex").textContent.trim();
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(citation); copied = true; } catch { /* use selection fallback */ }
    }
    if (!copied) {
      const field = document.createElement("textarea");
      field.value = citation;
      field.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(field);
      field.select();
      try { copied = document.execCommand("copy"); } catch { /* manual selection below */ }
      field.remove();
    }
    if (copied) {
      showToast("Citation copied to clipboard.");
    } else {
      const range = document.createRange();
      range.selectNodeContents(document.getElementById("bibtex"));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      showToast("Citation selected. Press Ctrl+C / ⌘C to copy.");
    }
  });

  const dialog = document.getElementById("figure-dialog");
  let lastFigure;
  document.querySelectorAll(".figure-zoom").forEach(button => {
    button.addEventListener("click", () => {
      lastFigure = button;
      const image = document.getElementById("figure-image");
      image.src = button.dataset.image;
      image.alt = button.querySelector("img").alt;
      document.getElementById("figure-original").href = button.dataset.image;
      document.getElementById("figure-caption").textContent = button.dataset.caption;
      dialog.showModal();
      document.body.style.overflow = "hidden";
    });
  });
  document.getElementById("close-figure").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.style.overflow = "";
    if (lastFigure) lastFigure.focus({ preventScroll: true });
  });

})();
