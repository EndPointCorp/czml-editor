import { useCallback, useRef } from 'preact/hooks';
import cls from '../../misc/cls';
import './input-fld.css';

var idCounter = 0;

export type InputFieldProps = {
    label?: string;
    value?: string | number;
    className?: string;
    fixed?: number;
    /**
     * When set, scrolling the wheel over the (focused) field nudges its numeric
     * value by this amount. Left undefined the field behaves as plain text.
     */
    wheelStep?: number;
    onChange?: (value: string) => void;
}
export function InputField({label, value, className, fixed, wheelStep, onChange}: InputFieldProps) {
    const id = 'input-' + (idCounter++);
    const inputRef = useRef<HTMLInputElement>(null);

    const inputHandler = useCallback((e: Event) => {
        onChange && onChange((e.target as HTMLInputElement).value);
    }, [onChange]);

    const wheelHandler = useCallback((e: WheelEvent) => {
        if (wheelStep === undefined) {
            return;
        }
        // Only adjust while focused, so hovering doesn't hijack page scrolling
        if (document.activeElement !== inputRef.current) {
            return;
        }

        e.preventDefault();

        const current = Number(value);
        const base = isNaN(current) ? 0 : current;
        const delta = e.deltaY < 0 ? wheelStep : -wheelStep;

        // Round to the step's precision to avoid floating point noise
        const decimals = (String(wheelStep).split('.')[1] || '').length;
        const next = Number((base + delta).toFixed(decimals));

        onChange && onChange('' + next);
    }, [wheelStep, value, onChange]);

    const needsFormatToFixed = value !== undefined && typeof value === 'number' && wheelStep !== undefined && fixed;
    const v = needsFormatToFixed ? value.toFixed(fixed) : value;

    return (
        <div class={cls('input-container', 'generic', className)}>
            <input ref={inputRef} type={'text'} class={cls('input', value !== undefined && 'not-empty')}
                id={id}
                value={v}
                onChange={inputHandler}
                onWheel={wheelStep !== undefined ? wheelHandler : undefined}></input>
            {label && <label for={id} class="label">{label}</label>}
            <div class="underline"></div>
        </div>
    );
}
