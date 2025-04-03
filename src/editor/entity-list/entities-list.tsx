import { EntitySelectionSync } from "./selection-sync";
import { Entity } from "cesium";

import './entities-list.css';
import { EntityListElement } from "./entity-list-elem";
import { useState } from "preact/hooks";
import { EntitiesDataTable } from "./entities-data-table";
import { EntitiesExtra } from "../editor";

export type EntitiesListProps = {
    entities: Entity[];
    entity: Entity | null;
    extra: EntitiesExtra;
    selectEntity?: (entity: Entity | null) => void;
    deleteEntity?: (entity: Entity) => void;
}
export function EntitiesList({entities, entity, extra, selectEntity, deleteEntity}: EntitiesListProps) {

    const [showDataTable, setShowDataTable] = useState<boolean>(false);

    const $entities = entities.map(e => {
        const isFolder = entities.some(pe => pe.parent?.id === e.id);
        const namePlaceholder = extra[e.id].namePlaceholder;
        return <EntityListElement key={e.id} entity={e} 
            selectedEntity={entity}
            {...{isFolder, selectEntity, deleteEntity, namePlaceholder}} />
        }
    );

    return (
        <div id={'entity-list'} class={'section entities-list-section'}>
            <h3>Entities</h3>
            <div class={'entities-actions button-size-s'}>
                {showDataTable && 
                    <EntitiesDataTable entities={entities} onClose={() => {setShowDataTable(false);}} /> }
                    
                {entities.length > 0 && 
                    <button onClick={() => {setShowDataTable(true);}}>Data table</button> }
            </div>
            <div class={'scroll-container'}>
                {$entities}
            </div>
            <EntitySelectionSync key={`${entity?.id}.selection-sync`} {...{entity, selectEntity}} />
        </div>
    );
}
