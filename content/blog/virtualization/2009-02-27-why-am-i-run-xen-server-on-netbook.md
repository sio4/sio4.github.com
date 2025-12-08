---
redirect_from:
- /entry/xen-on-netbook/
- /181/
title: 어쩌자고... 넷북에서 Xen을 돌리겠다는 건데?
tags: ["Ubuntu", "Xen", "virtualization"]
categories: ["virtualization"]
date: 2009-02-27T10:15:59+09:00
lastmod: 2010-07-02T21:20:07+09:00
---
좀 우끼는 일이지만,
[삼성전자의 넷북인 NC10](http://en.wikipedia.org/wiki/Samsung_NC10)에
우분투를 설치하고 Xen 가상화 환경을 구축하려는 과정의 이야기이다. 실은,
어제 저녁에 이 과정에 얽힌 긴 글을 쓰고 초안으로 올려뒀는데, 오늘 보니
사라져버렸네... ScribeFire로 글을 작성했는데, 이렇게 작성한 몇몇 글 중에서
사라져버린 것은 이 번이 처음이다. 누구 문제인지는 모르겠으나... 오늘 아침
tistory 접속 자체가 잘 안되었던 것을 감안하면, Firefox의 문제일지도...
어쨌든 한 번 쓴 글을 다시 쓰려니 글 쓸 생각은 잘 안나고 짜증은 잘 난다.
(에라 그만둘까 싶지만서도...)
<!--more-->

## 넷북, NC10과 Xen

본론으로 들어가서, 그렇다. 넷북에 Xen을 올리겠다는 것은 조금 우끼는 일이다.
본격적인 "경험담"에 들어가기 전에 잠깐 Xen와 NC10의 궁합에 대해서 생각해봤다.

NC10은 삼성전자의 첫번째 넷북인데, [Intel의 Atom N270 프로세서](http://en.wikipedia.org/wiki/List_of_Intel_Atom_microprocessors#Atom_N2xx_series_.28single-core.29)를 사용하고 있다. CPU 사양을 잠깐 살펴보면,

```console
sio4@vios:~$ cat /proc/cpuinfo
processor : 0
vendor_id : GenuineIntel
cpu family : 6
model : 28
model name : Intel(R) Atom(TM) CPU N270 @ 1.60GHz
stepping : 2
cpu MHz : 1596.061
cache size : 512 KB
fdiv_bug : no
hlt_bug : no
f00f_bug : no
coma_bug : no
fpu : yes
fpu_exception : yes
cpuid level : 10
wp : yes
flags : fpu de tsc msr pae mce cx8 apic mtrr mca cmov pat clflush dts acpi mmx fxsr sse sse2 ss ht tm pbe constant_tsc arch_perfmon pebs bts pni monitor ds_cpl est tm2 ssse3 xtpr lahf_lm
bogomips : 3195.05
clflush size : 64

processor : 0
vendor_id : GenuineIntel
cpu family : 6
model : 28
model name : Intel(R) Atom(TM) CPU N270 @ 1.60GHz
stepping : 2
cpu MHz : 1596.061
cache size : 512 KB
fdiv_bug : no
hlt_bug : no
f00f_bug : no
coma_bug : no
fpu : yes
fpu_exception : yes
cpuid level : 10
wp : yes
flags : fpu de tsc msr pae mce cx8 apic mtrr mca cmov pat clflush dts acpi mmx fxsr sse sse2 ss ht tm pbe constant_tsc arch_perfmon pebs bts pni monitor ds_cpl est tm2 ssse3 xtpr lahf_lm
bogomips : 3195.05
clflush size : 64

sio4@vios:~$
```

lm 도 없고, vmx 도 없다. 바꿔 말하면 x86-64 버전을 설치할 수도 없고
하드웨어 가상화 기능을 사용할 수도 없다는 뜻이다. 내 수중에 있는 기본
모델은 1GB의 RAM을 기본 장착한 상태인데 메모리 슬롯이 하나 밖에 없기
때문에 메모리 증설도 간단하지가 않다. 그런데 어째서 여기에 무슨 가상머신을
올리겠다고?
(참고로 삼성전자의 다음 모델인 NC20은
[VIA의 NANO칩](http://en.wikipedia.org/wiki/VIA_Nano)을 쓴다고 한다.
lm, vmx 다 된다던데? 솔깃~)

대답은 간단. 가벼우니까. 점점 무거운 Xnote를 어깨에 메고 다니는 것이
부담스럽게 느껴지던 차에, 이런 녀석이 옆에서 놀고 있는 꼴을 보니 써주지
않을 수가 있어야지. (그러고보니 고작 램 128MB, 256MB에서 가상머신 돌리면서
옆 팀의 512MB, 640MB 쓰는 동료들 부러워했던 때가 엇그제 같은데...
1.6GHz에 1GB 램이면 떡을 치는 사양 아니야?)

### 참고 : NC10의 주변 기기 사양

```console
sio4@vios:~$ lspci
00:00.0 Host bridge: Intel Corporation Mobile 945GME Express Memory Controller Hub (rev 03)
00:02.0 VGA compatible controller: Intel Corporation Mobile 945GME Express Integrated Graphics Controller (rev 03)
00:02.1 Display controller: Intel Corporation Mobile 945GM/GMS/GME, 943/940GML Express Integrated Graphics Controller (rev 03)
00:1b.0 Audio device: Intel Corporation 82801G (ICH7 Family) High Definition Audio Controller (rev 02)
00:1c.0 PCI bridge: Intel Corporation 82801G (ICH7 Family) PCI Express Port 1 (rev 02)
00:1c.2 PCI bridge: Intel Corporation 82801G (ICH7 Family) PCI Express Port 3 (rev 02)
00:1d.0 USB Controller: Intel Corporation 82801G (ICH7 Family) USB UHCI Controller #1 (rev 02)
00:1d.1 USB Controller: Intel Corporation 82801G (ICH7 Family) USB UHCI Controller #2 (rev 02)
00:1d.2 USB Controller: Intel Corporation 82801G (ICH7 Family) USB UHCI Controller #3 (rev 02)
00:1d.3 USB Controller: Intel Corporation 82801G (ICH7 Family) USB UHCI Controller #4 (rev 02)
00:1d.7 USB Controller: Intel Corporation 82801G (ICH7 Family) USB2 EHCI Controller (rev 02)
00:1e.0 PCI bridge: Intel Corporation 82801 Mobile PCI Bridge (rev e2)
00:1f.0 ISA bridge: Intel Corporation 82801GBM (ICH7-M) LPC Interface Bridge (rev 02)
00:1f.2 IDE interface: Intel Corporation 82801GBM/GHM (ICH7 Family) SATA IDE Controller (rev 02)
00:1f.3 SMBus: Intel Corporation 82801G (ICH7 Family) SMBus Controller (rev 02)
02:00.0 Ethernet controller: Atheros Communications Inc. AR242x 802.11abg Wireless PCI Express Adapter (rev 01)
03:00.0 Ethernet controller: Marvell Technology Group Ltd. 88E8040 PCI-E Fast Ethernet Controller (rev 13)
sio4@vios:~$
```

## 우분투/Xen 설치하기

어쨌든 NC10에 우분투를 설치하기 시작했다. 일단, 간단하게 기존에 설치하여
잘 돌아가고 있던 8.10 버전을 한 쪽 파티션에 복사, 다중 부팅을 하도록 했다.
그런데 이게 왠일, 시작부터 난관~! 8.10 버전의 우분투는 Xen의 Dom0를 지원하지
않는단다. 앞으로 계속 하지 않는다는 얘기도 있고(kvm을 밀고 있는 형국이므로
그럴만도 하다.) LTS에서만 될 거라는 얘기도 있고... 어쨌든 이번 작업의
목적은 "가상화"가 아니라 "Xen"이므로 간단한 결정을 했다. LTS이고 Xen 지원이
되는 8.04 버전으로 내리는 것. 결국, ubuntu 8.04 server i386 버전을 한 쪽
파티션에 깔았다.

8.10 버전의 Ubuntu를 NC10에 설치하는 것은 숨쉬는 것 만큼 간단했다. (물론,
약간의 수작업이 있어야 Wireless 등의 일부 기능을 사용할 수 있다. 본론은
아니므로 생략) 그런데 8.04는 다르더군. 설치를 한 참 진행하다가 죽어버리는
것이 아닌가! 결국 acpi=off 라는 부팅 옵션을 추가로 줌으로써 문제는 비껴 갈
수 있었다. (확인해보지는 않았지만 초기에 구워둔 CD를 사용하지 않고 8.04
버전의 최신 이미지인 8.04.2로 시도했다면 쉽게 갔을지도 모르겠다. 설치를
마친 후 최신 업데이트를 적용하고 커널도 최신으로 올리고 나니 acpi 관련
문제는 사라졌다.)

다음 순서로, ubuntu-xen-server 라는 이름의 메타 패키지를 통하여 xen 관련
패키지 설치를 마쳤다. 초반에 액땜을 해서 그런지 이 과정은 순조롭게 진행이
되었다. Xen커널 부팅을 확인한 후, 용도가 용도인지라 server 버전으로
설치했음에도 GUI가 필요했기 때문에 xorg 패키지와 간단한 wm인 openbox
패키지를 설치하였다. 그런데 이게 왠 일인가! Xen으로 부팅한 상태에서는 intel
온보드 그래픽카드를 사용하는 Xorg가 동작하지 않았다. 아니, 화면에 검게
변하면서 멈춰버렸다. (Xorg의 intel 드라이버 문제인지 kernel의 intel-agp
문제인지는 모르나, 아마도 정황으로 봐서 intel-agp와 Xen 사이에서 메모리
분쟁이 있는 것 같다.) "그래, vesa 쓰면 되지 뭐..."

### Xorg, Xen, 그리고 945GME

쉽게 쉽게 안되면 피해가는 방식으로 여기까지 왔지만! 그런데 이게 뭔가?!
vesa 모드로 Xorg를 띄우면 고작 800x600의 해상도로 뜨는 것이 아닌가! 안되는
것은 참아도 미운 것은 참을 수 없다! 그렇게 본격적인 삽질은 시작되었다.

시도해본 것들 :

- intel 드라이버를 agp 없이 써보려는 시도 : 잘 안됨.
- vesa 드라이버를 쓰면서 1024x600을 얻기 위해 xorg.conf 로 어떻게 해보려는 시도 : 잘 안됨
- fbdev 드라이버를 쓸 각오를 하고 fbcon 띄워보려는 시도 : 헉! 왜 이런 시도를 한거야!

그렇다. 그런 시도를 한 것이 잘못이었다... 공식의 23-server 커널을 쓰면서
vga=0x314 옵션을 주면 800x600일 지언정 fbcon이 정상적으로 올라왔다. 그런데
23-xen을 올릴 때는 vga=... 도, video=... 도 먹질 않았다. xen이 원래
그런거니? 그럼 안되는데... 결국 커널 소스 패키지를 내려받아서 생애 최초의
deb 커스텀 빌드에 돌입! 몇 시간에 걸친 커널 컴파일을 시도했다.(이게 몇 년
만의 커널 컴파일인가? 기억도 나지 않는다!) 오라... 그랬더니, fbcon,
vesafb를 built-in으로 했더니, xen으로 시작해도 fbcon이 잘 올라왔다.
"이거야!". 여기서 멈춰도 되는데... 이놈의 결벽증은, 공식 커널에서도 왠지
설정을 잘 해주면 될 것 같은 생각이 자꾸 드는 것이다. 다시 커널을 공식
버전으로 복구하고 다양한 시도를 진행했다. 삽질의 끝은 어디인가? 포기!
아마도 뭔가 내가 모르는 것이 있는게다. 시간만 얼마가 지났는지...

그러던 길에 발견한 페이지(메일)가 바로 아래의 페이지 :

[[Debian-eeepc-devel] 1024x600 console [was: Re: Video out toggling]](http://lists.alioth.debian.org/pipermail/debian-eeepc-devel/2008-September/001114.html)

> I have made some progress with this. The intelfb framebuffer driver doesn't support mode changing except for the VGA output. However, the uvesafb framebuffer driver does as long as the mode you want is known to the BIOS. But the Eee BIOS doesn't know about the panel's native resolution. This can be fixed using a utility called 915resolution, which hacks the RAM copy of the BIOS. But 915resolution doesn't know about the 945GME chip in the '901.

멍청한 비디오 바이오스의 모드 리포트를 소프트웨어적으로 고쳐주는
프로그램인데, NC10의 그래픽칩인 945GME 지원에 대한 패치가 있었던 것. (휘발성
수정이라서 Xorg를 위한 답은 되는데 FB를 위한 답은 되지 않는다. FB를 위한
grub 패치도 있는 것 같은데 시도하지는 않았다.) 그래... 쉽게 가는게
목표잖아. 커스텀 커널보다는 커스텀 유틸이 낫지. 결국, 생애 최초로
dpatch 를 써가며 커스텀 버전의 915resolution패키지를 빌드, 설치, 설정했다.

```console
sio4@vios:~$ cat /etc/default/915resolution  
#  
# 915resolution default  
#  
# find free modes by&nbsp; /usr/sbin/915resolution -l  
# and set it to MODE or set to 'MODE=auto'  
#  
# With 'auto' detection, the panel-size will be fetched from the VBE  
# BIOS if possible and the highest-numbered mode in each bit-depth  
# will be overwritten with the detected panel-size.  
MODE=52  
#  
# and set resolutions for the mode.  
# e.g. use XRESO=1024 and YRESO=768  
XRESO=1024  
YRESO=600  
#  
# We can also set the pixel mode.  
# e.g. use BIT=32  
# Please note that this is optional,  
# you can also leave this value blank.  
BIT=  
sio4@vios:~$
```

휴, 이제야 깔끔한 모습의 GUI를, Xen 환경에서 볼 수 있게 되었다. 이제부터
시작이다!

이게 얼마만의 삽질인가! 후훗~ 간만에 재밌기도 하고 :-)

(그런데 오랜만에 DE 가 아닌 WM-only로 쓰려니까... 좀 당황스러운데?

