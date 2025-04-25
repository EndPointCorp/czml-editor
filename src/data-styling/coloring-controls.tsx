import "./coloring-controls.css";

import { Color } from "cesium";
import { useCallback } from "preact/hooks";
import cls from "../misc/cls";
import { FoldableColorEdit } from "../misc/elements/foldable-color-edit";

export enum StylingAction {
    SET_VALUE = 'SET_VALUE', 
    SET_CONSTANT = 'SET_CONSTANT',
    CLEAR = 'CLEAR',
    LEAVE_UNCHANGED = 'LEAVE_UNCHANGED',
}

const titles = {
    SET_VALUE: 'Use condition above',
    SET_CONSTANT: 'Use single color',
    CLEAR: 'Clear color',
    LEAVE_UNCHANGED: 'Leave unchanged',
}

export type ColoringConfig = {
    fillAction: StylingAction;
    outlineAction: StylingAction;
    fillColorConst?: Color;
    outlineColorConst?: Color;
}

export const defaultColoring: ColoringConfig = {
    fillAction: StylingAction.SET_VALUE,
    outlineAction: StylingAction.SET_CONSTANT,
    outlineColorConst: Color.fromCssColorString('#05053B'),
};

type ColoringControlsProps = {
    layoutHorizontal?: boolean;
    coloringConfig: ColoringConfig;
    onColoringConfigChange?: (cfg: ColoringConfig) => void;
}
export function ColoringControls({layoutHorizontal, coloringConfig, onColoringConfigChange}: ColoringControlsProps) {

    const handleFillActionChange = useCallback((val: string | number) => {
        onColoringConfigChange?.({...coloringConfig, fillAction: val as StylingAction});
    }, [coloringConfig, onColoringConfigChange]);
    
    const handleOutlineActionChange = useCallback((val: string | number) => {
        onColoringConfigChange?.({...coloringConfig, outlineAction: val as StylingAction});
    }, [coloringConfig, onColoringConfigChange]);

    return (
    <div class={cls('coloring-controls', layoutHorizontal && 'horizontal')}>
        <div class={cls('coloring-target', 'coloring-fill')}>
            <label>Fill color: </label>
            <EnumSelect onChange={handleFillActionChange}
                titles={titles}
                value={coloringConfig.fillAction} 
                enumObj={StylingAction}/>

            {coloringConfig.fillAction === StylingAction.SET_CONSTANT && 
            <div>
                <FoldableColorEdit className={'small'} alpha={true}
                    value={coloringConfig.fillColorConst}
                    onChange={(clr) => 
                        onColoringConfigChange?.({...coloringConfig, fillColorConst: clr})} />
            </div>}
        </div>

        <div class={cls('coloring-target', 'coloring-outline')}>
            <label>Outline color: </label>
            <EnumSelect onChange={handleOutlineActionChange}
                titles={titles}
                value={coloringConfig.outlineAction} 
                enumObj={StylingAction}/>
            
            {coloringConfig.outlineAction === StylingAction.SET_CONSTANT && 
            <div>
                <FoldableColorEdit className={'small'} alpha={false}
                    value={coloringConfig.outlineColorConst}
                    onChange={(clr) => 
                        onColoringConfigChange?.({...coloringConfig, outlineColorConst: clr})} />
            </div>}
        </div>
    </div>
    );
}

type EnumSelectProps<T = any> = {
    enumObj: T;
    value: keyof T;
    titles?: {[k: string]: string}
    onChange: (v: keyof T) => void;
};
function EnumSelect<T = any>({enumObj, value, titles, onChange}: EnumSelectProps<T>) {
    
    const handleSelectChange = useCallback((e: Event) => {
        onChange((e.target as HTMLSelectElement).value as keyof T);
    }, [onChange]);

    return (
    <select onChange={handleSelectChange}>
        {Object.entries(enumObj as any).map(([k, v]) => {
            return <option selected={value === k as keyof T} 
                value={k} key={k}>
                    {titles?.[k] || enumKeyToTitle(v as string)}
            </option>
        }) }
    </select>
    );
}

function enumKeyToTitle(str: string) {
    return str.split('_')
        .map(s => s.toLowerCase())
        .filter(s => !!s)
        .join(' ');
}