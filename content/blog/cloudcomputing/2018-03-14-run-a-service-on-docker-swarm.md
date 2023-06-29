---
title: Docker Swarm에 Service 올려보기
subtitle: Docker Swarm 방식으로 서비스 생명주기 관리하기
tags: ["Docker", "Container", "orchestration", "high-availability", "cloud-computing"]
categories: ["cloudcomputing"]
image: /attachments/docker/docker-swarm-service.png
banner: /attachments/docker/docker-swarm-service.png
date: 2018-03-14T18:40:00+0900
---
이번 글에서는, "[Getting Started with Docker Swarm]"에서 만들어둔 Docker
Swarm에 Service를 올려보려고 한다. 시험을 위한 엉터리 Service긴 하지만,
Service와 Task가 무엇인지, 그리고 필요에 따라 어떻게 Service를 수평으로
확장하고 다시 줄이는지, Image 교체 등 Service의 업데이트는 어떤 방식으로
처리하게 되는지 알아보고, 이와 함께 Swarm Node에 대한 유지보수를 진행할
때 Swarm은 그 위에 올라가 있는 서비스를 어떻게 다루는지 등에 대해 정리한다.

---

Docker Swarm은 Docker Engine에 결합된 형태로 제공되는 Orchestration 도구로,
**별도의 도구나 Agent를 추가로 설치/설정해주지 않아도 매우 간단하게 쓸만한
가용성 클러스터를 만들 수 있다**는 면에서 매력이 있다.  
또한, Swarm을 Docker Machine과 함께 사용할 때, 클라우드 서비스의 Console에
한 번도 접속하지 않고, 그리고 클라우드 위에 배포한 Host OS에 접속하지 않고도
어지간한 작업을 모두 원격으로 수행할 수가 있어서 사용하기가 매우 편리하다.
 

> Docker에 대한 이 묶음글은 아직 몇 개를 쓸지 정하지 못했다. 써보고,...

* [Docker: Getting Started with Docker]
* [Docker: Installation and Test Drive]
* [Docker: 나의 첫 Docker Image]
* ['쓸만한' Docker Image 만들기 - Part 1]
* ['쓸만한' Docker Image 만들기 - Part 2]
* [Docker Cloud에서 자동빌드하기]
* [Docker Machine으로 Docker Node 뿌리기]
* [Docker Machine 다시 보기]
* [Getting Started with Docker Swarm]
* _Docker Swarm에 Service 올려보기_
* [Docker Swarm의 고가용성]
* [Docker Swarm 다시 보기]


지금까지 걸어온 길과 앞으로 가려고 하는 길은 위의 묶음글을 참고하시고,
이제 서비스를 하나 올려보려고 한다.



{:#test-drive-run-service}
# 시운전: 서비스 올려보기

* TOC
{:toc .half.pull-right}

아... 시운전은 언제나 Hello World가 제 맛인데... 오늘은 Hello World를
사용할 수가 없다. 왜냐, 서비스란 자고로 지속적으로 실행되어야 하는데,
Hello World는 한 번 메시지를 토하고 사라져버리기 때문에. 그래서 이번
예제에서 사용하는 것은, 끊임없이 ICMP Packet을 쏴대는 `ping`!

그럴 일이야 없겠지만, 특정 호스트에 지속적으로 `ping`을 날리는 것이
오늘 다룰 Service의 업무 내용이다. (뭐, 실제로 각 NSP 별 네트워크
가용성 확인을 위해 비슷한 기능의 VM을 돌려본 적이 있으니 완전히 말이
안 되는 예제는 아니라고... 우겨보자.)

{:.boxed}
> "서비스"와 "Service"가 혼용되어 헷갈리는데, 한글로 표기한 "서비스"는
> 우리가 일반적으로 말하는 바로 그 뜻이다. 다른 표현으로 하면 "업무"나
> "Application" 정도가 되겠다. 영문 "Service"로 표기한 것은 Swarm과
> 사용자가 대화할 때 사용되는 업무의 최소 단위인데, 말하자면 MSA에서
> 사용되는 'S'와 비슷하다고 할 수 있다. 하나의 "서비스"는 다양한 작은
> 기능으로 구성되는데, 이 각각의 기능이 단위 "Service"가 된다고 이해할
> 수 있다.

{:#create-ping-service}
## Ping Service 만들기

Docker 명령을 이용하여 `ping docker.com` 명령을 수행하는 Container를
생성하려면 다음과 같이 명령해주면 된다.

```console
$ docker run alpine ping docker.com
$ 
```

이와 거의 유사한 작업을 Swarm 방식으로 실행하려면, 아래와 같이 명령을
날리면 된다. 이 명령은, `alpine` Image를 이용하여 `docker.com`에 `ping`을
날리는 Service를 생성하는 명령이다.

{:.wrap}
```console
$ docker service create alpine ping docker.com
87m0t5wenl1543k5a8v2mw5c9
overall progress: 1 out of 1 tasks 
1/1: running
verify: Service converged 
$ 
```

Docker Host 입장에서 위의 두 명령은 거의 다를 바가 없다. Host는 `alpine`
Image를 저장소에서 받아오고, 그 Image를 이용하여 Conatiner를 하나 만든
후 그 안에서 `ping docker.com` 명령을 수행하게 된다.  차이가 있다면,
`run` 명령을 이용한 경우는 그 명령을 받은 Engine이 자기 자신 위에서 바로
위의 작업을 수행하게 되지만, Swarm mode의 `service` 명령을 받은 "Manager"는
Service를 수행하기 위한 Task를 계산해내고, Task를 처리할 Worker를 선택하여
Worker에게 Task를 전송하는 과정이 추가된다. 일단 Worker가 Task를 받으면,
`run` 명령을 받았을 때와 동일한 Container 생성/기동 과정을 진행하게 된다.


{:#check-creation-result}
### Service 생성 결과 확인

앞선 글에서 Swarm mode와 관련된 작업을 처리하는 `swarm` 명령과, Swarm 내의
Node를 관리하기 위한 `node` 명령에 대해서 알아봤다. Swarm에서 Service를
다룰 때에는, `service` 명령을 사용하게 된다. (이미 위에서 `service create`를
해보긴 했다.)

유사하게, 다음과 같이 `service ls` 명령을 수행하면 실행 중인 Service의
목록을 확인할 수 있다.

```console
$ docker service ls
ID             NAME           MODE         REPLICAS    IMAGE           PORTS
87m0t5wenl15   goofy_ptolemy  replicated   1/1         alpine:latest
$ 
```

아... 그런데... `goofy_ptolemy`가 뭐냐... :-(  


{:#remove-ping-service}
### Ping Service 지우기

이제 막 시작했는데 부담스러울 게 없다. 한참 된 것이더라도 뭐 부담은 없다.
종이컵과 동격인, Instance 시대가 아니냐. 지우자.

```console
$ docker service rm goofy_ptolemy
goofy_ptolemy
$ 
```

간단하다.

```console
$ docker service ls
ID             NAME           MODE         REPLICAS    IMAGE           PORTS
$ 
```

없어졌다. 이제 좀 의미있는 이름을 줘서 다시 시작해보자.


{:#recreat-ping-service}
## 유명한 Ping Service 만들기

이름있는 Service를 만들기 위해서는 `--name` 옵션을 사용한다. 각종 옵션을
찍고 넘어가면 좋겠는데, 많다. 너무 많아서 일단 이 옵션만 살펴본다.

```console
$ docker service create --name ping alpine ping docker.com
pcs15iwsa3yb8xm3gg99whgw9
overall progress: 1 out of 1 tasks 
1/1: running
verify: Service converged 
$ 
```

아까 실행한 것과 비슷하게, Service ID 하나를 뱉으며 Service가 생성되었다.
이제 다시, 목록을 확인해본다.

```console
$ docker service ls
ID            NAME      MODE         REPLICAS   IMAGE           PORTS
pcs15iwsa3yb  ping      replicated   1/1        alpine:latest
$ 
```

이제, `ping`이라는 의미있는 이름으로 접근이 가능한 Service가 하나 생겼고,
그 Service는 `replicated` 모드로 1개의 `replica`를 갖고 실행되고 있음을 볼
수 있다. (`replicated` 모드나 `replica`에 대해서는 다음 기회에)

혹시나, 이 Container가 어떻게 돌고 있는지, `docker container` 명령으로도
확인해봤다.

{:.wrap}
```console
$ docker container ls
CONTAINER ID  IMAGE          COMMAND            CREATED        STATUS        PORTS  NAMES
c8de5ba456d1  alpine:latest  "ping docker.com"  3 minutes ago  Up 3 minutes         ping.1.lsypb1jj05uagjt39mzzjblq7
$ 
```

위의 `container ls`가 보여주는 Container 정보를 보면, 뭔가 규칙성이 있는
것으로 보이느 이름을 사용하고 있는 것을 볼 수 있다. 이름을 구성하는, '.'로
분리된 세 토막은 각각 Service의 이름과 Task Slot 번호, Task의 고유 ID이다. 

잠깐 정리해보면,

{:.boxed.definition}
> Service와 Service Name
> : 사용자가 Swarm에게 업무를 할당하는 논리적 단위인 Service는 생성 시
>   사용자가 지정할 수 있는 고유의 이름을 갖는다.
>
> Task와 Task Slot
> : Service는 그 규모에 따라 다시 Task라고 불리는 실행의 최소단위로 복제되어
>   각각의 Worker에 할당되는데, 각각의 Task는 고유의 일련번호를 갖게 되며
>   이를 Slot이라 부른다.
>
> Task ID
> : Task가 실제로 Container로써 실행될 때, 해당 Task는 고유의 ID를 갖는다.

이렇다. 직관적으로 이해가 되지 않을 수 있으나, 앞으로 설명하게 될 Service의
생명주기에 대해 이해하게 되면 자연스럽게 파악할 수 있는 내용이다.



{:#check-the-service}
## Service 살펴보기

`service` 명령 세트는 앞서 살펴본 `create`, `rm`, `ls` 외에도 몇가지 명령을
더 제공한다. 이 중, Service 생명주기와 관련된 몇 가지는 이따가 살펴볼 것이기
때문에, 이 단락에서는 거기서 다루지 않을 상태 확인을 위한 명령을 살짝 맛만
보려고 한다.

### Service Inspection

첫번째 명령은 `inspect` 명령이다. 이제, `docker`, `docker-machine` 등 여기
저기서 많이 봐서 새롭지도 않다.

{:.wrap}
```console
$ docker service inspect --pretty ping

ID:		pcs15iwsa3yb8xm3gg99whgw9
Name:		ping
Service Mode:	Replicated
 Replicas:	1
Placement:
UpdateConfig:
 Parallelism:	1
 On failure:	pause
 Monitoring Period: 5s
 Max failure ratio: 0
 Update order:      stop-first
RollbackConfig:
 Parallelism:	1
 On failure:	pause
 Monitoring Period: 5s
 Max failure ratio: 0
 Rollback order:    stop-first
ContainerSpec:
 Image:		alpine:latest@sha256:7b848083f93822dd21b0a2f14a110bd99f6efb4b838d499df6d04a49d0debf8b
 Args:		ping docker.com 
Resources:
Endpoint Mode:	vip
$ 
```

이렇게, `inspect` 명령은 `ls` 명령에서 볼 수 있었던 모드나 복제본 수량 등과
함께, `UpdateConfig`, `RollbackConfig` 등의 항목 아래에 Service의 생명주기
관리를 할 때 사용될 정책 설정값을 함께 보여준다.


{:#show-log}
### Log 보기

다음은, 각각의 Task, Container가 뿌리는 출력을 확인하기 위한 명령인 `logs`
명령이다.

{:.wrap}
```console
$ docker service logs ping
ping.1.lsypb1jj05ua@dev01    | PING docker.com (34.236.167.46): 56 data bytes
$ 
```


{:#show-process}
### Process 보기

전통적인 이름을 붙인 `ps` 명령은, 서비스에 딸린 Task들의 목록을 보여준다.
각각은 Service 이름에 일련번호(Slot 번호)를 붙인 이름을 갖고, 어떤 노드
위에서 어떤 상태에 놓여 있는지를 표시해준다.

```console
$ docker service ps ping
ID            NAME    IMAGE          NODE   DESIRED STATE  CURRENT STATE
lsypb1jj05ua  ping.1  alpine:latest  dev01  Running        Running 8 minutes ago
$ 
```

이 내용은 `docker container ls` 또는 `docker ps` 명령으로 확인할 수 있는
내용과 유사하다.

{:.wrap}
```console
$ docker ps
CONTAINER ID   IMAGE          COMMAND            CREATED          STATUS         PORTS     NAMES
c8de5ba456d1   alpine:latest  "ping docker.com"  10 minutes ago   Up 10 minutes            ping.1.lsypb1jj05uagjt39mzzjblq7
$ 
```

앞서 살펴봤던 Container의 작명규칙과 위의 `docker service ps` 결과를 함께
비교해보면, Task의 ID가 Container의 이름에 포함되어 있는 구조를 볼 수 있다.

(아... Docker를 저수준에서 파다 보면 좀 헷갈리는 것 중 하나가 이 ID 구조다.
특히, Storage 단으로 내려가서 Image가 Host위에 배치된 모습을 보면... 땀이
난다.)



{:#scaling}
# 사용자가 늘었어요! Scaling!

`ping`을 날리는데 사용자가 늘었을리가 있나... 그냥 그렇게 가정을 해보자.
Service의 생명주기 중에, 어떤 이유에서든 서비스의 실행 규모를 늘리고 싶은
경우가 발생할 수 있다. 이 때, `docker service scale` 명령을 사용하여 **이미
실행 중에 있는 서비스의 규모를 키울 수가 있다**.


{:#scale-up-slightly}
## 살짝 늘리기

앞에서 봤듯이, 원래 이렇게 생겼었다.

```console
$ docker service ls
ID            NAME      MODE         REPLICAS   IMAGE           PORTS
pcs15iwsa3yb  ping      replicated   1/1        alpine:latest
$ 
```

이제, `docker service scale` 명령을 사용하여 아래와 같이 규모를 키워본다.

```console
$ docker service scale ping=2
ping scaled to 2
overall progress: 2 out of 2 tasks 
1/2: running
2/2: running
verify: Service converged 
$ 
```

인수로 Service 이름에 숫자를 `=`로 연결하여 넘기게 되면, 위와 같이 해당
서비스의 인스턴스, 복제본을 늘리게 된다. 주의할 점은, 여기서 주는 숫자의
의미는 늘릴 양이 아니라 계획량, 즉 최종적으로 갖게 될 복제본의 수량이
된다. 따라서 이 예에서는 기존의 1 개에 단 하나를 더해 2 개의 복제본을
갖도록 복제본의 수를 조정하게 된다.


{:#check-scaled-up}
### 늘어난 것 보기

어떻게 되었을까? 먼저, Service 목록에는 어떻게 표현되는지 확인해보면,

```console
$ docker service ls
ID            NAME      MODE         REPLICAS   IMAGE           PORTS
pcs15iwsa3yb  ping      replicated   2/2        alpine:latest
$ 
```

이렇게 REPLICAS 열에 숫자가 늘어난 것을 볼 수 있다. M/N에서 M은 가동중인
복제본, N은 목표하는 복제본의 갯수이다. 보는 김에, Task 목록도 보자.

```console
$ docker service ps ping
ID            NAME    IMAGE          NODE   DESIRED STATE  CURRENT STATE
lsypb1jj05ua  ping.1  alpine:latest  dev01  Running        Running 9 minutes ago
yg8emq0naf7v  ping.2  alpine:latest  dev02  Running        Running 7 seconds ago
$ 
```

아까부터 있었던, 이제는 실행된 지 9분이 지난 ID가 `lsypb...`인 Task와 함께,
ID가 `yg8em...`이며 Slot 번호가 `2`인 새 Task가 막 실행된 것을 확인할 수
있다.


{:#scale-up-largely}
## 왕창 늘리기

달리는 김에, 확 늘려보자!

```console
$ docker service scale ping=100
ping scaled to 100
overall progress: 12 out of 100 tasks 
<...>
```

이렇게 숫자를 크게 주면, 간이 작아서 고작 100이다. 하긴, Container가 아닌
VM이라고 한다면, 2x2 기계 두 대에 100개라니... 대단한 일이긴 하다! 아무튼
앞선 예외는 달리 각각의 Task의 상태 변화를 화면에 표시하지는 않는다.  
어쨌든, 그 과정에서 `service ls`를 해보면,

```console
$ docker service ls
ID            NAME      MODE         REPLICAS   IMAGE           PORTS
pcs15iwsa3yb  ping      replicated   74/100     alpine:latest
$ 
```

이렇게 가동중인 복제본의 수가 증가하는 것을 확인할 수 있으며,

```console
$ docker service scale ping=100
ping scaled to 100
overall progress: 100 out of 100 tasks 
verify: Service converged 
$ 
```

이렇게 모든 복제본의 배치가 완료되고 나면,

```console
$ docker service ls
ID            NAME      MODE         REPLICAS   IMAGE           PORTS
pcs15iwsa3yb  ping      replicated   100/100    alpine:latest
$ 
```

이렇게 Service 목록에서도 그 결과를 확인할 수 있다.



{:#return-to-normal-scale}
## 다시 돌아가기

작업량이 줄어 이제 다시 Task의 숫자를 줄이고 싶다면, 역시 `scale` 명령을
사용하면 된다.

```console
$ docker service scale ping=4
ping scaled to 4
overall progress: 4 out of 4 tasks 
1/4: running
2/4: running
3/4: running  
4/4: running  
verify: Service converged 
$ 
```

이렇게 숫자를 조정하고 나면, 줄고 있는 동안 아래와 같이 혼잡한 모습을
보이다가,

```console
$ docker service ps ping
ID            NAME    IMAGE          NODE   DESIRED STATE CURRENT STATE
lsypb1jj05ua  ping.1  alpine:latest  dev01  Running       Running 15 minutes ago
yg8emq0naf7v  ping.2  alpine:latest  dev02  Running       Running 6 minutes ago
q2riesg5celt  ping.3  alpine:latest  dev01  Running       Running 2 minutes ago
4hno892dwwjj  ping.4  alpine:latest  dev02  Running       Running 2 minutes ago
6fwkxurgixp1  ping.5  alpine:latest  dev02  Remove        Shutdown less than a second ago
qy7khuzvnm66  ping.14 alpine:latest  dev02  Remove        Shutdown 1 second ago
gjegh57qdo65  ping.31 alpine:latest  dev02  Remove        Shutdown less than a second ago
qib4b440rkzk  ping.39 alpine:latest  dev02  Remove        Shutdown 1 second ago
<...>
$ 
```

최종적으로는 아래와 같이,

{:.wrap}
```console
$ docker service ps ping
ID            NAME    IMAGE          NODE   DESIRED STATE CURRENT STATE
lsypb1jj05ua  ping.1  alpine:latest  dev01  Running       Running 16 minutes ago
yg8emq0naf7v  ping.2  alpine:latest  dev02  Running       Running 7 minutes ago
q2riesg5celt  ping.3  alpine:latest  dev01  Running       Running 3 minutes ago
4hno892dwwjj  ping.4  alpine:latest  dev02  Running       Running 3 minutes ago
$ 
```

Slot 번호 `1`, `2`, `3`, `4` 만 남게 된다. 이렇게, Slot 번호를 갖는 각각의
Task는 Slot 번호를 증가시키는 방향으로 늘어났다가, 다시 앞쪽의 번호를 맞추는
방향으로 규모 변경을 진행하게 된다. 즉, 원래부터 돌고 있던 낮은 Slot 번호를
갖는 Task, Container가 유지되고, 바쁜 일을 도와주려고 새로 생겼던 Task들이
일을 끝내면 사라지는 것이다. (ID `lsypb1jj05ua`는 맨 처음부터 있던 바로 그
Task이다.)



{:#the-maintenance-menace}
# "The Maintenance Menace!"

지금까지는 잘 만들어놓은 서비스로, 사용량의 변화에 맞춰가며, 성공적으로
Ping! 서비스를 운영하고 있었다. 그러나 이제, 운영자에게 있어서 제 1 번
위협일 수 있는 유지보수의 시간이 돌아왔다!

`ping` 서비스를 위한 기반 Image로 사용하던 `alpine:latest`에 들어있는
`ping` 프로그램에서 상대방 서버를 죽이는 버그가 발견되어, 이전 버전의
Image로 변경할 일이 생겼다. 이 가정은 논리적으로 Rollback에 해당할 수
있다. 이렇게, 서비스 관점에서 Rollback에 해당하는 예를 든 이유는,
**서비스 관점에서의 Update와 Swarm의 기능 관점에서의 Update, 혹은 그
반대의 경우는 의미가 다를 수 있다**는 점을 말하고 싶어서... (라고 포장)



{:#rolling-update-for-service-maintenance}
## 서비스 유지보수를 위한 Rolling Update

서비스 유지보수를 위한 Rolling Update를 시험하기 위해, 시험에 사용될
Service를 새로 만들어봤다.

{:.wrap}
```console
$ docker service create --name ping --replicas 4 --update-delay 10s alpine ping docker.com
j8aohe3hif1jgq506trybuf4a
overall progress: 4 out of 4 tasks 
1/4: running
2/4: running
3/4: running
4/4: running
verify: Service converged 
$ 
```

여기서, 앞선 예에서는 사용하지 않았던 옵션을 사용했는데, `--update-delay`
옵션은 이 Service에 대하여 Update를 진행할 때, 각 Task에 대한 Update 시
일정한 시간 간격을 두도록 Service의 설정을 해주는 것이다. 이 외에도,
`--update-failure-action`, `--update-max-failure-ratio`, `--update-monitor`,
`--update-order`, `--update-parallelism` 등의 옵션을 줄 수가 있다.

이렇게 설정한 값은, `service inspect` 명령을 사용하여 확인할 수 있다.

{:.wrap}
```console
$ docker service inspect --pretty ping

ID:		j8aohe3hif1jgq506trybuf4a
Name:		ping
Service Mode:	Replicated
 Replicas:	4
Placement:
UpdateConfig:
 Parallelism:	1
 Delay:		10s
 On failure:	pause
 Monitoring Period: 5s
 Max failure ratio: 0
 Update order:      stop-first
RollbackConfig:
 Parallelism:	1
 On failure:	pause
 Monitoring Period: 5s
 Max failure ratio: 0
 Rollback order:    stop-first
<...>
$ 
```

이렇게, `--update-delay` 옵션에 해당하는 `UpdateConfig` 아래의 `Delay`
값이 10 초로 설정된 것을 볼 수 있다.

Update 설정과 관련된 자세한 내용은 다음 공식 문서에서 확인할 수 있다:

* [Configure a service’s update behavior]


### Update 시작하기

자, 일단 현재 만들어진 Service의 Task 상태를 확인한 후,

```console
$ docker service ps ping 
ID            NAME    IMAGE          NODE  DESIRED STATE  CURRENT STATE
bs475pk4v6fn  ping.1  alpine:latest  dev02 Running        Running 2 minutes ago
fsc7b7kjbrhh  ping.2  alpine:latest  dev01 Running        Running 2 minutes ago
7hf8vbfcopsd  ping.3  alpine:latest  dev01 Running        Running 2 minutes ago
izvqmhfx6r0l  ping.4  alpine:latest  dev02 Running        Running 2 minutes ago
$ 
```

기존 Image 대신 `alpine:3.7`를 사용하도록 `docker service update` 명령을
내려 Update를 해보자! (아, 이름만 다르고 같은 버전 맞다. 현재는. T.T)

```console
$ docker service update --image alpine:3.7 ping
ping
overall progress: 0 out of 4 tasks 
1/4: ready
2/4:
3/4:
4/4:
```

이렇게, Slot 별로 뭔가가 돈다... Ready...

```console
$ docker service update --image alpine:3.7 ping
ping
overall progress: 2 out of 4 tasks 
1/4: running
2/4: running
3/4: ready
4/4:
```

Running...

```console
$ docker service update --image alpine:3.7 ping
ping
overall progress: 4 out of 4 tasks 
1/4: running
2/4: running
3/4: running
4/4: running
verify: Service converged 
$ 
```

그리고 최종적으로 모든 Slot에 대한 Update가 끝났다.


### Update 과정의 이해

위와 같이 진행되는 동안에, 다른 창에서 Task 상태를 지켜봤다.

```console
$ docker service ps ping 
ID           NAME       IMAGE         NODE  DESIRED STATE CURRENT STATE
bs475pk4v6fn ping.1     alpine:latest dev02 Running       Running 3 minutes ago
9smre9xj8sbr ping.2     alpine:3.7    dev01 Running       Starting less than a second ago
fsc7b7kjbrhh  \_ ping.2 alpine:latest dev01 Shutdown      Shutdown less than a second ago
7hf8vbfcopsd ping.3     alpine:latest dev01 Running       Running 3 minutes ago
izvqmhfx6r0l ping.4     alpine:latest dev02 Running       Running 3 minutes ago
$ 
```

어? Slot 2에 원래부터 있던 `fsc7b7kjbrhh`의 현재 상태가 방금 전에 죽은
것으로 표시되고, 그 순간 새로 Slot 2를 채울 `9smre9xj8sbr`가 막 시작한
흔적이 보인다.

```console
$ docker service ps ping 
ID           NAME       IMAGE         NODE  DESIRED STATE CURRENT STATE
bs475pk4v6fn ping.1     alpine:latest dev02 Running       Running 3 minutes ago
9smre9xj8sbr ping.2     alpine:3.7    dev01 Running       Running 14 seconds ago
fsc7b7kjbrhh  \_ ping.2 alpine:latest dev01 Shutdown      Shutdown 14 seconds ago
7hf8vbfcopsd ping.3     alpine:latest dev01 Running       Running 3 minutes ago
uhm1s1p33lhk ping.4     alpine:3.7    dev02 Ready         Ready 3 seconds ago
izvqmhfx6r0l  \_ ping.4 alpine:latest dev02 Shutdown      Running 3 seconds ago
$ 
```

잠시 후, Slot 4를 대신할 `uhm1s1p33lhk`가 준비되었다는 신호도 보이고,
아마 `izvqmhfx6r0l`에 대한 Running은 죽이기 시작했다는 의미일 것도 같다.

같은 방식으로 전체 Slot에 대해 "**새로운 Container를 준비한 후 기존
Container를 죽이고, 이와 함께 새 Container에서 프로세스를 기동하는 형태**"로
모든 Task의 교체가 이루어졌다. 그 결과는 아래와 같다.

```console
$ docker service ps ping 
ID           NAME       IMAGE         NODE  DESIRED STATE CURRENT STATE               PORTS
v53qh0x20sqr ping.1     alpine:3.7    dev02 Running       Running about a minute ago
bs475pk4v6fn  \_ ping.1 alpine:latest dev02 Shutdown      Shutdown about a minute ago
9smre9xj8sbr ping.2     alpine:3.7    dev01 Running       Running 2 minutes ago
fsc7b7kjbrhh  \_ ping.2 alpine:latest dev01 Shutdown      Shutdown 2 minutes ago
xc36e6wuriz0 ping.3     alpine:3.7    dev01 Running       Running about a minute ago
7hf8vbfcopsd  \_ ping.3 alpine:latest dev01 Shutdown      Shutdown about a minute ago
uhm1s1p33lhk ping.4     alpine:3.7    dev02 Running       Running 2 minutes ago
izvqmhfx6r0l  \_ ping.4 alpine:latest dev02 Shutdown      Shutdown 2 minutes ago
$ 
```

전체적인 교대가 끝나더라도, 이와 같이 지난 Task의 기록은 남아있다.

아! 하나 빼먹을 뻔 했는데, 잘 표시는 나지 않지만 각각의 Update는
앞서 설정한 Delay 설정에 의해 10초 간격으로 진행되었으며, 앞의 출력
중 두 번째 출력을 살펴보면 Slot 2에 비해 Slot 3은 약 10초 늦게
전환이 시작된 것을 볼 수 있다.


## 원래의 모습으로 Rollback

원래의 모습으로 Rollback하는 것은 사실 원래의 모습으로 Update하는 것과
같다. 그래서, 다시 `alpine:latest`를 사용하도록 해주려면 다시 `update`
명령을 내려도 된다. 의미와 상관없이, 기능이 그렇다는 말이다.

그러나, 두 작업의 의미를 보면 조금 다른 뉘앙스가 있다. Update는 그 방향이
원칙적으로 바르지만 낮은 곳에서 바르고 높은 곳으로 가는 것이다. (물론,
이 예제는 보안 업데이트를 예로 들었으니 조금 맞지 않는 면도 있으나,)
보통의 Update는 Software의 새 버전이 나왔을 때 이루어진다. 기존 버전도
잘 동작하고 있었고, 이번 버전은 조금 더 발전된 기능을 제공할 것이다.  
그런데 Rollback은 다른 의미를 갖는다. 올렸는데 뭔가 잘못되었을 때, 즉
바른지 알았는데 바르지 않은 높은 곳에서 다시 바르고 낮은 곳으로 내려오는
것이 바로 Rollback이다.

이렇게 의미가 달라지게 되면, 그 두 작업에 대한 정책이 달라질 수 있다는
점을 짐작할 수 있다.

{:.point}
Update와 Rollback
: 의미의 차이 x 정책의 차이 + 구현의 차이

물론, 기능의 구현 관점에서 추가 옵션 없이 기억하고 있던 기존 상태로
전환하도록 설계한다는 차이도 있으나 오히려 이것은 차지하는 비중이 더
낮다고 생각한다.


### Rollback 실행하기

아무튼, 돌려보자. 명령은 간단하다.

```console
$ docker service rollback ping
ping
rollback: manually requested rollback 
overall progress: rolling back update: 1 out of 4 tasks 
1/4:
2/4: running
3/4:
4/4: ready
```

저렇게 막 돌고,

```console
$ docker service rollback ping
ping
rollback: manually requested rollback 
overall progress: rolling back update: 2 out of 4 tasks 
1/4:
2/4: running
3/4: ready
4/4: running
```

돌다가,

```console
$ docker service rollback ping
ping
rollback: manually requested rollback 
overall progress: rolling back update: 4 out of 4 tasks 
1/4: running
2/4: running
3/4: running
4/4: running
verify: Service converged 
$ 
```

끝났다.


### Rollback 과정의 이해

Rollback 과정은 Update의 과정과 유사하다.

```console
$ docker service ps ping 
ID           NAME       IMAGE         NODE  DESIRED STATE CURRENT STATE
v53qh0x20sqr ping.1     alpine:3.7    dev02 Running       Running 4 minutes ago
bs475pk4v6fn  \_ ping.1 alpine:latest dev02 Shutdown      Shutdown 4 minutes ago
9smre9xj8sbr ping.2     alpine:3.7    dev01 Running       Running 5 minutes ago
fsc7b7kjbrhh  \_ ping.2 alpine:latest dev01 Shutdown      Shutdown 5 minutes ago
7tmb2u56e9cj ping.3     alpine:latest dev01 Ready         Ready 10 seconds ago
xc36e6wuriz0  \_ ping.3 alpine:3.7    dev01 Shutdown      Running 10 seconds ago
7hf8vbfcopsd  \_ ping.3 alpine:latest dev01 Shutdown      Shutdown 4 minutes ago
uhm1s1p33lhk ping.4     alpine:3.7    dev02 Running       Running 4 minutes ago
izvqmhfx6r0l  \_ ping.4 alpine:latest dev02 Shutdown      Shutdown 4 minutes ago
$ 
```

Slot 3에서 돌고 있던 `xc36e6wuriz0`가 내려가는 중에 이 자리를 대신할
`7tmb2u56e9cj`가 준비를 마쳤고,

```console
$ docker service ps ping 
ID           NAME       IMAGE         NODE  DESIRED STATE CURRENT STATE
ji29qhjh21r8 ping.1     alpine:latest dev02 Running       Running 31 seconds ago
v53qh0x20sqr  \_ ping.1 alpine:3.7    dev02 Shutdown      Shutdown 32 seconds ago
bs475pk4v6fn  \_ ping.1 alpine:latest dev02 Shutdown      Shutdown 5 minutes ago
k207lyhsiah6 ping.2     alpine:latest dev01 Running       Running 44 seconds ago
9smre9xj8sbr  \_ ping.2 alpine:3.7    dev01 Shutdown      Shutdown 44 seconds ago
fsc7b7kjbrhh  \_ ping.2 alpine:latest dev01 Shutdown      Shutdown 6 minutes ago
7tmb2u56e9cj ping.3     alpine:latest dev01 Running       Running 56 seconds ago
xc36e6wuriz0  \_ ping.3 alpine:3.7    dev01 Shutdown      Shutdown 56 seconds ago
7hf8vbfcopsd  \_ ping.3 alpine:latest dev01 Shutdown      Shutdown 5 minutes ago
l6ejc4atkbok ping.4     alpine:latest dev02 Running       Running 19 seconds ago
uhm1s1p33lhk  \_ ping.4 alpine:3.7    dev02 Shutdown      Shutdown 20 seconds ago
izvqmhfx6r0l  \_ ping.4 alpine:latest dev02 Shutdown      Shutdown 5 minutes ago
$ 
```

그렇게 순차적으로 교대가 마무리되면 위와 같은 모습이 된다. 아... 이제
두 번에 걸친 정변의 역사가 남아서 목록이 좀 지저분해졌네...

### 질문: 이 기록은 얼마나 남아있을까?

Docker Engine의 Swarm 관련 정보를 확인하면, 다음과 같은 정보가 있다.

```console
$ docker info
<...>
Swarm: active
 NodeID: z9dj9cobdat235ou65kl0ztr3
 Is Manager: true
 ClusterID: kikdn5niy0hqrvz327rsxcqd6
 Managers: 3
 Nodes: 3
 Orchestration:
  Task History Retention Limit: 5
<...>
$ 
```

기본값이 5로 설정되어 있는 "Task History Retention Limit" 값에 의해 이
History의 보관 수량이 결정되는데, 저 5의 의미는 현재 설정을 포함한 값이다.

이 값은 아래와 같이 `swarm update` 명령을 통해 조절할 수 있다.

```console
$ docker swarm update --task-history-limit 3
Swarm updated.
$ 
$ docker info
<...>
Swarm: active
 NodeID: z9dj9cobdat235ou65kl0ztr3
 Is Manager: true
 ClusterID: kikdn5niy0hqrvz327rsxcqd6
 Managers: 3
 Nodes: 3
 Orchestration:
  Task History Retention Limit: 3
<...>
$ 
```

참고로, 이 값을 바꿨다고 해서, 이미 history를 가지고 있는 Service의 기존
이력이 바로 사라지지는 않는다. 다만, Update 명령을 실행할 때, 이 숫자보다
오래된 이력은 날려버리게 된다. 


## Node 유지보수를 위한 Drain

가끔은, Host 또는 Node의 관리가 필요할 때가 있다. 가령, Disk를 교체하여
더 빠른 Filesystem을 제공하고 싶다든지, 이유는 많다. 이렇게, Node를
대상으로 하는 작업이 있을 때, 해당 Node에서 실행되는 작업을 빼내야 할
필요가 있는데, 이럴 때 사용하는 설정이 Drain이다.

일단, 아래와 같이, 네 개의 복제본을 갖는 Service를 만들어보자.

{:.wrap}
```console
$ docker service create --name ping --replicas 4 alpine ping docker.com
medasdd1i4dj488pbcjmo2w4l
overall progress: 4 out of 4 tasks 
1/4: running
2/4: running
3/4: running
4/4: running
verify: Service converged 
$ 
```

정상적이라면, 아래와 같이 각각의 Node에 두 개의 Task가 할당되는 형태로
Task의 분배가 이루어졌을 것이다.

```console
$ docker service ps ping 
ID            NAME    IMAGE          NODE   DESIRED STATE CURRENT STATE
yjsmteaou7jr  ping.1  alpine:latest  dev01  Running       Running 44 seconds ago
s2ixq0tdype5  ping.2  alpine:latest  dev02  Running       Running 44 seconds ago
os70a979s74z  ping.3  alpine:latest  dev01  Running       Running 44 seconds ago
jl4xzd9uy1c8  ping.4  alpine:latest  dev02  Running       Running 44 seconds ago
$ 
```

또, Node의 상태를 보면, 아래와 같이 두 Node가 모두 Active 상태에 있는 것을
확인할 수 있다.

```console
$ docker node ls
ID                           HOSTNAME  STATUS  AVAILABILITY  MANAGER STATUS
z9dj9cobdat235ou65kl0ztr3 *  dev01     Ready   Active        Leader
y968agutlsuvzx7mvxpts3n01    dev02     Ready   Active
$ 
```


### 유지보수 모드 진입

이제 Worker이면서 두 개의 Task를 담고 있는 `dev02`의 가용성 상태를  Drain
상태로 전환해보자.  가용성 상태 전환은 아래와 같이, `docker node update`
명령에 `--availability` 옵션을 줘서 수행할 수 있다.

```console
$ docker node update --availability drain dev02
dev02
$ 
```

명령 수행 이후 노드 상태를 보면,

```console
$ docker node ls
ID                           HOSTNAME  STATUS  AVAILABILITY  MANAGER STATUS
z9dj9cobdat235ou65kl0ztr3 *  dev01     Ready   Active        Leader
y968agutlsuvzx7mvxpts3n01    dev02     Ready   Drain
$ 
```

상태가 변한 것을 확인할 수 있다. 그리고 이 때, Service 상태를 보면
아래와 같다.

{:.wrap}
```console
$ docker service ps ping
ID           NAME       IMAGE         NODE  DESIRED STATE CURRENT STATE
yjsmteaou7jr ping.1     alpine:latest dev01 Running       Running 10 minutes ago
g1viohm5a49h ping.2     alpine:latest dev01 Ready         Ready 8 seconds ago
s2ixq0tdype5  \_ ping.2 alpine:latest dev02 Shutdown      Running 8 seconds ago
os70a979s74z ping.3     alpine:latest dev01 Running       Running 10 minutes ago
vz0a908ns1j5 ping.4     alpine:latest dev01 Ready         Ready 8 seconds ago
jl4xzd9uy1c8  \_ ping.4 alpine:latest dev02 Shutdown      Running 8 seconds ago
$ 
```

아직 완료되지 않았지만, 위의 내용을 보면 `dev02`에 올라와 있던 Task
`s2ixq0tdype5`와 `jl4xzd9uy1c8`가 Shutdown 상태로 전환하고 있는 중이고,
각각이 담당하던 Slot 2과 4에 `g1viohm5a49h`, `vz0a908ns1j5`라는 ID를
가진 Task가 모두 `dev01` 위에서 업무를 준비하고 있는 것을 볼 수 있다.


### 유지보수 모드 해제

여전히 Worker 신분을 갖고 있지만 가용한 그룹에서 제외되었던 `dev02`를
다시 가용한 상태로 전환해보았다.

```console
$ docker node update --availability active dev02
dev02
$ 
```

하지만, 유지보수모드에 있던 Node를 다시 사용할 수 있도록 설정하다고 해서,
기존에 넘어갔던 Task가 돌아오지는 않는다.

```console
$ docker service ps ping
ID           NAME       IMAGE         NODE  DESIRED STATE CURRENT STATE
yjsmteaou7jr ping.1     alpine:latest dev01 Running       Running 14 minutes ago
g1viohm5a49h ping.2     alpine:latest dev01 Running       Running 3 minutes ago
s2ixq0tdype5  \_ ping.2 alpine:latest dev02 Shutdown      Shutdown 3 minutes ago
os70a979s74z ping.3     alpine:latest dev01 Running       Running 14 minutes ago
vz0a908ns1j5 ping.4     alpine:latest dev01 Running       Running 3 minutes ago
jl4xzd9uy1c8  \_ ping.4 alpine:latest dev02 Shutdown      Shutdown 3 minutes ago
$ 
```

Task에 대한 할당 또는 재할당은 Task의 새로운 할당, 장애 발생에 의한 재할당
두 경우에 한하여 발생하며, 가용성이 있는 Node가 새로 추가되거나 돌아왔다고
해서, 기존의 Task를 중단시켜가며 그걸 다시 배분하지는 않는다.

---

하이고... 길었다.

다음 이야기의 순서는 아직 정하지 못했는데, 조금 더 재미가 있는
[Docker Swarm의 고가용성]이 될 가능성이 크다!


{:.mix-xlarge}
> Happy Docking!!!




[Configure a service’s update behavior]:https://docs.docker.com/engine/swarm/services/#configure-a-services-update-behavior



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
* _Docker Swarm에 Service 올려보기_
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

