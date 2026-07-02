# Interactive Entity-API editing in czml-editor

Covers the easy-to-get-wrong parts of building drag/draw/reshape tooling on the Cesium
**Entity API** (not Primitives, not Resium — though the gotchas mostly transfer). Implementations
live in `src/geometry-editor/`:

- `geometry-editor.ts` — `GeometryEditor`: create/edit polygon & polyline through control
  points plus midpoint ("middle") handles; static `controlPointsDisplay` `CustomDataSource`.
- `position-drag-editor.ts` — `PositionDragController`: drag whole billboards/labels/models
  and translate whole polygons/polylines by a lat/lon delta.
- `pick-coordinates.ts` — `getPickCoordinates`: robust pick fallback.
- `input-new-entity.ts` — `CreateEntityByClickController`: click-to-place new entities.
- `changes-tracker.ts` — records style edits for batch `applyStyleToEntity`.

Assume basic Cesium setup (Viewer, dataSources) is known; jump into editing-specific issues.

## 1. Picking during an edit interaction

- Use `viewer.scene.pick(windowPosition)` to get a `pickedObject`, then check
  `Cesium.defined(pickedObject) && pickedObject.id instanceof Cesium.Entity` — `pickedObject.id`
  is the Entity, not `pickedObject` itself. This is the #1 source of "why is my click handler
  not firing" bugs.
- If entities overlap (a vertex handle sitting on top of a polygon edge), use
  `scene.drillPick(windowPosition)` and take the first result whose `id` matches an expected
  type/property (e.g. tag handles with `entity.properties.isHandle = true` at creation time).
- Always disable the default double-click "track entity" behavior during editing sessions:
  `viewer.trackedEntity = undefined;` and consider removing the default `LEFT_DOUBLE_CLICK`
  handler if it interferes.

**Repo picking split** — this project uses two strategies depending on granularity:

- *Whole-entity drag* (`PositionDragController.mouseDown`) uses `scene.drillPick` +
  `entityMatchesPick`, which also matches a 3D-Tiles **primitive** to its `Entity` via
  `findEntityTilesetPrimitive` (iterates `scene.primitives` for a `Cesium3DTileset` whose `id`
  is the entity).
- *Handle editing* (`GeometryEditor._mouseDown` / `_mouseClick`) uses a single `scene.pick` and
  tests `pick.id` against the in-memory `_controlPoints` / `_middlePoints` arrays with
  `Array.includes` / `findIndex` — cheaper and avoids drilling through the geometry.

## 2. Dragging: freeze the camera, don't fight it

The classic bug: dragging a vertex also pans/tilts the globe because the camera controller is
still listening to the same mouse events.

```js
handler.setInputAction((movement) => {
  isDragging = true;
  viewer.scene.screenSpaceCameraController.enableInputs = false; // critical
}, Cesium.ScreenSpaceEventType.LEFT_DOWN);

handler.setInputAction((movement) => {
  if (!isDragging) return;
  const cartesian = pickPositionRobust(viewer, movement.endPosition);
  if (cartesian) updateEntityPosition(entity, cartesian);
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

handler.setInputAction(() => {
  isDragging = false;
  viewer.scene.screenSpaceCameraController.enableInputs = true; // don't forget to re-enable
}, Cesium.ScreenSpaceEventType.LEFT_UP);
```

Forgetting to re-enable `enableInputs` on mouse-up (or on a dropped/failed drag) makes the
whole map feel "stuck." Both repo controllers guard this:
`GeometryEditor.disableDefaultControls()` / `enableDefaultControls()` and the symmetric pair on
`PositionDragController`; `mouseUp` / `endDrag` / `reset` always re-enable.

**Repo drag idiom (Cartographic delta, preserves height)** — rather than assigning the raw
picked Cartesian, both controllers compute a lat/lon *delta* from the mouse-down cartographic
and apply it to the entity's *original* cartographic, reusing the original `.height`:

```ts
const deltaLat = mousePosition.latitude - mouseDownPosition.latitude;
const deltaLon = mousePosition.longitude - mouseDownPosition.longitude;
const entityNewPosition = new Cartographic(
    mouseDownEntityPosition.longitude + deltaLon,
    mouseDownEntityPosition.latitude + deltaLat,
    mouseDownEntityPosition.height,            // height preserved
);
```

This matters for `clampToGround` / `heightReference: CLAMP_TO_GROUND` / `RELATIVE_TO_GROUND`
entities (the defaults in this repo) — manually setting a `.height` on a clamped entity is a
no-op, so feeding only lon/lat keeps drags stable on terrain.

## 3. Getting the right world position from a mouse move

`scene.pickPosition` requires depth testing against terrain/3D tiles and can return `undefined`
early in a frame or when nothing is under the cursor. `camera.pickEllipsoid` always returns a
position on the WGS84 ellipsoid but ignores terrain height. Pick based on what the editing
surface actually is. The repo's helper is near-verbatim:

```ts
// src/geometry-editor/pick-coordinates.ts
export function getPickCoordinates(viewer: Viewer, position: Cartesian2): Cartesian3 | undefined {
    const picked = viewer.scene.pickPosition(position);
    if (picked) return picked;
    return viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid) ?? undefined;
}
```

If entities are `clampToGround: true` or `heightReference: CLAMP_TO_GROUND`, don't fight the
clamp — let Cesium handle height and only feed it lon/lat. Manually setting a `.height` on a
clamped entity is a no-op and a frequent source of "why isn't my drag height updating"
confusion.

## 4. Reactive geometry with CallbackProperty — do this, not per-frame reassignment

For polygons/polylines whose shape changes as the user drags a vertex, use a `CallbackProperty`
over the hierarchy/positions rather than replacing the whole property object every frame:

```js
const positions = [...initialPositions]; // mutate this array in place
entity.polygon.hierarchy = new Cesium.CallbackProperty(() => {
  return new Cesium.PolygonHierarchy(positions);
}, false); // isConstant = false => re-evaluated every frame while dirty
```

Common performance mistakes:

- Allocating new `Cartesian3` arrays every mouse-move instead of mutating in place — causes GC
  churn and visible jitter on large polygons.
- Leaving `isConstant` as `false` on a shape that stopped changing — forces Cesium to keep
  re-deriving geometry every frame even when idle. Swap to a static array (or a `CallbackProperty`
  returning cached output) once dragging ends.
- Rebuilding an entire `PolygonHierarchy` including holes when only the outer ring changed.

**Repo pattern** — `GeometryEditor.newEntity` / `editEntity` installs
`new CallbackProperty(this._geometryCallback.bind(this), false)`; `_geometryCallback` reads
positions from the live `_controlPoints` array (mutated in place) and **guards against
under-populated geometry** by returning `[]` for polylines with fewer than 2 points or polygons
with fewer than 3 (the §8 "guard against undefined" fix). `save()` swaps the `CallbackProperty`
for `new ConstantProperty(this._geometryCallback())` — the "swap to static when done" step.
`cancel()` restores `_oldGeometry`. Note: the `CallbackProperty` is left `isConstant:false` for
the whole edit session; only `save()` freezes it, so don't leave a session open without saving.

## 5. Drawing new shapes (click-click-click-to-finish tools)

Standard pattern: keep an in-progress "dynamic" entity with a `CallbackProperty` showing the
shape-so-far (including the position under the current mouse position as a preview point), plus
a growing array of committed points added on LEFT_CLICK. On completion (double-click or
explicit "finish"):

1. Remove the temporary preview entity.
2. Create the final, static entity with the committed positions.
3. Detach the `ScreenSpaceEventHandler` (`handler.destroy()`) — a very common memory leak is
   leaving draw-mode handlers attached after the tool is closed, so old handlers keep firing
   alongside new ones on the next draw session.

**Repo** — `CreateEntityByClickController` (`input-new-entity.ts`) handles click-to-place for
billboard / model / tileset / label / point; `GeometryEditor` handles the multi-click
polygon/polyline flow with its own handler. `GeometryEditor.destroy()` calls
`screenSpaceEventHandler.destroy()`; `PositionDragController.unBindScreenSpaceEvents()` does the
same. Also note `GeometryEditor.disablePick()` removes the viewer's default `LEFT_CLICK` handler
and `enablePick()` restores the stashed `_defaultLeftClickHandler` — don't leave pick disabled
after a session (it is restored in `save()` / `cancel()`).

## 6. Vertex/handle entities for reshaping existing geometry

- Represent each editable vertex as its own small `point` or `billboard` Entity, tagged via
  `entity.properties` (e.g. `parentId`, `vertexIndex`) so a pick on a handle can be mapped back
  to the geometry it controls.
- Keep handle entities in a separate `EntityCollection` / `CustomDataSource` from the "real"
  data so you can `removeAll()` them cleanly when exiting edit mode without touching user data.
- Update the underlying geometry's position array by index when a handle moves; don't recreate
  the handle entity itself on every move (recreating destroys and re-adds it to the collection,
  which is much more expensive than mutating `entity.position`).

**Repo** — `GeometryEditor.controlPointsDisplay` is a **static** `CustomDataSource`
('geometry-control-points') added once in the constructor; control points and midpoint handles
live there, isolated from user data. `reset()` / `cancel()` call `entities.removeAll()`.
Midpoints are themselves entities with a `CallbackPositionProperty` that recomputes
`Cartesian3.midpoint` of their two neighbors — so moving a vertex automatically moves the
adjacent midpoints without re-creating them. Dragging a midpoint promotes it to a real control
point: `_mouseDown` splices a new control point in and re-splits the surrounding midpoints.
Handles use `heightReference: CLAMP_TO_GROUND` + `disableDepthTestDistance: 1000000` so they
render on top (see §8).

## 7. Cleanup checklist (the source of most "weird" bugs)

When an edit session ends (tool deactivated, component unmounts, user cancels):

- `viewer.scene.screenSpaceCameraController.enableInputs = true`
- `handler.destroy()` on any `ScreenSpaceEventHandler` created for the session
- Remove temporary/preview/handle entities from their collection
- Reset `isConstant` on any `CallbackProperty` left in a "live" state, or replace with a static
  final value
- Clear any `viewer.selectedEntity` / `viewer.trackedEntity` state you set
- Restore any default viewer handler you removed (here: the stashed `_defaultLeftClickHandler`)

`GeometryEditor` does most of this in `save()` / `cancel()` / `reset()` / `destroy()`; verify
new tools do the same on **every** exit path, including failed/aborted drags (the repo's
`mouseUp` and `endDrag` re-enable controls unconditionally).

## 8. When the issue looks like a rendering bug but isn't

- "Entity flickers/disappears while dragging" → usually a `CallbackProperty` returning
  `undefined` on some frames (e.g. a failed `pickPosition`). Guard against `undefined` and
  return the last-known-good value instead. (Repo: `_geometryCallback` returns `[]` instead of
  `undefined` when there are too few points.)
- "Handles appear to lag behind the cursor" → check whether positions are being set in
  `MOUSE_MOVE` (correct) vs. some place gated behind a render-loop `postRender` callback with
  extra delay.
- "Z-fighting between ground-clamped shape and handles" → give handle billboards a
  `heightReference: Cesium.HeightReference.CLAMP_TO_GROUND` too, and/or a small `eyeOffset` /
  `disableDepthTestDistance: Number.POSITIVE_INFINITY` if they need to always render on top.
  (Repo handles use `disableDepthTestDistance: 1000000`.)