import { useCallback } from 'preact/hooks';
import cls from '../../misc/cls';
import './input-fld.css';

var idCounter = 0;

export type InputFieldProps = {
    label?: string;
    value?: string;
    className?: string;
    onChange?: (value: string) => void;
}
export function InputField({label, value, className, onChange}: InputFieldProps) {
    const id = 'input-' + (idCounter++);

    const inputHandler = useCallback((e: Event) => {
        onChange && onChange((e.target as HTMLInputElement).value);
    }, [onChange]);

    return (
        <div class={cls('input-container', 'generic', className)}>
            <input type={'text'} class={cls('input', value !== undefined && 'not-empty')} 
                id={id} 
                value={value}
                onChange={inputHandler}></input>
            {label && <label for={id} class="label">{label}</label>}
            <div class="underline"></div>
        </div>
    );
}
