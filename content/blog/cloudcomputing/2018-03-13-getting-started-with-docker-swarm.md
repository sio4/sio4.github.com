---
title: Getting Started with Docker Swarm
subtitle: 나무토막 모아서 뗏목 만들기
tags: ["Docker", "Container", "orchestration", "high-availability", "cloud-computing"]
categories: ["cloudcomputing"]
image: /attachments/docker/docker-swarm-cluster.png
banner: /attachments/docker/docker-swarm-cluster.png
date: 2018-03-13T21:30:00+0900
---
지난 글에서는 여러 Docker Host 들을 손쉽게 관리하기 위한 기술 중 하나로
Docker Machine에 대해 살펴봤다. Docker Machine은 그 초점이 기계를 어떻게
빨리 뿌리고 거둘 것인지에 있는 인프라 관점, 저수준의 관리기능을 제공하는
도구라면, 오늘의 주제인 **Docker Swarm은 여러 대의 Docker Host 들을 엮어서
마치 하나인 것처럼 다룰 수 있게 해주는 Clustering 도구, 또는 유식한 말로
Orchestration 도구**이다.

![](/assets/logos/docker-swarm-detail.png)

지나치게 빠른 속도로 변해가는 정보기술 분야가, 심지어 영어권을 중심으로
발전하다 보니 만나게 되는 문제 중 하나가 바로 영어로 된 용어 문제다.
(나 역시 영어를 많이 섞어서 쓰긴 하지만 특히나 글을 쓸 때면 가장 신경이
쓰이는 부분 중 하나가 용어를 어디까지 순화할 것인가에 대한 고민이다.)
이런 외래어 중 특히나 우리식으로 옮기기 힘든 것들이 있는데, 그 중 하나가
오늘의 주제인 오케스트레이션(Orchestration)이다.

내 스스로 뭔가의 이름을 붙일 때, 그 뜻이나 모양에 빗대어 표현하는 것을
꽤나 좋아하기 때문에 이런 이름의 형태, 즉 여러 Host와 Network, Storage,
그리고 그 위에서 동작하는 Service 등을 전체적으로 총괄하는 역할을 하는
Software에게, 이것을 마치 관악기, 현악기, 타악기 등이 어우러져 하나의
음악으로 완성해내는 관현악에 비유하여 이름을 붙이는 것은 뭐랄까... 귀에
쏙쏙 꽂힌다고나 할까?  
그럼에도 불구하고, 그것을 글에 적을 때에는... 그냥 영어로 Orchestration
이라 적을지, 그 음을 한글로 오케이스레이션이라고 적을지, 또는 적절하게
우리식(이라고는 하지만 한자를 빌겠지) 표현을 찾아야 할지... 고민을 하게
되고, 또한 그것이 얼마나 통용이 될지에 대해서도 걱정을 하게 된다.

---

잡설은 접고,  
오늘의 글, 그리고 이 뒤를 이을 몇 편의 글은 Docker에 대한 묶음글에 딸린
작은 묶음글로, Docker Host 집단을 마치 하나의 커다란 가상의 Docker Host
처럼 쓸 수 있도록 해주고(Clustering), 더 나아가 기술 관점의 Container를
업무 관점의 논리 단위로 형상화한 Service의 생명주기를 관리할 수 있도록
돕는(Orchestration) 소프트웨어인 Docker Swarm에 대해 정리하려고 한다.


> Docker에 대한 이 묶음글은 아직 몇 개를 쓸지 정하지 못했다. 써보고,...

* [Docker: Getting Started with Docker]
* [Docker: Installation and Test Drive]
* [Docker: 나의 첫 Docker Image]
* ['쓸만한' Docker Image 만들기 - Part 1]
* ['쓸만한' Docker Image 만들기 - Part 2]
* [Docker Cloud에서 자동빌드하기]
* [Docker Machine으로 Docker Node 뿌리기]
* [Docker Machine 다시 보기]
* _Getting Started with Docker Swarm_
* [Docker Swarm에 Service 올려보기]
* [Docker Swarm의 고가용성]
* [Docker Swarm 다시 보기]


# Docker Swarm

* TOC
{:toc .half.pull-right}

Docker Swarm은 2014년에 시작된 Docker Orchestration 도구를 가르키기도 하며,
동시에 버전 1.12 부터 Docker Engine에 결합되어 제공되는 [Swarmkit] 기능을
뜻하기도 한다. 같은 역할을 하지만 서로 별개의 프로젝트로 존재하는 이 둘을
명확하게 구분하기 위해 기존의 독립형으로 동작하는 Swarm 프로젝트는 [Docker
Swarm standalone]으로 부른다.  
이제 구식이 되어버린 Docker Swarm standalone은, 아직 널리 사용되고 있으며,
그래서 아직 Deprecate 계획이 없다고 한다. 또한, 구식임에도, API 호환성
덕분에, 최신 버전의 Docker Engine과도 사용이 가능하다고 한다.

Docker Engine을 Swarm Cluster에 참여시키면, 이 Docker Engine은 Cluster의
일부로써 통합되게 되는데, 이러한 상태를 **Docker Swarm mode** 라고 부른다.
Docker Engine이 Swarm mode로 실행되게 되면, Swarm의 통제 하에서 업무할당
및 Container 실행이 가능해진다.  
이 글에서는, Docker Engine을 이 Swarm mode로 전환시켜 통합 관리 하게 두는
방법에 대하여 위의 목차와 같은 순서로 정리한다.


{:#feature-of-docker-swarm}
## Docker Swarm의 기능

앞서 잠깐 언급한 것처럼, Docker Swarm은 여러 Host 들을 엮어서 마치 거대한
단일 Host처럼 다룰 수 있도록 해주는 **사용자 인터페이스**, Cluster에 속한
Host 중 일부에서 장애가 발생하더라도 서비스의 연속성을 최대한 확보할 수
있도록 해주는 **Cluster 가용성 관리**, 그리고 사용자의 업무를 Service 등의
논리적 단위로 포장하여 그 생명주기 및 요소 간 상호 관계 등을 정의하고
관리하는 **Orchestrator로써의 역할**을 함께 제공한다.

Docker Swarm
: Virtual Docker Host + Host Clustering + Service Orchestration

공식 문서에서 발췌하 주요 기능 키워드는 다음과 같다. 

* Cluster management integrated with Docker Engine
* Decentralized design
* Declarative service model
* Scaling
* Desired state reconciliation
* Multi-host networking
* Service discovery
* Load balancing
* Secure by default
* Rolling updates


{:#terms-of-docker-and-swarm}
## Docker Swarm의 용어와 동작

진도가 나갈 수록, 용어의 혼선이 예상된다. 여기서 일부 용어에 대한 정리를
하고 넘어간다.

{:.boxed.definition}
> Container
> : 사용자가 실행하고자 하는 프로그램의 독립적 실행을 보장하기 위한
  격리된 실행 공간/환경
>
> Task
> : Docker Container 또는 그 격리 공간 안에서 실행되는 단위 작업으로,
> Swarm이 작업계획을 관리하는 최소단위 (Container와 1:1 관계임)
>
> Service
> : 사용자가 Docker Swarm에게 단위 업무를 할당하는 논리적 단위로,
> Swarm에 의해 여러 Task로 분할되어 처리됨
>
> Dockerized Host 또는 Host
> : Docker Engine이 탑재된 Virtual Machine이나 Baremetal
> 
> Swarm Node 또는 Node
> : Docker Engine이 Swarm mode로 동작하는 Host
> 하지만 오랜 버릇으로 인해, 이전 글에서는 Host와 같은 의미로 사용하기도 했다.
>
> Manager Node 또는 Manager
> : Swarm Node 중에서 Cluster 관리 역할을 수행하는 Node
>
> Worker Node 또는 Worker
> : Swarm Node 중에서 Container를 실행하여 실제 일을 처리하는 Node.
> 일부러 제외하지 않으면 모든 Node는 기본적으로 Worker가 됨

### Docker Swarm의 기본 흐름

Swarm이 Docker Engine에 결합되어 있듯이, Swarm에게 명령을 내릴 때에도 역시
Docker Client를 사용하게 된다. 사용자가 Docker Client를 이용하여 Service를
만들게 되면,

1. Manager Node는 Service를 Task로 분할하고 각 복사본의 배치 계획을 세움
1. Manager Node는 세워진 계획에 따라 Task를 Worker Node에 배치함
1. Worker Node는 Task를 받아 각각에 대한 Container를 생성하여 실행시킴

일단 Task가 Worker에게 할당되면 이 Task는 다른 Node로 이전할 수 없고 해당
Node에서 생성, 삭제, 장애의 생명주기를 마치게 된다.



{:#setup-swarm-cluster}
# Swarm Cluster 구성하기

일단 만들어보자. (설명보다 해보는 게 쉬운 Docker. 그래서 예쁘다.)


{:#initialize-swarm-cluster}
## Swarm Cluster 초기화하기

Swarm Cluster의 구성은 매우 간단하다. 별도의 DBMS나 도구를 준비할 필요도
없고, 뭔가 복잡한 사전 구성이 필요하지도 않다. 단 하나, 이미 구성되어
동작하는 Docker Engine이 하나 이상 있으면 된다. 이 글에서는, 앞선 문서
[Docker Machine으로 Docker Node 뿌리기]와 [Docker Machine 다시 보기]에서
구성했던 두 대의 Host를 그대로 사용했다.

먼저, 현재 상태는 아래와 같다.

```console
$ docker-machine ls
NAME   ACTIVE  DRIVER     STATE    URL                       SWARM  DOCKER
dev01  -       softlayer  Running  tcp://198.51.100.222:2376        v18.02.0-ce
dev02  -       softlayer  Running  tcp://198.51.100.216:2376        v18.02.0-ce
$ 
```

그리고, 원격 접속 없이 `docker` 명령을 쉽게 내리기 위해서 다음과 같이
Manager가 될 Host를 선택했다.

```console
$ docker-machine use dev01
Active machine: dev01
$ docker-machine active
dev01
$ 
```

이제 `dev01`이 내 `docker` 명령을 받는다. `docker info` 명령으로 현재 해당
Engine이 어떤 상태인지 확인해보면, 아래와 같이 Swarm mode가 비활성 상태임을
확인할 수 있다.

```console
$ docker info
<...>
Swarm: inactive
<...>
$ 
```

이제 독립 상태인 이 Host를 중심으로 Swarm Cluster를 만들어보자.


### Cluster 초기화

Swarm mode 자체와 관련된 부명령은 `swarm` 명령이다. `swarm` 명령은 다시
몇 개의 부명령을 갖는데, 그 중 `init` 명령은 Cluster를 초기화하기 위해
사용하는 명령이다. 이 명령은 다음과 같은 형식으로 실행하게 된다.

```
docker swarm init --advertise-addr IP_ADDRESS
```

하고 나니 조금 복잡해 보이기도 하는데, 아래와 같이 Bash의 명령어 치환을
활용하면 딱히 IP를 확인하지 않더라도 초기화 명령을 수행할 수 있다.

```console
$ docker swarm init --advertise-addr $(docker-machine ip `docker-machine active`)
Swarm initialized: current node (z9dj9cobdat235ou65kl0ztr3) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-0zq5k1zwxqo8hills9d3ezxu2dzxwuy3t2dcz4vdc1kj01saiy-5pp2qrc60ia8j0qvw1hzgh6ck 198.51.100.222:2377

To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.

$ 
```

Host가 어떤 Swarm Cluster에도 포함되지 않은 상태라면, 위와 같이 오류 없이
초기화가 마무리되며, 친절하게 그 다음에 해야 할 일을 설명해준다.


### Cluster 생성 결과 확인

이제, 초기화를 끝낸 Engine의 정보가 변했는지 확인해보자.

```console
$ docker info
<...>
Swarm: active
 NodeID: z9dj9cobdat235ou65kl0ztr3
 Is Manager: true
 ClusterID: kikdn5niy0hqrvz327rsxcqd6
 Managers: 1
 Nodes: 1
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
 Node Address: 198.51.100.222
 Manager Addresses:
  198.51.100.222:2377
<...>
$ 
```

다양한 기본 설정 상태를 보여주지만, 지금 당장 살펴볼 것은 이게 활성화가
되었다는 정도다.

`swarm` 부명령은 앞서, Swarm mode 자체에 대한 역할을 한다고 말했다.
Swarm mode에서 Node를 관리하고 Service를 관리할 때에는 다른 명령어 세트가
활용되는데, 그 중 Node의 관리를 위한 명령어 세트는 `node`이다. 이제 이
`node` 명령을 사용해서 새로 만든 Cluster의 관리 영역 안으로 들어온 Node를
확인해보자. (물론, 아직 외롭게 혼자겠지만)

```console
$ docker node ls
ID                            HOSTNAME  STATUS  AVAILABILITY  MANAGER STATUS
z9dj9cobdat235ou65kl0ztr3 *   dev01     Ready   Active        Leader
$ 
```

깔끔하다.



{:#add-new-node-to-swarm-cluster}
## 새 Node 추가하기

같은 방식으로, `docker-machine use`를 사용해서 앞으로 내릴 `docker` 명령을
받을 Host를 결정한다.

```console
$ docker-machine use dev02
Active machine: dev02
$ docker-machine active
dev02
$ docker-machine ip `docker-machine active`
198.51.100.216
$ 
```

이제, 이 Host에게 Swarm Cluster에 합류하라고 명령을 내린다. 명령은 앞서
초기화가 끝났을 때 새 Manager가 말해준 그 명령을 사용하면 된다.


### 합류 명령을 위한 Token 확인

아! Docker가 친절해서 참 맘에 든다는 얘기를 했던가? 만약 Cluster 초기화 후
시간이 지나 Token을 잊었다면...

```console
$ docker swarm join-token worker
To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-0zq5k1zwxqo8hills9d3ezxu2dzxwuy3t2dcz4vdc1kj01saiy-5pp2qrc60ia8j0qvw1hzgh6ck 198.51.100.222:2377

$ 
```

이렇게, 다시 한 번 명령과 인수를 포함한 합류 명령행을 확인할 수 있다. 또는,
스크립트로 만들기 위해 값만 받고 싶다면,

```console
$ docker swarm join-token manager -q
SWMTKN-1-0zq5k1zwxqo8hills9d3ezxu2dzxwuy3t2dcz4vdc1kj01saiy-6aj42alvbpqb0y9zzxgy127ko
$ 
```

이렇게 언제든 다시 확인할 수 있다.


### Cluster 합류

그럼, 합류 명령을 내려보자.

```console
$ docker swarm join --token SWMTKN-1-0zq5k1zwxqo8hills9d3ezxu2dzxwuy3t2dcz4vdc1kj01saiy-5pp2qrc60ia8j0qvw1hzgh6ck 198.51.100.222:2377
This node joined a swarm as a worker.
$ 
```

위와 같이, "이 노드는 떼거리에 일꾼으로 합류했어요" 라는 (읔! 다음부터는
조금 더 이쁜 단어를 쓰자) 메시지와 함께 정상적으로 합류가 되었다.

지금 `docker` 명령을 받고 있는 이 Node(이제 Host에서 Node가 되었다.)는
Worker의 신분을 가지고 있다. 그래서 이 상태에서 앞선 예에서 처럼 Manager가
처리해야 할 명령을 내리게 되면, 가령 아래와 같이,

```console
$ docker node ls
Error response from daemon: This node is not a swarm manager. Worker nodes can't be used to view or modify cluster state. Please run this command on a manager node or promote the current node to a manager.
$ 
```

실패를 하게 된다.  그런데 어쨌든, 이 Node는 Cluster에 속해있기 때문에,
실패 메시지를 보면 "나는 지배인이 아니에요. 일꾼은 패거리 작업을 할 수
없어요. 지배인에게 말하거나 저를 지배인으로 승진시켜주세요" 라고 말하고
있다. 오호라... 승진이란 게 있단 말이지... 아무튼,

```console
$ docker node ls
Error response from daemon: This node is not a swarm manager. Use "docker swarm init" or "docker swarm join" to connect this node to swarm and try again.
$ 
```

아예 Cluster에 가입하지 않은 Host의 경우에는 위와 같은, "나도 시켜주세요"
라는 메시지를 뱉는 것에 비하면 친절한 도커씨.

그만하고, 딴소리는,  


### Cluster 합류 결과 확인

새 Node는 어떤 설정을 갖는지 보자.

```console
$ docker info
<...>
Swarm: active
 NodeID: y968agutlsuvzx7mvxpts3n01
 Is Manager: false
 Node Address: 198.51.100.216
 Manager Addresses:
  198.51.100.222:2377
<...>
$ 
```

이렇게, 이제 Swarm mode은 활성화가 되었고, 나는 Manager가 아니고, 그러나
Manager가 어디에 있는지는 알고 있고... 라고 한다.

이제, 다시 Manager Node에게 `docker node ls` 명령을 내려, 그 쪽에서도 새
Node에 대해 잘 알고 있는지 확인해보자.

```console
$ docker-machine use dev01
Active machine: dev01
$ docker node ls
ID                            HOSTNAME  STATUS  AVAILABILITY  MANAGER STATUS
z9dj9cobdat235ou65kl0ztr3 *   dev01     Ready   Active        Leader
y968agutlsuvzx7mvxpts3n01     dev02     Ready   Active        
$ 
```

방금 전에 새로 합류한 `dev02`라는 이름의 Node가 목록에 정상적으로 표시된다.


추가로, 만약 이미 Cluster에 합류되어 있는 기계에게 다시 합류 명령을 내리면
어떻게 될까? 내 고유의 표현으로, 다시 실행하더라도 안전한, "Re Run Safe" 한
명령인지 확인하고 싶다.

```console
$ docker-machine use dev02
Active machine: dev02
$ docker swarm join --token SWMTKN-1-0zq5k1zwxqo8hills9d3ezxu2dzxwuy3t2dcz4vdc1kj01saiy-5pp2qrc60ia8j0qvw1hzgh6ck 198.51.100.222:2377
Error response from daemon: This node is already part of a swarm. Use "docker swarm leave" to leave this swarm and join another one.
$ 
```

"이미 (어떤) 떼거리에 속해 있어요. 다른 떼거리에 가입하려면 먼저 여기서
떠나야 해요." 라고 한다. 음, RRS하군.


다시 추가로,

```console
$ docker-machine ls
NAME   ACTIVE  DRIVER     STATE    URL                       SWARM  DOCKER
dev01  *       softlayer  Running  tcp://198.51.100.222:2376        v18.02.0-ce
dev02  -       softlayer  Running  tcp://198.51.100.216:2376        v18.02.0-ce
$ 
```

혹시나 해서 `docker-machine ls` 명령을 다시 내려봤다. 왜냐하면 거기에서
`SWARM` 이라는 열을 본 기억이 나니까. 그런데 아무런 표시가 되지 않는다.

이것은 아마도, `docker-machine`을 이용하여, Container 형태로 운용되는
Swarm standalone을 설치/관리하는 방식을 사용할 때에 사용되는 필드로
보인다. (찍었다는 얘기)

---

어차피 메뉴얼도 아니고, 기록일 뿐인데... 최대한 짧고 간결하게 써보려고
엄청 노력하고 있는데도 글이 줄어들지 않는다.  
글쓰기 공부가 좀 필요해 보인다.

이어지는 몇 편의 글에서는,

* [Docker Swarm에 Service 올려보기]라는 주제로 Service를 새로 올리고, 필요에
  따라 Scaling 하는 이야기와 Node 또는 Service를 유지보수 하는 얘기를 좀
  정리하려고 하며,
* 두 편에서 미처 다루지 못한 내용을 [Docker Swarm 다시 보기]로 정리하고,
* 마지막으로 Cluster를 Cluster 답게! 가용성을 확보하는 방안에 대해서
  [Docker Swarm의 고가용성] 편에 정리해보려고 한다.


{:.mix-xlarge}
> Happy Docking!!!



### 참고문서

* [Swarm mode overview]
* [Swarm mode key concepts]
* [Getting started with swarm mode]

* [Docker Swarm standalone] : Github Repository of Legacy
* [Swarmkit] : Github Repository of Swarmkit

[Docker Swarm standalone]:https://github.com/docker/swarm
[Swarmkit]:https://github.com/docker/swarmkit

[Getting started with swarm mode]:https://docs.docker.com/engine/swarm/swarm-tutorial/
[Swarm Mode]:https://docs.docker.com/engine/swarm/
[Swarm mode overview]:https://docs.docker.com/engine/swarm/
[Swarm mode key concepts]:https://docs.docker.com/engine/swarm/key-concepts/


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
* _Getting Started with Docker Swarm_
* [Docker Swarm에 Service 올려보기]
* [Docker Swarm의 고가용성]
* [Docker Swarm 다시 보기]

[Docker Swarm 다시 보기]:{{< relref "/blog/cloudcomputing/2018-03-29-little-more-about-docker-swarm.md" >}}
[Docker Swarm의 고가용성]:{{< relref "/blog/cloudcomputing/2018-03-15-high-availability-of-docker-swarm.md" >}}
[Docker Swarm에 Service 올려보기]:{{< relref "/blog/cloudcomputing/2018-03-14-run-a-service-on-docker-swarm.md" >}}
[Getting Started with Docker Swarm]:{{< relref "/blog/cloudcomputing/2018-03-13-getting-started-with-docker-swarm.md" >}}
[Docker Machine 다시 보기]:{{< relref "/blog/cloudcomputing/2018-03-09-little-more-about-docker-machine.md" >}}
[Docker Machine으로 Docker Node 뿌리기]:{{< relref "/blog/cloudcomputing/2018-03-07-provision-docker-node-with-docker-machine.md" >}}
[Docker Cloud에서 자동빌드하기]:{{< relref "/blog/cloudcomputing/2018-02-21-automated-build-with-docker-cloud.md" >}}
['쓸만한' Docker Image 만들기 - Part 2]:{{< relref "/blog/cloudcomputing/2018-02-20-build-usable-docker-image-part2.md" >}}
['쓸만한' Docker Image 만들기 - Part 1]:{{< relref "/blog/cloudcomputing/2018-02-19-build-usable-docker-image-part1.md" >}}
[Docker: 나의 첫 Docker Image]:{{< relref "/blog/cloudcomputing/2018-02-14-build-my-first-docker-image.md" >}}
[Docker: Installation and Test Drive]:{{< relref "/blog/cloudcomputing/2018-02-08-docker-installation-and-test-drive.md" >}}
[Docker: Getting Started with Docker]:{{< relref "/blog/cloudcomputing/2018-02-08-getting-started-with-docker.md" >}}

