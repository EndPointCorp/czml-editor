import { Cartesian3, Cartographic, Entity } from "cesium";
import { InputField } from "./input-fld";
import { useCallback } from "preact/hooks";

type PositionFldProps = {
    label?: string
    entity: Entity;
    value?: Cartesian3
    onChange?: (value: Cartesian3) => void;
}
export function PositionFld({entity, onChange}: PositionFldProps) {

    const prop = entity.position;
    const isConstant = prop && prop.isConstant;
    const val = isConstant && prop.getValue();
    const catographic = val ? Cartographic.fromCartesian(val) : undefined;

    const latitude = toDegrees(catographic?.latitude);
    const longitude = toDegrees(catographic?.longitude);
    const height = catographic?.height ?? 0;

    const isEditable = !!(entity.model || entity.tileset);

    const setPosition = useCallback((lat: number, lon: number, h: number) => {
        if (!isNaN(lat) && !isNaN(lon) && !isNaN(h)) {
            onChange && onChange(Cartesian3.fromDegrees(lon, lat, h));
        }
    }, [onChange]);

    const handleLatitude = useCallback((newVal: string) => {
        const num = parseFloat(newVal);
        if (!isNaN(num)) {
            setPosition(num, longitude ?? 0, height);
        }
    }, [longitude, height, setPosition]);

    const handleLongitude = useCallback((newVal: string) => {
        const num = parseFloat(newVal);
        if (!isNaN(num)) {
            setPosition(latitude ?? 0, num, height);
        }
    }, [latitude, height, setPosition]);

    const handleHeight = useCallback((newVal: string) => {
        const num = parseFloat(newVal);
        if (!isNaN(num) && latitude !== undefined && longitude !== undefined) {
            setPosition(latitude, longitude, num);
        }
    }, [latitude, longitude, setPosition]);

    if (!isEditable && (latitude === undefined || longitude === undefined)) {
        return undefined;
    }

    if (isEditable) {
        return (
            <div class={'position-fld position-fld-edit'}>
                <InputField key={'position-lat'} label={'latitude'} fixed={6} value={latitude}
                    wheelStep={0.000001} onChange={handleLatitude} />
                <InputField key={'position-lon'} label={'longitude'} fixed={6} value={longitude}
                    wheelStep={0.000001} onChange={handleLongitude} />
                <InputField  key={'position-h'} label={'height (m)'} fixed={3} value={height}
                    wheelStep={1} onChange={handleHeight} />
            </div>
        );
    }

    return (
    <div class={'position-fld'}>
        <div class={'label'}>
            <span>Latitude</span>
            <span>Longitude</span>
            <span>Height(m)</span>
        </div>
        <div class={'value'}>
            <span>{`${latitude?.toFixed(6)}`}</span>
            <span>{`${longitude?.toFixed(6)}`}</span>
            <span>{`${height?.toFixed(3)}`}</span>
        </div>
        <InputField label={'height'} value={'' + height?.toFixed(3)} onChange={handleHeight} />
    </div>
    );
}


function toDegrees(val?: number) {
    return val !== undefined ? (val * 180 / Math.PI) : undefined;
}
