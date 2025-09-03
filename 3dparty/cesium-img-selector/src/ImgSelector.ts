import Picker from './components/Picker';
import { FuncDelegate, Signal } from './Signal';

import { createElement, render } from 'preact';

import { CustomImageryOption, CustomImageryRawOption, ImageryDocRaw, References } from './imagery';
import * as IntegrationApi from './integration-layer';

export const CesiumIntegrationApi = {
    Dependencies: IntegrationApi.Dependencies,
    applyImagery: IntegrationApi.applyImagery
}

export type {
    CustomImageryOption, CustomImageryRawOption,
    ImageryDoc, ImageryDocRaw,
    PickerProperties, PickerPropertiesRaw
} from './imagery';

export type ImagerySelectionT = {
    code: string
    baseLayerOption?: SelectorOption
    overlays?: CustomImageryOption[]
}

export type SelectorOption = {
    title: string
    lg_code: string
    category: string
    icon: string
    model: any
}

export type ImgSelectorConstructor = {
    visible: boolean
    google3d?: boolean
    terrain3d?: boolean
    defaultAssets?: boolean

    uiConfig?: ImgSelectorUICfg
    mainUiContainer?: Element
    
    categories?: string[]

    defaultBaseImageryOption?: SelectorOption
    baseImageryOptions?: SelectorOption[]
};

export type ImgSelectorUICfg = {
    alwaysVisible?: boolean;
    hideTerrainControls?: boolean;
    hideGoogle3d?: boolean;
    hideTerrain3d?: boolean;
    hideDefaultAssets?: boolean;
    hideBaseMapControls?: boolean;
    hideBaseMapCategoryTitles?: boolean;
    hideBaseMapOptionTitles?: boolean;
    defaultAssetsLabel?: string;
}

export type ChangeSrc = 'ImgSelector.set' | 'setByCode' | 'loadImagery' | 'user';

export type PickerInterface = {
    visible: Signal<boolean, ChangeSrc>;
    google3d: Signal<boolean, ChangeSrc>;
    terrain3d: Signal<boolean, ChangeSrc>;
    defaultAssets: Signal<boolean, ChangeSrc>;

    activeOverlays: Signal<CustomImageryOption[], ChangeSrc>;
    selectedBaseImageryOption: Signal<SelectorOption | undefined, ChangeSrc>;
    
    categories: string[];

    defaultBaseImageryOption?: SelectorOption;
    baseImageryOptions: SelectorOption[];

    imageryLoaded: FuncDelegate;
    setActiveImageryByCode: FuncDelegate;
}

export default class ImgSelector {

    visible: Signal<boolean, ChangeSrc>;
    
    google3d: Signal<boolean, ChangeSrc>;
    terrain3d: Signal<boolean, ChangeSrc>;
    defaultAssets: Signal<boolean, ChangeSrc>;

    selectedBaseImageryOption: Signal<SelectorOption | undefined, ChangeSrc>;
    activeOverlays: Signal<CustomImageryOption[], ChangeSrc>;

    baseImageryOptions: SelectorOption[];
    customOverlays: CustomImageryOption[];

    uiContainer?: Element = undefined;
    uiConfig?: Signal<ImgSelectorUICfg | undefined, ChangeSrc> = undefined;

    /**
     * Mark for imagery, marking source get's updated with each loadImagery
     */
    imageryMark: any = null;

    dataInterface: PickerInterface;

    constructor(options: ImgSelectorConstructor) {

        this.visible = new Signal<boolean, ChangeSrc> (
            options.visible !== undefined ? options.visible : false );

        this.google3d = new Signal<boolean, ChangeSrc> (
            options.google3d !== undefined ? options.google3d : false );
        
        this.terrain3d = new Signal<boolean, ChangeSrc> (
            options.terrain3d !== undefined ? options.terrain3d : false );

        this.defaultAssets = new Signal<boolean, ChangeSrc>(
            options.defaultAssets !== undefined ? options.defaultAssets : false 
        );

        const {categories = ['Satellite', 'Geographic'], baseImageryOptions = []} = options;

        this.uiConfig = new Signal(options.uiConfig);
        
        this.baseImageryOptions = baseImageryOptions;
        this.customOverlays = [];

        this.activeOverlays = new Signal<CustomImageryOption[], ChangeSrc>([]);
        this.selectedBaseImageryOption = new Signal<SelectorOption | undefined, ChangeSrc>(options.defaultBaseImageryOption);

        this.dataInterface = {
            categories,
            baseImageryOptions,

            imageryLoaded: new FuncDelegate(),
            setActiveImageryByCode: new FuncDelegate(),

            defaultBaseImageryOption: options.defaultBaseImageryOption,
            selectedBaseImageryOption: this.selectedBaseImageryOption,
            
            visible: this.visible,
            google3d: this.google3d,
            terrain3d: this.terrain3d,
            activeOverlays: this.activeOverlays,
            defaultAssets: this.defaultAssets,
        };

        if (options.mainUiContainer) {
            this.uiContainer = options.mainUiContainer;

            const picker = createElement(Picker, {
                signals: this.dataInterface,
                uiConfigSignal: this.uiConfig
            });
            
            render(picker, options.mainUiContainer);
        }
        
    }

    setVisible(visible: boolean) {
        this.visible.setValue(visible, 'ImgSelector.set');
    }

    setUseGoogle3d(active: boolean) {
        this.google3d.setValue(active, 'ImgSelector.set');
    }

    getCurrentSelection() {
        const baseLayerOption = this.selectedBaseImageryOption.value;
        const overlays = this.activeOverlays.value;

        const code = [baseLayerOption?.lg_code, ...overlays.map(o => o.key)]
            .filter(c => !!c).join(',');
        
        return {
            code,
            baseLayerOption,
            overlays
        } as ImagerySelectionT;
    }

    setActiveImageryByCode(code: string) {
        const keys = code.split(',');
        
        const baseLayer = this.baseImageryOptions
            .find(o => keys.includes(o.lg_code));
    
        const activeOverlays = this.customOverlays
            .filter(i => keys.includes(i.key));
        
        this.dataInterface.setActiveImageryByCode.call(
            code, baseLayer, activeOverlays
        );

        if (baseLayer) {
            this.selectedBaseImageryOption.setValue(baseLayer, 'setByCode', code);
        }

        if (activeOverlays) {
            this.activeOverlays.setValue(activeOverlays, 'setByCode', code);
        }

    }

    /**
     * Fetch data, sanitize it and update UI
    */
    loadImagery(imagery: ImageryDocRaw, mark: any) {
        const baseLayerCode = imagery.default_layer;
        const customRawImagery = imagery.custom_imagery;

        const sanitizedImagery = this.sanitizeCustomImagery(customRawImagery, imagery) || [];
        
        this.imageryMark = mark || strChecksum(JSON.stringify(sanitizedImagery));

        const baseLayerOption = this.baseImageryOptions
            .find(o => o.lg_code === baseLayerCode);

        const docModel = {
            baseLayerOption,
            customOverlays: sanitizedImagery
        };

        this.dataInterface.imageryLoaded.call(docModel);

        if (baseLayerOption) {
            this.selectedBaseImageryOption.setValue(baseLayerOption, 'loadImagery', mark);
        }

        this.customOverlays = sanitizedImagery;
        const activeOverlays = this.customOverlays.filter(i => i.active);
        this.activeOverlays.setValue(activeOverlays, 'loadImagery', mark);

        return docModel;
    }

    sanitizeCustomImagery(customRawImagery: CustomImageryRawOption[] = [], references: References) {
        return customRawImagery.map(rawDef => {
            const {
                key, name, provider, icon, credit,
                base_layer, active = false, provider_options = {}
            } = rawDef;

            const sanitized: CustomImageryOption = {
                key, name, provider, icon, credit, base_layer, active, provider_options
            };

            if (rawDef.layers) {
                sanitized.provider_options.layers = rawDef.layers;
            }

            if (sanitized.base_layer === undefined) {
                // Apply legacy options to destiguish
                // between overlays and base layers

                if (rawDef.pure_overlay !== undefined) {
                    sanitized.base_layer = !rawDef.pure_overlay;
                }
                
                if (rawDef.useAsOverlay !== undefined) {
                    sanitized.base_layer = !rawDef.pure_overlay;
                }
            }

            const validRectangle =
                rawDef.rectangle !== undefined
                && Array.isArray(rawDef.rectangle)
                && rawDef.rectangle.length === 4;

            if (validRectangle) {
                sanitized.rectangle = rawDef.rectangle;
            }

            const validOverlays =
                rawDef.overlays
                && Array.isArray(rawDef.overlays)
                && rawDef.overlays.length > 0;

            if (validOverlays && sanitized.sublayers === undefined) {
                sanitized.sublayers = {
                    single_selection: false,
                    overlays: rawDef.overlays
                }
            }

            const background = (typeof rawDef.background === 'string')
                ? rawDef.background
                : rawDef.background?.default_layer_key;
            
            if (background) {
                sanitized.background = background;
            }

            derefObjectDeep(sanitized, references);
            console.log('Sanitized custom opt:', sanitized);

            return sanitized;
        });
    }
}

function derefObjectDeep(subj: any, refs: References) {
    // Arrays are included on purpose
    if (typeof subj === 'object') {
        Object.keys(subj).forEach(k => {
            if (typeof subj[k] === 'string') {
                subj[k] = deref(subj[k], refs);
            }
            else {
                derefObjectDeep(subj[k], refs);
            }
        });
    }
}

function deref(val: string, refs: References) {
    return (val && typeof val === 'string' && val.startsWith('$') && refs[val]) ? refs[val] : val;
}

function strChecksum(s: string) {
  var chk = 0x12345678;
  for (var i = 0; i < s.length; i++) {
      chk += (s.charCodeAt(i) * (i + 1));
  }

  return (chk & 0xffffffff).toString(16);
}

// @ts-ignore
export function mergeImagery(imagery, img) {
    if (imagery === undefined || Object.entries(imagery).length === 0) {
        return img;
    }

    if (!img) {
        return imagery;
    }

    if (img.show_picker === false) {
        imagery.show_picker = false;
    }

    if (img.default_layer) {
        imagery.default_layer = img.default_layer;
    }
    
    if (img.hide_layers) {
        const hide_layers = Array.isArray(img.hide_layers) ? img.hide_layers : [img.hide_layers];

        if (imagery.hide_layers === undefined) {
            imagery.hide_layers = [];
        }
        else if (!Array.isArray(imagery.hide_layers)) {
            imagery.hide_layers = [imagery.hide_layers];
        }

        imagery.hide_layers.push(...hide_layers);
    }

    if (imagery.custom_imagery === undefined) {
        imagery.custom_imagery = [];
    }

    // @ts-ignore
    img.custom_imagery?.forEach(im_add => {
        // @ts-ignore
        if (!imagery.custom_imagery.some(im_exist => im_exist.key === im_add.key)) {
            imagery.custom_imagery.push(im_add);
        }
    });

    return imagery;
}