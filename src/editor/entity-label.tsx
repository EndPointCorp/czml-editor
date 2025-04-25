import { BoundingSphere, ConstantPositionProperty, ConstantProperty, Entity, LabelGraphics } from "cesium";
import { LabledSwitch } from "../misc/elements/labled-switch"
import { useCallback, useState } from "preact/hooks";

type EntityLabelProps = {
    entity: Entity;
    onChange?: (entity: Entity) => void;
}

export function EntityLabel({entity, onChange}: EntityLabelProps) {

    const [showLabel, setShowLabel] = useState<boolean>(entity?.label?.show?.getValue());
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
                    return;
                }
    
                setShowLabel(show);
                onChange && onChange(entity);
            }
        }, [entity, onChange, setShowLabel]);


    return <LabledSwitch label={'Show label'} checked={showLabel} onChange={handleShowLabelSwitch} />
}