---
title: "PaperTrail, Cloud에서는 Cloud 로그를!"
tags: monitoring 클라우드컴퓨팅
image: /attachments/papertrail/ptrail-101-concept.jpg
banner: /attachments/papertrail/ptrail-101-concept.jpg
date: 2016-09-07 00:51:00 +0900
---
존재하지 않는 서버의 로그를 보려면 어떻게 해야 할까? 간단하다. 로그를
서버가 아닌 다른 곳에 저장해서 보면 된다. 더이상 서버가 존재하지 않는
클라우드컴퓨팅 환경에서 로그를 기록하고, 그 이상의 일을 하기 위해서,
다시 또다른 클라우드 서비스를 활용할 수 있는데, 그 중 하나가
Papertrail이다.

순전히 내 기준이지만,
클라우드컴퓨팅 시대의 가장 중요한 변화는, 이제 "**서버라는 것이 더 이상
존재하지 않는다**"는 것이다. "가상화"나 "내가 소유하지 않음"을 얘기하는
것이 아니다. 이제, 서버의 자리에는 (나타났다 사라지는) 가상 인스턴스,
또는 컨테이너 인스턴스가 놓여있다. 이 말장난 같은 **이 작은 차이가, 바로
클라우드컴퓨팅이 우리에게 주는 모든 혜택을 만들어낸다**고 나는 생각한다.

이렇게, 어떤 한 서버의 생명주기 자체가 우리에게 아무런 의미가 없어졌기
때문에, 그것이 생겼다 없어졌다를 반복해도 우리가 더 이상 놀라지 않기
때문에, 우리는 서버를 수평으로 늘렸다 줄였다를 반복하면서 흔히 말하는
Elastic Computing(특정 사업자를 지칭하려는 것은 아니다.) 환경을 갖게
되었고, 사용한 만큼 비용을 지불하는 구조가 만들어지게 된 것이다. 만약
아직도 그 우리의 업무가 특정 서버에 묶여 있다면, 이것은 불가능한 일이다.

같은 맥락이 Computing 그 자체 뿐만 아니라 그 주변의 모든 부수 영역에
적용되는데, 이 글의 주제는 숨어서 빛을 받지 못하지만 엔지니어에게는
매우 중요한 요소인 로그의 관리이다. "**존재하지도 않는 서버의 로그를
받아 둘, 무언가가 필요하다!**"


# 로그 중앙화

꼭 클라우드컴퓨팅 환경이 아니라 하더라도, 로그를 중앙에 모아서 한 번에
관리하는 일은 IT 관리환경에서 매우 중요한 일이다. 몇 가지 예를 보면,

* 하나의 업무를 이루는 시스템 그룹의 로그를 한 눈에 살핌으로써, 문제가
  생겼을 때 보다 손쉽게 문제의 발화지점과 영향지점을 구별하고싶다.
* 서버에 직접 접근하지 않고도 언제든지 로그를 봐야 한다.
* 서버 장애 상황에서도 로그를 봐야하며, 안전하게 일정 기간 보관하고 싶다.
* 단순히, 자원이 너무 많다. 한 곳에서 보고싶다!

관리자마다 이유가 다를 수는 있지만 대충 위의 내용 만으로도 로그 중앙화의
필요성은 충분한 것 같다.

과거에는, Syslog 등의 원격 로그 기능을 이용하여 로그 중앙화를 했었고,
그것 만으로도 충분히 효과적이라고 느꼈다. 그러나 소나타 타다보면 그랜져
타고 싶은 것이 사람의 본성인데, 시대의 발전에 맞는 뭔가 깔끔한 것이
없을까?



# Papertrail

심사숙고한 것은 아니지만, 지난 번 글의 주제였던 클라우드스러운 앱,
[CAOS 웹앨범]({% post_url 2016-04-28-cloud-album-on-object-storage %})을
만드는 과정에서, 로그 역시 Cloud 스럽게 저장해보고자 급하게 선택했던
서비스가 바로 Papertrail이다.

이 글은, Papertrail을 소개하는 글이라기 보다는, 오히려 이 서비스를
사용하는 방식을 통해 클라우드컴퓨팅 시대의 로그관리에 대해 고민하고,
또한 대표적인 서비스 중 하나를 Benchmarking하는 것에 초점을 두고 있다.



## 서비스 등록

홈페이지 <https://papertrailapp.com>에 접속하면, 아래와 같은 화면을
만나게 된다.

![](/attachments/papertrail/ptrail-100-home.png){:.fit.centered.bordered}

이 회사는 아래 그림과 같은 컨셉을 바탕으로 서비스를 제공하고 있다.
즉, OS나 Application 등의 모든 로그를 한 곳으로 모으고, 그것을
다시 필요한 조건에 따라 검색하거나, 조건에 따른 알림을 주거나,
Web Hook을 통하여 다른 서비스와 연계시키는 것이다. 마지막으로, 나중에
활용할 수 있도록 외부에 보관하는 연결도 제공한다.

![](/attachments/papertrail/ptrail-101-concept.jpg){:.fit.centered.bordered}

이 서비스는, 아래와 같은 Plan을 갖는데, 나처럼 취미로 서비스를 제공하는
경우를 위해(뭐, 맛들이라는 얘기긴 한데), 7일의 단기 보관과 48시간 내의
자료만 검색이 가능하고 한 달에 100MB 이내의 Traffic만 처리할 수 있는
무료 Plan이 제공된다.

![](/attachments/papertrail/ptrail-001-price.png){:.fit.centered.bordered}



## 사용하기

서비스에 가입하고, 설정을 해주면 아래와 같은 Dashboard를 사용할 수 있다.
등록한 시스템의 목록과 각각에 대한 저장된 검색조건이 표시된다.

![](/attachments/papertrail/ptrail-110-dash.png){:.fit.centered.bordered}

특정 그룹이나 서버를 선택하게 되면, 아래와 같은 좀 더 세부적인 사항을
볼 수 있으며 얼마나 많은 로그가 기록되고 있는지도 확인할 수 있다.

![](/attachments/papertrail/ptrail-112-caos.png){:.fit.centered.bordered}

실제 로그를 확인하면, 아래와 같이 친숙한, 그리고 시스템 Console로 보는
것 보다는 나름 깔끔한 로그를 확인할 수 있다.

![](/attachments/papertrail/ptrail-210-events.png){:.fit.centered.bordered}

또한 특정 문자열 등으로 검색한 결과를 보여줌으로써 문제를 쉽게 찾을 수
있으며,

![](/attachments/papertrail/ptrail-210-filtered.png){:.fit.centered.bordered}

병합된 로그가 아닌 단일 시스템의 로그를 뽑아서 볼 수도 있다.

![](/attachments/papertrail/ptrail-220-selected.png){:.fit.centered.bordered}



## 알림 만들기

로그관리는, 내가 보고싶을 때 보는 것도 중요하지만, 그 속에서 위험요소를
자동으로 찾아내고 일부러 보지 않더라도 그것을 내게 알려줄 수 있어야 그
의미가 커진다.

Papertrail은 실시간으로 로그를 추적하면서, 미리 정의할 수 있는 다양한
방식으로 관리자에게 알람을 주는 기능을 제공한다. 아래 도식으로 표현한
것과 같이, Email이나 Chat으로 알림을 주기도 하고, PagerDuty같은 별도의
서비스를 연계하여 문제가 발생했음을 전달하기도 한다.

![](/attachments/papertrail/ptrail-300-alert.png){:.fit.centered.bordered}

알림을 등록하는 과정은 아래와 같다. 이름과 대상 그룹을 정하고, 검색할
질의를 등록하면 기본 설정이 끝난다. 알림을 작성했다면 어떻게 관리자에게
전달할지도 등록해주게 된다.

![](/attachments/papertrail/ptrail-310-alert-new.png){:.fit.centered.bordered}

작성된 알림을 수정할 수도 있고, 상세 설명을 볼 수도 있다. 아래 그림은,
`GET /albums/4 HTTP`라는 문자열이 검색된다면 Slack을 통해서 메시지를
날리도록 설정한 것이다.

![](/attachments/papertrail/ptrail-321-alert-edit.png){:.fit.centered.bordered}



## 설정

서비스 전반에 대한 설정을 아래와 같이 제공한다. 이 부분은 따로 설명이
필요할 것 같지는 않고, 스샷만 기록해둔다.

![](/attachments/papertrail/ptrail-401-settings.png){:.fit.centered.bordered}

계정 프로필

![](/attachments/papertrail/ptrail-402-profile.png){:.fit.centered.bordered}

사용자 목록

![](/attachments/papertrail/ptrail-403-members.png){:.fit.centered.bordered}

저장 설정

![](/attachments/papertrail/ptrail-404-archives.png){:.fit.centered.bordered}

로그 전송 설정

![](/attachments/papertrail/ptrail-405-destinations.png){:.fit.centered.bordered}

빌링 정보

![](/attachments/papertrail/ptrail-406-payments.png){:.fit.centered.bordered}

청소하기 설정

![](/attachments/papertrail/ptrail-407-purge.png){:.fit.centered.bordered}

선전해주세요 :-)

![](/attachments/papertrail/ptrail-408-refer.png){:.fit.centered.bordered}

---


이 글에서는 여기까지, Papertrail 서비스에 대한 Review를 하는 것으로 하고,
다음 글에서는 CAOS에 어떻게 Papertrail을 연결했는지을 살펴보려고 한다.


