export type CustomImageryRawOption = {
    key: string
    name: string
    provider: string

    provider_options: any

    // Is layer should be active by default after
    // imagery being loaded
    active?: boolean

    // false by default
    base_layer?: boolean
    category?: string

    // deprecated use base_layer = !useAsOverlay
    useAsOverlay?: boolean

    // deprecated use base_layer = !pure_overlay
    pure_overlay?: boolean
    
    icon?: string
    credit?: string
    rectangle?: number[]

    // deprecated, use provider_options.layers
    layers?: string[]

    // deprecated, use sublayers.overlays
    overlays?: Sublayers[]

    // Sublayers for WMS like data providers
    sublayers?: {
        single_selection?: boolean
        overlays?: Sublayers[]
    }

    // If is_overlay is false so this is a base layer
    // this option allows to force some default layer
    // to be used underling this provider
    background?: string | {
        default_layer_key?: string
    }

}

type Sublayers = {
    name: string
    key: string
    active?: boolean
    // If layers are undefined, then key is used as a single layer
    layers?: string | string[]
}

export type CustomImageryOption = {
    key: string
    name: string
    provider: string

    provider_options: any

    // Is layer should be active by default after
    // imagery being loaded
    active?: boolean

    base_layer?: boolean
    
    icon?: string
    credit?: string
    rectangle?: number[]

    // Sublayers for WMS like data providers
    sublayers?: {
        single_selection?: boolean
        overlays?: Sublayers[]
    }

    // If is_overlay is false so this is a base layer
    // this option allows to force some default layer
    // to be used underling this provider
    background?: string | {
        default_layer_key?: string
    }

}

export type DefaultLayers = boolean | string[];

export type PickerPropertiesRaw = PickerProperties & {
    // deprecated, use hide_picker instead
    show_picker?: boolean
}

export type PickerProperties = {
    // Default active layer
    default_layer?: string
    
    hide_picker?: boolean
    
    // Allows to hide all default layers optons from picker
    // Use: <code> default_layers: false </code>
    // or explicitly set which default layers options
    // should be present in the picker
    // Use: <code> default_layers: ['bing', 'bing_hybrid'] </code>
    default_layers?: DefaultLayers
}

// This is used to shorten urls or accessTokens
export type References = {
    [ref_key: string] : any
}

export type ImageryDocRaw = PickerPropertiesRaw & {
    custom_imagery?: CustomImageryRawOption[]
} & References

export type ImageryDoc = PickerProperties & {
    custom_imagery?: CustomImageryOption[]
}
