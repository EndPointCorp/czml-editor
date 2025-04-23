import { Color } from "cesium";
import { useCallback, useState } from "preact/hooks";
import { ColorField } from "../../editor/fields/color-fld";

import "./color-ramp-editor.css";
import { LabledSwitch } from "./labled-switch";

export type ColorRamp = {
    stops: ColorRampSample[];
    gradations?: number;
};

export type ColorRampSample = {
    rgba: number[];
    ratio: number;
}

type ColorRampEditorProps = {
    ramp: ColorRamp;
    onRampChange?: (newRamp: ColorRamp) => void;
};
export function ColorRampEditor({ramp, onRampChange}: ColorRampEditorProps) {

    const gradations = ramp.gradations;

    const [editActive, setEditActive] = useState<boolean>();

    const [useGradations, setUseGradations] = useState<boolean>((gradations || 1) > 1);

    const handleSwitchGradations = useCallback((v: boolean) => {
        setUseGradations(v);
        onRampChange?.({...ramp, gradations: v ? 9 : 0});
    }, [ramp, onRampChange, setUseGradations]);
    
    const handleNumGradationsChange = useCallback((e: Event) => {
        const gradations = parseInt((e.target as HTMLInputElement).value);
        onRampChange?.({...ramp, gradations});
    }, [ramp, onRampChange, setUseGradations]);

    const sortedRampStops = [...ramp.stops].sort((s1, s2) => s1.ratio - s2.ratio);

    const gradsCss: string[] = [];
    
    if (gradations && gradations >= 2) {
        const w = 1 / gradations;
        for (let i = 0; i < gradations; i++) {
            const clr = sampleRamp((i + 0.5) * w, sortedRampStops);

            gradsCss.push(`${toCss(clr)} ${(i * w * 100).toFixed(0)}% ${((i + 1) * w * 100).toFixed()}%`)
        }
    }

    const rampSamples = gradsCss.length > 0 ? gradsCss : sortedRampStops.map(s => sampleToCss(s));

    const gradientCss = rampSamples.join(', ');
    const backgroundImage = `linear-gradient(to right, ${gradientCss})`;

    const inputs = ramp.stops.map((s, inx) => {
        const segmentWidth = 1 / (ramp.stops.length - 1);

        const handleChange = (col?: Color) => {
            if (col) {
                const rgba = [col.red, col.green, col.blue, col.alpha];
                onRampChange?.({
                    ...ramp,
                    stops: ramp.stops.map((rs, i) => i === inx ? {...rs, rgba} : rs)
                });
            }
        };

        const handleOffsetChange = (e: Event) => {
            const offset = parseFloat((e.target as HTMLInputElement).value);
            if (!Number.isNaN(offset)) {
                onRampChange?.({
                    ...ramp,
                    stops: ramp.stops.map((rs, i) => i === inx ? {...rs, ratio: offset / 100} : rs)
                });
            }
        };

        const c = new Color(...s.rgba);

        const r = s.ratio === undefined ? inx * segmentWidth : s.ratio;
        const offsetPrc = (r * 100).toFixed(0);
        
        return (<div class={'ramp-sample'}>
            <ColorField value={c}
                label={`Color ${inx + 1}`}
                className={'small'}
                nullable={false}
                key={`smpl_${inx}`}
                onChange={handleChange} />

            <div>
            <label>Offset: {(r * 100).toFixed(0)}%</label>
            </div>

            <input type="range" value={offsetPrc} onChange={handleOffsetChange} />

        </div>);
    });

    return (
        <div class={'color-ramp-controls'}>
            <div class={'ramp-preview-container'}>
                <div class={'ramp-preview'} 
                    style={{backgroundImage}} >
                    <span>0%</span>
                    <span style={{float: 'right'}}>100%</span>
                </div>
                <button onClick={() => setEditActive(!editActive)}>{editActive ? 'Hide edit' : 'Edit'}</button>
            </div>
            <div class={'gradations-controls'}>
                <LabledSwitch label={'Fixed gradations'} 
                    onChange={handleSwitchGradations} 
                    checked={useGradations} />
                {useGradations && <div>
                    <label>Number of gradations: </label>
                    <input type="number" min={2} 
                        value={ramp.gradations || ''} 
                        onChange={handleNumGradationsChange} />
                </div>}
            </div>
            {editActive && <div class={'color-inputs'}>
            {inputs}
            </div>}
        </div>
    )
}

function sampleToCss(s: ColorRampSample) {

    const offset = s.ratio === undefined ? '' : ` ${(s.ratio * 100).toFixed()}%`;
    return toCss(s.rgba) + offset;
}

function toCss(rgba: number[]) {
    const [r, g, b, a] = rgba;
    const rgb = [r, g, b].map(c => (c * 255).toFixed(0)).join(',');
    return `rgba(${rgb}, ${a})`;
}

export function sampleRamp(f: number, stops: ColorRampSample[]) {
    console.assert(stops.length === 2, "At this point support only 2 colors")

    let stop1 = stops[0];
    let stop2 = stops[1];

    if (stop1.ratio > stop2.ratio) {
        stop1 = stops[1];
        stop2 = stops[0];
    }

    const offset1 = stop1.ratio;
    const offset2 = stop2.ratio;
    
    if (f <= offset1) {
        return stop1.rgba;
    }
    
    if (f >= offset2) {
        return stop2.rgba;
    }
    
    const t = (f - offset1) / (offset2 - offset1);
    
    const a = stop1.rgba;
    const b = stop2.rgba;
    
    return [
        (1 - t) * a[0] + t * b[0],
        (1 - t) * a[1] + t * b[1],
        (1 - t) * a[2] + t * b[2],
        (1 - t) * a[3] + t * b[3],
    ];
}
