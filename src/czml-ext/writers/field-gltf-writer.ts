import { Entity, Property, Resource } from "cesium";
import { getResourceByPath } from "./field-image-writer";
import { WriterContext } from "../export-czml";
import { writeScalar } from "./field-writers";
import { blobToBase64 } from "../../misc/file-to-base64";
import { getModelSource, ModelSourceFile } from "../model-source-registry";

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
        /** The gltf/glb file referenced from the CZML model.gltf field. */
        targetPath: string
        /** Every file to write into the archive, including the main one. */
        files: ModelSourceFile[]
    }
};

/**
 * Maps each referenced model to the value emitted in the plain .czml: either a
 * base64 data URI or a relative file name.
 */
export type ModelRefMap = {
    [url: string]: string
};

/**
 * The file name embedded in the resource URL, when there is one. Blob and data
 * URIs carry no usable name, so this returns undefined for them.
 */
function modelUrlFileName(resource: Resource): string | undefined {
    const urlPathname = (resource.isBlobUri || resource.isDataUri) ? undefined : new URL(resource.url).pathname;
    return urlPathname?.match(/\/([\w\d.\-]+)$/i)?.[1];
}

/**
 * Detects the glTF flavour from the bytes themselves so an imported model keeps
 * the same format on export. Binary glb files begin with the ascii magic "glTF",
 * everything else is treated as textual gltf JSON.
 */
async function sniffModelExtension(blob: Blob): Promise<'glb' | 'gltf'> {
    const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    const isGlb = header[0] === 0x67 // g
        && header[1] === 0x6C // l
        && header[2] === 0x54 // T
        && header[3] === 0x46; // F
    return isGlb ? 'glb' : 'gltf';
}

/**
 * Derives a stable file name for a referenced model, reused for both the zip
 * archive entries and the plain-czml file-name references so they stay in sync.
 * The blob is used to detect the format when the URL has no extension (e.g. a
 * model imported as a blob URL) so the original format is preserved.
 */
async function modelFileName(resource: Resource, blob: Blob | undefined, counter: {n: number}) {
    const urlFileName = modelUrlFileName(resource);
    if (urlFileName) {
        return urlFileName;
    }

    const ext = resource.extension
        || (blob && await sniffModelExtension(blob))
        || 'glb';

    return `model-${counter.n++}.${ext}`;
}

export function writeGltf(prop: Property, ctx: WriterContext) {
    const val = writeScalar(prop, ctx);
    if (val === undefined || val === null || val.reference) return val;

    const url = toResourceUrl(val);

    // For the plain .czml download the model is replaced either by a base64
    // data URI (embedded inline) or by a relative file name, depending on the
    // chosen export options.
    const ref = url && ctx.modelRefs?.[url];
    if (ref) {
        return ref;
    }

    const exported = url && ctx.exportedModels?.[url];
    if (exported) {
        return exported.targetPath;
    }

    return val;
}

export async function exportModels(entities: Entity[]) {

    const exportMap: ModelExport = {};

    const counter = {n: 1};

    for (const entity of entities) {
        const resource = getResourceByPath(entity, ['model', 'uri']);

        if (resource && !exportMap[resource.url]) {
            // Re-export a model imported from multiple files (gltf + bin/textures)
            // as those same separate files instead of a single inlined gltf.
            const source = getModelSource(resource.url);
            if (source) {
                exportMap[resource.url] = {
                    targetPath: source.mainFileName,
                    files: source.files,
                };
                continue;
            }

            try {
                const blob = await resource.fetchBlob();
                if (blob) {
                    const targetPath = await modelFileName(resource, blob, counter);
                    exportMap[resource.url] = {targetPath, files: [{path: targetPath, blob}]};
                }
            }
            catch {
                console.warn('failed to export model', resource.url);
            }
        }
    }


    return exportMap ;
}

/**
 * Maps each referenced model to a relative file name, without fetching it. Used
 * for the plain .czml download when inline embedding is turned off, so the user
 * supplies the model files alongside the document.
 */
export async function exportModelNames(entities: Entity[]): Promise<ModelRefMap> {
    const result: ModelRefMap = {};
    const counter = {n: 1};

    for (const entity of entities) {
        const resource = getResourceByPath(entity, ['model', 'uri']);
        if (resource && !result[resource.url]) {
            // Prefer the original file name a multi-file model was imported with.
            const source = getModelSource(resource.url);
            if (source) {
                result[resource.url] = source.mainFileName;
                continue;
            }

            // Only fetch the blob to detect the format when the URL carries no
            // file name we could use instead.
            const blob = modelUrlFileName(resource) ? undefined : await safeFetchBlob(resource);
            result[resource.url] = await modelFileName(resource, blob, counter);
        }
    }

    return result;
}

async function safeFetchBlob(resource: Resource): Promise<Blob | undefined> {
    try {
        return await resource.fetchBlob() ?? undefined;
    }
    catch {
        return undefined;
    }
}

/**
 * Fetches every referenced model and encodes it as a base64 data URI so it can
 * be embedded inline in a single self-contained .czml file (no zip archive).
 */
export async function exportModelsAsDataUri(entities: Entity[]): Promise<ModelRefMap> {
    const result: ModelRefMap = {};

    for (const entity of entities) {
        const resource = getResourceByPath(entity, ['model', 'uri']);

        if (resource && !result[resource.url]) {
            // Already a data URI, no need to fetch and re-encode it
            if (resource.isDataUri) {
                result[resource.url] = resource.url;
                continue;
            }

            try {
                const blob = await resource.fetchBlob();
                if (blob) {
                    result[resource.url] = await blobToBase64(blob);
                }
                else {
                    console.warn('failed to fetch model for inline export', resource.url);
                }
            }
            catch {
                console.warn('failed to fetch model for inline export', resource.url);
            }
        }
    }

    return result;
}
