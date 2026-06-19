import * as zip from "@zip.js/zip.js"
import { CzmlDataSource, Resource } from "cesium";
import { lookupZipAsset, rewriteTilesetEntries } from "./zip-asset-resolver";

export class CzmlDataSourceExtension extends CzmlDataSource {
    static __load = CzmlDataSource.load;

    static load: typeof CzmlDataSource.load = async function (czml: Resource | Blob | string | any, options?: CzmlDataSource.LoadOptions) {
        
        if (CzmlDataSourceExtension.iszip(czml)) {
            const file = await fetchBlob(czml);
            if (file) {
                const reader = new zip.ZipReader(new zip.BlobReader(file));
                const entries = await reader.getEntries();

                const entriesMap = new Map<string, string>();

                for (let entry of entries) {
                    const blob = await entry?.getData?.(new zip.BlobWriter());
                    if (blob) {
                        const blobURL = URL.createObjectURL(blob);
    
                        entriesMap.set(entry.filename, blobURL);
                    }
                }

                await rewriteTilesetEntries(entriesMap);
                    
                const documentEntry = entries.find(e => /\.czml$/i.test(e.filename));
                if (documentEntry) {
                    const documentBlobUrl = entriesMap.get(documentEntry?.filename);

                    if (documentBlobUrl) {
                        const documentPath = documentEntry.filename;
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
                            (ds as CzmlDataSourceExtension).__czml_extended = true;
                            
                            // See: DataSourceCollection.prototype.remove 
                            (ds as CzmlDataSourceExtension).destroy = () => {
                                for (let blobUrl of entriesMap.values()) {
                                    URL.revokeObjectURL(blobUrl);
                                }
                            }
                        });

                        return promise;
                    }
                }
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
                // Have to use async to check that properly
                return true;
            }
        }

        return false;
    }

    __czml_extended: boolean = true;

    destroy: () => void = () => {};
}

async function fetchBlob(czml: Resource | Blob | string | any) {
    if (czml instanceof Blob) {
        return czml;
    }

    const resource = new Resource(czml);
    return await resource.fetchBlob();
}

