---
title: kvm, kvmclock, 그리고 "폭주 게스트"
tags: 장애분석 kvm strace
date: 2012-03-09T13:57:05+09:00
modified: 2012-03-09T13:57:05+09:00
---
그냥 급하게 진행해버려서 로그를 다 놓쳤다. 아무튼, 내 kvm Guest가 미친듯이
달렸다. 이게 처음 겪는 일은 아닌데, 지난 번 사고때는 그냥 "뭐냐~" 하면서
재시작해버렸다. 그러나 이번엔 원인 규명을 위해 약간의 정보를 더 얻어봤다.

## 어떻게 달리나?

증상은 이렇다. 먼저 미친 기관차에 `strace`를 걸었을 때,

{% highlight console %}
rt_sigaction(SIGALRM, NULL, {0x7f8c00851300, ~[KILL STOP RTMIN RT_1], SA_RESTORER, 0x7f8bffee9060}, 8) = 0
write(8, "\1\0\0\0\0\0\0\0", 8) = 8
read(17, 0x7fffe6b5b1b0, 128) = -1 EAGAIN (Resource temporarily unavailable)
timer_gettime(0, {it_interval={0, 0}, it_value={0, 0}}) = 0
timer_settime(0, 0, {it_interval={0, 0}, it_value={0, 250000}}, NULL) = 0
timer_gettime(0, {it_interval={0, 0}, it_value={0, 203522}}) = 0
select(20, [7 10 16 17 18 19], [], [], {1, 0}) = 1 (in [7], left {0, 999997})
read(7, "\1\0\0\0\0\0\0\0", 512) = 8
select(20, [7 10 16 17 18 19], [], [], {1, 0}) = 1 (in [17], left {0, 999955})
read(17, "\16\0\0\0\0\0\0\0\376\377\377\377\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0\0"..., 128) = 128
{% endhighlight %}{:.dark}

이런 내용을 무지하게 뿌리고 있었다. 단순히 이 내용을 보고
"Resource temporarily unavailable" 오류를 만드는 fd 17에 집중하게 됐는데,
찾아보니,

{% highlight console %}
sio4@sun:~$ sudo ls -l /proc/10815/fd
total 0
...
lrwx------ 1 libvirt-qemu kvm 64 2012-03-09 13:33 10 -> anon_inode:[signalfd]
lrwx------ 1 libvirt-qemu kvm 64 2012-03-09 13:33 14 -> anon_inode:kvm-vcpu
lrwx------ 1 libvirt-qemu kvm 64 2012-03-09 13:33 15 -> anon_inode:kvm-vcpu
lrwx------ 1 libvirt-qemu kvm 64 2012-03-09 13:33 16 -> socket:[104985]
lrwx------ 1 libvirt-qemu kvm 64 2012-03-09 13:33 17 -> anon_inode:[signalfd]
lrwx------ 1 libvirt-qemu kvm 64 2012-03-09 13:33 18 -> socket:[104986]
lrwx------ 1 libvirt-qemu kvm 64 2012-03-09 13:33 19 -> /dev/net/tun
lrwx------ 1 libvirt-qemu kvm 64 2012-03-09 13:33 3 -> socket:[104980]
lrwx------ 1 libvirt-qemu kvm 64 2012-03-09 13:33 4 -> /dev/ptmx
lrwx------ 1 libvirt-qemu kvm 64 2012-03-09 13:33 5 -> /dev/kvm
lrwx------ 1 libvirt-qemu kvm 64 2012-03-09 13:33 6 -> anon_inode:kvm-vm
lrwx------ 1 libvirt-qemu kvm 64 2012-03-09 13:33 7 -> anon_inode:[eventfd]
lrwx------ 1 libvirt-qemu kvm 64 2012-03-09 13:33 8 -> anon_inode:[eventfd]
...
{% endhighlight %}{:.dark}

signalfd 라는데... 이 정체는 뭘까?

아차! Terminal log buffer를 다 날렸다고 해놓고 어떻게 잡았냐고? 혹시나
정상적인 VM을 trace했더니 같은지 비슷한지... 이런 결과가 나왔다.

## 찾아본 내용

먼저, 리소스 관련 로그를 기반으로 찾아봤더니, VM이 사용할 clock 관련 글들을
몇 개 찾을 수 있었다. 현상으로 봐도 뭔가 연관이 있을 것도 같다. 하지만...
문제의 의도적 재현이 되지 않는 상황에서 연관성이 있는지 확인은 하지 못했다.
좀 두고 봐야 할 문제네.

[guest needs to boot with clock=acpi\_pm](https://bugs.launchpad.net/ubuntu/+source/qemu-kvm/+bug/361754)

## 기타

요거 문제 해결하려고 VM 내의 syslog를 보려 했더니 온통 DHCP lease 관련
로그로 범벅이 되어 있다. 서버라지만 고정IP를 쓰는 것은 좋아하지 않으므로
그것을 고칠 생각은 없고, DHCP 서버의 lease time을 조정하고 싶은데
libvirt/kvm에 의해 자동 실행되는 `dnsmasq`의 parameter를 바꿀 수 있는 방법을
쉬 알 수 없네.

`dnsmasq` 자체만 보면, `--dhcp-range` 옵션의 ',' 분리된 인수 중 세 번째로
leasetime을 줄 수 있도록 되어있는데, kvm의 xml 기반 network 설정에는 해당
기능이 없는 듯 하다. 좀 더 알아보고, 요청을 하든지...

