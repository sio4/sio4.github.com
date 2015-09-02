---
title: Linux Bridge로 네트워크 문제 추적하기 - vSphere 편
image: /attachments/20150827-linux-bridge-0.png
tags: 리눅스 네트워크 문제해결 VMware ARP
date: 2015-08-27 09:26:33+09:00
modified: 2015-08-30 20:49:37+09:00
---
"[Linux Bridge로 네트워크 문제 추적하기]({% post_url 2015-08-21-troubleshooting-w-linux-bridge %}){:.reference}"에서 예기했던 것과 같이, 리눅스의
내장 Bridge 기능은 네트워크 통신과 연관된 문제를 뭐랄까... 대상의
OS 또는 구성과 관계없이 객관적 위치에서 추적할 때 유용하게 사용할
수 있다. 이번엔 VMware vSphere 가상환경 속에 위치한 VM을 대상으로
한 네트워크 분석 방법이다.


앞선 글에서는 분석대상이 물리서버인 환경에서 대상 서버와 스위치
사이에 별도의 분석장비를 넣어 흐름을 분석하는 방식을 사용했었다.
vSphere 환경에서는 분석장비가 가상머신으로 바뀌는 점을 제외하면
개념적으로 동일한 이야기가 된다.

그래서, 이 글에서는 가상환경에 의한 차이점과 특이사항을 중심으로
간략하게 기록하려고 한다.

## 가상환경의 추가 구성

분석용 VM은 별다른 것이 없다. 일반적인 방식으로 VM 위에 리눅스를
설치하고, 그 안에
"[Linux Bridge로 네트워크 문제 추적하기]({% post_url 2015-08-21-troubleshooting-w-linux-bridge %}){:.reference}"에서
설명한 방식으로 Bridge를 구성해주면 된다. 차이가 발생하는 부분은
이 분석용 VM을 vSwitch와 분석대상 VM 사이에 넣는 방식이다.

### 별도의 가상 스위치

vSphere/ESXi 내에서 VM 간 직접 연결을 할 수 있는 방법은 내가 아는
범위에서는 없는 것 같다. 그래서, 이 환경에서는 별도의 가상 스위치
구성이 필요하다. 그림으로 그려보면 아래와 같다.

![](/attachments/20150827-linux-bridge-0.png){:.fit}

이렇게 물리적 NIC에 연결된 서비스용 vSwitch0 아래에 분석용 장비인
vBridge의 vNIC0를 붙여주고, 물리 NIC 연결 없이 VM 연결용으로 추가
구성된 vSwitch1도 vNIC1을 연결한다.  이제 vSwitch0에 연결되어있던
VM #1의 vNIC2를 분리하여 vSwitch1 아래로 연결해준다.

이제 VM #1에서 발생한 패킷은 vSwitch1을 거쳐 vBridge로 향하게 되며,
vBridge 안에서는 vNIC1으로 들어와 br0를 거쳐 vNIC0로 빠지는 구조가
완성된다. (반대의 경우도 동일하다.)

{:.fit.styled}
| 구성        | 흐름 구조                                             |
|:-----------:|:-----------------------------------------------------:|
| 원래의 구성 | vSwitch0 > vNIC2                                      |
| 변경된 구성 | vSwitch0 > **vNIC0 > br0 > vNIC1 > vSwitch1** > vNIC2 |

### 스위치 모드 설정

일단 연결구조를 보면 위의 설정으로 충분해 보인다. 그런데 앞서 잠깐
얘기한 것처럼, 이 가상환경에서는 대상서버와 분석장치를 직접 연결할
수 없기 때문에 두 장치 연결을 위한 가상 스위치가 추가 구성되었다.

아마 구성을 보고 예상할 수 있는 이야기일 수 있을텐데, 이 경우에는
이 스위치를 그냥 "신규" 생성한 채로는 사용할 수 없다. 그 이름이
Hub가 아닌 Switch이다 보니까.
(사실, 이 부분은 약간의 의문점이 있고 조금 더 꼼꼼하게 살펴볼 필요가
있을 것 같다.)

Switch, 다른 표현으로 Switching Hub는 각 Port와 이와 연결된 단말이
갖는 MAC의 연결정보(ARP Table)를 장치에서 관리하면서 들어온 패킷의
목적지에 따라 어떤, 그리고 단 하나의 Port에게 그 패킷을 내보낼지를
결정(Switching)하는 두뇌를 가진 Hub의 한 종류이다.

그래서 위의 단순한 구성에서는 vSwitch1에서 의도한 바와 같이 양단에
위치한 기계에게 패킷을 전달하지 못하는 현상이 있었다. vSwitch0에서
vSwitch1에 이르는 구간에서 ARP 정보가 정상적으로 Broadcast 된다면
문제가 되지 않을 것 같은데... vSwitch의 동작방식을 정확히 모르지만
결과는 그렇다.

아무튼, **vSwitch1을 Promiscuous 모드로 설정**해주면, 양단의 패킷이
정상적으로 흐를 수 있게 된다. (한국어 UI에는 "비규칙 모드 허가"라고
되어있다.)

Promiscuous 모드는 쉽게 말하면 vSwitch를 vHub로 만드는 것과 같으니
Switching에서 기대했던 효과를 버리는 것이 된다. (하지만 임시니까! :-)

참고로, 원칙적으로 vBridge 자체의 NIC도 이러한 설정이 필요한데,
리눅스 Bridge 설정 만으로도 Promiscuous 모드 설정이 자동으로 된다.

## 문제와 해결

### ARP Reply

이와 같은 설정에서, 아래와 같은 증상의 문제를 만났다.

1. 분석대상 서버에서 외부로 ping을 하면 Gateway의 MAC을 알아내지 못하여
   ARP 질의만 계속하는 상황에 처했다.
1. Gateway의 MAC을 `arp` 명령으로 수동 입력하면 상황이 해결된다. (즉,
   패킷 전달구조 자체에는 문제가 없었다.
1. ARP가 정상인 범위는 Host를 포함하여 vSwitch1에 직접 연결된 VM까지이다.
   즉, Bridge를 통과하지 못하는 상황이다.

{% highlight console %}
superhero@vbridge:~$ sudo tcpdump -i eth0 -n host 192.168.10.172
tcpdump: WARNING: eth0: no IPv4 address assigned
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on eth0, link-type EN10MB (Ethernet), capture size 65535 bytes
12:13:45.809949 ARP, Request who-has 192.168.10.1 tell 192.168.10.172, length 46
12:13:45.810060 ARP, Request who-has 192.168.10.1 tell 192.168.10.172, length 46
12:13:45.810742 ARP, Reply 192.168.10.1 is-at 00:00:aa:aa:aa:d9, length 46
<...>
superhero@vbridge:~$ sudo tcpdump -i br0 -n host 192.168.10.172
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on br0, link-type EN10MB (Ethernet), capture size 65535 bytes
12:13:51.810928 ARP, Request who-has 192.168.10.1 tell 192.168.10.172, length 46
12:13:51.811031 ARP, Request who-has 192.168.10.1 tell 192.168.10.172, length 46
12:13:51.811579 ARP, Reply 192.168.10.1 is-at 00:aa:aa:aa:aa:d9, length 46
<...>
superhero@vbridge:~$ sudo tcpdump -i eth1 -n host 192.168.10.172
tcpdump: WARNING: eth1: no IPv4 address assigned
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on eth1, link-type EN10MB (Ethernet), capture size 65535 bytes
12:13:57.812937 ARP, Request who-has 192.168.10.1 tell 192.168.10.172, length 46
12:13:57.813040 ARP, Request who-has 192.168.10.1 tell 192.168.10.172, length 46
<...>
superhero@vbridge:~$ 
{% endhighlight %}

문제의 원인은 vSwitch가 동작하는 방식에 있었는데, vSwitch에 연결된
물리 NIC가 두 장 이상일 때(이중화를 위해 당연히 그렇게 구성하는데)
vSwitch의 NIC 사용 설정이 Active-Active든 Active-Standby든, 여분의
NIC에서 ARP Request를 Duplicate 하고 그 패킷이 다시 vSwitch를 타고
vBridge에 역으로 들어오게 된다. (뭐지?)

이 때, vBridge는 이 패킷을 근거로 그 패킷이 올라오는 Port인 vNIC0를
해당 서버(Request를 보낸 서버)가 위치한 Port로 착각하게 되는 것이다.
따라서, 해당 ARP에 대한 Response를 실제로 VM이 존재하는 vNIC1으로는
전달하지 않는다.

문제를 우회하는 방법은 vBridge에서 Aging Time 설정을 0으로 조정하여
**vBridge에서 ARP Table을 저장하지 않도록 해주면, Bridge에 도달하는
모든 패킷을 모든 Port에 선별 없이 전달**하게 된다.
(계속 좀...)

#### 참고
* [Serverfault에 썼던 질답 (2013-11-29)](http://serverfault.com/a/558236/145912)
* [참고했던 커뮤니티 글](https://communities.vmware.com/message/1509541#1509541)

## 덧붙여

이렇게 설정된 vBridge는,

* OS 상에서 Capture가 불가능한 NIC 하단의 망 흐름 분석이 필요할 때
* OS에 추가 구성을 하기 어렵거나 싫은데 망 분석은 필요할 때

등의 장애분석 외에도 다음과 같은 목적으로 사용될 수가 있을 것 같다.

* 가상환경에서 OS 방화벽을 대신하여 단일지점 접근통제 관리를 원할 때
* Host 레벨에서 상세한 망 통제를 하고 싶을 때

뭐, 돈이 없으니까. :-)

