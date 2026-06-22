/**
 * Remembers the original files a model was imported from, so it can be
 * re-exported the same way it came in. A model imported as a .gltf together with
 * one or more .bin buffers (and image textures) is rendered in-app from a single
 * self-contained blob, but the zip export should write the original files back
 * out as separate entries instead of an inlined gltf. This registry keeps that
 * original file set keyed by the model resource URL stored on the entity.
 */

export type ModelSourceFile = {
    /** Relative path/name used both inside the gltf and as the zip entry name. */
    path: string;
    blob: Blob;
};

export type ModelSource = {
    /** The gltf/glb file referenced from the CZML model.gltf field. */
    mainFileName: string;
    /** Every file to re-export, including the main gltf/glb itself. */
    files: ModelSourceFile[];
};

const registry = new Map<string, ModelSource>();

export function registerModelSource(uri: string, source: ModelSource) {
    registry.set(uri, source);
}

export function getModelSource(uri: string): ModelSource | undefined {
    return registry.get(uri);
}
