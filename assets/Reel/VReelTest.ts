import { Button, Component, instantiate, Label, Prefab, Widget } from "cc";
import { VReel } from "./VReel";
import { _decorator } from "cc";
import { VReelController, VReelState, VReelSymbolProvider } from "./VReelController";
const { ccclass, property } = _decorator;

@ccclass('VReelTest')
export class VReelTest extends Component implements VReelSymbolProvider {
    @property(VReel)
    private reel: VReel = null;
    @property(Prefab)
    private symbolPrefab: Prefab = null;
    @property
    private speed: number = 100;

    @property(Button)
    private spinButton: Button = null;

    declare private controller: VReelController;

    protected start(): void {
        this.controller = new VReelController({
            provider: this,
            reel: this.reel,
            strip: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        });
        this.controller.setOnStateChange(controller=>{
            this.updateButtonView();
        });
        this.updateButtonView();
        this.spinButton.node.on(Button.EventType.CLICK, this.onSpin, this);
    }

    private onSpin() {
        switch(this.controller.State) {
            case VReelState.Spinning:
                this.controller.endSpin();
                break;
            case VReelState.Idle:
                this.controller.beginSpin();
                break;
        }
    }

    private updateButtonView(){
        const state = this.controller.State;
        const label = this.spinButton.getComponentInChildren(Label);
        const text = state === VReelState.Idle ? "Spin" : "Stop";
        label.string = text;
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
    