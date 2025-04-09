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

export interface VReelConfig {
    provider: VReelSymbolProvider;
    reel: VReel;
    strip: number[];
}

export interface VReelStopRequest {
    step: number;
    result: number[];
    onStop?: (controller: VReelController) => void;
}

export class VReelController implements IVReelController {
    constructor(config: VReelConfig) {
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
    declare private stopRequest: VReelStopRequest;

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

    quickStop() {
        if(this.state !== VReelState.Stopping)
            return;
    }

    endSpin(request: VReelStopRequest) {
        if(this.state !== VReelState.Spinning)
            return;
        this.setState(VReelState.Stopping);

        const stripSize = this.strip.length;
        const result = request.result;
        const offset = (this.reel.MinVisibleIndex + request.step) % stripSize - result.length + 1;
        for(let i = 0; i < result.length; i++) {
            const index = (result[i] + offset) % stripSize;
            this.strip[index] = result[i];
        }
        this.stopRequest = request;
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

    onSymbolChanged(reel: VReel): void {
        if( this.stopRequest) {
            this.stopRequest.step--;
            if(this.stopRequest.step <= 0) {
                this.setState(VReelState.Idle);
                this.stopRequest.onStop?.(this);
                this.stopRequest = null;
            }
        }
    }
}
