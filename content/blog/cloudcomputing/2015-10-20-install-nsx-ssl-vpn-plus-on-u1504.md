---
title: 우분투 15.04에 NSX SSL VPN-Plus 설치하기
tags: ["VMware", "NSX", "VPN", "howto"]
categories: ["cloudcomputing"]
date: 2015-10-20 16:35:17+09:00
image: /attachments/20151020-vmw-sslvpn-001.png
---
VMware의 NSX 6.2에서 제공하는 SSL VPN-Plus 기능을 우분투 리눅스에서
사용하기 위한 간략한 설명이다. Java가 되네 안되네 해도 당황하지 말고,
아래와 같이 해주면 된다.
<!--more-->

## 살짝 헤매기

처음 SSL VPN 접속 사이트에 접속했더니 Java Plugin 설치가 되지 않았다는
메시지가 떠서 당황했다. 그래서, 황급히 JDK를 설치하고 Plugin을 설정한
후 접속했더니, 아래와 같이 SSL VPN-Plus Client를 설치할 수 있는 링크가
살아났다. (나중에 알게 되었지만, SSL VPN-Plus를 사용하기 위해 JDK를
설치할 필요는 없었다.)

![](/attachments/20151020-vmw-sslvpn-101.png)
{.fit .dropshadow}

그리고 클릭하라는 곳을 클릭하고 설치를 시작하면, 다음과 같이 NeoAccel이
게시자로 되어있는 설치 프로그램이 동작하게 된다.

![](/attachments/20151020-vmw-sslvpn-102.png)
{.fit .dropshadow}

그런데 이게 뭐야? Root 사용자가 아니라고 설치가 되지 않는다.

![](/attachments/20151020-vmw-sslvpn-103.png)
{.fit .dropshadow}

이런... 그래서 포기하려다가... 페이지 안의 "클러스터에 호스트 프로파일을
연결하려면"이 링크로 되어있는 것을 발견했다. 위 아래 두 개의 같은 문구가
있는데, 우연히, 아래 링크에 먼저 마우스를 가져다 놓아봤다.  
맨 첫번째 그림을 보면 알 수 있듯이, 이 링크는 `linux_phat_client.tgz`라는
파일을 내려받을 수 있는 링크였다. 뭔가 아하! 스럽지 않은가?

![](/attachments/20151020-vmw-sslvpn-104.png)
{.fit .dropshadow}

## 설치의 진행

파일을 내려받은 후, 아래와 같은 방식으로 설치를 진행한다.

적당한 위치에서 먼저, 압축을 풀어준다. 아래와 같이, `linux_phat_client`
라는 폴더가 만들어지고 그 안에 설치 스크립트가 풀리게 된다.

```console
$ tar xvf linux_phat_client.tgz 
linux_phat_client/
linux_phat_client/install_linux_phat_client.sh
linux_phat_client/linux_phat_client/
<...>
linux_phat_client/linux_phat_client/user.sh
linux_phat_client/linux_phat_client/login
linux_phat_client/linux_phat_client/user
$ 
```

해당 디렉터리로 이동하여 설치 스크립트를 실행해준다. 역시 Root 권한을
요구하는 것은 동일하며, `sudo`를 사용하여 Root 권한으로 설치를 진행한다.

```console
$ cd linux_phat_client/
$ ./install_linux_phat_client.sh 
Root Privileges are needed to install SSL VPN-Plus Client
$ 
$ 
$ sudo ./install_linux_phat_client.sh 
[sudo] password for sio4: 
Checking for NSS Libs: NSS libs available
TCL is being installed ... Done
TK is being installed ... Done
update-rc.d: warning: start and stop actions are no longer supported; falling back to defaults
Starting SSL VPN-Plus			 [   OK   ] 

 
SSL VPN-Plus Client is successfully installed
To use SSL VPN-Plus Client use following commands :
    $ naclient login  : to connect gateway
    $ naclient logout : to disconnect from gateway
    $ naclient status : to check statistics of connection from client to gateway

$ 
```

설치가 끝나면 관련 서비스가 등록/실행되고, 간략하게 사용법 소개가 나온다.
그럼 사용법에 따라 접속을 시도해보자.

```console
$ naclient login
Enter profile name: PROFILE_NAME
Enter user name: USERNAME
Enter the password: PASSWORD
Successfully connected to SSL VPN-Plus gateway profile: PROFILE_NAME
$ 
```

`PROFILE_NAME`과 `USERNAME`, `PASSWORD`는 각각 NSX에서 VPN을 설정할 때
사용하였던 프로파일 이름과 사용자명, 그리고 암호이다.
정상적으로 연결되었다는 메시지가 나오면, 아래와 같이 인터페이스 설정이
되었는지 확인할 수 있다.

```console
$ ifconfig
<...>
tap0      Link encap:Ethernet  HWaddr 00:ff:f3:87:26:68  
          inet addr:10.20.2.10  Bcast:10.20.2.255  Mask:255.255.255.0
          inet6 addr: fe80::2ff:f3ff:fe87:2668/64 Scope:Link
          UP BROADCAST RUNNING MULTICAST  MTU:1500  Metric:1
          RX packets:0 errors:0 dropped:0 overruns:0 frame:0
          TX packets:43 errors:0 dropped:0 overruns:0 carrier:0
          collisions:0 txqueuelen:500 
          RX bytes:0 (0.0 B)  TX bytes:6725 (6.7 KB)

$
```

음. 인터페이스는 잘 되었네. 다음은 Routing Table이다. NSX VPN 설정에서
설정한 Network에 대한 Routing 설정이 모두 잘 반영되었다.

```console
$ route -n
Kernel IP routing table
Destination     Gateway         Genmask         Flags Metric Ref    Use Iface
0.0.0.0         10.250.166.1    0.0.0.0         UG    100    0        0 eth0
10.20.2.0       0.0.0.0         255.255.255.0   U     950    0        0 tap0
10.20.10.0      10.20.2.1       255.255.255.0   UG    0      0        0 tap0
10.250.10.100   10.250.166.1    255.255.255.255 UGH   100    0        0 eth0
10.250.166.0    0.0.0.0         255.255.255.0   U     100    0        0 eth0
169.254.0.0     0.0.0.0         255.255.0.0     U     1000   0        0 eth1
192.168.15.0    0.0.0.0         255.255.255.0   U     100    0        0 eth1
$ 
```

사용이 끝났다면 다음과 같은 명령으로 VPN 연결을 닫을 수 있다.

```console
$ naclient logout
Successfully logged out of the SSL VPN-Plus gateway
$ 
```

이렇게 간단한데, 왜 처음에 마치 Java가 없으면 안될 듯이 겁을 줬는지...
괜히 시간을 좀 낭비했네. ㅎㅎㅎ

참고로, 정확하게 어떤 파일들이 설치되었는지는 추적하지 않았지만, 대부분의
파일들은 `/opt/sslvpn-plus/naclient` 아래에 위치하고 있고, 일부 실행파일과
init 파일만 `/etc/init.d/`, `/usr/local/bin/` 등에 설치되었으니 참고하시라.

접속 페이지에서 위쪽의 링크도 같은 것인지 확인해보니, 이건 다음과 같은
안내문이었다. 아마도 좀 개발된지 오래된 SSL VPN 제품을 VMware에서 사서
사용하는 것 같다. 기왕에 좀 깔끔하게 수정 좀 하지...

![](/attachments/20151020-vmw-sslvpn-105.png)
{.fit .dropshadow}

아! 이해하기 어려운 이유로 CLI가 싫다면 GUI Client도 제공되니 참고하시기
바람. 그런데 TK... 역시 후져...

![](/attachments/20151020-vmw-sslvpn-200.png)
{.fit .dropshadow}



