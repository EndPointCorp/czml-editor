import { Section } from "../../misc/elements/section";

import { Entity } from "cesium";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { CreateMultyPointFeature } from "./create-multy-point";
import { CreateBillboard } from "./create-billboard";
import { EditorContext } from "../editor";
import { CreateEntityInputMode } from "../../geometry-editor/input-new-entity";
import { ViewerContext } from "../../app";
import { CreateModel } from "./create-model";
import { OffTreeRender } from "../../misc/elements/off-tree-render";

import "./create-section.css"

type GeometryEditorMode = 'polygon' | 'polyline'
type CreateSectionMode = CreateEntityInputMode | undefined | GeometryEditorMode;

type CreateEntitySectionProps = {
    onEntityCreated: (entity: Entity) => any;
}
export function CreateEntitySection({onEntityCreated}: CreateEntitySectionProps) {

    const [activeType, setActiveType] = useState<CreateSectionMode>();

    const clickCreateController = useContext(EditorContext).clickCreateController;
    const viewer = useContext(ViewerContext);

    const offTreeTarget = useMemo(() => {
        const toolbar = viewer?.container;
        if (toolbar) {
            const wrapper = document.createElement("div");
            wrapper.className = 'create-section-tool';
            toolbar.appendChild(wrapper);

            return wrapper;
        }

    }, [viewer]);

    const handleEntityCreatedByClickRef = useRef((_e: Entity) => {});

    const handleActiveTypeSet = useCallback((aType: CreateSectionMode) => {
        setActiveType(aType);
        if (!clickCreateController) {
            return;
        }

        if (aType === undefined || Object.values(CreateEntityInputMode).includes(aType)) {
            const supportedType = aType === undefined ? null : aType as CreateEntityInputMode;
            clickCreateController.inputMode = supportedType;

            if (supportedType !== null) {
                clickCreateController.subscribeToEvents();
            }
            else {
                clickCreateController.subscribeToEvents();
            }
        }
    }, [clickCreateController, setActiveType]);

    handleEntityCreatedByClickRef.current = useCallback((entity: Entity) => {
        setActiveType(undefined);

        if (clickCreateController) {
            clickCreateController.inputMode = null;
            clickCreateController.unSubscribeToEvents();
        }
        
        if (viewer) {
            viewer.entities.add(entity);
        }

        onEntityCreated(entity);
    }, [clickCreateController, viewer, setActiveType, onEntityCreated]);

    useEffect(() => {
        if (clickCreateController) {
            const handler = handleEntityCreatedByClickRef.current;
            clickCreateController.newEntityEvent.addEventListener(handler);

            return () => {
                clickCreateController.newEntityEvent.removeEventListener(handler);
            };
        }
    }, [clickCreateController, handleEntityCreatedByClickRef]);

    const billboardActive = activeType === CreateEntityInputMode.billboard;
    const polygonActive = activeType === 'polygon';
    const polylineActive = activeType === 'polyline';

    const allEnabled = activeType === undefined;
    const billboardDisabled = !allEnabled && !billboardActive;
    const polygonDisabled = !allEnabled  && !polygonActive;
    const polylineDisabled = !allEnabled  && !polylineActive;

    return (
        <OffTreeRender target={offTreeTarget} >
            <Section id={'create-entity'} className={'create-section'} header={'Create entities'}>
                <CreateBillboard active={billboardActive}
                    disabled={billboardDisabled} setActiveType={handleActiveTypeSet} />
                <CreateMultyPointFeature type={'polyline'} active={polylineActive} 
                    disabled={polylineDisabled} setActiveType={handleActiveTypeSet} {...{onEntityCreated}} />
                <CreateMultyPointFeature type={'polygon'} active={polygonActive} 
                    disabled={polygonDisabled} setActiveType={handleActiveTypeSet} {...{onEntityCreated}} />
                <CreateModel active={activeType === CreateEntityInputMode.model}
                    disabled={!allEnabled} setActiveType={handleActiveTypeSet} />
            </Section>
        </OffTreeRender> 
    );
}

