import { ComponentChildren } from "preact"
import { CSSProperties } from "preact/compat";

import cls from "../cls";

import "./subsection.css";

type SubsectionProps = {
    id?: string;
    style?: CSSProperties;
    className?: string;
    children: ComponentChildren
}

export function Subsection({id, className, style, children}: SubsectionProps) {
    return (
    <div id={id} style={style} 
        class={cls('subsection', className)}>
        {children}
    </div>);
}