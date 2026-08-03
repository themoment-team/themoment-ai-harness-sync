import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";

const layerOrder = ["shared", "entities", "features", "widgets", "views", "app"];
const layerRank = new Map(layerOrder.map((layer, index) => [layer, index]));
const sourceExtensions = new Set([".ts", ".tsx"]);
const imports =
    /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

async function sourceFiles(path) {
    const entries = await readdir(path, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(async (entry) => {
            const entryPath = resolve(path, entry.name);
            if (entry.isDirectory()) return sourceFiles(entryPath);
            return sourceExtensions.has(extname(entry.name)) ? [entryPath] : [];
        }),
    );
    return files.flat();
}

function sliceInfo(sourceRoot, path) {
    const parts = relative(sourceRoot, path).split(sep);
    const [layer, slice] = parts;
    return layerRank.has(layer) ? { layer, slice } : null;
}

function importedPath(sourceRoot, file, specifier) {
    if (specifier.startsWith("@/")) return resolve(sourceRoot, specifier.slice(2));
    if (specifier.startsWith(".")) return resolve(dirname(file), specifier);
    return null;
}

async function checkSourceRoot(sourceRoot) {
    const violations = [];
    for (const file of await sourceFiles(sourceRoot)) {
        const source = sliceInfo(sourceRoot, file);
        if (!source) continue;

        const content = await readFile(file, "utf8");
        for (const match of content.matchAll(imports)) {
            const target = importedPath(sourceRoot, file, match[1] ?? match[2]);
            const targetInfo = target && sliceInfo(sourceRoot, target);
            if (!targetInfo) continue;

            if (layerRank.get(targetInfo.layer) > layerRank.get(source.layer)) {
                violations.push(`${relative(sourceRoot, file)}: ${source.layer} cannot import ${targetInfo.layer}`);
            }

            const isBusinessLayer = !["app", "shared"].includes(source.layer);
            if (isBusinessLayer && source.layer === targetInfo.layer && source.slice !== targetInfo.slice) {
                violations.push(`${relative(sourceRoot, file)}: ${source.layer} slices cannot import each other`);
            }
        }
    }
    return violations;
}

const sourceRoot = resolve(process.argv[2] ?? "src");
if (!existsSync(sourceRoot)) {
    console.error(`Source root not found: ${sourceRoot}`);
    process.exitCode = 1;
} else {
    const violations = await checkSourceRoot(sourceRoot);
    if (violations.length) {
        console.error(violations.join("\n"));
        process.exitCode = 1;
    }
}
