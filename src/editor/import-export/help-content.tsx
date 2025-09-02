const HelpContent = () => 
<div class="help-content">
    <h3>Cesium CZML KML visual editor</h3>

    <h4>About</h4>
    <p>
        This is WYSIWYG editor helping to create and edit CZML and KML documents.
    </p>

    <h4>Basic functionality</h4>
    <p>
        Use <button class="size-s">Open</button> button to open KML KMZ CZML or GeoJSON file or 
        create new <i>Entities</i> using "Create Entities" panel.
        You can open multiple files. Mixing and matching different sources and manually created <i>Entities</i>.
    </p>
    <p>
        You can change various properties to adjust 
        visual appearance of different features.
    </p>
    <p>
        Export <i>Entities</i> as KML KMZ or CZML document.
    </p>

    <h4>Terminology</h4>
    <p>
        There are some conceptual differences between Cesium <i>CZML</i> and <i>KML</i>.
        <i>KML</i> describes <b>visual objects</b> first, 
        geographical objects are implied via data associated with visual objects.
    </p>
    <p>
        Cesium <i>CZML</i> describes <i>Entities</i> and its data first, 
        and defines various visual <i>Features</i> attached to it.
    </p>
    <p>
        Most noticeable difference that every <i>Entity</i> in Cesium might have multiple
        visual <i>Features</i>. E.g. Polygon, Label, Billboard and a Point at the same time.
    </p>
    <p>
        None the less for now the editor UI works mostly as Entities represents a single
        type visual <i>Feature</i>.
    </p>

    <h4>Time-sampled properties and animations</h4>
    <p>
        CZML supports time interpolated values for properties, for instance you can animate object position.
        Current version doesn't have UI to support editing "animated" properties, but it still should be
        possible to edit constant properties and re-export entities with animated properties.
    </p>

    <h4>Old version</h4>
    <p>
        This is a new version written with preact, vite and modern version of Cesiumjs.
        You can use previous version at <a>http://visionport.com/old-czml-kml-editor</a>
    </p>
</div>

export default HelpContent;