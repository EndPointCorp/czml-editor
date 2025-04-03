import './editor.css';

import { useCallback, useContext, useMemo, useState } from 'preact/hooks';
import { Entity } from 'cesium';
import { EntytyEditor } from './entity-editor';
import { EntitiesList } from './entity-list/entities-list';

import { createContext } from 'preact';
import { ViewerContext } from '../app';
import GeometryEditor from '../geometry-editor/geometry-editor';
import { CreateEntityByClickController } from '../geometry-editor/input-new-entity';
import { PositionDragController } from '../geometry-editor/position-drag-editor';
import { DefaultSharedResources, mapBillboardImageResources, SharedResources } from '../geometry-editor/shared-resources';
import { Google3DSwitch } from '../misc/elements/google3dSwitch';
import { CreateEntitySection } from './create/create-section';
import { FilesSection } from './import-export/files-section';
import { types } from './meta/meta';


export type EditorContextT = {
    geometryEditor?: GeometryEditor;
    clickCreateController?: CreateEntityByClickController;
    positionDragController?: PositionDragController;
}

export type SharedResourcesContextT = {
    resources: SharedResources;
    setResources: (resources: SharedResources) => void;
}

export const EditorContext = createContext<EditorContextT>({});
export const SharedResourcesContext = createContext<SharedResourcesContextT>({
    resources: DefaultSharedResources,
    setResources: (_newResources) => {}
});


export type EntityExtra = {
    namePlaceholder?: string;
}

export type EntitiesExtra = {
    [entityId : string]: EntityExtra
};


export function Editor() {
    const viewer = useContext(ViewerContext);

    const editorContext = useMemo<EditorContextT>(() => {
        return {
            geometryEditor: viewer ? new GeometryEditor(viewer) : undefined,
            clickCreateController: viewer ? new CreateEntityByClickController(viewer) : undefined,
            positionDragController: viewer ? new PositionDragController(viewer) : undefined,
        }
    }, [viewer]);

    const [entities, setEntities] = useState<Entity[]>([]);
    const [entity, setSelectedEntity] = useState<Entity | null>(null);

    const [extra, setExtra] = useState<EntitiesExtra>({});

    const [resources, setResources] = useState<SharedResources>(DefaultSharedResources);

    const selectEntity = useCallback((entity: Entity | null) => {
        setSelectedEntity(entity);
        console.log('select entity', entity);
    }, [setSelectedEntity]);

    const handleDsLoad = useCallback((newEntities: Entity[]) => {
        const allEntities = [...entities, ...newEntities];
        
        updateExtra(extra, allEntities);
        setExtra({...extra});

        const uniqueResources = Array.from(mapBillboardImageResources(allEntities).keys());
        setResources({...resources, datasourceIcons: uniqueResources});
        
        setEntities(allEntities);
    }, [entities, setEntities, resources, setResources, extra, setExtra]);

    const deleteEntity = useCallback((entity: Entity) => {
        console.log('delete entity', entity);
        
        viewer?.entities?.removeById(entity.id);

        delete extra[entity.id];
        setExtra(extra);
        
        setEntities(entities.filter(e => e.id !== entity.id));
        
        setSelectedEntity(null);
    }, [entities, setEntities, setSelectedEntity, viewer, extra, setExtra]);

    const onEntityCreated = useCallback((newEntity: Entity) => {
        console.log('Entity created', newEntity);

        const allEntities = [...entities, newEntity];

        updateExtra(extra, allEntities);
        setExtra({...extra});

        setEntities(allEntities);
        setSelectedEntity(newEntity);
    }, [entities, setEntities, setSelectedEntity, extra, setExtra]);

    return (
        <div id={'editor'} class={'section entity-editor'}>
            <EditorContext value={editorContext}>
                <FilesSection entities={entities} onLoad={handleDsLoad} />
                <Google3DSwitch />
                <SharedResourcesContext value={{resources, setResources}}>
                    <CreateEntitySection {...{ onEntityCreated }} />
                    <EntitiesList {...{ entities, entity, extra, selectEntity, deleteEntity }} />
                    <EntytyEditor entity={entity} />
                </SharedResourcesContext>
            </EditorContext>
        </div>
    );
}

function updateExtra(extra: EntitiesExtra, entities: Entity[]) {

    const typeCounts = {};
    types.forEach(t => (typeCounts as any)[t] = 0);
    
    entities.forEach(e => {
        const type = types.find(tname => (e as any)[tname] !== undefined);

        if (type) {
            (typeCounts as any)[type] += 1;
        }
        const count = type ? (typeCounts as any)[type] as number : undefined;
        const placeholder = count ? `${type} ${count}` : undefined;

        if (!extra[e.id]) {
            extra[e.id] = {
                namePlaceholder: e.name || placeholder
            }
        }
    });
    
}
