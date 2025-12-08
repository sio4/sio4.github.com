---
title: "Docker Machine 다시 보기"
subtitle: A Little More About Docker Machine
tags: ["Docker", "Container", "SoftLayer", "cloud-computing"]
categories: ["cloudcomputing"]
images: [/attachments/docker/docker-machine-more.jpg]
banner: /attachments/docker/docker-machine-more.jpg
date: 2018-03-09T21:44:00+0900
lastmod: 2018-03-17T00:30:00+0900
---
Docker Engine을 탑재한 Dockerized Host, Docker Node를 손쉽게 펼쳤다가, 다시
모았다가 하는 용도로 Docker Machine을 적절히 활용할 수 있을지 확인하기 위해
빠른 걸음으로 Docker Machine의 기능을 살펴봤었다.  기왕 보기 시작한 김에,
조금 더 자세히 문서와 CLI 도구의 세부 기능을 들여다 보았다.
<!--more-->

(Docker Machine의 개요를 담은 "**[Docker Machine으로 Docker Node 뿌리기]**"
를 먼저 참고하시면 좋습니다.)

![](/attachments/docker/docker-machine.jpg)
Dock!ron Man vs. War Machine!
{.caption .text-center}

> Docker에 대한 이 묶음글은 아직 몇 개를 쓸지 정하지 못했다. 써보고,...
> 
> * [Docker: Getting Started with Docker]
> * [Docker: Installation and Test Drive]
> * [Docker: 나의 첫 Docker Image]
> * ['쓸만한' Docker Image 만들기 - Part 1]
> * ['쓸만한' Docker Image 만들기 - Part 2]
> * [Docker Cloud에서 자동빌드하기]
> * [Docker Machine으로 Docker Node 뿌리기]
> * _Docker Machine 다시 보기_
> * [Getting Started with Docker Swarm]
> * [Docker Swarm에 Service 올려보기]
> * [Docker Swarm의 고가용성]
> * [Docker Swarm 다시 보기]
{.boxed}



이렇게 가정해보려고 한다.

1. 기본으로 설정되는 환경이 아닌, 내가 원하는 환경으로 맞추고 싶다.
1. 기본으로 설치되는 버전이 아닌, 내가 원하는 버전의 Engine을 올리고 싶다.
1. 이미 기동 중인 Host가 있는데, 새 버전으로 Engine을 올리고 싶다.
1. Container의 활용량에 따라 Host도 줄였다 늘렸다 하여 비용을 줄이자.

**이런 욕구를 채우고 싶다면, Docker Machine이 해줄 수 있는 범위, Docker
Machine을 활용할 수 있는 범위는 어디까지일까?**

이 궁금증을 풀기 위해, Docker Machine [공식 문서]를 천천히 다시 읽어봤고,
`docker-machine` 명령의 모든 부명령을 한 번씩 실행해 봤다.



# 내가 원하는 버전, 환경으로 맞추고 싶다요!

환경이라면 매우 다양한 것이 있을 것이다. 네트워크 환경, 스토리지 환경 등의
주변 환경을 비롯해서, Docker Engine의 기동환경이나 세부 설정을 비롯하여
사실, 지금으로써는 뭘 얼마나 해야 할지도 모르겠다.

아무튼, 길은 열어둬야 하겠기에 제일 먼저 확인하고 싶었던 것은 Docker Engine
세부 설정을 포함하여, 원격 Host의 각종 설정을 얼마나 쉽게 다룰 수 있는지가
궁금했다.



## Host 운영체계 관리를 위한 기능

중앙 집중식 관리도구가 있다면 편리하겠지만, 그런 도구가 있다고 하더라도
가끔은 (도구가 지원하지 않는) 세부 사항을 건드려야 할 필요가 있을 것 같다.
그러기 위해서는 Host의 각종 파일을 편집하거나, 복사해 넣거나 하는 작업을
할 수 있는 환경이 있어야 한다. 그것도 많은 Host 들에 대하여.

`docker-machine`이 제공하는 부명령 중, Host 운영체계의 관리에 사용할만한
것들을 뽑아보면, 다음과 같다.

| 부명령           | 설명                                                    |
|:-----------------|:--------------------------------------------------------|
| mount            | Mount or unmount a directory from a machine with SSHFS. |
| scp              | Copy files between machines                             |
| ssh              | Log into or run a command on a machine with SSH.        |


이미 잠깐 살펴봤던 SSH 접속 기능 외에도, SCP 복사 기능과 원격 Host의 특정
경로를 로컬에 Mount할 수 있는 기능이 제공되고 있었다. 특히, `mount` 명령은
눈이 딱 꽂힌다.



### Mount

가장 먼저 눈에 들어온 `mount` 명령을 한 번 사용해 봤다. 이 기능은 뒷단에서
SSH를 사용하는데, 이걸 사용하기 위해서는 먼저 `sshfs` 패키지가 설치되어
있어야 한다.

```console
$ apt show sshfs
Package: sshfs
<...>
Description: filesystem client based on SSH File Transfer Protocol
 sshfs is a filesystem client based on the SSH File Transfer Protocol.
 Since most SSH servers already support this protocol it is very easy
 to set up: i.e. on the server side there's nothing to do.  On the
 client side mounting the filesystem is as easy as logging into the
 server with ssh.
 .
 sshfs is FUSE (Filesystem in USErspace).

$ 
```

`sshfs`는 위의 패키지 설명처럼, SSH의 파일전송 기능을 이용하여 원격지의
파일에 접근할 수 있도록 돕는 FUSE 방식의 파일시스템이다. (사용자 영역의
파일시스템이라서, `root` 권한 없이 손쉽게 Mount를 할 수 있다.)

여담이지만, 내가 Android 폰의 SDCARD 백업이나 파일 전송을 위해 사용하는
방식이 이런 방식이다. 참고로, "**[Android Nougat, Rsync Backup 하기]**"에
대충 정리해 두었으니 궁금하면... ㅎㅎ

아무튼, 이 부명령의 사용법은 직관적이고 간단하다.

```console
$ mkdir worker01
$ docker-machine mount worker01:/etc worker01
$ ls worker01
NetworkManager          initramfs-tools          profile
X11                     inputrc                  profile.d
acpi                    insserv                  protocols
<...>
$
$ docker-machine mount worker01:/etc worker01 -u
$
```

위와 같이, 적당한 Mount Point를 준비한 후, `mount` 명령에 원격지 경로와
Mount Point를 차례대로 인수로 주면 끝. 위와 같이, 원격지의 파일이 그대로
보이며, 내 컴퓨터의 파일처럼 다룰 수 있게 된다.

이번엔 다른 경로를 연결해보자.

```console
$ docker-machine mount worker01:/var/lib/docker worker01
$
$ df -h worker01/
Filesystem                          Size  Used Avail Use% Mounted on
root@198.51.100.214:/var/lib/docker  24G  1.8G   22G   6% /home/sio4/worker01
$
$ mount |grep worker01
root@198.51.100.214:/var/lib/docker on /home/sio4/worker01 type fuse.sshfs (rw,nosuid,nodev,relatime,user_id=1000,group_id=1000)
$
```

SSH에 의한 연결이기는 하지만, 바탕에 깔린 파일시스템의 사용량도 정확히
표현해준다. Image를 비롯한 Docker의 각종 파일이 설치된 위치를 Mount 했으니
그 안도 살짝 들여다 본다.

```console
$ ls worker01/
aufs     containerd  image    overlay2  runtimes  tmp    volumes
builder  containers  network  plugins   swarm     trust
$
$ ls worker01/overlay2/
l
$ ls worker01/aufs/
diff  layers  mnt
$
```

어? 이미 Image를 받아서 Container까지 돌려봤는데 `overlay2` 아래가 비었네?
그 대신 `aufs` 폴더가 만들어져 있는데... 이게 무슨 일인가!  공식 문서에
나와있기를,

<https://docs.docker.com/install/linux/docker-ce/ubuntu/#supported-storage-drivers>

> Docker EE on Ubuntu supports overlay2 and aufs storage drivers.
> 
> * For new installations on version 4 and higher of the Linux kernel, overlay2 is supported and preferred over aufs.
> * For version 3 of the Linux kernel, aufs is supported because overlay or overlay2 drivers are not supported by that kernel version.
>
> If you need to use aufs, you need to do additional preparation as outlined below.
>
> For Ubuntu 16.04 and higher, the Linux kernel includes support for OverlayFS, and Docker CE uses the overlay2 storage driver by default.

(맨 첫줄에 `EE`라고 되어있는 것은, `EE` 버전의 문서와 `CE` 버전의 문서를
Copy & Paste 하는 과정에서 생긴 Typo 같다. PR 올렸다.)

문서에는 이렇게, 리눅스 커널 버전 4 이상을 사용하는 경우에는 `overlay2`가
지원/우선이고, Ubuntu 16.04 이상에서는 `overlay2`가 기본으로 사용된다고
하는데... 혹시 버전이 다른가?

```console
$ docker-machine ssh worker01 lsb_release -ds
Ubuntu 16.04.3 LTS
$ 
```

그것도 아니다.  추측해보면, 아마도 Docker Machine이 기본으로 사용하는 설치
스크립트는 기존 시스템과의 호환성을 고려하여 보다 넓은 지원 영역을 갖도록
`aufs`로 설치를 하는 것 같다. --> "내가 원하는 환경"이 아니네!

아무튼, 조금 더 보자.

```console
$ docker-machine mount worker01:/etc worker01
$ docker-machine mount worker02:/etc worker02
$
$ diff -u */hosts
--- worker01/hosts      2018-03-07 13:47:43.000000000 +0900
+++ worker02/hosts      2018-03-07 19:29:45.000000000 +0900
@@ -7,5 +7,5 @@
 ff02::1        ip6-allnodes
 ff02::2        ip6-allrouters
 ff02::3        ip6-allhosts
-127.0.1.1      worker01.example.com    worker01
+127.0.1.1 worker02
 
$ 
```

설치된 두 기계의 `/etc/hosts`를 비교해봤다. 뜬금없이 왜 했을까? 아무튼,
이 파일에 자신의 정보가 잘못 들어가 있다. 왜지? ... 기억을 더음어 보니,
두 번째 Host를 만들기 위한 `create` 명령을 내릴 때, 맨 뒤의 Nodename만
바꾸고 긴 명령행 속의 `--softlayer-hostname`은 바꾸지 않았던 것 같다.

이럴 수가... :-(

`/etc`를 열은 김에, Docker 서비스에 대한 `systemd` 설정도 열어봤다.

```console
$ cat worker01/systemd/system/docker.service.d/10-machine.conf
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd -H tcp://0.0.0.0:2376 -H unix:///var/run/docker.sock --storage-driver aufs --tlsverify --tlscacert /etc/docker/ca.pem --tlscert /etc/docker/server.pem --tlskey /etc/docker/server-key.pem --label provider=softlayer
Environment=
$
```

아... 여기에서 스토리지 설정 등을 하고 있었네... 스토리지에 대한 것은
이 파일을 바꾸고 다시 띄워주면 되긴 하겠다.



### SCP & SSH

이미 앞선 글이나 이 글의 앞 부분에서, 수 차례 `ssh` 부명령을 이용하여
원격 Host에 접근하는 것을 해봤다. Docker Machine은, 이 외에도 `scp`
부명령도 지원하며 이 명령을 이용하여 파일을 여기 저기로 복사할 수 있다.

```console
$ echo "MY ORDER" > my.order
$ docker-machine scp my.order worker01:/tmp
my.order                                      100%    9     1.7KB/s   00:00
$
$ docker-machine scp worker01:/tmp/my.order worker02:/tmp/my.order
$
$ docker-machine scp worker02:/etc/hosts hosts
hosts                                         100%  256    33.0KB/s   00:00
$
```

위에서 장난스럽게 해본 것과 같이,

0. 일단 여기 Local에 파일을 하나 만들고,
1. Local에서 `worker01`에게 던져보고,
1. `worker01`에서 `worker02`에게도 던져보고,
1. 다시 `worker02`에서 Local로 받기도 해봤다.

이 때, Local과 원격의 작업은 1:1로 전송이 이루어지기 때문에 `scp`에 의한
전송 출력이 눈에 보이는데, 원격과 원격 사이의 작업은 Local을 경유하여,
위의 경우에는 `worker01`에서 Local에 임시로 땡긴 후, 다시 Local의 임시
파일을 `workder02`에게 보내는 방식으로 이루어진다. (그래서 헷갈리는 출력을
없앤 모양이다.)

```console
$ docker-machine scp --help
Usage: docker-machine scp [OPTIONS] [arg...]

Copy files between machines

Description:
   Arguments are [[user@]machine:][path] [[user@]machine:][path].

Options:

   --recursive, -r      Copy files recursively (required to copy directories)
   --delta, -d          Reduce amount of data sent over network by sending only the differences (uses rsync)
   --quiet, -q          Disables the progress meter as well as warning and diagnostic messages from ssh
$ 
```

참고로, 위와 같이 몇 개의 옵션을 제공하는데, `-r` 옵션은 폴더를 통째로
옮기려 할 때, 그리고 `-d` 옵션은 `scp` 방식이 아닌 `rsync` 방식으로
증분 전송을 하기 위해 사용한다.

---

이렇게, `ssh`, `scp`, `mount` 등의 부명령을 사용하면 원격지 파일을 간단히
수정하거나, 대규모 설정 또는 Application 데이터를 전송하거나 하는 일을
간단하게 수행할 수 있을 것 같다.

이 정도면 설정, 데이터 등에 대한 원격관리는 문제가 없겠다.



## Docker Engine 관리를 위한 기능

앞서, 운영체계 수준에서 설정이나 데이터를 쉽게 다룰 수 있는 기능에 대해
살펴봤다. 그렇다면 Docker Engine은 어떻게 다뤄야 할까?

아래 표는 `docker-machine`이 제공하는 Engine 관련 부명령의 목록이다. (아!
이런 분류는 Official한 것이 아니고, 내가 그냥 편의 상 하는 거임.)


| 부명령           | 설명                                                    |
|:-----------------|:--------------------------------------------------------|
| inspect          | Inspect information about a machine                     |
| provision        | Re-provision existing machines                          |
| regenerate-certs | Regenerate TLS Certificates for a machine               |
| upgrade          | Upgrade a machine to the latest version of Docker       |

`docker` 명령에서도 많이 봤던 `inspect`가 여기에도 있다. 그리고 `provision`
등도 있는데... 먼저,


### Inspect

`inspect`의 경우, 아래와 같이 해당 Host Machine에 대한 상세 정보를 JSON
형식으로 뿌려주는 명령이다.

```console
$ docker-machine inspect worker01
{
    "ConfigVersion": 3,
    "Driver": {
        "IPAddress": "198.51.100.214",
        "MachineName": "worker01",
        "SSHUser": "root",
        "SSHPort": 22,
        "SSHKeyPath": "/home/sio4/.docker/machine/machines/worker01/id_rsa",
        "StorePath": "/home/sio4/.docker/machine",
        "SwarmMaster": false,
        "SwarmHost": "tcp://0.0.0.0:3376",
        "SwarmDiscovery": "",
        "Id": 50000073,
        "Client": {
            "User": "tony.stark",
            "ApiKey": "22f9......1a01",
            "Endpoint": "https://api.softlayer.com/rest/v3"
        },
        "SSHKeyID": 1000005
    },
    "DriverName": "softlayer",
<...>
$
```

이렇게, VSI(Virtual Server Instance) 제어를 위한 Driver 특유의 정보들을
비롯한 다양한 정보를 보여준다. (전체 내용은 맨 아래에...

![](/attachments/docker/docker-machine-10-keys.png)
참고: Docker Machine에 의해 자동 생성된 ssh key는 SoftLayer 관리콘솔에도
함께 등록된다. (이후, Provisioning 시 참조됨)
{.caption .text-center}


### Provision, Regenerate Certs, and Upgrade

다음으로 눈에 띄는 명령은 `provision`이다. 어? 이미 `create` 가 있는데
이건 뭐지? 설명을 보니,

```console
$ docker-machine provision --help
Usage: docker-machine provision [arg...]

Re-provision existing machines
$ 
```

이미 만들어져 있는 기계를 다시 갈아엎는 명령이었다. 그리고, 이 부명령은
별도의 옵션이 없다. 있는 설정을 그대로 쓴다는 뜻이다. 왜 필요한거냐?
아직은 확신이 서지 않는다. 아무튼,

```console
$ docker-machine provision worker01
Waiting for SSH to be available...
Detecting the provisioner...
Installing Docker...
Copying certs to the local machine directory...
Copying certs to the remote machine...
Setting Docker configuration on the remote daemon...
$
```

이렇게, 기존에 존재하는 VSI에 SSH로 접속을 한 후, Docker Engine을 새로
설치하고 기타 설정을 마무리하는 모양이다. (코드는 아직 보지 않았다.)

`regenerate-certs`라는 명령은, 아마도 certs가 노출되었거나 기타 보안의
이유로 certs를 새로 만들 때 사용하는 명령인 것 같다. 기능과 옵션 설명은
아래와 같고,

```console
$ docker-machine regenerate-certs --help
Usage: docker-machine regenerate-certs [OPTIONS] [arg...]

Regenerate TLS Certificates for a machine

Description:
   Argument(s) are one or more machine names.

Options:

   --force, -f          Force rebuild and do not prompt
   --client-certs       Also regenerate client certificates and CA.
$
```

돌려보자. (좀 길게 보이는 건 파일 검사 부분이 끼어 있어서...)

```console
$ pushd $HOME/.docker/machine/machines/worker01; md5sum server*; popd
~/.docker/machine/machines/worker01 ~/docker
0cf228dadebe5824bd9a419e130b2508  server-key.pem
2932f0ca71d1df631f77bc05b22635f8  server.pem
~/docker
$ 
$ docker-machine regenerate-certs -f worker01
Regenerating TLS certificates
Waiting for SSH to be available...
Detecting the provisioner...
Installing Docker...
Copying certs to the local machine directory...
Copying certs to the remote machine...
Setting Docker configuration on the remote daemon...
$
$ pushd $HOME/.docker/machine/machines/worker01; md5sum server*; popd
~/.docker/machine/machines/worker01 ~/docker
37ae80d71b8f614734656a96499fecfd  server-key.pem
aca35c6c06050f95c1f99746d1aa9b7c  server.pem
~/docker
$
```

위와 같이, 첫 토막에서는 목표 기계의 Certs 파일을 미리 확인했고, 다음
토막에서 `regenerate-certs` 명령을 실행한 후, 다시 마지막 토막에서
새로 만들어진 파일을 확인했다.

그런데... `regenerate-certs` 명령의 출력을 보면, 맨 앞의 "Regenerating
TLS certificates" 부분만 다르고 나머지 과정은 `provision`과 동일하다.
어찌보면, `regenerate-certs`는 `provision`을 약간 확장한 정도?

다음은 `upgrade` 명령을 실행한 결과인데, 이것 역시 큰 차이는 없다.
그리고 어차피 새로 설치한 거라서 업데이트가 있지도 않고... (그런데 그냥
Upgrading... Restarting... 을 하네? 아마 버전 검사 없이 무조건 새 버전을
설치하는 것은 아닌가 싶다.

```console
$ docker-machine upgrade worker02
Waiting for SSH to be available...
Detecting the provisioner...
Upgrading docker...
Restarting docker...
$
```

---

대충 봤더니, `scp`, `mount` 등을 이용한 파일 관리나, `ssh`를 이용한
원격 명령 수행 등은 매우 유용해 보인다. 하지만 `provision`, `upgrade`
등은 옵션도 없고 기능이 제한적이어서 크게 유용해 보이지는 않는다.



# 에잇! 그냥 다시 시작!


에잇! 모르겠다. 여전히 베일에 가려지 부분이 많잖아!

하지만 클라우드 컴퓨팅이 왜 좋냐? 여차하면 헌 Instance 버리고 새 Instance
만들어 내는 것이 클라우드 컴퓨팅 아닌가!  심지어 Docker Engine 설치도
완전히 자동화가 되어있는 Docker Machine을 쓰는 마당에!


## 내 마음대로 다시 구성하기

새로 설치하자. 앞선 실수(?)를 보완하여 아예 배포 방식을 바꿔보면 된다.

```console
$ docker-machine create \
	--engine-label mode=standalone --engine-label cluster=dev \
	--engine-storage-driver overlay2 \
	--driver softlayer \
	--softlayer-user tony.stark \
	--softlayer-api-key 22f9......1a01 \
	--softlayer-cpu 2 --softlayer-memory 2 \
	--softlayer-network-max-speed 1000 \
	--softlayer-region seo01 \
	--softlayer-hourly-billing \
	--softlayer-domain example.com \
	--softlayer-hostname dev01 \
	dev01
Running pre-create checks...
Creating machine...
(dev01) Creating SSH key...
(dev01) SSH key dev01 (1000005) created in SoftLayer
(dev01) Getting Host IP
(dev01) Waiting for host to become available
(dev01) Waiting for host setup transactions to complete
Waiting for machine to be running, this may take a few minutes...
Detecting operating system of created instance...
Waiting for SSH to be available...
Detecting the provisioner...
Provisioning with ubuntu(systemd)...
Installing Docker...
Copying certs to the local machine directory...
Copying certs to the remote machine...
Setting Docker configuration on the remote daemon...
Checking connection to Docker...
Docker is up and running!
To see how to connect your Docker Client to the Docker Engine running on this virtual machine, run: docker-machine env dev01
$
```

실제로 저렇게 친 건 아니지만, 이 글에서는 보기 좋게 줄바꿈을 해봤다.

먼저, 두 개의 Label을 달았다. 나중에 다시 보겠지만, Label을 달아주면 보다
논리적인 방식으로 Engine의 성능, 용도, 구성 등을 구분하여 관리할 수 있게
될 것이라고 생각한다. 그리고 명시적으로 `--engine-storage-driver` 옵션을
주어 이 Engine이 사용할 스토리지 방식을 지정했다. 마지막으로 Driver 관련
옵션을 기존과 같이 넣어줬고, 이름도 잘 줬다.

![](/attachments/docker/docker-machine-01-create.png)
Virtual Server Instance가 생성되는 과정을 SoftLayer 관리콘솔에서 확인한 모습
{.caption .text-center}


### 유용한 옵션들

Docker Host를 생성할 때, 엔진과 관련하여 사용할 수 있는 옵션이 몇 개 있다.
그 중에서 당장 눈에 띄는 것은,

먼저 `--engine-install-url` 이라는 옵션인데, 설명은

> Custom URL to use for engine installation `[$MACHINE_DOCKER_INSTALL_URL]`

라고 되어있고, 기본값은 `https://get.docker.com`이다. 이 URL은 설치문서에
[convenience script]라고 표현되어 있는 스크립트인데, 이에 대한 설명은 다음과
같다.

> Docker provides convenience scripts at get.docker.com and test.docker.com for installing edge and testing versions of Docker CE into development environments quickly and non-interactively. The source code for the scripts is in the docker-install repository. Using these scripts is not recommended for production environments, and you should understand the potential risks before you use them:
>
> * The scripts require root or sudo privileges to run. Therefore, you should carefully examine and audit the scripts before running them.
> * The scripts attempt to detect your Linux distribution and version and configure your package management system for you. In addition, the scripts do not allow you to customize any installation parameters. This may lead to an unsupported configuration, either from Docker’s point of view or from your own organization’s guidelines and standards.
> * The scripts install all dependencies and recommendations of the package manager without asking for confirmation. This may install a large number of packages, depending on the current configuration of your host machine.
> * The script does not provide options to specify which version of Docker to install, and installs the latest version that is released in the “edge” channel.
> * Do not use the convenience script if Docker has already been installed on the host machine using another mechanism.

아... 지난 글에서, 몇일 만에 Docker의 버전이 `17.12`에서 `18.02`로 갑자기
올라갔는지 궁금했는데, 의문이 풀렸다. 이 "convenience script"는 편리할 수는
있겠지만 설치되는 버전이 `edge` 였던 것이다. (이 스크립트가 하는 역할을 먼저
파악해야 대체 스크립트를 만들어 넣을텐데, 일단은 생략했다.)

또, `--engine-env` 나 `--engine-opt` 는 Engine 실행을 위한 환경과 옵션을
지정할 수 있게 돕고 있다. (이건 나중에...)


### 라벨! 라벨! 라벨!

(아... 어디선가 "라벨이 아니고 레이블입니다..." 하는 소리가 들리는 것 같다.
먼저 "'버내:너' 하나 드시고 오세요...")

마지막으로, `--engine-label` 옵션이 눈에 띈다.  

내가 워낙 Tagging을 좋아하긴 하는데, 이렇게 기계의 특성에 따라, 또는 용도에
따라 Tagging, Labeling을 해두면


```console
$ docker-machine ls
NAME       ACTIVE   DRIVER      STATE     URL                         SWARM   DOCKER        ERRORS
dev01      -        softlayer   Running   tcp://198.51.100.222:2376           v18.02.0-ce
dev02      -        softlayer   Running   tcp://198.51.100.216:2376           v18.02.0-ce
worker01   *        softlayer   Running   tcp://198.51.100.214:2376           v18.02.0-ce
worker02   -        softlayer   Running   tcp://198.51.100.220:2376           v18.02.0-ce
$
$ docker-machine ls --filter label=cluster=dev
NAME    ACTIVE   DRIVER      STATE     URL                         SWARM   DOCKER        ERRORS
dev01   -        softlayer   Running   tcp://198.51.100.222:2376           v18.02.0-ce
dev02   -        softlayer   Running   tcp://198.51.100.216:2376           v18.02.0-ce
$
$ docker-machine ls --filter label=cluster=dev
NAME    ACTIVE   DRIVER      STATE     URL                         SWARM   DOCKER        ERRORS
dev01   -        softlayer   Running   tcp://198.51.100.222:2376           v18.02.0-ce
dev02   -        softlayer   Running   tcp://198.51.100.216:2376           v18.02.0-ce
$
```

뭐, 너무 단순한 예지만, 이렇게 대상을 구분할 때 유용하게 사용할 수 있다.

이 글의 주제인 "내가 원하는..."이라는 궁금증을 풀기 위한 내용은 이상으로
대충 알아봤다. 시작한 김에, 나머지 주요 부명령에 대해서도 정리해 둔다.



# 마저 들여다 본 Docker Machine CLI

아직 둘러보지 않은 남은 부명령을 분류하자면, 하나는 VM을 관리하기 위한
명령들이고, 다른 하나는 상태, 환경 등에 대한 정보 수집을 위한 명령들이다.


## Virtual Machine 관리를 위한 기능

먼저, VM을 관리하기 위한 명령으로는 아래와 같은 것들이 있다.

| 부명령           | 설명                                                    |
|:-----------------|:--------------------------------------------------------|
| create           | Create a machine                                        |
| ls               | List machines                                           |
| stop             | Stop a machine                                          |
| start            | Start a machine                                         |
| restart          | Restart a machine                                       |
| kill             | Kill a machine                                          |
| status           | Get the status of a machine                             |
| rm               | Remove a machine                                        |

`create`와 `ls`는 이미 여러 번 봐서 눈에 익고, 다른 것들도 이름을 보면
감이 온다.


### List

상태 확인을 위해 익히 사용해봤기 때문에, `--filter`를 사용한 예를 몇 개
더 보는 것으로 이건 넘어가자.

```console
$ docker-machine ls
NAME       ACTIVE   DRIVER      STATE     URL                         SWARM   DOCKER        ERRORS
dev01      -        softlayer   Running   tcp://198.51.100.222:2376           v18.02.0-ce
dev02      -        softlayer   Running   tcp://198.51.100.216:2376           v18.02.0-ce
worker01   *        softlayer   Running   tcp://198.51.100.214:2376           v18.02.0-ce
worker02   -        softlayer   Stopped                                       Unknown
$
$ docker-machine ls --filter state=stopped
NAME       ACTIVE   DRIVER      STATE     URL   SWARM   DOCKER    ERRORS
worker02   -        softlayer   Stopped                 Unknown
$
$ docker-machine ls --filter label=cluster=dev
NAME    ACTIVE   DRIVER      STATE     URL                         SWARM   DOCKER        ERRORS
dev01   *        softlayer   Running   tcp://198.51.100.222:2376           v18.02.0-ce
dev02   -        softlayer   Running   tcp://198.51.100.216:2376           v18.02.0-ce
$
$ docker-machine ls --filter name=wo
NAME       ACTIVE   DRIVER      STATE     URL   SWARM   DOCKER    ERRORS
worker01   *        softlayer   Running   tcp://198.51.100.214:2376           v18.02.0-ce
worker02   -        softlayer   Stopped                                       Unknown
$
```


### Remove

다음은 만들었던 기계를 날리는데 사용하는 `rm` 명령이다.

```console
$ docker-machine rm --help
Usage: docker-machine rm [OPTIONS] [arg...]

Remove a machine

Description:
   Argument(s) are one or more machine names.

Options:

   --force, -f  Remove local configuration even if machine cannot be removed, also implies an automatic yes (`-y`)
   -y           Assumes automatic yes to proceed with remove, without prompting further user confirmation
$
```

옵션과 관련해서, 처음 기계를 만들려고 시도했을 때, API Key를 잘못 입력해서
Service Provider가 오류를 반환한 적이 있었다. 그 때, 오류가 발생했음에도
불구하고, Docker Machine의 정보에는 그 기계의 정보가 남아서 같은 이름의
기계를 정상적인 API Key로 만들 때 오류가 났었다. 그 때, 이 잘못 만들어진
정보를 지우려고 `rm` 명령을 처음 썼는데... 역시 API 오류가 나며 지워지지도
않았다. 잘못된 Key도 기억하고 있었던 것.  
이런 상황에서 `-f` 옵션을 사용하게 되면, 클라우드 제공자로부터 VM을 지우는
API Call이 실패를 반환하더라도 Local에 남아있는 그 기계에 대한 정보는
지워지게 되어 이 꼬인 상황에서 빠져나오는데 도움이 됐었다.

```console
$ docker-machine rm worker01
About to remove worker01
WARNING: This action will delete both local reference and remote instance.
Are you sure? (y/n): y
(worker01) Canceling SoftLayer instance 50004741...
(worker01) Removing SSH Key 1090069...
Successfully removed worker01
$
$ docker-machine ls
NAME       ACTIVE   DRIVER      STATE     URL                         SWARM   DOCKER        ERRORS
dev01      -        softlayer   Running   tcp://198.51.100.222:2376           v18.02.0-ce
dev02      -        softlayer   Running   tcp://198.51.100.216:2376           v18.02.0-ce
worker02   -        softlayer   Running   tcp://198.51.100.220:2376           v18.02.0-ce
$
```

위와 같이, 지우는 명령을 내리면, 클라우드 제공자에게 접속하여 기계 자체와
관련된 모든 것을 지워주게 되며, 정상적으로 지워지고 나면 Local의 정보 역시
지워버리게 된다.

![](/attachments/docker/docker-machine-02-remove.png)
기계를 지운 후, 관리콘솔에서 Cancellation 요청이 접수된 것을 확인할 수 있음
{.caption .text-center}


### Start, Stop, Kill and Restart

좀 순서가 뒤집어진 것 같은데, 이제 VM의 Lifecycle을 관리하는 `start`,
`stop`, `kill`, 그리고 `restart` 등에 대해서 간단히 정리한다. (매우
직관적인 명령들이라서 긴 설명은 필요하지 않을 것 같다.)

```console
$ docker-machine stop worker02
Stopping "worker02"...
Machine "worker02" was stopped.
$
```

기계를 끄고,

```console
$ docker-machine kill worker02
Killing "worker02"...
Machine "worker02" was killed.
$
```

만약 꺼지지 않는다면 강제로 죽이기 위한 명령.

![](/attachments/docker/docker-machine-03-kill.png)
전원 강제 차단에 의해, 연결이 끊어지고 네트워크 모니터링 경보가 발생한 상태
{.caption .text-center}

그리고,

```console
$ docker-machine ls --filter state=stopped
NAME       ACTIVE   DRIVER      STATE     URL   SWARM   DOCKER    ERRORS
worker02   -        softlayer   Stopped                 Unknown   
$
```

꺼진 기계는 `Stopped` 상태로 표시된다.

꺼져있는 기계를 켜려면,

```console
$ docker-machine start worker02
Starting "worker02"...
Machine "worker02" was started.
Waiting for SSH to be available...
Detecting the provisioner...
Started machines may have new IP addresses. You may need to re-run the `docker-machine env` command.
$
```

친절한 설명이 인상적이다. 그리고 명령이 종료되는 시점은 API Call을 했거나
API에 대한 결과가 반환되는 시점이 아니라, 최종적으로 SSH 접속까지 되었을
때 반환하게 된다.

이러한 특성은 스크립트 작업을 할 때, 만약 SSH 접속 등, 동작할 준비가 되지
않은 채로 명령이 종료되어 후속 작업을 위해 사용자가 직접 Connection 시험을
해야 하는 불편함을 막아준다. 그렇다면, 이 대기시간으로 인해 병렬 작업이
불편할 수 있을 것이라는 생각이 들지만,

```console
$ docker-machine stop dev01 dev02
Stopping "dev01"...
Stopping "dev02"...
Machine "dev01" was stopped.
Machine "dev02" was stopped.
$ 
```

이렇게 여러 기계 이름을 인수로 주었을 때, Machine이 알아서 병렬 작업을
해주기 때문에, 이를 고려하여 작업 정의를 한다면 걱정할 필요가 없다.

참고로, 병렬작업은 Process Forking으로 일어나게 되며, 얼마나 많은 작업을
동시에 처리하는지는 확인이 필요할 것 같다. (특히, Provider의 API 동시 접근
특성에 대한 고려도 필요할 것이고.)

```console
$ ps axf |grep docker-machi[n]
29358 pts/9    Sl+    0:00  |   \_ docker-machine start dev01 dev02 worker02
29364 pts/9    Sl+    0:00  |       \_ /home/sio4/.local/bin/docker-machine
29372 pts/9    Sl+    0:00  |       \_ /home/sio4/.local/bin/docker-machine
29381 pts/9    Sl+    0:00  |       \_ /home/sio4/.local/bin/docker-machine
$ 
```

엥? 그런데!

```console
$ docker-machine start dev01 dev02 worker02
Starting "dev01"...
Starting "worker02"...
Starting "dev02"...
Machine "dev01" was started.
Waiting for SSH to be available...
Machine "worker02" was started.
Waiting for SSH to be available...
Detecting the provisioner...
Detecting the provisioner...
Get https://api.softlayer.com/rest/v3/SoftLayer_Virtual_Guest/50000201/powerOn.json: read tcp 10.0.0.87:39856->66.228.119.120:443: read: connection reset by peer
$ 
```

이런 일이 뭐... 있을 수도 있지! T.T

Production에서 쓰려면 `softlayer` Driver에 대하여 Provider의 API 특성에
맞게 잘 개발이 되었는지, 불필요한 접속유지는 없는지, 그리고 저 상황은
단일 기계에 대한 접속이 끊어진 것 같은데 이게 하나의 Child Process가
종료됨에 따라 부모가 함께 죽은 것인지 아니면 다른 두 Child Process도
문제상황을 만난 것인지 Code 점검이 필요할 것 같다. (나머지 둘은 API
단계를 벋어난 것 같은데 왜 같이 죽었을까?)

![](/attachments/docker/docker-machine-04-restarted.png)
VSI가 되살아나는 모습을 SoftLayer 관리콘솔에서 확인한 모습: 경보는 아직
남아있고 연결은 되지 않았으나, 전원이 켜져 있음
{.caption .text-center}

마지막으로, `restart` 명령은 이렇게,

```console
$ docker-machine restart worker02
Restarting "worker02"...
Waiting for SSH to be available...
Detecting the provisioner...
Restarted machines may have new IP addresses. You may need to re-run the `docker-machine env` command.
$
```

그리고 `status` 명령은 이렇게 동작한다.

```console
$ docker-machine status worker02
Running
$
```

휴~ 먼 길을 왔다. 이제 마지막으로, 상태정보를 확인하는 부명령이다.



## 상태와 환경 정보

앞서 `status` 명령과 같이 VM의 가동 상태를 보는 것도 있지만, 그 외의
논리적인 정보를 확인할 수 있는 부명령으로는 아래와 같은 것들이 있다.

| 부명령 | 설명                                                                |
|:-------|:--------------------------------------------------------------------|
| active | Print which machine is active                                       |
| config | Print the connection config for machine                             |
| env    | Display the commands to set up the environment for the Docker client|
| ip     | Get the IP address of a machine                                     |
| url    | Get the URL of a machine                                            |
| use    | (Bash shell warpper에 의해 지원됨                                   |

먼저, 이미 앞선 글에서 봤던 `active` 명령

```console
$ docker-machine active
worker01
$
```

이 명령은, 현재 선택된 Host를 반환하게 되며, `docker` 등의 명령이 실행될
때, 그 명령을 받게 되는 실제 기계를 반환하게 된다.

그리고 `config` 명령은 아래와 같이, Docker Engine API에 접속할 때 사용될
환경에 대해 알려주고,

```console
$ docker-machine config dev01
--tlsverify
--tlscacert="/home/sio4/.docker/machine/machines/dev01/ca.pem"
--tlscert="/home/sio4/.docker/machine/machines/dev01/cert.pem"
--tlskey="/home/sio4/.docker/machine/machines/dev01/key.pem"
-H=tcp://198.51.100.222:2376
$
```

`ip` 명령과 `url` 명령은 인수로 받은 기계에 대한 IP 정보와 API 접근을 위한
URL 정보를 반환한다.  

특히 클라우드 컴퓨팅 환경에서는, (앞서 `start`나 `restart` 명령의 출력에서
경고한 바와 같이, 기계를 다시 시작했을 때 IP가 바뀔 수가 있다. 그래서 만약,
스크립트 작업을 하면서 특정 기계에게 현재 할당된 IP를 알아야 한다면, 매우
유용하게 사용할 수 있는 명령이 `ip`와 `url`이다.

```console
$ docker-machine ip dev01
198.51.100.222
$
```

이렇게, 그리고

```console
$ docker-machine url dev01
tcp://198.51.100.222:2376
$
```

이렇게 동작한다.

마지막으로, `env` 명령은 지난 글에서 사용했었기 때문에 설명이 필요 없다.

```console
$ docker-machine env dev01
export DOCKER_TLS_VERIFY="1"
export DOCKER_HOST="tcp://198.51.100.222:2376"
export DOCKER_CERT_PATH="/home/sio4/.docker/machine/machines/dev01"
export DOCKER_MACHINE_NAME="dev01"
# Run this command to configure your shell: 
# eval $(docker-machine env dev01)
$
```

그런데! 그런데, 이게 좀 불편하지 않은가? 그냥 환경설정이 되어버리면
좋은데 변수만 반환하다니... 부르르...

그러다, 우연히 Tab Auto Completion을 통해 확인된 명령이 하나 더 있으니,
그게 `use`라는 명령이다. 명령 이름에서 감이 오는데, 이 명령을 내리면
위의 `eval $(docker-machine env dev01)`을 실행한 것과 동일한 효과를 내게
된다.

이 `use` 명령은, 아래와 같은 도움말을 보여주는데, 이게 `docker-machine`의
내장 명령은 아니고, 함께 설치한 Bash Auto Completion 스트립트에 포함된
Wrapper 함수에 의해 제공되는 것이다.

```console
$ docker-machine use --help
Usage: docker-machine use [OPTIONS] [arg...]

Evaluate the commands to set up the environment for the Docker client

Description:
   Argument is a machine name.

Options:

   --swarm      Display the Swarm config instead of the Docker daemon
   --unset, -u  Unset variables instead of setting them

$
```

그래서,

```console
$ docker-machine ls
NAME       ACTIVE   DRIVER      STATE     URL                         SWARM   DOCKER        ERRORS
dev01      -        softlayer   Running   tcp://198.51.100.222:2376           v18.02.0-ce
dev02      -        softlayer   Running   tcp://198.51.100.216:2376           v18.02.0-ce
$ 
$ docker-machine use dev01
Active machine: dev01
$ docker-machine ls
NAME       ACTIVE   DRIVER      STATE     URL                         SWARM   DOCKER        ERRORS
dev01      *        softlayer   Running   tcp://198.51.100.222:2376           v18.02.0-ce
dev02      -        softlayer   Running   tcp://198.51.100.216:2376           v18.02.0-ce
$ 
$ docker-machine use dev02
Active machine: dev02
$ docker-machine ls
NAME       ACTIVE   DRIVER      STATE     URL                         SWARM   DOCKER        ERRORS
dev01      -        softlayer   Running   tcp://198.51.100.222:2376           v18.02.0-ce
dev02      *        softlayer   Running   tcp://198.51.100.216:2376           v18.02.0-ce
$ 
$ docker-machine use -u
Active machine:
$ docker-machine ls
NAME       ACTIVE   DRIVER      STATE     URL                         SWARM   DOCKER        ERRORS
dev01      -        softlayer   Running   tcp://198.51.100.222:2376           v18.02.0-ce
dev02      -        softlayer   Running   tcp://198.51.100.216:2376           v18.02.0-ce
$
```

이렇게... 보다 쉽게 Active Host를 전환할 수 있다. (이게 왜 문서에는 없을까?
PR을 하나 만들까... 다른 이유가 있을테니 참을까... :-(


---

휴~ 길다. 너무 길다.

아무튼, 이로써, Docker Machine이 가지고 있는 기능은 사용자 관점에서
모두 살펴본 것 같다. 조금 더 진도를 나간 후, 만약 이걸 사용하게 된다면
Code Level로 조금 더 살펴봐야 할 것 같다.





# 부록

### Docker Host에 대한 Inspection 결과

`docker-machine inspect` 명령의 전체 출력 결과는 아래와 같다.

```json
{
    "ConfigVersion": 3,
    "Driver": {
        "IPAddress": "198.51.100.222",
        "MachineName": "dev01",
        "SSHUser": "root",
        "SSHPort": 22,
        "SSHKeyPath": "/home/sio4/.docker/machine/machines/dev01/id_rsa",
        "StorePath": "/home/sio4/.docker/machine",
        "SwarmMaster": false,
        "SwarmHost": "tcp://0.0.0.0:3376",
        "SwarmDiscovery": "",
        "Id": 50000073,
        "Client": {
            "User": "tony.stark",
            "ApiKey": "22f9......1a01",
            "Endpoint": "https://api.softlayer.com/rest/v3"
        },
        "SSHKeyID": 1000005
    },
    "DriverName": "softlayer",
    "HostOptions": {
        "Driver": "",
        "Memory": 0,
        "Disk": 0,
        "EngineOptions": {
            "ArbitraryFlags": [],
            "Dns": null,
            "GraphDir": "",
            "Env": [],
            "Ipv6": false,
            "InsecureRegistry": [],
            "Labels": [
                "mode=standalone",
                "cluster=dev"
            ],
            "LogLevel": "",
            "StorageDriver": "overlay2",
            "SelinuxEnabled": false,
            "TlsVerify": true,
            "RegistryMirror": [],
            "InstallURL": "https://get.docker.com"
        },
        "SwarmOptions": {
            "IsSwarm": false,
            "Address": "",
            "Discovery": "",
            "Agent": false,
            "Master": false,
            "Host": "tcp://0.0.0.0:3376",
            "Image": "swarm:latest",
            "Strategy": "spread",
            "Heartbeat": 0,
            "Overcommit": 0,
            "ArbitraryFlags": [],
            "ArbitraryJoinFlags": [],
            "Env": null,
            "IsExperimental": false
        },
        "AuthOptions": {
            "CertDir": "/home/sio4/.docker/machine/certs",
            "CaCertPath": "/home/sio4/.docker/machine/certs/ca.pem",
            "CaPrivateKeyPath": "/home/sio4/.docker/machine/certs/ca-key.pem",
            "CaCertRemotePath": "",
            "ServerCertPath": "/home/sio4/.docker/machine/machines/dev01/server.pem",
            "ServerKeyPath": "/home/sio4/.docker/machine/machines/dev01/server-key.pem",
            "ClientKeyPath": "/home/sio4/.docker/machine/certs/key.pem",
            "ServerCertRemotePath": "",
            "ServerKeyRemotePath": "",
            "ClientCertPath": "/home/sio4/.docker/machine/certs/cert.pem",
            "ServerCertSANs": [],
            "StorePath": "/home/sio4/.docker/machine/machines/dev01"
        }
    },
    "Name": "dev01"
}
```










[공식 문서]:https://docs.docker.com/machine/
[convenience script]:https://docs.docker.com/install/linux/docker-ce/ubuntu/#install-using-the-convenience-script



### 함께 읽기

이 묶음글은 아직 몇 회까지 쓸지 정하지 못했다.

* [Docker: Getting Started with Docker]
* [Docker: Installation and Test Drive]
* [Docker: 나의 첫 Docker Image]
* ['쓸만한' Docker Image 만들기 - Part 1]
* ['쓸만한' Docker Image 만들기 - Part 2]
* [Docker Cloud에서 자동빌드하기]
* [Docker Machine으로 Docker Node 뿌리기]
* _Docker Machine 다시 보기_
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


[Android Nougat, Rsync Backup 하기]:{{< relref "/blog/android/2017-10-23-backup-android-nougat-with-rsync.md" >}}

