---
title: "Docker: Installation and Test Drive"
subtitle: Utuntu 위에 Docker 설치하고 맛보기
tags: Docker Container cloud-computing
categories: ["cloudcomputing"]
image: /attachments/docker/docker-hello-world.png
banner: /attachments/docker/docker-hello-world-banner.png
date: 2018-02-08T14:30:00+0900
last_modified_at: 2018-03-09T13:16:00+0900
---
Docker는 Linux 위에서 동작하는 Container 관리 소프트웨어다. 지난 글
[Docker: Getting Started with Docker]에서는 Container와 Docker의 개념을
간단히 정리했고, 이번 글에서는 Ubuntu Linux 위에 Docker를 설치하고
시운전을 해본 내용을 정리하려고 한다.

Docker는 리눅스가 제공하는 자원 격리기술을 이용하는 것이기 때문에, 이미
리눅스가 설치되어있는 상태라면 몇 단계의 간단한 명령 수행 만으로 쉽게
기본적인 설치를 끝낼 수 있다. 공식 설치 문서는 아래의 링크를 참고. (이
글도, 그 문서의 설명을 따라하면서, 일부 내가 확인하고 싶은 부분을 간단히
짚어본 것을 정리했을 뿐이다.)

* <https://docs.docker.com/engine/installation/linux/docker-ce/ubuntu/>

{:.boxed}
> 이 묶음글은 아직 몇 회까지 쓸지 정하지 못했다. 조금 써보고,...
> 
> * [Docker: Getting Started with Docker]
> * _Docker: Installation and Test Drive_
> * [Docker: 나의 첫 Docker Image]
> * ['쓸만한' Docker Image 만들기 - Part 1]
> * ['쓸만한' Docker Image 만들기 - Part 2]
> * [Docker Cloud에서 자동빌드하기]
> * [Docker Machine으로 Docker Node 뿌리기]
> * [Docker Machine 다시 보기]
> * [Getting Started with Docker Swarm]
> * [Docker Swarm에 Service 올려보기]
> * [Docker Swarm 다시 보기]
> * [Docker Swarm의 고가용성]



# Install Docker on Ubuntu

늘 그렇듯이, 내가 사용하는 기본 플랫폼은 Ubuntu Linux다. 워낙 인기가 있는
배포본이면서, 동시에 제3자 설치를 위한 기능을 잘 만들어두었기 때문에 많은
ISV 들이 기본으로 지원하고 있다. 그 만큼 처음 설치도 편하고, 문제가 생겼을
때 도움을 얻기도 쉽다.


## Install from Repository

Docker는 Ubuntu 등의 유명한 플랫폼에 대하여 패키지 저장소를 제공하고 있다.
다음과 같은 방식으로, Docker 패키기 저장소를 시스템에 추가하고, GPG Key를
설치해서 패키지 서명을 검증할 수 있도록 할 수 있다.

먼저, GPG Key를 설치하는 과정은 아래와 같다. (특별할 것은 없으나...)

```console
$ curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
[sudo] password for sio4: 
OK
$ sudo apt-key fingerprint 0EBFCD88
pub   rsa4096 2017-02-22 [SCEA]
      9DC8 5822 9FC7 DD38 854A  E2D8 8D81 803C 0EBF CD88
uid           [ unknown] Docker Release (CE deb) <docker@docker.com>
sub   rsa4096 2017-02-22 [S]

$ 
```

그리고 `add-apt-repository` 명령을 써서 저장소를 등록한다. 공식 설명서에
따라 적기는 했지만, 사실 내가 좋아하는 방식은 아니다. 이 방식으로 저장소를
추가하게 되면, 그 내용은 `/etc/apt/sources.list` 파일에 추가되게 되는데,
내 경우 이 방식보다는 별도의 파일을 `/etc/apt/sources.list.d/` 아래에
새로 만드는 방식을 선호한다. 아무튼,

```console
$ sudo add-apt-repository \
>    "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
>    $(lsb_release -cs) \
>    stable"
$ grep docker /etc/apt/sources.list
deb [arch=amd64] https://download.docker.com/linux/ubuntu artful stable
# deb-src [arch=amd64] https://download.docker.com/linux/ubuntu artful stable
$ 
```

위와 같이, `add-apt-repository` 명령을 수행하고 나면 `sources.list` 파일이
변경된 것을 확인할 수 있다. 이제 `apt-get` 또는 `apt` 명령으로 추가된
저장소를 읽어오고 Docker 패키지를 설치할 차례다.


```console
$ sudo apt-get update
$ sudo apt-get install docker-ce
Reading package lists... Done
Building dependency tree       
Reading state information... Done
The following additional packages will be installed:
  aufs-tools cgroupfs-mount
The following NEW packages will be installed:
  aufs-tools cgroupfs-mount docker-ce
0 upgraded, 3 newly installed, 0 to remove and 8 not upgraded.
Need to get 29.9 MB of archives.
After this operation, 149 MB of additional disk space will be used.
Do you want to continue? [Y/n] 
<...>
$ 
```

설치는 `docker-ce`라는 이름의 하나의 패키지만 지정하여 설치 명령을 내리면
된다. 최소한의 패키지만 설치한 서버라면 조금 더 많은 의존하는 패키지가 함께
설치되는데, 내 Laptop은 이미 개발환경으로 사용하고 있기 때문에 `aufs-tools`,
`cgroupfs-mount` 등의 몇 개의 패키지만 추가로 설치되었으며 그 크기가 설치 후
약 150MB 정도이다. 나쁘지 않은 크기다.

이 크기는 Host OS에서 고정적으로 사용하는 추가 Disk 요구량이며, Container의
크기와는 관련이 없다. 또한, 향후 이 Host에서 많은 수의 Container와 Image를
운영하게 된다면 가변적으로 더 많은 Disk를 사용하게 될 것이다.

공식문서를 보면, 아래와 같은 설명이 있다.

> Docker CE is installed and running. The docker group is created but no users are added to it. You need to use sudo to run Docker commands. Continue to Linux postinstall to allow non-privileged users to run Docker commands and for other optional configuration steps.

맨 앞 부분은 설치가 끝나면 바로 실행이 된다는 말인데, 한 번 봐야지.

{:.wrap}
```console
$ ps axfwwww|grep docker
22445 ?        Ssl    0:01 /usr/bin/dockerd -H fd://
22452 ?        Ssl    0:00  \_ docker-containerd --config /var/run/docker/containerd/containerd.toml
$ 
```

음, 예전에 설치했을 때와는 조금 달라지긴 했는데, 아무튼 Toml 파일 하나를 물고
Docker Container Daemon이 동작하고 있는 것을 확인할 수 있다.

"_벌써 끝났어?_" (아... 이거 우리 형제들 유행어였는데... :-)

설치는 끝났다.



# Test Drive

새로운 기술을 접할 때, 그것에 친숙하지 않다면(대체로 그렇겠지만) 설치 이후가
막막할 수 있다. 예전에는 정말 그런 경험을 많이 했던 것 같은데, 요즘은 워낙
사용자 경험에 대한 개발자, 개발그룹의 고려가 높아서 많은 경우에 시운전을 할
수 있는 방식을 제공하거나 알려준다.


## Hello World

그런데, 그런데 Docker의 그것은 조금 특이하다. 바로, 개발자들에게는 매우
친숙한, 그 유명한 "**Hello World**"를 제공한다는 것!

대부분의 프로그래밍 언어의 개론 책은, 컴퓨터로 하여금 가징 간단한 프로그램을
실행하고 짧은 한 마디, "Hello World"를 출력하게 하는 바로 이 예제로 시작한다.
개발자 친화적인 이 Docker는 바로 이 방식을 활용하여 개발 Career의 사용자에게
친근하게 다가가는 접근방법을 취하고 있다.

이제, `docker run hello-world` 명령을 `sudo`로 실행해보면,

{:.wrap}
```console
$ sudo docker run hello-world
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
ca4f61b1923c: Pull complete 
Digest: sha256:66ef312bbac49c39a89aa9bcc3cb4f3c9e7de3788c944158df3ee0176d32b751
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (amd64)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
 https://cloud.docker.com/

For more examples and ideas, visit:
 https://docs.docker.com/engine/userguide/

$ 
```

아, "Hello World" 한 마디만 하고 끝나지는 않는구나! 하하...

### Docker Image, Registry

출력의 맨 앞 부분을 보면(이 부분은 Container 내부에서 내보내는 메시지가
아니라 `docker` 명령이 내보내는 명령이다.) "여기에 이미지가 없네요",
"받아옵니다", "다 받았아요" 등의 메시지가 나온다.

여기에서 포인트 하나: Docker Registry  
Docker로 Container를 실행하게 되면, 그 Container가 사용할 이미지를 찾다가,
그것이 자신의 손 안에 없다는 것이 확인되면 어디선가 그걸 받아오는 모습을
확인할 수 있다. 서버 가상화에서는 일반적으로 Disk 이미지를 Shared Storage에
두고 그것을 복수의 Host에서 배타적으로 접근할 수 있게 하지만, Docker는
중앙의 공유된 공간, Registry로부터 이미지를 받아서 Local에 내려놓은 후
이것을 기반으로 동작하게 되는 것이다.

{:.point}
Docker Registry
: Docker Registry는 Docker Image를 저장하는 중앙 저장소


그리고 또하나,  
이미지를 찾는 과정을 보니 `hello-world`를 찾는 것이 아니라 뒤에 꼬리를
붙여서 `hello-world:latest`를 받고 있다. 뭐지? 개발자라면 특히 익숙할
수 있는 개념, 객체에 대한 **Versioning**, **Tagging**이 적용된 것이다.

올롤롤롤로... 요것 봐라?

### How it works

그리고 그 아래, "Hello from Docker!"로 시작하는 내용들은 실제로 Container
안에서 실행된 Software가 내보낸 메시지인데, 그 내용은 "지금 당신이 명령을
내렸을 때, Docker는 이런 일을 했어요"라는 설명이다.

1. Docker Client가 Docker Daemon에게 접속했어요.
1. Docker Daemon은 `hello-world` 이미지를 Docker Hub에서 받아왔어요.
1. Docker Daemon은 받아온 이미지를 이용해서 Container를 만들었고,
   그 안에서 실행된 실행파일이 이 메시지 출력을 만든 거에요.
1. Docker Daemin은 그 출력을 Docker Client에게 쏘았고, 그게 다시 단말에
   보내진 겁니다.

친절하다.


## Something More Ambitious

친절하게 뭔가 더 해보라는데 안 해볼 수 없다. Something more ambitious한
것을 해보자.

```console
$ sudo docker run -it ubuntu bash
Unable to find image 'ubuntu:latest' locally
latest: Pulling from library/ubuntu
1be7f2b886e8: Pulling fs layer 
6fbc4a21b806: Download complete 
c71a6f8e1378: Download complete 
4be3072e5a37: Waiting 
06c6d2f59700: Waiting 
```

어? 뭔가 비슷한데 시간이 좀 걸린다. 시간이 걸리다 보니, 아까는 순식간에
지나쳐버린  메시지를 읽을 수 있게 되었는데...

"Pulling fs layer"라는 말이 나오고,

```console
$ sudo docker run -it ubuntu bash
Unable to find image 'ubuntu:latest' locally
latest: Pulling from library/ubuntu
1be7f2b886e8: Downloading  10.17MB/42.86MB
<...>
```

"Downloading",

```console
$ sudo docker run -it ubuntu bash
Unable to find image 'ubuntu:latest' locally
latest: Pulling from library/ubuntu
1be7f2b886e8: Extracting   21.1MB/42.86MB
<...>
```

"Extracting",

```console
$ sudo docker run -it ubuntu bash
Unable to find image 'ubuntu:latest' locally
latest: Pulling from library/ubuntu
1be7f2b886e8: Pull complete 
6fbc4a21b806: Pull complete 
c71a6f8e1378: Pull complete 
4be3072e5a37: Pull complete 
06c6d2f59700: Pull complete 
Digest: sha256:e27e9d7f7f28d67aa9e2d7540bdc2b33254b452ee8e60f388875e5b7d9b2b696
Status: Downloaded newer image for ubuntu:latest
root@57eda7264ad4:/# 
```

오... Pulling, Downloading, Extracting, 그리고 Pull complete로 받아오는
과정이 진행되는구나. 마지막 줄 얘기는 이따가 하고,

### Layered Image

Hello World를 실행할 때에는 동일한 출력을 볼 수 있었지만 딸랑 한 줄의
"Pull complete"가 있었을 뿐이다. 당연한 것 같은데, 하나의 Container를
실행했고, 이를 위한 하나의 이미지를 읽어왔으니까. 그런에 이번엔 무려
다섯 개의 이미지를 불러온 건가? 뭐지? 여러 개의 Disk가 붙어있는 건가?

힌트는 맨 첫번째 메시지의 `layer` 라는 단어에 있다. Docker가 사용하는
Disk Image는 한 장의 그림이 아니라 계층화된 이미지이며, 최종적으로
사용될 이미지는 이렇게 계층화된 이미지들의 투영으로 만들어진다.
그림으로 표현해보자면 아래와 같다. 기반 이미지를 두고, 그 위에 변경이나
추가, 삭제를 담은 계층들이 놓이게 되면, 그것을 위해서 투영해볼 때에는
그냥 모든 변경이 적용된 한 장의 이미지로 보이는 것이다.

![](/attachments/docker/docker-layered-image.png)

{:.point}
Docker Image
: Docker Image는 단계적으로 형성되어지는 Layered Image


### Interactive Execution

다시, 원래의 예제로 돌아가보면,

```console
$ sudo docker run -it ubuntu bash
root@8c698a801576:/# 
```

앞서 실행했던 Hello World가 몇 줄의 출력을 만들어내고 사라진 것과는 달리,
`root` 사용자의 Shell Prompt가 떨어졌다. 대화형 모드에 진입한 것인데,
이것은 위와 같이 `-i` 옵션과 `-t` 옵션을 사용했기 때문이다.

```console
  -i, --interactive                    Keep STDIN open even if not attached
  -t, --tty                            Allocate a pseudo-TTY
```

물론, 아무리 TTY를 붙이고 대화형으로 시작해도, 대화형 명령을 수행한 것이
아니라면, 그냥 그 명령을 수행하고 빠져나오게 된다.

```console
$ sudo docker run -it ubuntu ls -l
total 64
drwxr-xr-x   2 root root 4096 Jan 23 22:49 bin
drwxr-xr-x   2 root root 4096 Apr 12  2016 boot
drwxr-xr-x   5 root root  360 Feb  8 04:12 dev
drwxr-xr-x   1 root root 4096 Feb  8 04:12 etc
drwxr-xr-x   2 root root 4096 Apr 12  2016 home
drwxr-xr-x   8 root root 4096 Sep 13  2015 lib
drwxr-xr-x   2 root root 4096 Jan 23 22:49 lib64
drwxr-xr-x   2 root root 4096 Jan 23 22:49 media
drwxr-xr-x   2 root root 4096 Jan 23 22:49 mnt
drwxr-xr-x   2 root root 4096 Jan 23 22:49 opt
dr-xr-xr-x 328 root root    0 Feb  8 04:12 proc
drwx------   2 root root 4096 Jan 23 22:49 root
drwxr-xr-x   1 root root 4096 Jan 23 22:49 run
drwxr-xr-x   1 root root 4096 Jan 25 18:23 sbin
drwxr-xr-x   2 root root 4096 Jan 23 22:49 srv
dr-xr-xr-x  13 root root    0 Feb  8 04:12 sys
drwxrwxrwt   2 root root 4096 Jan 23 22:49 tmp
drwxr-xr-x   1 root root 4096 Jan 23 22:49 usr
drwxr-xr-x   1 root root 4096 Jan 23 22:49 var
$ 
```

### 격리환경

아무튼, 대화형 Shell을 사용하여 Container 안으로 진입했으니, 그 안을 잠깐
살펴보자.

```console
root@96bd7e150395:/# ls
bin   dev  home  lib64  mnt  proc  run   srv  tmp  var
boot  etc  lib   media  opt  root  sbin  sys  usr
root@96bd7e150395:/# pwd
/
root@96bd7e150395:/# du -sh 2>/dev/null
95M	.
root@96bd7e150395:/# 
```

오... 일단, 내 시스템과는 다른 모습의 파일시스템을 갖고 있다. 그리고 전체
시스템의 Disk 사용량이 고작 95MB 수준이다.

```console
root@96bd7e150395:/# ps axuf
USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root         1  0.0  0.0  18236  3312 pts/0    Ss   03:42   0:00 bash
root        12  0.0  0.0  34424  2880 pts/0    R+   03:43   0:00 ps axuf
root@96bd7e150395:/# w
 03:43:45 up 3 days, 14:43,  0 users,  load average: 0.41, 0.36, 0.44
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
root@96bd7e150395:/# ls /var/log
alternatives.log  bootstrap.log  dmesg     faillog  lastlog
apt               btmp           dpkg.log  fsck     wtmp
root@96bd7e150395:/# whoami
root
root@96bd7e150395:/# 
```

눈에 보이는 프로세스는 진입하면서 실행한 Shell 하나 뿐이고, 사용자도
없고 로그도 텅 비어있다.

```console
root@96bd7e150395:/# lastlog
Username         Port     From             Latest
root                                       **Never logged in**
daemon                                     **Never logged in**
bin                                        **Never logged in**
sys                                        **Never logged in**
sync                                       **Never logged in**
games                                      **Never logged in**
man                                        **Never logged in**
lp                                         **Never logged in**
mail                                       **Never logged in**
news                                       **Never logged in**
uucp                                       **Never logged in**
proxy                                      **Never logged in**
www-data                                   **Never logged in**
backup                                     **Never logged in**
list                                       **Never logged in**
irc                                        **Never logged in**
gnats                                      **Never logged in**
nobody                                     **Never logged in**
systemd-timesync                           **Never logged in**
systemd-network                            **Never logged in**
systemd-resolve                            **Never logged in**
systemd-bus-proxy                           **Never logged in**
_apt                                       **Never logged in**
root@96bd7e150395:/# 
```

등록된 사용자도 많지 않으며, 시스템을 사용한 흔적도 없다. 아, 이건
Shell을 바로 찍고 들어왔으니 뭐...

아무튼, 대충 격리 상태를 확인할 수는 있었다. 그런데 바깥에서는 어떻게
보일까? 그래서 아래처럼, 길~게 실행되는 `sleep` 명령을 내려놓고,

```console
root@a642d5f9492c:/# sleep 5
```

Host OS에서 보이는 모습을 살펴봤다. 앞으로 표시되는 화면에서, Prompt가
위와 같이 `root@idstring` 으로 시작하는 것은 Container 내부를 뜻하고,
그냥 `#`으로 표현한 것은 Host의 `root` 권한으로 실행한 명령과 출력을
뜻한다. (물론, `$`로 시작하면 Host의 일반 사용자가 실행한 명령이다.)

```console
$ ps axfww
<...>
22445 ?        Ssl    4:40 /usr/bin/dockerd -H fd://
22452 ?        Ssl    3:32  \_ docker-containerd --config /var/run/docker/containerd/containerd.toml
31256 ?        Sl     0:00      \_ docker-containerd-shim -namespace moby -workdir /var/lib/docker/containerd/daemon/io.containerd.runtime.v1.linux/moby/a642d5f9492cfc44a89a6bf7f6b0deacb100fd30ae218b3feab166ef4d80abb3 -address /var/run/docker/containerd/docker-containerd.sock -containerd-binary /usr/bin/docker-containerd -runtime-root /var/run/docker/runtime-runc
31274 pts/0    Ss     0:00          \_ bash
31569 pts/0    S+     0:00              \_ sleep 5
<...>
$ 
```

Docker Container 아래, `bash`와 `sleep`이 매달려 있는 모습을 확인할 수 있다.
어라? 궁금해지니까 조금 더 보자.

```console
$ mount |grep docker
/dev/sda1 on /var/lib/docker/plugins type ext4 (rw,relatime,errors=remount-ro,data=ordered)
/dev/sda1 on /var/lib/docker/overlay2 type ext4 (rw,relatime,errors=remount-ro,data=ordered)
overlay on /var/lib/docker/overlay2/da0c4dad7df377f72bfde27c162286b2f928b80f2db90eccc5319ca723dd2efb/merged type overlay (rw,relatime,lowerdir=/var/lib/docker/overlay2/l/KMTJXKSAOWXN4HCKEGYRTBVTET:/var/lib/docker/overlay2/l/G6AZFSUT6WWKHMR4INCYGRP7ZZ:/var/lib/docker/overlay2/l/2IYXZR7KKT4IJBXB2X2WYVXUOI:/var/lib/docker/overlay2/l/NAYDKTXGYXMA5JERFGUSK5T3UI:/var/lib/docker/overlay2/l/TAEFXGU4YCUKTVHFOPQYBCRCP2:/var/lib/docker/overlay2/l/QDJF7BROVUKXWNFHMFVDTMU3T5,upperdir=/var/lib/docker/overlay2/da0c4dad7df377f72bfde27c162286b2f928b80f2db90eccc5319ca723dd2efb/diff,workdir=/var/lib/docker/overlay2/da0c4dad7df377f72bfde27c162286b2f928b80f2db90eccc5319ca723dd2efb/work)
shm on /var/lib/docker/containers/a642d5f9492cfc44a89a6bf7f6b0deacb100fd30ae218b3feab166ef4d80abb3/shm type tmpfs (rw,nosuid,nodev,noexec,relatime,size=65536k)
nsfs on /run/docker/netns/8321650a45f0 type nsfs (rw)
$ 
```

앞의 두 줄은 잘 모르겠고, 눈에 띄는 것은 각각 `overlay`와 `shm` 형식으로
마운트된 두 파일시스템. 뭔가 길죽한 것이, 지금 실행 중인 Container와
관련이 있을 것 같다. (아래 `df`의 경우, 일반사용자로 실행하면 권한이 없기
때문에 아래의 내용은 보이지 않는다.)

{:.wrap}
```console
# df -h |grep docker
overlay                 11G  8.1G  2.3G  79% /var/lib/docker/overlay2/da0c4dad7df377f72bfde27c162286b2f928b80f2db90eccc5319ca723dd2efb/merged
shm                     64M     0   64M   0% /var/lib/docker/containers/a642d5f9492cfc44a89a6bf7f6b0deacb100fd30ae218b3feab166ef4d80abb3/shm
# 
```

일단, 경로명의 `merged`라는 부분을 보면, 앞서 봤던 Layered Image가 병합된
것이라는 것을 감잡을 수 있다. (아, 그렇다면 저 윗 줄의 길게 적힌, `:`으로
분리하여 연결한 것들은 각각의 Layer 들이라는 것도 짐작이 가능하다.
(찍지 말고 찾아보면 좋으련만...)

암튼, 뭐가 들어있나...

{:.wrap}
```console
# ls /var/lib/docker/overlay2/da0c4dad7df377f72bfde27c162286b2f928b80f2db90eccc5319ca723dd2efb/merged
bin   dev  home  lib64  mnt  proc  run   srv  tmp  var
boot  etc  lib   media  opt  root  sbin  sys  usr
# 
```

딱히 별건 없고, 앞서 Container 내부에서 봤던 `/`의 모습 같다. 확인을 위해,
Container 안에서 파일을 하나 만들고,

{:.wrap}
```console
root@a642d5f9492c:/# touch i_am_here
root@a642d5f9492c:/# ls
bin   dev  home       lib    media  opt   root  sbin  sys  usr
boot  etc  i_am_here  lib64  mnt    proc  run   srv   tmp  var
root@a642d5f9492c:/# 
```

다시 밖에서 확인해보니...

{:.wrap}
```console
# ls /var/lib/docker/overlay2/da0c4dad7df377f72bfde27c162286b2f928b80f2db90eccc5319ca723dd2efb/merged
bin   dev  home       lib    media  opt   root  sbin  sys  usr
boot  etc  i_am_here  lib64  mnt    proc  run   srv   tmp  var
# 
```

역시, 파일이 생성된 것을 볼 수 있다. 이번에는 `shm`도!

{:.wrap}
```console
root@a642d5f9492c:/# ls /dev/shm/
root@a642d5f9492c:/# touch /dev/shm/my_shm
root@a642d5f9492c:/# ls /dev/shm
my_shm
root@a642d5f9492c:/# 
```

이렇게 Container 안에서 만든 파일을 다시 Host에서 확인해보면,

{:.wrap}
```console
# ls /var/lib/docker/containers/a642d5f9492cfc44a89a6bf7f6b0deacb100fd30ae218b3feab166ef4d80abb3/shm
my_shm
# 
```

이번엔 반대로 Host에서 파일을 만들고 나서,

{:.wrap}
```console
# touch /var/lib/docker/containers/a642d5f9492cfc44a89a6bf7f6b0deacb100fd30ae218b3feab166ef4d80abb3/shm/file_from_host
# ls /var/lib/docker/containers/a642d5f9492cfc44a89a6bf7f6b0deacb100fd30ae218b3feab166ef4d80abb3/shm
file_from_host  my_shm
# 
```

반대로 Container에서 그것을 확인해본다.

{:.wrap}
```console
root@a642d5f9492c:/# ls /dev/shm
file_from_host  my_shm
root@a642d5f9492c:/# 
```

도대체, 왜 서로 통하는 것이냐? 라고 한다면... "그렇게 만들었으니까"가
답이겠지. 여기서 통한다는 것은, 단지 보이는 것만을 의미하는 것은 아니고,
VM과 같이, Guest OS가 모든 것을 통제하는 형식이 아니라, Host가 OS 역할을
수행하고 있다는 의미를 표현한 것이다. Disk OS는, Host에 의해 처리되고,
관리되고 있는 것이다.

```console
root@a642d5f9492c:/# mount |grep '\(/ \|/shm\)'
overlay on / type overlay (rw,relatime,lowerdir=/var/lib/docker/overlay2/l/KMTJXKSAOWXN4HCKEGYRTBVTET:/var/lib/docker/overlay2/l/G6AZFSUT6WWKHMR4INCYGRP7ZZ:/var/lib/docker/overlay2/l/2IYXZR7KKT4IJBXB2X2WYVXUOI:/var/lib/docker/overlay2/l/NAYDKTXGYXMA5JERFGUSK5T3UI:/var/lib/docker/overlay2/l/TAEFXGU4YCUKTVHFOPQYBCRCP2:/var/lib/docker/overlay2/l/QDJF7BROVUKXWNFHMFVDTMU3T5,upperdir=/var/lib/docker/overlay2/da0c4dad7df377f72bfde27c162286b2f928b80f2db90eccc5319ca723dd2efb/diff,workdir=/var/lib/docker/overlay2/da0c4dad7df377f72bfde27c162286b2f928b80f2db90eccc5319ca723dd2efb/work)
shm on /dev/shm type tmpfs (rw,nosuid,nodev,noexec,relatime,size=65536k)
root@a642d5f9492c:/# df
Filesystem     1K-blocks    Used Available Use% Mounted on
overlay         11468016 8483204   2382548  79% /
tmpfs              65536       0     65536   0% /dev
tmpfs            4040692       0   4040692   0% /sys/fs/cgroup
/dev/sda1       11468016 8483204   2382548  79% /etc/hosts
shm                65536       0     65536   0% /dev/shm
tmpfs            4040692       0   4040692   0% /proc/scsi
tmpfs            4040692       0   4040692   0% /sys/firmware
root@a642d5f9492c:/# 
```

아무튼, Container 안에서 본 파일시스템 정보는 위와 같다.

---

아이고... 숨차다. 여기서 쉬어간다.



### 함께 읽기

이 묶음글은 아직 몇 회까지 쓸지 정하지 못했다.

* [Docker: Getting Started with Docker]
* _Docker: Installation and Test Drive_
* [Docker: 나의 첫 Docker Image]
* ['쓸만한' Docker Image 만들기 - Part 1]
* ['쓸만한' Docker Image 만들기 - Part 2]
* [Docker Cloud에서 자동빌드하기]
* [Docker Machine으로 Docker Node 뿌리기]
* [Docker Machine 다시 보기]
* [Getting Started with Docker Swarm]
* [Docker Swarm에 Service 올려보기]
* [Docker Swarm 다시 보기]
* [Docker Swarm의 고가용성]

[Getting Started with Docker Swarm]:{% link _posts/cloudcomputing/2018-03-13-getting-started-with-docker-swarm.md %}
[Docker Machine 다시 보기]:{% link _posts/cloudcomputing/2018-03-09-little-more-about-docker-machine.md %}
[Docker Machine으로 Docker Node 뿌리기]:{% link _posts/cloudcomputing/2018-03-07-provision-docker-node-with-docker-machine.md %}
[Docker Cloud에서 자동빌드하기]:{% link _posts/cloudcomputing/2018-02-21-automated-build-with-docker-cloud.md %}
['쓸만한' Docker Image 만들기 - Part 2]:{% link _posts/cloudcomputing/2018-02-20-build-usable-docker-image-part2.md %}
['쓸만한' Docker Image 만들기 - Part 1]:{% link _posts/cloudcomputing/2018-02-19-build-usable-docker-image-part1.md %}
[Docker: 나의 첫 Docker Image]:{% link _posts/cloudcomputing/2018-02-14-build-my-first-docker-image.md %}
[Docker: Installation and Test Drive]:{% link _posts/cloudcomputing/2018-02-08-docker-installation-and-test-drive.md %}
[Docker: Getting Started with Docker]:{% link _posts/cloudcomputing/2018-02-08-getting-started-with-docker.md %}

