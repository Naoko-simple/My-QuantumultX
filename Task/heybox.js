/*
"小黑盒" app 自动签到，支持 Quantumult X（理论上也支持 Surge、Loon，未尝试）。
请先按下述方法进行配置，进入"小黑盒" - "我"，若弹出"首次写入heybox Cookie 成功"即可正常食用，其他提示或无提示请发送日志信息至 issue。
到 cron 设定时间自动签到时，若弹出"小黑盒 - 签到成功"即完成签到，其他提示或无提示请发送日志信息至 issue。

小黑盒签到及任务获取的奖励积攒之后可以兑换 steam 游戏，您可以使用我的邀请码进行注册：
https://api.xiaoheihe.cn/game/invite_friend_web_share/?heybox_id=21530787
邀请码：21530787

⚠️免责声明：
1. 此脚本仅用于学习研究，不保证其合法性、准确性、有效性，请根据情况自行判断，本人对此不承担任何保证责任。
2. 由于此脚本仅用于学习研究，您必须在下载后 24 小时内将所有内容从您的计算机或手机或任何存储设备中完全删除，若违反规定引起任何事件本人对此均不负责。
3. 请勿将此脚本用于任何商业或非法目的，若违反规定请自行对此负责。
4. 此脚本涉及应用与本人无关，本人对因此引起的任何隐私泄漏或其他后果不承担任何责任。
5. 本人对任何脚本引发的问题概不负责，包括但不限于由脚本错误引起的任何损失和损害。
6. 如果任何单位或个人认为此脚本可能涉嫌侵犯其权利，应及时通知并提供身份证明，所有权证明，我们将在收到认证文件确认后删除此脚本。
7. 所有直接或间接使用、查看此脚本的人均应该仔细阅读此声明。本人保留随时更改或补充此声明的权利。一旦您使用或复制了此脚本，即视为您已接受此免责声明。

Author：zZPiglet
Acknowledgements: chr233, JiY

Quantumult X:
[task_local]
0 * * * * https://raw.githubusercontent.com/zZPiglet/Task/master/heybox/heybox.js, tag=小黑盒

[rewrite_local]
^https:\/\/api\.xiaoheihe\.cn\/account\/home_v2\/\? url script-request-header https://raw.githubusercontent.com/zZPiglet/Task/master/heybox/heybox.js


Surge & Loon:
[Script]
cron "0 * * * *" script-path=https://raw.githubusercontent.com/zZPiglet/Task/master/heybox/heybox.js
http-request ^https:\/\/api\.xiaoheihe\.cn\/account\/home_v2\/\? script-path=https://raw.githubusercontent.com/zZPiglet/Task/master/heybox/heybox.js

All app:
[mitm]
hostname = api.xiaoheihe.cn

获取完 Cookie 后可不注释 rewrite / hostname，Cookie 更新时会弹窗。若因 MitM 导致该软件网络不稳定，可注释掉 hostname。
*/

const $ = new API('heybox')
$.debug = [true, 'true'].includes($.read('debug')) || false
const mainURL = 'https://api.xiaoheihe.cn'
const urlreg = /https:\/\/api\.xiaoheihe\.cn\/account\/home_v2\/\?lang=(.*)&os_type=(.*)&os_version=(.*)&_time=\d{10}&version=(.*)&device_id=(.*)&heybox_id=(\d+)&hkey=/
const cookiereg = /pkey=(.*);/

if ($.isRequest) {
    GetCookie()
    $.done
} else {
    Checkin()
    $.done
}

function GetCookie() {
    if (cookiereg.exec($request.headers['Cookie'])[1]) {
        let pkey = cookiereg.exec($request.headers['Cookie'])[1]
        let lang = urlreg.exec($request.url)[1]
        let os_t = urlreg.exec($request.url)[2]
        let os_v = urlreg.exec($request.url)[3]
        let v = urlreg.exec($request.url)[4]
        let d_id = urlreg.exec($request.url)[5]
        let h_id = urlreg.exec($request.url)[6]
        if ($.read('pkey') != (undefined || null)) {
            if ($.read('pkey') != pkey || $.read('lang') != lang || $.read('os_t') != os_t || $.read('os_v') != os_v || $.read('v') != v || $.read('d_id') != d_id || $.read('h_id') != h_id) {
                $.write(pkey, 'pkey')
                $.write(lang, 'lang')
                $.write(os_t, 'os_t')
                $.write(os_v, 'os_v')
                $.write(v, 'v')
                $.write(d_id, 'd_id')
                $.write(h_id, 'h_id')
                $.notify("更新 " + $.name + " Cookie 成功 🎉", "", "")
            }
        } else {
            $.write(pkey, 'pkey')
            $.write(lang, 'lang')
            $.write(os_t, 'os_t')
            $.write(os_v, 'os_v')
            $.write(v, 'v')
            $.write(d_id, 'd_id')
            $.write(h_id, 'h_id')
            $.notify("首次写入 " + $.name + " Cookie 成功 🎉", "", "")
        }
    } else {
        $.notify("写入" + $.name + "Cookie 失败‼️", "", "配置错误, 无法读取请求头, ")
    }
}

function Checkin() {
    let time = Math.round(new Date().getTime()/1000).toString()
    let sign = '/task/sign'
    let hkey = hex_md5(hex_md5(sign + '/bfhdkud_time=' + time).replace(/a|0/g, 'app')).substr(0,10)
    let signURL = mainURL + sign + '?lang=' + $.read('lang') + '&os_type=' + $.read('os_t') + '&os_version=' + $.read('os_v') + '&_time=' + time + '&version=' + $.read('v') + '&device_id=' + $.read('d_id') + '&heybox_id=' + $.read('h_id') + '&hkey=' + hkey
    $.log(signURL)
    $.get({
        url: signURL,
        headers: {
            'Cookie': 'pkey=' + $.read('pkey'),
            'Referer': 'http://api.maxjia.com/'
        }
    })
        .then((resp) => {
            $.log(resp.body)
            let obj = JSON.parse(resp.body)
            let subTitle = ''
            let detail = ''
            if (obj.status == 'ok') {
                let all_coin = obj.result.coin
                let sign_coin = obj.result.sign_in_coin
                let sign_exp = obj.result.sign_in_exp
                subTitle += '签到成功 🎮'
                detail += '签到获得 ' + sign_coin + ' H 币及 ' + sign_exp + ' 经验。账户共有 ' + all_coin + ' H 币。'
            } else if (obj.status == 'ignore') {
                subTitle += '重复签到 🤹‍♀️'
            } else if (obj.status == 'failed') {
                subTitle += '签到失败 😭'
                detail += obj.msg
            } else {
                subTitle += '签到失败 😭'
                detail += JSON.stringify(resp.body)
            }
            $.notify('小黑盒', subTitle, detail)
        })
        .catch((err) => {
            $.notify("小黑盒 - 出现错误", "", err.message)
            $.error(err)
        })
}

// md5
function hex_md5(r){return rstr2hex(rstr_md5(str2rstr_utf8(r)))}function b64_md5(r){return rstr2b64(rstr_md5(str2rstr_utf8(r)))}function any_md5(r,t){return rstr2any(rstr_md5(str2rstr_utf8(r)),t)}function hex_hmac_md5(r,t){return rstr2hex(rstr_hmac_md5(str2rstr_utf8(r),str2rstr_utf8(t)))}function b64_hmac_md5(r,t){return rstr2b64(rstr_hmac_md5(str2rstr_utf8(r),str2rstr_utf8(t)))}function any_hmac_md5(r,t,d){return rstr2any(rstr_hmac_md5(str2rstr_utf8(r),str2rstr_utf8(t)),d)}function md5_vm_test(){return"900150983cd24fb0d6963f7d28e17f72"==hex_md5("abc").toLowerCase()}function rstr_md5(r){return binl2rstr(binl_md5(rstr2binl(r),8*r.length))}function rstr_hmac_md5(r,t){var d=rstr2binl(r);d.length>16&&(d=binl_md5(d,8*r.length));for(var n=Array(16),_=Array(16),m=0;m<16;m++)n[m]=909522486^d[m],_[m]=1549556828^d[m];var f=binl_md5(n.concat(rstr2binl(t)),512+8*t.length);return binl2rstr(binl_md5(_.concat(f),640))}function rstr2hex(r){for(var t,d=hexcase?"0123456789ABCDEF":"0123456789abcdef",n="",_=0;_<r.length;_++)t=r.charCodeAt(_),n+=d.charAt(t>>>4&15)+d.charAt(15&t);return n}function rstr2b64(r){for(var t="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",d="",n=r.length,_=0;_<n;_+=3)for(var m=r.charCodeAt(_)<<16|(_+1<n?r.charCodeAt(_+1)<<8:0)|(_+2<n?r.charCodeAt(_+2):0),f=0;f<4;f++)8*_+6*f>8*r.length?d+=b64pad:d+=t.charAt(m>>>6*(3-f)&63);return d}function rstr2any(r,t){var d,n,_,m,f,h=t.length,e=Array(Math.ceil(r.length/2));for(d=0;d<e.length;d++)e[d]=r.charCodeAt(2*d)<<8|r.charCodeAt(2*d+1);var a=Math.ceil(8*r.length/(Math.log(t.length)/Math.log(2))),i=Array(a);for(n=0;n<a;n++){for(f=Array(),m=0,d=0;d<e.length;d++)m=(m<<16)+e[d],_=Math.floor(m/h),m-=_*h,(f.length>0||_>0)&&(f[f.length]=_);i[n]=m,e=f}var o="";for(d=i.length-1;d>=0;d--)o+=t.charAt(i[d]);return o}function str2rstr_utf8(r){for(var t,d,n="",_=-1;++_<r.length;)t=r.charCodeAt(_),d=_+1<r.length?r.charCodeAt(_+1):0,55296<=t&&t<=56319&&56320<=d&&d<=57343&&(t=65536+((1023&t)<<10)+(1023&d),_++),t<=127?n+=String.fromCharCode(t):t<=2047?n+=String.fromCharCode(192|t>>>6&31,128|63&t):t<=65535?n+=String.fromCharCode(224|t>>>12&15,128|t>>>6&63,128|63&t):t<=2097151&&(n+=String.fromCharCode(240|t>>>18&7,128|t>>>12&63,128|t>>>6&63,128|63&t));return n}function str2rstr_utf16le(r){for(var t="",d=0;d<r.length;d++)t+=String.fromCharCode(255&r.charCodeAt(d),r.charCodeAt(d)>>>8&255);return t}function str2rstr_utf16be(r){for(var t="",d=0;d<r.length;d++)t+=String.fromCharCode(r.charCodeAt(d)>>>8&255,255&r.charCodeAt(d));return t}function rstr2binl(r){for(var t=Array(r.length>>2),d=0;d<t.length;d++)t[d]=0;for(d=0;d<8*r.length;d+=8)t[d>>5]|=(255&r.charCodeAt(d/8))<<d%32;return t}function binl2rstr(r){for(var t="",d=0;d<32*r.length;d+=8)t+=String.fromCharCode(r[d>>5]>>>d%32&255);return t}function binl_md5(r,t){r[t>>5]|=128<<t%32,r[14+(t+64>>>9<<4)]=t;for(var d=1732584193,n=-271733879,_=-1732584194,m=271733878,f=0;f<r.length;f+=16){var h=d,e=n,a=_,i=m;d=md5_ff(d,n,_,m,r[f+0],7,-680876936),m=md5_ff(m,d,n,_,r[f+1],12,-389564586),_=md5_ff(_,m,d,n,r[f+2],17,606105819),n=md5_ff(n,_,m,d,r[f+3],22,-1044525330),d=md5_ff(d,n,_,m,r[f+4],7,-176418897),m=md5_ff(m,d,n,_,r[f+5],12,1200080426),_=md5_ff(_,m,d,n,r[f+6],17,-1473231341),n=md5_ff(n,_,m,d,r[f+7],22,-45705983),d=md5_ff(d,n,_,m,r[f+8],7,1770035416),m=md5_ff(m,d,n,_,r[f+9],12,-1958414417),_=md5_ff(_,m,d,n,r[f+10],17,-42063),n=md5_ff(n,_,m,d,r[f+11],22,-1990404162),d=md5_ff(d,n,_,m,r[f+12],7,1804603682),m=md5_ff(m,d,n,_,r[f+13],12,-40341101),_=md5_ff(_,m,d,n,r[f+14],17,-1502002290),n=md5_ff(n,_,m,d,r[f+15],22,1236535329),d=md5_gg(d,n,_,m,r[f+1],5,-165796510),m=md5_gg(m,d,n,_,r[f+6],9,-1069501632),_=md5_gg(_,m,d,n,r[f+11],14,643717713),n=md5_gg(n,_,m,d,r[f+0],20,-373897302),d=md5_gg(d,n,_,m,r[f+5],5,-701558691),m=md5_gg(m,d,n,_,r[f+10],9,38016083),_=md5_gg(_,m,d,n,r[f+15],14,-660478335),n=md5_gg(n,_,m,d,r[f+4],20,-405537848),d=md5_gg(d,n,_,m,r[f+9],5,568446438),m=md5_gg(m,d,n,_,r[f+14],9,-1019803690),_=md5_gg(_,m,d,n,r[f+3],14,-187363961),n=md5_gg(n,_,m,d,r[f+8],20,1163531501),d=md5_gg(d,n,_,m,r[f+13],5,-1444681467),m=md5_gg(m,d,n,_,r[f+2],9,-51403784),_=md5_gg(_,m,d,n,r[f+7],14,1735328473),n=md5_gg(n,_,m,d,r[f+12],20,-1926607734),d=md5_hh(d,n,_,m,r[f+5],4,-378558),m=md5_hh(m,d,n,_,r[f+8],11,-2022574463),_=md5_hh(_,m,d,n,r[f+11],16,1839030562),n=md5_hh(n,_,m,d,r[f+14],23,-35309556),d=md5_hh(d,n,_,m,r[f+1],4,-1530992060),m=md5_hh(m,d,n,_,r[f+4],11,1272893353),_=md5_hh(_,m,d,n,r[f+7],16,-155497632),n=md5_hh(n,_,m,d,r[f+10],23,-1094730640),d=md5_hh(d,n,_,m,r[f+13],4,681279174),m=md5_hh(m,d,n,_,r[f+0],11,-358537222),_=md5_hh(_,m,d,n,r[f+3],16,-722521979),n=md5_hh(n,_,m,d,r[f+6],23,76029189),d=md5_hh(d,n,_,m,r[f+9],4,-640364487),m=md5_hh(m,d,n,_,r[f+12],11,-421815835),_=md5_hh(_,m,d,n,r[f+15],16,530742520),n=md5_hh(n,_,m,d,r[f+2],23,-995338651),d=md5_ii(d,n,_,m,r[f+0],6,-198630844),m=md5_ii(m,d,n,_,r[f+7],10,1126891415),_=md5_ii(_,m,d,n,r[f+14],15,-1416354905),n=md5_ii(n,_,m,d,r[f+5],21,-57434055),d=md5_ii(d,n,_,m,r[f+12],6,1700485571),m=md5_ii(m,d,n,_,r[f+3],10,-1894986606),_=md5_ii(_,m,d,n,r[f+10],15,-1051523),n=md5_ii(n,_,m,d,r[f+1],21,-2054922799),d=md5_ii(d,n,_,m,r[f+8],6,1873313359),m=md5_ii(m,d,n,_,r[f+15],10,-30611744),_=md5_ii(_,m,d,n,r[f+6],15,-1560198380),n=md5_ii(n,_,m,d,r[f+13],21,1309151649),d=md5_ii(d,n,_,m,r[f+4],6,-145523070),m=md5_ii(m,d,n,_,r[f+11],10,-1120210379),_=md5_ii(_,m,d,n,r[f+2],15,718787259),n=md5_ii(n,_,m,d,r[f+9],21,-343485551),d=safe_add(d,h),n=safe_add(n,e),_=safe_add(_,a),m=safe_add(m,i)}return Array(d,n,_,m)}function md5_cmn(r,t,d,n,_,m){return safe_add(bit_rol(safe_add(safe_add(t,r),safe_add(n,m)),_),d)}function md5_ff(r,t,d,n,_,m,f){return md5_cmn(t&d|~t&n,r,t,_,m,f)}function md5_gg(r,t,d,n,_,m,f){return md5_cmn(t&n|d&~n,r,t,_,m,f)}function md5_hh(r,t,d,n,_,m,f){return md5_cmn(t^d^n,r,t,_,m,f)}function md5_ii(r,t,d,n,_,m,f){return md5_cmn(d^(t|~n),r,t,_,m,f)}function safe_add(r,t){var d=(65535&r)+(65535&t),n=(r>>16)+(t>>16)+(d>>16);return n<<16|65535&d}function bit_rol(r,t){return r<<t|r>>>32-t}var hexcase=0,b64pad="";
// OpenAPI by Peng-YM, modified by zZPiglet
function API(s="untitled",e=!1){return new class{constructor(s,e){this.name=s,this.debug=e,this.isRequest="undefined"!=typeof $request,this.isQX="undefined"!=typeof $task,this.isLoon="undefined"!=typeof $loon,this.isSurge="undefined"!=typeof $httpClient&&!this.isLoon,this.isNode="function"==typeof require,this.isJSBox=this.isNode&&"undefined"!=typeof $jsbox,this.node=(()=>{if(this.isNode){const s="undefined"!=typeof $request?void 0:require("request"),e=require("fs");return{request:s,fs:e}}return null})(),this.initCache();const t=(s,e)=>new Promise(function(t){setTimeout(t.bind(null,e),s)});Promise.prototype.delay=function(s){return this.then(function(e){return t(s,e)})}}get(s){return this.isQX?("string"==typeof s&&(s={url:s,method:"GET"}),$task.fetch(s)):new Promise((e,t)=>{this.isLoon||this.isSurge?$httpClient.get(s,(s,i,o)=>{s?t(s):e({status:i.status,headers:i.headers,body:o})}):this.node.request(s,(s,i,o)=>{s?t(s):e({...i,status:i.statusCode,body:o})})})}post(s){return this.isQX?("string"==typeof s&&(s={url:s}),s.method="POST",$task.fetch(s)):new Promise((e,t)=>{this.isLoon||this.isSurge?$httpClient.post(s,(s,i,o)=>{s?t(s):e({status:i.status,headers:i.headers,body:o})}):this.node.request.post(s,(s,i,o)=>{s?t(s):e({...i,status:i.statusCode,body:o})})})}initCache(){if(this.isQX&&(this.cache=JSON.parse($prefs.valueForKey(this.name)||"{}")),(this.isLoon||this.isSurge)&&(this.cache=JSON.parse($persistentStore.read(this.name)||"{}")),this.isNode){let s="root.json";this.node.fs.existsSync(s)||this.node.fs.writeFileSync(s,JSON.stringify({}),{flag:"wx"},s=>console.log(s)),this.root={},s=`${this.name}.json`,this.node.fs.existsSync(s)?this.cache=JSON.parse(this.node.fs.readFileSync(`${this.name}.json`)):(this.node.fs.writeFileSync(s,JSON.stringify({}),{flag:"wx"},s=>console.log(s)),this.cache={})}}persistCache(){const s=JSON.stringify(this.cache);this.isQX&&$prefs.setValueForKey(s,this.name),(this.isLoon||this.isSurge)&&$persistentStore.write(s,this.name),this.isNode&&(this.node.fs.writeFileSync(`${this.name}.json`,s,{flag:"w"},s=>console.log(s)),this.node.fs.writeFileSync("root.json",JSON.stringify(this.root),{flag:"w"},s=>console.log(s)))}write(s,e){this.log(`SET ${e}`),-1!==e.indexOf("#")?(e=e.substr(1),this.isSurge&this.isLoon&&$persistentStore.write(s,e),this.isQX&&$prefs.setValueForKey(s,e),this.isNode&&(this.root[e]=s)):this.cache[e]=s,this.persistCache()}read(s){return this.log(`READ ${s}`),-1===s.indexOf("#")?this.cache[s]:(s=s.substr(1),this.isSurge&this.isLoon?$persistentStore.read(s):this.isQX?$prefs.valueForKey(s):this.isNode?this.root[s]:void 0)}delete(s){this.log(`DELETE ${s}`),delete this.cache[s],-1!==s.indexOf("#")?(s=s.substr(1),this.isSurge&this.isLoon&&$persistentStore.write(null,s),this.isQX&&$prefs.setValueForKey(null,s),this.isNode&&delete this.root[s]):this.cache[s]=data,this.persistCache()}notify(e=s,t="",i="",o,n){const h=i+(null==o?"":`\n\n跳转链接：${o}`)+(null==n?"":`\n\n多媒体链接：${n}`),r=i+(null==n?"":`\n\n多媒体链接：${n}`);if(this.isQX&&$notify(e,t,i,{"open-url":o,"media-url":n}),this.isSurge&&$notification.post(e,t,h),this.isLoon&&$notification.post(e,t,r,o),this.isNode)if(this.isJSBox){const s=require("push");s.schedule({title:e,body:t?t+"\n"+i:i})}else console.log(`${e}\n${t}\n${h}\n\n`)}log(s){this.debug&&console.log(s)}info(s){console.log(s)}error(s){console.log("ERROR: "+s)}wait(s){return new Promise(e=>setTimeout(e,s))}done(s={}){this.isQX?this.isRequest&&$done(s):this.isLoon||this.isSurge?this.isRequest?$done(s):$done():this.isNode&&!this.isJSBox&&"undefined"!=typeof $context&&($context.headers=s.headers,$context.statusCode=s.statusCode,$context.body=s.body)}}(s,e)}