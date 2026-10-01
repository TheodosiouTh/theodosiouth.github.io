# theodosiouth.github.io

Personal site and blog of Thanos Theodosiou. Built with [Astro](https://astro.build), deployed to GitHub Pages by `.github/workflows/deploy.yml` on push to `master`.

The previous React site lives on the `legacy` branch.

## Develop

```sh
yarn install
yarn dev         # http://localhost:4321, drafts visible
yarn build     # type-check + static build into dist/
```

## Writing posts

Posts are written in Obsidian, in the vault's `Blog/` folder (iCloud, so they're on the phone too). `src/content/posts/` is a copy that `yarn posts:sync` keeps in sync; don't edit it directly, the next sync overwrites it. The file name doesn't matter; the URL is `/<section>/<slug>/`.

1. In Obsidian, create a note in `Blog/` and insert the **Blog post** template (`Blog/_templates/Blog post.md`).
2. Write. `draft: true` posts show only in `yarn dev`; `slug` and `description` can stay empty while drafting.
3. To publish: fill in `slug` (kebab-case, never change it afterwards) and `description`, set `draft: false`.
4. On the Mac: `yarn posts:sync` (copies `Blog/` into the repo, removes deleted posts, validates frontmatter), then commit and push. `yarn posts:sync --dry-run` shows the changes without copying.

The vault path is `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Vault/Blog`; override it with `BLOG_VAULT_DIR`. Obsidian's attachment setting should put pasted images inside `Blog/` (e.g. "In subfolder under current folder" → `attachments`).

Obsidian syntax is converted at build time (`src/lib/remark-obsidian.mjs`):

| Obsidian                       | Becomes                                               |
| ------------------------------ | ----------------------------------------------------- |
| `![[image.png]]`, `![[image.png\|Alt text]]` | image (must be somewhere under `src/content/posts/`) |
| `[[Other note]]`, `[[Other note\|label]]`     | link to that post, or plain text if it isn't published |
| `%%comment%%`                  | removed                                               |
| `==highlight==`                | `<mark>`                                              |

Files and folders starting with `_` are ignored.

| Section   | URL          | Feed                 | dev.to fields |
| --------- | ------------ | -------------------- | ------------- |
| `writing` | `/writing/`  | `/writing/rss.xml`   | yes           |
| `devlogs` | `/devlogs/`  | `/devlogs/rss.xml`   | yes           |
| `life`    | `/life/`     | `/life/rss.xml`      | no            |
| `stories` | `/stories/`  | `/stories/rss.xml`   | no            |

A section only gets its page and feed once it has a published post. `/rss.xml` has everything. Frontmatter is validated in `src/content.config.ts`; `crosspost`/`canonical` on a life or stories post fails the build.

Cross-posting (POSSE): publish here, then post to dev.to with `canonical_url` set to this post's URL, then add `crosspost.devto` to the frontmatter.

## Config

Site URL, name, links and sections are in `src/consts.ts`. To move to a custom domain: change `SITE_URL` and add `public/CNAME`.
