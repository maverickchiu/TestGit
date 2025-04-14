import { Component, UITransform, Widget } from "cc";
import { _decorator } from "cc";
const { ccclass, property } = _decorator;

export interface IVReelController {
    getSymbolNode(index: number, item: Widget): Widget;
    onSymbolChanged(reel: VReel): void;
}

interface IVReelItem {
    index: number;
    widget: Widget;
}

export interface IVReelStopAnim {
    canRunAgain(): boolean;
    calculate(dt: number): number;
}

@ccclass('VReel')
export class VReel extends Component {
    @property
    itemSize: number = 0;
    @property({
        visible: true
    })
    private position: number = 0;
    @property
    private speed: number = 800;

    get Position() {
        return this.position;
    }

    declare private viewTrans: UITransform;
    declare private controller: IVReelController;
    declare private items: IVReelItem[];
    declare private pool: Widget[];
    declare private prevMinIndex: number;
    declare private visibleIndexes: Set<number>;
    declare private isSpinning: boolean;

    declare private stopAnim: IVReelStopAnim;
    declare private onEnd: () => void;
    
    get Speed() {
        return this.speed;
    }

    set Speed(value: number) {
        this.speed = value;
    }

    get IsSpinning() {
        return this.isSpinning;
    }

    set IsSpinning(value: boolean) {
        this.isSpinning = value;
    }

    get MinVisibleIndex() {
        return Math.ceil(this.position / this.itemSize);
    }

    get MaxVisibleIndex() {
        return Math.ceil((this.position + this.viewTrans.height) / this.itemSize);
    }

    get VisibleCount() {
        return this.MaxVisibleIndex - this.MinVisibleIndex + 1;
    }

    protected onLoad(): void {
        this.viewTrans = this.getComponent(UITransform);
        this.items = [];
        this.pool = [];
        this.visibleIndexes = new Set();
    }

    init(controller: IVReelController) {
        this.controller = controller;
        this.setPosition(0);
    }

    rebuild(){
        this.items.forEach(item => {
            this.pool.push(item.widget);
            item.widget.node.parent = null;
        });
        this.items.length = 0;
        this.setPosition(0);
    }

    setStopAnim(anim: IVReelStopAnim, onEnd: () => void) {
        this.stopAnim = anim;
        this.onEnd = onEnd;
    }

    protected update(dt: number): void {
        if(!this.controller) 
            return;
        if(this.isSpinning){
            const offset = this.speed * dt;
            this.setPosition(this.position - offset);
        }
        else{
            if(this.stopAnim){
                const offset = this.stopAnim.calculate(dt);
                this.setPosition(this.position - offset);
                if(!this.stopAnim.canRunAgain()){
                    this.stopAnim = undefined;
                    this.onEnd?.();

                    const newPosition = Math.round(this.position);
                    this.setPosition(newPosition);
                }
            }
        }
    }

    private setPosition(position: number) {
        this.position = position;
        this.refreshView();
    }

    private refreshView(){
        const min = this.position;
        const max = min + this.viewTrans.height;
        const elementMin = Math.floor(min / this.itemSize);
        const symbolChanged = elementMin !== this.prevMinIndex;
        if(symbolChanged) {
            this.prevMinIndex = elementMin;
            const elementMax = Math.floor(max / this.itemSize) + 1;

            this.removeInvisibleItems(elementMin, elementMax);
            this.addVisibleItems(elementMin, elementMax);
        }
        this.relayout();

        if(symbolChanged) {
            this.controller.onSymbolChanged(this);
        }
    }

    private removeInvisibleItems(min: number, max: number){
        const items = this.items;
        for(let i = items.length - 1; i >= 0; i--) {
            const item = items[i];
            if(item.index < min || item.index > max) {
                this.pool.push(item.widget);
                item.widget.node.parent = null;
                items.splice(i, 1);
            }
        }
    }

    private addVisibleItems(min: number, max: number){
        const visibleIndexes = this.visibleIndexes;
        visibleIndexes.clear();
        const items = this.items;
        items.forEach(item => {
            visibleIndexes.add(item.index);
        });
        for(let i = min; i <= max; i++) {
            if(visibleIndexes.has(i)) {
                continue;
            }
            const widget = this.pool.pop();
            const item = this.controller.getSymbolNode(i, widget);
            item.isAlignBottom = true;
            item.isAbsoluteBottom = true;
            item.node.parent = this.node;
            const reelItem: IVReelItem = {
                index: i,
                widget: item
            };

            if(items[0] && items[0].index < i) {
                items.push(reelItem);
            } else {
                items.unshift(reelItem);
            }
        }
    }

    private relayout(){
        const items = this.items;

        const offset = -this.position % this.itemSize;
        let curHeight = offset;
        if(this.position < 0) {
            curHeight -= this.itemSize;
        }
        for(let i = 0; i < items.length; i++) {
            const item = items[i];
            item.widget.bottom = curHeight;
            curHeight += this.itemSize;
        }
    }
}   