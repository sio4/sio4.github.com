---
redirect_from: /blog/2009/03/19/mozilla-search-for-howtoforge/
title: HowtoForge에 대한 모질라 검색사이트
tags: Firefox
categories: ["tips-and-tricks"]
date: 2009-03-19T13:10:59+09:00
modified: 2010-06-30T17:04:37+09:00
---
IE 역시 그런 기능이 있는 것으로 아는데, 파이어폭스 웹브라우져에는
검색사이트를 추가할 수 있는 기능이 있다. 그리고
"[Mycroft Project](http://mycroft.mozdev.org/)"라는 이름의 프로젝트에서
다양한 검색 플러그인을 "검색"할 수 있다.

대체로 원하는 검색사이트는 거의 있는 것 같은데,
[howtoforge](http://www.howtoforge.com) 가 빠져있길래 하나 만들어 넣었다.
만들어 넣는 것도 간단하게 폼을 제공하는데, 가입 등의 절차 없이 간단하게
사이트 플러그인을 추가할 수 있다.

좀 다른 얘기인데, 자신의 사이트에서 제공하는 검색을 사용자가 쉽게
브라우져에 등록할 수 있도록 하기 위해서는 아래와 같은 형식의 내용을
웹페이지에 삽입해 두면 된다.

{% highlight html %}
<link rel="search" type="application/opensearchdescription+xml" title="My Blog" href="opensearch.xml">
{% endhighlight %}

참고로, 내가 Mycroft에 올린 단 하나의
[검색 플러그인](http://mycroft.mozdev.org/search-engines.html?author=SiO4%2C+Yong+Hwan)  

