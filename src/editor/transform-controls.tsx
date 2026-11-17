import { Entity } from "cesium";
import { useCallback, useContext, useEffect, useState } from "preact/hooks";
import { EditorContext } from "./editor";
import { LabledSwitch } from "../misc/elements/labled-switch";
import { GizmoMode } from "../geometry-editor/transform-gizmo";
import cls from "../misc/cls";
import "./transform-controls.css";

type TransformControlsProps = {
    entity: Entity;
    onChange?: () => void;
}

const MODES: { id: GizmoMode; label: string }[] = [
    { id: "translate", label: "Move" },
    { id: "rotate", label: "Rotate" },
    { id: "scale", label: "Scale" },
];

export function TransformControls({ entity, onChange }: TransformControlsProps) {

    const gizmo = useContext(EditorContext).transformGizmo;

    const canScale = !!entity.model;
    const hasPosition = !!entity.position;

    const [mode, setMode] = useState<GizmoMode>("translate");
    const [active, setActive] = useState<boolean>(false);

    useEffect(() => {
        return () => {
            gizmo?.detach();
        };
    }, [gizmo, entity]);

    const handleActiveChange = useCallback((val: boolean) => {
        if (!gizmo) {
            return;
        }

        if (val && !hasPosition) {
            return;
        }

        if (val) {
            gizmo.attach(entity, mode, onChange);
            setActive(true);
        }
        else {
            gizmo.detach();
            setActive(false);
        }
    }, [gizmo, entity, mode, onChange, hasPosition]);

    const handleModeChange = useCallback((newMode: GizmoMode) => {
        setMode(newMode);

        if (active && gizmo) {
            gizmo.setMode(newMode, onChange);
        }
    }, [active, gizmo, onChange]);

    const availableModes = MODES.filter(m => m.id !== "scale" || canScale);

    return (
        <div class={'transform-controls'}>
            <h4>Transform in map</h4>

            {!hasPosition && <p class={'orientation-hint'}>Set a position first to transform.</p>}

            {hasPosition &&
            <div class={'transform-modes'}>
                {availableModes.map(m => (
                    <button key={m.id}
                        class={cls('transform-mode-button', mode === m.id && 'selected')}
                        onClick={() => handleModeChange(m.id)}>
                        {m.label}
                    </button>
                ))}
            </div>}

            <LabledSwitch checked={active} onChange={handleActiveChange}
                label={'Edit with gizmo'} />
        </div>
    );
}
