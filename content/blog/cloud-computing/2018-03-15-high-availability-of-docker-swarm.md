---
title: Docker Swarm의 고가용성
subtitle: 서비스 가용성을 보장하기 위한 Swarm 클러스터 구성 방법
tags: ["Docker", "orchestration", "high-availability", "Container", "cloud-computing"]
categories: ["cloud-computing"]
images: [/attachments/docker/docker-swarm-ha.png]
banner: /attachments/docker/docker-swarm-ha.png
date: 2018-03-15T23:55:00+0900
---
Docker의 기본 Orchestration 도구인 Swarm의 기본적인 구성에 대하여 설명한
"[Getting Started with Docker Swarm]", 그리고 그 위에 Service를 올리고
관리하는 방식에 대해 정리한 "[Docker Swarm에 Service 올려보기]"에 이어,
이번 글에서는 이러한 기능을 안정적으로 제공할 수 있도록 고가용성 환경을
꾸미는 방법에 대해 정리하였다.
<!--more-->

![](/attachments/docker/docker-swarm-ha.png)
{.text-center .w-50}

아... 그림을 조금씩 손봐서 각각의 영역에 맞게 표현해보고 있는데... 어찌
어설프다. 아무튼,

> Docker에 대한 이 묶음글은 아직 몇 개를 쓸지 정하지 못했다. 써보고,...
> 
> * [Docker: Getting Started with Docker]
> * [Docker: Installation and Test Drive]
> * [Docker: 나의 첫 Docker Image]
> * ['쓸만한' Docker Image 만들기 - Part 1]
> * ['쓸만한' Docker Image 만들기 - Part 2]
> * [Docker Cloud에서 자동빌드하기]
> * [Docker Machine으로 Docker Node 뿌리기]
> * [Docker Machine 다시 보기]
> * [Getting Started with Docker Swarm]
> * [Docker Swarm에 Service 올려보기]
> * _Docker Swarm의 고가용성_
> * [Docker Swarm 다시 보기]
{.boxed}



# Docker Swarm의 고가용성 {#high-availability-of-swarm}

Swarm 뿐만 아니라 모든 클러스터 환경에서, 두 가지 관점의 가용성을 고려할
필요가 있다. 첫번째는, 클러스터를 이루는 요소 중 일부에 장애가 발생한 경우,
그것이 현재 가동중에 있는 서비스/업무에 영향을 주지 않아야 한다는 것이고,
다른 하나는 일부 구성요소가 가용하지 않음에도 불구하고, 그 클러스터가
여전히 제어 가능한 상태에 있어야 한다는 것이다.  편의 상, 이 두 경우에
대해서 각각 "서비스의 가용성"과 "제어의 가용성"이라고 칭하겠다.

Swarm의 경우, 서비스의 가용성은 Manager의 Scheduling 기능에 의해 보장된다.
Scheduler는 Swarm에게 Service가 할당되었을 때, 그것을 Task로 나누고 다시
이 Task에 Slot 개념을 적용하여, 빈 Slot이 없도록 유지관리하는 기능을
가지고 있다. 또한 제어의 가용성에 대해서는, 복수의 Manager Node로 구성된
Manager Pool을 구성하여 Manager 중 일부가 죽더라도 기능이 정상적으로
동작할 수 있도록 현황정보 공유를 포함한 클러스터 기능을 제공하고 있다.



## HA 클러스터의 기본 원리 {#principal-of-ha-cluster}

세상에는 많은 종류의 클러스터라 불리는 것들이 있다. 그 중에는, 같은 일
또는 일련의 일을 병렬로 처리하기 위한 병렬처리 클러스터 또는 부하분산
클러스터가 있고, 장애상황을 유연하게 대처하기 위한 가용성 클러스터 즉,
HA(High Availability) 클러스터가 있다.


### 가용성 클러스터 {#ha-cluster}

가용성 클러스터의 핵심 원리는, 클러스터 구성원 중 일부가 기능을 상실하여
가용하지 않은 상태가 되더라도, 그 위에서 동작하고 있는 일은 정상적으로,
또는 최소한의 영향만 받고 계속해서 그 일을 처리할 수 있도록 한다는 것이다.
이를 위하여, 가용성 클러스터는 다음과 같은 기술/기능을 사용한다.

* **이중화**: 대부분의 주요 자원이 둘 이상으로 구비되어, 그 중 하나에
  문제가 발생하더라도 다른 자원을 활용할 수 있어야 한다. 이중화는 서버
  자체는 물론이고, 네트워크 Path, Storage Path 등 전체 시스템을 구성하는
  모든 부분을 포괄하여 이루어져야 한다.
* **동기화**: 업무 수행에 필요한 데이터는 물론이고, 클러스터의 상태정보
  등의 모든 정보/데이터가 특정 자원으로부터 독립적이어야 한다. 많은 경우,
  Shared Storage를 이용하여 이 문제를 풀기도 하지만, 실시간 동기화를
  이용하는 경우도 있다.
* **지능화**: 장애 지점이나 그에 상응하는 복구 방법 등을 시스템적으로
  파악하고 처리할 수 있어야 한다. 합리적인 방법으로 장애 상황의 유형과
  처리 방식을 잡아낼 수 없다면 겉으로는 업무가 정상화된 것으로 보이지만
  데이터 손실 등 2차적 문제를 만들어낼 수도 있다.
* **자동화**: 자원이 이중화되고, 데이터 동기가 완벽하게 되었으며, 장애
  상황을 합리적으로 파악하였다면 이에 대한 처리가 관리자의 개입 없이,
  그리고 순간적으로 이루어져야 장애 시간을 줄일 수 있다.


### Swarm 클러스터 {#swarm-cluster}

Swarm의 경우, Worker 관점에서 보면 하나의 Service를 여러 개의 Task로
쪼개어 일의 양을 조절할 수 있도록 해주는 부하분산 클러스터의 성격이
기본적인 Swarm의 역할이다. 그러나, 이러한 작업처리의 관리 기능을 원활히
또는 안정적으로 수행하기 위해, 관리기능에 대한 가용성 클러스터의 구성이
필요하다. 이를 위해, Swarm은 Manager Pool을 운용하게 되는데, 이를 위해
다음과 같은 구현이 되어 있다.

* **이중화**를 위해, 복수 개의 Manager를 한 Swarm 클러스터 안에 둘 수 있다.
  Swarm은 Docker Engine과 결합된 형태로 제공되기 때문에 별도의 Agent 설치
  등의 작업 없이 언제든 모든 Node가 Manager의 역할로 쉽게 전환하여 임무를
  수행할 수 있다.
* **동기화**를 위해, 일단 Manager로 지정된 Node들은 상호간 상태정보를
  실시간으로 동기화한다. 이를 위한 별도의 Storage 등은 필요하지 않으므로
  클러스터 구성이 매우 단순해진다. 단, 동기화할 Manager의 수가 너무 많으면
  상대정보 동기화가 Overhead가 될 수 있으므로 규모나 중요성에 따라 적절한
  수량의 Manager를 유지하여야 한다.
* **지능화**를 위해, Swarm 클러스터는 Raft Consensus Algorithm을 사용한다.
  이 알고리즘의 사용으로 인하여, 전체 Manager의 과반수 이상이 유효한 경우,
  서비스를 멈추지 않고 가동시킬 수 있다. 과반수 규칙을 지키기 위해
  Manager의 수를 3, 5, 7 식으로 홀수로 유지하는 것이 효과적이다.
* 업무의 자동화를 위한 Task Scheduler와 클러스터 고유의 관리기능이 한
  몸으로 동작하면서, 장애 상황에서 클러스터의 안정성 유지와 업무의 연속성
  보장이 유기적으로 움직이도록 **자동화**되어있다.

참고로, "[Raft Consensus Algorithm]"에서 이 알고리즘에 대한 재미있는
설명을 볼 수 있다.


## Swarm 클러스터 구성요소 {#components-of-swarm-cluster}

Swarm 클러스터는 매우 단순한 구조를 갖는다. 이 클러스터 안에는 두 종류의
Node가 존재하는데, 하나는 Swarm의 관리 기능을 수행하는 Manager Node고
다른 하나는 실제 Container를 구동하는 Worker Node이다. (Manager는
동시에 Worker가 될 수 있다.)

Swarm이 단순한 고래의 집합이 아니라 일사천리 움직이는 클러스터가 되기
위해서 중추적인 역할을 하는 것이 바로 Manager Node이다. Swarm 클러스터를
처음 만들게 되면, 맨 첫 Node는 자동으로 Manager가 된다.

이 Manager는 다음과 같은 일을 담당하게 된다.

* 기본적으로 Swarm과 사용자 간의 **Interface**로써 Swarm 방식으로 처리되는
  모든 기능에 대하여 사용자의 명령을 받는 통로의 역할을 수행하며,
  (기본적으로 Docker API 및 Docker Client에 통합되어 있음)
* **Node Manager**로써 자신을 비롯한 모든 Node의 등록과 탈퇴를 처리하고
  상태정보 관리를 통하여 가용 자원의 상태를 관리한다. (`swarm`, `node` 명령)
* 또한, **Task Scheduler**로써 사용자가 지시한 일을 여러 Worker가 적절히
  수행할 수 있도록 Service의 생명주기 관리를 주관하며, (`service` 명령 등)
* 마지막으로 **Swarm Cluster Manager**로써 다수의 Manager 간 클러스터 정보를
  동기화하고 전체 Swarm 클러스터의 가용성을 관리한다. (`swarm`, `node` 명령)

조금은 자의적인 구분이긴 하지만, 위의 구분이 크게 이상하지는 않다. 아무튼,
Node 관리와 Service 관리 등의 영역은 지난 두 편의 글에서 정리하였고,
이 글은 클러스터 부분에 초점을 두고 시험을 통하여 정리를 하고자 한다.


## Swarm 클러스터 구성 계획 {#planning-swarm-cluster}

Swarm 클러스터의 실제 구성은 매우 단순하다. Swarm의 매력 중 하나가 이
단순함이다. 이미 Swarm을 구성하면서 초기화, Node 추가 등의 기능을
살펴본 바 있는데, 여기에 약간의 살을 더하는 정도로 클러스터의 가용성을
확보할 수 있다.

이미 알고 있듯이, 기본적으로 Swarm은 복수개의 Node로 구성이 된다. 여기에
3 대 이상의 Node를 Manager로 지정하기만 하면, 말 그대로 추가적인 어떠한
작업도 없이 지정하기만 하면, Swarm 클러스터는 완성된다.

> 일반적으로, 클러스터가 두 대 또는 짝수의 시스템으로 구성된 경우, 그 중
> 하나 또는 반이 Offline이 되었을 때 클러스터가 정상적으로 동작하기가
> 어렵다. 왜냐하면, 남아있는 시스템의 입장에서 그 상황이 자신만 살아남은
> 상황인지, 아니면 서로 상대를 볼 수 없을 뿐, 둘 다 살아있는 것인지를
> 구분하기 어렵기 때문이다. 이를 "Split Brain" 상황이라고 부르는데, 이런
> 상황의 발생을 피하기 위해 홀수 개의 Node 구성을 하거나, 혹은 실제의
> Node를 대신할 Quorum 장치(업무적 기능은 없으나 정족수에 영향을 주는
> 기계나 Storage 등)를 사용하기도 한다.
>
> Swarm 클러스터의 경우, Manager를 홀수로 유지하도록 설계되어 있으며,
> 별도의 Quorum 장치를 사용할 수는 없는 것 같다. (Worker 연결성을
> Quorum으로 활용할 수는 없었을까?) 
{.boxed}



### 계획안 1: 별도의 Manager Pool과 Worker Pool

만약, 대규모의 Swarm 클러스터를 계획하고 있다면 Manager와 Worker를 구분하여
구성하는 것이 가능하다. 예를 들어, 30 여 대의 Worker와 3~5 대의 Manager를
독립적인 기계 위에 구성하는 것이다.

![](/attachments/docker/swarm-cluster-large.png)
독립적인 Manager Pool을 구성한 예
{.caption .text-center}

이 경우, Manager가 관리업무에만 헌신하게 되면 반대로 모든 업무 부하는
Worker에 집중되며 만약 갑작스런 업무 부하로 인해 Process가 자원할당을
원활히 받지 못하는 상황이 되더라도 클러스터에 대한 관리를 유지할 수
있다. 따라서, 부하 상황을 피하기 위해 추가 Host를 투입하거나, 일부
중요하지 않은 Service를 줄이거나 삭제함으로써 가용 자원을 확보하는 일
등이 모두 가능하다.

이렇게 별도의 Manager Pool을 구성하는 방식은 앞서 말한 "제어의 가용성"을
확보하기에 유리하지만, Manager Node의 수가 3 대 이상이어야 클러스터 효과를
볼 수 있기 때문에, 전체 규모가 작은 경우에는 배보다 배꼽이 더 커질 수가
있다.

참고로, Manager Node를 Worker로 사용하지 않기 위해서는 해당 Node를
Drain 상태로 바꾸면 된다.  
(참고: [Manage nodes in a swarm])


### 계획안 2: Manager와 Worker가 혼합된 클러스터

만약, 10 여 대의, (숫자가 중요하진 않다. 예일 뿐이다.) 소규모 클러스터를
운영할 경우, 그리고 부하에 대한 예측이 가능한 경우라면 구태여 Manager를
구분할 필요가 없을 수 있다.

![Manager와 Worker가 혼합된 구성의 예](/attachments/docker/swarm-cluster-small.png "Manager와 Worker가 혼합된 구성의 예")
Manager와 Worker가 혼합된 구성의 예
{.caption .text-center}

이런 경우라면, 전체 Node를 Worker로 사용하면서 그 중 몇 대만 Manager로
사용할 수 있다. 또한, 언제든지 추가 Node를 구성하거나 Manager Node를
관리 전용으로 전환할 수 있기 때문에 비용 효율적이고 유연하게 클러스터를
운용할 수 있게 된다.


보다 자세한 내용은 다음 문서를 참고하면 도움이 된다.

* [Administer and maintain a swarm of Docker Engines]
* [How swarm mode works]


이 글에서는 제 2 안을 이용하여 가용성 시험을 진행할 것이다.  클러스터를
구성하는 상세한(이라고는 하지만 너무 간단하다) 과정은 시험을 통해 하나씩
알아보겠다.

---

시험에 들어가기 앞서, 현재 Swarm의 Node 상태는 아래와 같다. 모두 두 대의
Node가 Swarm으로 묶여 있으며, 그 중 `dev01` 한 대가 Manager 지위를 갖고
있다. (그리고 둘 모두 Worker로써 Active 상태이다.)

```console
$ docker node ls
ID                          HOSTNAME   STATUS   AVAILABILITY   MANAGER STATUS
z9dj9cobdat235ou65kl0ztr3 * dev01      Ready    Active         Leader
y968agutlsuvzx7mvxpts3n01   dev02      Ready    Active
$ 
```


# 1차 시험: 지배인 하나만 더!  {#first-test-one-more-manager}

일단, Manager를 하나만 더 늘려서 정말 두 개로는 가용성 보장이 안 되는지
시험해봤다. (왜 논리적으로 봐도 안 되는 것을 구태여 시험까지???)


## 기존 Worker의 승급 {#promote-worker-as-manager}

"정말 안 되는지" 시험한다고는 하지만, 이 1차 시험에서 중요한 부분은 바로
**Worker 신분으로 Swarm에 가입해 일하고 있던 Node를 Manager로 승진시키는
과정**에 대한 이해이다.

Swarm에 대한 묶음글 첫번째 편의
[Cluster 합류](/blog/getting-started-with-docker-swarm/#cluster-합류)에서
"오호라… 승진이란 게 있단 말이지..."라고 말했던 것을 기억할까? 그 때,
Worker 신분의 Node에게 Manager가 수행해야 할 명령을 내렸더니 이 Worker는

> 나는 지배인이 아니에요. 일꾼은 패거리 작업을 할 수 없어요. 지배인에게
> 말하거나 저를 지배인으로 승진시켜주세요
{.comment}

라고 말했었다. 소원을 들어주자.

```console
$ docker node promote dev02
Node dev02 promoted to a manager in the swarm.
$ 
```

위와 같이, Swarm Node를 관리하는 `docker node` 명령에는 `promote`라는
명령이 들어있다. 위와 같이, Worker의 이름을 주고 이 명령을 내리면, 해당
Node는 Manager로 신분이 상승한다. 반대로, 이미 Manager 역할을 하고 있는
Node를 Worker로 만들려면 `demote` 명령을 사용하면 된다.

```console
$ docker node ls
ID                          HOSTNAME   STATUS   AVAILABILITY   MANAGER STATUS
z9dj9cobdat235ou65kl0ztr3 * dev01      Ready    Active         Leader
y968agutlsuvzx7mvxpts3n01   dev02      Ready    Active         Reachable
$ 
```

승격이 끝난 후에 Node 목록을 보면 위와 같다. 원래는 빈칸이던 `dev02`의
`MANAGER STATUS` 부분에 `Reachable`이라는 표시가 추가된 것을 볼 수 있다.
Worker의 경우 이 칸은 빈 칸으로 표시되며, Manager인 경우는 이렇게 뭔가
상태를 나타내는 값이 표시된다.

### Swarm Node Info

이 때, 각각의 Node에 대해 구성정보를 확인해보면,

```console
$ docker node inspect --pretty dev01
ID:			z9dj9cobdat235ou65kl0ztr3
Hostname:              	dev01
<...>
Manager Status:
 Address:		198.51.100.222:2377
 Raft Status:		Reachable
 Leader:		Yes
<...>
$ docker node inspect --pretty dev02
ID:			y968agutlsuvzx7mvxpts3n01
Hostname:              	dev02
<...>
Manager Status:
 Address:		198.51.100.216:2377
 Raft Status:		Reachable
 Leader:		No
<...>
$ 
```

앞서 목록에서 본 것과 같이 Manager로써의 상태와 Leader 여부가 표시되고,
동시에 Manager 접속을 위한 IP 주소가 표시된다.

이 상태에서, Docker Engine 관점에서 보다 상세한 정보를 확인하기 위해
`docker info` 명령을 내려보면,

```console
$ docker info
<...>
Swarm: active
 NodeID: y968agutlsuvzx7mvxpts3n01
 Is Manager: true
 ClusterID: kikdn5niy0hqrvz327rsxcqd6
 Managers: 2
 Nodes: 2
 Orchestration:
  Task History Retention Limit: 5
 Raft:
  Snapshot Interval: 10000
  Number of Old Snapshots to Retain: 0
  Heartbeat Tick: 1
  Election Tick: 3
 Dispatcher:
  Heartbeat Period: 5 seconds
 CA Configuration:
  Expiry Duration: 3 months
  Force Rotate: 0
 Autolock Managers: false
 Root Rotation In Progress: false
 Node Address: 198.51.100.216
 Manager Addresses:
  198.51.100.216:2377
  198.51.100.222:2377
<...>
$ 
```

이렇게 조금 더 자세한 정보가 나오게 되는데, 특히 맨 마지막 부분을 보면
Manager Addresses 부분에 이 두 Manager의 주소가 모두 표시되는 것을 볼
수 있다.

Docker Swarm은, 이렇게 모든 Manager에 대한 접속 정보를 목록으로 공유하는
방식을 사용하기 때문에 Manager에 대한 대표 주소, VIP를 설정할 필요가
없다. (물론, 사용자 인터페이스 관점에서는 VIP를 사용하면 편할 수도 있다.)

참고로, 일반 Worker의 경우에는 다음과 같이 Manager로써의 정보를 포함하지
않으며, 다만 Manager에 대한 접속정보는 자동으로 유지하고 있다.

```console
$ docker info
<...>
Swarm: active
 NodeID: ha7onmbtpzhk0gddpx4jlgvpv
 Is Manager: false
 Node Address: 198.51.100.214
 Manager Addresses:
  198.51.100.216:2377
  198.51.100.222:2377
<...>
$ 
```


## 장애 시험: Leader Down {#fault-test-leader-down-1}

시험을 위해, Service를 하나 만들어보자. 두 대의 Node가 Manager 겸 Worker로
동작하는 중이니, 편의 상 두 개의 복제본을 갖는 Service를 만들었다.

```console
$ docker service create --name ping --replicas 2 alpine ping docker.com
b4lud1z30783j0j8ifl2vobly
overall progress: 2 out of 2 tasks 
1/2: running   
2/2: running   
verify: Service converged 
$ 
$ docker service ps ping
ID           NAME    IMAGE          NODE   DESIRED STATE CURRENT STATE
5kum3rxqkfrb ping.1  alpine:latest  dev01  Running       Running 53 seconds ago
arwkt6820u0y ping.2  alpine:latest  dev02  Running       Running 53 seconds ago
$ 
```

위와 같이, `ping.1`, `ping.2` 두 개의 Task가 각각 `dev01`과 `dev02`에
만들어졌다.

이제 처절한 가용성 시험이 시작된다! (내가 좀... 인정사정 없이 서버를 죽였다
살렸다 하는 H/A 시험을 상~당히 좋아한다. 뭔가 성격이 좀 이상해...)


### Leader Down {#fault-test-leader-down-1-leader-down}

기왕 Node를 죽인다면 Leader를 먼저! 보통, 계층구조가 확실한 인간 세상의
경우, Leader를 죽이면 조직이 흐트러진다! 고래떼는 어떠냐?!

```console
$ docker-machine kill dev01
Killing "dev01"...
Machine "dev01" was killed.
$ 
```

클라우드 콘솔을 이용할 수도 있지만, 쉽게 가자. 그리고 이 묶음글의 주제가
"*원격으로 다 할 수 있다*" 아니더냐, 그리고 간단하게 다시 Manager에게 갈
명령을 내려봤다.

```console
$ docker node ls
error during connect: Get https://198.51.100.222:2376/v1.35/nodes: dial tcp 198.51.100.222:2376: getsockopt: no route to host
$ 
```

아... Docker Client가 Server와 통신을 못하는구나. 당연하다. 방금 전 장렬히
전사한 `dev01`가 Machine 관점에서 Active였다. (어쨌든, 죽은 것은 확인이
됐다.)

그럼, 아직 살아있는 또하나의 Manager인 `dev02`를 바라보고, 다시 동일한
명령을 날려보자.

```console
$ docker-machine use dev02
Active machine: dev02
$ 
$ docker node ls
Error response from daemon: rpc error: code = Unknown desc = The swarm does not have a leader. It's possible that too few managers are online. Make sure more than half of the managers are online.
$ 
```

어? 동작하지 않는다! Leader를 죽였더니 무리가 모두 마비됐다!!!  가 아니라,
먼저 메시지를 읽어보자.

> The swarm does not have a leader. It's possible that too few managers are online. Make sure more than half of the managers are online.

친절한 Docker씨. "우리 무리에 리더가 없어요. 너무 적은 수의 지배인만 연락이
되면 이런 일이 발생할 수 있어요.. 반 이상의 지배인과 연락이 닿게 해주세요."

그렇다. Raft Consensus Algorithm에 의한 정족수의 Vote에 실패한 것이다.


짝수 개의 Manager만 보유한 Swarm에서 하나의 Manager가 Offline이 되었을 때,
그래서 Manager 클러스터 입장에서 Split Brain 상황이 되면 정상인 상태의
Manager도 자신의 결백함을 증명할 길이 없어서 Manager의 역할을 수행하지
못한다.


## Recovery {#fault-test-leader-down-1-recovery}

정족수에 미치지 못해 클러스터가 정상적으로 동작하지 않는 상황에서, 문제가
발생했던 Manager를 다시 살려내 봤다.

```console
$ docker-machine start dev01
Starting "dev01"...
Machine "dev01" was started.
Waiting for SSH to be available...
Detecting the provisioner...
Started machines may have new IP addresses. You may need to re-run the `docker-machine env` command.
$ 
```

`docker-machine start` 명령을 사용해서 죽였던 Node를 다시 살렸다.

참고로,  
클라우드 제공자나 사용자의 환경에 따라 다르겠지만, IBM Cloud, SoftLayer의
Compute Instance는 다시 시작하더라도 항상 자신의 IP를 유지하게 된다.

어떻게 되었을까?

```console
$ docker node ls
ID                          HOSTNAME   STATUS   AVAILABILITY   MANAGER STATUS
z9dj9cobdat235ou65kl0ztr3   dev01      Ready    Active         Reachable
y968agutlsuvzx7mvxpts3n01 * dev02      Ready    Active         Leader
$ 
```

보자, (목록으로 보지는 못했지만) Swarm에서 잠적했던 `dev01`은 다시 연락
가능한 상태가 되었다. 하지만, Leader의 역할은 죽지 않고 살아있던 Node에게
넘어가 있다.

그런데 혹시... 이렇게 클러스터가 먹통이 되어버렸던 것은 Raft 방식의 정족수
구현과 무관하게 Leader가 죽었기 때문이 아닐까?



## 장애 시험: Manager Down {#fault-test-leader-down-1-manager-down}

라고 의심하는 사람도 있을 수 있다. 해보자. 이번에는 Leader 지위에 있지 않은
일반 Manager를 죽여보려고 한다. 누가 일반 Manager지?

```console
$ docker-machine kill dev01
Killing "dev01"...
Machine "dev01" was killed.
$ 
```

아... 안타깝지만,  
방금 전 죽었다 살아나는 바람에 Leader 자리를 뺏긴 `dev01`이 현재는 일반
Manager다. 어쩔 수 없이 이 Node를 다시 죽였다!

그럼 상태를 볼까?

```console
$ docker node ls
Error response from daemon: rpc error: code = Unknown desc = The swarm does not have a leader. It's possible that too few managers are online. Make sure more than half of the managers are online.
$ 
```

이번에도 똑같은 이유로 Swarm은 동작하지 않았다. 그리고,

```console
$ docker ps 
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
41afb1b8f8c6        alpine:latest       "ping docker.com"   6 minutes ago       Up 6 minutes                            ping.2.arwkt6820u0yuhnftacxj2u1s
$ 
```

살아있는 Host에서 Task 목록을 봐도... 하나만 돌고 있다.  어쨌든, Service
관점에서는 분산되어 있던 Task의 일부가 살아있는 상황이므로 작은 힘으로
나마 업무 처리는 잘 되고 있다고 가정할 수 있지만, Manager가 동작하지 않는
상황이므로 Service의 Scaling을 비롯한 Swarm 차원의 관리 업무는 수행이
불가능하다. (그리고 빈 Slot이 발생했음에도 Slot을 채우려는 Scheduler의
활동도 일어나지 않고 있다.)




일단 다시 살리자.

```console
$ docker-machine start dev01
<...>
```

그리고,

```console
$ docker node ls
ID                          HOSTNAME   STATUS   AVAILABILITY   MANAGER STATUS
z9dj9cobdat235ou65kl0ztr3   dev01      Ready    Active         Reachable
y968agutlsuvzx7mvxpts3n01 * dev02      Ready    Active         Leader
$ 
```

다시 정상화가 되었다. 이렇게 정상화가 되면, 그 과정에서 Swarm은 사용자가
지정한 조건을 만족시키지 못하는 Service에 대한 Task 복구를 진행하며, 이와
동시에 문제가 발생했던 Task에 대한 정보도 수집하게 된다.

```console
$ docker service ps ping
ID           NAME       IMAGE         NODE  DESIRED STATE CURRENT STATE               ERROR
sxjjjrufkhe8 ping.1     alpine:latest dev01 Running       Running about a minute ago
5kum3rxqkfrb  \_ ping.1 alpine:latest dev01 Shutdown      Failed about a minute ago   "task: non-zero exit (255)"
arwkt6820u0y ping.2     alpine:latest dev02 Running       Running 11 minutes ago
$ 
```

위와 같이 장애가 지나간 후에 Service 정보를 살펴보면, Worker 장애로 인해
비어버렸던 Slot에 다시 일을 채워넣고, `Failed`에 빠졌던 Task에 대한 장애
이력도 보여주게 된다.




# 2차 시험: 지배인 셋!  {#second-test-three-of-managers}

이번에는, Swarm 가용성 환경의 지침에 따라, 3개 이상의 Manager를 갖춘 환경을
만들어서 시험을 진행하려고 한다. (처음부터 그랬으면 글이 짧아지지 않겠냐?)


## 새로운 Manager의 채용 {#hire-new-manager}

이번에는 조금 다른 방식으로 Manager를 추가하려고 한다. 먼저, 아래와 같이,
`docker-machine`을 이용해서 Docker Host 하나를 더 만들었으며, 그 결과는
다음과 같다.

```console
$ docker-machine ls
NAME   ACTIVE  DRIVER     STATE    URL                       SWARM  DOCKER
dev01  -       softlayer  Running  tcp://198.51.100.222:2376        v18.02.0-ce
dev02  *       softlayer  Running  tcp://198.51.100.216:2376        v18.02.0-ce
dev03  -       softlayer  Running  tcp://198.51.100.214:2376        v18.02.0-ce
$ 
```

이 새로운 Host는 아직 Swarm Node가 아니다. 현재 Swarm에는, 다음과 같은
Node가 등록되어 있는 상태다.

```console
$ docker node ls
ID                          HOSTNAME   STATUS   AVAILABILITY   MANAGER STATUS
z9dj9cobdat235ou65kl0ztr3   dev01      Ready    Active         Reachable
y968agutlsuvzx7mvxpts3n01 * dev02      Ready    Active         Leader
$ 
```

이제, 새로 만든 Host를 Swarm에 등록할건데, 아예 처음부터 Worker가 아닌
Manager로 채용하려고 한다.

```console
$ docker-machine use dev03
Active machine: dev03
$ docker swarm join --token SWMTKN-1-0zq5k1zwxqo8hills9d3ezxu2dzxwuy3t2dcz4vdc1kj01saiy-6aj42alvbpqb0y9zzxgy127ko 198.51.100.216:2377
This node joined a swarm as a manager.
$ 
```

이전 문서에서 살펴봤지만, Swarm에 합류하는 명령은 다르지 않다. 다만, Token을
Manager 전용으로 사용하면 된다. 합류가 잘 되었다는 메시지를 봤으니, 이제
목록에 잘 떴는지 확인해보자.

```console
$ docker node ls
ID                          HOSTNAME   STATUS   AVAILABILITY   MANAGER STATUS
z9dj9cobdat235ou65kl0ztr3   dev01      Ready    Active         Reachable
y968agutlsuvzx7mvxpts3n01   dev02      Ready    Active         Leader
ha7onmbtpzhk0gddpx4jlgvpv * dev03      Ready    Active         Reachable
$ 
```

잘 들어왔다.



### 시험환경의 준비

앞선 시험에서 사용한 Service는 죽었다 살았다 하는 과정에서 Task 이동
이력이 쌓였다. 보기 좋지 않으므로 새롭게 Service를 구성했다. 이번에는
Node가 세 개이니 복제본의 수를 3으로 맞춰봤다.

```console
$ docker service ps ping
ID           NAME    IMAGE          NODE   DESIRED STATE CURRENT STATE
q43ru1vwka4z ping.1  alpine:latest  dev01  Running       Running 33 seconds ago
od64vxsvce7h ping.2  alpine:latest  dev03  Running       Running 27 seconds ago
j5ve5d3twowm ping.3  alpine:latest  dev02  Running       Running 32 seconds ago
$ 
```


## 장애 시험: Leader Down {#fault-test-leader-down-2}

바로 진행하자!

```console
$ docker-machine kill dev02 
Killing "dev02"...
Machine "dev02" was killed.
$ 
```

그리고, 이번에도 안 되겠지? ㅋㅋㅋㅋ 하면서 Manager 만 처리할 수 있는
명령 실행! (농담이다)

```console
$ docker node ls
ID                          HOSTNAME   STATUS    AVAILABILITY   MANAGER STATUS
z9dj9cobdat235ou65kl0ztr3   dev01      Ready     Active         Leader
y968agutlsuvzx7mvxpts3n01   dev02      Unknown   Active         Unreachable
ha7onmbtpzhk0gddpx4jlgvpv * dev03      Ready     Active         Reachable
$ 
```

오~ 잘 된다! Manager가, 그것도 Leader가 총에 맞았는데도 잘 동작하고 있다!
먼저 Leader 자리를 뺏겼던 `dev01`이 Leader 지위를 되찾았고, 총에 맞은
`dev02`는 `Unreachable` 상태가 되었다. `STATUS`도 물론 `Unknown`이다.

그럼 Service는 어떻게 되었을까??? (사실 이건 Manager에 대한 HA 시험은
아니고 Worker에 대한 시험에 속한다고 볼 수 있다.)

```console
$ docker service ps ping
ID           NAME       IMAGE         NODE  DESIRED STATE CURRENT STATE
q43ru1vwka4z ping.1     alpine:latest dev01 Running       Running 3 minutes ago
od64vxsvce7h ping.2     alpine:latest dev03 Running       Running 3 minutes ago
eyodsn9n3hl0 ping.3     alpine:latest dev01 Running       Running 17 seconds ago
j5ve5d3twowm  \_ ping.3 alpine:latest dev02 Shutdown      Running 3 minutes ago
$ 
```

오! `dev02`에서 실행 중이던 Slot 3에 해당하는 Task가 죽어 없어지고, 그
Slot에 새로운 Task `eyodsn9n3hl0`가 만들어져 `dev01` 위에서 돌고 있다.
조금 특이한 것은, 그 Task의 현재 상태가 아직 `Running`이라는 점인데...


## Recovery {#fault-test-leader-down-2-recovery}

아무튼, 죽은 Node를 되살려보자.

```console
$ docker-machine start dev02 
<...>
```

다음과 같이, 잘 살아 올라왔고 Swarm에도 잘 합류했다.

```console
$ docker node ls
ID                          HOSTNAME   STATUS   AVAILABILITY   MANAGER STATUS
z9dj9cobdat235ou65kl0ztr3   dev01      Ready    Active         Leader
y968agutlsuvzx7mvxpts3n01   dev02      Ready    Active         Reachable
ha7onmbtpzhk0gddpx4jlgvpv * dev03      Ready    Active         Reachable
$ 
```

죽었던 Node가 다시 살아난 상황에서 Task 상황을 다시 보면,

```console
$ docker service ps ping
ID           NAME       IMAGE         NODE  DESIRED STATE CURRENT STATE          ERROR
q43ru1vwka4z ping.1     alpine:latest dev01 Running       Running 7 minutes ago
od64vxsvce7h ping.2     alpine:latest dev03 Running       Running 7 minutes ago
eyodsn9n3hl0 ping.3     alpine:latest dev01 Running       Running 4 minutes ago
j5ve5d3twowm  \_ ping.3 alpine:latest dev02 Shutdown      Failed 44 seconds ago  "task: non-zero exit (255)"   
$ 
```

이번엔 앞서 죽었던 Task인 `j5ve5d3twowm`의 현재 상태가 `Failed`로
바뀌었고, 세부적인 `ERROR` 값도 확인할 수 있게 되었다. 결국, Task가
실패하게 되면 해당 Task를 관할하는 Worker로부터 데이터를 받아야 그
정보가 갱신된다는 말인데, 이건 좀 이상한 부분이다.

그런데, 그런데 여기서 한 가지 중요한 것은, 연락이 두절된 Task Slot을
채울 때... Swarm은 단지 연락이 두절되었다는 것 만으로도 새 Task를 띄우고
있었다. 만약, 해당 Task, Service가 공유 리소스에 대한 배타적 접근이
필요한 경우였다면 어떻게 됐을까?

배타적 자원 접근이 필요한 서비스와 Swarm
: Swarm은 배타적 자원 접근에 대한 타당한 처리를 지원하지 않는 것 같다!
{.point}

사실, 난 개인적으로 그런 업무, 예를 들어 Shared Storage에 기반한 DBMS
같은 업무를 Container로 구동하는 것이 적합하다고 생각하지는 않는다.
아무튼, 이 부분은 나중에 다시... 좀 더 세밀하게 봐야 할 필요가 있어
보인다.



## Relocation {#fault-test-leader-down-2-relocation}

맨 처음 시험했을 때도 그랬지만, Worker가 복구된다고 해서 원래 그 Worker에서
실행 중이던 Task를 억지로 돌려 놓지는 않는다. Live Migration도 아닌데 그럼
안 되지. 다만, 새로운 Service가 만들어지면, 이제 가용한 모든 Node를 이용해서
작업할당을 하게 된다.

```console
$ docker service create -q --name ping2 --replicas 3 alpine ping docker.com
cim16m5sgzkdfycbfgb1gw625
$ docker service ps ping2
ID           NAME     IMAGE          NODE   DESIRED STATE CURRENT STATE
r2agksawzvjq ping2.1  alpine:latest  dev03  Running       Running 11 seconds ago
y24o3i7jeyu9 ping2.2  alpine:latest  dev01  Running       Running 12 seconds ago
o7b86w9n2vbz ping2.3  alpine:latest  dev02  Running       Running 10 seconds ago
$ 
```

만약, 이와 같이 균형이 깨진 상태에서 억지로 균향을 맞추고자 한다면,
아래와 같이, 강제로 Service를 Update 시켜서 정리를 할 수도 있다.

```console
$ docker service update --force ping
ping
overall progress: 3 out of 3 tasks 
1/3: running   
2/3: running   
3/3: running   
verify: Service converged 
$ 
```

이제, 모든 Slot에 대한 재정비가 되었고,

```console
$ docker service ps ping
ID           NAME      IMAGE         NODE  DESIRED STATE CURRENT STATE
0dwtvstjjloi ping.1    alpine:latest dev01 Running       Running 21 seconds ago
q43ru1vwka4z \_ ping.1 alpine:latest dev01 Shutdown      Shutdown 22 seconds ago
6e4b0y11u905 ping.2    alpine:latest dev03 Running       Running 33 seconds ago
od64vxsvce7h \_ ping.2 alpine:latest dev03 Shutdown      Shutdown 34 seconds ago
29fg8ioo92ob ping.3    alpine:latest dev02 Running       Running 45 seconds ago
eyodsn9n3hl0 \_ ping.3 alpine:latest dev01 Shutdown      Shutdown 46 seconds ago
j5ve5d3twowm \_ ping.3 alpine:latest dev02 Shutdown      Failed 6 minutes ago
$ 
```

제 자리를 떠났던 Task 뿐만 아니라, 모든 Task가 다시 시작되면서 균형을
맞췄다. 기능에 대해 설명은 하지만, 최소한 부하 균형을 맞추기 위해 이런
일을 벌일 이유는 없을 것 같다.

(아, 화면에 잘 보이라고 출력을 손봐가며 글을 쓰고 있는데 눈치 챘나?
내 생각에, Go 개발자나 Docker 개발자는 넉넉한 화면 폭을 쓰는 것 같다.)

---

### 정리

오늘 시험했던 장애 모의시험에 대해서 정리해보면 다음과 같다.

* Swarm은 Docker Engine에 결합된 형태로 제공되며 모든 Node가 동일한
  실행파일을 사용하기 때문에, 언제든지 별도의 Agent 설치 없이 Manager로
  승급하거나 다시 일반 Worker로 내려오는 것이 가능하다.
* Swarm 클러스터의 HA 구성은 `docker node promote`, `docker swam join`
  등의 간단한 명령 만으로 손쉽게 구성할 수 있다!
* Swarm 클러스터의 Manager Address는 클러스터 차원에서 자동 관리되며,
  개별 Worker나 Manager에 대해 따로 설정해줄 필요가 없다.
* 장애 상황에서 Manager가 계속 일하기 위해서는, 전체 Manager의 반 이상이
  연결 가능해야 한다.
* 같은 이유로 짝수 개의 Manager를 두는 것은 가용성 확보에 도움이 되지
  않으며, 홀수 개의 Manager를 둬야 가용성을 보장할 수 있게 된다.
* Worker가 다시 돌아와도, Task가 자동으로 다시 채워지지는 않는다. 해당
  Worker는 그 순간부터 유용한 자원이 될 뿐이다.


깔끔하다!


> Happy Docking!!!
{.comment .fs-4}


[Raft Consensus Algorithm]:http://thesecretlivesofdata.com/raft/
[Manage nodes in a swarm]:https://docs.docker.com/engine/swarm/manage-nodes/
[Administer and maintain a swarm of Docker Engines]:https://docs.docker.com/engine/swarm/admin_guide/
[How swarm mode works]:https://docs.docker.com/engine/swarm/how-swarm-mode-works/


### 함께 읽기

이 묶음글은 아직 몇 회까지 쓸지 정하지 못했다.

* [Docker: Getting Started with Docker]
* [Docker: Installation and Test Drive]
* [Docker: 나의 첫 Docker Image]
* ['쓸만한' Docker Image 만들기 - Part 1]
* ['쓸만한' Docker Image 만들기 - Part 2]
* [Docker Cloud에서 자동빌드하기]
* [Docker Machine으로 Docker Node 뿌리기]
* [Docker Machine 다시 보기]
* [Getting Started with Docker Swarm]
* [Docker Swarm에 Service 올려보기]
* _Docker Swarm의 고가용성_
* [Docker Swarm 다시 보기]

[Docker Swarm 다시 보기]:{{< relref "/blog/cloud-computing/2018-03-29-little-more-about-docker-swarm.md" >}}
[Docker Swarm의 고가용성]:{{< relref "/blog/cloud-computing/2018-03-15-high-availability-of-docker-swarm.md" >}}
[Docker Swarm에 Service 올려보기]:{{< relref "/blog/cloud-computing/2018-03-14-run-a-service-on-docker-swarm.md" >}}
[Getting Started with Docker Swarm]:{{< relref "/blog/cloud-computing/2018-03-13-getting-started-with-docker-swarm.md" >}}
[Docker Machine 다시 보기]:{{< relref "/blog/cloud-computing/2018-03-09-little-more-about-docker-machine.md" >}}
[Docker Machine으로 Docker Node 뿌리기]:{{< relref "/blog/cloud-computing/2018-03-07-provision-docker-node-with-docker-machine.md" >}}
[Docker Cloud에서 자동빌드하기]:{{< relref "/blog/cloud-computing/2018-02-21-automated-build-with-docker-cloud.md" >}}
['쓸만한' Docker Image 만들기 - Part 2]:{{< relref "/blog/cloud-computing/2018-02-20-build-usable-docker-image-part2.md" >}}
['쓸만한' Docker Image 만들기 - Part 1]:{{< relref "/blog/cloud-computing/2018-02-19-build-usable-docker-image-part1.md" >}}
[Docker: 나의 첫 Docker Image]:{{< relref "/blog/cloud-computing/2018-02-14-build-my-first-docker-image.md" >}}
[Docker: Installation and Test Drive]:{{< relref "/blog/cloud-computing/2018-02-08-docker-installation-and-test-drive.md" >}}
[Docker: Getting Started with Docker]:{{< relref "/blog/cloud-computing/2018-02-08-getting-started-with-docker.md" >}}


