import { ConstantProperty, Entity } from "cesium";
import { useCallback } from "preact/hooks";
import { findTilesetSource } from "../../czml-ext/tileset-source-registry";
import { getResourceByPath } from "../../czml-ext/writers/field-image-writer";
import { tilesetUriMeta } from "../meta/tileset-meta";
import { PropertyMeta } from "../meta/meta";
import { InputField } from "./input-fld";

type TilesetUriFieldProps = {
    entity: Entity;
    onChange?: (val: unknown, feature?: string, property?: PropertyMeta) => void;
};

export function TilesetUriField({ entity, onChange }: TilesetUriFieldProps) {
    const tileset = entity.tileset;
    if (!tileset) {
        return null;
    }

    const resource = getResourceByPath(entity, ['tileset', 'uri']);
    const source = resource && findTilesetSource(resource);
    const uriValue = source?.mainPath ?? resource?.url ?? '';

    const handleChange = useCallback((val: string) => {
        tileset.uri = new ConstantProperty(val);
        onChange?.(val, 'tileset', tilesetUriMeta);
    }, [tileset, onChange]);

    return (
        <InputField
            key={`${entity.id}.tileset.uri`}
            label={tilesetUriMeta.title}
            value={uriValue}
            onChange={handleChange}
        />
    );
}
