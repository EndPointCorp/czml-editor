import { Entity } from "cesium";

export type StyleChanges = {
    entityId: string;
    style: {
        [key: string]: any
    }
}

export const ChangesTrackerInstance: StyleChanges = {
    entityId: "",
    style: {}
}


export function trackChange(entity: Entity, propPath: string, val: any) {
    const changes = ChangesTrackerInstance;
    if (changes.entityId !== entity.id) {
        changes.entityId = entity.id;
        changes.style = {};
    }

    changes.style = {
        ...changes.style,
        [propPath]: val
    };
}

export function makeChangesSnapshot() {
    const changes = ChangesTrackerInstance;
    const style = Object.fromEntries(
        Object.entries(changes.style)
            .map(([key, val]) => [key, clone(val)])
    );

    return {
        ...changes,
        style
    } as StyleChanges;
}

type StylesT = {
    [key: string]: any
}
export function applyStyleToEntity(entities: Entity[], styles: StylesT) {

    console.log('Apply styles', styles);

    Object.entries(styles).forEach(([propPath, val]) => {
        const [featureName, propName] = propPath.split('.');
        for (const entity of entities) {
            const feature = (entity as any)[featureName];

            if (feature) {
                const prop = (feature as any)[propName];

                if (prop) {
                    prop.isConstant && prop.setValue && prop.setValue(val);
                }
                else {
                    // Want cesium to figure out concrete class of property
                    feature[propName] = val;
                }
            }
        }
    });
}

function clone(val: any) {
    if (!val) {
        return val;
    }

    // Most of the cesium property value objects should have clone method
    if (val['clone'] && typeof val['clone'] === 'function') {
       return val.clone();
    }

    if (Array.isArray(val)) {
        return [...val];
    }

    return val;
}
