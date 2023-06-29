---
title: Vyatta 네트워크 문제 추적 Part 3 - DUMP
subtitle: tcpdump를 이용한 거대 Dump의 효율적인 분석방법
tags: ["Vyatta", "packet-analysis", "troubleshooting", "tcpdump", "network"]
categories: ["sysadmin"]
image: /attachments/vyatta-troubleshooting/breaking-lacp.png
banner: /attachments/vyatta-troubleshooting/breaking-lacp.png
date: 2018-01-04T17:30:00+09:00
---
네트워크와 관련된 문제를 분석할 때 Packet을 Capture해서 분석하는 것 만큼
효과적인 방법이 있을까? 이 글의 소재가 되는 (제목이 아직은 잘못 붙여진)
"**Vyatta Network Interface Down Issue**" 역시, 결과적으로는 통신 내용을
확인하는 Packet Dump 분석을 통해 증상이나마, 증상이나마 확인할 수 있었다.

다시 반복해서, 증상이나마 확인할 수 있었는데, 이 상황이 어쩌면 내가 오픈
소스 소프트웨어를 아낄 수 밖에 없는 이유이다. 무슨 말인가 하면, 이 문제가
사업적으로 심각한 영향을 주고 있음에도 불구하고, 내가 할 수 있는 일의
한계는 "증상을 명확히 확인하고 전달하는 것" 외에는 없다는 점이다. 만약
이 문제의 중심에 있는 부분의 소스가 내 손이 닿는 곳에 있다면... 결과적으로
부족할지 모르지만 최소한 코드를 들여다 볼 수는 있을텐데 말이다.

잡설이 길었는데, 본론으로 들어간다.

이 묶음글의 첫 번째 이야기인 [Vyatta 네트워크 문제 추적 Part 1]에서는 관련된
로그를 더 자세히 남기게 하고, 시간의 흐름에 따라 변하는 상태정보를 모으면서
동시에 Network의 모든 Traffic을 Capture하도록 하는 과정에 대하여 이야기했고,
두 번째 이야기 [Vyatta 네트워크 문제 추적 Part 2 - LACP]에서는 Vyatta가
제공하는 명령어를 이용하여 인터페이스 상태를 점검하고, 문제가 생겼을 때
재부팅 없이 장애상황으로부터 빠져나올 수 있는 방법에 대하여 기술했다.

마지막 이야기인 이 글에서는, 첫 번째 이야기에서 얘기했던 **Dump를 분석하여
실제로 문제의 상황을 깊게 들여다보고, 원인을 추정하는 과정**에 대해 다룰
것이다.


> 이 글은 다음 묶음글의 일부이며, 이 내용과 연결된 앞/뒤 사건은 아래 링크를
> 통해 확인할 수 있다.

* [Vyatta 네트워크 문제 추적 Part 1]
* [Vyatta 네트워크 문제 추적 Part 2 - LACP]
* _Vyatta 네트워크 문제 추적 Part 3 - Dump_



# Analyzing Huge Dump, with a little help from tcpdump


앞서 얘기했던 것 같은데, 문제의 상황이 발생하면 수 초 만에 Dump의 크기가 수
GB에 달하는 크기로 증가한다. 이 문제의 분석을 맡은 이후, 첫 번째로 상황이
재현되었을 때, 이 사실을 알게 되어 감지 주기를 1분에서 10초로 줄이고, Dump는
감지됨과 거의 동시에 끊어내도록 설정을 했지만 그럼에도 불구하고 그 크기는
무지막지하게 컸다.

수 GB에 달하는 Pcap 파일을 PC로 가지고 와서 Wireshark로 열려고 시도했지만,
크기가 크기인지라, 쉽게 열리지 않았다. 그래서 평소에는 잘 쓰지 않는 편법을
조금 쓸 수 밖에 없었다.


## tcpdump - dump traffic on a network

사실 매우 간단한 Traffic 확인이 필요한 경우가 아니나면, 다시 말해서 장애를
분석하는 경우라면, Dump 수집 단계를 제외한 모든 분석 단계에서 GUI와 많은
기능을 제공하는 Wireshark를 사용해왔다. 그런데 열리지 않으니 어쩌나...

먼저, Wireshark에서 열던 세션을 취소하였다. 그렇게 되면, Wireshark는 이미
읽은 만큼만 화면에 표시해주도록 개발되어 있는데, 이렇게 되면, 그나마 열린
부분이라도 확인할 수 있게 되므로 이런 동작 방식은 꽤나 유용하다. 그리고,
그렇게 열린 내용 Dump의 앞부분으로부터 대략적인 패턴을 찾아보는 시도를 했다.

확인해보니, 특정 세션 또는 IP/Port의 쌍이 전체 Dump 용량의 상당수를 차지하고
있다는 것을 알 수 있었다. 그럼 부분적으로 발라내면 되지 않을까? `tcpdump`
명령은 Packet을 Dump할 때 뿐만 아니라, 이미 받아 놓은 Pcap 파일을 입력으로
해서도 사용할 수 있는 도구이다. `tcpdump`를 활용하자.

`tcpdump`는 wireshark와는 달리, 파일을 통으로 열어 메모리에 담기 보다는,
**Packet을 흘러 지나가는 Stream으로 다루기 때문에 양이 아무리 많더라도
처리할 수가 있다**. 또한, 수행하는 작업도 상대적으로 매우 단순하기 때문에
휠씬 빨리 일을 처리할 수 있다.

```console
$ tcpdump -n -r bond0.2017-12-04_13:54:21.pcap -w not9090.pcap 'not (vlan and ip and port 9090)'
$ tcpdump -n -r not9090.pcap -w not9090-not10200.pcap 'not (vlan and host 10.200.224.80)'
$ tcpdump -n -r not9090-not10200.pcap -w not9090-not10200-not10200.pcap 'not (host 10.200.224.80)'
$ 
```

첫번째 줄을 보면 `-r` 옵션을 사용하고 있는데, 이 옵션은 `tcpdump`로 하여금
네트워크 인터페이스가 아닌 Pcap 파일로부터 데이터를 읽도록 지정하는 것이다.
그리고 맨 뒤의 작은 따옴표로 묶인 부분은 `tcpdump`가 사용할 필터인데,
읽어보면 "VLAN 통신이면서 Port가 9090인 트래픽이 아님" 즉, "9090 Port를 쓰는
VLAN Traffic을 제외한 나머지"가 내 관심권이라는 것을 표현하고 있다. 이렇게
필터가 적용된 결과는 `-w` 옵션으로 지정한 파일에 저장된다.

다음 줄을 보면, 그와 동일한 패턴이지만 Port 번호가 아닌 IP 주소로 제외할
패킷을 지정하고 있는 것을 알 수 있고, 동일한 방식으로 분량이 많은 것들을
제외하여 날씬해질 때까지 반복하였다.

또 다른 사건의 기록으로 부터는, 다음과 같은 필터를 적용하기도 하였다.

```console
$ tcpdump -n -r dp0bond0.2017-12-05_08:47:53.pcap  'not icmp and not vrrp and not (vlan and ip and port (33389 or 1434))'
$ 
```

이것은 짐작할 수 있듯이, "ICMP도 아니고, VRRP도 아니고, VLAN으로 쌓여진
33389나 1434 Port를 쓰는 패킷이 아님"을 의미한다. 아무튼, 이렇게 필터를
걸어서, 분량이 너무 많은 세션들을 모두 제거했다.

필터를 적용한 것은 그것들을 버리려는 의도는 아니다. 패턴을 보여줄 정도만
남기고 양을 줄여보자는 것이며, 따라서 이렇게 걸러낸 것들을 다시 적당히
잘라내어 합쳐줄 필요가 있다.

```console
$ tcpdump -n -r dp0bond0.2017-12-05_08:47:53.pcap -w icmp-only.pcap 'icmp'
$ 
```

위와 같은 방식으로 각각의 대형 Traffic을 분리해냈다. 물론, `-c` 옵션 등을
이용하여 특정 수량을 잘라낼 수도 있는데, 나는 내용을 봐가며 작업을 해야
했기 때문에 일단 통으로 모아내고, 그것을 읽어서 적절한 용량을 수동으로
선별해냈다.

## wireshark - Interactively dump and analyze network traffic

Wireshark는, 하나의 Pcap이 열린 상태에서, 다른 파일을 Merge 모드로 열 수
있고, **두 파일을 하나의 파일로 병합하여 보거나 저장**할 수 있다.

먼저, `icmp-only.pcap` 처럼, `-only` 라는 이름으로 저장한 대형 Traffic을
담은 파일을 하나씩 열어봤다. 물론, 그것 만으로도 엄청난 크기였기 때문에,
적당한 시점에 열기를 취소하여 열린 만큼만 살펴봤다. 열어본 각각의 대형
Traffic 들을 간략하게 살피면서 잘라낼 위치를 선정했다.

Wireshark는 **Mark 기능을 이용하여 원하는 패킷에 임시 표시**를 할 수 있는데,
그 표식을 이용하여 원하는 만큼만 저장하는 것도 가능하다. (이 표식은
휘발성이어서, Pcap으로 저장한 파일에는 표식의 흔적이 남지 않는다.)

이렇게 잘라낸 파일들을 다시, 앞서 솎아놓은 "나머지 Traffic" 등과 합쳤고,
거기에 다시 물리 인터페이스로부터 뽑아낸 LACP Traffic을 합쳐버렸다.
그랬더니...


## Packet 살펴보기

아래의 내용은, Wireshark로 전체적인 흐름을 분석한 후, 관심있는(특이 징후를
담고 있는) 패킷만 Marking하여 뽑아낸 것이다.


```console
No.     Time                       DT-D        VLAN Source                Destination           Protocol Info 
   2777 2017-12-05 14:12:45.130592 0.000000         10.100.100.75         224.0.0.18            VRRP     Announcement (v2)
   2778 2017-12-05 14:12:46.131393 1.000801         10.100.100.75         224.0.0.18            VRRP     Announcement (v2)
   2779 2017-12-05 14:12:47.132536 1.001143         10.100.100.75         224.0.0.18            VRRP     Announcement (v2)
   2780 2017-12-05 14:12:47.700437 0.567901    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive] 61728→1434 [ACK] Seq=1013 Ack=665 Win=65024 Len=1
   2781 2017-12-05 14:12:47.701058 0.000621    956  10.100.200.143        172.20.18.40          TCP      [TCP Keep-Alive ACK] 1434→61728 [ACK] Seq=665 Ack=1014 Win=65792 Len=0 SLE=1013 SRE=1014
   2782 2017-12-05 14:12:47.763827 0.062769         SuperMic_ba:9c:80     Slow-Protocols        LACP     Link Aggregation Control ProtocolVersion 1.  Actor Port = 9 Partner Port = 32795 
   2783 2017-12-05 14:12:47.841785 0.077958    956  10.100.200.143        172.20.18.40          TCP      [TCP Keep-Alive] 1434→61728 [ACK] Seq=664 Ack=1014 Win=65792 Len=1
   2784 2017-12-05 14:12:47.845337 0.003552    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61728→1434 [ACK] Seq=1014 Ack=665 Win=65024 Len=0 SLE=664 SRE=665
   2785 2017-12-05 14:12:48.133390 0.288053         10.100.100.75         224.0.0.18            VRRP     Announcement (v2)
   2786 2017-12-05 14:12:48.926290 0.792900         10.100.100.75         10.0.80.11            ICMP     Echo (ping) request  id=0x12a9, seq=1/256, ttl=64 (reply in 2787)
   2787 2017-12-05 14:12:48.926428 0.000138         10.0.80.11            10.100.100.75         ICMP     Echo (ping) reply    id=0x12a9, seq=1/256, ttl=252 (request in 2786)
   2788 2017-12-05 14:12:49.133410 0.206982         10.100.100.75         224.0.0.18            VRRP     Announcement (v2)
   2789 2017-12-05 14:12:49.999237 0.865827         44:4c:a8:74:ca:b6     Slow-Protocols        LACP     Link Aggregation Control ProtocolVersion 1.  Actor Port = 32795 Partner Port = 9 
   2790 2017-12-05 14:12:50.133910 0.134673         10.100.100.75         224.0.0.18            VRRP     Announcement (v2)
   2791 2017-12-05 14:12:51.134779 1.000869         10.100.100.75         224.0.0.18            VRRP     Announcement (v2)
   2792 2017-12-05 14:12:51.286327 0.151548    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive] 61730→1434 [ACK] Seq=11645 Ack=3142 Win=65536 Len=1
   2793 2017-12-05 14:12:51.286728 0.000401    956  10.100.200.143        172.20.18.40          TCP      [TCP Keep-Alive ACK] 1434→61730 [ACK] Seq=3142 Ack=11646 Win=65792 Len=0 SLE=11645 SRE=11646
   2794 2017-12-05 14:12:51.443821 0.157093    956  10.100.200.143        172.20.18.40          TCP      [TCP Keep-Alive] 1434→61730 [ACK] Seq=3141 Ack=11646 Win=65792 Len=1
   2795 2017-12-05 14:12:51.447649 0.003828    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
   2796 2017-12-05 14:12:51.447652 0.000003    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
   2797 2017-12-05 14:12:51.447652 0.000000    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
   2798 2017-12-05 14:12:51.447653 0.000001    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
   2799 2017-12-05 14:12:51.447653 0.000000    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
   2800 2017-12-05 14:12:51.447654 0.000001    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
   2801 2017-12-05 14:12:51.447655 0.000001    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
   2802 2017-12-05 14:12:51.447655 0.000000    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
   2803 2017-12-05 14:12:51.447656 0.000001    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
   2804 2017-12-05 14:12:51.447657 0.000001    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
```

아우, 어지러워. 아무튼,
위의 Dump 결과를 보면, 처음에는 간간히 `VRRP` 패킷이나 `TCP Keep-Alive` 등이
흐르는 매우 잔잔한 상태였던 것을 알 수 있다. 그러다가 2796번 패킷부터는, 앞선
패킷과 완전히 동일한 패킷이 0.000001초 이내의 간격으로 반복해서 발생하는 것을
알 수 있다.

패킷의 IP 주소로 보면, 이 이상한 형태의 Traffic은 VPN을 통해 들어온 패킷이
문제의 `bond0` 쪽으로 나가는 패킷이며, 해당 NIC 기준으로 TX Traffic에 속한다.

다음 토막을 보면, 패킷 번호가 93만을 넘어 936413번 패킷부터 보여주고 있지만,
이 사이가 거의 전부 저 반복되는 패킷으로 차 있는 것이다. 93만며, 앞선 토막과의
시간차가 2.5초 정도이다. **2.5초 만에 동일한 패킷이 93만 번 중복해서 전송을
시도하고 있다는 뜻**이다.

```console
No.     Time                       DT-D        VLAN Source                Destination           Protocol Info 
 936413 2017-12-05 14:12:53.955594 2.507937    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
 936414 2017-12-05 14:12:53.955594 0.000000    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
 936415 2017-12-05 14:12:53.955594 0.000000    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
 936416 2017-12-05 14:12:53.955594 0.000000         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
 936417 2017-12-05 14:12:53.955940 0.000346    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
 936418 2017-12-05 14:12:53.955940 0.000000    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
 936419 2017-12-05 14:12:53.955940 0.000000    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
 936420 2017-12-05 14:12:53.955940 0.000000         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
 936421 2017-12-05 14:12:53.955941 0.000001    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
 936422 2017-12-05 14:12:53.955941 0.000000    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
 936423 2017-12-05 14:12:53.955941 0.000000    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
 936424 2017-12-05 14:12:53.955941 0.000000         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
 936425 2017-12-05 14:12:53.955942 0.000001    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
 936426 2017-12-05 14:12:53.955942 0.000000    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
 936427 2017-12-05 14:12:53.955942 0.000000    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
 936428 2017-12-05 14:12:53.955942 0.000000         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
 936429 2017-12-05 14:12:53.955943 0.000001    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
 936430 2017-12-05 14:12:53.955943 0.000000    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
 936431 2017-12-05 14:12:53.955943 0.000000    956  172.20.18.40          10.100.200.143        TCP      [TCP Keep-Alive ACK] 61730→1434 [ACK] Seq=11646 Ack=3142 Win=65536 Len=0 SLE=3141 SRE=3142
 936432 2017-12-05 14:12:53.955943 0.000000         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
```

위의 토막을 조금 더 들여다 보면, 93만 번 반복되던 1434 Port로 향하는 흐름의
사이 사이에, 문제가 발생한 쪽의 다음 Hop에 위치한 Router의 MAC을 찾는 ARP가
Unicast 형태로 역시 반복하여 발생하는 것을 볼 수 있다. (0000.0C9F.F001 번은
Cisco의 HSRP가 사용하는 MAC으로, 상위 Router의 MAC이다. 앞선 ACK에 비해서는
3:1 정도의 비율로 발생하는데, 그 이유는 모르겠다.)

**그리고... 이 ARP에 대한 Reply는 보이지 않는다.**

이런 양상이 한동안 지속되다가, 아래 토막에서 조금 다른 양상으로 바뀐다.
(`DT-D` 값을 보면 추가로 24초 정도 지속된 후의 상황이다.) 어느 순간,
Unicast로 나가던 것이 Broadcast 패킷이 추가로 발생하면서, 역시 0.000000초
간격으로 속사되고 있다. (Dump를 잘라내서 그렇지, 원래 이 사이에 앞서 봤던
ACK도 역시 동일한 양상으로 발생하고 있는 중이다.)

아! 빼먹을 뻔 했는데, 세 배 정도에 달하는 중복된 ACK를 상당히 잘라내고도,
아래 토막의 첫 패킷 번호는 275만을 넘어섰다.

```console
No.     Time                       DT-D        VLAN Source                Destination           Protocol Info 
2755577 2017-12-05 14:13:17.763339 23.807396        SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
2755578 2017-12-05 14:13:17.763339 0.000000         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
2755579 2017-12-05 14:13:17.763339 0.000000         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
2755580 2017-12-05 14:13:17.763339 0.000000         SuperMic_ba:9c:80     Broadcast             ARP      Who has 10.100.100.65?  Tell 10.100.100.75
2755581 2017-12-05 14:13:17.763339 0.000000         SuperMic_ba:9c:80     Broadcast             ARP      Who has 10.100.100.65?  Tell 10.100.100.75
2755582 2017-12-05 14:13:17.763339 0.000000         SuperMic_ba:9c:80     Broadcast             ARP      Who has 10.100.100.65?  Tell 10.100.100.75
2755583 2017-12-05 14:13:17.763746 0.000407         SuperMic_ba:9c:80     Slow-Protocols        LACP     Link Aggregation Control ProtocolVersion 1.  Actor Port = 9 Partner Port = 32795 
2755584 2017-12-05 14:13:17.763821 0.000075         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
2755585 2017-12-05 14:13:17.763821 0.000000         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
2755586 2017-12-05 14:13:17.763821 0.000000         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
2755587 2017-12-05 14:13:17.763821 0.000000         SuperMic_ba:9c:80     Broadcast             ARP      Who has 10.100.100.65?  Tell 10.100.100.75
2755588 2017-12-05 14:13:17.763821 0.000000         SuperMic_ba:9c:80     Broadcast             ARP      Who has 10.100.100.65?  Tell 10.100.100.75
2755589 2017-12-05 14:13:17.763821 0.000000         SuperMic_ba:9c:80     Broadcast             ARP      Who has 10.100.100.65?  Tell 10.100.100.75
2907535 2017-12-05 14:13:20.002363 2.238542         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
```

**어? 그 와중에도 상위 Router가 Multicast로 날리는 HSRPv2는 들어오고 있네?**

ARP에 대한 응답이 잡히지 않는 것을 보면 ARP 패킷은 그 Router까지 가지 못한
것 같은데, 그 Router가 자발적으로 보내는 패킷은 도달하고 있다면, **결국 이
상황은 인터페이스 자체는 살아있고 RX는 정상적으로 동작하고 있지만, TX가
어느 단계인지는 알 수 없으나 동작하지 않는 것**으로 짐작해볼 수 있을 것 같다.

```console
No.     Time                       DT-D        VLAN Source                Destination           Protocol Info 
3787468 2017-12-05 14:13:32.885282 12.882486        SuperMic_ba:9c:80     Broadcast             ARP      Who has 10.100.100.65?  Tell 10.100.100.75
3787469 2017-12-05 14:13:32.885282 0.000000         SuperMic_ba:9c:80     Broadcast             ARP      Who has 10.100.100.65?  Tell 10.100.100.75
3787470 2017-12-05 14:13:32.885282 0.000000         SuperMic_ba:9c:80     Broadcast             ARP      Who has 10.100.100.65?  Tell 10.100.100.75
3787471 2017-12-05 14:13:32.885370 0.000088         203.0.113.171         224.0.0.102           HSRPv2   Hello (state Active)
3787472 2017-12-05 14:13:32.885561 0.000191         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
3787473 2017-12-05 14:13:32.885561 0.000000         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
3787474 2017-12-05 14:13:32.885561 0.000000         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
```

그러다가... 6840211번 패킷에 이르니, 수상한 LACP 패킷이 등장하기 시작한다.
물론, 아래의 간략한 정보로는 잘 보이지는 않지만...

```console
No.     Time                       DT-D        VLAN Source                Destination           Protocol Info 
6840208 2017-12-05 14:14:17.810713 0.046968         SuperMic_ba:9c:80     Broadcast             ARP      Who has 10.100.100.65?  Tell 10.100.100.75
6840209 2017-12-05 14:14:17.810713 0.000000         SuperMic_ba:9c:80     Broadcast             ARP      Who has 10.100.100.65?  Tell 10.100.100.75
6840210 2017-12-05 14:14:17.810713 0.000000         SuperMic_ba:9c:80     Broadcast             ARP      Who has 10.100.100.65?  Tell 10.100.100.75
6840211 2017-12-05 14:14:17.810749 0.000036         44:4c:a8:74:ca:b6     Slow-Protocols        LACP     Link Aggregation Control ProtocolVersion 1.  Actor Port = 32795 Partner Port = 9 
6840212 2017-12-05 14:14:17.810803 0.000054         SuperMic_ba:9c:80     Slow-Protocols        LACP     Link Aggregation Control ProtocolVersion 1.  Actor Port = 9 Partner Port = 32795 
6840213 2017-12-05 14:14:17.811070 0.000267         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
6840214 2017-12-05 14:14:17.811070 0.000000         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
6840215 2017-12-05 14:14:17.811070 0.000000         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
```

그리고 7043624번에 이르면, 급기야 더 이상한 LACP 흐름이 보인다.

```console
No.     Time                       DT-D        VLAN Source                Destination           Protocol Info 
7043621 2017-12-05 14:14:20.810790 2.999720         SuperMic_ba:9c:80     Broadcast             ARP      Who has 10.100.100.65?  Tell 10.100.100.75
7043622 2017-12-05 14:14:20.810790 0.000000         SuperMic_ba:9c:80     Broadcast             ARP      Who has 10.100.100.65?  Tell 10.100.100.75
7043623 2017-12-05 14:14:20.810790 0.000000         SuperMic_ba:9c:80     Broadcast             ARP      Who has 10.100.100.65?  Tell 10.100.100.75
7043624 2017-12-05 14:14:20.811089 0.000299         44:4c:a8:74:ca:b6     Slow-Protocols        LACP     Link Aggregation Control ProtocolVersion 1.  Actor Port = 32795 Partner Port = 0 
7043625 2017-12-05 14:14:20.811195 0.000106         SuperMic_ba:9c:80     Slow-Protocols        LACP     Link Aggregation Control ProtocolVersion 1.  Actor Port = 9 Partner Port = 32795 
7043626 2017-12-05 14:14:20.811198 0.000003         SuperMic_ba:9c:80     Slow-Protocols        LACP     Link Aggregation Control ProtocolVersion 1.  Actor Port = 9 Partner Port = 32795 
7043627 2017-12-05 14:14:20.811241 0.000043         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
7043628 2017-12-05 14:14:20.811241 0.000000         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
7043629 2017-12-05 14:14:20.811241 0.000000         SuperMic_ba:9c:80     Cisco_9f:f0:01        ARP      Who has 10.100.100.65?  Tell 10.100.100.75
```

### LACP만 정리

같은 Dump로부터 추출한 것은 아니지만, LACP 부분만 따로 추려보면 아래와 같다.
회식 구간에서는 약 30초 간격으로 서로 주고받던 일종의 Heartbeat이 있었지만,
어느 순간 이것이 끊어지면서 Switch는 노란 색으로 반전한 패킷과 같이 재협상을
시도한다. 물론, 이 구역에 Vyatta가 재협상을 위해 보낸 패킷도 포함되어 있는데,
결국 재협상은 이루어지지 않고 Switch는 Default/Timeout 상태로 빠진다.
(주황색 부분)

![](/attachments/vyatta-troubleshooting/breaking-lacp.png)



## 정리

먼저, 위의 Dump 분석에서 관측된 사실들을 정리해보자.

1. 14:12:51.443821 여기까지 정상
1. 14:12:51.447649 첫 번째 중복 패킷 패턴 등장 (Port 1434 ACK)
1. 14:12:53.955594 두 번째 중복 패킷 패턴 등장 (ARP for Router, Unicast)
1. 14:13:17.763339 세 번째 중복 패킷 패턴 등장 (ARP for Router, Broadcast)
1. 14:13:32.885370 RX는 아직 정상 (HSRP from Router)
1. 14:14:17.810749 LACP Expire 발생
1. 14:14:20.811089 LACP Timeout 발생 --> **bond Down으로 이어짐**

결국, 처음으로 이상 증상이 발생한 시점인 2번 단계 이후, 약 1분 30초가
지난 후에는 `dp0bond0` 인터페이스 자체가 명시적으로 Down으로 빠지게 되는데,
확증은 없으나 정황으로 보면, 이 1분 30초 동안에 해당 인터페이스는 RX는
정상으로 동작하는 상황에서 TX가 전혀 (또는 거의) 동작하지 않았다는 추리가
가능하다. (아! LACP 규격에서 Expire 상태로 진행되는 조건이, "30초 간격으로
전송되는 느린 LACPDU 전송을 세 번 연속으로 받지 못한 경우"라는 것을...
기억하나? 지난번 글에 살짝 써있었는데...)



## 가설

![](/attachments/vyatta-troubleshooting/lacp-expire-timing.png)

위의 그림을 보면, 관측시간 08:56:00 에 `lo`의 Traffic이 급증하는 것을 볼
수 있다. Router 통신에 영향이 없을, Loopback인 `lo`의 Traffic 이 증가하는
것은, `tcpdump`가 Vyatta에서 Capture를 할 때, User Space Process로 동작하는
`dataplane`과 TCP 통신으로 Dump를 받기 때문이다.

```console
root@router:~# ps axf
<...>
23625 pts/2    Sl+    0:01      |   \_ tcpdump -n -i dp0bond0 -G 600 -w /home/vyatta/dumps/dp0bond0.%F_%T.pcap
<...>
root@router:~# 
```

위와 같이 PID 23625의 `tcpdump` 프로세스가 있을 때,

```console
root@router:~# netstat -tnp
<...>
tcp6       0      0 127.0.0.1:49153         127.0.0.1:40696         ESTABLISHED 2181/dataplane
tcp6       0      0 127.0.0.1:40696         127.0.0.1:49153         ESTABLISHED 23625/tcpdump
tcp6       0      0 127.0.0.1:49154         127.0.0.1:42992         ESTABLISHED 2181/dataplane
tcp6       0      0 127.0.0.1:42992         127.0.0.1:49154         ESTABLISHED 23625/tcpdump
root@router:~# 
```

이렇게 TCP 세션이 맺어져 있고,

```console
root@router:~# lsof -p 23625
<...>
tcpdump 23625 root   11u  IPv6 788928      0t0      TCP localhost:40696->localhost:49153 (ESTABLISHED)
tcpdump 23625 root   12u  IPv6 788929      0t0      TCP localhost:42992->localhost:49154 (ESTABLISHED)
tcpdump 23625 root   13w   REG    8,2    53248 10093004 /home/vyatta/dumps/dp0bond0.2017-12-07_22:07:56.pcap
root@router:~# 
```

요렇게 세션을 잡고 있다.

어쨌든 중요한 것은, 저렇게 Dump 규모가 급증하는 상태(앞선 정리의 2번 단계)가
되면 어디선가 들어오는 Traffic이 없는데도 Dump에 걸리는 패킷이 넘쳐난다는,
다시 말해서 들어오지도 않은 패킷을 반복적으로 재전송하는 상황이 발생한다는
뜻이며, 이 상황이 아마도 TX Buffer의 Full 또는 Overflow로 이어지면서 정작,
정상적인 패킷은 밖으로 나가지 못하는 상황이 되는 것으로 생각된다.

그리고 이 TX 불가 상황이 1분 30초 간 지속되면, LACP 프로토콜의 규약에 의해,
LAG가 끊기게 되고, 이것이 Slave로 있는 두 물리적 인터페이스에서 교대로
발생하면서(위의 분석 해설에 넣진 않았지만, 실제로 그렇게 동작하는 것을
확인하였다) bonding 인터페이스는 완전 Down 상태에 빠지게 되는 것으로 보인다.


### 그러나...

그렇게 보이면 뭐하나...

이 글이 마지막 글이긴 한데... 네트워크 장애분석을 위한 접근 관점이 아닌,
네트워크 단절 문제 자체에 대해서는 아마도 허무하게 끝내야 할 것 같다. 현재
이 문제는, 이 묶음글의 절차를 통해 분석된 자료를 제조사에 넘긴 상태이지만
제조사가 진행해야 할 Software 요소(dataplane, vplane 등) 수준의 분석이나
원인규명, 패치 개발은 순조롭게 진행되지 않고 있는 것 같다. :-(


휴~~ 길고 지루했던 이 묶음글은 이걸로 맺는다.


아! 이슈 제목 정정을 안 했네?  
이 이슈의 제목을
"**비정상적인 TX Packet 중복 발생으로 인한 Vyatta LACP Expiration**"으로
바꾼다.


### 함께 읽기

이 글은 다음 묶음글의 일부이며, 이 내용과 연결된 앞/뒤 사건은 아래 링크를
통해 확인할 수 있다.

* [Vyatta 네트워크 문제 추적 Part 1]
* [Vyatta 네트워크 문제 추적 Part 2 - LACP]
* _Vyatta 네트워크 문제 추적 Part 3 - Dump_


[Vyatta 네트워크 문제 추적 Part 1]:{{< relref "/blog/sysadmin/2018-01-03-vyatta-network-problem-tracking.md" >}}
[Vyatta 네트워크 문제 추적 Part 2 - LACP]:{{< relref "/blog/sysadmin/2018-01-03-reset-lag-on-vyatta.md" >}}
[Vyatta 네트워크 문제 추적 Part 3 - DUMP]:{{< relref "/blog/sysadmin/2018-01-04-analyzing-huge-dump-with-tcpdump.md" >}}
