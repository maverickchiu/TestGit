import { Component, instantiate, Label, Prefab, Widget } from "cc";
import { VReel, VReelProvider } from "./VReel";
import { _decorator } from "cc";
const { ccclass, property } = _decorator;

@ccclass('VReelTest')
export class VReelTest extends Component implements VReelProvider {
    @property(VReel)
    private reel: VReel = null;
    @property(Prefab)
    private symbolPrefab: Prefab = null;
    @property
    private speed: number = 100;

    protected start(): void {
        this.reel.init(this);
    }

    protected update(dt: number): void {
        this.reel.Speed = this.speed;
    }

    getSymbolNode(symbol: number, item: Widget): Widget {
        if(!item) {
            const symbol = instantiate(this.symbolPrefab);
            item = symbol.getComponent(Widget);
        }

        item.getComponentInChildren(Label).string = symbol.toString();
        return item;
    }
}
    