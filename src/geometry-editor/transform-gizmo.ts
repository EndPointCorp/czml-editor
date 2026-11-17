import * as Cesium from "cesium";
import { getPickCoordinates } from "./pick-coordinates";

export type GizmoMode = "translate" | "rotate" | "scale";
type Axis = "x" | "y" | "z";
type HandleAxis = Axis | "center";

export type GizmoChangeCB = (mode: GizmoMode) => void;

const AXIS_COLORS: Record<Axis, Cesium.Color> = {
    x: Cesium.Color.RED,
    y: Cesium.Color.GREEN,
    z: Cesium.Color.BLUE,
};

const CENTER_COLOR = Cesium.Color.WHITE;
const GIZMO_SIZE_RATIO = 0.12;
const RING_SEGMENTS = 64;

const HANDLE_POINT_OPTIONS: Cesium.PointGraphics.ConstructorOptions = {
    pixelSize: 12,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
    heightReference: Cesium.HeightReference.NONE,
};

type HandleInfo = {
    entity: Cesium.Entity;
    axis: HandleAxis;
};

export class TransformGizmo {

    static display: Cesium.CustomDataSource | null = null;

    viewer: Cesium.Viewer;
    entity: Cesium.Entity | null = null;
    mode: GizmoMode = "translate";
    enabled = false;
    onChange?: GizmoChangeCB;

    screenSpaceEventHandler: Cesium.ScreenSpaceEventHandler | null = null;

    private handles: HandleInfo[] = [];
    private axes: Record<Axis, Cesium.Cartesian3> | null = null;

    private dragging = false;
    private dragAxis: HandleAxis | null = null;
    private frameOrigin = new Cesium.Cartesian3();

    private startAngle = 0;
    private startHPR: Cesium.HeadingPitchRoll | null = null;

    private startScale = 1;
    private startDistance = 0;

    private mouseDownCartographic: Cesium.Cartographic | null = null;
    private mouseDownEntityCartographic: Cesium.Cartographic | null = null;

    private lastFrameSize = 0;
    private postRenderListener: (() => void) | null = null;

    constructor(viewer: Cesium.Viewer) {
        this.viewer = viewer;

        if (!TransformGizmo.display) {
            TransformGizmo.display = new Cesium.CustomDataSource("transform-gizmo");
            viewer.dataSources.add(TransformGizmo.display);
        }
    }

    attach(entity: Cesium.Entity, mode: GizmoMode, onChange?: GizmoChangeCB) {
        this.detach();
        this.entity = entity;
        this.mode = mode;
        this.onChange = onChange;
        this.enabled = true;

        this._refreshAxes();
        this._buildHandles();

        this.postRenderListener = () => {
            if (!this.enabled || !this.entity) return;
            const size = this._frameSize();
            if (this.lastFrameSize > 0 && Math.abs(size - this.lastFrameSize) / this.lastFrameSize > 0.02) {
                this.lastFrameSize = size;
                this._buildHandles();
            }
        };
        this.viewer.scene.postRender.addEventListener(this.postRenderListener);

        this.bindScreenSpaceEvents();

        return this;
    }

    setMode(mode: GizmoMode, onChange?: GizmoChangeCB) {
        if (this.entity) {
            this.attach(this.entity, mode, onChange ?? this.onChange);
        }
    }

    bindScreenSpaceEvents() {
        if (!this.screenSpaceEventHandler) {
            this.screenSpaceEventHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
            this.screenSpaceEventHandler.setInputAction(this._mouseDown.bind(this), Cesium.ScreenSpaceEventType.LEFT_DOWN);
            this.screenSpaceEventHandler.setInputAction(this._mouseMove.bind(this), Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            this.screenSpaceEventHandler.setInputAction(this._mouseUp.bind(this), Cesium.ScreenSpaceEventType.LEFT_UP);
        }
    }

    unBindScreenSpaceEvents() {
        if (this.screenSpaceEventHandler) {
            this.screenSpaceEventHandler.destroy();
            this.screenSpaceEventHandler = null;
        }
    }

    detach() {
        this.enabled = false;
        this.dragging = false;
        this.dragAxis = null;
        this.entity = null;
        this.axes = null;
        this.handles = [];
        this.lastFrameSize = 0;

        if (this.postRenderListener) {
            this.viewer.scene.postRender.removeEventListener(this.postRenderListener);
            this.postRenderListener = null;
        }

        this.unBindScreenSpaceEvents();
        TransformGizmo.display?.entities.removeAll();
        this.enableDefaultControls();
    }

    disableDefaultControls() {
        this.viewer.scene.screenSpaceCameraController.enableInputs = false;
    }

    enableDefaultControls() {
        this.viewer.scene.screenSpaceCameraController.enableInputs = true;
    }

    private _position(): Cesium.Cartesian3 {
        const value = this.entity?.position?.getValue(Cesium.JulianDate.now());
        return value ?? Cesium.Cartesian3.ZERO;
    }

    private _frameSize(): number {
        const distance = Cesium.Cartesian3.distance(this.viewer.camera.positionWC, this._position());
        return Math.max(distance * GIZMO_SIZE_RATIO, 1);
    }

    private _refreshAxes() {
        const origin = this._position();
        const enu = Cesium.Transforms.eastNorthUpToFixedFrame(origin);
        this.axes = {
            x: toCartesian3(Cesium.Matrix4.getColumn(enu, 0, new Cesium.Cartesian4())),
            y: toCartesian3(Cesium.Matrix4.getColumn(enu, 1, new Cesium.Cartesian4())),
            z: toCartesian3(Cesium.Matrix4.getColumn(enu, 2, new Cesium.Cartesian4())),
        };
        Cesium.Cartesian3.normalize(this.axes.x, this.axes.x);
        Cesium.Cartesian3.normalize(this.axes.y, this.axes.y);
        Cesium.Cartesian3.normalize(this.axes.z, this.axes.z);
    }

    private _buildHandles() {
        if (!this.entity || !this.axes || !TransformGizmo.display) return;

        TransformGizmo.display.entities.removeAll();
        this.handles = [];

        const size = this._frameSize();
        this.lastFrameSize = size;

        if (this.mode === "rotate") {
            this._buildRotateHandles(size);
        }
        else {
            this._buildAxisHandles(size);
        }
    }

    private _buildAxisHandles(size: number) {
        const origin = this._position();
        const color = this.mode === "scale" ? Cesium.Color.YELLOW : undefined;

        (["x", "y", "z"] as Axis[]).forEach((axis) => {
            const dir = this.axes![axis];
            const tip = Cesium.Cartesian3.add(
                origin,
                Cesium.Cartesian3.multiplyByScalar(dir, size, new Cesium.Cartesian3()),
                new Cesium.Cartesian3(),
            );

            const line = new Cesium.Entity({
                polyline: {
                    positions: [origin, tip],
                    width: 3,
                    arcType: Cesium.ArcType.NONE,
                    material: color ?? AXIS_COLORS[axis],
                },
            });

            const handle = new Cesium.Entity({
                position: tip,
                point: {
                    ...HANDLE_POINT_OPTIONS,
                    color: color ?? AXIS_COLORS[axis],
                },
            });

            this._addHandle(line, axis);
            this._addHandle(handle, axis);
        });

        if (this.mode === "translate") {
            const center = new Cesium.Entity({
                position: origin,
                point: {
                    ...HANDLE_POINT_OPTIONS,
                    pixelSize: 10,
                    color: CENTER_COLOR,
                },
            });
            this._addHandle(center, "center");
        }
    }

    private _buildRotateHandles(size: number) {
        const origin = this._position();

        (["x", "y", "z"] as Axis[]).forEach((axis) => {
            const { u, v } = this._ringBasis(axis);
            const positions: Cesium.Cartesian3[] = [];

            for (let i = 0; i <= RING_SEGMENTS; i++) {
                const theta = (i / RING_SEGMENTS) * Cesium.Math.TWO_PI;
                const cos = Math.cos(theta);
                const sin = Math.sin(theta);
                const point = new Cesium.Cartesian3(
                    origin.x + (u.x * cos + v.x * sin) * size,
                    origin.y + (u.y * cos + v.y * sin) * size,
                    origin.z + (u.z * cos + v.z * sin) * size,
                );
                positions.push(point);
            }

            const ring = new Cesium.Entity({
                polyline: {
                    positions,
                    width: 3,
                    arcType: Cesium.ArcType.NONE,
                    material: AXIS_COLORS[axis],
                },
            });

            this._addHandle(ring, axis);
        });
    }

    private _ringBasis(axis: Axis): { u: Cesium.Cartesian3; v: Cesium.Cartesian3 } {
        if (axis === "x") return { u: this.axes!.y, v: this.axes!.z };
        if (axis === "y") return { u: this.axes!.x, v: this.axes!.z };
        return { u: this.axes!.x, v: this.axes!.y };
    }

    private _addHandle(entity: Cesium.Entity, axis: HandleAxis) {
        TransformGizmo.display!.entities.add(entity);
        this.handles.push({ entity, axis });
    }

    private _axisOf(picked: unknown): HandleAxis | null {
        const found = this.handles.find(h => h.entity === picked);
        return found ? found.axis : null;
    }

    private _mouseDown(event: Cesium.ScreenSpaceEventHandler.PositionedEvent) {
        if (!this.enabled || !this.entity) return;

        const picks = this.viewer.scene.drillPick(event.position);
        let axis: HandleAxis | null = null;
        for (const pick of picks) {
            axis = this._axisOf(pick.id);
            if (axis) break;
        }
        if (!axis) return;

        this.dragging = true;
        this.dragAxis = axis;
        this.frameOrigin = Cesium.Cartesian3.clone(this._position());
        this._refreshAxes();
        this.disableDefaultControls();

        if (this.mode === "translate" && axis === "center") {
            const cartesian = getPickCoordinates(this.viewer, event.position)
                ?? this.frameOrigin;
            this.mouseDownCartographic = Cesium.Cartographic.fromCartesian(cartesian);
            this.mouseDownEntityCartographic = Cesium.Cartographic.fromCartesian(this.frameOrigin);
        }
        else if (this.mode === "rotate") {
            this.startHPR = this._currentHPR();
            this.startAngle = this._screenAngle(event.position);
        }
        else if (this.mode === "scale") {
            this.startScale = this._currentScale();
            const center = this._positionScreen();
            this.startDistance = center
                ? Cesium.Cartesian2.distance(event.position, center)
                : 0;
        }
    }

    private _mouseMove(event: Cesium.ScreenSpaceEventHandler.MotionEvent) {
        if (!this.dragging || !this.dragAxis || !this.entity) return;

        if (this.mode === "translate") {
            this._moveTranslate(event.endPosition);
        }
        else if (this.mode === "rotate") {
            this._moveRotate(event.endPosition);
        }
        else if (this.mode === "scale") {
            this._moveScale(event.endPosition);
        }

        this.onChange && this.onChange(this.mode);
    }

    private _mouseUp() {
        if (!this.dragging) return;

        this.dragging = false;
        this.dragAxis = null;
        this.mouseDownCartographic = null;
        this.mouseDownEntityCartographic = null;
        this.startHPR = null;
        this.enableDefaultControls();

        this.onChange && this.onChange(this.mode);
    }

    private _moveTranslate(screen: Cesium.Cartesian2) {
        if (!this.axes) return;

        if (this.dragAxis === "center") {
            if (!this.mouseDownCartographic || !this.mouseDownEntityCartographic) return;
            const pc = getPickCoordinates(this.viewer, screen);
            if (!pc) return;

            const mousePosition = Cesium.Cartographic.fromCartesian(pc);
            const deltaLat = mousePosition.latitude - this.mouseDownCartographic.latitude;
            const deltaLon = mousePosition.longitude - this.mouseDownCartographic.longitude;

            const newPosition = new Cesium.Cartographic(
                this.mouseDownEntityCartographic.longitude + deltaLon,
                this.mouseDownEntityCartographic.latitude + deltaLat,
                this.mouseDownEntityCartographic.height,
            );
            this._setPosition(Cesium.Cartographic.toCartesian(newPosition));
        }
        else {
            const axis = this.dragAxis as Axis;
            const distance = this._axisDistance(screen, axis);
            if (distance === null) return;

            const newPosition = Cesium.Cartesian3.add(
                this.frameOrigin,
                Cesium.Cartesian3.multiplyByScalar(this.axes[axis], distance, new Cesium.Cartesian3()),
                new Cesium.Cartesian3(),
            );
            this._setPosition(newPosition);
        }

        this._buildHandles();
    }

    private _moveRotate(screen: Cesium.Cartesian2) {
        if (!this.startHPR || !this.dragAxis || this.dragAxis === "center") return;

        const center = this._positionScreen();
        if (!center) return;

        const angle = Math.atan2(screen.y - center.y, screen.x - center.x);
        const delta = wrapAngle(angle - this.startAngle);

        const hpr = new Cesium.HeadingPitchRoll(
            this.startHPR.heading,
            this.startHPR.pitch,
            this.startHPR.roll,
        );

        if (this.dragAxis === "z") hpr.heading += delta;
        else if (this.dragAxis === "x") hpr.pitch += delta;
        else hpr.roll += delta;

        const position = this._position();
        const quaternion = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);
        this._setOrientation(quaternion);
    }

    private _moveScale(screen: Cesium.Cartesian2) {
        if (!this.entity?.model) return;

        const center = this._positionScreen();
        if (!center || this.startDistance <= 0) return;

        const distance = Cesium.Cartesian2.distance(screen, center);
        const factor = distance / this.startDistance;
        const scale = Math.max(0.001, this.startScale * factor);

        const scaleProperty = this.entity.model.scale;
        if (scaleProperty && scaleProperty.isConstant) {
            (scaleProperty as Cesium.ConstantProperty).setValue(scale);
        }
        else {
            this.entity.model.scale = new Cesium.ConstantProperty(scale);
        }
    }

    private _setPosition(position: Cesium.Cartesian3) {
        const positionProperty = this.entity?.position;
        if (positionProperty && positionProperty.isConstant) {
            (positionProperty as Cesium.ConstantPositionProperty).setValue(position);
        }
        else if (this.entity) {
            this.entity.position = new Cesium.ConstantPositionProperty(position);
        }
    }

    private _setOrientation(quaternion: Cesium.Quaternion) {
        const orientationProperty = this.entity?.orientation;
        if (orientationProperty && orientationProperty.isConstant) {
            (orientationProperty as Cesium.ConstantProperty).setValue(quaternion);
        }
        else if (this.entity) {
            this.entity.orientation = new Cesium.ConstantProperty(quaternion);
        }
    }

    private _currentHPR(): Cesium.HeadingPitchRoll {
        const position = this._position();
        const orientation = this.entity?.orientation?.getValue(Cesium.JulianDate.now());

        if (!orientation) {
            return new Cesium.HeadingPitchRoll(0, 0, 0);
        }

        const orientationAbs = Cesium.Matrix3.fromQuaternion(orientation);
        const transform = Cesium.Matrix4.fromRotationTranslation(orientationAbs, position);
        return Cesium.Transforms.fixedFrameToHeadingPitchRoll(transform);
    }

    private _currentScale(): number {
        const value = this.entity?.model?.scale?.getValue(Cesium.JulianDate.now());
        return typeof value === "number" ? value : 1;
    }

    private _positionScreen(): Cesium.Cartesian2 | null {
        return Cesium.SceneTransforms.worldToWindowCoordinates(
            this.viewer.scene,
            this._position(),
            new Cesium.Cartesian2(),
        ) ?? null;
    }

    private _screenAngle(screen: Cesium.Cartesian2): number {
        const center = this._positionScreen();
        if (!center) return 0;
        return Math.atan2(screen.y - center.y, screen.x - center.x);
    }

    private _axisDistance(screen: Cesium.Cartesian2, axis: Axis): number | null {
        if (!this.axes) return null;

        const ray = this.viewer.camera.getPickRay(screen);
        if (!ray) return null;

        const origin = this.frameOrigin;
        const dir = this.axes[axis];

        const toCamera = Cesium.Cartesian3.subtract(
            this.viewer.camera.positionWC, origin, new Cesium.Cartesian3());
        let normal = Cesium.Cartesian3.cross(dir, toCamera, new Cesium.Cartesian3());
        if (Cesium.Cartesian3.magnitudeSquared(normal) < 1e-10) {
            normal = Cesium.Cartesian3.cross(dir, this.viewer.camera.directionWC, new Cesium.Cartesian3());
        }
        Cesium.Cartesian3.normalize(normal, normal);

        const plane = Cesium.Plane.fromPointNormal(origin, normal);
        const hit = Cesium.IntersectionTests.rayPlane(ray, plane);
        if (!hit) return null;

        const rel = Cesium.Cartesian3.subtract(hit, origin, new Cesium.Cartesian3());
        return Cesium.Cartesian3.dot(rel, dir);
    }
}

function toCartesian3(v: Cesium.Cartesian4): Cesium.Cartesian3 {
    return new Cesium.Cartesian3(v.x, v.y, v.z);
}

function wrapAngle(angle: number): number {
    while (angle > Math.PI) angle -= Cesium.Math.TWO_PI;
    while (angle < -Math.PI) angle += Cesium.Math.TWO_PI;
    return angle;
}
