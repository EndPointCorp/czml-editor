import { Entity, Property, Resource } from "cesium";
import { getTilesetSource } from "../tileset-source-registry";
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
    const exported = url && ctx.exportedTilesets?.[url];
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
        if (!resource || exportMap[resource.url]) {
            continue;
        }

        const source = getTilesetSource(resource.url);
        if (source) {
            const files: Record<string, Blob> = {};
            for (const file of source.files) {
                files[file.path] = file.blob;
            }
            exportMap[resource.url] = { targetPath: source.mainPath, files };
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
            exportMap[resource.url] = { targetPath, files };
        } catch {
            console.warn('failed to export tileset', resource.url);
        }
    }

    return exportMap;
}

async function collectTilesetFiles(rootResource: Resource): Promise<Record<string, Blob>> {
    const files: Record<string, Blob> = {};
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
                if (/^https?:|^data:|^blob:/i.test(uri)) {
                    continue;
                }
                const childZipPath = joinRelative(baseDir, uri);
                const childResource = resource.getDerivedResource({ url: uri });
                queue.push({ resource: childResource, zipPath: childZipPath });
            }
        }
    }

    return files;
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
