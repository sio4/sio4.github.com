---
redirect_from:
- /entry/Landscape-Canonical의-새로운-서비스-SaaS-SMS-as-a-Service/
- /175/
title: 'Landscape: Canonical의 새로운 "Monitoring as a Service"'
tags: Canonical Ubuntu monitoring cloud-computing as-a-service
categories: ["opensource"]
date: 2008-12-03T01:08:32+09:00
last_modified_at: 2011-03-04T13:46:36+09:00
---
휴~ 이러니 내가 캐노니칼/우분투를 좋아하지 않을 수 없단 말이지.

벌써 12월인데 오늘에야 처음으로 Ubuntu의 새 버전인 8.10 Intrepid의 서버
버전을 설치해보았다. 뭐, 그냥 새 배포본일 뿐이지 별다른 생각은 없었다.
설치하는 과정에서 보니까... 소프트웨어/보안패치 자동업데이트 부분이 눈에
띄기는 했었지. 그런데, 잠깐 logout 했다가 다시 접속했을 때, 뭔가 익숙하지
않은 뭔가가 있는 것이 아닌가?

```console
sio4@jangseung:/box/vms$ ssh 192.168.122.182
sio4@192.168.122.182's password: 
Linux ubuntu 2.6.27-7-server #1 SMP Fri Oct 24 07:37:55 UTC 2008 i686

The programs included with the Ubuntu system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/\*/copyright.

Ubuntu comes with ABSOLUTELY NO WARRANTY, to the extent permitted by
applicable law.

To access official Ubuntu documentation, please visit:
http://help.ubuntu.com/

  System information as of Wed Dec  3 00:40:01 KST 2008

  System load: 0.0              Memory usage: 5%   Processes:       51
  Usage of /:  8.7% of 7.87GB   Swap usage:   0%   Users logged in: 1

  Graph this data and manage this system at https://landscape.canonical.com/
Last login: Wed Dec  3 00:34:39 2008 from 192.168.122.1
sio4@ubuntu:~$ 
```

오~~ 시스템 정보 요약서비스! 좋지. 관리하던 서버가 있던 시절에는 이런
사소한 것에도 많은 관심을 가졌던 터라... 첫번째 느낌은 "향수"랄까? 그런데
자세히 보니... "저 쪽에 가서 이 자료를 그려보고 이 시스템을 관리해보시라"고?
아뿔싸! 아까 건성으로 보아 넘겼던 자동업데이트 부분에서 잠깐 스쳐봤던
그 단어! Landscape! 캐노니칼의 새로운 시스템 관리/모니터링 서비스이다!

## 대단하다!

배포본 전쟁의 황혼기에 해성처럼 나타나 새로운 시장 구도를 만들어 놓은 이들.
데스크탑에서 서버, 다시 MID와 넷북, 이제는 ARM 기반 시스템으로 전개되는
모습만으로도 그 들과 아무런 상관도 없는 내가 다 찌릿찌릿 하더니, 이제는
SaaS 형태의 SMS 서비스를 내놓은 것! 이건 뭐~

## 분하다!

바로 이것이 몇 개월 전에 팀장님께 제안했다가 "정신 있냐"고 혼만 났던 바로
그 서비스. 제품으로써의 SMS를 만든 것이 아니므로 팔 수는 없지만
(아니, 이제와서 그저 그런 SMS 제품 하나 만들어 봐야 팔 수도 없겠지만 :-),
SaaS 개념을 도입한 SMS라면 충분히 고객에게 새로운 가치를 줄 수 있을 뿐만
아니라, 영업/마케팅 측면에서 서비스를 차별화 할 수 있고 개발팀의 입장에서도
각각의 사이트에 청진기를 심어놓는 격이니... 놓치기 쉬운 고객의 헛기침
소리까지 잡아낼 수 있을 것이고... 나름대로 훌륭한 발상이라고 혼자서만
주장하다가 묻혀버린 바로 그 서비스를 다른 회사의 사이트에서 보는 심정이...
찌릿찌릿? 이런...분하다!

캐노니칼! 니들 딱 내 삘이다~!

[Welcome! - Landscape](https://landscape.canonical.com/)

> Landscape makes the management and monitoring of Ubuntu systems simple and effective by combining world-class support with easy to use online management tools.

[Landscape \| Canonical](http://www.canonical.com/projects/landscape)

> Landscape - Changing the way you manage your systems
>
> Download the datasheet Landscape is an easy-to-use systems management and monitoring service that allows you to manage multiple Ubuntu machines as easily as one through a simple Web-based interface. The Landscape service provides powerful, automated systems administration capabilities such as management, monitoring and provisioning of packages across multiple machines lowering your per-systems cost of management and administration. Because Landscape is Web-based, it is easy to set up and use and requires no special hardware or specialised skills. View the landscape datasheet for even more details.
