import { _decorator, assert, Component, Layout, Node, UITransform, Widget } from 'cc';
const { ccclass, property } = _decorator;

export interface ISymbolProvider {
    getSymbolType(index: number): number;
    getSymbolNode(index: number, type: number, node: Node): Node;

    onHitTop?(): void;
    onHitBottom?(): void;
}

interface IViewItem {
    index: number;
    type: number;
    trans: UITransform;
    node: Node;
}

@ccclass('ReelSpinner')
export class ReelSpinner extends Component {
    @property(Widget)
    private content: Widget = null;

    declare private viewItems: IViewItem[];
    declare private provider: ISymbolProvider;
    declare private pool: Map<number, Node[]>;
    declare private spacing: number;
    declare private speed: number;

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

    protected onLoad(): void {
        this.content.isAlignTop = false;
        this.content.isAlignBottom = true;
        this.viewItems = [];
        this.pool = new Map<number, Node[]>();
        this.spacing = this.content.getComponent(Layout).spacingY;
    }

    init(provider: ISymbolProvider) {
        this.provider = provider;
        this.initSymbol();
        this.content.bottom = 0;
    }

    private initSymbol() {
        this.fillUpperSymbols(this.content);
    }

    protected update(dt: number): void {
        const offset = this.speed * dt;
        if(isNaN(offset))
            return;
        this.move(offset);
    }

    private move(offset: number) {
        assert(this.provider !== undefined, 'provider is not set');
        
        const content = this.content;
        content.bottom += offset;
        if(offset > 0) {
            // 向上
            if(content.bottom >= 0) {
                const firstItem = this.viewItems[0];
                this.recycleSymbol(firstItem.node, firstItem.type);
                this.viewItems.shift();

                const fillHeight = this.fillLowerSymbols(content);
                this.content.getComponent(Layout).updateLayout();
                content.bottom -= fillHeight;

                this.provider.onHitTop?.();
            }
        } else {
            // 向下
            const viewItems = this.viewItems;
            const lastItem = viewItems[viewItems.length - 1];
            const trans = lastItem.trans;
            if(content.bottom <= -(trans.height + this.spacing)) {
                // 销毁最上面的Symbol 之後使用pool
                this.recycleSymbol(lastItem.node, lastItem.type);
                viewItems.pop();

                this.fillUpperSymbols(content);
                
                this.content.getComponent(Layout).updateLayout();
                content.bottom += trans.height + this.spacing;

                this.provider.onHitBottom?.();
            }
        }
    }

    private getSymbol(index: number, type: number){
        let nodes = this.pool.get(type);
        if(!nodes){
            nodes = [];
            this.pool.set(type, nodes);
        }
        const node = nodes.pop();
        return this.provider.getSymbolNode(index, type, node);
    }

    private recycleSymbol(node: Node, type: number) {
        node.parent = null;
        const nodes = this.pool.get(type);
        nodes.push(node);
    }

    private fillLowerSymbols(content: Widget){
        const viewTrans = this.getComponent(UITransform);
        const height = viewTrans.height * 2;

        const contentNode = content.node;
        const viewItems = this.viewItems;
        let curHeight = 0;
        for (const item of viewItems) {
            curHeight += item.trans.height;
        }
        curHeight += Math.max(0,this.spacing * (viewItems.length - 1));

        let fillHeight = 0;
        while(curHeight <= height){
            // 生成新的Symbol放在最下面
            const nowMinIndex = viewItems[viewItems.length - 1]?.index ?? 0;
            const newIndex = nowMinIndex - 1;
            const type = this.provider.getSymbolType(newIndex);
            const symbol = this.getSymbol(newIndex, type);
            const newItem = {
                index: newIndex,
                type: type,
                trans: symbol.getComponent(UITransform),
                node: symbol,
            };
            viewItems.push(newItem);

            symbol.parent = contentNode;
            symbol.setSiblingIndex(viewItems.length - 1);
            curHeight += newItem.trans.height + this.spacing;
            fillHeight += newItem.trans.height + this.spacing;
        }

        return fillHeight;
    }

    private fillUpperSymbols(content: Widget){
        const viewTrans = this.getComponent(UITransform);
        const height = viewTrans.height * 2;

        const viewItems = this.viewItems;
        let curHeight = 0;
        for (const item of viewItems) {
            curHeight += item.trans.height;
        }
        curHeight += Math.max(0,this.spacing * (viewItems.length - 1));

        while(curHeight <= height){
            // 生成新的Symbol放在最上面
            const nowMaxIndex = viewItems[0]?.index;
            const newIndex = nowMaxIndex !== undefined ? nowMaxIndex + 1 : 0;
            const type = this.provider.getSymbolType(newIndex);
            const symbol = this.getSymbol(newIndex, type);
            const newItem = {
                index: newIndex,
                type: type,
                trans: symbol.getComponent(UITransform),
                node: symbol,
            };
            viewItems.unshift(newItem);
            symbol.parent = content.node;
            symbol.setSiblingIndex(0);
            curHeight += newItem.trans.height + this.spacing;
        }
    }
}