---
title: "Docker Cloud에서 자동빌드하기"
subtitle: Setting Automated Build on Docker Cloud
tags: ["Docker", "Container", "Github", "cloud-computing"]
categories: ["cloudcomputing"]
image: /attachments/docker/docker-cloud.automated-build.png
banner: /attachments/docker/docker-cloud.automated-build.png
date: 2018-02-21T17:30:00+0900
last_modified_at: 2018-03-09T13:16:00+0900
---
"['쓸만한' Docker Image 만들기 - Part 2]"에서 Docker Cloud에 Image를 올리는
과정에 대해서 정리하면서, Docker Hub, Docker Cloud 등의 화면을 잠깐 봤다.
떡 본 김에 제사 지낸다고, Docker Cloud에 Image를 올린 김에 Docker Cloud가
제공하는 자동빌드 서비스를 한 번 써봤다. 이 글은, Github의 특정 저장소에
Commit이 일어나면, 이에 반응하여 Docker Image를 자동으로 만들어내도록
설정하는 과정에 대하여 정리한다.


> Docker에 대한 이 묶음글은 아직 몇 개를 쓸지 정하지 못했다. 써보고,...

* [Docker: Getting Started with Docker]
* [Docker: Installation and Test Drive]
* [Docker: 나의 첫 Docker Image]
* ['쓸만한' Docker Image 만들기 - Part 1]
* ['쓸만한' Docker Image 만들기 - Part 2]
* _Docker Cloud에서 자동빌드하기_
* [Docker Machine으로 Docker Node 뿌리기]
* [Docker Machine 다시 보기]
* [Getting Started with Docker Swarm]
* [Docker Swarm에 Service 올려보기]
* [Docker Swarm의 고가용성]
* [Docker Swarm 다시 보기]

이 글은, **Github의 특정 저장소에 Commit이 일어나면, 이에 반응하여 Docker
Image를 자동으로 만들어내도록 설정하는 과정**에 대해서 설명한다. 대부분의
설명은 아마 Screenshot이 해줄 것 같고, 아마도 그림으로 도배가 된 글이 될
것 같다.


# Docker Cloud

기존의 [Docker Hub]가 Docker Repository 및 Registry 서비스를 제공했었다면,
[Docker Cloud]는 이것을 조금 더 확장하여 간소하게나마 서비스 배포 프로세스
전체를 자동화할 수 있는 기능을 제공하고 있다. 그림은 Docker Cloud의 메뉴를
캡쳐한 것인데, 크게 BUILD, APPLICATIONS, INFRASTRUCTURE라는 범주로 나눠져
있다.

궁극적으로 서비스와, 연관된 서비스의 집합을 의미하는 Stack, 그리고 각각의
서비스를 구동할 Container 등을 APPLICATIONS으로 분류하고 있으며, 이를 위한
Image를 저장하는 공간인 Repository는 BUILD 아래에, 그리고 Container가 실제
구동되기 위한 Cloud Node 및 Cluster를 INFRASTRUCTURE 아래에 두고 있다.

지난 글에서 사용자의 Image를 만들어 공중 Registry에 등록하는 과정에 대해
정리했는데, 이 때 Image가 올라간 Repository가 바로 이 BUILD 범주 안의
Repository이다. 이 글에서 다루려 하는 Image 빌드 자동화 기능은 바로 이
부분에서 제공하는 기능이다.

![](/attachments/docker/docker-cloud.00.side-menu.png)


---


# Docker Cloud, Automated Build

Docker Cloud에서 제공하는 Automated Build, 자동빌드 기능의 개념은 다음과
같다.

1. 사용자는 Github 또는 Bitbucket 계정과 Docker ID를 가지고 있어야 한다.
1. Docker Cloud에서 자동빌드 환경설정을 완료한다.
1. Docker Cloud와 연결된 Git Repository에 자신의 소스를 Commit한다.
1. Github 등은 Commit에 대한 Hook으로 Docker Cloud를 호출한다.
1. Docker Cloud는 새로운 Commit을 긁어오고, Dockerfile을 이용해 빌드를 진행한다.
1. 빌드가 완료되면 새 Image가 Docker Cloud의 Repository에 등록된다.

Github 등의 Commit에 대한 Hooking은 이미 CI/CD를 비롯해서 다양한 목적으로
널리 사용되는 기능이며, Docker Cloud는 이 기능을 활용하여 Image Build를
자동화함으로써, 사용자가 수동으로 `docker push`를 해야하는 번거로움을
줄여주는 것이다.

이미 Github에 계정이 있다는 가정 하에, 다음 절에서는 Github와 Docker Cloud를
엮어서 자동빌드 환경을 구성하는 방법을 설명한다.



## 자동빌드 환경설정

먼저, 앞서 설명한 바와 같이, Github나 Bitbucket의 계정을 자신의 Docker ID와
연결해야 한다. Docker Cloud의 SETTINGS 범주 아래에 Cloud Settings라는 메뉴를
클릭하면 아래와 같은 화면을 만나게 된다. Cloud Settings 아래에는 General,
Cloud Providers, Source Providers, Notifications 등의 다양한 메뉴가 있는데,
이 중 Github와의 연결은 Source Providers 아래에 위치해 있다.

![.dropshadow](/attachments/docker/docker-cloud.30.source-providers.png)

위의 그림에서 (행동의 Icon이 아닌 상태의 Icon이라서 내겐 조금 직관적이지
않지만,) 플러그에 취소선이 그어져 있는 Icon을 누르면 연결을 진행하게 된다.
보통은 로그인 창으로 넘어가겠지만, 나는 이미 웹브라우져가 Github에 로그인
되어있는 상태라서 바로 아래의 인증(Authorize) 화면으로 이동하였다.

![.dropshadow](/attachments/docker/docker-cloud.30.source-providers-github.png)

인증화면에는, 먼저 인증 요청자가 누구인지와 원하는 정보가 어디까지인지가
표시된다. Docker Cloud는 Private 및 Public 저장소에 대한 접근권한을
요청하고 있으며, 내가 속한 조직(Organizaion)에 대해서는 개별적으로 Grant
여부를 설정할 수 있다. (이 부분의 세부 사항은 Github의 기능임)

위의 과정은 두 서비스의 계정 간 인증을 엮어주는 부분이고, 이제 기능적인
설정을 할 차례다. 이렇게 Github에 연결된 상태에서 자동빌드를 원하는 Docker
Repository의 Builds 메뉴에 가면, 아래와 같은 환영 메시지를 볼 수 있다.

![.dropshadow](/attachments/docker/docker-cloud.30.build.connected.png)

모든 `git push` 마다 자동빌드가 실행된다고 써있고, 그 아래에는 Github가
이미 연결된 상태임과 Bitbucket은 연결되지 않았음을 표시하고 있다.

이 화면의 오른쪽 상단에 위치한 "Configure Automated Builds" 버튼을 눌러
설정 화면으로 넘어가면 아래와 같이 SOURCE REPOSITORY를 설정하라는 창이
등장한다.

![.dropshadow](/attachments/docker/docker-cloud.31.builds.config-1.png)

연결한 Github 계정과 저장소를 선택해주면, 아래와 같이 자세한 설정을 위한
화면이 나타난다. (앞서 조직에 대해서도 Grant를 했다면 계정 외에도 해당
조직의 이름도 나타나게 된다.)

![.dropshadow](/attachments/docker/docker-cloud.31.builds.config-2.png)

추가 설정 내용을 보면,

* 내가 설정한 Node가 있을 경우, 자동빌드를 위해 그 기계를 사용하도록
  설정하거나, Docker Cloud 가 제공하는 서비를 선택할 수 있다.
  써보니 Docker Cloud가 제공하는 기계는 성능이 좋지 않은 것 같지만, 뭐
  크게 상관이 없다.
* 빌드에 사용할 DOCKER VERSION을 선택할 수 있다. Stable 또는 Edge.
* AUTOTEST 여부를 선택할 수 있는데, 나는 무시. Off
* 그리고 가장 중요한, BUILD RULES을 설정하는 부분이 있고, 설정이 어렵게
  느껴질 경우 참고할 수 있도록 "View example build rules" 가 보인다.

여기서 주의할 부분은 BUILD RULES의 행 구성이다. 아래에 그림을 다시 넣고
색으로 강조를 해봤다.

![.dropshadow](/attachments/docker/docker-cloud.31.builds.config-context.png)

원래는 `Dockerfile`이라는 기본값으로 설정되어 있는 "Dockerfile location"이
먼저 나와 있고, 그 뒤에 `/`를 기본값으로 하는 "Build Context"가 있다.
해석하면, Git 저장소의 `/`에 `Dockerfile`이 있을 경우에 그것을 참고하겠다는
말인데, 표현하자면, Docker Cloud는 다음 위치에서 `Dockerfile`을 찾겠다는
뜻이다.

* 개념: `/<Build Context>/<Dockerfile location>`
* 기본: `/Dockerfile`

그런데, 내 경우는 설정한 저장소가 아래와 같은 디렉터리 계층구조를 갖는다.

```console
$ tree 
.
├── README.md
├── golang
│   ├── 1.9
│   │   └── Dockerfile
│   └── README.md
├── hello
│   └── 1.0
│       ├── Dockerfile
│       ├── hello
│       ├── hello.c
│       └── makefile
└── redis

5 directories, 7 files
$ 
```

특정 소프트웨어를 위한 저장소라면 일반적으로 `Dockerfile`이 `/`에 위치할
것이다. 기본값으로 표시되는 것과 동일한 것이다.  그러나 내 저장소는 특정
소프트웨어를 위한 공간이 아니고 다양한 `Dockerfile`을 담기 위한 Docker
전용 공간이다 보니, 위와 같이 Image 이름과 버전을 계층적으로 나열하고 그
안에 `Dockerfile`을 넣어 두었다. (이 구조는 Docker의 공식 Library를 본땄다.)

그래서, 처음에는 간단하게 Dockerfile location은 그대로 유지한 채, Build
Context를 `/golang/1.9`로 설정했었다. 그랬더니... Image Build와 함께
이루어지는 웹페이지 상의 Description Update가 `/`의 `README.md`를 기준으로
되어버렸다.

Docker Cloud의 자동빌드는, 빌드가 정상적으로 완료될 경우, Build Context에
위치한 `README.md`를 이용하여 웹페이지의 설명을 업데이트한다. 하지만, 이
파일이 없을 경우, `/` 아래에 위치한 `README.md`를 사용하게 된다. 이러한
습성에 따라 위와 같이 Build Context를 `/golang`으로 잡아주고, Dockerfile
location을 `1.9/Dockerfile`로 잡아주면 내가 원하는 `README.md`를 잡아가게
된다.

주의 / TODO
: Build Context는 아마도, `docker build`가 실행되는 경로를 얘기하는 것
  같다. 따라서, `Dockerfile` 내에 `COPY` 등이 있을 경우, 위와 같이 설정하면
  원하지 않는 결과가 될 수도 있다! ...는 느낌적 느낌!
: 이와 관련된, 자동화를 위한 약속들은 다시 확인이 필요하다.

아무튼, 이상의 과정을 잘 맞췄다면, Docker Cloud는 Github에 아래와 같이
Deply Key를 하나 등록하게 된다.

![.dropshadow](/attachments/docker/docker-cloud.31.builds.config-key.png)

이제 빌드가 잘 되는지 확인할 차례!



## 자동빌드 확인하기

설정에서 빠져나와 다시 Builds로 돌아가면, 이번에는 환영 메시지 대신 아래와
같은 Build 상황판이 나타난다.

![.dropshadow](/attachments/docker/docker-cloud.32.builds.activity.png)

화면에는, 시작적으로 Build 현황을 표시하는 Build Activity, 설정된 빌드 구성을
확인할 수 있는 Automated Builds, 그리고 근래의 작업 이력을 표시하는 Recent
Builds로 구성되어 있다. Recent Builds의 회색 Icon은 취소를, 빨간 Icon은 실패,
연한 청녹색 Icon은 성공을 나타낸다.

각 제목줄을 클릭하고 들어가면 Build Job의 세부사항을 확인할 수 있는데,
아래의 예는 작업이 시작되지 않은 채 `PENDING` 중인 경우를 나타낸다.
(Docker Cloud는 무료 사용자에 대하여 동시 Build의 수량 등을 제한하고
있어서, 수동 Build를 여러 번 실행하거나 Commit/Push가 많을 경우에는
아래와 같이 `PENDING`이 발생할 수 있다.)

![.dropshadow](/attachments/docker/docker-cloud.33.builds.pending.png)

대기중이던 Job이 실행으로 들어가면 아래와 같은 파란색 Icon으로 변하면서
Job이 실행중, `IN PROGRESS` 임을 나타내게 된다. 그리고 추가로, 이 Build에서
사용하는 `Dockerfile`을 확인할 수도 있고, 실시간 로그도 볼 수 있다.

![.dropshadow](/attachments/docker/docker-cloud.34.builds.in-progress.png)

이렇게 한참을 진행하다가 (무료 인프라라서 그런지 꽤 느리다.) 뭔가 문제가
발생하면 아래와 같이 `FAILED` 상태가 될 수 있다. 작업이 실패한 이유 등은
로그에서 확인이 가능하고, 오른쪽 위의 재실행 버튼을 눌러 다시 Build를
실행할 수도 있다.

![.dropshadow](/attachments/docker/docker-cloud.36.builds.failed.png)

최종적으로 작업이 정상적으로 마무리되면, 아래와 같이 `SUCCESS` 상태가 된다.
화면을 보니 이 Build에 3분이 걸렸다고 하는데... Local Build가 40초 근처에서
완료되는 것에 비하면 네 배 정도 시간이 더 걸린 샘이다. 무료 서비스에서 많은
것을 욕심내면 안 된다.

![.dropshadow](/attachments/docker/docker-cloud.35.builds.success.png)

하지만 그나마 다행인 것은, Build 시 Cache를 사용할 수 있다는 점인데(기능
자체는 Local에서도 동일하긴 하다) 아래와 같이, 동일한 내용은 "Using cache"로
처리가 되며 맨 아래 줄에서 볼 수 있듯이 Build 시간이 1분 정도로 줄어들었다.

이런 면에서는, 나처럼 Layer를 줄이겠다고 `RUN`을 하나로 줄이기 보다는 `RUN`을
각 주요 단계별로 쪼개는 것이 유리하긴 하겠다. 이것은 마치 `Makefile`이 갱신된
소스만 다시 Compile하는 것과 동일한 구조인데, 아마도... 파일명을 `Dockerfile`
이라고 지은 것도 그렇고, 아마 개발자가 나처럼 `make`를 좋아하는 것 같다.

![.dropshadow](/attachments/docker/docker-cloud.37.builds.cached.png)

이렇게 Build된 이력은 Builds 페이지 뿐만 아니라 그 옆의 Timeline에서도 확인이
가능하다. (아마 분리되어 있는 것을 보면, 여기에는 뭔가 더 많은 이벤트가, 예를
들어 배포 현황이랄지... 표현되기도 하는 것이 아닐까 생각한다.)

![.dropshadow](/attachments/docker/docker-cloud.40.timeline-brief.png)

각 이벤트는 아래와 같이 자세히 볼 수도 있다.

![.dropshadow](/attachments/docker/docker-cloud.40.timeline-detail.png)

아! 그런데 이것도 TravisCI의 Build 이력이 그랬던 것처럼, 지나간 이력을
지우는 기능이 없다. ㅠ.ㅠ



## 정리

이렇게, 자동빌드를 구성하고 실행해봤다. 그리고 Repository의 첫 페지지에
돌아와보면, 아래와 같은 화면을 볼 수 있다.

![.dropshadow](/attachments/docker/docker-cloud.10.general-1.png)


전에 비어있던 "Recent builds"가 채워져 있고, `latest` Tag의 Image는 새로
Build된 것으로 표시되어 있고, 마지막으로 맨 아래 "ReadMe" 부분은 내가
손으로 썼던 것이 사라지고 Git 저장소의 `README.md` 내용으로 교체되어
있다!

---

내용은 별로 없는데 그림이 많아서 Scroll이 좀 많은 글이 되었는데,
떡 본 김에 제사 지낸 Docker Cloud의 자동빌드 설정은 이 정도로 소화가
된 것 같다.

한 가지 궁금한 점은, 기존의 [Docker Hub]에 있었던 Webhooks이 사라진
것인데, 아마 Repository가 아닌 다른 메뉴 아래로 숨어들어간 것은 아닌지...
사실, Build를 자동화했다면 그 다음 Step에 대해서도 뭔가가 필요할텐데
말이다...

> 아무튼, Docker Cloud! 이거 쓸만하다?


> #### 공식문서
> * [Docker Cloud > Manage builds and images > Automated builds](https://docs.docker.com/docker-cloud/builds/automated-build/)
> * [Docker Hub > Automated builds](https://docs.docker.com/docker-hub/builds/)
> * [Docker Hub > Webhooks for automated builds](https://docs.docker.com/docker-hub/webhooks/)


[Docker Hub]:https://hub.docker.com/
[Docker Store]:https://store.docker.com/
[Docker Cloud]:https://cloud.docker.com/


### 함께 읽기

이 묶음글은 아직 몇 회까지 쓸지 정하지 못했다.

* [Docker: Getting Started with Docker]
* [Docker: Installation and Test Drive]
* [Docker: 나의 첫 Docker Image]
* ['쓸만한' Docker Image 만들기 - Part 1]
* ['쓸만한' Docker Image 만들기 - Part 2]
* _Docker Cloud에서 자동빌드하기_
* [Docker Machine으로 Docker Node 뿌리기]
* [Docker Machine 다시 보기]
* [Getting Started with Docker Swarm]
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

