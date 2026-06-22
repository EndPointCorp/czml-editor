import { CzmlDataSource, Entity, Resource } from "cesium";
import { lookupZipAsset, rewriteTilesetEntries } from "./zip-asset-resolver";
import { registerTilesetsFromArchive, revokeZipArchive, unpackZipArchive, ZipArchive } from "./tileset-zip";

export class CzmlDataSourceExtension extends CzmlDataSource {
    static __load = CzmlDataSource.load;

    __czml_extended: boolean = true;
    __archive?: ZipArchive;

    destroy: () => void = () => {};

    static registerTilesetSources(dataSource: unknown, entities: Entity[]) {
        if (dataSource instanceof CzmlDataSourceExtension && dataSource.__archive) {
            registerTilesetsFromArchive(entities, dataSource.__archive);
        }
    }

    static load: typeof CzmlDataSource.load = async function (czml: Resource | Blob | string | any, options?: CzmlDataSource.LoadOptions) {
        
        if (CzmlDataSourceExtension.iszip(czml)) {
            const file = await fetchBlob(czml);
            if (file) {
                const archive = await unpackZipArchive(file);
                const entriesMap = archive.blobUrls;

                await rewriteTilesetEntries(entriesMap);
                    
                const documentEntry = [...entriesMap.keys()].find(name => /\.czml$/i.test(name));
                if (documentEntry) {
                    const documentBlobUrl = entriesMap.get(documentEntry);

                    if (documentBlobUrl) {
                        const documentPath = documentEntry;
                        const promise = CzmlDataSourceExtension.__load(new Resource({
                            url: documentBlobUrl,
                            proxy: {
                                getURL: url => {
                                    const resolved = lookupZipAsset(url, documentPath, entriesMap);
                                    if (resolved) {
                                        return resolved;
                                    }
                                    console.warn('Url not found inside czmz', url);
                                    return url;
                                }
                            }
                        }), options);

                        promise.then(ds => {
                            const ext = ds as CzmlDataSourceExtension;
                            ext.__czml_extended = true;
                            ext.__archive = archive;
                            
                            ext.destroy = () => {
                                revokeZipArchive(archive);
                            }
                        });

                        return promise;
                    }
                }

                revokeZipArchive(archive);
            }
        }

        return CzmlDataSourceExtension.__load(czml, options);
    }

    static iszip(src: Resource | Blob | string | any) {

        if (typeof src === 'string') {
            return /\.(czmz|zip)&/.test(new URL(src).pathname) 
        }

        if (src instanceof Blob) {
            return src.type.match(/zip/i);
        }

        if (src instanceof Resource) {
            if (src.isDataUri) {
                const url  = src.url;
                const mime = url.substring(url.indexOf(":") + 1, url.indexOf(";"));
                return mime.indexOf('zip') >= 0;
            }
            
            if (src.isBlobUri) {
                return true;
            }
        }

        return false;
    }
}

async function fetchBlob(czml: Resource | Blob | string | any) {
    if (czml instanceof Blob) {
        return czml;
    }

    const resource = new Resource(czml);
    return await resource.fetchBlob();
}
