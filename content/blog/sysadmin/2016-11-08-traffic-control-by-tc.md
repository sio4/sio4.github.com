---
title: TC, 리눅스 Traffic Control
tags: ["network", "QoS", "Linux"]
categories: ["sysadmin"]
date: 2016-11-08T21:36:30+0900
---

복잡하게 구성된 환경에서는 그 단위가 물리 네트워크 전체든, 그 안에 흐르는
VLAN이든, 단일 서비스에 대한 것이든, 네트워크의 성능을 제한하여야 할 때가
있다. 예를 들어, 웹서비스를 주로 하고 부가적으로 FTP가 허용된 서버에서 웹
성능을 보장한다든지, 아무리 바쁜 상황에서도 관리용 접속이 지연되는 것을
피해야 한다든지, 특정 기능은 제한된 범위에서만 허용해야 한다든지...  
이런 부류의 관리를 보통은 Traffic Shaping이라고 부른다.
<!--more-->


# 리눅스 기본 Traffic Shaping

리눅스 커널에는 기본적으로 이러한 Traffic Shaping을 위한 기능이 내장되어
있으며 이 기능은 `tc`라는 명령을 통하여 관리할 수 있다.

```console
$ whatis tc
tc (8)               - show / manipulate traffic control settings
$ 
```

`tc` 명령을 사용하면 리눅스 커널의 네트워크 스텍을 제어해서 Shaping,
Scheduling, Policing, Dropping 등을 제어할 수 있다.


## 간단한 예제

이번 글은, 정말 즉흥적으로 작성하게 된 것으로, 일단 간단한 예제만 소개하는
것으로 마칠 예정이다. 나중에 시간이 되면, 앞서 열거한 보장, 지연회피, 제한
등의 경우들에 대하여 얘기할 수 있기를 바란다.

먼저, 현재 내 랩탑의 기본 상태이다.

```console
$ sudo tc -s qdisc ls dev eth0
qdisc pfifo_fast 0: root refcnt 2 bands 3 priomap  1 2 2 2 1 2 0 0 1 1 1 1 1 1 1 1
 Sent 552061301 bytes 4935279 pkt (dropped 0, overlimits 0 requeues 7) 
 backlog 0b 0p requeues 7 
$ ping -c 3 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=54 time=37.3 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=54 time=37.1 ms
64 bytes from 8.8.8.8: icmp_seq=3 ttl=54 time=37.0 ms

--- 8.8.8.8 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2002ms
rtt min/avg/max/mdev = 37.010/37.170/37.313/0.124 ms
$ 
```

위의 첫번째 명령은 현재의 QDISC 상태를 보여주는 것으로, 별도의 설정을 하지
않은 Default 값을 보여주고 있다. 이 상태에서 Google DNS를 찔러봤다. (미안)

현재의 네트워크가 나쁘지 않고 Google의 망도 훌륭해서, 위와 같이 37ms라는
훌륭한 RTT를 보여준다. 이 상태에서, 인위적으로 "느린 망"을 만들어 보면,
아래와 같다.


```console
$ sudo tc qdisc add dev eth0 root netem delay 200ms
$ sudo tc -s qdisc ls dev eth0
qdisc netem 8001: root refcnt 2 limit 1000 delay 200.0ms
 Sent 609 bytes 9 pkt (dropped 0, overlimits 0 requeues 0) 
 backlog 0b 0p requeues 0 
$ ping -c 3 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=54 time=237 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=54 time=237 ms
64 bytes from 8.8.8.8: icmp_seq=3 ttl=54 time=237 ms

--- 8.8.8.8 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2001ms
rtt min/avg/max/mdev = 237.027/237.050/237.067/0.016 ms
$ 
```

Netem이란 리눅스 내장의 Network Emulator이다.

```console
$ whatis tc-netem
tc-netem (8)         - Network Emulator
$ 
```

위의 명령은 Network Emulator로 하여금 `eth0`를 지나는 패킷들에게 인위적인
200ms의 지연을 만들어 내도록 설정하는 것이며, 결과적으로 Ping의 RTT가 200ms
증가한 것을 볼 수 있다. 이제 시험이 끝났으니 설정을 날리는 것으로 오늘의
이야기 끝!

```console
$ sudo tc qdisc del dev eth0 root
$ sudo tc -s qdisc ls dev eth0
qdisc pfifo_fast 0: root refcnt 2 bands 3 priomap  1 2 2 2 1 2 0 0 1 1 1 1 1 1 1 1
 Sent 1532 bytes 15 pkt (dropped 0, overlimits 0 requeues 0) 
 backlog 0b 0p requeues 0 
$ 
```

아! 왜 즉흥적으로 이 짧은 글을 쓰게 됐냐고?  
이렇게 간단하게 설정이 가능한 Traffic Shaping이...  
없단다.  
내가 써야만 하는 환경에.  
OTZ...






