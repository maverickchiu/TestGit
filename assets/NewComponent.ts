import { _decorator, Button, Component, Node, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NewComponent')
export class NewComponent extends Component {
    @property(Button)
    buttonConnect: Button = null;
    @property(Button)
    buttonTestScheme: Button = null;
    @property(Button)
    buttonJoinRoom: Button = null;

    ws: WebSocket = null;

    getQueryParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const queryArray = queryString.split("&");
        
        queryArray.forEach(param => {
            const [key, value] = param.split("=");
            params[decodeURIComponent(key)] = decodeURIComponent(value || "");
        });
    
        return params;
    }

    start() {
        this.buttonConnect.node.on('click', () => {
            this.ws = new WebSocket('ws://localhost:2233');

            this.ws.onopen = () => {
                console.log('Connected');
            };
    
            this.ws.onmessage = (event) => {
                // 收到訊息
                console.log('Received:', event.data);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        });

        const urlParams = this.getQueryParams();
        console.log(urlParams); // { param1: "value1", param2: "value2" }

        this.buttonTestScheme.node.on('click', this.onButtonTestSchemeClick, this);

        this.buttonJoinRoom.node.on('click', () => {
            const obj = {
                commandType: 53,
                content: {
                    JoinAutoRoomReq: {
                        betType: 0,
                    }
                }
            };

            const jsonStr = JSON.stringify(obj);
            this.ws.send(jsonStr);
        });
    }

    onButtonTestSchemeClick() {
        const obj = {
            commandType: 13,
            content: {
                bet: 100,
            }
        };
        
        const jsonStr = JSON.stringify(obj);
        this.ws.send(jsonStr);
    }
}


