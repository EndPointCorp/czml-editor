import { Color, ConstantProperty, DistanceDisplayCondition, Entity, NearFarScalar, PolygonGraphics } from "cesium";
import { ModalPane } from "../misc/elements/modal-pane";
import { useCallback, useState } from "preact/hooks";
import { applyStyleToEntity, StyleChanges } from "../geometry-editor/changes-tracker";
import { DistanceDisplayConditionAsVector, getPropertyMeta, metaByType, NearFarAsVector, PropertyMeta, PropertyTypeEnum, PropertyTypeVector, TypeMetaKey } from "./meta/meta";
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

        const preview = <PropertyValuePreview value={styleValue} propMeta={propMeta} readonly={true} />

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
    propMeta?: PropertyMeta;
    readonly: boolean
}
function PropertyValuePreview({value, propMeta, readonly}: PropertyValuePreviewProps) {
    if (readonly) {
        switch (propMeta?.type) {
            case 'string':
            return <div>{JSON.stringify(value)}</div>;
    
            case 'number':
            return <div>{JSON.stringify(value)}</div>;
            
            case 'boolean':
            return <div>{JSON.stringify(value)}</div>;
            
            case 'vector': {
                const {size, componentNames = ['x', 'y', 'z', 'w']} = propMeta as PropertyTypeVector;
                return <VectorPreview {...{value, size, componentNames}} />;
            }
            
            case 'distance-display-condition': {
                const {size, componentNames = []} = DistanceDisplayConditionAsVector;
    
                const arrayValue = value && [
                    (value as DistanceDisplayCondition)?.near,
                    (value as DistanceDisplayCondition)?.far,
                ];
                
                return <VectorPreview value={arrayValue} {...{size, componentNames}} />;
            }
            
            case 'near-far-scalar': {
            const {size, componentNames = []} = NearFarAsVector;
    
                const arrayValue = value && [
                    (value as NearFarScalar)?.near,
                    (value as NearFarScalar)?.nearValue,
                    (value as NearFarScalar)?.far,
                    (value as NearFarScalar)?.farValue,
                ];
                
                return <VectorPreview value={arrayValue} {...{size, componentNames}} />;
            }
    
            case 'enum': {
                const enumObj = (propMeta as PropertyTypeEnum).enum;
                const [val] = Object.entries(enumObj).find(([_, ev]) => ev === value) || [];
                return <div>{val}</div>;
            }
    
            case 'color': {
                const colorStr = (value as Color)?.toCssHexString() || 'none';
                return <div><span style={{backgroundColor: `${colorStr}`}}>{colorStr}</span></div>;
            }
            
            case 'material': {
                const val = value?.color?.valueOf();
                const colorStr = (val as Color)?.toCssHexString() || 'none';
                return <div><span style={{backgroundColor: `${colorStr}`}}>{colorStr}</span></div>;

            }
            
            case 'image-url':
            return <div><img style={{maxWidth: '2em', maxHeight: '2em'}} src={value}/></div>;
    
            default:
            // @ts-ignore ignore, unreachable at the moment
            return <div>{JSON.stringify(value)}</div>
        }
    }
    else {
        if (propMeta) {
            const feature = propMeta && {[propMeta.name]: new ConstantProperty(value)};
    
            return <PropertyField property={propMeta} subject={feature as unknown as SupportedGraphic} />
        } 

        return <span>{JSON.stringify(value)}</span>
    }
        
}

type VectorPreviewProps = {
    value: any[];
    size: number;
    componentNames: string[];
}
function VectorPreview({value, size, componentNames}:VectorPreviewProps) {
    const cmpnts = [];
    for (var i = 0; i < size; i++) {
        cmpnts.push(<div>
            <div>{componentNames[i]}</div>
            <div>{value[i]}</div>
        </div>);
    }

    return <div>
        {cmpnts}
    </div>
}