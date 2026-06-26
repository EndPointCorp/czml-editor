import { Cartesian3, ConstantPositionProperty, Entity } from "cesium"
import { LabledSwitch } from "../misc/elements/labled-switch"
import { useCallback, useContext, useState } from "preact/hooks"
import { EditorContext } from "./editor"
import { attachController } from "../geometry-editor/position-drag-editor"
import { PositionFld } from "./fields/position-fld"
import { ViewerContext } from "../app"

type PositionEditorProps = {
    entity: Entity
}
export function PositionEditor({entity}: PositionEditorProps) {

    const viewer = useContext(ViewerContext);

    const handleFlyTo = useCallback(() => {
        entity && viewer?.flyTo(entity, {duration: 1});
    }, [viewer, entity]);

    const moveController = useContext(EditorContext).positionDragController;

    const [active, setActive] = useState<boolean>(false);
    const [positionTick, setPositionTick] = useState<number>(0);

    const handlePositionChanged = useCallback(() => {
        setPositionTick(tick => tick + 1);
    }, []);

    const deActivate = useCallback(() => {
        setActive(false);

        if (moveController) {
            moveController.reset();
            moveController?.unBindScreenSpaceEvents();
            moveController?.enableDefaultControls();
        }
    }, [moveController]);

    const activate = useCallback(() => {
        if (!moveController) {
            return false;
        }

        const attached = attachController(moveController, entity, handlePositionChanged);
        if (!attached) {
            return false;
        }

        setActive(true);
        moveController.bindScreenSpaceEvents();
        return true;
    }, [moveController, entity, handlePositionChanged]);
    

    const handleActiveChange = useCallback((val: boolean) => {
        if (!moveController || !entity) {
            return;
        }

        if (val) {
            if (!activate()) {
                setActive(false);
            }
        } else {
            deActivate();
        }
    }, [activate, deActivate, moveController, entity]);

    const handleFldChange = useCallback((val: Cartesian3) => {
        if (entity.position && entity.position.isConstant) {
            (entity.position as ConstantPositionProperty).setValue(val);
        } else if (entity.model || entity.tileset) {
            entity.position = new ConstantPositionProperty(val);
        }
        handlePositionChanged();
    }, [entity, handlePositionChanged]);

    return (
        <div class={'entity-position'} key={`position-${entity.id}`}>
            <h4><span>Position</span> <button onClick={handleFlyTo} class={'fly-to-button'}>Flyto</button></h4>
            <PositionFld key={`editor-position-fld-${positionTick}`} entity={entity} onChange={handleFldChange} />
            <LabledSwitch checked={active} onChange={handleActiveChange}
                label={'Drag to move'}></LabledSwitch>
        </div>
    );
}
