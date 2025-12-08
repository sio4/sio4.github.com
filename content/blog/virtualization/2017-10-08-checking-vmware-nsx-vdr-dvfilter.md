---
title: "VMware NSX: VDR/DVFilter 정보확인"
tags: ["NSX", "VMware", "virtualization", "network"]
categories: ["virtualization"]
images: [/logos/vmware-nsx-logo.png]
banner: /logos/vmware-nsx-logo.png
date: 2017-10-08T16:40:00+09:00
---
이 글은 VMware의 네트워크 가상화 기술인 NSX 6.2를 이용한 프로젝트에서
네트워크 트래픽과 이상현상을 분석하는 과정에서, VDR과 DVS, vmnic 등의
정보를 확인했던 내용들을 간략하게 정리하는 글이다. 아쉬운 점은,
벌써 2년이 지난 기록이라서 현재의 상황에 맞지 않는 내용이 포함되었을
수 있고, 간단하게 메모로 남겼던 것을 편집한 것이다 보니 이야기의 맥이
없다. :-(
<!--more-->

![](/logos/vmware-nsx-logo.png)

# 개요

Private Cloud 플랫폼을 준비하던 2015년의 가을과 겨울을 VMware의 NSX 6.2,
그리고 OpenStack+Open vSwitch와 함께 보냈었다. 이 과정에서 중요하게 봤던
부분 중 하나가 **네트워크의 안정성과 무결성, 그리고 Tenant 독립성**에 관한
부분이었다.  
Cloud 환경에 있어서 네트워크는 (보는 관점에 따라 다르지만) 그다지 크게
강조되는 부분은 아니다. DNS나 Load Balance 등, 업무와 밀접한 "기능"들은
그나마 많은 관심을 받지만 인프라, 특히 네트워크는 Application과 업무 등,
"내 일"에 집중하는 "고객관점"에서는 조금 희미한 부분일 수 있기 때문이
아닐까 생각한다.

그러나 제공자의 입장에서 네트워크는 구성/관리에 있어서 우선순위가 매우
높은 부분이다.  클라우드 위에서 동작하게 될 거의 모든 업무는 네트워크
상에 퍼져있는 여러 요소와의 통신에 의존하여 동작하게 되므로 그 업무가
정상적으로 수행되기 위해서는 **통신의 안정성**이 매우 중요하다.
또한, 가상 인스턴스 등에 비해 상대적으로 열린 공간으로 받아들여질 수
있으므로 (Tenant 관점의) **독립성과 보안**에 있어서 확실한 보장이 필요한
부분이기도 하다.  
뭐랄까, 네트워크라는 것이 현실세계로 치면 "길"에 해당하는 것이기 때문에
항상 잘 통해야 하는 것은 물론, 길에서 강도를 만나거나 사고를 당해도
안되는 것이라고나 할까?

아무튼 아래는, 이 과정에서 VMware NSX의 네트워크 정보를 확인하는 방법에
대한 메모를 그대로 기록한 것이다. (사실, 이 이야기보다 100배는 더 재미가
있는 NSX에서 Traffic 이상 증상, Packet 유실 문제 등에 대한 기록을 남겨야
하는데... 당시의 환경은 이미 철수한 상태이니 그 자료를 다시 찾아 정리할
기회가 있을지... 모르겠다.)

# VMware Network Information

## 가장 아래, vmnic

### `vmnic`의 Offload 설정 확인하기

Offload란 OS의 네트워크 스텍에서 처리해야 하는 여러 단계의 기능 중 일부를
하위 장치(보통은 NIC)에게 위임함으로써, OS가 CPU를 사용하여 처리해야 하는
일의 부담을 줄이는 기술이다. 예를 들어 TSO 또는 TCP Segmentation Offload라
불리는 기능은, 다양한 크기의 사용자 데이터를 네트워크를 통해 전송할 때,
규약과 설정에 따라 여러 개의 Packet으로 쪼개어 보내게 되는데, 이 때 TCP
Packet 크기에 맞춰 원본 데이터를 자르는 과정을 OS Kernel이 수행하지 않고
NIC에게 위임하는 기술이다.

클라우드 구성 검토을 하다가 뜬금없이 Offload에 대해서 확인하게 된 이유는,
NSX의 패킷 유실현상을 발견한 이후 여러 증상을 점검하던 중, 사라지는
Packet의 패턴이 이 TCP Segmentation과 연관이 있다는 것을 확인하게 되었고
그 유실 지점을 확인하기 위해 `vmnic`의 구성을 확인하여야 했던 것이다.

리눅스 전통적인 방식으로, 다음과 같이 NIC의 구성을 확인할 수 있다.

```console
[root@ESXi-04:~] ethtool -k vmnic1 
Offload parameters for vmnic1:
Cannot get device udp large send offload settings: Function not implemented
Cannot get device generic segmentation offload settings: Function not implemented
rx-checksumming: on
tx-checksumming: on
scatter-gather: on
tcp segmentation offload: on
udp fragmentation offload: off
generic segmentation offload: off
[root@ESXi-04:~] 
```

위의 결과를 보면, TSO는 활성화가 되어있는 것을 알 수 있다.

같은 내용의 확인을 VMware 전용의 명령으로도 할 수 있는데, 아래와 같다.

```console
[root@ESXi-04:~] esxcli network nic tso get -n vmnic1
NIC     Value
------  -----
vmnic1  on   
[root@ESXi-04:~] 
```

### `vmk` 목록

위 이야기와 관련은 없으나 아래의 명령으로 `vmk`의 목록을 확인할 수 있다.

```console
[root@ESXi-04:~] esxcfg-vmknic -l
Interface  Port Group/DVPort/Opaque Network        IP Family IP Address                              Netmask         Broadcast       MAC Address       MTU     TSO MSS   Enabled Type                NetStack            
vmk0       Management Network                      IPv4      172.18.128.14                           255.255.192.0   172.18.191.255  c4:34:6b:b8:fd:40 1500    65535     true    STATIC              defaultTcpipStack   
vmk1       ISCSI                                   IPv4      172.18.0.114                            255.255.255.0   172.18.0.255    00:50:56:6b:b7:14 1500    65535     true    STATIC              defaultTcpipStack   
vmk2       8                                       IPv4      172.18.192.21                           255.255.192.0   172.18.255.255  00:50:56:65:d0:7f 1600    65535     true    STATIC              vxlan               
[root@ESXi-04:~] 
```



## vSwitch 확인

실제 VM 들이 네트워킹을 하기 위해서는 Host 안에 구성된 가상 스위치인 vSwitch에
접속을 하여야 한다. (물리세계의 이야기로 하자면 LAN 선을 꽂아야 한다는 뜻)
이 vSwitch의 구성상태와 Port 구성, 사용 현황은 아래와 같이 확인할 수 있다.

### vSwitch 목록 나열

```console
[root@ESXi-04:~] esxcfg-vswitch -l
Switch Name      Num Ports   Used Ports  Configured Ports  MTU     Uplinks   
vSwitch0         8192        5           128               1500    vmnic0    

  PortGroup Name        VLAN ID  Used Ports  Uplinks   
  MGMT                  50       0           vmnic0    
  ISCSI                 0        1           vmnic0    
  Management Network    50       1           vmnic0    

DVS Name         Num Ports   Used Ports  Configured Ports  MTU     Uplinks   
vDS-C-Transport  8192        6           512               1600    vmnic1    

  DVPort ID           In Use      Client      
  4                   1           vmnic1      
  5                   0           
  8                   1           vmk2        
  24                  0           
  8056                0           
  8072                0           
  40                  0           
  19                  0           
  56                  0           
  41                  0           
  16                  1           AW1.eth0    
  42                  0           
  26                  0           
  49                  0           

DVS Name         Num Ports   Used Ports  Configured Ports  MTU     Uplinks   
dvSwitch         8192        3           512               1500    vmnic2    

  DVPort ID           In Use      Client      
  1                   1           vmnic2      

DVS Name         Num Ports   Used Ports  Configured Ports  MTU     Uplinks   
DSwitch          8192        3           512               1500    vmnic10   

  DVPort ID           In Use      Client      
  12                  1           vmnic10     
  13                  0           
  14                  0           
  15                  0           

[root@ESXi-04:~] 
```

내용을 보면, 중간의 출력을 기준으로 `vDS-C-Transport` 등으로 명명된 vSwitch가
보이고, 그 vSwitch에 대하여 DVPort 라고 불리는 가상의 포트가 512개로 구성되어
있고 MTU는 1600, Uplink로 `vmnic1`이 쓰이고 있다는 등의 정보를 표기하고 있다.
또한 DVPort 목록을 통하여 16번 포트에 AW1이라는 이름의 VM의 eth0가 연결되어
있다는 것도 확인이 가능하다.



### VDS 목록 확인 및 VxLAN 목록 보기

아래와 같이, 각 Distributed vSwitch 의 목록과 그들이 어떤 VxLAN을 갖고 있는지
확인할 수도 있다.

```console
[root@ESXi-04:~] esxcli network vswitch dvs vmware vxlan list
VDS ID                                           VDS Name          MTU  Segment ID    Gateway IP    Gateway MAC        Network Count  Vmknic Count
-----------------------------------------------  ---------------  ----  ------------  ------------  -----------------  -------------  ------------
10 8d 19 50 cc bb 47 a6-5d a5 40 54 96 7e 94 18  vDS-C-Transport  1600  172.18.192.0  172.18.192.1  cc:3e:5f:3c:03:ae             12             1
[root@ESXi-04:~] esxcli network vswitch dvs vmware vxlan network list --vds-name
=vDS-C-Transport
VXLAN ID  Multicast IP               Control Plane                        Controller Connection  Port Count  MAC Entry Count  ARP Entry Count
--------  -------------------------  -----------------------------------  ---------------------  ----------  ---------------  ---------------
    5000  N/A (headend replication)  Enabled (multicast proxy,ARP proxy)  172.18.128.22 (up)              2                2                0
    5001  0.0.0.0                    Disabled                             0.0.0.0 (down)                  1                0                0
    5002  0.0.0.0                    Disabled                             0.0.0.0 (down)                  1                0                0
    5003  N/A (headend replication)  Enabled (multicast proxy,ARP proxy)  172.18.128.21 (up)              1                3                0
    5006  0.0.0.0                    Disabled                             0.0.0.0 (down)                  1                0                0
    5004  0.0.0.0                    Disabled                             0.0.0.0 (down)                  1                0                0
    5005  0.0.0.0                    Disabled                             0.0.0.0 (down)                  1                0                0
    5007  0.0.0.0                    Disabled                             0.0.0.0 (down)                  1                0                0
    5008  0.0.0.0                    Disabled                             0.0.0.0 (down)                  1                0                0
    5010  0.0.0.0                    Disabled                             0.0.0.0 (down)                  1                0                0
    5011  0.0.0.0                    Disabled                             0.0.0.0 (down)                  1                0                0
    5009  0.0.0.0                    Disabled                             0.0.0.0 (down)                  1                0                0
[root@ESXi-04:~] 
```



## NSX의 VDR 정보

Distributed vSwitch는 NSX의 기능은 아니고 ESXi Host, vSphere의 상위 라이선스가
제공하는 가상 스위치이다. vSphere는 VM들의 통신을 위해 필수 조건이 되는 가상의
스위치를 제공하는 정도까지만 네트워크 기능을 제공한다.

반면에, 본격적인 네트워크 가상화(또는 NFV)는 NSX에 의해 제공되는데, 그 중의
하나가 가상 라우터의 제공이다.

### VDR 목록

아래와 같은 명령으로 VDR, Virtual Distributed Router의 목록을 확인할 수 있다.
(이게 ESR, DLR, VDR, 뭔가 헷갈리는 이름이 많은데 이건 다음에 기회가 되면...)

```console
[root@ESXi-04:~] net-vdr --instance -l

VDR Instance Information :
---------------------------

Vdr Name:                   ClientB+edge-4
Vdr Id:                     0x00001389
Number of Lifs:             4
Number of Routes:           14
State:                      Enabled  
Controller IP:              172.18.128.22
Control Plane IP:           172.18.128.14
Control Plane Active:       Yes
Num unique nexthops:        1
Generation Number:          0
Edge Active:                No

Vdr Name:                   ClientA+edge-8
Vdr Id:                     0x00001388
Number of Lifs:             4
Number of Routes:           14
State:                      Enabled  
Controller IP:              172.18.128.22
Control Plane IP:           172.18.128.14
Control Plane Active:       Yes
Num unique nexthops:        2
Generation Number:          0
Edge Active:                No

Vdr Name:                   ClientC+edge-10
Vdr Id:                     0x0000138a
Number of Lifs:             4
Number of Routes:           14
State:                      Enabled  
Controller IP:              172.18.128.21
Control Plane IP:           172.18.128.14
Control Plane Active:       Yes
Num unique nexthops:        1
Generation Number:          0
Edge Active:                No

[root@ESXi-04:~]
```

### 특정 VDR의 LIF 목록

VDR을 확인했으면, 특정 VDR에 구성되어 있는 LIF, Logical Interface의 목록은
아래와 같이 확인할 수 있다.


```console
[root@ESXi-04:~] net-vdr --lif -l ClientA+edge-8

VDR ClientA+edge-8 LIF Information :

Name:                138800000002
Mode:                Routing, Distributed, Uplink
Id:                  Vxlan:5003
Ip(Mask):            10.10.1.5(255.255.255.0)
Connected Dvs:       vDS-C-Transport 
VXLAN Control Plane: Enabled 
VXLAN Multicast IP:  0.0.0.1 
State:               Enabled
Flags:               0x2308
DHCP Relay:          Not enabled

Name:                13880000000c
Mode:                Routing, Distributed, Internal
Id:                  Vxlan:5002
Ip(Mask):            10.10.30.1(255.255.255.0)
Connected Dvs:       vDS-C-Transport 
VXLAN Control Plane: Enabled 
VXLAN Multicast IP:  0.0.0.1 
State:               Enabled
Flags:               0x2288
DHCP Relay:          Not enabled

Name:                13880000000b
Mode:                Routing, Distributed, Internal
Id:                  Vxlan:5001
Ip(Mask):            10.10.20.1(255.255.255.0)
Connected Dvs:       vDS-C-Transport 
VXLAN Control Plane: Enabled 
VXLAN Multicast IP:  0.0.0.1 
State:               Enabled
Flags:               0x2288
DHCP Relay:          Not enabled

Name:                13880000000a
Mode:                Routing, Distributed, Internal
Id:                  Vxlan:5000
Ip(Mask):            10.10.10.1(255.255.255.0)
Connected Dvs:       vDS-C-Transport 
VXLAN Control Plane: Enabled 
VXLAN Multicast IP:  0.0.0.1 
State:               Enabled
Flags:               0x2288
DHCP Relay:          Not enabled

[root@ESXi-04:~] 
```

### VDR의 Route 정보 보기

이번에는 Routing 정보를 확인하는 명령

```console
[root@ESXi-04:~] net-vdr -R -l ClientA+edge-8

VDR ClientA+edge-8 Route Table
Legend: [U: Up], [G: Gateway], [C: Connected], [I: Interface]
Legend: [H: Host], [F: Soft Flush] [!: Reject] [E: ECMP]

Destination      GenMask          Gateway          Flags    Ref Origin   UpTime     Interface
-----------      -------          -------          -----    --- ------   ------     ---------
0.0.0.0          0.0.0.0          10.10.1.3        UG       4   AUTO     29536      138800000002
10.1.0.0         255.255.255.0    10.10.1.2        UG       1   AUTO     29536      138800000002
10.10.1.0        255.255.255.0    0.0.0.0          UCI      1   MANUAL   29536      138800000002
10.10.10.0       255.255.255.0    0.0.0.0          UCI      1   MANUAL   29536      13880000000a
10.10.20.0       255.255.255.0    0.0.0.0          UCI      1   MANUAL   29536      13880000000b
10.10.30.0       255.255.255.0    0.0.0.0          UCI      1   MANUAL   29536      13880000000c
10.20.1.0        255.255.255.0    10.10.1.2        UG       1   AUTO     29536      138800000002
10.20.10.0       255.255.255.0    10.10.1.2        UG       1   AUTO     29536      138800000002
10.20.20.0       255.255.255.0    10.10.1.2        UG       1   AUTO     29536      138800000002
10.20.30.0       255.255.255.0    10.10.1.2        UG       1   AUTO     29536      138800000002
10.30.1.0        255.255.255.0    10.10.1.2        UG       1   AUTO     29536      138800000002
10.30.10.0       255.255.255.0    10.10.1.2        UG       1   AUTO     29536      138800000002
10.30.20.0       255.255.255.0    10.10.1.2        UG       1   AUTO     29536      138800000002
10.30.30.0       255.255.255.0    10.10.1.2        UG       1   AUTO     29536      138800000002
[root@ESXi-04:~] 
```

### 각 Port 별 DVFilter 목록

이번엔 가상 Firewall에 해당하는 DVFilter 목록의 확인

```console
[root@ESXi-04:~] summarize-dvfilter
Fastpaths:
agent: dvfilter-faulter, refCount: 1, rev: 0x1010000, apiRev: 0x1010000, module: dvfilter
agent: ESXi-Firewall, refCount: 4, rev: 0x1010000, apiRev: 0x1010000, module: esxfw
agent: dvfilter-generic-vmware, refCount: 3, rev: 0x1010000, apiRev: 0x1010000, module: dvfilter-generic-fastpath
agent: dvfilter-generic-vmware-swsec, refCount: 2, rev: 0x1010000, apiRev: 0x1010000, module: dvfilter-switch-security
agent: bridgelearningfilter, refCount: 1, rev: 0x1010000, apiRev: 0x1010000, module: vdrb
agent: dvfg-igmp, refCount: 1, rev: 0x1010000, apiRev: 0x1010000, module: dvfg-igmp
agent: vmware-sfw, refCount: 2, rev: 0x1010000, apiRev: 0x1010000, module: vsip

Slowpaths:

Filters:
world 0 <no world>
 port 33554436 vmk0
  vNic slot 0
   name: nic-0-eth4294967295-ESXi-Firewall.0
   agentName: ESXi-Firewall
   state: IOChain Attached
   vmState: Detached
   failurePolicy: failOpen
   slowPathID: none
   filter source: Invalid
 port 33554437 vmk1
  vNic slot 0
   name: nic-0-eth4294967295-ESXi-Firewall.0
   agentName: ESXi-Firewall
   state: IOChain Attached
   vmState: Detached
   failurePolicy: failOpen
   slowPathID: none
   filter source: Invalid
 port 50331652 vmk2
  dvPort slot 0
   name: 8-sw10 8d 19 50 cc bb 47 a6-5d a5 40 54 96 7e 94 18.dvfilter-generic-vmware.0
   agentName: dvfilter-generic-vmware
   state: IOChain Attached
   vmState: Detached
   failurePolicy: failClosed
   slowPathID: none
   filter source: Invalid
  vNic slot 0
   name: nic-0-eth4294967295-ESXi-Firewall.0
   agentName: ESXi-Firewall
   state: IOChain Attached
   vmState: Detached
   failurePolicy: failOpen
   slowPathID: none
   filter source: Invalid
world 36445 vmm0:AW1 vcUuid:'50 19 37 10 7d 3b 25 9f-40 6f a4 bc 7e 0d af b8'
 port 50331654 AW1.eth0
  vNic slot 2
   name: nic-36445-eth0-vmware-sfw.2
   agentName: vmware-sfw
   state: IOChain Attached
   vmState: Detached
   failurePolicy: failClosed
   slowPathID: none
   filter source: Dynamic Filter Creation
  dvPort slot 0
   name: 16-sw10 8d 19 50 cc bb 47 a6-5d a5 40 54 96 7e 94 18.dvfilter-generic-vmware.0
   agentName: dvfilter-generic-vmware
   state: IOChain Attached
   vmState: Detached
   failurePolicy: failClosed
   slowPathID: none
   filter source: Invalid
  vNic slot 1
   name: nic-36445-eth0-dvfilter-generic-vmware-swsec.1
   agentName: dvfilter-generic-vmware-swsec
   state: IOChain Attached
   vmState: Detached
   failurePolicy: failClosed
   slowPathID: none
   filter source: Alternate Opaque Channel
[root@ESXi-04:~] 
```

### 특정 DVFilter에 대한 상세 주소세트 정보

목록을 봤으면, 그 중 하나를 골라서 주소세트 설정을 보고,

```console
[root@ESXi-04:~] vsipioctl getaddrsets -f nic-36445-eth0-vmware-sfw.2
addrset ip-ipset-3 {
ip 10.10.2.0/24,
ip 10.20.1.0/24,
ip 10.20.2.0/24,
ip 10.30.2.0/24,
}
addrset ip-virtualwire-1 {
ip 10.10.10.11,
ip 10.10.10.12,
ip 10.10.10.200,
ip 10.10.10.202,
ip fe80::250:56ff:fe99:1461,
ip fe80::250:56ff:fe99:5662,
ip fe80::250:56ff:fe99:59a6,
}
addrset ip-virtualwire-2 {
ip 10.10.20.11,
ip 10.10.20.12,
ip 169.254.227.217,
ip fe80::250:56ff:fe99:9e4b,
ip fe80::250:56ff:fe99:c7a5,
}
addrset src1048 {
ip 10.10.10.200,
ip 10.10.10.202,
ip 172.18.128.199,
ip 172.18.128.200,
ip fe80::250:56ff:fe99:5662,
ip fe80::250:56ff:fe99:59ea,
}
[root@ESXi-04:~] 
```

### 특정 DVFilter에 대한 상세 Rule 정보

같은 방식으로 해당 Filter에 구성된 접근제어 Rule을 볼 수 있다. (여기서 앞서
확인했던 주소세트가 어디에 어떻게 사용되었는지도 볼 수 있다.)

```console
[root@ESXi-04:~] vsipioctl getrules -f nic-36445-eth0-vmware-sfw.2
ruleset domain-c28 {
  # Filter rules
  rule 1048 at 1 inout protocol any from addrset src1048 to any accept;
  rule 1045 at 2 inout protocol tcp from any to addrset ip-virtualwire-1 port 80 accept with log;
  rule 1044 at 3 inout protocol any from addrset ip-virtualwire-1 to addrset ip-virtualwire-1 accept with log;
  rule 1043 at 4 inout protocol tcp from addrset ip-virtualwire-1 to addrset ip-virtualwire-2 port 8080 accept with log;
  rule 1046 at 5 inout protocol udp from any to any port 514 accept with log;
  rule 1046 at 6 inout protocol tcp from any to any port 514 accept with log;
  rule 1038 at 7 inout protocol tcp from addrset ip-ipset-3 to any port 22 accept with log;
  rule 1038 at 8 inout protocol tcp from addrset ip-ipset-3 to any port 3389 accept with log;
  rule 1037 at 9 inout protocol icmp icmptype 0 from any to any accept with log;
  rule 1037 at 10 inout protocol icmp icmptype 8 from any to any accept with log;
  rule 1009 at 11 inout protocol ipv6-icmp icmptype 136 from any to any accept with log;
  rule 1009 at 12 inout protocol ipv6-icmp icmptype 135 from any to any accept with log;
  rule 1008 at 13 inout protocol udp from any to any port 67 accept with log;
  rule 1008 at 14 inout protocol udp from any to any port 68 accept with log;
  rule 1007 at 15 inout protocol any from any to any accept with log;
}

ruleset domain-c28_L2 {
  # Filter rules
  rule 1010 at 1 inout ethertype any from any to any accept;
}

[root@ESXi-04:~] 
```

(그냥 정보 확인 방법만 기술하다 보니 재미가 없긴 하다.)




## Packet Capture 명령

네트워크 관련 문제를 풀 때, 아주 중요한 기술요소 중의 하나가 Traffic을
Dump하여 그 내용을 세밀하게 살펴보는 것인데, 나는 보통 이것을 **진맥**이라고
표현한다. vSphere 환경에서는 아래의 `pktcap-uw` 명령을 통하여 패킷을 잡아
볼 수 있다.


### Packet Capture 명령 도움말

일단 도움말 한 번 보고!

```console
[root@ESXi-04:~] pktcap-uw -h
Packet Capture and Trace command usage:
	== Create session to capture packets == 
	 pktcap-uw [--capture <capture point> | [--dir <0/1>] [--stage <0/1>]  
	        [-K|--kernelside]]
	    [--switchport <PortID> | --vmk <vmknic> | --uplink <vmnic> |
	       --dvfilter <filter name>]
	       --lifID <lif id for vdr>]
	    [-f [module name.]<function name>]
	    [-AFhP] [-p|--port <Socket PORT>]
	    [-c|--count <number>] [-s|--snapLen <length>]
	    [-o|--outfile <FILE>] [--console]
	    [Flow filter options]

	== Create session to trace packets path == 
	 pktcap-uw --trace
	    [-AFhP] [-p|--port <Socket PORT>]
	    [-c|--count <number>] [-s|--snapLen <length>]
	    [-o|--outfile <FILE>] [--console]
	    [Flow filter options]

The command options:
	-p, --port <Socket PORT>
		Specify the port number of vsocket server.
	-o, --outfile <FILE>
		Specify the file name to dump the packets. If unset, 
		output to console by default. If '-', then stdout is used.
	-P, --ng   (only working with '-o')
		Using the pcapng format to dump into the file.
	--console  (by default if without '-o')
		Output the captured packet info to console.
	-s, --snaplen <length>
		Only capture the first <length> packet buffer.
		The minimum snap length is 24 bytes. However, setting 
		snaplen to 0 will capture entire packet.
	-c, --count <NUMBER>
		How many count packets to capture.
	-h
		Print this help.
	-A, --availpoints
		List all capture points supported.
	-F 
		List all dynamic capture point functions supported.
	--capture <capture point>
		Specify the capture point. Use '-A' to get the list.
		If not specified, will select the capture point
		by --dir and --stage setting

The switch port options:
(for Port, Uplink and Etherswitch related capture points)
	--switchport <port ID>
		Specify the switch port by ID
	--lifID <lif ID>
		Specify the logical interface id of VDR port
	--vmk <vmk NIC>
		Specify the switch port by vmk NIC
	--uplink <vmnic>
		Specify the switch port by vmnic

The capture point auto selection options without --capture:
	--dir <0|1>  (for --switchport, --vmk, --uplink)
		The direction of flow: 0- Rx (Default), 1- Tx
	--stage <0|1>  (for --switchport, --vmk, --uplink, --dvfilter)
		The stage at which to capture: 0- Pre: before, 1- Post:After
	--kernelside (for --uplink)
		The capture point is in kernel instead of in driver

The capture point options
	-f [module name.]<function name>
		The function name. The Default module name is 'vmkernel'.
		(for 'Dynamic', 'IOChain' and 'TcpipDispatch' capture points)
	--dvfilter <filter name>
		Specify the dvfilter name for DVFilter related points

Flow filter options, it will be applied when set:
	--srcmac <xx:xx:xx:xx:xx>
		The Ethernet source MAC address.
	--dstmac <xx:xx:xx:xx:xx>
		The Ethernet destination MAC address.
	--mac <xx:xx:xx:xx:xx>
		The Ethernet MAC address(src or dst).
	--ethtype 0x<ETHTYPE>
		The Ethernet type. HEX format.
	--vlan <VLANID>
		The Ethernet VLAN ID.
	--srcip <x.x.x.x[/<range>]>
		The source IP address.
	--dstip <x.x.x.x[/<range>]>
		The destination IP address.
	--ip <x.x.x.x>
		The IP address(src or dst).
	--proto 0x<IPPROTYPE>
		The IP protocol.
	--srcport <SRCPORT>
		The TCP source port.
	--dstport <DSTPORT>
		The TCP destination port.
	--tcpport <PORT>
		The TCP port(src or dst).
	--vxlan <vxlan id>
		The vxlan id of flow.
[root@ESXi-04:~] 
```

도움말을 보면, 어디서 어떻게 패킷을 잡을 것인지 등을 포함한 다양한 옵션을
제공하는 것을 알 수 있다. 그런데 실제로 해봤을 때, 잡을 수 있는 위치가
vSwitch의 특정 포트로 한정된다든지, 양방향 Traffic을 한 번에 뜰 수 없고
한 명령으로는 한 방향(Rx든 Tx든)의 패킷 밖에 뜰 수가 없다든지, 뜨는 과정에서
누락이 발생하는 등의 문제가 있긴 했다.

### Capture 명령 실행

아무튼, 다음과 같이 명령을 내리면 `nic-36445-eth0-vmware-sfw.2` 라는 Filter
의 앞단(`--capture PreDVFilter`)에서 즉, Filter를 거치기 직전의, Filter가
적용되지 않은 Packet을 잡아볼 수 있다.

```console
[root@ESXi-04:~] pktcap-uw --capture PreDVFilter --dvfilter nic-36445-eth0-vmware-sfw.2 -o aw2_pre.pcap
```

뭐, 단기간의 패킷 수집을 위해서는 나름 나쁘지 않았다.


### 기타

VMware의 NSX는 매우 흥미로운 제품이었다. 시험 기간이 약 1달 정도로 짧아서
많은 기능을 충분히 보지 못했고, 또 중간에 Packet 유실 문제가 발생하여 이를
확인하는 과정에 많은 리소스를 사용하는 바람에 더더욱 아쉬움이 남는다.

다음에 시간이 되면, Traffic 분석에 대한 이야기를 한 번 했으면 좋겠다. :-)



## References

* [NSX vSphere troubleshooting](http://www.yet.org/2014/09/nsxv-troubleshooting/)
* [Improving VM to VM network throughput on an ESXi platform](http://blog.cyberexplorer.me/2013/03/improving-vm-to-vm-network-throughput.html)
* [5. VXLAN & LOGICAL SWITCH DEPLOYMENT](http://chansblog.com/tag/vtep/)
* [NSX Distributed Firewall Deep Dive](http://www.routetocloud.com/2015/04/nsx-distributed-firewall-deep-dive/)
* [Understanding TCP Segmentation Offload (TSO) and Large Receive Offload (LRO) in a VMware environment (2055140)](http://kb.vmware.com/selfservice/microsites/search.do?language=en_US&cmd=displayKC&externalId=2055140)


