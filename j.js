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

		if(hotKey != "none"){
			//make default hotkey to alt
			if (!hotKey) {
				hotKey = "alt";
			}

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
			}
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
		buildMap();
		if(shouldAutoCopy == "true"){
			chrome.extension.sendRequest({method: "copy", msg: sel}, function(response) {
				console.log("copied");
			});
		}

    }
});

//if there is highlighted word, make it normal
document.addEventListener('click', function(e){
	var highlight = document.querySelectorAll("span.pp-highlight");
	if(!!highlight){
		Array.prototype.forEach.call(highlight, function(h){

			var parent = h.parentNode;
			var textNode = document.createTextNode(h.innerText);
			parent.replaceChild(textNode.cloneNode(false), h);
			//call normalize to combine separated text nodes
			parent.normalize();

		});
	}

	var map = document.getElementsByClassName("pp-map");
	if (map.length > 0) {
		map[0].parentNode.removeChild(map[0]);
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
		//empty the parent node   BAD IDEA!!!! fixed it
		//keep the reference to current node
		var parent = node.parentNode;
		if(!parent){
			parent = node;
			parent.nodeValue = '';
		}
		//prevent duplicate highlighting
		else if(parent.className == "pp-highlight"){
			continue;
		}

		//find every occurance using split function
		var parts = node.data.split(new RegExp('('+term+')'));
		var newNodes = [];
		for(var j=0; j<parts.length; j++){
			var part = parts[j];
			//continue if it's empty
			if(!part){
				continue;
			}
			//create new element node to wrap selection
			else if(part == term){
				var newNode = document.createElement("span");
				newNode.className = "pp-highlight";
				newNode.innerText = part;
				newNodes.push(newNode);
				//parent.insertBefore(newNode, node);
			}
			//create new text node to place remaining text
			else{
				var newTextNode = document.createTextNode(part);
				newNodes.push(newTextNode);
				//parent.insertBefore(newTextNode, node);
			}
		}

		var insertNode;
		while(insertNode = newNodes.shift()){
			parent.insertBefore(insertNode, node);
		}

		//remove the original node finally
		parent.removeChild(node);

	}
}


function buildMap(){

	//calculate offsetTop of every highligh span and store into an arry
	var highlights = document.getElementsByClassName("pp-highlight");
	if (!highlights) {
		return false;
	}

	highlights = Array.prototype.slice.call(highlights, 0);
	var highlightArray = [];
	highlights.forEach(function(element, index, array){
		var offsetTop,
			el = element;

		offsetTop = el.offsetTop;
		while(el = el.offsetParent){
			offsetTop += el.offsetTop;
		}

		highlightArray.push(offsetTop);
	});

	//build a minimap
	var docHeight = document.height;
	var map = document.createElement("div");
	map.className = "pp-map";
	for (var i = highlightArray.length - 1; i >= 0; i--) {
		var span = document.createElement("span");
		span.className = "pp-map-span";
		span.style.top = (parseFloat(highlightArray[i] / docHeight, 10) * 100) + '%';
		map.appendChild(span);
	}

	document.body.appendChild(map);
}
