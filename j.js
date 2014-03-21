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

var InPageHighlighter = {
  init: function(){
    var self = this;

    //get user defined option and init event listeners
    self._getOption(self._listenHotKeyPress);

    //start listening to mouse event and prepare highlight
    self._prepareHighlight();
  },

  _getOption: function(callback){
    var self = this;
    chrome.extension.sendRequest({method: "getOptions"}, function(response) {
      if(typeof response === "object"){
        var options = response.options;
        self.selectionLengthLimit = options["selectionLengthLimit"];
        self.hotKey = options["hotKey"];
        self.shouldAutoCopy = options["shouldAutoCopy"];
        self.enableMiniMap = options["enableMiniMap"];

        if(self.hotKey != "none"){
          //make default hotkey to alt
          if (!self.hotKey) {
            self.hotKey = "alt";
          }
          switch(self.hotKey){
            case "ctrl":{
              self.keyCode = 17;
            }
            break;
            case "alt":{
              self.keyCode = 18;
            }
            break;
            case "shift":{
              self.keyCode = 16;
            }
            break;
            default:{
            }
            break;
          }
        }
      }

      //option got, listen hot key press events
      typeof callback === "function" && callback.call(self);
    });
  },

  _listenHotKeyPress: function(){
    var self = this;
    document.addEventListener("keydown", function(e){
      if(e.keyCode == self.keyCode){
        self.hotKeyFlag = true;
      }
    });
    document.addEventListener("keyup", function(){
      self.hotKeyFlag = false;
    });
  },

  _prepareHighlight: function(){
    var self = this;
    document.addEventListener('mouseup',function(event){
      //accroding to the existence of '.pp-highlight',
      //we determine whether to highlight some words or
      //remove the highlights
      var highlights = document.querySelectorAll(".pp-highlight");
      var highlightExist = (highlights.length) ? true : false;

      if (!highlightExist) {
        //if config says need hotkey, detect is hotkey pressed
        if(self.hotKey && self.hotKey != "none" && !self.hotKeyFlag){
            return false;
        }

        //get user selection
        var selection = window.getSelection();
        var sel = selection.toString().trim();
        if(self.selectionLengthLimit &&
           sel.length < self.selectionLengthLimit){
          return false;
        }

        //if there is valid selection, highlight them
        if(sel.length){
          self._highlight(sel);
          if (self.enableMiniMap == "true") {
            self._buildMap();
          }
          if(self.shouldAutoCopy == "true"){
            self._copyToClipboard(sel);
          }
        }
      }
      else{
          //if current selection contains highlight,
          //make it looks like native when right click it
          if (event.button === 2 && event.target.className === "pp-highlight") {
            return self._rightClickPolyfill(event);
          }

          //remove highlight nodes
          if(!!highlights){
            self._deHighlight(highlights);
          }

          //remove mini map
          self._removeMap();
      }

      return true;
    });
  },

  _highlight: function(term){
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

    //who the hell will select one character?
    if (matches.length > 100 && !confirm(chrome.i18n.getMessage("matchesTooManyWarnMessage"))) {
      return false;
    }

    //deal with those matched text nodes
    for(var i=0; i<matches.length; i++){
      node = matches[i];
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
        }
        //create new text node to place remaining text
        else{
          var newTextNode = document.createTextNode(part);
          newNodes.push(newTextNode);
        }
      }

      var insertNode;
      while(insertNode = newNodes.shift()){
        parent.insertBefore(insertNode, node);
      }

      //remove the original node finally
      parent.removeChild(node);
    }
  },

  _deHighlight: function(highlights){
    Array.prototype.forEach.call(highlights, function(h){
      var parent = h.parentNode;
      var textNode = document.createTextNode(h.innerText);
      parent.replaceChild(textNode.cloneNode(false), h);
      //call normalize to combine separated text nodes
      parent.normalize();
    });
  },

  _buildMap: function(){
    //calculate offsetTop of every highligh span and store into an arry
    var highlights = document.querySelectorAll(".pp-highlight");
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
    var _b = document.body,
        _d = document.documentElement;
    var docHeight = Math.max(_b.offsetHeight, _b.scrollHeight, _d.offsetHeight, _d.clientHeight, _d.scrollHeight);
    var map = document.createElement("div");
    map.className = "pp-map";
    for (var i = highlightArray.length - 1; i >= 0; i--) {
      var span = document.createElement("span");
      span.className = "pp-map-span";
      span.style.top = (parseFloat(highlightArray[i] / docHeight, 10) * 100) + '%';
      map.appendChild(span);
    }

    document.body.appendChild(map);
  },

  _removeMap: function(){
    var map = document.getElementsByClassName("pp-map");
    if (map.length > 0) {
      map[0].parentNode.removeChild(map[0]);
    }
  },

  _copyToClipboard: function(term){
    chrome.extension.sendRequest({
      method: "copy",
      msg: term
    }, function(response) {
    });
  },

  _rightClickPolyfill: function(event){
    event.target.className = "";

    var textChild = event.target.lastChild;
    var nodeLength = textChild.nodeValue.length;
    var range = document.createRange();
    range.setStart(textChild, 0);
    range.setEnd(textChild, nodeLength);

    var _sel = window.getSelection();
    _sel.removeAllRanges();
    _sel.addRange(range);

    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false,2 ,null);
    event.target.dispatchEvent(evt);

    return true;
  }
};


InPageHighlighter.init();
