import { HorizontalOrigin, VerticalOrigin } from "cesium";
import { PropertyMeta } from "./meta";

const appearanceProps: PropertyMeta[] = [
    {name: 'image', type: 'image-url'},
    
    
    {name: 'width', type: 'number'},
    {name: 'height', type: 'number'},
    
    {name: 'sizeInMeters', type: 'boolean'},
    
    {name: 'horizontalOrigin', type: 'enum', enum: HorizontalOrigin},
    {name: 'verticalOrigin', type: 'enum', enum: VerticalOrigin},
];

const extraProps: PropertyMeta[] = [
    
    {name: 'translucencyByDistance', type: 'near-far-scalar'},

    {name: 'pixelOffset', type: 'vector', size: 2},
    {name: 'pixelOffsetScaleByDistance', type: 'near-far-scalar'},
    
    {name: 'scale', type: 'number'},
    {name: 'scaleByDistance', type: 'near-far-scalar'},
    
    {name: 'rotation', type: 'number'},
    {name: 'alignedAxis', type: 'vector'},
    
    {name: 'color', type: 'color'},
    {name: 'imageSubRegion', type: 'vector', size: 4,
        componentNames: ['x', 'y', 'width', 'height']},
        
    {name: 'distanceDisplayCondition', 
        type: 'distance-display-condition'},
            
    {name: 'disableDepthTestDistance', type: 'number'},
];

export const billboardMetaData = {
    feature: 'billboard',
    propertyGroups: [{
        title: 'Appearance',
        properties: appearanceProps
    },{
        title: 'Extra',
        properties: extraProps
    }]
}