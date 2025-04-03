import { 
    BoundingRectangle, 
    Cartesian2, 
    Cartesian3, 
    Cartesian4, 
    Cartographic, 
    Color, 
    ConstantPositionProperty, 
    ConstantProperty, 
    DistanceDisplayCondition, 
    JulianDate, 
    NearFarScalar, 
    PositionProperty, 
    Property, 
    PropertyBag, 
    Quaternion, 
    ReferenceFrame, 
    ReferenceProperty, 
    SampledPositionProperty, 
    SampledProperty, 
    TimeInterval, 
    TimeIntervalCollection, 
    VelocityOrientationProperty 
} from "cesium";
import { WriterContext } from "../export-czml";


type GetAndLength<T = any> = {
    length: number,
    get: (inx: number) => T
}
function* forOfLength<T>(subj: GetAndLength<T>) {
    for (let i = 0; i < subj.length; i++) {
        yield subj.get(i);
    }
}

function arrayFromLengthAndGet<T>(val: GetAndLength) {
    return Array.from(forOfLength<T | undefined>(val)).filter(v => !!v) as T[];
}

export function writeReferenceValue(prop: ReferenceProperty, _ctx: WriterContext) {
    return `${prop.targetId}#${prop.targetPropertyNames.join('.')}`;
}

export function writeScalar(property: Property, ctx: WriterContext) {
    const overwrite = ctx.overwrite;

    const overwriteMatch = overwrite && 
        overwrite.srcPath.join('.') === ctx.path.join('.');

    if (overwriteMatch) {
        return overwrite.dest;
    }

    if (property instanceof ReferenceProperty) {
        return {
            "reference": writeReferenceValue(property, ctx)
        }
    }

    if (property.isConstant) {
        return property.getValue();
    }

    ctx.options?.onFailedToEncode?.(ctx.entity!, ctx.path, property);
}

export function writeEnum(property: Property, ctx: WriterContext, enumObj: any) {
    const val = writeScalar(property, ctx);
    if (val === undefined || val === null || val.reference) return val;

    return writeEnumValue(val, enumObj);
}

export function writeCartesian(property: Property, ctx: WriterContext) {
    const val = writeScalar(property, ctx);
    if (val === undefined || val === null || val.reference) return val;

    return writeCartesianVal(val);
}

export function writeColor(property: Property, ctx: WriterContext) {
    const val = writeScalar(property, ctx);
    if (val === undefined || val === null || val.reference) return val;

    const c = val as Color;
    return {
        "rgbaf": [c.red, c.green, c.blue, c.alpha]
    }
}

export function writeDistanceDisplayCondition(property: Property, ctx: WriterContext) {
    const val = writeScalar(property, ctx);
    if (val === undefined || val === null || val.reference) return val;

    const d = val as DistanceDisplayCondition;
    return [d.near, d.far];
}

export function writeBoundingRectangle(property: Property, ctx: WriterContext) {
    const val = writeScalar(property, ctx);
    if (val === undefined || val === null || val.reference) return val;

    return writeBoundingRectangleValue(val as BoundingRectangle);
}

export function writePositionList(property: Property, ctx: WriterContext, encoding?: PositionEncoding) {
    const val = writeScalar(property, ctx);
    if (val === undefined || val === null || val.reference) return val;
        
    if (Array.isArray(val)) {
        return writePositionListValue(val as Cartesian3[], encoding)
    }

    // TODO: error handling
}

export function writeNearFarScalar(property: Property, ctx: WriterContext) {
    const val = writeScalar(property, ctx);
    if (val === undefined || val === null || val.reference) return val;

    const nfsc = val as NearFarScalar;
    return {
        "nearFarScalar": [nfsc.near, nfsc.nearValue, nfsc.far, nfsc.farValue]
    }
}

function writeBoundingRectangleValue(b: BoundingRectangle) {
    return [b.x, b.y, b.width, b.height];
}

function writeEnumValue(val: any, enumObj: any) {
    const enumEnty = Object.entries(enumObj).find(([_eKey, eVal]) => eVal=== val);
    if (enumEnty) {
        const [enumKey] = enumEnty;
        return enumKey;
    }
}

function writeCartesianVal(val: Cartesian2 | Cartesian3 | Cartesian4) {
    if (val instanceof Cartesian2) {
        return [val.x, val.y];
    }
    if (val instanceof Cartesian3) {
        return [val.x, val.y, val.z];
    }
    if (val instanceof Cartesian4) {
        return [val.x, val.y, val.z, val.w];
    }
}

export function writeTimeIntervalCollectionValue(val: TimeIntervalCollection, _ctx: WriterContext) {
    return arrayFromLengthAndGet<TimeInterval>(val).map(v => v.toString());
}

export type PositionEncoding = "cartesian" | "cartographicDegrees";
export function writePosition(val: PositionProperty, _ctx: WriterContext, encoding?: PositionEncoding) {
    const frame = val.referenceFrame;

    if (val.isConstant) {
        const cartesian3 = (val as ConstantPositionProperty).getValue() as Cartesian3;
        const result = writeCartesian3Position(cartesian3, encoding || "cartesian");
        
        if (frame != ReferenceFrame.FIXED) {
            return {
                ...result,
                frame: "INERTIAL"
            }
        }

        return result;
    }

    if (val instanceof SampledPositionProperty) {
        return writeSampledPositionProperty(val as SampledPositionProperty, _ctx, encoding);
    }
}

export function writePositionListValue(coords: Cartesian3[], encoding?: PositionEncoding) {
    switch (encoding || "cartographicDegrees") {

        case "cartographicDegrees": 
        return {
                "cartographicDegrees": coords.map(crt3toCtgDegreesArr).flat(1)
            }
        case "cartesian":
            return {
                "cartesian": coords.map(val => [val.x, val.y, val.z]).flat(1)
            }

    }
}
    
export function writePositionListOfListValue(coords: Cartesian3[][], encoding?: PositionEncoding) {
    switch (encoding || "cartographicDegrees") {
        case "cartographicDegrees": 
        return {
                "cartographicDegrees": coords.map(ring => ring.map(crt3toCtgDegreesArr).flat(1))
            }
        case "cartesian":
            return {
                "cartesian": coords.map(ring => ring.map(val => [val.x, val.y, val.z]).flat(1))
            }
            
    }
}

function radToDeg(rad: number) {
    return rad * (180 / Math.PI);
}

function crt3toCtgDegreesArr(c3: Cartesian3) {
    const vc = Cartographic.fromCartesian(c3);
    return [radToDeg(vc.longitude), radToDeg(vc.latitude), vc.height]
}

export function writeSampledPositionProperty(val: SampledPositionProperty, _ctx: WriterContext, encoding?: PositionEncoding) {
    const sampledProperty = (val.interpolationAlgorithm as any)['_property'] as SampledProperty;

    const times = (sampledProperty as any)['_times'] as JulianDate[];
    const values = (sampledProperty as any)['_values'] as Cartesian3[];

    return writeCartesianSamples(times, values, _ctx, encoding || "cartographicDegrees");
}

export function writeCartesianSamples(times: JulianDate[], values: Cartesian3[], ctx: WriterContext, encoding: PositionEncoding) {
    const packetValues = [];
    const clock = ctx.clock;

    const startDate = clock?.startTime;

    for (let i = 0; i < times.length; i++) {
        const t = startDate ? JulianDate.secondsDifference(times[i], startDate) : times[i].toString();
        const v = values[i];

        if (encoding === "cartographicDegrees") {
            const vc = Cartographic.fromCartesian(v);
            packetValues.push(...[t, radToDeg(vc.longitude), radToDeg(vc.latitude), vc.height]);
        }
        else {
            packetValues.push(...[t, v.x, v.y, v.z]);
        }
    }

    return {
        [encoding]: packetValues
    }
}

export function writeCartesian3Position(val: Cartesian3, outType: PositionEncoding) {
    switch (outType) {
        case "cartographicDegrees": 
            const cart = Cartographic.fromCartesian(val);
            return {
                "cartographicDegrees": [radToDeg(cart.longitude), radToDeg(cart.latitude), cart.height]
            }
        case "cartesian":
            return {
                "cartesian": [val.x, val.y, val.z]
            }
    }
}

export function writeOrientation(val: Property, ctx: WriterContext) {
    if (val instanceof VelocityOrientationProperty) {
        const velocityRef = val as VelocityOrientationProperty;
        
        const positionRefProp = (velocityRef.position instanceof ReferenceProperty) 
            ? (velocityRef.position as ReferenceProperty) : undefined;

        if (positionRefProp) {
            return {
                "velocityReference": {
                    "$ref": writeReferenceValue(positionRefProp, ctx)
                }
            }
        }

        ctx.options?.onFailedToEncode?.(ctx.entity!, ctx.path, val);
    }
    
    if (val.isConstant) {
        const q = (val as ConstantProperty).getValue() as Quaternion;

        return {
            "unitQuaternion": [q.x, q.y, q.z, q.w]
        }
    }
    else {
        ctx.options?.onFailedToEncode?.(ctx.entity!, ctx.path, val);
    }
    
}

export function writePropertyBag(bag: PropertyBag, ctx: WriterContext) {
    const czml = {};

    for(const prop of bag.propertyNames) {
        (czml as any)[prop] = writeScalar(bag[prop], {...ctx, path: [...ctx.path, prop]});
    }

    return czml;
}
