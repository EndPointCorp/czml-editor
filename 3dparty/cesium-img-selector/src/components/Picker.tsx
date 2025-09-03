import { ChangeEvent } from "preact/compat";
import { useCallback, useEffect, useState } from "preact/hooks";
import { cls } from "../cls-util";
import { CustomImageryOption } from "../imagery";
import { ChangeSrc, ImgSelectorUICfg, PickerInterface, SelectorOption } from "../ImgSelector";

import styles from "./css.css?inline";
import Toggle from "./Toggle";
import { Signal } from "../Signal";

const styleSheet = document.createElement("style");
styleSheet.textContent = (styles as string);
document.head.appendChild(styleSheet);

type ImageryLoadedT = {
    baseLayerOption: SelectorOption
    customOverlays: CustomImageryOption[]
};

type setActiveImageryByCodeHT = (
    code: string,
    baseLayer: SelectorOption | undefined,
    activeOverlays: CustomImageryOption[]
) => any;

export type PickerProps = {
    signals: PickerInterface
    uiConfigSignal?: Signal<ImgSelectorUICfg | undefined, ChangeSrc>;
}
export default function Picker({signals, uiConfigSignal}: PickerProps) {
    const [uiConfig, setUiConfig] = useState(uiConfigSignal?.value);
    uiConfigSignal?.subscribe(uiConf => setUiConfig(uiConf), 'picker');
    
    const {categories, baseImageryOptions} = signals;

    const visibleInitValue = signals.visible.value || uiConfig?.alwaysVisible === true;
    const [visible, setVisible] = useState<boolean>(visibleInitValue);
    if (uiConfig?.alwaysVisible !== true) {
        signals.visible.subscribe(v => setVisible(v), 'picker');
    }
    
    const [terrain3d, setTerrain3d] = useState<boolean>(signals.terrain3d.value);
    signals.terrain3d.subscribe(v => setTerrain3d(v), 'picker');
    
    const [useGoogle3d, setUseGoogle3d] = useState<boolean>(signals.google3d.value);
    signals.google3d.subscribe(v => setUseGoogle3d(v), 'picker');

    const [defaultAssets, setDefaultAssets] = useState<boolean>(signals.defaultAssets.value);
    signals.defaultAssets.subscribe(v => setDefaultAssets(v), 'picker');
    
    const [selectedBaseLayer, setSelectedBaseLayer] =
        useState<SelectorOption | undefined>(signals.defaultBaseImageryOption);

    const [overlayOptions, setOverlayOptions] = useState<CustomImageryOption[]>([]);
    const [activeOverlays, setActiveOverlays] = useState<CustomImageryOption[]>([]);

    useEffect(() => {
        const imageryLoadedH = (doc: ImageryLoadedT) => {
            const { baseLayerOption, customOverlays } = doc;
            baseLayerOption && setSelectedBaseLayer(baseLayerOption);
            setOverlayOptions(customOverlays);

            if (customOverlays) {
                const activeOverlays = customOverlays.filter(o => o.active);
                console.log('imgLoaded activeOverlays', activeOverlays);
                setActiveOverlays(activeOverlays);

                signals.activeOverlays.setValue(activeOverlays, 'loadImagery');
            }
            else {
                setActiveOverlays([]);
                signals.activeOverlays.setValue([], 'loadImagery');
            }
        }

        signals.imageryLoaded.assign(imageryLoadedH);

    }, [signals.imageryLoaded, setOverlayOptions, setActiveOverlays, setSelectedBaseLayer]);

    useEffect(() => {
        const setActiveImageryByCodeH: setActiveImageryByCodeHT = (code, baseLayer, activeOverlays) => {
            if (baseLayer) {
                setSelectedBaseLayer(baseLayer);
            }
            if (activeOverlays) {
                setActiveOverlays(activeOverlays);
            }
            return code;
        };

        signals.setActiveImageryByCode.assign(setActiveImageryByCodeH);
    }, [signals.setActiveImageryByCode, setSelectedBaseLayer, setActiveOverlays]);

    const handleBaseLayerSelection = useCallback((model: SelectorOption) => {
        setSelectedBaseLayer(model);
        signals.selectedBaseImageryOption.setValue(model, 'user');
    }, [setSelectedBaseLayer, signals.selectedBaseImageryOption]);

    const overlaySelectionChange = useCallback((img: CustomImageryOption, checked: boolean) => {
        const newValue = checked ?
            [...activeOverlays.filter(i => i.key !== img.key), img] :
            [...activeOverlays.filter(i => i.key !== img.key)];
        
        setActiveOverlays(newValue);

        signals.activeOverlays.setValue(newValue, 'user');
    }, [activeOverlays, setActiveOverlays, signals.activeOverlays]);

    const hadleGoogle3DToggle = useCallback(() => {
        const val = !useGoogle3d;
        setUseGoogle3d(val);
        signals.google3d.setValue(val, 'user');
    }, [useGoogle3d, setUseGoogle3d, signals.google3d]);

    const handleGoogle3DChange = useCallback((evnt: ChangeEvent) => {
        const val = (evnt.target as HTMLInputElement).checked;
        setUseGoogle3d(val);
        signals.google3d.setValue(val, 'user');
    }, [setUseGoogle3d, signals.google3d]);

    const handleCesium3DToggle = useCallback(() => {
        if (useGoogle3d) return;

        const val = !terrain3d;
        setTerrain3d(val);
        signals.terrain3d.setValue(val, 'user');
    }, [terrain3d, useGoogle3d, setTerrain3d, signals.terrain3d]);

    const handleDefaultAssetsChange = useCallback(() => {
        // Default assets can be use with google 3d
        const val = !defaultAssets;
        setDefaultAssets(val);
        signals.defaultAssets.setValue(val, 'user');
    }, [defaultAssets, setDefaultAssets]);

    const handleCesium3DChange = useCallback((evnt: ChangeEvent) => {
        const val = (evnt.target as HTMLInputElement).checked;
        setTerrain3d(val);
        signals.terrain3d.setValue(val, 'user');
    }, [setTerrain3d, signals.terrain3d]);

    const hideBaseMapCategoryTitles = !!(uiConfig?.hideBaseMapCategoryTitles);
    const hideBaseMapOptionTitles = !!(uiConfig?.hideBaseMapOptionTitles);
    const categoryElements = categories.map(cat => {
        const categoryOptions = baseImageryOptions.filter(
            option => option.category === cat
        );

        return (categoryOptions &&
            <Category key={cat}
                title={cat}
                hideTitle={hideBaseMapCategoryTitles}
                hideOptionTitles={hideBaseMapOptionTitles}
                disabled={useGoogle3d}
                selectedOption={selectedBaseLayer}
                options={categoryOptions}
                onSelect={handleBaseLayerSelection}
            />
        )

    });

    const overlays = overlayOptions.map(img => {
        return <CustomOverlaySelector
            img={img}
            selected={activeOverlays.some(ovrl => ovrl.key === img.key)}
            onSelection={overlaySelectionChange.bind(undefined, img)} />
    });

    const anyOverlays = overlays && overlays.length > 0;

    const hideGoogle3d = !!(uiConfig?.hideGoogle3d);
    const hideTerrain3d = !!(uiConfig?.hideTerrain3d);
    const hideDefaultAssets = !!(uiConfig?.hideDefaultAssets);

    const hideAllTerrainOptions = hideGoogle3d && hideTerrain3d && hideDefaultAssets;
    const hideTerrainUi = !!(uiConfig?.hideTerrainControls) || hideAllTerrainOptions;
    const hideBaseMapControls = !!(uiConfig?.hideBaseMapControls);
    const alwaysVisible = !!(uiConfig?.alwaysVisible);

    return (
    <div className={cls(['picker', !visible && 'hidden', alwaysVisible && 'always-visible'])}>
        <div>
            {!hideTerrainUi && <h4>Terrain</h4>}
            {!hideTerrainUi &&
            <div className={'terrain-controls'}>
                {!hideGoogle3d &&
                <div className={'terrain-option'}>
                    <Toggle id={'g3d_toggle'} checked={useGoogle3d} onChange={handleGoogle3DChange} />
                    <span className={'toggle-label'} onClick={hadleGoogle3DToggle}>Google 3d</span>
                </div>}
                {!hideTerrain3d &&
                <div className={'terrain-option'}>
                    <Toggle id={'cion_toggle'} disabled={useGoogle3d} checked={terrain3d} onChange={handleCesium3DChange} />
                    <span className={'toggle-label'} onClick={handleCesium3DToggle}>3d terrain</span>
                </div>}
                {!hideDefaultAssets &&
                <div className={'terrain-option'}>
                    <Toggle id={'def_assets'} disabled={useGoogle3d} 
                        checked={defaultAssets} onChange={handleDefaultAssetsChange} />

                    <span className={'toggle-label'} onClick={handleDefaultAssetsChange}>
                        {uiConfig?.defaultAssetsLabel || 'Show default assets'}
                    </span>
                </div>}

            </div>}
        </div>

        {!hideBaseMapControls && anyOverlays && 
        <div className={'sub-section overlays-subsection'}>
            <h4>Overlays</h4>
            { overlays }
        </div>}

        {!hideBaseMapControls &&
        <div className={'sub-section base-map-subsection'}>
            <h4>Base map</h4>
            { categoryElements }
        </div>}
    </div>);
}

type CustomOverlaySelectorProps = {
    img: CustomImageryOption,
    selected: boolean
    onSelection: (selected: boolean) => any
}
function CustomOverlaySelector({img, selected, onSelection}: CustomOverlaySelectorProps) {

    const handleChange = useCallback((event: React.ChangeEvent) => {
        const target = event.target as HTMLInputElement;
        const checked = target.checked;

        onSelection && onSelection(checked);
    }, [onSelection]);

    const handleTitleTgl = useCallback(() => {
        onSelection && onSelection(!selected)
    }, [onSelection, selected]);

    return (
        <div className={cls(['custom-overlay-option', selected && 'selected'])}>
            <label onClick={handleTitleTgl} className={'overlay-title'}>
                {img.name}
            </label>
            <Toggle checked={selected}
                onChange={handleChange}>
            </Toggle>
        </div>
    )
}

type CategoryProps = {
    options: SelectorOption[]
    title?: string
    disabled?: boolean
    hideTitle?: boolean
    hideOptionTitles?: boolean
    selectedOption?: SelectorOption
    onSelect?: (option: SelectorOption) => any
};
function Category({title, options, selectedOption, disabled, hideTitle, hideOptionTitles, onSelect: onOptionSelect}: CategoryProps) {
    const selectOptionHandler = useCallback((option: SelectorOption) => {
        onOptionSelect && onOptionSelect(option);
    }, [onOptionSelect]);

    const optionElements = options.map(option => {
        const selected = option.lg_code === selectedOption?.lg_code;
        return <BaseLayerOption
            option={option}
            disabled={disabled}
            selected={selected}
            onSelect={selectOptionHandler}
        />
    });

    const titleIsVisible = title !== undefined && !hideTitle;

    return <>
        { titleIsVisible && <h5 className={'category-title'}>{ title }</h5>}
        <div className={cls(['category', hideOptionTitles && 'hide-option-titles'])}>
            { optionElements }
        </div>
    </>
}

type BaseLayerOptionProps = {
    option: SelectorOption
    disabled?: boolean
    selected?: boolean
    onSelect?: (option: SelectorOption) => any
}
function BaseLayerOption({option, selected, disabled, onSelect}: BaseLayerOptionProps) {
    const className = cls([
        'option',
        !disabled && selected && 'selected',
        disabled && 'disabled'
    ]);
    
    return (
        <span className={className} key={option.lg_code}
            onClick={() => {!disabled && onSelect && onSelect(option)}}
        >
            <img className={ 'optionIcon' } src={ option.icon }></img>
            <div className={ 'optionLabel' } >{ option.title || option.model.name }</div>
        </span>
    );
}
