import { Entity } from "cesium";

export function sanitizeExportFilename(name: string): string {
    return name.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'document';
}

export function getExportBaseName(entities: Entity[]): string {
    const name = entities[0]?.name?.trim();
    return name ? sanitizeExportFilename(name) : 'document';
}
