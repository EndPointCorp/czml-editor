import "./foldable-color-edit.css";

import imgUndefColor from '../../assets/undef-color.svg';

import { ColorField, ColorFieldProps } from "../../editor/fields/color-fld";
import { useState } from "preact/hooks";

export function FoldableColorEdit({value, ...rest}: ColorFieldProps) {

    const [expanded, setExpanded] = useState<boolean>(false);

    const colorStr = value === undefined ? 'none' : value.toCssHexString();
    const previewStyle = {backgroundColor: colorStr};

    return (
    <div class={'foldable-color-edit'}>
        <div style={{display: 'flex', flexDirection: 'row'}}>
            <div class={'checker'}>
                {value !==undefined && 
                    <div class={'preview'} style={previewStyle}>
                    </div>
                }
                {value === undefined && 
                    <div class={'preview-none'} >
                        <img src={imgUndefColor}/>
                    </div>}
            </div>
            <button class={'size-s'} 
                onClick={() => setExpanded(!expanded)}>
                    {expanded ? 'Hide' : 'Edit'}
            </button>
        </div>
        {expanded && <ColorField value={value} {...rest} />}
    </div>
    );
}