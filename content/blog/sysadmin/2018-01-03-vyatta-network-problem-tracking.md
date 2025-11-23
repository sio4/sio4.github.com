---
title: Vyatta 네트워크 문제 추적 Part 1
subtitle: 로그, 상태, 패킷 자료를 바탕으로 네트워크 관련 문제 추적하기
tags: ["Vyatta", "packet-analysis", "troubleshooting", "network"]
categories: ["sysadmin"]
image: /attachments/vyatta-troubleshooting/vyatta-network-problem-tracking.png
banner: /attachments/vyatta-troubleshooting/vyatta-network-problem-tracking.png
date: 2018-01-03T12:25:00+09:00
---
2018년의 첫 글은 2017년의 마지막 사건으로 시작하려고 한다. 이 마지막 사건을
"**Vyatta Network Interface Down Issue**"라는, 알고 보면 문제를 정확하게
기술하지 못하는, 잘못된 제목으로 일단 부를 것이다.
아무튼 (사건의 제목이 맞든 틀렸든) 어떤 프로젝트의 Vyatta 네트워킹에 문제가
발생했고, 이 글은 이차 저차 내게 넘어온 이 "네트워크 관련 문제"를 정확하게
파악하기 위한 추적 과정을 정리하는 글이다.

어떤 문제가 우리 앞에 나타났을 때, 우리는 (어쩌면 당연한 반응일 수 있는데,)
사건의 얼굴에서 그 답을 찾으려고 노력하게 된다. 그러나 생각보다 많은 경우에
사건의 실체는 그 얼굴에 써 있지 않은 경우가 있다. 문제를 접할 때, 보다 넓게
가능성을 열어놓고, 잠깐 멈춰 서서 침착함을 잃지 않고, 문제를 찬찬히, 그리고
깊게 들여다 봐야 하는 이유가 바로 여기에 있다. (써놓고 보니 뭔가... 인생사
또는 연애사에서도 통하는 얘기같다. :-)

{:.boxed}
> 이 글은 다음 묶음글의 일부이며, 이 내용과 연결된 앞/뒤 사건은 아래 링크를
> 통해 확인할 수 있다.
> 
> * _Vyatta 네트워크 문제 추적 Part 1_
> * [Vyatta 네트워크 문제 추적 Part 2 - LACP]
> * [Vyatta 네트워크 문제 추적 Part 3 - Dump]



# Log: "머리가 아파요"

* TOC
{:toc .half.pull-right}

생각보다 많은 일들을, 생각보다는 쉽게 끝낸 2017년의 연말을 쪼/끔/ 한가하게
보내려는 정말 작은 소망을 저버리고, 또 하나의 사건이 내게 넘어왔다. 넘어올
때의 이름이 바로 "Vyatta Network Interface Down Issue"였다. 왜 이런 이름이
붙어서 온 것일까?

늘 하는 얘기지만 컴퓨터 시스템과 대화할 때 가장 기본이 되는 것이 바로 그가
내뱉는 말, 즉 로그에 귀를 기울이는 것이다. 그런 의미에서 초기에 이 문제를
맡았던 엔지니어가 "인터페이스가 죽었어요"라고 말한 것은 적절한 기본 대응을
한 것이라고 말할 수도 있을 것 같다.

```console
<...>
OSPFv3[25]:  OSPFv3-7NSM[INTERFACE]: OSPF6 NSM Interface is Up (dp0bond0)
vplaned[35]: get_netconf 9 failed Operation not supported
vplaned[35]: get_netconf 15 failed Operation not supported
vplaned[35]: get_netconf 15 failed Operation not supported
OSPFv3[25]:  OSPFv3-7NSM[INTERFACE]: OSPF6 NSM Interface is Down (dp0bond0)
OSPFv3[25]:  OSPFv3-7NSM[INTERFACE]: OSPF6 NSM Interface is Down (dp0bond0.956)
vplaned[35]: get_netconf 17 failed Operation not supported
vplaned[35]: get_netconf 19 failed Operation not supported
OSPFv3[25]:  OSPFv3-7NSM[INTERFACE]: OSPF6 NSM Interface is Down (dp0vrrp2)
Keepalived_vrrp[75]: Kernel is reporting: interface dp0bond0 DOWN
Keepalived_vrrp[75]: VRRP_Instance(vyatta-dp0bond0-1) Entering FAULT STATE
Keepalived_vrrp[75]: VRRP_Instance(vyatta-dp0bond0-1) removing protocol VIPs.
Keepalived_vrrp[75]: VRRP_Instance(vyatta-dp0bond0-1): Sending SNMP notification
Keepalived_vrrp[75]: VRRP_Instance(vyatta-dp0bond0-1) Now in FAULT state
Keepalived_vrrp[75]: VRRP_Group(vgroup1) Syncing instances to FAULT state
Keepalived_vrrp[75]: VRRP_Instance(vyatta-dp0bond1-1) Entering FAULT STATE
Keepalived_vrrp[75]: VRRP_Instance(vyatta-dp0bond1-1) removing protocol VIPs.
Keepalived_vrrp[75]: VRRP_Instance(vyatta-dp0bond1-1): Sending SNMP notification
Keepalived_vrrp[75]: VRRP_Group(vgroup1): Sending SNMP notification
<...>
```

이렇게, 실제로 로그는 `dp0bond0`, `dp0bond0.956`, `dp0vrrp2` 등이 죽었다는
메시지를 우리에게 주고 있었으니까.

그런데 아이가 운다고 "우네"라고 말하는 건 엄마가 아니듯이, 최종 사용자가 아닌
엔지니어라면 이 상황에서 조금 다른 반응을 보여야 한다. 엄마가 경험을 바탕으로
하여 아이가 배가 고픈 것인지, 기저귀를 갈아줘야 할지 판단하듯이, 또는 의사가
그 수준의 경험과 전문성을 바탕으로 진찰을 하고 병을 확인하여 그것을 고치듯이
엔지니어는 그들의 경험과 전문성, 그리고 직감을 활용하여 문제 해결의 방향을
잡아야 하는 것이다.

{:.point}
로그는...
: 아프다는 "현상"을 말하는 것이지, "문제 자체"를 말하는 것이 아니다.

병원에 처음 갔을 때 의사가 문진을 하듯이, 시스템에게 더 많은 것을 말하도록
해줘야 한다. 궁극적으로는 더 많은 내용을 출력하도록 로그 수준을 수정할 수도
있지만, 가장 먼저 할 일은 이미 한 말을 다시 곱씹어 보는 것이다.

위의 로그를 보면 어떤 생각이 드는가? 리눅스 시스템 엔지니어라면 당연히 아는
얘기지만 `bond`라는 것은 물리적 인터페이스가 아니다. 가용성을 확보하기 위해
사용하는 `bond`가 죽었다는 것은 그 아래에 위치한 모든 물리적 Slave가 사용할
수 없는 경우일텐데, 로그를 다시 봐도 물리 인터페이스가 Down 되었다는 로그는
없었다. 그렇다면 이 상황은, 단순한 장치 장애보다는 더 복잡한 문제가 단순한
로그 메시지 뒤에 숨어있다는 뜻일 것이다.



# 진찰하기

장애의 원인 또는 원인지점을 추적하기 위한 방법은 그 대상에 따라 매우 다양할
것이다. 그 중에서 가장 일반적으로 사용되는 두 가지 부류가 시스템이 적극적으로
표현하는 말을 들어주는 "**로그 추적**"과, 겉으로 들어나 있지 않은 내부 상태를
확인하는 "**상태 추적**"이다. (이 글은 교과서도 아니고, 나의 주관적인 생각과
정의에 의한 분류이다.)


## Log Tracking: 문진

앞서 잠깐 이야기했지만, 문제의 상황을 보다 정확히 알기 위해서는 시스템으로
하여금 조금 더 자세히 말하도록 설정해줘야 하며, 그것을 최대한 놓치지 않고
들어줘야 한다.

아래의 설정은 이 글에서 다루고 있는 Vyatta 시스템 설정의 일부인데, 시스템이
로그를 처리하는 방법을 정의하고 있는 부분을 딴 것이다.

```console
root@router# show system syslog 
 syslog {
        global {
                archive {
                        files 20
                        size 10000
                }
                facility all {
                        level notice
                }
                facility protocols {
                        level debug
                }
        }
        host 203.0.113.221:7414 {
                facility all {
                        level info
                }
        }
 }
[edit]
root@router# 
```

여기서 주로 볼 부분은 `global` 아래의 `archive` 부분과, `host` 부분이다.

`archive` 설정은 시스템의 로그파일을 몇 개나, 그리고 얼마의 크기로 보관할
것인지를 설정하는 부분인데, 리눅스 등의 `logrotate`를 생각하면 쉽게 이해할
수 있다. Vyatta의 기본 설정은 디스크가 넘치는 상황 등을 막기 위해 최소한의
공간을 사용하도록 설정되어 있다. 그러나 문제 추적을 위해서는 놓치는 (혹은
rotate 되어 사라지는) 로그가 없도록 해줘야 할 필요가 있으며, 위와 같이
보관할 양과 파일의 수를 충분히 늘려주면 디스크 사용량은 높아질 지언정,
거의 모든 로그를 잃지 않고 보관할 수 있게 된다.

이보다 중요한 부분은 `host` 부분인데, 이 설정은 IP 주소가 203.0.113.221인
서버의 7414번 포트를 Target으로 해서 원격지에 로그를 쏘도록 설정한 것이다.
이렇게 원격 로그를 설정함으로써, 우리는 시스템에 접속하지 않고도 구성에
따라 보다 편리한 방식으로 로그를 수집하고 필요한 시점에 살펴볼 수 있으며,
또한 로그 패턴에 따라 적절한 Alert을 설정할 수도 있게 된다.

또한, 원격지에 남길 로그는 위와 같이 기본 `level`을 `info`로 올려서 조금 더
상세한 내용을 남기도록 설정하였다.

![](/attachments/vyatta-troubleshooting/vyatta-network-problem-tracking.png){:.bordered.dropshadow}

위의 그림은, 원격 로그수집의 결과를 나중에 설명할 Traffic Check 자료와 함께
표출한 그림으로, 그래프 부분은 데이터 전송량을 나타내고 있으며 붉은 폭탄
표시와 녹색의 별표는 각각 장애 시점에 대한 로그, 복구 시점에 대한 로그를
시각화하여 시계열 그래프에 함께 표시한 것이다.

원격 로그 환경의 구성에 대한 이야기는 다음의 글에서 다루고 있으니 참고:

* 로그 관리를 위한 클라우드 서비스에 대해 다룬
  "[PaperTrail, Cloud에서는 Cloud 로그를!]"
* 설치형 오픈소스 로그관리 솔루션인 Graylog2에 대한
  "[Calling All Logs! Graylog2 1편: 설치하기]" 외 3 편
* Elastic Stack으로 NMS를 구성했던 사례를 담은
  "[Elastic NMS Part 2: Syslog 원격로깅]" 외 5 편
* Elastic Stack 6.0의 기능을 중심으로 다시 살펴봤던
  "[Kibana Visual Builder로 이벤트 묶어 보기]" 외 3 편

[PaperTrail, Cloud에서는 Cloud 로그를!]:{% link _posts/cloudcomputing/2016-09-07-cloud-log-papertrail.md %}
[Calling All Logs! Graylog2 1편: 설치하기]:{% link _posts/sysadmin/2017-10-11-calling-all-logs-graylog2-installation.md %}
[Elastic NMS Part 2: Syslog 원격로깅]:{% link _posts/cloudcomputing/2017-10-30-elastic-nms-part2-syslog-remote-logging.md %}
[Kibana Visual Builder로 이벤트 묶어 보기]:{% link _posts/cloudcomputing/2017-11-24-aggregate-events-with-visual-builder.md %}


대체로, 다음 두 가지 조건인 경우에는 로그를 살피는 것으로도 충분히 장애의
원인을 확인할 수가 있다.

* 문제가 단순한 경우
* 개발자가 꼼꼼하게 예외상황에 대한 대처를 로그를 포함하여 해둔 경우

물론, 이런 경우라고는 해도 모든 문제가, 누구나 쉽게 풀 수 있는 것은 아니다.
보통은 문제를 푸는 사람이 다음의 세 가지 조건을 갖춰야 한다.

* 로그를 제대로 읽을 수 있어야 한다.
* 단지 읽는 것 만으로 해결이 되지 않을 경우, 이것을 기반으로 다음 실마리를
  찾을 수 있어야 한다. 보통은 Googling 등을 잘 하는 것도 도움이 된다.
* 가장 중요한 것은, 개발자의 관점을 이해하는 것이 중요하다. 로그는 사실,
  시스템의 언어가 아니라 개발자의 표현이다.



## Status Tracking: 청진기

그럼에도 불구하고 풀리지 않는 문제가 있다. 이런 경우에는 조금 더 깊게 문제를
들여다 보는 노력이 필요하다. 다시 말하지만 능력이 아니라 노력이다. 문제를
풀고 못풀고의 차이는, 내 경험에 비추어 보면, 문제를 가진 자가 능력이 있는지
없는지의 문제이기 보다는 얼마나 그 문제를 애정하는가, 그리고 그것을 풀기
위해 노력하는가에 달려있다. 98% 정도는 확실히 그렇다.

아무튼, 시스템이 스스로 알려주지 않는 사실을 파악하기 위해서는 다양한 방법을
동원하여 상태를 확인해야 한다. 특히, 대부분의 경우에는 시간의 흐름에 따른
상태의 변화가 단순히 한 순간의 상태를 확인하는 것 보다 많은 것을 알려준다.


일반적인 얘기에서 이 문제의 경우로 다시 돌아가본다. 특별히 부하가 높은 상황도
아니고 `dp0bond0`가 Down되는 현상 외에는 물리 인터페이스나 다른 부분에 별다른
징후나 현상이 나타나지 않는 상황에서 내가 가장 먼저 궁금했던 건, 그렇다면 그
Down 상태에 빠지기까지 시간의 흐름에 따라 어떤 사건이 어떻게 전개되는지를
알고 싶었다.

아래 스크립트는, 임의로 재현할 수 없는 장애 상황을 나 대신 기다리면서 관련
자료를 수집하도록 작성한 상태 추적 스크립트의 축약본이다.


```sh
#!/bin/sh
# 
# checker.sh

ifs="dp0bond0 dp0bond1 dp0s0 dp0s1 dp0s2 dp0s3"

while true; do
	echo "date,			  if,		carr,	state,	age,		chngs,	ping,	ping"
	/bin/ping -c 1 8.8.8.8 >/dev/null 2>&1 && p1=1 || p1=0
	/bin/ping -c 1 10.0.80.11 >/dev/null 2>&1 && p2=1 || p2=0
	for dev in $ifs; do
		echo -n "`date -Iseconds`,"
		echo -n " $dev,"
		echo -n "	`cat /sys/class/net/$dev/carrier`,"
		echo -n "	`cat /sys/class/net/$dev/operstate`,"
		echo -n "	`cat /sys/class/net/$dev/opstate_age`,"
		echo -n "	`cat /sys/class/net/$dev/opstate_changes`,"
		echo "	$p1,	$p2"
	done
	sleep 60
done
```

읽어보면, 관심있는 인터페이스 목록을 설정하고 각 인터페이스의 연결상태와
작동상태, 현 작동상태의 지속시간, 작동상태 변경 횟수 등을 CSV 형식으로
출력하도록 만든 단순한 스크립트이다. 이 스크립트를 사용하여 다음과 같은
결과를 얻었다.
(`/sys` 파일시스템에 대해서는 Topic에서 멀어지므로 생략한다. 그리고 화면
표시를 위해 공백을 조금 조정했다.)


```console
date,                     if,       carr, state, age,        chngs, ping, ping
2017-11-30T18:53:48+0900, dp0bond0, 1,    up,    184119.289, 1,     1,    1
2017-11-30T18:53:48+0900, dp0bond1, 1,    up,    184120.385, 1,     1,    1
2017-11-30T18:53:48+0900, dp0s0,    1,    up,    184123.594, 3,     1,    1
2017-11-30T18:53:48+0900, dp0s1,    1,    up,    184122.516, 3,     1,    1
2017-11-30T18:53:48+0900, dp0s2,    1,    up,    184120.400, 3,     1,    1
2017-11-30T18:53:48+0900, dp0s3,    1,    up,    184123.712, 3,     1,    1
date,                     if,       carr, state, age,        chngs, ping, ping
2017-11-30T18:54:58+0900, dp0bond0, 1,    up,    184189.334, 1,     1,    0
2017-11-30T18:54:58+0900, dp0bond1, 1,    up,    184190.431, 1,     1,    0
2017-11-30T18:54:58+0900, dp0s0,    1,    up,    184193.640, 3,     1,    0
2017-11-30T18:54:58+0900, dp0s1,    1,    up,    184192.561, 3,     1,    0
2017-11-30T18:54:58+0900, dp0s2,    1,    up,    184190.445, 3,     1,    0
2017-11-30T18:54:58+0900, dp0s3,    1,    up,    184193.758, 3,     1,    0
date,                     if,       carr, state, age,        chngs, ping, ping
2017-11-30T18:56:02+0900, dp0bond0, 1,    up,    184252.460, 1,     1,    0
2017-11-30T18:56:02+0900, dp0bond1, 1,    up,    184253.557, 1,     1,    0
2017-11-30T18:56:02+0900, dp0s0,    1,    up,    184256.765, 3,     1,    0
2017-11-30T18:56:02+0900, dp0s1,    1,    up,    184255.687, 3,     1,    0
2017-11-30T18:56:02+0900, dp0s2,    1,    up,    184253.571, 3,     1,    0
2017-11-30T18:56:02+0900, dp0s3,    1,    up,    184256.884, 3,     1,    0
date,                     if,       carr, state, age,        chngs, ping, ping
2017-11-30T18:57:12+0900, dp0bond0, 0,    down,      65.227, 2,     1,    0
2017-11-30T18:57:12+0900, dp0bond1, 1,    up,    184323.602, 1,     1,    0
2017-11-30T18:57:12+0900, dp0s0,    1,    up,    184326.811, 3,     1,    0
2017-11-30T18:57:12+0900, dp0s1,    1,    up,    184325.732, 3,     1,    0
2017-11-30T18:57:12+0900, dp0s2,    1,    up,    184323.616, 3,     1,    0
2017-11-30T18:57:12+0900, dp0s3,    1,    up,    184326.929, 3,     1,    0
date,                     if,       carr, state, age,        chngs, ping, ping
2017-11-30T18:58:22+0900, dp0bond0, 0,    down,     135.273, 2,     1,    0
2017-11-30T18:58:22+0900, dp0bond1, 1,    up,    184393.648, 1,     1,    0
2017-11-30T18:58:22+0900, dp0s0,    1,    up,    184396.857, 3,     1,    0
2017-11-30T18:58:22+0900, dp0s1,    1,    up,    184395.779, 3,     1,    0
2017-11-30T18:58:22+0900, dp0s2,    1,    up,    184393.663, 3,     1,    0
2017-11-30T18:58:22+0900, dp0s3,    1,    up,    184396.976, 3,     1,    0
```

모든 결과 해석이 그렇듯이, 측정 방법을 이해하고 이에 맞는 해석을 해야 하는데,
이 측정의 경우, 60초 간격으로 측정하기 때문에 60초 이내로 일어나는 사건은
놓치는 부분이 있을 수 있고, 시점의 정확도는 -60초 정도의 차이가 있을 수 있다.

인터페이스가 Down되는 현상을 추적하는 중이므로 가장 먼저 확인한 것은 `carr`
라고 표시된 연결 상태 부분과 `state`라고 표시된 작동상태 부분인데, 세 번째
토막을 보면 각각 `0`과 `down`으로 표시된 것을 볼 수 있다. 이 근처에서 Down이
발생하였다! 이 상태가 측정된 시간은 18:57:12인데, `age` 값이 65.227인 것을
보면 실제로 Down이 된 정확한 시간은 18:56:07인 샘이다.

그 주변에 어떤 일들이 있었는지를 살펴보면, 네 번째 토막에서 Down이 발생하기
전인 세 번째, 두 번째 토막부터 Ping Down이 발생한 것을 알 수 있다. 이 때,
Carieer나 Operation이 정상 상태였으므로, 인터페이스에 문제가 있어서 통신이
끊긴 것이 아니라, (어떤 이유에 의한 것이든) 통신이 먼저 끊긴 후에 관련된
인터페이스가 내려 앉았다는 것을 확인할 수 있다.

또한, `chngs`로 표기한 작동상태 변경 횟수 부분을 보면, 1분 간격이라서 놓친
사건은 없다는 것과 `dp0s0` 등의 물리 인터페이스의 작동상태는 여전히 영향을
받지 않고 있음을 (인터페이스 자체는 잘 동작하고 있음을) 알 수 있다.

(1분 간격으로 돌리는 스크립트인데 10초 정도의 시간차가 더 발생하는 것은,
Ping의 Timeout과 관련된 것이니 무시할 수 있다.)


이제,
시간의 흐름에 따라 "Ping 시험을 통한 실제의 통신상태 점검"과 "시스템 정보
확인을 통한 작동 상태 점검"을 통해 사건의 **선후관계에 대한 사실**을 하나
알게 되었다.


{:.point}
원인 파악
: 이렇게, 사실을 하나 하나 확인해가는 것이 바로 원인 파악의 과정이다.



## Packet Capture: X-Ray

선후관계는 알았지만, 그 안에서 무슨 일이 벌어지는지는 아직 모른다. 아~~
궁금하다. 궁금하지 않은가? 사건의 주인이라면 궁금해야 한다.

Network 문제의 대부분은 Log나 다른 자료보다는 실제로 통신이 일어나는
것을 투명하게 떠 볼 수 있는 Packet Capture에 의존하는 경우가 많다. 심지어
Application 오류도 Network을 살핌으로써 보다 쉽게 문제를 파악하고 원인을
규명해낼 수 있는 경우가 있다. 그리고... 사실 내가 Packet을 좀 좋아한다.

그래서, 위에서는 핵심 위주로 축약해서 적었지만 원래 내가 사용한 스크립트는
아래와 같은 모양이었다.


```sh
#!/bin/sh
# 
# checker.sh

ifs="dp0bond0 dp0bond1 dp0s0 dp0s1 dp0s2 dp0s3"

for d in dp0bond0 dp0s0 dp0s2; do
	tcpdump -n -i $d -G 600 -w "/home/vyatta/dumps/$d.%F_%T.pcap" &
done

while true; do
	echo "date,			  if,		carr,	state,	age,		chngs,	ping,	ping"
	/bin/ping -c 1 8.8.8.8 >/dev/null 2>&1 && p1=1 || p1=0
	/bin/ping -c 1 10.0.80.11 >/dev/null 2>&1 && p2=1 || p2=0
	for dev in $ifs; do
		echo -n "`date -Iseconds`,"
		echo -n " $dev,"
		echo -n "	`cat /sys/class/net/$dev/carrier`,"
		echo -n "	`cat /sys/class/net/$dev/operstate`,"
		echo -n "	`cat /sys/class/net/$dev/opstate_age`,"
		echo -n "	`cat /sys/class/net/$dev/opstate_changes`,"
		echo "	$p1,	$p2"
	done
	bondstate=`cat /sys/class/net/dp0bond0/operstate`
	if [ "$bondstate" = "down" ]; then
		killall tcpdump
		sleep 5
		killall -9 tcpdump
		for d in dp0bond0 dp0s0 dp0s2; do
			tcpdump -n -i $d -G 600 -w "/home/vyatta/dumps/$d.%F_%T.pcap" &
		done
		/opt/vyatta/sbin/vyatta-bonding --dev=dp0bond0 --remove=dp0s0
		/opt/vyatta/sbin/vyatta-bonding --dev=dp0bond0 --remove=dp0s2
		/opt/vyatta/sbin/vyatta-bonding --dev=dp0bond0 --add=dp0s0
		/opt/vyatta/sbin/vyatta-bonding --dev=dp0bond0 --add=dp0s2
	fi
	sleep 60
done
```

기니까, 조금 잘라서 보자. 가장 먼저 추가된 부분은 아래와 같은 부분이다.
이 설정은 주로 문제가 일어났던 `dp0bond0`와 그 하부 인터페이스를 대상으로
TCP Dump를 떠주는 명령을 실행하는 것이다. `-n` 명령을 사용하여 DNS가 말을
듣지 않는 장애상황에서도 Dump의 품질을 최상으로 유지하려고 애썼고, (만약
DNS Query를 위한 지연이 발생한다면 Dump 중 상당 부분이 누락될 수 있다.)
`-G 600` 옵션과 `-w` 옵션에 날짜 포멧을 사용하여 10분 간격으로 파일을 잘라
모았다. (나중에 열어보기 쉽도록)

```sh
for d in dp0bond0 dp0s0 dp0s2; do
	tcpdump -n -i $d -G 600 -w "/home/vyatta/dumps/$d.%F_%T.pcap" &
done
```

위의 명령을 스크립트의 시작 부분에 더하여 사용한 이후 첫번째 사건이 재현되고
보니, Dump의 크기가 수 GB에 달하는 것을 발견했다! 아뿔싸! 이걸 어떻게 열어서
보나... 그래서 아래와 같이, Down이 감지되면 구동 중이던 `tcpdump`를 모두
죽이고 새롭게 시작하도록 함으로써, 덤프 파일의 크기를 확율적으로 평균 반으로
줄일 수 있도록 구성했다. (물론, 5초 정도 놓치는 시간이 발생할 수도 있으며,
확율적으로 의미있는 데이터를 완전히 날릴 가능성도 있는 스크립트이다. :-)

```sh
	bondstate=`cat /sys/class/net/dp0bond0/operstate`
	if [ "$bondstate" = "down" ]; then
		killall tcpdump
		sleep 5
		killall -9 tcpdump
		for d in dp0bond0 dp0s0 dp0s2; do
			tcpdump -n -i $d -G 600 -w "/home/vyatta/dumps/$d.%F_%T.pcap" &
		done
		/opt/vyatta/sbin/vyatta-bonding --dev=dp0bond0 --remove=dp0s0
		/opt/vyatta/sbin/vyatta-bonding --dev=dp0bond0 --remove=dp0s2
		/opt/vyatta/sbin/vyatta-bonding --dev=dp0bond0 --add=dp0s0
		/opt/vyatta/sbin/vyatta-bonding --dev=dp0bond0 --add=dp0s2
	fi
```

`tcpdump`를 다시 띄우는 부분 뒤의 `vyatta-bonding` 명령을 사용하는 구간은,
Slave 인터페이스를 제거했다가 다시 추가하는 과정을 거치면서 해당 장치를
재설정하면 문제가 사라진다는 점에서 착안하여, 장애 상황에서 긴급 복구를 할
수 있도록 설정한 Work around이다.

응, state 확인을 보다 촘촘하게 해주고 이 WA를 적용하면 장애를 거의 사라지게
할 수 있긴 하다. 하지만 내가 원하는 것은 완전한 문제 해결, 원인 제거. :-)


아무튼, 이제 Dump도 얻었다. (Dump 분석 얘기는 나중에)


## Traffic Check: 치석 제거

이해할 수 없다! 몇 초 간의 Traffic 만으로도 수 GB의 Dump를 만들어 상황이라니!
부하의 문제였단 말인가? 장애 기본 자료를 봤을 때, 부하에 대한 얘기는 없었다.
심지어, 그럴 만한 시스템도 아니다! 이상하다!

{:.point}
이상하면 치과 가라
: 이상한 점이 있을 때 그냥 넘어가면 안된다. 불투명한 것을 없애는 과정이
  바로 문제 추적 과정이다.

필수 과정은 아닐 수 있지만, 이상한 점이 있다면 청소를 해야 한다. 최소한,
정말인지 확인은 해야 한다. 그래서 다음과 같이, 간이로 `sysstat`, `sar`를
활용하여 각 인터페이스 디바이스의 Traffic 상태를 끄집어 내서 역시 Elastic
Stack으로 구성한 중앙 로그 및 통계 모니터링 시스템으로 쐈다.

```sh
#!/bin/sh

LANG=C stdbuf -i0 -o0 sar -n DEV 60 \
	|stdbuf -i0 -o0 grep -v '^$' \
	|stdbuf -i0 -o0 sed 's/$/\n/' \
	|nc -u 203.0.113.221 7544
```

이를 통해서, 긴 얘기는 줄이고, `sysstat`을 통한 Traffic 부하 측정, 클라우드
제공자의 Metering 정보 그 어디에도 실제의 Traffic이 과도하게 흐른 정황은
없다는 것을 확인하였다.

그렇다면... 저 수 GB의 Dump는... 시스템 내부에서만 발견되는 유령 Packet 이란
말인가?!


어휴... 길다.
Dump 분석 중심의 다음 이야기는 쉬었다 간다.


### 함께 읽기

이 글은 다음 묶음글의 일부이며, 이 내용과 연결된 앞/뒤 사건은 아래 링크를
통해 확인할 수 있다.

* _Vyatta 네트워크 문제 추적 Part 1_
* [Vyatta 네트워크 문제 추적 Part 2 - LACP]
* [Vyatta 네트워크 문제 추적 Part 3 - Dump]


[Vyatta 네트워크 문제 추적 Part 1]:{% link _posts/sysadmin/2018-01-03-vyatta-network-problem-tracking.md %}
[Vyatta 네트워크 문제 추적 Part 2 - LACP]:{% link _posts/sysadmin/2018-01-03-reset-lag-on-vyatta.md %}
[Vyatta 네트워크 문제 추적 Part 3 - DUMP]:{% link _posts/sysadmin/2018-01-04-analyzing-huge-dump-with-tcpdump.md %}
