function getDomainFromUrl(url){
	var host = "null";
	if(typeof url == "undefined" || null == url)
		url = window.location.href;
	var regex = /.*\:\/\/\w*\.([^\/]*).*/;
	var match = url.match(regex);
	if(typeof match != "undefined" && null != match)
		host = match[1];
	return host;
}

function checkForValidUrl(tabId, changeInfo, tab) {
	if(getDomainFromUrl(tab.url).toLowerCase()=="51job.com"){
		chrome.pageAction.show(tabId);
	}
};

chrome.tabs.onUpdated.addListener(checkForValidUrl);

var data = {};
var user = {};
var bg_current_state;
var bg_user_idx = 0;
var isUserUpdated = false;
var isPageUpdated = false;
var d_debug = "false"
var d_interval = 10;
var d_totalPage = 30;
var d_exclude_title = "php java .Net c# 数据库 单片机 fpja pcb 技术支持 测试 维护";
var d_exclude_company = "上海四域信息技术有限公司 上海同百实业有限公司 上海沛鸿网络科技有限公司 上海达内软件科技有限公司 上海海同信息科技有限公司 上海武创信息科技有限公司 上海三越软件科技有限公司 北京华清远见科技信息有限公司 上海游爱数码科技有限公司 太原市景田科技发展有限公司 上海塞依信息科技有限公司 绍兴智视信息科技有限公司 成都天巧科技有限公司 深圳市深嵌科技有限公司 上海志盟信息科技有限公司";

var default_data = {
    interval : d_interval,
    totalPage: d_totalPage,
    exclude_title: d_exclude_title,
    exclude_company: d_exclude_company,
    debug:  d_debug,
    orig_user: "",
    postDate: "4",
    title: "c/c++工程师",
    workCity: "020000"
};


// 重设数据
data.reset = function(){
      $.each(default_data, function(idx, key){
        localStorage.removeItem(idx);
        data[idx] = key;
      });
      isUserUpdated = true;
};

//  保存数据到浏览器中
data.save = function(){
      $.each(default_data, function(idx, key){
        if(idx == "orig_user" && localStorage[idx] != data[idx]){
            isUserUpdated = true;
        }
        if(idx == "totalPage" && localStorage[idx] != data[idx]){
            isPageUpdated = true;
        }
        localStorage[idx] = data[idx];
      });
};    

//  从浏览器中恢复数据
data.load = function(){
      $.each(default_data, function(idx, key){
        data[idx] = localStorage[idx] || key
      });
};

data.incUserIndex = function(){
      bg_user_idx++;
      
}

//  获得用户信息
data.getUser = function(){
       // 如果用户列表有更新，则重头开始
       if(isUserUpdated){
          bg_user_idx = 0;
       } 
       var users = data.orig_user.split(/\n/g);
       if (bg_user_idx < users.length){
           var str = users[bg_user_idx].split(/\s+/);
           user.username = str[0];
           user.password = str[1];
           user.state = "OK";
       }else{
           user.state = "MAX";
       }
       
       return user; 
}

function loadOptions(tabId, changeInfo, tab) {
    console.log("load data again...");
    data.load();
}


chrome.tabs.onUpdated.addListener(loadOptions);

chrome.runtime.onMessage.addListener(
  function(request, sender, response){
     if(request.action == "getConfig"){
        console.log("received a 'getConfig' request.");
        data.state = "OK";
        response(data);
        return true;
     }
     if(request.action == "getUser"){
        console.log("received a 'getUser' request.");
        response(data.getUser());
        return true;
     }
     if(request.action == "logout"){
        console.log("received a 'logout' request.");
        data.incUserIndex();
        bg_current_state = "undefined";
        response({info:"logout OK"});
        return true;
     }
     if(request.action == "getState"){
        console.log("received a 'getState' request.");
        response({state:"OK", curState:bg_current_state});
     }
     if(request.action == "setState"){
        console.log("received a 'setState' request.");
        bg_current_state = request.newState;
        response({info:"OK"});
     }
});