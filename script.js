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
    paper.classList.replace("button-paper", "button-outline");
    document.getElementById("paper-note").textContent = "The preprint is available via the Paper button above.";
  }

  const videoId = /^[\w-]{11}$/.test(config.videoId || "") ? config.videoId : "LvttKb8bCho";
  document.querySelectorAll("[data-video-link]").forEach(link => {
    link.href = `https://www.youtube.com/watch?v=${videoId}`;
  });
  document.getElementById("play-video").addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`;
    iframe.title = "CoSMO: Open-World Safe Robot Navigation — research demonstration";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    document.getElementById("video-shell").replaceChildren(iframe);
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

  // This is an illustrative map, not measured paper data. The research figures
  // and result tables below contain the actual experimental evidence.
  const canvas = document.getElementById("navigation-map");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const panel = document.querySelector(".map-panel");
  let mode = "cosmo";
  let frame = null;
  let visible = true;
  let previous = 0;
  let time = 0;
  let cssWidth = 560;
  let cssHeight = 358;
  const paths = {
    cosmo: [[68,300],[120,282],[165,264],[202,230],[218,180],[235,125],[256,90],[287,66],[330,54],[395,57],[470,67]],
    baseline: [[68,300],[130,250],[194,206],[260,172],[318,142],[367,114],[420,89],[470,67]]
  };
  const hazards = [{ x:318,y:142,r:58 }, { x:370,y:245,r:45 }];
  const wallRects = [[36,34,147,11],[36,34,10,191],[36,324,206,10],[169,34,12,91],[49,200,85,10],[112,102,69,10],[274,286,11,48],[274,322,217,10],[482,113,10,220],[410,34,82,11],[482,34,10,53],[205,286,81,10],[431,191,61,10]];
  const furniture = [[84,72,52,30],[76,129,32,39],[332,198,51,34],[416,252,37,43],[215,45,22,20],[407,117,44,26],[277,222,25,26]];
  let seed = 42;
  function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
  const cells = [];
  for (let x = 39; x < 492; x += 7) {
    for (let y = 37; y < 333; y += 7) {
      const isWall = wallRects.some(([a,b,w,h]) => x >= a && x <= a+w && y >= b && y <= b+h);
      const isFurniture = furniture.some(([a,b,w,h]) => x >= a && x <= a+w && y >= b && y <= b+h);
      if (isWall || isFurniture || random() < .24) cells.push({x,y,wall:isWall,furniture:isFurniture,alpha:.11+random()*.31,offset:random()});
    }
  }
  function polyline(points) {
    ctx.beginPath();
    points.forEach(([x,y],index) => index ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  }
  function pointOnPath(points, progress) {
    const distances = points.slice(1).map((p,i) => Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
    let remaining = progress * distances.reduce((a,b) => a+b,0);
    for (let i = 0; i < distances.length; i++) {
      if (remaining <= distances[i] || i === distances.length-1) {
        const t = Math.min(1,remaining/distances[i]);
        return {x:points[i][0]+(points[i+1][0]-points[i][0])*t,y:points[i][1]+(points[i+1][1]-points[i][1])*t,angle:Math.atan2(points[i+1][1]-points[i][1],points[i+1][0]-points[i][0])};
      }
      remaining -= distances[i];
    }
  }
  function draw() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,cssWidth,cssHeight);
    ctx.scale(cssWidth/530,cssHeight/358);
    ctx.strokeStyle = "#aecda208";
    ctx.lineWidth = .7;
    for (let x = 15; x <= 530; x += 25) { ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,358);ctx.stroke(); }
    for (let y = 9; y <= 358; y += 25) { ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(530,y);ctx.stroke(); }
    cells.forEach(cell => {
      ctx.fillStyle = cell.wall ? `rgba(173,199,167,${cell.alpha+.17})` : cell.furniture ? `rgba(163,184,152,${cell.alpha+.03})` : `rgba(153,183,137,${cell.alpha*.28})`;
      ctx.fillRect(cell.x,cell.y,cell.wall ? 4 : 3,cell.wall ? 4 : 3);
    });
    hazards.forEach((hazard,index) => {
      const radius = mode === "cosmo" ? hazard.r : 17;
      const gradient = ctx.createRadialGradient(hazard.x,hazard.y,0,hazard.x,hazard.y,radius);
      gradient.addColorStop(0,"#f2a87925");gradient.addColorStop(.75,"#f2a87912");gradient.addColorStop(1,"#f2a87903");
      ctx.fillStyle = gradient;
      ctx.beginPath();ctx.arc(hazard.x,hazard.y,radius,0,Math.PI*2);ctx.fill();
      ctx.setLineDash([3,5]);ctx.lineDashOffset=-time*6;ctx.strokeStyle=mode === "cosmo" ? "#e6a37a90" : "#e6a37a55";ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(hazard.x,hazard.y,radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle="#e1a579";ctx.beginPath();ctx.arc(hazard.x,hazard.y,4,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#e1a57980";ctx.beginPath();ctx.arc(hazard.x,hazard.y,9,0,Math.PI*2);ctx.stroke();
      if(index === 0){ctx.strokeStyle="#e1a5793b";ctx.beginPath();ctx.arc(hazard.x,hazard.y,mode==="cosmo"?41:12,0,Math.PI*2);ctx.stroke();}
    });
    const path = paths[mode];
    polyline(path);ctx.strokeStyle=mode==="cosmo"?"#d8f88313":"#e9b69712";ctx.lineWidth=11;ctx.lineJoin="round";ctx.stroke();
    polyline(path);ctx.strokeStyle=mode==="cosmo"?"#d8f883":"#e9b697";ctx.lineWidth=1.8;ctx.lineJoin="round";ctx.stroke();
    polyline(path);ctx.setLineDash([4,14]);ctx.lineDashOffset=-time*18;ctx.strokeStyle=mode==="cosmo"?"#f2ffd2":"#ffe4d2";ctx.lineWidth=2.3;ctx.stroke();ctx.setLineDash([]);
    const robot = pointOnPath(path, motion.matches ? .28 : (time*.072)%1);
    ctx.save();ctx.translate(robot.x,robot.y);ctx.rotate(robot.angle);
    ctx.shadowColor="#d8f883";ctx.shadowBlur=14;ctx.fillStyle=mode==="cosmo"?"#e6ffa9":"#ffd3b4";
    ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-4,-5);ctx.lineTo(-2,0);ctx.lineTo(-4,5);ctx.closePath();ctx.fill();ctx.restore();
    ctx.strokeStyle="#d8f88370";ctx.lineWidth=1;ctx.beginPath();ctx.arc(68,300,8,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle="#d8f883";ctx.beginPath();ctx.arc(68,300,3,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle="#d8f883";ctx.save();ctx.translate(470,67);ctx.rotate(Math.PI/4);ctx.strokeRect(-5,-5,10,10);ctx.restore();
    ctx.font="8px monospace";ctx.fillStyle="#aabda1";ctx.fillText("START",48,321);ctx.fillStyle="#d8f883";ctx.fillText("GOAL",454,47);
    ctx.font="7px monospace";ctx.fillStyle="#6f896f";ctx.fillText("Y ↑",17,19);ctx.fillText("X →",477,345);
    if(mode === "baseline") {
      ctx.strokeStyle="#faab7c";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(306,130);ctx.lineTo(330,154);ctx.moveTo(330,130);ctx.lineTo(306,154);ctx.stroke();
    }
  }
  function animate(timestamp) {
    frame = null;
    if (!visible || document.hidden || motion.matches) return;
    if (previous) time += Math.min((timestamp-previous)/1000,.06);
    previous = timestamp;
    draw();
    frame=requestAnimationFrame(animate);
  }
  function resume() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;previous = 0;
    draw();
    if (visible && !document.hidden && !motion.matches) frame=requestAnimationFrame(animate);
  }
  function resize() {
    const box = canvas.getBoundingClientRect();
    cssWidth=box.width;cssHeight=box.height;
    const dpr=Math.min(window.devicePixelRatio || 1,2);
    canvas.width=Math.round(cssWidth*dpr);canvas.height=Math.round(cssHeight*dpr);
    resume();
  }
  document.querySelectorAll("[data-mode]").forEach(button => {
    button.addEventListener("click", () => {
      mode=button.dataset.mode;time=0;
      document.querySelectorAll("[data-mode]").forEach(item => {
        const active=item.dataset.mode===mode;
        item.classList.toggle("active",active);item.setAttribute("aria-pressed",String(active));
      });
      const status=document.getElementById("map-status");
      status.textContent=mode==="cosmo"?"SEMANTIC CLEARANCE":"HAZARD ZONE ENTERED";
      status.style.color=mode==="cosmo"?"":"#f2b68d";
      canvas.setAttribute("aria-label", mode==="cosmo"?"Illustrative CoSMO route around semantic hazard clearance regions":"Illustrative geometry-only route entering a semantic hazard region");
      resume();
    });
  });
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries => { visible=entries[0].isIntersecting;resume(); },{threshold:.05}).observe(panel);
  document.addEventListener("visibilitychange",resume);
  motion.addEventListener("change",resume);
  resize();
})();
