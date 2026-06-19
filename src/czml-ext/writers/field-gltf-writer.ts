import { Entity, Property, Resource } from "cesium";
import { getResourceByPath } from "./field-image-writer";
import { WriterContext } from "../export-czml";
import { writeScalar } from "./field-writers";

function toResourceUrl(val: unknown): string | undefined {
    if (typeof val === 'string') {
        return val;
    }
    if (val instanceof Resource) {
        return val.url;
    }
    return undefined;
}

export type ModelExport = {
    [url: string]: {
        targetPath: string
        model: Blob
    }
};

export function writeGltf(prop: Property, ctx: WriterContext) {
    const val = writeScalar(prop, ctx);
    if (val === undefined || val === null || val.reference) return val;

    const url = toResourceUrl(val);
    const exported = url && ctx.exportedModels?.[url];
    if (exported) {
        return exported.targetPath;
    }

    return val;
}

export async function exportModels(entities: Entity[]) {

    const exportMap: ModelExport = {};

    let counter = 1;
    
    for (const entity of entities) {
        const resource = getResourceByPath(entity, ['model', 'uri']);

        if (resource && !exportMap[resource.url]) {
            const ext = resource.extension || 'glb';
        
            const urlPathname = (resource.isBlobUri || resource.isDataUri) ? undefined : new URL(resource.url).pathname;
            const urlFileName = urlPathname?.match(/\/([\w\d.\-]+)$/i)?.[1];
        
            const name = urlFileName || `model-${counter++}.${ext}`;

            try {
                const targetPath = name;
                const blob = await resource.fetchBlob();
                if (blob) {
                    exportMap[resource.url] = {targetPath, model: blob};
                }
            }
            catch {
                console.warn('failed to export model', resource.url);
            }
        }
    }


    return exportMap ;
}
