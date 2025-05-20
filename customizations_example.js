window.defaultAssetsLabel = 'Nearmap 3d';

// Have to set abs path othervise cesium tries to resolve it against "data://"
const base = window.location.origin + window.location.pathname;

window.defaultAssets = 'data:application/json;charset=utf8,' + JSON.stringify([
    {
        id: "document",
        name: "default_assets",
        version: "1.0",
    },
    {
        id: "dcbethesda",
        name: "dcbethesda",
        tileset: {
            uri: base + "data/dc/dcbethesda/Cesium3dTiles.json",
        },
    },
    {
        id: "dcdt",
        name: "dcdt",
        tileset: {
            uri: base + "data/dc/dcdt/Cesium3dTiles.json",
        },
    },
    {
        id: "dcne",
        name: "dcne",
        tileset: {
            uri: base + "data/dc/dcne/Cesium3dTiles.json",
        },
    },
    {
        id: "dcsw",
        name: "dcsw",
        tileset: {
            uri: base + "data/dc/dcsw/Cesium3dTiles.json",
        },
    },
    {
        id: "dcanacostia",
        name: "dcanacostia",
        tileset: {
            uri: base + "data/dc/dcanacostia/Cesium3dTiles.json",
        },
    },
    {
        id: "dctysons",
        name: "dctysons",
        tileset: {
            uri: base + "data/dc/dctysons/Cesium3dTiles.json",
        },
    },
]);
