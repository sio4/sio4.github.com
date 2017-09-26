---
title: "T&T: Linux Bridge로 네트워크 문제 추적하기"
image: /attachments/20150821-linux-bridge-0.jpg
tags: 리눅스 네트워크 문제해결
categories: ["tips-and-tricks"]
date: 2015-08-21 15:41:00+09:00
---
리눅스는 스스로가 Network Bridge[^1]로 동작할 수 있는 커널 기능과
유틸리티를 기본적으로 제공하고 있는데, 이 기능이 시스템 간 통신을
끼고 발생하는 문제점을 추적하는 과정에서 유용할 때가 있다. 이 글은
리눅스 Bridge를 이용하여 시스템 바깥에서 네트워크 흐름을 분석했던
경험을 기록한 것이다.

[^1]: Bridge 본연의 기능은 Network 상의 두 Segments를 엮어주고
      동시에 Segments 간 불필요한 통신이 넘어와 혼잡이 발생하는
      것을 막아주는 역할을 한다.
      그러한 관점에서 Bridge는 (현실세계의 "다리"와 마찬가지로)
      단 두 개의 Port로 양단을 이어주도록 구성되는 것이 정석이며,
      여러 Port로 구성되어 망을 펼치는 역할을 하는 Switch 화는
      구분되는 개념이다.

네트워크 통신과 연관된 IT 문제를 추적할 때, 망 내의 데이터 흐름과
제어 상황에 대한 분석은 필수적인 접근 방법이다. 이 때 문제 확인을
위한 접근지점을 단일 서버로 한정할 수 있다면, 그리고 그 기반 OS가
리눅스인 경우에는 보통 `tcpdump`를 사용하여 전송 데이터를 모으고,
필요하다면 Wireshark 등을 통해 보다 상세한 내용을 분석하게 된다.  
동일한 작업을 Windows 서버에서 하기 위해서는 Winpcap 같은 것을
설치하는 등의 추가 작업을 통해서 거의 유사한 작업을 할 수 있다.

그런데 가끔은,

1. 분석 대상이 그 안을 건드릴 수 없는 Appliance이거나
1. OS 기반의 시스템이더라도 그 속을 건드릴 수 없는 상황인 경우
1. 또는 OS 분석으로는 원하는 데이터 모두를 얻을 수 없는 경우

가 있을 수 있다. 이런 경우에는, **"안에서" 보는 대신 "밖에서" 또는
객관적으로 보고싶을 수가 있는데, "리눅스 Bridge를 설정한 분석용
 PC"가 필요한 시점이 온 것**이다.


> 사실, 이 작업을 했던 배경은 보안 Appliance, 백본과 스위치, 여러
> 망 연결을 갖는 가상호스트와 그 안의 Guest VM 등이 나름 복잡하게
> 구성된 상태에서, 업무적인 통신은 정상적으로 이루어지지만 원하는
> 물리적 경로를 지나는지 명확하지 않은 상황을 확인/정리하기 위하여
> 1년 전 쯤 진행되었었다.
> 
> 아쉽게도, 작업 기록을 모두 남기지는 못해서 글 후반에 있어야 할
> 분석 작업과 Bridge 구성을 위한 특이사항을 모두 기억하여 남기기는
> 어려울 것 같다.



## 물리적 구성

앞서 얘기한 내용처럼, 이 글에서 다루는 주제는 서버 내부가 아닌
바깥에서 분석을 진행하는 방식이다. 그래서 아래 그림으로 표현한
방식으로, 물리적인 구성의 변경이 바탕에 깔린다.

![](/attachments/20150821-linux-bridge-1.png){:.fit}

원래의 구성은 위의 그림에서 "목표시스템 A"의 NIC0가 직접 Switch0의
Port에 연결되어 있었다. 그 선로 사이를 지나가는
패킷을 잡아서 보기 위해서, 여기서는 "분석시스템 B"를 추가로
구성하여 그 길목에 넣게 된다. ("왜? Switch에서 Port Mirroring을
구성하면 될 것을?"이라는 말이 나올법도 하지만... 그건 그거고.)

새로 추가된 B의 NIC 중 eth0는 Switch0의 Port에 연결해주고, 다시
eth1은 목표시스템의 NIC0에 연결을 해준다. 그리고 분석시스템 B의
안에서 두 NIC를 엮어서 Data가 흐를 수 있도록 구성하게 되는데,
그 역할을 리눅스 Bridge가 하도록 하였다.

최종적으로, 실제 겉으로 보이는 모양은 아래와 같다.

![](/attachments/20150821-linux-bridge-2.jpg){:.fit}

내 늙은 작업용 Netbook을 이용해서 구성했고 이 Netbook의 내장
NIC가 하나이기 때문에 외장 USB 방식의 NIC를 추가로 구성했다.
On-Board의 NIC에는 목표시스템에서 뽑은 케이블을 꽂아주었고,
외장 USB에는 별도로 준비한 짧은 케이블을 이용하여 원래 케이블이
꽂혀있던 대상시스템의 NIC와 연결하였다.



## 소프트웨어 구성

가장 먼저 진행될 것은 Bridge 제어를 위한 유틸리티의 설치이다.
(Bridge 기능 자체는 리눅스 커널에 이미 포함되어 있다.) 아래의
명령으로 `bridge-utils`를 설치해준다. (Ubuntu 기준)

```console
$ sudo apt-get install bridge-utils
<...>
bridge-utils (1.5-7ubuntu1) 설정하는 중입니다 ...
$
```

이제 설정을 할 차례인데, 작업 전의 상황은 다음과 같다.

```console
superhero@vim-firewall:~$ ip addr show
<...>
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP qlen 1000
    link/ether 00:0c:29:fa:6c:ab brd ff:ff:ff:ff:ff:ff
    inet 192.168.217.170/24 brd 192.168.217.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::20c:29ff:fefa:6cab/64 scope link 
       valid_lft forever preferred_lft forever
3: eth1: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN qlen 1000
    link/ether 00:0c:29:fa:6c:b5 brd ff:ff:ff:ff:ff:ff
superhero@vim-firewall:~$ 
```

`eth0`는 평범한 형태로 구성이 되어있고, 여기에 아직 설정되지 않은
`eth1`이 함께 보인다. 그리고 아래와 같이 별도의 Bridge 설정은 아직
존재하지 않는다.

```console
superhero@vim-firewall:~$ brctl show
bridge name	bridge id		STP enabled	interfaces
superhero@vim-firewall:~$ 
```

### Bridge의 설정 - Ubuntu

이 글은 Ubuntu 리눅스를 바탕으로 씌여졌는데, 아래와 같이 네트워크
설정파일을 수정하여 Bridge 구성을 해준다.

```console
superhero@vim-firewall:~$ cat /etc/network/interfaces
# This file describes the network interfaces available on your system
# and how to activate them. For more information, see interfaces(5).

# The loopback network interface
auto lo
iface lo inet loopback

iface eth0 inet manual
iface eth1 inet manual

# The primary network interface
auto br0
iface br0 inet static
	address 192.168.217.170
	netmask 255.255.255.0
	network 192.168.217.0
	broadcast 192.168.217.255
	gateway 192.168.217.1
	# dns-* options are implemented by the resolvconf package, if installed
	dns-nameservers 192.168.210.106
	dns-search infra.example.com
	bridge_ports eth0 eth1
	bridge_ageing 0
	#bridge_fd 5
	#bridge_maxage 12
	#bridge_stp off
	#bridge_maxwait 0

superhero@vim-firewall:~$ 
```

기본적인 설정은 이와 같이 매우 간단하다. 그리고 설정의 반영:

```console
superhero@vim-firewall:~$ sudo service networking restart
networking stop/waiting
networking start/running
superhero@vim-firewall:~$ 
```

이제 변경된 내용을 살펴보면 아래와 같다.

```console
superhero@vim-firewall:~$ ifconfig
br0       Link encap:Ethernet  HWaddr 00:0c:29:fa:6c:ab  
          inet addr:192.168.217.170  Bcast:192.168.217.255  Mask:255.255.255.0
          inet6 addr: fe80::20c:29ff:fefa:6cab/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:63 errors:0 dropped:0 overruns:0 frame:0
          TX packets:27 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:0 
          RX bytes:4108 (4.1 KB)  TX bytes:2934 (2.9 KB)

eth0      Link encap:Ethernet  HWaddr 00:0c:29:fa:6c:ab  
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:13638 errors:0 dropped:0 overruns:0 frame:0
          TX packets:1961 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:1000 
          RX bytes:966399 (966.3 KB)  TX bytes:332007 (332.0 KB)

<...>
superhero@vim-firewall:~$ 
```

보는 바와 같이, 실제로 물리적으로 존재하는 장치가 아닌 br0가 만들어졌고
eth0와 같은 MAC 주소를 갖고 있다. (우리 이야기에서 별로 중요하지는
않지만 원래 eth0가 가지고 있던 IP도 가져갔다.)

좀 더 보면,

```console
superhero@vim-firewall:~$ ip addr show
<...>
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq master br0 state UP qlen 1000
    link/ether 00:0c:29:fa:6c:ab brd ff:ff:ff:ff:ff:ff
<...>
4: br0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP 
    link/ether 00:0c:29:fa:6c:ab brd ff:ff:ff:ff:ff:ff
    inet 192.168.217.170/24 brd 192.168.217.255 scope global br0
       valid_lft forever preferred_lft forever
    inet6 fe80::20c:29ff:fefa:6cab/64 scope link 
       valid_lft forever preferred_lft forever
superhero@vim-firewall:~$ 
```

원래의 내용과 어떤 차이가 있을까? 같은 얘기의 반복인데, `eth0`가 원래
가지고 있던 속성들을 `br0`가 이어받았고, `eth0`은 기본적으로 Ethernet
관련 속성만 갖고 남아있다. 그리고 맨 윗줄에서 보면 Master가 `br0`라는
정보 등을 볼 수 있다.

마지막으로 Bridge 상태를 보면 하나의 가상 Bridge `br0`가 두 개의
Port(=interfaces, eth0와 eth1)를 가지고 있는 것을 확인할 수 있다.

```console
superhero@vim-firewall:~$ brctl show
bridge name	bridge id		STP enabled	interfaces
br0		8000.000c29fa6cab	no		eth0
							eth1
superhero@vim-firewall:~$ 
```

```console
superhero@vim-firewall:~$ brctl showmacs br0
port no	mac addr		is local?	ageing timer
  1	00:0c:29:fa:6c:ab	yes		   0.00
  2	00:b3:2c:14:3b:d9	yes		   0.00
superhero@vim-firewall:~$ 
```

## 분석

(앞서 얘기한 것과 같이, 작업 후반의 실제 데이터를 지금은 가지고 있지
않은 까닭에, 아래의 내용은 사실상 짜깁기한 소설이다. 기술을 담은
문서가 그러면 안되는데... 다시 동일한 작업을 해볼 기회가 있으면
Update하겠다.)

이렇게 구성된 "분석시스템"을 실제의 망 안에 넣고 통신 시험을 하여
"목표시스템"의 통신이 구성 전과 같이 정상적으로 이루어지는지 확인을
해야 한다.

통신확인이 되면 앞서 실행했던 `brctl showmacs br0` 명령을 다시 내렸을
때, 양단에 연결된 다른 MAC이 확인되는 것을 볼 수 있다. 대충, 아래와
비슷한 모양일 것이다.

```console
superhero@vim-firewall:~$ brctl showmacs br0
port no	mac addr		is local?	ageing timer
  1	00:0c:29:fa:6c:ab	yes		   0.00
  2	00:b3:2c:14:3b:d9	yes		   0.00
  1	e8:e7:32:cd:63:53	no		   1.36
  1	e8:e7:32:cd:64:45	no		  51.59
superhero@vim-firewall:~$ 
```

위와 같이, 어느쪽 포트에서 어떤 MAC이 보이는지 확인이 가능하고, 이를
이런 정보를 바탕으로 "분석시스템"에서 tcpdump나 유사한 도구를 이용하여
선로 사이를 오고 가는 모든 Packet을 살펴볼 수 있다.

![](/attachments/20150821-linux-bridge-0.jpg){:.fit}

잘 안보이지만, 대략 이런 모양의 작업을 하게 된다.


뭔가 허전하게 글을 맺게 되어 좀 난감하긴 한데, 아무튼 이제부터의
분석은 일반적인 `tcpdump`를 이용한 분석 과정과 크게 다르지 않다.
업무적으로 트래픽이 있는 상태에서, 위의 사진과 같이 실시간으로
패킷의 흐름을 (마치 매트릭스처럼) 바라보며 "이거다!"라고 외치거나,
또는 패킷을 저장한 후에 Wireshark를 돌려 상세한 내용을 분석하면
된다.

다음에 기회가 되면, 네트워크 분석에 대한 이야기를 좀 써보겠다.
그동한 겪었던 실제 상황을 가지고 쓰면 좋겠는데 이런 저런 이유로
실데이터를 지금은 가지고 있지 못해서 안타깝다. ㅎㅎㅎ


