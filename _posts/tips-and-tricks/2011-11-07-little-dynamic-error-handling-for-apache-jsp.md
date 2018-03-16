---
redirect_from: /entry/dynamic-error-handling-with-apache-and-jsp/
redirect_from: /253/
title: Apache+JSP 환경에서 쫌 동적인 ErrorDocument
tags: error-handling monitoring development service
categories: ["tips-and-tricks"]
date: 2011-11-07T02:41:38+09:00
last_modified_at: 2011-11-07T02:45:42+09:00
---
이번 글은 좀 색다른 주제다. Apache+JSP 환경에서 동적인 ErrorDocument
작성하기. 웹 관련 개발은 놓은 지가 오래인 데다가... JSP라고는 눈꼽만큼도
해본 적이 없으면서, 그리고 근래에는 Cloud Computing, Android 얘기만
하다가 참 어색하기까지 하네...

요즘 보안관도 아니면서 보안과 관련된 업무를 조금 보다보니, 웹에
불접적으로 접근하는 녀석을 어떻게 잡아낼지가 관심사 중 하나다. 그래서
웹 담당자에게 부탁하기를,

> "웹사이트에 누군가 공격을 하려다보면 찔러보는 초기에 404 에러가
> 발생할거다. 그거 잡아서 로그로 남겨주든지, 실시간으로 mail이나
> SMS를 발송해줘라..."

했더니만, 못한다고... 간단히 답을 해버려서 조금 실망. 그래서, 직접
해보기로 했다. (오지랍이긴 하네...)

그래서, 정적인 ErrorDocument를 동적으로 처리하면서, 오류 상황에 대한
리포트를 남기도록 뭔가 해봤다. Android Programming을 시작하면서 Java와
친하지 않았던 것을 쪼금 후회하는 터인데... 어쨌든 서버 환경은 JBoss를
쓰고 있다.

```java
// ...
out.println("request.getRequestURL() : " + request.getRequestURL() + "<br/>");
out.println("request.getRemoteAddr() : " + request.getRemoteAddr() + "<br/>");
// ...
```

요렇게 해봤는데, 허걱! 이게 어인 일? 분명 request.getRequestURL()을
호출하면 오류가 발생한 그 URL을 돌려줄 것이라고 생각했는데 이게
ErrorDocument로 지정된 Handler의 URL만 냅다 돌려주는 황당한 상황 발생.

> "그럼 어떤 URL로 공격이 들어왔는지 알 수가 없잖아..."

휴~ 정말 많이 뒤졌다. 계속되는 야근에 피곤해 죽겠는데... 이 지랄같은
성격때문에 그냥 포기할 수가 없다.

결론은 이렇다.

### Apache 설정

단순하다. 익히 들어 알고 있는 다음의 설정이면 충분하다.

```conf
ErrorDocument 404 /error_handler.jsp
```

요렇게 설정해주면, Apache는 404 오류가 발생했을 때, 지정한 URL로
Redirection을 발생시킨다. 그리고 Redirection 관련 정보를 환경변수로
넘겨주는데, 그 변수 이름은 `REDIRECT_URL` 등과 같다. 이거 말고도 몇개가
더 있는데, 내겐 이거면 충분할 듯.  (자세한 것은 여기에...
<http://httpd.apache.org/docs/2.2/custom-error.html>)

### `mod_jk` 설정

이 부분을 몰라서 충분할 만큼 헤맸는데, 요 부분을 모르던 상황에서는
Apache에서 아무리 환경변수를 설정해줘도, 아무리 다양한 방식으로 JSP
내에서 그것을 읽으려고 노력해도 읽을 수 없었다. 결국, 검색 키워드를
조정하고, 또 고쳐보다 보니... 이 글을 찾았다.  
(이거. <http://forums.devshed.com/showpost.php?p=225739&postcount=8>)

`mod_jk.conf` 등과 같은 파일에서...

```conf
JkEnvVar REDIRECT_URL ""
JkEnvVar REDIRECT_REMOTE_HOST ""
JkEnvVar REDIRECT_PATH ""
```

요렇게, `mod_jk` 설정에서... `JkEnvVar` 라는 것을 설정해줘야...
환경변수가 넘어간다고 한다. 하긴... 지금 생각해보니 이게 정말
환경변수라면... httpd에서 설정한 것을 java VM에서 그냥 읽어질리는
없지...

ㅋㅋ 이제야 이해한다는 듯이 말하고는 있지만... 정말 몇 시간동안 짜증이...

### Error Hander 작성

이제, JSP 코드 내에서, 다음과 같은 방식으로 내게 필요한 환경변수를
읽어올 수 있다.

```java
String redir_url = request.getAttribute("REDIRECT_URL");
```

이걸 몰라서... 헤매도 너무 헤맸네!

조금 더 시험해서, 명확하게 공격의 흔적을 잡아내게 되면 iptables 명령을
이용하여 Host-IDS를 구성해볼까 한다.

침입자들 이제 딱걸렸어!

