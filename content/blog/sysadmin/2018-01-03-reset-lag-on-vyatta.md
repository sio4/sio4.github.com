---
title: Vyatta 네트워크 문제 추적 Part 2 - LACP
subtitle: Vyatta의 LACP 단절 문제에 대한 Work Around
tags: ["Vyatta", "LACP", "troubleshooting", "network"]
categories: ["sysadmin"]
image: /attachments/vyatta-troubleshooting/vyatta-lacp-reset.png
banner: /attachments/vyatta-troubleshooting/vyatta-lacp-reset.png
date: 2018-01-03T17:08:00+09:00
---
상용 제품의 한계로 인하여, 내게는 매우 중요한 문제이고 빠른 해결을 바라고
있지만 그것을 내가 어떻게 할 수 없는 경우가 있다. 바로 지금이 그런 상황인데,
이렇게 문제의 핵심에 접근하는 것이 제한적이거나, 원인을 정확히 알 수 없는
경우, 또는 원인을 안다 해도 근원적인 해결방법을 찾을 수 없을 때 우리가 할
수 있는 최선은 우회경로(Work Around)를 찾아 문제를 피하는 것이다.

지난 글 [Vyatta 네트워크 문제 추적 Part 1]에서 이 문제를 정확하게 파악하기
위해 로그를 더 세밀하게 추적하고, 인터페이스 상태와 네트워크 연결 상태를
함께 추적하여 선후 관계를 확인하고, 이와 함께 다음 단계의 분석을 위한 Dump
생성을 하는 과정에 대해 이야기했다.

이번 글에서는 Vyatta 장비의 명령을 활용하여 인터페이스 상태를 확인하고
점검하는 방법에 대해서 조금 더 알아보고, 조금 편법의 냄새가 나기는 하지만
시스템을 재기동하지 않고도 문제가 발생한 인터페이스를 다시 정상화하여
서비스를 이어갈 수 있게 하는 방안에 대하여 정리한다.


> 이 글은 다음 묶음글의 일부이며, 이 내용과 연결된 앞/뒤 사건은 아래 링크를
> 통해 확인할 수 있다.

* [Vyatta 네트워크 문제 추적 Part 1]
* _Vyatta 네트워크 문제 추적 Part 2 - LACP_
* [Vyatta 네트워크 문제 추적 Part 3 - Dump]


# Link Down, 그리고 LACP

Vyatta 장비는 `show` 명령을 사용하여 장비의 여러 상태를 확인할 수 있다.
아래와 같이, `show interfaces` 명령을 사용하면 장비에 연결된 모든 네트워크
인터페이스에 대한 기본 상태정보를 확인할 수 있다.

```console
vyatta@vrouter:~$ show interfaces
Codes: S - State, L - Link, u - Up, D - Down, A - Admin Down
Interface        IP Address                        S/L  Description
---------        ----------                        ---  -----------
dp0bond0         10.100.100.75/26                  u/u
dp0bond0.956     10.100.200.129/26                 u/u
dp0bond1         203.0.113.67/29                   u/u
dp0bond1.1162    203.0.113.177/28                  u/u
dp0s0            -                                 u/u
dp0s1            -                                 u/u
dp0s2            -                                 u/u
dp0s3            -                                 u/u
dp0vrrp1         203.0.113.70/32                   u/u
dp0vrrp2         10.100.100.74/32                  u/u
vti0             192.168.100.1/24                  u/u
vyatta@vrouter:~$ 
```

시스템이 정상적으로 동작하는 상황에서는 인터페이스의 상태를 나타나는 세 번째
열이 위와 같이 `u/u`로 표기된다. 출력의 맨 첫줄에 표시된 바와 같이 `u`는
상태가 Up이라는 의미이다.

이 상태에서 이중화된 `bond` 인터페이스에 대한 Slave 정보를 살펴보면 아래와
같이, 통계정보와 함께 LACP 상태 정보를 보여주게 된다.

```console
vyatta@vrouter:~$ show interfaces bonding dp0bond0 slaves
Interface        RX: bytes  packets     TX: bytes  packets    slctd LACP flags
dp0bond0         21083      194         94923      1451
    dp0s0        11527      114         13934      149        yes   DISTRIBUTING
    dp0s2        9556       80          80809      1299       yes   DISTRIBUTING
vyatta@vrouter:~$ 
```

LACP 상태 Flags에 대해서는 아래에 다시 정리할 것이다.

이 장비가 문제 상황에 처했을 때, 인터페이스 정보는 아래와 같이 변하게 된다.
다음과 같이, 이제 상태가 `u/D`로 변했고, 여기서 D는 Down 상태임을 의미한다.

```console
vyatta@vrouter:~$ show interfaces
Codes: S - State, L - Link, u - Up, D - Down, A - Admin Down
Interface        IP Address                        S/L  Description
---------        ----------                        ---  -----------
dp0bond0         10.100.100.75/26                  u/D
dp0bond0.956     10.100.200.129/26                 u/D
dp0bond1         203.0.113.67/29                   u/u
dp0bond1.1162    203.0.113.177/28                  u/u
dp0s0            -                                 u/u
dp0s1            -                                 u/u
dp0s2            -                                 u/u
dp0s3            -                                 u/u
dp0vrrp1         -                                 A/D
dp0vrrp2         -                                 A/D
vti0             192.168.100.1/24                  u/u
vyatta@vrouter:~$ 
```

그런데, 앞서 얘기했던 것처럼 이 상태에서 Slave들의 상태는 여전이 Up이다.
그러면 정말 이 물리 인터페이스에 Packet이 흐르고 있는지 궁금하지 않은가?
궁금하면 궁금증을 풀어야 하므로, 앞서 말했듯이, 문제 분석이란 불분명하고
흐린 것을 선명하게 만드는 과정의 반복이므로,

문제 분석
: 다시 한 번, 문제분석은 불분명하고 흐린 것을 선명하게 만드는 과정의 반복이다.

Capture를 해봤다.

```console
vyatta@vrouter:~$ tcpdump -n -i  dp0s0 -v
tcpdump: listening on dp0s0, link-type EN10MB (Ethernet), capture size 262144 bytes
16:30:20.1511184448 LACPv1, length 110
        Actor Information TLV (0x01), length 20
          System 46:4c:a8:74:c0:41, System Priority 32768, Key 27, Port 32795, Port Priority 100
          State Flags [Activity, Aggregation, Default]
        Partner Information TLV (0x02), length 20
          System 00:00:00:00:00:00, System Priority 0, Key 0, Port 0, Port Priority 0
          State Flags [Timeout]
        Collector Information TLV (0x03), length 16
          Max Delay 0
        Terminator TLV (0x00), length 0
16:30:20.1511184503 LACPv1, length 110
        Actor Information TLV (0x01), length 20
          System 0c:c4:7a:ba:9c:80, System Priority 65535, Key 0, Port 9, Port Priority 255
          State Flags [Activity, Aggregation, Synchronization]
        Partner Information TLV (0x02), length 20
          System 46:4c:a8:74:c0:41, System Priority 32768, Key 27, Port 32795, Port Priority 100
          State Flags [Activity, Aggregation, Default]
        Collector Information TLV (0x03), length 16
          Max Delay 0
        Terminator TLV (0x00), length 0
<...>
vyatta@vrouter:~$ 
```

어? 정말 흐른다! 그런데 위의 두 패킷 중 앞쪽의 것, 이 정보 만으로는 식별이
불가능하지만 Active 쪽의 MAC을 통해 Switch에서 전송한 것임을 알 수 있는 이
패킷을 보면, Vyatta 장비여야 할 Partner Information 부분의 MAC이 `00`으로
채워진 상태이고 Flags 값이 `Timeout`인 것을 알 수 있다.

**아... Packet이 흐르긴 흐르는데 LAG가 깨진 상태구나!**

장애 분석 관점에서는 크게 중요하지 않지만, 비교를 위해 정상적인 인터페이스의
Dump를 해봤다. 아래와 같이, 상호 간 MAC을 인식하고 있고, 상태가 `Distributing`
상태로 정상적인 LAG를 맺고 있는 것을 확인할 수 있다.

```console
vyatta@vrouter:~$ tcpdump -n -i  dp0s3 -v
tcpdump: listening on dp0s3, link-type EN10MB (Ethernet), capture size 262144 bytes
16:29:36.1511766869 LACPv1, length 110
        Actor Information TLV (0x01), length 20
          System 0c:c4:7a:ba:9c:83, System Priority 65535, Key 0, Port 12, Port Priority 255
          State Flags [Activity, Aggregation, Synchronization, Collecting, Distributing]
        Partner Information TLV (0x02), length 20
          System 46:4c:a8:74:5a:ad, System Priority 32768, Key 27, Port 32795, Port Priority 32768
          State Flags [Activity, Aggregation, Synchronization, Collecting, Distributing]
        Collector Information TLV (0x03), length 16
          Max Delay 0
        Terminator TLV (0x00), length 0
16:29:44.1511275083 LACPv1, length 110
        Actor Information TLV (0x01), length 20
          System 46:4c:a8:74:5a:ad, System Priority 32768, Key 27, Port 32795, Port Priority 32768
          State Flags [Activity, Aggregation, Synchronization, Collecting, Distributing]
        Partner Information TLV (0x02), length 20
          System 0c:c4:7a:ba:9c:83, System Priority 65535, Key 0, Port 12, Port Priority 255
          State Flags [Activity, Aggregation, Synchronization, Collecting, Distributing]
        Collector Information TLV (0x03), length 16
          Max Delay 0
        Terminator TLV (0x00), length 0
<...>
vyatta@vrouter:~$ 
```

LACP의 Flags에 대해서는 다시 정리하겠지만, 일단 문제의 상황에 집중해보자.
문제가 발생한 인터페이스의 상대방 Port(Switch의 Port)에서 전송되어 온 LACP
메시지를 보면, Switch 입장에서 상대방에 대하여 `Timeout` 값을 세팅하고 있고,
자신에 대해서는 `Default` 값을 설정해 놓았다.

`Default` Flag의 의미는 상대방으로부터 메시지를 받지 못하여 상대방에 대한
정보를 비롯해서 상태정보를 Reset한 상태임을 뜻하고, 상대방에 대해 붙인
`Timeout` Flag의 의미는 "누구 거기 있으면 빨리 답하세요" 뭐 이런 의미이다.

이럴 수가! LAG가 끊겨서 인터페이스가 죽다니!
심지어, 그 다음 패킷에서 볼 수 있듯이 Vyatta도 메시지를 받으면 바로 그것에
대응하여 응답을 하고 있는데도 상대는 이것을 받지를 못하는 모양이다!
**애당초 연결이 끊어진 것도 문제지만 왜 재 연결이 되지 않는가?!**



## 참고: LACP Flags

참고로, LACP는 Link Aggregation Control Protocol의 약자로 두 개의 네트워크
장비가 단일 회선이 아닌 두 개 이상의 회선으로 연결된 상태에서 그 두 회선을
논리적으로 하나로 만들어 대역폭을 확보하기 위한 기술을 통제하는 프로토콜이다.

LACP의 상태정보는 앞서 살펴본 Dump의 State Flags 부분에 담기게 되는데, 각
값의 의미는 다음과 같다.

* `Activity` - Set to indicate LACP active mode, cleared to indicate passive mode
* `Timeout` - Set to indicate the device is requesting a fast (1s) transmit interval of its partner, cleared to indicate that a slow (30s) transmit interval is being requested.
* `Aggregation` - Set to indicate that the port is configured for aggregation (typically always set)
* `Synchronisation` - Set to indicate that the system is ready and willing to use this link in the bundle to carry traffic. Cleared to indicate the link is not usable or is in standby mode.
* `Collecting` - Set to indicate that traffic received on this interface will be processed by the device. Cleared otherwise.
* `Distributing` - Set to indicate that the device is using this link transmit traffic. Cleared otherwise.
* `Expired` - Set to indicate that no LACPDUs have been received by the device during the past 3 intervals. Cleared when at least one LACPDU has been received within the past three intervals.
* `Defaulted` - When set, indicates that no LACPDUs have been received during the past 6 intervals. Cleared when at least one LACPDU has been received within the past 6 intervals. Once the defaulted flag transitions to set, any stored partner information is flushed.



# 인터페이스 다시 살리기

연결이 끊어진 이유는 그렇다 치고, 왜 다시 연결하지 못하는 걸까? 반대편
장비의 Packet Dump를 확인하지 못하는 상황이라서 답답하지만, 현상을 그냥
있는 그대로 받아들이면, Vyatta의 Kernel은 LACP 재개를 위한 `Synchronisation`
요청을 계속해서 보내지만, 어떤 이유에서인지 실제로 인터페이스는 Send를 하지
못하는 상황인 것으로 보인다. (상대방이 정말 받지 못했으니 계속 `Timeout`,
`Default`를 보낸다는 가정 하에)

혹시나 하고, 수동으로 물리 인터페이스를 떼었다가 다시 붙여봤다. 결과적으로
이게 먹히지만, 먹히는 이유를 아직은 잘 모르겠다. 뭔가 추가적으로 Reset되는
부분이 있을텐데, 그것이 실제로 문제를 일으킨 것일텐데, 그것을 찾지 못했다.
다시 말하지만, (지원이 시원치 않은) 상용 소프트웨어는 이래서 문제다.

아무튼,  
시작하기 전, Slave 상태는 아래와 같이 둘이 붙어있으나 링크는 Down인 상태이다.

```console
root@router:/opt/vyatta# show interfaces bonding slaves
Interface    Mode                   State    Link   Slaves
dp0bond0     802.3ad                up       down   2
dp0bond1     802.3ad                up       up     2
root@router:/opt/vyatta# 
```

먼저 두 번째 인터페이스를 떼었다가 붙여 보았다. 일단 아래와 같은 명령으로
인터페이스를 떼어내고, Slave 상태를 확인한 후 바로 다시 인터페이스를
추가했다. (사실, 이 방식이 적절한지 모르겠다. 주먹구구로 뒤져서 단지
동작하는 명령을 찾았을 뿐, 이에 대한 문서를 아직 확인하지는 못했다.)

```console
root@router:/opt/vyatta# sbin/vyatta-bonding --dev=dp0bond0 --remove=dp0s2
root@router:/opt/vyatta# show interfaces bonding dp0bond0 slaves
Interface        RX: bytes  packets     TX: bytes  packets    slctd LACP flags
dp0bond0         233350836  657769      54574771   122833
    dp0s0        233350836  657769      54574771   122833     yes   SYNCHRONIZAT
root@router:/opt/vyatta# sbin/vyatta-bonding --dev=dp0bond0 --add=dp0s2
root@router:/opt/vyatta# 
```

잠시 후에 Slave 상태를 다시 보면 아래와 같이, 떼었다 붙인 인터페이스는 정상
상태인 `Distributing` 상태에 와 있는 것을 확인할 수 있다.

```console
root@router:/opt/vyatta# show interfaces bonding dp0bond0 slaves
Interface        RX: bytes  packets     TX: bytes  packets    slctd LACP flags
dp0bond0         320887616  931006      295257466  801485
    dp0s0        233353316  657789      54574771   122833     yes   SYNCHRONIZAT
    dp0s2        87534424   273218      240682819  678653     yes   DISTRIBUTING
root@router:/opt/vyatta# 
```

다른 하나의 인터페이스에 대해서도 같은 방식으로 떼었다 붙이는 작업을 했고,
이번에는 상태 변화를 확인하기 위해서 조금 자주 상태확인 명령을 내려봤다.

```console
root@router:/opt/vyatta# sbin/vyatta-bonding --dev=dp0bond0 --remove=dp0s0
root@router:/opt/vyatta# show interfaces bonding dp0bond0 slaves
Interface        RX: bytes  packets     TX: bytes  packets    slctd LACP flags
dp0bond0         87540215   273296      240731482  678976
    dp0s2        87540125   273295      240731212  678972     yes   DISTRIBUTING
root@router:/opt/vyatta# sbin/vyatta-bonding --dev=dp0bond0 --add=dp0s0
root@router:/opt/vyatta# show interfaces bonding dp0bond0 slaves
Interface        RX: bytes  packets     TX: bytes  packets    slctd LACP flags
dp0bond0         320897349  931116      295307327  801822
    dp0s0        233356664  657816      54574771   122833     no    EXPIRED
    dp0s2        87540561   273299      240732372  678987     yes   DISTRIBUTING
root@router:/opt/vyatta# show interfaces bonding dp0bond0 slaves
Interface        RX: bytes  packets     TX: bytes  packets    slctd LACP flags
dp0bond0         320897349  931116      295307327  801822
    dp0s0        233356664  657816      54574771   122833     no    *AGGREGATION
    dp0s2        87540685   273300      240732866  678992     yes   DISTRIBUTING
root@router:/opt/vyatta# show interfaces bonding dp0bond0 slaves
Interface        RX: bytes  packets     TX: bytes  packets    slctd LACP flags
dp0bond0         320897349  931116      295307327  801822
    dp0s0        233356788  657817      54574771   122833     yes   SYNCHRONIZAT
    dp0s2        87540685   273300      240732866  678992     yes   DISTRIBUTING
root@router:/opt/vyatta# show interfaces bonding dp0bond0 slaves
Interface        RX: bytes  packets     TX: bytes  packets    slctd LACP flags
dp0bond0         320897473  931117      295309079  801842
    dp0s0        233356788  657817      54574895   122834     yes   DISTRIBUTING
    dp0s2        87540685   273300      240734374  679010     yes   DISTRIBUTING
root@router:/opt/vyatta# 
```

어쨌든, 이제 두 물리 인터페이스의 LAG 상태가 정상으로 돌아왔고, 상위의 `bond`
역시 정상화가 되었다.

```console
root@router:/opt/vyatta# show interfaces bonding slaves
Interface    Mode                   State    Link   Slaves
dp0bond0     802.3ad                up       up     2
dp0bond1     802.3ad                up       up     2
root@router:/opt/vyatta# 
```

아이고 지쳐라...

지난 달에 있었던 일의 기억을 더듬어 글을 쓰다 보니, 머리속 기억의 구슬을
뒤지느라 더 많이 지치는 것 같다.  
엄청난 크기의 Dump 분석에 대한 이야기는 다음 이 시간에...


### 함께 읽기

이 글은 다음 묶음글의 일부이며, 이 내용과 연결된 앞/뒤 사건은 아래 링크를
통해 확인할 수 있다.

* [Vyatta 네트워크 문제 추적 Part 1]
* _Vyatta 네트워크 문제 추적 Part 2 - LACP_
* [Vyatta 네트워크 문제 추적 Part 3 - Dump]


[Vyatta 네트워크 문제 추적 Part 1]:{{< relref "/blog/sysadmin/2018-01-03-vyatta-network-problem-tracking.md" >}}
[Vyatta 네트워크 문제 추적 Part 2 - LACP]:{{< relref "/blog/sysadmin/2018-01-03-reset-lag-on-vyatta.md" >}}
[Vyatta 네트워크 문제 추적 Part 3 - DUMP]:{{< relref "/blog/sysadmin/2018-01-04-analyzing-huge-dump-with-tcpdump.md" >}}
