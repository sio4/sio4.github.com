---
title: "'쓸만한' Docker Image 만들기 - Part 1"
subtitle: Build an Usable Docker Image with Alpine Linux
tags: Docker Container cloud-computing Alpine
categories: ["cloudcomputing"]
image: /assets/logos/alpinelinux.org.jpg
banner: /assets/logos/alpinelinux.org.jpg
date: 2018-02-19T21:00:00+0900
---
설날 연휴가 시작되기 전, [Docker: 나의 첫 Docker Image]라는 글을 통해 아주
기본적인 Docker Image를 만들어서 그것을 기반으로 Container를 실행하는 예에
대한 글을 올렸다. 이번에는, 예시가 아닌 실제로 활용할 수 있는 Image를 만들고
그것을 Docker Registry에 등록하는 과정에 대하여 기록하려고 한다. 이 글에는
그 과정 중, Alpine Linux를 기반으로 Docker Image를 만드는 과정을 담았다.

{:.boxed}
> Docker에 대한 이 묶음글은 아직 몇 개를 쓸지 정하지 못했다. 써보고,...
> 
> * [Docker: Getting Started with Docker]
> * [Docker: Installation and Test Drive]
> * [Docker: 나의 첫 Docker Image]
> * _'쓸만한' Docker Image 만들기 - Part 1_



두 편으로 분리하여 작성한 이 글에서는, 먼저 내 업무 목적에 맞는 전용 Docker
Image를 기존 Image를 활용하여 만드는 방법에 대하여 설명하고, 그 다음은 이
방식을 활용하여 실제로 전용 Image를 만들고 그것을 Docker의 Public Registry에
등록하는 과정을 정리한다. (원래 지난 글의 목적이 바로 이것이었는데, 개념적인
부분을 완전히 생략하고 지나가는 것이 조금 꺼림직해서 간단하게 개념을 다루고
넘어간다는 것이 오히려 그것만을 담은 글로 마무리를 했었다.)

이번 글은 다음과 같은 내용을 다루려고 한다.

* TOC
{:toc}

목차와 같이, 기존 Image를 바탕으로 한 전용 Image 만들기와 함께, 부수적으로
Alpine Linux에 대한 이야기도 조금 자세히 참고할만한 수준으로 다루려고 한다.
(그리고 이와 연관된 더 재미있을 것 같은 이야기를 조금 더 깊이 다룰 기회를
만들 수 있기를 기대하고 있다. #TODO)



# '쓸만한' Docker Image 만들기

'불필요한' 수식어 같기도 한데, 지난 글 [Docker: 나의 첫 Docker Image]에서
만들었던 `hello`와 대조적으로 표현하려는 의도에서 '쓸만한' 이라는 수식어를
붙여봤다.

`hello`의 경우, Static하게 컴파일하여 라이브러리 의존성을 제거한 단 하나의
프로그램만을 담고 있기 때문에, 내가 만든 하나의 실행파일만을 `COPY`하는 것
만으로도 Image를 만들 수 있었다. 그러나 현실세계가 어디 그런가?  
그나마 내가 직접 Build한 단일 프로그램을 넣는 경우라면 유사한, 또는 거의
동일한 방식으로 Image를 만들 수 있다. 그러나 다음과 같은 상황에서는 완전히
의존성을 제거한 단일 파일만 넣은 Image는 만드는 것이 거의 불가능에 가깝다.

* 범용의 Application Package에 대한 Container화
* 범용의 Web Framework을 사용하는 Web Application의 Container화
* 범용의 Interpreter를 사용하는 Script로 작성된 Application의 Container화

범용 Application이나 Framework 등은 대체로 특정 시스템을 Target으로 한
미리 Compile된 Binary Package를 제공하게 되는데, 이런 경우 대부분의 경우에
해당 Target System에 대한 Library 의존성을 갖게 된다. **이렇게, 일반적인
Application을 Container화 하기 위해서는 Framework, Interpeter는 물론,
이들의 실행 의존성을 제공할 기반환경을 함께 Image에 담을 필요가 있다.**

물론, 범용의 Application Package의 경우에도, 해당 Application의 소스가
공개되어 있고 Static한 Build를 허용하고 있으면서 그 구성이 복잡하지 않다면,
해당 Package를 사용자가 직접 Static Build하여 단일 파일의 Container화가
가능하다. 하지만, _지금 이 작업의 목적이 Container 예술을 하려는 것은 아니고
최대한 간단하게 Application을 구동하기 위한 것이라면... 그것을 꾸미는 과정이
배보다 큰 배꼽일 수 있다._ (아, 그래, 난 가끔 그걸 즐기기도 한다는 것은 인정)

또, 경우에 따라서는 Package나 Framework 등의 공식/비공식 지원이나 문제
해결을 위해서는 Custom으로 Build한 것이 아닌 공식으로 배포되는 Package를
사용해야만 하는 경우도 생각할 수 있다. (아... 그렇다면 ISV나 Framework
제품의 제공자가 Static Build된 패키지를 제공하면 좋은데... :-)

아무튼, '쓸만한' Docker Image를 만들려면, `hello`와는 다른 접근이 필요하다.



## 기존 Image를 활용한 내 Image 만들기

계속 '의존성' 얘기를 하고 있는데, 이 문제를 해결하기 위해서는 내가 구동할
Application이 필요로하는 파일들을 찾아서 그것들을 이미지 안에 적당히, 잘,
넣어주면 된다. 

> 그렇게 해봤어?

아... 해봤다.  
`chroot`를 사용한 개발환경을 위해서, `chroot`를 활용한 격리된 운영환경을
위해서, 그리고 보다 원초적으로 특정 목적에 특화된 Linux 배포본을 만들기
위해서,... 꽤 많이 해봤다. 그리고... 그러나...
Container 사용자에게 이것을 권하고 싶지는 않다.

이 "생고생"을, 사용자에게 권하고 싶지 않은 마음은, 나만의 마음은 아닌 것
같다. 아마도 Docker의 개발자들도 동일한 마음인 것 같고, 그래서 그들은,
사용자가 **이미 존재하는 기반환경, 즉 "기존 Image"를 단순히 활용하거나,
혹은 사용자가 자신의 "기반 Image"를 하나 만들고 그것을 바탕으로 Application
층을 더하여 "쓸만한 Image"를 만드는 것을 지원**하고 있다.

### Alpine을 기반으로 하는 Dockerfile

다음은 앞선 글에서 `hello` 이미지를 만들기 위해 사용했던 `Dockerfile`이다.

```dockerfile
FROM scratch
COPY hello /
CMD ["/hello"]
```

이 절차서의 맨 첫 문장, `FROM scratch`는 말 그대로 "맨 땅에서 시작해서"라는
뜻이다. 맨 땅이 아닌 "이미 존재하는 기반환경", "기존 Image"에서 시작하려면
다음과 같이 바꿔볼 수 있다.

```dockerfile
FROM alpine:latest
COPY hello /
CMD ["/hello"]
```

위 `Dockerfile`의 첫 줄을 읽어보면, "`alpine:latest`로부터"인데, 읽기만
해도 "alpine 최종버전을 기초로 하여"라는 의미가 담겨있다는 것을 쉽게
유추할 수 있다. [Alpine]은 다시 조금 설명을 하겠지만, 클라우드 환경 등을
겨냥한 가벼운 Linux 배포판이다.

이제 `docker build` 명령으로 Image를 만들어보면,

```console
$ sudo docker build -t hello:alpine .
Sending build context to Docker daemon  2.147MB
Step 1/3 : FROM alpine:latest
latest: Pulling from library/alpine
ff3a5c916c92: Pull complete 
Digest: sha256:7df6db5aa61ae9480f52f0b3a06a140ab98d427f86d8d5de0bedab9b8df6b1c0
Status: Downloaded newer image for alpine:latest
 ---> 3fd9065eaf02
Step 2/3 : COPY hello /
 ---> d140643a81f9
Step 3/3 : CMD ["/hello"]
 ---> Running in 0221a654eefd
Removing intermediate container 0221a654eefd
 ---> a6f994885568
Successfully built a6f994885568
Successfully tagged hello:alpine
$ 
```

`FROM scratch` 버전의 `hello`와의 유일한 차이점은 첫 번째 단계이다. 앞선
글의 From scratch 버전의 빌드에서는 첫 번째 단계에서 아무런 일도 일어나지
않았었는데, 이번에는 `library/alpine`으로부터 이미 존재하는 Image를 받아오는
과정이 추가되었으며, 최종적으로 만들어진 Image의 크기도 기존의 약 800kB가
아닌 4MB의 큰 Image가 만들어진 것을 볼 수 있다.

위의 과정을 거치고 나면, 만드는 과정에서 내려받은 `alpine:latest`와, 새롭게
만들어진 `hello:alpine`이 Image 목록에 들어온 것을 확인할 수 있다.

{:.wrap}
```console
$ sudo docker image ls
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
hello               alpine              a6f994885568        16 seconds ago      4.16MB
alpine              latest              3fd9065eaf02        5 weeks ago         4.15MB
$ 
```

일단, 만들기는 잘 만들어졌다.


### 결과 확인

새로 만든 이미지가 잘 동작하는지 확인하자.

{:.wrap}
```console
$ sudo docker run hello:alpine
standard_init_linux.go:195: exec user process caused "no such file or directory"
$ 
```

어? 뭔가 문제가 있다. (오류메시지는 사용자 프로세스를 실행하는데 문제가 발생한
사실만 나타낼 뿐, 크게 도움이 되지는 않는다.)

따로 설명을 하지는 않았지만, 이제 Image에 기반환경을 넣는 방식을 확인하기
위한 과정이기 때문에, 앞서 Static하게 컴파일했던 `hello` 프로그램을 동적
링크로 다시 컴파일했었다. 그리고 이 문제는 Alpine 환경에서 이 동적 링크된
프로그램이 동작하는 것과 관련된 문제이다.



## Alpine Linux

이 문제를 이해하기 위해서는 [Alpine Linux]가 무엇인지에 대한 이해가 있어야
한다. **Alpine Linux는 Kernel을 제외했을 때 그 크기가 5MB가 채 되지 않는
매우 작은 크기의 리눅스 배포판**으로, 이렇게 작은 Disk Footprint를 만들기
위해서 [Busybox]와 [musl libc]를 사용하고 있다.

Busybox는 Embedded Linux에서는 거의 표준에 가깝게 사용되는 운영체계 수준의
Utility 모음이다. 하나의 Binary 안에 일반적으로 많이 사용되는 거의 모든
기본 Utility의 기능이 담겨있는 훌륭한 도구다. musl libc는 이번에 처음으로
알게 된 C library인데, 역시 경량으로 만든 표준 C Library이다.


참고로,  
Alpine Linux 홈페이지에는 다음과 같이 설명되어 있다.
(<https://alpinelinux.org>)

![](/assets/logos/alpinelinux.org.jpg){:.dropshadow.bordered}

> ##### Small. Simple. Secure.
> Alpine Linux is a security-oriented, lightweight Linux distribution based on musl libc and busybox.

> ##### About
> Alpine Linux is an independent, non-commercial, general purpose Linux distribution designed for power users who appreciate security, simplicity and resource efficiency.

그리고 Docker Store
<https://store.docker.com/images/alpine>
의 설명은 다음과 같다.

> Alpine Linux is a Linux distribution built around musl libc and BusyBox. The image is only 5 MB in size and has access to a package repository that is much more complete than other BusyBox based images. This makes Alpine Linux a great image base for utilities and even production applications. Read more about Alpine Linux here and you can see how their mantra fits in right at home with Docker images.

이 Alpine Linux의 Docker Image에 대한 자세한 설명은
[Alpine Linux Docker Image]에서 볼 수 있는데, 설명 중에는 다음과 같은
설명도 있다.

> ##### Motivations
> Docker images today are big. Usually much larger than they need to be. There are a lot of ways to make them smaller. But you need to start with a small base. There are great size savings to be had when compared to base images such as ubuntu, centos, and debian.


### 문제: "no such file or directory"

문제로 돌아가서, 오류메시지는 파일이나 디렉터리를 찾을 수 없다지만, 이쯤
되면 어떤 문제인지 짐작이 된다. 문제는 바로, `hello`를 **내 Laptop에서
동적으로 컴파일할 때 링크했던 glibc가 이 musl libc 기반의 Image 안에는
없다는 것!**

이 문제는 다음과 같은 방식으로 풀 수 있을 것 같다.

* 그냥 Static으로 간다 - 무슨 소리냐? 그걸 할 수 없는 상황을 위한 글이다!
* glibc 파일을 찾아서 Image 안에 `COPY` 한다. - 닥쳐라!
* Ubuntu 등, glibc를 사용하는 Image를 기반으로 이용하여 다시 만든다. :-(

사실, 의존성 지옥의 크기에 따라서 세 번째 방법이 훨씬 건강한 해법일 수도
있다. 그런데 오늘은 조금 다른 방법을 택해봤다.


## Alpine Linux + Glibc

언제나 느끼는 거지만, 나와 동일한 문제를 겪는 사람은 항상 존재하고, 또한
그 문제에 대한 해결책까지 만들어둔 사람이 꼭 한 사람 이상은 있는 것 같다.
이번 문제에 대해서는 [Vlad Frolov]라는 분이 그 분이다. Vlad는
[alpine-glibc]라는 사설 Image를 만들어 Docker Hub에 공개하고 있으며,
이와 함께 이를 기반으로 한 Oracle JDK8, Mono 등의 glibc 기반 Binary에
대한 Image 역시 만들어 배포하고 있다. ([Vlad Frolov @ Docker Hub])

> ##### Alpine GNU C library (glibc) Docker image
> This image is based on Alpine Linux image, which is only a 5MB image, and contains glibc to enable proprietary projects compiled against glibc (e.g. OracleJDK, Anaconda) work on Alpine.
> 
> This image includes some quirks to make glibc work side by side with musl libc (default in Alpine Linux). glibc packages for Alpine Linux are prepared by Sasha Gerrand and the releases are published in sgerrand/alpine-pkg-glibc github repo.

Alpine과 glibc를 엮어 Image를 만들어둔 이유도 동일하다. 그럼 이것을 기반으로
다시 만들어보자.

### Alpine-Glibc를 기반으로 하는 Dockerfile

역시 맨 첫줄만 바꿔주면 된다. 나중에 다시 얘기할 기회가 있겠지만, 기반이될
Image의 Repository를 기술하는 방식이 조금 다르다. (길어졌다.)

```dockerfile
FROM frolvlad/alpine-glibc:alpine-3.7_glibc-2.26
COPY hello /
CMD ["/hello"]
```

그리고 이 Dockerfile을 이용하여 `hello`를 위한 Image를 다시 만든다. (비교를
위해, 아까 사용한 `alpine` 대신 `alpine-glibc`라는 Tag를 붙였다.)

```console
$ sudo docker build -t hello:alpine-glibc .
Sending build context to Docker daemon  2.147MB
Step 1/3 : FROM frolvlad/alpine-glibc:alpine-3.7_glibc-2.26
alpine-3.7_glibc-2.26: Pulling from frolvlad/alpine-glibc
ff3a5c916c92: Already exists 
bbbde91ec291: Pull complete 
Digest: sha256:520d147d6d7f00d8b58272ef934beebff8168ec18d66e77d9f2ace1836af2d45
Status: Downloaded newer image for frolvlad/alpine-glibc:alpine-3.7_glibc-2.26
 ---> eefdec609078
Step 2/3 : COPY hello /
 ---> 162a441c0759
Step 3/3 : CMD ["/hello"]
 ---> Running in b801779fcc25
Removing intermediate container b801779fcc25
 ---> 655f85100017
Successfully built 655f85100017
Successfully tagged hello:alpine-glibc
$ 
```

첫 번째 단계의 출력을 자세히 보면, `ff3a5c916c92`라는 ID는 이미 존재한다는
메시지가 있다. 이 `alpine-glibc` 역시, 아까 우리가 사용했던 `alpine`의
`latest`인 `3.7` 버전을 사용하고 있기 때문에 직전의 `alpine`을 이용하여
Image를 만드는 과정에서 받아온 Image를 그대로 사용하게 된다. 이처럼, 다른
Image를 위해서라도 동일한 Hash의 Image가 Host 상에 존재한다면, 그것을 다시
받지 않고 재활용하게 된다. (어차피 중첩된 형태의 구조니까.)

참고로,  
이 `alpine-glibc` Image는 다음과 같은 Dockerfile을 사용하고 있다.

```dockerfile
FROM alpine:3.7

ENV LANG=C.UTF-8

# Here we install GNU libc (aka glibc) and set C.UTF-8 locale as default.

RUN ALPINE_GLIBC_BASE_URL="https://github.com/sgerrand/alpine-pkg-glibc/releases/download" && \
    ALPINE_GLIBC_PACKAGE_VERSION="2.27-r0" && \
    ALPINE_GLIBC_BASE_PACKAGE_FILENAME="glibc-$ALPINE_GLIBC_PACKAGE_VERSION.apk" && \
    ALPINE_GLIBC_BIN_PACKAGE_FILENAME="glibc-bin-$ALPINE_GLIBC_PACKAGE_VERSION.apk" && \
    ALPINE_GLIBC_I18N_PACKAGE_FILENAME="glibc-i18n-$ALPINE_GLIBC_PACKAGE_VERSION.apk" && \
    apk add --no-cache --virtual=.build-dependencies wget ca-certificates && \
    wget \
        "https://raw.githubusercontent.com/sgerrand/alpine-pkg-glibc/master/sgerrand.rsa.pub" \
        -O "/etc/apk/keys/sgerrand.rsa.pub" && \
    wget \
        "$ALPINE_GLIBC_BASE_URL/$ALPINE_GLIBC_PACKAGE_VERSION/$ALPINE_GLIBC_BASE_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_BASE_URL/$ALPINE_GLIBC_PACKAGE_VERSION/$ALPINE_GLIBC_BIN_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_BASE_URL/$ALPINE_GLIBC_PACKAGE_VERSION/$ALPINE_GLIBC_I18N_PACKAGE_FILENAME" && \
    apk add --no-cache \
        "$ALPINE_GLIBC_BASE_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_BIN_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_I18N_PACKAGE_FILENAME" && \
    \
    rm "/etc/apk/keys/sgerrand.rsa.pub" && \
    /usr/glibc-compat/bin/localedef --force --inputfile POSIX --charmap UTF-8 "$LANG" || true && \
    echo "export LANG=$LANG" > /etc/profile.d/locale.sh && \
    \
    apk del glibc-i18n && \
    \
    rm "/root/.wget-hsts" && \
    apk del .build-dependencies && \
    rm \
        "$ALPINE_GLIBC_BASE_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_BIN_PACKAGE_FILENAME" \
        "$ALPINE_GLIBC_I18N_PACKAGE_FILENAME"
```


### 결과 확인

다시 내 얘기로 돌아와서, 새로 만든 glibc 기반의 Alpine을 사용하는 Image를
이용하여 만든 Image로 Container를 돌려보자.

```console
$ sudo docker run hello:alpine-glibc
hello from docker container
$ 
```

원했던 그대로 잘 동작한다. 그리고, 이 상태에서 Host에 저장되어 있는
Image의 목록을 보면 다음과 같다.

{:.wrap}
```console
$ sudo docker image ls
REPOSITORY              TAG                     IMAGE ID            CREATED             SIZE
hello                   alpine-glibc            655f85100017        3 minutes ago       10.9MB
hello                   alpine                  a6f994885568        5 minutes ago       4.16MB
frolvlad/alpine-glibc   alpine-3.7_glibc-2.26   eefdec609078        11 days ago         10.9MB
alpine                  latest                  3fd9065eaf02        5 weeks ago         4.15MB
$ 
```

원래의 `alpine`이 4MB가 조금 넘는 크기인데 비해, `glibc`를 함께 탑재한
`alpine-glibc`는 약 11MB의 크기를 차지한다. 동시에, 각각을 기반으로 만든
Image 들 역시 유사한 크기를 갖는다.

원래의 Alpine에 비해서는 크기가 두 배로 커졌지만, 그나마 11MB의 크기는
Ubuntu의 112MB 크기에 비하면 여전히 1/10의 작은 크기 만으로 거의 동일한
실행환경을 제공하게 된다. (물론, 조금 복잡했다. 인정.)

그리고, 이렇게 만든 환경은, 결과적으로 두 버전의 C Library를 모두 탑재하게
되는데, 이로 인하여 조금 다른 각도의 잇점을 갖게 된다. 이 이야기는 다음
기회에...



---


### 함께 읽기

이 묶음글은 아직 몇 회까지 쓸지 정하지 못했다.

* [Docker: Getting Started with Docker]
* [Docker: Installation and Test Drive]
* [Docker: 나의 첫 Docker Image]
* _'쓸만한' Docker Image 만들기 - Part 1_

['쓸만한' Docker Image 만들기 - Part 1]:{% link _posts/cloudcomputing/2018-02-19-build-usable-docker-image-part1.md %}
[Docker: 나의 첫 Docker Image]:{% link _posts/cloudcomputing/2018-02-14-build-my-first-docker-image.md %}
[Docker: Installation and Test Drive]:{% link _posts/cloudcomputing/2018-02-08-docker-installation-and-test-drive.md %}
[Docker: Getting Started with Docker]:{% link _posts/cloudcomputing/2018-02-08-getting-started-with-docker.md %}

[Alpine]:https://alpinelinux.org
[Alpine Linux]:https://alpinelinux.org
[Alpine Linux Docker Image]:<http://gliderlabs.viewdocs.io/docker-alpine/
[Busybox]:https://busybox.net/
[musl libc]:http://www.musl-libc.org/

[Vlad Frolov]:https://github.com/frol
[Vlad Frolov @ Docker Hub]:https://hub.docker.com/u/frolvlad/
[alpine-glibc]:https://hub.docker.com/r/frolvlad/alpine-glibc/

