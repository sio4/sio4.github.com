---
title: 왜 screen을 사용하지 않는가?
tags: 리눅스 운영기술 오픈소스 유틸리티
date: 2007-05-11T10:45:29+09:00
modified: 2008-03-09T02:01:23+09:00
---
기술자들이여, 왜 screen을 사용하지 않는가? 싸잡아서 "기술자들이여" 라고
말한 부분은 좀 문제가 있다. 공격적인, 과격해보이는 과장이랄까? 그런데 정말,
근래에 만난 기술자들 중에 screen을 사용하는 사람을 보지 못했다. 왜지?

> 스크린은 여러 프로세스, 특히 대화형 쉘 들이 물리적 터미널을 함께 사용할
> 수 있도록 해주는 전체화면 창관리자이다. 각각의 가상 터미널은 DEC VT100
> 터미널의 기능과 더불어 ANSI X3.64와 ISO 2022 표준의 몇몇 제어 기능(예들
> 들어 줄의 삽입/삭제와 다중문자셋 지원 등)을 제공한다...

GNU 소프트웨어인 **screen** 에 대한 소개 중 일부분이다. (소개문 전문은
아래에 인용해뒀다.) 이 프로그램에 대한 정의를 내리자면 위의 소개문처럼,
"물리적 터미널의 공유를 위한 전체화면 모드의 창관리자"이다. 사실,
"창"이라는 표현이 좀 애매할 수 있다. "창"에서 떠올리는 이미지는 그래픽
환경에서 데스크탑위에 떠있는 네모들이겠지만, 여기서 말하는 창은 화면,
또는 터미널을 의미하는 것이다. 다시 말해서, 단일 물리적 터미널을 가상의
여러 터미널로 변신시켜주고, 그래서 여러개의 비 그래픽 모드 프로그램을
하나의 물리적 터미널 안에서 동시에 실행할 수 있게 해주는 녀석이라고
정리할 수 있다.

[GNU Screen - GNU Project - Free Software Foundation (FSF)](http://www.gnu.org/software/screen/)

> Screen is a full-screen window manager that multiplexes a physical terminal between several processes, typically interactive shells. Each virtual terminal provides the functions of the DEC VT100 terminal and, in addition, several control functions from the ANSI X3.64 (ISO 6429) and ISO 2022 standards (e.g., insert/delete line and support for multiple character sets). There is a scrollback history buffer for each virtual terminal and a copy-and-paste mechanism that allows the user to move text regions between windows. When screen is called, it creates a single window with a shell in it (or the specified command) and then gets out of your way so that you can use the program as you normally would. Then, at any time, you can create new (full-screen) windows with other programs in them (including more shells), kill the current window, view a list of the active windows, turn output logging on and off, copy text between windows, view the scrollback history, switch between windows, etc. All windows run their programs completely independent of each other. Programs continue to run when their window is currently not visible and even when the whole screen session is detached from the users terminal.

아마도 대부분의 기술자들은 여러 이유에서 다양한 형태의 원격작업을 하게
될 것이다. 자신의 사무실에서 사내 서버실의 장비에 접속하기도 하고, IDC에
위치한 서버에 접속하여 작업을 해야하는 경우도 있다. 그런데, 가끔 원격
작업이 힘들 때가 있다. 가령,

- 여러 프로그램을 동시에 실행하기 위하여 여러개의 접속(telnet이나 ssh 등)을
  만들어야 한다.
- 작업이 오래 걸리는 프로그램의 실행을 유지하기 위하여 접속을 끊을 수 없다.
- 대화형 작업이기 때문에 스크립트로 처리할 수 없다.

뭐, 이유는 많겠지만 지금 말하려는 것은 위의 세 가지로 충분할 것 같다.
바로 위와 같은 상황에서 screen이 힘을 발휘한다. 즉,

- 여러개의 접속 대신 단일 접속 안에서 여러 가상 터미널을 만들 수 있다.
- 가상 터미널을 살짝 떼어 놓았다가 다시 새 연결(새 물리적 터미널)에 붙일
  수 있다.

가령, 회사에서 IDC 에 연결하여 작업하던 중, 외근 일정에 의하여 다른 장소로
노트북을 끄고 이동해야 한다. 그럼 작업을 멈추고 쉘을 닫고 접속을 끊어야
하나? screen을 사용한다면 작업을 유지하고 터미널과 쉘을 분리하여 두고
접속만 끊으면 된다. 그리고 외근 후에 다시 연결하여 분리해둔 터미널에 다시
연결하면 만사 OK.

