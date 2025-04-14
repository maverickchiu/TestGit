import { Button, Component, instantiate, Label, Prefab, Widget } from "cc";
import { VReel } from "./VReel";
import { _decorator } from "cc";
import { VReelController, VReelState, VReelSymbolProvider } from "./VReelController";
import { VReelStopAnimPreset } from "./Anims/VReelStopAnimPreset";
const { ccclass, property } = _decorator;

enum ButtonState {
    CanSpin,
    CanStop,
    CanQuickStop,
    WaitForStopAnim,
}

@ccclass('VReelTest')
export class VReelTest extends Component implements VReelSymbolProvider {
    @property(VReel)
    private reels: VReel[] = [];
    @property(Prefab)
    private symbolPrefab: Prefab = null;
    @property
    private speed: number = 100;

    @property(Button)
    private spinButton: Button = null;
    @property(Button)
    private resetButton: Button = null;

    declare private controllers: VReelController[];
    declare private strip: number[];
    declare private state: ButtonState;

    protected start(): void {
        this.strip = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        this.controllers = [];
        for (let i = 0; i < this.reels.length; i++) {
            const reel = this.reels[i];
            const controller = new VReelController({
                provider: this,
                reel: reel,
                strip: this.strip
            });
            this.controllers.push(controller);
            controller.setOnStateChange(controller => {
                this.updateButtonView();
            });
        }
        this.state = ButtonState.CanSpin;
        this.updateButtonView();
        this.spinButton.node.on(Button.EventType.CLICK, this.onSpin, this);
        this.resetButton.node.on(Button.EventType.CLICK, this.onReset, this);
    }

    protected update(dt: number): void {
        this.reels.forEach(reel => {
            reel.Speed = this.speed;
        });
    }

    private onSpin() {
        for (let i = 0; i < this.controllers.length; i++) {
            const controller = this.controllers[i];
            switch (this.state) {
                case ButtonState.CanStop:
                    controller.endSpin({
                        step: i * 4 + 4,
                        result: [22, 33, 44],
                        onStop: async (controller: VReelController) => {
                            const shake = VReelStopAnimPreset.createShake();
                            await controller.playStopAnim(shake);
                        }
                    });
                    break;
                case ButtonState.CanQuickStop:
                    controller.quickStop();
                    break;
                case ButtonState.CanSpin:
                    controller.beginSpin();
                    break;
            }
        }
    }

    private onReset() {
        this.controllers.forEach(controller => {
            controller.resetSymbols(this.strip);
        });
    }

    private updateButtonView() {
        const controllers = this.controllers;
        let buttonState = ButtonState.CanSpin;
        for (let i = 0; i < controllers.length; i++) {
            const controller = controllers[i];
            const state = controller.State;
            switch (state) {
                case VReelState.Spinning:
                    buttonState = ButtonState.CanStop;
                    break;
                case VReelState.Stopping:
                    buttonState = ButtonState.CanQuickStop;
                    break;
                case VReelState.StopAnim:
                    buttonState = ButtonState.WaitForStopAnim;
                    break;
                case VReelState.Idle:
                    break;
            }

            if(buttonState !== ButtonState.CanSpin)
                break;
        }

        const label = this.spinButton.getComponentInChildren(Label);
        switch (buttonState) {
            case ButtonState.CanStop:
                label.string = "Stop";
                break;
            case ButtonState.CanQuickStop:
                label.string = "Quick Stop";
                break;
            case ButtonState.WaitForStopAnim:
                label.string = "Wait";
                break;
        }

        setTimeout(() => {
            this.state = buttonState;
        }, 10);
    }

    getSymbolNode(symbol: number, item: Widget, index: number): Widget {
        if (!item) {
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
