// 配置日志文件
const now = new Date();
const log = require('log4js').configure({
    appenders: {
        file: { type: 'file', filename: `./log/${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}.log` }
    },
    categories: {
        default: { appenders: ['file'], level: 'info' }
    }
}).getLogger();

//##################################################
//##################全局异常捕获#####################
process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
});
process.on('unhandledRejection', (reason) => {
    log.error('Unhandled Rejection:', reason);
});
//##################################################
//##################################################


// 插件类

const ws = require('ws');
class Plugins {
    static language = JSON.parse(process.argv[9]).application.language;
    static globalSettings = {};
    getGlobalSettingsFlag = true;
    constructor() {
        if (Plugins.instance) {
            return Plugins.instance;
        }
        // log.info("process.argv", process.argv);
        this.ws = new ws("ws://127.0.0.1:" + process.argv[3]);
        this.ws.on('open', () => this.ws.send(JSON.stringify({ uuid: process.argv[5], event: process.argv[7] })));
        this.ws.on('close', process.exit);
        this.ws.on('message', e => {
            if (this.getGlobalSettingsFlag) {
                // 只获取一次
                this.getGlobalSettingsFlag = false;
                this.getGlobalSettings();
            }
            const data = JSON.parse(e.toString());
            const action = data.action?.split('.').pop();
            this[action]?.[data.event]?.(data);
            if (data.event === 'didReceiveGlobalSettings') {
                Plugins.globalSettings = data.payload.settings;
            }
            this[data.event]?.(data);
        });
        Plugins.instance = this;
    }

    setGlobalSettings(payload) {
        Plugins.globalSettings = payload;
        this.ws.send(JSON.stringify({
            event: "setGlobalSettings",
            context: process.argv[5], payload
        }));
    }

    getGlobalSettings() {
        this.ws.send(JSON.stringify({
            event: "getGlobalSettings",
            context: process.argv[5],
        }));
    }
    // 设置标题
    setTitle(context, str, row = 0, num = 6) {
        let newStr = null;
        if (row && str) {
            let nowRow = 1, strArr = str.split('');
            strArr.forEach((item, index) => {
                if (nowRow < row && index >= nowRow * num) { nowRow++; newStr += '\n'; }
                if (nowRow <= row && index < nowRow * num) { newStr += item; }
            });
            if (strArr.length > row * num) { newStr = newStr.substring(0, newStr.length - 1); newStr += '..'; }
        }
        this.ws.send(JSON.stringify({
            event: "setTitle",
            context, payload: {
                target: 0,
                title: newStr || str + ''
            }
        }));
    }
    // 设置背景
    setImage(context, url) {
        this.ws.send(JSON.stringify({
            event: "setImage",
            context, payload: {
                target: 0,
                image: url
            }
        }));
    }
    // 设置状态
    setState(context, state) {
        this.ws.send(JSON.stringify({
            event: "setState",
            context, payload: { state }
        }));
    }
    // 保存持久化数据
    setSettings(context, payload) {
        this.ws.send(JSON.stringify({
            event: "setSettings",
            context, payload
        }));
    }
	
	 getSettings(context, payload) {
        this.ws.send(JSON.stringify({
            event: "getSettings",
            context
        }));
    }

    // 在按键上展示警告
    showAlert(context) {
        this.ws.send(JSON.stringify({
            event: "showAlert",
            context
        }));
    }

    // 在按键上展示成功
    showOk(context) {
        this.ws.send(JSON.stringify({
            event: "showOk",
            context
        }));
    }
    // 发送给属性检测器
    sendToPropertyInspector(payload) {
        this.ws.send(JSON.stringify({
            action: Actions.currentAction,
            context: Actions.currentContext,
            payload, event: "sendToPropertyInspector"
        }));
    }
    // 用默认浏览器打开网页
    openUrl(url) {
        this.ws.send(JSON.stringify({
            event: "openUrl",
            payload: { url }
        }));
    }
};

// 操作类
class Actions {
    constructor(data) {
        this.data = {};
        this.default = {};
        Object.assign(this, data);
    }
    // 属性检查器显示时
    static currentAction = null;
    static currentContext = null;
    static actions = {};
    propertyInspectorDidAppear(data) {
        Actions.currentAction = data.action;
        Actions.currentContext = data.context;
        this._propertyInspectorDidAppear?.(data);
    }
    // 初始化数据
    willAppear(data) {
        Plugins.globalContext = data.context;
        Actions.actions[data.context] = data.action
        const { context, payload: { settings } } = data;
        this.data[context] = Object.assign({ ...this.default }, settings);
        this._willAppear?.(data);
    }

    didReceiveSettings(data) {
        this.data[data.context] = data.payload.settings;
        this._didReceiveSettings?.(data);
    }
    // 行动销毁
    willDisappear(data) {
        this._willDisappear?.(data);
        delete this.data[data.context];
    }
}

class EventEmitter {
    constructor() {
        this.events = {};
    }

    // 订阅事件
    subscribe(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    // 取消订阅
    unsubscribe(event, listenerToRemove) {
        if (!this.events[event]) return;

        this.events[event] = this.events[event].filter(listener => listener !== listenerToRemove);
    }

    // 发布事件
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(listener => listener(data));
    }
}

class WebSocketHandler {
	constructor() {
		this.clients = new Set();
		this.shuffleStatus = 0;
		this.repeatStatus = 0;
		this.likeStatus = 0;
		this.playingStatus = 0;
        this.websocketserver = new ws.Server({ port: 8765 });
		this.websocketserver.on('connection', (wso) => {
				this.clients.add(wso);
				
				wso.send(JSON.stringify({ request: 'device', message: 1 }));

				wso.on('close', () => {
					this.clients.delete(wso);
				});
				wso.on('message', (e) => {
			const message = JSON.parse(e.toString());
			switch(message.request) {
				case "shuffleState":
					this.shuffleStatus = message.response;
					break;
				case "repeatState":
					this.repeatStatus = message.response;
					break;
				case "likeState":
					this.likeStatus = message.response;
					break;
				case "playingState":
					this.playingStatus = message.response;
					break;
			}
		});
			});

			this.websocketserver.on('error', (e) => {
				log.error(e);
			});
	}
	updateStart() {
		setInterval(async () => {
			this.broadcast({ request: 'repeatState' });
			this.broadcast({ request: 'shuffleState' });
			this.broadcast({ request: 'likeState' });
			this.broadcast({ request: 'playingState' });
		}, 300);
	}
	getPlayingStatus() {
		return this.playingStatus;
	}
	
	getShuffleStatus() {
		return this.shuffleStatus;
	}
	getRepeatStatus() {
		return this.repeatStatus;
	}
	getLikeStatus() {
		return this.likeStatus;
	}
	broadcast(message) {
		try {
			for (const client of this.clients) {
				client.send(JSON.stringify(message));
			}
		} catch (e) {
			log.error(e);
		}
	}
}


module.exports = {
    log,
    Plugins,
    Actions,
    EventEmitter,
	WebSocketHandler
};