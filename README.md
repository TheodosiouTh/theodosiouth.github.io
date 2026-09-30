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

Posts live in `src/content/posts/`, one Markdown/MDX file each. Copy `_template.md` (files starting with `_` are ignored) to start. `draft: true` posts show only in `yarn dev`. The file name doesn't matter; the URL is `/<section>/<slug>/`.

| Section   | URL          | Feed                 | dev.to fields |
| --------- | ------------ | -------------------- | ------------- |
| `writing` | `/writing/`  | `/writing/rss.xml`   | yes           |
| `devlogs` | `/devlogs/`  | `/devlogs/rss.xml`   | yes           |
| `life`    | `/life/`     | `/life/rss.xml`      | no            |
| `stories` | `/stories/`  | `/stories/rss.xml`   | no            |

A section only gets its page and feed once it has a published post. A section only gets its page and feed once it has a published post. `/rss.xml` has everything. Frontmatter is validated in `src/content.config.ts`; `crosspost`/`canonical` on a life or stories post fails the build.

Cross-posting (POSSE): publish here, then post to dev.to with `canonical_url` set to this post's URL, then add `crosspost.devto` to the frontmatter.

## Config

Site URL, name, links and sections are in `src/consts.ts`. To move to a custom domain: change `SITE_URL` and add `public/CNAME`.
