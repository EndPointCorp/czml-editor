import "./entities-data-table.css";

import { Color, ColorMaterialProperty, ConstantProperty, Entity } from "cesium";
import { useMemo, useState } from "preact/hooks";
import { EntitiesExtra } from "../editor/editor";
import { TypeIcon } from "../editor/entity-list/type-icon";
import { types } from "../editor/meta/meta";
import { ModalPane } from "../misc/elements/modal-pane";
import { DataStylingControls } from "./data-styling-controls";
import { DataTable, DataTableColumn } from "./data-table";
import { ColoringConfig, StylingAction } from "./coloring-controls";

export type Styling = {
    colorValues: Color[];
    coloringConfig: ColoringConfig;
}

type EntitiesDataTableProps = {
    entities: Entity[];
    entitiesExtra?: EntitiesExtra;
    onClose?: () => void;
}
export function EntitiesDataTable({entities, entitiesExtra, onClose}: EntitiesDataTableProps) {
    const propertyNames = new Set();
    entities.forEach(e => e.properties?.propertyNames.forEach(name => propertyNames.add(name)));
    const propNames = Array.from(propertyNames) as string[];

    const [preview, setPreview] = useState<Styling>();
    const previewColumn: (DataTableColumn | undefined) = useMemo(() => {
        if (preview === undefined) {
            return undefined;
        }

        return {
            header: 'Preview',
            accessor: (_e, inx) => {
                const valueColor = preview?.colorValues?.[inx];
    
                const fillAction = preview?.coloringConfig?.fillAction;
                const fillConst = preview?.coloringConfig?.fillColorConst;
    
                const outlineAction = preview?.coloringConfig?.outlineAction;
                const outlineConst = preview?.coloringConfig?.outlineColorConst;
    
                const fillColor = switchColorAction(fillAction, valueColor, fillConst);
                const outlineColor = switchColorAction(outlineAction, valueColor, outlineConst);
    
                return <ColorStylePreview 
                    backgroundColor={ fillColor?.toCssHexString() } 
                    borderColor={ outlineColor?.toCssHexString() }
                />
            }
        };

    }, [preview]);

    const columns: DataTableColumn[] = [
        {
            header: 'Name', 
            accessor: (e: Entity) => 
                e.name || entitiesExtra?.[e.id]?.namePlaceholder || '(empty)'
        }, {
            header: 'Style',
            accessor: (e: Entity) =>
                <StylePreview entity={e}/>
        }, 
        previewColumn,
        ...propNames.map(pName => ({
            header: pName, 
            accessor: (e: Entity) => {
                return e.properties?.getValue()[pName as string] || '';
            }})
        )
    ].filter(c => !!c) as DataTableColumn[];

    // Expose entities to global namespace
    (window as any).entities = entities;

    return (
        <ModalPane visible={true} className={'data-styling-dialogue'}>
            <div class={'actions'}>
                <button onClick={() => onClose && onClose()}>Close</button>
            </div>
            <DataStylingControls entities={entities} 
                propNames={propNames} setPreview={setPreview} />
            <div class={'scroll data-table-container'}>
                <DataTable columns={columns} data={entities} />
            </div>
        </ModalPane>
    );
}

type StylePreviewProps = {
    entity: Entity;
};
function StylePreview({entity}: StylePreviewProps) {

    const type = types.find(tname => (entity as any)[tname] !== undefined);

    if (entity.polygon?.material instanceof ColorMaterialProperty) {
        const color = (entity.polygon?.material as ColorMaterialProperty).color?.getValue();
        const outline = entity.polygon?.outlineColor?.getValue();
        
        const backgroundColor = color instanceof Color ? color.toCssHexString() : undefined;
        const borderColor = outline instanceof Color ? outline.toCssHexString() : undefined;

        return <ColorStylePreview {...{type, backgroundColor, borderColor}} />
    }
    return <span></span>
}

type ColorStylePreviewProps = {
    type?: string;
    backgroundColor?: string;
    borderColor?: string;
};
function ColorStylePreview({type, backgroundColor, borderColor}: ColorStylePreviewProps) {

    const border = borderColor ? `0.2em solid ${borderColor}` : undefined;

    return <span>
        {type && <TypeIcon type={type} />}
        {(backgroundColor || borderColor) && 
            <span class={'style-preview'} style={{
                backgroundColor,
                border
            }} />
        }
    </span>
}

export function applyStyles(entities: Entity[], styling: Styling) {

    const {colorValues, coloringConfig } = styling;

    entities.forEach((entity: Entity, inx: number) => {
        const valueColor = colorValues[inx];

        if (entity.polygon) {
            if (coloringConfig.fillAction !== StylingAction.LEAVE_UNCHANGED) {
                const fillColor = switchColorAction(
                    coloringConfig.fillAction, valueColor, coloringConfig.fillColorConst);
                
                entity.polygon.material = new ColorMaterialProperty(fillColor);

                if (fillColor === undefined) {
                    entity.polygon.fill = new ConstantProperty(false);
                }
            }
            
            if (coloringConfig.outlineAction !== StylingAction.LEAVE_UNCHANGED) {
                const outlineColor = switchColorAction(
                    coloringConfig.outlineAction, valueColor, coloringConfig.outlineColorConst);
                
                entity.polygon.outlineColor = new ConstantProperty(outlineColor);

                if (outlineColor === undefined) {
                    entity.polygon.outline = new ConstantProperty(false);
                }
            }
        }

    });
}

function switchColorAction(action: StylingAction, valueColor: Color, colorConst: Color | undefined) {
    switch (action) {
        case StylingAction.SET_CONSTANT:
            return colorConst;

        case StylingAction.CLEAR:
            return undefined;
        
        case StylingAction.SET_VALUE:
            return valueColor;
        
        default:
            return undefined;
    }
}

