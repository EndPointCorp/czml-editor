import { ComponentChildren, render } from "preact";

type OffTreeRender = {
    target?: Element;
    children: ComponentChildren;
};
export function OffTreeRender({target, children}: OffTreeRender) {

    if (target) {
        render(children, target);
    }

    return <></>
}