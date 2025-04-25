import "./label-by-value.css";

import { BoundingSphere, Color, ConstantPositionProperty, ConstantProperty, Entity, LabelGraphics } from "cesium";
import { useCallback, useState } from "preact/hooks";
import { HelpText } from "../misc/elements/help-text";
import { FoldableColorEdit } from "../misc/elements/foldable-color-edit";


export type ValueAccessor = {
    getValue: (e: Entity) => any;
    usedProperties?: string[];
}

// Matches ${variable_name}
const variableRegex = /\${(.*?)}/g; 

function evaluateVariableString (str: string, attributes: {[k: string]: any}) {
    let result = str;
    let match = variableRegex.exec(result);
    while (match !== null) {
      const placeholder = match[0];
      const variableName = match[1];
      let property = (attributes as any)[variableName];
      if (property === undefined) {
        property = "";
      }
      result = result.replace(placeholder, property);
      match = variableRegex.exec(result);
    }
    return result;
};

type LabelStyles = {
    font?: string;
    scale?: number;
    textColor?: Color;
};

type LabelByValueProps = {
    entities: Entity[];
    propNames: string[];
    onChange?: (accessor: ValueAccessor) => void;
};
export function LabelByValue({entities, propNames}: LabelByValueProps) {

    const [property, setProperty] = useState<string>(propNames[0]);
    const [template, setTemplate] = useState<string>();

    const [textColor, setTextColor] = useState<Color | undefined>(Color.BLACK);
    const [scale, setScale] = useState<string | undefined>();
    const [font, setFont] = useState<string | undefined>();

    const handleScaleChange = useCallback((e: Event) => {
        setScale((e.target as HTMLInputElement).value);
    }, [setScale]);

    const handleApply = useCallback(() => {

        const values = entities.map(e => {
            const props = {
                ...e.properties?.getValue(),
                name: e.name
            };

            return property !== '_use_template' ? 
                props[property] : evaluateVariableString(template || '', props);
        });

        const labelScale = scale === undefined ? undefined : parseFloat(scale);
        const labelScaleNum = Number.isNaN(labelScale) ? undefined : labelScale;

        const styles = {
            font,
            textColor,
            scale: labelScaleNum
        };

        applyLabelStyles(entities, values, styles);

    }, [entities, property, textColor, scale, font, template])

    return (
    <div class={'styling-labels'}>
        <div class={'source-selection'} style={{marginBottom: "0.75em"}}>
            <label class={'param-label'}>Attribute: </label>

            <select class={'param-value'} 
                onChange={(e) => setProperty((e.target as HTMLSelectElement).value)}>
                {propNames.map(pName => <option key={pName} selected={pName === property}>{pName}</option>)}
                
                {<option key={"_use_template"} value={"_use_template"} 
                    selected={property === "_use_template"}>Custom template</option> }

            </select>

            {property === "_use_template" && 
            <div>
                <HelpText unfold={true}>
                    Use $&#123;attribute_name&#125; for attribute value substitution.
                </HelpText>
                <label class={'param-label'} style={{verticalAlign: "top"}}>Template: </label>
                <textarea class={'param-value'} value={template}
                    onChange={e => setTemplate?.((e.target as HTMLInputElement).value)} />
            </div>}
            
        </div>

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
