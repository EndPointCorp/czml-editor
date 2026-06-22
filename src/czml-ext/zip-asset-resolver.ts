export function normalizeZipPath(...parts: string[]): string {
    const combined = parts.join('/').replace(/\\/g, '/');
    const segments = combined.split('/');
    const result: string[] = [];
    for (const seg of segments) {
        if (seg === '..') {
            result.pop();
        } else if (seg && seg !== '.') {
            result.push(seg);
        }
    }
    return result.join('/');
}

export function resolveZipPath(baseFile: string, relativeUri: string): string {
    const baseDir = baseFile.includes('/')
        ? baseFile.substring(0, baseFile.lastIndexOf('/'))
        : '';
    return normalizeZipPath(baseDir, relativeUri);
}

export function lookupZipEntry(path: string, entriesMap: Map<string, string>): string | undefined {
    const normalized = normalizeZipPath(path);
    if (entriesMap.has(normalized)) {
        return entriesMap.get(normalized);
    }

    for (const [entryPath, blobUrl] of entriesMap) {
        if (entryPath === normalized || entryPath.endsWith('/' + normalized)) {
            return blobUrl;
        }
    }

    const basename = normalized.split('/').pop();
    if (basename && entriesMap.has(basename)) {
        return entriesMap.get(basename);
    }

    return undefined;
}

export function lookupZipAsset(
    url: string,
    documentPath: string,
    entriesMap: Map<string, string>,
): string | undefined {
    if (entriesMap.has(url)) {
        return entriesMap.get(url);
    }

    const fromDocument = resolveZipPath(documentPath, url);
    const fromDocumentMatch = lookupZipEntry(fromDocument, entriesMap);
    if (fromDocumentMatch) {
        return fromDocumentMatch;
    }

    if (/^blob:/.test(url)) {
        const blobPath = url.replace(/^blob:[^/]*\/?/i, '');
        return lookupZipEntry(blobPath, entriesMap)
            ?? lookupZipEntry(blobPath.split('/').pop() ?? blobPath, entriesMap);
    }

    try {
        const parsed = new URL(url, 'http://czml.local/');
        const pathname = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
        return lookupZipEntry(pathname, entriesMap);
    } catch {
        return lookupZipEntry(url, entriesMap);
    }
}

export function rewriteTilesetUris(
    node: unknown,
    baseFile: string,
    entriesMap: Map<string, string>,
) {
    if (!node || typeof node !== 'object') {
        return;
    }
    if (Array.isArray(node)) {
        node.forEach(item => rewriteTilesetUris(item, baseFile, entriesMap));
        return;
    }
    for (const [key, val] of Object.entries(node)) {
        if (key === 'uri' && typeof val === 'string' && !/^https?:|^blob:|^data:/i.test(val)) {
            const resolved = resolveZipPath(baseFile, val);
            const blobUrl = lookupZipEntry(resolved, entriesMap);
            if (blobUrl) {
                (node as Record<string, unknown>)[key] = blobUrl;
            }
        } else if (val && typeof val === 'object') {
            rewriteTilesetUris(val, baseFile, entriesMap);
        }
    }
}

export async function rewriteTilesetEntries(entriesMap: Map<string, string>) {
    for (const [filename, blobUrl] of [...entriesMap.entries()]) {
        if (!/tileset\.json$/i.test(filename)) {
            continue;
        }

        const response = await fetch(blobUrl);
        const json = await response.json();
        rewriteTilesetUris(json, filename, entriesMap);

        URL.revokeObjectURL(blobUrl);
        const newBlob = new Blob([JSON.stringify(json)], { type: 'application/json' });
        entriesMap.set(filename, URL.createObjectURL(newBlob));
    }
}
