import { useCallback, useContext, useState } from "preact/hooks";
import { CreateEntityInputMode } from "../../geometry-editor/input-new-entity";
import { FileInput } from "../../misc/elements/file-input";
import { EditorContext } from "../editor";
import { modelFromFiles } from "../../czml-ext/model-from-files";

type CreateModelProps = {
    active: boolean;
    disabled: boolean;
    setActiveType: (creationType: CreateEntityInputMode | undefined) => void;
}
export function CreateModel({active, disabled, setActiveType}: CreateModelProps) {

    // TODO: add controls for editing clickCreateController billboard options
    // const clickCreateController = useContext(EditorContext).clickCreateController;

    const controller = useContext(EditorContext).clickCreateController;

    const [error, setError] = useState<string | undefined>(undefined);
    const [missing, setMissing] = useState<string[]>([]);

    const handleUpload = useCallback(async (files: File[]) => {
        if (!controller) {
            return;
        }

        setError(undefined);
        setMissing([]);

        const model = await modelFromFiles(files);
        if (!model) {
            setError('Select a .glb or .gltf file');
            return;
        }

        setMissing(model.missing);

        setActiveType(CreateEntityInputMode.model);
        controller.modelUri = model.uri;
        controller.modelName = model.name;
    }, [controller, setActiveType]);

    const handleCancel = useCallback(() => {
        setActiveType(undefined);
        setError(undefined);
        setMissing([]);
    }, [setActiveType]);

    return (
        <>
            { !active && <FileInput disabled={disabled}
                                    name={'Add model'}
                                    onFiles={handleUpload}
                                    accept=".gltf, .glb, .bin, image/*" />}

            { error && <div class={'model-files-error'}>{error}</div>}

            { missing.length > 0 && <div class={'model-files-warning'}>
                Missing referenced file{missing.length > 1 ? 's' : ''}: {missing.join(', ')}.
                Re-add the model selecting these file{missing.length > 1 ? 's' : ''} too.
            </div>}

            { active && <div>Click in a map view to set model position</div>}
            { active && <button onClick={handleCancel}>Cancel</button>}
        </>
    );
}