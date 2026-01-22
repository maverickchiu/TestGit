import { _decorator, assetManager, Component, Node, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('main')
export class main extends Component {
    @property(Sprite)
    sprite: Sprite = null;
    @property(Sprite)
    sprite2: Sprite = null;

    start() {
        assetManager.loadBundle('girls', (err, bundle) => {
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


