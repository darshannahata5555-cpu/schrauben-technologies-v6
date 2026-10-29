# Schrauben Technologies — v6

Professional, photography-led website for Schrauben Technologies. Includes a searchable product catalogue, company history and leadership, integrated services, material reference tables, quality policies and careers.

## Website

https://darshannahata5555-cpu.github.io/schrauben-technologies-v6/

## Edit and preview

Edit HTML, CSS, JavaScript and assets directly in `site/`. Product and service data and interactive behaviour live in `site/app.js`. Fonts are self-hosted, with their Open Font Licenses included.

```sh
python3 -m http.server 4173 --directory site
```

Open http://localhost:4173.

## Publish updates

GitHub Pages publishes the `docs/` directory from the `main` branch. After editing the source, regenerate the deployable website and push both source and output:

```sh
python3 scripts/build-pages.py --base-path /schrauben-technologies-v6 --output docs
git add site docs
git commit -m "Update website"
git push origin main
```

The build adjusts assets, page links and JavaScript-generated content for the repository URL and checks all static link targets. GitHub automatically deploys the updated `docs/` directory after the push.

For a custom domain, rebuild with an empty `--base-path` instead. The optional custom Actions workflow is retained at `deployment/github-pages-actions.example.yml`; branch publishing does not require it.

## Enquiries

The enquiry form prepares a message in the visitor's email application. It does not store enquiries or send through a backend.

## Version

**v6.0.0** preserves the approved green-and-white design, industrial photography, responsive layouts, restrained animation and all 31 content pages, plus a custom 404 page.
