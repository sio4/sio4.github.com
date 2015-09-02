---
redirect_from: /blog/2015/07/31/citrix-receiver-13.2/
title: Citrix Receiver 13.2 for Chrome/Firefox
tags: Chrome Citrix VDI Firefox
image: /attachments/2015-07-31-icaclient-ff-w.png
date: 2015-07-31 00:20:27+09:00
---
![](/attachments/2015-07-31-citrix-receiver.png){:.inline.pull-left}
"디스크 구멍내기" 사건 이후로 OS를 다시 설치하고 설정하는 중에,
회사 VDI 접속을 위한 Citrix Receiver도 다시 설치했다. 지난번에
비해 많은 변화가 있었는데, Google Chrome App 버전도 있고 리눅스
버전에도 꽤 변화가 있었나보다.  그 내용을 정리한다.

## 세옹지마

"[처참한 디스크 쓰기 성능 시험]({% post_url 2015-07-30-write-test-on-my-laptop %})"을
해버리는 바람에, 요즘, OS부터 시작해서 모든 것을 새로 구성하고
있는 중이다. 마른 하늘에 날벼락 같은 사건.
하지만, 좋게 생각하면 그 덕분에 OS도 Ubuntu 15.04 최신 버전으로
올리고, 기본 ruby도 2.x 버전으로 올라가고,... 그리고 이번엔 VDI
접속을 위한 Citrix Receiver도 새 버전을 쓰게 됐다.

새로 설치파일을 받으러 Citrix에 갔더니, 어? 이건 뭐지? **Google
Chrome Browser용 App 버전**이 있다! 이게 잘만 돌아간다면, 설치
크기도 작고, 복잡하지도 않고, 사용도 편할 것 같다!

![](/attachments/2015-07-31-crcvr-1.6-chrome.png){:.fit.dropshadow}

이 버전은 Google Chrome Web Store에서 직접 받아야 한다고 하여
받아 사용하여 보았다. 일단 편한 점은,

* 먼저, 설치가 너무 단순하다. Chrome App 설치로 끝.
* 별도로 Icon을 Dock에 넣고 쓰기가 나름 편하다.
* 뭔가 산뜻하게 뜨는 느낌이 좋다.

자세히 보지는 못했고, 그 산뜻함에 바로 앞으로 이것을 쓰기로 결정한
후 바로 사용을 시작했다.

그런데 한참 쓰다 보니, 문제가 하나 있다. Local의 Printer가 보이지
않는다. 되는 방법이 있는지, 최소한 명시적으로 되는지 안되는지
확인을 하고 싶으나, 급한 마음에 바로 Native Linux 용 새 버전을
설치하였다.

![](/attachments/2015-07-31-crcvr-13.2-linux.png){:.fit.dropshadow}

1년 전 기억을 돌이켜보면, 그 땐 배포파일 자체로는 잘 동작하지
않았고 인증서 추가 설치를 포함해서 이런 저런 것들을 해줘야 했다.
(필요한 변경을 반영하여 Custom Deb를 만들어주는 Script를 배포한
사람이 있어서 그걸 썼었다.)

## 설치 후 설정 (Receiver, Firefox)

어? 그런데... 동작하지 않는다. ㅠ.ㅠ 그리고 아무 반응조차 없다.

혹시나 일단, Handler 설정 확인 먼저. 기본값은 아래와 같았다.

![](/attachments/2015-07-31-icaclient-ff-n.png){:.fit.dropshadow}

기본값은 "Citrix Receiver for Linux 사용 (Firefox)"라고 되어있었고,
아래처럼 다른 옵션도 있었다.

![](/attachments/2015-07-31-icaclient-ff-w.png){:.fit.dropshadow}

어디에 문제가 있는지 찬찬히 추적을 해봐야겠지만, 그보다 먼저 옵션이
있다면 바꿔보고 싶었다. "Citrix Receiver Engine 사용 (기본값)"은
왜 기본값이라고 되어있으나 선택되어 있지 않을까? 아무튼, 이 옵션을
사용해봤더니, 정상적으로 동작한다! Printer도 잘 보이고, 아무 문제가
없다!

정리하면, 현재 설치된 버전은 `Citrix Receiver for Linux 13.2.0.322243`
버전이고, AMD64 버전이며 잘 동작하고 있다.

### ICAClient 설정

참고로, 다음과 같이 `HOME` 아래 위치한 설정을 변경하여, 다음과 같은
설정을 하였다.

* S: 로 /home/share를 연결, 읽기 전용으로 설정
* 화면 크기를 명시적으로 설정하고, UseFullScreen 값을 False로 함으로써,
  전체화면 모드로 실행되는 불편함을 줄였다.

{% highlight diff %}
--- a/.ICAClient/All_Regions.ini
+++ b/.ICAClient/All_Regions.ini
@@ -750,10 +750,10 @@ DrivePathR=
 DriveEnabledR=
 DriveReadAccessR=
 DriveWriteAccessR=
-DrivePathS=
-DriveEnabledS=
-DriveReadAccessS=
-DriveWriteAccessS=
+DrivePathS=/home/share
+DriveEnabledS=True
+DriveReadAccessS=0
+DriveWriteAccessS=1
 DrivePathT=
 DriveEnabledT=
 DriveReadAccessT=
@@ -927,10 +927,10 @@ EnableAtomicDisplay=*
 UserVisualID=
 DesiredColor=*
 ApproximateColors=*
-DesiredHRES=*
-DesiredVRES=*
+DesiredHRES=1300
+DesiredVRES=760
 ScreenPercent=*
-UseFullScreen=*
+UseFullScreen=False
 TWIFullScreenMode=*
 NoWindowManager=*
 ResizeSession=
{% endhighlight %}


