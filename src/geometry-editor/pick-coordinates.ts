import { Cartesian2, Viewer } from "cesium";

export function getPickCoordinates(viewer: Viewer, position: Cartesian2) {
    return viewer.scene.pickPosition(position);
}
