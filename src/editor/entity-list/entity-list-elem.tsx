import { Entity } from "cesium";
import { types } from "../meta/meta";
import { useCallback, useRef } from "preact/hooks";
import { EntityExtra } from "../editor";

import cls from "../../misc/cls";
import "./type-icon.css";
import "./entity-list-elem.css";

import deleteSvg from "../../assets/delete-stroke.svg";
import showSvg from "../../assets/show.svg";
import hideSvg from "../../assets/hide.svg";
import doExportSvg from "../../assets/export.svg"
import doNotExportSvg from "../../assets/no_export.svg";
import { TypeIcon } from "./type-icon";

type EntityListElementProps = {
    entity: Entity;
    isFolder: boolean;
    entityExtra?: EntityExtra;
    selectedEntity: Entity | null;
    onEntityExtraChange?: (extra: EntityExtra) => void;
    selectEntity?: (entity: Entity) => void;
    deleteEntity?: (entity: Entity) => void;
}
export function EntityListElement({entity, isFolder, selectedEntity, entityExtra, deleteEntity, selectEntity, onEntityExtraChange}: EntityListElementProps) {

    const divRef = useRef<HTMLDivElement>(null);
    
    const type = types.find(tname => (entity as any)[tname] !== undefined);

    const title = entity.name || entityExtra?.namePlaceholder;
    const isPlaceholder = !entity.name;
    
    const selected = selectedEntity === entity;

    const visible = entity.show;
    const doNotExport = entityExtra?.doNotExport;
    
    const handleClick = useCallback(() => {
        selectEntity && !isFolder && selectEntity(entity);
    }, [entity, selectEntity, isFolder]);
    
    const handleDelete = useCallback((e: Event) => {
        e.stopPropagation();
        e.preventDefault();

        if (deleteEntity && confirm("Delete this entity?\nThis cannot be undone.")) {
            deleteEntity(entity);
        }

    }, [entity, deleteEntity]);

    const handleShowHide = useCallback((e: Event) => {
        e.stopPropagation();
        e.preventDefault();

        if (entity) {
            entity.show = !visible;
            onEntityExtraChange && onEntityExtraChange({...entityExtra});
        }
    }, [entity, visible, entityExtra, onEntityExtraChange]);

    const handleToggleExport = useCallback((e: Event) => {
        e.stopPropagation();
        e.preventDefault();

        onEntityExtraChange && onEntityExtraChange({...entityExtra, doNotExport: !entityExtra?.doNotExport});
    }, [entity, entityExtra, onEntityExtraChange]);

    if (selected && divRef.current) {
        divRef.current.scrollIntoView({block: 'nearest'});
    }

    return (
        <div key={entity.id} ref={divRef}
            class={cls('entity', selected && 'selected')}
            onClick={handleClick}>
    
            <TypeIcon type={isFolder ? 'folder' : type} />
    
            <span>&nbsp;</span>
            
            <span class={cls('entity-title', isPlaceholder && 'title-placeholder')}>
                {title}
            </span>

            <span class={'entity-actions-divider'}></span>

            <span class={'entity-actions'}>
                {!isFolder && 
                <button key={doNotExport ? 'no-export-btn' : 'do-export-btn'}
                    title={doNotExport ? 'Do not export this entity' : 'Allow export of this entity'}
                    className={cls('size-s', 'icon-button')} onClick={handleToggleExport} >
                    <img alt={'do not export'} src={doNotExport ? doNotExportSvg : doExportSvg} />
                </button>}

                {!isFolder && 
                <button key={visible ? 'show-btn' : 'hide-btn'}
                    title={visible ? 'Hide this entity' : 'Show this entity'}
                    className={cls('size-s', 'icon-button')} onClick={handleShowHide} >
                    <img alt={'hide'} src={visible ? showSvg : hideSvg} />
                </button>}

                {!isFolder && 
                <button key={'delete-btn'} title={'Delete this entity'}
                    className={cls('size-s', 'icon-button')} onClick={handleDelete} >
                    <img alt={'delete'} src={deleteSvg} />
                </button>}
            </span>
        </div>
    );
}
