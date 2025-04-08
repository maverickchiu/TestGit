import { _decorator, Component, instantiate, Label, math, Node, Prefab, Slider } from 'cc';
import { ISymbolProvider, ReelSpinner } from './ReelSpinner';
const { ccclass, property } = _decorator;

@ccclass('ReelTest')
export class ReelTest extends Component implements ISymbolProvider {
    @property(ReelSpinner)
    private reel: ReelSpinner = null;
    @property(Slider)
    private slider: Slider = null;
    @property
    speedMin: number = -1000;
    @property
    speedMax: number = 1000;
    @property(Prefab)
    private symbolPrefabs: Prefab[] = [];

    private fakeReel: number[] = [0,0,0,1,1,1,2,2,2];

    protected start(): void {
        this.reel.init(this);
    }

    update(deltaTime: number) {
        const t = this.slider.progress; // 0 ~ 1
        const speed = this.speedMin + (this.speedMax - this.speedMin) * t;
        this.reel.Speed = speed;
    }

    getSymbolSize(index: number): number {
        index = ((index % this.fakeReel.length) + this.fakeReel.length) % this.fakeReel.length;
        return this.fakeReel[index];
    }

    getSymbolNode(index: number, type: number, node: Node): Node {
        index = ((index % this.fakeReel.length) + this.fakeReel.length) % this.fakeReel.length;
        if(!node) {
            const prefab = this.symbolPrefabs[type];
            node = instantiate(prefab);
        }
        node.getComponentInChildren(Label).string = index.toString();

        return node;
    }
}


