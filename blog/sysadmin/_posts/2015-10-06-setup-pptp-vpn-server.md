---
title: "Howto: PPTP VPN 서버 구성하기"
tags: Howto PPTP VPN Setup Ubuntu
---
리눅스 서버를 이용하여 간단하게 VPN 환경을 구성할 수 있는 방법 중 하나가
GRE Tunneling 방식의 PPTP를 이용한 VPN 구성이다. 이 글은 PPTP를 이용하여
원격지의 망과 내 PC를 연결하는 방법에 대한 간단한 소개이다.

**VPN은 Virtual Private Network의 줄인 말**인데, 요즘 가뜩이나 가상화에
대한 용어가 많아서 "이것도 요즘 유행하는 그런 거야?" 하는 생각이 들 수도
있을 것 같다. 그런데, 딱히 그런 것은 아니다.
**물리적인 망의 경계를 넘어 망을 확장/연결해야 하는 필요성**은 이미 오래
전부터 있어왔던 숙제였고, 이를 해결하기 위한 다양한 방식의 솔루션들이 꽤
오래전부터 사용되어 왔다.

오늘 구성해보려고 하는 PPTP, 즉 **Point to Point Tunneling Protocol**은
이러한 VPN을 구현하는 방식 중 하나로, 이름에서 알 수 있듯이 **연결하려는
양 종단을 Tunneling 기법으로 연결**하여 하나의 Network Segment 처럼 느낄
수 있게 해주는 기술이다.

VPN과 PPTP에 대한 자세한 설명은 아래 URL을 참고하면 될 것 같다.

* [Virtual Private Network, Wikipedia](
https://en.wikipedia.org/wiki/Virtual_private_network)
* [Point to Point Tunneling Protocol, Wikipedia](
https://en.wikipedia.org/wiki/Point-to-Point_Tunneling_Protocol)

이 글은, 요즘 진행중인 OpenStack 기반 클라우드 컴퓨팅 환경에 대한 시험을
진행하던 중, 대상 네트워크의 Miniature 성격으로 꾸며진 폐쇄망 시험환경을
시끄러운 전산센터에 들어가지 않고 사무실에서 쉽게 접속하여 업무 진행을
할 수 있도록 하기 위한 목적으로 진행된 작업의 기록이기도 하다.

## PPTP VPN 서버 구성

VPN을 구현하는 다양한 방법이 있지만, 그 중에서 가장 간단한 방법 중 하나가
PPTP를 사용하는 것이다. 이번 작업은, 미리 준비한 "깨끗하게 설치된" Ubuntu
리눅스 환경을 기준으로 설치 및 설정을 진행하였다. (이 외의 어떤 설정의
영향도 없다는 의미인데 말이 좀 이상하네... ㅋㅋㅋ)

### 설치

먼저, 관련된 패키지를 설치해야 한다. Ubuntu 리눅스에서 PPTP 기능은 `pptpd`
라는 패키지를 통해서 제공된다.

{% highlight console %}
$ sudo apt-get install pptpd
<...>
The following NEW packages will be installed:
  bcrelay pptpd
0 upgraded, 2 newly installed, 0 to remove and 0 not upgraded.
Need to get 105 kB of archives.
After this operation, 364 kB of additional disk space will be used.
<...>
$ 
{% endhighlight %}

설치는 이렇게 간단하게 된다. 참고로, 함께 설치되는 `bcrelay`라는 패키지는
`pptpd`가 사용하는 `ppp` 인터페이스를 사용하여 Bridge를 구성할 수 없는
점을 극복하게 해주는 역할 등에 사용 가능한 Broadcast Relay 유틸리티인데,
이번 구성에서는 사용되지 않는다.


### 설정 및 구동

설정 역시 설치만큼이나 간단하다. 아래와 같이, `/etc/pptpd.conf` 파일에
**양단에서 사용할 IP를 등록**하는 것 만으로 모든 설정이 끝나게 된다. 물론,
이런 저런 옵션이 있지만, 이미 원저작자 및 Debian Package Maintainer가
손봐둔 기본 설정으로 충분하다. (역시, 참 편하다. :-)

{% highlight console %}
$ cat |sudo tee -a /etc/pptpd.conf <<EOF
> 
> localip 192.168.13.254
> remoteip 192.168.13.240-249
> EOF

localip 192.168.13.254
remoteip 192.168.13.240-249

$ 
{% endhighlight %}

위의 설정에서 `localip`는 단 하나의 값을 갖게 되는데, 이건 VPN을 제공하는
서버가 사용할 IP를 지정하는 부분이기 때문에 그렇다. `remoteip` 값은 보통,
IP 주소의 대역으로 지정이 된다. VPN 서버를 통하여 접속하는 Client의 수가
하나 이상인 경우가 대부분일테니, 당연한 얘기이다.

우리의 예에서는 VPN 서버에서 사용하는 IP 대역과 같은 192.168.13.0/24 안의
주소 중에서 값을 골라 사용하였다. 참고로, 해당 망의 구성은 다음과 같다.

{:.fit.styled}
| 주소            | 내용                     |
|:---------------:|:------------------------:|
| 192.168.13.0/24 | 목표 환경의 네트워크     |
| 192.168.13.1    | 목표 환경의 Gateway 주소 |
| 192.168.13.3    | VPN 제공서버의 실제 IP   |
| 192.168.13.254  | VPN 접속지 주소          |

위와 같이 PPTP 서비스이 설정을 마쳤다면 다음은 사용자 인증 부분이다. 좀
약해보이기는 하는데, 아래와 같이 `/etc/ppp/chap-secrets` 파일에 공백으로
분리된 값을 넣어주는 방식이 사용된다.
Root만 읽을 수 있다고는 해도 Plain Text로 저장된 파일이며, 사용자가 암호
변경을 하기도 좀 애매한 부분이어서 보안 관점에서는 좀... 그렇다. ㅋ)

{% highlight console %}
$ cat |sudo tee -a /etc/ppp/chap-secrets <<EOF
> sio4          pptpd   p4ssw0rd                   *  
> EOF
sio4          pptpd   p4sswr0d                   *

$ 
{% endhighlight %}

위의 설정은, `sio4` 라는 이름의 사용자가 `p4ssw0rd`라는 암호를 사용한다고
등록하는 예이다. (이 파일은 일반 사용자가 읽을 수 없는 권한으로 설정해야
하며, 이 부분을 암호화 하는 방식이나 DBMS를 활용하거나 별도의 인증 체계와
연동하는 방법을 찾아보면 더 유용할 것 같다.)

이제 서비스를 시작해보자.

{% highlight console %}
$ sudo systemctl start pptpd
$ sudo systemctl status pptpd
* pptpd.service - PoPToP Point to Point Tunneling Server
   Loaded: loaded (/lib/systemd/system/pptpd.service; disabled; vendor preset: enabled)
   Active: active (running) since Sun 2015-09-20 21:02:39 KST; 1s ago
 Main PID: 10102 (pptpd)
   CGroup: /system.slice/pptpd.service
           `-10102 /usr/sbin/pptpd --fg

Sep 20 21:02:39 station systemd[1]: Started PoPToP Point to Point Tunneling...r.
Sep 20 21:02:39 station systemd[1]: Starting PoPToP Point to Point Tunnelin.....
Sep 20 21:02:39 station pptpd[10102]: MGR: Maximum of 100 connections reduc...en
Sep 20 21:02:39 station pptpd[10102]: MGR: Manager process started
Sep 20 21:02:39 station pptpd[10102]: MGR: Maximum of 10 connections available
Hint: Some lines were ellipsized, use -l to show in full.
$ 
{% endhighlight %}

로그를 잠깐 보면, `pptpd` 데몬이 시작되었고, 설정에 의해 전체 100개의
연결을 허용하고 있으나, `remoteip` 값이 작은 범위로 설정된 까닭에 최대
연결의 수가 다시 10으로 조정된 것을 볼 수 있다.

서버의 준비는 일단, 끝났다.



## Client 설정

이제 서버의 설정이 끝났으니 붙여볼 차례! 내 PC가 Ubuntu 리눅스인 관계로,
Ubuntu Desktop 환경을 중심으로 설명한다. 내용면에서, 윈도나 기타 Client
환경도 동일한 방식과 원리가 적용될 것이니, 참고용으로는 충분할 것 같다.

먼저, 우측 상단에 위치한 네트워크 설정 부분의 "**연결편집**" 메뉴나
"**가상 사설망 설정**" 메뉴를 이용하면 아래와 같은 대화상자를 볼 수 있다.

![](/attachments/20151006-pptp-vpn-001.png){:.fit.dropshadow}

여기서 "**추가**" 단추를 눌러주면, 아래와 같이 어떤 연결을 만들지 결정하는
대화상자가 나타나게 된다. 물론, 해당 Client 설정을 지원하는 패키지가 미리
설치되어 있어야 하지만, 아래와 같이 "**포인트투포인트 터널링 프로토콜**"을
선택해준다.

![](/attachments/20151006-pptp-vpn-002.png){:.fit.dropshadow}

이제 "**만들기**" 단추를 눌러주면 아래와 같이, 본격적인 설정이 가능한
대화상자가 나타나게 된다.

![](/attachments/20151006-pptp-vpn-003.png){:.fit.dropshadow}

위의 대화상자에서 "**연결 이름**"은 그냥 사용자가 인지하기 위한 이름이니
적당히 원하는 이름을 넣어주면 되는데, 보통은 망의 이름을 쓰게 된다.
아래 "**게이트웨이**" 부분은 PC에서 직접 접속 가능한 주소나 Hostname을
입력하는 곳으로, 여기서 사용한 `station`이라는 이름은 미리 `/etc/hosts`
파일에 설정해둔 **PPTP 서버의 외부 주소**이다.

외부 주소라고 표현한 이유는, PPTP가 사용되는 이유가 직접 접속할 수 없는
망에 접속하기 위한 것이므로 해당 서버가 해당 망 IP 밖에 가지지 않았다면
접속 자체가 불가능하게 된다. 따라서 PPTP 서버는 둘 이상의 인터페이스를
가지거나, NAT 등의 별도 설정이 되어진, 원격 접속이 가능한 서버여야 한다.

여기서는, **외부 공인 IP주소로 NAT가 되어있는 서버를 사용**하였다.

"**사용자 이름**"이나 "**암호**"는 서버 설정 과정에서 지정한 정보로 꼭
입력해야 하는 부분이지만, 추가 설명은 필요없을 것 같다. :-) 다음은
"**IPv4 설정**" 탭을 열어본다.

![](/attachments/20151006-pptp-vpn-004.png){:.fit.dropshadow}

이 탭의, 위의 그림과 같이 연결되는 가상망에 대한 **PC쪽 종단의 IP주소 등을
어떻게 설정할지를 결정하는 부분**이다. DHCP 설정과 유사한 모습을 갖는데,
여기서는 IP주소만 자동으로 가져오는 방식으로 설정하였다. (이미 PC에 있는
DNS, Domain 등의 정보는 기존 것으로 유지한다는 의미이다.)

![](/attachments/20151006-pptp-vpn-005.png){:.fit.dropshadow}

이렇게 설정을 마치고 다시 네트워크 메뉴에서 저장된 설정을 선택하게 되면,
우상단 네트워크 연결 표시 부분이 애니메이션으로 깜박거리다가, 위와 같은
Popup이 뜨면서 연결이 마무리되면 모든 것이 성공적으로 된 것이다.

> 얼쑤!

라고 외치고 싶었지만, 한 번에 끝나지 않았다! 한 번에 끝나면 재미없다.


## Trouble Shooting

위와 같이 "성공" 메시지를 한 번에 봤으면 좋았으련만... 그러나 내가 본
것은 "실패" 메시지였다. (따로 화면을 잡지는 않았다.) 그래서 서버에서는
어떤 일이 벌어졌는지 로그를 확인해보니...

### WTMP 문제

{% highlight console %}
$ tail -f /var/log/syslog
<...>
Sep 19 03:17:12 station pptpd[9585]: CTRL: Client 10.45.60.5 control connection started
Sep 19 03:17:13 station pptpd[9585]: CTRL: Starting call (launching pppd, opening GRE)
Sep 19 03:17:13 station pppd[9586]: Plugin /usr/lib/pptpd/pptpd-logwtmp.so is for pppd version 2.4.5, this is 2.4.6
Sep 19 03:17:13 station pptpd[9585]: GRE: read(fd=6,buffer=7fbae9ae54a0,len=8196) from PTY failed: status = -1 error = Input/output error, usually caused by unexpected termination of pppd, check option syntax and pppd logs
Sep 19 03:17:13 station pptpd[9585]: CTRL: PTY read or GRE write failed (pty,gre)=(6,7)
Sep 19 03:17:13 station pptpd[9585]: CTRL: Reaping child PPP[9586]
Sep 19 03:17:13 station pptpd[9585]: CTRL: Client 10.45.60.5 control connection finished
<...>
{% endhighlight %}

뭐래는거니? 세 번째 줄에 보면, `pptpd-logwtmp.so` 파일이 `pppd` 2.4.5용의
것인데, 지금 사용되는 `pppd`는 2.4.6이라서 호환이 안된다는 얘기다. 뭐냐...
Ubuntu/Debian 패키지의 깔끔함을 칭친한 게 불과 몇 십줄 전인데... :-(

찾아보니, 이미 오래전부터 반복적으로 일어나는 이슈인 것 같다. 일단, 아래와
같이 응급 조치를 할 수 있다. (해당 기능을 죽이는 방식)

{% highlight console %}
$ sudo sed -i 's/^logwtmp/# bug-1451419 logwtmp/' /etc/pptpd.conf 
$ sudo systemctl restart pptpd
{% endhighlight %}

이렇게 `pptpd.conf` 파일을 수정하여 `logwtmp`를 사용하지 않는 것. 사용자
접속 로깅을 하지 않는 것이 좀 싫기는 하지만, 기능상 문제가 되지 않으며,
`pptpd` 자체의 로그가 쌓이지 않는 것은 아니니까...

자세한 내용은 [이 글](http://askubuntu.com/a/623643)을 참고하기 바란다.

허허... 이렇게 끝나면 좋으련만, 또 하나의 문제를 만났다.

### MPPE 오류

일단 로그를 보자.

{% highlight console %}
<...>
Sep 19 03:26:01 station pptpd[9724]: CTRL: Client 10.45.60.5 control connection started
Sep 19 03:26:02 station pptpd[9724]: CTRL: Starting call (launching pppd, opening GRE)
Sep 19 03:26:02 station pppd[9725]: pppd 2.4.6 started by root, uid 0
Sep 19 03:26:02 station pppd[9725]: Using interface ppp0
Sep 19 03:26:02 station pppd[9725]: Connect: ppp0 <--> /dev/pts/1
Sep 19 03:26:02 station pppd[9725]: peer from calling number 10.45.60.5 authorized
Sep 19 03:26:02 station systemd[1]: Started ifup for ppp0.
Sep 19 03:26:02 station systemd[1]: Starting ifup for ppp0...
Sep 19 03:26:02 station sh[9759]: Unknown interface ppp0
Sep 19 03:26:02 station pppd[9725]: MPPE required but peer negotiation failed
Sep 19 03:26:02 station kernel: [20329.791165] PPP MPPE Compression module registered
Sep 19 03:26:02 station pppd[9725]: Connection terminated.
Sep 19 03:26:02 station pppd[9725]: Connect time 0.0 minutes.
Sep 19 03:26:02 station pppd[9725]: Sent 10 bytes, received 43 bytes.
Sep 19 03:26:02 station systemd[1]: Stopping ifup for ppp0...
Sep 19 03:26:02 station ifdown[9774]: /sbin/ifdown: interface ppp0 not configured
Sep 19 03:26:02 station systemd[1]: Stopped ifup for ppp0.
Sep 19 03:26:02 station pppd[9725]: Exit.
Sep 19 03:26:02 station pptpd[9724]: GRE: read(fd=6,buffer=7f2d492564a0,len=8196) from PTY failed: status = -1 error = Input/output error, usually caused by unexpected termination of pppd, check option syntax and pppd logs
Sep 19 03:26:02 station pptpd[9724]: CTRL: PTY read or GRE write failed (pty,gre)=(6,7)
Sep 19 03:26:02 station pptpd[9724]: CTRL: Reaping child PPP[9725]
Sep 19 03:26:02 station pptpd[9724]: CTRL: Client 10.45.60.5 control connection finished
<...>
{% endhighlight %}

뭐래니? 찬찬히 들여다보니, 역시 `pppd`가 뭔가 못마땅한 부분이 있는 것이다.

로그의 중간 정도를 보면, MPPE가 필요한데 Peer와 협상이 결렬되었다고!
이게 무슨 소리? 클라이언트에서 뭔가 덜 해준 느낌이니 앞서 진행한 설정을
다시 열어보자. 그 중에서, "**가상 사설망**" 탭의 "**고급**" 단추가 눈에
띈다. 단추를 눌러 대화상자를 열어보니 아래와 같다.

![](/attachments/20151006-pptp-vpn-e11.png){:.fit.dropshadow}

다양한 "**인증**" 방법이 나오고, 그 아래 "**보안 및 압축**"이라는 부분이
눈에 띈다! "**포인트투포인트 암호화(MPPE) 사용**"이라니! 바로 위의 로그가
말하는 그것. 이것을 아래와 같이 선택해준다.

![](/attachments/20151006-pptp-vpn-e12.png){:.fit.dropshadow}

설정을 마치고 다시 접속을 해보면, 이번에는 정상적으로 연결된 것을 확인할
수 있다!

**정상 연결 로그**

{% highlight console %}
<...>
Sep 20 21:15:24 station pppd[10405]: local  IP address 192.168.99.1
Sep 20 21:15:24 station pppd[10405]: remote IP address 192.168.99.10
<...>
Sep 20 21:26:54 station pptpd[10771]: CTRL: Client 10.45.60.5 control connection started
Sep 20 21:26:55 station pptpd[10771]: CTRL: Starting call (launching pppd, opening GRE)
Sep 20 21:26:55 station pppd[10772]: pppd 2.4.6 started by root, uid 0
Sep 20 21:26:55 station pppd[10772]: Using interface ppp0
Sep 20 21:26:55 station pppd[10772]: Connect: ppp0 <--> /dev/pts/1
Sep 20 21:26:55 station systemd[1]: Started ifup for ppp0.
Sep 20 21:26:55 station systemd[1]: Starting ifup for ppp0...
Sep 20 21:26:55 station pppd[10772]: peer from calling number 10.45.60.5 authorized
Sep 20 21:26:55 station sh[10776]: Unknown interface ppp0
Sep 20 21:26:55 station pppd[10772]: MPPE 128-bit stateless compression enabled
Sep 20 21:15:24 station pppd[10405]: Cannot determine ethernet address for proxy ARP
Sep 20 21:26:55 station pppd[10772]: found interface p1p1 for proxy arp
Sep 20 21:26:55 station pppd[10772]: local  IP address 192.168.13.254
Sep 20 21:26:55 station pppd[10772]: remote IP address 192.168.13.240
{% endhighlight %}


**정상 해제 로그**

{% highlight console %}
<...>
Sep 20 21:28:14 station pppd[10772]: LCP terminated by peer (MPPE disabled)
Sep 20 21:28:14 station pppd[10772]: Connect time 1.4 minutes.
Sep 20 21:28:14 station pppd[10772]: Sent 168 bytes, received 168 bytes.
Sep 20 21:28:14 station pptpd[10771]: CTRL: Reaping child PPP[10772]
Sep 20 21:28:14 station pppd[10772]: Modem hangup
Sep 20 21:28:14 station pppd[10772]: Connection terminated.
Sep 20 21:28:14 station systemd[1]: Stopping ifup for ppp0...
Sep 20 21:28:14 station ifdown[10822]: /sbin/ifdown: interface ppp0 not configured
Sep 20 21:28:14 station systemd[1]: Stopped ifup for ppp0.
Sep 20 21:28:14 station pppd[10772]: Exit.
Sep 20 21:28:14 station pptpd[10771]: CTRL: Client 10.45.60.5 control connection finished
{% endhighlight %}

클라이언트가 연결된 상태에서 서버측 인터페이스 상태를 보면, 아래와 같이
각 연결에 대하여 각각 하나씩의 `ppp` 인터페이스가 생성되는 것을 볼 수
있다.

**연결 상태에서 서버측 Interface**

{% highlight console %}
$ ifconfig
<...>
ppp0      Link encap:Point-to-Point Protocol  
          inet addr:192.168.13.254  P-t-P:192.168.13.240  Mask:255.255.255.255
          UP POINTOPOINT RUNNING NOARP MULTICAST  MTU:1396  Metric:1
          RX packets:2091856 errors:0 dropped:0 overruns:0 frame:0
          TX packets:1183995 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:3 
          RX bytes:2749676633 (2.7 GB)  TX bytes:108523487 (108.5 MB)

ppp1      Link encap:Point-to-Point Protocol  
          inet addr:192.168.13.254  P-t-P:192.168.13.241  Mask:255.255.255.255
          UP POINTOPOINT RUNNING NOARP MULTICAST  MTU:1496  Metric:1
          RX packets:27605 errors:0 dropped:0 overruns:0 frame:0
          TX packets:30604 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:3 
          RX bytes:3786495 (3.7 MB)  TX bytes:17859824 (17.8 MB)

$ 
{% endhighlight %}



## 조금 더 보기

이제 원격지의 직접 접속이 불가능한 망에 접속을 해보았다. 그런데, TCP/IP
망이라는 것이... 조금 더 손을 봐줘야 하는 부분도 있다. (이 부분은 사용자의
원격지 환경이나 서버의 설정 등에 따라 다르다.)

### 라우팅 정보 보기

보통, VPN을 사용하게 되면, 서버측에서 접속한 망과 관련하여 사용할 라우팅
정보를 함께 내려주게 되는데, 이에 대한 내용을 조금 보려고 한다. 일단,
VPN 연결 전의 Routing은 다음과 같다. (당연한 얘기지만 사용자마다 다르다.)

{% highlight console %}
$ route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         10.250.166.1    0.0.0.0         UG    100    0        0 eth0
10.250.10.100   10.250.166.1    255.255.255.255 UGH   100    0        0 eth0
10.250.166.0    0.0.0.0         255.255.255.0   U     100    0        0 eth0
169.254.0.0     0.0.0.0         255.255.0.0     U     1000   0        0 eth0
$ 
{% endhighlight %}

이 상태에서 VPN을 연결하면, 다음과 같이 ppp0를 인터페이스로 하는 라우팅이
추가로 구성되게 된다.

{% highlight console %}
$ route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         10.250.166.1    0.0.0.0         UG    100    0        0 eth0
10.250.10.100   10.250.166.1    255.255.255.255 UGH   100    0        0 eth0
10.250.166.0    0.0.0.0         255.255.255.0   U     100    0        0 eth0
169.254.0.0     0.0.0.0         255.255.0.0     U     1000   0        0 eth0
192.168.13.254  0.0.0.0         255.255.255.255 UH    0      0        0 ppp0
10.235.199.133  10.250.166.1    255.255.255.255 UGH   0      0        0 eth0
$ 
{% endhighlight %}

눈에 잘 들어오지는 않지만, 추가된 줄은 맨 아래의 두 줄이다. 아래부터 첫번째
라우팅은,

> 접속에 사용한 주소인 10.235.199.133으로 향하는 패킷은 eth0를 통하라

고 되어있고(이 주소는 `station`의 NAT IP이다) 그 윗 줄은

> 접속 Peer의 IP인 192.168.13.254에 가는 패킷은 ppp0를 통하라

고 설명하고 있다.

ppp0를 통하라는 두 번째 부분은 앞으로 이 IP가 해당 망으로 향하는 Gateway
역할을 할 것이므로 쉽게 이해가 되는데, 아래 줄은 좀 헷갈릴 수 있다. 뭘까?

이 환경에서는 NAT를 쓰는 환경에서 사설망에 접속을 하기 때문에 눈에 확 띄지
않지만, **단지 단일 접속 주소에 대하여 방화벽을 열어놓은 Public 망에
접속하는 VPN의 경우**라면 어떨까? 그렇다. VPN이 아닌 인터넷 구간을 통해
통신해야 할 패킷이 PPP 환경 안에서 접속을 시도하게 되므로 통신이 정상적으로
이루어질 수 없는 상황에 빠지게 된다.

사실, 위의 내용에는 추가 설정에 의해 생략된 라우팅 설정이 있다. 추가 설정을
전혀 하지 않은 라우팅 정보를 보면 아래와 같다.

{% highlight console %}
$ route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         0.0.0.0         0.0.0.0         U     50     0        0 ppp0
0.0.0.0         10.250.166.1    0.0.0.0         UG    100    0        0 eth0
10.250.10.100   10.250.166.1    255.255.255.255 UGH   100    0        0 eth0
10.250.166.0    0.0.0.0         255.255.255.0   U     100    0        0 eth0
169.254.0.0     0.0.0.0         255.255.0.0     U     1000   0        0 eth0
192.168.13.254  0.0.0.0         255.255.255.255 UH    0      0        0 ppp0
203.235.199.133 10.250.166.1    255.255.255.255 UGH   0      0        0 eth0
$ 
{% endhighlight %}

앞서 말한 두 라우팅 외에도 맨 위의 Default Gateway 설정이 하나 추가된
것을 알 수 있다. (심지어 Metric이 기본 Gateway보다 작은 50이다.)
이 상태에서 맨 아래 줄이 없다면 어떻게 될지 계산해보면, 해당 설정이 왜
필요한지 알 수 있겠다.

또한, 위와 같이 모든 패킷이 PPP를 통해서 흐르는 것은 우리가 원하는 것이
아니다! 심지어 저쪽 망은 폐쇄망이 아닌가! 따라서 추가로 잡힌 기본 라우팅
값은 빠져야 하며, 192.168.13.0/24에 대한 추가 라우팅이 필요하다.


### 라우팅 세부 설정

이런 내용을 세부적으로 설정할 수 있도록, Ubuntu의 VPN 접속 도구는 별도
옵션을 제공하고 있다. 아래 그림은 VPN 설정의 "**IPv4설정**"에 위치한
"**라우팅**" 단추를 눌렀을 때 만나게 되는 대화상자인데,

![](/attachments/20151006-pptp-vpn-101.png){:.fit.dropshadow}

보는 바와 같이

* 사용자 지정 라우팅 설정을 추가하거나,
* 서버에서 자동으로 내려주는 라우팅 정보를 무시하도록 하거나,
* (이 네트워크에 대해서만 VPN을 사용하고) 기본 경로로 설정되지 않게 하는

설정을 할 수 있게 되어있다. 이와 같은 설정을 모두 해준 후, 다시 접속을
하면, 아래와 같이 쓸모있는 망 정보가 구성된다.

{% highlight console %}
$ route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         10.250.166.1    0.0.0.0         UG    100    0        0 eth0
10.250.10.100   10.250.166.1    255.255.255.255 UGH   100    0        0 eth0
10.250.166.0    0.0.0.0         255.255.255.0   U     100    0        0 eth0
169.254.0.0     0.0.0.0         255.255.0.0     U     1000   0        0 eth0
172.16.0.0      192.168.13.254  255.255.0.0     UG    1      0        0 ppp0
192.168.13.0    192.168.13.254  255.255.255.0   UG    1      0        0 ppp0
192.168.13.254  0.0.0.0         255.255.255.255 UH    0      0        0 ppp0
192.168.14.0    192.168.13.254  255.255.255.0   UG    1      0        0 ppp0
199.59.148.0    192.168.13.254  255.255.252.0   UG    1      0        0 ppp0
203.235.199.133 10.250.166.1    255.255.255.255 UGH   0      0        0 eth0
$ 
{% endhighlight %}

여기서 172.16.0.0/16, 192.168.13.0/24, 192.168.14.0/24 등은 원격지 망에서만
접속 가능한 폐쇄망이다. (199.으로 시작되는 주소는 잊어주시라.)

참고로, 클라이언트쪽과는 다르게 서버쪽은 매우 단순하게 구성이 끝난다.

**서버측 라우팅 정보**

{% highlight console %}
$ route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         192.168.13.1    0.0.0.0         UG    0      0        0 p1p1
192.168.13.0    0.0.0.0         255.255.255.0   U     0      0        0 p1p1
192.168.13.240  0.0.0.0         255.255.255.255 UH    0      0        0 ppp0
192.168.13.241  0.0.0.0         255.255.255.255 UH    0      0        0 ppp1
$ 
{% endhighlight %}


## 서버측 추가 환경 구성

이렇게 PPTP VPN을 연결한다고 하여도, 그리고 Routing 설정을 한다고 해도,
해당 원격망에 위치한 서버에 Direct로 접속하는 것은 불가능하다. 가장 먼저
떠오르는 것은 NAT같은 기능이지만, 이렇게 되면 Client IP가 숨어버리는
문제점이 있다. 어떻게 할까?

하면 떠오르는 것이, 근래에 몇 번 다뤘던 주제인 Bridge 구성이다. 먼저,
Bridge 구성을 위한 유틸리티 등을 설치한 후, 다음과 같이 Port 추가를
시도해보자.

{% highlight console %}
$ sudo brctl addif br0 ppp0
can't add ppp0 to bridge br0: Invalid argument
$
{% endhighlight %}

아뿔싸! 앞서 잠깐 얘기했지만, `ppp` 인터페이스는 보통의 Ehternet과는
다른 연결 방식을 사용하며, **Bridge에 포트(인터페이스)로써 추가하는 것이
불가능**하다. :-(

그런데 의외로 해법은 간단히 나온다. 바로 **리눅스 Netfilter의 Packet
Forwarding 기능을 활성화하는 것!**

ㅠ.ㅠ 예상하지 못했던 급 매듭! :-)

{% highlight console %}
$ sudo sysctl net.ipv4.ip_forward=1
{% endhighlight %}

이제, PPTP VPN 연결을 통해서 마음껏 원격 폐쇄망의 자원에 접속할 수 있다!



음...  
긴 글이 되었다. :-)
