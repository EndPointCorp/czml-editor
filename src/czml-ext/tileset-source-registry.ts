import { Resource } from "cesium";

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

export function registerTilesetSource(source: TilesetSource, extraKeys: string[] = []) {
    const keys = new Set<string>([
        source.rootUri,
        source.mainPath,
        ...extraKeys,
    ].filter((key): key is string => !!key));

    for (const key of keys) {
        registry.set(key, source);
    }
}

export function getTilesetSource(key: string): TilesetSource | undefined {
    return registry.get(key);
}

export function findTilesetSource(resource: Resource | string): TilesetSource | undefined {
    const url = typeof resource === 'string' ? resource : resource.url;
    const direct = registry.get(url);
    if (direct) {
        return direct;
    }

    const sources = [...new Set(registry.values())];
    for (const source of sources) {
        if (source.rootUri === url || source.mainPath === url) {
            return source;
        }
    }

    if (typeof resource !== 'string' && !resource.isBlobUri && !resource.isDataUri) {
        try {
            const pathname = decodeURIComponent(
                new URL(resource.url, 'http://czml.local').pathname.replace(/^\//, ''),
            );
            const byPath = registry.get(pathname);
            if (byPath) {
                return byPath;
            }
            for (const source of sources) {
                if (source.mainPath === pathname
                    || pathname.endsWith('/' + source.mainPath)
                    || pathname.endsWith(source.mainPath)) {
                    return source;
                }
            }
        }
        catch {
            // not a valid URL
        }
    }

    return undefined;
}

export function unregisterTilesetSource(key: string) {
    registry.delete(key);
}
