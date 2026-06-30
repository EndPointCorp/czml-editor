import { Entity, Property, Resource } from "cesium";
import { findTilesetSource, TilesetSource } from "../tileset-source-registry";
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

    for (const entity of entities) {
        const resource = getResourceByPath(entity, ['tileset', 'uri']);
        if (!resource || findExportedTileset(exportMap, resource.url)) {
            continue;
        }

        const source = findTilesetSource(resource);
        if (source) {
            const files: Record<string, Blob> = {};
            for (const file of source.files) {
                files[file.path] = file.blob;
            }
            addTilesetExportEntry(exportMap, resource, source, {
                targetPath: source.mainPath,
                files,
            });
            continue;
        }

        const urlPathname = (resource.isBlobUri || resource.isDataUri)
            ? undefined
            : new URL(resource.url).pathname;
        const urlDirMatch = urlPathname?.match(/\/([^/]+)\/tileset\.json$/i);
        const dirName = urlDirMatch?.[1] || `tileset-${counter++}`;
        const targetPath = `${dirName}/tileset.json`;

        try {
            const files = await collectTilesetFiles(resource);
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
