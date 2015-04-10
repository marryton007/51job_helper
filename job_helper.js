var  PAGENO  = "currpage";
var  rules =  [];
var  exclude_keys = [];
var  exclude_comps = [];
var  timerConfig, timerUser, timerState;
var  page_cnt;
var  curr_page;
var  current_state;
var  fsm_states = {};
var  config = {};
var  user = {};

//  复制map
// function  copyMap(src, dest){
//   $.map(src, function(ele, idx){
//        dest[idx] = ele;
//   });
// }

// 调试
function debug(x){
  if( typeof(config.debug) != "undefined" && config.debug == "true"){
    console.log("Debug: "+x);
  }
}


//  关键字匹配规则
function  Rule(name, fn){
    this.name = name;
    this.fn = fn;
};

Rule.prototype.execRule = function  (title, company){
       return this.fn(title, company); 
    };

//  要排除的职位
var noMatch = new Rule("execlueTitle", function(title, company){
    var tmp_res = true;
    var title_arry = formatStrArr(title);
    $.each(exclude_keys,function(idx, pat){
        $.each(title_arry, function(idx, str){
          if(str.indexOf(pat) != -1){
             tmp_res = false;
             return false;
          }
        });
    });
    return tmp_res;
});

//  要排除的公司
var noCompany = new Rule("execudeCompany", function(title, company){
    var tmp_res = true;
    $.each(exclude_comps, function(idx, comp){
        if(comp == company){
            tmp_res = false;
            return false;
        }
    });
    return tmp_res;
});

//  职位比较
var match = new Rule("Match", function(title, company){
    var m_res = false;
    var keys = formatStrArr(getKeyWord());
    var title_arr = formatStrArr(title);
    $.each(keys, function(idx, s){
        $.each(title_arr, function(idx, d){
           if(d.indexOf(s) != -1){
              m_res = true;
              return false;
           }
        });
    });
    return m_res;
});

rules[0] = noMatch;
rules[1] = noCompany;
rules[2] = match;

// 获得搜索关键字
function getKeyWord() {
	var keys = $("div.insearch2").find("input[name='keyword']");
	var key = null;
	if (keys.length > 0) {
		key = keys[0].value;
	}
	return key;
}

// 对字符串作一些处理，并以空白字符作为分隔符，返回字符串数组
function formatStrArr(str){
  if(str == null){
    return [];
  }
  var tmp_arr = str.trim().toUpperCase().replace("/", " ").split(/\s+/);
  var arr = $.grep(tmp_arr, function(ele, idx){
    return ele.length > 0;
  });
  $.each(arr,function(idx, str){
    str.trim();
  });
  
  return arr;
}

// 计算搜索关键字和职位名称是否匹配
function calMatchRate(title, company){
  var res = false;
  $.each(rules, function(idx, rule){
       res = rule.execRule(title, company);
       debug("Rule: " + rule.name + " got the result with '" + title +" : "+ company +"' is " + res);
       if(!res){
              return false;
       }
  });
  debug("the final result is " + res);
  return res;  
}

// 在职位列表中筛选符合条件的职位
function getSearchResult(cb){
  var t_cnt = 0;
  var keyword = formatStrArr(getKeyWord()); 
  var lines = $("#resultList").find("tr.tr0").each(function(index, element){
    var tmp = $(element);
    var title = tmp.find("td:eq(1) a").text();
    var company = tmp.find("td:eq(2) a").text().trim();
    if( calMatchRate(title, company)){
        tmp.find("td:eq(0) input[type='checkbox']").attr("checked", "true");
        t_cnt++;
        debug("select " + t_cnt + " jobs on this page.");
    }
  });
  setTimeout(cb(t_cnt, nextPage), 2000);
}

//find the '申请选中职位' link and trigger it's click event.
function triggerStartPost(n, callback){
  if(n > 0){
    debug("start to post ...");
    $("table.resultNav td span a.orange1:eq(1)").get(0).click();
  }
  
  debug("set timeout second 10 to go to next page ...");
  setTimeout(callback, parseInt(config.interval)* 1000);
}

// goto next page
function nextPage(){
  debug("goto next page now.");
  var next = $("table.searchPageNav td img:eq(1)");
  if ($(next).attr("src").indexOf("pageron.gif") != -1) {
    $(next).get(0).click();
  } else{
    // 没有下一页了
    debug("No more page ...");
    logout();
  };
  
}


// 投递一页
function postOnePage(){ 
  getSearchResult(triggerStartPost);
}

// 登入
function login(){
      $("#username").val(user.username);
      $("#userpwd").val(user.password);
      setState("has_logined", function(){
        $("#signin li.padding_distance a input").get(0).click();
      });
}

//  登出
function logout(){
    var req_tmp_l = {};
    req_tmp_l.action = "logout";
    chrome.runtime.sendMessage(req_tmp_l, function(logout_msg){
       delete sessionStorage[PAGENO];
       debug(logout_msg.info);
    });
    $("#loginOutLink a").get(0).click();    
}

// 设置搜索关键字和工作地点
function setKeywordAndCity(){
     $("#kwdTypeSel li:eq(1)").click(); // 按职位搜索
     $("div.left_t  p input.kwdBold").val(config.title);
     //$("div.left_t  p input[name='btnJobarea']").val(config.workCity);   // 上海
     $("div.left_t  p input[name='jobarea']").val(config.workCity.replace(",","+"));
     $("table.condSelTbl select[name='issuedate']").val(config.postDate);     // 近一周
     setState("has_setKeywordAndCity", function(){
       $("div.insearch3 p.searchan input[name='image']").get(0).click();
     });
}

// 高级搜索
function expertSearch(){
    setState("has_expertSearch", function(){
      $("#my_search div.spsearch a:eq(0)").get(0).click();
    });
    
} 


// 投递多页
function postPages(){
  exclude_keys = formatStrArr(config.exclude_title);
  exclude_comps =  formatStrArr(config.exclude_company);

  page_cnt = parseInt(config.totalPage);
  curr_page = parseInt(sessionStorage[PAGENO] || "0");
  if(curr_page < page_cnt){
    sessionStorage[PAGENO] = ++curr_page;
    debug("sessionStorage[PAGENO]" + curr_page);
    postOnePage();
  }else{
    logout();
  }
}

// 获取配置信息
function getConfig(){
    var req_tmp_conf = {};
    req_tmp_conf.action = "getConfig";
    chrome.runtime.sendMessage(req_tmp_conf, function(config_msg){
      if(config_msg.state == "OK"){
        if(typeof(timerConfig) != "undefined"){
          window.clearInterval(timerConfig);
          delete timerConfig;
        }
        config = config_msg;
        debug("received config info from background: ");

        $.each(config, function(idx, ele){
          debug(idx + " : " + ele);
        });      
        
        startUserTimer(); 
      }          
    });
}

// 获得用户名和密码信息
function  getUser(){
    var  req_tmp_u = {};
    req_tmp_u.action = "getUser";
    chrome.runtime.sendMessage(req_tmp_u, function(user_msg){
      if(user_msg.state == "OK"){
        if(typeof(timerUser) != "undefined"){
          window.clearInterval(timerUser);
          delete timerUser;
        }
        user = user_msg;        
        debug("received user info from background: ");
        $.each(user, function(key, value){
          debug(key + " : " + value);
        }); 

        startStateTimer();
      }
      if(user_msg.state == "MAX"){
         if(typeof(timerUser) != "undefined"){
          window.clearInterval(timerUser);
          delete timerUser;
        }
        debug("all resume has posted.");
      }          
  });
}

function getState(){
    var req_tmp_s = {};
    req_tmp_s.action = "getState";
    chrome.runtime.sendMessage(req_tmp_s, function(state_msg){
      if(state_msg.state == "OK"){
        if(typeof(timerState) != "undefined"){
          window.clearInterval(timerState);
          delete timerState;
        }
         current_state = state_msg.curState;
         debug("the state is: "+ current_state);
         fsm_states[current_state](); 
      }
    });
}

function setState(newState, cb){
  var req_tmp_set = {};
  req_tmp_set.action = "setState";
  req_tmp_set.newState = newState;
  chrome.runtime.sendMessage(req_tmp_set, function(result){
    debug("set State OK"+ result.info);
    cb();
  });
}

// 启动请求配置定时器
function startConfigTimer(){
  timerConfig = setInterval(getConfig, 3000);
}

// 启动请求用户信息定时器
function startUserTimer(){
  timerUser =  setInterval(getUser, 3000);
}

function startStateTimer(){
  timerState = setInterval(getState, 3000);
}

fsm_states["undefined"] = login;
fsm_states["has_logined"] = expertSearch;
fsm_states["has_expertSearch"] = setKeywordAndCity;
fsm_states["has_setKeywordAndCity"] = postPages;


location.href="javascript: window.alert = function(x) {console.log(x)}; window.confirm = function(x){console.log(x); return true;};";
$(document).ready(startConfigTimer);

console.log("Waiting for start .....");

