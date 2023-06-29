---
title: "Docker Machine으로 Docker Node 뿌리기"
subtitle: Docker is Not In My BackYard, But on the Cloud!
tags: ["Docker", "Container", "SoftLayer", "cloud-computing"]
categories: ["cloudcomputing"]
image: /attachments/docker/docker-machine.jpg
banner: /attachments/docker/docker-machine.jpg
date: 2018-03-07T22:16:00+0900
last_modified_at: 2018-03-09T13:16:00+0900
---
Docker를 개인 목적이 아닌 어느 정도 규모가 있는 서비스를 위해 사용하려고
한다면, Container가 구동될 복수의 Host Node를 어떻게 쉽게 관리할 것인지
등에 대한 약간의 인프라 관점의 접근이 필요하다. 이번 글에서는 클라우드를
포함한 원격지에 Docker Node를 손쉽게 구성하는 방법, Docker Machine에 대해
정리하려고 한다.


지난 몇 편의 묶음글을 통해 Docker와 Container가 무엇인지, Docker를 어떻게
내 컴퓨터에 설치하는지, 그리고 내 목적에 맞는 Container를 돌리려면 어떻게
Image를 만들어야 하는지 등에 대하여 Docker를 시작하는 사람, 또는 개발자의
입장에서 정리를 했었다. 조금 방향을 바꿔서, **이번 글은 인프라 관점에서
원격지에 위치한 다수의 Docker Node를 손쉽게 Provision하고 관리기 위하여,
Docker 프로젝트의 식구 중 하나인 Docker Machine을 활용하는 방법에 대하여
정리한다.** 


> Docker에 대한 이 묶음글은 아직 몇 개를 쓸지 정하지 못했다. 써보고,...

* [Docker: Getting Started with Docker]
* [Docker: Installation and Test Drive]
* [Docker: 나의 첫 Docker Image]
* ['쓸만한' Docker Image 만들기 - Part 1]
* ['쓸만한' Docker Image 만들기 - Part 2]
* [Docker Cloud에서 자동빌드하기]
* _Docker Machine으로 Docker Node 뿌리기_
* [Docker Machine 다시 보기]
* [Getting Started with Docker Swarm]
* [Docker Swarm에 Service 올려보기]
* [Docker Swarm의 고가용성]
* [Docker Swarm 다시 보기]


물론, 어떤 영역이든, 하나의 결과를 위해 단 하나의 방법만 사용할 수 있는
것은 아니다. 어쨌든 Docker Machine은, Docker 생태계를 이루는 다양한
프로젝트 중에서 가장 기본이 되면서 Docker 프로젝트의 공식 프로젝트라는
점에서 눈여겨 볼 필요가 있을 것 같다. 글은 다음과 같은 순서로 진행된다.


* TOC
{:toc}



# What is Docker Machine

[Docker Machine] 공식 문서를 보면, Docker Machine을 다음과 같이 설명하고
있다.

> Docker Machine enables you to provision multiple remote Docker hosts
> on various flavors of Linux.

또는,

> Docker Machine is a tool for provisioning and managing your Dockerized
> hosts (hosts with Docker Engine on them).

앞선 묶음글에서 설치했던 Docker Engine은 내 무릅 위의 이 기계에 설치되었다.

* 사실, 이 기계는 무릅 위에 있지 않고 책상 위에 있다.
* 사실, 이 기계를 흔히들 Laptop이라고 부르지만 실제는 Desktop이다.

(닥치고,)  
또한, 예시로 실행했던 모든 Container, 만들었던 모든 Image는 이 Laptop에
저장되고 실행되었던 것들이다.  
이와는 달리 Docker Machine은, Docker Engine을 사용자 앞의 기계가 아닌
클라우드 컴퓨팅 VM을 비롯한 **원격지의 서버에** 설치할 수 있도록 돕는다.
또한, 원격지 서버에 들어가서 Local에 설치하듯 설치하는 것이 아니라,
**원격 조정으로** 설치할 수 있도록 해준다. 그것 뿐만 아니라! 명령 하나로
**아직 존재하지도 않는 기계를 새로 만들어서 Engine까지 한 방에** 설치해주는
멋진 도구다!

{:.point}
Docker Machine
: Not In My BackYard, But on the Cloud!

크고 무겁고 지저분한 Container는 내 뒷마당 말고 구름 위로.
어라? 전엔 Container가 작고 가볍다고 했었던가?  
일단 설치부터 해보자.



## Install Docker Machine

공식 설치 설명서인 [Install Machine]를 보면 각각의 OS에 따른 설치방법을
간결하게 설명하고 있다. 나는 (이번에도 역시) Ubuntu Linux 기반에서 이걸
설치할 것이며, 아래와 같이 설치를 돕기 위한 스크립트를 작성했다.
(왜 나는 딱 한 번 실행할 작업을 스크립트로 만들고 있는 것인가...)


{:.wrap}
```bash
#!/bin/bash

gh="https://github.com"
gh_raw="https://raw.githubusercontent.com"
repo="docker/machine"
version="v0.14.0"
arch=`uname -s`-`uname -m`

# now it is standard exec path for users.
mkdir -p $HOME/.local/bin

curl -fsSL -o $HOME/.local/bin/docker-machine \
        $gh/$repo/releases/download/$version/docker-machine-$arch
chmod +x $HOME/.local/bin/docker-machine

# I use personal bash completion directory.
for i in "-prompt" "-wrapper" ""; do
        name="docker-machine$i.bash"
        curl -fsSL -o $HOME/.bash_completion.d/$name \
                $gh_raw/$repo/$version/contrib/completion/bash/$name
done
```

간단하다.  
앞의 몇 줄에서 변수를 설정하는 것은 크게 설명할 것이 없으니 잊고, 첫번째
`curl` 부터가 설치 과정의 설명으로써 의미가 있다. Docker Machine의 경우,
Docker 공식 Download 페이지가 아닌 Github에서 Release로 배포하고 있으며,
위와 같이 `curl` 명령을 사용해서 간단하게 내려받을 수 있다.

Docker Machine은 Docker Engine 처럼 시스템 권한으로 동작하는 서비스가
아니라 사용자가 사용하는 도구, Tool이다. 그래서, 만약 이 도구의 사용자가
나 혼자라면 구태여 `/usr`, `/usr/local`, `/opt` 등의 시스템 경로에 설치할
필요가 없다. 그래서, 내 경우에는 근래에 개인용 실행파일(Executable)을
담는 공간으로 애용되는 `$HOME/.local/bin`에 설치했다. (공식 문서에서는
`/usr/local`에 설치하는 것으로 설명하고 있지만, 꼭 그럴 필요는 없다는
말이다.)

두 번째 단락은 사용을 편하게 하기 위해서 Bash Auto Completion을 구성하는
부분인데, 이 스크립트에서 사용된 경로는 내가 개인적으로 사용하는 방식을
따르는 것이기 때문에 동작하지 않을 수 있다. 일반적으로는,
`$HOME/.bash_completion.d` 아래가 아닌 `/etc/bash_completion.d`에 넣어야
한다.



명확하게 스크립트를 이용해서 설명하다 보니, 쉘스크립트에 익숙하지 않다면
더 복잡하게 느껴질 수가 있겠다. 간단히 말하면, 그냥 Github에서 받아서
적당한 경로에 넣으면 끝난다는 뜻인데... :-(

### Install

아무튼, 위의 스크립트를 돌려 Docker Machine을 설치하였고, 원하는 위치에
정상적으로 설치되었는지 확인해 보았다.

{:.wrap}
```console
$ ./docker-machine.sh 
$ which docker-machine 
/home/sio4/.local/bin/docker-machine
$ docker-machine version
docker-machine version 0.14.0, build 89b8332
$ 
```

위와 같이, 설치는 아무런 출력 없이 끝났고, (파일이 20MB가 넘기 때문에
약간 시간이 걸릴 수 있다.) 명령어의 위치를 `which`로 확인해보니, 원하는
곳에 잘 들어갔다. 그리고 `docker-machine version`을 실행했더니, 위와
같이 버전이 `0.14.0`이고, Build 번호가 `89b8332`이라고 말하고 있다.
잘 끝났다는 뜻이다.

Bash Auto Completion도 잘 되는지 보자. 먼저 파일이 잘 들어왔는지 보고,

{:.wrap}
```console
$ ls ~/.bash_completion.d
docker-machine-prompt.bash  docker-machine-wrapper.bash  docker-machine.bash
$ 
```

실제로 동작하는지 보자. (아! 이건 Bash가 기동될 때 읽어지므로 쉘을 다시
열어야 한다. 대부분의 경우가 그렇겠지만 내 경우, Login Shell이 아니더라도
읽어오도록 설정되어 있으므로 Login을 다시 할 필요는 없고 Shell만 다시
열면 된다.)

{:.wrap}
```console
$ docker-machine <TAB>
active            ip                restart           stop
config            kill              rm                upgrade
create            ls                scp               url
env               mount             ssh               use
help              provision         start             version
inspect           regenerate-certs  status            
$ docker-machine 
```

잘 되는군. 위와 같이, 명령어를 입력하다가 TAB 키를 눌러주면, 다음으로 올
수 있는 보조명령, 옵션, 값 등의 예가 자동으로 보여주는 것이 바로 Auto
Completion이다. (혹시 익숙하지 않을까봐. 사실, 이 블로그는, 나중에 치매가
와서 젊은 시절의 기억을 잃은 내게 주는 선물이라서... 최대한 자세히...)



# Provision Docker Node on the Cloud

이제 Docker Machine을 My Computer에 설치했다면, Docker Node, Dockerized Host,
뭐라 부르든 그것을 Someone else's Computer에 설치할 차례다.

> There is no cloud. It's just someone else's computer.

Docker Machine은 Amazon Web Service, MS Azure, Google Compute Engine 등의
주요 클라우드 컴퓨팅 서비스를 비롯해서, OpenStack, VMware vSphere, 그리고
VirtualBox 등의 설치형 가상환경에 이르는 다양한 환경을 지원한다.
이러한 기반 환경의 지원은 각각에 대한 Driver를 통해서 제공되는데, 겉으로
보이는 부분만 보면, 최초에 Node를 생성할 때에만 이 Driver를 지정해주면 된다.
일단 각각의 환경에 따른 API를 사용하여 VM을 만들고 나면, SSH를 통하여
시스템을 제어하거나 Docker API를 이용하여 Docker의 기능을 활용하게 되며,
**다양한 기반에 설치된 Docker Node 들을 기반에 대한 구분이나 고려 없이
한방에 관리**할 수 있게 된다.

아무튼,


## Provision Docker Node on SoftLayer

이 글에서는 SoftLayer라는 이름으로 더 잘 알려진 IBM Cloud IaaS 서비스를
활용하여 Docker Node를 배포하려고 한다. 이 환경에 대한 Driver는
`softlayer`라는 이름으로 제공된다.


### Create a Node

먼저, 아래와 같이 `docker-machine create` 명령을 이용하면 VM을 생성하고
그 위에 Docker Engine을 구성하는 과정을 자동으로 처리해준다.

{:.wrap}
```console
$ docker-machine create --driver softlayer --softlayer-user tony.stark --softlayer-api-key <my_api_key> --softlayer-hostname worker01 --softlayer-domain example.com --softlayer-cpu 2 --softlayer-memory 2 --softlayer-network-max-speed 1000 --softlayer-region seo01 --softlayer-hourly-billing worker01
Creating CA: /home/sio4/.docker/machine/certs/ca.pem
Creating client certificate: /home/sio4/.docker/machine/certs/cert.pem
Running pre-create checks...
Creating machine...
(worker01) Creating SSH key...
(worker01) SSH key worker01 (1094969) created in SoftLayer
(worker01) Getting Host IP
(worker01) Waiting for host to become available
(worker01) Waiting for host setup transactions to complete
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
To see how to connect your Docker Client to the Docker Engine running on this virtual machine, run: docker-machine env worker01
$ 
```

맨 첫 두 줄의 출력, Creating CA 등은 맨 처음 Docker Machine을 실행했기
때문에 나오는 줄이며, 그 이후의 줄은 클라우드 서비스에 API로 접속하여
VM을 만들고, SSH Key를 만들어 넣어 접속이 가능하도록 설정하고, VM이 완전히
배치되기를 기다렸다가 Docker Engine을 설치하는 과정을 차례대로 표시하고
있다.

마지막에, Up and Running! 반갑다.


### Driver Specific Options

각 클라우드 서비스는 그들 고유의 특성과 방식이 있기 때문에, Driver는 해당
서비스에 맞는 옵션을 제공하게 되는데, 위 화면에서 가령, `--softlayer-user`
등과 같이, Driver 명을 접두어로 한 옵션이 이런 Driver 특성을 반영한 옵션을
지시하는 것이다.

VirtualBox 등의 설명은 `create` 명령을 `-h`로 실행했을 때 보여주는 옵션
목록에나 Auto Completion되는 옵션에 표시가 되지만, SoftLayer의 옵션은
확인이 되지 않는다. 상세 옵션은
[Github의 설명파일](https://github.com/docker/docker.github.io/blob/master/machine/drivers/soft-layer.md)을
확인해야 한다. ...고 (제품 완결성에 비해 좀 이상하다고) 생각했는데,


#### 수정, 2018-03-08

{:.boxed.wrap}
> 글을 쓴 후에, 천천히 다시 들여다보고 있는데, 그 과정에서 다음과 같은
> 내용을 발견했다.
>
> ```console
> $ docker-machine create -h
> Usage: docker-machine create [OPTIONS] [arg...]
> 
> Create a machine
> 
> Description:
>    Run 'docker-machine create --driver name --help' to include the create flags for that driver in the help text.
> 
> Options:
> <...>
> ```
>
> Driver 별로 달라지는 옵션은 위와 같이, `--driver name --help`라고 명하면
> 보여준다고 한다.
>
> ```console
> $ docker-machine create --driver softlayer --help
> Usage: docker-machine create [OPTIONS] [arg...]
> 
> Create a machine
> 
> Description:
>    Run 'docker-machine create --driver name --help' to include the create flags for that driver in the help text.
> 
> <...>
>    --softlayer-api-endpoint "https://api.softlayer.com/rest/v3"			softlayer api endpoint to use [$SOFTLAYER_API_ENDPOINT]
>    --softlayer-api-key 								softlayer user API key [$SOFTLAYER_API_KEY]
>    --softlayer-cpu "1"								number of CPU's for the machine [$SOFTLAYER_CPU]
> <...>
> $ 
> ```
>
> 어, 정말이다. 자세하게 다 보여준다. 그리고,
>
> ```console
> $ docker-machine create --driver softlayer --<TAB>
> --driver                       --softlayer-memory
> --engine-env                   --softlayer-network-max-speed
> --engine-insecure-registry     --softlayer-private-net-only
> --engine-install-url           --softlayer-private-vlan-id
> --engine-label                 --softlayer-public-vlan-id
> --engine-opt                   --softlayer-region
> --engine-registry-mirror       --softlayer-user
> --engine-storage-driver        --swarm
> --help                         --swarm-addr
> --softlayer-api-endpoint       --swarm-discovery
> --softlayer-api-key            --swarm-experimental
> --softlayer-cpu                --swarm-host
> --softlayer-disk-size          --swarm-image
> --softlayer-domain             --swarm-join-opt
> --softlayer-hostname           --swarm-master
> --softlayer-hourly-billing     --swarm-opt
> --softlayer-image              --swarm-strategy
> --softlayer-local-disk         --tls-san
> sio4@light:~$ docker-machine create --driver softlayer --
> ```
>
> 이렇게, Auto Completion도 잘 된다. (Tab을 누르기 전에, `--`를 먼저
> 입력하는 것이 키다.)




### List Nodes

동일한 방식으로 하나의 노드를 더 추가한 후, 아래와 같이 `docker-machine ls`
명령을 사용하여 이 Docker Machine 하에서 구성되고 관리되는 Node 들의 목록을
확인해봤다.

```console
$ docker-machine ls
NAME       ACTIVE   DRIVER      STATE     URL                         SWARM   DOCKER        ERRORS
worker01   -        softlayer   Running   tcp://198.51.100.214:2376           v18.02.0-ce   
worker02   -        softlayer   Running   tcp://198.51.100.220:2376           v18.02.0-ce   
$ 
```

오... 좋다. `worker01`과 `worker02`라는 이름의 두 기계가 목록에 들어와 있다.
앞에서부터, 이름, 활성여부(이건 나중에 본다.), Driver, 상태, Docker API URL
등의 정보가 주르륵 나오고, 마지막에 Docker 버전 정보까지 잘 나오고 있다.



## Seeing is Believing

목록에 Docker 버전 정보까지 나오니 설치가 정상적으로 된 것이라는 확신은
생기지만, 직접 보지 않고 넘어가는 성격이 아니니 해당 기계에 접속해 봐야겠다.

클라우드 서비스의 관리콘솔에 접속해서 만들어진 VM이 잘 떠있는지 확인했고,
접속정보를 확인하여 SSH로 접속해봤다.

{:.wrap}
```console
$ ssh root@198.51.100.214
root@198.51.100.214's password: 
Welcome to Ubuntu 16.04.3 LTS (GNU/Linux 4.4.0-112-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  Get cloud support with Ubuntu Advantage Cloud Guest:
    http://www.ubuntu.com/business/services/cloud

59 packages can be updated.
23 updates are security updates.


root@worker01:~# 
```

오... 붙네. Ubuntu 16.04.3, LTS 버전이란다.

참고로, 다음과 같이 `docker-machine ssh` 명령을 쓰면, 아까 VM을 만들 때
주입한 SSH Key를 사용해서, 계정과 암호를 사용하지 않고도 쉽게 접근할 수
있다.

{:.wrap}
```console
$ docker-machine ssh worker01
Welcome to Ubuntu 16.04.3 LTS (GNU/Linux 4.4.0-112-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  Get cloud support with Ubuntu Advantage Cloud Guest:
    http://www.ubuntu.com/business/services/cloud

59 packages can be updated.
23 updates are security updates.


Last login: Wed Mar  7 04:58:43 2018 from 203.0.113.1
root@worker01:~# 
```


### Docker Engine Service

프로세스가 잘 떠있는지 보자.

```console
root@worker01:~# ps axf |grep [d]ocker
 5146 ?        Ssl    1:14 /usr/bin/dockerd -H tcp://0.0.0.0:2376 -H unix:///var/run/docker.sock --storage-driver aufs --tlsverify --tlscacert /etc/docker/ca.pem --tlscert /etc/docker/server.pem --tlskey /etc/docker/server-key.pem --label provider=softlayer
 5153 ?        Ssl    2:36  \_ docker-containerd --config /var/run/docker/containerd/containerd.toml
root@worker01:~# 
```

있네. 조금 더 세련되게, `systemctl` 명령으로 보자.


```console
root@worker01:~# systemctl status docker.service
● docker.service - Docker Application Container Engine
   Loaded: loaded (/lib/systemd/system/docker.service; enabled; vendor preset: enabled)
  Drop-In: /etc/systemd/system/docker.service.d
           └─10-machine.conf
   Active: active (running) since Wed 2018-03-07 04:50:55 UTC; 9min ago
     Docs: https://docs.docker.com
 Main PID: 5146 (dockerd)
   CGroup: /system.slice/docker.service
           ├─5146 /usr/bin/dockerd -H tcp://0.0.0.0:2376 -H unix:///var/run/docker.sock --storage-driver aufs --tlsverify --tlscacert /etc/docker/ca.pem --tlscert /etc/docker/server.pem --tlskey /etc/docker/server-key.pem --label provider=softlayer
           └─5153 docker-containerd --config /var/run/docker/containerd/containerd.toml

Mar 07 04:50:54 worker01 dockerd[5146]: time="2018-03-07T04:50:54.877731157Z" level=warning msg="Your kernel does not support cgroup rt runtime"
Mar 07 04:50:54 worker01 dockerd[5146]: time="2018-03-07T04:50:54.879958463Z" level=info msg="Loading containers: start."
Mar 07 04:50:55 worker01 dockerd[5146]: time="2018-03-07T04:50:55.192941941Z" level=info msg="Default bridge (docker0) is assigned with an IP address 172.17.0.0/16. Daemon option --bip can be used to set a preferred IP address"
Mar 07 04:50:55 worker01 dockerd[5146]: time="2018-03-07T04:50:55.305890315Z" level=info msg="Loading containers: done."
Mar 07 04:50:55 worker01 dockerd[5146]: time="2018-03-07T04:50:55.313421770Z" level=warning msg="Couldn't run auplink before unmount /var/lib/docker/tmp/docker-aufs-union369295134: exec: \"auplink\": executable file not found in $PATH"
Mar 07 04:50:55 worker01 dockerd[5146]: time="2018-03-07T04:50:55.356672649Z" level=info msg="Docker daemon" commit=fc4de44 graphdriver(s)=aufs version=18.02.0-ce
Mar 07 04:50:55 worker01 dockerd[5146]: time="2018-03-07T04:50:55.356828309Z" level=info msg="Daemon has completed initialization"
Mar 07 04:50:55 worker01 dockerd[5146]: time="2018-03-07T04:50:55.369438561Z" level=info msg="API listen on /var/run/docker.sock"
Mar 07 04:50:55 worker01 systemd[1]: Started Docker Application Container Engine.
Mar 07 04:50:55 worker01 dockerd[5146]: time="2018-03-07T04:50:55.372767040Z" level=info msg="API listen on [::]:2376"
root@worker01:~# 
```

서비스가 등록되어, 정상적으로 가동중인 것과, 실행 과정에서 발생한 로그를
볼 수 있었다. 마지막으로, `docker version` 명령으로, 설치된 Docker 버전을
확인하고 내부적인 동작여부를 간접적으로 확인해보자.


{:.wrap}
```console
root@worker01:~# docker version
Client:
 Version:	18.02.0-ce
 API version:	1.36
 Go version:	go1.9.3
 Git commit:	fc4de44
 Built:	Wed Feb  7 21:16:33 2018
 OS/Arch:	linux/amd64
 Experimental:	false
 Orchestrator:	swarm

Server:
 Engine:
  Version:	18.02.0-ce
  API version:	1.36 (minimum version 1.12)
  Go version:	go1.9.3
  Git commit:	fc4de44
  Built:	Wed Feb  7 21:15:05 2018
  OS/Arch:	linux/amd64
  Experimental:	false
root@worker01:~# 
```

어라? 그러고보니 Docker 버전이 몇일 만에 앞 자리가 바뀌었네? 지난 글에서
최신버전으로 설치했던 Docker가 `17.x` 였던 것에 비하면... 뭐가 바뀌었는지
갑자기 궁금해진다만, 오늘의 주제는 그게 아니다.



# Test Drive

이제 이 글의 마지막 단락으로 넘어왔다. 설치만 잘 된건지 동작도 잘 하는지
확인할 시운전 순서.


## Again, What is Docker Machine?

그런데, (기억하지 못하겠지만, 나도 어거지로 쓰고 있지만,) 처음 설치를
끝내고 Auto Completion을 확인할 때, `docker-machine`의 부명령 목록을
볼 수 있었다. 거기에는 새 Node를 만드는 `create`를 비롯해서 Node를
켜고(`start`) 끄고(`stop`) 지우는(`rm`) 등의 관리 명령이 있을 뿐, 전에
`docker` 명령을 사용해서 했던 `run`, `pull` 등의 Image나 Container에
관련된 명령은 보지 못한 것 같다. 다시 상기해보면,

```console
$ docker-machine help
Usage: docker-machine [OPTIONS] COMMAND [arg...]

Create and manage machines running Docker.

<...>

Commands:
  active		Print which machine is active
  config		Print the connection config for machine
  create		Create a machine
  env			Display the commands to set up the environment for the Docker client
  inspect		Inspect information about a machine
  ip			Get the IP address of a machine
  kill			Kill a machine
  ls			List machines
  provision		Re-provision existing machines
  regenerate-certs	Regenerate TLS Certificates for a machine
  restart		Restart a machine
  rm			Remove a machine
  ssh			Log into or run a command on a machine with SSH.
  scp			Copy files between machines
  mount			Mount or unmount a directory from a machine with SSHFS.
  start			Start a machine
  status		Get the status of a machine
  stop			Stop a machine
  upgrade		Upgrade a machine to the latest version of Docker
  url			Get the URL of a machine
  version		Show the Docker Machine version or a machine docker version
  help			Shows a list of commands or help for one command
<...>
$ 
```

아... 아예 명령에 대한 설명을 "machine에 대한 관리"로 규정하고 있다. 그럼
진짜 우리가 하고 싶은 Image와 Container의 관리는 어떻게 할까?

다시 Docker Machine이 무엇인지 상기해보면, Docker Machine은 Docker Engine
또는 Docker Client의 대체품이 아니다. 보조수단일 뿐이며, Image나 Container
관련 작업은 이미 살펴봤던 `docker` 명령을 사용해야 한다.



## Environment for Docker CLI

그럼, 이제 수 십 대의 Docker Node가 있는데 그걸 어떻게 하나씩 접속정보를
확인하고 명령을 내려?

그래서, Docker Machine은 그것을 돕기 위한 기능을 내장하고 있다.

{:.wrap}
```console
$ docker-machine env worker01
export DOCKER_TLS_VERIFY="1"
export DOCKER_HOST="tcp://198.51.100.214:2376"
export DOCKER_CERT_PATH="/home/sio4/.docker/machine/machines/worker01"
export DOCKER_MACHINE_NAME="worker01"
# Run this command to configure your shell: 
# eval $(docker-machine env worker01)
$ 
```

위의 `docker-machine env` 명령은, 인수로 지정한 Node에 접속하기 위한
Docker의 환경변수를 위와 같이 출력해준다. 그리고, 맨 아래에는 친절히
이걸 어떻게 쓰면 편한지도 안내하고 있다. 해보자. 물론, Hello World first.

{:.wrap}
```console
$ eval "$(docker-machine env worker01)"
$ docker run hello-world
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
ca4f61b1923c: Pull complete 
Digest: sha256:083de497cff944f969d8499ab94f07134c50bcf5e6b9559b27182d3fa80ce3f7
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

오~! 동작한다! 지난번 [Docker: Installation and Test Drive]에서 봤던 것과
똑같이, 이미지를 받아 풀고, 인사를 하고, 다음 해볼 내용에 대해서도 안내를
하고 완전히 똑같이 잘 동작한다!

어라? 그런데 똑같으니까 오히려... "이거 Local에서 실행되는 거 아냐?" 의심이
생기네? 그럼 이번엔,

{:.wrap}
```console
$ docker run -it scinix/golang
WARNING: Error loading config file: /home/sio4/.docker/config.json - open /home/sio4/.docker/config.json: permission denied
Unable to find image 'scinix/golang:latest' locally
latest: Pulling from scinix/golang
ff3a5c916c92: Pull complete 
bbbde91ec291: Pull complete 
77c687a5f62d: Pull complete 
Digest: sha256:1ea1996ef95b572ada14650362d3f3ca20823ab1a985934931563e61cc82fe21
Status: Downloaded newer image for scinix/golang:latest
/go # 
```

이렇게, Interactive Mode로 Container를 하나 띄워두고, 먼저 내 기계에서
Container가 동작하고 있지는 않은지 확인해보자!

```console
$ ps axf|grep [d]ocker
 1270 ?        Ssl   10:28 /usr/bin/dockerd -H fd://
 1425 ?        Ssl    8:53  \_ docker-containerd --config /var/run/docker/containerd/containerd.toml
21275 pts/10   Sl+    0:00  |   |   \_ docker run -it scinix/golang
$ 
```

음, 눈에 보이는 프로세스는 없다. 그럼 이번에는 지금 사용 중인 Node에
붙어서 확인해보자.

```console
root@worker01:~# ps axf|grep [d]ocker
 5146 ?        Ssl    0:27 /usr/bin/dockerd -H tcp://0.0.0.0:2376 -H unix:///var/run/docker.sock --storage-driver aufs --tlsverify --tlscacert /etc/docker/ca.pem --tlscert /etc/docker/server.pem --tlskey /etc/docker/server-key.pem --label provider=softlayer
 5153 ?        Ssl    0:35  \_ docker-containerd --config /var/run/docker/containerd/containerd.toml
17864 ?        Sl     0:00      \_ docker-containerd-shim -namespace moby -workdir /var/lib/docker/containerd/daemon/io.containerd.runtime.v1.linux/moby/44f8bee9c5a04a831000828cc556020f14dab5080f39ca4f30eddca31c7b24ae -address /var/run/docker/containerd/docker-containerd.sock -containerd-binary /usr/bin/docker-containerd -runtime-root /var/run/docker/runtime-runc
root@worker01:~# 
```

오호라! Container 프로세스가 정상적으로 떠있는 것을 볼 수 있다. 역시
조금 더 세련되게, `docker` 명령을 써보자.

{:.wrap}
```console
root@worker01:~# docker image ls
REPOSITORY       TAG             IMAGE ID          CREATED           SIZE
scinix/golang    latest          6fd6c290abb6      2 weeks ago       325MB
hello-world      latest          f2a91732366c      3 months ago      1.85kB
root@worker01:~# 
root@worker01:~# docker container ls
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
44f8bee9c5a0        scinix/golang       "/bin/sh"           12 seconds ago      Up 11 seconds                           inspiring_curie
root@worker01:~# 
```

`docker image ls` 명령과 `docker container ls` 명령을 이용해서 내려받은
Image와 실행 중인 Container의 목록을 확인해보니, 확실히 이 Container는,
원격지의 클라우드 환경에, 단 한 줄의 명령에 의해 구성된 Docker Node 위에서
동작하고 있는 것이 확실하구나!


좋다. 그런데 지금 `docker` 명령을 내리면 그 명령을 수행할 Node가 어떤
녀석인지... 헷갈리지 않을까?


## Active Machine

그래서 Docker Machine은, `docker-machine` 명령을 이용해서 현재 Active인,
그래서 `docker` 명령을 내렸을 때 반응하게 될 기계를 조금 편리하게 확인
가능하도록 해주는 기능도 내장하고 있다.

### List Nodes Again

앞서 `docker-machine ls` 명령으로 구성된 Node를 확인할 때, `ACTIVE`라는
이름의 열이 있었던 것이 기억난다. 지금 다시, 그 명령을 내려보자.


```console
$ docker-machine ls
NAME       ACTIVE   DRIVER      STATE     URL                         SWARM   DOCKER        ERRORS
worker01   *        softlayer   Running   tcp://198.51.100.214:2376           v18.02.0-ce   
worker02   -        softlayer   Running   tcp://198.51.100.220:2376           v18.02.0-ce   
$ 
```

아... 그렇구나! 이제 활성상태의 기계의 ACTIVE 부분이 `-`에서 `*`로 바뀐
것을 보고 어떤 노드가 활성상태인지, `docker` 명령을 받을지 확인할 수
있다. 바꿔서 다시 볼까?

```console
$ eval "$(docker-machine env worker02)"
$ docker-machine ls
NAME       ACTIVE   DRIVER      STATE     URL                         SWARM   DOCKER        ERRORS
worker01   -        softlayer   Running   tcp://198.51.100.214:2376           v18.02.0-ce   
worker02   *        softlayer   Running   tcp://198.51.100.220:2376           v18.02.0-ce   
$ 
```

음, 역시 새로운 Active Node에 불이 들어오는 것을 확인할 수 있다. 그런데
좀 복잡하지 않나? 이 사람들, Software가 뭔지 아는 사람들이다. 그렇게
어리버리하게 만들지 않았다.

```console
$ eval "$(docker-machine env worker01)"
$ docker-machine active 
worker01
$ 
```

이렇게, `docker-machine active`라는 명령을 통해 현재 Active인 기계의 이름을
바로 받아올 수도 있도록 해둔 것이다.

그런데 이 환경에서 벋어나서, Local의 Docker에게 돌아가고 싶으면 어떻게
할까?

```console
$ docker-machine env -u
unset DOCKER_TLS_VERIFY
unset DOCKER_HOST
unset DOCKER_CERT_PATH
unset DOCKER_MACHINE_NAME
# Run this command to configure your shell: 
# eval $(docker-machine env -u)
$ 
$ eval $(docker-machine env -u)
$ docker-machine active 
No active host found
$ 
```

바로 이렇게, `docker-machine env -u` 라고 명령해주면 설정되어 있는 Docker
환경변수를 모두 `unset` 해준다. 착하네...


```console
$ eval "$(docker-machine env worker02)"; docker image ls
REPOSITORY      TAG             IMAGE ID          CREATED           SIZE
$ 
$ eval "$(docker-machine env worker01)"; docker image ls
REPOSITORY      TAG             IMAGE ID          CREATED           SIZE
scinix/golang   latest          6fd6c290abb6      2 weeks ago       325MB
hello-world     latest          f2a91732366c      3 months ago      1.85kB
$ 
```

이렇게,...


---
휴~ 이제 한시름 놨다.  
안그래도, 내 Laptop의 128GB SSD의 용량 부족을 느끼던 요즘인데, 이제
원격서버를 통해서 Docking을 즐길 수 있겠다.

그리고, 혹시 느꼈을지 모르겠지만, Docker의 문서를 보면, 리눅스의 `docker`
그룹에 사용자를 추가하여 `sudo` 없이 명령을 내릴 수 있도록 해주는 설정
부분이 있다. 그런데 이 묶음글을 쓰면서, 계속해서 `sudo` 명령을 사용해
왔었다. 이유가 간단한데, 내가 가고자 하는 길은... 내 Laptop을 Dockerized
Host로 만들고 싶지는 않았기 때문...

이제 내 Dockerized Host 두 개가 생겼다!





[Docker Machine]:https://docs.docker.com/machine/
[Install Machine]:https://docs.docker.com/machine/install-machine
[Docker Machine on Github]:https://github.com/docker/machine




### 함께 읽기

이 묶음글은 아직 몇 회까지 쓸지 정하지 못했다.

* [Docker: Getting Started with Docker]
* [Docker: Installation and Test Drive]
* [Docker: 나의 첫 Docker Image]
* ['쓸만한' Docker Image 만들기 - Part 1]
* ['쓸만한' Docker Image 만들기 - Part 2]
* [Docker Cloud에서 자동빌드하기]
* _Docker Machine으로 Docker Node 뿌리기_
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

