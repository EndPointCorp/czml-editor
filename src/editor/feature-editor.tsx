import { Entity } from "cesium";
import { PropertyField } from "./fields/property-fld";
import cls from "../misc/cls";
import { Tabs } from "../misc/tabs";
import { FeatureMetaData } from "./meta/meta";

export type FeatureEditorProps = {
    entity: Entity | null;
    onChange?: (val: any, property?: string) => any;
    metadata: FeatureMetaData;
}
export function FeatureEditor({entity, metadata}: FeatureEditorProps) {

    const subj = (entity as any)[metadata.feature];

    console.log(metadata.feature, subj);

    const titles = metadata.propertyGroups.map(pg => pg.title);

    const propGroups = subj && metadata.propertyGroups.map(pg => {
        return <>
            {pg.properties.map(prop => 
                <PropertyField subject={subj} 
                    key={`${entity?.id}.${prop.name}`} 
                    property={prop} />)}
        </>
    });

    return (
        <div class={cls('feature-editor', `${metadata.feature}-editor`)}>
            {propGroups && 
                <Tabs tabNames={titles} children={propGroups} />}
        </div>
    );

}