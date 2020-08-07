import path from "path";
import fs from "fs";
import fse from "fs-extra";

function extractCfgMapDir(sourceDir: string, targetDir: string) {
    let dir: fs.Dir;
    try {
        dir = fs.opendirSync(sourceDir);
        let item: fs.Dirent;
        while ((item = dir.readSync())) {
            if (!item.isFile()) {
                continue;
            }
            if (
                path
                    .extname(item.name)
                    .toLowerCase()
                    .trim() !== ".json"
            ) {
                continue;
            }
            extractCfgMapJsonFile(targetDir, path.join(sourceDir, item.name));
        }
    } finally {
        if (dir) {
            dir.closeSync();
        }
    }
}

function extractCfgMapJsonFile(targetDir: string, filePath: string) {
    const data = fse.readJSONSync(filePath);
    const pathLists = Object.keys(data);
    pathLists.forEach(p => {
        const filePath = path.join(targetDir, p);
        const baseDir = path.dirname(filePath);
        fse.mkdirSync(baseDir, {
            recursive: true
        });
        fse.writeFileSync(filePath, data[p], {
            encoding: "utf8"
        });
    });
}

export default function main() {
    // default configMap json file directory
    // we will restore directory structure from each of json files in this dir first
    // this env var is compulsory. Error will be thrown if cannot find
    const defaultCfgMapDir = process.env["DEFAULT_CFG_MAP_DIR"];

    // extra configMap json file directory
    // we will restore directory structure from each of json files in this dir after `defaultCfgMapDir` is processed
    // Thus, content from `extraCfgMapDir` may overwrite the content from `defaultCfgMapDir`
    // this env var is optional.
    const extraCfgMapDir = process.env["EXTRA_CFG_MAP_DIR"];

    // Where decoded files from either `defaultCfgMapDir` or `extraCfgMapDir` are saved to
    // this env var is compulsory. Error will be thrown if cannot find
    const targetDir = process.env["TARGET_DIR"];

    try {
        if (!defaultCfgMapDir || !fse.existsSync(defaultCfgMapDir)) {
            throw new Error(
                `ENV variable 'DEFAULT_CFG_MAP_DIR' doesn't exist or '${defaultCfgMapDir}' is not a valid path.`
            );
        }

        if (!targetDir) {
            throw new Error(`ENV variable 'TARGET_DIR' doesn't exist`);
        }

        if (!fse.existsSync(targetDir)) {
            fse.mkdirSync(targetDir, {
                recursive: true
            });
        }

        extractCfgMapDir(defaultCfgMapDir, targetDir);

        if (fse.existsSync(extraCfgMapDir)) {
            extractCfgMapDir(extraCfgMapDir, targetDir);
        }
    } catch (e) {
        console.error(`Error: ${e}`);
        process.exit(-1);
    }
}
