# Schrauben Technologies — v6

Professional, photography-led website for Schrauben Technologies. Includes a searchable product catalogue, company history and leadership, integrated services, material reference tables, quality policies and careers.

## Edit

The website is buildless. Edit the HTML, CSS, JavaScript and assets directly in `site/`. `site/app.js` contains the product/service data and the interactive behaviour. Fonts are self-hosted; their Open Font Licenses are included with the assets.

## Preview

```sh
python3 -m http.server 4173 --directory site
```

Open http://localhost:4173.

## GitHub Pages

The `Deploy Schrauben v6 to GitHub Pages` workflow runs on every push to `main` and can also be started manually. It builds and validates the static files, uploads the Pages artifact and deploys it. Pages must use **GitHub Actions** as its publishing source.

The build reads the configured Pages base path, so assets, page links and JavaScript-generated content work under a repository URL and with a custom domain.

To reproduce a project deployment locally:

```sh
python3 scripts/build-pages.py --base-path /schrauben-technologies-v6
```

Production files are emitted to `_site/`. Generated output is ignored by Git.

## Enquiries

The enquiry form prepares a message in the visitor's email application. It does not store enquiries or send through a backend.

## Version

Version **v6.0.0** preserves the approved green-and-white design, industrial photography, responsive layouts, restrained animation and all 31 content pages.
