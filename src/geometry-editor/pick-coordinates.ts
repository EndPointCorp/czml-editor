import { Cartesian2, Cartesian3, Viewer } from "cesium";

export function getPickCoordinates(viewer: Viewer, position: Cartesian2): Cartesian3 | undefined {
    const picked = viewer.scene.pickPosition(position);
    if (picked) {
        return picked;
    }

    return viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid) ?? undefined;
}
