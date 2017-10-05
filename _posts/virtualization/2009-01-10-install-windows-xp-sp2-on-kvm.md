---
redirect_from: /blog/2009/01/10/install-windows-xp-sp2-on-kvm/
title: kvm에 Windows XP SP2 설치하기
tags: kvm windows virtualization
categories: ["virtualization"]
date: 2009-01-10T19:12:51+09:00
modified: 2009-01-10T19:12:51+09:00
---
## 들어가기
  
이미 오래 전부터, 가상화라는 기술은 내게 산소같은 존재가 되어버렸다.
특히, 지금처럼 MS Windows 없이는 회사생활을 할 수 없는 회사에 다니는
한, 또는 연초에 연말정산을 위해서, 또는 인터넷 쇼핑이나 인터넷 뱅킹을
위해서는 무조건 Windows OS를 사용하여야 하는 이 나라에 사는 한...
(뭐, 가상화에 대해서는 다른 할 말이 많지만, 오늘의 주제는 이렇게,
당장은 개인적인 영역의 이야기이다.)  
  
이번 이야기는, 근래에 리눅스 기반 가상화의 샛별로 떠오르고 있는 kvm을
활용하여 Windows XP 가상머신을 설치하는 과정을 정리한 것인데, 이것을
시작으로 하여 진행하려고 하는 "kvm을 활용한 데스크탑 가상화 시험"은
개인적으로 매우 의미가 있는 시험이 될 것 같다.  
  
데스크탑을 위한 가상화라면 상용의 VMWare Workstation이 대표적일 것이고
오픈소스 진영에서는 VirtualBox라는 훌륭한 제품이 있긴 하다. 그런데 왜
kvm으로... 그러냐고? kvm이니까.  
  
## 윈도 데스크탑 가상머신을 위한 조건들  
  
데스크탑 가상화의 최종 사용자는 "데스크탑"을 필요로 한다. 즉, GUI가
필요하고, MS Office 같은 데스크탑용 응용프로그램들의 사용에 문제가
없어야 하고, (나의 경우가 그러하니까) USB 등의 하드웨어 장치 지원이
가능해야 할 것 같다. 이 부분은 다음 기회에 더 이야기하자.  
  
## kvm에 Windows XP SP2 설치하기  
  
### 가상머신 구성하기  
  
먼저, 지난번에 작성해둔 `genxml.sh` 이라는 스크립트를 다시 사용하였다.  
  
```console
sio4@jangseung:/box/vms$ ./genxml.sh  
name of vm: xpsp2  
size of ram: 512  
number of cpus: 1  
path of cdrom: /box/isos/winxp-skcc.iso  
disk size of sys: 10  
Formatting '/box/vms/xpsp2/xpsp2-sys.qcow2', fmt=qcow2, size=10485760 kB  
disk size of tmp: 2  
Formatting '/box/vms/xpsp2/xpsp2-tmp.qcow2', fmt=qcow2, size=2097152 kB  
disk size of opt: 5  
Formatting '/box/vms/xpsp2/xpsp2-opt.qcow2', fmt=qcow2, size=5242880 kB  
sio4@jangseung:/box/vms$
```
  
리눅스 서버를 염두에 둔 스크립트여서 sys, tmp, opt 의 세 영역을 만들고
있다. (여기서 sys는 시스템 영역으로 혹시 가상머신을 복재하게 될 경우
공유해서 활용할 수도 있는 영역이고, tmp는 각 기계별 임시저장 공간,
opt는 기계별 활용도에 따른 사용자/제3자 응용프로그램을 위한 공간으로
계획되었다.)  
  
예전에 디스크 공간에 예민해야 했던 시절부터 윈도우 가상머신을 위해서도
이와 비슷한 구조를 사용했었다. 읽기전용의 꽉 짜여진 system 영역(C:),
변동하는 자료를 위한 보조영역(D:), 가상메모리를 위한 휘발성 영역(E:)
이런 식이다. 이 구조와 위의 sys, opt, tmp의 구조가 비슷하므로 일단 위의
설정을 유지하기로 결정했다.  
  
### 설치하기  
  
위의 설정을 이용하여 `virt-viewer`를 기동하고 설치를 시작했으나 시작부터
걸림돌이 기다리고 있었다. 바로 위의 디스크 설정과 관련된 부분인데,
설치 프로그램이 시스템을 위한 C: 이외의 다른 디스크에 대한 포맷을
요구하고 나선 것이다. 내 계획은 설치가 끝난 시점에서 봤을 때 D:, E:는
비어있는 것이므로 내 계획과 맞지 않는 것이다. (다시 행각해보면 설치용
임시 디스크로 생각하고 이렇게 진행할 걸 그랬나? 아니면 다른 문제가
있었는데 내 기억이 짧은 것인가?)  
  
아~~ 잘 기억나지 않는다. 다시 해보고 다시 써야겠다.

