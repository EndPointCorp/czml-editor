import { useCallback, useContext, useState } from "preact/hooks";
import { CreateEntityInputMode } from "../../geometry-editor/input-new-entity";
import { FileInput } from "../../misc/elements/file-input";
import { LabledSwitch } from "../../misc/elements/labled-switch";
import { EditorContext } from "../editor";
import { tilesetFromZip } from "../../czml-ext/tileset-zip";
import { InputField } from "../fields/input-fld";

type CreateTilesetProps = {
    active: boolean;
    disabled: boolean;
    setActiveType: (creationType: CreateEntityInputMode | undefined) => void;
}
export function CreateTileset({active, disabled, setActiveType}: CreateTilesetProps) {

    const controller = useContext(EditorContext).clickCreateController;

    const [tilesetSource, setTilesetSource] = useState<string>();
    const [error, setError] = useState<string | undefined>(undefined);
    const [uriValue, setUriValue] = useState('tileset.json');
    // Changed from true to false by default
    const [useTilesetPosition, setUseTilesetPosition] = useState(false);

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

    const handleUriConfirm = useCallback(() => {
        if (!controller) {
            return;
        }

        setError(undefined);

        controller.tilesetUri = uriValue;
        controller.tilesetName = 'Tileset';

        if (useTilesetPosition) {
            const entity = controller.createTileset(undefined);
            controller.handleNewEntity(entity);
            setActiveType(undefined);
        } else {
            setActiveType(CreateEntityInputMode.tileset);
            setTilesetSource('uri');
        }
    }, [controller, setActiveType, uriValue, useTilesetPosition]);

    const srcSet = tilesetSource !== undefined;

    const needsClick = tilesetSource === 'upload' || (tilesetSource === 'uri' && !useTilesetPosition);

    const handleCancel = useCallback(() => {
        setActiveType(undefined);
        setError(undefined);
        setTilesetSource(undefined);
        setUriValue('tileset.json');
        // Changed from true to false
        setUseTilesetPosition(false);
    }, [setActiveType]);

    return (
        <>
            { !active && <button 
                disabled={disabled}
                onClick={() => setActiveType(CreateEntityInputMode.tileset)}
            >
                Add Tileset
            </button> }

            { active && !srcSet && <div>
                <p>Set tileset URI</p>
                <InputField value={uriValue} label="Tileset URI"
                        onChange={(uri) => setUriValue(uri)} />

                <p>Or upload tileset as zip archive</p>
                <FileInput name={'Upload'}
                        onFile={handleUpload}
                        accept=".zip" />

                <LabledSwitch checked={useTilesetPosition}
                    onChange={setUseTilesetPosition}
                    label={'Use position from tileset'} />
                
            </div>}

            { error && <div class={'model-files-error'}>{error}</div>}

            { active && needsClick && <div>Click in the map to place the tileset</div>}
            { active && <div style={{marginTop: '1em'}}>
                { !srcSet && <button onClick={handleUriConfirm}>
                    Add Tileset
                </button>
                }
                { active && <button onClick={handleCancel}>Cancel</button>}
            </div>}
        </>
    );
}