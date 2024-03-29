---
title: "Calling All Logs! Graylog2 2편: 맛보기"
subtitle: 모든 로그를 한 곳에서 관리하고 분석하세요
tags: ["Graylog2", "logging", "monitoring", "cloud-computing"]
categories: ["sysadmin"]
repository: https://github.com/hyeoncheon/goul
image: /attachments/graylog2/graylog-sample.png
banner: /attachments/graylog2/graylog-sample.png
date: 2017-10-12T14:00:00+09:00
---
[Graylog]는 사용자의 모든 로그를 한 곳에 모아서 자동화된 기초분석을 해주며,
이를 시각적으로 표시해주거나 특이사항 발생을 감지했을 때 경보를 주는 기능을
제공한다. 또한 필요에 따라 사용자가 쉽게 세부사항을 찾거나 열람할 수 있도록
검색기능을 제공한다. 이 글에서는 이러한 기능요소에 대해 정리한다.

![](/attachments/graylog2/graylog-logo.png)

이 이야기는 설치, 맛보기, 추가설정, 그리고 자잘한 기록을 담은 네 편의
글로 이루어져 있다. 내용이 독립적이어서 순서에 큰 관계가 없으니 원하는
글부터 읽어도 된다. (마지막편은 읽을 것이 없어요)

* [Calling All Logs! Graylog2 1편: 설치하기]
* _Calling All Logs! Graylog2 2편: 맛보기_
* [Calling All Logs! Graylog2 3편: 추가설정]
* [Calling All Logs! Graylog2 4편: 기록]

> 오픈소스 로그분석 시스템인 [Graylog]에 대한 문서는 [Graylog Docs]에서
> 찾을 수 있으며, [Graylog Github]에서 그 소스를 받아볼 수 있다.


# 확인하기

설치가 끝났다면 웹브라우져로 접속해본다.

![.dropshadow](/attachments/graylog2/graylog-101-login.png)

지난 글에서 여기까지 봤다. 모든 설치와 설정이 끝나고, 웹브라우져를 통해
시스템에 접속해보면 위와 같은 로그인 화면을 볼 수 있다. 이제, 설치 시
지정한 암호를 사용하여 시스템에 접속해보자.

# 기능 요약

[Graylog]는 원하는 데이터를 찾아볼 수 있는 **로그검색**, 미리 설정된
방식으로 로그 현황을 보여주는 **대시보드**, 그리고 특이사항 발생 시
그것을 사용자에게 자동으로 알려주는 **통보기능** 등을 핵심으로 제공한다.
이와 함께, 이러한 기능을 제공하기 위한 바탕으로써 사용자가 원하는 로그를
수집할 수 있도록 **입력구성**, 그것을 자동화된 방식으로 분석/분류/처리하는
"**스트림**"이라는 기능을 제공한다.

Graylog의 특징 중 하나는, 이러한 설정의 거의 전부가 자체적으로 제공하는
웹기반 인터페이스를 통해 제공되며, 그 사용이 간결하고 편리하도록 구성이
되어있다는 점을 들 수 있다.


## 입력구성 - 로그 받기

**시스템의 로그를 Graylog에서 받기 위해서는 받을 구멍을 뚫어줘야 한다.**
Graylog는 Local Input과 Global Input이라는 두 가지 종류의 입력을
제공하는데, 이들은 특정 서버에 설정되는지 모든 클러스터 노드에 함께
설정되는지 정도의 차이가 있다. 먼저, 아래 그림은 Local Input을 구성한
화면이다.

![.dropshadow](/attachments/graylog2/graylog-102-input-syslog.png)

위 그림 왼쪽의 입력 이름 부분(VGA#1이라고 써있는 부분)의 아래를 보면,
`bfe912fd`라는 번호를 갖는 노드에 설정된 것임을 확인할 수 있는데, 같은
설정을 Globl로 하게 되면 아래와 같이 해당 란이 공란으로 표시된다.

![.dropshadow](/attachments/graylog2/graylog-103-input-syslog.png)

둘은 동일한 설정을 갖는데, 그 상세 내용은 위의 Global 구성에서 볼 수
있다. 입력의 유형은 이름 옆에 나와있듯이 Syslog UDP 방식이며, 입력을
받을 포트 등의 설정을 해주게 된다.
실제로 입력이 동작하여 로그가 수집되면 실시간으로 그 유입량을 오른쪽
"Throughput / Metrics" 부분에 표시해줘서 얼마나 바쁘게 움직이는지 바로
확인이 가능하다.

그런데 앞선 글에서 설명한 바와 같이, Graylog는 일반 사용자의 권한으로
동작하도록 되어있다. 그런 이유로, Syslog의 수신 포트를 Syslog의 표준
포트인 `514`가 아닌 `5140`이라는 포트를 쓰도록 설정했는데, 이렇게 되면
로그를 송신하는 서버의 설정을 모두 수정해줘야 할 수 있다. (기존의
구성을 변경하는 경우, 또는 포트 변경이 불가능한 바보같은 Appliance의
경우) 그래서, 각 노드에 다음과 같이, UDP `514`로 들어오는 트래픽을
모두 `5140` 포트로 넘겨주는 구성을 해준다면 이러한 권한 문제 또는
포트 변경 문제를 쉽게 해결할 수 있다.

```text
# Generated by iptables-save v1.6.0 on Wed Jul 13 23:56:42 2016
*nat
:PREROUTING ACCEPT [1:1]
:POSTROUTING ACCEPT [1:1]
-A PREROUTING -p udp -m udp --dport 514 -j REDIRECT --to-ports 5140
COMMIT
# Completed on Wed Jul 13 23:56:42 2016
```

잊기 쉬운 부분 중 하나인데, 만약 Ubuntu 서버에서 `ufw`를 사용하고 있다면,
아래와 같은 내용으로 해당 포트의 방화벽을 열어줘야 한다.

```console
$ cat > |sudo tee /etc/ufw/applications.d/graylog <<EOF
> [Graylog]
> title=Graylog Inputs
> description=Graylog Inputs
> ports=5140/udp
> EOF

[Graylog]
title=Graylog Inputs
description=Graylog Inputs
ports=5140/udp

$ 
```

설정을 해줬다면 반영할 차례. 먼저, Nginx와 OpenSSH의 방화벽이 설정되어
있다고 가정하고, 방금 만든 Graylog의 설정을 적용하는 과정은 다음과 같다.

```console
$ sudo ufw status verbose
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp (OpenSSH)           ALLOW IN    Anywhere                  
80,443/tcp (Nginx Full)    ALLOW IN    Anywhere                  
22/tcp (OpenSSH (v6))      ALLOW IN    Anywhere (v6)             
80,443/tcp (Nginx Full (v6)) ALLOW IN    Anywhere (v6)             

$ sudo ufw allow Graylog
Rule added
Rule added (v6)
$ sudo ufw status
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere                  
Nginx Full                 ALLOW       Anywhere                  
Graylog                    ALLOW       Anywhere                  
OpenSSH (v6)               ALLOW       Anywhere (v6)             
Nginx Full (v6)            ALLOW       Anywhere (v6)             
Graylog (v6)               ALLOW       Anywhere (v6)             

$ sudo ufw disable && sudo ufw enable
$ 
```

Graylog의 프로세스가 설정해준 포트를 잘 듣고 있는지도 한 번 보자.

```console
$ sudo netstat -unlp
Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
udp6       0      0 :::5140                 :::*                                17640/java      
$ 
```

리눅스 서버의 방화벽, 포트 포워딩 등을 다루느라고 조금 길어지긴 했지만,
실제의 입력 설정은 아주 간단하게 웹을 통해 진행하였다.

이상의 입력 설정이 정상적으로 되었고, 그리고 로그를 보내는 쪽의 설정도
정상적으로 되어있다면 이미 뭔가 데이터가 들어오고 있을 것이다!

## 로그검색 - 찾아보기

Graylog의 화면 상단 메뉴를 보면 "Search"라는 메뉴가 맨 앞에 있다. 구성이
완료된 상태라고 하면 가장 중요한 부분 중 하나이기도 하다. 먼저 화면을 보자.

![.dropshadow](/attachments/graylog2/graylog-110-search.png)

그림에서 보는 바와 같이, 화면 상단에는 어떤 내용을 어떤 기간에 대하여
검색할 것인지를 지정할 수 있는 입력/선택란이 자리하고 있으며, 화면 중앙은
시계열 그래프로 검색된 데이터의 배치(언제 얼마나 그러한 로그가 나타나고
있는지)를 확인할 수 있는 Histogram이 표시된다. 다시 그 아래에는, 개별
로그 항목을 테이블 형태로 보여주며, 왼쪽에는 검색결과의 메타정보를 표시하는
화면이 놓여있다. (어디서 많이 보던 구성이라고? :-)

![.dropshadow](/attachments/graylog2/graylog-111-search-preset.png)

어디서 많이 봤듯이, 검색줄의 오른쪽에는 위와 같이 기존 검색을 저장하여
언제든 다시 볼 수 있는 "Saved Searches" 부분이 있어서, 주로 검색하는
검색을 저장해둘 수 있다. 하나 찍어보면, 아래와 같다.

![.dropshadow](/attachments/graylog2/graylog-122-search-preset.png)

검색줄에 나와있는 질의를 보면 `application:sshd AND Failed`라고 써있는데,
로그를 남긴 애플리케이션이 `sshd`이면서 `Failed`라는 문자열을 포함하고
있는 로그만 보여주라는 뜻이다.

앞서, 입력의 구성을 Syslog UDP 형식으로 했기 때문에, 입력문의 해석을
Graylog가 알아서 Syslog 형식에 맞게 Parsing하여 필드를 구분, 보여주게
된다.  그런데 벌써 지나간 화면이지만 위의 검색에 대한 첫번째 그림을 보면,
왼쪽 메타 정보 부분의 Field 인덱스에 `facility` 등의 Syslog 표준 항목
외에도 `fw_dst_ip` 같은, 잘 모르는 필드가 있다는 것을 알 수 있다. 이런
부분은 어디서 온 것일까?



## Extractor

위의 화면이 어디서 많이 본 화면이라고 느낀다면 아마 ElasticSearch와 Kibana,
그리고 Logstash 등에 대한 경험에서 얻어진 느낌일 것인데, Logstash를 구성할
때, 우리는 입력된 데이터를 우리가 원하는 형식에 맞춰, 잘라, 필드로 구분하여
저정하는 방법에 대해 봤을 것이다. (아... 그거 손으로 다 썼었는데...)

Graylog가 제공하는 편리한 기능 중 하나가, 이러한 **Filter를 붙이는 작업을
웹 인터페이스를 통해서 직관적으로 할 수 있다**는 점이다.

### 편리한 Extractor 설정

아까 입력을 구성하는 화면의 오른쪽 옆구리를 보면, "Manage extractors"라는
버튼이 있었다. 이 버튼을 누르면 아래와 같은 화면이 등장한다.

![.dropshadow](/attachments/graylog2/graylog-530-inputs-extractors.png)

화면의 상단을 보면, 이 Extractor들이 어느 입력에 붙어있는 것들인지 확인이
가능하다. "Standard Syslog on UDP 5140"에 대한 것이라고... 그 아래에는
새로운 Extractor를 작성하기 위한 버튼이 보이고, 그 다음이 이미 구성되어
등록되어 있는 Extractor들이다. 오른쪽의 Details 버튼을 누르면 아래와 같이
보다 자세한 정보를 볼 수 있다.

![.dropshadow](/attachments/graylog2/graylog-531-inputs-extractor-regex.png)

오른쪽의, 얼마나 많이 돌았는지에 대한 수량/시간 통계도 나오고, 왼쪽에는
구성상태가 표시된다. 위 그림의 제목은 "Application by Regex"인데, 내용을
보면 Regular Extression으로 뭔가를 잘라내는 모습을 볼 수 있다. Regex라면
보편적으로 많이 사용되는 Parsing 방식이므로 우리가 쉽게, 상세한 분석을 할
수 있겠다.

아래 그림을 보면, Grok 패턴을 이용하여 Parsing을 하는 예인데, 써본 사람은
알겠지만 정말 즐겁다. Grok! 아래의 예는, Linux `iptables` 로그를 잘라서
방화벽 작동 내용을 Parsing하는 룰이다.

![.dropshadow](/attachments/graylog2/graylog-532-inputs-extractor-grok.png)

그런데 Graylog가 편하다는 부분은 바로 아래의 부분이다.

![.dropshadow](/attachments/graylog2/graylog-533-inputs-extractor-test.png)

딱! 느낌이 올텐데, 먼저 이미 수집된 로그를 하나 잡아서 예제로 설정하고,
사용자는 패턴을 중앙의 입력란에 입력해가며, "Try" 해주면 시스템이 기존
로그를 해당 패턴으로 Parsing해주는 것이며, 이 방식을 통하여 **자신의
기존 로그와 Parsing된 결과를 눈으로 확인하면서 쉽게 패턴을 작성**할 수
있다!



## 대시보드

이렇게 로그를 잡아오고 적당히 잘라서 값을 분석해내면, 그것을 이용하여
아래와 같이 시각화할 수 있다. 아래의 예는, 보안 영역에서 실패한 로그의
발생 빈도를 시간축을 기준으로 표시하면서, 그 옆에는 오늘 하루 동안
발생한 SSH 접속 실패 회수를 보여주고 있다. 그리고 그 아래에, 같은 구성을
사용하여 Router의 VRRP 동작 현황을 보여주고 있다.

![.dropshadow](/attachments/graylog2/graylog-242-dashboard-inaction.png)

방화벽 로그에는 접속을 시도한 IP 정보가 같이 담기게 되는데, 어느 IP가
어떤 지역에 할당된 것인지를 알 수 있도록 제공되는 GeoIP Database를 연동하면
아래와 같이 어느 지역에서 침범(또는 접속)을 시도했는지를 시각적으로 볼 수
있다.

![.dropshadow](/attachments/graylog2/graylog-245-dashboard-map.png)

아... 남미, 중국, 그리고 어 중유렵의 프랑스 등지가 아주 기승을 부리는구나.

아무튼, 대시보드는, 앞선 글에서 얘기한 바 있는 로그의 "비 실시간 대화"를
조금 더 간결하게, 그리고 시각적으로 표현해주는 역할을 한다. 그러나 우리는
매일, 매시간, 이 화면을 보고 있을 수는 없지 않은가?



## 통보기능과 스트림

그래서 Graylog가 제공하는 이 기능, Stream에 대해 봐야 한다. 이 스트림을
이용하면, 입력으로 들어오는 로그 중에서 특정 패턴을 만족하는 로그를 별도로
관리할 수 있게 된다.

![.dropshadow](/attachments/graylog2/graylog-200-stream.png)

위의 그림을 보면, "SEC:Remote Access", "SEC:urity Errors" 등의 이름을 붙인
스트림이 만들어져 있는 것을 볼 수 있다. 그 이름 아래에 간략한 설명이 문장의
형태를 갖춰 표시되기 때문에 쉽게 각각의 역할을 알 수 있는데, 맨 위의 것은
"`sshd` 로그가 도착했을 때, 두 개의 설정된 규칙을 모두 만족한다면"이라고
되어있다. 무슨 규칙? "Show stream rules"를 눌러보자.

![.dropshadow](/attachments/graylog2/graylog-202-stream-rules.png)

두 개의 룰이 화면에 추가로 표시되는데, "Failed" 또는 "Accepted" 문자열을
포함하고 있는 경우, 그리고 동시에, 애플리케이션이 `ssh`인 경우가 그 두
규칙이다. (성공한 로그도 나는 관심이 있다!) 더 상세한 내용을 보려면 편집
화면으로 넘어가서 볼 수 있다.

![.dropshadow](/attachments/graylog2/graylog-210-stream-rule-edit.png)

앞서 살펴본 Extractor와 동일하게, 여기서도 이미 존재하는 로그를 가져다
예제로 삼아 규칙을 지정할 수 있게 되어있다.

![.dropshadow](/attachments/graylog2/graylog-211-stream-rule-edit.png)

그런데 이렇게 규칙에 맞는 로그를 찾았으면 어떻게 할까?


### 스트림: 출력

먼저, 어딘가로 보낼 수 있다. 이 기능을 이용하면, (어떤 어떤 출력 설정이
가능했는지는 기억이 잘 나지 않는데,) 아래와 같이 Slack으로 메시지를
실시간으로 전송할 수 있다!

![.dropshadow](/attachments/graylog2/graylog-220-stream-output.png)

Slack Output을 지정한 후, 자신의 채널이나 계정에게 메시지를 보내게 설정할
수 있고, 그 형태나 아이콘 등의 지정도 가능하여 상당히 깔끔하게 맞춤형
메시지를 보낼 수 있다. 그런데 이 출력 설정은, 일종의 "정의"에 해당한다.
어떤 식으로 보낼 것인지가 없이, 어디에 보낼 것인지만 지정한다는 뜻이고,
보내는 방식을 세부적으로 지정하는 것은 별도의 설정으로 진행된다.

### 스트림: 통보기능

스트림과 그 안의 출력이 만들어졌다면, "이 규칙에 일치하는 로그가 도착했을
때"라는 조건 외에 **추가 조건을 붙여 통보 방식을 결정**할 수 있다.  실제로,
경보 시스템을 개발하거나 구성해봤다면, 이 부분이 사용성에 있어서 매우 중요한
부분이라는 것을 알 것이다. 그렇지 않으면 사용자는 SPAM을 받게 된다!

아래 그림을 보자. 먼저, 어떤 조건(condition)일 때 보낼 것인지를 지정할 수
있는 상자가 있고, 그 아래에는 이미 설정된 조건을 표시하고 있다. 그리고
그 아래에는 아까 만들었던 출력(Output)과 복수로 연결할 수 있는 설정을
제공한다. (이런 N:N 구조도 매우 중요한 요소인데, 볼수록 디자인이 잘 된
시스템이라는 생각이 든다. 아쉬운 부분 중 하나는 이 시스템 차원의 Output
외에, 사용자 기반으로 설정되는 것이 없다는 점.)

![.dropshadow](/attachments/graylog2/graylog-231-stream-alert-cond.png)

위의 그림에서, 조건 부분을 자세히 보면, 단위 시간 동안 몇회 이상의 로그가
도착했을 때 등의, 메시지 빈도 등에 의한 설정을 제공하고 있다는 것을 볼 수
있다.

다른 설정을 보면, 아래와 같이 특정 필드에 들어있는 값을 판별하는 방식도
제공한다. 이렇게 데이터를 기반으로 하는 조건을 추가 제공함으로써, 예를
들어, 일단 보안 로그를 모아서, 중요도가 낮은 것은 (가)라는 출력으로 보내고,
중요도가 높은 특정 문자열을 검색하여 이것은 보다 (나)라는 출력으로 보내는
등의 세부 처리를 할 수 있는 것이다.

![.dropshadow](/attachments/graylog2/graylog-232-stream-alert-cond.png)

이 필드를 근거로 지정하는 경보는 위의 그림, 그리고 아래의 그림과 같이 두
가지 종류가 있다. 특정 기간 동안 값의 변화/유지를 고려하는 위의 설정과,
단지 그 값을 보는 아래의 설정이 그것이다.

![.dropshadow](/attachments/graylog2/graylog-233-stream-alert-cond.png)

이제 언제 보낼 것인지 지정이 되었다면, 앞서 말한 바와 같이 Callback을
통해서 출력을 지정할 수도 있고, 단순히 Receiver를 지정하여 메일을 통한
알림을 줄 수도 있다.

![.dropshadow](/attachments/graylog2/graylog-234-stream-alert-callback.png)

그리고 화면의 맨 아래에는, 이 설정을 통하여 이미 발송된 기록을 조회할 수
있다.

![.dropshadow](/attachments/graylog2/graylog-235-stream-alert-alerts.png)


# 느낌

아... 잘 만들었다.

사실, 한 5~6년 쯤 전에 서비스 모니터링 시스템을 만들었던 적이 있다. (나는
모니터링을 시스템 관점이 아닌 서비스 관점으로 해야 한다고 믿는 사람이라서,
시스템 모니터링이 아니고 서비스 모니터링이었다.)  오픈소스 세상에 수많은
모니터링 시스템이 있었는데도 새롭게 내 시스템을 계획했던 이유는, 첫째는
서비스 관점에서 바라봐야 실제로 서비스 안정성과 지속성에 도움이 되는 환경을
만들 수 있다는 생각이었고, 둘째는 Web Hook을 비롯하여 쉽게 커스터마이즈나
타 시스템과 상호연동이 가능한 시스템을 필요로 했기 때문이다.

ElasticSearch를 비롯한, 근래의 비정형 데이터처리 기술과도 연관이 있지만,
이렇게 다양한 입력을 사용자의 용도에 맞게 Parsing하여 관리 또는 분석하고,
그 결과를 다시 어디론가 보내거나 경보 발생을 할 수 있다는 면에서, 나와
설계 방식은 전혀 달랐지만 내 욕구를 크게 만족시키는 시스템이다.

또한, 그 때 고민했던 부분인 빈도를 고려한 경보 발생 등은 매우 매력적인
부분이다.



#### 다음 이야기...

* [Calling All Logs! Graylog2 1편: 설치하기]
* _Calling All Logs! Graylog2 2편: 맛보기_
* [Calling All Logs! Graylog2 3편: 추가설정]
* [Calling All Logs! Graylog2 4편: 기록]


[Calling All Logs! Graylog2 1편: 설치하기]:{{< relref "/blog/sysadmin/2017-10-11-calling-all-logs-graylog2-installation.md" >}}
[Calling All Logs! Graylog2 2편: 맛보기]:{{< relref "/blog/sysadmin/2017-10-12-calling-all-logs-graylog2-overview.md" >}}
[Calling All Logs! Graylog2 3편: 추가설정]:{{< relref "/blog/sysadmin/2017-10-13-calling-all-logs-graylog2-settings.md" >}}
[Calling All Logs! Graylog2 4편: 기록]:{{< relref "/blog/sysadmin/2017-10-13-calling-all-logs-graylog2-memories.md" >}}

[Graylog]:https://www.graylog.org/
[Graylog Docs]:http://docs.graylog.org/
[Graylog Github]:https://github.com/Graylog2
