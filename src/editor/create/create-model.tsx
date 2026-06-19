import { useCallback, useContext} from "preact/hooks";
import { CreateEntityInputMode } from "../../geometry-editor/input-new-entity";
import { FileInput } from "../../misc/elements/file-input";
import { EditorContext } from "../editor";
import { modelNameFromFileName } from "../../czml-ext/model-name";

type CreateModelProps = {
    active: boolean;
    disabled: boolean;
    setActiveType: (creationType: CreateEntityInputMode | undefined) => void;
}
export function CreateModel({active, disabled, setActiveType}: CreateModelProps) {

    // TODO: add controls for editing clickCreateController billboard options
    // const clickCreateController = useContext(EditorContext).clickCreateController;

    const controller = useContext(EditorContext).clickCreateController;

    const handleUpload = useCallback((file: File) => {
        if (controller) {
            setActiveType(CreateEntityInputMode.model);
            controller.modelUri = URL.createObjectURL(file);
            controller.modelName = modelNameFromFileName(file.name);
        }
    }, [controller, setActiveType]);
    
    const handleCancel = useCallback(() => {
        setActiveType(undefined);
    }, [setActiveType]);

    return (
        <>
            { !active && <FileInput disabled={disabled} 
                                    name={'Add model'} 
                                    onFile={handleUpload} 
                                    accept=".gltf, .glb" />}

            { active && <div>Click in a map view to set model position</div>}
            { active && <button onClick={handleCancel}>Cancel</button>}
        </>
    );
}