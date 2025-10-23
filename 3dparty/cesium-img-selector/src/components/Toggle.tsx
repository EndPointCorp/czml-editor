import { ChangeEvent } from "preact/compat";
import { cls } from "../cls-util";

export type ToggleProps = {
    id?: string,
    checked?: boolean,
    disabled?: boolean,
    onChange?: (e: ChangeEvent) => any
};

export default function Toggle ({id, checked, disabled, onChange}: ToggleProps) {
    return (
        <label id={id} className={cls(['switch', disabled && 'disabled'])}>
          <input type="checkbox" disabled={disabled} checked={checked} onChange={onChange} />
          <span className="slider" />
        </label>
    );
}