import { CustomDataSource, Entity, exportKml, exportKmlResultKml } from "cesium";
import { useCallback, useState } from "preact/hooks";

import "./export-files.css"
import { exportAsCzml } from "../../czml-ext/export-czml";
import { getExportBaseName } from "../../czml-ext/export-filename";
import { createKmlModelCallback, supplementKmlExternalFiles } from "../../czml-ext/export-kml-assets";
import { normalizeZipPath } from "../../czml-ext/zip-asset-resolver";

import { ZipWriter, BlobWriter, TextReader } from "@zip.js/zip.js"
import { ModalPane } from "../../misc/elements/modal-pane";
import { LabledSwitch } from "../../misc/elements/labled-switch";
import { EntitiesExtra } from "../editor";


type ExportFilesProps = {
    entities: Entity[];
    entitiesExtra?: EntitiesExtra;
    onExport?: () => void;
};
export function ExportFiles({entities, entitiesExtra, onExport}: ExportFilesProps) {

    const [exportDialogueOpen, setExportDialogueOpen] = useState<boolean>(false);

    // Plain .czml download: embed referenced resources as base64 when on,
    // otherwise reference them by relative file name.
    const [inlineImages, setInlineImages] = useState<boolean>(true);
    const [inlineModels, setInlineModels] = useState<boolean>(true);

    const handleDownloadKML = useCallback(async (archived?: boolean) => {
        const entitiesToExport = entities
            .filter(e => !(entitiesExtra?.[e.id].doNotExport))
            .filter(e => !((e.entityCollection?.owner as any).__ignore));

        const ds = new CustomDataSource("export");
        entitiesToExport.forEach(e => ds.entities.add(e));

        try {
            const result = await exportKml({
                entities: ds.entities,
                kmz: false,
                modelCallback: createKmlModelCallback(),
            }) as exportKmlResultKml;

            const supplemented = await supplementKmlExternalFiles(
                entitiesToExport,
                result.kml,
                { ...result.externalFiles },
            );

            const baseName = getExportBaseName(entitiesToExport);

            if (archived) {
                const zipWriter = new ZipWriter(new BlobWriter("application/vnd.google-earth.kmz"));
                await zipWriter.add('doc.kml', new TextReader(supplemented.kml));

                for (const [name, file] of Object.entries(supplemented.externalFiles)) {
                    await zipWriter.add(name, file.stream());
                }

                downloadBlobFile(await zipWriter.close(), `${baseName}.kmz`);
            }
            else {
                const mime = 'application/vnd.google-earth.kml+xml';
                const kmlDataLink = `data:${mime};charset=utf-8,` + encodeURIComponent(supplemented.kml);
                downloadAsFile(kmlDataLink, `${baseName}.kml`);
            }
        }
        catch (e) {
            console.error(e);
        }
    }, [entities, entitiesExtra, onExport]);

    const handleDownloadCZML = useCallback(async (archived?: boolean) => {
        const options = archived
            ? { exportImages: true, exportModels: true, exportTilesets: true }
            : { embedImages: inlineImages, embedModels: inlineModels };

        const entitiesToExport = entities
            .filter(e => !(entitiesExtra?.[e.id].doNotExport))
            .filter(e => !((e.entityCollection?.owner as any).__ignore));

        const { czml, exportedImages, exportedModels, exportedTilesets } = await exportAsCzml(entitiesToExport, options);
        
        try {
            const czmlText = JSON.stringify(czml);
            const baseName = getExportBaseName(entitiesToExport);
            
            if (archived) {
                const zipWriter = new ZipWriter(new BlobWriter("application/zip"));
                await zipWriter.add(`${baseName}.czml`, new TextReader(czmlText));
        
                if (exportedImages) {
                    for (const { targetPath, img } of Object.values(exportedImages)) {
                        const canvas = new OffscreenCanvas(img.width, img.height);
                        canvas.getContext('2d')?.drawImage(img, 0, 0);
                        const blob = await canvas.convertToBlob();
                        await zipWriter.add(targetPath, blob.stream())
                    }
                }

                if (exportedModels) {
                    for (const { files } of Object.values(exportedModels)) {
                        for (const { path, blob } of files) {
                            await zipWriter.add(path, blob.stream());
                        }
                    }
                }

                if (exportedTilesets) {
                    for (const { targetPath, files } of Object.values(exportedTilesets)) {
                        const tilesetDir = targetPath.replace(/\/tileset\.json$/i, '');
                        for (const [relPath, blob] of Object.entries(files)) {
                            const zipPath = tilesetDir
                                ? normalizeZipPath(tilesetDir, relPath)
                                : relPath;
                            await zipWriter.add(zipPath, blob.stream());
                        }
                    }
                }
        
                downloadBlobFile(await zipWriter.close(), `${baseName}.czml.zip`);
            }
            else {
                const czmlData = 'data:text/json;charset=utf-8,' + encodeURIComponent(czmlText);
                downloadAsFile(czmlData, `${baseName}.czml`);
            }
        }
        catch(e) {
            console.log(czml);
            console.error(e);
        }
        
    }, [entities, entitiesExtra, onExport, inlineImages, inlineModels]);

    return (
        <div class={'export'}>
            <button onClick={() => {setExportDialogueOpen(true)}}>Export</button>
            <ModalPane visible={exportDialogueOpen}>
                <div>
                    <div><button onClick={() => {setExportDialogueOpen(false)}}>Close</button></div>
                    
                    <h4>Export as CZML</h4>

                    <div class={'export-format'}>
                        <button onClick={() => {handleDownloadCZML(true)}}>Download CZMZ</button>
                        <div class={'export-note'}>
                            A zip archive containing the CZML document alongside its
                            referenced resources (3D models, billboard images and
                            tilesets) as separate files. Models keep the same format
                            (gltf or glb) they were imported in.
                        </div>
                    </div>

                    <div class={'export-format'}>
                        <button onClick={() => {handleDownloadCZML(false)}}>Download CZML</button>
                        <div class={'export-options'}>
                            <LabledSwitch label={'Inline images (base64)'}
                                checked={inlineImages} onChange={setInlineImages} />
                            <LabledSwitch label={'Inline 3D models (base64)'}
                                checked={inlineModels} onChange={setInlineModels} />
                        </div>
                        <div class={'export-note'}>
                            A single file. For each resource type above, turn the
                            toggle <b>on</b> to base64-encode and embed the resource
                            directly into the document (self-contained, but larger), or
                            <b> off</b> to replace it with a relative file name
                            reference that you supply alongside the document. Tilesets
                            are never embedded and remain referenced by their original
                            URL.
                        </div>
                    </div>
                    <h4>Export as KML</h4>
                    <div>
                        Not all cesium features can be represented as KML
                    </div>
                    <div>
                        <button onClick={() => {handleDownloadKML(true)}}>Download KMZ</button>
                        <button onClick={() => {handleDownloadKML(false)}}>Download KML</button>
                    </div>
                </div>
            </ModalPane>
        </div>
    );
}

function downloadAsFile(content: string, filename: string) {
    const link = document.createElement('A') as HTMLAnchorElement;
    link.href = content;
    link.download = filename;
    link.click();
    link.remove();
}

function downloadBlobFile(content: Blob, filename: string) {
    const link = document.createElement('A') as HTMLAnchorElement;
    link.href = URL.createObjectURL(content);
    link.download = filename;
    link.click();
    link.remove();
}
