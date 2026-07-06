import { Entity, Property, Resource } from "cesium";
import { makeUniqueFilename } from "../export-filename";
import { modelNameFromFileName } from "../model-name";
import { findTilesetSource, TilesetSource } from "../tileset-source-registry";
import { normalizeZipPath } from "../zip-asset-resolver";
import { getResourceByPath } from "./field-image-writer";
import { WriterContext } from "../export-czml";
import { writeScalar } from "./field-writers";

export type TilesetExportEntry = {
    targetPath: string;
    files: Record<string, Blob>;
};

export type TilesetExport = {
    [url: string]: TilesetExportEntry;
};

export function writeTilesetUri(prop: Property, ctx: WriterContext) {
    const val = writeScalar(prop, ctx);
    if (val === undefined || val === null || val.reference) return val;

    const url = toResourceUrl(val);
    const exported = findExportedTileset(ctx.exportedTilesets, url);
    if (exported) {
        return exported.targetPath;
    }

    return val;
}

export async function exportTilesets(entities: Entity[]): Promise<TilesetExport> {
    const exportMap: TilesetExport = {};
    let counter = 1;
    const usedAssetDirs = new Set<string>();

    const tilesetEntries: { resource: Resource; source: TilesetSource | undefined }[] = [];
    for (const entity of entities) {
        const resource = getResourceByPath(entity, ['tileset', 'uri']);
        if (!resource || findExportedTileset(exportMap, resource.url)) {
            continue;
        }
        const source = findTilesetSource(resource);
        tilesetEntries.push({ resource, source });
    }

    const isSingle = tilesetEntries.length <= 1;

    for (const { resource, source } of tilesetEntries) {
        if (source) {
            const stem = source.fileName
                ? modelNameFromFileName(source.fileName)
                : `tileset-${counter++}`;

            if (isSingle) {
                const files = relocateTilesetFiles(
                    Object.fromEntries(source.files.map(file => [file.path, file.blob])),
                    '',
                );
                addTilesetExportEntry(exportMap, resource, source, {
                    targetPath: 'tileset.json',
                    files,
                });
            } else {
                const assetsBaseDir = makeUniqueFilename(
                    normalizeZipPath('tilesets', stem),
                    usedAssetDirs,
                );
                const files = relocateTilesetFiles(
                    Object.fromEntries(source.files.map(file => [file.path, file.blob])),
                    assetsBaseDir,
                );
                addTilesetExportEntry(exportMap, resource, source, {
                    targetPath: normalizeZipPath(assetsBaseDir, 'tileset.json'),
                    files,
                });
            }
            continue;
        }

        const urlPathname = (resource.isBlobUri || resource.isDataUri)
            ? undefined
            : new URL(resource.url).pathname;
        const urlDirMatch = urlPathname?.match(/\/([^/]+)\/tileset\.json$/i);
        const dirName = urlDirMatch?.[1] || `tileset-${counter++}`;

        try {
            const sourceFiles = await collectTilesetFiles(resource);

            if (isSingle) {
                const files = relocateTilesetFiles(sourceFiles, '');
                addTilesetExportEntry(exportMap, resource, undefined, {
                    targetPath: 'tileset.json',
                    files,
                });
            } else {
                const assetsBaseDir = makeUniqueFilename(
                    normalizeZipPath('tilesets', dirName),
                    usedAssetDirs,
                );
                const files = relocateTilesetFiles(sourceFiles, assetsBaseDir);
                addTilesetExportEntry(exportMap, resource, undefined, {
                    targetPath: normalizeZipPath(assetsBaseDir, 'tileset.json'),
                    files,
                });
            }
        } catch {
            console.warn('failed to export tileset', resource.url);
        }
    }

    return exportMap;
}

function findExportedTileset(
    exportedTilesets: TilesetExport | undefined,
    url: string | undefined,
): TilesetExportEntry | undefined {
    if (!exportedTilesets || !url) {
        return undefined;
    }

    const direct = exportedTilesets[url];
    if (direct) {
        return direct;
    }

    const source = findTilesetSource(url);
    if (source) {
        return exportedTilesets[source.mainPath]
            ?? exportedTilesets[source.rootUri];
    }

    return undefined;
}

function addTilesetExportEntry(
    exportMap: TilesetExport,
    resource: Resource,
    source: TilesetSource | undefined,
    entry: TilesetExportEntry,
) {
    exportMap[resource.url] = entry;
    if (source) {
        exportMap[source.rootUri] = entry;
        exportMap[source.mainPath] = entry;
    }
}

async function collectTilesetFiles(rootResource: Resource): Promise<Record<string, Blob>> {
    const files: Record<string, Blob> = {};
    const blobUriToRelPath = new Map<string, string>();
    const queue: { resource: Resource; zipPath: string }[] = [
        { resource: rootResource, zipPath: 'tileset.json' },
    ];
    const seen = new Set<string>();

    while (queue.length > 0) {
        const { resource, zipPath } = queue.shift()!;
        const key = `${resource.url}|${zipPath}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);

        const blob = await resource.fetchBlob();
        if (!blob) {
            continue;
        }
        files[zipPath] = blob;

        if (/\.json$/i.test(zipPath)) {
            const json = JSON.parse(await blob.text());
            const uris = new Set<string>();
            collectUris(json, uris);
            const baseDir = zipPath.includes('/')
                ? zipPath.substring(0, zipPath.lastIndexOf('/'))
                : '';

            for (const uri of uris) {
                const childZipPath = joinRelative(baseDir, uri);

                if (/^blob:/i.test(uri)) {
                    try {
                        const childBlob = await fetch(uri).then(response => response.blob());
                        files[childZipPath] = childBlob;
                        blobUriToRelPath.set(uri, childZipPath);
                    }
                    catch {
                        console.warn('failed to fetch tileset child blob', uri);
                    }
                    continue;
                }

                if (/^https?:|^data:/i.test(uri)) {
                    continue;
                }

                const childResource = resource.getDerivedResource({ url: uri });
                queue.push({ resource: childResource, zipPath: childZipPath });
            }
        }
    }

    if (files['tileset.json'] && blobUriToRelPath.size > 0) {
        const json = JSON.parse(await files['tileset.json'].text());
        replaceUrisInJson(json, uri => blobUriToRelPath.get(uri) ?? (
            /^blob:|^https?:|^data:/i.test(uri) ? undefined : uri
        ));
        files['tileset.json'] = new Blob(
            [JSON.stringify(json)],
            { type: 'application/json' },
        );
    }

    return files;
}

function relocateTilesetFiles(
    sourceFiles: Record<string, Blob>,
    prefix: string,
): Record<string, Blob> {
    const output: Record<string, Blob> = {};
    for (const [relPath, blob] of Object.entries(sourceFiles)) {
        output[prefix ? normalizeZipPath(prefix, relPath) : relPath] = blob;
    }
    return output;
}

function replaceUrisInJson(
    node: unknown,
    remap: (uri: string) => string | undefined,
) {
    if (!node || typeof node !== 'object') {
        return;
    }
    if (Array.isArray(node)) {
        node.forEach(item => replaceUrisInJson(item, remap));
        return;
    }
    for (const [key, val] of Object.entries(node)) {
        if (key === 'uri' && typeof val === 'string') {
            const next = remap(val);
            if (next !== undefined) {
                (node as Record<string, unknown>)[key] = next;
            }
        } else if (val && typeof val === 'object') {
            replaceUrisInJson(val, remap);
        }
    }
}

function collectUris(obj: unknown, uris: Set<string>) {
    if (!obj || typeof obj !== 'object') {
        return;
    }
    if (Array.isArray(obj)) {
        obj.forEach(item => collectUris(item, uris));
        return;
    }
    for (const [key, val] of Object.entries(obj)) {
        if (key === 'uri' && typeof val === 'string') {
            uris.add(val);
        } else {
            collectUris(val, uris);
        }
    }
}

function joinRelative(baseDir: string, relativeUri: string): string {
    const combined = baseDir ? `${baseDir}/${relativeUri}` : relativeUri;
    const segments = combined.split('/');
    const result: string[] = [];
    for (const seg of segments) {
        if (seg === '..') {
            result.pop();
        } else if (seg && seg !== '.') {
            result.push(seg);
        }
    }
    return result.join('/');
}

function toResourceUrl(val: unknown): string | undefined {
    if (typeof val === 'string') {
        return val;
    }
    if (val instanceof Resource) {
        return val.url;
    }
    return undefined;
}
