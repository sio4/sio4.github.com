---
title: "SSH: 빠른 접속, Pseudo-tty, 웹필터 회피"
tags: 네트워크 토막상식
date: 2008-04-29T02:36:57+09:00
modified: 2010-07-04T21:44:26+09:00
---
(요즘 참여하는 프로젝트에 얽힌) 세 가지 이야기.

## 먼저 ssh 빨리 접속하기 (접속지연 줄이기)

나의 우분투 데스크탑에서 ssh를 사용하여 리눅스 서버에 접속하는데 접속이
좀 느리다. 네트워크 연결은 문제가 없는데 키 확인을 한 후에 로긴 프롬프트가
뜨기까지 대충 5초는 걸리는 것 같다. 게으른 성격 때문에 웬만하면 그냥 참고
쓰겠는데... 작업 성격이 다섯대의 서버에 로그인 하는 대신, 클라이언트에
위치한 배치 명령만 차례로 던져가며 작업하는 상황이라 반복되는 암호 입력
지연이 좀 거슬린다.

'-v' 옵션을 사용하여 확인해보니, "Unspecified GSS failure. ..." 뭐 이런
이야기가 나온다. (나오고 좀 멈춰 있는다.) 오호라... 관련 설정을
~/.ssh/config에 해주는 것으로 일단 상황 종료.

뭐? 그런 상황이면 "서로 믿고 사는 사회" 만들면 되지 왜 매번 암호를
입력하냐고? 글쎄... 이상하게 그게 더 맘 편하다.

아차차! 설정을 빼먹었네.

{% highlight console %}
GSSAPIAuthentication no
{% endhighlight %}

참고로, 대체로 이런 현상은 인증 모듈에 의하여 일어나는데, 예전에는 가장
흔한 경우가 DNS 역추적에 명시적으로 빨리 실패하지 못하고 (또는 성공하지
못하고) 찾아보겠다고 헤메는 경우였다.

## pseudo-tty 살리기

단순히 "ssh user@remote.host" 형태의 명령으로 원격지에 로그인 하는 경우라면,
명령을 수행하는 창, 화면, tty를 이어받아 원격 쉘이 실행된다. 그런데,
"ssh user@remote.host top" 이라고 명령해보면,

{% highlight console %}
$ ssh user@remote.host top
user@remote.host's password: 
TERM environment variable not set.
{% endhighlight %}

이렇게 화면 기반의 프로그램은 정상적으로 실행되지 않는다. 그런데, '-t'
옵션을 사용하면 원하는 일을 할 수 있다. 원격 로긴 후 항상 같은 화면 기반
프로그램을 띄워야 하는 상황이라면 유용하다.

## ssh로 웹필터 피하기 (SOCKS proxy)

망할, 점점 상황은 나빠지고 있다. 윈도용으로만 존재하는 특정 네트워크
클라이언트를 설치해야만 네트워크 접속이 되는 환경. 예외처리로 네트워크에는
참여했으나 결국, 웹 접속은 허용되지 않았다. 그러나 얼마나 다행인가?
우리에겐 ssh가 있으니.

{% highlight console %}
ssh -D8080 -fqCN user@proxy.host
{% endhighlight %}

위의 명령을 이용하면 일반적인 ssh 서버인 proxy.host를 웹 필터 우회를 위한
대리자로써 사용할 수 있다. -C 명령은 압축을 사용하기 위한 옵션이고 -f는
접속이 되면 프로세스를 백그라운드로 돌리기 위한 옵션이다.

다음과 같은 파이어폭스 설정을 해주면 우회로 설정 끝.

{% highlight console %}
network.proxy.no_proxies_on: localhost, 127.0.0.1, 192.168.10.0/24, .localdomain
network.proxy.socks: localhost  
network.proxy.socks_port: 8080  
network.proxy.socks.remote_dns: true  
network.proxy.socks_version: 5  
network.proxy.type: 1
{% endhighlight %}

웹 필터 회피를 위한 경우, 또는 누군가 나의 웹생활을 훔쳐보고 있다는 느낌을
지울 수 없다면... :-)

