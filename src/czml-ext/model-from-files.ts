import { blobToBase64 } from "../misc/file-to-base64";
import { modelNameFromFileName } from "./model-name";
import { ModelSourceFile, registerModelSource } from "./model-source-registry";

export type ModelFromFiles = {
    uri: string;
    name: string;
    /**
     * File names referenced by the gltf (buffers / image textures) that were
     * not among the selected files. Empty when the model is complete.
     */
    missing: string[];
};

function isGlb(name: string) {
    return /\.glb$/i.test(name);
}

function isGltf(name: string) {
    return /\.gltf$/i.test(name);
}

/**
 * Builds a model resource from a set of user-selected files and remembers the
 * original files so the model can be re-exported the same way it was imported.
 *
 * A .glb is already self-contained and is used as is. A .gltf may reference
 * external buffers (.bin) and image textures by relative file name; those
 * companions are matched against the other selected files and embedded into a
 * self-contained glTF (base64 data URIs) used for in-app rendering and the
 * base64 CZML export. The untouched original files are registered separately so
 * the zip (CZMZ) export can write them back out as individual entries instead
 * of an inlined gltf.
 */
export async function modelFromFiles(files: File[]): Promise<ModelFromFiles | undefined> {
    if (files.length === 0) {
        return undefined;
    }

    // Prefer a binary glb, otherwise a textual gltf
    const primary = files.find(f => isGlb(f.name))
        || files.find(f => isGltf(f.name));

    if (!primary) {
        return undefined;
    }

    const name = modelNameFromFileName(primary.name);

    if (isGlb(primary.name)) {
        // A glb embeds its buffers and textures, nothing external to resolve
        const uri = URL.createObjectURL(primary);
        registerModelSource(uri, {
            mainFileName: primary.name,
            files: [{ path: primary.name, blob: primary }],
        });
        return { uri, name, missing: [] };
    }

    // Map the companion files by their (lower-cased) file name so we can resolve
    // the relative uris referenced inside the gltf.
    const companions = new Map<string, File>();
    for (const file of files) {
        if (file !== primary) {
            companions.set(file.name.toLowerCase(), file);
        }
    }

    let gltf: any;
    try {
        gltf = JSON.parse(await primary.text());
    }
    catch {
        // Not parseable as JSON, fall back to using the file directly
        console.warn('failed to parse gltf, using it without companions');
        const uri = URL.createObjectURL(primary);
        registerModelSource(uri, {
            mainFileName: primary.name,
            files: [{ path: primary.name, blob: primary }],
        });
        return { uri, name, missing: [] };
    }

    const missing: string[] = [];

    // The original files to re-export, keyed by their referenced relative path
    // so the gltf's relative uris still resolve next to it in the zip.
    const sourceFiles: ModelSourceFile[] = [{ path: primary.name, blob: primary }];
    const seenPaths = new Set<string>([primary.name.toLowerCase()]);

    const embedUri = async (uri: unknown): Promise<unknown> => {
        if (typeof uri !== 'string' || uri.startsWith('data:')) {
            // Already embedded or nothing to resolve
            return uri;
        }

        const refPath = decodeURIComponent(uri.split(/[?#]/)[0]).replace(/^\.\//, '');
        const baseName = refPath.split(/[/\\]/).pop() || '';
        const file = companions.get(baseName.toLowerCase());
        if (!file) {
            console.warn('missing companion file for gltf resource', uri);
            if (!missing.includes(baseName)) {
                missing.push(baseName);
            }
            return uri;
        }

        // Remember the original companion for the same-format zip re-export
        if (!seenPaths.has(refPath.toLowerCase())) {
            sourceFiles.push({ path: refPath, blob: file });
            seenPaths.add(refPath.toLowerCase());
        }

        return await blobToBase64(file);
    };

    for (const buffer of (gltf.buffers ?? [])) {
        buffer.uri = await embedUri(buffer.uri);
    }
    for (const image of (gltf.images ?? [])) {
        image.uri = await embedUri(image.uri);
    }

    // Self-contained copy used for rendering and the base64 CZML export
    const blob = new Blob([JSON.stringify(gltf)], { type: 'model/gltf+json' });
    const uri = URL.createObjectURL(blob);

    registerModelSource(uri, { mainFileName: primary.name, files: sourceFiles });

    return { uri, name, missing };
}
