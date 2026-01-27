import { path } from "cc";
import { native } from "cc";
import { IFileMover } from "../Type";

export class FileMover implements IFileMover {
    move(srcDir: string, destDir: string): void {
        const files: string[] = [];
        native.fileUtils.listFilesRecursively(srcDir, files);
        for (const file of files) {
            const relativePath = file.substring(srcDir.length + 1);
            const newPath = path.join(destDir, relativePath);
            const dir = path.dirname(newPath);
            if (!native.fileUtils.isDirectoryExist(dir)) {
                native.fileUtils.createDirectory(dir);
            }
            if (!native.fileUtils.isFileExist(file)) {
                continue;
            }
            const result = native.fileUtils.renameFile(file, newPath);
            if (!result) {
                console.error(`failed to move file: ${file} to ${newPath}`);
            }
        }
    }
}