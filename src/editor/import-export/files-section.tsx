import { CzmlDataSource, Entity, GeoJsonDataSource, KmlDataSource } from "cesium";

import { LoadFiles } from "./load-files";
import { ExportFiles } from "./export-files";
import { Section } from "../../misc/elements/section";
import { useCallback, useEffect, useState } from "preact/hooks";
import { EntitiesExtra } from "../editor";
import HelpDialog from "./help-dialog";
import { ImportFromFile } from "./import-files";

export type CesiumDataSource = CzmlDataSource | KmlDataSource | GeoJsonDataSource;

export type FilesSectionProps = {
    entities: Entity[];
    entitiesExtra?: EntitiesExtra;
    onNewEntities: (entities: Entity[], file?: File, dataSource?: CesiumDataSource) => any;
}
export function FilesSection({ entities, entitiesExtra, onNewEntities }: FilesSectionProps) {

    const [exported, setExported] = useState<boolean>(false);

    useEffect(() => {
        const unsavedChanges = entities.length > 0 && !exported;
        window.onbeforeunload = (e) => {
            const noPrompt = new URLSearchParams(window.location.search).has('noprompt')
            if (!noPrompt && unsavedChanges) {
                e.preventDefault();
            }
        }
        return () => {
            window.onbeforeunload = null;
        }
    }, [entities, exported]);

    const handleImport = useCallback((entities: Entity[]) => {
        if (entities && entities.length > 0) {
            onNewEntities(entities);
        }
    }, [onNewEntities]);

    return (
        <Section header={'Import / Export'} className={'upload-section'}>
            <HelpDialog />
            <LoadFiles onLoad={onNewEntities} />
            <ImportFromFile onImport={handleImport} />
            <ExportFiles entities={entities}
                entitiesExtra={entitiesExtra}
                onExport={() => { setExported(true); }} />
        </Section>
    );
}



