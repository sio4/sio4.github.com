---
title: "Docker: 나의 첫 Docker Image"
subtitle: Build and Push my own Docker Image
series: Docker 시작하기
tags: ["Docker", "Container", "cloud-computing"]
categories: ["cloud-computing"]
images: [/logos/docker-horizontal.800.png]
banner: /logos/docker-horizontal.800.png
date: 2018-02-14T13:20:00+0900
lastmod: 2018-03-09T13:16:00+0900
---
프로그램이 메모리에 올라와 제어를 넘겨 받으면 프로세스가 되고, Disk 위의
Kernel Image가 메모리에 올라오면 컴퓨터가 살아난다. 이렇게, 컴퓨터 세상은
깨어 있는 무언가와 그것을 뒷받힘하는 자고 있는 무언가의 쌍으로 이루어져
있다. Docker 역시 이 프랙털 안에 있는데, 메모리에 올라와 깨어 움직이는
Container와, 이것이 본으로 삼는, 저장소에서 잠을 자는 Image가 그것이다.
이 글은, Container의 본이 되는 Image를 만들고 저장하는 방식에 대하여
정리한다.
<!--more-->



## Docker Image와 Registry

이 묶음글의 앞선 두 편에서 Docker를 설치하고 시험용 Container를 올려보는
과정을 대충 정리했었는데, 그 과정에서 Registry라는 용어와 Image라는 용어가
나왔었다.

**Docker Image**는 *Container가 기동될 때 필요로 하는 파일들의 집합, 또는
파일시스템*을 담은 무언가를 말한다. (정확하게 말하자면... 잘 모르겠다.
이 글의 후반에서 자세히 다루겠지만, 이 Image라는 것의 실체는 내 앞에 있는
것이 아닌 것 같아서...) 아무튼, 프로세스는 프로그램 파일이 있어야 하고,
컴퓨터는 Disk가 있어야 하고, 또 가상머신은 가상디스크가 있어야 하듯이
Docker Container는 Image가 있어야 한다. 일단 여기서는, "*Docker Image는
Docker Container의 Disk다*" 정도로 이해하면 될 것 같다.

**Docker Registry**는 *Docker Image를 저장하는 중앙의 저장소*다. 이해하기
좋게 얘기한답시고 Registry라는 용어를 있는 그대로 "등기소"로 표현하지
않고 "저장소"라고 썼는데, 정확하게 말하면 저장소는 아니고 등록사무실이
맞긴 하다. **Docker Repository**는 *단일 Image의 여러 버전을 모아둔 곳*을
의미하며, 이 Repository를 관리하는 역할을 Registry가 한다. 말하자면,
Github 같은 곳이다. 실제로 기본 Registry의 이름이 hub.docker.com이다.
(처음에 이걸 모르고, Repository 이름을 Image 이름이 아닌 프로젝트명으로
했던 실수를 했었다.)

내 목적에 맞는 Container를 띄우기 위해서는 그 Container가 사용할 전용의
Image를 만들 필요가 있는데, 이 글은 내 목적에 맞는 Image를 만들고, 그걸
공식 Registry의 내 계정 아래에 등록하는 과정과 그 주변 이야기를 정리한다.


> 이 묶음글은 아직 몇 회까지 쓸지 정하지 못했다. 조금 써보고,...
> 
> * [Docker: Getting Started with Docker]
> * [Docker: Installation and Test Drive]
> * _Docker: 나의 첫 Docker Image_
> * ['쓸만한' Docker Image 만들기 - Part 1]
> * ['쓸만한' Docker Image 만들기 - Part 2]
> * [Docker Cloud에서 자동빌드하기]
> * [Docker Machine으로 Docker Node 뿌리기]
> * [Docker Machine 다시 보기]
> * [Getting Started with Docker Swarm]
> * [Docker Swarm에 Service 올려보기]
> * [Docker Swarm의 고가용성]
> * [Docker Swarm 다시 보기]
{.boxed}


# 내 Docker Image 만들기

내 일을 처리할 Container가 필요하다면 먼저 이 Container가 사용할 Image를
만들어야 한다. 앞서, Container에는 애플리케이션이 필요로 하는 최소한의
구동환경만 담으면 된다고 설명했다. 내 애플리케이션이 필요로 하는 것이
매우 단순하거나, 의존성 관계를 잘 알고 있다면 간단하게 Image를 구성할 수
있다.


## My Hello World

Docker 시운전에서 Hello World를 만났듯이, Docker Image를 만드는 것도 이
Hello World로 시작해봤다. (아래 사용된 예제의 파일은
[Github의 내 Library](https://github.com/sio4/docker-library/tree/master/hello/1.0)에
올려두었다.)


### 프로그램 준비

먼저, 다음과 같이 매우 간단한 C 프로그램을 짰다.

```c
#include <stdio.h>

int main() {
	printf("hello from docker container\n");
	return 0;
}
```

말 그대로 C 버전의 Hello World다. 이제 다음과 같은 Makefile을 만들어, 이
C 코드를 Static하게, 실행단계에서 C library에 의존하지 않도록, 컴파일한다.

```makefile
CC	= gcc
CFLAGS	= -static -Wall

hello: hello.c
	$(CC) $(CFLAGS) $< -o $@
```

아... Hello World에 무슨 `-Wall` 이냐... ㅠ.ㅠ 아무튼, `make` 명령으로
이 코드를 컴파일한 후, 정상적으로 정적 컴파일이 되었는지 확인한다.

```console
$ make
gcc -static -Wall hello.c -o hello
$ file hello
hello: ELF 64-bit LSB executable, x86-64, version 1 (GNU/Linux), statically linked, for GNU/Linux 3.2.0, BuildID[sha1]=c414e12ca4df91d131e2dbff3022101b66e6b2f9, not stripped
$ 
```

Size 결벽도 있으니 `strip`도 한 방 날릴려다가 참는다. 아무튼 **Statically
linked**라고 떴으니 의존성 걱정은 없다. 이제 Docker Image를 만들 차례!


### Docker Image 만들기

"만들기"라고 쓰긴 했는데... Build에 대한 적절한 한글 표현을 모르겠다.
앞서 Image에 담을 프로그램을 준비하는 과정에서, (그 한 줄의 명령을 위해)
`Makefile`을 사용했다. `make`라는 개발자 도구는, 개발자가 다소 복잡한
의존성 관계를 갖는 프로그램을 컴파일할 때,

1. 길고 복잡한 명령을 개발자가 외우지 않아도, 파일이 절차를 알고 있다.
1. 여러 명령이 순서에 맞춰 실행되어야 할 때, 파일이 절차를 알고 있다.
1. 의존성에 따라 구조적으로 실행되어야 할 데, 파일이 절차를 알고 있다.

아... 말장난 같은데, 결국은 그거다. 모든 절차와 의존성을 파일에 기록하여
개발자는 단지 `make` 라고만 입력하면 모든 것을 `Makefile`의 기술에 의해
진행하게 단순화하는 것이다. 또한, 이렇게 문법, 약속에 맞게 기술된 파일은
개발자 간의 의사소통에도 매우 유용하게 쓰이게 된다.

`make`에게 `Makefile`이 있다면, Docker에게는 `Dockerfile`이 있다. 아래의
세 줄짜리 파일이 바로 이 Hello World Contrainer를 위한 Image를 만드는
과정이 기술된 절차서이다.

```dockerfile
FROM scratch
COPY hello /
CMD ["/hello"]
```

뭐, 설명이 필요하지 않을 것 같은데, 윗 줄부터,

1. 맨땅에서 시작해서,
1. `hello` 라는 파일을 `/`에 복사해라
1. 이 Image를 구동하는 Container가 실행할 명령은 별도의 인수가 없는
   `/hello`다.

뭐 이런 말이다. 만들어보자.


```console
$ sudo docker build -t hello .
Sending build context to Docker daemon  813.1kB
Step 1/3 : FROM scratch
 ---> 
Step 2/3 : COPY hello /
 ---> 73bb9ea905cb
Step 3/3 : CMD ["/hello"]
 ---> Running in f6f0088c2335
Removing intermediate container f6f0088c2335
 ---> 50eaed409e2a
Successfully built 50eaed409e2a
Successfully tagged hello:latest
$ 
```

`docker build` 명령은 `Dockerfile`을 참조해서 이미지를 만들어주는 명령이다.
출력에서 보듯이, 세 줄의 Dockerfile 명령을 각각 한 Step 씩 밟아 나가면서,
이미지를 만들고 있다. 그리고 (나중에 다시 살펴보겠지만) 뒷부분에 보면
`intermediate container`를 지운다는 말이 나온다! 아... 달걀을 만들기 위해
닭을 먼저 만드는... 일단 닭과 달걀 얘기는 여기까지만. 다음 글 정도에서 더
할 얘기가 있을 것 같다.


### 결과 확인하기

아무튼, 이렇게 만들어진 Image를 이용해서 Container를 돌려보자. 엄청 대충
한 것 같은데 돌아가는지 안 돌아가는지...

```console
$ sudo docker run hello
hello from docker container
$ 
```

오... 돌아간다. 추가로, 만들어진 이미지 정보를 보면 아래와 같다.

```console
$ sudo docker image ls
REPOSITORY              TAG                     IMAGE ID            CREATED             SIZE
hello                   latest                  50eaed409e2a        11 minutes ago      808kB
$ 
$ sudo docker container ls --all
CONTAINER ID        IMAGE                     COMMAND             CREATED             STATUS                         PORTS               NAMES
7a4cc161ffbe        hello                     "/hello"            5 seconds ago       Exited (0) 4 seconds ago                           tender_clarke
$ 
```

`hello` 라는 Repository 이름과 `latest` 라는 Tag를 단, `50eaed409e2a` 라는
ID의 이미지가 만들어져 있음을 볼 수 있고, 이 이미지를 사용하는 Container가
5초 전에 만들어져서 `/hello` 라는 명령을 실행하고, 4초 전에 `0`을 반환하고
종료되었음을 표시해주고 있다.



아 그런데 저 이름은 뭐냐...???

---

원래는 실제로 내가 업무에서 사용할 Image를 만들고, 그것을 공식 Registry에
등록하는 과정을 정리하는 글을 쓰려고 시작했는데, 갑자기 Hello World가
끼어들면서 그것 하나 만으로 글이 길어졌다.  
아쉽지만, 명절을 기념하는 Posting이므로 여기서 정리하고, 실전 Image 제작과
Registry 등록 과정은 다음 글에 정리하도록 하겠다.



> 2018 동계올림픽과 함께하는 즐거운 설날 되세요.




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

