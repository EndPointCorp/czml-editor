import { BillboardGraphics, Cartesian3, Entity, Event, HeightReference, LabelGraphics, ModelGraphics, Resource, ScreenSpaceEventHandler, ScreenSpaceEventType, VerticalOrigin, Viewer } from "cesium";
import { getPickCoordinates } from "./pick-coordinates";

export enum CreateEntityInputMode {
    billboard,
    model,
    label,
    point,
}

export class CreateEntityByClickController {

    viewer: Viewer;
    screenSpaceEventHandler: ScreenSpaceEventHandler;
    inputMode: CreateEntityInputMode | null = null;

    billboardProperties: BillboardGraphics.ConstructorOptions = {
        image: 'http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png',
        verticalOrigin: VerticalOrigin.BOTTOM,
        heightReference: HeightReference.RELATIVE_TO_GROUND,
        width: 32,
        height: 32,
        disableDepthTestDistance: 1000000000
    };

    labelProperties: LabelGraphics.ConstructorOptions = {
        text: 'Label Text',
        verticalOrigin: VerticalOrigin.BOTTOM,
        heightReference: HeightReference.RELATIVE_TO_GROUND,
        disableDepthTestDistance: 1000000000
    }

    modelProperties: ModelGraphics.ConstructorOptions = {
        heightReference: HeightReference.RELATIVE_TO_GROUND
    };

    modelUri?: Resource | string | null = null;
    modelName?: string;

    newEntityEvent = new Event<(entity: Entity) => void>();

    constructor(viewer: Viewer) {
        this.viewer = viewer;
        this.screenSpaceEventHandler = new ScreenSpaceEventHandler(viewer.scene.canvas);
        // this.subscribeToEvents();
    }

    handleClick(event: ScreenSpaceEventHandler.PositionedEvent) {
        if (this.inputMode === CreateEntityInputMode.billboard) {
            this.inputMode = null;
            const position = getPickCoordinates(this.viewer, event.position);

            if (position) {
                const entity = this.createBillboard(position);
                this.handleNewEntity(entity);
            }
        }
        else if (this.inputMode === CreateEntityInputMode.model) {
            this.inputMode = null;
            const position = getPickCoordinates(this.viewer, event.position);
        
            if (position && this.modelUri) {
                const entity = this.createModel(position);
                this.handleNewEntity(entity);
            }
            
            this.modelUri = null;
            this.modelName = undefined;
        }
        else if (this.inputMode === CreateEntityInputMode.label) {
            this.inputMode = null;
            const position = getPickCoordinates(this.viewer, event.position);

            if (position) {
                const entity = this.createLabel(position);
                this.handleNewEntity(entity);
            }
        }
        else {
            // Ignore clicks for polygon and polyline creations
            // or when input isn't active
        }
    }

    createBillboard(position: Cartesian3) {
        return new Entity({
            position: position,
            billboard: {
                ...this.billboardProperties
            }
        });
    }

    createLabel(position: Cartesian3) {
        return new Entity({
            position: position,
            label: {
                ...this.labelProperties
            }
        });
    }
    
    createModel(position: Cartesian3) {
        const uri = this.modelUri;
        const name = this.modelName;
        
        return new Entity({
            name,
            position: position,
            model: {
                uri,
                ...this.modelProperties
            } as ModelGraphics.ConstructorOptions
        });
    }

    handleNewEntity(entity: Entity) {
        this.newEntityEvent.raiseEvent(entity);
    }

    subscribeToEvents() {
        this.screenSpaceEventHandler.setInputAction(
            this.handleClick.bind(this),
            ScreenSpaceEventType.LEFT_CLICK);
    }
    
    unSubscribeToEvents() {
        this.screenSpaceEventHandler
            .removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
    }
    
}


