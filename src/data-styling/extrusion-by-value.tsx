import { ConstantProperty, Entity } from "cesium";
import { useCallback, useState } from "preact/hooks";
import { accessorForProperty, ValueAccessor, ValueSrcControls } from "./value-src-controls";

type ExtrusionByValueProps = {
    entities: Entity[];
    propNames: string[];
};
export function ExtrusionByValue({entities, propNames}: ExtrusionByValueProps) {
    const [property, setProperty] = useState<string>(propNames[0]);
    const [accessor, setAccessor] = useState<ValueAccessor>(accessorForProperty(property));

    const handleApply = useCallback(() => {
        entities.forEach((e, inx) => {
            const val = accessor?.getValue(e, inx);

            if (val !== undefined && !Number.isNaN(parseFloat(val)) && e.polygon) {
                e.polygon.height = new ConstantProperty(0);
                e.polygon.extrudedHeight = new ConstantProperty(val);
            }
        });

    }, [entities, accessor]);

    return <div>
        <ValueSrcControls {...{property, setProperty, propNames}} 
            allowFormula={true} onChange={setAccessor} />

        <button onClick={handleApply}>Apply</button>

    </div>
}