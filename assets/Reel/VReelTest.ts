import { Button, Component, instantiate, Label, Prefab, Widget } from "cc";
import { VReel } from "./VReel";
import { _decorator } from "cc";
import { VReelController, VReelState, VReelSymbolProvider } from "./VReelController";
import { VReelStopAnimPreset } from "./Anims/VReelStopAnimPreset";
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
    @property(Button)
    private resetButton: Button = null;

    declare private controller: VReelController;
    declare private strip: number[];

    protected start(): void {
        this.strip = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        this.controller = new VReelController({
            provider: this,
            reel: this.reel,
            strip: this.strip
        });
        this.controller.setOnStateChange(controller=>{
            this.updateButtonView();
        });
        this.updateButtonView();
        this.spinButton.node.on(Button.EventType.CLICK, this.onSpin, this);
        this.resetButton.node.on(Button.EventType.CLICK, this.onReset, this);
    }

protected update(dt: number): void {
    this.reel.Speed = this.speed;
}

    private onSpin() {
        switch(this.controller.State) {
            case VReelState.Spinning:
                this.controller.endSpin({
                    step: 60,
                    result: [22,33,44],
                    onStop: async (controller: VReelController) => {
                        const shake = VReelStopAnimPreset.createShake();
                        await controller.playStopAnim(shake); 
                    }
                });
                break;
            case VReelState.Stopping:
                this.controller.quickStop();
                break;
            case VReelState.Idle:
                this.controller.beginSpin();
                break;
        }
    }

    private onReset() {
        this.controller.resetSymbols(this.strip);
    }

    private updateButtonView(){
        const state = this.controller.State;
        const label = this.spinButton.getComponentInChildren(Label);
        switch(state) {
            case VReelState.Spinning:
                label.string = "Stop";
                break;
            case VReelState.Stopping:
                label.string = "Quick Stop";
                break;
            case VReelState.Idle:
                label.string = "Spin";
                break;
        }
    }

    getSymbolNode(symbol: number, item: Widget, index: number): Widget {
        if(!item) {
            const symbol = instantiate(this.symbolPrefab);
            item = symbol.getComponent(Widget);
        }

        const stripSize = this.strip.length;
        const offset = (index % stripSize + stripSize) % stripSize;
        const label = `${symbol}/${index}/${offset}`;
        item.getComponentInChildren(Label).string = label;
        return item;
    }
}
    