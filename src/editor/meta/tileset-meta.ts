import { PropertyMeta } from "./meta";

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
