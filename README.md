# Nikhitha S Kotian · Portfolio

A static, dependency-free portfolio site (HTML + CSS + vanilla JS).

## Files
- `index.html`: all content (about, experience, projects, skills, education, contact)
- `styles.css`: design tokens (dark + light theme) and layout
- `script.js`: theme toggle, typing role, scroll-spy nav, reveal animations, project filter, copy email
- `assets/`: resume PDF and the Endless Worlds screenshot

## Preview locally
Open `index.html` in a browser, or run `python -m http.server 8000` and visit http://localhost:8000.

## Deploy (free)
- **GitHub Pages:** push this folder to a repo named `nikhitha-sk.github.io`, then turn on Settings → Pages → Deploy from branch `main` / root.
- **Vercel / Netlify:** import the repo; no build command is needed.

## Updating
- Add a project: copy one `<article class="card project">` block in `index.html` and set `data-cat` to `dev`, `data`, or `dev data` so the filter picks it up.
- Replace the resume: overwrite `assets/Nikhitha_S_Kotian_Resume.pdf`.
