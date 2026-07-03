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
    const usedJsonPaths = new Set<string>();
    const usedAssetDirs = new Set<string>();

    for (const entity of entities) {
        const resource = getResourceByPath(entity, ['tileset', 'uri']);
        if (!resource || findExportedTileset(exportMap, resource.url)) {
            continue;
        }

        const source = findTilesetSource(resource);
        if (source) {
            const stem = source.fileName
                ? modelNameFromFileName(source.fileName)
                : `tileset-${counter++}`;
            const targetPath = makeUniqueFilename('tileset.json', usedJsonPaths);
            const assetsBaseDir = makeUniqueFilename(
                normalizeZipPath('tilesets', stem),
                usedAssetDirs,
            );
            const files = await relocateTilesetFiles(
                Object.fromEntries(source.files.map(file => [file.path, file.blob])),
                targetPath,
                assetsBaseDir,
            );
            addTilesetExportEntry(exportMap, resource, source, {
                targetPath,
                files,
            });
            continue;
        }

        const urlPathname = (resource.isBlobUri || resource.isDataUri)
            ? undefined
            : new URL(resource.url).pathname;
        const urlDirMatch = urlPathname?.match(/\/([^/]+)\/tileset\.json$/i);
        const dirName = urlDirMatch?.[1] || `tileset-${counter++}`;
        const targetPath = makeUniqueFilename('tileset.json', usedJsonPaths);
        const assetsBaseDir = makeUniqueFilename(
            normalizeZipPath('tilesets', dirName),
            usedAssetDirs,
        );

        try {
            const files = await relocateTilesetFiles(
                await collectTilesetFiles(resource),
                targetPath,
                assetsBaseDir,
            );
            addTilesetExportEntry(exportMap, resource, undefined, { targetPath, files });
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

async function relocateTilesetFiles(
    sourceFiles: Record<string, Blob>,
    targetPath: string,
    assetsBaseDir: string,
): Promise<Record<string, Blob>> {
    const pathMap = new Map<string, string>();
    for (const relPath of Object.keys(sourceFiles)) {
        pathMap.set(
            relPath,
            relPath === 'tileset.json'
                ? targetPath
                : normalizeZipPath(assetsBaseDir, relPath),
        );
    }

    const output: Record<string, Blob> = {};
    for (const [relPath, blob] of Object.entries(sourceFiles)) {
        const nextPath = pathMap.get(relPath) ?? relPath;
        output[nextPath] = await rewriteTilesetFile(blob, relPath, nextPath, pathMap);
    }

    return output;
}

async function rewriteTilesetFile(
    blob: Blob,
    originalPath: string,
    rewrittenPath: string,
    pathMap: Map<string, string>,
): Promise<Blob> {
    if (!/\.json$/i.test(originalPath)) {
        return blob;
    }

    const json = JSON.parse(await blob.text());
    rewriteRelativeUris(json, originalPath, rewrittenPath, pathMap);
    return new Blob([JSON.stringify(json)], { type: 'application/json' });
}

function rewriteRelativeUris(
    node: unknown,
    originalPath: string,
    rewrittenPath: string,
    pathMap: Map<string, string>,
) {
    if (!node || typeof node !== 'object') {
        return;
    }
    if (Array.isArray(node)) {
        node.forEach(item => rewriteRelativeUris(item, originalPath, rewrittenPath, pathMap));
        return;
    }

    for (const [key, val] of Object.entries(node)) {
        if (key === 'uri' && typeof val === 'string' && !/^https?:|^blob:|^data:/i.test(val)) {
            const originalTarget = joinRelative(dirName(originalPath), val);
            const rewrittenTarget = pathMap.get(originalTarget);
            if (rewrittenTarget) {
                (node as Record<string, unknown>)[key] = relativePath(dirName(rewrittenPath), rewrittenTarget);
            }
        } else if (val && typeof val === 'object') {
            rewriteRelativeUris(val, originalPath, rewrittenPath, pathMap);
        }
    }
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

function dirName(path: string): string {
    const slash = path.lastIndexOf('/');
    return slash >= 0 ? path.substring(0, slash) : '';
}

function relativePath(fromDir: string, toPath: string): string {
    const fromParts = fromDir ? fromDir.split('/').filter(Boolean) : [];
    const toParts = toPath.split('/').filter(Boolean);

    let shared = 0;
    while (shared < fromParts.length && shared < toParts.length && fromParts[shared] === toParts[shared]) {
        shared += 1;
    }

    const up = new Array(fromParts.length - shared).fill('..');
    const down = toParts.slice(shared);
    return [...up, ...down].join('/') || '.';
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
