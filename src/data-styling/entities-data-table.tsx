
import { Color, ColorMaterialProperty, Entity } from "cesium";
import { useState } from "preact/hooks";
import { EntitiesExtra } from "../editor/editor";
import { TypeIcon } from "../editor/entity-list/type-icon";
import { types } from "../editor/meta/meta";
import { ModalPane } from "../misc/elements/modal-pane";
import { DataStylingControls } from "./data-styling-controls";
import { DataTable, DataTableColumn } from "./data-table";
import "./entities-data-table.css";

type EntitiesDataTableProps = {
    entities: Entity[];
    entitiesExtra?: EntitiesExtra;
    onClose?: () => void;
}
export function EntitiesDataTable({entities, entitiesExtra, onClose}: EntitiesDataTableProps) {
    const propertyNames = new Set();
    entities.forEach(e => e.properties?.propertyNames.forEach(name => propertyNames.add(name)));
    const propNames = Array.from(propertyNames) as string[];

    const [preview, setPreview] = useState<Color[]>();
    const previewColumn: (DataTableColumn | undefined) = (!preview?.length) 
    ? undefined 
    : {
        header: 'Preview',
        accessor: (_e, inx) => 
            <ColorStylePreview backgroundColor={ preview?.[inx]?.toCssHexString() } />
    };

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
