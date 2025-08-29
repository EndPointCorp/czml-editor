import { useCallback } from "preact/hooks";
import { SupportedGraphic } from "./property-fld";
import { Cartesian3, Cartographic, ConstantProperty, PolygonGraphics, PolygonHierarchy } from "cesium";

function zeroElevation(cart3: Cartesian3[]) {
    const degrees = cart3.map(c => {
        const crtg = Cartographic.fromCartesian(c);
        console.log(crtg.longitude, crtg.latitude);
        return [crtg.longitude, crtg.latitude];
    }).flat();

    return Cartesian3.fromRadiansArray(degrees);
}

const drapePolygonAction = {
    perform: (polygon: SupportedGraphic) => {
        if (polygon instanceof PolygonGraphics) {
            const h: PolygonHierarchy | undefined = polygon.hierarchy?.getValue();

            if (h) {
                const newH = new PolygonHierarchy(zeroElevation(h.positions));
                polygon.hierarchy = new ConstantProperty(newH);
            }

            polygon.height = undefined;
            polygon.extrudedHeight = undefined;
        }
    },
    enabled: (polygon: SupportedGraphic) => {
        return polygon instanceof PolygonGraphics;
    }
}

// a.t.m. there is just one action, if there will be more
// get action from registry by actionId
function getAction(_actionId: string) {
    return drapePolygonAction;
};

export type ActionFieldProps = {
    actionId: string;
    label?: string;
    subject: SupportedGraphic;
    onAction?: () => void
}
export function ActionField({label, subject, actionId, onAction}: ActionFieldProps) {

    const action = getAction(actionId);

    const disabled = !action.enabled(subject);

    const handleClick = useCallback(() => {
        console.log(`Perform ${action} on`, subject);

        action.perform(subject);

        onAction && onAction();
    }, [subject, action, onAction])

    return (
        <div class="input-container action-fld">
            <button disabled={disabled} onClick={handleClick}>{label}</button>
        </div>
    );
}