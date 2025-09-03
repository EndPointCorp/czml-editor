import { ImageryLayer, ImageryProvider, Viewer } from "cesium";
import { ImagerySelectionT, SelectorOption } from "./ImgSelector";

export type CurrentImgT = {
    code: string
    layer: ImageryLayer
}

type Constructor<T = any> = new (...args: any[]) => T;

export type NewImgT = {
    code: string
    baseLayerModel?: SelectorOption
    providerClass?: Constructor;
    provider_options?: any;
}

type ImageryProviderEx = ImageryProvider & {
    lg_code?: string;
}

type ImageryLayerEx = ImageryLayer & {
    code?: string;
    _imageryProvider?: ImageryProviderEx
}

type CodeImageryTuple = {
    code?: string,
    layer: ImageryLayerEx
}

/**
 * Default implementation uses globally available Cesium handle
*/
export const Dependencies = {
    resolveProviderClass: function (provider: string) {
        // @ts-ignore
        return Cesium[provider] as Constructor;
    }
}

/**
* This function is supposed to be easy shareable.
* To be able to use it as drop in code-snippet
* it uses JSDoc type hints not ts
*
* @param {ImagerySelectionT} selection - selection from ImagerySelector
* @param {Viewer} viewer - cesium viewer
*/
export function applyImagery (
    selection: ImagerySelectionT, 
    viewer: Viewer) {

    const rslv = Dependencies.resolveProviderClass;

    console.log('Apply selection', selection);

    const currentImageries: CodeImageryTuple[] = listLayers(viewer).map((layer: ImageryLayerEx) => {

        const code = layer._imageryProvider?.lg_code || layer.code;

        if (!code) {
            console.warn("Can't find layer code", layer);
        }

        return { code, layer };
    });

    const newImageries: NewImgT[] = [];

    const {baseLayerOption, overlays} = selection;

    const baseLayerModel = baseLayerOption?.model;
    if (baseLayerModel) {
        newImageries.push({
            code: baseLayerOption.lg_code,
            baseLayerModel
        });
    }

    overlays?.forEach(imagery => {

        const {provider, provider_options} = imagery;

        const providerClass = provider ? rslv(provider) : undefined;

        if (providerClass) {
            newImageries.push({
                code: imagery.key,
                providerClass,
                provider_options
            });
        }
    });

    const imgToRemove = currentImageries.filter(ci => !newImageries.some(ni => (ci.code) === ni.code));
    const imgToCreate = newImageries.filter(ni => !currentImageries.some(ci => (ci.code) === ni.code));
    
    imgToRemove.forEach(remove => {
        viewer.imageryLayers.remove(remove.layer);
    });

    for (const create of imgToCreate) {
        const {code, baseLayerModel, providerClass, provider_options} = create;

        const existingLayerCodes = listLayers(viewer).map(l => l.code);
        if (existingLayerCodes.includes(code)) {
            continue;
        }

        if (baseLayerModel) {
                const fn = (
                    //@ts-ignore
                    baseLayerModel.creationFunction || baseLayerModel._creationFunction ||
                    //@ts-ignore
                    baseLayerModel.creationCommand || baseLayerModel._creationCommand
                );

                if (fn) {
                    const providerPromise = fn();
                    addLayerForProvider(viewer, providerPromise, code, 0);
                }
        }
        else if (providerClass) {

            const { url, assetId, ...baseProviderOptions } = provider_options;

            var providerPromise;

            // @ts-ignore new version of loading providers
            if (providerClass.fromAssetId && assetId) {
                // @ts-ignore
                providerPromise = providerClass.fromAssetId(assetId, baseProviderOptions);
            }
            // @ts-ignore new version of loading providers
            else if (providerClass.fromUrl && url) {
                // @ts-ignore
                providerPromise = providerClass.fromUrl(url, baseProviderOptions);
            }
            else {
                providerPromise = Promise.resolve(
                    new providerClass(provider_options) as ImageryProvider);
            }
            
            let inx = newImageries.findIndex(i => i.code === code);
            inx = Math.min(inx, viewer.imageryLayers.length);

            addLayerForProvider(viewer, providerPromise, code, inx);
        }
    }
}

async function addLayerForProvider(
    viewer: Viewer, providerPromise: Promise<ImageryProvider>, code: string, inx: number) {
    
    const provider = await providerPromise;
    if (provider) {
        (provider as ImageryProviderEx).lg_code = code;
        viewer.imageryLayers.addImageryProvider(provider, inx);
    }
}

function listLayers(viewer: Viewer) {
    return (viewer.imageryLayers as any)._layers as ImageryLayerEx[];
}