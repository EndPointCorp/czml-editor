import { DataSource, DataSourceClock, Entity } from "cesium";
import { exportModels as exportModelsF, ModelExport } from "./writers/field-gltf-writer";
import { buildImagesMap, exportImages as exportImagesF, getResourceByPath, ImageExport, ResourcesMap } from "./writers/field-image-writer";
import { writeOrientation, writePosition, writePropertyBag, writeScalar, writeTimeIntervalCollectionValue } from "./writers/field-writers";
import { writeLabel } from "./writers/graphics/label-writer";
import { writeBillboard } from "./writers/graphics/billboard-writer";
import { writeModel } from "./writers/graphics/model-writer";
import { writePolygon } from "./writers/graphics/polygon-writer";
import { writePolyline } from "./writers/graphics/polyline-writer";
import { writeRectangle } from "./writers/graphics/rectangle-writer";
import { writeTileset } from "./writers/graphics/tileset-writer";
import { writePoint } from "./writers/graphics/point-writer";
import { writePath } from "./writers/graphics/path-writer";
import { writeBox } from "./writers/graphics/box-writer";
import { writeCylinder } from "./writers/graphics/cylinder-writer";

export type ResourceCahe = {
    [resource: string]: ResourceCacheLine
}

export type ResourceCacheLine = {
    entity: Entity, 
    path: string[]
}

export type WriterContext = {
    options: ExportOptions,
    path: string[];
    resourcesMap: ResourcesMap;
    overwrite?: {
      srcPath: string[],
      dest: any
    }
    
    clock?: DataSourceClock;
    
    entity?: Entity;
    
    exportedImages?: ImageExport;
    exportedModels?: ModelExport;
}

type DocumentPacketCzml = {
    id: 'document';
    version: string;
    [k: string]: any;
}

export type ExportOptions = {
    dataSource?: DataSource;
    documentPacket?: DocumentPacketCzml;
    exportImages?: boolean;
    exportImagesPath?: string;
    exportImagesMaxDimensions?: {width: number, height: number}
    forceFetchImages?: boolean;
    exportModels?: boolean;
    onFailedToEncode?: (entity: Entity, path: string[], val: any) => void;
}
export async function exportAsCzml(entities: Entity[], options?: ExportOptions) {
    options = options || {};
    
    const ctx: WriterContext = {
        options,
        path: [],
        resourcesMap: {}
    };
    const clock = options.dataSource?.clock;

    buildImagesMap(entities, ['billboard', 'image'], ctx.resourcesMap);

    if (options.exportImages) {
        ctx.exportedImages = await exportImagesF(ctx.resourcesMap, options);
    }

    if (options.exportModels) {
        ctx.exportedModels = await exportModelsF(entities);
    }

    const docPacket = options.documentPacket || {"id":"document", "version":"1.0"};
    const packets: any[] = [
        docPacket 
    ];

    for (let entity of entities) {
        const url = getResourceByPath(entity, ['billboard', 'image'])?.url;
        const sameUrlEntities = url && ctx.resourcesMap[url];

        // Avoid making changes to actual entities
        ctx.overwrite = undefined;
        if (sameUrlEntities && sameUrlEntities[0].id !== entity.id) {
            ctx.overwrite = {
                srcPath: ['billboard', 'image'],
                dest: {
                    "reference": `${sameUrlEntities[0].id}#billboard.image`
                }
            }
        }

        packets.push(await entityToPacket(entity, {...ctx, path: [], entity, clock,}));
    }
    
    return {
        czml: packets,
        exportedImages: ctx.exportedImages,
        exportedModels: ctx.exportedModels,
    };
}

export async function entityToPacket(entity: Entity, ctx: WriterContext) {
    let packet = {
        id: entity.id,
        name: entity.name,
        parent: entity.parent?.id,
    } as any;

    if (entity.availability) {
        let availability: string | string[] = 
            writeTimeIntervalCollectionValue(entity.availability, {...ctx, path: ['availability']});
        
        if (availability.length === 1) {
            availability = availability[0];
        }
        
        packet = {
            ...packet,
            availability
        }
    }
    
    if (entity.position) {
        packet = {
            ...packet,
            position: writePosition(entity.position, {...ctx, path: ['position']})
        }
    }

    if (entity.orientation) {
        packet = {
            ...packet,
            orientation: writeOrientation(entity.orientation, {...ctx, path: ['orientation']})
        }
    }

    if (entity.properties) {
        packet = {
            ...packet,
            properties: writePropertyBag(entity.properties, {...ctx, path: ['properties']})
        }
    }

    if (entity.description) {
        packet.description = writeScalar(entity.description, {...ctx, path: ['description']});
    }

    if (entity.viewFrom) {
        reportNotSupported('viewFrom not supported', ctx);
    }
    
    /* Graphic Features Writers */
    
    // * @property [billboard] - A billboard to associate with this entity.
    if (entity.billboard) {
        packet.billboard = await writeBillboard(entity.billboard,  {...ctx, path: ['billboard']});
    }
    
    // * @property [label] - A options.label to associate with this entity.
    if (entity.label) {
        packet.label = writeLabel(entity.label,  {...ctx, path: ['label']});
    }
    
    // * @property [polygon] - A polygon to associate with this entity.
    if (entity.polygon) {
        packet.polygon = await writePolygon(entity.polygon, {...ctx, path: ['polygon']});
    }
    
    // * @property [rectangle] - A rectangle to associate with this entity.
    if (entity.rectangle) {
        packet.rectangle = await writeRectangle(entity.rectangle, {...ctx, path: ['rectangle']});
    }
    
    // * @property [polyline] - A polyline to associate with this entity.
    if (entity.polyline) {
        packet.polyline = writePolyline(entity.polyline, {...ctx, path: ['polyline']});
    }
    
    // * @property [point] - A point to associate with this entity.
    if (entity.point) {
        packet.point = writePoint(entity.point, {...ctx, path: ['point']});
    }
    
    // * @property [path] - A path to associate with this entity.
    if (entity.path) {
        packet.path = writePath(entity.path, {...ctx, path: ['path']});
    }
    
    // * @property [model] - A model to associate with this entity.
    if (entity.model) {
        packet.model = writeModel(entity.model, {...ctx, path: ['model']});
    }
    
    // * @property [tileset] - A 3D Tiles tileset to associate with this entity.
    if (entity.tileset) {
        packet.tileset = writeTileset(entity.tileset, {...ctx, path: ['tileset']});
    }

    // * @property [box] - A box to associate with this entity.
    if (entity.box) {
        packet.box = writeBox(entity.box, {...ctx, path: ['box']});
    }

    // * @property [cylinder] - A cylinder to associate with this entity.
    if (entity.cylinder) {
        packet.box = await writeCylinder(entity.cylinder, {...ctx, path: ['cylinder']});
    }


    
    // * @property [ellipse] - A ellipse to associate with this entity.
    if (entity.ellipse) {
        reportNotSupported('ellipse not supported', {...ctx, path: ['ellipse']});
    }
    
    // * @property [corridor] - A corridor to associate with this entity.
    if (entity.corridor) {
        reportNotSupported('corridor not supported', {...ctx, path: ['corridor']});
    }
    
    // * @property [ellipsoid] - A ellipsoid to associate with this entity.
    if (entity.ellipsoid) {
        reportNotSupported('ellipsoid not supported', {...ctx, path: ['ellipsoid']});
    }
    
    // * @property [plane] - A plane to associate with this entity.
    if (entity.plane) {
        reportNotSupported('plane not supported', {...ctx, path: ['plane']});
    }
    
    // * @property [polylineVolume] - A polylineVolume to associate with this entity.
    if (entity.polylineVolume) {
        reportNotSupported('polylineVolume not supported', {...ctx, path: ['polylineVolume']});
    }

    // * @property [wall] - A wall to associate with this entity.
    if (entity.wall) {
        reportNotSupported('wall not supported', {...ctx, path: ['wall']});
    }
    
    return packet;
}

export function reportNotSupported(msg: string, _ctx: WriterContext) {
    console.warn(msg);
}

