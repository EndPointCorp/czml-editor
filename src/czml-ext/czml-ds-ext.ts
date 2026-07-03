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
        
        if (await CzmlDataSourceExtension.iszip(czml)) {
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

    static async iszip(src: Resource | Blob | string | any): Promise<boolean> {
        if (typeof src === 'string') {
            return ZIP_EXT_RE.test(pathnameOf(src));
        }

        if (src instanceof Blob) {
            if (src.type && /zip/i.test(src.type)) {
                return true;
            }
            return await isZipBlob(src);
        }

        if (src instanceof Resource) {
            if (src.isDataUri) {
                const url = src.url;
                const mime = url.substring(url.indexOf(":") + 1, url.indexOf(";"));
                return mime.indexOf('zip') >= 0;
            }

            if (src.isBlobUri) {
                const blob = await src.fetchBlob();
                return blob ? await isZipBlob(blob) : false;
            }

            return ZIP_EXT_RE.test(pathnameOf(src.url));
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

const ZIP_EXT_RE = /\.(czmz|zip)$/i;

function pathnameOf(url: string): string {
    try {
        return new URL(url, window.location.href).pathname;
    } catch {
        return url;
    }
}

async function isZipBlob(blob: Blob): Promise<boolean> {
    try {
        const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
        // ZIP local-file-header magic: PK\x03\x04, empty-archive: PK\x05\x06, spanned: PK\x07\x08
        return head[0] === 0x50 && head[1] === 0x4b
            && (head[2] === 0x03 || head[2] === 0x05 || head[2] === 0x07)
            && (head[3] === 0x04 || head[3] === 0x06 || head[3] === 0x08);
    } catch {
        return false;
    }
}
