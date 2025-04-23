import { useCallback, useRef, useState } from "preact/hooks";

type DebouncerT = {
    value: string;
    timeout: ReturnType<typeof setTimeout> | null;
};

type InputProps = {
    value: string;
    debounceTimeout?: number;
    debouncedOnChange?: (val: string) => void;
}
export function DebounceInput({value, debounceTimeout, debouncedOnChange, ...rest}: InputProps) {

    const [text, setText] = useState(value);

    const debouncerRef = useRef<DebouncerT>({
        value,
        timeout: null
    });

    const handleInput = useCallback((e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        setText(val);

        debouncerRef.current.value = val;
        if (debouncerRef.current.timeout) {
            clearTimeout(debouncerRef.current.timeout);
        }

        debouncerRef.current.timeout = setTimeout(() => {
            debouncedOnChange?.(debouncerRef.current.value);
            debouncerRef.current.timeout = null;
        }, debounceTimeout || 500);

    }, [setText, debounceTimeout, debouncedOnChange, debouncerRef]);

    return (
        <input value={text} onChange={handleInput} {...rest} />
    );
}
