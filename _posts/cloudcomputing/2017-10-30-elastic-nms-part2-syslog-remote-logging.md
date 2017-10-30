---
title: "Elastic NMS Part 2: Syslog 원격로깅"
subtitle: Elastic Stack을 바탕으로 NMS 만들기
tags: elastic-stack logging monitoring cloud-computing analytics
categories: ["cloudcomputing"]
image: /attachments/elastic-nms/elk-100-kibana.jpg
banner: /attachments/elastic-nms/elk-100-kibana.jpg
date: 2017-10-30T12:40:00+0900
---
앞선 [Elastic NMS Part 1: 엔진을 켜라!]에서는 자료분석 플랫폼 Elastic Stack을
설치하고 기본적인 동작을 확인하는 과정에 대해서 정리했다. 이제 구체적으로 이
환경의 기능을 검토할 차례인데, 내가 Elastic Stack을 활용하는 목적이 NMS, 특히
로그중앙화(Log Aggregation) 환경을 만드는 것이므로 로그를 수집하고 기본적인
파싱을 하는 과정을 먼저 진행했다.

이번 묶음글은 아래와 같은 순으로 진행할 예정이다. 깊이있게 다루는 것은 아니며,
Elastic Stack을 시작하는 입장에서 관심있는 부분을 참고하면 될 것 같다.

* [Elastic NMS Part 1: 엔진을 켜라!]
* _Elastic NMS Part 2: Syslog 원격로깅_
* [Elastic NMS Part 3: Mapping과 Template]
* [Elastic NMS Part 4: Kibana로 Visualize하기]

이 묶음글과 직접적인 관련은 없지만, 혹시 로그중앙화를 위한 간편한 솔루션을
찾는다면 이보다 앞서 검토했던 Graylog2에 대해 정리했던 글이 더욱 도움이 될
수도 있다. Graylog2는 로그중앙화와 검색, 경보발생 등이 가능한 매우 쉽고 잘
만들어진 도구다.

* [Calling All Logs! Graylog2 1편: 설치하기]
* [Calling All Logs! Graylog2 2편: 맛보기]
* [Calling All Logs! Graylog2 3편: 설정]
* [Calling All Logs! Graylog2 4편: 기록]


# 원격시스템으로부터 로그 입력

* TOC
{:toc .half.pull-right}

Unix, Linux를 비롯한 대부분의 서버들과 네트워크 장비들의 로그처리 시스템은
syslog를 표준으로 사용하거나 자체적인 로그관리 방법을 표준으로 하는 경우는
상호운용성을 위해 syslog를 병행하여 제공한다. **로그시스템의 사실상 표준인
syslog는 원격지 저장소로 로그를 전송하는 기능을 기본적으로 포함**하는데,
이 글에서도 이 기능을 이용하여 로그를 수집하려고 한다.

검토 중 살펴봤던 대부분의 문서는, 로그파일이 위치한 시스템에 직접 Logstash를
설치하고, `file` 입력 플러그인을 활용하여 파일을 읽어서 처리하는 형태로
설명된 경우가 많았다. 그러나 이 구성은, 그 로그파일이 Application 특유의
것이 아닌 syslog인 경우에는 불필요한 요소가 추가될 뿐만 아니라, 구성이 더욱
복잡해지고 오히려 syslog의 특성을 살리지 못하는 방식이다.

이 글에서는 이런 예제를 따르지 않고 syslog에 걸맞는 입력 설정을 할 것이다.
(대부분의 문서가 그런 방식으로 설명되어 있는 것을 보면, 아마도 syslog를
지원하는 입력 플러그인이 등장한 것이 그리 오래되지 않았나보다.)

특히, 내가 로그를 수집하고자 하는 대상은 프로그램의 설치와 구성이 자유로운
일반적인 서버 환경이 아니고 Appliance 형태의 일체형 "네트워크 장비"이기
때문에 `file` 입력을 사용하는 접근을 사용하는 것이 원천적으로 불가능하다.
이런 경우, 범용의 네트워크를 통한 입력 방식인 `tcp`나 `udp` 입력을 사용할
수도 있지만, 앞서 말한 바와 같이 **syslog의 특성을 제대로 활용하려면 전용의
`syslog` 입력 플러그인을 활용하는 것이 좋다.**

## syslog 입력 설정하기

아래의 설정은, TCP와 UDP 7514번 Port를 이용하여 syslog 형식의 입력을 받도록
하는 설정이다. 표준 syslog 포트인 514번을 쓰면 더 좋겠지만, 그렇게 하려면
Logstash를 root 권한으로 올려야 하는 문제가 발생하므로 이렇게 별도의 포트를
사용하록 설정했다.

```ruby
input {
  syslog {
    port => "7514"
    type => "syslog"
  }
}
```

### 표준 포트로 입력 받기

[Calling All Logs! Graylog2 2편: 맛보기#입력구성 - 로그 받기]에 설명한
내용과 동일한 내용인데, syslog 전송 포트를 수정할 수 없는 장비가 있다든지,
대상 장비가 너무 많아 모두 설정을 변경하기 보다는 기존의 중앙로그 서버의
IP를 유지한 채 수집기 솔루션만 바꿀 생각이라면, 아래와 같이 Logstash가
탑재된 수집서버의 Port Forwarding 설정을 통해 해결할 수도 있다.

```console
$ cat |sudo tee -a /etc/ufw/before.rules <<EOF
> 
> # Logstash remote syslog
> *nat
> :PREROUTING ACCEPT [0:0]
> :POSTROUTING ACCEPT [0:0]
> -F
> -A PREROUTING -p udp -m udp --dport 514 -j REDIRECT --to-ports 7514
> -A PREROUTING -p tcp -m tcp --dport 514 -j REDIRECT --to-ports 7514
> COMMIT
> # Logstash remote syslog
> EOF

# Logstash remote syslog
*nat
:PREROUTING ACCEPT [0:0]
:POSTROUTING ACCEPT [0:0]
-F
-A PREROUTING -p udp -m udp --dport 514 -j REDIRECT --to-ports 7514
-A PREROUTING -p tcp -m tcp --dport 514 -j REDIRECT --to-ports 7514
COMMIT
# Logstash remote syslog

$ sudo ufw reload
Firewall reloaded
$ 
```

Port Forward 설정에 대하여 보다 명확하게 정리하기 위해서 위의 부분을
추가하였다. 방화벽이 있는 경우 `7514` 포트 자체에 대한 방화벽 설정도
필요하지만, 그 내용은
[Calling All Logs! Graylog2 2편: 맛보기#입력구성 - 로그 받기] 부분을
참고하면 될 것 같다.


## File, TCP, UDP 입력과의 차이

만약, syslog 형식의 파일을 `file` 입력이나 `udp`, `tcp` 방식으로 받을 경우,
입력된 데이터는 단지 한 줄의 텍스트 메시지일 뿐이므로 이것을 다시 syslog
형식으로 해석할 수 있도록 파싱해줘야 활용할 가치가 생긴다. 아래의 구문은,
이처럼 `syslog` 입력이 아닌 기타 방식의 입력으로 받은 경우에 이것의 구문을
해석하는 방식의 예다.

```ruby
filter {
  if [type] == "syslog" {
    grok {
      match => { "message" => "%{SYSLOGTIMESTAMP:syslog_timestamp} %{SYSLOGHOST:syslog_hostname} %{DATA:syslog_program}(?:\[%{POSINT:syslog_pid}\])?: %{GREEDYDATA:syslog_message}" }
      add_field => [ "received_at", "%{@timestamp}" ]
      add_field => [ "received_from", "%{host}" ]
    }
    date {
      match => [ "syslog_timestamp", "MMM  d HH:mm:ss", "MMM dd HH:mm:ss" ]
    }
  }
}
```

이 경우, 확인할 수 있는 정보의 양이 `grok` 구문에서 얼추 볼 수 있듯이,
`syslog_timestamp`, `syslog_hostname`, `syslog_program`과 `syslog_pid`,
그리고 `syslog_message` 등, syslog 메시지 텍스트에 담긴 것으로 한정된다.
하지만 `syslog` 입력 플러그인을 사용할 경우에는, 텍스트 구문해석이 아닌
**syslog 전송 규약에 의해 데이터를 수집**하는 것이기 때문에 `facility`,
`priority`, `severity` 등의 상세한 정보까지 정확하게 뽑아낼 수 있다.

![SHOT](/attachments/elastic-nms/elk-201-discover.jpg){:.bordered}

위의 그림은 기록된 syslog 데이터 한 줄을 Discovery 화면에서 본 것이다.
왼쪽부터 기록된 날짜, 타입 정보, 그리고 메시지 본문이 표시되는데, 맨 왼쪽
세모표를 누르면 아래와 같이 이 레코드에 대한 상세 정보를 확인할 수 있다.

![SHOT](/attachments/elastic-nms/elk-202-details.jpg){:.bordered}

위의 상세 정보를 보면 내부적으로 사용하는 `_`로 시작하는 메타 정보와 메시지
본문 외에도, 앞서 말했던 `facility`, `priority`, `severity` 등의 syslog 
고유의 데이터가 함께 기록된 것을 알 수 있다.

위의 로그는 Linux 기반 방화벽에서 사용하는 방화벽 로그이다. (iptables 형식)
분석되어 저장된 필드를 보면, syslog 수준의 상세 데이터를 표시하고 있지만
특정 애플리케이션, 이 경우 `iptables` 고유의 데이터는 한 줄의 텍스트로
뭉쳐진 채로 표현되고 있기 때문에 이걸 활용하여 방화벽 상황을 분석하는데는
한계가 있다. 결국, 문자열로 내용을 검색하는 것은 가능하지만 특정한 특성을
기반으로 **현상을 분석하는 것은 이 상태에서는 힘들다**는 뜻이다.



# 로그 내용과 목적에 맞게 필터링하기

이렇게, 입력 플러그인에 의해 수집된 원시데이터는 데이터의 성격과 최종적으로
사용하고자 하는 목적에 따라 적당히 다음어질 필요가 있는데, 이렇게 데이터를
구문분석기 등을 이용하여 적절히 자르거나, 자른 값들을 조합하거나, 그 값을
기반으로 새로운 값을 만들어 내는 등, **사용자의 목적에 따라 데이터를
전체적으로 만져주는 과정은 `filter` 플러그인을 통해서 처리**하게 된다. 이미
`syslog`가 아닌 입력으로 받은 로그를 잘라서 각 필드로 구분하는 예에서 살짝
그 맛을 봤다.

입력과 마찬가지로 Logstash는 다양한 필터 플러그인이 제공하지만 이 글에서는
방화벽 로그 분석에 필요한 것을 중심으로 몇 가지만 확인할 것이다.


## Grok 필터: 로그 구문분석

**Grok**이라는 것이 어디서 온 것인지는 잘 모르겠다. 내 경우에, 이번 검토를
통해 처음 알게 된 것인데, 나의 이해를 가지고 설명하자면, "기존의 정규표현식
등과 유사하게 **문자열을 구문분석(Parsing)하는 도구**로, 보다 쉬운, 또는
**사람이 읽고 쓰기에 친숙한 표현식**을 사용할 수 있도록 하기 위하여, 미리
정의되어 **이름이 붙여진 패턴을 사용**할 수 있도록 해주는 분석기" 정도로
표현할 수 있을 것 같다.

우리는 코드를 보는 것이 더 편한 사람들이니, 코드를 먼저 본다.

```ruby
filter {
  if [type] == "syslog" {
    grok {
      match => { "message" => "IN=(%{DATA:fw_if_in})? OUT=(%{DATA:fw_if_out})? (MAC=%{DATA} )?SRC=%{IP:fw_src_ip} DST=%{IP:fw_dst_ip} LEN=%{NUMBER:fw_len:int} %{GREEDYDATA:fw_tcp_opts} PROTO=%{WORD:fw_proto} SPT=%{INT:fw_src_port} DPT=%{INT:fw_dst_port} %{GREEDYDATA:fw_tcp_opts}" }
      add_tag => [ "iptables" ]
      add_field => {
      }
    }
  }
}
```

위의 내용을 풀이해보면, 먼저 `filter`라는 키워드로 이 부분이 필터 처리를
위한 부분임을 명시하고 있다. 그 바로 안쪽의 `if`로 둘러쌓인 블록은 특정
조건을 기반으로 필터의 처리를 할 것인지 아닌지 결정한다. 그 안에 `grok`
이라는 블록이 다시 나타나는데, 이게 실제로 입력 데이터의 특정 부분으로부터
원하는 값을 발라내게 위한 부분이다.

`grok` 블록의 내부를 보면 `match`라는 키워드가 있는데, 이 부분이 Grok의
핵심적인 부분이다. 그 안쪽 값을 보면 `"message"` 라는 부분과 그 뒤를 따르는
부분으로 구분할 수 있는데, 먼저 `"message"`는 "어디서"에 해당하며, 뒤쪽
절은 그 곳에서 기대할 수 있는 문자열의 구조를 기술하는 부분이 된다. 다시
말해서, `"message"`의 내용이 이 구조 구문으로 정확하게 구문해석이 된다면
Grok 처리가 정상적으로 된 것이며, 이렇게 정상적으로 해석이 가능할 때에
한하여 그 아래의 `add_tag`, `add_field` 등의 후속처리가 진행된다. 이 예를
사람의 언어로 써보면, "**... 이런 형태를 message에서 찾아보고, 찾았다면
`"iptables"` 라는 태그를 붙여**"라는 뜻이다.

위의 구조를 다시 보면, 원칙적으로 `if` 블록을 벋겨 내도 동작하는데 지장이
없는데, Grok 해석에 대해 얘기한 것처럼, 전체적으로 구조에 일치하지 않으면
결과가 나오지 않기 때문이다. 그럼에도 불구하고 `if` 문이 필요한 이유는,
만약 이 분석시스템을 이용하여 syslog가 아닌 다른 형식의 데이터를 함께
다룰 경우, 불필요한 grok 연산을 피할 수 있기 때문이다. (이 외에도 이런
저런 특징이 있지만 생략)

이 조건제어를 위한 `if`를 제외하고 생각하면, 필터의 구성은 `filter` 블록
내에 복수의 필터 플러그인을 배치하는 것으로 쉽게 이해할 수 있다.

### Grok Debugger

Graylog2에 대해 소개했던 글 중
[Calling All Logs! Graylog2 2편: 맛보기#편리한 Extractor 설정] 부분에서,
Graylog2는 이러한 Grok을 이용한 구문분석 설정을 관리 화면에서 아주 쉽게
할 수 있다는 것을 이미 설명한 바 있다. 그러나 Logstash를 포함한 Elastic
Stack은... 뭐랄까 최종 사용자용이 아닌 "엔진"에 가깝다. 심지어는 멋진
대시보드 역할을 하는 Kibana에도, 그런 것은 없다.

그렇다고 Logstash 구성을 바꾸고, 돌려보고, 다시 수정하면서 작업을 할 수는
없다. 이 때 편리하게 사용할 수 있는 도구가 [Grok Debugger]이다.

[Grok Debugger]:https://grokdebug.herokuapp.com/

이 도구를 이용하면, 이미 수집된 로그를 예제로 하여 Grok 패턴을 바꿔가면서
설정을 시험해볼 수 있다. Graylog2 만큼의 맞춤형 깔끔함은 기대하긴 힘들지만
기능은 빠지지 않는다.

![](/attachments/elastic-nms/grokdebug.heroku.com.png){:.bordered}

### Grok 조금 더 보기

Grok을 설정할 때, 여러 필터를 두루 거치도록 설정하는 것도 가능하고,
적당한 시점에(매칭이 되면) 필터 처리를 멈추게 할 수도 있다. 이를 위해서
앞서 봤던 tag 등을 활용하게 되는데, 위의 예에서는 Grok 처리의 성공 실패
여부에 따라 `iptables` 태그를 부여했으니 그 이후 단계에서는 이 값을
가지고 있는지 아닌지에 따라 추가 필터 적용을 선택적으로 처리할 수 있다.

예를 들어,

```ruby
filter {
  <...>
  if "iptables" in [tags] {
    BLOCK_FOR_IPTABLES
  }
}
```

앞선 필터 아래 어딘가에 이런 구문이 있다고 가정을 하면, 앞선 Grok 검색에
만족하여 `iptables`라는 태그가 붙은 메시지에 한하여 이 필터를 타게 된다.

전체적인 구성을 하면서 최종적으로 아주 유용하게 사용한 태그 조건이 하나
더 있는데, 바로 `_grokparsefailure`라는 태그다. 이 태그는, 메시지가 Grok
필터에 들어갔는데 결과가 실패로 끝났을 때 자동으로 부여되는 태그이다.
이것을 사용하면, 필터가 정상적으로 동작하는지 확인하거나 불필요한 곳에
들어가는 일이 있거나, 또는 미처 확인하지 못한 새로운 형태의 로그가 발생한
경우에 그것을 쉽게 찾아낼 수 있게 해준다.

출력 플러그인에 대해서는 다시 얘기하겠지만, 아래의 예는 이 Grok이 실패한
경우에 붙는 특별한 태그를 활용하여 세부적인 로그를 표준출력으로 던지는,
그래서 Logstash의 로그에 남도록 해주는 설정이다.

```ruby
output {
  if "_grokparsefailure" in [tags] {
    stdout { codec => rubydebug }
  }
}
```

위의 설정에 의한 출력은 `/var/log/logstash/logstash.stdout` 파일에 남게
되며, 그 내용은 대충 아래와 같다.

```ruby
{
           "message" => "pam_unix(cron:session): session closed for user root",
          "@version" => "1",
        "@timestamp" => "2016-09-09T01:05:01.000Z",
              "type" => "syslog",
       "received_at" => "2016-09-09T01:05:01.948Z",
              "tags" => [
        [0] "no_default_out",
        [1] "_grokparsefailure"
    ],
              "host" => "203.0.113.90",
          "priority" => 86,
         "timestamp" => "Sep  9 10:05:01",
         "logsource" => "vr-czportal-1",
           "program" => "CRON",
               "pid" => "25974",
          "severity" => 6,
          "facility" => 10,
    "facility_label" => "security/authorization",
    "severity_label" => "Informational"
}
```

"아, 사용자 세션이 끊긴 경우에 대한 로그 처리가 빠졌구나"라든지... "아,
CRON에 의한 로그를 예외처리하는 필터를 추가해야겠구나"라든지, 결정하고,
처리할 수 있다.


## GeoIP 필터: 위치정보 추가

예전에는 많이 못보던 내용인데, 근래에는 네트워크 활동에 대한 로그를 추적할
때 자주 등장하는 것이 바로 GeoIP이다. 이름에서 느낌이 오듯이, IP 주소와
실제 지리적 주소를 연계시키는 기술 또는 기법인데, Logstash는 이것을 활용할
수 있는 방법을 필터 형태로 제공한다.

일단 설정을 보자.

```ruby
filter {
  if [type] == "syslog" {
    grok {
      match => FIREWALL_MATCH_BLOCK
      add_tag => [ "iptables" ]
      add_field => {
      }
    }
  }
  if [fw_src_ip] {
    geoip {
      source => "fw_src_ip"
      target => "src_geo"
      fields => [ "city_name", "country_code3", "location", "ip" ]
    }
  }
  if [fw_dst_ip] {
    geoip {
      source => "fw_dst_ip"
      target => "dst_geo"
      fields => [ "city_name", "country_code3", "location", "ip" ]
    }
  }
}
```

첫번째 `if` 블록은 이미 살펴본 `iptables` 로그에 대한 Grok 필터이다.
이 필터를 정상적으로 통과하였고, 그 내용이 L3 영역의 통신이어서 IP 주소
정보가 들어있었다면 출발지 주소를 나타내는 `fw_src_ip`라는 필드가 새롭게
설정되었을 것이다. 그리고 도착지 주소를 나타내는 `fw_dst_ip`라는 필드도
만들어졌을 것이다. 이 두 값이 만들어진 경우에 한하여, 그 값을 이용한
GeoIP 정보를 추가하기 위해,  두 번째, 세 번째의 `if` 블록을 추가하였다.

마지막 부분의 `fw_dst_ip` 부분을 보면, 이 값이 존재할 경우에, `geoip`
필터를 사용하도록 하며, IP 정보는 `source`로 지정된 `"fw_dst_ip"`에서
가져오고, 생성된 GeoIP 정보는 `dst_geo`라는 이름의 필드 그룹을 이용하고,
그 아래에 `city_name`, `country_code3`, `location`, `ip` 등의 필드를
만들라는 설정이다.

처리된 결과를 보면 아래와 같다. 맨 아래 줄의 도착지 IP 정보를 기반으로
위쪽 세 줄을 만들었는데, 확인된 나라는 `CHE`라는 세 자리 국가코드를
쓰는 스위스이고(두 자리 코드로는 `CH`) `location` 부분의 두 숫자는
대략적인 8과 47은 대략적인 경도와 위도를 나타낸다. (스위스 수도 격인
베른의 좌표가 북위 47, 동경 7.5 쯤 된다.)

![SHOT](/attachments/elastic-nms/elk-212-grok-parsed.jpg){:.bordered}

그런데 화면 맨 왼쪽의 회색 부분의 기호를 자세히 보면, 좌표를 숫자로
인식하고 IP는 텍스트로 인식하고 있다.(`#` 기호와 `t` 기호) 이래서는
정상적으로 지리적인 통계를 내는 것이 불가능하다. Logstash가 만들어낸
데이터를 Elasticsearch에게 정상적인 자료형으로 인식시키기 위해서는
Template의 작성이 필요할 수 있다. 이 얘기는 다음 이야기,
[Elastic NMS Part 3: Mapping과 Template]에서 조금 더 다룰 예정이다.

아무튼, Template과 Mapping 처리를 잘 해주면 각 필드의 자료형을 우리가
원하는 형태로 맞춰줄 수 있다.

![SHOT](/attachments/elastic-nms/elk-302-mapped-parsed.jpg){:.bordered}

이제 이렇게, 정상적으로 IP와 위치정보 자료형으로 아이콘이 바뀌었다.



# 원하는 방향으로 출력하기

출력에 대해 이야기하기 전에, 먼저 **Logstash가 전체 Architecture에서 갖는
위상**에 대하여 잠깐 이야기하려 한다. 활용하는 형태에 따라 다양할 수 있는
얘기지만, 보통 Logstash는 다음과 같은 두 가지 형태의 위상으로 구성하는
것이 일반적인 것 같다. 하나는 수집한 로그, 데이터를 바로 Elasticsearch
등의 최종 목적지에 넣어주는 **Shipper** 형태의 구성이고, 다른 하나는
자신은 단순히 자료 취합에 집중하고 후처리를 다른 Logstash에게 위임하기
위해 전달을 하는 **Forwarder** 형태가 그것이다.

이렇게 나누는 이유는 여러가지가 있을텐데,

1. 단순이 입력량이 많은 경우에 Forwarder는 입력을 받는 임무와 버릴 데이터의
   구분에 집중한다든지, 또는
1. 버리지 않더라도 입력자료의 형태에 따라서 서로 다른 방향으로 전달하기
   위해서일 수도 있다. 
1. 그리고 다중가입자 환경에서 입력지점을 가입자에 따라 나누고, 그에 걸맞는
   보안설정을 하되 분석시스템 자체는 하나의 틀을 쓰는 경우가 있을 수 있고,
1. 반대로 가입자와 관계없이 입력은 단일 창구를 써서 통일하되, 분기
   Forwarding을 하여 가입자별 분석계를 분리하는 경우도 있을 수 있겠다.

이 글에서는, 단순히 하나의 Shipper 구성으로 시험을 했을 뿐이지만 앞으로
설명할 내용을 응용하면 위에 열거한 다양한 구성을 할 수 있는 힌트는 될
것 같다.


## 선택적 Pipeline

앞서 필터에서 조건에 따라 다른 처리를 할 수 있음을 간단히 설명했다.
그리고 그 예 중의 하나로 `_grokparsefailure` 값을 이용한 디버그 출력을
들었었다. 아래의 예는 이와 함께, syslog에 대한 기본출력 부분을 더하여
분기 가능한 출력의 단순한 예를 보여주고 있다.


```ruby
output {
  if [type] == "syslog" {
    elasticsearch {
      hosts => ["127.0.0.1"]
      index => "syslog-%{+YYYY.MM.dd}"
    }
  }
  if "_grokparsefailure" in [tags] {
    stdout { codec => rubydebug }
  }
}
```

위의 구성은 먼저 형태가 syslog인 자료를 `elasticsearch`라는 출력 플러그인을
통해 `127.0.0.1`에 위치한 Elasticsearch의 `syslog-날짜형식` 인덱스에 넣는
설정이 있고, 그 아래에는 이와 동시에, 혹시 그 자료에 `_grokparsefailure`라는
태그가 있을 경우에는 추가로 표준출력에 디버깅 메시지를 보내도록 설정하고
있다.


## Template 설정하기

앞서 GeoIP에 대한 이야기를 하다가, 자료형 입력을 명시적으로 하기 위해
Template을 사용할 수 있다는 얘기를 했다. 이 설정은 Elasticsearch에 저장될
때 반영되어야 하는 것으로 실제로는 출력 구성에 설정되는데, 아래와 같이,
`template`, `template_name` 등을 설정하면 된다.

```ruby
output {
  if [type] == "syslog" {
    elasticsearch {
      hosts => ["127.0.0.1"]
      index => "syslog-%{+YYYY.MM.dd}"
      template => "/opt/hyeoncheon-elastic/conf/syslog-template.json"
      template_name => "syslog"
    }
  }
  if "_grokparsefailure" in [tags] {
    stdout { codec => rubydebug }
  }
}
```

Template에 대한 자세한 얘기는 다음 편에 이어서...


### 이 묶음의 다른 글들

* [Elastic NMS Part 1: 엔진을 켜라!]
* _Elastic NMS Part 2: Syslog 원격로깅_
* [Elastic NMS Part 3: Mapping과 Template]
* [Elastic NMS Part 4: Kibana로 Visualize하기]

[Elastic NMS Part 1: 엔진을 켜라!]:{% link _posts/cloudcomputing/2017-10-28-elastic-nms-part1-start-your-engine.md %}
[Elastic NMS Part 3: Mapping과 Template]:{% link _posts/cloudcomputing/2017-10-30-elastic-nms-part3-mapping-and-template.md %}
[Elastic NMS Part 4: Kibana로 Visualize하기]:{% link _posts/cloudcomputing/2017-10-30-elastic-nms-part4-visualize-with-kibana.md %}

### 함께 읽기

* [Calling All Logs! Graylog2 1편: 설치하기]
* [Calling All Logs! Graylog2 2편: 맛보기]
* [Calling All Logs! Graylog2 3편: 설정]
* [Calling All Logs! Graylog2 4편: 기록]
* [PaperTrail, Cloud에서는 Cloud 로그를!]
* [Cloud App에서 PaperTrail 사용하기]


[Calling All Logs! Graylog2 1편: 설치하기]:{% link _posts/sysadmin/2017-10-11-calling-all-logs-graylog2-installation.md %}
[Calling All Logs! Graylog2 2편: 맛보기]:{% link _posts/sysadmin/2017-10-12-calling-all-logs-graylog2-overview.md %}
[Calling All Logs! Graylog2 3편: 설정]:{% link _posts/sysadmin/2017-10-13-calling-all-logs-graylog2-settings.md %}
[Calling All Logs! Graylog2 4편: 기록]:{% link _posts/sysadmin/2017-10-13-calling-all-logs-graylog2-memories.md %}
[PaperTrail, Cloud에서는 Cloud 로그를!]:{% link _posts/cloudcomputing/2016-09-07-cloud-log-papertrail.md %}
[Cloud App에서 PaperTrail 사용하기]:{% link _posts/cloudcomputing/2016-09-07-using-papertrail.md %}

[Calling All Logs! Graylog2 2편: 맛보기#입력구성 - 로그 받기]:{% link _posts/sysadmin/2017-10-12-calling-all-logs-graylog2-overview.md %}#입력구성---로그-받기
[Calling All Logs! Graylog2 2편: 맛보기#편리한 Extractor 설정]:{% link _posts/sysadmin/2017-10-12-calling-all-logs-graylog2-overview.md %}#편리한-extractor-설정
