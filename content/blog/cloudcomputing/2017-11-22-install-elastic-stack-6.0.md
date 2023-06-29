---
title: Elastic Stack 6.0 설치하기
subtitle: Elastic Stack을 활용해서 서비스 이벤트 해석하기
tags: ["elastic-stack", "analytics", "cloud-computing", "howto"]
categories: ["cloudcomputing"]
image: /attachments/elastic-stack/kibana-6.0-discover.png
banner: /attachments/elastic-stack/kibana-6.0-init.png
date: 2017-11-22T19:15:00+0900
last_modified_at: 2017-11-24T18:07:00+0900
---
서로 독립적인 버전체계를 사용하면서 개별 제품의 연합군 같은 느낌이 더 강했던
ELK Stack, 즉 Elasticsearch, Logstash, Kibana는 이제 버전체계를 통일하고
Elastic Stack이라는 공식적인 명칭으로 사용하면서 더 활발하게 시장 공략을
하고 있는 것 같다. 이 글은, 지난번 소개했던
"[Elastic NMS Part 1: 엔진을 켜라!]"의 업데이트 성격의 글로, Elastic Stack의
현재 버전인 6.0 버전에 대한 설치과정을 정리한 것이다.

이전 버전을 활용하여 SNMP, NetFlow 등을 지원하는 간이 NMS를 구성했던 이야기는
아래 링크에서 찾을 수 있다.

* [Elastic NMS Part 1: 엔진을 켜라!]
* [Elastic NMS Part 2: Syslog 원격로깅]
* [Elastic NMS Part 3: Mapping과 Template]
* [Elastic NMS Part 4: Kibana로 Visualize하기]
* [Elastic NMS Part 5: NetFlow 수신하기]
* [Elastic NMS Part 6: SNMP 수신하기]

> 이 글은 다음 묶음글을 위한 준비과정을 담은 글이다.
> Elastic Stack을 이용한 이벤트 해석에 관심이 있다면 다음 글들도 함께!

* [모니터링은 경보가 아니라 해석]
* [Kibana Visual Builder로 이벤트 묶어 보기]
* [Kibana Heat Map으로 3차원으로 펼쳐 보기]


# 기반환경

* TOC
{:toc .half.pull-right}

역시, 이번에도 Ubuntu Linux를 기반으로 환경을 구성했으며, 데이터의 양과
가용성 조건이 약하기 때문에 단일 서버에 모든 구성요소를 올리는 방식으로
구성을 하였다. Elastic Stack은 복잡한 기반 구성이 필요하지 않으며, 다음
절에서 설명하고 있는 Java Runtime의 설치만으로 기반 환경의 설정이 모두
끝나게 된다.

시각에 따라 기반환경에 해당할 수 있는 방화벽 등의 구성에 대해서는,
구성과의 연관성이나 문맥의 흐름을 위해 개별 구성요소의 설치 및 구성
과정에서 다루고 있다.


## 의존성 패키지 설치

Elasticsearch 등의 Elastic Stack 구성요소는 대체로 Java로 만들어져 있기
때문에 다음과 같이 Java Application을 구동하기 위한 Runtime을 구성해야
한다. 이번에도 OpenJDK를 사용하기로 했으며, 아래와 같이, `apt-get` 명령을
사용하여 간단하게 설치할 수 있다.

```console
$ sudo apt-get install -y openjdk-8-jre-headless
<...>
The following NEW packages will be installed:
  ca-certificates-java fontconfig-config fonts-dejavu-core java-common
  libavahi-client3 libavahi-common-data libavahi-common3 libcups2
  libfontconfig1 libjpeg-turbo8 libjpeg8 liblcms2-2 libnspr4 libnss3
  libnss3-nssdb libpcsclite1 libxi6 libxrender1 libxtst6
  openjdk-8-jre-headless x11-common
0 upgraded, 21 newly installed, 0 to remove and 0 not upgraded.
Need to get 30.1 MB of archives.
After this operation, 110 MB of additional disk space will be used.
<...>
$ 
```

기반 구성은 이걸로 끝이다. 이제 Elastic Stack 제품군을 설치할 차례다.



# 설치 및 구성

Elastic Stack의 최신 버전을 사용하기 위해서 Elastic의 공식 저장소를 통하여
설치하는 방법을 택하였다. (배포본에서 제공하는 버전은 대체로 최신 버전에서
많이 떨어져 있기 때문에)


## 공식 저장소 구성

APT 저장소를 구성하기 위해, 아래와 같이 Elastic에서 제공하는 GPG 키를 먼저
등록해준다.

{:.wrap}
```console
$ wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch | sudo apt-key add -
OK
$ 
```

키를 등록했으면 이제 저장소를 구성할 차례이다. 아래처럼, 저장소 구성을 할
수 있다. (설명을 간단하게 하기 위해 명령을 이용하여 파일을 생성하는 방식을
사용하고 있지만, 편집기를 사용하여 해당 내용을 적어줘도 된다.)

{:.wrap}
```console
$ echo "deb https://artifacts.elastic.co/packages/6.x/apt stable main" | sudo tee -a /etc/apt/sources.list.d/elastic-6.x.list
deb https://artifacts.elastic.co/packages/6.x/apt stable main
$ sudo apt-get update
<...>
$ 
```

위와 같이, 저장소를 설정하고 그 내용을 받아오고 나면, 이제 패키지를 설치할
차례다.


## Elasticsearch의 설치와 구성

다음과 같은 방식으로 Elastic Stack의 핵심 엔진인 Elasticsearch를 설치하고
구성해준다. (구성은 별도의 Tuning 없이 매우 간단한 수준에서의 설정만 했다.)

먼저, 다음고 같이 `apt-get` 명령을 사용하여 패키지를 설치해준다.

```console
$ sudo apt-get install elasticsearch
<...>
The following NEW packages will be installed:
  elasticsearch
0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.
Need to get 27.9 MB of archives.
After this operation, 31.2 MB of additional disk space will be used.
<...>
$ 
```

별도의 의존성도 없고, 용량이 크지도 않으며, 아주 간단하게 설치가 된다.
아쉬운 부분이 하나 있다면, 패키지 자체에 Java Runtime에 대한 의존성을 걸어
두었다면 딱히 설명하지 않아도 Java Runtime을 설치하지 않는 실수는 하지
않을텐데, 왜 의존성 설정을 하지 않은 것인지... 아마도, 패키지 관리자를
사용하지 않고 JRE를 내려받아 수동으로 설치한 경우가 상대적으로 많다 보니
그것을 고려한 것 같은데... 아무튼, 좀 아쉽다.

이번에도 지난번 글과 같이, Cluster 이름을 수정하는 정도의 설정을 해줬다.

```console
$ sudo sed -i "s/.*cluster.name: .*/cluster.name: trends/" /etc/elasticsearch/elasticsearch.yml
$ sudo sed -i "s/.*node.name: .*/node.name: ${HOSTNAME}/" /etc/elasticsearch/elasticsearch.yml
$ 
```

이제 Elasticsearch에 대한 설치와 구성은 다 되었고, 다음으로 넘어간다.


## Kibana의 설치와 구성

여담인데, 설치를 끝내고 보니, Elastic Stack의 미모를 담당한다고 설명한 바
있는 Kibana가 완전히 멋지게 변했다. 비주얼 뿐만 아니라 기능적인 부분과
기존 버전에서 좀 빠릿하지 못했던 부분도 많이 개선이 된 것 같다.

아무튼, 다음과 같이, 역시 `apt-get` 명령으로 패키지를 설치해준다. 이번에는
Elasticsearch에 비해 그 용량이 좀 크다.

```console
$ sudo apt-get install kibana
<...>
The following NEW packages will be installed:
  kibana
0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.
Need to get 63.5 MB of archives.
After this operation, 221 MB of additional disk space will be used.
<...>
$ 
```

Elastic Stack을 랩탑에 설치하지 않고 클라우드 컴퓨팅 환경에 위치한 원격
호스트에 설치하였기 때문에, 다음과 같이 Kibana가 Listen하는 주소를 바꿔줘야
원격지 접속이 가능해진다. (커뮤니티 버전에서 별도의 인증체계나 통신구간에
대한 보안체계를 갖추지 않은 Kibana이다 보니, 기본적으로 `localhost` 만을
Listen하고 있다.)

```console
$ sudo sed -i 's/.*server.host: .*/server.host: "0.0.0.0"/' /etc/kibana/kibana.yml
$ 
```

Kibana가 Host가 갖는 모든 주소에 대하여 Listen한다고 해도, 방화벽이 있는
상황이라면 원격지에서 접속하는 것이 불가능하다. 나는(아마도 다른 이들도
모두?) 항상 `ufw`를 활성화하여 사용하기 때문에, 다음과 같이 Kibana 접속을
위한 방화벽 구성이 필요하다.

```console
$ cat <<EOF |sudo tee /etc/ufw/applications.d/hce-kibana
> [HCE-Kibana]
> title=HCE-Kibana
> description=Kibana
> ports=5601/tcp
> EOF
[HCE-Kibana]
title=HCE-Kibana
description=Kibana
ports=5601/tcp
$ sudo ufw allow from 203.0.113.5 to any app HCE-Kibana
Rule added
$ 
```

HCE-Kibana라는 이름을 사용했지만, 이름은 정하기 나름. 정확한 포트를 열기만
하면 된다.

이제, 아래와 같이 `ufw`를 다시 읽어주면,

```console
$ sudo ufw reload
Firewall reloaded
$ sudo ufw status
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere                  
HCE-Kibana                 ALLOW       203.0.113.5               
OpenSSH (v6)               ALLOW       Anywhere (v6)             

$ 
```

방화벽 설정이 끝나고, 접속이 가능한 상태가 된다. (아, 아직 서비스를 올린
것은 아니니 문만 열어둔 것이다.)


## Logstash의 설치와 구성

마지막으로 Logstash를 아래와 같이 동일한 방식으로 설치해준다. 역시 크기가
조금 큰데, E, L, K의 합이 약 500MB 안에 들어온다. 이 설치 용량, 즉 Disk
Footprint는 클라우드 상에 서비스를 올릴 때, 디스크 크기를 정하기 위해
참고할 수 있을 것이다.

```console
$ sudo apt-get install logstash
<...>
The following NEW packages will be installed:
  logstash
0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.
Need to get 114 MB of archives.
After this operation, 204 MB of additional disk space will be used.
<...>
$ 
```

설치가 끝났다면 구성을 해줘야 하는데, 보이지 않는 엔진인 Elasticsearch나
WUI이기 때문에 나중에 사용자와 상호작용할 Kibana와는 달리, Logstash는
서버 측에서 설정할 것이 꽤 많을 수 있다. 또한, 이 구성은 사용자의 용도나
활용에 따라 달라지는 부분이므로 딱 찍어서 "이거다"라고 할 것도 없다.

아래 기술된 부분은, 그럼에도 불구하고, 대체로 모든 구성에서 필요로 하거나
있어서 나쁠 것이 없는 Elastic Stack 자체에 대한 로그 수집과 디버깅을 위한
기초 설정을 하는 내용이다. (아직 경험이 많지 않지만, 지금까지의 모든 설치
과정에서 아래의 구성을 해왔다. 나는.)

```console
$ cat <<EOF |sudo tee /etc/logstash/conf.d/99-local-elastic.conf
> input {
>   file {
>     type => "syslog-local"
>     path => [ "/var/log/elasticsearch/*.log", "/var/log/logstash/*.log" ]
>   }
> }
> 
> output {
>   if [@metadata][output] != "self" {
>     elasticsearch {
>       hosts => ["127.0.0.1"]
>     }
>   }
>   if "_grokparsefailure" in [tags] {
>     stdout { codec => rubydebug { metadata => true } }
>   }
>   if "_debug" in [tags] {
>     stdout { codec => rubydebug { metadata => true } }
>   }
> }
> EOF
input {
  file {
    type => "syslog-local"
    path => [ "/var/log/elasticsearch/*.log", "/var/log/logstash/*.log" ]
  }
}

output {
  if [@metadata][output] != "self" {
    elasticsearch {
      hosts => ["127.0.0.1"]
    }
  }
  if "_grokparsefailure" in [tags] {
    stdout { codec => rubydebug { metadata => true } }
  }
  if "_debug" in [tags] {
    stdout { codec => rubydebug { metadata => true } }
  }
}
$ 
```

첫번째 `input` 부분은 파일시스템으로부터 자신의 로그를 읽어들이는 설정이고,
그 뒤의 `output` 부분은 별도의 설정이 없는 경우("self"라는 `output` 메타가
지정되지 않은 경우)에는 로컬 Elasticsearch에 데이터를 쌓도록 설정한 것이다.

아, 기존 버전에서도 사용했던 `_grokparsefailure`, `_debug` 태그가 있는 경우에
표준출력으로 디버깅 출력을 하는 부분은 왜인지 동작하지 않았다. (당장 급하지
않아서 왜 그런지, 더 보지는 않았다.)

이제 설치가 끝났으니 띄우자!



# 다 돌려라~!

먼저 Kibana의 새 얼굴을 보고싶으니 Kibana를 띄워봐야겠다. 그러나 Kibana는
Elasticsearch에 그 설정을 보관하기 때문에, 그리고 혼자서 할 수 있는 것이
하나도 없는 "인터페이스"일 뿐이므로, Elasticsearch를 먼저 띄워줘야 한다.

아래와 같이, `systemctl` 명령을 사용하여 새로 설치한 이들 서비스들을
활성화한 후, 하나씩 띄워보자.

```console
$ sudo systemctl daemon-reload
$ sudo systemctl enable elasticsearch.service 
Synchronizing state of elasticsearch.service with SysV init with /lib/systemd/systemd-sysv-install...
Executing /lib/systemd/systemd-sysv-install enable elasticsearch
Created symlink from /etc/systemd/system/multi-user.target.wants/elasticsearch.service to /usr/lib/systemd/system/elasticsearch.service.
$ sudo /bin/systemctl enable kibana.service
Synchronizing state of kibana.service with SysV init with /lib/systemd/systemd-sysv-install...
Executing /lib/systemd/systemd-sysv-install enable kibana
$ 
```

먼저 Elasticsearch를 띄우고, 상태를 보면 아래와 같이 정상적으로 적재되고
활성화된 것을 확인할 수 있다.

```console
$ sudo systemctl start elasticsearch.service 
$ sudo systemctl status elasticsearch.service 
● elasticsearch.service - Elasticsearch
   Loaded: loaded (/usr/lib/systemd/system/elasticsearch.service; enabled; vendor preset: enabled)
   Active: active (running) since Wed 2017-11-15 21:55:10 KST; 13s ago
     Docs: http://www.elastic.co
 Main PID: 1553 (java)
    Tasks: 42
   Memory: 1.1G
      CPU: 11.129s
   CGroup: /system.slice/elasticsearch.service
           └─1553 /usr/bin/java -Xms1g -Xmx1g -XX:+UseConcMarkSweepGC -XX:CMSInitiatingOccupancyFraction=75 -XX:+UseCMSInitiatingOccupancyOnly -XX:+AlwaysPreTouch -server -Xss1m -Djava.awt.headless=true -Dfile.encoding=UTF-8 -Djna.nosys=true -XX:-OmitStackTraceInFastThrow -Dio.netty.noUnsafe=true -Dio.netty.noKeySetOptimization=true -Dio.netty.recycler.maxCapacityPerThread=0 -Dlog4j.shutdownHookEnabled=false -Dlog4j2.disable.jmx=true -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/var/lib/elasticsearch -Des.path.home=/usr/share/elasticsearch -Des.path.conf=/etc/elasticsearch -cp /usr/share/elasticsearch/lib/* org.elasticsearch.bootstrap.Elasticsearch -p /var/run/elasticsearch/elasticsearch.pid --quiet

Nov 15 21:55:10 trends systemd[1]: Started Elasticsearch.
$ 
```

떴다고는 하는데 동작도 하는지? 그건 아래와 같이 상태정보를 확인하는 질의를
날려서 확인할 수 있다.

```console
$ curl -XGET 'localhost:9200/?pretty'
{
  "name" : "trends",
  "cluster_name" : "trends",
  "cluster_uuid" : "MrU8r9WmSB6D4HLa25UpaA",
  "version" : {
    "number" : "6.0.0",
    "build_hash" : "8f0685b",
    "build_date" : "2017-11-10T18:41:22.859Z",
    "build_snapshot" : false,
    "lucene_version" : "7.0.1",
    "minimum_wire_compatibility_version" : "5.6.0",
    "minimum_index_compatibility_version" : "5.0.0"
  },
  "tagline" : "You Know, for Search"
}
$ 
```

지정한 클러스터 이름을 사용해서 잘 떠 있는 것을 확인할 수 있다.

이제 동일한 방식으로 Kibana를 띄운다.


```console
$ sudo systemctl start kibana.service
$ sudo systemctl status kibana.service | more
● kibana.service - Kibana
   Loaded: loaded (/etc/systemd/system/kibana.service; enabled; vendor preset: e
nabled)
   Active: active (running) since Wed 2017-11-15 22:15:25 KST; 37s ago
 Main PID: 3246 (node)
    Tasks: 10
   Memory: 78.2M
      CPU: 3.645s
   CGroup: /system.slice/kibana.service
           └─3246 /usr/share/kibana/bin/../node/bin/node --no-warnings /usr/share/kibana/bin/../src/cli -c /etc/kibana/kibana.yml

Nov 15 22:15:25 trends systemd[1]: Started Kibana.
Nov 15 22:15:28 trends kibana[3246]: {"type":"log","@timestamp":"2017-11-15T13:15:28Z","tags":["status","plugin:kibana@6.0.0","info"],"pid":3246,"state":"green","message":"Status changed from uninitialized to green - Ready","prevState":"uninitialized","prevMsg":"uninitialized"}
Nov 15 22:15:28 trends kibana[3246]: {"type":"log","@timestamp":"2017-11-15T13:15:28Z","tags":["status","plugin:elasticsearch@6.0.0","info"],"pid":3246,"state":"yellow","message":"Status changed from uninitialized to yellow - Waiting for Elasticsearch","prevState":"uninitialized","prevMsg":"uninitialized"}
Nov 15 22:15:28 trends kibana[3246]: {"type":"log","@timestamp":"2017-11-15T13:15:28Z","tags":["status","plugin:console@6.0.0","info"],"pid":3246,"state":"green","message":"Status changed from uninitialized to green - Ready","prevState":"uninitialized","prevMsg":"uninitialized"}
Nov 15 22:15:28 trends kibana[3246]: {"type":"log","@timestamp":"2017-11-15T13:15:28Z","tags":["status","plugin:metrics@6.0.0","info"],"pid":3246,"state":"green","message":"Status changed from uninitialized to green - Ready","prevState":"uninitialized","prevMsg":"uninitialized"}
Nov 15 22:15:28 trends kibana[3246]: {"type":"log","@timestamp":"2017-11-15T13:15:28Z","tags":["status","plugin:timelion@6.0.0","info"],"pid":3246,"state":"green","message":"Status changed from uninitialized to green - Ready","prevState":"uninitialized","prevMsg":"uninitialized"}
Nov 15 22:15:28 trends kibana[3246]: {"type":"log","@timestamp":"2017-11-15T13:15:28Z","tags":["listening","info"],"pid":3246,"message":"Server running at http://localhost:5601"}
$ 
```

그리고 브라우져에서 열어보면,

![](/attachments/elastic-stack/kibana-6.0-init.png)

오... 뭔가 뜬다. (그러나 데이터가 아직 없으니 진수를 볼 수가 없다.)

데이터를 보려면 원하는 데이터를 받을 수 있도록 Logstash를 구성해야 하는데,
앞서 구성한 자체 로그에 대한 설정이 있으니 일단 그 설정만 있는 상태에서 한
번 띄워보자.

```console
$ sudo systemctl start logstash.service
$ sudo systemctl status logstash.service | more
● logstash.service - logstash
   Loaded: loaded (/etc/systemd/system/logstash.service; disabled; vendor preset
: enabled)
   Active: active (running) since Wed 2017-11-15 22:19:48 KST; 6s ago
 Main PID: 3530 (java)
    Tasks: 15
   Memory: 303.9M
      CPU: 12.530s
   CGroup: /system.slice/logstash.service
           └─3530 /usr/bin/java -XX:+UseParNewGC -XX:+UseConcMarkSweepGC -XX:CMSInitiatingOccupancyFraction=75 -XX:+UseCMSInitiatingOccupancyOnly -XX:+DisableExplicitGC -Djava.awt.headless=true -Dfile.encoding=UTF-8 -XX:+HeapDumpOnOutOfMemoryError -Xmx1g -Xms256m -Xss2048k -Djffi.boot.library.path=/usr/share/logstash/vendor/jruby/lib/jni -Xbootclasspath/a:/usr/share/logstash/vendor/jruby/lib/jruby.jar -classpath : -Djruby.home=/usr/share/logstash/vendor/jruby -Djruby.lib=/usr/share/logstash/vendor/jruby/lib -Djruby.script=jruby -Djruby.shell=/bin/sh org.jruby.Main /usr/share/logstash/lib/bootstrap/environment.rb logstash/runner.rb --path.settings /etc/logstash

Nov 15 22:19:48 trends systemd[1]: Started logstash.
$ 
```

이제 데이터도 볼 수 있겠다. (사실, 처음 기동하고 뜬 스샷이 아니다 보니, 이미
초기 기동 시 발생한 로그가 저만큼 가있다.)

![](/attachments/elastic-stack/kibana-6.0-discover.png)

특별하지 않게 느낄 수도 있지만, 내 시각에서 이전 버전의 화면 구성에 비해
발전했다고 느껴지는 부분 중 하나는 왼쪽으로 자리를 옮긴 브랜드와 주메뉴
부분이다. (그리고 그 아래 접는 버튼) 화면 구성에는 여러가지 이견이 있을
수 있겠지만, Kibana와 같이 다량의 데이터를 다루는 경우, "한 화면에 얼마나
많은 데이터를 표시할 수 있는가"도 매우 중요한 요소이다.  
이전 버전에서 항상 자리를 차지하고 있던 주메뉴가 옆으로 빠지면서, 이제
몇 줄이라도 더 화면에 표시할 수 있게 되었고, :-) 다른 관점에서는 Extension이
늘어날 경우에 메뉴가 추가될 수 있는 여유 공간을 확보하게 되었다.


새 버전의, 그러나 거의 동일한 방식으로 진행된 설치에 대한 얘기는 이걸로
접고, 다음 번에는 내가 요즘 작업하고 있는 시스템 이벤트를 모아서 그 속의
의미를 찾아내기 위한 분석환경을 구성한 얘기를 해보려고 한다.

*-- TO BE CONTINUED*


### 함께 읽기

이 글은 다음 묶음글을 위한 준비과정을 담은 글이다.
Elastic Stack을 이용한 이벤트 해석에 관심이 있다면 다음 글들도 함께!

* [모니터링은 경보가 아니라 해석]
* [Kibana Visual Builder로 이벤트 묶어 보기]
* [Kibana Heat Map으로 3차원으로 펼쳐 보기]

[모니터링은 경보가 아니라 해석]:{{< relref "/blog/cloudcomputing/2017-11-23-monitoring-is-not-alert-but-analytics.md" >}}
[Kibana Visual Builder로 이벤트 묶어 보기]:{{< relref "/blog/cloudcomputing/2017-11-24-aggregate-events-with-visual-builder.md" >}}
[Kibana Heat Map으로 3차원으로 펼쳐 보기]:{{< relref "/blog/cloudcomputing/2017-11-24-3dimensional-view-with-heat-map.md" >}}



[Elastic NMS Part 1: 엔진을 켜라!]:{{< relref "/blog/cloudcomputing/2017-10-28-elastic-nms-part1-start-your-engine.md" >}}
[Elastic NMS Part 2: Syslog 원격로깅]:{{< relref "/blog/cloudcomputing/2017-10-30-elastic-nms-part2-syslog-remote-logging.md" >}}
[Elastic NMS Part 3: Mapping과 Template]:{{< relref "/blog/cloudcomputing/2017-10-30-elastic-nms-part3-mapping-and-template.md" >}}
[Elastic NMS Part 4: Kibana로 Visualize하기]:{{< relref "/blog/cloudcomputing/2017-10-30-elastic-nms-part4-visualize-with-kibana.md" >}}
[Elastic NMS Part 5: NetFlow 수신하기]:{{< relref "/blog/cloudcomputing/2017-10-31-elastic-nms-part5-netflow-monitoring.md" >}}
[Elastic NMS Part 6: SNMP 수신하기]:{{< relref "/blog/cloudcomputing/2017-10-31-elastic-nms-part6-snmp-monitoring.md" >}}

