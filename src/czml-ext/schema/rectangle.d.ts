/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * Whether or not the rectangle is shown.
 */
export type Boolean = DeletableProperty &
  BooleanValueProperty &
  ReferenceValueProperty & {
    boolean?: Boolean1;
    reference?: Reference;
    [k: string]: unknown;
  } & (
    | Boolean2[]
    | {
        boolean?: Boolean1;
        reference?: Reference;
        [k: string]: unknown;
      }
    | boolean
  );
/**
 * The boolean value.
 */
export type Boolean1 = boolean;
/**
 * The boolean specified as a reference to another property.
 */
export type Reference = string;
/**
 * A boolean value.
 */
export type Boolean2 = DeletableProperty &
  BooleanValueProperty &
  ReferenceValueProperty & {
    boolean?: Boolean1;
    reference?: Reference;
    [k: string]: unknown;
  } & (
    | Boolean2[]
    | {
        boolean?: Boolean1;
        reference?: Reference;
        [k: string]: unknown;
      }
    | boolean
  );
/**
 * The coordinates of the rectangle.
 */
export type RectangleCoordinates = InterpolatableProperty &
  DeletableProperty &
  CartographicRectangleRadiansValueProperty &
  CartographicRectangleDegreesValueProperty &
  ReferenceValueProperty & {
    wsen?: CartographicRectangleRadians;
    wsenDegrees?: CartographicRectangleDegrees;
    reference?: Reference1;
    [k: string]: unknown;
  } & (
    | RectangleCoordinates1[]
    | {
        wsen?: CartographicRectangleRadians;
        wsenDegrees?: CartographicRectangleDegrees;
        reference?: Reference1;
        [k: string]: unknown;
      }
  );
/**
 * The set of coordinates specified as Cartographic values `[WestLongitude, SouthLatitude, EastLongitude, NorthLatitude]`, with values in radians.
 */
export type CartographicRectangleRadians = unknown[];
/**
 * The set of coordinates specified as Cartographic values `[WestLongitude, SouthLatitude, EastLongitude, NorthLatitude]`, with values in degrees.
 */
export type CartographicRectangleDegrees = unknown[];
/**
 * The set of coordinates specified as a reference to another property.
 */
export type Reference1 = string;
/**
 * A set of coordinates describing a cartographic rectangle on the surface of the ellipsoid.
 */
export type RectangleCoordinates1 = InterpolatableProperty &
  DeletableProperty &
  CartographicRectangleRadiansValueProperty &
  CartographicRectangleDegreesValueProperty &
  ReferenceValueProperty & {
    wsen?: CartographicRectangleRadians;
    wsenDegrees?: CartographicRectangleDegrees;
    reference?: Reference1;
    [k: string]: unknown;
  } & (
    | RectangleCoordinates1[]
    | {
        wsen?: CartographicRectangleRadians;
        wsenDegrees?: CartographicRectangleDegrees;
        reference?: Reference1;
        [k: string]: unknown;
      }
  );
/**
 * The height of the rectangle.
 */
export type Double = InterpolatableProperty &
  DeletableProperty &
  DoubleValueProperty &
  ReferenceValueProperty & {
    number?: Double1;
    reference?: Reference2;
    [k: string]: unknown;
  } & (
    | Double2[]
    | {
        number?: Double1;
        reference?: Reference2;
        [k: string]: unknown;
      }
    | number
  );
/**
 * The number.
 */
export type Double1 = number | unknown[];
/**
 * The number specified as a reference to another property.
 */
export type Reference2 = string;
/**
 * A floating-point number.
 */
export type Double2 = InterpolatableProperty &
  DeletableProperty &
  DoubleValueProperty &
  ReferenceValueProperty & {
    number?: Double1;
    reference?: Reference2;
    [k: string]: unknown;
  } & (
    | Double2[]
    | {
        number?: Double1;
        reference?: Reference2;
        [k: string]: unknown;
      }
    | number
  );
/**
 * The height reference of the rectangle, which indicates if `height` is relative to terrain or not.
 */
export type HeightReference = DeletableProperty &
  HeightReferenceValueProperty &
  ReferenceValueProperty & {
    heightReference?: HeightReference1;
    reference?: Reference3;
    [k: string]: unknown;
  } & (
    | HeightReference2[]
    | {
        heightReference?: HeightReference1;
        reference?: Reference3;
        [k: string]: unknown;
      }
    | string
  );
/**
 * The height reference.
 */
export type HeightReference1 = ("NONE" | "CLAMP_TO_GROUND" | "RELATIVE_TO_GROUND") & string;
/**
 * The height reference specified as a reference to another property.
 */
export type Reference3 = string;
/**
 * The height reference of an object, which indicates if the object's position is relative to terrain or not.
 */
export type HeightReference2 = DeletableProperty &
  HeightReferenceValueProperty &
  ReferenceValueProperty & {
    heightReference?: HeightReference1;
    reference?: Reference3;
    [k: string]: unknown;
  } & (
    | HeightReference2[]
    | {
        heightReference?: HeightReference1;
        reference?: Reference3;
        [k: string]: unknown;
      }
    | string
  );
/**
 * The extruded height of the rectangle.
 */
export type Double3 = InterpolatableProperty &
  DeletableProperty &
  DoubleValueProperty &
  ReferenceValueProperty & {
    number?: Double1;
    reference?: Reference2;
    [k: string]: unknown;
  } & (
    | Double2[]
    | {
        number?: Double1;
        reference?: Reference2;
        [k: string]: unknown;
      }
    | number
  );
/**
 * The extruded height reference of the rectangle, which indicates if `extrudedHeight` is relative to terrain or not.
 */
export type HeightReference3 = DeletableProperty &
  HeightReferenceValueProperty &
  ReferenceValueProperty & {
    heightReference?: HeightReference1;
    reference?: Reference3;
    [k: string]: unknown;
  } & (
    | HeightReference2[]
    | {
        heightReference?: HeightReference1;
        reference?: Reference3;
        [k: string]: unknown;
      }
    | string
  );
/**
 * The rotation of the rectangle clockwise from north.
 */
export type Double4 = InterpolatableProperty &
  DeletableProperty &
  DoubleValueProperty &
  ReferenceValueProperty & {
    number?: Double1;
    reference?: Reference2;
    [k: string]: unknown;
  } & (
    | Double2[]
    | {
        number?: Double1;
        reference?: Reference2;
        [k: string]: unknown;
      }
    | number
  );
/**
 * The rotation of any applied texture. A positive rotation is counter-clockwise.
 */
export type Double5 = InterpolatableProperty &
  DeletableProperty &
  DoubleValueProperty &
  ReferenceValueProperty & {
    number?: Double1;
    reference?: Reference2;
    [k: string]: unknown;
  } & (
    | Double2[]
    | {
        number?: Double1;
        reference?: Reference2;
        [k: string]: unknown;
      }
    | number
  );
/**
 * The sampling distance, in radians.
 */
export type Double6 = InterpolatableProperty &
  DeletableProperty &
  DoubleValueProperty &
  ReferenceValueProperty & {
    number?: Double1;
    reference?: Reference2;
    [k: string]: unknown;
  } & (
    | Double2[]
    | {
        number?: Double1;
        reference?: Reference2;
        [k: string]: unknown;
      }
    | number
  );
/**
 * Whether or not the rectangle is filled.
 */
export type Boolean3 = DeletableProperty &
  BooleanValueProperty &
  ReferenceValueProperty & {
    boolean?: Boolean1;
    reference?: Reference;
    [k: string]: unknown;
  } & (
    | Boolean2[]
    | {
        boolean?: Boolean1;
        reference?: Reference;
        [k: string]: unknown;
      }
    | boolean
  );
/**
 * The material to display on the surface of the rectangle.
 */
export type Material = {
  solidColor?: SolidColorMaterial;
  image?: ImageMaterial;
  grid?: GridMaterial;
  stripe?: StripeMaterial;
  checkerboard?: CheckerboardMaterial;
  [k: string]: unknown;
} & (
  | Material1[]
  | {
      solidColor?: SolidColorMaterial;
      image?: ImageMaterial;
      grid?: GridMaterial;
      stripe?: StripeMaterial;
      checkerboard?: CheckerboardMaterial;
      [k: string]: unknown;
    }
);
/**
 * A material that fills the surface with a solid color, which may be translucent.
 */
export type SolidColorMaterial = {
  color?: Color;
  [k: string]: unknown;
} & (
  | SolidColorMaterial1[]
  | {
      color?: Color;
      [k: string]: unknown;
    }
);
/**
 * The color of the surface.
 */
export type Color = InterpolatableProperty &
  DeletableProperty &
  RgbaValueProperty &
  RgbafValueProperty &
  ReferenceValueProperty & {
    rgba?: Rgba;
    rgbaf?: Rgbaf;
    reference?: Reference4;
    [k: string]: unknown;
  } & (
    | Color1[]
    | {
        rgba?: Rgba;
        rgbaf?: Rgbaf;
        reference?: Reference4;
        [k: string]: unknown;
      }
  );
/**
 * The color specified as an array of color components `[Red, Green, Blue, Alpha]` where each component is an integer in the range 0-255.
 */
export type Rgba = unknown[];
/**
 * The color specified as an array of color components `[Red, Green, Blue, Alpha]` where each component is a double in the range 0.0-1.0.
 */
export type Rgbaf = unknown[];
/**
 * The color specified as a reference to another property.
 */
export type Reference4 = string;
/**
 * A color. The color can optionally vary over time.
 */
export type Color1 = InterpolatableProperty &
  DeletableProperty &
  RgbaValueProperty &
  RgbafValueProperty &
  ReferenceValueProperty & {
    rgba?: Rgba;
    rgbaf?: Rgbaf;
    reference?: Reference4;
    [k: string]: unknown;
  } & (
    | Color1[]
    | {
        rgba?: Rgba;
        rgbaf?: Rgbaf;
        reference?: Reference4;
        [k: string]: unknown;
      }
  );
/**
 * A material that fills the surface with a solid color.
 */
export type SolidColorMaterial1 = {
  color?: Color;
  [k: string]: unknown;
} & (
  | SolidColorMaterial1[]
  | {
      color?: Color;
      [k: string]: unknown;
    }
);
/**
 * A material that fills the surface with an image.
 */
export type ImageMaterial = {
  image?: Uri;
  repeat?: Repeat;
  color?: Color2;
  transparent?: Boolean4;
  [k: string]: unknown;
} & (
  | ImageMaterial1[]
  | {
      image?: Uri;
      repeat?: Repeat;
      color?: Color2;
      transparent?: Boolean4;
      [k: string]: unknown;
    }
);
/**
 * The image to display on the surface.
 */
export type Uri = DeletableProperty &
  UriValueProperty &
  ReferenceValueProperty & {
    uri?: Uri1;
    reference?: Reference5;
    [k: string]: unknown;
  } & (
    | Uri2[]
    | {
        uri?: Uri1;
        reference?: Reference5;
        [k: string]: unknown;
      }
    | string
  );
/**
 * The URI value.
 */
export type Uri1 = string;
/**
 * The URI specified as a reference to another property.
 */
export type Reference5 = string;
/**
 * A URI value. The URI can optionally vary with time.
 */
export type Uri2 = DeletableProperty &
  UriValueProperty &
  ReferenceValueProperty & {
    uri?: Uri1;
    reference?: Reference5;
    [k: string]: unknown;
  } & (
    | Uri2[]
    | {
        uri?: Uri1;
        reference?: Reference5;
        [k: string]: unknown;
      }
    | string
  );
/**
 * The number of times the image repeats along each axis.
 */
export type Repeat = InterpolatableProperty &
  DeletableProperty &
  Cartesian2ValueProperty &
  ReferenceValueProperty & {
    cartesian2?: Cartesian2;
    reference?: Reference6;
    [k: string]: unknown;
  } & (
    | Repeat1[]
    | {
        cartesian2?: Cartesian2;
        reference?: Reference6;
        [k: string]: unknown;
      }
  );
/**
 * The number of times the image repeats along each axis.
 */
export type Cartesian2 = unknown[];
/**
 * The number of times the image repeats specified as a reference to another property.
 */
export type Reference6 = string;
/**
 * The number of times an image repeats along each axis.
 */
export type Repeat1 = InterpolatableProperty &
  DeletableProperty &
  Cartesian2ValueProperty &
  ReferenceValueProperty & {
    cartesian2?: Cartesian2;
    reference?: Reference6;
    [k: string]: unknown;
  } & (
    | Repeat1[]
    | {
        cartesian2?: Cartesian2;
        reference?: Reference6;
        [k: string]: unknown;
      }
  );
/**
 * The color of the image. This color value is multiplied with the image to produce the final color.
 */
export type Color2 = InterpolatableProperty &
  DeletableProperty &
  RgbaValueProperty &
  RgbafValueProperty &
  ReferenceValueProperty & {
    rgba?: Rgba;
    rgbaf?: Rgbaf;
    reference?: Reference4;
    [k: string]: unknown;
  } & (
    | Color1[]
    | {
        rgba?: Rgba;
        rgbaf?: Rgbaf;
        reference?: Reference4;
        [k: string]: unknown;
      }
  );
/**
 * Whether or not the image has transparency.
 */
export type Boolean4 = DeletableProperty &
  BooleanValueProperty &
  ReferenceValueProperty & {
    boolean?: Boolean1;
    reference?: Reference;
    [k: string]: unknown;
  } & (
    | Boolean2[]
    | {
        boolean?: Boolean1;
        reference?: Reference;
        [k: string]: unknown;
      }
    | boolean
  );
/**
 * A material that fills the surface with an image.
 */
export type ImageMaterial1 = {
  image?: Uri;
  repeat?: Repeat;
  color?: Color2;
  transparent?: Boolean4;
  [k: string]: unknown;
} & (
  | ImageMaterial1[]
  | {
      image?: Uri;
      repeat?: Repeat;
      color?: Color2;
      transparent?: Boolean4;
      [k: string]: unknown;
    }
);
/**
 * A material that fills the surface with a grid.
 */
export type GridMaterial = {
  color?: Color3;
  cellAlpha?: Double7;
  lineCount?: LineCount;
  lineThickness?: LineThickness;
  lineOffset?: LineOffset;
  [k: string]: unknown;
} & (
  | GridMaterial1[]
  | {
      color?: Color3;
      cellAlpha?: Double7;
      lineCount?: LineCount;
      lineThickness?: LineThickness;
      lineOffset?: LineOffset;
      [k: string]: unknown;
    }
);
/**
 * The color of the surface.
 */
export type Color3 = InterpolatableProperty &
  DeletableProperty &
  RgbaValueProperty &
  RgbafValueProperty &
  ReferenceValueProperty & {
    rgba?: Rgba;
    rgbaf?: Rgbaf;
    reference?: Reference4;
    [k: string]: unknown;
  } & (
    | Color1[]
    | {
        rgba?: Rgba;
        rgbaf?: Rgbaf;
        reference?: Reference4;
        [k: string]: unknown;
      }
  );
/**
 * The alpha value for the space between grid lines. This will be combined with the color alpha.
 */
export type Double7 = InterpolatableProperty &
  DeletableProperty &
  DoubleValueProperty &
  ReferenceValueProperty & {
    number?: Double1;
    reference?: Reference2;
    [k: string]: unknown;
  } & (
    | Double2[]
    | {
        number?: Double1;
        reference?: Reference2;
        [k: string]: unknown;
      }
    | number
  );
/**
 * The number of grid lines along each axis.
 */
export type LineCount = InterpolatableProperty &
  DeletableProperty &
  Cartesian2ValueProperty &
  ReferenceValueProperty & {
    cartesian2?: Cartesian21;
    reference?: Reference7;
    [k: string]: unknown;
  } & (
    | LineCount1[]
    | {
        cartesian2?: Cartesian21;
        reference?: Reference7;
        [k: string]: unknown;
      }
  );
/**
 * The number of grid lines along each axis.
 */
export type Cartesian21 = unknown[];
/**
 * The number of grid lines along each axis specified as a reference to another property.
 */
export type Reference7 = string;
/**
 * The number of grid lines along each axis.
 */
export type LineCount1 = InterpolatableProperty &
  DeletableProperty &
  Cartesian2ValueProperty &
  ReferenceValueProperty & {
    cartesian2?: Cartesian21;
    reference?: Reference7;
    [k: string]: unknown;
  } & (
    | LineCount1[]
    | {
        cartesian2?: Cartesian21;
        reference?: Reference7;
        [k: string]: unknown;
      }
  );
/**
 * The thickness of grid lines along each axis, in pixels.
 */
export type LineThickness = InterpolatableProperty &
  DeletableProperty &
  Cartesian2ValueProperty &
  ReferenceValueProperty & {
    cartesian2?: Cartesian22;
    reference?: Reference8;
    [k: string]: unknown;
  } & (
    | LineThickness1[]
    | {
        cartesian2?: Cartesian22;
        reference?: Reference8;
        [k: string]: unknown;
      }
  );
/**
 * The thickness specified as a two-dimensional Cartesian value `[X, Y]`, in pixels.
 */
export type Cartesian22 = unknown[];
/**
 * The thickness specified as a reference to another property.
 */
export type Reference8 = string;
/**
 * The thickness of grid lines along each axis, in pixels.
 */
export type LineThickness1 = InterpolatableProperty &
  DeletableProperty &
  Cartesian2ValueProperty &
  ReferenceValueProperty & {
    cartesian2?: Cartesian22;
    reference?: Reference8;
    [k: string]: unknown;
  } & (
    | LineThickness1[]
    | {
        cartesian2?: Cartesian22;
        reference?: Reference8;
        [k: string]: unknown;
      }
  );
/**
 * The offset of grid lines along each axis, as a percentage from 0 to 1.
 */
export type LineOffset = InterpolatableProperty &
  DeletableProperty &
  Cartesian2ValueProperty &
  ReferenceValueProperty & {
    cartesian2?: Cartesian23;
    reference?: Reference9;
    [k: string]: unknown;
  } & (
    | LineOffset1[]
    | {
        cartesian2?: Cartesian23;
        reference?: Reference9;
        [k: string]: unknown;
      }
  );
/**
 * The offset of grid lines along each axis, specified as a percentage from 0 to 1.
 */
export type Cartesian23 = unknown[];
/**
 * The offset of grid lines along each axis specified as a reference to another property.
 */
export type Reference9 = string;
/**
 * The offset of grid lines along each axis, as a percentage from 0 to 1.
 */
export type LineOffset1 = InterpolatableProperty &
  DeletableProperty &
  Cartesian2ValueProperty &
  ReferenceValueProperty & {
    cartesian2?: Cartesian23;
    reference?: Reference9;
    [k: string]: unknown;
  } & (
    | LineOffset1[]
    | {
        cartesian2?: Cartesian23;
        reference?: Reference9;
        [k: string]: unknown;
      }
  );
/**
 * A material that fills the surface with a two-dimensional grid.
 */
export type GridMaterial1 = {
  color?: Color3;
  cellAlpha?: Double7;
  lineCount?: LineCount;
  lineThickness?: LineThickness;
  lineOffset?: LineOffset;
  [k: string]: unknown;
} & (
  | GridMaterial1[]
  | {
      color?: Color3;
      cellAlpha?: Double7;
      lineCount?: LineCount;
      lineThickness?: LineThickness;
      lineOffset?: LineOffset;
      [k: string]: unknown;
    }
);
/**
 * A material that fills the surface with alternating colors.
 */
export type StripeMaterial = {
  orientation?: StripeOrientation;
  evenColor?: Color4;
  oddColor?: Color5;
  offset?: Double8;
  repeat?: Double9;
  [k: string]: unknown;
} & (
  | StripeMaterial1[]
  | {
      orientation?: StripeOrientation;
      evenColor?: Color4;
      oddColor?: Color5;
      offset?: Double8;
      repeat?: Double9;
      [k: string]: unknown;
    }
);
/**
 * The value indicating if the stripes are horizontal or vertical.
 */
export type StripeOrientation = DeletableProperty &
  StripeOrientationValueProperty &
  ReferenceValueProperty & {
    stripeOrientation?: StripeOrientation1;
    reference?: Reference10;
    [k: string]: unknown;
  } & (
    | StripeOrientation2[]
    | {
        stripeOrientation?: StripeOrientation1;
        reference?: Reference10;
        [k: string]: unknown;
      }
    | string
  );
/**
 * The orientation of stripes in the stripe material.
 */
export type StripeOrientation1 = ("HORIZONTAL" | "VERTICAL") & string;
/**
 * The orientation of stripes specified as a reference to another property.
 */
export type Reference10 = string;
/**
 * The orientation of stripes in a stripe material.
 */
export type StripeOrientation2 = DeletableProperty &
  StripeOrientationValueProperty &
  ReferenceValueProperty & {
    stripeOrientation?: StripeOrientation1;
    reference?: Reference10;
    [k: string]: unknown;
  } & (
    | StripeOrientation2[]
    | {
        stripeOrientation?: StripeOrientation1;
        reference?: Reference10;
        [k: string]: unknown;
      }
    | string
  );
/**
 * The even color.
 */
export type Color4 = InterpolatableProperty &
  DeletableProperty &
  RgbaValueProperty &
  RgbafValueProperty &
  ReferenceValueProperty & {
    rgba?: Rgba;
    rgbaf?: Rgbaf;
    reference?: Reference4;
    [k: string]: unknown;
  } & (
    | Color1[]
    | {
        rgba?: Rgba;
        rgbaf?: Rgbaf;
        reference?: Reference4;
        [k: string]: unknown;
      }
  );
/**
 * The odd color.
 */
export type Color5 = InterpolatableProperty &
  DeletableProperty &
  RgbaValueProperty &
  RgbafValueProperty &
  ReferenceValueProperty & {
    rgba?: Rgba;
    rgbaf?: Rgbaf;
    reference?: Reference4;
    [k: string]: unknown;
  } & (
    | Color1[]
    | {
        rgba?: Rgba;
        rgbaf?: Rgbaf;
        reference?: Reference4;
        [k: string]: unknown;
      }
  );
/**
 * The value indicating where in the pattern to begin drawing, with 0.0 being the beginning of the even color, 1.0 the beginning of the odd color, 2.0 being the even color again, and any multiple or fractional values being in between.
 */
export type Double8 = InterpolatableProperty &
  DeletableProperty &
  DoubleValueProperty &
  ReferenceValueProperty & {
    number?: Double1;
    reference?: Reference2;
    [k: string]: unknown;
  } & (
    | Double2[]
    | {
        number?: Double1;
        reference?: Reference2;
        [k: string]: unknown;
      }
    | number
  );
/**
 * The number of times the stripes repeat.
 */
export type Double9 = InterpolatableProperty &
  DeletableProperty &
  DoubleValueProperty &
  ReferenceValueProperty & {
    number?: Double1;
    reference?: Reference2;
    [k: string]: unknown;
  } & (
    | Double2[]
    | {
        number?: Double1;
        reference?: Reference2;
        [k: string]: unknown;
      }
    | number
  );
/**
 * A material that fills the surface with alternating colors.
 */
export type StripeMaterial1 = {
  orientation?: StripeOrientation;
  evenColor?: Color4;
  oddColor?: Color5;
  offset?: Double8;
  repeat?: Double9;
  [k: string]: unknown;
} & (
  | StripeMaterial1[]
  | {
      orientation?: StripeOrientation;
      evenColor?: Color4;
      oddColor?: Color5;
      offset?: Double8;
      repeat?: Double9;
      [k: string]: unknown;
    }
);
/**
 * A material that fills the surface with a checkerboard pattern.
 */
export type CheckerboardMaterial = {
  evenColor?: Color6;
  oddColor?: Color7;
  repeat?: Repeat2;
  [k: string]: unknown;
} & (
  | CheckerboardMaterial1[]
  | {
      evenColor?: Color6;
      oddColor?: Color7;
      repeat?: Repeat2;
      [k: string]: unknown;
    }
);
/**
 * The even color.
 */
export type Color6 = InterpolatableProperty &
  DeletableProperty &
  RgbaValueProperty &
  RgbafValueProperty &
  ReferenceValueProperty & {
    rgba?: Rgba;
    rgbaf?: Rgbaf;
    reference?: Reference4;
    [k: string]: unknown;
  } & (
    | Color1[]
    | {
        rgba?: Rgba;
        rgbaf?: Rgbaf;
        reference?: Reference4;
        [k: string]: unknown;
      }
  );
/**
 * The odd color.
 */
export type Color7 = InterpolatableProperty &
  DeletableProperty &
  RgbaValueProperty &
  RgbafValueProperty &
  ReferenceValueProperty & {
    rgba?: Rgba;
    rgbaf?: Rgbaf;
    reference?: Reference4;
    [k: string]: unknown;
  } & (
    | Color1[]
    | {
        rgba?: Rgba;
        rgbaf?: Rgbaf;
        reference?: Reference4;
        [k: string]: unknown;
      }
  );
/**
 * The number of times the tiles repeat along each axis.
 */
export type Repeat2 = InterpolatableProperty &
  DeletableProperty &
  Cartesian2ValueProperty &
  ReferenceValueProperty & {
    cartesian2?: Cartesian2;
    reference?: Reference6;
    [k: string]: unknown;
  } & (
    | Repeat1[]
    | {
        cartesian2?: Cartesian2;
        reference?: Reference6;
        [k: string]: unknown;
      }
  );
/**
 * A material that fills the surface with a checkerboard pattern.
 */
export type CheckerboardMaterial1 = {
  evenColor?: Color6;
  oddColor?: Color7;
  repeat?: Repeat2;
  [k: string]: unknown;
} & (
  | CheckerboardMaterial1[]
  | {
      evenColor?: Color6;
      oddColor?: Color7;
      repeat?: Repeat2;
      [k: string]: unknown;
    }
);
/**
 * A definition of how a surface is colored or shaded.
 */
export type Material1 = {
  solidColor?: SolidColorMaterial;
  image?: ImageMaterial;
  grid?: GridMaterial;
  stripe?: StripeMaterial;
  checkerboard?: CheckerboardMaterial;
  [k: string]: unknown;
} & (
  | Material1[]
  | {
      solidColor?: SolidColorMaterial;
      image?: ImageMaterial;
      grid?: GridMaterial;
      stripe?: StripeMaterial;
      checkerboard?: CheckerboardMaterial;
      [k: string]: unknown;
    }
);
/**
 * Whether or not the rectangle is outlined.
 */
export type Boolean5 = DeletableProperty &
  BooleanValueProperty &
  ReferenceValueProperty & {
    boolean?: Boolean1;
    reference?: Reference;
    [k: string]: unknown;
  } & (
    | Boolean2[]
    | {
        boolean?: Boolean1;
        reference?: Reference;
        [k: string]: unknown;
      }
    | boolean
  );
/**
 * The color of the rectangle outline.
 */
export type Color8 = InterpolatableProperty &
  DeletableProperty &
  RgbaValueProperty &
  RgbafValueProperty &
  ReferenceValueProperty & {
    rgba?: Rgba;
    rgbaf?: Rgbaf;
    reference?: Reference4;
    [k: string]: unknown;
  } & (
    | Color1[]
    | {
        rgba?: Rgba;
        rgbaf?: Rgbaf;
        reference?: Reference4;
        [k: string]: unknown;
      }
  );
/**
 * The width of the rectangle outline.
 */
export type Double10 = InterpolatableProperty &
  DeletableProperty &
  DoubleValueProperty &
  ReferenceValueProperty & {
    number?: Double1;
    reference?: Reference2;
    [k: string]: unknown;
  } & (
    | Double2[]
    | {
        number?: Double1;
        reference?: Reference2;
        [k: string]: unknown;
      }
    | number
  );
/**
 * Whether or not the rectangle casts or receives shadows.
 */
export type ShadowMode = DeletableProperty &
  ShadowModeValueProperty &
  ReferenceValueProperty & {
    shadowMode?: ShadowMode1;
    reference?: Reference11;
    [k: string]: unknown;
  } & (
    | ShadowMode2[]
    | {
        shadowMode?: ShadowMode1;
        reference?: Reference11;
        [k: string]: unknown;
      }
    | string
  );
/**
 * The shadow mode.
 */
export type ShadowMode1 = ("DISABLED" | "ENABLED" | "CAST_ONLY" | "RECEIVE_ONLY") & string;
/**
 * The shadow mode specified as a reference to another property.
 */
export type Reference11 = string;
/**
 * Whether or not an object casts or receives shadows from each light source when shadows are enabled.
 */
export type ShadowMode2 = DeletableProperty &
  ShadowModeValueProperty &
  ReferenceValueProperty & {
    shadowMode?: ShadowMode1;
    reference?: Reference11;
    [k: string]: unknown;
  } & (
    | ShadowMode2[]
    | {
        shadowMode?: ShadowMode1;
        reference?: Reference11;
        [k: string]: unknown;
      }
    | string
  );
/**
 * The display condition specifying at what distance from the camera this rectangle will be displayed.
 */
export type DistanceDisplayCondition = InterpolatableProperty &
  DeletableProperty &
  DistanceDisplayConditionValueProperty &
  ReferenceValueProperty & {
    distanceDisplayCondition?: DistanceDisplayCondition1;
    reference?: Reference12;
    [k: string]: unknown;
  } & (
    | DistanceDisplayCondition2[]
    | {
        distanceDisplayCondition?: DistanceDisplayCondition1;
        reference?: Reference12;
        [k: string]: unknown;
      }
  );
/**
 * The value specified as two values `[NearDistance, FarDistance]`, with distances in meters.
 */
export type DistanceDisplayCondition1 = unknown[];
/**
 * The value specified as a reference to another property.
 */
export type Reference12 = string;
/**
 * Indicates the visibility of an object based on the distance to the camera.
 */
export type DistanceDisplayCondition2 = InterpolatableProperty &
  DeletableProperty &
  DistanceDisplayConditionValueProperty &
  ReferenceValueProperty & {
    distanceDisplayCondition?: DistanceDisplayCondition1;
    reference?: Reference12;
    [k: string]: unknown;
  } & (
    | DistanceDisplayCondition2[]
    | {
        distanceDisplayCondition?: DistanceDisplayCondition1;
        reference?: Reference12;
        [k: string]: unknown;
      }
  );
/**
 * Whether a classification affects terrain, 3D Tiles, or both.
 */
export type ClassificationType = DeletableProperty &
  ClassificationTypeValueProperty &
  ReferenceValueProperty & {
    classificationType?: ClassificationType1;
    reference?: Reference13;
    [k: string]: unknown;
  } & (
    | ClassificationType2[]
    | {
        classificationType?: ClassificationType1;
        reference?: Reference13;
        [k: string]: unknown;
      }
    | string
  );
/**
 * The classification type, which indicates whether a classification affects terrain, 3D Tiles, or both.
 */
export type ClassificationType1 = ("TERRAIN" | "CESIUM_3D_TILE" | "BOTH") & string;
/**
 * The classification type specified as a reference to another property.
 */
export type Reference13 = string;
/**
 * Whether a classification affects terrain, 3D Tiles, or both.
 */
export type ClassificationType2 = DeletableProperty &
  ClassificationTypeValueProperty &
  ReferenceValueProperty & {
    classificationType?: ClassificationType1;
    reference?: Reference13;
    [k: string]: unknown;
  } & (
    | ClassificationType2[]
    | {
        classificationType?: ClassificationType1;
        reference?: Reference13;
        [k: string]: unknown;
      }
    | string
  );
/**
 * The z-index of the rectangle, used for ordering ground geometry. Only has an effect if the rectangle is constant, and `height` and `extrudedHeight` are not specified.
 */
export type Integer = InterpolatableProperty &
  DeletableProperty &
  IntegerValueProperty &
  ReferenceValueProperty & {
    number?: Integer1;
    reference?: Reference14;
    [k: string]: unknown;
  } & (
    | Integer2[]
    | {
        number?: Integer1;
        reference?: Reference14;
        [k: string]: unknown;
      }
    | number
  );
/**
 * The integer.
 */
export type Integer1 = number | unknown[];
/**
 * The integer specified as a reference to another property.
 */
export type Reference14 = string;
/**
 * An integer number.
 */
export type Integer2 = InterpolatableProperty &
  DeletableProperty &
  IntegerValueProperty &
  ReferenceValueProperty & {
    number?: Integer1;
    reference?: Reference14;
    [k: string]: unknown;
  } & (
    | Integer2[]
    | {
        number?: Integer1;
        reference?: Reference14;
        [k: string]: unknown;
      }
    | number
  );

/**
 * A cartographic rectangle, which conforms to the curvature of the globe and can be placed on the surface or at altitude and can optionally be extruded into a volume.
 */
export interface Rectangle {
  show?: Boolean;
  coordinates?: RectangleCoordinates;
  height?: Double;
  heightReference?: HeightReference;
  extrudedHeight?: Double3;
  extrudedHeightReference?: HeightReference3;
  rotation?: Double4;
  stRotation?: Double5;
  granularity?: Double6;
  fill?: Boolean3;
  material?: Material;
  outline?: Boolean5;
  outlineColor?: Color8;
  outlineWidth?: Double10;
  shadows?: ShadowMode;
  distanceDisplayCondition?: DistanceDisplayCondition;
  classificationType?: ClassificationType;
  zIndex?: Integer;
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be deleted.
 */
export interface DeletableProperty {
  /**
   * Whether the client should delete existing samples or interval data for this property. Data will be deleted for the containing interval, or if there is no containing interval, then all data. If true, all other properties in this property will be ignored.
   */
  delete?: boolean;
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be written as a boolean.
 */
export interface BooleanValueProperty {
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be written as a reference to another property.
 */
export interface ReferenceValueProperty {
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be determined by interpolating over provided time-tagged samples.
 */
export interface InterpolatableProperty {
  /**
   * The epoch to use for times specified as seconds since an epoch.
   */
  epoch?: string;
  /**
   * The interpolation algorithm to use when interpolating. Valid values are "LINEAR", "LAGRANGE", and "HERMITE".
   */
  interpolationAlgorithm?: string;
  /**
   * The degree of interpolation to use when interpolating.
   */
  interpolationDegree?: number;
  /**
   * The type of extrapolation to perform when a value is requested at a time after any available samples. Valid values are "NONE", "HOLD", and "EXTRAPOLATE".
   */
  forwardExtrapolationType?: string;
  /**
   * The amount of time to extrapolate forward before the property becomes undefined. A value of 0 will extrapolate forever.
   */
  forwardExtrapolationDuration?: number;
  /**
   * The type of extrapolation to perform when a value is requested at a time before any available samples. Valid values are "NONE", "HOLD", and "EXTRAPOLATE".
   */
  backwardExtrapolationType?: string;
  /**
   * The amount of time to extrapolate backward before the property becomes undefined. A value of 0 will extrapolate forever.
   */
  backwardExtrapolationDuration?: number;
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be written as a two-dimensional region specified as `[WestLongitude, SouthLatitude, EastLongitude, NorthLatitude]`, with values in radians.
 */
export interface CartographicRectangleRadiansValueProperty {
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be written as a two-dimensional region specified as `[WestLongitude, SouthLatitude, EastLongitude, NorthLatitude]`, with values in degrees.
 */
export interface CartographicRectangleDegreesValueProperty {
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be written as a floating-point number.
 */
export interface DoubleValueProperty {
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be written as a height reference.
 */
export interface HeightReferenceValueProperty {
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be written as an array of color components `[Red, Green, Blue, Alpha]` where each component is in the range 0-255.
 */
export interface RgbaValueProperty {
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be written as an array of color components `[Red, Green, Blue, Alpha]` where each component is in the range 0.0-1.0.
 */
export interface RgbafValueProperty {
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be written as a URI.
 */
export interface UriValueProperty {
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be written as a two-dimensional Cartesian.
 */
export interface Cartesian2ValueProperty {
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be written as a stripe orientation.
 */
export interface StripeOrientationValueProperty {
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be written as a shadow mode.
 */
export interface ShadowModeValueProperty {
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be written as two values `[NearDistance, FarDistance]`.
 */
export interface DistanceDisplayConditionValueProperty {
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be written as a classification type.
 */
export interface ClassificationTypeValueProperty {
  [k: string]: unknown;
}
/**
 * The base schema for a property whose value may be written as an integer.
 */
export interface IntegerValueProperty {
  [k: string]: unknown;
}
