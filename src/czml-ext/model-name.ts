import { Entity, Resource } from "cesium";
import { getResourceByPath } from "./writers/field-image-writer";
import { findTilesetSource } from "./tileset-source-registry";

export function modelNameFromFileName(filename: string): string {
    const base = filename.replace(/^.*[/\\]/, '');
    const stem = base.replace(/\.[^.]+$/, '');
    return stem || base || 'model';
}

export function modelNameFromUri(uri: string | Resource): string {
    const url = typeof uri === 'string' ? uri : uri.url;
    const pathPart = url.split('?')[0].split('#')[0];
    const fileName = pathPart.match(/([^/]+\.(?:glb|gltf))$/i)?.[1]
        ?? pathPart.match(/([^/]+)$/)?.[1];
    return fileName ? modelNameFromFileName(fileName) : 'model';
}

export function tilesetNameFromUri(uri: string | Resource): string {
    const url = typeof uri === 'string' ? uri : uri.url;
    const pathPart = url.split('?')[0].split('#')[0];
    const dirMatch = pathPart.match(/\/([^/]+)\/tileset\.json$/i);
    if (dirMatch) {
        return modelNameFromFileName(dirMatch[1]);
    }
    return modelNameFromFileName(pathPart);
}

/**
 * Formats a tileset URI for display in the editor. Internal data URIs (base64)
 * are shown as "Binary Data" and blob URIs as "Uploaded Data", or
 * "Uploaded: <Filename>" when the original upload file name is known.
 */
export function displayTilesetUri(uri: string | Resource): string {
    const resource = typeof uri === 'string' ? new Resource(uri) : uri;

    if (resource.isDataUri) {
        return 'Binary Data';
    }

    if (resource.isBlobUri) {
        const source = findTilesetSource(resource);
        if (source?.fileName) {
            return `Uploaded: ${source.fileName}`;
        }
        return 'Uploaded Data';
    }

    return resource.url;
}

export function applyModelEntityNames(entities: Entity[]) {
    for (const entity of entities) {
        if (entity.name) {
            continue;
        }
        const resource = getResourceByPath(entity, ['model', 'uri']);
        if (resource) {
            entity.name = modelNameFromUri(resource);
        }
    }
}

export function applyTilesetEntityNames(entities: Entity[]) {
    for (const entity of entities) {
        if (entity.name) {
            continue;
        }
        const resource = getResourceByPath(entity, ['tileset', 'uri']);
        if (resource) {
            entity.name = tilesetNameFromUri(resource);
        }
    }
}
