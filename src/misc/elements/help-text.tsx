import "./help-text.css"

import { ComponentChildren } from "preact";
import { useState } from "preact/hooks";
import cls from "../cls";

type HelpTextProps = {
    children: ComponentChildren;
    unfold?: boolean;
    className?: string;
};
export function HelpText({children, unfold, className}: HelpTextProps) {
    
    const [folded, setFolded] = useState<boolean>(unfold !== undefined ? unfold : true);

    return (
        <p class={cls('help-text', className)}>
            <a onClick={() => setFolded(!folded)}>&#x1F6C8; </a>
            {!folded && 
            <span>
            {children}
            </span>
            }
        </p>
    );
}