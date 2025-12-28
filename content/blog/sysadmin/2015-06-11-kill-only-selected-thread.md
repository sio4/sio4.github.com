---
title: Thread 골라 죽이기, WAS 부하 문제
subtitle: 서비스를 살리기 위해 네가 죽어주면 안되겠니?
tags: [JVM, web application server, java thread, kill, Honcheonui, system operation]
categories: ["system-administration"]
banner: /attachments/kill-only-selected-thread/mia-cpu--005.png
date: 2015-06-11T13:03:00+09:00
---

Java 기반의 Web Application Server(WAS)를 이용하여 서비스를 제공하는 경우,
특정 Thread의 이상 폭주로 인하여 전체 서비스 품질에 영향을 미치는 경우가
발생할 수 있다. Thread 별로 CPU 사용량을 Capping할 수 있다면 좋겠지만, 이
글은 그렇지 못한 경우에 유용하게 활용할 수 있는 방법을 기록한다.

> 그 겨울, Thread를 골라 죽이고 싶은 상황을 만났었다.
<!--more-->

> 이 글은 블로그를 새롭게 정비하는 과정에서, 오래전에 공개적으로 운영했던
> 개인 Wiki에 작성했던 글을 이전해온 것입니다.
{.boxed}

## 사건의 발단

작년 겨울의 어느 날, 가을에 오픈하여 정상적으로 운영 중이었던 서비스가 사용자
요청에 대한 응답 지연을 일으키는 문제가 발생하였으며, 시스템 영역에서 살펴봤을
때 다음과 같이 WAS가 미쳐 날뛰는 것을 확인했다.

![](/attachments/kill-only-selected-thread/mia-000--001.png)

시스템 기동 130일째 되던 날의 상황인데, Core 2개 꼴랑 할당해 놓은 VM(나는 좀
짠돌이임)의 부하가 90을 넘어버렸다. 일하는 녀석은 둘인데 밀린 일은 90개인 상황.
30923번 `java` 프로세스의 CPU 사용률이 197%, 즉 혼자 CPU 두 개를 다 쓰고 있다.

Thread 별로 보면, 아래와 같이 경합하고 있다.

![](/attachments/kill-only-selected-thread/mia-000--002.png)

이 날은 그냥, WAS를 재기동하여 상황을 넘겼고, 그 대신 다음에 상황이 발생하였을 때 JVM의 속사정을 자세히 볼 수 있도록 설정을 추가하였다.

![](/attachments/kill-only-selected-thread/mia-cpu--003.png)

위와 같이, JMX Remote 설정을 하였으며, 서버 내부 방화벽을 믿고 별도의 인증
설정이나 SSL 설정 등은 하지 않는 것으로 하였다.[^1] 그리고 정확히 20일 후,
무슨 약속이라도 한 듯이 시스템 기동 150일째 되던 날, 동일한 상황이 재현
되었다.

[^1]: 인증 설정 여부를 떠나서, 특정 외부 시스템에서 이것을 통합 감시할 수 있는
      환경을 한 번 만들어 보고 싶다는...

그 동안 이 서비스에 대한 대부분의 지연이 DBMS의 Lock에서 기인하였던 것과 달리,
이번 역시 DBMS는 놀고 있음에도 불구하고,

![](/attachments/kill-only-selected-thread/mia-cpu--001.png)

WAS만 Load 50으로, 바쁘게 돌아가고 있다. (그래 54!)

![](/attachments/kill-only-selected-thread/mia-cpu--002.png)

## 해결 과정

다행히, 상황은 새벽 시간대에 발생하였고, 서비스 영향도가 낮은 시간인지라,
재기동 없이 상황을 지켜봤다. JVisualVM을 열고 미리 설정해 놓은 JMX Remote
연결을 한 후, CPU 사용량이 많은 Thread의 동작 양상을 보니 아래와 같았다.
(JVM이 동작하는 서비스 계정과 운영 계정의 차이로, 서버 내부임에도 원격 연결을
이용한다.)

### 문제 지점 파악

아래의 테이블에서 볼 수 있듯이, 상당수의 Thread가 자신이 살아있는 기간의
전체를 Running 상태에서 보내고 있다. 정상적인 경우라면, 그 비중이 얼마든,
쉬어가면서 일할 텐데...

![](/attachments/kill-only-selected-thread/mia-cpu--005.png)

조금 더 자세히, 하나의 Thread(ajp-0.0.0.0-10)를 찍어서 보니 다음의 Timeline
그래프와 같이 "거의 안 쉬고 일하는 것"이 아니라, "6분째 계속 달리고 있었던
것"이다. (6분은 JMX 연결을 통해 보여진 시간이며, 전체 살아온 시간은 아니다.)

보통, 접속 사용자가 많거나 업무 특성에 의해 특정 시간에 부하가 몰리는
경우라면, Running 비율이 높을지언정, 하나의 Request를 수 초/수 분 내에 처리한
후, 새로 Job/Request를 받는 Timing이 발생하기 때문에 모든 Thread가 이렇게
Running을 유지하는 것은 업무 패턴과는 무관한 이상 증상일 가능성이 크다.

![](/attachments/kill-only-selected-thread/mia-cpu--004.png)

Pie 그래프 영역의 크기가 달라지겠지만, 정상적인 경우라면 위 그림의 아래쪽
Thread와 유사하게 중간 중간 쉬면서 가야... 아무튼, 혹시나 하는 마음에,
Thread의 Call Stack을 봤더니, 아래와 같이 `HashMap` Class의 `getEntry()`라는
Method에서 걸려있는 것을 알 수 있었다.

![](/attachments/kill-only-selected-thread/mia-cpu--006.png)

아마도, Stack Overflow에 올라온
[Infinite loop in java.util.HashMap](http://stackoverflow.com/a/10219782/1111002)
과 같은 상황일 것 같은데, 일단 이건 우리(운영)의 영역이 아니니 Application
개발 담당자에게 알리는 것으로 하고, 다음으로 넘어간다.

### 돼지 Thread 사냥

*(돼지를 비하하고 싶은 생각은 없지만, 보통 그렇게 들 부르니... ㅎ)* 이제
CPU Hog를 사냥할 차례이다. 먼저, 다음과 같이, Thread 상태를 보면서 목표
Thread를 고른다. (화면 보면서 감탄도 좀 하고, 스샷도 찍는 사이에 또 4분이
흐른 모양이다. 이제 10분 째 달리고 있는 것들이 보인다.)

![](/attachments/kill-only-selected-thread/mia-cpu--007.png)

> 빵!

![](/attachments/kill-only-selected-thread/mia-cpu--009.png)

첫 번째 목표물을 향해 쐈더니, 위와 같이 "tring to kill thread ..." 하는
메시지가 나왔다. 그리고,

![](/attachments/kill-only-selected-thread/mia-cpu--010.png)

이렇게, 54번 Thread가 Wait 상태로 전환되어 숨을 쉬기 시작한 것을 확인할 수
있다. (또 쏘고 스샷 찍기까지 49초나 걸린 모양이다. 시간... 시간...)
그리고 CPU 상태를 보니 50 이상의 부하를 보이던 것이, 아래와 같이 40 수준으로
떨이진 것을 확인할 수 있다.

![](/attachments/kill-only-selected-thread/mia-cpu--011.png)

한 번 쏘기가 어렵지, 두 번째부터는 속도가 나기 마련, 사실 이쯤 되면 목표
Thread를 하나씩 고르는 것이 큰 의미가 없을 수 있다. 그래서 다음과 같이, 20개
정도의 Thread를 한 줄에 날려봤다.

![](/attachments/kill-only-selected-thread/mia-cpu--012.png)

이제 아래와 같이, 폭주 Thread는 7개로 줄었고, 부하 역시 16 정도로 떨어졌다.
이 상황이 되면 이제 신규 사용자 요청은 정상적으로 처리되기 시작했을 것이다.
참고로, 폭주 자체는 일부 사용자의 반복적인 요청(잘 안되니까 다시 시도하는
등)에 의한 경우도 많다.

![](/attachments/kill-only-selected-thread/mia-cpu--013.png)

마지막으로, 남은 7개의 Thread 를 청소했고,

![](/attachments/kill-only-selected-thread/mia-cpu--014.png)

위와 같이 부하가 정상 궤도로 돌아오는 것을 확인할 수 있다.

그리고 이 과정 동안의 JVM 상태 변화를 보면, 아래와 같다.

![](/attachments/kill-only-selected-thread/mia-cpu--020.png)

새벽 2시 18분 쯤 모니터링을 시작한 모양이다. 이 때에는 CPU를 100% 사용하면서
활성 Thread가 200 넘게 유지되고 있는 것을 볼 수 있다.

그리고 02:20, 02:38 정도에 CPU 사용량이 흔들리는 것을 볼 수 있고, 02:34,
02:39 정도에는 활성 Thread 수치가 뚝, 뚝. 떨어지는 것을 볼 수 있다. 최종적으로
폭주 Thread가 사라지면서, CPU 사용량은 02:39 정도에 정상치를 회복했다.

> WAS 재기동 없이 상황 종료!  
> 그러나 시간은 좀 걸렸네...


## 개선 방향

장애가 장애 해결에서 끝나면 뭔가 개운하지 않다.

### 사용한 도구

이 과정에서 사용한 도구는 JVisualVM과 jkillthread라는 녀석이다. J Visual VM은
JDK에 포함되어 배포되는 JVM 모니터링 도구인데, 꼭 이 녀석이 아니더라도 JMX를
이용하여 VM의 상태를 감시할 수 있는 방법은 더 있다.

jkillthread라는 도구는, Thread 단위의 제어를 해보려고 인터넷을 뒤지다가 만난
귀인인데, JDK 6 이상에서 동작하는 Thread Snipper 다.
https://github.com/jglick/jkillthread 에서 Apache License 2.0으로 배포되는
소스를 구할 수 있으며, Maven으로 컴파일할 수 있도록 구성되어 있다.
스크립트는 내가 간편하게 구동하려고 작성한 것이니 무시 가능하다.

![](/attachments/kill-only-selected-thread/mia-cpu--700.png)

### 혼천의에 의해 감지된 장애 징후

이 장애는 혼천의의 VM 리소스 사용량 감시와 WAS 50X 오류 감지 기능을 이용하여
포착하였다. VM 밖에서 든, 안에서 든 CPU라는 리소스의 폭주를 잡는 것은 쉽게
가능하다. 그러나, 이러한 폭주의 원인 파악으로 이어가고, 그에 대한 자동 대응을
위해서는 WAS의 Response를 감지하는 것이 자동화의 시작점이 될 수 있는 중요한
요소이다.

![](/attachments/kill-only-selected-thread/mia-cpu--900.png)

위와 같이, \*web1 이라는 서버에서 아침에도, 그리고 자정 직전에도 상태코드
502의 장애가 발생하고 있음이 감지되었고, 아래와 같이 VM의 부하 변화 역시
감지가 되었다.

![](/attachments/kill-only-selected-thread/mia-cpu--903.png)

그러나 여전히, 뭔가 부족한 장애 징후 감지 방식이다. 만약, 50x 오류 감지와
동시에, Thread 상태 파악, Running/Wait 등의 상태 파악, Thread Dump에서 이상
Call Stack 감지,... 이런 일련을 작업을 자동화할 수 있다면...

사실, WAS 상태가 잡힌 화면에서 Ping이라는 링크는 이러한 기능을 위해 임시로
구현해 놓은 "Service Ping"이라는 기능으로, WAS의 Thread/Memory 등의 상태를
포함하여 DBMS 연결 상태 등, 서비스 구성 요소의 전반적인 상태 값을 확인하는
기능인데, 아직 조치까지 이어서 활용하기는 어려운 상태.

혼천의란? (Wiki에서 블로그로의 이전 과정에서 덧붙임)
: 뜬금없이 "혼천의"라는 이야기가 나오는데, 이건 당시 서비스 지향 모니터링
  시스템을 꼭 만들어보겠다고 팀의 지원도 없이 혼자 설치던 그 비공식 모니터링
  도구의 이름입니다.
{.info .boxed .rounded}

### 그 다음은 자동화?

만약, Thread 상태를 자동으로 감지하고, Call Stack 분석이 자동으로 이루어져,
jkillthread 이 자동으로 발사된다면 어떨지?

위의 경우에는 사람이 개입하여 장장 20분 정도의 시간을 소비하여 조치하였지만,
이 때 사람의 머리/판단/고민이 필요한 지점은 그리 많지 않았다. 그렇다면 조금
지능화된 Script 작성이 가능할 것이라고 보이는데...

쉽지 않은 숙제지만, 분명 풀 수 있는 숙제이고, 서비스 품질 향상에 미치는
영향이 크리라고 생각한다.

## 참고: Interrupt

이 장애 상황을 처음 만났을 때, 함께 있던 동료는 리눅스에서 Thread가 Process
처럼 관리된다고 볼 수 있기 때문에 kill 명령으로 Signal을 주면 Thread별로 죽일
수 있을 것이라고 했다. 그럴까?

조금 무서운 이름을 가진 kill 명령으로 process에게 신호를 보내게 되면,

1. 그 처리는 전적으로 해당 Process(여기서는 JVM, java)가 어떤 녀석이냐에 따라
   달라질 수 있다.
1. 개별 Signal에 대한 자체 Handler를 달아 놓은 경우라면, 그 Handler가 동작하게
   되지만,
1. 그렇지 않은 경우라면 `TERM`, `INT`, `USR1`,... 각각의 기본 Handler가
   동작하여 일을 처리한다.

문제는, 위의 첫 번째 조건으로 인하여 해당 Process의 내부 사정을 알아야 한다는
점이다. 그래서 보통, Signal을 특별하게 처리하는 프로그램들은 그것을 설명서에
기술하고 있다.

또한, Thread화 되어있다고는 하나, 실제로 Signal이 Process에 전달되는 방식에는
그리 많은 정보가 담겨 있는 것이 아니다. 그냥 총알에 맞았다, 칼이 들어왔다,
손가락에 찔렸다, 정도가 느껴질 뿐이며, SIGNAL/INTERRUPT는 그 이상을 처리할 수
있는 방식이 아니다. (그래서 보통, IPC를 구현하면서 Signal을 사용하는 것은 단순
동작이거나, 또는 메시지를 읽어보라고 알려주는 정도로 혼합된 사용인 경우가
많다.)

> 어찌 이 시기 글들은 특히나 좀 썰렁하게 끝난다? 여운 남기기야? ㅎ
{.comment}
