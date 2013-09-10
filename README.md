In-page Highlighter
===================

Instantly highlight anything you select in current page, built for Google Chrome plug-in.

[中文版说明](http://undefinedblog.com/2013/09/chrome-plugin-in-page-highlighter/)

##Usage

**Before selection**

![inpage highlighter usage](http://ww4.sinaimg.cn/mw690/831e9385jw1e8h7jn93tgj20pu0dwdie.jpg)

**After selection(select or double click)**

![inpage highlighter usage](http://ww2.sinaimg.cn/mw690/831e9385jw1e8h7jm1p96j20pq0dx414.jpg)

##Deployment

1. Download the project as a .zip file
2. Extract everything to a preferred directory
3. Open Google Chrome Settings, change to **Extensions** panel
4. Make sure **Developer Mode** is checked
5. Click **Load unpacked extension**, with the dialog open, choose the directory aformentioned

##Migration

This plug-in is designed for Google Chrome used only, however it can be esaily migrated to Mozilla Firefox. The core function is located in `j.js`.

However, if you want to migrate it to Internet Explorer or some other browsers that might **NOT** have a integrated implmentation of ECMAScript 5, you should pay attention to following functions:

```javascript
1. String.prototype.trim
2. document.querySelectorAll
3. document.createTreeWalker
4. String.prototype.split(RegExp)
```

##TODO
 - [ ] Option pages
 - [ ] Internationalization 
 - [ ] Bugs fix

##License

This project is under MIT License.
 
