import { ConstantProperty, Entity, ImageMaterialProperty, Property, Resource } from "cesium";
import { ExportOptions, WriterContext } from "../export-czml";
import { makeUniqueFilename } from "../export-filename";
import { writeScalar } from "./field-writers";
import { blobToBase64 } from "../../misc/file-to-base64";
import type { ExportReporter } from "../export-czml";

/** Human-readable list of the entities a resource belongs to, for export warnings. */
export function describeEntities(entities: Entity[]): string {
    const ids = [...new Set(entities.map(e => e.id).filter(Boolean))];
    if (ids.length === 0) {
        return 'an entity';
    }
    return ids.length === 1
        ? `entity "${ids[0]}"`
        : `entities ${ids.map(id => `"${id}"`).join(', ')}`;
}

/** Shortens a resource URL to something meaningful in a warning (blob/data URIs have no name). */
export function describeResourceUrl(url: string): string {
    if (/^blob:/i.test(url)) {
        return 'an in-memory (blob) resource';
    }
    if (/^data:/i.test(url)) {
        return 'an embedded data resource';
    }
    const name = url.split(/[?#]/)[0].split('/').pop();
    return name ? `"${name}"` : `"${url}"`;
}

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

/** Graphics whose fill material can reference an image texture. */
const IMAGE_MATERIAL_GRAPHICS = ['polygon', 'rectangle', 'box', 'cylinder'] as const;

function addResourceToMap(resource: Resource | undefined, entity: Entity, map: ResourcesMap) {
    if (!resource) {
        return;
    }
    const entry = map[resource.url] || [];
    map[resource.url] = [...entry, entity];
}

export function buildImagesMap(entities: Entity[], path: string[], map: ResourcesMap) {

    for (const entity of entities) {
        addResourceToMap(getResourceByPath(entity, path), entity, map);
    }
}

/**
 * Collects images referenced by {@link ImageMaterialProperty} materials (polygon,
 * rectangle, box, cylinder). These are written through the same `writeImage`
 * path as billboard images, so they must be gathered here too or their (possibly
 * blob) URLs would be emitted verbatim instead of embedded / renamed.
 */
export function buildMaterialImagesMap(entities: Entity[], map: ResourcesMap) {
    for (const entity of entities) {
        for (const graphic of IMAGE_MATERIAL_GRAPHICS) {
            const material = (entity as any)[graphic]?.material;
            if (material instanceof ImageMaterialProperty) {
                addResourceToMap(resolveResource(material.image), entity, map);
            }
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
export async function exportImages(imgs: ResourcesMap, options: ExportOptions, report?: ExportReporter) {
    const {exportImagesPath = ''} = options;

    const counter = {n: 1};
    const usedPaths = new Set<string>();

    let result: ImageExport = {};

    for (const [url, entities] of Object.entries(imgs)) {

        const resource = new Resource(url);
        const name = imageFileName(url, counter);

        try {
            const img = await resource.fetchImage();
            const targetPath = makeUniqueFilename(exportImagesPath + name, usedPaths);

            if (img) {
                result = {
                    ...result,
                    [url]: {targetPath, img}
                }
            }
            else {
                report?.(`Failed to fetch image ${describeResourceUrl(url)} for ${describeEntities(entities)}; it was exported by reference only.`);
            }
        }
        catch {
            report?.(`Failed to fetch image ${describeResourceUrl(url)} for ${describeEntities(entities)}; it was exported by reference only.`);
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
    const usedPaths = new Set<string>();

    const result: ImageRefMap = {};
    for (const [url] of Object.entries(imgs)) {
        result[url] = makeUniqueFilename(exportImagesPath + imageFileName(url, counter), usedPaths);
    }

    return result;
}

/**
 * Fetches every referenced image and encodes it as a base64 data URI so it can
 * be embedded inline in a single self-contained .czml file (no zip archive).
 */
export async function exportImagesAsDataUri(imgs: ResourcesMap, report?: ExportReporter): Promise<ImageRefMap> {
    const result: ImageRefMap = {};

    for (const [url, entities] of Object.entries(imgs)) {
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
                report?.(`Failed to embed image ${describeResourceUrl(url)} for ${describeEntities(entities)} as base64; the original URL was kept.`);
            }
        }
        catch {
            report?.(`Failed to embed image ${describeResourceUrl(url)} for ${describeEntities(entities)} as base64; the original URL was kept.`);
        }
    }

    return result;
}

export function resolveResource(property: unknown): Resource | undefined {
    if (!property) {
        return undefined;
    }

    if (property instanceof Resource) {
        return property;
    }

    if (typeof property === 'string') {
        return new Resource(property);
    }

    if ((property as any).isConstant && (property as any).getValue) {
        const val = (property as ConstantProperty).getValue();
        if (val instanceof Resource) {
            return val;
        }

        if (typeof val === 'string') {
            return new Resource(val);
        }
    }
}

export function getResourceByPath(entity: Entity, path: string[]) {
    const property = getPropertyByPath(entity, path) as (Property | ConstantProperty | Resource | string | undefined);

    return resolveResource(property);
}

function getPropertyByPath(entity: Entity, path: string[]) {
    let ret = entity;
    for (const p of path) {
        if (ret === undefined) return undefined;

        ret = (ret as any)[p];
    }

    return ret;
}
