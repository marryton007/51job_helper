    var data = chrome.extension.getBackgroundPage().data; 
    
    $(document).ready(reloadOptions);
    $("#save").click(saveOptions);
    $("#reset").click(resetOptions);
    
    function parseBool(str){
      var r = false;
      if(str == "true"){
        r = true;
      }
      return  r;
    }
    
    function saveOptions(){
        data.interval = $("#interval").val();
        data.totalPage = $("#totalPage").val();
        data.exclude_title = $("#exclude_title").val();
        data.exclude_company = $("#exclude_company").val();
        data.debug =  $("#debug").get(0).checked;
        data.orig_user =  $("#users").val();
        data.postDate = $("#postDate").val();
        data.workCity = [];
        var cities = $("#city input[type='checkbox']");
        $.each(cities, function(idx, el){
            if ($(el).get(0).checked) {
                data.workCity.push($(el).val());
            };
        });
        data.title = $("#title").val();
        
        data.save();
        reloadOptions();
    }
    
    function resetOptions(){
        data.reset();
        reloadOptions();        
    }
    
    function reloadOptions(){
        data.load();
        $("#interval").val(String(data.interval));
        $("#totalPage").val(String(data.totalPage));
        $("#exclude_title").val(String(data.exclude_title));
        $("#exclude_company").val(String(data.exclude_company));
        $("#debug").get(0).checked = parseBool(data.debug);
        $("#users").val(String(data.orig_user));
        $("#postDate").val(String(data.postDate));
        $("#title").val(String(data.title));
        var  citys = $("#city input[type='checkbox']");
        $.each(citys, function(idx, el){
            $(el).get(0).checked = false;
        });
        var  tmp_city = data.workCity.split(",");
        $.each(tmp_city, function(idx, e){
            //console.log(e);
            $("#city input[type='checkbox'][value='"+e+"']").get(0).checked = true;
        });
    }
