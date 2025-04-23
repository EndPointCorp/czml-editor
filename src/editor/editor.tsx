import './editor.css';

import { Entity, Viewer } from 'cesium';
import { useCallback, useContext, useMemo, useState } from 'preact/hooks';
import { EntytyEditor } from './entity-editor';
import { EntitiesList } from './entity-list/entities-list';

import { createContext } from 'preact';
import { ViewerContext } from '../app';
import { StyleChanges } from '../geometry-editor/changes-tracker';
import GeometryEditor from '../geometry-editor/geometry-editor';
import { CreateEntityByClickController } from '../geometry-editor/input-new-entity';
import { PositionDragController } from '../geometry-editor/position-drag-editor';
import { DefaultSharedResources, mapBillboardImageResources, SharedResources } from '../geometry-editor/shared-resources';
import { CreateEntitySection } from './create/create-section';
import { FilesSection } from './import-export/files-section';
import { types } from './meta/meta';
import { StyleCopyDialogue } from './style-copy-dialogue';


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
    doNotExport?: boolean;
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
    const [stylesToPropagate, setStylesToPropagate] = useState<StyleChanges | null>(null);
    const [stylesDialogue, setStylesDialogue] = useState<boolean>(false);

    const propagateStyles = useCallback((styles: StyleChanges) => {
        setStylesToPropagate(styles);
        setStylesDialogue(true);
    }, [setStylesToPropagate, setStylesDialogue]);

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
        
        viewer && removeEntitytFromViewer(viewer, entity);

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

    const handleEntityExtraChange = useCallback((entity: Entity, entityNewExtra: EntityExtra) => {
        extra[entity.id] = entityNewExtra;
        setExtra({...extra});
    }, [extra, setExtra]);

    const stylesHash = strHashCode(JSON.stringify(stylesToPropagate));

    return (
        <div id={'editor'} class={'section entity-editor'}>
            <EditorContext value={editorContext}>
                <FilesSection entities={entities} entitiesExtra={extra} onLoad={handleDsLoad} />
                <SharedResourcesContext value={{resources, setResources}}>
                    <CreateEntitySection {...{ onEntityCreated }} />
                    <EntitiesList {...{ entities, entity, extra, selectEntity, deleteEntity }} 
                        onEntityExtraChange={handleEntityExtraChange}
                    />
                    <StyleCopyDialogue key={stylesHash} 
                        entities={entities} 
                        entitiesExtra={extra}
                        stylesToPropagate={stylesToPropagate}
                        visible={stylesDialogue} onClose={() => setStylesDialogue(false)} />
                    <EntytyEditor entity={entity} onStyleCopy={propagateStyles} />
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

function removeEntitytFromViewer(_v: Viewer, entity: Entity) {
    entity.entityCollection.remove(entity);
}

function strHashCode(str: string) {
    var hash = 0, i, chr;

    if (str.length === 0) return hash;

    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }

    return hash;
  }
