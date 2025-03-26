import { Entity } from "cesium";
import { ModalPane } from "../misc/elements/modal-pane";
import { useCallback, useState } from "preact/hooks";
import { applyStyleToEntity, StyleChanges } from "../geometry-editor/changes-tracker";

type StyleCopyDialogueProps = {
    visible: boolean;
    entities: Entity[];
    stylesToPropagate: StyleChanges | null;
    onClose?: () => void;
};
export function StyleCopyDialogue({visible, entities, stylesToPropagate, onClose}: StyleCopyDialogueProps) {

    const styleKeys = stylesToPropagate && Object.keys(stylesToPropagate?.style) || [];

    const [selectredProps, setSelectedProps] = useState<string[]>(styleKeys);
    const [selectredEntities, setSelectedEntities] = useState<string[]>(entities.map(e => e.id));

    const handlePropagateApply = useCallback((entities: Entity[], styles: StyleChanges | null) => {
        styles && applyStyleToEntity(entities, styles);
        onClose && onClose();
    }, [entities, onClose]);

    const entitiesList = entities.map(e => 
        <div><input type="checkbox" checked={selectredEntities.includes(e.id)} /> {e.name}</div>
    );

    return (
        <ModalPane visible={visible}>
            <div>
                <div>
                    <button onClick={() => {onClose && onClose()}}>Cancel</button>
                    <button onClick={() => handlePropagateApply(entities, stylesToPropagate)}>Apply to all</button>
                </div>
                <div style={{display: 'flex'}}>
                    <div style={{width: '15em'}}>
                        {entitiesList}
                    </div>
                </div>
            </div>
        </ModalPane>
    );
}