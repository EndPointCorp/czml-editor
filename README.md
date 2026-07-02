# czml-editor

Visual editor for KML and CZML documents

https://www.visionport.com/cesium-kml-czml-editor/

## Prerequisites

- Node.js (tested on v24)
- Yarn 1.x

## Build

The `cesium-img-selector` dependency is vendored under `3dparty/cesium-img-selector/` (an inlined source tree, not a submodule). Its `dist/` is gitignored and must be built from source before the editor can build. The `prebuild` script does this automatically.

```sh
yarn install
yarn build
```

`yarn build` runs:

1. `prebuild` — builds the vendored selector:
   - `cd 3dparty/cesium-img-selector && yarn install && yarn build` (produces `3dparty/cesium-img-selector/dist/`)
   - `yarn install --check-files` (re-links the `file:3dparty/cesium-img-selector` dependency so it points at the freshly built `dist/`)
2. `tsc -b && vite build` — type-checks and bundles the editor into `dist/`

## Development

```sh
yarn install
yarn dev
```

If this is a first time run, run `yarn build`.


If you change files under `3dparty/cesium-img-selector/`, rebuild it and refresh the link before the editor picks up the changes:

```sh
yarn build-img-selector
yarn install --check-files
```

