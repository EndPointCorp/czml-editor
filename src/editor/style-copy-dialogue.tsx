import { ConstantProperty, Entity, PolygonGraphics } from "cesium";
import { ModalPane } from "../misc/elements/modal-pane";
import { useCallback, useState } from "preact/hooks";
import { applyStyleToEntity, StyleChanges } from "../geometry-editor/changes-tracker";
import { getPropertyMeta, metaByType, PropertyMeta, TypeMetaKey } from "./meta/meta";
import { PropertyField, SupportedGraphic } from "./fields/property-fld";

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

    const styleChanges = styleKeys.map(styleProp => {
        
        const styleValue = stylesToPropagate?.style[styleProp];
        const [featureType, propName] = styleProp.split('.');

        const propMeta = getPropertyMeta(featureType as TypeMetaKey, propName);

        const preview = <PropertyValuePreview value={styleValue} propMeta={propMeta} />

        return <div key={styleProp}>
            <input type="checkbox" checked={true} /> {styleProp} { preview } 
        </div>
    })

    return (
        <ModalPane visible={visible}>
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                <div style={{flex: '0 1 auto'}}>
                    <button onClick={() => {onClose && onClose()}}>Cancel</button>
                </div>
                <div style={{flex: '1 0 1em', overflow: 'hidden'}}>
                    <div style={{height: '100%'}}>
                        <h4>Style changes to be applied</h4>
                        {styleChanges}
                    </div>


                    <button onClick={() => handlePropagateApply(entities, stylesToPropagate)}>Apply to all</button>
                    {/* <div style={{width: '15em', maxHeight: '25%', overflowY: 'scroll'}}>
                        {entitiesList}
                    </div> */}
                </div>
            </div>
        </ModalPane>
    );
}

type PropertyValuePreviewProps = {
    value?: any;
    propMeta?: PropertyMeta
}
function PropertyValuePreview({value, propMeta}: PropertyValuePreviewProps) {
    if (propMeta) {
        const feature = propMeta && {[propMeta.name]: new ConstantProperty(value)};

        return <PropertyField property={propMeta} subject={feature as unknown as SupportedGraphic} />
    } 
        
    return <span>{JSON.stringify(value)}</span>
}