---
title: Linux Bridge and VLAN
---




하나의 NIC에 여러 IP를 부여하는 것은 "IP Aliasing"이라고 부르는 방식으로
보편적으로 사용되고 있으나 이 시나리오에서는 다시 그 위에 VM을 올리고 각
VM에게 논리적으로 독립된 망을 부여할 수 있어야 하므로 이 방식을 사용하는
것은 불가능하다.
또한, "Linux Bridge"를 사용한다고 하더라도, 각각의 Bridge에게 여러 NIC를
할당할 수는 있으나 하나의 NIC(정확히 말하면 Port, Interface가 맞겠다.)를
여러 Bridge에 꽂을 수는 없으므로 단일 Port를 VLAN 기능을 이용하여 찢어줄
필요가 있다.
다음과 같이, Linux Bridge를 Linux VLAN과 함께 사용함으로써 우리가 원하는
결과를 얻을 수 있다.

먼저, `bridge-utils`와 `vlan`을 설치한다.


## 패키지 설치

먼저, `bridge-utils`와 `vlan`을 설치한다.

```console
$ sudo apt-get install bridge-utils vlan
<...>
bridge-utils (1.5-7ubuntu1) 설정하는 중입니다 ...
vlan (1.9-3.2ubuntu1) 설정하는 중입니다 ...
$
```

## 설정

필요한 도구가 정상적으로 설치되었다면, 인터페이스 설정을 해준다.
Debian 계열의 배포본인 Ubuntu `/etc/network/interfaces` 파일에 네트워크
정보를 담게 되는데, 언제부터인지 기억할 수는 없지만 여기도 _사랑스러운_
"`.d`" 구조를 사용할 수 있게 되었다.

```console
$ cat |sudo tee /etc/network/interfaces.d/cotton <<EOF
> # cotton candy network configurations
>
> iface vlan100 inet manual
>       vlan-raw-device p2p1
>       pre-up modprobe 8021q
>
> iface br100 inet static
>       address 10.0.100.201
>       netmask 255.255.255.0
>       bridge_ports vlan100
>       bridge_stp off
>       bridge_fd 0.0
>
> iface vlan110 inet manual
>       vlan-raw-device p2p1
>       pre-up modprobe 8021q
>
> iface br110 inet static
>       address 10.0.110.201
>       netmask 255.255.255.0
>       bridge_ports vlan110
>       bridge_stp off
>       bridge_fd 0.0
> EOF
$
```

위의 "`.d`" 안에 만들어질 설정파일은 가상네트워크 정보만을 담고 있으며,
물리망 정보는 OS 설치 시 입력한 내용 그대로 `/etc/network/interfaces`
파일 안에 담겨 있다.

설정이 끝났으면 설정된 VLAN과 Bridge를 살려본다.

```console
$ sudo ifup vlan100
Set name-type for VLAN subsystem. Should be visible in /proc/net/vlan/config
Added VLAN with VID == 100 to IF -:p2p1:-
$ sudo ifup br100
Set name-type for VLAN subsystem. Should be visible in /proc/net/vlan/config

Waiting for br100 to get ready (MAXWAIT is 2 seconds).
```

설정에서 보는 바와 같이, `br100`은 `vlan100`에 의존적이어서, 위와 같이
VLAN을 먼저 살린 후에 Bridge를 살려야 한다. 물론, 아래와 같이 두 개의
쌍을 한 번에 올리는 것도 가능하다.

```console
$ sudo ifup vlan110 br110
Set name-type for VLAN subsystem. Should be visible in /proc/net/vlan/config
Added VLAN with VID == 110 to IF -:p2p1:-
Set name-type for VLAN subsystem. Should be visible in /proc/net/vlan/config

Waiting for br110 to get ready (MAXWAIT is 2 seconds).
$
```

위와 같이 정상적으로 두 Bridge 세트를 올렸다면, 다음 명령으로 Bridge의
구성상태를 확인할 수 있다.

```console
$ brctl show
bridge name     bridge id               STP enabled     interfaces
br100           8000.002655daf3aa       no              vlan100
br110           8000.002655daf3aa       no              vlan110
$
```

`br100`, `br110` 두 Bridge가 각각 `vlan100` 및 `vlan110`과 연결되어
올라온 것을 확인할 수 있다. 망에 참여할 두 서버에서 이와 같은 설정을
해준 후, 시험을 해보면 정상적으로 통신이 되는 것을 확인할 수 있다.
`ping` 또는 `ssh` 등을 이용하여 망 연결 시험이 끝났다면, 다음과 같이
Bridge가 각각의 서버를 MAC으로 인식하고 있는 상태를 볼 수 있다.

```console
$ brctl showmacs br100
port no mac addr                is local?       ageing timer
  1     00:26:55:da:f3:aa       yes                0.00
  1     00:26:55:da:f3:aa       yes                0.00
  1     e8:e7:32:cd:63:53       no                 0.54
  1     e8:e7:32:cd:64:45       no               221.69
$
```

참고로, `ip` 명령으로 본 설정 상태는 아래와 같다.

```console
$ ip addr show
<...>
2: p2p1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 00:26:55:da:f3:aa brd ff:ff:ff:ff:ff:ff
    inet 192.168.13.201/24 brd 192.168.13.255 scope global p2p1
       valid_lft forever preferred_lft forever
    inet6 fe80::226:55ff:feda:f3aa/64 scope link
       valid_lft forever preferred_lft forever
<...>
6: vlan100@p2p1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master br100 state UP group default
    link/ether 00:26:55:da:f3:aa brd ff:ff:ff:ff:ff:ff
7: br100: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 00:26:55:da:f3:aa brd ff:ff:ff:ff:ff:ff
    inet 10.0.100.201/24 brd 10.0.100.255 scope global br100
       valid_lft forever preferred_lft forever
    inet6 fe80::226:55ff:feda:f3aa/64 scope link
       valid_lft forever preferred_lft forever
<...>
$
```


