import { BillboardGraphics, HeightReference, HorizontalOrigin, VerticalOrigin } from "cesium"
import { WriterContext } from "../../export-czml";
import { writeBoundingRectangle, writeCartesian, writeColor, writeDistanceDisplayCondition, writeEnum, writeNearFarScalar, writeScalar } from "../field-writers";
import { writeImage } from "../field-image-writer";

export async function writeBillboard(billboard: BillboardGraphics, ctx: WriterContext) {

    const packet = {} as any;

    if (billboard.image) {
        packet.image = await writeImage(billboard.image, {...ctx, path: ['billboard', 'image']});
    }

    if (billboard.show) {
        packet.show = writeScalar(billboard.show, {...ctx, path: ['billboard', 'show']});
    }

    if (billboard.scale) {
        packet.scale = writeScalar(billboard.scale, {...ctx, path: ['billboard', 'scale']});
    }
    
    if (billboard.pixelOffset) {
        packet.pixelOffset = writeCartesian(billboard.pixelOffset, {...ctx, path: ['billboard', 'pixelOffset']});
    }
    
    if (billboard.eyeOffset) {
        packet.eyeOffset = writeCartesian(billboard.eyeOffset, {...ctx, path: ['billboard', 'eyeOffset']});
    }

    if (billboard.horizontalOrigin) {
        packet.horizontalOrigin = writeEnum(billboard.horizontalOrigin, 
            {...ctx, path: ['billboard', 'horizontalOrigin']}, HorizontalOrigin);
    }

    if (billboard.verticalOrigin) {
        packet.verticalOrigin = writeEnum(billboard.verticalOrigin, 
            {...ctx, path: ['billboard', 'verticalOrigin']}, VerticalOrigin);
    }
    
    if (billboard.heightReference) {
        packet.heightReference = writeEnum(billboard.heightReference, 
            {...ctx, path: ['billboard', 'heightReference']}, HeightReference);
    }
    
    if (billboard.color) {
        packet.color = writeColor(billboard.color, {...ctx, path: ['billboard', 'color']});
    }

    if (billboard.rotation) {
        packet.rotation = writeScalar(billboard.rotation, {...ctx, path: ['billboard', 'rotation']});
    }

    if (billboard.alignedAxis) {
        packet.alignedAxis = writeCartesian(billboard.alignedAxis, {...ctx, path: ['billboard', 'alignedAxis']});
    }

    if (billboard.sizeInMeters) {
        packet.sizeInMeters = writeScalar(billboard.sizeInMeters, {...ctx, path: ['billboard', 'sizeInMeters']});
    }

    if (billboard.width) {
        packet.width = writeScalar(billboard.width, {...ctx, path: ['billboard', 'width']});
    }
    
    if (billboard.height) {
        packet.height = writeScalar(billboard.height, {...ctx, path: ['billboard', 'height']});
    }

    if (billboard.scaleByDistance) {
        packet.scaleByDistance = writeNearFarScalar(billboard.scaleByDistance, {...ctx, path: ['billboard', 'scaleByDistance']});
    }

    if (billboard.translucencyByDistance) {
        packet.translucencyByDistance = writeNearFarScalar(billboard.translucencyByDistance, {...ctx, path: ['billboard', 'translucencyByDistance']});
    }

    if (billboard.pixelOffsetScaleByDistance) {
        packet.pixelOffsetScaleByDistance = writeNearFarScalar(billboard.pixelOffsetScaleByDistance, {...ctx, path: ['billboard', 'pixelOffsetScaleByDistance']});
    }

    if (billboard.imageSubRegion) {
        packet.imageSubRegion = writeBoundingRectangle(billboard.imageSubRegion, {...ctx, path: ['billboard', 'imageSubRegion']});
    }

    if (billboard.distanceDisplayCondition) {
        packet.distanceDisplayCondition = writeDistanceDisplayCondition(billboard.distanceDisplayCondition, {...ctx, path: ['billboard', 'distanceDisplayCondition']});
    }

    if (billboard.disableDepthTestDistance) {
        packet.disableDepthTestDistance = writeScalar(billboard.disableDepthTestDistance, {...ctx, path: ['billboard', 'disableDepthTestDistance']});
    }

    return packet;
}