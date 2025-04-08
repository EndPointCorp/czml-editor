import { DistanceDisplayCondition, NearFarScalar } from "cesium";
import { billboardMetaData } from "./billboard-meta";
import { labelMetadata } from "./label-meta";
import { polylineMetaData } from "./polyline-meta";
import { polygonMetaData } from "./polygon-meta";
import { modelMetaData } from "./model-meta";


export const types = ['billboard', 'label', 'polyline', 'polygon', 'model'] as const;

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

export const metaByType = {
    billboard: billboardMetaData,
    label: labelMetadata,
    polyline: polylineMetaData,
    polygon: polygonMetaData,
    model: modelMetaData,
};

export type TypeMetaKey = keyof typeof metaByType;

export function getPropertyMeta(featureType: TypeMetaKey, propertyName: string) {
    const featureMeta = metaByType[featureType];
    if (featureMeta) {
        return featureMeta.propertyGroups
            .map(pg => pg.properties).flat(1)
            .find(p => p.name === propertyName);
    }
}