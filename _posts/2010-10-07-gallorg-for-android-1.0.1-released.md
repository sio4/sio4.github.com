---
title: GallOrg 1.0.1 released! (Android Gallery Organizer)
category: 안드로이드
tags: 안드로이드 Gallorg 앱 사진
published: 2010-10-07T17:36:26+09:00
modified: 2011-03-04T13:29:19+09:00
---
GallOrg 1.0.1을 릴리즈한다. 어제 1.0.0을 릴리즈했는데, "갑놀이"에 빠진 동료의
도움으로 치명적인 결함을 발견했다. 발견되었던 문제는, 원본이 저장된 미디어
(filesystem)와 새로 저장될 미디어가 다를 때, 파일 이동이 정상적으로 이루어지지
않을 뿐만 아니라 원본 파일이 삭제되어버리는 치명적인 내용이었다. :-(

내부적으로 java.io.File 의 renameTo() 를 사용하고 있는데, 이 녀석이
파일시스템간 이동을 지원하지 않는다는 것을 미쳐 몰랐습니다. (자바의 '자'짜도
모르면서 안드로이드 개발하겠다고... 이게 개발인지 뭔지...) 이런 경우, "복사
후 메타 정보 복사해주고 지우기 방식"을 적용하면 될텐데, 일단 생략하고 문제만
막았습니다.

### Changelogs:

- bugfix: avoid losing files while move across filesystem.

치명적인 결함을 발견해준 동료에게 감사를!

> [GallOrg 다운로드](http://db.tt/Vr4HXIA "최신버전 내려받기")

