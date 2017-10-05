---
redirect_from: /blog/2011/12/19/rdesktop-and-cleartype/
title: "VDI: rdesktop과 ClearType"
tags: virtualization VDI remote-terminal
categories: ["virtualization"]
date: 2011-12-19T14:42:24+09:00
modified: 2011-12-19T14:43:20+09:00
---
요즘 회사에서는 업무 환경에 VDI를 구축하겠다고 난리다. 뭐 난리는 아니겠지만
그냥 그렇게 표현했다. 오늘은 POC를 한다고 VMware View Client를 설치하라고...
주문이 들어왔는데... POC 사이트에 접속을 했건만, 이건 무슨 90년대식 깨진
글꼴? 그래서 잠깐 이것 저것 시도를 해봤다.

## 첫 시도, VMware View Open Client

꽤 오래 전에 공개되었던 VMware View Client의 오픈소스 버전을 찾아서
Google Code에 방문,
[프로젝트 사이트](http://code.google.com/p/vmware-view-open-client/)에서
최근의 버전을 다운받아 설치했다.

amd64용 deb 패키지를 받았더니 Ubuntu에서 무리 없이 설치가 되었고,
"프로그램-인터넷-VMware View Open Client" 메뉴를 이용하여 화면을 볼 수
있었다.

그런데 이게 무슨 꼴? 글씨가 삐뚤 빼뚤... 확~ 창을 닫을려다가 잠깐 IP와
접속 정보(Domain과 계정명)만 확인하고는 다음 시도에 들어갔다.

## 대안 찾기: tsclient, GUI Wrapper

우분투에는 메뉴에 "터미널 서버 클라이언트"라는 제목으로 뜨는 프로그램이 있다.
아마도 rdesktop의 프론트엔드겠지. 이 녀석을 이용하여 다시 시도했다.
프로토콜에서 RDP 버전을 5로 설정하고 앞서 확인한 VM의 IP와 계정을 이용해서
접속. 그런데...

1. 바탕화면 글꼴은 ClearType 적용이 잘 되어 있다.
1. 그런데 바탕화면 배경 이미지는 없네...
1. IE 브라우져의 URL 창은 ClearType이 적용된데 반해, Tab은 깨져 보인다. 뭐지? :-(

## 대안 찾기: rdesktop, Command line

웹을 좀 뒤져봤더니, -x 옵션을 이용하여 좀 세세한 설정을 할 수 있었다. 그래서,

```console
$ rdesktop -u xxx -p xxx -d xxx -g 1360x768 -x 0x80 10.10.10.10
```

이렇게, ... 그랬더니...

1. 이제 ClearType도 완전해졌고(IE Tab 포함)
1. 바탕화면도 보인다. ㅋ

그냥 -x 옵션을 기록으로 남기기 위해 좀 끄적였는데... 갑자기 예전에 s3c6400
기반 800x480 화면의 디바이스에 rdesktop 포팅하던 기억이 새록 새록 떠오르네...
그게 값이 쌀지는 모르겠으나... VDI라고 한다면 그렇게 가야 하지 않을까... :-)

