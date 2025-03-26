import { DistanceDisplayCondition, NearFarScalar } from "cesium";


export const types = ['billboard', 'label', 'polyline', 'polygon', 'model'];

type Constructor<T = any> = new (...args: any[]) => T;

export type PropertyType = {
    type: 'number' | 'boolean' | 'string' | 'image-url' | 'distance-display-condition' | 'near-far-scalar';
} 
| PropertyTypeEnum 
| PropertyTypeVector
| MaterialType
| ColorType;

export type ColorType = {
    type: 'color';
    noAlpha?: boolean;
}

export type MaterialType = {
    type: 'material';
    noAlpha?: boolean;
}

export type PropertyTypeEnum = {
    type: 'enum';
    enum: any;
    ignore?: string[];
};

export type PropertyTypeVector = {
    type: 'vector';
    size: number;
    targetClass: Constructor<any>;
    componentNames?: string[];
};

export const DistanceDisplayConditionAsVector: PropertyTypeVector = {
    type: 'vector',
    size: 2,
    targetClass: DistanceDisplayCondition,
    componentNames: ['Near distance (m)', 'Far distance (m)']
}

export const NearFarAsVector: PropertyTypeVector = {
    type: 'vector',
    size: 4,
    targetClass: NearFarScalar,
    componentNames: [
        'Near distance (m)', 
        'Near value', 
        'Far distance (m)', 
        'Far value'
    ]
}

export type PropertyMeta = {
    name: string;
    title?: string;
    description?: string;
} & PropertyType;

export type PropertyGroup = {
    title: string;
    properties: PropertyMeta[]
}

export type FeatureMetaData = {
    feature: string;
    propertyGroups: PropertyGroup[];
}

export const heightReferenceDescription = `
NONE - The position is absolute.
CLAMP_TO_GROUND - The position is clamped to the terrain and 3D Tiles.
RELATIVE_TO_GROUND - The position height is the height above the terrain and 3D Tiles.
CLAMP_TO_TERRAIN - The position is clamped to terain.
RELATIVE_TO_TERRAIN - The position height is the height above terrain.
CLAMP_TO_3D_TILE - The position is clamped to 3D Tiles.
RELATIVE_TO_3D_TILE - The position height is the height above 3D Tiles.
`;