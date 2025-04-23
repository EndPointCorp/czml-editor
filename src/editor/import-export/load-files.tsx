import { Color, CzmlDataSource, Entity, GeoJsonDataSource, KmlDataSource, PinBuilder } from "cesium";
import { CesiumDataSource } from "./files-section";
import { FileInput } from "../../misc/elements/file-input";
import { useCallback, useContext } from "preact/hooks";
import { ViewerContext } from "../../app";
import { CzmlDataSourceExtension } from "../../czml-ext/czml-ds-ext";

type LoadFilesProps = {
    onLoad: (entities: Entity[], dataSource: CesiumDataSource, file: File) => any;
}
export function LoadFiles({onLoad}: LoadFilesProps) {
    const viewer = useContext(ViewerContext);
    
    const handleDSLoaded = useCallback((ds: CesiumDataSource, file: File) => {
        const newEntities = ds.entities.values;
        onLoad(newEntities, ds, file);
    }, [onLoad]);

    const handleCesiumDS = useCallback((ds: Promise<CesiumDataSource>, file: File) => {
        if (viewer) {
            viewer.dataSources.add(ds);
            ds.then(ds => handleDSLoaded(ds, file));
        }
    }, [viewer, handleDSLoaded]);

    const fileSelected = useCallback((file: File) => {
        if (/vnd.google-earth/.test(file.type) || /\.kmz|\.kml/.test(file.name)) {
            handleCesiumDS(KmlDataSource.load(file), file);
        }
        else if (/\.(czmz|zip)/.test(file.name)) {
            handleCesiumDS(CzmlDataSourceExtension.load(file), file);
        }
        else if (/\.czml/.test(file.name)) {
            readTextFromFile(file).then(text => {
                const czmljson = JSON.parse(text);
                sanitizeSelfRef(czmljson);
                handleCesiumDS(CzmlDataSource.load(czmljson), file);
            });
        }
        else if (file.type === 'application/geo+json') {
            readTextFromFile(file).then(text => {
                handleCesiumDS(GeoJsonDataSource.load(JSON.parse(text)), file);
            });
        }
        else {
            console.log('Unknown filetype', file);
        }

    }, [handleCesiumDS]);

    return (
        <FileInput name="Open" 
                accept={".kml, .kmz, .json, .czml, .czmz, .czml.zip, .geojson"} 
                onFile={fileSelected} />
    );

}

function readTextFromFile(file: File): Promise<string> {
    const reader = new FileReader();
    const promise = new Promise((resolve) => {
        reader.onload = function () {
            resolve(reader.result);
        };
    });
    reader.readAsText(file);

    return promise as Promise<string>;
}

function sanitizeSelfRef(czmljson: any[]) {
    let selfRefs = 0;
    czmljson.forEach(packet => {
        const billboardIsRef = packet.billboard &&
            packet.billboard.image &&
            packet.billboard.image.reference;

        const selfReference = billboardIsRef &&
            packet.billboard.image.reference.split('#')[0] === packet.id;

        if (selfReference) {
            console.warn('Self-referencing reference for billboard image', packet);
            const pb = new PinBuilder();
            packet.billboard.image = pb.fromText(
                "" + ++selfRefs,
                Color.fromRandom({ "alpha": 1.0 }), 32).toDataURL();
        }
    });
}