import { BoundingSphere, ConstantPositionProperty, ConstantProperty, Entity, LabelGraphics } from "cesium";
import { LabledSwitch } from "../misc/elements/labled-switch"
import { useCallback } from "preact/hooks";

type EntityLabelProps = {
    entity: Entity;
    onChange?: (entity: Entity) => void;
}

export function EntityLabel({entity, onChange}: EntityLabelProps) {
    const showLabelChecked = !!entity?.label && entity.label.show?.getValue() !== false;

    const handleShowLabelSwitch = useCallback((show: boolean) => {
        if (!entity) {
            return;
        }
    
        if (!entity.label && show) {
            if (!entity.position && entity.polygon) {
                const center = BoundingSphere.fromPoints(entity.polygon.hierarchy?.getValue()?.positions).center;
                entity.position = new ConstantPositionProperty(center);
            }
            
            if (!entity.position && entity.polyline) {
                const center = entity.polyline.positions?.getValue()[0];
                entity.position = new ConstantPositionProperty(center);
            }
    
            entity.label = new LabelGraphics({
                show: true,
                text: entity.name
            });
        }
    
        if (entity.label) {
            const prop = entity.label.show;
            
            if (prop && prop.isConstant) {
                (prop as ConstantProperty).setValue(show);
            }
            else if (prop === undefined) {
                entity.label.show = new ConstantProperty(show);
            }
            else {
                entity.label.show = new ConstantProperty(show);
            }
    
            onChange && onChange(entity);
        }
    }, [entity, onChange]);


    return <LabledSwitch label={'Show label'} checked={showLabelChecked} onChange={handleShowLabelSwitch} />
}
