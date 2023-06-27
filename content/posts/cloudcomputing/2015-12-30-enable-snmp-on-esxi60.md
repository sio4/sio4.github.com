---
title: vSphere ESXi의 SNMP 서비스 활성화하기
tags: SNMP Net-SNMP VMware ESXi
categories: ["cloudcomputing"]
image: /attachments/20151230-snmp-000.png
date: Wed, 30 Dec 2015 13:20:15 +0900
---
이 글은 VMware vSphere ESXi Host의 원격 모니터링을 위하여 SNMP 서비스를
사용하는 과정에 대한 매우 간략한 기록이다.  이 글은 실전에서의 모니터링
상세를 다루지는 않으며, 다만, 모니터링 도구와 관계없이 그 시작을 위하여
공통으로 수행되어야 하는 ESXi Host에서 SNMP 서비스를 설정하고 활성화하는
등의 과정만을 다루고 있다. (SNMP 동작 확인을 위한 정도의 Client의 간략한
설정을 함께 포함하고 있다.)

## vSphere ESXi와 SNMP

SNMP(Simple Network Management Protocol)은 그 이름에서 유추할 수 있듯이,
**네트워크 장치의 관리를 원격으로 간단하게 처리하기 위한 프로토콜**이다.
여기서 "장치"라 함은 Router, Switch 등의 네트워크 장치를 포함하며,
"관리"는 사용량 등의 모니터링은 물론, 간단한 설정 변경 등도 포함하고 있다.

![](/attachments/20151230-snmp-000.png){:.fit}

SNMP는 위에서 언급한 바와 같이 "네트워크 장치"의 모니터링을 위한 사실상의
표준 역할을 하고 있으나, 그 활용 범위가 꼭 Switch, Router 등의 네트워크
장비에만 한정되어진 것은 아니다. 다양한 MIB(Management Information Base)를
확장하여 일반적인 서버나 서비스의 관리에도 활용되고 있으며,
**VMware 제품군 역시 원격관리/모니터링을 위한 MIB를 제공**하고 있다.

이 글에서는, 이러한 SNMP를 이용하여 Host의 관리가 가능하도록 vSphere ESXi를
구성하는 방법을 설명하고 있으며, 본론에 앞서 동작확인을 위한 SNMP Client의
설정을 간단히 다루려고 한다.

## 시험환경 구성

SNMP는 인터넷 표준 Protocol로, Protocol을 따르는 다양한 Server/Client 구현이
존재하며, Linux에서는 Net-SNMP라는 패키지를 주로 이용하고 있다.  Net-SNMP는
[http://www.net-snmp.org/](http://www.net-snmp.org/)에서 구할 수 있으며,
여기서는 간단하게 Ubuntu Linux를 기준으로 설치를 진행할 것이다.

### Ubuntu Linux에 NET-SNMP 설치하기

Ubuntu Linux에서는 다음의 명령으로 간단하게 Net-SNMP를 설치할 수 있다.

```console
$ sudo apt-get install snmp
Reading package lists... Done
Building dependency tree       
Reading state information... Done
The following extra packages will be installed:
  libperl5.18 libsensors4 libsnmp-base libsnmp30
Suggested packages:
  lm-sensors snmp-mibs-downloader
The following NEW packages will be installed:
  libperl5.18 libsensors4 libsnmp-base libsnmp30 snmp
0 upgraded, 5 newly installed, 0 to remove and 0 not upgraded.
<...>
$ 
```

설치가 되었다면, 함께 제공되는 유틸리티 중 이 글에서 SNMP 동작확인을 위해
앞으로 사용하게 될 `snmpwalk`를 한 번 돌려보자.

```console
$ snmpwalk --version
NET-SNMP version: 5.7.2
$ 
```

Ubuntu 15.04 기준으로, 5.7.2 버전의 패키지가 정상적으로 설치된 것을 확인할
수 있다.  만약, Redhat 계열의 OS를 사용한다면 `net-snmp-utils` 패키지를
설치하면 된다.



## vSphere ESXi 기본 설정

다음은 ESXi Host에서 해당 기능을 설정하고 활성화하는 과정이다. ESXi Host의
경우, 이미 필요한 모듈은 탑재한 채로 설치가 되기 때문에 별도의 패키지 설치는
필요가 없고 단지 적절한 보안 설정과 활성화 만으로 사용할 수 있는 상태로 만들
수 있다.

현재 주로 사용되고 있는 5.x, 6.x 버전의 경우, `esxcli` 명령을 통하여 설정을
진행할 수 있으며, 기존에 아무런 설정을 하지 않았다면 SNMP의 현재 설정 상태를
확인하는 `esxcli system snmp get` 명령을 내렸을 때, 아래와 같은 결과를 볼 수
있다.

(참고로, 아래의 과정은 ESXi Host의 Shell에서 수행하는 부분으로, 원격으로
설정을 진행하기 위해서는 사전에 sshd를 활성화하여야 한다. 물론, Console
앞에서 진행할 수도 있고.)

```console
# esxcli system snmp get
   Authentication: 
   Communities: 
   Enable: false
   Engineid: 00000063000000a100000000
   Hwsrc: indications
   Largestorage: true
   Loglevel: info
   Notraps: 
   Port: 161
   Privacy: 
   Remoteusers: 
   Syscontact: 
   Syslocation: 
   Targets: 
   Users: 
   V3targets: 
# 
```

먼저, 앞으로 설정을 진행하다가 다시 초기화가 필요하다면 아래와 같은 명령으로
모든 설정을 날려버릴 수 있다.

```console
# esxcli system snmp set -r
#
```

### 기본 설정

이제, 가장 기본적인 설정을 통하여 SNMP 서비스를 활성화시켜보려고 한다.
아래 예시의 맨 마지막 명령인 `-e` 옵션을 사용하여 서비스를 활성화할 수 있고,
필수는 아니지만 앞선 세 줄의 명령을 통하여 community 설정 및 매우 기본적인
정보인 location, contact를 설정하여 나중에 장비에 대한 식별이나 관리에
도움이 되게 할 수 있다.

```console
# esxcli system snmp set -c cotton
# esxcli system snmp set -L "DDC-2R27U5"
# esxcli system snmp set -C tester@example.com
# esxcli system snmp set -e yes
#
```

이상의 설정을 한 후 그 결과를 보면 아래와 같다.

```console
# esxcli system snmp get
   Authentication: 
   Communities: cotton
   Enable: true
   Engineid: 00000063000000a100000000
   Hwsrc: indications
   Largestorage: true
   Loglevel: info
   Notraps: 
   Port: 161
   Privacy: 
   Remoteusers: 
   Syscontact: tester@example.com
   Syslocation: DDC-2R27U5
   Targets: 
   Users: 
   V3targets: 
# 
```

### 동작시험 - SNMP v1

위와 같은 설정을 마쳤다면 다시 Client 쪽으로 이동하여 아래와 같은 명령을 내려
동작 상태를 확인할 수 있다. (아! 여기서 사용하는 `snmpwalk` 명령은, SNMP의
모든 정보를 단계적으로 쭉~ 긁어주는 명령이다.)

```console
$ snmpwalk -v1 -c cotton 192.168.17.228 |wc -l
2473
$ snmpwalk -v1 -c cotton 192.168.17.228 |head 
iso.3.6.1.2.1.1.1.0 = STRING: "VMware ESXi 5.5.0 build-2068190 VMware, Inc. x86_64"
iso.3.6.1.2.1.1.2.0 = OID: iso.3.6.1.4.1.6876.4.1
iso.3.6.1.2.1.1.3.0 = Timeticks: (4300) 0:00:43.00
iso.3.6.1.2.1.1.4.0 = STRING: "tester@example.com"
iso.3.6.1.2.1.1.5.0 = STRING: "exam-imsphost2"
iso.3.6.1.2.1.1.6.0 = STRING: "DDC-2R27U5"
iso.3.6.1.2.1.1.7.0 = INTEGER: 72
iso.3.6.1.2.1.1.8.0 = Timeticks: (0) 0:00:00.00
iso.3.6.1.2.1.1.9.1.2.1 = OID: iso.3.6.1.6.3.1
iso.3.6.1.2.1.1.9.1.2.2 = OID: iso.3.6.1.2.1.31
$ 
```

첫번째 명령의 결과를 통해, 총 2493개의 정보를 SNMP를 통하여 수집할 수 있음을
알 수 있으며 그 다음 명령으로 대충 어떤 내용들이 수집 가능한지 확인할 수 있다.

그 결과를 잠깐 보면, 맨 첫 줄은 ESXi의 버전 정보를 확인할 수 있는 줄이며,
중간에는 앞서 설정한 contact, location 등의 정보가 포함되어 있음을 볼 수 있다.

### 동작시험 - SNMP v2c

위의 명령에서 `-v` 옵션을 바꿔서 내린 결과는 아래와 같다. `-v` 옵션은 SNMP
버전을 지정하는 명령으로, 아래와 같이 조금 더 많은 정보가 확인 가능하다는
것을 확인할 수 있다.

```console
$ snmpwalk -v2c -c cotton 192.168.17.228 |wc -l
2628
$ 
```

SNMP는 1, 2, 3의 세 버전이 있는데, 이상의 두 예에서는 버전 1과 2를 통해서
정보 확인을 하였다. 버전 1과 2는 위와 같이 community 저정만을 통하여 별도의
인증 없이 community level에 맞는 정보를 보여주도록 설계되어 있으나
**버전 3은 이와는 달리, 별도의 인증체계를 도입**하여 기존 방식에서 발생
가능한 보안과 관련된 문제를 해결하고 있다.



## vSphere ESXi 보안 설정

ESXi 역시, 좀 더 강한 보안을 위해 SNMP v3를 지원하고 있으며, 아래와 같은
설정과정을 통하여 이것을 사용할 수 있도록 설정할 수 있다.

### SNMP v3 보안을 위한 추가 설정

앞서 얘기한 바와 같이, 버전 3에서 가장 두드러진 차이는 인증의 지원이다.
아래와 같이 인증 방식과 인증을 적용한 사용자를 설정하여 버전 3 방식으로
서비스를 할 수 있도록 설정할 수 있다.

```console
# esxcli system snmp set -E 000012290000830928
# esxcli system snmp set -a SHA1 -x AES128
# esxcli system snmp hash -r -A secret1234 -X secret5678
   Authhash: ab984c188af22dbc9c7fce313235a5a9325c162b
   Privhash: 562bdd9cd9f455dd6f5fc7e6f4a2a6219ccaa2c2
# esxcli system snmp set -u  man/ab984c188af22dbc9c7fce313235a5a9325c162b/562b
dd9cd9f455dd6f5fc7e6f4a2a6219ccaa2c2/priv
# 
```

맨 위의 줄은 각 Host의 고유 Engineid를 부여하는 과정으로, 뒤를 이어 수행될
암호 설정 과정에서 일종의 Seed로 사용되는 값이므로 꼭 Host 별로 설정을 해줄
필요가 있다. (이 값이 초기값 그대로거나 동일한 값이 되면 Hash 생성 시 그
결과가 동일하게 되어버린다.)

두 번째 명령은 인증/암호화 방식을 설정하는 과정이고, 세 번째 명령은 Plain
Text 형태의 암호를 Hash 형태로 변환해주는 역할을 한다. (명시적이기는 하나,
좀 번거롭게 느껴지기도 하고...) 마지막으로, 이렇게 생성한 Hash를 이용하여
사용자 등록을 해주는 명령이 맨 뒤의 `esxcli system snmp set -u` 명령이다.

설정된 결과를 보자.

```console
# esxcli system snmp get
   Authentication: SHA1
   Communities: cotton
   Enable: true
   Engineid: 000012290000830928
   Hwsrc: indications
   Largestorage: true
   Loglevel: info
   Notraps: 
   Port: 161
   Privacy: AES128
   Remoteusers: 
   Syscontact: tester@example.com
   Syslocation: DDC-2R27U5
   Targets: 
   Users: man/ab984c188af22dbc9c7fce313235a5a9325c162b/562bdd9cd9f455dd6f5fc7e6f4a2a6219ccaa2c2/priv
   V3targets: 
# 
```

### 동작시험 - SNMP v3

이제, 다시 Client로 돌아가서 아래와 같이 명령을 변경하여 내려본다.
버전옵션이 변경되면서 앞서 사용했던 `-c`의 community 지정을 사용하지 않으며,
대신 `-u` 옵션을 통해 사용자명을 지정하고 동시에 `-a`, `-A`, `-x`, `-X`
옵션을 사용하여 인증정보를 제공해야 한다.

```console
$ snmpwalk -v3 -u man -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228 |head
iso.3.6.1.2.1.1.1.0 = STRING: "VMware ESXi 5.5.0 build-2068190 VMware, Inc. x86_64"
iso.3.6.1.2.1.1.2.0 = OID: iso.3.6.1.4.1.6876.4.1
iso.3.6.1.2.1.1.3.0 = Timeticks: (8800) 0:01:28.00
iso.3.6.1.2.1.1.4.0 = STRING: "tester@example.com"
iso.3.6.1.2.1.1.5.0 = STRING: "exam-imsphost2"
iso.3.6.1.2.1.1.6.0 = STRING: "DDC-2R27U5"
iso.3.6.1.2.1.1.7.0 = INTEGER: 72
iso.3.6.1.2.1.1.8.0 = Timeticks: (0) 0:00:00.00
iso.3.6.1.2.1.1.9.1.2.1 = OID: iso.3.6.1.6.3.1
iso.3.6.1.2.1.1.9.1.2.2 = OID: iso.3.6.1.2.1.31
$ 
```

위의 결과는 정상적으로 설정이 되고 적절한 인증정보로 접속을 한 경우이며,
원하는 출력을 얻을 수 있다.

만약, 뭔가 잘못된 것이 있다면 아래와 같은 오류상황을 만날 수 있다.
맨 첫번째 명령은 Client에서 사용자 지정이 잘못되었거나, Host에서 사용자
생성이 정상적으로 되지 않은 경우이며, 두번째 오류는 인증정보에 오류가 있는
경우이다. 마지막 예시는 사용자 설정에 맞는 적절한 보안수준 지정이 되지 않은
경우에 발생하는 오류의 예이다.

```console
$ snmpwalk -v3 -u man -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228
snmpwalk: Unknown user name
$ snmpwalk -v3 -u man -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228
snmpwalk: Authentication failure (incorrect password, community or key)
$ snmpwalk -v3 -u mon -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228
snmpwalk: Unsupported security level
$ 
```



## MIB, 각 정보의 의미 파악하기

위의 과정이 정상적으로 끝났다면, 서버측 설정은 모두 끝난 것이며 실제의
모니터링 도구 등을 연결하여 관리를 할 수 있는 환경 설정은 모두 끝난 것이다.
앞으로 설명하는 내용은 Host의 설정 그 차제가 아니라, 그 내용에 대하여 더
살펴보는 과정을 위한 것으로, Host로부터 받아온 SNMP 데이터를 해석하여
사람이 이해할 수 있는 형태로 표시해주기 위한 내용이다.

SNMP 데이터의 각 줄은 각각 하나의 **Managed Object**를 나타낸다.
이 Object들은 모두 **고유의 OID**를 갖게 되는데, OID는 '.'로 구분된 숫자열
형태로 되어있다.  이렇게, 숫자로 표현되는 OID의 의미를 정의하고 사람이
읽을 수 있는 문자로 표현하기 위해서 MIB가 사용된다.

**MIB**는 **Management Information Base**의 약자로, OID를 범주로 묶고
그것의 형태와 의미, 값의 해석 등에 대하여 정의해놓은 일종의 Schema 데이터로
이해할 수 있다.

뭐, 대충 감이 오겠지만 상세한 내용이 궁금하다면 다음 RFC를 참고할 수 있다.

* [Structure and Identification of Management Information for TCP/IP-based Internets](https://tools.ietf.org/html/rfc1155)
* [Management Information Base for Network Management of TCP/IP-based internets](https://tools.ietf.org/html/rfc1156)
* [A Simple Network Management Protocol (SNMP)](https://tools.ietf.org/html/rfc1157)

### MIB Download

Net-SNMP의 Debian 패키지는 매우 기본적인 수준의 MIB 정보만을 포함하고
있으며, 추가 MIB는 다음과 같은 방식으로 따로 설치/확보해줘야 한다.

```console
$ sudo apt-get install snmp-mibs-downloader
Reading package lists... Done
Building dependency tree       
Reading state information... Done
The following extra packages will be installed:
  smistrip
The following NEW packages will be installed:
  smistrip snmp-mibs-downloader
0 upgraded, 2 newly installed, 0 to remove and 0 not upgraded.
Need to get 5126 kB of archives.
After this operation, 5941 kB of additional disk space will be used.
<...>
$ 
```

위와 같이, `snmp-mibs-downloader` 패키지를 설치하게 되면,
post install script에 의해 다양한 MIB들을 내려받아 시스템에 설치해주게 된다.
이 파일들이 시스템에 설치되고 나면, `snmpwalk` 등의 명령은 이 정보를
바탕으로 OID를 사람이 읽을 수 있는 형태로 변환하여 표시해주게 된다.

앗! 그런데 좀 오류가 있는 모양이다. `snmpwalk`가 MIB 데이터를 Parsing 하는
과정에서 아래와 같은 오류가 떳다.

```console
$ snmpwalk -mALL -v3 -u man -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228 >/dev/null
Unlinked OID in IPATM-IPMC-MIB: marsMIB ::= { mib-2 57 }
Undefined identifier: mib-2 near line 18 of /usr/share/mibs/ietf/IPATM-IPMC-MIB
Bad operator (INTEGER): At line 73 in /usr/share/mibs/ietf/SNMPv2-PDU
Expected "::=" (RFC5644): At line 493 in /usr/share/mibs/iana/IANA-IPPM-METRICS-REGISTRY-MIB
Expected "{" (EOF): At line 651 in /usr/share/mibs/iana/IANA-IPPM-METRICS-REGISTRY-MIB
Bad object identifier: At line 651 in /usr/share/mibs/iana/IANA-IPPM-METRICS-REGISTRY-MIB
Bad parse of OBJECT-IDENTITY: At line 651 in /usr/share/mibs/iana/IANA-IPPM-METRICS-REGISTRY-MIB
<...>
$ 
```

이 MIB Parsing은 SNMP 동작 그 자체가 아닌 보여주는 부분에 대한 것으로, 오류
여부와는 관계없이 실행은 정상적으로 된다. 어떤 문법 오류가 있는 것인지 더
확인하고 싶기도 하지만, 목적은 그것이 아니므로... 나는 그냥 문제의 MIB를
지워버렸다.

```console
$ sudo rm /usr/share/mibs/iana/IANA-IPPM-METRICS-REGISTRY-MIB
$ sudo rm /usr/share/mibs/ietf/IPATM-IPMC-MIB
$ sudo rm /usr/share/mibs/ietf/SNMPv2-PDU
$ 
```

이제, 아래와 같이 깔끔한 출력을 확인할 수 있다. 앞서 얘기한 바와 같이,
예를 들어, `iso.3.6.1.2.1.1.1.0`과 같이 숫자열로 표현되던 Object가 이제는
사람이 읽을 수 있는 `SNMPv2-MIB::sysDescr.0` 형태로 바뀐 것을 확인할 수
있다.

```console
$ snmpwalk -mALL -v3 -u man -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228 |head
SNMPv2-MIB::sysDescr.0 = STRING: VMware ESXi 5.5.0 build-2068190 VMware, Inc. x86_64
SNMPv2-MIB::sysObjectID.0 = OID: SNMPv2-SMI::enterprises.6876.4.1
DISMAN-EXPRESSION-MIB::sysUpTimeInstance = Timeticks: (1422500) 3:57:05.00
SNMPv2-MIB::sysContact.0 = STRING: tester@example.com
SNMPv2-MIB::sysName.0 = STRING: exam-imsphost2
SNMPv2-MIB::sysLocation.0 = STRING: DDC-2R27U5
SNMPv2-MIB::sysServices.0 = INTEGER: 72
SNMPv2-MIB::sysORLastChange.0 = Timeticks: (0) 0:00:00.00
SNMPv2-MIB::sysORID.1 = OID: SNMPv2-MIB::snmpMIB
SNMPv2-MIB::sysORID.2 = OID: IF-MIB::ifMIB
$ 
```

## ESXi는 어떤 정보를 얼마나 주는가?

아하! 우리의 목적에 의하면 이 부분이 궁금하지 않을 수 없다.

> 어떤 정보를 얼마나 주는가?

일단, 기본 명령을 내렸을 때, 약 2600여개의 정보를 보여주고 있다는 것을 이미
확인했었다. 추가로, 지금까지 생략해왔던 OID 인수를 추가하여 명령을 내려보면
아래와 같이 정보의 양에서 차이가 있음을 알 수 있다.  
(생략 가능한 인수인 OID를 생략하게 되면, `snmpwalk`는 `SNMPv2-SMI::mib-2`
아래의 값들을 뒤지게 되며, OID가 주어졌을 경우에는 해당 OID의 하위값을
가져오게 된다.)

```console
$ snmpwalk -mALL -v3 -u man -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228 |wc  
   2612   11351  158777
$ snmpwalk -mALL -v3 -u man -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228 .|wc
   2911   12702  178109
$ 
```

OID를 Root(`.`)로 했을 때, 약 300개의 데이터를 더 가져왔음을 알 수 있다.
뭐가 얼마나 다른 것일까? 다음 일련의 명령을 통하여 SNMP 버전 및 OID 지정에
따라 가져오는 데이터가 얼마나 달라지며, 그 데이터들은 어떤 MIB 범주에
속하는지 확인할 수 있다.

명령 상세에 앞서 결과를 먼저 보면, 다음 표와 같다.

{:.fit.styled}
| MIB			| v1	| v3	| Full-         | Full+		|
|:----------------------|------:|------:|--------------:|--------------:|
| DISMAN-EXPRESSION-MIB | 1	| 1	| 1		| 1		|
| ENTITY-MIB		| 26	| 26	| 26		| 26		|
| HOST-RESOURCES-MIB	| 1525	| 1517	| 1517		| 1517		|
| IEEE8021-BRIDGE-MIB	|	|	| **82**	| 82		|
| IEEE8021-Q-BRIDGE-MIB |	|	| **125**	| 125		|
| IEEE8023-LAG-MIB	|	|	| **23**	| 23		|
| IF-MIB		| 593	| 729	| 729		| 729		|
| IP-FORWARD-MIB	| 26	| 26	| 26		| 26		|
| IP-MIB		| 84	| 98	| 98		| **118**	|
| RFC1213-MIB		| 38	| 38	| 38		|		|
| SNMP-MPD-MIB		|	|	| **3**		| 3		|
| SNMPv2-MIB		| 86	| 86	| 86		| 86		|
| TCP-MIB		| 82	| 80	| 80		| **94**	|
| UDP-MIB		| 9	| 11	| 11		| **15**	|
| VMWARE-ENV-MIB	|	|	| **14**	| 14		|
| VMWARE-RESOURCES-MIB	|	|	| **47**	| 47		|
| VMWARE-SYSTEM-MIB	|	|	| **5**		| 5		|

### MIB 별 Object 수량

버전 3은 약 2600 개 정도의 Object에 대한 정보를 반환하며, 각 MIB 별 상세는
아래와 같다.
(1, 2버전의 경우는 동일한 방식으로 확인이 가능하며, 그 수량은 위의 표에서
확인 가능하므로 상세 명령은 생략한다.)

```console
$ snmpwalk -mALL -v3 -u man -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228 |cut -d: -f1 |sort |uniq -c
      1 DISMAN-EXPRESSION-MIB
     26 ENTITY-MIB
   1517 HOST-RESOURCES-MIB
    729 IF-MIB
     26 IP-FORWARD-MIB
     98 IP-MIB
     38 RFC1213-MIB
     86 SNMPv2-MIB
     80 TCP-MIB
     11 UDP-MIB
$ 
```

동일한 명령을 OID 인수를 줘서 수행한 경우, 2900 개 정도가 반환되어 약 300개의
추가정보가 있음을 알 수 있는데, 뭔가 MIB 정보가 없는 데이터도 있고,
`SNMPv2-SMI` 아래에 뭐가 잔뜩 들어간 것을 보면, 데이터의 의미가 잘 해석되지
않았을 것 같다.

```console
$ snmpwalk -mALL -v3 -u man -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228 . |cut -d: -f1 |sort |uniq -c
      1 DISMAN-EXPRESSION-MIB
     26 ENTITY-MIB
   1517 HOST-RESOURCES-MIB
    729 IF-MIB
     26 IP-FORWARD-MIB
     98 IP-MIB
     38 RFC1213-MIB
      3 SNMP-MPD-MIB
     86 SNMPv2-MIB
    273 SNMPv2-SMI
     80 TCP-MIB
     11 UDP-MIB
      1 iso.2.840.10006.300.43.1.1.1.1.10.13 = INTEGER
      1 iso.2.840.10006.300.43.1.1.1.1.10.14 = INTEGER
      1 iso.2.840.10006.300.43.1.1.1.1.11.13 = INTEGER
      1 iso.2.840.10006.300.43.1.1.1.1.11.14 = INTEGER
      1 iso.2.840.10006.300.43.1.1.1.1.2.13 = Hex-STRING
      1 iso.2.840.10006.300.43.1.1.1.1.2.14 = Hex-STRING
      1 iso.2.840.10006.300.43.1.1.1.1.3.13 = INTEGER
      1 iso.2.840.10006.300.43.1.1.1.1.3.14 = INTEGER
      1 iso.2.840.10006.300.43.1.1.1.1.4.13 = Hex-STRING
      1 iso.2.840.10006.300.43.1.1.1.1.4.14 = Hex-STRING
      1 iso.2.840.10006.300.43.1.1.1.1.5.13 = INTEGER
      1 iso.2.840.10006.300.43.1.1.1.1.5.14 = INTEGER
      1 iso.2.840.10006.300.43.1.1.1.1.6.13 = INTEGER
      1 iso.2.840.10006.300.43.1.1.1.1.6.14 = INTEGER
      1 iso.2.840.10006.300.43.1.1.1.1.7.13 = INTEGER
      1 iso.2.840.10006.300.43.1.1.1.1.7.14 = INTEGER
      1 iso.2.840.10006.300.43.1.1.1.1.8.13 = Hex-STRING
      1 iso.2.840.10006.300.43.1.1.1.1.8.14 = Hex-STRING
      1 iso.2.840.10006.300.43.1.1.1.1.9.13 = INTEGER
      1 iso.2.840.10006.300.43.1.1.1.1.9.14 = INTEGER
      1 iso.2.840.10006.300.43.1.1.2.1.1.13 = STRING
      1 iso.2.840.10006.300.43.1.1.2.1.1.14 = Hex-STRING
      1 iso.2.840.10006.300.43.1.3.0 = Timeticks
$ 
```

모자란 MIB 정보 확인을 위해 별도로 VMware사에서 제공하는 MIB를 설치한 후,
다시 내용을 확인해보면 아래와 같다.  결과를 보면, IEEE8021, IEEE8023 관련
내용과 VMWARE로 시작하는 MIB에 해당하는 정보가 늘었음을 볼 수 있다.

```console
$ snmpwalk -M+`pwd`/vmware-mibs -mALL -v3 -u man -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228 .|cut -d: -f1 |sort |uniq -c
      1 DISMAN-EXPRESSION-MIB
     26 ENTITY-MIB
   1517 HOST-RESOURCES-MIB
     82 IEEE8021-BRIDGE-MIB
    125 IEEE8021-Q-BRIDGE-MIB
     23 IEEE8023-LAG-MIB
    729 IF-MIB
     26 IP-FORWARD-MIB
    118 IP-MIB
      3 SNMP-MPD-MIB
     86 SNMPv2-MIB
     94 TCP-MIB
     15 UDP-MIB
     14 VMWARE-ENV-MIB
     47 VMWARE-RESOURCES-MIB
      5 VMWARE-SYSTEM-MIB
$ 
```

전체 출력은 첨부의 파일을 참고.
([20151230-snmp-output.txt](/attachments/20151230-snmp-output.txt))

위의 명령에서 `-M` 옵션을 사용하여 추가 MIB 경로를 지정할 때, 때 인수 앞에
'+' 기호를 사용하였는데, 이번에는 추가 경로의 탐색 순서를 바꾸기 위해
'-' 기호를 사용해봤다. 결과는 다음과 같으며, 일부 OID에 대해서는 MIB 해석
순서에 의해 다른 범주로 분리된 것을 확인할 수 있다. (상세 내용은 위의 표를
참고하는 편이 편하다.)

```console
$ snmpwalk -M -`pwd`/vmware-mibs -mALL -mALL -v3 -u man -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228 . |cut -d: -f1 |sort |uniq -c
      1 DISMAN-EXPRESSION-MIB
     26 ENTITY-MIB
   1517 HOST-RESOURCES-MIB
     82 IEEE8021-BRIDGE-MIB
    125 IEEE8021-Q-BRIDGE-MIB
     23 IEEE8023-LAG-MIB
    729 IF-MIB
     26 IP-FORWARD-MIB
     98 IP-MIB
     38 RFC1213-MIB
      3 SNMP-MPD-MIB
     86 SNMPv2-MIB
     80 TCP-MIB
     11 UDP-MIB
     14 VMWARE-ENV-MIB
     47 VMWARE-RESOURCES-MIB
      5 VMWARE-SYSTEM-MIB
$ 
```

해석의 차이는 IP, TCP, UDP 관련 일부 항목을 RFC1213-MIB 범주에서 처리하는지
또는 IP-MIB, TCP-MIB, UDP-MIB 범주에 넣는지 정도로, 그 차이는 아래와 같다.

```diff
--- snmp-1	2015-12-30 12:01:14.138208211 +0900
+++ snmp-2	2015-12-30 12:01:28.674337763 +0900
@@ -31,10 +31,10 @@
 SNMPv2-MIB::sysORLastChange.0 = Timeticks: (0) 0:00:00.00
 SNMPv2-MIB::sysORID.1 = OID: SNMPv2-MIB::snmpMIB
 SNMPv2-MIB::sysORID.2 = OID: IF-MIB::ifMIB
-SNMPv2-MIB::sysORID.3 = OID: RFC1213-MIB::ip
+SNMPv2-MIB::sysORID.3 = OID: IP-MIB::ip
 SNMPv2-MIB::sysORID.4 = OID: IP-FORWARD-MIB::ipForward
-SNMPv2-MIB::sysORID.5 = OID: RFC1213-MIB::udp
-SNMPv2-MIB::sysORID.6 = OID: RFC1213-MIB::tcp
+SNMPv2-MIB::sysORID.5 = OID: UDP-MIB::udp
+SNMPv2-MIB::sysORID.6 = OID: TCP-MIB::tcp
 SNMPv2-MIB::sysORID.7 = OID: ENTITY-MIB::entityMIB
 SNMPv2-MIB::sysORID.8 = OID: IEEE8021-BRIDGE-MIB::ieee8021BridgeMib
 SNMPv2-MIB::sysORID.9 = OID: IEEE8021-Q-BRIDGE-MIB::ieee8021QBridgeMib
@@ -131,7 +131,7 @@
 IF-MIB::ifType.14 = INTEGER: ieee8023adLag(161)
 IF-MIB::ifType.15 = INTEGER: propMultiplexor(54)
 IF-MIB::ifType.16 = INTEGER: propMultiplexor(54)
-IF-MIB::ifType.17 = INTEGER: 258
+IF-MIB::ifType.17 = INTEGER: vmwareVirtualNic(258)
 IF-MIB::ifMtu.1 = INTEGER: 1500
 IF-MIB::ifMtu.2 = INTEGER: 1500
 IF-MIB::ifMtu.3 = INTEGER: 1500
@@ -455,26 +455,26 @@
 IF-MIB::ifSpecific.15 = OID: SNMPv2-SMI::zeroDotZero
 IF-MIB::ifSpecific.16 = OID: SNMPv2-SMI::zeroDotZero
 IF-MIB::ifSpecific.17 = OID: SNMPv2-SMI::zeroDotZero
-RFC1213-MIB::ipForwarding.0 = INTEGER: not-forwarding(2)
-RFC1213-MIB::ipDefaultTTL.0 = INTEGER: 64
-RFC1213-MIB::ipInReceives.0 = Counter32: 38497716
-RFC1213-MIB::ipInHdrErrors.0 = Counter32: 0
-RFC1213-MIB::ipInAddrErrors.0 = Counter32: 0
-RFC1213-MIB::ipForwDatagrams.0 = Counter32: 0
-RFC1213-MIB::ipInUnknownProtos.0 = Counter32: 0
-RFC1213-MIB::ipInDiscards.0 = Counter32: 0
-RFC1213-MIB::ipInDelivers.0 = Counter32: 37749222
-RFC1213-MIB::ipOutRequests.0 = Counter32: 0
-RFC1213-MIB::ipOutDiscards.0 = Counter32: 748500
-RFC1213-MIB::ipOutNoRoutes.0 = Counter32: 0
-RFC1213-MIB::ipReasmTimeout.0 = INTEGER: 5
-RFC1213-MIB::ipReasmReqds.0 = Counter32: 0
-RFC1213-MIB::ipReasmOKs.0 = Counter32: 0
-RFC1213-MIB::ipReasmFails.0 = Counter32: 0
-RFC1213-MIB::ipFragOKs.0 = Counter32: 0
-RFC1213-MIB::ipFragFails.0 = Counter32: 0
-RFC1213-MIB::ipFragCreates.0 = Counter32: 0
-RFC1213-MIB::ipRoutingDiscards.0 = Counter32: 0
+IP-MIB::ipForwarding.0 = INTEGER: notForwarding(2)
+IP-MIB::ipDefaultTTL.0 = INTEGER: 64
+IP-MIB::ipInReceives.0 = Counter32: 38501190
+IP-MIB::ipInHdrErrors.0 = Counter32: 0
+IP-MIB::ipInAddrErrors.0 = Counter32: 0
+IP-MIB::ipForwDatagrams.0 = Counter32: 0
+IP-MIB::ipInUnknownProtos.0 = Counter32: 0
+IP-MIB::ipInDiscards.0 = Counter32: 0
+IP-MIB::ipInDelivers.0 = Counter32: 37752684
+IP-MIB::ipOutRequests.0 = Counter32: 0
+IP-MIB::ipOutDiscards.0 = Counter32: 748512
+IP-MIB::ipOutNoRoutes.0 = Counter32: 0
+IP-MIB::ipReasmTimeout.0 = INTEGER: 5 seconds
+IP-MIB::ipReasmReqds.0 = Counter32: 0
+IP-MIB::ipReasmOKs.0 = Counter32: 0
+IP-MIB::ipReasmFails.0 = Counter32: 0
+IP-MIB::ipFragOKs.0 = Counter32: 0
+IP-MIB::ipFragFails.0 = Counter32: 0
+IP-MIB::ipFragCreates.0 = Counter32: 0
+IP-MIB::ipRoutingDiscards.0 = Counter32: 0
 IP-FORWARD-MIB::ipForwardNumber.0 = Gauge32: 0
 IP-FORWARD-MIB::ipCidrRouteNumber.0 = Gauge32: 0
 IP-FORWARD-MIB::inetCidrRouteNumber.0 = Gauge32: 2
@@ -599,20 +599,20 @@
 IP-MIB::icmpStatsInErrors.ipv4 = Counter32: 0
 IP-MIB::icmpStatsOutMsgs.ipv4 = Counter32: 48879
 IP-MIB::icmpStatsOutErrors.ipv4 = Counter32: 0
-RFC1213-MIB::tcpRtoAlgorithm.0 = INTEGER: other(1)
-RFC1213-MIB::tcpRtoMin.0 = INTEGER: 0
-RFC1213-MIB::tcpRtoMax.0 = INTEGER: 0
-RFC1213-MIB::tcpMaxConn.0 = INTEGER: -1
-RFC1213-MIB::tcpActiveOpens.0 = Counter32: 320890
-RFC1213-MIB::tcpPassiveOpens.0 = Counter32: 405534
-RFC1213-MIB::tcpAttemptFails.0 = Counter32: 51
-RFC1213-MIB::tcpEstabResets.0 = Counter32: 28372
-RFC1213-MIB::tcpCurrEstab.0 = Gauge32: 28
-RFC1213-MIB::tcpInSegs.0 = Counter32: 37380254
-RFC1213-MIB::tcpOutSegs.0 = Counter32: 43032452
-RFC1213-MIB::tcpRetransSegs.0 = Counter32: 0
-RFC1213-MIB::tcpInErrs.0 = Counter32: 0
-RFC1213-MIB::tcpOutRsts.0 = Counter32: 0
+TCP-MIB::tcpRtoAlgorithm.0 = INTEGER: other(1)
+TCP-MIB::tcpRtoMin.0 = INTEGER: 0 milliseconds
+TCP-MIB::tcpRtoMax.0 = INTEGER: 0 milliseconds
+TCP-MIB::tcpMaxConn.0 = INTEGER: -1
+TCP-MIB::tcpActiveOpens.0 = Counter32: 320896
+TCP-MIB::tcpPassiveOpens.0 = Counter32: 405540
+TCP-MIB::tcpAttemptFails.0 = Counter32: 51
+TCP-MIB::tcpEstabResets.0 = Counter32: 28372
+TCP-MIB::tcpCurrEstab.0 = Gauge32: 28
+TCP-MIB::tcpInSegs.0 = Counter32: 37380820
+TCP-MIB::tcpOutSegs.0 = Counter32: 43033129
+TCP-MIB::tcpRetransSegs.0 = Counter32: 0
+TCP-MIB::tcpInErrs.0 = Counter32: 0
+TCP-MIB::tcpOutRsts.0 = Counter32: 0
 TCP-MIB::tcpConnectionState.ipv4."127.0.0.1".80.ipv4."127.0.0.1".45481 = INTEGER: established(5)
 TCP-MIB::tcpConnectionState.ipv4."127.0.0.1".8089.ipv4."127.0.0.1".25084 = INTEGER: established(5)
 TCP-MIB::tcpConnectionState.ipv4."127.0.0.1".8089.ipv4."127.0.0.1".60485 = INTEGER: established(5)
@@ -690,10 +690,10 @@
 TCP-MIB::tcpListenerProcess.ipv4."127.0.0.1".12001 = Gauge32: 34197
 TCP-MIB::tcpListenerProcess.ipv4."127.0.0.1".49152 = Gauge32: 36723
 TCP-MIB::tcpListenerProcess.ipv4."192.168.17.228".427 = Gauge32: 34281
-RFC1213-MIB::udpInDatagrams.0 = Counter32: 0
-RFC1213-MIB::udpNoPorts.0 = Counter32: 6602
-RFC1213-MIB::udpInErrors.0 = Counter32: 0
-RFC1213-MIB::udpOutDatagrams.0 = Counter32: 0
+UDP-MIB::udpInDatagrams.0 = Counter32: 0
+UDP-MIB::udpNoPorts.0 = Counter32: 6602
+UDP-MIB::udpInErrors.0 = Counter32: 0
+UDP-MIB::udpOutDatagrams.0 = Counter32: 0
 UDP-MIB::udpEndpointProcess.ipv4."0.0.0.0".0.ipv4."0.0.0.0".0.1 = Gauge32: 20800903
 UDP-MIB::udpEndpointProcess.ipv4."0.0.0.0".123.ipv4."0.0.0.0".0.1 = Gauge32: 33881
 UDP-MIB::udpEndpointProcess.ipv4."0.0.0.0".161.ipv4."0.0.0.0".0.1 = Gauge32: 20800903
@@ -2606,7 +2606,7 @@
 ENTITY-MIB::entLogicalDescr.2 = STRING: TCP/IP Stack instance: defaultTcpipStack
 ENTITY-MIB::entLogicalDescr.3 = STRING: HP Integrated Lights Out SNMP Management Agent
 ENTITY-MIB::entLogicalType.1 = OID: VMWARE-PRODUCTS-MIB::vmwVC
-ENTITY-MIB::entLogicalType.2 = OID: RFC1213-MIB::ip
+ENTITY-MIB::entLogicalType.2 = OID: IP-MIB::ip
 ENTITY-MIB::entLogicalType.3 = OID: SNMPv2-SMI::mib-2
 ENTITY-MIB::entLogicalTAddress.1 = STRING: "192.168.17.230"
 ENTITY-MIB::entLogicalTDomain.1 = OID: TRANSPORT-ADDRESS-MIB::transportDomainUdpIpv4
```


### VMware 관련 MIB/OID 상세

기본 Object 외에, 어떤 정보들이 추가된 것인지 부분적으로, 간략하게 살며보면
아래와 같다.

먼저 `IEEE8021-BRIDGE-MIB` 아래에는, 아래에서 보는 바와 같이 Bridge 관련
정보가 들어가 있다. 확인해보지 않았는데, 아마도 vSwitch와 관련된 값들이
추가된 것을 보인다.

```console
$ snmpwalk -M -`pwd`/vmware-mibs -mALL -mALL -v3 -u man -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228 . |grep ^IEEE8021-BRIDGE-MIB
IEEE8021-BRIDGE-MIB::ieee8021BridgeBaseBridgeAddress.1 = STRING: 40:a8:f0:20:e2:fe
IEEE8021-BRIDGE-MIB::ieee8021BridgeBaseBridgeAddress.2 = STRING: 40:a8:f0:20:e2:fd
IEEE8021-BRIDGE-MIB::ieee8021BridgeBaseNumPorts.1 = INTEGER: 4 ports
IEEE8021-BRIDGE-MIB::ieee8021BridgeBaseNumPorts.2 = INTEGER: 3 ports
IEEE8021-BRIDGE-MIB::ieee8021BridgeBaseComponentType.1 = INTEGER: cVlanComponent(3)
IEEE8021-BRIDGE-MIB::ieee8021BridgeBaseComponentType.2 = INTEGER: cVlanComponent(3)
IEEE8021-BRIDGE-MIB::ieee8021BridgeBaseDeviceCapabilities.1 = BITS: 01 dot1dLocalVlanCapable(7) 
IEEE8021-BRIDGE-MIB::ieee8021BridgeBaseDeviceCapabilities.2 = BITS: 01 dot1dLocalVlanCapable(7) 
<...>
```

다음은 `VMWARE-ENV-MIB` 관련 내용인데, 아래와 같은 내용들이 들어있다.

```console
$ snmpwalk -M -`pwd`/vmware-mibs -mALL -mALL -v3 -u man -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228 . |grep VMWARE-ENV-MIB
SNMPv2-MIB::sysORID.17 = OID: VMWARE-ENV-MIB::vmwEnv
SNMPv2-MIB::sysORDescr.17 = STRING: VMWARE-ENV-MIB, REVISION 201005120000Z
VMWARE-ENV-MIB::vmwEnvNumber.0 = INTEGER: 0
VMWARE-ENV-MIB::vmwEnvLastChange.0 = Timeticks: (0) 0:00:00.00
VMWARE-ENV-MIB::vmwEnvSource.0 = INTEGER: indications(3)
VMWARE-ENV-MIB::vmwEnvInIndications.0 = Counter32: 58
VMWARE-ENV-MIB::vmwEnvLastIn.0 = Timeticks: (710280666) 82 days, 5:00:06.66
VMWARE-ENV-MIB::vmwEnvOutNotifications.0 = Counter32: 57
VMWARE-ENV-MIB::vmwEnvInErrs.0 = Counter32: 0
VMWARE-ENV-MIB::vmwEnvIndOidErrs.0 = Counter32: 0
VMWARE-ENV-MIB::vmwEnvCvtValueErrs.0 = Counter32: 0
VMWARE-ENV-MIB::vmwEnvCvtSyntaxErrs.0 = Counter32: 0
VMWARE-ENV-MIB::vmwEnvCvtOidErrs.0 = Counter32: 0
VMWARE-ENV-MIB::vmwEnvGetClassErrs.0 = Counter32: 0
VMWARE-ENV-MIB::vmwEnvPropertySkips.0 = Counter32: 754
VMWARE-ENV-MIB::vmwEnvIndicationSkips.0 = Counter32: 0
$ 
```

역시 VMware사의 부가 정보인 `VMWARE-RESOURCES-MIB`를 보면 아래와 같다.
OID 이름으로 보아 얼추 짐작할 수 있는 내용인데, CPU, Memory 등에 대한
리소스 사용정보와 스토리지 관련 Device 정보를 담고 있다.

```console
$ snmpwalk -M -`pwd`/vmware-mibs -mALL -mALL -v3 -u man -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228 . |grep ^VMWARE-RESOURCES-MIB
VMWARE-RESOURCES-MIB::vmwNumCPUs.0 = Gauge32: 2
VMWARE-RESOURCES-MIB::vmwMemSize.0 = Gauge32: 201290964 kilobytes
VMWARE-RESOURCES-MIB::vmwMemCOS.0 = Gauge32: 0 kilobytes
VMWARE-RESOURCES-MIB::vmwMemAvail.0 = Gauge32: 201290964 kilobytes
VMWARE-RESOURCES-MIB::vmwHostBusAdapterNumber.0 = INTEGER: 7
VMWARE-RESOURCES-MIB::vmwHbaDeviceName.1 = STRING: vmhba0
VMWARE-RESOURCES-MIB::vmwHbaDeviceName.2 = STRING: vmhba1
VMWARE-RESOURCES-MIB::vmwHbaDeviceName.3 = STRING: vmhba2
VMWARE-RESOURCES-MIB::vmwHbaDeviceName.4 = STRING: vmhba3
VMWARE-RESOURCES-MIB::vmwHbaDeviceName.5 = STRING: vmhba4
VMWARE-RESOURCES-MIB::vmwHbaDeviceName.6 = STRING: vmhba5
VMWARE-RESOURCES-MIB::vmwHbaDeviceName.7 = STRING: vmhba32
VMWARE-RESOURCES-MIB::vmwHbaBusNumber.1 = INTEGER: 2
VMWARE-RESOURCES-MIB::vmwHbaBusNumber.2 = INTEGER: 0
VMWARE-RESOURCES-MIB::vmwHbaBusNumber.3 = INTEGER: 7
VMWARE-RESOURCES-MIB::vmwHbaBusNumber.4 = INTEGER: 7
VMWARE-RESOURCES-MIB::vmwHbaBusNumber.5 = INTEGER: 36
VMWARE-RESOURCES-MIB::vmwHbaBusNumber.6 = INTEGER: 36
VMWARE-RESOURCES-MIB::vmwHbaBusNumber.7 = INTEGER: 0
VMWARE-RESOURCES-MIB::vmwHbaStatus.1 = INTEGER: unknown(1)
VMWARE-RESOURCES-MIB::vmwHbaStatus.2 = INTEGER: unknown(1)
VMWARE-RESOURCES-MIB::vmwHbaStatus.3 = INTEGER: unknown(1)
VMWARE-RESOURCES-MIB::vmwHbaStatus.4 = INTEGER: unknown(1)
VMWARE-RESOURCES-MIB::vmwHbaStatus.5 = INTEGER: unknown(1)
VMWARE-RESOURCES-MIB::vmwHbaStatus.6 = INTEGER: unknown(1)
VMWARE-RESOURCES-MIB::vmwHbaStatus.7 = INTEGER: unknown(1)
VMWARE-RESOURCES-MIB::vmwHbaModelName.1 = STRING: Hewlett-Packard Company Smart Array P420i
VMWARE-RESOURCES-MIB::vmwHbaModelName.2 = STRING: Intel Corporation C600/X79 series chipset 4-Port SATA IDE Controller
VMWARE-RESOURCES-MIB::vmwHbaModelName.3 = STRING: QLogic Corp. ISP2532-based 8Gb Fibre Channel to PCI Express HBA
VMWARE-RESOURCES-MIB::vmwHbaModelName.4 = STRING: QLogic Corp. ISP2532-based 8Gb Fibre Channel to PCI Express HBA
VMWARE-RESOURCES-MIB::vmwHbaModelName.5 = STRING: QLogic Corp. ISP2532-based 8Gb Fibre Channel to PCI Express HBA
VMWARE-RESOURCES-MIB::vmwHbaModelName.6 = STRING: QLogic Corp. ISP2532-based 8Gb Fibre Channel to PCI Express HBA
VMWARE-RESOURCES-MIB::vmwHbaModelName.7 = STRING: Intel Corporation C600/X79 series chipset 4-Port SATA IDE Controller
VMWARE-RESOURCES-MIB::vmwHbaDriverName.1 = STRING: hpsa
VMWARE-RESOURCES-MIB::vmwHbaDriverName.2 = STRING: ata_piix
VMWARE-RESOURCES-MIB::vmwHbaDriverName.3 = STRING: qlnativefc
VMWARE-RESOURCES-MIB::vmwHbaDriverName.4 = STRING: qlnativefc
VMWARE-RESOURCES-MIB::vmwHbaDriverName.5 = STRING: qlnativefc
VMWARE-RESOURCES-MIB::vmwHbaDriverName.6 = STRING: qlnativefc
VMWARE-RESOURCES-MIB::vmwHbaDriverName.7 = STRING: ata_piix
VMWARE-RESOURCES-MIB::vmwHbaPci.1 = STRING: 0:2:0.0
VMWARE-RESOURCES-MIB::vmwHbaPci.2 = STRING: 0:0:31.2
VMWARE-RESOURCES-MIB::vmwHbaPci.3 = STRING: 0:7:0.0
VMWARE-RESOURCES-MIB::vmwHbaPci.4 = STRING: 0:7:0.1
VMWARE-RESOURCES-MIB::vmwHbaPci.5 = STRING: 0:36:0.0
VMWARE-RESOURCES-MIB::vmwHbaPci.6 = STRING: 0:36:0.1
VMWARE-RESOURCES-MIB::vmwHbaPci.7 = STRING: 0:0:31.2
$ 
```

마지막으로, `VMWARE-SYSTEM-MIB`를 보니, 아래와 같이 버전 등과 관련된
정보를 담고 있음을 볼 수 있다.

```console
$ snmpwalk -M -`pwd`/vmware-mibs -mALL -mALL -v3 -u man -l AuthPriv -a SHA -A secret1234 -x AES -X secret5678 192.168.17.228 . |grep ^VMWARE-SYSTEM-MIB
VMWARE-SYSTEM-MIB::vmwProdName.0 = STRING: VMware ESXi
VMWARE-SYSTEM-MIB::vmwProdVersion.0 = STRING: 5.5.0
VMWARE-SYSTEM-MIB::vmwProdBuild.0 = STRING: 2068190
VMWARE-SYSTEM-MIB::vmwProdUpdate.0 = STRING: 2
VMWARE-SYSTEM-MIB::vmwProdPatch.0 = STRING: 33
$ 
```

이상으로, vSphere ESXi의 SNMP 기능을 활성화하는 방법과 그것을 시험하는
과정에 대한 정리를 마친다. 언제 기회가 되면,

1. SNMPTraf을 이용하여 좀 더 효과적으로 모니터링 환경을 구성하는 방법
1. 그리고 그것을 이용하여 Alert 처리를 하는 방법

에 대해서도 알아볼까 한다. 그 전에 VMware의 시다가 저물지 않는다면...



## References

### VMware MIB

참고로, VMware사의 MIB 파일은 VMware로부터 Download가 가능하다.
([Google Search](https://www.google.co.kr/search?q=vmware+mib)로 간단하게
최신 버전을 찾을 수 있으므로 Link는 생략한다.)
Zip 형태로 배포되는 파일을 풀었을 때, 아래와 같은 내용을 담고 있다.

```console
$ ls vmware-mibs/
BRIDGE-MIB.mib                       SNMPv2-CONF.mib
ENTITY-MIB.mib                       SNMPv2-MIB.mib
HOST-RESOURCES-MIB.mib               SNMPv2-SMI.mib
HOST-RESOURCES-TYPES.mib             SNMPv2-TC.mib
IANA-ADDRESS-FAMILY-NUMBERS-MIB.mib  TCP-MIB.mib
IANA-RTPROTO-MIB.mib                 TOKEN-RING-RMON-MIB.mib
IANAifType-MIB.mib                   UDP-MIB.mib
IEEE8021-BRIDGE-MIB.mib              VMWARE-CIMOM-MIB.mib
IEEE8021-Q-BRIDGE-MIB.mib            VMWARE-ENV-MIB.mib
IEEE8021-TC-MIB.mib                  VMWARE-ESX-AGENTCAP-MIB.mib
IEEE8023-LAG-MIB.mib                 VMWARE-OBSOLETE-MIB.mib
IF-MIB.mib                           VMWARE-PRODUCTS-MIB.mib
INET-ADDRESS-MIB.mib                 VMWARE-RESOURCES-MIB.mib
IP-FORWARD-MIB.mib                   VMWARE-ROOT-MIB.mib
IP-MIB.mib                           VMWARE-SRM-EVENT-MIB.mib
LLDP-V2-MIB.mib                      VMWARE-SYSTEM-MIB.mib
LLDP-V2-TC-MIB.mib                   VMWARE-TC-MIB.mib
P-BRIDGE-MIB.mib                     VMWARE-VA-AGENTCAP-MIB.mib
Q-BRIDGE-MIB.mib                     VMWARE-VC-EVENT-MIB.mib
README                               VMWARE-VCOPS-EVENT-MIB.mib
RMON-MIB.mib                         VMWARE-VMINFO-MIB.mib
RMON2-MIB.mib                        list-ids-diagnostics.txt
SNMP-FRAMEWORK-MIB.mib               notifications.txt
SNMP-MPD-MIB.mib
$ 
```

### ESXi의 SNMP 설정 전체 옵션

`esxcli system snmp set` 명령의 전체 옵션은 아래와 같다.

```console
# esxcli system snmp set --help
Usage: esxcli system snmp set [cmd options]

Description: 
  set                   This command allows the user to set up ESX SNMP agent.

Cmd options:
  -a|--authentication=<str>
                        Set default authentication protocol. Values: none,
                        MD5, SHA1
  -c|--communities=<str>
                        Set up to ten communities each no more than 64
                        characters. Format is: community1[,community2,...]
                        (this overwrites previous settings)
  -e|--enable           Start or stop SNMP service. Values: [yes|no,
                        true|false, 0|1]
  -E|--engineid=<str>   Set SNMPv3 engine id. Must be at least 10 to 32
                        hexadecimal characters. 0x or 0X is stripped if found
                        as well as colons (:)
  -y|--hwsrc=<str>      Where to source hardware events from IPMI sensors or
                        CIM Indications. One of: indications|sensors
  -s|--largestorage     Support large storage for hrStorageAllocationUnits *
                        hrStorageSize. Values: [yes|no, true|false, 0|1].
                        Control how the agent reports
                        hrStorageAllocationUnits, hrStorageSize and
                        hrStorageUsed in hrStorageTable. Setting this
                        directive to 1 to support large storage with small
                        allocation units, the agent re-calculates these values
                        so they all fit Integer32 and hrStorageAllocationUnits
                        * hrStorageSize gives real size of the storage ( Note:
                        hrStorageAllocationUnits will not be real allocation
                        units if real hrStorageSize won't fit into Integer32
                        ). Setting this directive to 0 turns off this
                        calculation and the agent reports real
                        hrStorageAllocationUnits, but it might report wrong
                        hrStorageSize for large storage because the value
                        won't fit into Integer32.
  -l|--loglevel=<str>   System Agent syslog logging level:
                        debug|info|warning|error
  -n|--notraps=<str>    Comma separated list of trap oids for traps not to be
                        sent by agent. Use value 'reset' to clear setting
  -p|--port=<long>      Set UDP port to poll snmp agent on. The default is
                        udp/161
  -x|--privacy=<str>    Set default privacy protocol. Values: none, AES128
  -R|--remote-users=<str>
                        Set up to five inform user ids. Format is: user/auth-
                        proto/-|auth-hash/priv-proto/-|priv-hash/engine-
                        id[,...] Where user is 32 chars max. auth-proto is
                        none|MD5|SHA1, priv-proto is none|AES. '-' indicates
                        no hash. engine-id is hex string '0x0-9a-f' up to 32
                        chars max.
  -r|--reset            Return agent configuration to factory defaults
  -C|--syscontact=<str> System contact string as presented in sysContact.0. Up
                        to 255 characters
  -L|--syslocation=<str>
                        System location string as presented in sysLocation.0.
                        Up to 255 characters.
  -t|--targets=<str>    Set up to three targets to send SNMPv1 traps to.
                        Format is: ip-or-hostname[@port]/community[,...] The
                        default port is udp/162. (this overwrites previous
                        settings)
  -u|--users=<str>      Set up to five local users. Format is: user/-|auth-
                        hash/-|priv-hash/model[,...] Where user is 32 chars
                        max. '-' indicates no hash. Model is one of
                        (none|auth|priv).
  -i|--v3targets=<str>  Set up to three SNMPv3 notification targets. Format
                        is: ip-or-hostname[@port]/remote-user/security-
                        level/trap|inform[,...].
# 
```

