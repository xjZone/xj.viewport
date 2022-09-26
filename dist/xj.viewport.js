/** xj.viewport(视窗属性设置) | V0.3.2 | Apache Licence 2.0 | 2015-2022 © XJ.Chen | https://github.com/xjZone/xj.viewport/ */
;(function(global, factory){
	if(typeof(define) === 'function' && (define.amd !== undefined || define.cmd !== undefined)){ define(factory) }
	else if(typeof(module) !== 'undefined' && typeof(exports) === 'object'){ module.exports = factory() }
	else{ global = (global||self), global.xj||(global.xj = {}), global.xj.viewport = factory() };
}(this, function(){ 'use strict';



// ---------------------------------------------------------------------------------------------
// globalThis | window | self | global
var pub_global = (typeof(globalThis) !== 'undefined' ? globalThis : typeof(window) !== 'undefined' ? window : typeof(self) !== 'undefined' ? self : global);

// public nothing, version, keyword
var pub_nothing = function(){}, pub_version = '0.3.2', pub_keyword = 'viewport';

// public config, advance set
var pub_config = {
	
	// meta[name="viewport"] 标签上有 xj-viewport="{}" 属性时，会解析该属性并自动执行 xj.viewport.set() 方法，如果该参数为 true 则不会自动执行，默认是 false
	manual : false,
	
	// 在 Android 的浏览器中，软键盘的存在会影响到窗口尺寸，在有软键盘时不能响应视窗的重置，但实际上我们并没有任何真正靠谱的方法来检测浏览器是否弹起了软键盘
	// 只能先查看当前聚焦的节点是否为可输入元素，如果 document.activeElement 是可输入的，还要检测 screen.height - window.innherHeight 的差值，差值大于 240px
	// 才算是弹起了软键盘，240px 是赌浏览器地址栏和工具栏高度小于 240px 而小键盘高度大于 240px，在绝大多数浏览器中该判断都是成立的，但 XJ 无法保证所有浏览器
	// 都符合这个判断，如果你在开发中真的遇到了某些特殊的情况，那么可针对这个特殊情况进行浏览器的判断，并修改这个参数来进行适应，这个参数默认是 240，单位 px
	betkbd : 240,
	
};

// public option(16 items)
var pub_option = {
	
	minWidth : 0,				// 设置视窗的最小宽度值，默认是 0 既不设置，当设备的宽度小于该参数时将通过设置 width 和 initial-scale 将设备宽度变得符合该值
	minHeight : 0,				// 设置视窗的最小高度值，默认是 0 既不设置，当设备的高度小于该参数时将通过设置 width 和 initial-scale 将设备高度变得符合该值
	
	width : 'auto',				// 设置 width 值，默认是 'auto'，当设置为数值的时候 initial-scale 会跟着变化，设置为 'device-width' 时，initial-scale 则总 1
	height : 'auto',			// 设置 height 值，默认是 'auto'，没有任何浏览器支持视窗的 height，所以实际上插件是通过 width 属性和设备宽高比来得到目标高度
	
	maxWidth : 'none',			// 设置视窗的最大宽度值，默认是 'none' 既不设置，当宽度大于该参数，将通过设置 width & initial-scale 来将设备宽度变得符合该值
	maxHeight : 'none',			// 设置视窗的最大高度值，默认是 'none' 既不设置，当高度大于该参数，将通过设置 width & initial-scale 来将设备高度变得符合该值
	
	onlyMobile : true,			// 是否只对移动端的 meta[name="viewport"] 标签进行设置，默认是 true，为 false 则 PC 端的 meta 标签也会被设置，但视窗不会变化
	fillScreen : false,			// 同时设置了最小宽高尺寸或最大宽高尺寸，如果窗口宽高值没到达极限，是否缩放到极限，默认是 false，这一般只用于 full page 项目
	delayReset : 500,			// Android 中部分浏览器如 UC 和 IOS 中部分浏览器如 WX，旋转后立即获取尺寸会出现错误，需要延迟响应，这是延迟时间，默认 500 ms
	
	initialScale : 'auto',		// 设置 initial-scale 值，可接受 0 - 10 之间的值，默认是 'auto'，'auto' 就是让插件自动计算，这个一般不用设置，让插件计算就行
	minimumScale : 'none',		// 设置 minimum-scale 值，可接受 0 - 10 之间的值，默认是 'none'，也就是不设置，如果为 'auto'，则使用跟 initialScale 一样的值
	maximumScale : 'none',		// 设置 maximum-scale 值，可接受 0 - 10 之间的值，默认是 'none'，也就是不设置，如果为 'auto'，则使用跟 initialScale 一样的值
	userScalable : 'none',		// 设置 user-scalable 值，备选项有 'yes', 'no' 两个值，默认 'none' 既不设置，IOS10+ 会忽略该参数和上面两个控制最大最小的参数
	
	targetDensitydpi : '',		// 设置 target-densitydpi 值，默认 '' 既不设置，备选项有 high-dpi, medium-dpi, low-dpi, device-dpi，该属性实际已废弃，可忽略
	viewportFit : '',			// 设置 viewport-fit 值，默认是 '' 既不设置，备选项有 auto, cover, contain，该参数主要是针对 iPhone X 这类刘海屏幕设备的环境
	resize : true,				// 当窗口的尺寸变化或翻转时，是否要重新计算 viewport 的 content 属性，默认是 true，为 true 时注意 userScalable 参数不能为 no
	
};



// ---------------------------------------------------------------------------------------------
// 如果已经存在了就直接返回目标对象
if(pub_global.xj === undefined){ pub_global.xj = {} };
if(pub_global.xj.viewportReturn === undefined){ pub_global.xj.viewportReturn = {} };
if(pub_global.xj.viewportReturn[pub_version] !== undefined){ return pub_global.xj.viewportReturn[pub_version] };



// 创建并合并 config 和 option 参数
if(pub_global.xj.viewportConfig === undefined){ pub_global.xj.viewportConfig = {} };
if(pub_global.xj.viewportOption === undefined){ pub_global.xj.viewportOption = {} };
if(pub_global.xj.viewportConfig[pub_version] !== undefined){ Object.keys(pub_global.xj.viewportConfig[pub_version]).forEach(function(key){ pub_config[key] = pub_global.xj.viewportConfig[pub_version][key] }) };
if(pub_global.xj.viewportOption[pub_version] !== undefined){ Object.keys(pub_global.xj.viewportOption[pub_version]).forEach(function(key){ pub_option[key] = pub_global.xj.viewportOption[pub_version][key] }) };



// 创建页面最顶层四个全局节点的变量
var pub_win = pub_global;
var pub_doc = pub_win.document;
var pub_html = pub_doc.documentElement;
var pub_body = pub_doc.body;



// meta 标签，移动端，是否 IOS 系统
var pub_element_meta = pub_doc.querySelector('meta[name="viewport"]');
var pub_is_mobile = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
var pub_is_ios = (pub_is_mobile && /Apple/i.test(navigator.vendor)) ? true : false;



// 初始化视窗，翻转或高度变小时需要
var pub_metaInitialize = function(){
	pub_element_meta.setAttribute('content', 'width=device-width,initial-scale=1');
};



// ---------------------------------------------------------------------------------------------
// 获取设备的方向，Safari(IOS) 在横屏的状态下 screen.width 和 screen.height 是颠倒的，根本不可靠
// 但弹起软键盘却并不会影响 html 的 client* 属性，而 window 的 inner* 属性翻转后可能出错，不能用
// Android 的 window 的 inner* 属性和 html 的 client* 属性会受软键盘影响，当软键盘弹起了就不可靠
// 但 screen.width 和 screen.height 属性不会受影响，并且不像 Safari(IOS)，不会横屏颠倒，可用这个
var pub_orientation = function(){
	if(pub_is_mobile === false){ return (pub_win.innerWidth > pub_win.innerHeight ? 'landscape' // PC
	: pub_win.innerWidth < pub_win.innerHeight ? 'portrait' : 'squared') }else 
	if(pub_is_ios === true){ return (pub_html.clientWidth > pub_html.clientHeight ? 'landscape' // IOS
	: pub_html.clientWidth < pub_html.clientHeight ? 'portrait' : 'squared') }
	else{ return ((screen.width > screen.height) ? 'landscape' 									// 安卓
	: screen.width < screen.height ? 'portrait' : 'squared') }
};



// 判断节点是否可编辑，主要检测是否有 contentEditable 或 user-modify，并不判断 input 或 textarea
// 主要是因为 isContentEditable 属性在 IE11- 中会受到 disabled | readOnly 影响，所以检测会不准确
// 测试发现 Firefox 和 Chrome，对于 contentEditable="true" 的元素，在获取 *-user-modify 样式时会
// 返回 "read-write"，子节点也会继承到这个结果，IE11- 不支持 user-modify，所以最终返回 undefined
var pub_prefixUserModify = (/Firefox/i.test(navigator.userAgent) === true ? 'MozUserModify' : 'webkitUserModify');
var pub_getStyleObject = function(element, pseudoSelector){ return pub_win.getComputedStyle(element, pseudoSelector ? pseudoSelector : null) };
var pub_isModifiable = function(element){
	if(/^input|textarea$/i.test(element.nodeName) === true){ return false };
	return (element.isContentEditable === true || (pub_doc.documentMode === undefined && /write/i.test(pub_getStyleObject(element)[pub_prefixUserModify]) === true)) ? true : false;
};



// 获取当前的初始比例，将 meta[name="viewport"] 的 content 中的 initial-scale 截取出来，计算高度
// 在 pub_softKeyboard 函数中需要用到这方法，计算是否有软键盘，得用 screen.height 和当前窗口尺寸
// screen.height 不受视窗设置的影响，总返回设备的尺寸，但当前窗口尺寸会受到 initial-scale 的影响
// 所以得获取到当前设置的 initial-scale 值，和当前窗口的高度尺寸相乘，才能得到没缩放过的窗口高度
var pub_getInitialScale = function(){
	return parseFloat(pub_element_meta.content.
	match(/initial-scale=([^,]+)/i)[1].trim());
};



// 判断 color 控件是否被支持，参考 stackOverllow : https://stackoverflow.com/questions/13789163/
// 支持 color 控件 ! 值会变成 #000000，IE 为 input 设置不支持的 type 会出错，所以得用 try…catch
// 在拖曳的时候，PC 端要避开可以被输入和圈选的那些节点，因为圈选和拖曳是互斥的，不可以被同时支持
// 特别要设置的是 color 控件，要 IE14 和 Safari12.1、12.2 才支持，不支持会变成输入框，也得被排除
var pub_colorSupports = true;
(function(inputColorElement, flag){
	try{
		inputColorElement = pub_doc.createElement('input');
		inputColorElement.type = 'color', inputColorElement.value = '!';
		flag = (inputColorElement.type === 'color' && inputColorElement.value !== '!');
	}catch(e){};
	if(flag === false){ pub_colorSupports = false };
})(null, false);



// 当前是否存在软键盘，对 IOS 来讲不是必要的，因为软键盘不会影响到尺寸，所以实际上也没法检测出来
// 但 Android 的软键盘弹起就会影响尺寸，所以判断时先取 document.activeElement 节点，如果这个节点
// 是可以输入的且不是 readOnly 或 disabled，并且当前可视窗口小于屏幕 240px，那么才认为是弹起键盘
// 240px 是赌浏览器地址栏和工具栏小于 240px 而小键盘大于 240px，不是非常靠谱，但也没更好的方法了
var pub_softKeyboard = function(){
	
	// PC & IOS 为 false，PC 是没有，IOS 是没法得知
	if(pub_is_mobile === false || pub_is_ios === true){ return false };
	
	// 弹起软键盘的大前提是，当前聚焦到可输入元素上
	var activeElement = pub_doc.activeElement;
	
	// 找不到被聚焦的元素，或不是元素节点则肯定没有
	if(activeElement === null 
	|| activeElement === pub_body 
	|| activeElement.nodeType !== 1){
	return false };
	
	// 是 input 或 textarea，但只读或禁用，也是没有
	if(/^input|textarea$/i.test(activeElement.nodeName) === true){
		if(/^color$/i.test(activeElement.type) === true && pub_colorSupports === true){ return false };
		if(/^textarea|text|email|tel|url|number|search|password|date|time|week|month|range|color$/i.test(activeElement.type) === false){ return false };
		if(activeElement.readOnly === true || activeElement.disabled === true || activeElement.hasAttribute('readOnly') === true || activeElement.hasAttribute('disabled') === true){ return false };
	};
	
	// 被聚焦的元素并不是可编辑的，那么肯定也是没有
	// 如果文档窗口和设备窗口差距小于 240，也算没有
	if(pub_isModifiable(activeElement) === false){ return false };
	if((screen.height - (pub_getInitialScale() * pub_return
	.height())) < pub_config.betkbd){ return false };
	
	// 如果聚焦的节点是可编辑的且视口差距达到 240px
	// 那就算软键盘被弹起，不是非常靠谱，勉强凑合了
	return true;
	
};



// ---------------------------------------------------------------------------------------------
// 有些浏览器的 html.clienHeight 属性会把地址栏尺寸也算进去，所以改用 window 的 innerHeight 属性
// Safari(IOS) 在放大页面后 window.innerWidth|innerHeight 会变小，所以实际上是借助它的比例来计算
// 但实际上这样去获取高度，也只能保证在竖屏的情况下尺寸正常，在 Safari(IOS) 横屏时还是会有问题的
// Safari(IOS13-) 横屏进入页面后，innerHeight 还是会包括地址栏，得等自动触发 resize 事件后才正常
var pub_return = {
	
	version : pub_version,					// 当前版本号，配置需要用到
	element : pub_element_meta,				// <meta name="viewport" content="?" />
	
	orientation : pub_orientation,			// 获取设备方向，landscape 或 portrait，相等返回 squared
	softKeyboard : pub_softKeyboard,		// 判断是否有软键盘，只针对 Android，IOS 和 PC 总返回 false，因为无法得知
	
	width : function(){ return Math.round(pub_html.clientWidth) },
	height : function(){ return Math.round(pub_win.innerHeight / pub_win.innerWidth * pub_html.clientWidth) },
	
	get : function(){ return pub_element_meta.getAttribute('content') },
	set : function(options){
		
		
		
		// option & pub_option & options 对象的合并
		var option = Object.create(null);
		Object.keys(pub_option).forEach(function(key){ option[key] = pub_option[key] });
		if(options !== null && typeof(options) === 'object'){ Object.keys(options).forEach(function(key){ option[key] = options[key] }) };
		
		// 参数对象参数的解构赋值，这样压缩率会更高
		var _minWidth = option.minWidth;
		var _minHeight = option.minHeight;
		
		var _width = option.width;
		var _height = option.height;
		
		var _maxWidth = option.maxWidth;
		var _maxHeight = option.maxHeight;
		
		var _onlyMobile = option.onlyMobile;
		var _fillScreen = option.fillScreen;
		var _delayReset = option.delayReset;
		
		var _initialScale = option.initialScale;
		var _minimumScale = option.minimumScale;
		var _maximumScale = option.maximumScale;
		var _userScalable = option.userScalable;
		
		var _targetDensitydpi = option.targetDensitydpi;
		var _viewportFit = option.viewportFit;
		var _resize = option.resize;
		
		
		
		// 如果是 PC 端，但仅限移动端，那么直接返回
		if(pub_is_mobile === false 
		&& _onlyMobile === true){ return };
		
		// 尺寸需要重获，因为也可能有重新设置的情况
		var clientWidth = pub_return.width();
		var clientHeight = pub_return.height();
		
		// meta 标签的 content 属性可能需要用的变量
		var content = '';				// meta 的 content
		var targetWidth = '';			// content 里 width 属性
		var targetInitialScale = 1;		// content 里 initial-scale 值
		var xScale = 1;					// 横轴 initial-scale 值
		var yScale = 1;					// 纵轴 initial-scale 值
		
		
		
		// 设备尺寸： 400 * 600
		// 最小尺寸： 600 * 900
		// 比例相等则交叉值相等
		
		// 要得到最小高度 900，就得算出最小宽度 600
		// 400 600 900 都已知则 600 = 400*900 / 600
		
		// 宽度小于： 512 * 600, xScale = 400/512=0.78125, 600/0.78125=768, 结果是 512*768
		// 高度小于： 400 * 750, yScale = 600/750=0.80000, 400/0.80000=500, 结果是 500*750
		// 宽高皆小： 512 * 750, 由于 0.78125 < 0.800 因此使用 0.78125, 所以结果是 512*768
		
		// 宽度小于： 512 * 600, xScale = 400/512=0.78125, 600/0.78125=768, 结果是 512*768
		// 高度小于： 400 * 960, yScale = 600/960=0.62500, 400/0.62500=640, 结果是 640*960
		// 宽高皆小： 512 * 960, 由于 0.625 < 0.78125 因此使用 0.62500, 所以结果是 640*960
		
		// 如果只设置最小宽度，且窗口小于目标的尺寸
		if(_minWidth !== 0      && _minHeight === 0      && clientWidth  < _minWidth ){
			targetInitialScale = clientWidth  / _minWidth ;
			targetWidth = _minWidth;
		}else 
		
		// 如果只设置最小高度，且窗口小于目标的尺寸
		if(_minWidth === 0      && _minHeight !== 0      && clientHeight < _minHeight){
			targetInitialScale = clientHeight / _minHeight;
			targetWidth = Math.round(clientWidth * 
			_minHeight / clientHeight);
		}else 
		
		// 如果同时设置 minWidth & minHeight 的情况
		if(_minWidth !== 0      && _minHeight !== 0     ){
			
			// 宽高不够才得计算，够用则检查是否填充
			if(clientWidth  < _minWidth || 
			   clientHeight < _minHeight){
				if(clientWidth  < _minWidth ){ xScale = clientWidth  / _minWidth  };
				if(clientHeight < _minHeight){ yScale = clientHeight / _minHeight };
			}else 
			if(_fillScreen === true){
				if(clientWidth  > _minWidth ){ xScale = clientWidth  / _minWidth  };
				if(clientHeight > _minHeight){ yScale = clientHeight / _minHeight };
			};
			
			// 小于或者需要填充，才得修改这两个变量
			if(xScale !== 1 || yScale !== 1){
				targetWidth = (xScale <= yScale) ? _minWidth : 
				Math.round(_minHeight * clientWidth / clientHeight);
				targetInitialScale = Math.min(xScale, yScale);
			};
			
		}else 
		
		
		
		// 设备尺寸： 400 * 600
		// 最大尺寸： 200 * 300
		// 比例相等则交叉值相等
		
		// 要得到最大高度 300，就得算出最大宽度 200
		// 400 600 300 都已知则 200 = 400*300 / 600
		
		// 宽度大于： 200 * 600, xScale = 400/200=2.00, 600/2.00=300, 结果是 200*300
		// 高度大于： 400 * 480, yScale = 600/480=1.25, 400/1.25=320, 结果是 320*480
		// 宽高皆大： 200 * 480, 由于 2.00 > 1.25，因此使用 2.00, 所以结果是 200*300
		 
		// 宽度大于： 200 * 600, xScale = 400/200=2.00, 600/2.00=300, 结果是 200*300
		// 高度大于： 400 * 150, yScale = 600/150=4.00, 400/4.00=100, 结果是 100*150
		// 宽高皆大： 200 * 150, 由于 4.00 > 2.00，因此使用 4.00, 所以结果是 100*150
		
		// 如果只设置最大宽度，且窗口大于目标的尺寸
		if(_maxWidth !== 'none' && _maxHeight === 'none' && clientWidth  > _maxWidth ){
			targetInitialScale = clientWidth  / _maxWidth ;
			targetWidth = _maxWidth;
		}else 
		
		// 如果只设置最大高度，且窗口大于目标的尺寸
		if(_maxWidth === 'none' && _maxHeight !== 'none' && clientHeight > _maxHeight){
			targetInitialScale = clientHeight / _maxHeight;
			targetWidth = Math.round(clientWidth * 
			_maxHeight / clientHeight);
		}else 
		
		// 如果同时设置 maxWidth & maxHeight 的情况
		if(_maxWidth !== 'none' && _maxHeight !== 'none'){
			
			// 宽高超过才得计算，够用则检查是否填充
			if(clientWidth  > _maxWidth || 
			   clientHeight > _maxHeight){
				if(clientWidth  > _maxWidth ){ xScale = clientWidth  / _maxWidth  };
				if(clientHeight > _maxHeight){ yScale = clientHeight / _maxHeight };
			}else 
			if(_fillScreen === true){
				if(clientWidth  < _maxWidth ){ xScale = clientWidth  / _maxWidth  };
				if(clientHeight < _maxHeight){ yScale = clientHeight / _maxHeight };
			};
			
			// 大于或者需要填充，才得修改这两个变量
			if(xScale !== 1 || yScale !== 1){
				targetWidth = (xScale >= yScale) ? _maxWidth : 
				Math.round(_maxHeight * clientWidth / clientHeight);
				targetInitialScale = Math.max(xScale, yScale);
			};
			
		}else 
		
		
		
		// 设置宽高度需要同步计算 InitialScale 属性
		// 但它们不能同时存在，因为视窗比例是固定的
		if(_width  !== 'auto'){
			targetWidth = _width; // 设置固定高度时，targetWidth 才需要计算
			if(_width  === 'device-width'){ targetInitialScale = 1 }
			else{ targetInitialScale = clientWidth /_width  };
		}else 
		if(_height !== 'auto'){
			targetWidth = Math.round(clientWidth * _height / clientHeight);
			if(_height === 'device-width'){ targetInitialScale = 1 }
			else{ targetInitialScale = clientHeight/_height };
		};
		
		
		
		// width & initial-scale 属性是必须要设置的
		content += 'width=' + (targetWidth === '' ? 'device-width' : targetWidth);
		content += ',initial-scale=' + (_initialScale === 'auto' 
		? targetInitialScale : initialScale);
		
		// 最大最小值和缩放，IOS 10+ 会无视这些属性
		if(_minimumScale !== 'none'){ content += (',minimum-scale=' + (_minimumScale === 'auto' ? targetInitialScale : _minimumScale)) };
		if(_maximumScale !== 'none'){ content += (',maximum-scale=' + (_maximumScale === 'auto' ? targetInitialScale : _maximumScale)) };
		
		// 设置像素密度，是否能缩放，不规则屏幕填充
		if(_targetDensitydpi !== ''){ content += (',target-densitydpi=' + _targetDensitydpi) };
		if(_userScalable !== 'none'){ content += (',user-scalable=' + _userScalable) };
		if(_viewportFit !== ''){ content += (',viewport-fit=' + _viewportFit) };
		
		// 设置 meta[name="viewport"] 的 content 值
		pub_element_meta.setAttribute('content', content);
		
		
		
		// 重设 content 的时候 IOS 不会触发 resize，所以无需检测 resizeByManual，此外 IOS 软键盘
		// 是否存在，不影响尺寸计算，所以有无键盘都无所谓，但 Android 则相反，这两个问题都要考虑
		
		// 高度是由宽度和比例计算出来的，但宽度不允许有小数，所以最终高度可能会有正负 1px 的偏差
		// 为了解决偏差，所以 newInnerHeight + 4 以免偏小 1-4 像素的时候会再次触发重置和重新计算
		
		// 部分浏览器如 UC(Android)，翻转后立即获取尺寸可能出错，高度可能为 0 或不准，得轮询判断
		// 所以逻辑跟 Safari(IOS) 不大一样，这里轮询判断的间隔时间还不能太小，否则还是有可能出错
		
		// 测试发现 IOS 其他浏览器和 Safari 相同，重设 content 不会触发 resize，软键盘不影响尺寸
		// 但部分浏览器在翻转后，立即获取 window.innherHeight 会出错，所以还是需要延迟后再来计算
		
		// 如果不需要动态变化视窗，那么在这就返回了
		if(_resize === false){ return };
		
		// 记下当前高度，未翻转触发 resize 需要比对
		var oldInnerHeight = pub_return.height();
		var newInnerHeight = NaN;
		
		// 记下当前方向，翻转则需要重新设置 content
		var oldOrientation = pub_orientation();
		var newOrientation = 0;
		
		// resize 后检测延迟时间，resize 触发的原因
		var rotatedTimeout = undefined;
		var resizeByManual = false;
		
		// 屏幕翻转和地址栏伸缩都会触发 resize 事件
		pub_win.addEventListener('resize', function(){
			
			// 是 PC 端，直接初始化后进行重设就行了
			// PC 端的翻转不会滞后，无需 setTimeout
			// 这里得从用户代理重新判断是否为移动端
			// 因为 Chrome 从 PC 转移动模拟会死循环
			if(/Mobile|Android|iPhone|iPad/i.test(
			navigator.userAgent) === false){
				pub_metaInitialize();
				option.resize = false;
				pub_return.set(option);
				return;
			};
			
			// Android 重设 content，此时也不能响应
			if(pub_is_ios === false && resizeByManual === true){ return };
			
			// Android 在软键盘弹起时不响应视窗重置
			if(pub_is_ios === false && pub_softKeyboard() === true){ return };
			
			// 清掉之前的超时以避免重复，再重设超时
			clearTimeout(rotatedTimeout); rotatedTimeout = setTimeout(function(){
			
				// 获取当前窗口的高度以及设备的方向
				newInnerHeight = pub_return.height(), 
				newOrientation = pub_orientation();
				
				// 方向没变且高度没变小，什么也不做
				if(newOrientation === oldOrientation && 
				newInnerHeight+4 >= oldInnerHeight){}
				
				// 方向改变或高度变小，重设视窗尺寸
				else if(newOrientation !== oldOrientation 
				|| newInnerHeight +4 < oldInnerHeight){
					
					// 不要让安卓响应初始化视窗事件
					if(pub_is_ios === false)
					{ resizeByManual = true };
					
					// 初始化视窗，恢复安卓响应判断
					pub_metaInitialize();
					resizeByManual = false;
					
					// 不重新绑定事件的重设窗口尺寸
					option.resize = false;
					pub_return.set(option);
					
					// 手动触发 resize 响应窗口变化
					pub_win.dispatchEvent(new Event('resize' 
					, {bubbles:true, cancelable:true}));
					
					// 获取当前高度尺寸和屏幕的方向
					oldInnerHeight = pub_return.height();
					oldOrientation = newOrientation;
					
				};
				
			}, _delayReset);
			
		}, true);
		
		
		
	}, // pub_return.set
	
}; // pub_return



// ---------------------------------------------------------------------------------------------
// 非手动的且有内联属性就自动实例化
var pub_inlineOption;
if(pub_config.manual === false 
&& pub_element_meta.hasAttribute('xj-viewport')){
	pub_inlineOption = eval('('+ pub_element_meta.getAttribute('xj-viewport') +')');
	if(pub_inlineOption !== undefined && pub_inlineOption !== null && typeof(pub_inlineOption) === 'object'){ pub_return.set(pub_inlineOption) };
};



// 将返回值挂到对应的版本上再返回它
pub_global.xj.viewportReturn[pub_version] = pub_return;
return pub_return;



}));


