---
name: publish-page
description: Publish a standalone HTML reference page (research lists, guides, lookup tools, often first made as a claude.ai artifact) to Zak's data-pages GitHub Pages site under /data-pages/<slug>/. Use when Zak asks to add, deploy, host or publish an HTML page or artifact to his site / GitHub Pages, or to update or remove one already here.
---

# Publish a page to zakpruitt.github.io/data-pages/

This repo (`zakpruitt/data-pages`) is a GitHub Pages project site, served from `master` at the repo root,
at https://zakpruitt.github.io/data-pages/. It's separate from the portfolio repo (`zakpruitt.github.io`),
which this workflow never touches.

```
_publish.py            # wraps a page + rebuilds the index
index.html             # GENERATED list of all pages; never hand-edit
.nojekyll              # serve files as-is (no Jekyll build)
<slug>/index.html      # one folder per page -> https://zakpruitt.github.io/data-pages/<slug>/
```

## What these pages are

Self-contained, single-file HTML pages: research compilations and lookup tools Zak uses in real life
(example: `chicago2-voice-guide`, a searchable voice-role list for convention guests).
They are public but marked `noindex` so they don't show up in search.
They must work as static files: inline CSS/JS/data, fonts from Google Fonts, scripts only from public CDNs,
no server, no build step, no `window.claude` runtime APIs.

## Steps

1. **Get the source HTML.**
   - If it's a claude.ai artifact from this session, use the local file that was published.
   - If it's an artifact link, read it with the Artifact tool (`action: "read"`) and use the saved file.
   - If building a new page, follow the `artifact-design` guidance and write it as an artifact-style fragment
     (a `<title>`, `<link>`/`<style>` tags, then body content). Full documents also work.
   - Check it has no `window.claude` calls or artifact-only capabilities. If it does, tell Zak which features
     won't work on GitHub Pages before continuing.
2. **Pick a slug**: lowercase words joined by hyphens, specific to the subject (`chicago2-voice-guide`,
   not `guide` or `page1`). If `<slug>/` already exists, this is an update: reuse the same slug and pass
   the original `--created` date (read it from the existing file's `<meta name="created">`).
3. **Run the script** from the repo root:
   ```
   python _publish.py add <source.html> <slug> --description "One plain sentence about what the page is."
   ```
   It wraps fragments in a full document (charset, viewport, a reset matching the artifact host),
   adds `robots noindex`, `description` and `created` meta tags, writes `<slug>/index.html`,
   and regenerates `index.html`. After deleting a page folder, run `python _publish.py index`.
4. **Check** `git status`: only the page folder and `index.html` should have changed.
5. **Commit and push to `master`** — pushing is the deploy. Zak has asked for this workflow to deploy,
   so commit and push when he asks to add/publish a page. Message style: `add <slug>` / `update <slug>`.
   No Co-Authored-By trailer.
6. **Report the URL**: `https://zakpruitt.github.io/data-pages/<slug>/` (the index is `https://zakpruitt.github.io/data-pages/`).
   GitHub Pages takes a minute or two to rebuild; `gh api repos/zakpruitt/data-pages/pages/builds/latest`
   shows the build status if Zak wants confirmation.

## Rules

- Never commit personal or sensitive data into a page. Everything here is public, even if noindexed.
  If a page contains private info (addresses, finances, other people's details), stop and ask Zak first.
- Keep each page in one file. If a page truly needs extra assets, put them inside its own `<slug>/` folder.
