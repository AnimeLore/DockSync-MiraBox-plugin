/// <reference path="../utils/common.js" />
/// <reference path="../utils/action.js" />

// $local 是否国际化
// $back 是否自行决定回显时机
// $dom 获取文档元素 - 不是动态的都写在这里面
const $local = true, $back = false, $dom = {
    main: $('.sdpi-wrapper'),
	step: $('.volumestep')
};

const $propEvent = {
    didReceiveGlobalSettings({ settings }) {
		
    },
    didReceiveSettings(data) {
		console.log($settings);
		if ($settings.step) {
			$dom.step.value = $settings.step
			$('#rangeText').textContent = $settings.step+`%`;
			$websocket.sendToPlugin({"step": $dom.step.value });
			console.log($dom.step.value)
		} else {
			$('#rangeText').textContent = $dom.step.value+`%`;
		}
    },
    sendToPropertyInspector(data) {
    }
};


$dom.step.on("input", () => {
	$settings.step = $dom.step.value;
	console.log($settings);
	console.log($websocket);
	$websocket.sendToPlugin({"step": $dom.step.value });
	let getValRange = $dom.step.value;
	  console.log(getValRange);
      $('#rangeText').textContent = getValRange + '%';
});


