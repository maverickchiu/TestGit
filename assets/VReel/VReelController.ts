import { Widget } from "cc";
import { VReel, IVReelController as IVReelController, IVReelStopAnim } from "./VReel";

export enum VReelState {
    Idle,
    Spinning,
    Stopping,
    StopAnim,
}

export interface VReelSymbolProvider {
    getSymbolNode(symbol: number, item: Widget, index?: number): Widget;
}

export interface VReelConfig {
    provider: VReelSymbolProvider;
    reel: VReel;
    strip: number[];
}

export interface VReelStopRequest {
    step: number;
    result: number[];
    onStop?: (controller: VReelController) => Promise<void>;
}

export class VReelController implements IVReelController {
    constructor(config: VReelConfig) {
        this.provider = config.provider;
        this.reel = config.reel;
        this.initStrip = config.strip;
        this.currentStrip = config.strip.slice();
        this.state = VReelState.Idle;
        this.reel.init(this);
    }
    
    declare private provider: VReelSymbolProvider;
    declare private reel: VReel;
    declare private state: VReelState;
    declare private initStrip: number[];
    declare private currentStrip: number[];
    declare private onStateChange: (controller: VReelController) => void;
    declare private hasQuickStop: boolean;
    declare private stopRequest: VReelStopRequest;
    declare private stopIndex: number;

    get State() {
        return this.state;
    }

    setOnStateChange(onStateChange: (controller: VReelController) => void) {
        this.onStateChange = onStateChange;
    }

    resetSymbols(strip: number[]) {
        if(this.state !== VReelState.Idle)
            return;
        this.initStrip = strip;
        this.currentStrip = strip;
        this.reel.rebuild();
    }

    beginSpin() {
        if(this.state !== VReelState.Idle)
            return;
        this.hasQuickStop = false;
        this.setState(VReelState.Spinning);
    }

    private setStopRequest(request: VReelStopRequest) {
        this.currentStrip.length = 0;
        this.currentStrip.push(...this.initStrip);
        const stripSize = this.initStrip.length;
        const result = request.result;
        const visibleCount = this.reel.VisibleCount;
        const minStep = Math.max(request.step, visibleCount);
        request.step = minStep;
        const minVisibleIndex = this.reel.MinVisibleIndex;
        const minOffset = (minVisibleIndex % stripSize + stripSize) % stripSize;
        if(this.reel.Speed < 0){
            const offset = (minOffset + minStep) % stripSize;
            for(let i = 0; i < result.length; i++) {
                const index = (i + offset) % stripSize;
                this.currentStrip[index] = result[i];
            }
            this.stopIndex = minVisibleIndex + minStep + 1;
        }
        else{
            const offset = minOffset - minStep;
            for(let i = 0; i < result.length; i++) {
                const index = (((offset + i) % stripSize) + stripSize) % stripSize;
                this.currentStrip[index] = result[i];
            }
            this.stopIndex = minVisibleIndex - minStep;
        }

        this.stopRequest = request;
    }

    quickStop() {
        if(this.hasQuickStop)
            return;
        if(this.state !== VReelState.Stopping)
            return;
        this.hasQuickStop = true;
        this.stopRequest.step = 0;
        this.setStopRequest(this.stopRequest);
    }

    endSpin(request: VReelStopRequest) {
        if(this.state !== VReelState.Spinning)
            return;
        this.setState(VReelState.Stopping);
        this.setStopRequest(request);
    }

    private setState(state: VReelState) {
        this.state = state;
        switch(state) {
            case VReelState.Spinning:
                this.reel.IsSpinning = true;
                break;
            case VReelState.StopAnim:
            case VReelState.Idle:
                this.reel.IsSpinning = false;
                break;
        }
        this.onStateChange?.(this);
    }

    getSymbolNode(index: number, item: Widget): Widget {
        const stripSize = this.currentStrip.length;
        const offset = (index % stripSize + stripSize) % stripSize;
        const symbol = this.currentStrip[offset];
        return this.provider.getSymbolNode(symbol, item, index);
    }

    async onSymbolChanged(reel: VReel): Promise<void> {
        if( this.stopRequest) {
            if(this.stopIndex === reel.MinVisibleIndex) {
                this.setState(VReelState.StopAnim);
                const onStop = this.stopRequest.onStop;
                this.stopRequest = null;
                await onStop?.(this);
                this.setState(VReelState.Idle);
            }
        }
    }

    playStopAnim(anim: IVReelStopAnim){
        return new Promise<void>((resolve) => {
            this.reel.setStopAnim(anim, resolve);
        });
    }
}
