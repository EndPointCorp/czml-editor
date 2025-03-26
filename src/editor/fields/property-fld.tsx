import camelCaseToTitle from '../../misc/cammelToTitle';
import { InputField } from './input-fld';
import { BooleanField } from './boolean-fld';
import { ColorField } from './color-fld';
import { Property as CesiumProperty, ConstantProperty, DistanceDisplayCondition, NearFarScalar, Property } from "cesium";
import { BillboardGraphics, LabelGraphics, PolygonGraphics, PolylineGraphics } from 'cesium';
import { useCallback, useState } from 'preact/hooks';
import { EnumField } from './enum-fld';
import { VectorField } from './vector-fld';
import { DistanceDisplayConditionAsVector, NearFarAsVector, PropertyMeta, PropertyTypeVector } from '../meta/meta';
import { ImageUrlField } from './imageurl-fld';

import "./property-fld.css"

export type PropertyFieldProps = {
    subject: PolygonGraphics | PolylineGraphics | BillboardGraphics | LabelGraphics
    property: PropertyMeta;
    onChange?: (value: any) => void;
}
export function PropertyField({subject, property: metaProperty, onChange}: PropertyFieldProps) {

    const { name, type, title } = metaProperty;
    const label = title || camelCaseToTitle(name);

    const property = (subject as any)[metaProperty.name] as CesiumProperty;
    const interpolated = property !== undefined && property instanceof Property && !property.isConstant;

    const value = (property as ConstantProperty)?.valueOf();
    
    const [_oldVal, forceUpdate] = useState<any>();

    const changeHandler = useCallback((val: any) => {
        if (metaProperty.type === 'number' && typeof val === 'string') {
          val = val.includes('.') ? parseFloat(val) : parseInt(val);
          val = Number.isNaN(val) ? undefined : val;
        }

        if (property !== undefined && (property as any).setValue) {
            (property as ConstantProperty).setValue(val);
        }
        else if (metaProperty.type === 'enum') {
            (subject as any)[metaProperty.name] = new ConstantProperty(val);
        }
        else {
            (subject as any)[metaProperty.name] = val;
        }

        onChange && onChange(val);
        forceUpdate(val);

    }, [subject, property, metaProperty, forceUpdate]);

    if (interpolated) {
        console.log('interpolated property', property);
        return <div>
        Cant't edit "{metaProperty.name}" because its values are interpolated
        </div>
    }
    
    switch (type) {
      case 'string':
        return <InputField label={label} value={value} onChange={changeHandler}/>;

      case 'number':
        return <InputField label={label} value={value} onChange={changeHandler}/>;
      
      case 'boolean':
        return <BooleanField label={label} value={value} onChange={changeHandler}/>;
        
      case 'vector': {
        const {size, targetClass, componentNames} = metaProperty as PropertyTypeVector;

        metaProperty.name === 'pixelOffset' && console.log(metaProperty);

        return <VectorField label={label} value={value} 
          {...{size, targetClass, componentNames}}
          onChange={changeHandler}/>;
      }
      
      case 'distance-display-condition': {
        const {size, targetClass, componentNames} = DistanceDisplayConditionAsVector;

        const arrayValue = value && [
          (value as DistanceDisplayCondition)?.near,
          (value as DistanceDisplayCondition)?.far,
        ];
        
        return <VectorField label={label} value={arrayValue} 
          {...{size, targetClass, componentNames}}
          onChange={changeHandler}/>;
      }
      
      case 'near-far-scalar': {
        const {size, targetClass, componentNames} = NearFarAsVector;

        const arrayValue = value && [
          (value as NearFarScalar)?.near,
          (value as NearFarScalar)?.nearValue,
          (value as NearFarScalar)?.far,
          (value as NearFarScalar)?.farValue,
        ];
        
        return <VectorField label={label} value={arrayValue} 
          {...{size, targetClass, componentNames}}
          onChange={changeHandler}/>;
      }

      case 'enum':
        return <EnumField label={label} value={value} 
          enumObj={metaProperty.enum} ignore={metaProperty.ignore} 
          onChange={changeHandler}/>;

      case 'color':
        return <ColorField label={label} value={value} 
            alpha={metaProperty.noAlpha !== true} onChange={changeHandler}/>;
      
      case 'material':
        const val = value?.color?.valueOf();
        return <ColorField label={label} value={val} 
            alpha={metaProperty.noAlpha !== true} onChange={changeHandler}/>;
      
      case 'image-url':
        return <ImageUrlField label={label} value={value} onChange={changeHandler}/>;

      default:
        // @ts-ignore ignore, unreachable at the moment
        console.warn(`Unsupported value type ${type} for field ${metaProperty.name}`, value);
        return <InputField label={label} value={value} onChange={changeHandler}/>;

    }
}