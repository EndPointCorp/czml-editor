import "./color-by-value.css";

import { Color, Entity } from "cesium";
import { useCallback, useMemo, useState } from "preact/hooks";
import { ColorRamp, ColorRampEditor, sampleRamp } from "../misc/elements/color-ramp-editor";
import { ColoringConfig, ColoringControls, defaultColoring } from "./coloring-controls";
import { Tab, Tabs } from "../misc/elements/tabs";
import { FoldableColorEdit } from "../misc/elements/foldable-color-edit";
import { HelpText } from "../misc/elements/help-text";
import { Styling, applyStyles } from "./entities-data-table";
import { ValueSrcControls } from "./value-src-controls";

type ColorMap = {
    [k: string]: Color
};

const defaultRamp = {
    gradations: 0,
    stops: [
        {rgba: [1, 0, 0, .75], ratio: 0}, 
        {rgba: [0, 0, 1, .75], ratio: 1},
    ]
};

type ColorByValueProps = {
    entities: Entity[];
    propNames: string[];
    preview?: Color[];
    onPreview?: (stylingPreview?: Styling) => void;
}
export function ColorByValue({entities, propNames, preview, onPreview}: ColorByValueProps) {
    
    const [property, setProperty] = useState<string>(propNames[0]);

    const modes = ['distribution', 'unique'] as const;
    const [mode, setMode] = useState<typeof modes[number]>('distribution');

    const valueStatistics = useMemo(() => {
        const values = entities.map(e => e.properties?.getValue()[property]);

        const numericValuesCount = values.filter(v => Number(v) === v).length;
        const numberUniqueValues = new Set(values).size;
        const nonNumeric = numericValuesCount < entities.length * 0.8;

        return {
            numericValuesCount,
            numberUniqueValues,
            nonNumeric
        }

    }, [entities, property]);

    const [coloringConfig, setColoringConfig] = useState<ColoringConfig>(defaultColoring);

    const [ramp, setRamp] = useState<ColorRamp>(defaultRamp);

    const [valueColorMap, setValueColorMap] = useState<ColorMap>();

    const sampleValues = useCallback(() => {
        if (property) {
            
            const values = entities.map(e => '' + e.properties?.getValue()[property]);
            const colorMap: ColorMap = mapUniqueValues(values);
            setValueColorMap(colorMap);

            const colorValues = values.map(v => colorMap[v]);
            onPreview?.({colorValues, coloringConfig});
        }
    }, [entities, property, setValueColorMap, coloringConfig, onPreview]);

    const buildPreview = useCallback(() => {
        if (!property) {
            return;
        }

        if (mode === 'distribution') {
            const colorValues = mapValuesToRampColors(entities, property, ramp);
            onPreview?.({colorValues, coloringConfig});
        }
        else if (mode === 'unique') {
            var colorMap = valueColorMap;

            const values = entities.map(e => '' + e.properties?.getValue()[property]);
            if (colorMap === undefined) {
                colorMap = mapUniqueValues(values);
                setValueColorMap(colorMap);
            }

            if (colorMap) {
                const colorValues = values.map(v => colorMap![v]);
                onPreview?.({colorValues, coloringConfig});
            }
        }
    }, [entities, property, mode, ramp, valueColorMap, coloringConfig, setValueColorMap, onPreview]);
    
    const applyStyling = useCallback(() => {
        if (!property) {
            return;
        }

        var colorValues: Color[] = [];

        if (mode === 'distribution') {
            colorValues = mapValuesToRampColors(entities, property, ramp);
        }
        else if (mode === 'unique') {
            var colorMap = valueColorMap;

            const values = entities.map(e => '' + e.properties?.getValue()[property]);
            if (colorMap === undefined) {
                colorMap = mapUniqueValues(values);
                setValueColorMap(colorMap);
            }

            if (colorMap) {
                colorValues = values.map(v => colorMap![v]);
            }
        }

        applyStyles(entities, {colorValues, coloringConfig});
        onPreview?.(undefined);

    }, [entities, property, ramp, mode, coloringConfig, onPreview]);

    return (<>

        <ValueSrcControls {...{property, setProperty, propNames}} />

        <div>
        <Tabs selectedTabInx={modes.indexOf(mode)} onTabChange={inx => setMode(modes[inx])} >
            <Tab key={'value_distribution'} title="Gradient Fill" >
            <div class={'val-distribution-tab'}>
                <HelpText className={'text'}>
                    For a chosen attribute value, we will determine its position within the range of minimum and maximum values found in all entries. <br/>
                    Based on this position, we will calculate a percentage and select a color from a gradient. <br/>
                    This color will then be used to style the entity, making it visually represent its value in relation to others.
                </HelpText>
                {valueStatistics.nonNumeric && <div>
                    <b style={{color: 'red'}}>!</b> Selected attribute contains non-numeric values 
                </div>}
                <label>Gradient: </label>
                <ColorRampEditor ramp={ramp} onRampChange={setRamp} />
            </div>
            </Tab>
            
            <Tab key={'unique_values'} title="Unique Values">
            <div class={'unique-vals-tab'}>
                <HelpText className={'text'} unfold={true}>
                    For the selected attributes, we will gather all the unique values and assign a specific color to each one. <br/>
                    Then, we will use these colors to style the entities.
                </HelpText>
                <button onClick={sampleValues}>Update colors and values</button>
                {valueColorMap && <ValueToColorMap colorMap={valueColorMap} />}
            </div>
            </Tab>
        </Tabs>
        </div>
        
        <ColoringControls 
            layoutHorizontal={true}
            coloringConfig={coloringConfig} 
            onColoringConfigChange={cfg => setColoringConfig(cfg)} />
        
        <div>
            <button disabled={ property === undefined } 
                onClick={() => {buildPreview()}}>Preview</button>
            <button disabled={ property === undefined && !preview?.length } 
                onClick={() => {applyStyling()}}>Apply</button>
        </div>
    </>);
}

type ValueToColorMapProps = {
    colorMap: ColorMap;
    onChange?: (newColorMap: ColorMap) => void;
};
function ValueToColorMap({colorMap}: ValueToColorMapProps) {

    const entries = Object.entries(colorMap).map(([k, color]) => {
        return (<div key={k} className={'color-map-entry'}>
            <div style={{whiteSpace: 'pre'}}>{k}</div>
            <FoldableColorEdit value={color} alpha={true}
                className={'small'}
                onChange={() => {}} />
        </div>);
    });

    return (
    <div class={'value-to-color-map'}>
        {entries}
    </div>);
}

function mapUniqueValues(values: string[]) {
    const colorMap: ColorMap = {};
    values.forEach(v => {
        if (colorMap[v] === undefined) {
            colorMap[v] = Color.fromRandom();
        }
    });
    return colorMap;
}

function mapValuesToRampColors(entities: Entity[], property: string, ramp: ColorRamp) {
    const values = entities.map(e => e.properties?.getValue()[property]);
    const minMax = [Number.MAX_VALUE, Number.MIN_VALUE];

    const gradations = ramp.gradations || 1;

    values.filter(v => Number(v) === v).forEach(val => {
        minMax[0] = Math.min(val, minMax[0]);
        minMax[1] = Math.max(val, minMax[1]);
    });

    const [minValue, maxValue] = minMax;
    const maxMinW = maxValue - minValue;

    if (gradations >= 2) {
        const bucketW = maxMinW / gradations;
    
        const buckets = values.map(val => 
            Math.floor((minValue + val) / bucketW)
        );
    
        return buckets.map(bkt => {
            const f = bkt / gradations;
            const [r, g, b, a] = sampleRamp(f, ramp.stops);
    
            return new Color(r, g, b, a);
        });
    }

    return values.map(val => {
        const [r, g, b, a] = sampleRamp((val - minValue) / maxMinW, ramp.stops);
        return new Color(r, g, b, a);
    });

}

