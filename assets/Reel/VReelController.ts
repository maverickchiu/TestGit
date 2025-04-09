import { Widget } from "cc";
import { VReel, IVReelController as IVReelController } from "./VReel";

export enum VReelState {
    Idle,
    Spinning,
    Stopping,
}

export interface VReelSymbolProvider {
    getSymbolNode(symbol: number, item: Widget): Widget;
}

export interface IVReelControllerConfig {
    provider: VReelSymbolProvider;
    reel: VReel;
    strip: number[];
}

export class VReelController implements IVReelController {
    constructor(config: IVReelControllerConfig) {
        this.provider = config.provider;
        this.reel = config.reel;
        this.strip = config.strip;
        this.state = VReelState.Idle;
        this.reel.init(this);
    }
    
    declare private provider: VReelSymbolProvider;
    declare private reel: VReel;
    declare private state: VReelState;
    declare private strip: number[];
    declare private onStateChange: (controller: VReelController) => void;

    get State() {
        return this.state;
    }

    setOnStateChange(onStateChange: (controller: VReelController) => void) {
        this.onStateChange = onStateChange;
    }

    resetSymbols(strip: number[]) {
        if(this.state !== VReelState.Idle)
            return;
        this.strip = strip;
        this.reel.rebuild();
    }

    beginSpin() {
        if(this.state !== VReelState.Idle)
            return;
        this.setState(VReelState.Spinning);
    }

    endSpin() {
        if(this.state !== VReelState.Spinning)
            return;
        this.setState(VReelState.Stopping);
        setTimeout(() => {
            this.setState(VReelState.Idle);
        }, 1000);
    }

    private setState(state: VReelState) {
        this.state = state;
        switch(state) {
            case VReelState.Spinning:
                this.reel.IsSpinning = true;
                break;
            case VReelState.Idle:
                this.reel.IsSpinning = false;
                break;
        }
        this.onStateChange?.(this);
    }

    getSymbolNode(index: number, item: Widget): Widget {
        const stripSize = this.strip.length;
        const offset = (index % stripSize + stripSize) % stripSize;
        const symbol = this.strip[offset];
        return this.provider.getSymbolNode(symbol, item);
    }
}
