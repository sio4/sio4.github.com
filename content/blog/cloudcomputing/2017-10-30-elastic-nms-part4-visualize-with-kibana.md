---
title: "Elastic NMS Part 4: Kibana로 Visualize하기"
subtitle: Elastic Stack을 바탕으로 NMS 만들기
tags: ["elastic-stack", "logging", "monitoring", "cloud-computing", "analytics"]
categories: ["cloudcomputing"]
image: /attachments/elastic-nms/elk-403-tile-map.jpg
banner: /attachments/elastic-nms/elk-403-tile-map.jpg
date: 2017-10-30T18:10:00+0900
---
범용 자료분석 플랫폼인 Elastic Stack의 미모를 담당하는 구성요소가 바로
Kibana이다. Kibana는 Elasticsearch와 연동하여 사용자가 자유롭게 질의를
만들어 날리고, 그 결과를 시각적으로 표현할 수 있는 클라이언트인데,
"**자유로운 분석 플랫폼**"으로써의 Elastic Stack이 아닌, "**독자적인
응용프로그램을 위한 자료분석 백엔드**"로써 Elastic Stack을 활용하는
경우에는 상대적인 비중이 낮은 구성요소이다.
그래서 이 글에서는, Kibana의 기능을 겉핥기로 스쳐 지나가려고 한다.
<!--more-->

이번 묶음글은 아래와 같은 순으로 진행할 예정이다. 깊이있게 다루는 것은 아니며,
Elastic Stack을 시작하는 입장에서 관심있는 부분을 참고하면 될 것 같다.

* [Elastic NMS Part 1: 엔진을 켜라!]
* [Elastic NMS Part 2: Syslog 원격로깅]
* [Elastic NMS Part 3: Mapping과 Template]
* _Elastic NMS Part 4: Kibana로 Visualize하기_
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



# Kibana의 위상

분석 플랫폼을 사용하는 내부 사용자로써 다양한 분석을 진행하려는 경우에는
Kibana의 편리한 질의기능, 검색 및 자료 열람 기능, 다양한 형태의 시각적
표현 등을 이용하여 편리하게 분석을 수행할 수 있을 것 같다.
그러나 나처럼 Elastic Stack을 기반으로 NMS를 구성하여 **규격화된 질의와
표현**을 이용한 정형화된 사용을 원하는 경우에는 Kibana의 용도가 일종의
개발콘솔 정도로 자리잡을 수 있다.


# Discover: 검색, 검색의 저장

Kibana의 주화면을 보면, 상단에 Discover, Visualize, Dashboard가 Setting
메뉴와 함께 표시된다. 이 중 **Discover**는 이미 인덱스에 저장되어 있는
자료를 열람하고, 필요에 따른 질의를 날릴 수 있는 기능을 제공한다.

아래 그림을 보면, 중앙 화면의 왼쪽으로는 원하는 필드에 대한 정보를 보거나
필드를 기준으로 한 작업을 지원하는 창이 위치해있고, 오른쪽의 넓은 부분에는
기준에 따라 검색된 레코드의 시계열 분포를 표시하는 Histogram과 함께 개별
레코드가 선택된 필드에 대한 테이블 형태로 표시되는 것을 확인할 수 있다.

![SHOT](/attachments/elastic-nms/elk-401-saved-search.jpg)
{.bordered}

화면의 맨 위쪽을 보면, `tags:iptables AND message:"default-D"`라는 값이
들어있는 검색창이 보이는데, 이 검색창을 이용하여 원하는 조건을 기반으로
검색작업을 할 수 있다. 테이블에 노란색 배경으로 강조되어 보이는 것을
보면, `message` 필드에 대한 검색조건으로 사용된 값인 `default`와 `D`가
보이는데, `message`가 Analyzed Field이기 때문에 제공된 검색어를 분해하여
단어 단위로 검색한 것을 알 수 있다.

아무튼, 이렇게 검색한 결과(데이터 말고 검색 그 자체)를 다음에 다시 쓰거나
다른 기능에서 활용하기 위해서는 그 검색을 저장해야 하는데, 검색창 오른쪽에
위치한 디스크모양 아이콘을 이용하면 쉽게 현재의 검색을 저장할 수 있다.


# Visualize: 저장된 검색을 이용한 시각화

시각화는 Kibana 멋진 기능 중 대표이다. Kibana는 검색결과를 가져와서 사용자가
선택한 형태에 따라 시각적으로 보여주는데, 이 기능은 주메뉴의 두 번째 항목인
**Visualize** 메뉴를 통해서 접근할 수 있다.

Kibana의 시각화 기능은 다음과 같은 순서에 의해 진행된다.

1. 어떤 형태의 시각화를 할 것인지 결정 (표, 그래프, 지도, 값 등)
1. 시각화의 대상이 되는 데이터셋의 선택 (보통, 저장된 검색을 활용)
1. 시각화를 하려는 필드와 기준이 되는 필드 등의 선택
1. 시각화하기

아래 화면은 이 중, 시각화의 대상이 되는 데이터셋을 선택하는 과정으로, 이미
저장해둔 검색을 선택하는 과정(Step 2)를 보여주고 있다. 앞선 설명 과정에서
저장한 "Firewall Default Denied"가 선택할 수 있게 나타나 있는 것을 볼 수
있다.

![SHOT](/attachments/elastic-nms/elk-402-visualize-from-search.jpg)
{.bordered}

데이터를 선택하고 나면, 이미 선택했던 시각화 유형에 따라 조금은 달라지지만
아래와 같은 Data와 Option을 선택하는 단계로 넘어가게 된다. 아래의 예에는
가려져 있어서 보이지 않지만, 표현하고자 하는 값은 검색 결과의 수량(Count)를
선택하였고, `src_geo.location` 필드를 표출 기준이 되는 Geo Coordinates로
선택하였다. 그리고 그 결과가 중앙의 화면과 같이, 세계지도 위에 원의 크기로
표현되고 있는 것을 볼 수 있다.

![SHOT](/attachments/elastic-nms/elk-403-tile-map.jpg)
{.bordered}

## 분석되지 않는 필드를 이용한 질의

위의 예에서는 단순히 "검색"을 기반으로 한 시각화를 보여주고 있는데, 잠깐
언급한 바와 같이 위에서 사용한 검색은 Analyzed Field를 대상으로 하고 있다.
이번엔 Not Analyzed Field를 사용한 검색의 예를 보려고 하는데, 얼핏 보기에
큰 차이가 느껴지지는 않는다.

Elasticsearch가 데이터 필드를 다루는 방식을 조금 다루면 좋을 것 같은데,
그냥 겉핥기로만 간단하게 이해하자면, Analyzed의 경우는 해당 필드를 엔진이
분석하여 단어 단위의 매칭을 찾을 수 있도록 하는 것이며, 비정형의 데이터를
제한없이 검색할 경우에 유용할 수 있는 방식이다. 반대로 Not Analyzed Field는
별도의 인덱싱을 하지 않고 전체 필드의 값을 있는 그대로 인식하는 것인데,
이런 유형의 필드에서 검색을 하게 되면 검색어와 완전히 매칭되는 String 매칭
방식으로 레코드를 찾게 된다.

아래 그림을 보면, 앞선 글에서 Not Analyzed 형태로 Mapping을 한 필드인
`fw_action`과 `fw_name`이라는 필드에 대하여 각각 `D`라는 검색어와
`/in2.*/`라는 검색어를 이용하여 `fw_action`이 `D`이면서 동시에 `fw_name`의
값이 `in2.*`라는 Regex에 매칭되는 값을 찾아 표시하고 있는 것을 확인할 수
있다.

![SHOT](/attachments/elastic-nms/elk-404-search-denied.jpg)
{.bordered}

위의 검색 결과를 보면, 필드 전체에 대하여 일치하는 레코드를 찾았다는 것을
느낄 수... 있다. (느끼는 것은 아닌데 좀...)

![SHOT](/attachments/elastic-nms/elk-405-table-and-save.jpg)
{.bordered}

이렇게, 관심을 가져야 하는 여러 조건들을 미리 확인하고 위와 같이 저정해
놓으면 Kibana 안에서 자유롭게 사용할 수 있다.



## 다양한 시각화 기능

좀 있어보이는 예를 들기 위해 앞선 예에서는 Geo Location을 이용한 시각화를
해봤다. 시각화 결과의 의미를 보자면 세계적으로 어느 나라에서 부당한 접속을
많이 시도하는지를 표현하는 것인데, 좀 멋져 보이는 것 이상의 의미가 뭘까...

아무튼, Kibana는 다음과 같은 다양한 시각화 기능을 제공한다.

### Line/Area Chart

시계열 분석에서 시간의 흐름에 따라 변하는 접속자 수라든지, Traffic의 분석
등에는 아래와 같은 형태의 선형 또는 면형 분석이 유용하다. 특히, 면으로
나타내는 경우, 시각적으로 그 양의 변화를 가늠할 수 있어서 유용하다.

![SHOT](/attachments/elastic-nms/elk-406-area-chart.jpg)
{.bordered}

위 그림의 왼쪽 부분은 Option 창을 표시하고 있는데, 라인을 부드럽게 표현할
것인지, 현재시간에 대하여 명시적인 표시를 할 것인지 등에 대한 결정을 할
수 있다. (찍어둔 스냅샷이 많았는데 막상 쓰려니 예가 멋지지는 않다.)

### Bar Chart

선형 그래프와 함께 많이 쓰이는 것 중 하나가 특정 값을 기준으로 한 분포를
보는 것인데, 이 경우 Bar Chart를 사용하여 쉽게 시각화할 수 있다. 아래의
예는 어떤 IP에서 침해로 간주할 수 있는 접속을 많이 시도했는지, 그리고 해당
IP에서 시도한 접속이 어느 포트에 대한 접속이었는지 등을 표시하고 있다.

![SHOT](/attachments/elastic-nms/elk-407-vertical-bar.jpg)
{.bordered}

왼쪽 Buckets 부분에서도 확인할 수 있는 것과 같이 먼저 `fw_src_ip`를 기준으로
막대를 표시하고, 그 막대를 다시 `fw_dst_port`로 쪼개어, 어느 IP로부터 어느
Port에 대한 접속을 시도하고 있는지를 시각화하는 예를 들어 봤다.


### Donut Chart

위의 Bar Chart의 경우, 전체 수량이 중요한 분석에 대해 유용하게 사용할 수
있는데, 거의 비슷하지만 비율을 파악하는 것이 더 유용한 경우에는 아래의
예외 같이 Donut Chart를 쓸 수 있다. 이 분석은, 전체 데이터의 절대적인
숫자가 아닌 그 데이터의 전체를 기준으로 하여 개별 데이터가 차지하는
백분률을 이용하여 시각화를 하는 것이다.

![SHOT](/attachments/elastic-nms/elk-408-donut.jpg)
{.bordered}

역시, 이것도 이중의 Bucket을 사용하여 잘린 Donut의 형태를 만들면, 위의
경우와 유사하게 "그 중에서도"를 표시할 수 있다.


# Dashboard: 모아보기

관심있는 검색 조건을 만들고, 그 검색 조건을 이용하여 시각화를 하였다면
그것을 한 화면에 모아서 보고 싶은 생각이 들 수 있다. Kibana의 세 번째
메뉴인 **Dashboard**를 통해서 이미 만들어둔 다양한 형태의 시각화 결과를
한 눈에 볼 수 있도록 배치하고 저장하여, 필요할 때마다 꺼내볼 수 있다.

결과는 아래와 같이, 들락날락하는 Traffic에 대해 방화벽이 막아낸 수를
표시하거나, 외부로부터의 접속시도에 대한 지리분포를 표시하거나(아 중국),
동일한 검색을 그래프가 아닌 테이블로 표시하는 등의 것을 한 화면에 짠!

![SHOT](/attachments/elastic-nms/elk-411-dash-firewall.jpg)
{.bordered}

물론, 나처럼 최종 목표가 정형화된 검색과 시각화를 다수의 사용자에게
제공하는 것인 경우에는 이렇게 자유롭게 검색하고, 저장하고, 표출하는
것이 적절하지 않을 수 있다.


# Kibana 생각하기

살펴본 바와 같이, Kibana는 자유로운 검색조건을 이용한 실시간 검색과 그것을
저장해서 다시 꺼내보는 기능을 제공하며, 저장된 검색을 기반으로 시각화하여
표시하는 등의 편리한 기능을 제공한다. 편리하긴 하지만, 다음과 같은 제약이
있다. (당연한 얘기인데, 제약이라고 표현했지만 그것은 특정한 시각이 반영된
경우에 한해서 성립하는 예기다.)

* 일단 무겁다. Kibana는 독립적인 Web 기반 Application인데, 이것이 만들어진
  목적과 다른 각도의 시각을 갖는다면 불필요한 무게가 있을 수 있다.
* 이것도 무겁지만, 질의를 실시간으로 날릴 때 Elasticsearch 입장에서도 그걸
  실시간으로 처리하는 것이 버거울 수 있다.
* 자체만으로는 권한이나 제한을 줄 수 있는 여지가 없다.
* 사용자가 질의의 폭을 넒게 가져갈 경우에는, 더더욱 백엔드에 부담을 주게
  된다. (그런데 사실, 시시각각 변하는 조건에 의한 검색이 아닌 다음에는
  이건 불필요한 부담일 뿐이다.)

그래서 NMS의 관점에서는 다음과 같은 작업이 필요할 것 같다.

* 먼저, 아래의 모든 것을 Cover할 전용의 App이 필요하다.
* 제공자 입장에서는 정교하게 다듬어진 질의문 세트를 만들 필요가 있다.
* 해당 질의는 사용자에 의해 날려지는 것이 아니라 기계적으로/주기적으로
  백엔드의 부담을 고려하여 날려야 한다.
* 그렇다면 그 결과를 언제든 볼 수 있도록 Caching하는 것이 필요하다.
* Caching의 형태는 최종 결과에 대한 이미지 형태의 것일 수도 있고,
  또는 또다른 인덱스를 이용한 Interactive한 데이터셋일 수도 있다.

... 이 이야기는 소개의 수준을 넘어서니까... 다음에 기회가 있으면 그 때
해야겠다.

이 글을 끝으로 이번 묶음글도 마무리한다. 아... 이제야 2016년이 조금씩
정리되는 것 같구나.


### 이 묶음의 다른 글들

* [Elastic NMS Part 1: 엔진을 켜라!]
* [Elastic NMS Part 2: Syslog 원격로깅]
* [Elastic NMS Part 3: Mapping과 Template]
* _Elastic NMS Part 4: Kibana로 Visualize하기_
* [Elastic NMS Part 5: NetFlow 수신하기]
* [Elastic NMS Part 6: SNMP 수신하기]

[Elastic NMS Part 1: 엔진을 켜라!]:{{< relref "/blog/cloudcomputing/2017-10-28-elastic-nms-part1-start-your-engine.md" >}}
[Elastic NMS Part 2: Syslog 원격로깅]:{{< relref "/blog/cloudcomputing/2017-10-30-elastic-nms-part2-syslog-remote-logging.md" >}}
[Elastic NMS Part 3: Mapping과 Template]:{{< relref "/blog/cloudcomputing/2017-10-30-elastic-nms-part3-mapping-and-template.md" >}}
[Elastic NMS Part 5: NetFlow 수신하기]:{{< relref "/blog/cloudcomputing/2017-10-31-elastic-nms-part5-netflow-monitoring.md" >}}
[Elastic NMS Part 6: SNMP 수신하기]:{{< relref "/blog/cloudcomputing/2017-10-31-elastic-nms-part6-snmp-monitoring.md" >}}

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

