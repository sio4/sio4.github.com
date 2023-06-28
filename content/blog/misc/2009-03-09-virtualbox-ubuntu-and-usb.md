---
redirect_from: /entry/virtualbox-ubuntu-and-usb-device/
title: VirtualBox, Ubuntu, 그리고 USB
tags: ["Ubuntu", "hardware", "VirtualBox"]
categories: ["misc"]
date: 2009-03-09T22:47:19+09:00
last_modified_at: 2010-07-02T23:00:54+09:00
---
버추얼박스, 우분투, 그리고 USB 지원. 그동안 VMWare Workstation에 대한
대안[^1]으로 VirtualBox를 사용한 지가 한 3년 쯤 되는 것 같다. 시작은
아마 정확한 기억은 아니지만 Fedora...3? 4? 정도와 함께였던 것 같다.
그 이후로 Ubuntu 7.04, 7.10 등의 버전에서 사용해왔는데, USB를 사용하기
위해서는 꼭 뭔가 다른 작업을 해줘야 했다.[^2]
그런데 오늘, 인증서 때문에 USB를 쓰려다 보니 Ubuntu 8.10 Intrepid Ibex
에서는 단지 나를 vboxusers 그룹에 넣어주는 것 만으로 모든 것이 끝났다.
오호라~

[^1]: 좀 표현이 그런가? 그냥 "데스크탑용 가상화 솔루션으로"라고 표현하는
      것이 좋을까? 어쨌든 VirtualBox를 처음 사용하기 시작한 시점의 내
      목적은 그랬다. 더 이상 상용 가상화 솔루션을 쓰고싶지 않았던 것.

[^2]: 옛날같았으면 도데체 왜 이런 설정을 해야 하는지 파내고야 말았을테고
      뭔가 atomic한 솔루션을 추구했겠으나... 요즘은 그냥 구글링이다.
      쩝...
     
이젠 /proc/bus/usb를 더이상 쓰지 않는다는 뜻인가? 어쨌든 좀 재미있는
것은,

```console
sio4@heavy:~$ ls -l /dev/bus/usb/*/*
crw-rw-r-- 1 root vboxusers 189, 0 2009-03-08 02:16 /dev/bus/usb/001/001
crw-rw-r-- 1 root vboxusers 189, 128 2009-03-08 02:16 /dev/bus/usb/002/001
crw-rw-r-- 1 root vboxusers 189, 256 2009-03-08 02:16 /dev/bus/usb/003/001
crw-rw-r-- 1 root vboxusers 189, 384 2009-03-08 02:16 /dev/bus/usb/004/001
crw-rw-r-- 1 root vboxusers 189, 387 2009-03-09 22:44 /dev/bus/usb/004/004
crw-rw-r-- 1 root vboxusers 189, 512 2009-03-08 02:16 /dev/bus/usb/005/001
crw-rw-r-- 1 root vboxusers 189, 640 2009-03-08 02:16 /dev/bus/usb/006/001
crw-rw-r-- 1 root vboxusers 189, 641 2009-03-08 02:16 /dev/bus/usb/006/002
crw-rw-r-- 1 root vboxusers 189, 768 2009-03-08 02:16 /dev/bus/usb/007/001
sio4@heavy:~$
```

이렇게 보이더라는 것.

참고로, 예전엔 이렇게 많은 검색 결과가 있었다. 아직도 몇몇 블로그
등에서는 8.10 과 USB에 관련된 해법이 설명되어 있기는 하네...

