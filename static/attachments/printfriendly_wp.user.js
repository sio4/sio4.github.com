// ==UserScript==
// @name           PrintFriendly WP
// @namespace      http://sio4.tistory.com
// @description    Print Friendly version of WebPage.
// @include        http://www.howtoforge.com/*
// @X-Last-Modified	Thu, 19 Mar 2009 09:05:19 +0900
// ==/UserScript==

//
// common functions. can i share these with other script? how can i include?
//
function getElementsByClass(searchClass,node,tag) {
	var classElements = new Array();
	if ( node == null )
		node = document;
	if ( tag == null )
		tag = '*';
	var els = node.getElementsByTagName(tag);
	var elsLen = els.length;
	var pattern = new RegExp('(^|\\s)'+searchClass+'(\\s|$)');
	for (i = 0, j = 0; i < elsLen; i++) {
		if ( pattern.test(els[i].className) ) {
			classElements[j] = els[i];
			j++;
		}
	}
	return classElements;
}

function getElementsByText(search,node,tag) {
	var classElements = new Array();
	if ( node == null )
		node = document;
	if ( tag == null )
		tag = '*';
	var els = node.getElementsByTagName(tag);
	var elsLen = els.length;
	for (i = 0, j = 0; i < elsLen; i++) {
		if ( els[i].textContent.indexOf(search) == 0 ) {
			classElements[j] = els[i];
			j++;
		}
	}
	return classElements;
}



function hideElement(el)
{
	if (el == null) return;
	el.style.display = 'none';
}

function hideElements(els)
{
	if (els == null) return;
	var elsLen = els.length;
	for (i = 0, j = 0; i < elsLen; i++) {
		els[i].style.display = 'none';
	}
}


function add_my_style(site_ccss)
{
	// add ny own style sheet.
	var st = "@media print{";
	st = st + "body,p,* {";
	st = st + " font-family: Trebuchet MS;";
	st = st + " font-size: 11pt;";
	st = st + " text-align: justify;";
	st = st + " line-height: 1.4;";
	st = st + "}";
	st = st + ".header {display: none}";
	st = st + "}";
	st = st + "";
	st = st + ".system {font-size:9pt; font-family:Courier New;";
	st = st + " text-align:left}";
	st = st + ".command {font-size:9pt; padding:0.5em; text-align:left}";
	st = st + "pre {font-size: 9pt;}";
	st = st + "pre {height: 100%;}";
	st = st + "h1,h2,h3,h4 {text-align: left;}";
	st = st + "ul,ol {margin-left: 30pt;}";
	st = st + "";
	st = st + "body,p,* {";
	st = st + " font-family: Trebuchet MS;";
	st = st + " font-size: 11pt;";
	st = st + " text-align: justify;";
	st = st + " line-height: 1.4;";
	st = st + "}";
	st = st + site_ccss;
	var head=document.getElementsByTagName("HEAD")[0];
	var el=window.document.createElement('link');
	el.rel='stylesheet';
	el.type='text/css';
	el.href='data:text/css;charset=utf-8,'+escape(st);
	head.appendChild(el);
}


GM_registerMenuCommand("Print Format", function() {
}
)


/*
 * site specific code here:
 *
 *
 *
 */

/* (from 2009-03-31 to ) */
if (location.href.indexOf("bloter.net") != -1) {
GM_registerMenuCommand("Printable Bloter.net", function() {
	hideElement(document.getElementById('site-header'));
	hideElement(document.getElementById('page-extras'));
	hideElement(document.getElementById('page-footer'));

	hideElements(getElementsByClass('post-divider', document, 'div'));
		//hideElement(document.getElementById('respond'));
		//hideElement(document.getElementById('commentform'));

	//document.getElementById('masterwrap').style.height = '';
	//document.getElementById('page-container').style.width = '';
	//document.getElementById('bigwrap').style.width = '';
})
	hideElement(document.getElementById('STATICMENU'));
	hideElement(document.getElementById('sponser-gallery'));
	hideElements(document.getElementsByTagName('ins'));
	hideElements(getElementsByClass('ad'));
}

/* it works: */
if (location.href.indexOf("howtoforge.com") != -1) {
GM_registerMenuCommand("Printable HowtoForge", function() {
	hideElement(document.getElementById('primary'));
	hideElement(document.getElementById('search'));
	hideElement(document.getElementById('sidebar-left'));

	hideElements(getElementsByText('Do you like HowtoForge'));

	hideElements(getElementsByClass('additional_links'));
	hideElement(document.getElementById('adleaderboard'));
	hideElement(document.getElementById('breadcrumbs'));
	hideElement(document.getElementById('adrectanglea'));
	hideElement(document.getElementById('adrectangleb'));
	hideElement(document.getElementById('footer'));

	hideElements(getElementsByClass('links'));
	hideElements(getElementsByClass('copyright-footer'));
	hideElement(document.getElementById('relatedlinks'));

	getElementsByClass('centercolumn')[0].style.margin = 0;

	hideElements(getElementsByText('Please do not use the'));
	hideElements(getElementsByText('Sponsored Links'));

	hideElements(document.getElementsByTagName('form'));
	//document.getElementsByTagName('link')[0].disabled = true;

	//
	// repeated no-break-space breaks print format!
	document.body.innerHTML
		= document.body.innerHTML.replace(/&nbsp;&nbsp;/g, ' &nbsp;');
	document.body.innerHTML
		= document.body.innerHTML.replace(/([^ ])&nbsp;/g, '$1 ');

	var site_ccss = "";
	add_my_style(site_ccss);
})
}


GM_registerMenuCommand("Printable Trac", function() {
	hideElement(document.getElementById('banner'));
	hideElement(document.getElementById('mainnav'));
	hideElement(document.getElementById('ctxtnav'));
	hideElements(getElementsByClass('path noprint'));
	hideElement(document.getElementById('footer'));

	document.getElementById('content').style.margin = '2px';
	getElementsByClass('wiki-toc')[0].style.float = 'none';

	var site_ccss = "";
	add_my_style();

	// misc
	var els = document.getElementsByTagName('img');
	var elsLen = els.length;
	for (i = 0; i < elsLen; i++) {
		if (els[i].width > 700) {
			els[i].width = 700;
		}
	}
})

GM_registerMenuCommand("Test for WordPress", function() {
if (location.href.indexOf("wordpress.com") != -1) {
	hideElement(document.getElementById('header'));
	hideElement(document.getElementById('pagebar'));
	hideElement(document.getElementById('sidebar'));
	hideElement(document.getElementById('respond'));
	hideElement(document.getElementById('footer'));
}
})


GM_registerMenuCommand("Test for Blogspot", function() {
	if (location.href.indexOf("blogspot.com") != -1) {
		hideElement(document.getElementById('navbar'));
		hideElement(document.getElementById('header-wrapper'));
		hideElement(document.getElementById('sidebar-wrapper'));
		hideElement(document.getElementById('footer-wrapper'));
		document.getElementById('main-wrapper').style.width = '';
		hideElements(getElementsByClass('news-digg'));
	}
}
)



