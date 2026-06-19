import './switch.css';

export type SwitchProps = {
    checked: boolean;
    onChange: (e: Event) => void;
}
export default function Switch ({checked, onChange}: SwitchProps) {
    return (
        <label class="ui-toggle">
          <input type="checkbox" checked={checked} onChange={onChange} />
          <span class="ui-toggle-track" />
        </label>
    );
}
