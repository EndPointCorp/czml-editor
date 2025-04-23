import "./data-styling-controls.css"

import { Color, Entity } from "cesium";
import { Tab, Tabs } from "../misc/elements/tabs";
import { ColorByValue } from "./color-by-value";
import { Subsection } from "../misc/elements/subsection";

type DataStylingControlsProps = {
    entities: Entity[];
    propNames: string[];
    setPreview?: (preview?: Color[]) => void;
};
export function DataStylingControls({entities, propNames, setPreview}: DataStylingControlsProps) {
    return (
        <Subsection className={'data-styling-controls'}>
            <h4>Conditional styling</h4>

            <Tabs>
                <Tab key={'colors'} title="Color by value">
                    <p class={'help-text'}>
                        Set entities colors by value of an attribute
                    </p>

                    <ColorByValue {...{entities, propNames}} 
                        onPreview={(coloringConfig, preview) => setPreview?.(preview)} />

                </Tab>

                <Tab key={'extrusion'} title="Extrusion and scale">
                    <div></div>
                </Tab>

            </Tabs>
        </Subsection>
    );
}

