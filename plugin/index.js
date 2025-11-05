const { Plugins, Actions, log, EventEmitter, WebSocketHandler } = require('./utils/plugin');
const { execSync } = require('child_process');

const plugin = new Plugins('DockSync');
let glsettings = {};
plugin.didReceiveGlobalSettings = ({ payload: { settings } }) => {
    log.info('didReceiveGlobalSettings', settings);
	glsettings = settings;
};

const createSvg = (text) => `<svg width="144" height="144" xmlns="http://www.w3.org/2000/svg">
    <text x="72" y="120" font-family="Arial" font-weight="bold" font-size="36" fill="white" text-anchor="middle"
        stroke="black" stroke-width="2" paint-order="stroke">
        ${text}
    </text>
</svg>`;
function generateSvg(key, state) {
	const keys = {
		"shuffle": (state_color) => `data:image/svg+xml;charset=utf8,<svg version="1.1" height="144" width="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 32 32" xml:space="preserve">
<style type="text/css">
	.st0{fill:none;stroke:${state_color};stroke-width:2;stroke-linejoin:round;stroke-miterlimit:10;}
	.st1{fill:none;stroke:${state_color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
</style>
<polygon class="st1" points="22,20.6 22,25.4 25,23 "/>
<polygon class="st1" points="22,6.6 22,11.4 25,9 "/>
<path class="st1" d="M21,23c-3.9,0-7-3.1-7-7s-3.1-7-7-7"/>
<path class="st1" d="M14,16c0,3.9-3.1,7-7,7"/>
<path class="st1" d="M21,9c-2.1,0-3.9,0.9-5.2,2.3"/>
</svg>`,
	"repeat": (state_color) => `data:image/svg+xml;charset=utf8,<svg version="1.1" height="144" width="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 32 32" xml:space="preserve">
<style type="text/css">
	.st0{fill:none;stroke:${state_color};stroke-width:2;stroke-linejoin:round;stroke-miterlimit:10;}
	.st1{fill:none;stroke:${state_color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
</style>
<polygon class="st1" points="18,6.6 18,11.4 21,9 "/>
<path class="st1" d="M23.8,12.1c0.8,1.1,1.2,2.5,1.2,3.9v0c0,3.9-3.1,7-7,7h-4c-3.9,0-7-3.1-7-7v0c0-3.9,3.1-7,7-7h4"/>
</svg>`,
"repeat_one": (state_color) => `data:image/svg+xml;charset=utf8,<svg version="1.1" height="144" width="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 32 32" xml:space="preserve">
<style type="text/css">
	.st0{fill:none;stroke:${state_color};stroke-width:2;stroke-linejoin:round;stroke-miterlimit:10;}
	.st1{fill:none;stroke:${state_color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
	.st2{fill:${state_color};}
</style>
<polygon class="st1" points="18,6.6 18,11.4 21,9 "/>
<path class="st1" d="M23.8,12.1c0.8,1.1,1.2,2.5,1.2,3.9v0c0,3.9-3.1,7-7,7h-4c-3.9,0-7-3.1-7-7v0c0-3.9,3.1-7,7-7h4"/>
<text class="st2" xmlns="http://www.w3.org/2000/svg" x="11" y="19" font-family="Arial" font-weight="500" font-size="8" text-anchor="middle" stroke="none" stroke-width="2" paint-order="stroke">
        1
    </text>
</svg>`,
"like": (state_color) => `data:image/svg+xml;charset=utf8,<svg version="1.1" height="144" width="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 32 32" xml:space="preserve">
<style type="text/css">
	.st0{fill:none;stroke:${state_color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
</style>
<path class="st0" d="M27.3,7.7c-2.2-2.2-5.8-2.2-8,0L16,11l-3.3-3.3c-2.2-2.2-5.8-2.2-8,0s-2.2,5.8,0,8L8,19l8,8l8-8l3.3-3.3
	C29.6,13.5,29.6,9.9,27.3,7.7z"/>
</svg>`,
"like_on": (state_color) => `data:image/svg+xml;charset=utf8,<svg version="1.1" height="144" width="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 32 32" xml:space="preserve">
<style type="text/css">
	.st0{fill:${state_color};stroke:${state_color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
</style>
<path class="st0" d="M27.3,7.7c-2.2-2.2-5.8-2.2-8,0L16,11l-3.3-3.3c-2.2-2.2-5.8-2.2-8,0s-2.2,5.8,0,8L8,19l8,8l8-8l3.3-3.3
	C29.6,13.5,29.6,9.9,27.3,7.7z"/>
</svg>`,
"dislike": (state_color) => `data:image/svg+xml;charset=utf8, <svg width="144" height="144" viewBox="0 0 144 144" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M122.85 34.65C112.95 24.75 96.75 24.75 86.85 34.65L72 49.5L57.15 34.65C47.25 24.75 31.05 24.75 21.15 34.65C11.25 44.55 11.25 60.75 21.15 70.65L36 85.5L72 121.5L108 85.5L122.85 70.65C133.2 60.75 133.2 44.55 122.85 34.65Z" stroke="${state_color}" stroke-width="9" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<line x1="26.1317" y1="22.8683" x2="102.132" y2="98.8683" stroke="black" stroke-width="23"/>
<line x1="21.8284" y1="19.1716" x2="106.828" y2="104.172" stroke="${state_color}" stroke-width="9"/>
</svg>
`,
"pause": (state_color) => `data:image/svg+xml;charset=utf8, <svg version="1.1" width="144" height="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 32 32" xml:space="preserve">
<style type="text/css">
	.st0{fill:none;stroke:${state_color};stroke-width:2;stroke-linejoin:round;stroke-miterlimit:10;}
	.st1{fill:none;stroke:${state_color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
</style>
<rect x="9" y="9" class="st1" width="5" height="14"/>
<rect x="18" y="9" class="st1" width="5" height="14"/>
</svg>`
,
"play": (state_color) => `data:image/svg+xml;charset=utf8, <svg version="1.1" width="144" height="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 32 32" xml:space="preserve">
<style type="text/css">
	.st0{fill:none;stroke:${state_color};stroke-width:2;stroke-linejoin:round;stroke-miterlimit:10;}
	.st1{fill:none;stroke:${state_color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
</style>
<polygon class="st1" points="12,9 12,23 21,16 "/>
</svg>`,
"volume_down": (state_color) => `data:image/svg+xml;charset=utf8, <svg version="1.1" width="144" height="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 32 32" xml:space="preserve">
<style type="text/css">
	.st0{fill:none;stroke:${state_color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
	.st1{fill:none;stroke:${state_color};stroke-width:2;stroke-linejoin:round;stroke-miterlimit:10;}
</style>
<polyline class="st0" points="14,22 6,22 6,10 14,10 "/>
<polyline class="st0" points="14,10 26,3 26,29 14,22 "/>
</svg>`,
"volume_up": (state_color) => `data:image/svg+xml;charset=utf8, <svg version="1.1" width="144" height="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 32 32" xml:space="preserve">
<style type="text/css">
	.st0{fill:none;stroke:${state_color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
	.st1{fill:none;stroke:${state_color};stroke-width:2;stroke-linejoin:round;stroke-miterlimit:10;}
</style>
<polyline class="st0" points="10,21 3,21 3,11 10,11 "/>
<polyline class="st0" points="10,11 20,3.8 20,28.2 10,21 "/>
<g>
	<path class="st0" d="M26.4,22c1.6-1.5,2.6-3.6,2.6-6c0-2.4-1-4.5-2.6-6"/>
</g>
<g>
	<path class="st0" d="M24,18.6c0.7-0.7,1.2-1.6,1.2-2.6s-0.4-2-1.2-2.6"/>
</g>
</svg>`,
"next_track": (state_color) => `data:image/svg+xml;charset=utf8, <svg version="1.1" width="144" height="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 32 32" xml:space="preserve">
<style type="text/css">
	.st0{fill:none;stroke:${state_color};stroke-width:2;stroke-linejoin:round;stroke-miterlimit:10;}
	.st1{fill:none;stroke:${state_color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
</style>
<polygon class="st1" points="17,9 17,23 26,16 "/>
<polygon class="st1" points="8,9 8,23 17,16 "/>
</svg>`,
"prev_track": (state_color) => `data:image/svg+xml;charset=utf8, <svg version="1.1" width="144" height="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 32 32" xml:space="preserve">
<style type="text/css">
	.st0{fill:none;stroke:${state_color};stroke-width:2;stroke-linejoin:round;stroke-miterlimit:10;}
	.st1{fill:none;stroke:${state_color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
</style>
<polygon class="st1" points="15,23 15,9 6,16 "/>
<polygon class="st1" points="24,23 24,9 15,16 "/>
</svg>`,
"mute": (state_color) => `data:image/svg+xml;charset=utf8, <svg version="1.1" width="144" height="144" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
	 viewBox="0 0 32 32" xml:space="preserve">
<style type="text/css">
	.st0{fill:none;stroke:${state_color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
	.st1{fill:none;stroke:${state_color};stroke-width:2;stroke-linejoin:round;stroke-miterlimit:10;}
</style>
<line class="st0" x1="3" y1="3" x2="29" y2="29"/>
<polyline class="st0" points="14,22 6,22 6,10 14,10 "/>
<polyline class="st0" points="14,10 26,3 26,29 14,22 "/>
</svg>`


}

	const states = {
		"active": "#77dd77",
		"inactive": "#db5856",
		"normal": "#ffffff"
	}
	return keys[key](states[state]);
}
const timers = {};
const WebSocketHandler_var = new WebSocketHandler();
WebSocketHandler_var.updateStart();
plugin.mute = new Actions({
	default: {
    },
    async _willAppear({ context, payload }) {
		plugin.setImage(context, generateSvg("mute", "normal"));
    },
	
    _willDisappear({ context }) {
    },
    _propertyInspectorDidAppear({ context }) {
    },
    sendToPlugin({ payload, context }) {
    },
    keyUp({ context, payload }) {
			WebSocketHandler_var.broadcast({ request: 'muteInteraction' });
    },
    dialDown({ context, payload }) {

	},
    dialRotate({ context, payload }) {
	}
});
plugin.prev = new Actions({
	default: {
    },
    async _willAppear({ context, payload }) {
		plugin.setImage(context, generateSvg("prev_track", "normal"));
    },
	
    _willDisappear({ context }) {
    },
    _propertyInspectorDidAppear({ context }) {
    },
    sendToPlugin({ payload, context }) {
    },
    keyUp({ context, payload }) {
			WebSocketHandler_var.broadcast({ request: 'track', message: -1 });
    },
    dialDown({ context, payload }) {

	},
    dialRotate({ context, payload }) {
	}
});
plugin.next = new Actions({
	default: {
    },
    async _willAppear({ context, payload }) {
		plugin.setImage(context, generateSvg("next_track", "normal"));
    },
	
    _willDisappear({ context }) {
    },
    _propertyInspectorDidAppear({ context }) {
    },
    sendToPlugin({ payload, context }) {
    },
    keyUp({ context, payload }) {
			WebSocketHandler_var.broadcast({ request: 'track', message: 1 });
    },
    dialDown({ context, payload }) {

	},
    dialRotate({ context, payload }) {
	}
});
plugin.volumeup = new Actions({
	default: {
    },
    async _willAppear({ context, payload }) {
		plugin.setImage(context, generateSvg("volume_up", "normal"));
    },
	
    _willDisappear({ context }) {
    },
    _propertyInspectorDidAppear({ context }) {
    },
    sendToPlugin({ payload, context }) {
    },
    keyUp({ context, payload }) {
		this.default.step = payload.settings.step || 20;
		let stepComputed = this.default.step/100;
		WebSocketHandler_var.broadcast({ request: 'volume', message: stepComputed, how: 1 });
    },
    dialDown({ context, payload }) {

	},
    dialRotate({ context, payload }) {
	}
});
plugin.volumedown = new Actions({
	default: {
    },
    async _willAppear({ context, payload }) {
		plugin.setImage(context, generateSvg("volume_down", "normal"));
    },
	
    _willDisappear({ context }) {
    },
    _propertyInspectorDidAppear({ context }) {
    },
    sendToPlugin({ payload, context }) {
    },
    keyUp({ context, payload }) {
		this.default.step = payload.settings.step || 20;
		let stepComputed = this.default.step/100;
		WebSocketHandler_var.broadcast({ request: 'volume', message: stepComputed, how: 2 });
    },
    dialDown({ context, payload }) {

	},
    dialRotate({ context, payload }) {
	}
});
plugin.pauseplay = new Actions({
    default: {
    },
    async _willAppear({ context, payload }) {
        plugin.setImage(context, generateSvg("pause", "normal"));
		timers[context] = setInterval(async () => {
			let response = await WebSocketHandler_var.getPlayingStatus();
			if (response == 1) {
				plugin.setImage(context, generateSvg("play", "normal"));
			} else {
				plugin.setImage(context, generateSvg("pause", "normal"));
			}
		}, 500);
    },
    _willDisappear({ context }) {
		timers[context] && clearInterval(timers[context]);
    },
    _propertyInspectorDidAppear({ context }) {
    },
    sendToPlugin({ payload, context }) {
    },
    keyUp({ context, payload }) {
		log.info("yeah");
		WebSocketHandler_var.broadcast({ request: 'playerInteraction' });
    },
    dialDown({ context, payload }) {},
    dialRotate({ context, payload }) {}
});
plugin.dislike = new Actions({
    default: {
    },
    async _willAppear({ context, payload }) {
        plugin.setImage(context, generateSvg("dislike", "normal"));
    },
    _willDisappear({ context }) {
    },
    _propertyInspectorDidAppear({ context }) {
    },
    sendToPlugin({ payload, context }) {
    },
    keyUp({ context, payload }) {
		log.info("yeah");
		WebSocketHandler_var.broadcast({ request: 'dislikeInteraction' });
    },
    dialDown({ context, payload }) {},
    dialRotate({ context, payload }) {}
});
plugin.like = new Actions({
    default: {
    },
    async _willAppear({ context, payload }) {
        plugin.setImage(context, generateSvg("like", "normal"));
		timers[context] = setInterval(async () => {
			let response = await WebSocketHandler_var.getLikeStatus();
			if (response == 1) {
				plugin.setImage(context, generateSvg("like_on", "active"));
			} else {
				plugin.setImage(context, generateSvg("like", "inactive"));
			}
		}, 500);
    },
    _willDisappear({ context }) {
		timers[context] && clearInterval(timers[context]);
    },
    _propertyInspectorDidAppear({ context }) {
    },
    sendToPlugin({ payload, context }) {
    },
    keyUp({ context, payload }) {
		log.info("yeah");
		WebSocketHandler_var.broadcast({ request: 'likeInteraction' });
    },
    dialDown({ context, payload }) {},
    dialRotate({ context, payload }) {}
});
plugin.repeat = new Actions({
    default: {
    },
    async _willAppear({ context, payload }) {
        plugin.setImage(context, generateSvg("repeat", "normal"))
		timers[context] = setInterval(async () => {
			let response = await WebSocketHandler_var.getRepeatStatus();
			switch(response) {
				case 1:
					plugin.setImage(context, generateSvg("repeat", "active"));
					break;
				case 2:
					plugin.setImage(context, generateSvg("repeat_one", "active"));
					break;
				case 0:
					plugin.setImage(context, generateSvg("repeat", "inactive"));
					break;
					
			}
		}, 500);
    },
    _willDisappear({ context }) {
		timers[context] && clearInterval(timers[context]);
    },
    _propertyInspectorDidAppear({ context }) {
    },
    sendToPlugin({ payload, context }) {
    },
    keyUp({ context, payload }) {
		log.info("yeah");
		WebSocketHandler_var.broadcast({ request: 'repeatInteraction' });
    },
    dialDown({ context, payload }) {},
    dialRotate({ context, payload }) {}
});
plugin.shuffle = new Actions({
    default: {
    },
    async _willAppear({ context, payload }) {
        plugin.setImage(context, generateSvg("shuffle", "normal"))
		timers[context] = setInterval(async () => {
			let response = await WebSocketHandler_var.getShuffleStatus();
			if (response == 1) {
				plugin.setImage(context, generateSvg("shuffle", "active"));
			} else {
				plugin.setImage(context, generateSvg("shuffle", "inactive"));
			}
		}, 500);
    },
    _willDisappear({ context }) {
		timers[context] && clearInterval(timers[context]);
    },
    _propertyInspectorDidAppear({ context }) {
    },
    sendToPlugin({ payload, context }) {
    },
    keyUp({ context, payload }) {
		log.info("yeah");
		WebSocketHandler_var.broadcast({ request: 'shuffleInteraction' });
    },
    dialDown({ context, payload }) {},
    dialRotate({ context, payload }) {}
});

plugin.trackknob = new Actions({
	default: {
    },
    async _willAppear({ context, payload }) {
		plugin.setImage(context, generateSvg("pause", "active"));
    },
	
    _willDisappear({ context }) {
    },
    _propertyInspectorDidAppear({ context }) {
    },
    sendToPlugin({ payload, context }) {
    },
    keyUp({ context, payload }) {
    },
    dialDown({ context, payload }) {
		WebSocketHandler_var.broadcast({ request: 'playerInteraction'});
	},
    dialRotate({ context, payload }) {
		if(payload.ticks < 0) {
			WebSocketHandler_var.broadcast({ request: 'track', message: -1 });
		} else {
			WebSocketHandler_var.broadcast({ request: 'track', message: 1 });
		}
		
	}
});
	
plugin.volumeknob = new Actions({
    default: {
    },
    async _willAppear({ context, payload }) {
		plugin.setImage(context, generateSvg("volume_down", "active"));
    },
	
    _willDisappear({ context }) {
    },
    _propertyInspectorDidAppear({ context }) {
    },
    sendToPlugin({ payload, context }) {
    },
    keyUp({ context, payload }) {
    },
    dialDown({ context, payload }) {
		WebSocketHandler_var.broadcast({ request: 'muteInteraction' });
	},
    dialRotate({ context, payload }) {
		log.info(context, payload.settings.step);
		this.default.step = payload.settings.step || 20;
		let stepComputed = (this.default.step*payload.ticks)/100;
		let volumeHow = 1;
		if(stepComputed < 0) {
			stepComputed = -1 * stepComputed;
			volumeHow = 2;
		}
		WebSocketHandler_var.broadcast({ request: 'volume', message: stepComputed, how: volumeHow });
	}
});

