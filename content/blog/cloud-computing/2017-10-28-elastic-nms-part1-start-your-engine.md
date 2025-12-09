---
title: "Elastic NMS Part 1: 엔진을 켜라!"
subtitle: Elastic Stack을 바탕으로 NMS 만들기
tags: ["elastic-stack", "logging", "monitoring", "cloud-computing", "analytics"]
categories: ["cloud-computing"]
images: [/attachments/elastic-nms/elastic-architecture.png]
banner: /attachments/elastic-nms/elastic-architecture.png
date: 2017-10-28T00:04:00+0900
---
다중가입자 환경을 지원하는 쓸만한 로그중앙화 솔루션이 있을까... 한동안 찾던
중에, 적당한 것을 찾기가 쉽지 않았던 것도 있고 또 내가 원하는 세세한 부분을
반영하기에는 조금 저수준에서 접근할 필요가 있겠다는 생각이 들었다. 그래서
그 기반으로 사용할 후보로 검토했던 것이, 이미 많은 프로젝트에서 Backend로
사용되고 있는, 유명한 데이터 분석도구 Elastic Stack 이었다.
<!--more-->

Elastic Stack을 검토했던 것도 Graylog2와 마찬가지로 1년 전의 일이었다. 이미
Elastic Stack은 5.x 버전을 새로 발표한 상태이며, 새 버전은 꽤 많은 변화와
발전이 있었던 것 같다. 새로운 버전으로 새롭게 시험하고 기록을 남기고 싶은
마음이 굴뚝같지만, 그걸 기약할 수는 없어서... 그냥 예전의 메모와 머리속의
기억을 더음어 기록으로 남긴다.  (아... 더 이상 내 머리를 믿지 못해서
"생각저장소"를 만들었으면 좀 그때 그때 기록하자!)

* _Elastic NMS Part 1: 엔진을 켜라!_
* [Elastic NMS Part 2: Syslog 원격로깅]
* [Elastic NMS Part 3: Mapping과 Template]
* [Elastic NMS Part 4: Kibana로 Visualize하기]
* [Elastic NMS Part 5: NetFlow 수신하기]
* [Elastic NMS Part 6: SNMP 수신하기]

이 묶음글과 직접적인 관련은 없지만, 혹시 로그중앙화를 위한 간편한 솔루션을
찾는다면 이보다 앞서 검토했던 Graylog2에 대해 정리했던 글이 더욱 도움이 될
수도 있다. Graylog2는 로그중앙화와 검색, 경보발생 등이 가능한 매우 쉽고 잘
만들어진 도구다.

* [Calling All Logs! Graylog2 1편: 설치하기]
* [Calling All Logs! Graylog2 2편: 맛보기]
* [Calling All Logs! Graylog2 3편: 설정]
* [Calling All Logs! Graylog2 4편: 기록]



# Architecture

Elastic Stack은 과거에 ELK Stack이라고 불리던 바로 그것이다. 이미 공식적으로
이름을 붙인지 꽤 많은 시간이 지났지만, 많은 사람들이 과거의 별명을 계속해서
사용하는 것 같다. (나는 개명을 존중하기 때문에 Elastic Stack이라고만 부른다.)

과거에 이것이 ELK Stack이라고 불렸던 이유는 이것의 주 구성요소의 머릿글짜가
E, L, K 였기 때문인데, 각각 Elasticsearch, Logstash, 그리고 Kibana이다.
(현재 버전에서는 Beats라는 이름의 수집기가 공식적으로 추가되었다.)

**Elasticsearch**는 이 분석스택의 중심에 위치해 있는 요소이다. 이름을 보면
알 수 있듯이, 이건 기본적으로 검색엔진이다. 동시에 분석엔진이며 분석하려는
자료의 저장소 역할을 하고 있기도 하다.
Elasticsearch는 Logstash 등이 보내는 자료를 JSON 형식으로 색인하여 보관하며,
Kibana 등의 클라이언트가 질의를 날리면 그것을 파악하고 자료를 검색/분석하여
답을 되돌려주는, 마치 일반적인 애플리케이션 스택에서 DBMS가 맡고 있는 역할을
담당한다.

**Logstash**는 이름에서 볼 수 있듯이 로그를 수집하는 역할을 한다. 보통은 이
자리를 Collector라고 불렀던 것 같은데, 요즘은 워낙에 "해운업"이 득세를 하다
보니, 전산용어가 참... 아무튼, Forwarder, Shipper 등으로 불리기도 한다.
Logstash는 구성 형태에 따라 (로그를 퍼다가 다음 위치로 쏴주는) Forwarder로
동작하기도 하고, (받아온 로그를 패킹하여 검색엔진에게 싣는) Shipper 처럼
동작하기도 한다.

**Kibana**는 Logstash를 통해 Elasticsearch에 저장된 데이터를 검색하거나
분석하는 질의를 날리고, 그 결과를 시각적으로 표시해주는 클라이언트 위상의
웹애플리케이션이다. 용도에 따라 그냥 이것을 사용할 수도 있겠지만, 말하자면
DBA들이 쓰는 Toad 같은 녀석이랄까? 원초적인 수준, 또는 최대의 자유도로
Elasticsearch를 쓰는 기본 분석도구 정도로 이해할 수 있다.

![SHOT](/attachments/elastic-nms/elastic-architecture.png)

단순하게 Elastic Stack을 표현한 그림인데, 이 시험에서는 Cluster 구성 없이
단일 기계에 세 개의 구성요소를 모두 올린 형태로 진행했다.



# 서버의 구성

아주 단순하게, 하나의 서버에 모든 구성요소를 한 벌만 올리는 방식으로 서버
환경을 구성한다. 물론, 운영환경이라면 그 규모와 가용성 요구사항을 고려해서
클러스터 구성과 구성요소 분리 작업이 필요하다.


## 기반 환경 구성

Elasticsearch는 Java 기반의 프로그램이다. Java 버전 7 이상과 Oracle 및
OpenJDK를 지원한다고 한다. 다른 경우엔 Oracle 자바를 더 많이 써왔지만,
오늘의 선택은 OpenJDK. 아래와 같이, 추가 저장소 설정 없이 Ubuntu에서
기본 제공하는 패키지를 설치한다.

```console
$ sudo apt-get install -y openjdk-8-jre-headless
<...>
$ 
```

이것 말고는 따로 준비할 것이 없다. 간단하다. :-)


## 공식 저장소 설정

Elasticsearch는 여러 기반환경을 위한 저장소를 제공하고 있다. 데비안 계열의
사용자를 위한 저장소도 제공되고 있으며, 아래와 같이 저장소 설정을 해준다.

```console
$ cat <<EOF |sudo tee /etc/apt/sources.list.d/elasticstack-2.x.list
> deb https://packages.elastic.co/elasticsearch/2.x/debian stable main
> deb https://packages.elastic.co/logstash/2.4/debian stable main
> deb https://packages.elastic.co/kibana/4.6/debian stable main
> EOF
deb https://packages.elastic.co/elasticsearch/2.x/debian stable main
deb https://packages.elastic.co/logstash/2.4/debian stable main
deb https://packages.elastic.co/kibana/4.6/debian stable main
$ 
```

이제 GPG-KEY를 넣어주면,

```console
$ wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
OK
$ 
```

준비는 끝났다.


## Elasticsearch 2.4 설치

Elastic Stack의 각 구성요소는 각각의 독립적인 패키지로 묶여있다. 일반적으로
이렇게 세 개의 구성요소를 쌍으로 구성하는 경우가 많긴 하겠지만, 사실상 이건
Stack일 뿐이고 사용자의 구성환경에 따라 각각 다른 기계에 설치하거나, 일부
구성요소를 사용하지 않을 수도 있기 때문에 매우 당연한 얘기다.

아래와 같이, `apt-get`을 사용하여 앞서 설정한 저장소로부터 패키지를 설치한다.

```console
$ sudo apt-get update && sudo apt-get install -y elasticsearch
<...>
The following NEW packages will be installed:
  elasticsearch
0 upgraded, 1 newly installed, 0 to remove and 5 not upgraded.
Need to get 27.3 MB of archives.
After this operation, 30.6 MB of additional disk space will be used.
<...>
$ 
```

설치가 끝나면 Cluster의 이름을 내가 원하는 것으로 바꿔준다.

```console
$ sudo sed -i "s/.*cluster.name: .*/cluster.name: hyeoncheon/" /etc/elasticsearch/elasticsearch.yml
$ 
```

마지막으로 서비스를 자동시작하도록 등록하고 기동해준다.

```console
$ sudo systemctl daemon-reload
$ sudo systemctl enable elasticsearch.service
Synchronizing state of elasticsearch.service with SysV init with /lib/systemd/systemd-sysv-install...
Executing /lib/systemd/systemd-sysv-install enable elasticsearch
Created symlink from /etc/systemd/system/multi-user.target.wants/elasticsearch.service to /usr/lib/systemd/system/elasticsearch.service.
$ sudo systemctl restart elasticsearch.service
$
```

프로세스가 정상적으로 떠 있는 것이 확인되면 다음과 같이 간단한 질의를 던져
동작 여부를 확인할 수 있다.

```console
$ curl 'localhost:9200/_cat/health?v'
epoch      timestamp cluster    status node.total node.data shards pri relo init unassign pending_tasks max_task_wait_time active_shards_percent
1473056808 15:26:48  hyeoncheon green           1         1      0   0    0    0        0             0                  -                100.0%
$ curl 'localhost:9200/_cat/nodes?v'
host      ip        heap.percent ram.percent load node.role master name
127.0.0.1 127.0.0.1           10          37 0.00 d         *      Doppleganger
$ 
```

정상!


## Kibana 4.6.0 설치

Kibana는 더 간단하게 설치가 된다. 아래와 같이 패키지 설치를 하고,

```console
$ sudo apt-get install -y kibana
<...>
The following NEW packages will be installed:
  kibana
0 upgraded, 1 newly installed, 0 to remove and 5 not upgraded.
Need to get 34.4 MB of archives.
After this operation, 127 MB of additional disk space will be used.
<...>
$ 
```

서비스를 올리면 끝.

```console
$ sudo systemctl enable kibana.service
Synchronizing state of kibana.service with SysV init with /lib/systemd/systemd-sysv-install...
Executing /lib/systemd/systemd-sysv-install enable kibana
$ sudo systemctl restart kibana.service
$ 
```

아! 혹시 UFW나 다른 방화벽을 쓰고 있다면 방화벽을 열어주는 것도 잊어서는
안된다. (난 항상 방화벽을 쓰니까...)

```console
$ cat <<EOF |sudo tee /etc/ufw/applications.d/kibana
> [Kibana]
> title=Kibana
> description=Kibana
> ports=5601/tcp
> EOF

[Kibana]
title=Kibana
description=Kibana
ports=5601/tcp
$ 
```

위와 같이 UFW의 Application 설정을 만든 후에, 아래처럼 원하는 주소에
열어주면 된다.

```console
$ sudo ufw allow from 192.168.1.0/24 to any app Kibana
Rule added
$ 
```

올렸으니 바로 접속을 해보자.

![SHOT](/attachments/elastic-nms/elk-kibana-01-initializing.jpg)
{.bordered}

Kibana는 첫번째 사용자가 접속할 때, 위와 같이 Initialize 과정을 거친다.
조금 당황스러운 것은, 이게, 기본적으로는 인증이라는 절차가 없다.
**인증을 포함하여 실무 운영 적용을 위해서는 필수적으로 필요한 고급 기능은
대부분 확장팩인 X-Pack을 통해 제공**된다. 뭐, 오픈소스 커뮤니티를 기반으로
사업을 하면서 핵심이 되는 엔진은 공개하되, 차별화된 고급기능은 독립적인
상용 서비스로 제공하여 사업성을 유지위기 위한 방식이랄까...
아무튼, 초기화가 되면 다음과 같이, Index 정보가 없으니 만들라는 화면으로
넘어간다.

![SHOT](/attachments/elastic-nms/elk-kibana-02-no-index.jpg)
{.bordered}

그러나 우리는 아직 Index를 가지고 있지 않다. Index는 일종의 Database, 또는
Oracle의 Schema, 뭐 그런 비슷한 개념인데, 연관된 문서를 담는 큰 그릇이라
생각할 수 있다. (Elasticsearch는 동시에 여러 개의 Index를 각각의 단위로
저장/보관/관리한다.)


## Logstash 1:2.4 설치

마지막으로, 로그를 퍼오는 역할을 하는(사실, 이 이야기에서는 능동적으로
퍼오기 보다 수동적으로 받는 역할이긴 하다.) Logstash를 설치한다.

```console
$ sudo apt-get install -y logstash
<...>
The following NEW packages will be installed:
  logstash
0 upgraded, 1 newly installed, 0 to remove and 5 not upgraded.
Need to get 84.8 MB of archives.
After this operation, 143 MB of additional disk space will be used.
<...>
$ 
```

설치가 끝나면 조금 설정을 해주어야 한다. 설정이라기 보다는 구성이라는 단어가
보다 적당할 것 같다.
다른 두 구성요소와는 달리 Logstash는 자료 긁기나 받기부터 시작해서 그것을
사용자의 목적에 따라 1차 가공하거나 걸러내거나 다른 곳으로 쏘거나 ES에 싣는
등, 담당하는 일이 상대적으로 "용도 의존적"이기 때문에, 앞으로 이야기할 내용의
대부분이 이 Logstash를 구성하는 이야기라고 생각해도 될 것 같다.



# 됐고, 로그 먼저 봅시다!

먼저 **로그를 모으기 위해서는 Logstash를 구성**해야 한다. Logstash는
`input`, `filter`, `output`, `codec` 등의 플러그인을 구성하여 모든 데이터의
흐름과 조작을 제어한다. 이 글에서는 가장 기본이 되는 입력 플러그인인 파일을
읽어서 Elasticsearch에게 집어넣는 것으로 동작시험을 할 것인데, 각각 `file`
이라는 `input` 플러그인과 `elasticsearch`라는 `output` 플러그인을 이용하여
구성하게 된다.


## 기본 input/output 설정

아래와 같이, `/etc/logstash/conf.d` 아래에 간단한 내용을 담은 설정파일을
하나 만든다.

```console
$ cat <<EOF |sudo tee /etc/logstash/conf.d/99-local-elastic.conf
> input {
>   file {
>     type => "syslog-local"
>     path => [ "/var/log/elasticsearch/*.log", "/var/log/logstash/*.log" ]
>   }
> }
> output {
>   elasticsearch { hosts => ["127.0.0.1"] }
> }
> EOF

input {
  file {
    type => "syslog-local"
    path => [ "/var/log/elasticsearch/*.log", "/var/log/logstash/*.log" ]
  }
}
output {
  elasticsearch { hosts => ["127.0.0.1"] }
}
$ 
```

직관적으로 이해할 수 있겠지만 Elastic Stack과 관련된 몇몇 로그파일을 읽어서
`syslog-local`이라는 유형으로 분리하는 부분이 하나 있고, `localhost`에 위치한
Elasticsearch에게 보내는 부분이 하나 있다.

필수는 아니지만, 만약 읽으려는 파일 중 `logstash` 계정으로 읽을 수 없는 파일이
있다면 `chmod`, `chown`, 또는 아래와 같은 File ACL 조정으로 읽을 수 있도록
설정을 해주어야 한다.

```console
$ sudo setfacl -R -m u:logstash:r-x /var/log/elasticsearch/
$ 
```

이제 준비가 되었다. 띄우자!

```console
$ sudo systemctl daemon-reload
$ sudo systemctl restart logstash.service
$ sudo systemctl status logstash
● logstash.service - LSB: Starts Logstash as a daemon.
   Loaded: loaded (/etc/init.d/logstash; bad; vendor preset: enabled)
   Active: active (running) since Mon 2016-09-05 18:35:42 KST; 7s ago
     Docs: man:systemd-sysv-generator(8)
  Process: 8283 ExecStop=/etc/init.d/logstash stop (code=exited, status=0/SUCCES
  Process: 8288 ExecStart=/etc/init.d/logstash start (code=exited, status=0/SUCC
    Tasks: 18
   Memory: 181.0M
      CPU: 13.862s
   CGroup: /system.slice/logstash.service
           └─8297 /usr/bin/java -XX:+UseParNewGC -XX:+UseConcMarkSweepGC -Djava.

Sep 05 18:35:42 factory.example.com systemd[1]: Starting LSB: Starts Logstash
Sep 05 18:35:42 factory.example.com logstash[8288]: logstash started.
Sep 05 18:35:42 factory.example.com systemd[1]: Started LSB: Starts Logstash
$ 
```

## Kibana에서 확인하기

잘 떴다면 뭔가 데이터가 쌓이고 있을 것이다. Kibana에 다시 접속을 하면,
아래와 같은 Index 설정 화면이 다시 나타날텐데, 조금 다른 부분이 있을
것이다. 이번에는 앞선 화면에서 비활성 상태였던 "Create" 버튼이 녹색으로
활성화되어 보인다!

![SHOT](/attachments/elastic-nms/elk-101-configure-an-index.jpg)
{.bordered}

위의 화면에서 Create 버튼을 눌러 Index 정보를 생성해주면, 아래의 화면으로
넘어가게 된다. 이 화면은, 사용자가 지정한 Index에 담겨있는 데이터의 형과
형식, 분석여부와 색인여부를 표시하고 있다.

![SHOT](/attachments/elastic-nms/elk-102-default-index.jpg)
{.bordered}

이제 화면 상단의 Discover 메뉴를 선택하여 실제의 데이터를 본다. 아래와 같이
이미 많은 데이터가 쌓여 있는 것을 볼 수 있다. (ES와 LS의 기동 로그겠지)

![SHOT](/attachments/elastic-nms/elk-103-discover.jpg)
{.bordered}

둘러보는 김에 각 열의 왼쪽에 붙어있는 세모를 눌러 상세 정보를 표시해보면,
아래 그림에서 보는 것과 같이 자세한 내용을 확인할 수 있다.

![SHOT](/attachments/elastic-nms/elk-104-file-fields.jpg)
{.bordered}

좋았어! 일단 설치는 잘 된 것 같다!


### 이 묶음의 다른 글들

* _Elastic NMS Part 1: 엔진을 켜라!_
* [Elastic NMS Part 2: Syslog 원격로깅]
* [Elastic NMS Part 3: Mapping과 Template]
* [Elastic NMS Part 4: Kibana로 Visualize하기]
* [Elastic NMS Part 5: NetFlow 수신하기]
* [Elastic NMS Part 6: SNMP 수신하기]

[Elastic NMS Part 2: Syslog 원격로깅]:{{< relref "/blog/cloud-computing/2017-10-30-elastic-nms-part2-syslog-remote-logging.md" >}}
[Elastic NMS Part 3: Mapping과 Template]:{{< relref "/blog/cloud-computing/2017-10-30-elastic-nms-part3-mapping-and-template.md" >}}
[Elastic NMS Part 4: Kibana로 Visualize하기]:{{< relref "/blog/cloud-computing/2017-10-30-elastic-nms-part4-visualize-with-kibana.md" >}}
[Elastic NMS Part 5: NetFlow 수신하기]:{{< relref "/blog/cloud-computing/2017-10-31-elastic-nms-part5-netflow-monitoring.md" >}}
[Elastic NMS Part 6: SNMP 수신하기]:{{< relref "/blog/cloud-computing/2017-10-31-elastic-nms-part6-snmp-monitoring.md" >}}

### 함께 읽기

* [Calling All Logs! Graylog2 1편: 설치하기]
* [Calling All Logs! Graylog2 2편: 맛보기]
* [Calling All Logs! Graylog2 3편: 설정]
* [Calling All Logs! Graylog2 4편: 기록]
* [PaperTrail, Cloud에서는 Cloud 로그를!]
* [Cloud App에서 PaperTrail 사용하기]


[Calling All Logs! Graylog2 1편: 설치하기]:{{< relref "/blog/sysadmin/2017-10-11-calling-all-logs-graylog2-installation.md" >}}
[Calling All Logs! Graylog2 2편: 맛보기]:{{< relref "/blog/sysadmin/2017-10-12-calling-all-logs-graylog2-overview.md" >}}
[Calling All Logs! Graylog2 3편: 설정]:{{< relref "/blog/sysadmin/2017-10-13-calling-all-logs-graylog2-settings.md" >}}
[Calling All Logs! Graylog2 4편: 기록]:{{< relref "/blog/sysadmin/2017-10-13-calling-all-logs-graylog2-memories.md" >}}
[PaperTrail, Cloud에서는 Cloud 로그를!]:{{< relref "/blog/cloud-computing/2016-09-07-cloud-log-papertrail.md" >}}
[Cloud App에서 PaperTrail 사용하기]:{{< relref "/blog/cloud-computing/2016-09-07-using-papertrail.md" >}}

