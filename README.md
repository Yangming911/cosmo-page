# CoSMO project page

Standalone paper website for **CoSMO: Conformal Semantic Mapping for Open-World Safe Robot Navigation**, CoRL 2026.

This is a separate website repository. It does not change the personal homepage or the CoSMO code repository. All website files and images are local; YouTube loads only after the visitor clicks Play. No Node.js dependencies or build step are required.

## Preview

Run from this directory:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. Opening `index.html` directly also works; serving over HTTP gives more reliable clipboard support.

## Publish as an independent repository

Create an empty public GitHub repository named `cosmo-page` under `Yangming911`. Leave README, license, and .gitignore unchecked because the local repository already contains files.

```bash
git push -u origin main
```

If you downloaded the ZIP instead of using the existing local repository, initialize it before pushing:

```bash
git init -b main
git add .
git commit -m "Add CoSMO project page"
git remote add origin git@github.com:Yangming911/cosmo-page.git
git push -u origin main
```

In the new repository, open **Settings → Pages → Build and deployment → Source**, and choose **GitHub Actions**. If the initial workflow ran before Pages was enabled, open **Actions → Deploy CoSMO project page → Run workflow**.

The expected address after a successful deployment is:

```text
https://yangming911.github.io/cosmo-page/
```

The publication workflow follows [GitHub's Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). It publishes only website files and assets.

If you choose a different repository name or account, update the canonical URL and Open Graph image URL in `index.html`.

## Add the paper link later

Edit `site-config.js`:

```js
window.COSMO_CONFIG = Object.freeze({
  paperUrl: "https://arxiv.org/abs/YOUR_PAPER_ID",
  codeUrl: "https://github.com/Yangming911/CoSMO",
  videoId: "LvttKb8bCho"
});
```

Until `paperUrl` is set, the paper button is visibly unavailable and marked **Coming soon**. A valid HTTPS link automatically activates it. Update the preliminary BibTeX when final publication metadata is available.

## Content and assets

Authors, affiliations, method descriptions, and experiment results follow `../paper/camera_ready.tex`. Figures are optimized copies of the supplied paper figures. The page uses a white academic layout with a centered paper title, authors, abstract, method, results, and citation. Pastel accents follow the blue, green, apricot, and lavender colors in the paper figures.

The site includes the full six-method benchmark table so the safety–success tradeoff remains visible. MP3D results, the 330-episode ablation split, and the 30 real-world trials are distinguished in the page.

Manrope and IBM Plex Mono are self-hosted; font license files are included in `assets/`.

