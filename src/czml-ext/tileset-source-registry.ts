export type TilesetSourceFile = {
    /** Path relative to the tileset root directory (e.g. tileset.json, tiles/root.glb). */
    path: string;
    blob: Blob;
};

export type TilesetSource = {
    /** Path written in CZML (e.g. real_textures/tileset.json). */
    mainPath: string;
    files: TilesetSourceFile[];
    rootUri: string;
};

const registry = new Map<string, TilesetSource>();

export function registerTilesetSource(rootUri: string, source: TilesetSource) {
    registry.set(rootUri, source);
}

export function getTilesetSource(rootUri: string): TilesetSource | undefined {
    return registry.get(rootUri);
}

export function unregisterTilesetSource(rootUri: string) {
    registry.delete(rootUri);
}
