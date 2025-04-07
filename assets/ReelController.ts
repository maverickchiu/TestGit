import { IReelStopAnim, ISymbolProvider, ReelSpinner } from "./ReelSpinner";
import { Node, tween } from "cc";
import { _decorator } from "cc";

const { ccclass, property } = _decorator;

export interface ReelConfig {
    reelStrips: number[];
}

export interface SpinRequest {
    onStateChange?: (controller: ReelController, state: ReelState) => void;
}

export interface SpinResult {
    result: number[];
    offset?: number;
    cycle?: number;
    onStop?: (controller: ReelController) => Promise<void>;
}

export enum ReelState {
    Idle,
    Spinning,
    Stopping,
}

export interface IReelViewer {
    getSymbolNode(symbol: number, type: number, node: Node): Node;
}

@ccclass('ReelController')
export class ReelController implements ISymbolProvider {
    constructor(viewer: IReelViewer, spinner: ReelSpinner, config: ReelConfig) {
        this.viewer = viewer;
        this.spinner = spinner;
        this.config = config;
        this.state = ReelState.Idle;
        this.Speed = 0;
        this.resultStrip = config.reelStrips;
        this.spinner.init(this);
        this.spinner.IsSpinning = false;   
    }

    declare private lastTime?: number;
    declare private viewer: IReelViewer;
    declare private spinner: ReelSpinner;
    declare private config: ReelConfig;
    declare private state: ReelState;
    declare private stopIndex: number;
    declare private cycle: number;
    declare private resultStrip: number[];
    declare private spinRequest?: SpinRequest;
    declare private spinResult?: SpinResult;

    get Speed() {
        return this.spinner.Speed;
    }

    set Speed(value: number) {
        this.spinner.Speed = value;
    }

    get State() {
        return this.state;
    }

    beginSpin(request?: SpinRequest) {
        if(this.state !== ReelState.Idle){
            return;
        }
        this.state = ReelState.Spinning;
        this.spinner.IsSpinning = true;
        this.spinRequest = request;
        this.spinRequest?.onStateChange?.(this, ReelState.Spinning);
    }

    endSpin(spinResult: SpinResult) {
        if(this.state !== ReelState.Spinning){
            return;
        }

        let {result, offset: remain, cycle} = spinResult;
        if(remain === undefined || remain <= 0){
            remain = this.resultStrip.length;
        }
        if(cycle === undefined || cycle < 0){
            cycle = 0;
        }

        this.state = ReelState.Stopping;
        this.spinRequest?.onStateChange?.(this, ReelState.Stopping);
        this.resultStrip = [...this.config.reelStrips];
        const size = this.resultStrip.length;
        const startIndex = (this.spinner.MaxIndex % size + size) % size;
        const insert = ((startIndex - remain) % size + size) % size;
        for(let i = 0; i < result.length; i++) {
            const index = ((insert - i) % size + size) % size;
            this.resultStrip[index] = result[i];
        }
        this.stopIndex = ((startIndex - remain - result.length + 1) % size + size) % size;
        this.cycle = cycle;
        this.spinResult = spinResult;
    }

    getSymbolType(index: number): number {
        return 0;
    }

    getSymbolNode(index: number, type: number, node: Node): Node {
        const reelStripSize = this.resultStrip.length;
        index = ((index % reelStripSize) + reelStripSize) % reelStripSize;

        const symbol = this.resultStrip[index];
        return this.viewer.getSymbolNode(symbol, type, node);
    }

    onHitTop() {
        this.checkStop();
    }

    onHitBottom() {
        this.checkStop();
    }

    async playStopAnim(anim: IReelStopAnim){
        return new Promise<void>((resolve) => {
            this.spinner.setStopAnim(anim, resolve);
        });
    }

    private async checkStop() {
        if(this.state !== ReelState.Stopping){
            return;
        }

        const size = this.resultStrip.length;
        const maxIndex = (this.spinner.MaxIndex % size + size) % size;
        if(maxIndex === this.stopIndex){
            this.cycle--;
            if(this.cycle < 0){
                this.spinner.IsSpinning = false;
                await this.spinResult?.onStop?.(this);
                this.spinner.resetPosition();
                this.state = ReelState.Idle;
                this.spinRequest?.onStateChange?.(this, ReelState.Idle);
                this.spinRequest = undefined;
                this.spinResult = undefined;
            }
        }
    }
}