"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compressTextures = void 0;
const fs_extra_1 = require("fs-extra");
const compressTextures = async (tasks) => {
    console.debug(`Execute compress task ${tasks}`);
    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        if (task.format !== 'jpg') {
            continue;
        }
        // task.dest should change suffix before compress
        task.dest = task.dest.replace('.png', '.jpg');
        await pngToJPG(task.src, task.dest, task.compressOptions.quality);
        // The compress task have done needs to be removed from the original tasks
        tasks.splice(i, 1);
        i--;
    }
};
exports.compressTextures = compressTextures;
async function pngToJPG(src, dest, quality) {
    const img = await getImage(src);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg', quality / 100);
    await (0, fs_extra_1.outputFile)(dest, imageData);
    console.debug('pngToJPG', dest);
}
function getImage(path) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function () {
            resolve(img);
        };
        img.onerror = function (err) {
            reject(err);
        };
        img.src = path.replace('#', '%23');
    });
}
