import "./label-by-value.css";

import { BoundingSphere, Color, ConstantPositionProperty, ConstantProperty, Entity, LabelGraphics } from "cesium";
import { useCallback, useState } from "preact/hooks";
import { FoldableColorEdit } from "../misc/elements/foldable-color-edit";
import { accessorForProperty, ValueAccessor, ValueSrcControls } from "./value-src-controls";


type LabelStyles = {
    font?: string;
    scale?: number;
    textColor?: Color;
};

type LabelByValueProps = {
    entities: Entity[];
    propNames: string[];
};
export function LabelByValue({entities, propNames}: LabelByValueProps) {

    const [property, setProperty] = useState<string>(propNames[0]);
    const [accessor, setAccessor] = useState<ValueAccessor>(accessorForProperty(property))

    const [textColor, setTextColor] = useState<Color | undefined>(Color.BLACK);
    const [scale, setScale] = useState<string | undefined>();
    const [font, setFont] = useState<string | undefined>();

    const handleScaleChange = useCallback((e: Event) => {
        setScale((e.target as HTMLInputElement).value);
    }, [setScale]);

    const handleApply = useCallback(() => {

        const values = entities.map((e, inx) => accessor.getValue(e, inx));

        const labelScale = scale === undefined ? undefined : parseFloat(scale);
        const labelScaleNum = Number.isNaN(labelScale) ? undefined : labelScale;

        const styles = {
            font,
            textColor,
            scale: labelScaleNum
        };

        applyLabelStyles(entities, values, styles);

    }, [entities, accessor, textColor, scale, font])

    return (
    <div class={'styling-labels'}>
        <ValueSrcControls {...{property, setProperty, propNames}} 
            allowFormula={true} onChange={setAccessor} />

        <div class={'common-label-styling'}>
            <div>
                <label>Label font: </label>
                <input value={font} onChange={(e: Event) => 
                    setFont((e.target as HTMLInputElement).value)}></input>
            </div>
            
            <div>
                <label>Label scale: </label>
                <input value={scale} onChange={handleScaleChange}></input>
            </div>

            <div>
                <label>Text color: </label>
                <FoldableColorEdit alpha={false} value={textColor} onChange={setTextColor}/>
            </div>
        </div>

        <button onClick={handleApply}>Apply</button>
    </div>);
}

function applyLabelStyles(entities: Entity[], values: string[], labelStyles: LabelStyles) {

    const { font, scale, textColor } = labelStyles;

    entities.forEach((entity: Entity, inx: number) => {
        const text = values[inx];

        if (text) {
            if (entity.label === undefined) {
                entity.label = new LabelGraphics();
            }

            if (entity.position === undefined) {
                if (!entity.position && entity.polygon) {
                    const center = BoundingSphere.fromPoints(entity.polygon.hierarchy?.getValue()?.positions).center;
                    entity.position = new ConstantPositionProperty(center);
                }
                
                if (!entity.position && entity.polyline) {
                    const center = entity.polyline.positions?.getValue()?.[0];
                    entity.position = new ConstantPositionProperty(center);
                }
            }
    
            entity.label.text = new ConstantProperty(text);
            entity.label.show = new ConstantProperty(true);

            if (scale) {
                entity.label.scale = new ConstantProperty(scale);
            }

            if (font) {
                entity.label.font = new ConstantProperty(font);
            }

            if (textColor) {
                entity.label.fillColor = new ConstantProperty(textColor);
            }
        }
    });

}
