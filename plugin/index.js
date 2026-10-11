const { Plugins, Actions, log, EventEmitter, WebSocketHandler } = require('./utils/plugin');
const { execSync } = require('child_process');

const plugin = new Plugins('DockSync');
let glsettings = {};
const progressAtlas = {};
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

function recalcProgressAtlas(atlas, row) {
	try {
	if (atlas[row] && Object.keys(atlas[row]).length > 0) {
		let sorted_atlas = Object.keys(atlas[row]);
		sorted_atlas.sort();
		let counted = 1;
		// log.info(atlas);
		sorted_atlas.forEach((key) => {
			// log.info(typeof key);
			if (!(typeof key == undefined)) {
				key = parseInt(key);
				if(key > 0 && atlas[row][`${key-1}`]) {
							if(atlas[row][`${key+1}`]) {
								atlas[row][`${key}`]["type"] ="middle";
								atlas[row][`${key}`]["count"] = counted;
								counted++;
							} else {
								atlas[row][`${key}`]["type"] ="r_corner";
								atlas[row][`${key}`]["count"] = counted;
								counted = 2;
							}
						} else if(atlas[row][`${key+1}`]) {
							atlas[row][`${key}`]["type"] ="l_corner";
							atlas[row][`${key}`]["count"] = 1;
							counted++;
						} else {
							atlas[row][`${key}`]["type"] ="solo";
							atlas[row][`${key}`]["count"] = -1;
							counted = 1;
						}
				}
		})
	} else {
		atlas[row][Object.keys(atlas[row])[0]].type = "solo";
		atlas[row][Object.keys(atlas[row])[0]].count = -1;
	}
	} catch(err) {
		// log.info("roflan")
	}
}
function generateProgressSvg(type, percent, row) {
	parts = Object.keys(progressAtlas[row]).length || 1;
	// СДЕЛАТЬ МИДЛ ДЛЯ РАЗНОЙ ДЛИНЫ;
	const keys = {
		"solo" : (percentage, parts) => `data:image/svg+xml;charset=utf8,<svg width="144" height="144" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="3" y="12" width="${Math.round(27 * percentage)}" height="8" rx="0.5" fill="#BABABA"/>
<rect x="2.5" y="11.5" width="27" height="9" rx="2.5" stroke="white"/>
</svg>`,
	"l_corner" : (percentage, parts) => `data:image/svg+xml;charset=utf8,<svg width="144" height="144" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="3" y="12" width="${Math.round(29 * [percentage * parts, 1][+ (percentage > (1 / parts))])}" height="8" rx="0.5" fill="#BABABA"/>
<rect x="3" y="11.5" width="32" height="9" rx="2.5" stroke="white"/>
</svg>
`,
"r_corner" : (percentage, parts) => `data:image/svg+xml;charset=utf8,<svg width="144" height="144" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="12" width="${Math.round(29 * [0, (percentage - ((1 / parts)* (parts-1)))*parts][+ (percentage > (1 / parts) * (parts - 1))])}" height="8" rx="0.5" fill="#BABABA"/>
<rect x="-3" y="11.5" width="32" height="9" rx="2.5" stroke="white"/>
</svg>
`,
"middle" : (percentage, parts) => `data:image/svg+xml;charset=utf8,<svg width="144" height="144" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="0" y="12" width="${Math.round(32 * [0, (percentage - (1 / parts))*parts][+ (percentage > (1 / parts))])}" height="8" rx="0.5" fill="#BABABA"/>
<rect x="-3" y="11.5" width="38" height="9" rx="2.5" stroke="white"/>
</svg>
`
	}
	return keys[type](percent, parts);
}
function generateSvg(key, state) {
	const keys = {
		"empty": (state_color) => `data:image/svg+xml;charset=utf8,<svg width="144" height="144" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"></svg>
`,
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
</svg>`,
"globalVibe": (state_color) => `data:image/svg+xml;charset=utf8, <svg width="144" height="144" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<style type="text/css">
	.st0{fill:none;stroke:${state_color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
	.st1{fill:none;stroke:${state_color};stroke-width:2;stroke-linejoin:round;stroke-miterlimit:10;}
</style>
<line class="st1" x1="4" y1="14" x2="4" y2="18"/>
<line class="st1" x1="8" y1="12" x2="8" y2="20"/>
<line class="st1" x1="12" y1="7" x2="12" y2="25"/>
<line class="st1" x1="16" y1="14" x2="16" y2="18"/>
<line class="st1" x1="20" y1="10" x2="20" y2="22"/>
<line class="st1" x1="24" y1="7" x2="24" y2="25"/>
<line class="st1" x1="28" y1="14" x2="28" y2="18"/>
</svg>`,
"trackVibe": (state_color) => `data:image/svg+xml;charset=utf8, <svg width="144" height="144" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
	<path d="M6 20.125V22.625" stroke="${state_color}" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M8.5 18.875V23.875" stroke="${state_color}" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M11 15.75V27" stroke="${state_color}" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M13.5 20.125V22.625" stroke="${state_color}" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M16 17.625V25.125" stroke="${state_color}" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18.5 15.75V27" stroke="${state_color}" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M21 20.125V22.625" stroke="${state_color}" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M23.3333 12.75C24.2538 12.75 25 12.1904 25 11.5C25 10.8096 24.2538 10.25 23.3333 10.25C22.4129 10.25 21.6667 10.8096 21.6667 11.5C21.6667 12.1904 22.4129 12.75 23.3333 12.75Z" stroke="${state_color}" stroke-miterlimit="10" stroke-linejoin="round"/>
<path d="M16.6667 14C17.5871 14 18.3333 13.4404 18.3333 12.75C18.3333 12.0596 17.5871 11.5 16.6667 11.5C15.7462 11.5 15 12.0596 15 12.75C15 13.4404 15.7462 14 16.6667 14Z" stroke="${state_color}" stroke-miterlimit="10" stroke-linejoin="round"/>
<path d="M18.3333 12.75V5.25L25 4V11.5" stroke="${state_color}" stroke-miterlimit="10" stroke-linejoin="round"/>
</svg>
`,
"next_time": (state_color) =>`data:image/svg+xml;charset=utf8, <svg width="144" height="144" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<style type="text/css">
	.st0{fill:none;stroke:${state_color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
</style>
<circle class="st0" cx="16" cy="16" r="13"/>
<polyline class="st0" points="14,11.8 18.2,16 14,20.2 "/>
</svg>
`,
"prev_time": (state_color) =>`data:image/svg+xml;charset=utf8, <svg width="144" height="144" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<style type="text/css">
	.st0{fill:none;stroke:${state_color};stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}
</style>
<circle class="st0" cx="16" cy="16" r="13"/>
<polyline class="st0" points="18,20.2 13.8,16 18,11.8 "/>
</svg>
`,
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

plugin.progress = new Actions({
	default: {
    },
    async _willAppear({ context, payload }) {
		if(!progressAtlas[payload.coordinates.row]) {
			progressAtlas[payload.coordinates.row] = {};
		}
		this.default[context] = {"column": payload.coordinates.column, "row":payload.coordinates.row}
		progressAtlas[payload.coordinates.row][payload.coordinates.column] = {"type" : "solo", "count" :  -1};
		timers[context] = setInterval(async () => {
			// plugin.setTitle(context, `[${this.default[context].row}, ${this.default[context].column}]`)
			let response_start = await WebSocketHandler_var.getCurrentTime();
			let response_end = await WebSocketHandler_var.getEndTime();
				try {
					recalcProgressAtlas(progressAtlas, payload.coordinates.row);
					plugin.setImage(context, generateProgressSvg(progressAtlas[payload.coordinates.row][payload.coordinates.column].type, response_start / response_end, payload.coordinates.row));
					// log.info(progressAtlas);
					// log.info(response_start / response_end, " /// ", Object.keys(progressAtlas[payload.coordinates.row]).length);
				} catch(err) {
					log.info("error with progress bro");
					log.info(err);
				}
		}, 500);
    },
	
    _willDisappear({ context }) {
		timers[context] && clearInterval(timers[context]);
		// log.info(`_willDisappear ${this.default[context].column}`);
		delete progressAtlas[this.default[context].row][this.default[context].column];
		if(Object.keys(progressAtlas[this.default[context].row]).length == 0) {
			delete progressAtlas[this.default[context].row];
		}
		recalcProgressAtlas(progressAtlas, this.default[context].row);
    },
    _propertyInspectorDidAppear({ context }) {
    },
    sendToPlugin({ payload, context }) {
    },
    keyUp({ context, payload }) {
		
    },
    dialDown({ context, payload }) {

	},
    dialRotate({ context, payload }) {
	}
});
plugin.timeup = new Actions({
	default: {
    },
    async _willAppear({ context, payload }) {
		plugin.setImage(context, generateSvg("next_time", "normal"));
    },
	
    _willDisappear({ context }) {
    },
    _propertyInspectorDidAppear({ context }) {
    },
    sendToPlugin({ payload, context }) {
    },
    keyUp({ context, payload }) {
		this.default.step = payload.settings.step || 15;
		let stepComputed = this.default.step;
		WebSocketHandler_var.broadcast({ request: 'time', message: stepComputed, how: 1 });
    },
    dialDown({ context, payload }) {

	},
    dialRotate({ context, payload }) {
	}
});
plugin.timedown = new Actions({
	default: {
    },
    async _willAppear({ context, payload }) {
		plugin.setImage(context, generateSvg("prev_time", "normal"));
    },
	
    _willDisappear({ context }) {
    },
    _propertyInspectorDidAppear({ context }) {
    },
    sendToPlugin({ payload, context }) {
    },
    keyUp({ context, payload }) {
		this.default.step = payload.settings.step || 15;
		let stepComputed = this.default.step;
		WebSocketHandler_var.broadcast({ request: 'time', message: stepComputed, how: 0 });
    },
    dialDown({ context, payload }) {

	},
    dialRotate({ context, payload }) {
	}
});
plugin.endtime = new Actions({
	default: {
    },
    async _willAppear({ context, payload }) {
		timers[context] = setInterval(async () => {
			let response = await WebSocketHandler_var.getEndTime();
				try {
					plugin.setImage(context, generateSvg("empty", "active"));
					plugin.setTitle(context, `${String(Math.floor(response / 60)).padStart(2,'0')}:${String(response % 60).padStart(2,'0')}`);
				} catch(err) {
					log.info("error with image endtime bro");
					log.info(err);
					log.info(response);
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
		
    },
    dialDown({ context, payload }) {

	},
    dialRotate({ context, payload }) {
	}
});
plugin.timeknob = new Actions({
    default: {
    },
    async _willAppear({ context, payload }) {
		plugin.setImage(context, generateSvg("next_time", "active"));
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
		
	},
    dialRotate({ context, payload }) {
		log.info(context, payload.settings.step);
		this.default.step = payload.settings.step || 15;
		let stepComputed = this.default.step*payload.ticks;
		let timeHow = 1;
		if(stepComputed < 0) {
			stepComputed = -1 * stepComputed;
			timeHow = 0;
		}
		WebSocketHandler_var.broadcast({ request: 'time', message: stepComputed, how: timeHow });
	}
});
plugin.currenttime = new Actions({
	default: {
    },
    async _willAppear({ context, payload }) {
		timers[context] = setInterval(async () => {
			let response = await WebSocketHandler_var.getCurrentTime();
				try {
					plugin.setImage(context, generateSvg("empty", "active"));
					plugin.setTitle(context, `${String(Math.floor(response / 60)).padStart(2,'0')}:${String(response % 60).padStart(2,'0')}`);
				} catch(err) {
					log.info("error with image currenttime bro");
					log.info(err);
					log.info(response);
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
		
    },
    dialDown({ context, payload }) {

	},
    dialRotate({ context, payload }) {
	}
});
plugin.coverimg = new Actions({
	default: {
    },
    async _willAppear({ context, payload }) {
		timers[context] = setInterval(async () => {
			let response = await WebSocketHandler_var.getCoverImage();
				try {
					var http = require('http');
					http.get(response, (resp) => {
						resp.setEncoding('base64');
						body = "data:" + resp.headers["content-type"] + ";base64,";
						resp.on('data', (data) => { body += data});
						resp.on('end', () => {
							plugin.setImage(context, body);
						});
					}).on('error', (e) => {
						log.info(`Got error: ${e.message}`);
					});
				} catch(err) {
					log.info("error with image idk bro");
					log.info(err);
					log.info(response);
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
		
    },
    dialDown({ context, payload }) {

	},
    dialRotate({ context, payload }) {
	}
});
plugin.trackvibe = new Actions({
	default: {
    },
    async _willAppear({ context, payload }) {
		plugin.setImage(context, generateSvg("trackVibe", "normal"));
		timers[context] = setInterval(async () => {
			let response = await WebSocketHandler_var.getVibeStatus();
			if (response == 1) {
				plugin.setImage(context, generateSvg("trackVibe", "active"));
			} else {
				plugin.setImage(context, generateSvg("trackVibe", "inactive"));
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
			WebSocketHandler_var.broadcast({ request: 'trackVibeInteraction' });
    },
    dialDown({ context, payload }) {

	},
    dialRotate({ context, payload }) {
	}
});
plugin.vibe = new Actions({
	default: {
    },
    async _willAppear({ context, payload }) {
		plugin.setImage(context, generateSvg("globalVibe", "normal"));
		timers[context] = setInterval(async () => {
			let response = await WebSocketHandler_var.getVibeStatus();
			if (response == 1) {
				plugin.setImage(context, generateSvg("globalVibe", "active"));
			} else {
				plugin.setImage(context, generateSvg("globalVibe", "inactive"));
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
			WebSocketHandler_var.broadcast({ request: 'globalVibeInteraction' });
    },
    dialDown({ context, payload }) {

	},
    dialRotate({ context, payload }) {
	}
});
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

