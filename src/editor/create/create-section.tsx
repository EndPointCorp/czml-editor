import { Section } from "../../misc/elements/section";

import { Entity } from "cesium";
import { useCallback, useContext, useEffect, useState } from "preact/hooks";
import { CreateMultyPointFeature } from "./create-multy-point";
import { CreateBillboard } from "./create-billboard";
import { EditorContext } from "../editor";
import { CreateEntityInputMode } from "../../geometry-editor/input-new-entity";
import { ViewerContext } from "../../app";
import { CreateModel } from "./create-model";

import "./create-section.css"
import cls from "../../misc/cls";
import Portal from "../../misc/elements/potal";

type GeometryEditorMode = 'polygon' | 'polyline'
type CreateSectionMode = CreateEntityInputMode | undefined | GeometryEditorMode;

type CreateEntitySectionProps = {
    onEntityCreated: (entity: Entity) => any;
}
export function CreateEntitySection({onEntityCreated}: CreateEntitySectionProps) {

    const [activeType, setActiveType] = useState<CreateSectionMode>();

    const clickCreateController = useContext(EditorContext).clickCreateController;
    const viewer = useContext(ViewerContext);

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
                clickCreateController.unSubscribeToEvents();
            }
        }
    }, [clickCreateController, setActiveType]);

    const handleOnClickCreate = useCallback((entity: Entity) => {
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
            clickCreateController.newEntityEvent.addEventListener(handleOnClickCreate);

            return () => {
                clickCreateController.newEntityEvent.removeEventListener(handleOnClickCreate);
            };
        }
    }, [clickCreateController, handleOnClickCreate]);

    const billboardActive = activeType === CreateEntityInputMode.billboard;
    const polygonActive = activeType === 'polygon';
    const polylineActive = activeType === 'polyline';
    const modelActive = activeType === CreateEntityInputMode.model;

    const allEnabled = activeType === undefined;

    const billboardDisabled = !allEnabled && !billboardActive;
    const polylineDisabled = !allEnabled  && !polylineActive;
    const polygonDisabled = !allEnabled  && !polygonActive;
    const modelDisabled = !allEnabled  && !modelActive

    return (
        <Portal rootId={'viewer-tools'}>
            <Section id={'create-entity'} className={'create-section'} header={'Create entities'}>
                <div class={cls('creation-actions', activeType !== undefined && 'active',  activeType !== undefined && `${activeType}`)}>
                    {!billboardDisabled && <CreateBillboard active={billboardActive}
                        disabled={billboardDisabled} setActiveType={handleActiveTypeSet} />}

                    {!polylineDisabled && <CreateMultyPointFeature type={'polyline'} active={polylineActive} 
                        disabled={polylineDisabled} setActiveType={handleActiveTypeSet} {...{onEntityCreated}} />}
                    
                    {!polygonDisabled && <CreateMultyPointFeature type={'polygon'} active={polygonActive} 
                        disabled={polygonDisabled} setActiveType={handleActiveTypeSet} {...{onEntityCreated}} />}
                    
                    {!modelDisabled && <CreateModel active={modelActive}
                        disabled={!allEnabled} setActiveType={handleActiveTypeSet} /> }
                </div>
            </Section>
        </Portal>
    );
}

