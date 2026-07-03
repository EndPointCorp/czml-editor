import * as Cesium from "cesium";


const getParams = new URLSearchParams(window.location.search);
const googleApiKey = getParams.get('google_key') || import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
if (googleApiKey) {
    Cesium.GoogleMaps.defaultApiKey = googleApiKey;
} else {
    console.warn('No Google Maps API key provided. Set VITE_GOOGLE_MAPS_API_KEY or pass ?google_key=<key>.');
}


export function switchGoogleGlobeOn(viewer: Cesium.Viewer) {

    Cesium.createGooglePhotorealistic3DTileset().then(tileset => {

        viewer.scene.primitives.add(tileset);
        viewer.scene.globe.show = false;

    }).catch(error => {
        console.log(`Failed to load tileset: ${error}`);
    });
};

export function switchGoogleGlobeOff (viewer: Cesium.Viewer) {
    // @ts-ignore
    viewer.scene.primitives._primitives
        // @ts-ignore
        .filter(p => p._basePath && p._basePath.startsWith('https://tile.googleapis.com/'))
        // @ts-ignore
        .forEach(p => {
            viewer.scene.primitives.remove(p);
        });

    viewer.scene.globe.show = true;
};