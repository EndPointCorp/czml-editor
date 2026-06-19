import { Cartesian3, ConstantProperty, Entity, HeadingPitchRoll, Matrix3, Matrix4, Quaternion, Transforms } from "cesium";
import { VectorField } from "./fields/vector-fld";
import { useCallback } from "preact/hooks";

type OrientationEditorProps = {
    entity: Entity;
    onChange?: (entity: Entity) => void;
}

function toDegrees(radians: number): number {
    return radians * 180 / Math.PI;
}

function toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
}

export function OrientationEditor({entity, onChange}: OrientationEditorProps) {

    const orientationProperty = entity.orientation;

    const propVal = orientationProperty?.isConstant && orientationProperty.getValue();
    const position = entity.position?.isConstant && entity.position?.getValue();

    const valHpr = position && propVal && globalOrientationQuaternionToLocalHPR(position, propVal);
    const valHprDegrees = valHpr && new HeadingPitchRoll(
        toDegrees(valHpr.heading),
        toDegrees(valHpr.pitch),
        toDegrees(valHpr.roll),
    );

    const handleChange = useCallback((hprDegrees: HeadingPitchRoll) => {
        if (position) {
            const hpr = new HeadingPitchRoll(
                toRadians(hprDegrees.heading),
                toRadians(hprDegrees.pitch),
                toRadians(hprDegrees.roll),
            );
            const globalQ = localHPRToGlobalOrientationQuaternion(position, hpr);

            if (orientationProperty) {
                if (orientationProperty.isConstant) {
                    (orientationProperty as ConstantProperty).setValue(globalQ);
                }
            }
            else {
                entity.orientation = new ConstantProperty(globalQ);
            }

            onChange && onChange(entity);
        }

    }, [entity, position, orientationProperty, onChange]);

    if (!entity.model) {
        return;
    }

    return (
    <div>
        <h4>Orientation (degrees)</h4>

        <VectorField targetClass={HeadingPitchRoll} size={3} inline={true} 
            componentNames={['heading', 'tilt', 'roll']} value={valHprDegrees} onChange={handleChange} />
    </div>);
}

export function localHPRToGlobalOrientationQuaternion(position: Cartesian3, hpr: HeadingPitchRoll) {
    return Transforms.headingPitchRollQuaternion(position, hpr);
}

export function globalOrientationQuaternionToLocalHPR(position: Cartesian3, orientation: Quaternion) {
    const orientationAbs = Matrix3.fromQuaternion(orientation);

    const transform = Matrix4.fromRotationTranslation(
        orientationAbs,
        position);

    return Transforms.fixedFrameToHeadingPitchRoll(transform);
}
