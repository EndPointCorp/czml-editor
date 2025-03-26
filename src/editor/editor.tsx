import './editor.css';
import { useCallback, useContext, useMemo, useState } from 'preact/hooks';
import { Entity } from 'cesium';
import { EntitiesList } from './entity-list/entities-list';
import { EntytyEditor } from './entity-editor';

import { FilesSection } from './import-export/files-section';
import { CreateEntitySection } from './create/create-section';
import { Google3DSwitch } from '../misc/elements/google3dSwitch';
import GeometryEditor from '../geometry-editor/geometry-editor';
import { createContext } from 'preact';
import { ViewerContext } from '../app';
import { CreateEntityByClickController } from '../geometry-editor/input-new-entity';
import { PositionDragController } from '../geometry-editor/position-drag-editor';
import { DefaultSharedResources, mapBillboardImageResources, SharedResources } from '../geometry-editor/shared-resources';
import { StyleCopyDialogue } from './style-copy-dialogue';
import { StyleChanges } from '../geometry-editor/changes-tracker';


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

    const [stylesToPropagate, setStylesToPropagate] = useState<StyleChanges | null>(null);
    const [stylesDialogue, setStylesDialogue] = useState<boolean>(false);

    const propagateStyles = useCallback((styles: StyleChanges) => {
        setStylesToPropagate(styles);
        setStylesDialogue(true);
    }, [setStylesToPropagate, setStylesDialogue]);

    const [resources, setResources] = useState<SharedResources>(DefaultSharedResources);

    const handleDsLoad = useCallback((newEntities: Entity[]) => {
        const allEntities = [...entities, ...newEntities];
        const uniqueResources = Array.from(mapBillboardImageResources(allEntities).keys());
        setEntities(allEntities);
        setResources({...resources, datasourceIcons: uniqueResources});
    }, [entities, setEntities, resources, setResources]);

    const selectEntity = useCallback((entity: Entity | null) => {
        setSelectedEntity(entity);
        console.log('select entity', entity);
    }, [setSelectedEntity]);

    const onEntityCreated = useCallback((newEntity: Entity) => {
        console.log('Entity created', newEntity);
        setEntities([...entities, newEntity]);
        setSelectedEntity(newEntity);
    }, [entities, setEntities, setSelectedEntity]);

    return (
        <div id={'editor'} class={'section entity-editor'}>
            <EditorContext value={editorContext}>
                <FilesSection entities={entities} onLoad={handleDsLoad} />
                <Google3DSwitch />
                <SharedResourcesContext value={{resources, setResources}}>
                    <CreateEntitySection {...{ onEntityCreated }} />
                    <EntitiesList {...{ entities, entity, selectEntity }} />
                    <StyleCopyDialogue entities={entities} stylesToPropagate={stylesToPropagate}
                        visible={stylesDialogue} onClose={() => setStylesDialogue(false)} />
                    <EntytyEditor entity={entity} onStyleCopy={propagateStyles} />
                </SharedResourcesContext>
            </EditorContext>
        </div>
    );
}
