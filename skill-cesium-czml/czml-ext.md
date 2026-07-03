# CZML load & export in czml-editor

Covers `src/czml-ext/` — the custom CZML data-source, `.czmz` zip-archive handling, the export
writers, and schema type generation. Cesium's stock `CzmlDataSource` does not know about zip
archives or the project's extended graphics, so this layer wraps/extends it.

## 1. Architecture

- **Load** — `CzmlDataSourceExtension` (`czml-ds-ext.ts`) extends `CzmlDataSource`. It stashes
  the original static `load` as `__load` and overrides static `load` to add zip handling and an
  asset-resolution proxy. Instances carry `__czml_extended`, an optional `__archive`, and a
  `destroy()` that revokes object URLs.
- **Export** — `exportAsCzml` / `entityToPacket` (`export-czml.ts`) walk each `Entity` and
  dispatch per graphic to `writers/graphics/*-writer.ts` (billboard, label, polygon, polyline,
  point, path, model, tileset, box, cylinder, rectangle) plus shared field writers in
  `writers/field-writers.ts` and asset writers in `writers/field-{image,gltf,tileset}-writer.ts`.
  Material / `Color` handling lives in `writers/material-writer.ts`.

## 2. `.czmz` / zip load lifecycle

`CzmlDataSourceExtension.load` detects a zip archive via `iszip` (matches `.czmz`/`.zip` from a
URL pathname, a `Blob` whose type contains "zip", a data-URI with a zip mime, or a blob URI),
fetches a `Blob`, then `unpackZipArchive` (`tileset-zip.ts`) inflates every entry with
`@zip.js/zip.js` and creates a `URL.createObjectURL` per entry into `ZipArchive.blobUrls`.

The `.czml` document entry is loaded through a `Resource` whose `proxy.getURL` routes every
asset request to `lookupZipAsset` (`zip-asset-resolver.ts`). The resulting data source keeps
`__archive` and **must** call `destroy()` → `revokeZipArchive` to `URL.revokeObjectURL` every
entry. Forgetting this leaks object URLs (a common bug when re-loading documents).

If the source is not a zip, `load` falls through to the stock `CzmlDataSource.load`.

## 3. Tileset-from-zip

`tileset-zip.ts` plus `zip-asset-resolver.ts` handle 3D-Tiles archive content:

- `rewriteTilesetEntries` — for each `tileset.json` entry, `fetch` its blob, parse JSON, and
  `rewriteTilesetUris` so every relative `uri` field resolves to the matching blob URL; then
  revoke that entry's URL and recreate it from a fresh blob (the JSON itself changed). Run this
  **before** handing the document to Cesium, otherwise tileset children point at dead relative
  paths.
- `findTilesetJsonPath` — picks the **shallowest** `tileset.json` when several exist.
- `filesRelativeToTilesetRoot` — re-bases all sibling blobs to the tileset's directory so
  `tileset.json` sits at the root.
- `registerTilesetsFromArchive` — after load, maps each entity's `tileset.uri` back to its
  archive path and registers a `TilesetSourceFile` via `tileset-source-registry.ts` (skipping
  already-registered sources). `tilesetFromZip` does the standalone (drag-in) variant.

`normalizeZipPath` / `resolveZipPath` canonicalize paths (handle `..`, `\` vs `/`, leading `/`).

## 4. Asset URL resolution order (`lookupZipAsset`)

For a URL referenced from inside the archive, resolution tries, in order:

1. Exact match in `entriesMap`.
2. Resolve relative to the document path (`resolveZipPath`) and `lookupZipEntry`.
3. If a `blob:` URL, strip the `blob:<origin>/` prefix and retry (then retry on basename).
4. Parse as a real `URL`, decode the pathname, and `lookupZipEntry`.

`lookupZipEntry` itself falls back to a suffix match (`endsWith('/' + normalized)`) and then a
basename match. Keep this order in mind when debugging "Url not found inside czmz" warnings.

## 5. Export options semantics (`ExportOptions`)

Two independent axes:

- `exportImages` / `exportModels` / `exportTilesets` (`boolean`) — gather the assets as
  **sidecar files** to ship alongside the `.czml` (returned in `exportedImages` /
  `exportedModels` / `exportedTilesets`).
- `embedImages` / `embedModels` (`boolean | undefined`, **tri-state**) — controls how
  referenced assets are written into the **plain** `.czml` download:
  - `true` → embed each as a base64 data URI inside the document
  - `false` → replace each with a relative filename reference
  - `undefined` → leave the original resource URL untouched

`buildImagesMap` dedups billboard images across entities. When several entities share one image
URL, only the first keeps the bytes; the rest get a CZML `reference` overwrite
(`"<firstId>#billboard.image"`) via `ctx.overwrite`. `exportAsCzml` **resets `ctx.overwrite`
per entity** and never mutates the live entities during export — preserve this when adding
writers.

## 6. Writer context & per-field overwrite

`WriterContext` threads `path` (e.g. `['billboard','image']`) through every writer. Field
writers like `writeScalar` compare `overwrite.srcPath.join('.') === ctx.path.join('.')` to
decide whether to substitute the shared-image `reference`. When adding a new graphic/field:

- push the path segment in the dispatch call (`{...ctx, path: ['<graphic>', '<field>']}`),
- thread `ctx.overwrite` checks through scalar/property writers,
- for unsupported Cesium graphics, call `reportNotSupported` (warn + silently drop) rather than
  writing a partial packet.

Currently **unsupported** (drop with `reportNotSupported`): `ellipse`, `corridor`,
`ellipsoid`, `plane`, `polylineVolume`, `wall`, and `viewFrom`.

Known bug to be aware of: `entityToPacket` writes `cylinder` into `packet.box` (the
`if (entity.cylinder)` branch assigns `packet.box = ...`). If you touch cylinder export, fix
the destination key to `packet.cylinder`.

## 7. Schema `.d.ts` type generation (`dev-scripts/`)

`src/czml-ext/schema/*.d.ts` (billboard, label, box, cylinder, model, path, point, polygon,
polyline, rectangle, tileset) are **generated** from the upstream `czml-writer` repo's JSON
schemas via `json-schema-to-typescript` (`npx json2ts`). The schema source must be vendored at
`3dparty/czml-writer` (see `dev-scripts/README.md` for curl/submodule instructions and the exact
per-schema commands, or run `generate-types.mjs`). Regenerate on a schema upgrade — do not
hand-edit the `.d.ts` files.

## 8. Common bugs

- Object-URL leak — re-loading a `.czmz` without `destroy()` on the previous data source; each
  reload allocates new blob URLs that never get revoked.
- Relative `uri` not rewritten — `tileset.json` wasn't matched (check `findTilesetJsonPath`'s
  shallowest-match rule and that `rewriteTilesetEntries` ran before load).
- Export silently mutated live entities — never assign to `entity.*` inside a writer; use
  `ctx.overwrite` so the packet carries the substitution instead.
- Wrong `reference` string format — must be `"<targetId>#<dot.path>"` (see
  `writeReferenceValue`: `${targetId}#${targetPropertyNames.join('.')}`).
- Cylinder exported under the wrong key (see §6 bug).