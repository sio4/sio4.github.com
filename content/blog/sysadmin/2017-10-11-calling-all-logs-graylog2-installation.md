---
title: "Calling All Logs! Graylog2 1편: 설치하기"
subtitle: 모든 로그를 한 곳에서 관리하고 분석하세요
tags: ["Graylog2", "logging", "monitoring", "cloud-computing", "setup"]
categories: ["sysadmin"]
repository: https://github.com/hyeoncheon/goul
image: /attachments/graylog2/graylog-home.png
banner: /attachments/graylog2/graylog-home.png
date: 2017-10-11T22:00:00+09:00
---
클라우드 컴퓨팅 환경에서 휘발성 인스턴스의 로그를 중앙화하여 (반)영구
보관하고, 다양한 소스로부터 발생하는 관련된 로그를 모아서 연관 분석을
진행할 수 있는 플랫폼을 찾던 중 발견한 공개 소프트웨어 중 하나가 오늘
소개하려 하는 [Graylog]이다. 이 글에서는, Graylog를 간단히 소개하고,
그 설치 방법을 정리한다.
<!--more-->

![](/attachments/graylog2/graylog-logo.png)

이 이야기는 설치, 맛보기, 추가설정, 그리고 자잘한 기록을 담은 네 편의
글로 이루어져 있다. 내용이 독립적이어서 순서에 큰 관계가 없으니 원하는
글부터 읽어도 된다. (마지막편은 읽을 것이 없어요)

* _Calling All Logs! Graylog2 1편: 설치하기_
* [Calling All Logs! Graylog2 2편: 맛보기]
* [Calling All Logs! Graylog2 3편: 추가설정]
* [Calling All Logs! Graylog2 4편: 기록]
{.angle}

> 오픈소스 로그분석 시스템인 [Graylog]에 대한 문서는 [Graylog Docs]에서
> 찾을 수 있으며, [Graylog Github]에서 그 소스를 받아볼 수 있다.
{.boxed}



# 로그 중앙화

컴퓨터 소프트웨어 또는 프로그래머와 사용자 간의 **가장 원초적인 대화
방식이 바로 로그**이다.  프로그램은, 자신이 하고싶은 말이 있을 때 그
상황(INFO)이나 어려움(WARN), 문제(ERROR) 등을 로그라는 방식을 통해
사용자에게 전달한다.  우리가 겪는 여러 문제들을 풀어나갈 때, 각각의
입장을 얘기하고 듣는 과정에서 문제에 대하여 이해하게 되고 풀어나갈 수
있듯이, 소프트웨어를 사용하는 과정에서 발생하는 크고 작은 문제들 역시,
로그를 통한 소프트웨어와 사용자 간의 대화를 통하여 문제를 파악하고
해결의 실마리를 찾을 수 있게 된다.

특히, 단일 소프트웨어가 아닌 여러 소프트웨어의 집합이 하나의 서비스
또는 서비스 군을 이루게 될 경우에는 각각의 로그 뿐만 아니라 **전체
로그들 간의 상관 분석을 통한 인과관계 분석**이 필수적으로 필요하다.
이러한 비교 분석을 통하여, 어떤 로그가 "문제의 원인"를 이야기하고
있으며, 어떤 것이 그 문제로 인하여 "부수적으로 발생하는 현상"을 말하고
있는지 확인할 수 있어야 한다.

우리가 데스크톱에서 사용하는 대화형 소프트웨어의 경우에는 표준 입출력
또는 GUI의 메시지/팝업 등을 통하여 실시간으로 사용자와 대화하는 것이
가능하지만, 내가 주로 다루는, 서버측 소프트웨어의 경우는 사용자가 항상
소프트웨어의 출력을 지켜보고 있는 것은 현실적으로 불가능하기 때문에,
바로 이 "로그"라는 방식으로 "**비 실시간 대화**"를 하게 된다.
또한, 앞서 말한 Info, Warning, Error 등 그 수준과 내용이 다른 여러
로그들 중에는, "알면 좋은 것" 또는 "확인이 필요한 것" 정도의 성격인
로그와 서비스의 안정적, 정상적 제공을 위해 바로 확인하여 처리해야 하는
심각한 로그가 섞여 있는데, 이 경우에는 그러한 **위급한 상황의 발생을
사용자에게 즉각적으로 알려야 하는 경우**도 발생한다.

다른 많은 이유를 생략하더라도, 위의 두 가지 문제를 해결하기 위해 우리는
로그를 중앙에서 통합 관리하고, 단순히 수집하는 것에 그치지 않고 사용자를
대신하여 그 내용을 실시간으로 분석하여, 필요한 경우 사용자가 늦지 않게
서비스 안정화에 개입할 수 있도록 알려주는 기능을 갖는 시스템을 필요로
하게 된다.

심지어, 근래의 클라우드 컴퓨팅 환경에서는 "서버"라는 것의 의미가 점차
바뀌고 있다. 컴퓨팅에 인스턴스 개념을 도입하여 필요한 시점에 서버를
자동판매기에서 뽑아 사용하고 버리는가 하면, 아예 명시적인 서버를 두지
않고 서비스에서 필요로 하는 기능만 배치하는 **Serverless의 시대**가
열렸다.
이러한 컴퓨팅 환경의 변화는 중앙집중식 로그관리에 대한 필요성을 보다
절실하게 만들었으며, 많은 사용자들이 그들의 관리적 필요성, 업무적 특성,
그리고 법적 요건 등에 따라 "로그 관리 서비스"를 사용하거나 자체적으로
"로그관리 시스템을 구축" 하는 등의 다양한 방식으로 이에 대한 해법을
찾고 있다.

이 글에서 소개하는 [Graylog]는, 그 중 **구축형 로그 관리 환경을 위한
공개 소프트웨어**이다.


왜 로그를 중앙화해야 하는가?
: 모든 서비스 구성요소의 로그를 모아 한 눈에 확인하여 문제의 인과관계와
  원인을 찾아내고, 또한 긴급 오류를 자동 탐지하여 사용자의 개입을 유도,
  서비스의 지속성을 보장하기 위함이다.
  또한 서버의 의미가 퇴색된 클라우드 환경에서는, 추상적 구성요소의
  로그까지 수용하기 위해 그 필요성이 더욱 커지고 있다.
{.point}

로그 중앙화를 통해 우리가 얻을 수 있는 이점을 요약하면 다음과 같다.

* 로그 확인을 위해 여러 서버에 로그인하지 않아도 모아서 볼 수 있다.
* 시스템/구성요소 단위가 아닌 서비스 관점에서 통합하여 볼 수 있다.
* 클라우드 환경의 사라진 인스턴스나 추상적 구성요소의 로그도 놓치지 않는다.

또한,

* 장애 뿐만 아니라, 해킹 등에 의한 침해사고 발생 시, 로그를 보존할
  수 있는 가능성이 높아진다.
* (업무에 따라) 법적 요건 만족을 위한 로그 유지/관리가 편리해진다.

이쯤 되면... "중앙집중식 로그관리"는... 선택 사항인가?




# 맛보기

먼저, 이게 뭔지는 알아야겠기에, Graylog의 눈에 보이는 부분을 살펴보고,
설치과정에 대한 이야기를 시작하려 한다.

---

> 아! 먼저 얘기해지 않을 수 없는 것은, 사실 [Graylog]는 내가 구축하려는
> 환경을 만족할 수 없는 요건이 있었기 때문에 최종적으로 채택하지 않았다.
> 그래서 이 글은 이미 1년도 훌쩍 넘은 시점의 기록을 기반으로, 기억을
> 되짚어가며 작성하고 있어서, 부실한 부분이 많을 수 있다.  
> 채택하지 않았음에도 불구하고 시간을 들여 이 글을 쓰고 있는 이유는, 내
> 목적과는 다소 거리가 있었지만 Graylog가 제공하는 기능이나 완성도는 꽤
> 높았다는 기억과, 그렇다면 언젠가는 다시 만날 수 있지 않을까 하는 기대가
> 남아있기 때문이다.

---

보자.  내가 따낸 그림은 좀 후져서, 인터넷에서 한 장 가져왔다.

![](/attachments/graylog2/graylog-sample.png)
{.dropshadow}

최종적으로 우리가 보게 될 화면은 이런 것이다. (화면 이외의 기능은 조금
있다가...)
위에서 보는 것과 같이, Graylog를 사용하면, 단지 로그를 모으는 것 뿐만
아니라 모은 로그를 수치적으로 분석하여 도식화하거나 위치정보를 활용한
지도 위에 표시하는 등의 **대시보드** 기능을 제공한다. 또한, 아래와 같이
원본 로그 데이터를 분석하고 체계화하거나, 세부적인 로그를 찾아볼 수 있는
**검색화면**도 함께 제공된다.

![](/attachments/graylog2/graylog-110-search.png)
{.dropshadow}

이 외의 부가 기능은 [Calling All Logs! Graylog2 2편: 맛보기]에서 다시
살펴볼 예정이다.




# Architecture 및 사전 준비

이제, (늘 그랬듯이 Ubuntu Linux를 기준으로) 설치 과정을 설명한다.

## Architecture 살펴보기

개별 요소의 설치에 앞서, 전체적인 구조를 볼 필요가 있을 것 같다. 다음
그림은 Graylog의 개념적 구성요소와 상관관계를 설명하고 있다.

![](/attachments/graylog2/graylog-arch-concept.png)
{.dropshadow}

맨 위의 구름은 로그수집 대상이 되는 기계, 애플리케에션 등을 나타내며,
부하분산기를 거쳐 여러 대의 Cluster로 구성된 Graylog 서버에 메시지가
전달되는 모습을 표현하고 있다. Cluster로 구성된 Graylog는, 자료 저장
백엔드로 사용되는 뒷단의 MongoDB Replica Set과 ElasticSearch Cluster
양쪽으로 데이터를 전송하는 것이 표현되어 있다. (녹색 화살표와 파란색
화살표) 그리고 맨 아래에는 역시 Graylog의 구성요소인 Web Interface가
관리자에게 가까운 곳에 위치하여 있으며, 이것이 Graylog 서버와 통신을
통하여 사용자에게 대시보드 등을 표시하거나 관리기능을 수행하게 된다.

음, 구조가 괜찮다. ES도 그렇고, MongoDB도 그렇고, Cluster 구성 시
SPoF가 없는 구성이 되므로 비교적 높은 가용성을 얻을 수 있는 구조라고
볼 수 있을 것 같다.

아래 그림은, 위의 Architecture 도식에 서버를 추가한 그림으로, 실질적
구성의 예를 보여주고 있다. 이 예에서는, 한 쪽에는 ElasticSearch를
독립적인 서버군으로 묶어 Cluster를 만들어 놓았고(왼쪽) 다른 한 쪽에는
Graylog와 MongoDB를 탑재한 서버를 구성해 놓았다.

![](/attachments/graylog2/graylog-arch-large.png)
{.dropshadow}

이 문서에서는 (맛보기니까...) Cluster 구성은 생략하고, 각각에 대한
단일 구성을 하나의 서버에 몽땅 얹은 구성으로 시험환경을 구성하였다.
이 단일 서버 구성은 대상 서버가 적다면 실환경에서도 적용이 가능한
구조이지만, 단일 구성의 한계에 의하여 안정성과 가용성을 보장할 수는
없다.



## 사전 요구사항

시험환경에서 사용한 Ubuntu Linux는 16.04 버전이었다. OS를 최소 설치로
설치한 후, 다음과 같이 Java Runtime과 설치과정에서 사용할 구성요소들을
설치한다. (Graylog와 Elastic Search는 Java로 작성된 소프트웨어다.)

```console
$ sudo apt-get install apt-transport-https openjdk-8-jre-headless uuid-runtime pwgen
<...>
$ 
```



## MongoDB와 Elasticsearch의 설치 및 실행

뭐, Ubuntu에서 MongoDB와 ElasticSearch 설치하는 거야 어렵지 않다.  먼저,
다음과 같이 배포본에서 제공하는 MongoDB를 설치해주고,

```console
$ sudo apt-get install mongodb-server
<...>
$ 
```

Elastic 저장소로부터 Elasticsearch를 설치한다.
(최신 버전의 ElasticSearch에서는 구성 및 설정 방법이 다를 수 있다. 문서
작성 과정에서 최신 버전에 대한 업데이트는 생략하였으므로, 이 부분은
따로 확인해야 한다.)

```console {.wrap}
$ wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
OK
$ echo "deb https://packages.elastic.co/elasticsearch/2.x/debian stable main" | sudo tee -a /etc/apt/sources.list.d/elasticsearch-2.x.list
deb https://packages.elastic.co/elasticsearch/2.x/debian stable main
$ sudo apt-get update && sudo apt-get install elasticsearch
<...>
$ 
```

MongoDB는 설치만 하면 바로 사용이 가능하며, Elasticsearch는 기본적으로
자동시작을 하지 않는다. 먼저, 아래와 같이 `cluster.name`의 설정을 한 후,

```console {.wrap}
$ sudo cat /etc/elasticsearch/elasticsearch.yml |grep -v ^#
$ sudo sed -i 's/.*cluster.name: .*/cluster.name: graylog/' /etc/elasticsearch/elasticsearch.yml
$ sudo cat /etc/elasticsearch/elasticsearch.yml |grep -v ^#
cluster.name: graylog
$ 
```

다음과 같이 서비스 구성과 시작을 해준다.

```console {.wrap}
$ sudo systemctl daemon-reload 
$ sudo systemctl enable elasticsearch.service 
Synchronizing state of elasticsearch.service with SysV init with /lib/systemd/systemd-sysv-install...
Executing /lib/systemd/systemd-sysv-install enable elasticsearch
Created symlink from /etc/systemd/system/multi-user.target.wants/elasticsearch.service to /usr/lib/systemd/system/elasticsearch.service.
$ sudo systemctl restart elasticsearch.service
$ 
```

아래와 같이, 정상적으로 서비스로 등록되고 동작하는 것을 확인할 수 있다.
이 Elasticsearch 역시 Java 기반으로 동작하는데, 기본 설정을 보니 시작
메모리가 256MB이며 최대 1GB까지 쓰게 되어있다.
데이터가 많아졌을 때, 얼마나 많은 메모리를 쓰게 될지, 성능이 어떻게 될지
써 가면서 확인해야 할 것 같다.

```console {.wrap}
$ sudo systemctl status elasticsearch.service 
● elasticsearch.service - Elasticsearch
   Loaded: loaded (/usr/lib/systemd/system/elasticsearch.service; enabled; vendo
   Active: active (running) since Wed 2016-07-13 01:59:13 KST; 1min 10s ago
     Docs: http://www.elastic.co
  Process: 27791 ExecStartPre=/usr/share/elasticsearch/bin/elasticsearch-systemd
 Main PID: 27796 (java)
    Tasks: 38
   Memory: 277.5M
      CPU: 6.886s
   CGroup: /system.slice/elasticsearch.service
           └─27796 /usr/bin/java -Xms256m -Xmx1g -Djava.awt.headless=true -XX:+U

Jul 13 01:59:14 logger.example.com elasticsearch[27796]: [2016-07-13 01:59:14,8
Jul 13 01:59:14 logger.example.com elasticsearch[27796]: [2016-07-13 01:59:14,8
Jul 13 01:59:16 logger.example.com elasticsearch[27796]: [2016-07-13 01:59:16,8
Jul 13 01:59:16 logger.example.com elasticsearch[27796]: [2016-07-13 01:59:16,8
Jul 13 01:59:16 logger.example.com elasticsearch[27796]: [2016-07-13 01:59:16,9
Jul 13 01:59:16 logger.example.com elasticsearch[27796]: [2016-07-13 01:59:16,9
Jul 13 01:59:19 logger.example.com elasticsearch[27796]: [2016-07-13 01:59:19,9
Jul 13 01:59:20 logger.example.com elasticsearch[27796]: [2016-07-13 01:59:20,0
Jul 13 01:59:20 logger.example.com elasticsearch[27796]: [2016-07-13 01:59:20,0
Jul 13 01:59:20 logger.example.com elasticsearch[27796]: [2016-07-13 01:59:20,0
$ 
```

여기까지, 보이지 않는 영역의 Backend 설정은 간단하게 끝났다.



# Graylog의 설치

다음과 같은 방식으로, Graylog의 저장소를 시스템에 등록하고 설치를 진행한다.

```console {.wrap}
$ wget https://packages.graylog2.org/repo/packages/graylog-2.0-repository_latest.deb
$ sudo dpkg -i graylog-2.0-repository_latest.deb
Selecting previously unselected package graylog-2.0-repository.
(Reading database ... 54308 files and directories currently installed.)
Preparing to unpack graylog-2.0-repository_latest.deb ...
Unpacking graylog-2.0-repository (1-1) ...
Setting up graylog-2.0-repository (1-1) ...
$ sudo apt-get update
$ 
```

저장소 업데이트 이후에 `graylog-server` 패키지를 통해 설치해준다.

```console {.wrap}
$ sudo apt-get install graylog-server
<...>
The following NEW packages will be installed:
  graylog-server
0 upgraded, 1 newly installed, 0 to remove and 4 not upgraded.
<...>
Preparing to unpack .../graylog-server_2.0.3-1_all.deb ...
Unpacking graylog-server (2.0.3-1) ...
Processing triggers for ureadahead (0.100.0-19) ...
Processing triggers for systemd (229-4ubuntu6) ...
Setting up graylog-server (2.0.3-1) ...
################################################################################
Graylog does NOT start automatically!

Please run the following commands if you want to start Graylog automatically on system boot:

    sudo systemctl daemon-reload
    sudo systemctl enable graylog-server.service

    sudo systemctl start graylog-server.service

################################################################################
Processing triggers for systemd (229-4ubuntu6) ...
Processing triggers for ureadahead (0.100.0-19) ...
$ 
```

얘도 메시지를 보니, 자동으로 실행되지 않는다는데...


## 관리자 암호 등의 설정

다음과 같이, 구동에 앞서 암호를 설정해주어야 한다.

```console {.wrap}
$ cat /etc/graylog/server/server.conf |grep '^\(root_password\|password\)'
password_secret =
root_password_sha2 =
$ pwgen -N 1 -s 72
8UiN0F9R020202A0ParIm2f020202RLWPGBb020202B8F02020220202Ri8Y020202tiVux6

$ echo -n 'p4ssw0rd' | shasum -a 256
c449d0202024495020202f0a80020202c62f5020202d36121e502020298163c7  -
$ sudo sed -i 's/^password_secret.*/password_secret = 8UiN0F9R020202A0ParIm2f020202RLWPGBb020202B8F02020220202Ri8Y020202tiVux6/' /etc/graylog/server/server.conf
$ sudo sed -i 's/^root_password_sha2.*/root_password_sha2 = c449d0202024495020202f0a80020202c62f5020202d36121e502020298163c7/' /etc/graylog/server/server.conf
$ cat /etc/graylog/server/server.conf |grep '^\(root_password\|password\)'
password_secret = 8UiN0F9R020202A0ParIm2f020202RLWPGBb020202B8F02020220202Ri8Y020202tiVux6
root_password_sha2 = c449d0202024495020202f0a80020202c62f5020202d36121e502020298163c7
$ 
```

아... 명령으로 명확하게, 스트립트화하여 표현하려다 보니 좀 복잡해 보이지만
내용은 그냥 간단히 설정파일에 두 값을 설정하는 것이다.
설명하자면, 맨 첫번째 명령은 암호값이 비어있는지 확인하는 것이고, 그 다음은
아까 미리 설치한 `pwgen` 명령을 이용하여 암호를 만들어내는 것이다. 세 번째
명령은 `shasum` 명령을 사용하여 사용자가 지정한 암호를 암호 문자열로 변환해
내는 것이고, 그 다음의 두 줄은 `sed`를 사용하여 설정파일을 수정하는 단계다.
마지막으로, 값이 잘 들어갔는지 확인하는 것으로 끝.



## Graylog 시작하기

동일하게, 다음과 같이 서비스 등록 및 시작을 해준다.

```console {.wrap}
$ sudo systemctl daemon-reload
$ sudo systemctl enable graylog-server.service
Synchronizing state of graylog-server.service with SysV init with /lib/systemd/systemd-sysv-install...
Executing /lib/systemd/systemd-sysv-install enable graylog-server
Created symlink from /etc/systemd/system/multi-user.target.wants/graylog-server.service to /usr/lib/systemd/system/graylog-server.service.
$ sudo systemctl start graylog-server.service
$ 
```

기동에 약간의 시간이 걸리는데, 최종적으로 다음과 같은 상태가 된다.

```console {.wrap}
$ sudo systemctl status graylog-server.service
● graylog-server.service - Graylog server
   Loaded: loaded (/usr/lib/systemd/system/graylog-server.service; enabled; vend
   Active: active (running) since Wed 2016-07-13 02:10:28 KST; 42s ago
     Docs: http://docs.graylog.org/
 Main PID: 28868 (graylog-server)
    Tasks: 135
   Memory: 781.5M
      CPU: 36.020s
   CGroup: /system.slice/graylog-server.service
           ├─28868 /bin/sh /usr/share/graylog-server/bin/graylog-server
           └─28872 /usr/bin/java -Xms1g -Xmx1g -XX:NewRatio=1 -server -XX:+Resiz

Jul 13 02:10:28 logger.example.com systemd[1]: Started Graylog server.
$ 
```

일단 뜨긴 하는데, 이게 Web Console의 포트가 9000번으로 뜬다. 아... 방화벽
막혀 있는데...


```console {.wrap}
$ grep web_listen_uri /etc/graylog/server/server.conf
#web_listen_uri = http://127.0.0.1:9000/
$ sudo sed -i 's,#web_listen_uri.*,web_listen_uri = http://10.10.10.9:80/,' /etc/graylog/server/server.conf
$ grep web_listen_uri /etc/graylog/server/server.conf
web_listen_uri = http://10.10.10.9:80/
$ 
$ sudo systemctl restart graylog-server.service
$ 
```

그래서 위와 같이 포트를 바꿔서 해보려 했으나, 잘 되지 않는다. 원인은 실행
사용자가 graylog기 때문. 음, 훌륭하네. 내 생각에도 이 프로스세를 `root`로
띄우는 것은 별로다. 또한, API를 위한 Port도 열어야 하고...

아, 그렇다면 nginx를 함께 쓰면 되겠다.
**실제 환경에서는 Load Balancer가 이 역할을 할 것이다.**



## Install and Setup Nginx

이건 뭐 설명이 필요하지 않을 것 같고...

```console
$ sudo apt-get install nginx-extras
<...>
The following NEW packages will be installed:
  libgd3 libjbig0 libluajit-5.1-2 libluajit-5.1-common libtiff5 libvpx3
  libxpm4 libxslt1.1 nginx-common nginx-extras
0 upgraded, 10 newly installed, 0 to remove and 0 not upgraded.
Need to get 2,100 kB of archives.
After this operation, 6,644 kB of additional disk space will be used.
<...>
$ 
```

Nginx는 아래와 같이 설정해준다. `/`로 들어오는 연결은 9000번 포트에 연결을
해주고, `/api`를 달고 들어오는 연결은 12900번 포트를 사용하는 API 포트에
연결을 돌려주는 설정이다.

```nginx
server
{
  listen      80 default_server;
  listen      [::]:80 default_server ipv6only=on;
  server_name logger.example.com;

  location /api/
    {
        proxy_set_header    Host $http_host;
        proxy_set_header    X-Forwarded-Host $host;
        proxy_set_header    X-Forwarded-Server $host;
        proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass          http://127.0.0.1:12900/;
    }
  location /
    {
        proxy_set_header    Host $http_host;
        proxy_set_header    X-Forwarded-Host $host;
        proxy_set_header    X-Forwarded-Server $host;
        proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header    X-Graylog-Server-URL http://logger.example.com/api;
        proxy_pass          http://127.0.0.1:9000;
    }
}
```

아래와 같이 설정 적용하고, 재시작 해준다.

```console
$ sudo rm -f /etc/nginx/sites-enabled/default
$ sudo ln -s ../site-available/graylog /etc/nginx/sites-enabled/
$ sudo systemctl restart nginx.service 
$ 
```

잘 떴나 살펴보면,

```console
$ sudo systemctl status nginx.service 
● nginx.service - A high performance web server and a reverse proxy server
   Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: en
   Active: active (running) since Wed 2016-08-10 16:35:28 UTC; 29s ago
  Process: 13912 ExecStop=/sbin/start-stop-daemon --quiet --stop --retry QUIT/5 
  Process: 13920 ExecStart=/usr/sbin/nginx -g daemon on; master_process on; (cod
  Process: 13916 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; master_process
 Main PID: 13924 (nginx)
    Tasks: 3
   Memory: 4.1M
      CPU: 98ms
   CGroup: /system.slice/nginx.service
           ├─13924 nginx: master process /usr/sbin/nginx -g daemon on; master_pr
           ├─13925 nginx: worker process                           
           └─13926 nginx: worker process                           

Aug 10 16:35:28 logger.example.com systemd[1]: Starting A high performance web 
Aug 10 16:35:28 logger.example.com systemd[1]: Started A high performance web s
$ 
```

구성 완료. 이제 Nginx를 통해서 Graylog에 접속할 수 있게 되었다.





# 확인하기

이제 해당 서버에 웹브라우져로 접속해본다.

![](/attachments/graylog2/graylog-101-login.png)
{.dropshadow}

음, 이 고전적이며 뭔가 무게가 잡힌 로그인 페이지를 봤다면 설치가 잘 되었을
가능성이 90% 정도? (혹시 뒤쪽에서 뭔가 꼬이지 않았다면 :-)



#### 다음 이야기...

* _Calling All Logs! Graylog2 1편: 설치하기_
* [Calling All Logs! Graylog2 2편: 맛보기]
* [Calling All Logs! Graylog2 3편: 추가설정]
* [Calling All Logs! Graylog2 4편: 기록]
{.angle}


[Calling All Logs! Graylog2 1편: 설치하기]:{{< relref "/blog/sysadmin/2017-10-11-calling-all-logs-graylog2-installation.md" >}}
[Calling All Logs! Graylog2 2편: 맛보기]:{{< relref "/blog/sysadmin/2017-10-12-calling-all-logs-graylog2-overview.md" >}}
[Calling All Logs! Graylog2 3편: 추가설정]:{{< relref "/blog/sysadmin/2017-10-13-calling-all-logs-graylog2-settings.md" >}}
[Calling All Logs! Graylog2 4편: 기록]:{{< relref "/blog/sysadmin/2017-10-13-calling-all-logs-graylog2-memories.md" >}}


[Graylog]:https://www.graylog.org/
[Graylog Docs]:http://docs.graylog.org/
[Graylog Github]:https://github.com/Graylog2
