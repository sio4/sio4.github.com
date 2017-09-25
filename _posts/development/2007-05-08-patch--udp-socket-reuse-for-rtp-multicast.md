---
redirect_from: /blog/2007/05/08/patch--udp-socket-reuse-for-rtp-multicast/
title: '패치: UDP socket reuse for RTP Multicast'
tags: RTP 멀티미디어 오픈소스 패치
categories: ["development"]
date: 2007-05-08T16:39:21+09:00
modified: 2008-03-09T02:11:01+09:00
---
조금 된 패치인데, 기록을 위하여.

<http://lists.mplayerhq.hu/pipermail/mplayer-dev-eng/2007-March/049970.html>

리눅스 세상에서 아마도 가장 인기있는 미디어 재생기이며 동시에, 더군다나,
가장 인기있는 소프트웨어 중의 하나가 MPlayer이다. 꽤 오래전부터 이
프로그램을 사용해왔는데, 기능도 다양하고 본래의 재생기로써의 부분 외에
인코더 기능도 있어서(별도의 바이너리) 이 녀석 하나면 거의 대부분의
멀티미디어 관련 작업을 할 수 있다. MP3 듣기, 영화보기, 영화 다시
인코딩하기 등...

이 오랜 친구를 이번에는 업무에 연관하여 사용해봤다. HD급의 라이브 방송에
대한 재전송 시스템의 한 부분으로 삽입된 RTP 프로토콜 게이트웨이 프로그램을
작성했는데, 이 시스템의 간이 사용자 인터페이스(XUL 기반)의 미리보기 기능을
이 녀석을 이용하여 구현한 것.

그런데, 문제 발견. MPlayer가 RTP 프로토콜을 지원하기는 하는데 배타적으로
지원한다는 것. 다시 말해서 (MPlayer를 이용하여) 미리보기를 하는 스트림은
재전송을 위하여 다시 열릴 수 없다는 것을 알게 되었다. 그리고 약간의 수정,
메일링리스트를 통한 보고, 그리고 몇 통의 메일 끝에 결과가 반영되었다.

패치를 첨부한다. (최종적으로는 좀 더 향상된 형태로 반영되었다.)

[mplayer-1.0rc1-reuseaddr.patch](/attachments/mplayer-1.0rc1-reuseaddr.patch)
