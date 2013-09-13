//for the reason content_script can't read options stored in local storage,
//using Chrome API to retreive these options

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if (request.method == "getOptions"){
		sendResponse({options: localStorage});
	}
	else if(request.method == "copy" && request.msg){
		var text = document.createElement("textarea");
		text.value = request.msg;
		document.body.appendChild(text);
		text.select();
		document.execCommand("copy", false, null);
		
		sendResponse(null);
	}
    else{
      sendResponse(null);
	}
});

chrome.runtime.onInstalled.addListener(function(details){
	if (details.reason == "install") {
		chrome.tabs.create({url: "options.html"});
	}
});