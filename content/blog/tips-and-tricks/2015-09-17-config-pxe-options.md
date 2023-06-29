---
title: "Howto: PXE 부팅 설정 (HP DL Series)"
image: /attachments/20150917-pxe-6-e51.jpg
tags: ["howto", "PXE", "hardware"]
categories: ["tips-and-tricks"]
date: 2015-09-17 11:23:00+09:00
---
몇일 전에 [PXE Mater 구성하기]({% post_url tips-and-tricks/2015-09-15-setup-pxe-master %})라는
글을 올렸다. 이것으로 PXE에 대한 이슈는 정리된 것으로 생각하고 있었는데,
또다른 복병이 나타났다. 바로 대상 Hardware의 PXE 설정!

앞서 말한 바와 같이 난 PXE를 좋아하는 편이지만, 바쁘게 서버를 켜야 하는
상황(작업이나 장애 대응 같은...)에서 서버에 꽂힌 NIC 만큼이나 많이 PXE
시도를 하면서 지나가는 시간은 정말 너무 아까웠었다. 그래서 어차피 안쓰는
것이라면 아예 Disable 시키고 싶었던 적도 많았고...  
그런데 이번 OpenStack 설치 작업을 하는 중에는 이게 역으로 다가왔다.

## 사건의 시작

문제는, 설치를 진행하는 파트너가 "혼선 가능성"을 이유로 단 하나의 Port를
제외하고는 모든 Port에 대하여 PXE 기능을 Disable 시키려 한 것. 내 성격이
모난 것인지, 이게 뭔가 맘에 들지 않았다. 이유는,

* 설정을 바꾸기 위해서 그 긴 부팅 시간을 두 번은 겪어야 하며,
* 설정 변경을 "사람 손"에 의지하여 해줘야 한다는 점.
* 그리고 무엇보다도, 향후 서버가 증설될 때마다 이렇게 한다면, 절차가
  복잡해지고 실수의 가능성도 있을 것 같고...

그래서 그냥, 모든 포트를 Enabled 상태로 두고 진행하자고 제안하였는데...

어떻게 이런 일이? 시험에 사용한 6대의 대상 서버 중 하나가 PXE 부팅을
하지 못하는 것이다.

## 설정 확인

> 어? 다 시험해 봤는데?

확인을 해보니, 그 한 대는 외장 NIC가 있었는데, 외장으로는 PXE가 동작을
하지만 우리가 사용하려는 Onboard NIC는 PXE 동작을 아예 시도하지도 않는
현상이 발생한 것이다. 왜?

먼저 ROM BIOS의 설정을 봤다.

> Boot Order에서 빠져있겠지...

그런데 아래와 그림과 같이 Onboard NIC에 대한 Boot Options은 정상적으로
설정이 되어있었지만(= 아래 그림처럼 "Network Boot"로 되어있어야 해당
NIC를 PXE 부팅에 사용한다.) IPL 순서에서는 아예 항목이 빠져 있었다!

![](/attachments/20150917-pxe-1-bootoptions.jpg)

이게 무슨 일인가? Firmware 설정을 초기화도 해보고, 아예 Jumper Switch를
조절하여 Clear도 해봤지만, 어떤 조치로도 IPL 목록에서 사라진 NIC를 찾을
길이 없었다. (안타깝게도, Vendor 엔지니어도 감을 잡지 못하고 Firmware를
업데이트 해보자고 제안해 왔다.)

그러다가 순간 스쳐 지나간 생각!

> Onboard NIC에도 외장 NIC처럼 EEPROM이 있고 그에 대한 설정이 있겠지???

그래서 부팅 화면을 다시 찬찬히 들여다 봤다! 그리고 그 화면!

![](/attachments/20150917-pxe-2-nic-config.jpg)

이렇게, Broadcom OEM의 Onboard NIC 역시 Configuration Menu에 진입하는
키가 있었다는 것. (기왕에 Onboard면 ROM-Based Setup에서 다 처리하면
얼마나 좋아???)

Ctrl-S를 누리고 메뉴에 진입해보니, 아래와 같이 개별 Port 목록이 나와
있었다.

![](/attachments/20150917-pxe-3-nic-list.jpg)

사용하려는 첫번째 Port를 선택하여 설정 상태를 보니... "Boot Protocol"
이라는 항목의 값이 "NONE"으로 되어있는 것이 아닌가?

> 아뿔싸! 누가 이 깊은 곳에 들어와서 일부러 값을 끈거야?!

값 변경을 해보니, PXE 외에도 Remote Program Load 라는 항목도 있었다.
우리에게 필요한 PXE로 설정을 한 상태의 내용은 아래와 같다.

![](/attachments/20150917-pxe-4-enabled.jpg)

(전에 몰랐던 것인데, NIC 차원에서 VLAN을 지정할 수 있게 되어있더라.
이건 몰랐는데... OS에서 제어 가능한 것을 이렇게 딱딱하게 설정하는
것이 의미가 있나? 경우에 따라서...)

아무튼, 설정을 마치고 다시 ROM-Based Setup에 진입하여 보니 다음과
같이 IPL 목록에 정상적으로 항목이 등장하였다.

![](/attachments/20150917-pxe-5-ipl-list.jpg)

참으로 말도 많고 탈도 많은... 그러나 남는 것은 없을 것 같은 프로젝트.
이렇게 시시한 경험과 상식만 생기는구나...

## 덤

아무튼, 이렇게 PXE 불능에 대한 Episode는 끝을 내렸다! 덤으로, PXE 동작이
눈에 보이는 방식들.

Discovery 에 실패하였을 때 발생하는 E51 오류.
![](/attachments/20150917-pxe-6-e51.jpg)

Cable 연결이 정상적이지 않을 때(Carrier가 없을 때) 나타나는 E61 오류.
![](/attachments/20150917-pxe-7-e61.jpg)

아무튼, 위의 두 오류 역시 PXE가 동작하는 증거!

> PXE야! 반갑다!

부팅 과정에서 PXE가 반갑기는 처음인 것 같다... ㅠ.ㅠ

