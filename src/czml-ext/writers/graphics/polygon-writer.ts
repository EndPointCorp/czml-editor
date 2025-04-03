import { ArcType, ClassificationType, HeightReference, PolygonGraphics, PolygonHierarchy, Property, ShadowMode } from "cesium";
import { WriterContext } from "../../export-czml";
import { writeColor, writeDistanceDisplayCondition, writeEnum, writePositionListOfListValue, writePositionListValue, writeScalar } from "../field-writers";
import { writeMaterial } from "../material-writer";
import { Polygon as PolygonCzml } from "../../schema/polygon";

export async function writePolygon(polygon: PolygonGraphics, ctx: WriterContext) {
    const czml: PolygonCzml = {};

    if (polygon.show !== undefined) {
        czml.show =  writeScalar(polygon.show, {...ctx, path: [...ctx.path, 'show']});
    }

    if (polygon.hierarchy) {
        const {positions, holes} = writePolygonHierarchy(polygon.hierarchy, {...ctx, path: [...ctx.path, 'hierarchy']});
    
        if (positions) {
            czml.positions = positions;
        }
        else {
            // TODO: Error reporting
        }
    
        if (holes) {
            czml.holes = holes;
        }
    }

    if (polygon.arcType !== undefined) {
        czml.arcType = writeEnum(polygon.arcType, {...ctx, path: [...ctx.path, 'arcType']}, ArcType);
    }

    if (polygon.height !== undefined) {
        czml.height = writeScalar(polygon.height, {...ctx, path: [...ctx.path, 'height']});
    }

    if (polygon.heightReference !== undefined) {
        czml.heightReference = writeEnum(polygon.heightReference, {...ctx, path: [...ctx.path, 'heightReference']}, HeightReference);
    }

    if (polygon.extrudedHeight !== undefined) {
        czml.extrudedHeight = writeScalar(polygon.extrudedHeight, {...ctx, path: [...ctx.path, 'extrudedHeight']});
    }

    if (polygon.extrudedHeightReference !== undefined) {
        czml.extrudedHeightReference = writeEnum(polygon.extrudedHeightReference, {...ctx, path: [...ctx.path, 'extrudedHeightReference']}, HeightReference);
    }

    if (polygon.stRotation !== undefined) {
        czml.stRotation = writeScalar(polygon.stRotation, {...ctx, path: [...ctx.path, 'stRotation']});
    }

    if (polygon.granularity !== undefined) {
        czml.granularity = writeScalar(polygon.granularity, {...ctx, path: [...ctx.path, 'granularity']});
    }
    
    if (polygon.fill !== undefined) {
        czml.fill = writeScalar(polygon.fill, {...ctx, path: [...ctx.path, 'fill']});
    }

    if (polygon.material !== undefined) {
        czml.material = await writeMaterial(polygon.material, {...ctx, path: [...ctx.path, 'material']});
    }

    if (polygon.outline !== undefined) {
        czml.outline = writeScalar(polygon.outline, {...ctx, path: [...ctx.path, 'outline']});
    }
    
    if (polygon.outlineColor !== undefined) {
        czml.outlineColor = writeColor(polygon.outlineColor, {...ctx, path: [...ctx.path, 'outlineColor']});
    }

    if (polygon.outlineWidth !== undefined) {
        czml.outlineWidth = writeScalar(polygon.outlineWidth, {...ctx, path: [...ctx.path, 'outlineWidth']});
    }

    if (polygon.perPositionHeight !== undefined) {
        czml.perPositionHeight = writeScalar(polygon.perPositionHeight, {...ctx, path: [...ctx.path, 'perPositionHeight']});
    }

    if (polygon.closeTop !== undefined) {
        czml.closeTop = writeScalar(polygon.closeTop, {...ctx, path: [...ctx.path, 'closeTop']});
    }

    if (polygon.closeBottom !== undefined) {
        czml.closeBottom = writeScalar(polygon.closeBottom, {...ctx, path: [...ctx.path, 'closeBottom']});
    }
    
    if (polygon.shadows !== undefined) {
        czml.shadows = writeEnum(polygon.shadows, {...ctx, path: [...ctx.path, 'shadows']}, ShadowMode);
    }

    if (polygon.distanceDisplayCondition !== undefined) {
        czml.distanceDisplayCondition = writeDistanceDisplayCondition(polygon.distanceDisplayCondition, {...ctx, path: [...ctx.path, 'distanceDisplayCondition']});
    }
    
    if (polygon.classificationType !== undefined) {
        czml.classificationType = writeEnum(polygon.classificationType, {...ctx, path: [...ctx.path, 'classificationType']}, ClassificationType);
    }
    
    if (polygon.classificationType !== undefined) {
        czml.classificationType = writeEnum(polygon.classificationType, {...ctx, path: [...ctx.path, 'classificationType']}, ClassificationType);
    }
    
    if (polygon.zIndex !== undefined) {
        czml.zIndex = writeScalar(polygon.zIndex, {...ctx, path: [...ctx.path, 'zIndex']});
    }

    return czml;
}

type PositionsAndHoles = {
    positions?: ReturnType<typeof writePositionListValue>,
    holes?: ReturnType<typeof writePositionListOfListValue>,
}

function writePolygonHierarchy(property: Property, ctx: WriterContext) {
    const val = writeScalar(property, ctx);

    if (val === undefined || val === null) {
        return {
            positions: undefined,
            holes: undefined
        } as PositionsAndHoles;
    }

    const hierarchy = val as PolygonHierarchy;

    const ret: PositionsAndHoles = {
        // PositionList
        positions: writePositionListValue(hierarchy.positions, "cartographicDegrees"),
    };

    if (hierarchy.holes && hierarchy.holes.length > 0) {
        // PositionListOfLists
        const coords = hierarchy.holes.map(h => h.positions);
        ret.holes = writePositionListOfListValue(coords, "cartographicDegrees");
    }

    return ret;
}
