import * as zip from "@zip.js/zip.js";
import { Entity } from "cesium";
import { modelNameFromFileName } from "./model-name";
import { getResourceByPath } from "./writers/field-image-writer";
import { registerTilesetSource, findTilesetSource, TilesetSourceFile } from "./tileset-source-registry";
import { rewriteTilesetEntries } from "./zip-asset-resolver";

export type TilesetFromZip = {
    uri: string;
    name: string;
};

export type ZipArchive = {
    blobs: Map<string, Blob>;
    blobUrls: Map<string, string>;
};

export async function unpackZipArchive(file: Blob): Promise<ZipArchive> {
    const reader = new zip.ZipReader(new zip.BlobReader(file));
    const entries = await reader.getEntries();
    const blobs = new Map<string, Blob>();
    const blobUrls = new Map<string, string>();

    for (const entry of entries) {
        if (entry.directory) {
            continue;
        }
        const blob = await entry.getData?.(new zip.BlobWriter());
        if (blob) {
            const path = entry.filename.replace(/\\/g, '/').replace(/^\/+/, '');
            blobs.set(path, blob);
            blobUrls.set(path, URL.createObjectURL(blob));
        }
    }

    await reader.close();
    return { blobs, blobUrls };
}

export function revokeZipArchive(archive: ZipArchive) {
    for (const url of archive.blobUrls.values()) {
        URL.revokeObjectURL(url);
    }
}

function findTilesetJsonPath(paths: Iterable<string>): string | undefined {
    return [...paths]
        .filter(path => /(^|\/)tileset\.json$/i.test(path))
        .sort((a, b) => a.split('/').length - b.split('/').length)[0];
}

export function filesRelativeToTilesetRoot(
    blobs: Map<string, Blob>,
    tilesetPath: string,
): TilesetSourceFile[] {
    const tilesetDir = tilesetPath.includes('/')
        ? tilesetPath.substring(0, tilesetPath.lastIndexOf('/'))
        : '';

    const files: TilesetSourceFile[] = [];
    for (const [path, blob] of blobs) {
        if (tilesetDir) {
            if (path === tilesetPath || path.startsWith(tilesetDir + '/')) {
                const rel = path === tilesetPath
                    ? 'tileset.json'
                    : path.substring(tilesetDir.length + 1);
                files.push({ path: rel, blob });
            }
        } else {
            files.push({ path, blob });
        }
    }

    return files;
}

function mainPathForTileset(tilesetPath: string, archiveName: string): string {
    if (tilesetPath.includes('/')) {
        return tilesetPath;
    }
    const dirName = modelNameFromFileName(archiveName.replace(/\.zip$/i, ''));
    return `${dirName}/tileset.json`;
}

export async function tilesetFromZip(
    file: File | Blob,
    archiveName?: string,
): Promise<TilesetFromZip | undefined> {
    const name = archiveName || (file instanceof File ? file.name : 'tileset');
    const archive = await unpackZipArchive(file);
    const tilesetPath = findTilesetJsonPath(archive.blobs.keys());
    if (!tilesetPath) {
        revokeZipArchive(archive);
        return undefined;
    }

    await rewriteTilesetEntries(archive.blobUrls);

    const rootUri = archive.blobUrls.get(tilesetPath);
    if (!rootUri) {
        revokeZipArchive(archive);
        return undefined;
    }

    const displayName = tilesetPath.includes('/')
        ? modelNameFromFileName(tilesetPath.split('/')[0])
        : modelNameFromFileName(name);

    const source = {
        mainPath: mainPathForTileset(tilesetPath, name),
        files: filesRelativeToTilesetRoot(archive.blobs, tilesetPath),
        rootUri,
        fileName: file instanceof File ? file.name : undefined,
    };
    registerTilesetSource(source, [tilesetPath]);

    return { uri: rootUri, name: displayName };
}

export function registerTilesetsFromArchive(entities: Entity[], archive: ZipArchive) {
    for (const entity of entities) {
        const resource = getResourceByPath(entity, ['tileset', 'uri']);
        if (!resource) {
            continue;
        }

        if (findTilesetSource(resource.url)) {
            continue;
        }

        let tilesetPath: string | undefined;
        for (const [path, url] of archive.blobUrls) {
            if (url === resource.url && /tileset\.json$/i.test(path)) {
                tilesetPath = path;
                break;
            }
        }

        if (!tilesetPath && !/^blob:/i.test(resource.url) && archive.blobs.has(resource.url)) {
            tilesetPath = resource.url;
        }

        if (!tilesetPath) {
            for (const path of archive.blobs.keys()) {
                if (!/\/tileset\.json$/i.test(path)) {
                    continue;
                }
                const blobUrl = archive.blobUrls.get(path);
                if (blobUrl === resource.url) {
                    tilesetPath = path;
                    break;
                }
            }
        }

        if (!tilesetPath) {
            continue;
        }

        const rootUri = archive.blobUrls.get(tilesetPath) ?? resource.url;
        const source = {
            mainPath: tilesetPath,
            files: filesRelativeToTilesetRoot(archive.blobs, tilesetPath),
            rootUri,
        };
        registerTilesetSource(source, [resource.url, tilesetPath]);
    }
}
