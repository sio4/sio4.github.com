---
title: SSH SOCKS Proxy, 그리고 보안
tags: ["security", "network", "SSH"]
categories: ["tips-and-tricks"]
date: 2008-04-28T00:08:59+09:00
last_modified_at: 2008-04-28T00:08:59+09:00
---
다음달부터 본격적으로, 새 회사에서의 첫 프로젝트에 객원 맴버로써
참여하게 되었다. 그런데 바로 떨어진 당면 문제가, 고객사의 네트워크
정책에 의해 NAC(Network Access Control) Client를 Laptop에 설치하지
않으면 인터넷을 쓸 수 없게 된다는 점.
<!--more-->

문제는, 그들의 제품은 나처럼 리눅스를 데스크톱 OS로 사용하는
소수민족을 지원하지 않는다는 점이다. 쉽지 않네...

그런데, 이렇게 저렇게 접속된 상태를 살펴보니, 이 NAC의 방식은
MAC 수준에서 뭔가를 제어하거나 Network 연결 자체를 차단하는 것이
아닌 모양이다. NAC 인증 없이도 회사(뭐랄까... 홈베이스?)의 리눅스
서버에 SSH 접속이 된다!

이럴 때 쓰라고 있는 것이 바로 SOCKS Proxy! :-)
  
[Geek to Live: Encrypt your web browsing session (with an SSH SOCKS proxy)](http://lifehacker.com/software/ssh/geek-to-live--encrypt-your-web-browsing-session-with-an-ssh-socks-proxy-237227.php)

> You're at an open wireless hotspot, but you don't want to send your web browsing data over it in plain text. Or you want to visit a non-work-approved web page from the office computer without the IT team finding out.
