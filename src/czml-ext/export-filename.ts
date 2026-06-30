import { Entity } from "cesium";
import { modelNameFromUri, tilesetNameFromUri } from "./model-name";
import { getResourceByPath } from "./writers/field-image-writer";

export function sanitizeExportFilename(name: string): string {
    return name.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'document';
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
