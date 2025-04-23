import { useState } from "preact/hooks";

import cls from "../cls";

import './tabs.css';
import { ComponentChildren, VNode } from "preact";

type TabFC = VNode<TabProps>;

export type TabsProps = {
    children: TabFC[] | TabFC;
    selectedTabInx?: number;
    onTabChange?: (inx: number, key?: string) => void;
}
export function Tabs({children, selectedTabInx, onTabChange}: TabsProps) {

    const [tabInx, setTabInx] = useState<number>(selectedTabInx ?? 0);
    const sInx = selectedTabInx ?? tabInx;

    const childrenArray = (Array.isArray(children) ? children : [children]);

    const header = childrenArray.map((elem: TabFC, i) => {
        const title = elem.props.title;
        const handleTabHeaderClick = () => {
            selectedTabInx === undefined && setTabInx(i);
            onTabChange?.(i);
        };

        return (
        <span class={cls('tab-header', (i === sInx) && 'selected')} 
            onClick={handleTabHeaderClick}>

            {title}

        </span>);
    });

    const tabs = childrenArray.map((chld, i) => {
        return <div class={cls('tab', (i === sInx) && 'selected')}>{chld}</div>
    });

    return (
        <>
        <div class={'tab-bar'}>
            {header}
        </div>
        {tabs}
        </>
    )
}

export type TabProps = {
    title: string;
    children: ComponentChildren;
}
export function Tab({children}: TabProps) {
    return <>
    {children}
    </>
}