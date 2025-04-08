import { _decorator, assert, Component, Node, UITransform, Widget } from 'cc';
const { ccclass, property } = _decorator;

export interface ISymbolProvider {
    getSymbolSize(index: number): number;
    getSymbolNode(index: number, size: number, node: Node): Node;

    onHitTop?(): void;
    onHitBottom?(): void;
}

interface IViewItem {
    index: number;
    size: number;
    widget: Widget;
    node: Node;
}

export interface IReelStopAnim {
    canRunAgain(): boolean;
    calculate(dt: number): number;
}

@ccclass('ReelSpinner')
export class ReelSpinner extends Component {
    @property(Widget)
    private content: Widget = null;
    @property
    private spacing: number = 0;
    @property
    private unitHeight: number = 0;

    declare private contentTrans: UITransform;
    declare private viewTrans: UITransform;
    declare private viewItems: IViewItem[];
    declare private provider: ISymbolProvider;
    declare private pool: Map<number, Node[]>;
    declare private speed: number;
    declare private isSpinning: boolean;
    declare private stopAnim: IReelStopAnim;
    declare private onEnd: () => void;

    get Speed() {
        return this.speed;
    }

    set Speed(value: number) {
        this.speed = value;
    }

    get MinIndex() {
        return this.viewItems[0]?.index ?? 0;
    }

    get MaxIndex() {
        return this.viewItems[this.viewItems.length - 1]?.index ?? 0;
    }

    get IsSpinning() {
        return this.isSpinning;
    }

    set IsSpinning(value: boolean) {
        this.isSpinning = value;
    }

    protected onLoad(): void {
        this.contentTrans = this.content.getComponent(UITransform);
        this.viewTrans = this.getComponent(UITransform);
        this.content.isAlignTop = false;
        this.content.isAlignBottom = true;
        this.viewItems = [];
        this.pool = new Map<number, Node[]>();
    }

    init(provider: ISymbolProvider) {
        this.provider = provider;
        this.initSymbol();
        this.content.bottom = 0;
    }

    private initSymbol() {
        this.fillUpperSymbols(this.content);
        this.relayout();
    }

    protected update(dt: number): void {
        const offset = this.speed * dt;
        if(isNaN(offset))
            return;
        if(this.isSpinning){
            this.move(offset);
        }
        else{
            if(this.stopAnim){
                const offset = this.stopAnim.calculate(dt);
                this.move(offset);
                if(!this.stopAnim.canRunAgain()){
                    this.stopAnim = undefined;
                    this.onEnd?.();
                }
            }
        }
    }

    private move(offset: number) {
        assert(this.provider !== undefined, 'provider is not set');
        
        const content = this.content;
        if(offset > 0) {
            // 向上
            if(content.bottom >= 0) {
                const firstItem = this.viewItems[0];
                this.recycleSymbol(firstItem.node, firstItem.size);
                this.viewItems.shift();

                const fillHeight = this.fillLowerSymbols(content);
                this.relayout();
                content.bottom -= fillHeight;
            }
        } 

        content.bottom += offset;
        if(offset > 0) {
            // 向上
            if(content.bottom >= 0) {
                this.provider.onHitTop?.();
            }
        } else {
            // 向下
            const viewItems = this.viewItems;
            const lastItem = viewItems[viewItems.length - 1];
            const height = this.calculateHeight(lastItem);
            if(content.bottom <= -(height + this.spacing)) {
                this.recycleSymbol(lastItem.node, lastItem.size);
                viewItems.pop();

                this.fillUpperSymbols(content);
                
                this.relayout();
                content.bottom += height + this.spacing;
                this.provider.onHitBottom?.();
            }
        }
    }

    resetPosition() {
        this.content.bottom = 0;
    }

    setStopAnim(anim: IReelStopAnim, onEnd: () => void) {
        this.stopAnim = anim;
        this.onEnd = onEnd;
    }

    private relayout(){
        const viewItems = this.viewItems;
        let curHeight = 0;
        for(let i = viewItems.length - 1; i >= 0; i--){  
            const item = viewItems[i];
            if(curHeight !== 0){
                curHeight += this.spacing;
            }
            item.widget.bottom = curHeight;

            for(let j = 0; j < item.size; j++){
                if(j > 0){
                    curHeight += this.spacing;
                }
                curHeight += this.unitHeight;
            }
        }
        const bottom = this.content.bottom;
        this.contentTrans.height = curHeight;
        this.content.bottom = bottom;
    }

    private getSymbol(index: number, size: number){
        let nodes = this.pool.get(size);
        if(!nodes){
            nodes = [];
            this.pool.set(size, nodes);
        }
        const node = nodes.pop();
        return this.provider.getSymbolNode(index, size, node);
    }

    private recycleSymbol(node: Node, size: number) {
        node.parent = null;
        const nodes = this.pool.get(size);
        nodes.push(node);
    }

    private calculateHeight(viewItem: IViewItem){
        let curHeight = 0;
        for(let i = 0; i < viewItem.size; i++){
            if(i > 0){
                curHeight += this.spacing;
            }
            curHeight += this.unitHeight;
        }
        return curHeight;
    }

    private fillLowerSymbols(content: Widget){
        const height = this.viewTrans.height * 2;

        const contentNode = content.node;
        const viewItems = this.viewItems;
        let curHeight = 0;
        for (const item of viewItems) {
            curHeight += this.calculateHeight(item);
        }
        curHeight += Math.max(0,this.spacing * (viewItems.length - 1));

        let fillHeight = 0;
        while(curHeight <= height){
            // 生成新的Symbol放在最下面
            const nowMinIndex = viewItems[viewItems.length - 1]?.index ?? 0;
            const newIndex = nowMinIndex - 1;
            const size = this.provider.getSymbolSize(newIndex);
            const symbol = this.getSymbol(newIndex, size);
            const newItem: IViewItem = {
                index: newIndex,
                size: size,
                widget: this.tryGetWidget(symbol),
                node: symbol,
            };
            viewItems.push(newItem);

            symbol.parent = contentNode;
            symbol.setSiblingIndex(viewItems.length - 1);
            const newItemHeight = this.calculateHeight(newItem);
            curHeight += newItemHeight + this.spacing;
            fillHeight += newItemHeight + this.spacing;
        }

        return fillHeight;
    }

    private tryGetWidget(node: Node){
        let widget = node.getComponent(Widget);
        if(!widget){
            widget = node.addComponent(Widget);
            widget.isAlignBottom = true;
            widget.isAbsoluteBottom = true;
        }
        return widget;
    }

    private fillUpperSymbols(content: Widget){
        const height = this.viewTrans.height * 2;

        const viewItems = this.viewItems;
        let curHeight = 0;
        for (const item of viewItems) {
            curHeight += this.calculateHeight(item);
        }
        curHeight += Math.max(0,this.spacing * (viewItems.length - 1));

        while(curHeight <= height){
            // 生成新的Symbol放在最上面
            const nowMaxIndex = viewItems[0]?.index;
            const newIndex = nowMaxIndex !== undefined ? nowMaxIndex + 1 : 0;
            const size = this.provider.getSymbolSize(newIndex);
            const symbol = this.getSymbol(newIndex, size);
            const newItem: IViewItem = {
                index: newIndex,
                size: size,
                widget: this.tryGetWidget(symbol),
                node: symbol,
            };
            viewItems.unshift(newItem);
            symbol.parent = content.node;
            symbol.setSiblingIndex(0);
            curHeight += this.calculateHeight(newItem) + this.spacing;
        }
    }
}