import { PropertyMeta } from "./meta";

export const tilesetUriMeta: PropertyMeta = {
    name: 'uri',
    type: 'string',
    title: 'Tileset URI',
};

const displayProps: PropertyMeta[] = [
    {name: 'show', type: 'boolean'},
    {name: 'maximumScreenSpaceError', type: 'number'},
];

export const tilesetMetaData = {
    feature: 'tileset',
    propertyGroups: [{
        title: 'Display',
        properties: displayProps
    }],
};
