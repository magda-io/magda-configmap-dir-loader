import {} from "mocha";
import { expect } from "chai";
import path from "path";
import tmp from "tmp";
import main from "../main";
import recursive from "recursive-readdir";
import fse from "fs-extra";

tmp.setGracefulCleanup();

describe("test main()", () => {
    let envVarBackup: {
        [key: string]: string;
    };

    beforeEach(() => {
        envVarBackup = { ...process.env };
    });

    afterEach(() => {
        process.env = { ...envVarBackup };
    });

    it("should decode the json config map data files correctly", async () => {
        const tmpDir = tmp.dirSync({
            mode: 0o777,
            prefix: "test_json_target_dir",
            unsafeCleanup: true
        });

        const defaultCfgMapDir = path.resolve(__dirname, "../../test_data");
        const targetDir = tmpDir.name;

        process.env["DEFAULT_CFG_MAP_DIR"] = defaultCfgMapDir;
        process.env["TARGET_DIR"] = targetDir;

        main();

        const fileHash = {} as {
            [path: string]: string;
        };

        (
            await recursive(defaultCfgMapDir, [
                (file, states) => path.extname(file).toLowerCase() !== ".json"
            ])
        ).forEach(f => {
            const data = fse.readJsonSync(f);
            Object.keys(data).forEach(
                p => (fileHash[path.join(targetDir, p)] = data[p])
            );
        });

        const targetFiles = await recursive(targetDir);
        expect(targetFiles.length > 0).to.be.true;

        targetFiles.forEach(f => {
            const data = fse.readFileSync(f, { encoding: "utf8" });
            expect(fileHash[f]).to.equal(data);
        });
    });
});
