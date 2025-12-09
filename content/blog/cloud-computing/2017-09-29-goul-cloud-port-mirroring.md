---
title: 거울, Cloud Port Mirroring 프로젝트
subtitle: Mirror Your Cloud Network Traffic over the Internet
tags: ["goul", "network", "cloud-computing", "monitoring", "security", "golang"]
categories: ["cloud-computing"]
repository: https://github.com/hyeoncheon/goul
images: [/attachments/goul/goul-flow-all-client.png]
banner: /attachments/goul/goul-flow-all-client.png
date: 2017-09-29T17:12:00+09:00
lastmod: 2017-10-07 23:50:00 +0900
---
네트워크를 다루기가 상대적으로 어려운 클라우드컴퓨팅 환경을 겨냥한
네트워크 포트 미러링 솔루션을 찾다가, 도저히 기능이나 비용 면에서
마땅한 것이 없어서, 요즘 공부하고 있는 Golang을 사용해서 하나 만들었다.  
이 글은, 일단 이 프로젝트를 소개하는 글(README)이다.
<!--more-->

> 아니다, 이 글은 원래 작성했던 미국식도 영국식도 아닌 용환식 영문 버전의
> 국문 번역판이면서,
> 프로젝트 기능과 구조 중심으로 축얀한 부분도 있다.
> 관심이 있으면 원문이면서
> 개발이 진행됨에 따라 업데이트가 될 아래 문서를 읽기 바란다.
> 
> [Goul, Cloud Port Mirroring]({{< relref "/projects/goul.md" >}})
> <- **English version with original README**

Goul(거울)은 네트워크 흐름 분석이나 보안 모니터링을 목적으로 네트워크
미러링이 필요할 때, 그 범위를 단위 Switch나 관련 망이 아닌 인터넷을
넘어 어딘가로 확장해주는 가상 네트워크 포트 미러링 도구이다.

물리 스위치를 사용하는 기존 인프라 환경에서는 스위치의
[port mirroring] (Cisco 식으로 말하면 [SPAN; Switched Port Analyzer])
기능을 이용하여 쉽게 모니터링 또는 흐름 분석을 하거나 보안분석 장비와
연결할 수 있었다. 하지만 클라우드 컴퓨팅 환경에서는 이게 그렇게 쉽지가
않으며, 환경에 따라 아예 불가능할 수도 있다.

이 도구는 나처럼, 이렇게 클라우드 환경 속의 가상 인스턴스나 네트워크
어플라이언스로부터 미러를 해야하는 사람을 위한 도구이다. (물론, 기존
환경에서도 원격지 수집이 필요한 상황이라면 사용할 수 있다.)

Goul은 현재 [Go language]를 이용하여, [gopacket]과 그 아래 깔린 [pcap]
라이브러리를 활용하여 활발하게 개발 중인 프로젝트다.

[port mirroring]:https://en.wikipedia.org/wiki/Port_mirroring
[SPAN; Switched Port Analyzer]:https://supportforums.cisco.com/t5/network-infrastructure-documents/understanding-span-rspan-and-erspan/ta-p/3144951
[Go language]:https://golang.org/
[gopacket]:https://github.com/google/gopacket
[pcap]:http://www.tcpdump.org/pcap.html

잠깐만~!
: Go가 나를 살렸다! Go, goroutine, channel, 각종 buffer들, 그리고 gopacket!
  이들이 없었다면 아직도 죽도록 디버깅하며 개발 중이었을 것이다!
{.point}

잠깐 집고 넘어갈 부분이, 사실 이 프로젝트는 원래 C로 작성하려고 기획을
했었다. Pcap은 고려대상이었지만 상황에 따라서 Raw 데이터를 그냥 사용할
생각도 했었다. 그래서 올 초에는 C로 Prototype도 살짝 만들어봤고... 뭐
패킷을 잡고 넣는 부분은 부담없이 잘 동작하더라.

그런데 걱정이던 부분은 조금 다른 부분이었다. 아래 정리했듯이, 이 프로그램은
필수적으로 Multi Thread나 Multi Process를 써야만 했고, 그들이 데이터를 서로
주고 받을 필요가 있었다. 아... IPC... 그리 좋아하지 않을 뿐더러...  
또 buffering은 어떤가? 모든 부분의 실행속도를 보장할 수 없기 때문에,
각 연결 고리에 버퍼처리를 해야 했고, 또 이를 위한 `malloc`, `realloc`,
`calloc` 등의 향연히 펼쳐졌을텐데... 어흑...

이 모든 고민을 Go가 해결해줬다. Thread를 대신하는 goroutine은, C 뿐만
아니라 python 등 다른 어떤 언어에서 구현해본 Thread보다 훨씬 구현이
쉬웠다. 또한 이들의 데이터 전송을 열어주는 channel은 정말 환상이며,
channel 읽기와 network I/O에서 비동기 I/O를 지원하기 위한 방식들도
생각보다 훨씬 단순하게 처리할 수 있었다.

물론, 아직 남아있는 부분은 있다. Valgrind로 Profiling을 해봤을 때, 뭔가
메모리가 증가하는 현상을 볼 수 있었는데, 이건 Valgrind의 동작이 Go에서
정확히 동작하는지, 그리고 충분하지 않은 시험이었으므로 GC가 충분히
동작하고 있었던 것인지도 봐야 한다. 또한 Valgrind의 Massif 가 시간을
기준으로 한 Heap 변화를 보여주기는 하지만 해석이 쉽지 않는 포맷이라서
더 자세히 profiling을 해볼 필요가 있다.

생각난 김에 go의 자체 profiling을 공부하는 것도 좋을 것 같다. 아무튼,
당장은 단순 test case만 작성하여 86%의 Test Coverage를 확보한 상태인데,
봐서 Benchmark도 해봐야 할 것 같다.

아무튼, 단지 3주의 시간 동안! 그것도 그 주기 속에서 구조 변경을
포함한 재개발까지 했는데도 단 3주에 이것을 완성할 수 있었다는 것이
내겐... 나라는 조금 모자란 프로그래머에게는... 믿을 수 없는 일이다!

**반갑GO! 고맙다GO!**


다시 본론 :-)




## Goul의 기능

* 가상 인스턴스에서 네트워크 인터페이스 하나를 인터넷 넘어 원격지로 미러
* Rx, Tx 중 하나 또는 전체를 복제 (현재는 전체만 지원)
* Pcap 라이브러리의 룰을 이용하여 복제할 패킷 필터링
* 버퍼링이 지원되는 파리프라이닝으로 패킷의 필터링, 압축, 중복제거 등 처리
* TCP/IP를 이용한 정확한 원격지 전송
* 전송 대역폭을 고려한 즉응형 전송으로 업무 영향도 제거 (계획 중)



## Goul의 구조

Goul은 라이브러리와 기본 실행파일로 구성되어 있다. 실행파일 `goul`은 물론
Goul 라이브러리로 만든 것이다.

### Goul 라이브러리

라이브러리 얘기는 아직 정리를 못했다. 하지만, 아래의 실행파일의 구조에
모두 녹아있으므로 그것을 보면 쉽게 짐작할 수 있을 것이다.

### Goul 실행파일

**Goul은 Controller와 Processing Router, Read/Write Adapter, Pipe
등의 조합으로 이루어져 있다.**
개념적으로, Read Adapter가 구성의 한 끝에 위치하며, 다른 한 쪽에 Write
Adapter가 놓인다. 그 사이를 Processing Router가 채우는데, 여기에는
여러 Pipe들이 딸려있다. 이 구조를 관리하기 위해 Controller가 그 위에
놓이는 구성으로 되어있는데, 다음 그림을 보면 더 이해가 빠를 것 같다:

![Goul Client Block](/attachments/goul/goul-block-client-color.png)

Goul은 서버모드와 클라이언트 모드로 구동이 가능하다. 위의 그림은 클라이언트
모드로 구동되었을 경우의 Goul을 표현하고 있다.
클라이언트의 Read Adapter는 Device Adapter인데, 그림의 오른쪽 아래에
표시되어 있다. (붉은 상자) 그 옆으로 Router의 가상 부속인 Forward Pipeline이
Router와 연결되어 놓여있고(녹색 상자), 그 아래에 세 개의 Pipe를 #1, #2, #3
이렇게 매달고 있다. (노랑이)
왼쪽 아래에는 Write Adapter로 사용되는 Network Adapter가 놓이고(파란 상자)
마지막으로 이것들 위로는 Controller가 놓여 있다.
이 직선적 파이프라인 배치를 바탕으로, Device Adapter는 파이프라인의
소스로 동작하게 되며, Network Adapter는 파이프라인의 싱크가 된다.

![Goul Server Block](/attachments/goul/goul-block-server-color.png)

서버모드를 표현한 위의 그림은... 뭐가 다르지? Goul은 하나의 프로그램이
옵션에 의해 서버모드와 클라이언트 모드가 전환되는 구조로, 기본 구조를
서로 공유하고 있다. 서버와 클라이언트가 다른 점은 딱 두 가지인데,
하나는 Adapter이다. (그림처럼 빨간 색과 파란색의 위치가 뒤집...)
**Goul이 서버모드에서는 수신기 겸 주입기로 쓰이기 때문에** Read Adapter가
Network Adapter가 되고, Write Adapter가 Device Adapter가 된다.
또하나의 다른 점은 Pipe의 순서이다. Pipe를 거치면서 부분적으로는
데이터의 변환이 이루어지는데, 이것을 풀기 위해서는 정확히 반대의
방향으로 실행하는 것을 보장해야 한다. #3, #2, #1 순으로.



## Goul의 데이터 흐름

### 클라이언트 모드

Goul을 구동하면, 먼저 Adapter와 Pipe를 Router에게 할당하고 초기화는
과정이 진행된다.
클라이언트 모드에서는 Read Adapter가 네트워크 장치를 초기화하고
Write Adapter가 서버에게 네트워크 연결을 맺는 과정이 함께 일어난다.
이 과정이 끝나면 Router를 실행하게 되는데, 이 때 Router는 각
Adapter의 reader, writer, pipe 등의 함수를 구동하게 된다. 그러면
이들은 각각의 goroutine을 만들어 loop에 진입하면서 초기화가 완료된다.

reader loop가 패킷을 읽으면, 이 패킷은 Processing Router에게로 채널을
통하여 전달하게 된다. 함께 포함된 프로그램의 경우, 기본 Router인
Pipeline Router를 사용하고 있는데, 이 경우 패킷은 Forward Pipeline의
입력으로 전달되게 된다. (당연히 이게 첫번째 Pipe의 input이다)
Pipelilne Router는 Pipe들의 연쇄고리인데, 각 Pipe는 자신의 loop를
수행하는 goroutine이며 입력된 데이터의 압축, 갯수 세기, 중복제거 등의
기능을 수행하게 된다.
Read Adapter의 출력은 항상 정상적인 Packet 데이터지만, Pipe 중에는
가령, gzip 압축을 수행하는 Pipe처럼 데이터를 변화시키는 것이 있어서
Pipeline 내의 데이터는 그 형을 확정하여 말할 수 없다.
Pipeline의 반대편 끝은 Write Adapter의 입력으로 연결되는데, 얘는
입력된 데이터를 받아서 연결된 서버에 전송하는 역할을 한다.

그림으로 보면 다음과 같다:

![Data Flow of Client](/attachments/goul/goul-flow-data-client.png)


### 서버 모드

예상할 수 있듯이, 서버 모드의 데이터 흐름은 클라이언트 모드의 흐름과
완전히 동일하다. 앞서 말한 바와 같이 같은 구조를 사용하니까.
Goul이 서버모드로 시작되면, 얘는 클라이언트 접속을 기다리는 리스너를
구동하고 주입을 위한 네트워크 인터페이스를 초기화한 후, 대기하게 된다.
이 상태에서 클라이언트가 연결을 하게 되면 별도의 goroutine을 통해
각 연결에 대한 수신을 진행한다. 하지만, 그 뒤쪽의 Pipeline이나 Writer는
동일한 것을 함께 사용하게 된다.

이미 말한 바와 같이, 두 번째 다른 점인 Pipe 순서는 조금 중요하다.
위의 구조적인 이유로, 최종적으로 Writer에 넘어가는 데이터만 그 형식을
확정하여 말할 수 있다.

그림으로 보면 아래와 같다:

![Data Flow of Server](/attachments/goul/goul-flow-data-server.png)

간단하지!


## All Together Now!

위에서는 프로그램 내부의 흐름에 대해서만 살펴봤다. 이제, 전체 환경을
구성하여 전체 구조를 보려고 한다.

클라우드 환경에 가상 네트워크 장비가 하나 있고, 우리 자체 DC에 네트워크
분석장비가 있다고 하자. 아래의 구성에서, 오른쪽은 클라우드 환경을
표현한 것이고 Goul이 클라이언트 모드로 동작하고 있으며, 왼쪽은 우리집
DC에 네트워크 분석기와 Goul 서버가 위치한 모양으로 되어있다.

![Direct Configuration](/attachments/goul/goul-architecture-direct.png)

클라우드 네트워크에서 발생한 패킷을 저 NIC에서 읽을 수 있어야 하는데
어떤 경우에는 Promiscuos 모드를 켜주거나 수집기 자체가 Router 등으로
구성되어야할 수 있다.
패킷 수집과 처리가 완료되면, 클라우드 상의 푸른 라인에 위치했던 패킷이
인터넷을 통과하여 수신기에게 전송된다. 수집 서버는 다시 이 데이터를
역산하여 패킷을 복원하게 되며, 완성된 패킷을 네트워크 인터페이스에
주입하면 그것을 분석기가 바로 받아서 분석에 사용하게 된다.

대부분의 경우에는 네트워크 분석기가 하나의 망에 전담 할당되지 않고
여러 네트워크에 대하여 공용으로 사용될 것이다. 이 경우에는 아래와 같이,
집중 Switch를 넣어 해결하게 된다.

![Aggregated Configuration](/attachments/goul/goul-architecture-switch.png)

이 물리 Switch가 정상적으로 설정되어 위쪽의 포트에서 발생한 패킷을
아래쪽으로 전송해주기만 한다면, 위와 동일하게 분석기에서 해당 흐름을
받아볼 수 있다.

아 정말 간단하다!


## 마치며

현재는 패킷을 수집하고 전송하여 주입하는 전체 프로세스가 구현되어 있으며,
시험환경에서의 시험은 완결된 상태다. 다만, 적응형 전송이랄지 연결 자동
재설정이나 기타 고급 기능은 아직 구현되어 있지 않다.

아무쪼록, 패킷과 재미있게 더! 놀기 위해써! 아자!

