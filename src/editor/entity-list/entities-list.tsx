import { EntitySelectionSync } from "./selection-sync";
import { Entity } from "cesium";

import './entities-list.css';
import { EntityListElement } from "./entity-list-elem";
import { useState } from "preact/hooks";
import { EntitiesDataTable } from "../../data-styling/entities-data-table";
import { EntitiesExtra, EntityExtra } from "../editor";

const dataToolsEnabled = new URLSearchParams(window.location.search).has('dataTools');

export type EntitiesListProps = {
    entities: Entity[];
    entity: Entity | null;
    extra: EntitiesExtra;
    onEntityExtraChange?: (entity: Entity, extra: EntityExtra) => void;
    selectEntity?: (entity: Entity | null) => void;
    deleteEntity?: (entity: Entity) => void;
}
export function EntitiesList({entities, entity, extra, onEntityExtraChange, selectEntity, deleteEntity}: EntitiesListProps) {

    const [showDataTable, setShowDataTable] = useState<boolean>(false);

    const $entities = entities.map(e => {
        const isFolder = entities.some(pe => pe.parent?.id === e.id);
        
        const entityExtra = extra[e.id];

        const handleEntityExtraChange = (newExtra: EntityExtra) => {
            onEntityExtraChange && onEntityExtraChange(e, newExtra);
        }

        return <EntityListElement key={e.id} entity={e} 
            selectedEntity={entity}
            onEntityExtraChange={handleEntityExtraChange}
            {...{isFolder, selectEntity, deleteEntity, entityExtra}} />
        }
    );

    return (
        <div id={'entity-list'} class={'section entities-list-section'}>
            <h3>Entities</h3>
            <div class={'entities-actions button-size-s'}>
                {showDataTable && 
                    <EntitiesDataTable entities={entities} entitiesExtra={extra}
                        onClose={() => {setShowDataTable(false);}} 
                    />}
                    
                {entities.length > 0 && dataToolsEnabled && 
                    <button onClick={() => {setShowDataTable(true);}}>Data table</button> }
            </div>
            <div class={'scroll-container'}>
                {$entities}
            </div>
            <EntitySelectionSync key={`${entity?.id}.selection-sync`} {...{entity, selectEntity}} />
        </div>
    );
}
