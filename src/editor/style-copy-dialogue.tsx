import { Color, ConstantProperty, DistanceDisplayCondition, Entity, NearFarScalar } from "cesium";
import { useCallback, useMemo, useState } from "preact/hooks";
import { applyStyleToEntity, StyleChanges } from "../geometry-editor/changes-tracker";
import camelCaseToTitle from "../misc/cammelToTitle";
import { LabledSwitch } from "../misc/elements/labled-switch";
import { ModalPane } from "../misc/elements/modal-pane";
import { PropertyField, SupportedGraphic } from "./fields/property-fld";
import { DistanceDisplayConditionAsVector, getPropertyMeta, NearFarAsVector, PropertyMeta, PropertyTypeEnum, PropertyTypeVector, TypeMetaKey } from "./meta/meta";

import "./style-copy-dialogue.css"

type StylesMap = {
    [key: string]: any
};

type StyleCopyDialogueProps = {
    visible: boolean;
    entities: Entity[];
    stylesToPropagate: StyleChanges | null;
    onClose?: () => void;
};
export function StyleCopyDialogue({visible, entities, stylesToPropagate, onClose}: StyleCopyDialogueProps) {

    const styleKeys = stylesToPropagate && Object.keys(stylesToPropagate?.style) || [];
    const featureTypes = styleKeys.map(k => k.split('.')[0]).filter((v, i, arr) => arr.indexOf(v) === i);
    
    const applicableEntities = useMemo(() => {
        return entities
            .filter(e => featureTypes.some(ft => (e as any)[ft]))
    }, [entities, featureTypes]);
    const applicableEntityIds = useMemo(() => applicableEntities.map(e => e.id), [applicableEntities]);

    const [readonlyPreview, setReadonlyPreview] = useState(true);
    const [selectredProps, setSelectedProps] = useState<string[]>(styleKeys);
    const [selectredEntities, setSelectedEntities] = useState<string[]>(applicableEntityIds);
    const [scrathStyles, setScratchStyles] = useState<StylesMap>(stylesToPropagate?.style || {});

    const handlePropagateApply = useCallback(() => {
        if (scrathStyles) {
            const subjEntities = applicableEntities.filter(e => selectredEntities.includes(e.id));
            const selectedStyles = Object.fromEntries(
                Object.entries(scrathStyles)
                    .filter(([key]) => selectredProps.includes(key))
            );
    
            applyStyleToEntity(subjEntities, selectedStyles);
        }
        onClose && onClose();
    }, [applicableEntities, selectredEntities, selectredProps, scrathStyles,  onClose]);

    const entitiesList = applicableEntities.map(e => {
        const sel = selectredEntities.includes(e.id);
        const handleEntSelection = () => {
            if (!sel) {
                setSelectedEntities([...selectredEntities, e.id]);
            }
            else {
                setSelectedEntities(selectredEntities.filter(se => se !== e.id));
            }
        }

        return (
        <div><input type="checkbox" 
            checked={sel}
            onChange={handleEntSelection}
        />
            {e.name}
        </div>);
    });

    const styleChanges = styleKeys.map(styleProp => {
        
        const styleValue = scrathStyles[styleProp];
        const [featureType, propName] = styleProp.split('.');

        const propMeta = getPropertyMeta(featureType as TypeMetaKey, propName);

        const preview = <PropertyValuePreview value={styleValue} 
            onChange={(val) => {setScratchStyles({...scrathStyles, [styleProp]: val})}}
            propMeta={propMeta} readonly={readonlyPreview} />

        const [geomType, propKey] = styleProp.split('.') || [];

        const selected = selectredProps.includes(styleProp);

        const handleSelectionChange = () => {
            if (!selected) {
                setSelectedProps([...selectredProps, styleProp]);
            }
            else {
                setSelectedProps(selectredProps.filter(sp => sp !== styleProp));
            }
        }

        return <div class={'style-change-entry'} key={styleProp}>
            <input type="checkbox" 
                checked={selected} 
                onChange={handleSelectionChange} /> 
            {camelCaseToTitle(geomType)}
            <span>:&nbsp;</span>
            {camelCaseToTitle(propKey)}
            { preview } 
        </div>
    })

    return (
        <ModalPane visible={visible}>
            <div style={{display: 'flex', flexDirection: 'column', height: '100%'}}>
                <div style={{flex: '0 1 auto'}}>
                    <button onClick={() => {onClose && onClose()}}>Cancel</button>
                    <button onClick={handlePropagateApply}>Apply to selected</button>
                </div>
                <div style={{flex: '1 0 1em', overflow: 'hidden', display: 'flex', flexDirection: 'row'}}>
                    <div style={{height: '100%', display: 'flex', flexDirection: 'column', width: '330px'}}>
                        <h4>Style changes to be applied</h4>
                        <LabledSwitch label={'Edit styles'} checked={!readonlyPreview} onChange={val => setReadonlyPreview(!val)} />
                        <div style={{overflowY: 'scroll', flex: '1, 0, auto'}}>
                            {styleChanges}
                        </div>
                    </div>
                    <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                        <h4>Entities to apply styles to</h4>
                        
                        <div>
                            <button class={'size-s'} onClick={() => {setSelectedEntities(applicableEntities.map(e => e.id))}}>Select all</button>
                            <button class={'size-s'} onClick={() => {setSelectedEntities([])}}>Deselect all</button>
                        </div>

                        <div style={{flex: '1, 0, auto', overflowY: 'scroll'}}>
                            {entitiesList}
                        </div>
                    </div>
                </div>
            </div>
        </ModalPane>
    );
}

type PropertyValuePreviewProps = {
    value?: any;
    onChange?: (val: any) => void;
    propMeta?: PropertyMeta;
    readonly: boolean
}
function PropertyValuePreview({value, propMeta, onChange, readonly}: PropertyValuePreviewProps) {
    if (readonly) {
        switch (propMeta?.type) {
            case 'string':
            return <div class={'style-preview-value'}>{JSON.stringify(value)}</div>;
    
            case 'number':
            return <div class={'style-preview-value'}>{JSON.stringify(value)}</div>;
            
            case 'boolean':
            return <div class={'style-preview-value'}>{JSON.stringify(value)}</div>;
            
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
                return <div class={'style-preview-value'}>{val}</div>;
            }
    
            case 'color': {
                const colorStr = (value as Color)?.toCssHexString() || 'none';
                return <div class={'style-preview-value'}><span class={'color-preview'} style={{backgroundColor: `${colorStr}`}}></span>{colorStr}</div>;
            }
            
            case 'material': {
                const val = value?.color?.valueOf();
                const colorStr = (val as Color)?.toCssHexString() || 'none';
                return <div class={'style-preview-value'}><span class={'color-preview'} style={{backgroundColor: `${colorStr}`}}></span>{colorStr}</div>;

            }
            
            case 'image-url':
            return <div class={'style-preview-value'}><img style={{maxWidth: '2em', maxHeight: '2em'}} src={value}/></div>;
    
            default:
            // @ts-ignore ignore, unreachable at the moment
            return <div>{JSON.stringify(value)}</div>
        }
    }
    else {
        if (propMeta) {
            const feature = propMeta && {[propMeta.name]: new ConstantProperty(value)};
    
            return <PropertyField property={propMeta} onChange={onChange}
                subject={feature as unknown as SupportedGraphic} />
        } 

        return <div>{JSON.stringify(value)}</div>
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
            <div class={'component-name'}>{componentNames[i]}</div>
            <div class={'component-value'}>{value[i]}</div>
        </div>);
    }

    return <div class={'style-preview-value style-preview-value-vector'}>
        {cmpnts}
    </div>
}