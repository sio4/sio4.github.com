---
title: "Howto: PXE Master 구성하기"
tags: howto PXE automation cloud-computing
categories: ["tips-and-tricks"]
date: 2015-09-15 09:27:20+09:00
---
PXE는 Preboot Execution Environment를 줄인 용어로, 서버 등의 IT 장비가
"본격적으로 부팅하기 전에 미리 실행되는 환경"이라고 풀이할 수 있다. 이
글은, 이런 PXE 부팅을 위한 Master 환경을 구성하는 과정의 이야기이다.

요즘 OpenStack을 이용한 Cloud Computing 환경을 구성하는 일을 진행하고
있는데, 신규 Hardware에 OS Image를 설치하는 과정에서 PXE를 사용한다고
한다. 그 준비과정을 함께하고 있는 파트너사의 엔지니어가 우리가 보유한
장비 중 일부가 PXE의 동작이 정상적이지 않다는 믿기 어려운 주장했다.

으응? 그래서 이를 직접 검증하기 위하여 오래된 기억과 인터넷을 더듬어,
기능검증을 위한 환경을 만들여야 했다. 결론은, 모든 장비가 정상이었다.
(이 파트너, 계속 믿어도 되는 걸까?)

이 글은, 함께 일하는 동료와 (기억이 희미해진) 미래의 나, 그리고 이와
유사한 작업을 하고자 하는 사람들에게 도움이 될까 하는 마음으로 작성한
Mini Howto 이다.


## PXE, Preboot Execution Environment

PXE란 Preboot Execution Environment의 약자라고 앞서 이야기하였다. 우리
말로는 "**부팅 전 실행 환경**"이라고 할 수 있는데, 여기서 "부팅 전"이
뭐야? PXE의 이해는 바로 여기, **부팅 전**에서부터 시작하면 될 것 같다.

다음 얘기는 x86 서버를 기준으로 한 얘기이긴 하지만, 개념적으로 중대형
서버나 소형 가전(Embedded 장치) 역시 유사한 부팅 흐름을 갖게 되는데,
그 과정은 다음과 같다.

{:.fit.styled}
| 단계             | 내용                                          |
|------------------|-----------------------------------------------|
| 1) Hardware 단계 | 내장 Firmware에 의해 Hardware Chip/Card가 초기화되는 단계 |
| 2) 부트로더 단계 | "Hardware 단계" 이후에 "OS 단계"를 준비하는 단계 |
| 3) OS 단계       | 실제로 서버를 운용할 운영체계(OS) 단계 |

PC의 경우, Hardware 단계는 BIOS라고 부르는 작은 Chip에 내장된 Program에
의해 첫 번째 단계가 진행된다. 이 과정에서 PC는, System에 장착된 CPU,
Memory, PCI Card 등의 연결상태를 점검하는 등의 POST(Power-On Self-Test)
단계를 거치며, 그 이후에는 다음 단계를 진행할 Boot loader에게 제어를
넘기게 된다.

Boot loader는 자신이 설정된 상태에 따라 필요한 동작을 하게 되는데, 이
과정에서는, Boot loader라는 이름에서 말해주듯이, 자신 다음으로 제어를
넘겨 받을 OS의 이미지나 Kernel을 찾아 그것을 메모리에 올려 실행 가능한
상태로 만드는 일이 핵심이다.

마지막으로, Boot loader에 의해 커널이 메모리에 적제되고 실행되면, OS
단계에 도달한 것으로 볼 수 있으며, 이제 그 Hardware는 더이상 단순한 Box가
아닌 Server(일을 할 수 있는 녀석)가 되는 것이다.

좀 설명이 단순화되었는데, 이 과정에서 이 글의 주제와 관련된 녀석은 바로
두 번째 단계인 Boot loader이다. PXE는, NIC(Network Interface Card, 흔한
말로는 LAN Card) 안에 살고 있는, 일종의 Network 기반 Boot loader이다.


### Boot Order와 Boot Loader

위의 부팅 흐름 중, Hardware/Box에 종속적일 수 밖에 없는 Hardware 단계는
System의 Firmware(또는 BIOS)를 업그레이드하지 않는 이상, 항상 같은 일을
하게 된다. 그래서 이것은 Hardware의 일부로 볼 수 있으며, 그 만큼 딱딱한
영역이 된다. ("Hardware 생산 이후에는 변경되지 않는 부분"으로 이해할 수
있다.)

이와는 대조적으로, Hardware를 설계할 때 딱딱하게 고정해버리지 않고 사용
환경에 따라 적절하게 OS의 부팅 방식을 적용할 수 있도록 하기 위해서, 이
딱딱한 과정의 맨 끝을 단일 경로가 아닌 갈림길로 만들어 두었다. 이것이
바로 "Boot Order", "부팅 순서"이다. 엄밀한 의미에서, 이 Boot Order는,
"**Hardware 단계 다음으로 실행될 Boot Loader 단계를 어디에서 시작할
것인지**"를 지정하는 것이며, 그 선택 중 하나가 바로 NIC, 즉 네트워크
장치를 통한 PXE 부팅이다.

PXE 뿐만 아니라 다른 것을 Boot Order로 선택하더라도, 그 선택의 결과는
그 미디어 종류에 맞는 Boot Loader를 Memory에 적제하고 제어를 넘기는
것으로 끝이 난다. 그 이후에는 Boot Loader의 천하가 된다.


### Network Boot Loader, PXE

PXE의 "P"가 "Preboot"라는 얘기를 하다가 얘기가 길어졌는데, 여기서 말하는
"boot"는 OS의 부팅을 말하는 것이다. 나름 수위를 조절하여 이해가 필요한
정도의 설명을 하려다 보니 오히려 복잡한 얘기를 한 것 같은데, 다음과 같이
'급' 정리하고 PXE의 동작으로 넘어가려고 한다.

> System의 부팅은 Hardware에 종속적인 Hardware 단계와 OS 단계로 나눌 수
> 있는데, 이 사이의 부드러운 연결을 위해 Boot loader 단계가 추가로 존재한다.
> 다양한 부트로더 중, Network을 이용한 Booting을 지원하기 위한 기술이 바로
> PXE이며, 이것은 일종의 Boot Loader로 이해할 수 있다.

PXE는 일종의 Boot Loader로, NIC 안에 살고 있다. 반복되는 얘기인데, 모든
Boot Loader의 핵심 임무는 단 하나이다. 바로, "**실제로 이 서버의 주인이
될 OS의 Kernel을 찾아 읽어서 Memory에 올려주는 일**"이 그것이다.

PXE는 어떤가? PXE는 이와 같은 관점에서, 다음과 같은 일을 수행하는 기능,
또는 기술이다.

1. (당연히) 다음 차례가 될 OS의 커널을 Memory에 올릴 수 있다.
1. Network를 통하여 Memory에 올릴 커널을 내려받을 수 있다.
1. Network에서 내려받을 커널의 위치 정보를 얻을 수 있다.
1. 이러한 Network 통신을 위해, 자신의 네트워크 환경을 설정할 수 있다.

참고로, 위에서 "커널"이라고 표기한 부분은 꼭 커널일 필요는 없다. 커널일
수도 있고, 다음 단계를 보다 세밀하게 처리하기 위한 또다른 Boot loader일
수도 있다. (오히려, 현실세계에서는 유연성을 위해 Boot loader인 경우가
더 많을 것 같다.)


### PXE의 동작 흐름

앞서 말한, PXE Boot loader가 해야하는 일을 뒤집으면 바로 PXE의 업무
흐름이 된다. 다음 그림을 보면 쉽게 이해할 수 있을 것 같다.

```
Server-->PXE Master: 1) PXE 마스터 있어요? 나 11:22:33:11:22:22 인데...
PXE Master->Server: 2) 나다. 넌 192.168.0.10 번 쓰고, pxelinux 파일로 부팅해
Server->PXE Master:  3) 써 예써! 그럼 pxelinux 파일 주세요
PXE Master->Server: 4) 받아랏!!!
Server->>Server: 5) 메모리 적제, 제어 전환
```
{:.diagram.tac.fit}

먼저, PXE로 부팅하려는 Server은 아직 IP 주소도 가지고 있지 않고, 부팅을
도와줄 Master가 근처에 있는지 조차 알지 못한다. 그래서 맨 첫 단계는 그저
"허공에 외치기"(Broadcase)로 시작한다. (1번 단계)[^1]

[^1]: 이 단계의 통신이 Broadcasting에 의존하기 때문에, 동일 Broadcast
      구간 내에는 단 하나의 DHCP/PXE 서버만 존재해야 한다. 그렇지 않으면
      다중 응답으로 인하여 원하지 않은 결과가 나타날 수 있다.

PXE 마스터는 Broadcast된 연락을 받고, 상대방에게 앞으로 사용하게 될 IP
주소를 부여한다. 이 때, 부여되는 주소는 Pool에서 하나를 뽑아서 동적으로
할당되는 것일 수도 있고, 설정하기 나름으로 미리 MAC 주소와 쌍으로 정한
고정 IP 주소일 수도 있다. (2번 단계)

여기까지는 DHCP와 같은 동작이며, PXE 환경에서는 추가 정보가 함께 넘어가게
된다. 이것은 다음 단계로 진행하기 위한 Kernel 또는 2차 Bootloader를 찾을
수 있도록 파일 정보를 주는 것이다.(위의 예에서 pxelinux)

2번 단계를 거치면서 자신의 IP 주소를 설정한 Server는, 네트워크를 통하여
부팅용 파일을 내려받게 된다. (3,4번 단계)

이 단위 과정에서 사용되는 기술과 내용을 다시 정리하면 다음과 같다.

{:.fit.styled}
| 단계     | 내용                                             |
|----------|--------------------------------------------------|
| 1,2 단계 | DHCP[^2]를 통한 IP 주소 설정 및 정보 획득        |
| 3,4 단계 | TFTP[^3]를 이용한 이미지 Download 및 메모리 적제 |
| 5 단계   | 적제한 메모리 영역에 제어를 넘겨 Booting 시작    |

[^2]: DHCP: Dynamic Host Configuration Protocol
[^3]: TFTP: Trivial File Tranfer Protocol

사실, 1,2단계는 간단하게 쓰다보니 짧게 정리했지만, 실제로는 다음 단계를
통하여 완료된다.

1. DHCP Discover - DHCP 서버가 있는지 찾는 단계
1. DHCP Offer - DHCP 서버가 자신의 존재와 사용 가능한 IP를 소개하는 단계
1. DHCP Request - DHCP 서버에게 주소 사용을 요청하는 단계
1. DHCP Ack - DHCP 서버가 주소 사용을 허용하는 단계 


### 심화학습

휴~ 쓸데없이 길었다. 그럼에도 불구하고 더 자세한 이야기가 필요하다면 다음
글들이 도움이 될것이다.

* [Booting](https://en.wikipedia.org/wiki/Booting)
* [Power-on Self-test](https://en.wikipedia.org/wiki/Power-on_self-test)
* [Bootstrap Protocol](https://en.wikipedia.org/wiki/Bootstrap_Protocol)
* [Remote IPL](https://en.wikipedia.org/wiki/Remote_Initial_Program_Load)
* [PXE](https://en.wikipedia.org/wiki/Preboot_Execution_Environment)
* [PXE Specification](http://download.intel.com/design/archives/wfm/downloads/pxespec.pdf)


## PXE Master 서버 꾸미기(Ubuntu 기준)

잡설이 길었다. 이제 실제로 서버를 꾸미는 과정인데 필요한 패키지의 설치,
환경 설정, 시험 순으로 진행한다.

### 설치: isc-dhcp-server, tftpd-hpa, pxelinux

오픈소스 세계가 늘 그렇듯이, 동일한 기능을 수행하는 다양한 소프트웨어가
있으며, 사용자는 자신의 용도를 고려하여 적당한 것을 골라 설치할 수 있다.
근래에는, Embedded 개발환경이나 VM에게 IP를 할당하는 가상환경 관리 등을
위하여 **TFTP 및 PXE 기능을 포함한 DHCP 서버와 DNS Forwarder 등이 결합된
[Dnsmasq](http://www.thekelleys.org.uk/dnsmasq/doc.html)**가 많이
사용되고 있다.

이 글에서는 보다 일반적인 방식으로 각각의 기능을 제공하는 패키지를 따로
설치하는 방식으로 설명한다.

설치할 첫번째 패키지는 위의 흐름단계 중 1,2 단계를 맡게 될 DHCP 서버의
설치인데 Ubuntu에서는 `isc-dhcp-server` 라는 이름의 패키지를 사용할 수
있다. (Internet Software Consortium에서 제공하는 서버이다.)

```console
$ sudo apt-get install isc-dhcp-server
<...>
다음 새 패키지를 설치할 것입니다:
  isc-dhcp-server
0개 업그레이드, 1개 새로 설치, 0개 제거 및 3개 업그레이드 안 함.
363 k바이트 아카이브를 받아야 합니다.
<...>
$ 
```

다음에 설치할 패키지는 TFTP 서비스를 제공할 녀석으로 이건 BSD의 TFTP를
개선한 `tftpd-hpa` 버전을 설치한다.

```console
$ sudo apt-get install tftpd-hpa
<...>
다음 새 패키지를 설치할 것입니다:
  tftpd-hpa
0개 업그레이드, 1개 새로 설치, 0개 제거 및 3개 업그레이드 안 함.
40.1 k바이트 아카이브를 받아야 합니다.
이 작업 후 146 k바이트의 디스크 공간을 더 사용하게 됩니다.
<...>
$ 
```

마지막 패키지는 대상 서버에게 제공할 Booting Image를 담은 `pxelinux`
라는 이름의 패키지인데, 만약 실제로 꾸미려는 환경이 Diskless 네트워크
부팅 환경이거나 네트워크 설치 등을 사용하기 위한 것이라면, 이 패키지를
사용할 수도 있고, 준비된 다른 방식(예를 들어 이미 만들어둔 커널과 루트
파일시스템이 결합된 Booting Image의 활용)을 사용하는 것도 가능하다.
(나의 목적은 단순히 PXE 부팅의 시험이므로 이 패키지가 제공하는 Image를
그냥 쓸 것이다.)

```console
$ sudo apt-get install pxelinux
<...>
다음 새 패키지를 설치할 것입니다:
  pxelinux syslinux-common
0개 업그레이드, 2개 새로 설치, 0개 제거 및 3개 업그레이드 안 함.
1,367 k바이트 아카이브를 받아야 합니다.
이 작업 후 3,925 k바이트의 디스크 공간을 더 사용하게 됩니다.
<...>
$
```

이제 필요한 패키지의 설치를 마쳤다.


### 설정 - DHCP

먼저, DHCP 서버의 설정이다. DHCP 서버의 설정은 두 단계로 나뉘는데, 그
중 하나는 **이것을 통하여 구성하게 될 망정보 등을 설정**하는 것이고,
다른 하나는 이 서비스를 **어떤 망을 통하여 서비스할지를 결정**하는
것이다.

`isc-dhcp-server` 패키지의 설정파일은 `/etc/dhcp/dhcpd.conf`에 있으며,
첫번째 단계는 이 파일을 열어 필요한 설정을 기술하면 된다. 이 글에서는
아래와 같이, 이미 존재하는 (주석 처리된 예제 등을 담고 있는) 설정파일
뒤에 내 용도에 맞는 `subnet` 설정을 추가하는 방식을 사용했다.

```console
$ cat |sudo tee -a /etc/dhcp/dhcpd.conf <<EOF
> 
> subnet 192.168.14.0 netmask 255.255.255.0 {
>         range 192.168.14.10 192.168.14.20;
>         filename "pxelinux.0";
> }
> EOF
$
```

설정의 내용을 읽어보면,

1. `subnet`: 192.168.14.0/24 망에 대하여,
1. `range`: 10~20까지의 주소 대역을 Lease 대역으로 쓸 것이며,
1. `filename`: 부팅 파일로 "`pxelinux.0`" 파일을 쓰겠다.

고 설정하고 있다.

다음은, 이 서비스를 어떤 NIC Port를 통하여(= 어떤 망에) 제공할 것인지
설정하는 단계인데, 이것은 구동 설정과 관련이 있다. 이 글에서 바탕으로
하는 Ubuntu와 같이, Debian 계열의 배포본에서는 대부분의 서비스의 구동
설정이 `/etc/default` 아래에 모여 있는데, `isc-dhcp-server`의 설정은
`/etc/default/isc-dhcp-server` 파일에 담겨 있다. 아래의 명령을 통하여,
이 서비스가 Listen할 Port를 변경해준다.

```console
$ sudo sed -i 's/^INTERFACES=.*/INTERFACES="p2p2"/' /etc/default/isc-dhcp-server
$ sudo service isc-dhcp-server restart
```

참고로, 설치 후 기본 설정은 `INTERFACES` 값이 비어있으며, 결과적으로
서비스가 비활성 상태로 남아있게 된다. (대부분의 다른 서비스와는 달리,
DHCP는 잘못 사용했을 때 그 결과가 망 전체의 혼란으로 이어질 수 있으니
일종의 안전장치라고 할 수 있다.)

이제 DHCP 서버의 설정은 다 되었다.


### 설정 - TFTP

TFTP의 설정 역시, DHCP 설정과 동일하게 서비스 내용 설정과 구동 설정의
두 단계로 나누어 진행한다. 먼저, TFTP가 서비스할 파일을 준비해야 한다.
이 글에서는 앞서 말한 것처럼 단순한 PXE 기능의 시험이 목적이므로 사용
목적에 따라 달라지는 복잡한 디렉터리/파일 구성은 생략하고 단순히
**미리 설치해둔 `pxelinux` 패키지에서 제공하는 파일을 TFTP의 서비스
Root인 `/var/lib/tftpboot/`에 복사**하는 것으로 이 단계를 대신한다.

```console
$ sudo cp /usr/lib/PXELINUX/pxelinux.0 /var/lib/tftpboot/
```

다음은 서비스 구성을 위한 설정인데, Ubuntu `tftpd-hpa` 패키지의 기본
설정은 TFTP 서비스를 제공하는 주소를 기본적으로 `[::]:69`로 설정해둔
상태였다. 나는 IPv4 서비스가 필요하므로, 아래와 같이 `TFTP_ADDRESS`
값을 변경하여 그 설정을 바꿨다. (역시, `/etc/default/` 아래에 위치한
파일이다.)

변경 전의 서비스 상태
```console
$ netstat -utnl |grep :69
udp6       0      0 :::69                   :::*
$ 
```

제공 주소의 변경(Binding Address 지정)
```console
$ sudo sed -i 's/^TFTP_ADDRESS=.*/TFTP_ADDRESS="192.168.14.200:69"/' /etc/default/tftpd-hpa
$ sudo service tftpd-hpa restart
```

변경 후의 서비스 상태
```console
$ netstat -utnl |grep :69
udp        0      0 192.168.14.200:69       0.0.0.0:*
$ 
```

전통적으로, FTP나 TFTP는 `inetd`(수퍼데몬)을 통하여 실행되므로 과거에는
이를 위한 추가 설정이 필요했었지만, 요즘은 이런 저런 이유(아마도 복잡성
제거와 풍족한 리소스의 시대?)로 단독서버로 서비스하는 경우가 많아서 이
과정이 필요없다.(위와 같이, Listen하는 상태만 확인되었다면...)


### 시험

이제 모든 설치와 설정을 마쳤고, 정상적으로 동작하는지 시험을 할 차례다.
다음과 같은 명령으로 동작 시험이 가능하다.


다음과 같은 명령으로, 위에서 설정한 `pxelinux.0` 파일을 내려받아볼 수
있으며, 아래와 같이 `Connected`, `getting`, `Received`가 나온다면
정상적으로 동작하는 것이다.

```console
$ tftp 192.168.14.200 -v -c get pxelinux.0 && rm pxelinux.0 
Connected to 192.168.14.200 (192.168.14.200), port 69
getting from 192.168.14.200:pxelinux.0 to pxelinux.0 [netascii]
Received 43574 bytes in 0.0 seconds [9202548 bit/s]
$ 
```



## 아쉽게 끝내며...

개인적으로, **DHCP와 PXE는 우리 IT환경을 중앙집중식으로 조금 더 편하게
만드는 과정에 크게 기여할 수 있는 기술**이라고 생각해왔다. 어쩌면 내가
살았던/일했던 많은 환경이, "大同小異"한 구성의 서버나 장치를 주렁주렁
꿰어 구성할 수 있는 가능성이 많았던 환경이라서 그랬는지도 모르겠다.  
물론, "중앙집중"이라는 단어가 갖는 근본적인 문제점. 즉, "그것이 Single
Point of Failure가 될 수 있다는 가능성을 어떻게 극복하는가"하는 문제와
함께 "환경을 새롭게 바꾸는 것을 꺼려하는 '인프라 조직의 습성'을 어떻게
극복할 것인가"가 문제이긴 하다.

그러나, 우리의 인프라 환경이 점차 가상화 단계, 이제 그것을 넘어 Cloud
Computing으로 진화해 가는 과정에서 Hardware에 고정적으로 OS를 설치하는
것, Box에 강하게 결합된 구성을 고수하는 것은 분명, 이 새로운 길에서는
걸림돌이 될 것이다.

기왕에, 새롭게 PXE 환경에 대한 기억을 더듬어본 김에, 이것을 현재의
업무와 결합해볼 기회를 다시 가졌으면... 참 좋겠다. ㅋㅋㅋㅋㅋ


