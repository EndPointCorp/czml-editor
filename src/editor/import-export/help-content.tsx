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
</div>

export default HelpContent;