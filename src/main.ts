import path from "path";
import fs from "fs";
import fse from "fs-extra";
import { execSync } from "child_process";

const isDebugMode = process.env["DEBUG"] === "true" ? true : false;

function extractCfgMapDir(sourceDir: string, targetDir: string) {
    if (isDebugMode) {
        console.log(`Decoding files in ${sourceDir}...`);
    }
    const dirItems = fs.readdirSync(sourceDir, { encoding: "utf8" });
    dirItems.forEach(dirItem => {
        const itemPath = path.join(sourceDir, dirItem);
        const isJsonFile =
            path
                .extname(dirItem)
                .toLowerCase()
                .trim() === ".json";

        if (!isJsonFile) {
            return;
        }
        // we won't check whether the dirItem is a directory here as configMap file comes with 0444 permission
        // any attempt to query whther it is file or directory will always return false instead
        extractCfgMapJsonFile(targetDir, itemPath);
    });
}

function extractCfgMapJsonFile(targetDir: string, filePath: string) {
    if (isDebugMode) {
        console.log(
            `Decoding configMap data file: ${filePath} to ${targetDir}`
        );
    }

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

        if (isDebugMode) {
            console.log("List target dir before decode files: ");
            console.log(execSync(`ls ${targetDir}`, { encoding: "utf8" }));
        }

        extractCfgMapDir(defaultCfgMapDir, targetDir);

        if (fse.existsSync(extraCfgMapDir)) {
            extractCfgMapDir(extraCfgMapDir, targetDir);
        }

        if (isDebugMode) {
            console.log("List target dir after decode all files: ");
            console.log(execSync(`ls ${targetDir}`, { encoding: "utf8" }));
        }
    } catch (e) {
        console.error(`Error: ${e}`);
        process.exit(-1);
    }
}
