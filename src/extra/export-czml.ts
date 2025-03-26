import { DataSource, DataSourceClock, Entity, ReferenceProperty } from "cesium";
import { writeOrientation, writePosition, writeReferenceProperty, writeTimeIntervalCollectionValue } from "./czml/field-writers";
import { writeBillboard } from "./czml/billboard-writer";
import { buildImagesMap, exportImages as exportImagesF, getResourceByPath, ImageExport, ResourcesMap } from "./czml/field-resource-writer";

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
    forceReference?: {
      srcPath: string[],
      dest: string
    }

    clock?: DataSourceClock;
    
    entity?: Entity;
    entities?: Entity[];
    
    exportedImages?: ImageExport;
}

export type ExportOptions = {
    dataSource?: DataSource;
    exportImages?: boolean;
    exportImagesPath?: string;
    exportImagesMaxDimensions?: {width: number, height: number}
    forceFetchImages?: boolean;
    onFailedToEncode?: (entity: Entity, path: string[], val: any) => void;
}
export async function exportAsCzml(entities: Entity[], options: ExportOptions) {
    const ctx: WriterContext = {
        options,
        path: [],
        resourcesMap: {}
    };
    
    buildImagesMap(entities, ['billboard', 'image'], ctx.resourcesMap);

    if (options.exportImages) {
        ctx.exportedImages = await exportImagesF(ctx.resourcesMap, options);
    }

    const clock = options.dataSource?.clock;

    const packets: any[] = [];

    for (let entity of entities) {
        const url = getResourceByPath(entity, ['billboard', 'image'])?.url;
        const sameUrlEntities = url && ctx.resourcesMap[url];

        ctx.forceReference = undefined;

        // Avoid making changes to actual entities
        if (sameUrlEntities && sameUrlEntities[0].id !== entity.id) {
            ctx.forceReference = {
                srcPath: ['billboard', 'image'],
                dest: `${sameUrlEntities[0].id}#billboard.image`
            }
        }

        packets.push(await entityToPacket(entity, {...ctx, path: [], entity, entities, clock,}));
    }

    return packets;
}

export async function entityToPacket(entity: Entity, ctx: WriterContext) {
    let packet = {
        id: entity.id,
        name: entity.name,
        parent: entity.parent,
        description: entity.description,
    } as any;

    if (entity.availability) {
        packet = {
            ...packet,
            availability: writeTimeIntervalCollectionValue(entity.availability, {...ctx, path: ['availability']})
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
            position: writeOrientation(entity.orientation, {...ctx, path: ['orientation']})
        }
    }


    /** Graphics Writers */

    if (entity.billboard) {
        packet.billboard = await writeBillboard(entity.billboard,  {...ctx, path: ['billboard']});
    }

    // if (entity.polyline) {
    //     packet.polyline = writePolyline(entity.polyline, ctx);
    // }

    // if (entity.polygon) {
    //     packet.polygon = writePolygon(entity.polygon, ctx);
    // }

    // if (entity.rectangle) {
    //     packet.rectangle = writeRectangle(entity.rectangle, ctx);
    // }

    // if (entity.model) {
    //     packet.model = writeModel(entity.model, ctx);
    // }

    // if (entity.tileset) {
    //     packet.tileset = writeTileset(entity.tileset, ctx);
    // }

    // if (entity.label) {
    //     packet.label = writeLabel(entity.label, ctx);
    // }

    return packet;
}

