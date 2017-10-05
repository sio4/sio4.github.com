---
redirect_from: /blog/2009/10/07/running-django-with-external-webserver/
title: Django를 다른 웹서버에 의존하여 돌리기
tags: delayed-job Django nested-request Ongsung
categories: ["development"]
date: 2009-10-07T01:02:10+09:00
modified: 2009-10-07T01:06:01+09:00
---
얼마 전부터 작은 오픈소스 프로젝트를 하나 (업무로써) 진행하고 있는데[^1]
공부도 할 겸, 프로젝트의 웹 부분을 Django 프레임웍을 사용하여 작성하고 있다.
Django는 뭐랄까... 아쉽게도 ruby on rails를 처음 접했을 때 만큼의 감동은
없는데, 나름대로 단순한 면도 있고 쓸만 하다는 느낌이다.  (MVC 관점이 좀
애매하기는 하다.)

[^1]: 간단한 수준의 네트워크 접속 감사/게이트웨어/프록시 시스템이다.
      오픈소스라고는 하지만 업무적인 목적으로 진행하는 것이라서 프로젝트
      후기에나 공개가 가능할 것 같다.

그러던 어느 날, 문제가 생겼다! 그것도 하필 중간 점검을 코앞에 두고 말이다.[^2]
(항상 "밀려 하는 숙제" 스타일이 문제다.) 잘 동작할 것으로 예상했던 부분이
안돌아 가는데, 곰곰히 생각해보니... Nested Request! 이것이 문제였다. 문제의
부분은 사용자-시스템 간의 요청 처리 내부에 시스템-시스템 간의 요청이 하나의
단계로써 포함되어 있었던 것이다. 다시 말해서, 사용자의 요청(ㄱ)을 완료하기
위해서는 내부적으로 또 하나의 웹 요청(ㄴ)이 발생하게 되는데, 그것(ㄴ)이
처리 지연에 빠지는 현상이 발생했다. 처리 지연에 빠지는 이유는 바로 앞 선
요청(ㄱ)에 의하여, 이 요청의 수행이 끝날 때 까지 웹서버의 동작이 Blocking
되어 있었던 것.
데드락이다. (ㄱ)은 (ㄴ)의 수행이 필요한데 (ㄴ)이 수행되기 위해서는 (ㄱ)이
먼저 끝나줘야 하는 것. ... 지금껏 잘 사용해오던 Django의 내장 (Test용)
서버가 다중 요청을 지원하지 않는 것이다. (이 부분은 좀 더 확인이 필요하다.)

[^2]: 역시, 프로젝트를 통하여 공부하려고 하다가는 큰 코를 다친다.
      업무적 학습시간을 운영하던 때가 그립네...

사실, 처음부터 내 잘못이다. Django의 문서를 보면 명시적으로, "이 기능은
실무 환경을 위한 것이 아니에요. 우린 웹 개발 프레임웍을 만드는 중이지
웹서버는 관심이 없답니다."라고 말하고 있다. 어쨌든, 다음의 연결은 이와
관련하여 Django를 다른 전문 웹서버와 연결하는 방식을 설명하고 있다. (이
부분도 rails에 비해서 좀 떨어지게 느껴지는, 또는 낯설은 부분 중 하나다.)

관심있는 구성 중 하나는 경량 웹서버인 nginx를 이용하는 방법. 다음은
우분투 문서 중, Byteflow Blog 엔진 설치, 그 중 Django(FastCGI) + Nginx
구성의 설명이다.

[byteflow blog engine - Ubuntu Wiki](https://wiki.edubuntu.org/byteflow)

> Byteflow is a blog engine, written on Python, using Django. Why should you choose it over competitors? It has very clean codebase and developers, which are struggling to keep it so. It has a lot of cool features, which you can't get in other blog engines or will get with difficulty (consider feed by union of tags, eh?).

[Installation — Byteflow v0.0 documentation](http://byteflow.su/docs/install.html#install)

> 1. Ubuntu + nginx + FastCGI installation guide on Ubuntu wiki
> 1. Debian + apache2 + mod\_python. Installation and setup guides by Oleg Leschinsky.
> 1. lighttpd + fastcgi installation guide from Benjamin Smith
> 1. Installing byteflow on dreamhost by William Stearns
> 1. ByteFlow on CentOS 5 with Apache, mod\_wsgi and MySQL by Michal Ludvig

Django 공식 문서. 일단은 공식 문서의 Apache+Django(FastCGI Mode) 방식을
적용하여 문제(다중 요청 처리)를 해결했다. 이렇게 단순 간단한 것을... 처음엔
원인을 떠올리지 못하고 심지어는 별도 Job Queuing 모듈까지 만들었다는...

[Django \| Deploying Django \| Django Documentation](http://docs.djangoproject.com/en/1.0/howto/deployment/)

> Django’s chock-full of shortcuts to make web developer’s lives easier, but all those tools are of no use if you can’t easily deploy your sites. Since Django’s inception, ease of deployment has been a major goal. There’s a number of good ways to easily deploy Django:

### 교훈:

- "밀린 숙제 방법론"을 버려라.
- "실전을 통한 학습"은 허상이다.
- 문서와 저자의 의도를 받아들여라.
- 뭔가 분명히 있다. 만들기 전에 다시 한 번.

