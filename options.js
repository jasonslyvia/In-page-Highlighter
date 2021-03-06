document.addEventListener("DOMContentLoaded", getOptions);
document.addEventListener("DOMContentLoaded", function(){
	//load localization messages
	var title = chrome.i18n.getMessage("optionTitle");
	document.getElementById("title").innerText = title;

	var selectionLimit = chrome.i18n.getMessage("selectionLimit");
	document.getElementById("selectionLengthLimitLabel").innerText = selectionLimit;

	var hotKey = chrome.i18n.getMessage("hotKey");
	document.getElementById("hotKeyLabel").innerText = hotKey;

	var autoCopy = chrome.i18n.getMessage("autoCopy");
	document.getElementById("shouldAutoCopyLabel").innerText = autoCopy;

	var miniMap = chrome.i18n.getMessage("miniMap");
	document.getElementById("enableMiniMapLabel").innerText = miniMap;

	var caseSensitive = chrome.i18n.getMessage("caseSensitive");
	document.getElementById("caseSensitiveLabel").innerText = caseSensitive;

	var OKButton = chrome.i18n.getMessage("OKButton");
	document.getElementById("submit").innerText = OKButton;

	var defaultButton = chrome.i18n.getMessage("defaultButton");
	document.getElementById("default").innerText = defaultButton;

	var successMessage = chrome.i18n.getMessage("successMessage");
	document.getElementById("message").innerText = successMessage;

	var warningMessage = chrome.i18n.getMessage("warningMessage");

	//bind submit and default button click event
	document.getElementById("submit").addEventListener("click", setOptions);
	document.getElementById("default").addEventListener("click", function(){
		if(confirm(warningMessage)){
			localStorage.removeItem("selectionLengthLimit");
			localStorage.removeItem("hotKey");
			localStorage.removeItem("shouldAutoCopy");
			localStorage.removeItem("enableMiniMap");
			localStorage.removeItem("caseSensitive");
			location.reload();
		}
	});
});

//read options from local storage and fill in the html form
function getOptions(){
	if(!localStorage["selectionLengthLimit"]){
		localStorage["selectionLengthLimit"] = 3;
	}
	document.getElementById("selectionLengthLimit").value = localStorage["selectionLengthLimit"];

	if(!localStorage["hotKey"]){
		localStorage["hotKey"] = "alt";
	}
	document.getElementById("hotKey").value = localStorage["hotKey"];

	if(!localStorage["shouldAutoCopy"]){
		localStorage["shouldAutoCopy"] = "true";
	}

	if (!localStorage["caseSensitive"]) {
		localStorage["caseSensitive"] = "false";
	}
	//fix for local storage doesn't recognize boolean type
	document.getElementById("shouldAutoCopy").checked = JSON.parse(localStorage["shouldAutoCopy"]);
	document.getElementById("enableMiniMap").checked = JSON.parse(localStorage["enableMiniMap"]);
	document.getElementById("caseSensitive").checked = JSON.parse(localStorage["caseSensitive"]);
}

//read options from html form and store in local storage
function setOptions(){
	var selectionLengthLimit = document.getElementById("selectionLengthLimit").value;
	if(parseInt(selectionLengthLimit, 10) > 0){
		localStorage["selectionLengthLimit"] = selectionLengthLimit;
	}

	var hotKey = document.getElementById("hotKey").value;
	if(hotKey == "none" || hotKey == "ctrl" || hotKey == "alt" || hotKey == "shift"){
		localStorage["hotKey"] = hotKey;
	}

	var shouldAutoCopy = document.getElementById("shouldAutoCopy").checked;
	if(shouldAutoCopy){
		localStorage["shouldAutoCopy"] = "true";
	}
	else{
		localStorage["shouldAutoCopy"] = "false";
	}

	var enableMiniMap = document.getElementById("enableMiniMap").checked;
	if(enableMiniMap){
		localStorage["enableMiniMap"] = "true";
	}
	else{
		localStorage["enableMiniMap"] = "false";
	}

	var caseSensitive = document.getElementById("caseSensitive").checked;
	if (caseSensitive) {
		localStorage["caseSensitive"] = "true";
	}
	else{
		localStorage["caseSensitive"] = "false";
	}

	var message = document.getElementById("message");
	message.style.display = "block";
	setTimeout(function(){
		message.style.display = "none";
	}, 2000);
}