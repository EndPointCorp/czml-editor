import "./data-styling-controls.css"

import { Entity } from "cesium";
import { Tab, Tabs } from "../misc/elements/tabs";
import { ColorByValue } from "./color-by-value";
import { Subsection } from "../misc/elements/subsection";
import { Styling } from "./entities-data-table";
import { LabelByValue } from "./label-by-value";
import { ExtrusionByValue } from "./extrusion-by-value";

type DataStylingControlsProps = {
    entities: Entity[];
    propNames: string[];
    setPreview?: (preview?: Styling) => void;
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
                        onPreview={setPreview} />

                </Tab>

                <Tab key={'labels'} title="Labels">
                    <p class={'help-text'}>
                        Set Labels and Label text using entities attribute value.
                    </p>
                    <LabelByValue {...{entities, propNames}} />
                </Tab>

                <Tab key={'extrusion'} title="Extrusion and scale">
                    <p class={'help-text'}>
                        Set Polygon extrusion and or Billboard scale
                    </p>
                    <ExtrusionByValue {...{entities, propNames}} />
                </Tab>

            </Tabs>
        </Subsection>
    );
}

