const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

// Just an chatgpt generated code to build firefox + chromium

const firefoxFolder = path.join(__dirname, 'firefox');
const chromiumFolder = path.join(__dirname, 'chromium');
const distFolder = path.join(__dirname, 'dist');
const distChromiumFolder = path.join(distFolder, 'chromium');

async function ensureFolderExists(folder) {
    try {
        await fs.mkdir(folder, { recursive: true });
    } catch (err) {
        console.error(`Error creating folder ${folder}: ${err}`);
    }
}

async function copyOrReplaceFiles(sourceFolder, destFolder) {
    try {
        const files = await fs.readdir(sourceFolder);
        await Promise.all(files.map(async (file) => {
            const sourcePath = path.join(sourceFolder, file);
            const destPath = path.join(destFolder, file);
            const stat = await fs.lstat(sourcePath);

            if (stat.isDirectory()) {
                await ensureFolderExists(destPath);
                await copyOrReplaceFiles(sourcePath, destPath);
            } else {
                await fs.copyFile(sourcePath, destPath);
            }
        }));
    } catch (err) {
        console.error(`Error copying files from ${sourceFolder} to ${destFolder}: ${err}`);
    }
}

const filesToRemoveFromChromium = [
    'contentScripts/list/multiselect.js',
    'contentScripts/list/removeEntry.js', 
    'contentScripts/helper/interceptFetch.js'
];

async function buildFirefox() {
    console.log("Building firefox");
    return new Promise((resolve, reject) => {
        exec('web-ext build', { cwd: firefoxFolder }, async (err, stdout, stderr) => {
            if (err) {
                console.error(`Error building extension: ${stderr}`);
                return reject(err);
            }

            console.log(`Build successful: ${stdout}`);
            const buildFolder = path.join(firefoxFolder, 'web-ext-artifacts');

            try {
                const files = await fs.readdir(buildFolder);
                await Promise.all(files.map(async (file) => {
                    const sourcePath = path.join(buildFolder, file);
                    const destPath = path.join(distFolder, `firefox_${file}`);
                    await fs.rename(sourcePath, destPath);
                }));

                console.log('Firefox build files moved to dist folder');
                await fs.rm(buildFolder, { recursive: true, force: true });
                console.log('Build folder removed');
                resolve();
            } catch (err) {
                console.error(`Error processing build folder: ${err}`);
                reject(err);
            }
        });
    });
}

async function buildChromium() {
    console.log("------------");
    console.log("Building chromium");

    console.log("Copying firefox folder to dist/chromium");
    await copyOrReplaceFiles(firefoxFolder, distChromiumFolder);

    console.log("Replacing files in dist/chromium from chromium folder");
    await copyOrReplaceFiles(chromiumFolder, distChromiumFolder);

    console.log("Removing unwanted files from dist/chromium");
    await Promise.all(filesToRemoveFromChromium.map(async (file) => {
        const filePath = path.join(distChromiumFolder, file);
        try {
            await fs.unlink(filePath);
            console.log(`Removed: ${filePath}`);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                console.error(`Error removing ${filePath}: ${err}`);
            }
        }
    }));

    console.log("Packing chromium");
    return new Promise((resolve, reject) => {
        exec('web-ext build', { cwd: distChromiumFolder }, async (err, stdout, stderr) => {
            if (err) {
                console.error(`Error building chromium extension: ${stderr}`);
                return reject(err);
            }

            console.log(`Chromium build successful: ${stdout}`);

            const chromiumBuildFolder = path.join(distChromiumFolder, 'web-ext-artifacts');

            try {
                const files = await fs.readdir(chromiumBuildFolder);
                await Promise.all(files.map(async (file) => {
                    const sourcePath = path.join(chromiumBuildFolder, file);
                    const destPath = path.join(distFolder, `chromium_${file}`);
                    await fs.rename(sourcePath, destPath);
                }));

                console.log('Chromium build files moved to dist folder');
                await fs.rm(chromiumBuildFolder, { recursive: true, force: true });
                console.log('Chromium build folder removed');

                await fs.rm(distChromiumFolder, { recursive: true, force: true });
                console.log('dist/chromium folder removed');

                resolve();
            } catch (err) {
                console.error(`Error processing chromium build folder: ${err}`);
                reject(err);
            }
        });
    });
}

async function main() {
    await ensureFolderExists(distFolder);
    await ensureFolderExists(distChromiumFolder);

    try {
        await buildFirefox();
        await buildChromium();
    } catch (err) {
        console.error(`Build process failed: ${err}`);
    }
}

main();