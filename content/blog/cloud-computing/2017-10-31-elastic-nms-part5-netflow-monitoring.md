---
title: "Elastic NMS Part 5: NetFlow 수신하기"
subtitle: Elastic Stack을 바탕으로 NMS 만들기
series: Elastic NMS
sisters: ["Calling All Logs"]
tags: ["elastic-stack", "NetFlow", "monitoring", "cloud-computing", "analytics"]
categories: ["cloud-computing"]
images: [/attachments/elastic-nms/elk-503-netflow-dashboard.png]
banner: /attachments/elastic-nms/elk-503-netflow-dashboard.png
date: 2017-10-31T01:00:00+0900
---
"아, 이건 기록을 안 해뒀네..." 하면서 그냥 잊으려 했는데, 메모를 정리하다가
발견해버렸다. ㅠ.ㅠ Elastic Stack으로 NetFlow와 SNMP 모니터링을 구성했던
이야기. NMS라고 하면서 SNMP와 NetFlow를 빼면 좀 섭하지... 했다가, 귀찮지만
닫았던 묶음글을 다시 열어서 마지막으로 이번 이야기, NetFlow와 SNMP 모니터링
하기를 더 넣는다. 그 중 NetFlow 먼저.
<!--more-->

이번 묶음글은 아래와 같은 순으로 진행할 예정이다. 깊이있게 다루는 것은 아니며,
Elastic Stack을 시작하는 입장에서 관심있는 부분을 참고하면 될 것 같다.

> {{< series >}}
{.boxed}

이 묶음글과 직접적인 관련은 없지만, 혹시 로그중앙화를 위한 간편한 솔루션을
찾는다면 이보다 앞서 검토했던 Graylog2에 대해 정리했던 글이 더욱 도움이 될
수도 있다. Graylog2는 로그중앙화와 검색, 경보발생 등이 가능한 매우 쉽고 잘
만들어진 도구다.

> {{< series "Calling All Logs" >}}
{.boxed}



# NetFlow와 SNMP

네트워크 모니터링을 얘기할 때, SNMP와 NetFlow는 따로 얘기할 필요가 없을
정도로 잘 알려진 관리용 프로토콜이다. 이 시험환경에서는 각 포트, 그러니까
네트워크 연결 단위의 성능측정을 위해 SNMP를 활용하여 Count 데이터를 모아
분석하고, 개별 서버나 서비스 단위의 성능측정 등을 위해 NetFlow를 활용한
데이터를 모아 분석할 수 있도록 구성해봤다.



# 구성 준비하기

하나의 분석 플랫폼으로 여러 형식의 데이터를 모아서 분석하려다 보니, 서로
다른 유형의 데이터를 하나의 인덱스에 몰아 넣은 것보다 각 형식에 따라서
인덱스를 구분하는 편이 좋겠다는 생각이 들었다. 그러나, 어떤 경우에는 별도
인덱스를 지정하지 않고 싶은 경우도 있고... 하여, 다음과 같이 기본 출력을
설정하고, 별도의 인덱스를 사용할 데이터는 그에 따른 별도의 출력 설정을
하는 방식을 택하게 되었다.

```ruby
output {
  if "no_default_out" not in [tags] {
    elasticsearch {
      hosts => ["127.0.0.1"]
    }
  }
  if "_grokparsefailure" in [tags] {
    stdout { codec => rubydebug }
  }
  if "_debug" in [tags] {
    stdout { codec => rubydebug }
  }
}
```

이제, `_grokparsefailure` 이나 명시적으로 `_debug` 태그를 달아준 메시지는
디버깅을 위한 출력을 추가로 하게 되고, 메시지에 `no_default_out`을 달아주면
기본 출력을 빗겨가게 된다.



# NetFlow 모니터링 구성하기

설정이 많아지면서 각 입력을 기준으로 설정파일을 나누어 관리하게 되었으며,
아래 설정은 NetFlow를 위한 초기 구성의 예이다.

`/etc/logstash/conf.d/20-netflow.conf`
{.block-title}

```ruby
input {
  udp {
    type => "netflow"
    tags => [ "no_default_out", "debug" ]
    port => "7455"
    codec => netflow {
    }
  }
}

filter {
}

output {
  if [type] == "netflow" {
    elasticsearch {
      hosts => ["127.0.0.1"]
      index => "nms-%{+YYYY.MM.dd}"
    }
  }
}
```

먼저, 맨 위의 입력 플러그인 설정을 보면 UDP 7455 포트로 입력되는 스트림을
잡아서, `no_default_out`과 `debug` 태그를 달어줬다. 앞서 설명한 바와 같이,
이 입력으로 들어온 모든 메시지는 두 태그가 부여되므로 기본 출력을 무시한
선별적인 인덱스에만 주입하는 것이 가능해졌고, `debug`가 지정되어 있는 동안
`rubydebug` 코덱을 활용한 표준로그 출력이 가능해졌다.

별도의 필터 플러그인은 주지 않았고, 입력 플러그인에서 `netflow`라는 이름의
코덱을 지정하여 이 입력으로 들어온 데이터의 해석방식을 지정하였다.

마지막으로 타입을 기반으로 `nms-`로 시작하는 인덱스에 그 값을 쌓도록 출력
설정을 하는 것으로 기본 설정은 끝났다. 이제, 로그파일을 열어봤을 때,
다음과 유사한 출력이 있다면 잘 동작하는 것이다.

```ruby
{
    "@timestamp" => "2016-09-09T15:33:01.623Z",
       "netflow" => {
                   "version" => 5,
              "flow_seq_num" => 3,
               "engine_type" => 0,
                 "engine_id" => 0,
        "sampling_algorithm" => 0,
         "sampling_interval" => 0,
              "flow_records" => 5,
             "ipv4_src_addr" => "192.0.2.11",
             "ipv4_dst_addr" => "198.51.100.7",
             "ipv4_next_hop" => "0.0.0.0",
                "input_snmp" => 9,
               "output_snmp" => 0,
                   "in_pkts" => 1,
                  "in_bytes" => 87,
            "first_switched" => "2016-09-09T15:28:00.623Z",
             "last_switched" => "2016-09-09T15:28:00.623Z",
               "l4_src_port" => 53,
               "l4_dst_port" => 35287,
                 "tcp_flags" => 0,
                  "protocol" => 17,
                   "src_tos" => 0,
                    "src_as" => 0,
                    "dst_as" => 0,
                  "src_mask" => 0,
                  "dst_mask" => 0
    },
      "@version" => "1",
          "tags" => [
        [0] "no_default_out",
        [1] "debug"
    ],
          "host" => "203.0.113.90"
}
```

물론, Kibana에 관련된 인덱스를 인식시키고 Discover를 해보면 뭔가 쌓이고
있는 것을 확인할 수 있을 것이다.

## Mapping 해주기

이것만으로도 수집에는 문제가 없고, 코덱을 활용하고 있으므로 받아온 값을
잘 만져주고 있을 것이라 예상한다. 그러나, 조금 Mapping을 이용해서 조금
다듬어주면 더 좋은 결과물이 나올 수 있을 것이다.

미리 계획하여 진행하는 경우이므로 이번에는 출력에 Template을 지정하는
방식이 아닌 미리 `PUT` 하여 구성해두는 방식을 써봤다.

```console
$ curl -XPUT localhost:9200/_template/nms -d @template-netflow.json
{"acknowledged":true}
$ 
```

위와 같이 `/_template/nms` 경로에 PUT 해주면 지정된 JSON이 Template으로
지정되게 된다. 지정한 JSON은 다음과 같은 모습니다.

```json
{
  "template" : "nms-*",
  "settings": {
    "index.refresh_interval": "5s"
  },
  "mappings" : {
    "_default_" : {
      "_all" : {"enabled" : false},
      "properties" : {
        "@version": { "index": "analyzed", "type": "integer" },
        "@timestamp": { "index": "analyzed", "type": "date" },
        "netflow": {
          "dynamic": true,
          "type": "object",
          "properties": {
            "version": { "index": "analyzed", "type": "integer" },
            "flow_seq_num": { "index": "not_analyzed", "type": "long" },
            "engine_type": { "index": "not_analyzed", "type": "integer" },
            "engine_id": { "index": "not_analyzed", "type": "integer" },
            "sampling_algorithm": {"index": "not_analyzed", "type": "integer" },
            "sampling_interval": { "index": "not_analyzed", "type": "integer" },
            "flow_records": { "index": "not_analyzed", "type": "integer" },
            "ipv4_src_addr": { "index": "analyzed", "type": "ip" },
            "ipv4_dst_addr": { "index": "analyzed", "type": "ip" },
            "ipv4_next_hop": { "index": "analyzed", "type": "ip" },
            "input_snmp": { "index": "not_analyzed", "type": "long" },
            "output_snmp": { "index": "not_analyzed", "type": "long" },
            "in_pkts": { "index": "analyzed", "type": "long" },
            "in_bytes": { "index": "analyzed", "type": "long" },
            "first_switched": { "index": "not_analyzed", "type": "date" },
            "last_switched": { "index": "not_analyzed", "type": "date" },
            "l4_src_port": { "index": "analyzed", "type": "long" },
            "l4_dst_port": { "index": "analyzed", "type": "long" }, 
            "tcp_flags": { "index": "analyzed", "type": "integer" },
            "protocol": { "index": "analyzed", "type": "integer" },
            "src_tos": { "index": "analyzed", "type": "integer" },
            "src_as": { "index": "analyzed", "type": "integer" },
            "dst_as": { "index": "analyzed", "type": "integer" },
            "src_mask": { "index": "analyzed", "type": "integer" },
            "dst_mask": { "index": "analyzed", "type": "integer" }
          }
        }
      }
    }
  }
}
```

(앞서 한 번 본 적이 있는 녀석이긴 하다.) 이제, 위의 설정에 의해 아래와
같이 정리된 결과를 얻을 수 있다.

![Netflow Index](/attachments/elastic-nms/elk-501-netflow-index.jpg)
{.fit .bordered}



## 코드값을 의미있는 문자로

매우 간단하게 설정을 끝냈다. 그런데 실제의 받아진 데이터를 열어보면,
부분적으로 가독성을 떨어뜨리는 부분이 있다. 가령, 프로토콜 필드에서 TCP는
TCP의 프로토콜 번호인 `6`으로 표시된다든지, 네트워크 인터페이스를 나타낼
때 역시 사람에게는 친숙하지가 않은 번호로 표현하게 된다. (심지어 이 경우는
각 서버마다 그것의 매핑을 외우는 것이 불가능하지 않은가?)

이것을 처리하기 위해서 다음과 같은 방식으로 커뮤니티 플러그인을 설치했다.

```console
$ /opt/logstash/bin/logstash-plugin install logstash-filter-translate
Validating logstash-filter-translate
Installing logstash-filter-translate
Installation successful
$ 
```

그리고 아까는 비워져 있던 필터 부분을 아래와 같이 채웠다.

```ruby
filter {
  if [type] == "netflow" {
    translate {
      field => "[netflow][protocol]"
      destination => "[nms][protocol]"
      dictionary => ["6","TCP", "17","UDP", "1","ICMP", "47","GRE", "50","ESP"]
    }
    translate {
      field => "[netflow][input_snmp]"
      destination => "[nms][interface]"
      dictionary => ["8","in", "9","sl", "10","dbz", "11","dev", "12","app" ]
      add_field => { "[nms][direction]" => "inbound" }
    }
    translate {
      field => "[netflow][output_snmp]"
      destination => "[nms][interface]"
      dictionary => ["8","in", "9","sl", "10","dbz", "11","dev", "12","app" ]
      add_field => { "[nms][direction]" => "outbound" }
    }
  }
}
```

쉽게 읽을 수 있는 내용인데, 그 중 맨 첫번째 줄을 보면, `netflow` 아래의
`protocol` 필드의 값을 그 아래의 `dictionay` 쌍에서 찾아서 매칭하는 값이
있으면 그 값을 `nms` 아래의 `protocol`에 넣어주는 식으로 protocol과
들어오고 나가는 인터페이스를 지정하고 있다. (그리고 NetFlow의 특성을
반영하여 값의 유무에 따라 방향성 정보를 `nms` 아래에 `direction` 필드에
넣어주었다.)

이제, 이렇게... 의도한 바에 맞는 데이터가 쌓이는 것을 확인할 수 있다.

![NetFlow Translated](/attachments/elastic-nms/elk-502-netflow-translated.jpg)
{.fit .bordered}

시험삼아서 파일을 하나 땡겨보자.

```console
$ date --rfc-3339=ns; time scp -pr 640MB server01:~/; date --rfc-3339=ns
2016-09-11 03:14:44.027913310+09:00
admin@server01's password: 
640MB                                  100%  638MB 939.4KB/s   11:36    

real	11m41.904s
user	0m1.432s
sys	0m1.284s
2016-09-11 03:26:25.932989193+09:00
$ 
```

별도의 지정을 하지 않았으니, 시스템 기준인 한국시간 기준으로 작년 9월 11일
03:14:44에 파일을 전송하기 시작했고, 전송이 끝난 것은 03:26:25 무렵이다.
그래놓고 해당 시점의 NetFlow 데이터를 확인해보면 다음과 같다. (길어서 몇
줄 지웠다)

```ruby
{
    "@timestamp" => "2016-09-10T19:27:01.109Z",
       "netflow" => {
                   "version" => 5,
              "flow_seq_num" => 220565,
              "flow_records" => 29,
             "ipv4_src_addr" => "59.187.195.212",
             "ipv4_dst_addr" => "161.202.38.90",
             "ipv4_next_hop" => "0.0.0.0",
                "input_snmp" => 8,
               "output_snmp" => 0,
                   "in_pkts" => 462967,
                  "in_bytes" => 694408445,
            "first_switched" => "2016-09-10T18:14:44.109Z",
             "last_switched" => "2016-09-10T18:26:26.109Z",
               "l4_src_port" => 42888,
               "l4_dst_port" => 22,
                 "tcp_flags" => 27,
                  "protocol" => 6
    },
          "host" => "161.202.38.90",
           "nms" => {
         "protocol" => "TCP",
        "interface" => "in",
        "direction" => "inbound"
    }
}
```

파일 전송이 시작된 시간(`first_switched`)와 종료된 시간(`last_switched`)을
포함해서 깔끔하게 전송 이력을 얻었다. 그런데 좀 아쉬운 것이, 맨 위의
메타 필드인 `@timestamp` 부분이다. 한 시간의 차이라니!


## 시간 데이터 바로잡기

아마도, 실제 Communication에 참여하지 않는 네트워크 장비 입장에서, 해당
연결에 대한 연결 유효시간을 명시적으로 확인할 길이 없으므로 연결 정보를
보관하고 추적하다가(ConnTrack), 일정 시간이 지나면 더 이상 이 연결은
활성화가 아니라는 판단을 한 후에 Flow 정보를 전송하기 때문일 것이다.

그러나 시계열 분석 시 기본값으로 사용되는 이 값이 실제 사건과 한 시간의
격차를 가지는 것은 다른 자료와의 연관 분석을 모호하게 할 가능성이 있다.
(물론, 일정 시간 동안 지속하여 일어나는 연결을 특정 시간에 귀속시킨다는
것도 명확한 것은 아니지만 말이다)

그래서, "받은 시간"도 유지하고 분석을 위한 시간도 편리하게 `@timestamp`로
사용하기 위해서 다음과 같은 방식을 적용했다.
 
```ruby
input {
  udp {
    type => "netflow"
    tags => [ "no_default_out", "_debug" ]
    port => "$port_netflow"
    codec => netflow
    add_field => [ "received_at", "%{@timestamp}" ]
  }
}
```

이제 입력을 받으면서 동시에 `received_at`이라는 값을 `@timestamp`로부터
뽑아서 만들어 넣는다. 그리고,

```ruby
filter {
  if [type] == "netflow" {
    date {
      match => [ "[netflow][last_switched]", "ISO8601" ]
    }
  }
}
```

이렇게, 임의의 선택이긴 한데, 마지막으로 데이터가 지나간 시간을 뽑아서
이 값으로 @timestamp를 바꿔주었다.

이제 좀 깔끔해졌다.


![Netflow Dashboard](/attachments/elastic-nms/elk-503-netflow-dashboard.png)
{.fit .bordered}


최종적으로, `translate`를 이용한 부가정보 입력과 일부 계산에 의한 필드 삽입
등을 포함하여, 최종적으로는 다음과 같은 설정을 적용하였다.

```ruby
input {
  udp {
    type => "netflow"
    port => "7455"
    codec => netflow
    add_field => { "received_at" => "%{@timestamp}" }
    add_field => { "[@metadata][output]" => "self" }
  }
}

filter {
  if [type] == "netflow" {
    mutate {
      add_field => { "[nms][pod]" => "%{host} pod" }
      add_field => { "[nms][account]" => "%{host} account" }
      add_field => { "[nms][hostname]" => "%{host} hostname" }
    }
    translate {
      field => "[nms][pod]"
      destination => "[nms][pod]"
      override => true
      dictionary_path => "/opt/hyeoncheon-elastic/conf/dict.device-map.yml"
    }
    translate {
      field => "[nms][account]"
      destination => "[nms][account]"
      override => true
      dictionary_path => "/opt/hyeoncheon-elastic/conf/dict.device-map.yml"
    }
    translate {
      field => "[nms][hostname]"
      destination => "[nms][hostname]"
      override => true
      dictionary_path => "/opt/hyeoncheon-elastic/conf/dict.device-map.yml"
    }

    translate {
      field => "[netflow][protocol]"
      destination => "[nms][protocol]"
      dictionary => ["6","TCP", "17","UDP", "1","ICMP", "47","GRE", "50","ESP"]
      fallback => "%{[netflow][protocol]}"
    }
    if [netflow][input_snmp] > 0 {
      mutate {
        add_field => { "[nms][zone]" => "%{host} ifno %{[netflow][input_snmp]}" }
        add_field => { "[nms][direction]" => "inbound" }
      }
    } else if [netflow][output_snmp] > 0 {
      mutate {
        add_field => { "[nms][zone]" => "%{host} ifno %{[netflow][output_snmp]}" }
        add_field => { "[nms][direction]" => "outbound" }
      }
    }
    translate {
      field => "[nms][zone]"
      destination => "[nms][zone]"
      override => true
      dictionary_path => "/opt/hyeoncheon-elastic/conf/dict.device-map.yml"
    }
    ruby {
      init => "require 'time'"
      code => "
        last = Time.iso8601(event['[netflow][last_switched]']).to_f;
        first = Time.iso8601(event['[netflow][first_switched]']).to_f;
        bits = event['[netflow][in_bytes]'] * 8;
        event['[nms][duration]'] = last - first;
        event['[nms][bps]'] = bits / (last - first) if (last - first) > 0;
      "
    }
    date {
      match => [ "[netflow][last_switched]", "ISO8601" ]
    }
    if [nms][direction] == "inbound" {
      mutate {
        add_field => { "[nms][session]" => "%{[netflow][ipv4_dst_addr]}:%{[netflow][l4_dst_port]}-%{[netflow][ipv4_src_addr]}:%{[netflow][l4_src_port]}" }
      }
    }
    if [nms][direction] == "outbound" {
      mutate {
        add_field => { "[nms][session]" => "%{[netflow][ipv4_src_addr]}:%{[netflow][l4_src_port]}-%{[netflow][ipv4_dst_addr]}:%{[netflow][l4_dst_port]}" }
      }
    }
  }
}

output {
  if [type] == "netflow" {
    elasticsearch {
      hosts => ["127.0.0.1"]
      index => "netflow-%{+YYYY.MM.dd}"
    }
  }
}
```

간략히 설명하면,

* 설정에 넣어 고정된 dictionary를 사용하지 않고 설정으로 분리한 파일을
  사용하여 Logstash의 재시작 없이 변경된 설정을 적용할 수 있게 하였고,
* 이를 이용하여 NetFlow를 전송한 서버명 등을 기반으로 고객 정보를 확인할
  수 있게 하였다. (`translate` 앞의 세 부분)
* 인터페이스를 확인하던 부분도, 위와 같은 방식을 적용하여 문자열 조합을
  기반으로 하여 Zone 정보를 받아올 수 있도록 개선하였다.
* 전송기간과 전송량을 기반으로 평균 전송율도 계산하여 넣어 봤다.
* 그리고 경보 발송을 위한 부분이긴 한데, 전송IP 및 포트번호를 기반으로
  가상의 세션 정보를 만들어 입력하였다.

`dict.device-map.yml` 파일은 다음과 같은 모양이다.

```yaml
169.56.66.5 pod: seo01
169.56.66.5 account: example.com
169.56.66.5 hostname: example_com.seo01.ftz.vr01
169.56.66.5 if bond1: fcz
169.56.66.5 if bond0: bcz
169.56.66.5 ifno 8: fcz
169.56.66.5 ifno 9: bcz
169.56.66.5 ifno 14: app
169.56.66.5 ifno 17: dbz
169.56.66.5 ifno 18: dmz
```


시험단계일 뿐이긴 하지만, 나름 쓸만한 정보를 잘 모은다. 한 시간 늦게.




[Elastic NMS Part 1: 엔진을 켜라!]:{{< relref "/blog/cloud-computing/2017-10-28-elastic-nms-part1-start-your-engine.md" >}}
[Elastic NMS Part 2: Syslog 원격로깅]:{{< relref "/blog/cloud-computing/2017-10-30-elastic-nms-part2-syslog-remote-logging.md" >}}
[Elastic NMS Part 3: Mapping과 Template]:{{< relref "/blog/cloud-computing/2017-10-30-elastic-nms-part3-mapping-and-template.md" >}}
[Elastic NMS Part 4: Kibana로 Visualize하기]:{{< relref "/blog/cloud-computing/2017-10-30-elastic-nms-part4-visualize-with-kibana.md" >}}
[Elastic NMS Part 5: NetFlow 수신하기]:{{< relref "/blog/cloud-computing/2017-10-31-elastic-nms-part5-netflow-monitoring.md" >}}
[Elastic NMS Part 6: SNMP 수신하기]:{{< relref "/blog/cloud-computing/2017-10-31-elastic-nms-part6-snmp-monitoring.md" >}}



[Calling All Logs! Graylog2 1편: 설치하기]:{{< relref "/blog/sysadmin/2017-10-11-calling-all-logs-graylog2-installation.md" >}}
[Calling All Logs! Graylog2 2편: 맛보기]:{{< relref "/blog/sysadmin/2017-10-12-calling-all-logs-graylog2-overview.md" >}}
[Calling All Logs! Graylog2 3편: 설정]:{{< relref "/blog/sysadmin/2017-10-13-calling-all-logs-graylog2-settings.md" >}}
[Calling All Logs! Graylog2 4편: 기록]:{{< relref "/blog/sysadmin/2017-10-13-calling-all-logs-graylog2-memories.md" >}}
[PaperTrail, Cloud에서는 Cloud 로그를!]:{{< relref "/blog/cloud-computing/2016-09-07-cloud-log-papertrail.md" >}}
[Cloud App에서 PaperTrail 사용하기]:{{< relref "/blog/cloud-computing/2016-09-07-using-papertrail.md" >}}

