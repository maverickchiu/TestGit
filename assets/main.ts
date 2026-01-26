import { _decorator, assetManager, Component, Node, Sprite, SpriteFrame } from 'cc';
import { WINDOWS } from 'cc/env';
const { ccclass, property } = _decorator;

@ccclass('main')
export class main extends Component {
    @property(Sprite)
    sprite: Sprite = null;
    @property(Sprite)
    sprite2: Sprite = null;

    start() {
        const baseUrl = "https://maverickchiu.github.io/TestGit/";
        const platformPath = WINDOWS ? "windows-dev/" : "android-dev/";
        const bundleName = "girls";
        const bundleUrl = `${baseUrl}${platformPath}${bundleName}`;

        assetManager.loadBundle(bundleUrl, { version: '3b90a' }, (err, bundle) => {
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


