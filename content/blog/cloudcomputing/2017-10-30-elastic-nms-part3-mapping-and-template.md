---
title: "Elastic NMS Part 3: Mapping과 Template"
subtitle: Elastic Stack을 바탕으로 NMS 만들기
tags: ["elastic-stack", "logging", "monitoring", "cloud-computing", "analytics"]
categories: ["cloudcomputing"]
image: /attachments/elastic-nms/elastic-architecture.png
date: 2017-10-30T13:45:00+0900
---
Elastic Stack은 사용자가 원하는 다양한 유형의 자료를 저장하고, 검색하고,
분석할 수 있는 범용의 분석 플랫폼이다. Elastic Stack은 기본적으로 다루는
자료의 형식을 제한하거나 가리지 않으며 흔히 말하는 "비정형 자료"를 "모두"
소화다고 말할 수 있지만, 의미있는 분석을 효과적으로 하기 위해서는 자료의
의미, 즉 자료형에 대한 고려가 필요하며, 개별 자료를 어떻게 다룰 것인지에
대한 정의가 필요하다.  이 글은, Elasticsearch가 자료를 다루는 방식과
자료형을 사용자가 정의하는 방법에 대하여 정리한다.

이번 묶음글은 아래와 같은 순으로 진행할 예정이다. 깊이있게 다루는 것은 아니며,
Elastic Stack을 시작하는 입장에서 관심있는 부분을 참고하면 될 것 같다.

* [Elastic NMS Part 1: 엔진을 켜라!]
* [Elastic NMS Part 2: Syslog 원격로깅]
* _Elastic NMS Part 3: Mapping과 Template_
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



# Mapping과 Template

* TOC
{:toc .half.pull-right}

Elasticsearch가 인덱스에 자료를 저장할 때, **그것을 어떻게 다룰 것이며,
어떤 자료형으로 처리할 것인지 등을 정의하는 것을 Mapping**이라고 한다.
이러한 Mapping 정의와 인덱스 설정 등을 담아 두었다가 **인덱스가 생성될
때 자동으로 참고할 수 있도록 해주는 것이 Template**이다.

앞선 글 [Elastic NMS Part 2: Syslog 원격로깅]의 끝자락을 다시보면, 처음
자료를 받도록 설정했을 때에는 모든 자료가 아래와 같이 단순히 숫자 또는
텍스트로 인식되었었다.

![SHOT](/attachments/elastic-nms/elk-212-grok-parsed.jpg)

그리고 Template을 통해 Mapping 구성을 해주고 나니,

![SHOT](/attachments/elastic-nms/elk-302-mapped-parsed.jpg)

이렇게 Elasticsearch가 각각의 필드에 대하여 의미있는 형식으로 인식하게
되었다. 이렇게 각 필드를 인식하는 방법이 달라지면, Elasticsearch가 각
필드를 이용하여 분석하거나 검색할 수 있는 내용과 한계가 달라진다.



# Mapping

이미 설명한 바와 같이 Mapping은 저장된 자료의 각 필드에 대한 성격을 규정하는
방식이다. 앞서 본 예에서와 같이 자료의 형에 대하여 정의함으로써, 숫자를 숫자
답게 다루고 좌표를 좌표 답게 다룰 뿐만 아니라, 문자열의 부분을 자연어 처럼
검색할 것인지 하나의 단어처럼 인식할 것인지 등에 대해서도 정의할 수 있다.


## 맵 확인하기

이미 생성되어 있는 인덱스가 어떤 Mapping을 사용하고 있는지는 Mapping을 담고
있는 Template을 확인해보면 알 수 있다. 아래와 같이, `curl` 명령을 사용하여
기본 Template을 확인해보자.

```console
$ curl -XGET http://localhost:9200/_template?pretty
{
  "logstash" : {
    "order" : 0,
    "template" : "logstash-*",
    "settings" : {
      "index" : {
        "refresh_interval" : "5s"
      }
    },
    <...>
$ 
```

뭔가 JSON 형식의 것을 가져왔다. 이걸 따서 따로 보면 아래와 같다.


```json
{
  "logstash" : {
    "order" : 0,
    "template" : "logstash-*",
    "settings" : {
      "index" : {
        "refresh_interval" : "5s"
      }
    },
    "mappings" : {
      "_default_" : {
        "dynamic_templates" : [ {
          "message_field" : {
            "mapping" : {
              "fielddata" : {
                "format" : "disabled"
              },
              "index" : "analyzed",
              "omit_norms" : true,
              "type" : "string"
            },
            "match_mapping_type" : "string",
            "match" : "message"
          }
        }, {
          "string_fields" : {
            "mapping" : {
              "fielddata" : {
                "format" : "disabled"
              },
              "index" : "analyzed",
              "omit_norms" : true,
              "type" : "string",
              "fields" : {
                "raw" : {
                  "ignore_above" : 256,
                  "index" : "not_analyzed",
                  "type" : "string"
                }
              }
            },
            "match_mapping_type" : "string",
            "match" : "*"
          }
        } ],
        "_all" : {
          "omit_norms" : true,
          "enabled" : true
        },
        "properties" : {
          "@timestamp" : {
            "type" : "date"
          },
          "geoip" : {
            "dynamic" : true,
            "properties" : {
              "ip" : {
                "type" : "ip"
              },
              "latitude" : {
                "type" : "float"
              },
              "location" : {
                "type" : "geo_point"
              },
              "longitude" : {
                "type" : "float"
              }
            }
          },
          "@version" : {
            "index" : "not_analyzed",
            "type" : "string"
          }
        }
      }
    },
    "aliases" : { }
  }
}
```

(오래된 기억이라 잘 기억이 나지 않는다만,) 위의 내용을 보면 `mappings`라는
키워드 아래에 `_default_` 라는 Mapping이 담겨 있고, 그 안에는 다시 `_all`,
`dynamic_templates`, `properties` 등의 설정이 되어있다는 것을 확인할 수
있다. 이 중 특히, `dynamic_templates` 부분을 보면 `message`라는 이름에 대한
`message_field`와 나머지 모든 필드와 매칭되는 `string_fields`를 정의하고
있다.


## 사용자 Mapping의 적용

이 묶음글에서는 Linux기반 방화벽을 중심으로 NMS를 구성하는 작업을 하고 있고,
앞선 글에서는 방화벽 로그를 가져오고 구문분석을 통해 사용할 수 있는 필드로
잘라서 저장하는 과정을 진행했다. 이 자료에 Mapping을 추가하려면, 다음과 같은
두 방식을 사용할 수 있다.


### Elasticsearch의 API를 이용하여

단순한 방식인데, 앞서 Template을 확인했던 것과 유사하게 사용자 Template을
API를 이용해서 이미 존재하는 인덱스에 적용하는 방식이다. `curl` 명령을 써서
다음 예 처럼,

```console
$ curl -XPUT http://localhost:9200/syslog-2016.09.09 -d @syslog-template.json
{"acknowledged":true}
$ 
```

응답이 긍정적으로 왔으니 적용이 잘 되었을 것이다.


### Logstash의 출력 플러그인에 적용하여

이 방식은 앞서 [Elastic NMS Part 2: Syslog 원격로깅#Template 설정하기]에서
잠깐 살펴봤던 방식이다.

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
}
```

위와 같이, Logstash에서 Elasticsearch로 출력을 할 때, `template` 키워드를
이용하여 Template 정의를 담고 있는 파일을 지정해주면 Elasticsearch에게 자료가
전달되고 인덱스를 생성할 때 자동으로 해당 Template의 내용을 참고하여 필드를
만들어주게 된다.



# NMS를 위한 Template

이번 글은 기억도 가물가물하고... 양으로 좀 승부를 해야겠다. (하긴, 내 글들은
대체로 그래왔던 것 같기는 하다.)

## Linux Firewall을 위한 Template

Syslog와 NetFilter 방화벽에 대한 로그를 위한 Template은 아래와 같다.

```json
{
  "template" : "syslog-*",
  "settings" : {
    "index" : {
      "refresh_interval" : "5s"
    }
  },
  "mappings" : {
    "_default_" : {
      "_all" : {"enabled" : true, "omit_norms" : true},
      "dynamic_templates": [ {
        "ip_addresses": {
          "match": "*_ip",
          "match_mapping_type" : "string",
          "mapping": {
            "type": "ip"
          }
        }
      }, {
        "geoips": {
          "match":   "*_geo",
          "match_mapping_type" : "*",
          "mapping": {
            "properties" : {
              "city_name" : { "index": "not_analyzed", "type": "string" },
              "country_code3" : { "index": "not_analyzed", "type": "string" },
              "location" : { "type": "geo_point" },
              "ip" : { "type": "ip" }
            }
          }
        }
      }, {
        "firewall_fields": {
          "match":   "fw_*",
          "match_mapping_type" : "string",
          "mapping": { "type": "string", "index": "not_analyzed" }
        }
      } ],
      "properties" : {
        "@timestamp": { "type": "date" },
        "@version": { "type": "string", "index": "not_analyzed" },
        "logsource" : { "type" : "string", "index": "not_analyzed" },
        "event" : { "type" : "string", "index": "not_analyzed" },
        "isakmp_id" : { "type" : "integer", "index": "not_analyzed" },
        "ipsec_id" : { "type" : "integer", "index": "not_analyzed" },
        "ipsec_id_old" : { "type" : "integer", "index": "not_analyzed" },
        "ipsec_peer_addr" : { "type" : "ip", "index": "not_analyzed" },
        "ipsec_mode" : { "type" : "string", "index": "not_analyzed" },
        "sudo_by" : { "type" : "string", "index": "not_analyzed" },
        "sudo_tty" : { "type" : "string", "index": "not_analyzed" },
        "sudo_pwd" : { "type" : "string", "index": "not_analyzed" },
        "sudo_user" : { "type" : "string", "index": "not_analyzed" },
        "sudo_command" : { "type" : "string", "index": "not_analyzed" },
        "remote_action" : { "type" : "string", "index": "not_analyzed" },
        "remote_status" : { "type" : "string", "index": "not_analyzed" },
        "remote_user" : { "type" : "string", "index": "not_analyzed" },
        "remote_addr" : { "type" : "ip", "index": "not_analyzed" },
        "nms": {
          "dynamic": true,
          "type": "object",
          "properties": {
            "hostname": { "index": "not_analyzed", "type": "string" },
            "account": { "index": "not_analyzed", "type": "string" },
            "zone": { "index": "not_analyzed", "type": "string" },
            "from": { "index": "not_analyzed", "type": "string" },
            "pod": { "index": "not_analyzed", "type": "string" }
          }
        }
      }
    }
  }
}
```

눈여겨 볼 부분은,

* `*_ip` 매칭을 이용하여 `_ip`로 끝나는 필드가 있다면 IP주소로 인식하도록
  설정하고 있으며,
* `*_geo` 매칭을 이용하여 `_geo`라고 끝나는 것은 `city_name`, `location` 등의
  GeoIP 정보를 담고 있다는 것을 명시하고 각 하위 값에 대하여 적절한 형식을
  지정하고 있다.
* 동시에 `city_name`, `country_code3` 등을 `not_analyzed`로 설정하여 이 필드에
  대한 부분검색을 막아주었다.
* `fw_*` 매칭을 사용하여 `firewall_fields`를 별도로 정의해주는 부분도 참고할
  만 하다.

그 결과는 아래와 같이, 인덱스의 필드 목록에서 확인할 수 있다.

![SHOT](/attachments/elastic-nms/elk-301-mapped-index.jpg)



## SNMP를 위한 Template

아래의 Template은 이 글에서 아직 등장하지 않았던 부분이지만, 별도의 SNMP
Poller를 이용하여 SNMP 자료를 모으도록 구성을 했었는데, 이렇게 수집된 SNMP
자료를 처리하기 위한 Template이다. SNMP를 긁어서 넣어주는 내용은 다음에
기회가 되면...

```json
{
  "template" : "snmp-*",
  "settings": {
    "index.refresh_interval": "5s"
  },
  "mappings" : {
    "_default_" : {
      "_all" : {"enabled" : false},
      "properties" : {
        "host": { "index": "not_analyzed", "type": "string" },
        "device": { "index": "not_analyzed", "type": "string" },
        "ifname": { "index": "not_analyzed", "type": "string" },
        "ifindex": { "index": "not_analyzed", "type": "integer" },
        "ifname": { "index": "not_analyzed", "type": "string" },
        "iftype": { "index": "not_analyzed", "type": "integer" },
        "ifmtu": { "index": "not_analyzed", "type": "integer" },
        "ifphysaddress": { "index": "not_analyzed", "type": "string" },
        "ifadminstatus": { "index": "not_analyzed", "type": "integer" },
        "ifoperstatus": { "index": "not_analyzed", "type": "integer" },
        "iflastchange": { "index": "not_analyzed", "type": "date" },
        "ifinoctets": { "index": "not_analyzed", "type": "long" },
        "ifinerrors": { "index": "not_analyzed", "type": "long" },
        "ifoutoctets": { "index": "not_analyzed", "type": "long" },
        "ifouterrors": { "index": "not_analyzed", "type": "long" },
        "ifspeed": { "index": "not_analyzed", "type": "integer" },
        "rx_bps": { "index": "not_analyzed", "type": "double" },
        "tx_bps": { "index": "not_analyzed", "type": "double" },
        "proxy": { "index": "not_analyzed", "type": "string" },
        "ping_name": { "index": "not_analyzed", "type": "string" },
        "ping_addr": { "index": "not_analyzed", "type": "string" },
        "ping_port": { "index": "not_analyzed", "type": "string" },
        "ping_count": { "index": "not_analyzed", "type": "integer" },
        "ping_rtt_ms": { "index": "not_analyzed", "type": "float" },
        "nms": {
          "dynamic": true,
          "type": "object",
          "properties": {
            "hostname": { "index": "not_analyzed", "type": "string" },
            "account": { "index": "not_analyzed", "type": "string" },
            "zone": { "index": "not_analyzed", "type": "string" },
            "pod": { "index": "not_analyzed", "type": "string" }
          }
        }
      }
    }
  }
}
```

이번 예에는, 아주 단순하게, 딱 잡아 지정한 케이스만 있다.


## NetFlow를 위한 Template

아래의 설정은 Logstash에서 지원하는 NetFlow를 위한 입력 플러그인을 활용하여
수집한 데이터를 Mapping한 예이다. 특별할 것은 없지만 이 경우에는 관련된
필드들이 `netflow` 아래에 모여있다 보니 좀 눈으로 보기에 편하게 정리가
된 것 같다.

```json
{
  "template" : "netflow-*",
  "settings": {
    "index.refresh_interval": "5s"
  },
  "mappings" : {
    "_default_" : {
      "_all" : {"enabled" : false},
      "properties" : {
        "@version": { "index": "analyzed", "type": "integer" },
        "@timestamp": { "index": "analyzed", "type": "date" },
        "nms": {
          "dynamic": true,
          "type": "object",
          "properties": {
            "hostname": { "index": "not_analyzed", "type": "string" },
            "account": { "index": "not_analyzed", "type": "string" },
            "pod": { "index": "not_analyzed", "type": "string" },
            "zone": { "index": "not_analyzed", "type": "string" },
            "direction": { "index": "not_analyzed", "type": "string" },
            "protocol": { "index": "not_analyzed", "type": "string" },
            "session": { "index": "not_analyzed", "type": "string" },
            "duration": { "index": "not_analyzed", "type": "float" },
            "bps": { "index": "not_analyzed", "type": "float" }
          }
        },
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


이렇게 Mapping 기능과 Template을 활용하여 내 자료를 내 입맛에 맞게 설정할
수 있게 되었다. 별것 아닌 것 같다. 하지만 실제로 써보면, 단지 문자열 기반의
로그분석만 하는 것이 아닌 경우라면 이 Mapping이 얼마나 유용한 것인지 느낄
수 있을 것이다.



### 이 묶음의 다른 글들

* [Elastic NMS Part 1: 엔진을 켜라!]
* [Elastic NMS Part 2: Syslog 원격로깅]
* _Elastic NMS Part 3: Mapping과 Template_
* [Elastic NMS Part 4: Kibana로 Visualize하기]
* [Elastic NMS Part 5: NetFlow 수신하기]
* [Elastic NMS Part 6: SNMP 수신하기]

[Elastic NMS Part 1: 엔진을 켜라!]:{{< relref "/blog/cloudcomputing/2017-10-28-elastic-nms-part1-start-your-engine.md" >}}
[Elastic NMS Part 2: Syslog 원격로깅]:{{< relref "/blog/cloudcomputing/2017-10-30-elastic-nms-part2-syslog-remote-logging.md" >}}
[Elastic NMS Part 4: Kibana로 Visualize하기]:{{< relref "/blog/cloudcomputing/2017-10-30-elastic-nms-part4-visualize-with-kibana.md" >}}
[Elastic NMS Part 5: NetFlow 수신하기]:{{< relref "/blog/cloudcomputing/2017-10-31-elastic-nms-part5-netflow-monitoring.md" >}}
[Elastic NMS Part 6: SNMP 수신하기]:{{< relref "/blog/cloudcomputing/2017-10-31-elastic-nms-part6-snmp-monitoring.md" >}}

[Elastic NMS Part 2: Syslog 원격로깅#Template 설정하기]:{{< relref "/blog/cloudcomputing/2017-10-30-elastic-nms-part2-syslog-remote-logging.md" >}}#template-설정하기

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
[PaperTrail, Cloud에서는 Cloud 로그를!]:{{< relref "/blog/cloudcomputing/2016-09-07-cloud-log-papertrail.md" >}}
[Cloud App에서 PaperTrail 사용하기]:{{< relref "/blog/cloudcomputing/2016-09-07-using-papertrail.md" >}}

