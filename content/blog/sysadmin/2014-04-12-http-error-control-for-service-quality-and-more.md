---
title: 서비스 품질을 위한 HTTP Error 처리
subtitle: Error 처리를 자동화하여 품질 이상을 얻을 수 있다면...
tags: [HTTP, error handling, monitoring, automation, Honcheonui, Oopsware, SOSM, system operation]
categories: ["system administration"]
banner: /attachments/http-error-control/web-error-catch.png
date: 2014-04-12T14:54:00+09:00
---

사람들이 "인터넷" 하면 "웹"을 생각하게 되는데에는 그만한 이유가 있을 것이다.
웹 이전에도 다양한 형태의 인터넷 서비스들이 존재했지만, 웹의 등장 이후 그
모든 것이 변해버렸다. Gopher는 웹 검색엔진에 의해 완전히(?) 자취를 감추었고,
파일 전송/교환을 위한 FTP도 부수적인 위치에 자리 잡고 있을 뿐이며, NNTP 방식의
유즈넷 뉴스그룹도 웹기반 게시판 등에 밀려 버렸다. (물론, Offline까지 보면,
빛나는 "프로그램세계"가 폐간되는 아픔도 있었다.)

오늘날, 대부분의 기업용 시스템들도 웹 기반으로 만들어지고 있는데, 웹이 이렇게
성공할 수 있었던 것은 말 그대로 거미줄처럼 엮여있는
**상호 연계 구조와 유연성**이 가장 큰 이유라고 생각한다.
<!--more-->

> 이 글은 블로그를 새롭게 정비하는 과정에서, 오래전에 공개적으로 운영했던
> 개인 Wiki에 작성했던 글을 이전해온 것입니다.
>
> 중간 중간에 oops, honcheonui(혼천의), sosm 등의 이야기가 나오는데 추억이
> 새록새록 하네요. 모두, 예전 회사에서 운영수준을 높이기 위해 야심차게
> 만들었던 내부용 도구들인데 큰 빛을 보지 못해서 아쉽기도 하고... ㅎㅎ 
{.boxed}


## 장애 감지에도 연계구조와 유연성을 이용하자!

잡설이 길었는데, 이러한 연계 구조를 꼭 "서비스" 그 자체에만 써야 하나? 그렇지
않다. 이미 수 많은 범용 서비스들은,

* 사용자들에게 지저분한 장애 페이지를 보여줘서 혐오감을 주는 것을 피하기 위해
* 악의가 있는 사람들이 서버 내부 사정을 보는 것을 막기 위해

뿐만 아니라,

* 운영자/개발자가 시스템의 문제를 빠르고 정확하게 인지하기 위해

장애 페이지를 활용하고 있다. 여기서 장애 페이지란, 서비스 불능 상태, 예를 들어
요청한 파일이 없는 경우, 서버 내부에서 오류가 발생한 경우 등의 상황에서
너저분한 에러 상세를 보여주는 기본적인 에러 화면, 또는 그 대신 깔끔한 메시지를
보여주는 "손이 간" 화면을 말한다. (유명한 장애 페이지인 Twitter의
"고래 페이지(Fail Whale)"처럼)

## 우리가 원하는 결과는?

간단하다. 하나로 간소화된 인터페이스 내에서 오류 상황을 모아서 보고 싶다.
실제로 간단히 구현해본 결과는 아래와 같은 화면이다.

![우리가 원하는 결과](/attachments/http-error-control/web-error-catch.png "우리가 원하는 결과")

보는 바와 같이, 각각의 오류에 대하여 한 줄에 필요한 정보를 보여주고 있다.

* Status: 오류의 종류는? 404 파일 없음, 500 서버 내부 오류 등
* Service/Path/Query: 오류의 위치에 대한 일반적 내용. 서비스명/경로/인수
* Referer: 접속 기원지. 공격으로 의심할 수 있는 Referer 없는 접근인지 여부
* Remote: 사용자 주소 및 환경은 어떤 것인지(IP/User-Agent)
* Server: 그리고 실제 서비스를 진행한 서버는 누구인지(부하 분산을 고려하여)

물론, 이렇게 감지된 오류는 다시 연관된 "일련의 장애(Event)"로 묶여 관리될 수
있어야 하고, 또한 적절한 Owner 지정과 Alert 발송을 위한 Hook 설정 기능이
있어야 좀 제대로 역할을 할 것이다. 실시간이든, 주기적이든.

아무튼, 이렇게 중앙에서 오류를 모아서 관리하려고 하면 어떤 설정이 필요할까?
한 방에 되면 좋겠지만, 오류가 발생하는 단계가 다양하므로 각 단계에 맞는 설정이
들어가야 한다. 그렇다고 그렇게 복잡하지도 않다.


## 오류가 감지되고 사용자에게 전달되는 과정

Web Application Server가 있는 환경에서 이와 관련된 오류를 서버가 감지하고 그
정보를 사용자에게 전달하는 과정을 간단히 보면,

1. HTTP 서버는 WAS와 연결이 되지 않을 때 "503 서비스 불가"를 전달.
1. 일단 WAS 접속이 성공하면, 그 이후의 오류 처리는 WAS의 몫이 됨.
1. WAS에서 적절한 Servlet 등을 찾아 서비스할 수 없을 때,
   1. 수행할 Servlet이나 보여줄 파일이 없다면 "404 그런 거 없음" 전달.
      (사용자 오류)
   1. Servlet이 기동하였으나 적절한 Action을 취할 수 없다면 "501" 등을 전달
      (지원하지 않음)
   1. 말 그대로 내부 오류가 있을 때, 500 등의 오류를 사용자에게 전달.
      (기능 오류)

(물론, 상황에 따라 다양한 오류가 존재할 수 있고, 일부 예를 든 것이다.)

이 내용은 아래 그림과 같이 대충 요약할 수 있다.

![Web Error Flow](/attachments/http-error-control/web-error-flow.png)
{.bg-light}

이렇게, 어느 단계인지, 어떤 상태인지 등에 따라 오류를 처리하는 주체와 내용은
달라지지만, 크게 보면 "HTTP 서버와 Application 서버 양쪽에서 처리하면 된다."
라고 요약할 수 있다.

## 기법 - 대표적 HTTP 서버, Apache에서는?

인터넷 초창기부터 지금까지 단 한 번도 웹서버
[시장점유율 1위](https://www.netcraft.com/blog/april-2014-web-server-survey)
를 내주지 않은 Apache는 어떻게 오류를 관리할까? 이 글을 읽고 있는 사람이라면
이미 잘 알고 있는 것이라고 생각되는데, ErrorDocument 라는 지시자를 이용하여
내부의 정적 페이지나 동적 CGI, 또는 외부 URL을 지정할 수 있다.

이 글에서는 중앙에서 오류를 관리하고자 하므로 외부 URL을 이용하면 좋겠는데,
문제는, 이렇게 하면 서버 내부의 다양한 정보를 전달해주기 어렵게 된다. 그러면,
동적 페이지를 이용하면 좋겠지만, Application 서버 오류 시에는 그것의 이용이
불가하여 낭패. 이럴 땐 가장 기초적인 CGI를 활용하는 편이 좋다.

```bash
#!/bin/sh
# er.sh, custom error handler for apache, part of honcheonui/oopsware.

### config:
redirect_base="http://oops.example.com/er"

### code:
c_date=`LANG= date +"%a, %d %b %Y %T %Z" -d '30 min'`

q=`perl -MURI::Escape -e 'print uri_escape($ARGV[0]);' "$REDIRECT_QUERY_STRING"`
ua=`perl -MURI::Escape -e 'print uri_escape($ARGV[0]);' "$HTTP_USER_AGENT"`

extra="oops_status=$REDIRECT_STATUS&oops_uri=$REDIRECT_URL&oops_query_string=$q"
extra="$extra&oops_server_name=$SERVER_NAME&oops_server_addr=$SERVER_ADDR"
extra="$extra&oops_remote_addr=$REMOTE_ADDR&oops_user_agent=$ua"
extra="$extra&oops_referer=$HTTP_REFERER"

### response:
echo "Status: 302"
echo "Location: $redirect_base?$extra"
echo ""

exit 0
```

기본 HTTP 환경변수 외에 장애 처리를 위한 Apache 확장 변수가 활용되었고,
중간에 URL Escape 때문에 좀 길어지기는 했지만,  알고 보면 매우 단순한
Shell Script이다. 간단하지만 오류 사냥에는 한 몫 한다.


## 기법 - Java Application Server 에서는?

Java 기반의 Application 서버들 역시, 오류 처리를 위한 이런 저런 기능을
제공하는데, 위의 스크립트와 비슷한 역할을 해주는 JSP를 간단히 짜보면 아래와
같다.

```go
<%@ page pageEncoding="utf-8"
	isErrorPage="true"
	import="java.io.*, java.util.*"
	import="java.net.URLEncoder"
	import="java.net.InetAddress"
%><%@ page contentType="text/html;charset=utf-8"
%><%!
public String urlencode(String str) {
	if (str != null) {
		return URLEncoder.encode(str);
	} else {
		return "";
	}
}
%><%
response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
response.setHeader("Pragma", "no-cache");
response.setDateHeader("Expires", 0);

String query = "";
String server_addr = InetAddress.getLocalHost().getHostAddress();

query += "oops_status=";
query += request.getAttribute("javax.servlet.error.status_code").toString();
query += "&oops_uri=";
query += request.getAttribute("javax.servlet.forward.request_uri").toString();
query += "&oops_query_string=" + urlencode(request.getQueryString());
query += "&oops_server_name=" + request.getServerName();
query += "&oops_server_addr=" + server_addr;
query += "&oops_remote_addr=" + request.getRemoteAddr();
query += "&oops_user_agent=" + urlencode(request.getHeader("user-agent"));
query += "&oops_referer=" + urlencode(request.getHeader("referer"));

log("error occur. redirect to oops! " + query);
response.sendRedirect("http://oops.example.com/er?" + query);
%>
```

역시 URL Encode, null 값 처리 등으로 조금 길어졌지만 내용은 단순하다. 우리가
알고자 하는 서버 내부의 오류 정보를 수집하여, 외부의 중앙 집중식 오류 수집
서버로 Redirect 처리하는, 위의 Apache용 스크립트와 동일한 내용이다.

## 받아주는 녀석의 구현

이렇게 Apache에서 `er.sh` 이라는 CGI로, Java Application 서버에서 `er.jsp`
라는 페이지로 생성한 오류 정보는 중앙의 oops.example.com 아래의 `/er`로
모이게 되는데, 이것을 집계하는 부분은 딱히 예를 들어 설명하기 애매한 점이
있는 것 같다.

이번 글을 쓰는 과정에서는
[Ruby on Rails](http://rubyonrails.org/)로
간단하게 개발해 봤는데, Error, Event, Status Code, Service, Server, Path 등의
모델을 중심으로 간단히 연관 관계를 정의하고 Error Register를 위한 `/er` 로의
route를 설정하는 정도로 간단히 기본 개발은 완료되었다. 그 결과의 화면이 위의
"우리가 원하는 결과" 화면이다.

이것을 틀로 하여, 필요에 따라 Event 관리를 강화하고, Owner, Hook 등의 모델을
추가하면 나름 유용한 장애 감지 도구가 될 수 있을 것 같다.

참고로, 현재의 ERD는 아래 그림과 같다.

![](/attachments/http-error-control/web-error-erd.png)


## 자, 그럼 뭘 더 할 수 있는가?

### 장애 관리

연관된 개별 오류를 묶어 장애(Event)로 관리할 수 있다. 장애의 시/종을 명확히
파악할 수 있고, 경우에 따라서는 장애의 유형을 공부할 수 있다. 그러나 이러한
활용은 기본적으로는 사람의 손이 들어가야 하고, 자동화하지 않는 이상 귀찮은
일일 뿐일 수도 있다. 단, 과거와 현재, 미래를 잇는 역할을 할 수도 있다는
기대가 있어서 의미는 있다.

### 장애 감지

장애 감지를 빠르게 할 수 있고, 장애 정보를 정확히 파악할 수 있다. 사용자의
신고가 있기 이전에 장애 발생을 감지하고 적절한 경고 발생을 할 수 있으며,
사용자에게 물어보지 않아도 어떤 상황이었는지 보다 쉽게 확인할 수 있다.

돈이 좀 들겠지만 SMS를 발송할 수도 있고, 운영자의 Twitter 계정에 Direct
Message를 쏴줄 수도 있다. (이 방식은 해봤는데 그럭저럭 쓸만하다. 개개인의
Data Plan... 걱정이 필요하지만...) 물론, 제 3의 웹서비스를 이용할 수도 있고...

### 공격 감지

공격에는 패턴이 있다. URL이 유별나거나 접속 방식이나 속도 등이 유별나거나.
그런 것들을 잡을 수 있는데, WAF를 못믿어서 꺼뒀다면, 최소한 현상 감지라도
해야 하지 않을까...

### SOSM과 연계

SOSM은 나의 용어다. Service Oriented System Monitoring. 시스템을 원초적
본능으로 CPU, Memory, Disk, Network,... 이렇게 감시하지 말고, 서비스를
중심으로 감시하고자 하는 생각인데, 이것을 연계하여 장애 발생 시 Hook으로든,
평상시 Ping으로든, 서비스 건강 검진을 함께 해주면 장애 예방과 발견에 아주
효율적일 듯.

믿거나... 말거나... :-)
