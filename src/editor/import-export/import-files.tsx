import { useCallback } from "preact/hooks";
import { FileInput } from "../../misc/elements/file-input";

export function ImportFromFile() {

    const fileSelected = useCallback((file: File) => {

    }, []);

    return (
        <FileInput name="Import" 
                accept={".csv, .tsv"} 
                onFile={fileSelected} />
    );
}