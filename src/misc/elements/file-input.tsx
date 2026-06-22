import { useCallback, useRef } from "preact/hooks";

export type FileInputProps = {
    name?: string;
    accept?: string;
    disabled?: boolean;
    onFile?: (file: File) => void;
    onFiles?: (files: File[]) => void;
}
export function FileInput({onFile, onFiles, accept, name, disabled}: FileInputProps) {

    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(() => {
        const files = Array.from(inputRef.current?.files ?? []);

        if (onFiles) {
            onFiles(files);
        }

        if (onFile) {
            for (const f of files) {
                onFile(f);
            }
        }
    }, [onFile, onFiles, inputRef]);

    return (
        <>
            <button disabled={disabled} onClick={() => {inputRef.current?.click()}}>{name || 'Load'}</button>

            <input ref={inputRef} onChange={handleFileSelect}
                type="file" id="file" style={{display: 'none'}}
                multiple accept={accept}></input>
        </>
    );
}