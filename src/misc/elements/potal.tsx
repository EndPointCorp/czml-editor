import { ComponentChildren } from "preact";
import { createPortal } from "preact/compat"

export type PortalProps = {
    rootId: string;
    children: ComponentChildren
}

export default function Portal({rootId, children}: PortalProps) {
    const portalRoot = document.getElementById(rootId);
    
    if (portalRoot) {
        return createPortal(children, portalRoot);
    }

    console.warn('Cannot find portal root element with id', rootId);

    return <>{
        children
    }</>
}