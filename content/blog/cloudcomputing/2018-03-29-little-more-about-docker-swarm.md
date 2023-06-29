---
title: Docker Swarm 다시 보기
subtitle: Docker의 Label과 관련된 몇 가지 재미있는 기능들
tags: ["Docker", "orchestration", "Container", "cloud-computing"]
categories: ["cloudcomputing"]
image: /assets/images/common/label.jpg
banner: /assets/images/common/label.jpg
date: 2018-03-15T23:55:00+0900
---
지난 세 편의 Swarm에 대한 글에서 다루지 못했던 몇 가지 중요한 개념과
기능에 대해서 정리한 글이다. 원래 조금 더 많은 내용을 준비했었는데,
일단 다 줄이고, 재미있는 짜투리 소재 두 가지, Docker의 Label 지원과
이를 Swarm에서 이용하는 것과 Global Mode Service에 대하여 간단히
정리하였다.

---


지난 몇 편의 글에서는 기본적인 Swarm Cluster를 구성하는 과정에 대한
이야기를 시작으로, 그 위에 사용자의 Service를 올리는 과정과 Service
규모를 규모를 유연하게 조정하여 Service 부하의 변화에 대응하는 방법에
대한 이야기, 그리고 이 기반환경의 가용성 보장을 위해 Swarm Cluster를
고가용성 환경으로 만드는 방법에 대해 알아봤다.

이번 글은, Swarm 기본 사용법에 대한 마지막 이야기로, 새로운 소재를
꺼내기 보다는 지난 이야기에서 미처 다루지 못한 조각들을 마져 정리하려
한다.

> Docker의 기본적인 개념과 사용법을 다룬 "시작하기"편 묶음글은 아래와 같다.

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
* [Docker Swarm의 고가용성]
* _Docker Swarm 다시 보기_

처음엔 간단하게 설치와 구성에 대해 기록하는 수준에서 생각했던 묶음글인데,
과정의 나열에서 조금 넘어 서서 이런 저런 이야기를 적어나가다 보니 벌써
열 편이 넘어버렸다. 그런데 이제 고작 "시작"을 했을 뿐.

일단 이번 묶음글은 여기서 마무리를 하고, 조금 더 깊은 이야기에 대해서는
"Docker에 대한 두 번째 묶음글"에서 이어가려고 한다.



# 라벨! 라벨! 라벨!

내가 "라벨"을 좋아한다는 말을 했던가? 했었다. 그리고 "라벨이 아니고
레이블입니다..."라는 말도 사양한다는 말도 했던 것 같다. 

![](/assets/images/common/label.jpg){:.twothird}

"[Docker Machine 다시 보기 #라벨! 라벨! 라벨!]({{< relref "/blog/cloudcomputing/2018-03-09-little-more-about-docker-machine.md" >}}#라벨-라벨-라벨)"에서
Engine을 구성할 때 `--engine-label` 옵션을 사용하면 특정 엔진에게
**사용자가 식별 가능한 Tagging**을 할 수 있음을 설명했었다. 그리고
그것을 활용하는 예로 `docker-machine ls` 명령 등을 내릴 때 Filter를
줄 수 있다는 것을 들었었다. 예가 너무 시시하지 않은가? 아무튼,


## Engine Label과 Node Label

Docker Machine으로 Host를 구성할 때, Engine에 라벨을 붙였다면 다음과 같은
방식으로 엔진에 어떤 라벨이 붙어 있는지 확인할 수 있다.

```console
$ docker node inspect --pretty self
<...>
Engine Labels:
 - cluster=dev
 - mode=standalone
 - provider=softlayer
<...>
$ 
```

출력의 뒷부분에서 찾아보면, `Engine Labels` 라는 항목이 있고, 여기에는
Docker Machine을 사용해서 Engine을 구성할 때 사용자가 부여했던 꼬리표,
`cluster=dev`, `mode=standalone` 등이 붙어 있는 것을 볼 수 있다.

참고로, 이 중에서 `provider=softlayer`라는 꼬리표는 내가 붙인 것이 아니다.
이건 Docker Machine이 Host를 구성하는 과정에서 자동으로 부여된다.


### Engine Label을 고치고 싶어요!

어쩌다 보니 Engine을 구성할 때 미처 꼬리표를 달지 못했거나, 불필요한 것을
달았다면 (혹은 나중에 생각이 바뀌었을 수도 있겠다) 저 목록을 고치고 싶은
생각이 들 것이다.

나도 그랬다. 위의 `mode=standalone`라는 꼬리표는, 처음에 이 Host를 Docker의
단독 Host로 사용하려고 했기 때문에 붙였던 것인데 이미 이 Host는 Docker
Swarm Cluster의 Node가 된 상태가 아닌가? (앞서 말했지만, 라벨은 "사용자가
식별 가능한 Tagging"일 뿐이다. 시스템의 상태에 대한 "사실"을 반영하는
것이 아니니 속지 말자.)

{:.mix-large}
> 헉! 마치, *주석이 거짓말을 하고 있는 코드*를 보는 그 설명할 수 없는
> 끕끕한 기분이다. 얼른 떼어내자.
> 
> ... 어라?

어떻게 떼지? 이런... 명령을 찾을 수가 없다. 그럼 기억을 더듬어보자...

아! 생각났다. (좀 어설펐나?)

```console
$ docker-machine ssh dev01 ps ax |grep dockerd
 1216 ?        Ssl  231:12 /usr/bin/dockerd -H tcp://0.0.0.0:2376 -H unix:///var/run/docker.sock --storage-driver overlay2 --tlsverify --tlscacert /etc/docker/ca.pem --tlscert /etc/docker/server.pem --tlskey /etc/docker/server-key.pem --label mode=standalone --label cluster=dev --label provider=softlayer
$ 
```

Host에 접속하여 `dockerd` 프로세스를 보면, 명령행에 Label 정보가 나열되어
있는 것을 볼 수 있었다. 그리고
"[Docker Machine 다시 보기 #Mount]({{< relref "/blog/cloudcomputing/2018-03-09-little-more-about-docker-machine.md" >}}#mount)"
부분의 끝부분에서 잠깐 설명했지만, 이 설정은 다음 파일에서 온다.

```console
$ docker-machine ssh dev01 cat /etc/systemd/system/docker.service.d/10-machine.conf
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd -H tcp://0.0.0.0:2376 -H unix:///var/run/docker.sock --storage-driver overlay2 --tlsverify --tlscacert /etc/docker/ca.pem --tlscert /etc/docker/server.pem --tlskey /etc/docker/server-key.pem --label mode=standalone --label cluster=dev --label provider=softlayer 
Environment=
$ 
```

아... 이 설정파일을 수정해주고 Engine을 다시 시작하면 되겠구나...

그런데 뭔가 개운하지 않은 기분. 정답은?

정답은 "*Engine에 연연하지 말라*"이다. Engine은 Docker 구성요소 중 가장
하위 단계의 기능적인 부분이며, 일반적으로 낮은 계층일수록 사용자 정의
기능이나 인식은 약한 것이 당연하다. 대신, 우리는 Engine 또는 Host 보다
상위 개념인 **Node에게 논리적인 의미를 부여**할 수 있다.


### Node에 Label을 달자

Engine을 대신해서, 이제 Node에 꼬리표를 달자. 우리는 지금 Docker Engine을
사용하는 중이 아니고 Swarm을 사용하는 중이니 어쩌면 이게 더 자연스럽다.
(그리고 기능이 있다!)

먼저 현재의 Node 정보를 보면,

```console
$ docker node inspect dev01 --pretty 
ID:			z9dj9cobdat235ou65kl0ztr3
Hostname:              	dev01
Joined at:             	2018-03-12 06:37:37.783528309 +0000 utc
<...>
```

요렇게 생겼다. 이제, `docker node update` 명령을 사용하여 새로운 꼬리표를
달아보자.

```console
$ docker node update --label-add manager --label-add power=2x2 dev01 
dev01
$ 
```

결과는,

```console
$ docker node inspect --pretty self
ID:			z9dj9cobdat235ou65kl0ztr3
Labels:
 - manager
 - power=2x2
Hostname:              	dev01
<...>
$ 
```

오! 된다!


## 그런데 왜 "라벨"에 연연하시나요?

Engine에 연연하지 말라더니 왜 그토록 라벨 타령을 하냐면, 이게 사용자의
의지를 담을 수 있는 간단한 열쇠 역할을 해주기 때문이다.

아래의 예를 보자.

```console
$ docker service create --name ping --replicas 4 --constraint 'node.labels.power==2x2' alpine ping docker.com
vrw0lj3h0qk6nf6wlj2fxsgg0
overall progress: 4 out of 4 tasks 
1/4: running   
2/4: running   
3/4: running   
4/4: running   
verify: Service converged 
$ 
```

위의 예에서는 `--constraint`라는, 지금까지 사용하지 않았던 옵션을 써서
Service를 생성하였다. 그리고 그 옵션의 인수로 준 것은 바로 앞서 지정한
꼬리표 중의 하나이다. 결과는 어떻게 되었을까?

```console
$ docker service ps ping
ID            NAME    IMAGE          NODE   DESIRED STATE CURRENT STATE
1mk2ylluu15l  ping.1  alpine:latest  dev01  Running       Running 15 seconds ago
127es244m4u6  ping.2  alpine:latest  dev01  Running       Running 16 seconds ago
6xik9w8meu98  ping.3  alpine:latest  dev01  Running       Running 16 seconds ago
m29z3iirh79l  ping.4  alpine:latest  dev01  Running       Running 15 seconds ago
$ 
```

이게 바로, 꼬리표, Label에 연연하는 이유이다.

`--constraint` 옵션에 `node.labels.power==2x2`라는 인수를 넘김으로 해서,
우리는 이렇게 만들어진 Service가 실행될 위치를 특정지을 수 있게 되었다.
Label 외에도 `node.id`, `node.hostname`, `node.role`, `node.labels`,
그리고 `engine.labels` 등을 사용할 수도 있다. (앞서 얘기한 바와 같이,
`engine.labels`는 활용의 폭이 제한적이지만 Multi Cloud 환경에서 Provider를
특정할 필요가 있을 때에는 유용할 수 있겠다.)


Placement Constraints
: 어떤 Service를 실행할 때, 조건을 만족하는 특정 Node에서만 실행되도록
배치 위치를 제한하고 모아주는 기능


### 아니, 그러니까 왜?

아... **균일하게 구성된 Cluster가 아닌 경우**를 상상해보자. 비용이든
어떤 다른 이유에서든, 우리는 하나의 클러스터에 여러 유형의 Node를 혼합한
형태로 사용할 수가 있다. (네트워크 등을 공유하기 때문에 따로 클러스터를
구성하는 것은 불가능한 상황을 뜻한다.)

앞선 예에서는 단순히 `power=2x2` 즉, *성능지표가 CPU 두 개에 Memory 2GB인
기계에만 Service를 구동*하도록 강제하는 경우를 예로 들었다. 무슨 말이냐면,
동작해야 하는 Service의 자원 요구량이 많을 경우, 자원을 많이 보유하고
있는 특정 Node에만 작업이 할당되도록 강제하겠다는 뜻이다. 이것은 극히
단편적이고 쉽게 예로 사용할 수 있는 경우일 뿐, 이와 유사한 형태로
**특정 Service를 그 Service가 필요로 하는 조건을 갖춘 Node에 한하여
구동되도록 제한**해야 하는 경우는 현실세계에서 쉽게 만날 수 있다.



## 오히려 난 최대한 흩뿌리고 싶은데?

내가 Docker 예쁘다는 말을 했던가? 아... 수도 없이 한 것 같다.
특정 기계에만 한정짓는 기능만 제공했으면 조금 덜 예뻤을 지도 모르지만,
Docker Swarm은 기대를 저버리지 않는다.

가령, Docker Host를 받혀주고 있는 가상화 Host, 또는 그 Host가 설치된
Rack이나 데이터센터의 장애 상황을 대비하여 Service를 여러 물리적 환경에
골고루 배치하고 싶은 마음이 들 수 있다. 그렇게 된다면 특정 Host나 Rack,
데이터센터의 장애에 대한 내장애성을 키울 수 있게 된다. 다른 각도에서,
서비스의 사용자가 여러 지역에 분포해 있을 경우, 사용자 접점이 되는
Service를 각 지역에 골고루 배치시키게 되면 서비스 응답속도 개선 등의
효과도 기대할 수 있다. 이렇게, **Service가 특정 조건에 대하여 골고루
배치될 수 있도록 조정**해주는 기능 역시 Swarm은 제공하고 있다.

Placement Preferences
: 어떤 Service를 특정 조건에 만족하는 Node들에게 고르게 분포시키도록
배치 위치를 조정하고 펼쳐주는 기능 


아... 이 얘기는 그 하나만으로도 큰 주제가 되므로 여기서 일단 접는다.
이 글은 맛보기니까?

어쨌든, Label에 대해서 대충 알아봤다. Label에 대한 보다 자세한 내용은
공식 문서의 [Docker object labels]에서 확인할 수 있고, Service 배치
방식에 대한 얘기는 [Control service placement]를 참조하면 된다.




# 조금 특이한 Service: Global Mode Service

"다시보기"라더니 어찌 얘기가 계속 배치방식 쪽으로 흐르는 듯 싶다?
어쨌든 이것도 Swarm의 기본에서 빼먹을 수 없는 얘기인 것 같아,
마지막 주제로 삼았다.


앞서, 어떤 Service를 특정 Node에서만 실행되도록 제한한다거나, 또는
어떤 Service를 특정 조건에 따라 흩어져서 실행되도록 조절하는 방식이
있다는 얘기를 했다. 그런데 우리에게는 그런 상황만 있을까?


## 모든 Node에서, 하나씩만

어떤 경우에는 특정 Service가 모든 Node에서 구동되어야 하는 경우가
있다. 대체로 업무 서비스를 담당하는 Service보다는 기능적인 부분을
담당하는 Service에서 그런 경우가 더 흔할 것 같다. 예를 들면, Node의
모니터링을 담당하는 Agent Service 같은 경우가 이에 해당한다.

그런데 앞서 살펴본 Constrains의 경우, 특정 조건을 만족하는 Node로
Service 실행을 제한하기는 하지만, 이것이 그 조건을 만족하는 모든
Node를 의미하지는 않는다. 또한, Preferences의 경우에도 "가능하면"의
의미가 강하며 보장하거나 하지는 않는다.

이런 특별한 조건, **모든 Node에 하나씩 실행되어야 하는 Service**를
위한 특별한 처리방식이 필요한데, Docker Swarm에서는 이러한 경우를
**Global Mode Service**라는 방식으로 다룬다.

일단, 현재 상태는 이렇다.

```console
$ docker service ls
ID            NAME  MODE        REPLICAS  IMAGE        PORTS
3oogsd2envx3  p2    replicated  3/3       alpine:3.7
$ 
```

여기서 아래와 같이, `docker service create` 명령을 사용해서 서비스를
하나 더 만들어보자.

```console
$ docker service create --name mon --mode global alpine:3.7 ping 127.0.0.1
qa8h079smnybfynbbbzt48hjt
overall progress: 3 out of 3 tasks 
y968agutlsuv: running   
z9dj9cobdat2: running   
ha7onmbtpzhk: running   
verify: Service converged 
$ 
```

여기서도 새로운 옵션이 하나 등장하는데, `--mode`라는 옵션이다. 그리고
다시 Service 목록을 살펴보면,

```console
$ docker service ls
ID            NAME  MODE        REPLICAS  IMAGE        PORTS
qa8h079smnyb  mon   global      3/3       alpine:3.7
3oogsd2envx3  p2    replicated  3/3       alpine:3.7
$ 
```

`mon`이라는 이름의 Service에서 다른 점이 보이나? 바로 `MODE` 항목에
표시된 값이 Service를 생성할 때 지정했던 `global`로 지정되어 있다는 점이
가장 먼저 눈에 띈다. (기존 Service는 `replicated`라고 써있는데, 이게
default 값이기 때문에 `--mode` 옵션을 주지 않고 생성했었다.) 그리고
눈치챘을지 모르겠는데, 한 가지 더 수상한 부분이 있다. 바로 `REPLICAS`
항목!

앞선 `docker service create` 명령에서 `--replicas` 옵션을 주지도 않았는데
스스로 판단해서 세 개의 Task를 만들어냈다. 어디에?

```console
$ docker service ps mon
ID            NAME                           IMAGE       NODE   DESIRED STATE
fwnsiuka5w1a  mon.z9dj9cobdat235ou65kl0ztr3  alpine:3.7  dev01  Running
a4wy2qty4ymb  mon.y968agutlsuvzx7mvxpts3n01  alpine:3.7  dev02  Running
r56l8leudgbm  mon.ha7onmbtpzhk0gddpx4jlgvpv  alpine:3.7  dev03  Running
$ 
```

(출력이 길어서 조금 짤랐는데, 아무튼) 여기서도 눈에 띄는 것이 있다. 먼저,
`NODE` 부분을 보면 Swarm Cluster를 구성하는 모든 Node에 하나씩 Task가
배치된 것을 알 수 있다. 그리고 특이한 점이 하나 더 있는데 뭘까?

`NAME`, 이름이 수상하다. 
["Docker Swarm에 Service 올려보기"의 Process 보기]({{< relref "/blog/cloudcomputing/2018-03-14-run-a-service-on-docker-swarm.md" >}}#show-process)에서, 이미
Task의 이름이 만들어지는 방식에 대해 알아봤었다. 그런데 여긴 좀 이상하게,
"1에서 출발하여 Replica의 수 만큼 증가하는 자연수"로 되어있는 Slot 번호가
아닌 이상한 문자열이 그 자리를 차고 앉아 있는 것을 볼 수 있다. 뭐지? 뭐지?

```console
$ docker node ls
ID                          HOSTNAME  STATUS  AVAILABILITY  MANAGER STATUS
z9dj9cobdat235ou65kl0ztr3 * dev01     Ready   Active        Leader
y968agutlsuvzx7mvxpts3n01   dev02     Ready   Active        Reachable
ha7onmbtpzhk0gddpx4jlgvpv   dev03     Ready   Active        Reachable
$ 
```

그렇다. "*Cluster 내의 모든 Node에 각각 하나씩 실행되어야 한다*"는 것이
Global Mode Service의 개념이기 때문에, 여기서는 Replica 수에 따른 Slot이
아닌 Node에 따른 Slot이 적용되고 있는 것이다. 위의 "이상한 문자열"은 바로
각 Node의 ID였다.


## 자동으로 Scale을 해주는 거네

아니다. 반대로, 이렇게 Global Mode로 만들어진 Service는 Scale을 적용할
수 없다. 개념을 다시 반복하자면, "*Cluster 내의 모든 Node에 각각 하나씩
실행*"된다는 조건이다. Task의 갯수는 사람이 정하는 것이 아니고 Node의
수가 정한다. 그래서,

```console
$ docker service scale mon=6
mon: scale can only be used with replicated mode
$ 
```

Global Mode Service에 대해서 Scaling을 시도하면 위와 같이 오류를 뱉게
된다.

이에 대한 자세한 이야기는 공식 문서의 [Replicated and global services]를
참고하면 된다.

---

누가 쫓아오는 것도 아닌데... 좀 급하게 서둘렀던 것 같다. 어쨌든 이 열 두
편의 묶음글을 통해서, Docker의 설치와 기초 활용법, 그리고 Docker Machine과
Docker Swarm을 활용한 재미난 기능들에 대해 간단히 알아봤다. 또한, 단지
각각의 기능을 실행해보는 것을 넘어서 그 속에 담겨있는 개념에 대한 정리와
기존의 IT 흐름 속에서 갖는 의미에 대해서도 가능하면 많이 담아보려고
했었던 것 같다.

아무튼, 이 묶음글은 이것으로 일단락을 지으려 한다. 써야만 하는 다른 몇
편의 글을 마무리하고, 그리고 일 좀 하고, 다시 Docker로 돌아오겠다.



{:.mix-xlarge}
> Happy Docking!!!




[Control service placement]:https://docs.docker.com/engine/swarm/services/#control-service-placement
[Docker object labels]:https://docs.docker.com/config/labels-custom-metadata/

[Replicated and global services]:https://docs.docker.com/engine/swarm/how-swarm-mode-works/services/#replicated-and-global-services


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
* [Docker Swarm의 고가용성]
* _Docker Swarm 다시 보기_

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
