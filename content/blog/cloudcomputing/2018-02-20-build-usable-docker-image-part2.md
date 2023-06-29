---
title: "'쓸만한' Docker Image 만들기 - Part 2"
subtitle: Build and Push a Docker Image For Go Development
tags: ["Docker", "Container", "golang", "cloud-computing"]
categories: ["cloudcomputing"]
image: /attachments/docker/docker-cloud-banner.png
banner: /attachments/docker/go-alpine-docker.png
date: 2018-02-20T23:00:00+0900
last_modified_at: 2018-03-09T13:16:00+0900
---
"Hello World 급" Image 작성을 맛봤던 "[Docker: 나의 첫 Docker Image]", 그리고
Alpine Linux를 활용하여 C Library를 포함한 "운영체계급" 기반 Image를 만들었던
['쓸만한' Docker Image 만들기 - Part 1]에 이어, 이번에는 실제 사용을 고려한
Go 언어 개발환경을 위한 Docker Image를 만들고 그것을 Registry에 등록하는
과정을 정리한다.


> Docker에 대한 이 묶음글은 아직 몇 개를 쓸지 정하지 못했다. 써보고,...

* [Docker: Getting Started with Docker]
* [Docker: Installation and Test Drive]
* [Docker: 나의 첫 Docker Image]
* ['쓸만한' Docker Image 만들기 - Part 1]
* _'쓸만한' Docker Image 만들기 - Part 2_
* [Docker Cloud에서 자동빌드하기]
* [Docker Machine으로 Docker Node 뿌리기]
* [Docker Machine 다시 보기]
* [Getting Started with Docker Swarm]
* [Docker Swarm에 Service 올려보기]
* [Docker Swarm의 고가용성]
* [Docker Swarm 다시 보기]

이 글은, 바로 앞선 글은 ['쓸만한' Docker Image 만들기 - Part 1]의 연장선에
위에 있는 글로, 거기서 사용했던 Image 작성 방식을 활용하게 된다.

이 글에서는 다음과 같은 내용을 다룬다. 조금 길어질 것 같다.



# Go 개발환경을 위한 Docker Image

이 글에서 시도해볼 내용은, Go 언어로 프로그램을 개발하기 위한 환경을 Docker
Image로 만들고 그것을 본으로 한 Container에서 개발을 진행할 수 있도록 환경을
만드는 것이다. (IDE 또는 개발자 환경이기 보다는 Build 환경에 가깝다.)

Container 하면 격리된 운영환경을 떠올리기가 쉽지만, 꼭 운영환경을 위해서만
Container 기술을 사용하는 것은 아니다. Application의 개발환경을 Container로
만들어두면 다음과 같은 이점을 얻을 수 있다.

* 운영환경과 동일한 환경에서 개발을 진행할 수 있고, 개발환경을 그대로 들어나
  운영으로 넘길 수 있다. ("어? 내 PC에서는 잘 실행되는데 왜 서버에 가면 안
  되지?" 라고 말할 일이 없어진다.)
* 내 컴퓨터의 OS나 환경이 업그레이드되어도, 기존 개발환경을 유지하여 사용할
  수 있다. 동일한 효과를 위해 가상화 기술을 쓸 수도 있으나 보다 단소하다. 
* 서로 다른 개발환경을 사용하는 둘 이상의 프로젝트를 동시에 수행할 수 있다.
  능력만 된다면.
* 만든 지 1년이 넘은 구닥다리 Application을 유지보수할 때, 희미해진 기억
  속의 환경에 대한 고민이 사라진다.

프로젝트 단위로, 치고 빠지는 개발을 주로 해왔다면 별로 중요하지 않게 느낄
수도 있다. 그런데 프로덕트를 끌고 나갔던 경험이 있다면 아마도 이게 얼마나
큰 힘이 되는지 느낄 수 있을 것이라고 생각한다.



## FROM Alpine Glibc

Go 개발환경을 위한 Docker Image는 이미 [Official Docker Image for Golang]에
공식으로 올라와 있다. 뿐만 아니라, 커뮤니티 버전도 수천 개에 이른다. (사실,
수천에 이르고 나면 그 중 내 맘에 맞는 것이 뭔지 찾을 수도 없다.) 그런데 왜
거기에 하나를 더하려 할까?

공식 이미지 저장소에는 몇 가지 버전이 있는데, 예를 들면 다음과 같다.

| Tag             |  OS   |  Arch  | Base         | Image Size | Merged |
|-----------------|:-----:|:------:|:------------:|-----------:|-------:|
| 1.9.4-alpine3.7 | Linux | x86-64 | Alpine 3.7   |      83 MB | 269 MB |
| 1.9.4-stretch   | Linux | x86-64 | Debian 9     |     274 MB | 735 MB |

크기가 83MB 밖에 되지 않는 첫 번째는 앞서 살펴봤던 Alpine Linux에 기반한
아주 날씬한 버전인데, 이 버전은 Go의 소스를 받아서 Alpine 안에서 빌드하는
방식으로 만들어진 것이다. `stretch` Tag가 붙은 두 번째 이미지는 Debian 9,
코드명 Stretch에 기반한 것으로, Go 공식 다운로드 페이지에서 제공하는 공식
Binary를 받아서 압축을 해제하는 방식으로 만들어진 것이다.  
그래서, 앞선 글 "['쓸만한' Docker Image 만들기 - Part 1]"에서 강조했던
바와 같이, *musl libc를 사용하는 Alpine 기반의 Image에서는 glibc에 기반한
공식 Binary를 사용할 수 없고, 반대로 glibc에 기반한 Stretch에서는 이 공식
Binary가 잘 동작하지만 Image의 크기가 3배나 커졌다.*

이러한 만들어진 방식의 차이에 의해, 만약 어떤 Go 프로그램을 `stretch`
버전의 개발환경에서 Compile하게 되면, 그 결과물 역시 glibc에 링크가 되어
그 Binary를 동작시키기 위해서는 운영환경도 glibc 기반의 환경을 사용해야
한다. (Static으로 Compile되지 않은, 외부 Library에 의존성이 있는 경우에
대한 얘기다.)
반대로, `alpine3.7` Tag가 붙은 개발환경을 사용할 경우, 그 결과물은 musl
libc 전용이 되므로 운영환경을 경량화하기 쉽지만, 이 경우, Go 홈페이지의
공식 배포 버전을 사용할 수가 없다.

이 글에서는, 이 두 환경에서 탐나는 부분을 모두 취하여, 컴파일러는 공식
사이트에서 제공하는 버전을 있는 그대로 쓰고, 동시에 이 컴파일러로 빌드한
결과물은 Alpine 기반의 경량 운영환경에서 구동할 수 있도록 musl libc에
링크하도록 도와주는 일종의 Cross Compile 환경을 만들어볼 것이다.


### Dockerfile & Build

일단 만들어보자. 아래 `Dockerfile`을 보면 내용은 간단하다. 앞선 예제와 같이,
기반으로 `frolvlad/alpine-glibc`를 사용하도록 지정했고, 그 안에 `git`을
설치하고, Go를 받아서 풀어준 후, 나중에 각종 소스 등이 들어갈 공간을 마련해
주는 것이 전부다.

```dockerfile
FROM frolvlad/alpine-glibc:alpine-3.7_glibc-2.26

ENV GO_VER 1.9.4
ENV GO_OS linux
ENV GO_ARCH amd64

ENV PATH $GOPATH/bin:/opt/go/bin:$PATH
ENV GOPATH /go

RUN mkdir -p $GOPATH/src $GOPATH/bin
RUN apk add --no-cache ca-certificates
RUN apk add --no-cache git
RUN mkdir -p /opt
RUN wget -q -O - https://dl.google.com/go/go$GO_VER.$GO_OS-$GO_ARCH.tar.gz \
        | tar -C /opt/ -zxf -

WORKDIR $GOPATH
```

참고로, 공식 Image를 만드는 `Dockerfile`은 다음 URL에서 확인 가능하다.

* [docker-library/golang/1.9/stretch/Dockerfile]
* [docker-library/golang/1.9/alpine3.7/Dockerfile]

`docker build` 명령을 사용해서 위의 `Dockerfile`을 이용한 Image를 만든다.

```console
$ sudo docker build -t golang:cross .
Sending build context to Docker daemon  3.072kB
Step 1/12 : FROM frolvlad/alpine-glibc:alpine-3.7_glibc-2.26
 ---> eefdec609078
Step 2/12 : ENV GO_VER 1.9.4
 ---> Running in 76a4f985fb0f
Removing intermediate container 76a4f985fb0f
 ---> 89a6eb4fd5db
Step 3/12 : ENV GO_OS linux
 ---> Running in f6cbc1aeb072
Removing intermediate container f6cbc1aeb072
 ---> 8eaf4034b0a9
Step 4/12 : ENV GO_ARCH amd64
 ---> Running in d78ba5f5034c
Removing intermediate container d78ba5f5034c
 ---> bb96d07fe0ac
Step 5/12 : ENV PATH $GOPATH/bin:/opt/go/bin:$PATH
 ---> Running in 7da8fbd54d35
Removing intermediate container 7da8fbd54d35
 ---> f153adaa70ef
Step 6/12 : ENV GOPATH /go
 ---> Running in 786bd4f82b6b
Removing intermediate container 786bd4f82b6b
 ---> 9faf23882530
Step 7/12 : RUN mkdir -p $GOPATH/src $GOPATH/bin
 ---> Running in afaf033ef44e
Removing intermediate container afaf033ef44e
 ---> 09ff6d4a33da
Step 8/12 : RUN apk add --no-cache ca-certificates
 ---> Running in ccb33bd4ed8f
fetch http://dl-cdn.alpinelinux.org/alpine/v3.7/main/x86_64/APKINDEX.tar.gz
fetch http://dl-cdn.alpinelinux.org/alpine/v3.7/community/x86_64/APKINDEX.tar.gz
(1/1) Installing ca-certificates (20171114-r0)
Executing busybox-1.27.2-r7.trigger
Executing ca-certificates-20171114-r0.trigger
OK: 11 MiB in 15 packages
Removing intermediate container ccb33bd4ed8f
 ---> 0a3492ae61ee
Step 9/12 : RUN apk add --no-cache git
 ---> Running in 23d11e4eb361
fetch http://dl-cdn.alpinelinux.org/alpine/v3.7/main/x86_64/APKINDEX.tar.gz
fetch http://dl-cdn.alpinelinux.org/alpine/v3.7/community/x86_64/APKINDEX.tar.gz
(1/4) Installing libcurl (7.58.0-r0)
(2/4) Installing expat (2.2.5-r0)
(3/4) Installing pcre2 (10.30-r0)
(4/4) Installing git (2.15.0-r1)
Executing busybox-1.27.2-r7.trigger
Executing glibc-bin-2.26-r0.trigger
OK: 25 MiB in 19 packages
Removing intermediate container 23d11e4eb361
 ---> 3f64a2e442e8
Step 10/12 : RUN mkdir -p /opt
 ---> Running in e5fc701d04f2
Removing intermediate container e5fc701d04f2
 ---> 544cdb7dee74
Step 11/12 : RUN wget -q -O - https://dl.google.com/go/go$GO_VER.$GO_OS-$GO_ARCH.tar.gz         | tar -C /opt/ -zxf -
 ---> Running in 5de17ef8772b
Removing intermediate container 5de17ef8772b
 ---> 1336e08e31c2
Step 12/12 : WORKDIR $GOPATH
Removing intermediate container d61f2bfed88a
 ---> 37e4a0b293ab
Successfully built 37e4a0b293ab
Successfully tagged golang:cross
$ 
```

오우... 뭐가 좀 복잡하다. 일단 이미지가 어떻게 만들어졌는지 보자.

```console
$ sudo docker image ls golang
REPOSITORY       TAG                IMAGE ID          CREATED           SIZE
golang           cross              37e4a0b293ab      3 minutes ago     325MB
golang           1.9.4-stretch      8ebf49f75a15      4 days ago        735MB
golang           1.9.4-alpine3.7    fb6e10bf973b      12 days ago       269MB
$ 
```

내 Image에는 `glibc`도 추가되어 있고, `git`도 들어있고, 아무튼 Alpine 기반의
공식 Image보다는 55MB 정도가 더 큰 이미지가 되었다. (아! 이 크기는 실제로
Disk에서 차지하는 크기이긴 한데, 자신의 Layer 뿐만 아니라 그 아래 깔려있는
기반 이미지의 크기까지 감안된 크기이다.)

아무튼, 이제 Container를 실행해서 그 안에서 Go가 정상적으로 살치되었는지,
그리고 동작하는지 확인할 차례다.

```console
$ sudo docker run -it golang:cross
/go # 
/go # go version
go version go1.9.4 linux/amd64
/go # 
/go # which go
/opt/go/bin/go
/go # 
/go # ldd /opt/go/bin/go
	/lib64/ld-linux-x86-64.so.2 (0x7fd82aaf1000)
	libpthread.so.0 => /lib64/ld-linux-x86-64.so.2 (0x7fd82aaf1000)
	libc.so.6 => /lib64/ld-linux-x86-64.so.2 (0x7fd82aaf1000)
/go # 
/go # exit
$ 
```

원했던 그대로 잘 되는 것 같다. 그런데 무슨 "Running in..."이 이렇게 많지?
이 "Running in..." 등의 메시지는 개별적으로 임지 Container에 의해 실행되는
것을 나타내는 것인데, 그 Container 간 Image 연속성 등은 어떻게 보장하는지
등을 포함하여 궁금한 점이 많다.



## Layer, Layer, and Layer

`docker image` 명령은 각각의 Image에 대한 "위에서 본", "투영된" 정보를
보여주고는 있지만 그 Image가 어떤 Layer로 구성되어 있는지는 보여주지
않는다. 이런 정보를 확인하려면 다음과 같은 명령을 사용할 수 있다.


```console
$ sudo docker inspect golang:cross
[
    {
        "Id": "sha256:37e4a0b293abb6f55b86ff182e8aea5a19ddc21d3eddda5efdb2b49782d55615",
<...>
$ 
```

긴 출력이 있었지만, 지금 당장 관심있는 부분만 뽑아서 읽기 쉽게 데이터를
조금 지워봤다.

```json
[
    {
        "Id": "sha256:37e4a0b293ab<...>",
        "GraphDriver": {
            "Data": {
                "LowerDir": "/var/lib/docker/overlay2/12a4b3bfe305<...>/diff:/var/lib/docker/overlay2/bb67dac9ea28<...>/diff:/var/lib/docker/overlay2/2ee20e6c51b4<...>/diff:/var/lib/docker/overlay2/3bab31921282<...>/diff:/var/lib/docker/overlay2/c9533ecedab4<...>/diff:/var/lib/docker/overlay2/87e6019bf09c<...>/diff",
                "MergedDir": "/var/lib/docker/overlay2/8017eb4c3097<...>/merged",
                "UpperDir": "/var/lib/docker/overlay2/8017eb4c3097<...>/diff",
                "WorkDir": "/var/lib/docker/overlay2/8017eb4c3097<...>/work"
            },
            "Name": "overlay2"
        },
        "RootFS": {
            "Type": "layers",
            "Layers": [
                "sha256:cd7100a72410<...>",
                "sha256:7b16897a4a1b<...>",
                "sha256:8d6b7b5aa4a6<...>",
                "sha256:f28c1d886596<...>",
                "sha256:b3745de763ec<...>",
                "sha256:3f4c0a62e014<...>",
                "sha256:6efc5de9e640<...>"
            ]
        }
    }
]
```

지금 설치한 버전의 Docker는 `overlay2` 파일시스템을 사용하는데, 위의 JSON을
보면 `LowerDir`, `UpperDir`, `MergedDir` 등의 이름으로 표시된 경로에서 이들
계층이 실제 Host 상에 존재하는 물리적인 위치를 확인할 수 있다. 또한, `Layers`
부분을 보면 이들 계층에 대한 내부적인 인식에 사용되는 ID도 확인이 가능하다.

예를 들어, 그 중 하나를 열어보면,

```console
# find 3bab319212827e8f2c87129141dca72960e3a35b1dae46219e4709d3cf552994/
3bab319212827e8f2c87129141dca72960e3a35b1dae46219e4709d3cf552994/
3bab319212827e8f2c87129141dca72960e3a35b1dae46219e4709d3cf552994/diff
3bab319212827e8f2c87129141dca72960e3a35b1dae46219e4709d3cf552994/diff/go
3bab319212827e8f2c87129141dca72960e3a35b1dae46219e4709d3cf552994/diff/go/bin
3bab319212827e8f2c87129141dca72960e3a35b1dae46219e4709d3cf552994/diff/go/src
3bab319212827e8f2c87129141dca72960e3a35b1dae46219e4709d3cf552994/lower
3bab319212827e8f2c87129141dca72960e3a35b1dae46219e4709d3cf552994/link
3bab319212827e8f2c87129141dca72960e3a35b1dae46219e4709d3cf552994/work
# 
```

`/var/lib/docker/overlay2`에서 실행한 위의 명령은 권한 획득을 위해 Host의
`root` 권한으로 실행한 것이다. 위에 열거된 바와 같이, `diff` 라는 이름의
경로 아래에 `go/bin`, `go/src` 등이 위치한 것을 볼 수 있는데, 이건 우리가
`Dockerfile`에서 만들어줬던, 위의 Build 출력의 7 번째 단계의 내용을 그대로
담고 있다. (`RUN` 하나에 한 계층!)

조금 더 보면,

```console
# for i in 801 12a bb6 2ee 3ba c95 87e; do ls -F $i* ; done
diff/  link  lower  work/
diff/  link  lower  work/
diff/  link  lower  work/
diff/  link  lower  work/
diff/  link  lower  work/
diff/  link  lower  work/
diff/  link
# 
```

`UpperDir`과 `LowerDir` 들의 내용을 순서대로 표시해보니, 각 계층을 이루는
디렉터리에는 `work`, `diff` 등의 디렉터리와 `link`, `lower` 등의 파일이
놓여 있는 것을 볼 수 있는데, 맨 아래의 Layer에는 `lower`가 없다.

이 구조 등에 대한 것은 `OverlayFS`의 영역이므로 이 정도만 보고,
아무튼, Layer가 많은 것은 싫다. 좀 줄이자.


### 다시, Dockerfile & Build

다음과 같이, 일련의 `RUN`을 묶어서 하나로 줄여봤다.

```dockerfile
# vim: set ts=4 sw=4 expandtab:
FROM frolvlad/alpine-glibc:alpine-3.7_glibc-2.26

ENV GO_VER 1.9.4
ENV GO_OS linux
ENV GO_ARCH amd64

ENV PATH $GOPATH/bin:/opt/go/bin:$PATH
ENV GOPATH /go

RUN mkdir -p $GOPATH/src $GOPATH/bin ; \
    apk add --no-cache ca-certificates ; \
    apk add --no-cache git ; \
    mkdir -p /opt ; \
    wget -q -O - https://dl.google.com/go/go$GO_VER.$GO_OS-$GO_ARCH.tar.gz \
	| tar -C /opt/ -zxf -

WORKDIR $GOPATH
```

그리고,

```console
$ sudo docker build -t golang:cross .
Sending build context to Docker daemon  2.048kB
Step 1/8 : FROM frolvlad/alpine-glibc:alpine-3.7_glibc-2.26
 ---> eefdec609078
Step 2/8 : ENV GO_VER 1.9.4
 ---> Using cache
 ---> 89a6eb4fd5db
Step 3/8 : ENV GO_OS linux
 ---> Using cache
 ---> 8eaf4034b0a9
Step 4/8 : ENV GO_ARCH amd64
 ---> Using cache
 ---> bb96d07fe0ac
Step 5/8 : ENV PATH $GOPATH/bin:/opt/go/bin:$PATH
 ---> Using cache
 ---> f153adaa70ef
Step 6/8 : ENV GOPATH /go
 ---> Using cache
 ---> 9faf23882530
Step 7/8 : RUN mkdir -p $GOPATH/src $GOPATH/bin ;     apk add --no-cache ca-certificates ;     apk add --no-cache git ;     mkdir -p /opt ;     wget -q -O - https://dl.google.com/go/go$GO_VER.$GO_OS-$GO_ARCH.tar.gz 	| tar -C /opt/ -zxf -
 ---> Running in 0c5530ec6f47
fetch http://dl-cdn.alpinelinux.org/alpine/v3.7/main/x86_64/APKINDEX.tar.gz
fetch http://dl-cdn.alpinelinux.org/alpine/v3.7/community/x86_64/APKINDEX.tar.gz
(1/1) Installing ca-certificates (20171114-r0)
Executing busybox-1.27.2-r7.trigger
Executing ca-certificates-20171114-r0.trigger
OK: 11 MiB in 15 packages
fetch http://dl-cdn.alpinelinux.org/alpine/v3.7/main/x86_64/APKINDEX.tar.gz
fetch http://dl-cdn.alpinelinux.org/alpine/v3.7/community/x86_64/APKINDEX.tar.gz
(1/4) Installing libcurl (7.58.0-r0)
(2/4) Installing expat (2.2.5-r0)
(3/4) Installing pcre2 (10.30-r0)
(4/4) Installing git (2.15.0-r1)
Executing busybox-1.27.2-r7.trigger
Executing glibc-bin-2.26-r0.trigger
OK: 25 MiB in 19 packages
Removing intermediate container 0c5530ec6f47
 ---> 5c2bde482fd0
Step 8/8 : WORKDIR $GOPATH
Removing intermediate container 252625fe1345
 ---> 0d5db8b23d6d
Successfully built 0d5db8b23d6d
Successfully tagged golang:cross
$ 
```

일단 단계가 12단계에서 8단계로 4개 줄었다. (무슨 의미가 있냐? ㅡ.ㅡ)
다시 Image 정보를 보고,

```console
$ sudo docker inspect golang:cross
[
    {
        "Id": "sha256:0d5db8b23d6df1e8c486bad94cdb7fff6d5b7799c52a4cae237d13d0aff8a2b4",
<...>
$ 
```

동일한 방식으로 정리해봤다.

```json
[
    {
        "Id": "sha256:0d5db8b23d6d<...>",
        "GraphDriver": {
            "Data": {
                "LowerDir": "/var/lib/docker/overlay2/c9533ecedab4<...>/diff:/var/lib/docker/overlay2/87e6019bf09c<...>/diff",
                "MergedDir": "/var/lib/docker/overlay2/e16578e96550<...>/merged",
                "UpperDir": "/var/lib/docker/overlay2/e16578e96550<...>/diff",
                "WorkDir": "/var/lib/docker/overlay2/e16578e96550<...>/work"
            },
            "Name": "overlay2"
        },
        "RootFS": {
            "Type": "layers",
            "Layers": [
                "sha256:cd7100a72410<...>",
                "sha256:7b16897a4a1b<...>",
                "sha256:48cce556df16<...>"
            ]
        }
    }
]
```

와! Layer도 7개에서 3개로 4개가 줄었다! 남은 세 개의 Layer는 각각 Alpine
공식 Image, Glibc를 추가한 우리의 Base, 그리고 우리의 이미지이니까 줄일
만큼 줄인 것 같다. 복잡해서 좋을 게 뭐냐, 최대한 줄이자!

그러나... `Dockerfile`에 대한 공식 문서에서는 이 부분을 다음과 같이 설명하고
있다.

> The `RUN` instruction will execute any commands in a new layer on top of the current image and commit the results. The resulting committed image will be used for the next step in the `Dockerfile`.
> 
> Layering `RUN` instructions and generating commits conforms to the core concepts of Docker where commits are cheap and containers can be created from any point in an image’s history, much like source control.

관점에 따라 맞는 얘기다. 하지만 아직까지의 경험으로는, 하나의 `Dockerfile`로
만드는 Layer는 하나면 족할 것 같다.

Dockerfile 작성규칙
: `RUN`이 Layer를 만든다.
: 복잡해서 좋을 게 뭐냐, 가능하면 한 Layer로 끝내자!

`Dockerfile`의 작성법에 대해서는
[공식문서](https://docs.docker.com/engine/reference/builder)를
참고하면 좋겠다.



## 결과확인!

이제 거의 끝났다. 작년에 Go 언어로 작성했던 Application 하나를 이 환경에서
Build해보는 것으로 확인을 끝내자. 

```console
$ sudo docker run -it golang:cross 
/go # 
/go # du -sh /
336.1M	/
/go # 
/go # apk add --no-cache gcc musl-dev libpcap-dev
fetch http://dl-cdn.alpinelinux.org/alpine/v3.7/main/x86_64/APKINDEX.tar.gz
fetch http://dl-cdn.alpinelinux.org/alpine/v3.7/community/x86_64/APKINDEX.tar.gz
(1/16) Upgrading musl (1.1.18-r2 -> 1.1.18-r3)
(2/16) Installing binutils-libs (2.28-r3)
(3/16) Installing binutils (2.28-r3)
(4/16) Installing gmp (6.1.2-r1)
(5/16) Installing isl (0.18-r0)
(6/16) Installing libgomp (6.4.0-r5)
(7/16) Installing libatomic (6.4.0-r5)
(8/16) Installing pkgconf (1.3.10-r0)
(9/16) Installing mpfr3 (3.1.5-r1)
(10/16) Installing mpc1 (1.0.3-r1)
(11/16) Installing libstdc++ (6.4.0-r5)
(12/16) Installing gcc (6.4.0-r5)
(13/16) Upgrading musl-utils (1.1.18-r2 -> 1.1.18-r3)
(14/16) Installing libpcap (1.8.1-r1)
(15/16) Installing libpcap-dev (1.8.1-r1)
(16/16) Installing musl-dev (1.1.18-r3)
Executing busybox-1.27.2-r7.trigger
Executing glibc-bin-2.26-r0.trigger
OK: 119 MiB in 33 packages
/go # 
/go # du -sh /
429.7M	/
/go # 
```

Container를 실행해서 추가로 필요한 Package를 설치했다. 내 Application이
`pcap`을 사용하기 때문에 `pcap` 컴파일에 필요한 패키지를 추가로 설치한
것이며, 이 부분은 특정 Application의 의존성에 대한 부분이므로 일단 범용의
기반 Image에 넣지는 않았다. 필요한 경우에는, 다시 이 Image를 기반으로
하여 특정 Application을 위한 전용 Image를 만들어주면 된다.

이제 Application을 확인할 차례다.

```console
/go # go get github.com/hyeoncheon/goul/cmd/goul
/go # 
/go # ls -lh bin/goul
-rwxr-xr-x    1 root     root        4.9M Feb 20 10:26 bin/goul
/go # 
/go # ldd bin/goul
	/lib/ld-musl-x86_64.so.1 (0x7f1b10813000)
	libpcap.so.1 => /usr/lib/libpcap.so.1 (0x7f1b105db000)
	libc.musl-x86_64.so.1 => /lib/ld-musl-x86_64.so.1 (0x7f1b10813000)
/go # 
/go # bin/goul --version
goul 0.2-head
/go # 
/go # bin/goul -DT -s
DEBU[0000] initialize network connection :6001...       
DEBU[0000] initialize device pump on eth0...            
DEBU[0000] [router-001] started --------------------------------- 
DEBU[0000] [net-listener-021] preparing listener... 
DEBU[0000] [cap-022] dummy writer in looping... 
^CDEBU[0146] signal caught: interrupt                     
DEBU[0146] interrupted! exit gracefully...              
DEBU[0147] [net-listener-021] channel closed   
DEBU[0147] [net-listener-021] exit             
DEBU[0147] [cap-022] channel closed            
DEBU[0147] [cap-022] dummy writer got 0 packets 
DEBU[0147] [cap-022] exit                      
DEBU[0147] [net-001] cleanup...                
DEBU[0147] [net-001] cleanup...                
/go # exit
$ 
```

이 때, Host에서 Process를 점검해보면,

```console
$ ps axfwww|grep dockerd -A4
 1323 ?        Ssl    6:27 /usr/bin/dockerd -H fd://
 1508 ?        Ssl    3:54  \_ docker-containerd --config /var/run/docker/containerd/containerd.toml
14567 ?        Sl     0:00      \_ docker-containerd-shim -namespace moby -workdir /var/lib/docker/containerd/daemon/io.containerd.runtime.v1.linux/moby/89f8c569add22d69fec4e0d722a1f041af44b14023dee5b11ca3ed4b01d84c76 -address /var/run/docker/containerd/docker-containerd.sock -containerd-binary /usr/bin/docker-containerd -runtime-root /var/run/docker/runtime-runc
14587 pts/0    Ss     0:00          \_ /bin/sh
15595 pts/0    Sl+    0:00              \_ bin/goul -DT -s
$ 
$ sudo lsof -p 15595
lsof: WARNING: can't stat() fuse.gvfsd-fuse file system /run/user/1000/gvfs
      Output information may be incomplete.
COMMAND   PID USER   FD      TYPE DEVICE SIZE/OFF   NODE NAME
goul    15595 root  cwd       DIR   0,74     4096  32877 /go
goul    15595 root  rtd       DIR   0,74     4096 700443 /
goul    15595 root  txt       REG   0,74  5110592 701769 /go/bin/goul
goul    15595 root  mem       REG    8,1          701769 /go/bin/goul (stat: No such file or directory)
goul    15595 root  mem       REG    8,1          699156 /usr/lib/libpcap.so.1.8.1 (stat: No such file or directory)
goul    15595 root  mem       REG    8,1          698446 /lib/ld-musl-x86_64.so.1 (stat: No such file or directory)
goul    15595 root    0u      CHR  136,0      0t0      3 /dev/pts/0
goul    15595 root    1u      CHR  136,0      0t0      3 /dev/pts/0
goul    15595 root    2u      CHR  136,0      0t0      3 /dev/pts/0
goul    15595 root    3u     sock    0,9      0t0 781490 protocol: TCPv6
goul    15595 root    4u  a_inode   0,13        0  12099 [eventpoll]
$ 
```

성공! glibc 기반의 공식 Binary 버전의 Go를 Alpine의 gcc와 함께 사용해서,
내 Application은 이제 Alpine의 musl libc의 Loader를 사용하는 형태로
Build가 되었다.


## 정리

사실, 뚜껑 아래를 살짝 내려다보는 의미로 좀 복잡한 얘기를 했다. 다음과
같은 의미에서 이 과정은 실용적인 측면에서 큰 의미가 없을 수 있다.

* 하나의 Image만 생각하면 glibc를 사용하는 Debian을 기반으로 사용하는 것
  보다 공간을 절약할 수 있지만, 동일한 기반 Image를 이용하는 개별 Image,
  Container가 늘어난다면 결국 절감 효과는 1/N이 되어 크지 않을 수 있다.
* 오히려, 복잡한 요구조건을 만족시키기 위해서, 그리고 개발자의 환경과
  거의 동일한 운영환경을 위해서라면 glibc를 사용하는 운영환경을 만드는
  것이 더 효율적일 수 있다.

아무튼, 경우에 따라서는 Glibc 보다 Alpine을 무지 사랑하는 경우도 있을
것이니... :-)



# Registry에 등록하기

다시 꺼내어 쓰게 될지는 잘 모르겠지만 내 목적에 맞는 Image를 만들었다.
이렇게 만든 Image는 지금 내가 사용하는 Host, 즉 내 Laptop에 저장되어
있을 뿐이다. 이것을 Cloud 환경이나 사설로 구축한 Docker Cluster에서
구동시키기 위해서는, 그 Cluster 내의 Host들이 어딘가에 저장되어 있는
이 Image를 받을 수 있어야 한다.  
이를 위하여, Docker에서는 Registry와 Repository 개념을 적용하고 있는데,
이미 지난 글에서 설명했듯이, Repository는 개별 이미지가 저장되는 곳을
얘기하는 것이고, Registry는 그것들을 등록, 관리하는 곳을 말한다.

Docker의 Architecture에 의해, Host는 사용자가 Container를 기동하려고 할
때, 그 Container가 사용할 Image를 Registry에서 검색하고 받아올 수 있어야
한다. 이 때, 사용자가 개별적으로 Repository와 Registry를 구성하는 것은
현실적으로 어려운 일인데, **Docker는 [Docker Hub]라는 공중의 Registry를
서비스로 제공**하고 있다. (한편으로는, Docker라는 관리기술이 널리
받아들여지고 발전하기 위해서는 필수적으로 생태계를 조성할 필요가 있는데,
공중 Registry는 생태계 구성을 위한 필수요소가 된다는 점에서 당연한 것으로
해석할 수도 있다.)

[Docker Hub] 외에도, [Docker Store], [Docker Cloud] 등의 서비스가 더
있는데, 사실 그 상관관계를 잘 모르겠다. Docker Hub는 아마도, 초기에
Registry 용으로 설계가 된 것 같고, Docker Store는 Docker가 오픈소스
프로젝트에서 시작하여 상업적으로 발전하면서 Docker 배포판, Plugin, 그리고
Image 등을 한 곳에서 통합하여 서비스할 수 있도록 체계를 개편한 것으로
보인다. 여기에서 한 발 더 나아가 Docker Cloud는 Docker 기반의 Container
서비스를 제공하는 Cloud Provider와 연계하여 단순히 Image를 제공하는 선을
넘어 서비스 Provisioing까지를 자동화할 수 있는 보다 큰 체계로 발전시킨
것이 아닌가 생각하고 있다. 나중에, 시간을 내서 그 역사를 찾아보고 이해를
넓혀야겠다. (누가 Comment로 알려주면 감사)


## 공식 Image와 사용자 Image

아무튼, Docker Hub에는 두 종류의 Image가 있다. 하나는 Docker가 직접
관리하는 공식 Image인데, 이미 글에서 몇 차례 이에 대한 언급을 했다.
다른 하나는 사용자(Community) Image인데, 이것은 Docker에 직접적인
관련이 없는 일반 개인 등이 자신의 사용자 계정을 이용하여 자신이 만든
Image를 올려둔 것을 말한다.

Docker Image를 이용하여 서비스를 한다면, 보안 요건을 비롯하여 Image에
대한 신뢰성을 확보해야 하는데, 그런 측면에서 Docker의 이름으로 제공되는
공식 Image가 갖는 장점이 있을 것이다. 그러나, 사용자 Image라고 하더라도
Public하게 공개된 경우, 최종 사용자가 `Dockerfile`을 검토하여 그 내용을
검증할 수 있으며, 동시에 Docker가 공개 Image에 대해 제공하는 보안 점검
서비스(Vulnerability Scanning Service) 결과를 이용하면 보안 위협에 대한
대비가 가능하기는 하다.


## Login & Push

아무튼, 이제 내 Image를 올리자!

### Login

사용자 Image는 개설된 Docker ID를 통하여 올리게 되며, Image를 올리기에
앞서 로그인을 해야한다.

```console
$ sudo docker login
Login with your Docker ID to push and pull images from Docker Hub. If you don't have a Docker ID, head over to https://hub.docker.com to create one.
Username: scinix
Password:
Login Succeeded
$
```

### Push

이제 올려보자. 1차시기!

```console
$ sudo docker push golang:cross
The push refers to repository [docker.io/library/golang]
48cce556df16: Preparing
7b16897a4a1b: Preparing
cd7100a72410: Preparing
denied: requested access to the resource is denied
$
```

당연히 거부당한다. 사용자 Repository는 항상 사용자 ID 또는 조직명으로
시작해야 하며, 그것이 생략되면 공식 Image를 뜻하게 된다.

다시, 2차시기!

```console
$ sudo docker push scinix/golang:cross
The push refers to repository [docker.io/scinix/golang]
An image does not exist locally with the tag: scinix/golang
$
```

시작하기 전부터 뭔가 꺼림직했겠지만, 저렇게 이름이 붙으면... Local의
어떤 것을 올리라는 것이냐! 사용자 Image를 올리려면, Local에서도 그것이
사용자의 것으로 이름붙여져 있어야 한다.

다음의, `docker image tag` 명령은, 이미 존재하는 Image에게 다른 이름을
부여해주는 기능을 한다. 아래의 예는, 현재 `golang:cross`라는 이름으로
만들어둔 Image에게 새로운 이름들을 부여하는 것이다.

```console
$ sudo docker image tag golang:cross scinix/golang:cross
$ sudo docker image tag golang:cross scinix/golang:latest
$ sudo docker image tag golang:cross scinix/golang:1.9.4
$ sudo docker image tag golang:cross scinix/golang:1.9.4-cross
$ sudo docker image tag golang:cross scinix/golang:1.9.4-alpine3.7-cross
$
$ sudo docker image ls scinix/*
REPOSITORY      TAG                    IMAGE ID       CREATED       SIZE
scinix/golang   1.9.4                  0d5db8b23d6d   3 hours ago   325MB
scinix/golang   1.9.4-alpine3.7-cross  0d5db8b23d6d   3 hours ago   325MB
scinix/golang   1.9.4-cross            0d5db8b23d6d   3 hours ago   325MB
scinix/golang   cross                  0d5db8b23d6d   3 hours ago   325MB
scinix/golang   latest                 0d5db8b23d6d   3 hours ago   325MB
$
```

이제, 같은 Image ID를 공유하지만 불리는 이름, Tag가 여러 개 생성되었다.

3차시기!

```console
$ sudo docker push scinix/golang:cross
The push refers to repository [docker.io/scinix/golang]
48cce556df16: Pushing  35.04MB/314.4MB
7b16897a4a1b: Pushed
cd7100a72410: Mounted from library/golang
```

이렇게 내려받을 때와 비슷한 화면이 진행되다가,

```console
$ sudo docker push scinix/golang:cross
The push refers to repository [docker.io/scinix/golang]
48cce556df16: Pushed
7b16897a4a1b: Pushed
cd7100a72410: Mounted from library/golang
cross: digest: sha256:7d285ca153625258377d40757675a6b612f2d175d4374631b20a6adb31c47010 size: 952
```

최종적으로 잘 올라갔다. 출력을 보면 짐작할 수 있겠지만, 공식 Image 였던
`alpine`을 기반으로 한 것이라서 마지막 Layer는 따로 올라가지 않고 참조
형태가 된 것 같다. (`Mounted from library/golang` 그런데 왜 `alpine`이
아니고 `golang`이지?)

마져 올려보자.

```console
$ sudo docker push scinix/golang:1.9.4
The push refers to repository [docker.io/scinix/golang]
48cce556df16: Layer already exists
7b16897a4a1b: Layer already exists
cd7100a72410: Layer already exists
1.9.4: digest: sha256:7d285ca153625258377d40757675a6b612f2d175d4374631b20a6adb31c47010 size: 952
$
$ sudo docker push scinix/golang:latest
The push refers to repository [docker.io/scinix/golang]
48cce556df16: Layer already exists
7b16897a4a1b: Layer already exists
cd7100a72410: Layer already exists
latest: digest: sha256:7d285ca153625258377d40757675a6b612f2d175d4374631b20a6adb31c47010 size: 952
$
```

이때, `golang:1.9.4` 등의 Tag는 일종의 Alias 같은 역할을 하는데, 특히
`latest`의 경우는 사용자가 Pull을 할 때 Tag를 지정하지 않았을 때 사용된다.


## 저장소에 올라간 Image 확인하기

위와 같이 공중 Registry에 Image를 등록하게 되면, 아래와 같이 Web에서 확인할
수 있다. 특히, Repository가 Public으로 설정된 경우에는 다른 사용자들도 이
이미지를 확인하고, 사용할 수 있다. 아래는, Docker Hub에 접속했을 때 볼 수
있는 화면이다.

![.dropshadow](/attachments/docker/repository-hub.docker.com.png)

URL: <https://hub.docker.com/r/scinix/golang/>


보다 향상된 Cloud 연동을 제공하는 Docker Cloud에서는 보다 아래와 같이 조금
더 깔끔한 화면을 볼 수 있다. 또한, 이 Docker Cloud를 이용하면 Github 등과
연동하여 Commit에 의한 자동 Build가 이루어지도록 설정할 수도 있다.

![.dropshadow](/attachments/docker/repository-cloud.docker.com.png)

URL: <https://cloud.docker.com/app/scinix/repository/docker/scinix/golang/general>

마지막으로, Docker Store에서 확인한 화면은 아래와 같다. 아마도 상업적인
목적을 중심으로 하기 때문인 것 같은데, 공식 Publisher가 아닌 내 계정으로는
아래와 같은 Readonly 인터페이스 외에는 제공되지 않는 것 같다.

![.dropshadow](/attachments/docker/repository-store.docker.com.png)

URL: <https://store.docker.com/community/images/scinix/golang>




# Registry에서 내 Image 받기

이제 등록한 Image를 써볼 차례다.

## Pull

`docker pull` 명령은 원격 Repository의 Image를 받는 역할을 한다. 그러나,
바로 실행을 할 계획이라면 별도의 `pull` 명령 없이 바로 아래와 같이 명령할
수 있다. (이미 Hello World 시절부터 해봤던 거다)

```console
$ sudo docker run -it scinix/golang
Unable to find image 'scinix/golang:latest' locally
latest: Pulling from scinix/golang
ff3a5c916c92: Already exists
bbbde91ec291: Pull complete
e3e001babc5b: Pull complete
Digest: sha256:7d285ca153625258377d40757675a6b612f2d175d4374631b20a6adb31c47010
Status: Downloaded newer image for scinix/golang:latest
/go #
/go # go version
go version go1.9.4 linux/amd64
/go # exit
$            
```

잘 동작한다. Local의 이미지 상황을 보자.

```console
$ sudo docker image ls
REPOSITORY        TAG           IMAGE ID          CREATED          SIZE
scinix/golang     latest        0d5db8b23d6d      4 hours ago      325MB
alpine            latest        3fd9065eaf02      5 weeks ago      4.15MB
$
```

이미 Local에 받아져 있던 `alpine`을 포함해서, 새로 받은 Image도 이제
Local에 저장되었음을 확인할 수 있다.


---

생각보다 글이 길어지다 보니 핵심 정리가 잘 안된 것 같다.
어쨌든, 기존의 공식 Image, 그리고 그것을 기반으로 한 공개 Image를 바탕에
깔고, 그 위에 다시 내가 원하는 방식의 패키지를 추가 설치하여 Go 언어 기반
개발환경 Image를 만들어 저장소에 등록해봤다.  
패키지에 따라 조금씩 다른 기법이 들어가기는 하겠지만, 대부분의 Docker
Image는 이와 유사한 틀 내에서 움직이리라 생각한다.

---

[Official Docker Image for Golang]:https://hub.docker.com/_/golang/

[docker-library/golang/1.9/stretch/Dockerfile]:https://github.com/docker-library/golang/blob/master/1.9/stretch/Dockerfile
[docker-library/golang/1.9/alpine3.7/Dockerfile]:https://github.com/docker-library/golang/blob/master/1.9/alpine3.7/Dockerfile

[Docker Hub]:https://hub.docker.com/
[Docker Store]:https://store.docker.com/
[Docker Cloud]:https://cloud.docker.com/



### 함께 읽기

이 묶음글은 아직 몇 회까지 쓸지 정하지 못했다.

* [Docker: Getting Started with Docker]
* [Docker: Installation and Test Drive]
* [Docker: 나의 첫 Docker Image]
* ['쓸만한' Docker Image 만들기 - Part 1]
* _'쓸만한' Docker Image 만들기 - Part 2_
* [Docker Cloud에서 자동빌드하기]
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

