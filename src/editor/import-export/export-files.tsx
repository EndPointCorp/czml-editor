import { CustomDataSource, Entity, exportKml, exportKmlResultKml } from "cesium";
import { useCallback, useState } from "preact/hooks";

import "./export-files.css"
import { exportAsCzml } from "../../czml-ext/export-czml";

import { ZipWriter, BlobWriter, TextReader } from "@zip.js/zip.js"
import { ModalPane } from "../../misc/elements/modal-pane";
import { EntitiesExtra } from "../editor";


type ExportFilesProps = {
    entities: Entity[];
    entitiesExtra?: EntitiesExtra;
    onExport?: () => void;
};
export function ExportFiles({entities, entitiesExtra, onExport}: ExportFilesProps) {

    const [exportDialogueOpen, setExportDialogueOpen] = useState<boolean>(false);

    const handleDownloadKML = useCallback((archived?: boolean) => {
        const ds = new CustomDataSource("export");
        
        entities
            .filter(e => !(entitiesExtra?.[e.id].doNotExport))
            .forEach(e => ds.entities.add(e));
        
        exportKml({ entities: ds.entities, kmz: archived }).then(async result => {

            const kmlText = (result as exportKmlResultKml).kml;

            if (archived) {
                if (archived) {
                    const zipWriter = new ZipWriter(new BlobWriter("application/vnd.google-earth.kmz"));
                    await zipWriter.add('document.kml', new TextReader(kmlText));
            
                    if ((result as exportKmlResultKml).externalFiles) {
                        for (const [name, file] of Object.entries((result as exportKmlResultKml).externalFiles)) {
                            await zipWriter.add(name, file.stream());
                        }
                    }
            
                    downloadBlobFile(await zipWriter.close(), 'document.czml.zip');
                }

            }
            else {
                const mime = 'application/vnd.google-earth.kml+xml';
                const kmlDataLink = `data:${mime};charset=utf-8,` + encodeURIComponent(kmlText);
                downloadAsFile(kmlDataLink, 'document.kml');
            }
        });
    }, [entities, entitiesExtra, onExport]);

    const handleDownloadCZML = useCallback(async (archived?: boolean) => {
        const options = { exportImages: archived, exportModels: archived };

        const entitiesToExport = entities
            .filter(e => !(entitiesExtra?.[e.id].doNotExport));

        const { czml, exportedImages } = await exportAsCzml(entitiesToExport, options);
        
        try {
            const czmlText = JSON.stringify(czml);
            
            if (archived) {
                const zipWriter = new ZipWriter(new BlobWriter("application/zip"));
                await zipWriter.add('document.czml', new TextReader(czmlText));
        
                if (exportedImages) {
                    for (const { targetPath, img } of Object.values(exportedImages)) {
                        const canvas = new OffscreenCanvas(img.width, img.height);
                        canvas.getContext('2d')?.drawImage(img, 0, 0);
                        const blob = await canvas.convertToBlob();
                        await zipWriter.add(targetPath, blob.stream())
                    }
                }
        
                downloadBlobFile(await zipWriter.close(), 'document.czml.zip');
            }
            else {
                const czmlData = 'data:text/json;charset=utf-8,' + encodeURIComponent(czmlText);
                downloadAsFile(czmlData, 'document.czml');
            }
        }
        catch(e) {
            console.log(czml);
            console.error(e);
        }
        
    }, [entities, entitiesExtra, onExport]);

    return (
        <div class={'export'}>
            <button onClick={() => {setExportDialogueOpen(true)}}>Export</button>
            <ModalPane visible={exportDialogueOpen}>
                <div>
                    <div><button onClick={() => {setExportDialogueOpen(false)}}>Close</button></div>
                    
                    <h4>Export as CZML</h4>
                    <div>
                        <button onClick={() => {handleDownloadCZML(true)}}>Download CZMZ</button>
                        <button onClick={() => {handleDownloadCZML(false)}}>Download CZML</button>
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
