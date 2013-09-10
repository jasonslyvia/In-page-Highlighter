/*
The MIT License (MIT)

Copyright (c) <2013> <Sen Yang>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

//get options first
var selectionLengthLimit;
var hotKey;
var shouldAutoCopy;
var hotKeyFlag = false;
var keyCode = null;

chrome.extension.sendRequest({method: "getOptions"}, function(response) {
	if(typeof response === "object"){
		var options = response.options;
		selectionLengthLimit = options["selectionLengthLimit"];
		hotKey = options["hotKey"];
		shouldAutoCopy = options["shouldAutoCopy"];
		
		if(hotKey && hotKey != "none"){
			switch(hotKey){
				case "ctrl":{
					keyCode = 17;
				}
				break;
				case "alt":{
					keyCode = 18;
				}
				break;
				case "shift":{
					keyCode = 16;
				}
				break;
				default:{
				}
				break;
			};
		}

		document.addEventListener("keydown", function(e){
			if(e.keyCode == keyCode){
				hotKeyFlag = true;
			}
		});
		document.addEventListener("keyup", function(){
			hotKeyFlag = false;
		});

	}
});


//if there is a selection
document.addEventListener('mouseup',function(event){
	if(hotKey && hotKey != "none" && !hotKeyFlag)
		return false;

    var sel = window.getSelection().toString().trim();
	if(selectionLengthLimit && sel.length < selectionLengthLimit)
		return false;
		
    if(sel.length){
		highlight(sel);
		if(shouldAutoCopy == "true"){
			chrome.extension.sendRequest({method: "copy", msg: sel}, function(response) {
				console.log("copied");
			});
		}
    }
});

//if there is highlighted word, make it normal
document.addEventListener('click', function(e){	
	var highlight = document.querySelectorAll("span.highlight");
	if(!!highlight){
		for(var i=0; i<highlight.length; i++){
			var h = highlight[i];
			var parent = h.parentNode;
			var textNode = document.createTextNode(h.innerText);
			parent.replaceChild(textNode.cloneNode(false), h);
			//call normalize to combine separated text nodes
			parent.normalize();
		}
	}
});

function highlight(term){
	if(!term){
		return false;
	}
	
	//use treeWalker to find all text nodes that match selection
	//supported by Chrome(1.0+)
	//see more at https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker
	var treeWalker = document.createTreeWalker(
		document.body,
		NodeFilter.SHOW_TEXT,
		null,
		false
		);
	var node = null;
	var matches = [];
	while(node = treeWalker.nextNode()){
		if(node.nodeType === 3 && node.data.indexOf(term) !== -1){
			matches.push(node);
		}
	}
	
	//deal with those matched text nodes
	for(var i=0; i<matches.length; i++){
		node = matches[i];
		//empty the parent node
		var parent = node.parentNode;
		if(!parent){
			parent = node;
			parent.nodeValue = '';
		}
		//prevent duplicate highlighting
		else if(parent.className == "highlight"){
			continue;
		}
		else{
			while(parent && parent.firstChild){
				parent.removeChild(parent.firstChild);
			}
		}
		
		//find every occurance using split function
		var parts = node.data.split(new RegExp('('+term+')'));
		for(var j=0; j<parts.length; j++){
			var part = parts[j];
			//continue if it's empty
			if(!part){
				continue;
			}
			//create new element node to wrap selection
			else if(part == term){
				var newNode = document.createElement("span");
				newNode.className = "highlight";
				newNode.innerText = part;
				parent.appendChild(newNode);
			}
			//create new text node to place remaining text
			else{
				var newTextNode = document.createTextNode(part);
				parent.appendChild(newTextNode);
			}
		}
		
	}
}