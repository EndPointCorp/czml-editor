import "./value-src-controls.css";

import { Entity } from "cesium";
import { useCallback, useState } from "preact/hooks";
import { HelpText } from "../misc/elements/help-text";

const USE_FORMULA_OPTION = "_use_formula";

export type ValueAccessor = {
    getValue: (e: Entity, inx: number) => any;
    property?: string;
    properties?: string[];
}

type ValueSrcControlsProps = {
    property: string;
    propNames: string[];
    setProperty: (p: string) => void;

    allowFormula?: boolean;

    onChange?: (accessor: ValueAccessor) => void;
};
export function ValueSrcControls({property, setProperty, propNames, allowFormula, onChange}: ValueSrcControlsProps) {

    const [formula, setFormula] = useState<string>('return ${name}');
    const [fError, setFError] = useState<string>();

    const $options = propNames.map(pName => 
        <option key={pName} selected={pName === property}>{pName}</option>
    );

    const handleSelectChange = useCallback((e: Event) => {
        const selection = (e.target as HTMLSelectElement).value;
        setProperty(selection);

        const accessor = accessorForProperty(selection);

        if (selection === USE_FORMULA_OPTION) {
            const args = listArgNames(formula);
            try {
                const getValF = dynamicAccessor(formula, args);
                accessor.getValue = (e: Entity) => {
                    return getValF(e, e.properties?.getValue());
                };

                setFError(undefined);
            }
            catch (e) {
                console.warn(e);
                setFError((e as SyntaxError).message);
            }
        }
        
        onChange?.(accessor);
        
    }, [property, setProperty, formula, onChange, setFError]);
    
    
    const handleFormulaChange = useCallback((e: Event) => {
        const formula = (e.target as HTMLInputElement).value;
        setFormula?.(formula);
        
        const args = listArgNames(formula);
        
        try {
            const getValF = dynamicAccessor(formula, args);
            
            onChange?.({
                property: USE_FORMULA_OPTION,
                properties: args,
                getValue: (e: Entity) => {
                    return getValF(e, e.properties?.getValue());
                }
            });

            setFError(undefined);
        }
        catch (e) {
            console.warn(e);
            setFError((e as SyntaxError).message);
        }

    }, [onChange, setFormula, setFError])


    return (
        <div class={'source-selection'} style={{marginBottom: "0.75em"}}>
            <label class={'param-label'}>Attribute: </label>

            <select class={'param-value'} onChange={handleSelectChange}>
                {$options}
                
                {allowFormula && 
                <option key={USE_FORMULA_OPTION} value={USE_FORMULA_OPTION} 
                    selected={property === USE_FORMULA_OPTION}>Custom formula</option> }

            </select>
            
            {property === USE_FORMULA_OPTION && 
            <div>
                <HelpText className="eval-help">
                    You can use javascript to manipulate values<br/>
                    Some examples:
                    <ul>
                        <li>
                            <h5>Format float number to fixed amount of decimal places and add '%' sign:</h5>
                            <code>
                                return {'parseFloat(${FloatAttribute}).toFixed(0) + "%"'}
                            </code>

                            <h5>Format name to upper case and append another attribute:</h5>
                            <code>
                                return {'${name}.toUpper() + " " + ${Attribute2}'}
                            </code>

                            <h5>Apply arithmetic functions:</h5>
                            <code>
                                const total = 10000;
                                return {'${SomeAttribute} / total * 100;'}
                            </code>

                        </li>
                    </ul>

                </HelpText>

                <label class={'param-label'} style={{verticalAlign: "top"}}>Formula: </label>
                <textarea style={{width: '50em'}} class={'param-value'} value={formula}
                    onChange={handleFormulaChange} />
                {fError && <div class={'error'}>{fError}</div>}
            </div>
            }
            
        </div>);
}

// Matches ${variable_name}
const variableRegex = /\${(.*?)}/g; 

export function evaluateVariableString (str: string, attributes: {[k: string]: any}) {
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

function listArgNames (str: string) {
    const result: string[] = [];
    let match = variableRegex.exec(str);
    while (match !== null) {
        const varName = match[1];
        if (!result.includes(varName)) {
            result.push(varName);
        }
        match = variableRegex.exec(str);
    }

    return result;
}

export function accessorForProperty(property: string) {
    return {
        property,
        getValue: (e: Entity) => {
            return property === 'name' ? e.name 
                : e.properties?.getValue()[property]},
    }
}
function dynamicAccessor(formula: string, args: string[]) {
    const substitutions = Object.fromEntries(args.map(arg => {
        return (arg === 'name') 
            ? [arg, `entity.name`]
            : [arg, `properties?.["${arg}"]`]
    }));
    const fBody = evaluateVariableString(formula, substitutions);
    
    return new Function("entity", "properties", fBody);
}

