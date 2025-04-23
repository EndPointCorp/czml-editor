import { useCallback, useState } from "preact/hooks";
import { Color as CesiumColor, Color } from "cesium";

import './color-fld.css';
import { GradientSlider } from "../../misc/elements/hue-slider";

import imgUndefColor from '../../assets/undef-color.svg';
import imgChecker from '../../assets/checker-s.png';
import { DebounceInput } from "../../misc/elements/debounced-input";
import cls from "../../misc/cls";

type HSLA = [h: number, s: number, l: number, a: number];

export type ColorFieldProps = {
    value?: CesiumColor;
    label?: string;
    alpha?: boolean;
    nullable?: boolean;
    className?: string;
    onChange: (value: CesiumColor | undefined) => void;
};
export function ColorField({value, label, alpha, nullable, className, onChange}: ColorFieldProps) {

    const [hsla, setHsla] = useState<HSLA>(toHsla(value));

    const handleH = useCallback((val: number) => {
        const [_h, s, l, a] = hsla;
        
        const newHsla = [val, s, l, a] as HSLA;
        setHsla(newHsla);

        onChange && onChange(toColor(newHsla));
    }, [hsla, setHsla, onChange]);

    const handleS = useCallback((val: number) => {
        const [h, _s, l, a] = hsla;
        
        const newHsla = [h, val, l, a] as HSLA;
        setHsla(newHsla);

        onChange && onChange(toColor(newHsla));
    }, [hsla, setHsla, onChange]);

    const handleL = useCallback((val: number) => {
        const [h, s, _l, a] = hsla;
        
        const newHsla = [h, s, val, a] as HSLA;
        setHsla(newHsla);

        onChange && onChange(toColor(newHsla));
    }, [hsla, setHsla, onChange]);

    const handleA = useCallback((val: number) => {
        const [h, s, l, _a] = hsla;
        
        const newHsla = [h, s, l, val] as HSLA;
        setHsla(newHsla);

        onChange && onChange(toColor(newHsla));
    }, [hsla, setHsla, onChange]);

    const handleTextInput = useCallback((val: string) => {
        if (val === '' || val === 'none' || val === 'undefined') {
            onChange && onChange(undefined);
        }
        
        let newcolor = Color.fromCssColorString(val);
        const [_h, _s, _l, a] = hsla;
        if (newcolor.alpha === 1 && a < 1.0) {
            newcolor = newcolor.withAlpha(a);
        }

        if (newcolor) {
            onChange && onChange(newcolor);
            setHsla(toHsla(newcolor));
        }
        
    }, [hsla, setHsla, onChange]);

    const [h, s, l, a] = hsla;

    const [sf, st] = getSGradient(hsla);
    const [lf, lm, lt] = getLGradient(hsla);
    const [af, at] = getAGradient(hsla);

    const previewStyle = {backgroundColor: toCssString(hsla)};
    const hex = toColor(hsla).toCssHexString();
    const textValue = value ? hex : 'none';

    const nulSupported = nullable === undefined || !!nullable;

    return (
    <div class={cls('input-container', 'color-fld', 'button-size-s', className)}>
        {label && <label class={'label'}>{label}</label>}

        <div class={'picker-layout'}>
            <div class={'picker-preview-container'}>
                <div class={'checker'}>
                    {value && <div class={'preview'} style={previewStyle}>
                    </div>}
                    {value === undefined && <div class={'preview-none'} >
                        <img src={imgUndefColor}/>
                    </div>}
                </div>
            </div>
            <div class={'picker-sliders'}>
                <GradientSlider value={h} onChange={handleH} />
                
                <GradientSlider value={s} gradient={[sf, st]}
                    onChange={handleS} />
                
                <GradientSlider value={l} gradient={[lf, lm, lt]}
                    onChange={handleL} />
                
                {alpha && 
                <GradientSlider value={a} gradient={[af, at]} 
                    onChange={handleA} 
                    backgroundImage={imgChecker} />}

            </div>
        </div>

        <div class={'color-text-input'}>
            <DebounceInput key={hex} value={textValue}
                debounceTimeout={500}
                debouncedOnChange={handleTextInput} />
            {nulSupported && <button class={'reset-value'} 
                onClick={() => {onChange && onChange(undefined)}}>
                    <img src={imgUndefColor}></img>
            </button>}
        </div>
        
        <div class="underline"></div>
    </div>
    );
}

// [h, s, l, a] all in [0..1]
function toHsla(value?: Color) {
    const [r = 1, g = 1, b = 1, a = 1] = [
        value?.red, 
        value?.green, 
        value?.blue, 
        value?.alpha
    ];

    const v = Math.max(r, g, b);
    const c = v - Math.min(r, g, b)
    const f = (1 - Math.abs(v + v - c - 1));

    const vr = (g - b) / c;
    const vg = 2 + (b - r) / c;
    const vb = 4 + (r - g) / c;
    const _h = c && ((v == r) ? vr : ((v == g) ? vg : vb));
    
    const h = 60 * (_h < 0 ? _h + 6 : _h);
    const s = f ? c / f : 0;
    const l = (v + v - c) / 2;

    return [h / 360, s, l, a] as HSLA;
}

function toColor(hsla: HSLA) {
    const [h, s, l, a] = hsla;
    return CesiumColor.fromHsl(h, s, l, a);
}

function getSGradient(hsla: HSLA) {
    const [h, _s, l] = hsla;

    return [
        `hsl(${(h * 360).toFixed(0)}, 0%, ${(l * 100).toFixed(1)}%)`,
        `hsl(${(h * 360).toFixed(0)}, 100%, ${(l * 100).toFixed(1)}%)`,
    ]
}

function getLGradient(hsla: HSLA) {
    const [h, s, _l] = hsla;
    
    return [
        `hsl(${(h * 360).toFixed(0)}, ${(s * 100).toFixed(1)}%, 0%)`,
        `hsl(${(h * 360).toFixed(0)}, ${(s * 100).toFixed(1)}%, 50%)`,
        `hsl(${(h * 360).toFixed(0)}, ${(s * 100).toFixed(1)}%, 100%)`,
    ];
}

function getAGradient(hsla: HSLA) {
    const [h, s, l] = hsla;

    return [
        `hsl(${(h * 360).toFixed(0)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%, 0)`,
        `hsl(${(h * 360).toFixed(0)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%, 1)`,
    ]
}

function toCssString(hsla: HSLA) {
    const [h, s, l, a = 1] = hsla;
    return `hsla(${(h * 360).toFixed(0)}, ${(s * 100).toFixed(1)}%, ${(l * 100).toFixed(1)}%, ${a.toFixed(3)})`
}
