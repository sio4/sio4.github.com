---
redirect_from: /entry/make-a-copy-of-subversion-repository-with-svnsync/
title: "서브버전 저장소 사본 만들기, svnsync"
tags: productivity version-control howto high-availability project
categories: ["development"]
date: 2008-04-09T01:01:59+09:00
last_modified_at: 2010-07-02T19:20:10+09:00
---
지금의 업무 환경이 마땅치 않아서 이기고 하고 또 한편으로는 작은 오픈소스
프로젝트를 열어보고자 하는 생각도 있고 하여, 요 얼마간 서브버전을 지원하는
공개 프로젝트 호스팅 서비스를 찾고 있었다.
실은 [trac](http://trac.edgewall.com/)을 지원하는 무료 호스팅 서비스를
원했으나 적당한 것을 찾지 못했다.

프로젝트 호스팅 서비스를 찾다보니 고민하게 되는 것이, 만약의 사태에 대한
대비 또는 써보니 서비스가 성에 차지 않는다든지 하여 이사하게 될 상황에
대한 대책 마련이다. (직접 운영하는 저장소는 단순히 저장소를 묶어 보관하는
것 만으로도 충분한 백업 또는 이전 대책이 서기 때문에 아직까지 이런 필요성을
느끼지는 않았었다.)

서브버전이 제공하는 기능 중에 저장소의 읽기 전용 사본을 만드는 기능이 있다.
기능의 본래 취지는 말 그대로 읽기 전용 사본을 만드는 것이지만 (대부분의
오픈소스 프로젝트를 보면, 커밋 권한을 가진 개발자에 비하여 엄청나게 많은
수의 사용자들이 읽기 전용 권한으로 소스를 받아가게 되는데, 이런 부하를
분산시킬 수 있는 또는 지역으로 미러링 할 수 있는 기능이 필요하다.) 이
기능이 나의 백업/이전 용도에도 적절히 사용될 수 있을 것 같다.

과정은 다음과 같다.

```console
$ mkdir /svn-mirror
$ svnadmin create /svn-mirror/my-project
$ cd /svn-mirror/my-project/hooks
$ cp pre-revprop-change.tmpl pre-revprop-change
$ vi pre-revprop-change
$ chmod 755 pre-revprop-change
$ svnsync init file:///svn-mirror/my-project svn+ssh://repository/var/svn/my-project
sio4@repository's password: 
리비전 0의 복사된 속성
$ svnsync sync  file:///svn-mirror/my-project
sio4@repository's password: 
커밋된 리비전 1.
리비전 1의 복사된 속성
$ svn log file:///svn-mirror/my-project
------------------------------------------------------------------------
r1 | sio4 | 2008-04-08 23:02:46 +0900 (화, 08 4월 2008) | 2 lines

prepare project repository.

------------------------------------------------------------------------
$
```


1. 먼저 미러를 보관하기 위한 디렉토리를 만들고 그 안에 빈 저장소를 만든다.
   (저장소를 복사하는 것이 아니라 변경점을 동기화하는 것이 이 사본 만들기
   기능의 방식이기 때문에 저장소 생성은 별도의 작업으로 진행된다.)
2. 만들어진 빈 저장소에 pre-revprop-change 후크를 설정해준다.
3. 프로젝트의 주 저장소와 연결하기 위하여 `svnsync init` 명령을 수행한다.
4. 연결된 사본을 `svnsync sync` 명령을 수행하여 동기화한다.

이상의 간단한 단계를 거쳐 이제 로컬에 저장된, 그리고 주 저장소와 동일한
복사본을 얻었다. 물론 읽기 전용 사본으로써 활용하기 위해서는 보다 정교한
설정이 필요하겠지만 나의 용도인 저장소 백업을 위해서는 이 정도면
충분하리라고 생각한다. 음... 글쎄... 정말 이사갈 일이 생기면 방 빼는 건
쉬웠는데... 다시 들여놓는 것도 그렇게 간단할까?

