---
title: "Calling All Logs! Graylog2 4편: 기록"
subtitle: 모든 로그를 한 곳에서 관리하고 분석하세요
tags: ["Graylog2", "logging", "monitoring", "cloud-computing"]
categories: ["sysadmin"]
repository: https://github.com/hyeoncheon/goul
image: /attachments/graylog2/graylog-icon.jpg
date: 2017-10-13T10:30:00+09:00
---
[Graylog]는 짧은 시간 동안 시험을 했지만 꽤 만족스러웠던 시스템이었다.
Tenant 지원이라든지 일부 기능이 나의 요구사항과 맞지 않아서 최종적으로
채택하지 않았지만, 전반적인 Concept이나 살짝씩 읽어지는 그 뒤에 깔린
철학적인 부분이 기억에 남아, 세 편의 설명글과 함께, 당시의 설정을
여기에 남긴다.

![](/attachments/graylog2/graylog-logo.png)

이 이야기는 설치, 맛보기, 추가설정, 그리고 자잘한 기록을 담은 네 편의
글로 이루어져 있다. 내용이 독립적이어서 순서에 큰 관계가 없으니 원하는
글부터 읽어도 된다. (마지막편은 읽을 것이 없어요)

* [Calling All Logs! Graylog2 1편: 설치하기]
* [Calling All Logs! Graylog2 2편: 맛보기]
* [Calling All Logs! Graylog2 3편: 추가설정]
* _Calling All Logs! Graylog2 4편: 기록_

> 오픈소스 로그분석 시스템인 [Graylog]에 대한 문서는 [Graylog Docs]에서
> 찾을 수 있으며, [Graylog Github]에서 그 소스를 받아볼 수 있다.


## 설정의 기록

정말이다 읽은 거리는 없다. 단지, 이 곳에서 두 개의 파일을 원본으로 링크하고,
어차피 텍스트인 그 파일들을 나중에라도 읽어보기 쉽게 넣어두었을 뿐이다.

* [설치 스트립트 (deploy-graylog.sh)](/attachments/graylog2/deploy-graylog.sh)
* [Content Pack 최종버전?](/attachments/graylog2/graylog-syslog-v0.6.json)


## Deploy Script

설사 딱 한 번을 설치하더라고 꼭 스크립트로 만들어 훗날을 도모하는 못된
버릇으로 인하여, 이 스크립트를 작성했으며, 딱 한 번 사용했다. (첫 번째
설치는 수동으로 한 스텝 한 스텝 진행했고, 한 번 갈아엎으면서 썼었을...)

{:wrap}
```shell
#!/bin/bash

set -xe

ES_CONF=/etc/elasticsearch/elasticsearch.yml
GL_REPO=https://packages.graylog2.org/repo/packages
GL_RPKG=graylog-2.0-repository_latest.deb
GL_CONF=/etc/graylog/server/server.conf

#
#
# ----------------------------------------------------------------------------
install="sudo apt-get install -y"

#
# prerequirements
$install apt-transport-https openjdk-8-jre-headless uuid-runtime pwgen

#
# mongodb
$install mongodb-server

#
# elasticsearch
wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch \
	| sudo apt-key add -
echo "deb https://packages.elastic.co/elasticsearch/2.x/debian stable main" \
	| sudo tee -a /etc/apt/sources.list.d/elasticsearch-2.x.list
sudo apt-get update
$install elasticsearch

sudo cp -a $ES_CONF $ES_CONF.dist
sudo sed -i 's/.*cluster.name: .*/cluster.name: graylog/' $ES_CONF
sudo cat $ES_CONF |grep -v ^#

sudo systemctl daemon-reload
sudo systemctl enable elasticsearch.service
sudo systemctl restart elasticsearch.service
sudo systemctl status elasticsearch.service

#
# graylog
wget $GL_REPO/$GL_RPKG
sudo dpkg -i $GL_RPKG
sudo apt-get update

$install graylog-server

sudo cp -a $GL_CONF $GL_CONF.dist
spw=`pwgen -N 1 -s 96`
rpw=`echo -n 'p4ssw0rd' | shasum -a 256 |cut -d' ' -f1`
sudo sed -i "s/^password_secret.*/password_secret = $spw/" $GL_CONF
sudo sed -i "s/^root_password_sha2.*/root_password_sha2 = $rpw/" $GL_CONF
cat $GL_CONF |grep '^\(root_password\|password\)'

# addons
SL_REPO=https://github.com/Graylog2/graylog-plugin-slack/releases/download
SL_VERS=2.2.1
SL_DPKG=graylog-plugin-slack-$SL_VERS.deb
wget $SL_REPO/$SL_VERS/$SL_DPKG
sudo dpkg -i $SL_DPKG

NF_REPO=https://github.com/Graylog2/graylog-plugin-netflow/releases/download
NF_VERS=0.1.1
NF_DPKG=graylog-plugin-netflow-$NF_VERS.deb
wget $NF_REPO/$NF_VERS/$NF_DPKG
sudo dpkg -i $NF_DPKG



GDB_URL=http://geolite.maxmind.com/download/geoip/database/GeoLite2-City.mmdb.gz
GDB_FILE=/var/local/graylog/GeoLite2-City.mmdb
sudo mkdir /var/local/graylog
wget -nv $GDB_URL -O - |zcat |sudo tee $GDB_FILE >/dev/null

# starting
sudo systemctl daemon-reload
sudo systemctl enable graylog-server.service
sudo systemctl restart graylog-server.service
sudo systemctl status graylog-server.service

#
# nginx
$install nginx-extras

cat |sudo tee /etc/nginx/sites-available/graylog >/dev/null <<EOF
server {
  listen      80 default_server;
  listen      [::]:80 default_server ipv6only=on;
  server_name logger.example.com;

  location /api/ {
    proxy_set_header    Host \$http_host;
    proxy_set_header    X-Forwarded-Host \$host;
    proxy_set_header    X-Forwarded-Server \$host;
    proxy_set_header    X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_pass          http://127.0.0.1:12900/;
  }
  location / {
    proxy_set_header    Host \$http_host;
    proxy_set_header    X-Forwarded-Host \$host;
    proxy_set_header    X-Forwarded-Server \$host;
    proxy_set_header    X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header    X-Graylog-Server-URL http://logger.example.com/api;
    proxy_pass          http://127.0.0.1:9000;
  }
}
EOF

sudo rm /etc/nginx/sites-enabled/default
sudo ln -s ../sites-available/graylog /etc/nginx/sites-enabled/

sudo systemctl restart nginx.service
sudo systemctl status nginx.service

#
# firewall
cat |sudo tee /etc/ufw/applications.d/graylog >/dev/null <<EOF
[Graylog]
title=Graylog Inputs
description=Graylog Inputs
ports=5140/udp
EOF

cat |sudo tee -a /etc/ufw/before.rules >/dev/null <<EOF

# For Graylog's Syslog Input - START
*nat
:PREROUTING ACCEPT [0:0]
:POSTROUTING ACCEPT [0:0]
-F
-A PREROUTING -p udp -m udp --dport 514 -j REDIRECT --to-ports 5140
COMMIT
# For Graylog's Syslog Input - END
EOF

sudo ufw allow 'Nginx Full'
sudo ufw allow Graylog
sudo ufw disable && sudo ufw enable

```


## Content Pack

세 번째 이야기에서 설명한 설정 백업 방식인 Content Pack의 결과다. 이것은
설정을 백업하거나 복구하기 위해 사용할 수도 있고, 단지 미리 만든 구성을
배포하는 용도로도 사용할 수 있다.


```json
{
   "inputs" : [
      {
         "title" : "SNMP UDP",
         "static_fields" : {},
         "type" : "org.graylog.snmp.input.SnmpUDPInput",
         "extractors" : [],
         "configuration" : {
            "mibs_path" : "",
            "port" : 1620,
            "recv_buffer_size" : 262144,
            "override_source" : null,
            "bind_address" : "0.0.0.0"
         },
         "global" : true
      },
      {
         "title" : "NetFlow UDP",
         "configuration" : {
            "port" : 2055,
            "recv_buffer_size" : 262144,
            "override_source" : null,
            "bind_address" : "0.0.0.0"
         },
         "global" : true,
         "type" : "org.graylog.plugins.netflow.inputs.NetFlowUdpInput",
         "static_fields" : {},
         "extractors" : []
      },
      {
         "title" : "Standard Syslog on UDP 5140",
         "type" : "org.graylog2.inputs.syslog.udp.SyslogUDPInput",
         "static_fields" : {},
         "extractors" : [
            {
               "title" : "Application by Regex",
               "cursor_strategy" : "COPY",
               "target_field" : "application",
               "type" : "REGEX",
               "source_field" : "message",
               "configuration" : {
                  "regex_value" : "^[^ ]* ([^:^\\[]+)[:\\[]"
               },
               "condition_type" : "NONE",
               "condition_value" : "",
               "converters" : [],
               "order" : 0
            },
            {
               "order" : 6,
               "converters" : [],
               "source_field" : "message",
               "target_field" : "dummy",
               "type" : "GROK",
               "condition_type" : "NONE",
               "condition_value" : "",
               "configuration" : {
                  "grok_pattern" : "CTRL: Client %{IPV4:pptp_addr} control connection %{GREEDYDATA:pptp_action}"
               },
               "title" : "PPTPD Connection Info",
               "cursor_strategy" : "COPY"
            },
            {
               "order" : 1,
               "converters" : [],
               "condition_type" : "STRING",
               "condition_value" : "vf_",
               "configuration" : {
                  "grok_pattern" : "\\[vf_%{DATA:fw_name}-%{DATA:fw_rule}-%{GREEDYDATA:fw_action}\\].* SRC=%{IPV4:fw_src_ip} DST=%{IPV4:fw_dst_ip} .*PROTO=%{DATA:fw_proto} .*SPT=%{BASE10NUM:fw_src_port} DPT=%{BASE10NUM:fw_dst_port}"
               },
               "target_field" : "dummy",
               "type" : "GROK",
               "source_field" : "message",
               "title" : "Firewall by Grok",
               "cursor_strategy" : "COPY"
            },
            {
               "configuration" : {
                  "grok_pattern" : "Accepted password for %{GREEDYDATA:user_accepted} from %{IPV4:remote_addr}"
               },
               "condition_value" : "Accepted password",
               "condition_type" : "STRING",
               "source_field" : "message",
               "target_field" : "dummy",
               "type" : "GROK",
               "title" : "Accepted password for SSH",
               "cursor_strategy" : "COPY",
               "converters" : [],
               "order" : 3
            },
            {
               "title" : "Failed password for ",
               "cursor_strategy" : "COPY",
               "source_field" : "message",
               "type" : "GROK",
               "target_field" : "dummy",
               "configuration" : {
                  "grok_pattern" : "Failed %{WORD:UNWANTED} for%{GREEDYDATA:UNWANTED} %{USERNAME:user_failed} from %{IPV4:remote_addr}"
               },
               "condition_value" : "Failed",
               "condition_type" : "STRING",
               "converters" : [],
               "order" : 4
            },
            {
               "converters" : [],
               "order" : 5,
               "type" : "GROK",
               "source_field" : "message",
               "target_field" : "",
               "configuration" : {
                  "grok_pattern" : "Invalid user %{USERNAME:user_failed} from %{IPV4:remote_addr}"
               },
               "condition_value" : "Invalid user",
               "condition_type" : "STRING",
               "title" : "Invalid user from",
               "cursor_strategy" : "COPY"
            },
            {
               "title" : "UFW Logs",
               "cursor_strategy" : "COPY",
               "condition_type" : "STRING",
               "condition_value" : "UFW BLOCK",
               "configuration" : {
                  "grok_pattern" : "\\[%{WORD:fw_name} %{WORD:fw_action}\\].* SRC=%{IPV4:fw_src_ip} DST=%{IPV4:fw_dst_ip} .*PROTO=%{DATA:fw_proto} .*SPT=%{BASE10NUM:fw_src_port} DPT=%{BASE10NUM:fw_dst_port}"
               },
               "type" : "GROK",
               "target_field" : "",
               "source_field" : "message",
               "order" : 2,
               "converters" : []
            }
         ],
         "global" : true,
         "configuration" : {
            "allow_override_date" : true,
            "force_rdns" : false,
            "bind_address" : "0.0.0.0",
            "store_full_message" : false,
            "recv_buffer_size" : 1048576,
            "port" : 5140,
            "override_source" : null,
            "expand_structured_data" : false
         }
      }
   ],
   "name" : "Standard Syslog for Linux/vRouter v0.6",
   "category" : "SCX System Admin",
   "streams" : [
      {
         "disabled" : true,
         "description" : "When sshd is invoked",
         "stream_rules" : [
            {
               "value" : ".*(Failed|Accepted).*",
               "inverted" : false,
               "field" : "message",
               "type" : "REGEX"
            },
            {
               "field" : "application",
               "type" : "EXACT",
               "value" : "sshd",
               "inverted" : false
            }
         ],
         "matching_type" : "AND",
         "outputs" : [
            "57ae048a3b553a0860100a12"
         ],
         "title" : "SEC:Remote Access",
         "id" : "57b6fc7a3b553a0860197509"
      },
      {
         "matching_type" : "AND",
         "stream_rules" : [
            {
               "field" : "level",
               "type" : "SMALLER",
               "value" : "3",
               "inverted" : false
            }
         ],
         "description" : "Log Level 0 to 2",
         "disabled" : true,
         "outputs" : [
            "57ae03a63b553a0860100920"
         ],
         "id" : "57b6fc7a3b553a086019750f",
         "title" : "Critical Event!"
      },
      {
         "outputs" : [
            "57b6f8d13b553a086019711e"
         ],
         "title" : "VRRP Failover",
         "id" : "57b6fc7a3b553a0860197507",
         "stream_rules" : [
            {
               "inverted" : false,
               "value" : ".*Syncing instances to MASTER state.*",
               "type" : "REGEX",
               "field" : "message"
            }
         ],
         "disabled" : true,
         "description" : "Syncing instances to MASTER state",
         "matching_type" : "AND"
      },
      {
         "description" : "Cloud Z Specific Logs",
         "disabled" : true,
         "stream_rules" : [
            {
               "inverted" : false,
               "value" : "SCX",
               "type" : "EXACT",
               "field" : "application"
            }
         ],
         "matching_type" : "AND",
         "outputs" : [
            "57b6f8d13b553a086019711e"
         ],
         "title" : "SCX Alert",
         "id" : "57b6fc7a3b553a0860197511"
      },
      {
         "outputs" : [
            "57b6f8d13b553a086019711e"
         ],
         "title" : "SEC:urity Errors",
         "id" : "57b6fc7a3b553a0860197513",
         "matching_type" : "AND",
         "description" : "Security Logs Emergency, Alert, Critical, and Error",
         "disabled" : true,
         "stream_rules" : [
            {
               "inverted" : false,
               "value" : "security.*",
               "field" : "facility",
               "type" : "REGEX"
            },
            {
               "inverted" : true,
               "value" : "CRON",
               "type" : "EXACT",
               "field" : "application"
            },
            {
               "type" : "SMALLER",
               "field" : "level",
               "value" : "4",
               "inverted" : false
            }
         ]
      },
      {
         "matching_type" : "AND",
         "description" : "Heavy Attack",
         "disabled" : true,
         "stream_rules" : [
            {
               "inverted" : false,
               "value" : "in2.*",
               "field" : "fw_name",
               "type" : "REGEX"
            },
            {
               "field" : "fw_action",
               "type" : "EXACT",
               "value" : "D",
               "inverted" : false
            }
         ],
         "outputs" : [],
         "id" : "57b6fc7a3b553a086019750c",
         "title" : "Heavy Attack"
      }
   ],
   "description" : "Standard Syslog for Linux/vRouter v0.6",
   "grok_patterns" : [],
   "outputs" : [
      {
         "id" : "57ae03a63b553a0860100920",
         "title" : "Slack alert for Critical Events",
         "configuration" : {
            "link_names" : true,
            "notify_channel" : false,
            "webhook_url" : "https://hooks.slack.com/services/T00000J0T/B0000000S/I00000l00000F00000Z0000h",
            "channel" : "@user",
            "color" : "#FF0000",
            "icon_emoji" : ":cold_sweat:",
            "add_attachment" : false,
            "icon_url" : "",
            "user_name" : "Graylog",
            "graylog2_url" : "http://logger.example.com",
            "short_mode" : true
         },
         "type" : "org.graylog2.plugins.slack.output.SlackMessageOutput"
      },
      {
         "id" : "57ae048a3b553a0860100a12",
         "title" : "Slack alert for SEC:Remote Access",
         "configuration" : {
            "user_name" : "Graylog",
            "graylog2_url" : "http://logger.example.com",
            "short_mode" : true,
            "icon_url" : "",
            "add_attachment" : false,
            "color" : "#FF0000",
            "icon_emoji" : ":sl:",
            "channel" : "@user",
            "link_names" : true,
            "notify_channel" : false,
            "webhook_url" : "https://hooks.slack.com/services/T00000J0T/B0000000S/I00000l00000F00000Z0000h"
         },
         "type" : "org.graylog2.plugins.slack.output.SlackMessageOutput"
      },
      {
         "type" : "org.graylog2.plugins.slack.output.SlackMessageOutput",
         "configuration" : {
            "webhook_url" : "https://hooks.slack.com/services/T00000J0T/B0000000S/I00000l00000F00000Z0000h",
            "link_names" : true,
            "notify_channel" : false,
            "channel" : "@user",
            "color" : "#00FF00",
            "icon_emoji" : ":bulb:",
            "add_attachment" : false,
            "icon_url" : "",
            "short_mode" : true,
            "user_name" : "Graylog",
            "graylog2_url" : ""
         },
         "id" : "57b6f8d13b553a086019711e",
         "title" : "Slack alert, Default"
      }
   ],
   "dashboards" : [
      {
         "title" : "Availability",
         "description" : "Service Availability Events",
         "dashboard_widgets" : [
            {
               "width" : 1,
               "description" : "VRRP Failover ",
               "cache_time" : 10,
               "configuration" : {
                  "interval" : "hour",
                  "timerange" : {
                     "range" : 432000,
                     "type" : "relative"
                  },
                  "query" : "message:\".*Syncing instances to MASTER state.*\""
               },
               "type" : "SEARCH_RESULT_CHART",
               "height" : 1,
               "row" : 2,
               "col" : 1
            },
            {
               "cache_time" : 10,
               "width" : 1,
               "description" : "VRRP Failover, 1W",
               "height" : 1,
               "col" : 2,
               "row" : 2,
               "configuration" : {
                  "trend" : true,
                  "timerange" : {
                     "range" : 604800,
                     "type" : "relative"
                  },
                  "query" : "message:\".*Syncing instances to MASTER state.*\"",
                  "lower_is_better" : true
               },
               "type" : "SEARCH_RESULT_COUNT"
            }
         ]
      },
      {
         "title" : "VPN Events",
         "description" : "VPN related events including IPsec and PPTP",
         "dashboard_widgets" : [
            {
               "cache_time" : 10,
               "width" : 1,
               "description" : "PPTP Clients, 7D",
               "height" : 2,
               "col" : 1,
               "row" : 1,
               "configuration" : {
                  "show_pie_chart" : false,
                  "field" : "pptp_addr",
                  "timerange" : {
                     "range" : 604800,
                     "type" : "relative"
                  },
                  "interval" : "minute",
                  "query" : "application:(pptpd OR pppd)",
                  "show_data_table" : true
               },
               "type" : "QUICKVALUES"
            }
         ]
      },
      {
         "dashboard_widgets" : [
            {
               "width" : 1,
               "description" : "Denied from Internet",
               "cache_time" : 10,
               "type" : "SEARCH_RESULT_CHART",
               "configuration" : {
                  "interval" : "hour",
                  "timerange" : {
                     "range" : 604800,
                     "type" : "relative"
                  },
                  "query" : "fw_action:D AND fw_name:in2loc"
               },
               "col" : 1,
               "row" : 1,
               "height" : 1
            },
            {
               "description" : "Denied from Internet, SRC",
               "width" : 1,
               "cache_time" : 10,
               "configuration" : {
                  "interval" : "hour",
                  "timerange" : {
                     "range" : 604800,
                     "type" : "relative"
                  },
                  "show_pie_chart" : false,
                  "field" : "fw_src_ip",
                  "query" : "fw_action:D AND fw_name:in2loc",
                  "show_data_table" : true
               },
               "type" : "QUICKVALUES",
               "height" : 2,
               "col" : 1,
               "row" : 6
            },
            {
               "cache_time" : 10,
               "description" : "Denied to Internet, 1W",
               "width" : 1,
               "height" : 1,
               "row" : 1,
               "col" : 2,
               "configuration" : {
                  "interval" : "hour",
                  "timerange" : {
                     "type" : "relative",
                     "range" : 604800
                  },
                  "query" : "fw_action:D AND NOT fw_name:in2loc"
               },
               "type" : "SEARCH_RESULT_CHART"
            },
            {
               "cache_time" : 10,
               "width" : 1,
               "description" : "Denied to Internet, SRC",
               "height" : 2,
               "row" : 6,
               "col" : 2,
               "configuration" : {
                  "show_data_table" : true,
                  "query" : "fw_action:D AND NOT fw_name:in2loc",
                  "interval" : "hour",
                  "field" : "fw_src_ip",
                  "show_pie_chart" : false,
                  "timerange" : {
                     "type" : "relative",
                     "range" : 604800
                  }
               },
               "type" : "QUICKVALUES"
            },
            {
               "configuration" : {
                  "interval" : "hour",
                  "field" : "fw_src_ip_geolocation",
                  "timerange" : {
                     "range" : 604800,
                     "type" : "relative"
                  },
                  "query" : "fw_action:D AND fw_name:in2loc"
               },
               "type" : "org.graylog.plugins.map.widget.strategy.MapWidgetStrategy",
               "height" : 2,
               "col" : 1,
               "row" : 2,
               "width" : 2,
               "description" : "Map: Denied Traffics From Internet",
               "cache_time" : 10
            },
            {
               "cache_time" : 10,
               "width" : 1,
               "description" : "Allowed Firewalls",
               "row" : 4,
               "col" : 1,
               "height" : 2,
               "type" : "QUICKVALUES",
               "configuration" : {
                  "interval" : "hour",
                  "timerange" : {
                     "range" : 604800,
                     "type" : "relative"
                  },
                  "show_pie_chart" : false,
                  "field" : "fw_name",
                  "query" : "fw_action:A",
                  "show_data_table" : true
               }
            },
            {
               "height" : 2,
               "col" : 2,
               "row" : 4,
               "configuration" : {
                  "show_data_table" : true,
                  "query" : "fw_action:A",
                  "interval" : "hour",
                  "timerange" : {
                     "type" : "relative",
                     "range" : 604800
                  },
                  "show_pie_chart" : false,
                  "field" : "fw_dst_port"
               },
               "type" : "QUICKVALUES",
               "cache_time" : 10,
               "width" : 1,
               "description" : "Allowed Services"
            }
         ],
         "description" : "Firewall Events (Denied Traffics from/to Internet)",
         "title" : "Firewall"
      },
      {
         "title" : "Performance",
         "description" : "Network Performance",
         "dashboard_widgets" : [
            {
               "height" : 1,
               "row" : 1,
               "col" : 1,
               "configuration" : {
                  "query" : "gl2_source_input:57b6fc7a3b553a0860197503",
                  "timerange" : {
                     "type" : "relative",
                     "range" : 432000
                  },
                  "interval" : "hour"
               },
               "type" : "SEARCH_RESULT_CHART",
               "cache_time" : 10,
               "description" : "Syslog Traffics",
               "width" : 2
            },
            {
               "type" : "FIELD_CHART",
               "configuration" : {
                  "renderer" : "area",
                  "interpolation" : "monotone",
                  "valuetype" : "total",
                  "interval" : "minute",
                  "timerange" : {
                     "type" : "relative",
                     "range" : 432000
                  },
                  "field" : "nf_bytes",
                  "query" : "gl2_source_input:57b704e23b553a6cfa2751c6",
                  "relative" : 604800,
                  "rangeType" : "relative"
               },
               "col" : 1,
               "row" : 2,
               "height" : 1,
               "width" : 2,
               "description" : "NetFlow Bytes",
               "cache_time" : 10
            }
         ]
      },
      {
         "description" : "Security events",
         "dashboard_widgets" : [
            {
               "cache_time" : 10,
               "width" : 1,
               "description" : "Security Failures, 1W",
               "height" : 1,
               "row" : 1,
               "col" : 1,
               "configuration" : {
                  "timerange" : {
                     "range" : 604800,
                     "type" : "relative"
                  },
                  "interval" : "hour",
                  "query" : "facility:security* AND (Fail* OR fail*)"
               },
               "type" : "SEARCH_RESULT_CHART"
            },
            {
               "row" : 1,
               "col" : 2,
               "height" : 1,
               "type" : "SEARCH_RESULT_CHART",
               "configuration" : {
                  "query" : "facility:security* AND NOT application:(pluto OR ipsec* OR CRON)",
                  "interval" : "hour",
                  "timerange" : {
                     "range" : 604800,
                     "type" : "relative"
                  }
               },
               "cache_time" : 10,
               "width" : 1,
               "description" : "Security Events, 1W"
            },
            {
               "configuration" : {
                  "timerange" : {
                     "type" : "relative",
                     "range" : 604800
                  },
                  "show_pie_chart" : false,
                  "field" : "source",
                  "interval" : "hour",
                  "show_data_table" : true,
                  "query" : "\"/opt/vyatta/sbin/vyatta-save-config.pl /tmp/local.boot --no-defaults\""
               },
               "type" : "QUICKVALUES",
               "height" : 1,
               "row" : 2,
               "col" : 2,
               "description" : "VGA: Configuration Changed",
               "width" : 1,
               "cache_time" : 10
            },
            {
               "width" : 1,
               "description" : "Security:Failed from",
               "cache_time" : 10,
               "configuration" : {
                  "show_pie_chart" : false,
                  "field" : "remote_addr",
                  "timerange" : {
                     "range" : 604800,
                     "type" : "relative"
                  },
                  "interval" : "hour",
                  "query" : "facility:security* AND (Fail* OR fail*)",
                  "show_data_table" : true
               },
               "type" : "QUICKVALUES",
               "height" : 1,
               "row" : 3,
               "col" : 1
            }
         ],
         "title" : "Security"
      }
   ]
}
```


#### 최종회 - 끝 -

* [Calling All Logs! Graylog2 1편: 설치하기]
* [Calling All Logs! Graylog2 2편: 맛보기]
* [Calling All Logs! Graylog2 3편: 추가설정]
* _Calling All Logs! Graylog2 4편: 기록_


[Calling All Logs! Graylog2 1편: 설치하기]:{{< relref "/blog/sysadmin/2017-10-11-calling-all-logs-graylog2-installation.md" >}}
[Calling All Logs! Graylog2 2편: 맛보기]:{{< relref "/blog/sysadmin/2017-10-12-calling-all-logs-graylog2-overview.md" >}}
[Calling All Logs! Graylog2 3편: 추가설정]:{{< relref "/blog/sysadmin/2017-10-13-calling-all-logs-graylog2-settings.md" >}}
[Calling All Logs! Graylog2 4편: 기록]:{{< relref "/blog/sysadmin/2017-10-13-calling-all-logs-graylog2-memories.md" >}}

[Graylog]:https://www.graylog.org/
[Graylog Docs]:http://docs.graylog.org/
[Graylog Github]:https://github.com/Graylog2
