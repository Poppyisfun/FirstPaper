# Ingest

Python scripts that turn a published open access paper into the typed module
that lands in `content/papers/`.

Nothing here is part of the Next.js build. The app never imports from this
folder, and `tsconfig.json` excludes it so the TypeScript program never walks
it. Keep Python dependencies in this directory, not in `package.json`.

Generated output is committed to the repository, so a clone can build the site
without running any of this.
