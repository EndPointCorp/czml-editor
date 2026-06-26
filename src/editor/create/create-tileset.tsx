import { useCallback, useContext, useState } from "preact/hooks";
import { CreateEntityInputMode } from "../../geometry-editor/input-new-entity";
import { FileInput } from "../../misc/elements/file-input";
import { EditorContext } from "../editor";
import { tilesetFromZip } from "../../czml-ext/tileset-zip";

type CreateTilesetProps = {
    active: boolean;
    disabled: boolean;
    setActiveType: (creationType: CreateEntityInputMode | undefined) => void;
}
export function CreateTileset({active, disabled, setActiveType}: CreateTilesetProps) {

    const controller = useContext(EditorContext).clickCreateController;

    const [tilesetSource, setTilesetSource] = useState<string>();
    const [error, setError] = useState<string | undefined>(undefined);

    const handleUpload = useCallback(async (file: File) => {
        if (!controller) {
            return;
        }

        setError(undefined);

        const tileset = await tilesetFromZip(file);
        if (!tileset) {
            setError('Zip must contain a tileset.json and its tile files');
            return;
        }

        setActiveType(CreateEntityInputMode.tileset);
        controller.tilesetUri = tileset.uri;
        controller.tilesetName = tileset.name;

        setTilesetSource('upload');

    }, [controller, setActiveType]);

    const handleUri = useCallback(() => {
        if (!controller) {
            return;
        }

        setError(undefined);

        setActiveType(CreateEntityInputMode.tileset);
        controller.tilesetUri = 'tileset.json';
        controller.tilesetName = 'Tileset';
        setTilesetSource('uri');

    }, [controller, setActiveType]);

    const srcSet = tilesetSource !== undefined;

    const handleCancel = useCallback(() => {
        setActiveType(undefined);
        setError(undefined);
    }, [setActiveType]);

    return (
        <>
            { !active && <button 
                disabled={disabled}
                onClick={() => setActiveType(CreateEntityInputMode.tileset)}
            >
                Add Tileset
            </button> }

            { active && !srcSet && <FileInput name={'Upload'}
                                onFile={handleUpload}
                                accept=".zip" />}

            { active && !srcSet && <button onClick={() => handleUri()}>
                Provide uri
            </button>}

            { error && <div class={'model-files-error'}>{error}</div>}

            { active && srcSet && <div>Click in the map to place the tileset</div>}
            { active && <button onClick={handleCancel}>Cancel</button>}
        </>
    );
}
