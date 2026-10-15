import { CzmlDataSource, Entity, GeoJsonDataSource, KmlDataSource } from "cesium";

import { Section } from "../../misc/elements/section";
import { useEffect, useState } from "preact/hooks";

const cmsApiPath = import.meta.env.VITE_CMS_API_PATH;
const scenePath = cmsApiPath && `${cmsApiPath.replace(/\/+$/, '')}/scene`;

type SxaxDataT = {
    id: number;
    name: string;
    original_filename: string;
    location: string;
}

export type CesiumDataSource = CzmlDataSource | KmlDataSource | GeoJsonDataSource;

export type CmsSceneSectionProps = {
}
export function CmsSceneSection({ }: CmsSceneSectionProps) {

    const [scene, setScene] = useState<any>();
    const [error, setError] = useState<string>();

    const assets: SxaxDataT[] = scene && scene.sxas
            .map (({id , name, original_filename, location}: SxaxDataT) => 
                ({id, name, original_filename, location}))
            .filter (({original_filename}: SxaxDataT) => original_filename);

    useEffect(() => {
        if (!cmsApiPath) {
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const cmsSceneId = params.get('cms-scene');

        if (!cmsSceneId) {
            return;
        }

        var canceled = false;
        const sceneUrl = `${scenePath}/${cmsSceneId}/`;

        (async () => {
            const response = await fetch(sceneUrl, {
                // headers: {
                //     'Authorization': 'Basic ' + btoa("dmitry:dmitry")
                // }
            });

            if (response.ok) {
                const json = await response.json();
                if (!canceled) {
                    setScene(json);
                }
            }
            else {
                setError(response.statusText);
            }
        })();

        return () => canceled = true;

    }, [cmsApiPath, setScene]);

    return (
        <Section header={'Cms Scene'} className={'cms-section'}>
            {error && <b style={{color: 'red'}}>{error}</b>}
            {scene && <h3>{scene.name}</h3>}
            { assets && assets.map(a => <div key={a.id}>{a.name}</div>) }
        </Section>
    );
}
