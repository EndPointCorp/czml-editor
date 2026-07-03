import { Entity } from "cesium";
import { modelNameFromUri, tilesetNameFromUri } from "./model-name";
import { getResourceByPath } from "./writers/field-image-writer";

export function sanitizeExportFilename(name: string): string {
    return name.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'document';
}

function splitPath(path: string) {
    const normalized = path.replace(/\\/g, '/');
    const slash = normalized.lastIndexOf('/');
    return slash >= 0
        ? {
            dir: normalized.substring(0, slash + 1),
            name: normalized.substring(slash + 1),
        }
        : { dir: '', name: normalized };
}

function addNumericSuffix(path: string, n: number): string {
    const { dir, name } = splitPath(path);
    const dot = name.lastIndexOf('.');
    const stem = dot > 0 ? name.substring(0, dot) : name;
    const ext = dot > 0 ? name.substring(dot) : '';
    return `${dir}${stem}(${n})${ext}`;
}

export function makeUniqueFilename(path: string, used: Set<string>): string {
    let candidate = path;
    let counter = 1;

    while (used.has(candidate)) {
        candidate = addNumericSuffix(path, counter++);
    }

    used.add(candidate);
    return candidate;
}

const downloadNameCounters = new Map<string, number>();

export function nextDownloadFilename(filename: string): string {
    const count = downloadNameCounters.get(filename) ?? 0;
    downloadNameCounters.set(filename, count + 1);
    return count === 0 ? filename : addNumericSuffix(filename, count);
}

function nameFromEntity(entity: Entity): string | undefined {
    const trimmed = entity.name?.trim();
    if (trimmed) {
        return trimmed;
    }

    const model = getResourceByPath(entity, ['model', 'uri']);
    if (model) {
        return modelNameFromUri(model);
    }

    const tileset = getResourceByPath(entity, ['tileset', 'uri']);
    if (tileset) {
        return tilesetNameFromUri(tileset);
    }

    return undefined;
}

export function getExportBaseName(entities: Entity[]): string {
    const modelOrTileset = entities.find(entity => entity.model || entity.tileset);
    if (modelOrTileset) {
        const name = nameFromEntity(modelOrTileset);
        if (name) {
            return sanitizeExportFilename(name);
        }
    }

    for (const entity of entities) {
        const name = nameFromEntity(entity);
        if (name) {
            return sanitizeExportFilename(name);
        }
    }

    return 'document';
}
