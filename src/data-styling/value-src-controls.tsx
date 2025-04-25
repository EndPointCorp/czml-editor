

type ValueSrcControlsProps = {
    property: string;
    propNames: string[];
    setProperty: (p: string) => void;

    formula?: string;
    setFormula?: (f?: string) => void;
};
export function ValueSrcControls({property, setProperty, propNames, formula, setFormula}: ValueSrcControlsProps) {

    const allowCustomFormula = false;

    return (
        <div class={'source-selection'} style={{marginBottom: "0.75em"}}>
            <label class={'param-label'}>Attribute: </label>

            <select class={'param-value'} 
                onChange={(e) => setProperty((e.target as HTMLSelectElement).value)}>
                {propNames.map(pName => <option key={pName} selected={pName === property}>{pName}</option>)}
                
                {allowCustomFormula && <option key={"_use_formula"} value={"_use_formula"} 
                    selected={property === "_use_formula"}>Custom formula</option> }

            </select>
            
            {property === "_use_formula" && 
            <div>
                <label class={'param-label'} style={{verticalAlign: "top"}}>Formula: </label>
                <textarea class={'param-value'} value={formula}
                    onChange={e => setFormula?.((e.target as HTMLInputElement).value)} />
            </div>
            }
            
        </div>);
}