---
name: skill-cesium-czml
description: Guidance for the czml-editor project (Preact + CesiumJS). Use when working on interactive CesiumJS Entity-API editing — dragging vertices/entities, drawing new shapes (points, polylines, polygons, billboards, labels, models, tilesets), reshaping existing geometry, picking/selection logic, ScreenSpaceEventHandler-based tools, CallbackProperty live geometry, control-point handles — OR when working on CZML/KML load and export — CzmlDataSourceExtension, .czmz/.zip archive loading, blob-URL lifecycle, field and graphics writers, json-schema-to-typescript type generation. Covers the src/geometry-editor/ and src/czml-ext/ source trees.
---

# skill-cesium-czml

Hub skill for the **czml-editor** project — a Preact + CesiumJS visual editor for CZML and KML
documents. The project has two distinct technical domains, each with its own easy-to-get-wrong
details. Read the relevant child document before editing in either domain.

## When editing interactive map behavior

Entity drag/draw/reshape tools, control-point handles, picking, `ScreenSpaceEventHandler`
flows, `CallbackProperty` live geometry → read **`entity-editing.md`** (covers
`src/geometry-editor/`).

## When editing CZML load/export

`CzmlDataSourceExtension`, `.czmz`/zip archive loading, blob-URL lifecycles, the `writers/`
field and graphics writers, schema `.d.ts` type generation → read **`czml-ext.md`** (covers
`src/czml-ext/`).

## Cross-cutting notes (apply to both domains)

### Reactivity — do not wrap Cesium in Preact state

Cesium's `Entity`/property objects use Knockout.js internally for their reactive fields. Do
**not** additionally wrap them in Preact `useState`/signals or recursively observe them — the
double reactivity leaks internal properties and can cause out-of-memory errors. Set values
explicitly or via `property.setValue(...)`.

### Build / verify

There is no test runner or lint script in `package.json`. Verification is `yarn build`, which
runs `tsc -b && vite build` (type-check + bundle into `dist/`). Run it after non-trivial
changes; type errors fail the build.

### Vendored dependency — cesium-img-selector

`cesium-img-selector` is vendored **inlined** under `3dparty/cesium-img-selector/` (a source
tree, NOT a git submodule). Its `dist/` is gitignored and must be built from source before the
editor builds. `yarn build` runs `prebuild` automatically, which builds the selector and
re-links the `file:` dependency via `yarn install --check-files`. After editing the selector:
`yarn build-img-selector && yarn install --check-files`.

### Version note

Behavior targets Cesium 1.100+ (current Entity API); this repo pins `cesium ^1.126.0`. If the
version drops, check for API differences before assuming the snippets in `entity-editing.md`
apply as-is (e.g. older versions handled `heightReference` clamping differently).