import { ConstantProperty, Entity, Property, Resource } from "cesium";
import { ExportOptions, WriterContext } from "../export-czml";
import { writeScalar } from "./field-writers";
import { blobToBase64 } from "../../misc/file-to-base64";

/**
 * This function is asynchronous to support async image transformations
*/
export async function writeImage(property: Property, ctx: WriterContext) {

    const val = writeScalar(property, ctx);
    if (!val || val.reference) return val;

    // We don't want to copy base64 data urls, we want to replace such urls
    // as references 
    // This might not be needed in a future for cml editor b.c. it's better to set
    // such properties as references at the moment of their assignment
    
    const exportedImages = ctx.exportedImages;
    const imageRefs = ctx.imageRefs;

    const resource = (val instanceof String || typeof val === 'string') ? new Resource(val as string) : val as Resource;
    if (!(resource instanceof Resource)) {
        ctx.options?.onFailedToEncode?.(ctx.entity!, ctx.path, property);
    }

    // For the plain .czml download the image is replaced either by a base64
    // data URI (embedded inline) or by a relative file name, depending on the
    // chosen export options.
    if (imageRefs) {
        const ref = imageRefs[resource.url];
        if (ref) {
            return ref;
        }
    }

    if (exportedImages) {
        const existing = exportedImages[resource.url];
        if (existing) {
            return existing.targetPath;
        }
    }

    return resource.toString();
}

export type ResourcesMap = {
    [key: string]: Entity[]
}
export function buildImagesMap(entities: Entity[], path: string[], map: ResourcesMap) {

    for (const entity of entities) {
        const resource = getResourceByPath(entity, path);
        if (resource) {
            const entry = map[resource.url] || [];
            map[resource.url] = [...entry, entity];
        }
    }
}

/**
 * Derives a stable file name for a referenced image, reused for both the zip
 * archive entries and the plain-czml file-name references so they stay in sync.
 */
function imageFileName(url: string, counter: {n: number}) {
    const resource = new Resource(url);
    const urlFileExt = resource.extension;

    const urlPathname = (resource.isBlobUri || resource.isDataUri) ? undefined : new URL(resource.url).pathname;
    const urlFileName = urlPathname?.match(/\/([\w\d\.\-]+)$/i)?.[1];

    const dataMime = resource.isDataUri ? url.substring(url.indexOf(":") + 1, url.indexOf(";")) : undefined;
    const mimeExt = dataMime?.replace('image/', '');

    const ext = urlFileExt || mimeExt;

    return urlFileName || `icon-${counter.n++}.${ext}`;
}

export type ImageExport = {
    [url: string]: {
        targetPath: string
        img: ImageBitmap | HTMLImageElement
    }
};
export async function exportImages(imgs: ResourcesMap, options: ExportOptions) {
    const {exportImagesPath = ''} = options;

    const counter = {n: 1};

    let result: ImageExport = {};

    for (const [url] of Object.entries(imgs)) {

        const resource = new Resource(url);
        const name = imageFileName(url, counter);

        try {
            const img = await resource.fetchImage();
            const targetPath = exportImagesPath + name;

            if (img) {
                result = {
                    ...result,
                    [url]: {targetPath, img}
                }
            }
            else {
                // TODO: Error reporting
                console.warn('failed to fetch image');
            }
        }
        catch {
            // TODO: Error reporting
            console.warn('failed to fetch image');
        }
    }

    return result;
}

/**
 * Maps each referenced image to the value emitted in the plain .czml: either a
 * base64 data URI or a relative file name.
 */
export type ImageRefMap = {
    [url: string]: string
};

/**
 * Maps each referenced image to a relative file name, without fetching it. Used
 * for the plain .czml download when inline embedding is turned off, so the user
 * supplies the image files alongside the document.
 */
export function exportImageNames(imgs: ResourcesMap, options: ExportOptions): ImageRefMap {
    const {exportImagesPath = ''} = options;
    const counter = {n: 1};

    const result: ImageRefMap = {};
    for (const [url] of Object.entries(imgs)) {
        result[url] = exportImagesPath + imageFileName(url, counter);
    }

    return result;
}

/**
 * Fetches every referenced image and encodes it as a base64 data URI so it can
 * be embedded inline in a single self-contained .czml file (no zip archive).
 */
export async function exportImagesAsDataUri(imgs: ResourcesMap): Promise<ImageRefMap> {
    const result: ImageRefMap = {};

    for (const [url] of Object.entries(imgs)) {
        const resource = new Resource(url);

        // Already a data URI, no need to fetch and re-encode it
        if (resource.isDataUri) {
            result[url] = url;
            continue;
        }

        try {
            const blob = await resource.fetchBlob();
            if (blob) {
                result[url] = await blobToBase64(blob);
            }
            else {
                console.warn('failed to fetch image for inline export', url);
            }
        }
        catch {
            console.warn('failed to fetch image for inline export', url);
        }
    }

    return result;
}

export function getResourceByPath(entity: Entity, path: string[]) {
    const property = getPropertyByPath(entity, path) as (Property | ConstantProperty | Resource | string | undefined);

    if (property) {
        if (typeof property === 'string') {
            return new Resource(property);
        }

        if ((property as any).isConstant && (property as any).getValue) {
            const val = (property as ConstantProperty).getValue();
            if (val) {
                if (val instanceof Resource) {
                    return val;
                }

                if (typeof val === 'string') {
                    return new Resource(val);
                }
            }
        }
    }
}

function getPropertyByPath(entity: Entity, path: string[]) {
    let ret = entity;
    for (const p of path) {
        if (ret === undefined) return undefined;

        ret = (ret as any)[p];
    }

    return ret;
}
