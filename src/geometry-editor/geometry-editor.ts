import * as Cesium from "cesium";
import { getPickCoordinates } from "./pick-coordinates"

const WHITE_CIRCLE = "data:image/png;base64,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";

const DEFAULT_COLOR = Cesium.Color.AQUAMARINE;

const CONTROL_POINT_BILLBOARD_OPTIONS = {
    image: WHITE_CIRCLE,
    width: 32,
    height: 32,
    scale: 0.4,
    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
    disableDepthTestDistance: 1000000,
    color: DEFAULT_COLOR
};

type GeometryType = "polygon" | "polyline";
type GeometryProperty = "positions" | "hierarchy";

type CesiumScreenSpaceControllerCallback = 
    Cesium.ScreenSpaceEventHandler.PositionedEventCallback | 
    Cesium.ScreenSpaceEventHandler.MotionEventCallback | 
    Cesium.ScreenSpaceEventHandler.WheelEventCallback | 
    Cesium.ScreenSpaceEventHandler.TwoPointEventCallback | 
    Cesium.ScreenSpaceEventHandler.TwoPointMotionEventCallback;

export default class GeometryEditor {
    
    static controlPointsDisplay: Cesium.CustomDataSource;

    viewer: Cesium.Viewer | null;
    entity: Cesium.Entity | null = null;

    _oldGeometry: any | null;

    createMode: boolean;
    
    _activeControlPoint: Cesium.Entity | null = null;
    _controlPoints: Cesium.Entity[] = [];
    _middlePoints: Cesium.Entity[] = [];
    
    _type: GeometryType | null = null;
    _entityGeometryProperty: GeometryProperty | null = null;
    
    entityOptions: any | null;

    screenSpaceEventHandler: Cesium.ScreenSpaceEventHandler | null = null;

    _mouseDownPosition: Cesium.Cartographic | null = null;
    _mouseDownEntityPosition: Cesium.Cartographic | null = null;
    _defaultLeftClickHandler: CesiumScreenSpaceControllerCallback | null = null;

    
    constructor(viewer: Cesium.Viewer) {
        this.viewer = viewer;
        this.createMode = false;

        // Static custom DatataSorce, to add it only once
        if(!GeometryEditor.controlPointsDisplay) {
            GeometryEditor.controlPointsDisplay =
                new Cesium.CustomDataSource('geometry-control-points');
            viewer.dataSources.add(GeometryEditor.controlPointsDisplay);
        }

        this._createScreenSpaceEventHandler();
        this._defaultLeftClickHandler = 
            this.viewer.screenSpaceEventHandler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    newEntity(type: GeometryType) {
        this._type = type;
        this._setTypeOptions();
        this.createMode = true;

        const cbGeometryProperty = 
            new Cesium.CallbackProperty(this._geometryCallback.bind(this), false);

        if (this._entityGeometryProperty) {
            this.entity = new Cesium.Entity({
                [ this._type ]: {
                    [this._entityGeometryProperty]: cbGeometryProperty,
                    
                    // @ts-ignore
                    ...this.entityOptions
                }
            });
        }

        this.disablePick();

        return this.entity;
    }

    editEntity(type: GeometryType, entity: Cesium.Entity) {
        this._type = type;
        this._setTypeOptions();
        this.createMode = false;

        this.entity = entity;
        
        this._oldGeometry = this._getGeometryPropertyValue();
        this._geometryAsControlPoints();

        // @ts-ignore
        this.entity[this._type][this._entityGeometryProperty] = new Cesium.CallbackProperty(this._geometryCallback.bind(this), false);

        this.disablePick();

        return this.entity;
    }

    _getGeometryPropertyValue() {
        if (this.entity) {
            if (this._type === 'polyline') {
                const geom = this.entity[this._type];
                return geom && geom['positions']?.getValue();
            }
            else if (this._type === 'polygon') {
                const geom = this.entity[this._type];
                return geom && geom['hierarchy']?.getValue();
            }
        } 
    }

    _geometryAsControlPoints() {
        if (this._type === 'polyline') {
            const positions: Cesium.Cartesian3[] = this._getGeometryPropertyValue();
            positions.forEach(position => {
                this._addControlPoint(position);
            });
        }
        else if (this._type === 'polygon') {
            const hierarchy: Cesium.PolygonHierarchy = this._getGeometryPropertyValue();
            hierarchy.positions.forEach((position: Cesium.Cartesian3) => {
                this._addControlPoint(position);
            });
        }
        this._createMiddlePoints();
        // this.__labels();
    }

    _geometryCallback() {
        const positions = this._controlPoints.map(cp => 
            cp.position?.getValue()!
        );

        if (this._type === 'polyline') {
            return positions;
        }
        if (this._type === 'polygon') {
            return new Cesium.PolygonHierarchy(positions);
        }
    }

    _createMiddlePoints() {
        this._middlePoints.forEach(mp => {
            GeometryEditor.controlPointsDisplay.entities.remove(mp);
        });

        let prev: Cesium.Entity | null = null;
        this._controlPoints.forEach(cp => {
            if (prev) {
                this._addMiddlePoint(prev, cp);
            }
            prev = cp;
        });

        // Close loop
        if (this._type === 'polygon' && prev) {
            this._addMiddlePoint(prev, this._controlPoints[0]);
        }
    }

    save() {
        const entity = this.entity;
        
        // Apply changes to entity

        // @ts-ignore
        this.entity[this._type][this._entityGeometryProperty] = new Cesium.ConstantProperty(this._geometryCallback());
        this.enablePick();
        this.reset();

        return entity;
    }
    
    cancel() {
        const entity = this.entity;
        if (this._oldGeometry) {
            // @ts-ignore
            this.entity[this._type][this._entityGeometryProperty] = this._oldGeometry;
        }
        this.enablePick();
        this.reset();
        
        return entity;
    }

    disableDefaultControls() {
        if (this.viewer) {
            this.viewer.scene.screenSpaceCameraController.enableInputs = false;
        }
    }

    enableDefaultControls() {
        if (this.viewer) {
            this.viewer.scene.screenSpaceCameraController.enableInputs = true;
        }
    }

    disablePick() {
        if (this.viewer) {
            console.log('disable pick');
            this.viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }
    }
    
    enablePick() {
        if (this.viewer && this._defaultLeftClickHandler) {
            console.log('reenable pick');
            this.viewer.screenSpaceEventHandler.setInputAction(this._defaultLeftClickHandler, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }
    }

    reset() {
        this.entity = null;
        this._type = null;
        this._oldGeometry = null;
        this._activeControlPoint = null;
        this._entityGeometryProperty = null;
        GeometryEditor.controlPointsDisplay.entities.removeAll();
        this._controlPoints = [];
        this._middlePoints = [];
    }

    destroy() {
        if (this.screenSpaceEventHandler) {
            this.screenSpaceEventHandler.destroy();
        }
    }

    _setTypeOptions() {
        if (this._type === 'polyline') {
            this._entityGeometryProperty = 'positions';

            this.entityOptions = {
                clampToGround: true,
                width: 3,
                material: DEFAULT_COLOR,
            };
        }
        else if (this._type === 'polygon') {
            this._entityGeometryProperty = 'hierarchy';

            this.entityOptions = {
                height: 0,
                material: new Cesium.ColorMaterialProperty(DEFAULT_COLOR.withAlpha(0.3)),
                outline: true,
                outlineColor: DEFAULT_COLOR,
                outlineWidth: 2,
            };
        }
    }

    _addMiddlePoint(p1: Cesium.Entity, p2: Cesium.Entity, index?: number) {
        const color = this._getEntityColor();

        const cpEntity = new Cesium.Entity({
            position: new Cesium.CallbackPositionProperty(() => {
                const pv1 = p1.position?.getValue();
                const pv2 = p2.position?.getValue(); 

                const midPoint = Cesium.Cartesian3
                    .midpoint(pv1!, pv2!, new Cesium.Cartesian3());
                
                    return midPoint;
            }, false),

            billboard: {
                ...CONTROL_POINT_BILLBOARD_OPTIONS,
                scale: 0.3,
                color
            }
        });

        const inx = index === undefined ? this._middlePoints.length : index;
        this._middlePoints.splice(inx, 0, cpEntity);

        GeometryEditor.controlPointsDisplay.entities.add(cpEntity);
    }

    _addControlPoint(position: Cesium.Cartesian3, index?: number) {
        const color = this._getEntityColor();
        const cpEntity = new Cesium.Entity({
            position: position,
            billboard: {
                ...CONTROL_POINT_BILLBOARD_OPTIONS,
                color
            },
        });

        const inx = index === undefined ? this._controlPoints.length : index;
        this._controlPoints.splice(inx, 0, cpEntity);

        GeometryEditor.controlPointsDisplay.entities.add(cpEntity);

        return cpEntity;
    }

    _removeCP(cp: Cesium.Entity) {
        const cpi = this._controlPoints.indexOf(cp);

        if (cpi < 0) return;

        let leftMP  = this._middlePoints[cpi - 1];
        let rightMP = this._middlePoints[cpi];

        if (this._type === 'polygon' && (cpi - 1) < 0) {
            leftMP  = this._middlePoints[this._middlePoints.length - 1];
        }

        if (leftMP) {
            this._middlePoints = this._middlePoints.filter(p => p !== leftMP);
            GeometryEditor.controlPointsDisplay.entities.remove(leftMP);
        }

        if (rightMP) {
            this._middlePoints = this._middlePoints.filter(p => p !== rightMP);
            GeometryEditor.controlPointsDisplay.entities.remove(rightMP);
        }

        if ( leftMP && rightMP ) {
            const leftCP = this._controlPoints[cpi - 1] || this._controlPoints[this._controlPoints.length - 1];
            const rightCP = this._controlPoints[cpi + 1] || this._controlPoints[0];

            if (cpi - 1 < 0) {
                this._addMiddlePoint(leftCP, rightCP);
            }
            else {
                this._addMiddlePoint(leftCP, rightCP, cpi - 1);
            }
        }

        GeometryEditor.controlPointsDisplay.entities.remove(cp);
        this._controlPoints.splice(cpi, 1);
    }

    _getEntityColor() {
        if (! this.entity) {
            return DEFAULT_COLOR;
        }

        if (this._type === 'polygon') {
            const fillColor = this.entity?.polygon?.material?.getValue();
            const outlineColor = this.entity?.polygon?.outlineColor?.getValue();
            return outlineColor || fillColor || DEFAULT_COLOR;
        }
        else if (this._type === 'polyline') {
            return this.entity?.polyline?.material?.getValue().color || DEFAULT_COLOR;
        }

        return DEFAULT_COLOR;
    }

    _mouseClick(e: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
        let ent = this.viewer?.scene.pick(e.position);

        const position = this.viewer && getPickCoordinates(this.viewer, e.position);

        if (this.entity) {
            // CP drag is handled by this.screenSpaceEventHandler
            if (ent) {
                const cp = this._controlPoints.includes(ent.id);
                const mp = this._middlePoints.includes(ent.id);

                if (cp && this._controlPoints.length > (this._type === 'polygon' ? 3 : 2)) {
                    if (confirm("Delete point?")) {
                        this._removeCP(ent.id);
                    }
                }

                if (cp || mp) return;
            }

            if (position && this.createMode) {
                const left = this._controlPoints[this._controlPoints.length - 1];
                const right = this._addControlPoint(position);
                if (left && right) {
                    if (this._type === 'polygon') {
                        const closingMP = this._middlePoints[this._middlePoints.length - 1];
                        GeometryEditor.controlPointsDisplay.entities.remove(closingMP);
                        this._middlePoints.splice(this._middlePoints.length - 1, 1);
                    }

                    this._addMiddlePoint(left, right);

                    if (this._type === 'polygon') {
                        this._addMiddlePoint(right, this._controlPoints[0]);
                    }
                }
            }

            return;
        }
    }

    _mouseMove(e: Cesium.ScreenSpaceEventHandler.MotionEvent) {
        if (this._mouseDownPosition && this._activeControlPoint) {

            const pc = this.viewer && getPickCoordinates(this.viewer, e.endPosition);
            if (!pc) {
                return;
            }

            let mousePosition = Cesium.Cartographic.fromCartesian(pc);

            let deltaLat = mousePosition.latitude - this._mouseDownPosition.latitude;
            let deltaLon = mousePosition.longitude - this._mouseDownPosition.longitude;

            let entityNewPosition = new Cesium.Cartographic(
                this._mouseDownEntityPosition!.longitude + deltaLon,
                this._mouseDownEntityPosition!.latitude + deltaLat,
                this._mouseDownEntityPosition!.height
            );

            const cartesian = Cesium.Cartographic.toCartesian(entityNewPosition);
            this._activeControlPoint.position = new Cesium.ConstantPositionProperty(cartesian);
        }
    }

    _mouseDown(e: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
        const pick = this.viewer?.scene.pick(e.position);
        if (!pick) return;

        const subj = pick.id;

        const isControlPoint = this._controlPoints.includes(subj);

        const middlePointIndex = this._middlePoints.findIndex(mp => mp.id === subj?.id);
        const isMiddlePoint = middlePointIndex >= 0;

        if ( isControlPoint || isMiddlePoint ) {

            // Use pick ellipsoid viewer.scene.pickPosition(e.position) returns null if we click on entity
            // getPickCoordinates(viewer, event.position)this.viewer.camera.pickEllipsoid(e.position, this.viewer.scene.globe.ellipsoid);
            const pc = this.viewer && getPickCoordinates(this.viewer, e.position);
            if (!pc) {
                return;
            }

            this._mouseDownPosition = Cesium.Cartographic.fromCartesian(pc);
            this._mouseDownEntityPosition = Cesium.Cartographic.fromCartesian(subj.position.getValue());
    
            console.log(`Down on ${isControlPoint ? 'CP' : ''}${isMiddlePoint ? 'MP' : ''}`, subj);
    
            this.disableDefaultControls();


            this._activeControlPoint = subj;

            if (isMiddlePoint) {

                const li = middlePointIndex % this._controlPoints.length;
                const ri = (middlePointIndex + 1) % this._controlPoints.length;

                console.log('middlePointIndex', middlePointIndex, li, ri);

                const leftCP  = this._controlPoints[li];
                const rightCP = this._controlPoints[ri];

                this._activeControlPoint = this._addControlPoint(
                    subj.position.getValue(),
                    middlePointIndex + 1
                );

                this._middlePoints.splice(middlePointIndex, 1);

                this._addMiddlePoint(leftCP,  this._activeControlPoint, middlePointIndex);
                this._addMiddlePoint(rightCP, this._activeControlPoint, middlePointIndex + 1);
                GeometryEditor.controlPointsDisplay.entities.remove(subj);
            }
        }
    }

    _mouseUp() {
        this._mouseDownPosition = null;
        this._mouseDownEntityPosition = null;
        this.enableDefaultControls();
    }

    _createScreenSpaceEventHandler() {
        if (this.viewer) {
            this.screenSpaceEventHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
    
            this.screenSpaceEventHandler.setInputAction(
                this._mouseDown.bind(this),
                Cesium.ScreenSpaceEventType.LEFT_DOWN);
            this.screenSpaceEventHandler.setInputAction(
                this._mouseMove.bind(this),
                Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            this.screenSpaceEventHandler.setInputAction(
                this._mouseUp.bind(this),
                Cesium.ScreenSpaceEventType.LEFT_UP);
            this.screenSpaceEventHandler.setInputAction(
                this._mouseClick.bind(this),
                Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }
    }

    __labels() {
        this._controlPoints.forEach((p, cpi) => {
            p.label = new Cesium.LabelGraphics({
                text: 'cp' + cpi,
                eyeOffset: new Cesium.Cartesian3(0.0, 0.0, -25.0),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM
            });
        });

        this._middlePoints.forEach((p, mpi) => {
            p.label = new Cesium.LabelGraphics({
                text: 'mp' + mpi,
                eyeOffset: new Cesium.Cartesian3(0.0, 0.0, -25.0),
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM
            });
        });
    }
}