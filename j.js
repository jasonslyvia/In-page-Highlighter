
//if there is a selection
document.addEventListener('mouseup',function(event){
    var sel = window.getSelection().toString().trim();
    if(sel.length){
		highlight(sel);
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