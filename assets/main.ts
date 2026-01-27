import { _decorator, assetManager, Component, Node, ProgressBar, Sprite, SpriteFrame } from 'cc';
import { WINDOWS } from 'cc/env';
import { PatchManager } from 'db://patch-version-builder/PatchManager';
import { IPatchConfig } from 'db://patch-version-builder/Type';
const { ccclass, property } = _decorator;

@ccclass('main')
export class main extends Component {
    @property(Sprite)
    sprite: Sprite = null;
    @property(Sprite)
    sprite2: Sprite = null;
    @property(ProgressBar)
    progressBar: ProgressBar = null;

    async start() {
        const config: IPatchConfig = {
            baseUrl: "https://maverickchiu.github.io/TestGit/windows-test-1.66.2/",
            onProgress: (completedCount, totalCount) => {
                this.progressBar.progress = completedCount / totalCount;
            },
        };
        const patchManager = new PatchManager();
        const result = await patchManager.patch(config);
        console.log(result);

        assetManager.loadBundle("girls", (err, bundle) => {
            if (err) {
                return;
            }
            bundle.load('001/spriteFrame', SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    return;
                }
                this.sprite.spriteFrame = spriteFrame;
            });
            bundle.load('000/spriteFrame', SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    return;
                }
                this.sprite2.spriteFrame = spriteFrame;
            });
        });
    }
}


