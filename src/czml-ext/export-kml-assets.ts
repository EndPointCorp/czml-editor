import {
    Entity,
    JulianDate,
    ModelGraphics,
    Resource,
    exportKmlModelCallback,
} from "cesium";
import { buildImagesMap } from "./writers/field-image-writer";

export type KmlExternalFiles = Record<string, Blob>;

export function createKmlModelCallback(): exportKmlModelCallback {
    const exported = new Map<string, string>();
    let counter = 1;

    return (model: ModelGraphics, time: JulianDate, externalFiles: KmlExternalFiles) => {
        const uri = model.uri?.getValue(time);
        if (!uri) {
            return '';
        }

        const resource = typeof uri === 'string' ? new Resource(uri) : uri as Resource;
        const existing = exported.get(resource.url);
        if (existing) {
            return existing;
        }

        const urlPathname = (resource.isBlobUri || resource.isDataUri)
            ? undefined
            : new URL(resource.url).pathname;
        const urlFileName = urlPathname?.match(/\/([\w\d\.\-]+)$/i)?.[1];
        const ext = resource.extension || 'glb';
        const filename = urlFileName || `model-${counter++}.${ext}`;

        exported.set(resource.url, filename);
        externalFiles[filename] = resource.fetchBlob() as unknown as Blob;
        return filename;
    };
}

export async function supplementKmlExternalFiles(
    entities: Entity[],
    kml: string,
    externalFiles: KmlExternalFiles,
): Promise<{ kml: string; externalFiles: KmlExternalFiles }> {
    const files = { ...externalFiles };
    let updatedKml = kml;
    let counter = Object.keys(files).length + 1;
    const exportedUrls = new Map<string, string>();

    const resourcesMap: Record<string, Entity[]> = {};
    buildImagesMap(entities, ['billboard', 'image'], resourcesMap);

    for (const [url] of Object.entries(resourcesMap)) {
        if (!updatedKml.includes(url)) {
            continue;
        }

        const resource = new Resource(url);
        if (resource.isDataUri) {
            continue;
        }

        const existing = exportedUrls.get(url);
        if (existing) {
            updatedKml = updatedKml.split(url).join(existing);
            continue;
        }

        const urlPathname = (resource.isBlobUri || resource.isDataUri)
            ? undefined
            : new URL(resource.url).pathname;
        const urlFileName = urlPathname?.match(/\/([\w\d\.\-]+)$/i)?.[1];
        const ext = resource.extension || 'png';
        const filename = urlFileName || `image-${counter++}.${ext}`;

        try {
            const blob = await resource.fetchBlob();
            if (!blob) {
                continue;
            }

            files[filename] = blob;
            exportedUrls.set(url, filename);
            updatedKml = updatedKml.split(url).join(filename);
        } catch {
            console.warn('failed to bundle KML image', url);
        }
    }

    return { kml: updatedKml, externalFiles: files };
}
