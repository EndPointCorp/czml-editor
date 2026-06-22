import { Cesium3DTilesetGraphics } from "cesium";
import { WriterContext } from "../../export-czml";
import { Tileset as TilesetCzml } from "../../schema/tileset";
import { writeScalar } from "../field-writers";
import { writeTilesetUri } from "../field-tileset-writer";

export function writeTileset(tileset: Cesium3DTilesetGraphics, ctx: WriterContext) {
    const czml: TilesetCzml = {};

    if (tileset.show !== undefined) {
        czml.show = writeScalar(tileset.show, {...ctx, path: [...ctx.path, 'show']});
    }
    
    if (tileset.uri !== undefined) {
        czml.uri = writeTilesetUri(tileset.uri, {...ctx, path: [...ctx.path, 'uri']});
    }
    
    if (tileset.maximumScreenSpaceError !== undefined) {
        czml.maximumScreenSpaceError = writeScalar(tileset.maximumScreenSpaceError, {...ctx, path: [...ctx.path, 'maximumScreenSpaceError']});
    }

    return czml;
}

