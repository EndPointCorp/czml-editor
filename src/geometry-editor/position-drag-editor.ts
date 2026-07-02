import { Cartesian3, Cartographic, Cesium3DTileset, ConstantPositionProperty, ConstantProperty, Entity, PolygonHierarchy, Property, ScreenSpaceEventHandler, ScreenSpaceEventType, Viewer, defined } from "cesium";
import { getPickCoordinates } from "./pick-coordinates";

export type DragEndCB = () => void;

type PositionSetter = (cartesian3: Cartesian3, cartographic: Cartographic, deltaLon: number, deltaLat: number) => void;
type PositionGetter = () => Cartesian3;

export function attachController(controller: PositionDragController, entity: Entity, onDragEnd?: DragEndCB) {
    let getter: PositionGetter | null = null;
    let setter: PositionSetter | null = null;

    // Billboards, Labels, Models should have position
    if (entity.position && entity.position.isConstant) {
        getter = () => {
            return (entity.position as Property).getValue();
        };
        setter = (positionC3: Cartesian3) => {
            (entity.position as ConstantPositionProperty).setValue(positionC3);
        };
    }
    else if (entity.polygon && entity.polygon.hierarchy?.isConstant) {
        const hierarchy: PolygonHierarchy = (entity.polygon.hierarchy as Property).getValue();

        getter = () => {
            return (entity.polygon!.hierarchy as Property).getValue().positions[0];
        };
        setter = (_cartesian3, _cartographic, deltaLon, deltaLat) => {
            (entity.polygon!.hierarchy as ConstantProperty).setValue(moveHierarchy(hierarchy, deltaLon, deltaLat));
        };
    }
    else if(entity.polyline && entity.polyline.positions?.isConstant) {
        const positions: Cartographic[] = entity.polyline.positions.getValue().map(toCartographic);
        getter = () => {
            return (entity.polyline!.positions as Property).getValue()[0];
        };
        setter = (_cartesian3, _cartographic, deltaLon, deltaLat) => {
            (entity.polyline!.positions as ConstantProperty).setValue(
                positions.map(p => offsetCartographic(p, deltaLon, deltaLat))
                    .map(toCartesian)
            );
        };
    }
    
    if (getter && setter) {
        controller.attachToEntity(entity, getter, setter, onDragEnd);
        return true;
    }

    return false;
}


type PositionDragControllerState = {
    picked: boolean;
    entity: Entity;
    initialPosition: Cartographic;

    mouseDownPosition: Cartographic | null;
    mouseDownEntityPosition: Cartographic | null;

    onDragEnd?: DragEndCB;

    pick: (pick: any) => boolean;
    getEntityPosition: () => Cartographic;
    newPosition: (newPosition: Cartographic, ...lonlat: [number, number]) => void;
    getter: PositionGetter;
};

export class PositionDragController {
    viewer: Viewer;
    state: PositionDragControllerState | null = null;
    screenSpaceEventHandler: ScreenSpaceEventHandler | null = null;

    constructor(viewer: Viewer) {
        this.viewer = viewer;
    }
    
    bindScreenSpaceEvents() {
        if (!this.screenSpaceEventHandler) {
            this.screenSpaceEventHandler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
            this.screenSpaceEventHandler.setInputAction(this.mouseMove.bind(this), ScreenSpaceEventType.MOUSE_MOVE);
            this.screenSpaceEventHandler.setInputAction(this.mouseDown.bind(this), ScreenSpaceEventType.LEFT_DOWN);
            this.screenSpaceEventHandler.setInputAction(this.mouseUp.bind(this), ScreenSpaceEventType.LEFT_UP);
        }
    }

    unBindScreenSpaceEvents() {
        if (this.screenSpaceEventHandler) {
            this.screenSpaceEventHandler.destroy();
            this.screenSpaceEventHandler = null;
        }
    }

    mouseUp(_e: any) {
        // Ignore clicks outside
        if (this.state && this.state.picked) {
            this.state.onDragEnd && this.state.onDragEnd();
            this.endDrag();
        }
    }

    mouseMove(movement: ScreenSpaceEventHandler.MotionEvent) {
        if (this.state && this.state.mouseDownPosition && this.state.mouseDownEntityPosition) {
            const pc = getPickCoordinates(this.viewer, movement.endPosition)

            if (pc) {
                const mousePosition = Cartographic.fromCartesian(pc);
        
                const deltaLat = mousePosition.latitude - this.state.mouseDownPosition.latitude;
                const deltaLon = mousePosition.longitude - this.state.mouseDownPosition.longitude;
        
                const entityNewPosition = new Cartographic(
                    this.state.mouseDownEntityPosition.longitude + deltaLon,
                    this.state.mouseDownEntityPosition.latitude + deltaLat,
                    this.state.mouseDownEntityPosition.height
                );
        
                this.state.newPosition(entityNewPosition, deltaLon, deltaLat);
            }
        }
    }
    
    mouseDown(e: ScreenSpaceEventHandler.PositionedEvent) {
        if (!this.state) {
            return;
        }

        const picks = this.viewer.scene.drillPick(e.position);
        const matched = picks.some(pick => this.state!.pick(pick));

        if (matched) {
            this.state.picked = true;

            this.disableDefaultControls();

            const entityPosition = this.state.getEntityPosition();
            const cartesian = getPickCoordinates(this.viewer, e.position)
                ?? Cartographic.toCartesian(entityPosition);

            this.state.mouseDownPosition = Cartographic.fromCartesian(cartesian);
            this.state.mouseDownEntityPosition = entityPosition;
        }
    }
    

    attachToEntity(
        entity: Entity,
        getter: PositionGetter,
        setter: PositionSetter,
        onDragEnd?: DragEndCB,
    ) {
        const viewer = this.viewer;
        const state = {
            picked: false,
            entity: entity,
            initialPosition: Cartographic.fromCartesian(getter()),
            mouseDownPosition: null,
            mouseDownEntityPosition: null,
            pick: (pick: any) => entityMatchesPick(
                pick,
                entity,
                entity.tileset ? findEntityTilesetPrimitive(viewer, entity) : undefined,
            ),
            getter,
            getEntityPosition: function() {
                return Cartographic.fromCartesian(this.getter());
            },
            newPosition: function(newPosition: Cartographic, ...lonlat: [number, number]) {
                const cartesian = Cartographic.toCartesian(newPosition);
                setter(cartesian, newPosition, ...lonlat);
            },
            onDragEnd: onDragEnd
        };
        this.state = state;

        return this;
    }

    disableDefaultControls() {
        this.viewer.scene.screenSpaceCameraController.enableInputs = false;
    }
    
    enableDefaultControls() {
        this.viewer.scene.screenSpaceCameraController.enableInputs = true;
    }

    endDrag() {
        if (this.state) {
            this.state.picked = false;
            this.state.mouseDownPosition = null;
            this.state.mouseDownEntityPosition = null;
        }
        this.enableDefaultControls();
    }

    reset() {
        this.state = null;
        this.enableDefaultControls();
    }
}

function findEntityTilesetPrimitive(viewer: Viewer, entity: Entity): Cesium3DTileset | undefined {
    const primitives = viewer.scene.primitives;
    for (let i = 0; i < primitives.length; i++) {
        const primitive = primitives.get(i);
        if (primitive instanceof Cesium3DTileset && (primitive as Cesium3DTileset & { id?: Entity }).id === entity) {
            return primitive;
        }
    }
    return undefined;
}

function entityMatchesPick(
    pick: any,
    entity: Entity,
    tilesetPrimitive?: Cesium3DTileset,
): boolean {
    if (!defined(pick)) {
        return false;
    }
    if (pick.id === entity) {
        return true;
    }
    if (!entity.tileset) {
        return false;
    }

    const tileset = pick.primitive instanceof Cesium3DTileset
        ? pick.primitive
        : pick.tileset;
    if (!(tileset instanceof Cesium3DTileset)) {
        return false;
    }

    const tilesetWithId = tileset as Cesium3DTileset & { id?: Entity };
    if (tilesetWithId.id === entity) {
        return true;
    }

    return tilesetPrimitive !== undefined && tileset === tilesetPrimitive;
}

function toCartographic(p: Cartesian3) {
    return Cartographic.fromCartesian(p);
}

function toCartesian(p: Cartographic) {
    return Cartographic.toCartesian(p);
}

function offsetCartographic(p: Cartographic, deltaLon: number, deltaLat: number) {
    return new Cartographic(p.longitude + deltaLon, p.latitude + deltaLat, p.height);
}

function moveHierarchy(h: PolygonHierarchy, deltaLon: number, deltaLat: number) {
    const newPositions = h.positions
        .map(toCartographic)
        .map(p => offsetCartographic(p, deltaLon, deltaLat))
        .map(toCartesian);
    
    const holes = h.holes?.map(hh => moveHierarchy(hh, deltaLon, deltaLat)) as PolygonHierarchy[];

    return new PolygonHierarchy(newPositions, holes);
}

// const hprNorth = new HeadingPitchRoll(0, -Math.PI / 2, -Math.PI / 2);
// const hprEast = new HeadingPitchRoll(0, -Math.PI / 2, 0);