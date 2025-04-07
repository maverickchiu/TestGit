import { _decorator, Button, Component, EditBox, instantiate, Label, math, Node, Prefab } from 'cc';
import { ReelController, ReelState } from './ReelController';
import { ReelSpinner } from './ReelSpinner';
import { IReelViewer } from './ReelController';
const { ccclass, property } = _decorator;

@ccclass('ControllerTest')  
export class ControllerTest extends Component implements IReelViewer {
    @property(ReelSpinner)
    spinner: ReelSpinner = null;
    @property(Prefab)
    prefab: Prefab = null;
    @property(Button)
    button: Button = null;
    @property(EditBox)
    editBox: EditBox = null;
    
    declare private reelController: ReelController;
    
    start() {
        this.button.node.on(Button.EventType.CLICK, this.onButtonClick, this);
        this.reelController = new ReelController(this, this.spinner, {
            reelStrips: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            speed: 300,
        });
    }

    getSymbolNode(symbol: number, type: number, node: Node): Node {
        if(!node) {
            node = instantiate(this.prefab);
        }
        node.getComponentInChildren(Label).string = symbol.toString();
        return node;
    }

    onButtonClick() {
        switch(this.reelController.State) {
            case ReelState.Idle:
                this.reelController.beginSpin();
                break;
            case ReelState.Spinning:
                const pass = parseInt(this.editBox.string);
                this.reelController.endSpin([11, 12, 13], pass);
                break;
        }
    }
}


