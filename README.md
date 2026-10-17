# alexhalloran.traqqit.com

Personal site for Alex Halloran. Plain static HTML/CSS/JS in `site/`. No build step, no npm, no analytics.

## Local preview

```
cd site
python3 -m http.server 8000
```

Open http://localhost:8000. The `/#work` style anchors and `resume.html` both work from the root.

## Layout

- `site/index.html` — single page: hero + bio.db pane, capabilities, selected work, references (hidden until filled), about + timeline, skills, writing, contact
- `site/resume.html` — thin summary page; links to the PDF once it exists
- `site/recommendations.html` — tools, hardware, supplements, books; referral links carry a `referral` pill
- `site/assets/css/main.css` — design tokens. **Monsoon Night (dark) is the default**; the light set lives under `:root[data-theme="light"]` and is reached only through the nav toggle, which saves the choice in `localStorage`
- `site/assets/js/main.js` — theme toggle, mobile nav, bio.db query pane
- `site/assets/data/bio.json` — the data behind the pane: `projects`, `roles`, `skills`, `posts`, `bio`. Edit this to change what the pane returns; it is seeded from the page copy, so update both when a project or role changes
- `tools/test_query.html` — checks the bio.db query parser (16 cases). Not deployed

### bio.db pane

The hero device is a read-only query pane, not a shell. The box starts with a working query and a Run button,
so a visitor never has to type anything; the example lines run on click. It parses an allowlist against
`bio.json` with no `eval` and no `Function()`:

- `help`, `.tables`, `.schema <table>`, `describe alex`, `clear`
- `select <cols|*> from <table> [where col (= | != | like | contains) value] [order by col [asc|desc]] [limit n]`
- plain words for non-technical visitors: a bare table name reads the whole table, and `show tables`,
  `schema posts`, `list skills`, `about`, and `whoami` all map onto the commands above

Quotes around values are optional, case is ignored, and a trailing semicolon is fine. One table per query, no
joins, no writes. Anything else prints a plain-language error naming the tables or columns that do exist.

To run the check: serve the repo root (`python3 -m http.server 8000`) and open
`http://localhost:8000/tools/test_query.html`. Green heading means all 29 cases passed.
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

This is set up and working (repo: github.com/XanderHalloran/alexhalloran-site, private). Push to `main` and the
site is live within about a minute. Check the run under the Actions tab if something looks stale.

What was set up (repeat only if the key is ever rotated):

1. A deploy key pair, `deploy-alexhalloran`. The public half is in the VPS `/root/.ssh/authorized_keys` with the prefix
   `command="/usr/bin/rrsync -wo /root/alexhalloran",restrict`, so it can only write into that one directory.
2. The private half is the Actions secret `DEPLOY_SSH_KEY`. It is not stored anywhere else.

To rotate: `ssh-keygen -t ed25519 -f deploy_alexhalloran -N "" -C deploy-alexhalloran`, replace the line in
`authorized_keys`, then `gh secret set DEPLOY_SSH_KEY < deploy_alexhalloran` and delete the local file.

Never commit the private key.
