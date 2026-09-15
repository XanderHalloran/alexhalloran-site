# alexhalloran.traqqit.com

Personal site for Alex Halloran. Plain static HTML/CSS/JS in `site/`. No build step, no npm, no analytics.

## Local preview

```
cd site
python3 -m http.server 8000
```

Open http://localhost:8000. The `/#work` style anchors and `resume.html` both work from the root.

## Layout

- `site/index.html` — single page: hero + terminal, capabilities, selected work, references (hidden until filled), about + timeline, skills, writing, contact
- `site/resume.html` — thin summary page; links to the PDF once it exists
- `site/assets/css/main.css` — tokens (`--bg`, `--ink`, ...), light + dark themes
- `site/assets/js/main.js` — theme toggle, mobile nav, terminal widget
- `site/assets/img/headshot.jpg` — TODO, placeholder box shown until present
- `site/assets/resume/Alex_Halloran_Resume.pdf` — TODO, "View resume" falls back to `resume.html`
- `_old/` — the earlier dark single-file draft, kept for reference only

Every unknown fact in the pages is marked with a visible `TODO:`. Grep for it:

```
grep -rn "TODO" site
```

## Hosting

Same shared Hostinger VPS as the rest of traqqit.com (`85.31.233.230`, see the fleet notes).

- DNS: `alexhalloran` A record -> `85.31.233.230` in the traqqit.com zone (Hostinger DNS).
- Files live at `/root/alexhalloran` on the box.
- Served by container `alexhalloran` = `caddy:2` file server, bind-mounted `:ro`, on `travelmap_default`, no published port.
- The shared `travelmap-caddy-1` terminates TLS (Let's Encrypt) and reverse-proxies `alexhalloran.traqqit.com` -> `alexhalloran:80`.
  The site block is in `travelmap/Caddyfile` (both the local copy and the server copy). Apply Caddyfile changes with the stdin reload,
  never a Caddy restart:

  ```
  cat /root/travelmap/Caddyfile | docker exec -i travelmap-caddy-1 caddy reload --config /dev/stdin --adapter caddyfile
  ```

### Manual deploy

The file server reads the directory live, so a copy is the whole deploy:

```
scp -i ~/.ssh/hostinger_travelmap -r site/* root@85.31.233.230:/root/alexhalloran/
```

### Push-to-deploy (GitHub Actions)

`.github/workflows/deploy.yml` rsyncs `site/` to the VPS on every push to `main`. The VPS has no FTP,
so this uses a write-only rsync SSH key instead of the FTP action the original brief suggested.

One-time setup:

1. Create a GitHub repo for this folder and push it.
2. Generate a deploy key pair: `ssh-keygen -t ed25519 -f deploy_alexhalloran -N "" -C deploy-alexhalloran`.
3. On the VPS, append the public key to `/root/.ssh/authorized_keys` with the restriction prefix
   `command="/usr/bin/rrsync -wo /root/alexhalloran",restrict ` so the key can only write into that one directory.
4. Add the private key as the Actions secret `DEPLOY_SSH_KEY` (`gh secret set DEPLOY_SSH_KEY < deploy_alexhalloran`).
5. Push to `main` or run the workflow from the Actions tab.

Never commit the private key. It is not in this repo.
