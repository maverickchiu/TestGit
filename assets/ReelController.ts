import { ISymbolProvider, ReelSpinner } from "./ReelSpinner";
import { Node } from "cc";
import { _decorator } from "cc";

const { ccclass, property } = _decorator;

export interface ReelConfig {
    reelStrips: number[];
    speed: number;
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
        this.Speed = config.speed;
        this.resultStrip = config.reelStrips;
        this.spinner.init(this);
        this.spinner.enabled = false;
    }

    declare private lastTime?: number;
    declare private viewer: IReelViewer;
    declare private spinner: ReelSpinner;
    declare private config: ReelConfig;
    declare private state: ReelState;
    declare private pass: number;
    declare private resultStrip: number[];

    get Speed() {
        return this.spinner.Speed;
    }

    set Speed(value: number) {
        this.spinner.Speed = value;
    }

    get State() {
        return this.state;
    }

    beginSpin() {
        if(this.state !== ReelState.Idle){
            return;
        }
        this.state = ReelState.Spinning;
        this.spinner.enabled = true;
    }

    endSpin(result: number[], pass: number) {
        if(this.state !== ReelState.Spinning){
            return;
        }
        
        this.state = ReelState.Stopping;
        this.resultStrip = [...this.config.reelStrips];
        const size = this.resultStrip.length;
        const startIndex = this.spinner.MaxIndex % size;
        const insert = (startIndex - pass) % size;
        for(let i = 0; i < result.length; i++) {
            const index = (insert - i) % size;
            this.resultStrip[index] = result[i];
        }
        this.pass = pass + result.length;
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

    private checkStop() {
        if(this.state !== ReelState.Stopping){
            return;
        }
        this.pass --;
        if(this.pass <= 0){
            this.state = ReelState.Idle;
            this.spinner.enabled = false;
        }
    }
}