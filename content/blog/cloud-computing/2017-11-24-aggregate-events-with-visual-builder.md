---
title: Kibana Visual Builder로 이벤트 묶어 보기
subtitle: Elastic Stack을 활용해서 서비스 이벤트 해석하기
series: 모니터링은 해석
tags: ["monitoring", "analytics", "elastic-stack", "cloud-computing"]
categories: ["cloud-computing"]
images: [/attachments/silrok/silrok-visualbuilder-pl-annotations.png]
banner: /attachments/silrok/silrok-visualbuilder-pl-annotations.png
date: 2017-11-24T14:05:00+0900
lastmod: 2017-11-24T18:09:00+0900
---
앞선 글 "[모니터링은 경보가 아니라 해석]"에서, 기존 모니터링 환경의 한계
중 하나로 "기능 단위의 고립"과 "서비스 관점의 통찰 부재"를 들었다. 개별
구성요소에 대한 모니터링도 중요하지만, 거기서 멈추지 말고 그 요소들이
궁극적으로 이루게 되는 "서비스"와 사건들의 연관 관계, 인과 관계에 대한
분석이 사건을 해석하는데 매우 중요하다는 것을 강조하기 위함이었다.
이 글에서는, Elastic Stack, 특히 Kibana에서 서로 다른 원천으로부터
수집된 데이터를 엮어서 표현하기 위한 기법 중 하나를 정리하여 기록하려
한다.
<!--more-->

> 이 묶음글은 아래와 같이 3+1 개의 글로 이루어져 있으니, 관련된 부분을
> 함께 참고하면 좋을 것 같다.
> 
> * [모니터링은 경보가 아니라 해석]
> * _Kibana Visual Builder로 이벤트 묶어 보기_
> * [Kibana Heat Map으로 3차원으로 펼쳐 보기]
> * 환경구성 과정은 "[Elastic Stack 6.0 설치하기]"에서
{.boxed}

# 큰 그림

앞선 글에서 소개한 것과 같이, 최종적으로는 다음과 같은 화면을 얻었다.
("최종"이라고 표현했만 사실 1차 Prototype이긴 하다.) 화면을 자세히 보면,
맨 위쪽에는 대상에 대한 네트워크 모니터링 경보(NMA)와 기타 이벤트를 함께
표현한 시계열 그래프가 있고, 바로 아래에는 거의 동일한 모습으로 가입자별
NMA의 분포를 나타내는 그래프가 자리하고 있다. (이게 이 글의 주제다.)
그리고 그 아래로는 요일별, 시간대별 NMA 분포 등이 연이어 배열되어 있다.
(이 부분은 다음 글에서 다룬다.)

![](/attachments/silrok/silrok-dashboard-current.png)
{.dropshadow}

# Kibana, Visual Builder

이전의 Elastic Stack, Kibana도 시간을 기준으로 데이터를 표현하는 기능을
제공하고는 있으나, 그것은 시간 히스토그램을 X 축으로 하는 차트에 데이터를
플로팅하는 수준이었다. 로그 수집/분석 중심의 ES가 시계열 자료에 대한
지원을 확대하는 과정에서, Timelion 통합과 함께 제공되는 멋진 기능 중
하나가 시계열 데이터를 보다 전문적으로 처리해주는 Visual Builder의
등장이다. (시계열 데이터만을 위한 녀석은 아니며 Dashboard 구성을 위한
다양한 기능을 제공하지만, 내게는 시계열 데이터의 표현에 대한 지원이
상대적으로 중요하게 느껴진다.)

아래 그림은, 이 글에서 소개하고자 하는 데이터 표현이 최종적으로 완성된
모습이다.

![](/attachments/silrok/silrok-visualbuilder-00-preview.png)
{.dropshadow}

그림 상단의 메뉴를 보면, Time Series, Metric, Top N, Gauge, Markdown
등이 표시되어 있는데, 앞서 얘기했듯이 이 Visual Builder는 시계열 데이터
외에도 이런 다양한 형태의 시각화 요소의 구성을 함께 제공한다.

아무튼, 그림을 보면 시간의 흐름을 담은 X축을 두고 Accounts, Events,
Spread, Average라고 이름 붙인 네 가지 데이터를 플로팅하고 있고, 이와
함께 시간축과 직교하는 선과 아이콘을 사용한 "시간값을 가지고 있으나
수치가 아닌 의미값을 갖는 데이터"를 함께 표시하고 있다.

표현이 매끄럽지 않은데, 네 개의 수치 데이터는 시간 경과에 따른 특정
값의 변화를 보여주고 있는 것이고 이와 함께 순간적으로 발생하는 개별
사건의 위치를 함께 찍어준다는 것이고, 이렇게 동일한 그래프에 두 가지
성격의 데이터를 함께 그려줌으로써, 우리는 그 두 데이터 간의 연관관계를
보다 쉽게 확인할 수 있다는 얘기를 하려는 것이다.

보다 구체적으로 얘기하면, 위의 그래프가 표시하는 네 가지 수치와 사건들은
다음과 같다.

* Events: 단위시간 동안 네트워크 모니터링 경보(NMA)가 발생한 회수
* Accounts: 네트워크 모니터링 경보와 연관된(영향을 받은) 가입자의 수
* Spread: 단위시간 동안 발생한 NMA가 여러 가입자에 걸쳐 나타나는지에 대한 지표
* Average: 가입자 당 네트워크 모니터링 경보의 수(평균)
* 개별 사건: 네트워크 모니터링 경보가 아닌 다른 사건들

대상에 대하여 자세히 안다면 그래프를 보는 것이 더 유용하겠으나, 글의
주제와는 조금 떨어져 있기 때문에 생략하고, 이제 각 데이터를 표현하는
방법에 대해 기록하려 한다.


## Panel Options, 표출할 데이터 정하기

메뉴의 순서가 뒤바뀌어서 좀 그렇긴 한데, 두 번째 메뉴인 Panel Options를
먼저 보는 것이 설명과 이해에 도움이 될 것 같은데,  이 Panel Options 탭에는
아래와 같이, Index Pattern, Time Field, Interval, Axis나 Legend 등과
관련된 값들, 그리고 마지막으로 Filter를 지정할 수 있도록 하고 있다.

![](/attachments/silrok/silrok-visualbuilder-01-panel-options.png)
{.dropshadow}

먼저, Index Pattern 값을 이용해서 어떤 Elasticsearch 인덱스에서 데이터를
가져올 것인지를 정하고, 그 인텍스에 들어있는 시간 데이터 중에서 시간축에
사용될 Field를 정하고 있다.
여기서는 일종의 경보 로그를 담고 있는 `ticket-*`이라는 인덱스를 사용하고
있는데, 시스템이나 서비스 모니터링이라면 시스템 부하, 접속자 수, I/O 수치
등을 담은 인덱스도 활용이 가능할 것이다.

그리고 맨 아래에는 Panel Filter 항목에 `title:"Network Monitor Alert"`이라
적었는데, 이것은 Elasticsearch의 검색 시 사용될 Query이다. Kibana에서
Discover를 사용할 때 사용하는 검색 방식과 동일한데, 한 가지 아쉬운 점은
왜 Saved Objects와의 연계가 아닐까... 하는 점이다.  
아무튼, 이제 어떤 데이터 셋을 시간축에 플로팅할지는 정한 것이다.


## Events, 기록된 사건의 총 수량

이제, 앞서 정의한 인덱스 및 검색 결과를 기반으로 하여 어떤 필드를 어떻게
표현할지를 정할 차례이다.

먼저, 대상 환경에서 특정 리소스의 네트워크 단절 시 발생하는 이벤트인
네트워크 모니터 경보의 합산 수치를 표현하려고 하는데, 이게 가장 단순하고
기본이 되는 시계열 데이터 표출 방식이다.

![](/attachments/silrok/silrok-visualbuilder-11-count.png)
{.dropshadow}

위의 그림을 보면, 눈을 뜬 Aggregation 에 `Count`라는 값이 선택되어 있는
것을 볼 수 있다. `Count` 외에도 `Average`, `Min`, `Max`, `Sum` 등 우리가
쉽게 상상할 수 있는 다양한 값을 이용할 수 있다. 이 예에서는 이미 앞선
절에서 인덱스와 필터를 사용하여 데이터로 지정한 "네트워크 단절"이 얼마나
많이 발생하는지에 주목하고 있기 때문에 단순히 `Count` 방식을 선택했다.

뭘 표시할지를 정했으면 어떤 식으로 표시할지도 정해야 하는데, 이건 Metrics
바로 옆의 Options 탭에서 설정할 수 있다. 조금 잘리긴 했는데, 아래 그림과
같다.

![](/attachments/silrok/silrok-visualbuilder-11-options.png)
{.dropshadow}

데이터가 단순 수치인지 백분율값인지, Byte인지 등을 정하는 Data Formatter나
개별 데이터를 표현할 때 사용할 Template 등 다양한 설정이 가능한데, 그 중
플로팅 방식을 결정하는 것은 Chart Type과 Stacked, Fill, Line Width 등의
설정이다. 직관적으로 알 수 있는 내용이면서도 사실 속속들이 잘 알지 못하니
자세한 설명은 생략한다. :-) 아무튼, 나는 내 데이터에 대하여 "얼마나 많이"를
표현하기에 적합한 막대 그래프 형식으로 표현하려고 하므로 Chart Type을
`Bar`로 선택했다. (휴~ 복잡한 것이 아닌데 글로 쓰려니 힘들다)


## Accounts, 사건의 영향을 받은 가입자 수

이 Prototype에서 내가 주목하고 있는 것 중 하나는, "네트워크 단절" 사건이
얼마나 많이 발생하는지에도 있지만, 더 중요한 것은 그 사건들이 얼마나 많은
가입자에게 영향을 주는지에 대한 부분이다. 특히, 동시 다발적으로 사건이
발생하고 그것이 많은 가입자에게 영향을 주는 경우를 확인하고 싶었다.

이를 위해, "영향을 받은 가입자 수"를 확인하고 싶은데, 다음과 같이,
Aggregation 방식을 `Cardinality`로 설정하고 대상 Field를 정해주면 중복을
제거한 수량, 즉 고유값의 개수를 확인할 수 있다. (이 Cardinality에 대한
구체적인 내용과 설명은 [Cardinality Aggregation], [Finding Distict Counts]
등에서 확인할 수 있다.)

[Cardinality Aggregation]:https://www.elastic.co/guide/en/elasticsearch/guide/current/cardinality.html
[Finding Distict Counts]:https://www.elastic.co/guide/en/elasticsearch/guide/current/cardinality.html

![](/attachments/silrok/silrok-visualbuilder-12-cardinality.png)
{.dropshadow}

Metrics를 설정한 후, 플로팅 방식을 Events와 동일하게 설정해주면 이 두 값이
함께 표시되어 아래와 같은 모양이 된다.

![](/attachments/silrok/silrok-visualbuilder-pl-count.png)
{.dropshadow}

이때, Options에서 Fill, Line Width 등을 이용해서 투명도나 선의 굵기 등을
조정할 수 있다. (색상 조정은 아이템 제목의 왼쪽에 위치한 색깔 아이콘을
누르면 변경할 수 있다.) 뭐, 이 정도 색깔이면 마음에 든다.


## Spread, 사건이 퍼진 정도

위의 그래프만 가지고도, 사건이 많이 발생한 시점을 파악하거나 영향범위가
넓은(많은 가입자에게 영향이 끼친) 시점, 또는 그 비율을 시각적으로 찾을
수 있다. 하지만 이렇게 사람의 인지에 의하지 않고 보다 선명하게 수치화할
수는 없을까?

이런 경우에 유용하게 사용할 수 있는 것이 "Parent Pipeline Aggregations"
범주 내의 `Calculation`이다. 이 Parent Pipeline Aggregation은 단순히
단일 지표를 이용하는 것이 아니기 때문에 아래 그림과 같이 조금은 복잡한
설정을 해줘야 한다.

![](/attachments/silrok/silrok-visualbuilder-13-calculation.png)
{.dropshadow}

보면, `Count`, `Cardinality` 방식으로 설정되었으며 감은 눈 Aggregation이
두 개 있고, 그 아래에는 `Calculation` 방식으로 설정되어 있는 눈을 뜬
Aggregation이 하나 있다. (눈은, 맨 아래의 Aggregation이 아니면 자동으로
감긴다. :-) `Calculation` 부분을 보면 Variables 라는 영역이 있는데, 위의
눈은 감았지만(값이 표현되지는 않지만) 값을 가져온 Query를 이 Variable을
통해 접근할 수 있도록 설정하는 부분인데, 위쪽은 `events`라는 이름으로
`Count`를, `accounts`라는 이름으로 `Cardinality of accountId`에 접근할
수 있도록 설정한 것을 볼 수 있다.

그 아래 위치한 Painless Script 입력란에는 위의 Variables를 활용하여 값을
계산할 수 있도록 계산식을 넣을 수 있는데, 풀어 써보면:

```c
if (params.events > 5) {
	params.accounts / params.events * 100
} else {
	0
}
```

이런 식으로, 사건이 5회를 초과하는 경우에는 사건 수 대비 가입자 수의
백분율을 구하고, 그렇지 않은 경우는 0을 반환하도록 하였다. 주의할 점은,
앞서 설명한 Variables에 접근할 때 `params.accounts`와 같이, `params.`를
붙여서 접근한다는 점이다.

이제 그래프는 아래와 같이 확산정도를 백분율로 표시한 꺾은선 그래프가
추가된 모양으로 변했다.

![](/attachments/silrok/silrok-visualbuilder-pl-calculation.png)
{.dropshadow}

이제 조금 더 명시적으로, 어떤 시점에 소수의 가입자에게 사건이 발생했는지,
어떤 시점에 다수의 가입자에게 영향을 주는 사건이 발생했는지를 확인할 수
있게 되었고, 이를 통하여 단순 사건의 수량을 넘어서, 서비스 전반에 걸친
문제(상대적으로 많은 가입자에게 영향을 주는 사건)를 파악할 수 있게 되었다.


## Average, 가입자 당 사건의 수

사건이 몰려서 그래프가 높이 올라가더라도, 그것이 문제가 커졌음을 의미하지
않을 수도 있다. 예을 들어, 품질이 균일하여 고장률이 일정한 제품이 있다고
가정하면, 그 제품의 사용자가 늘어날수록 고장 접수 건수도 함께 늘어날
것이다. 이 경우, 그 고장 건수의 증가는 판매량을 반영할 뿐, 품질의 저하를
의미하지는 않는다.

앞서 살펴봤던 Spread와는 반대로, 가입자 수로 전체 사건의 수를 나누어 보면
이 값은 가입자 당 사건의 수를 반영하게 된다. 그러나 시계열 분석의 관점을
적용해보면, 항상 같은 시점에 사건이 발생하는 것이 아니기 때문에 측정의
단위가 되는 시간을 넓게 조정한다든지, 아니면 다른 어떤 방법을 사용해서
보정을 해줘야 추이 분석이 가능해진다.

일단 설정을 보자.

![](/attachments/silrok/silrok-visualbuilder-14-moving-avg.png)
{.dropshadow}

위쪽 세 개의 감은 눈은 앞선 `Calculation`의 부분을 그대로 가져온 것이다.
차이점은, 앞서 설명한 방식으로 수식이 변했는데, 이번에는 "5개 초과의 사건"
등은 의미가 없으나 0으로 나누는 것은 오류를 내게 되므로, 이에 대한 조치를
해주는 것, 백분율이 아닌 값 자체를 구하는 것 정도가 다르다.

```c
if (params.events > 0) {
	params.events / params.accounts
} else {
	0
}
```

그리고 중요한 차이는, `Calculation` 역시 감은 눈으로 바뀌었고, 그 아래에
`Moving Average` 라는 이름의 Parent Pipeline Aggregation이 새롭게 추가된
것인데, 설정 내용을 보면, 앞서 계산한 `Calculation` 값을 가져와서,
`Linear` 형식으로 데이터 윈도를 `10`으로 하도록 설정되어 있다.

이걸 적용하여 그려보면 아래와 같다.(눈에 잘 띄도록 색을 좀 바꿔봤다.)

![](/attachments/silrok/silrok-visualbuilder-pl-moving-10.png)
{.dropshadow}

그림에서 보듯이, 10개 데이터지점 단위로 선형의 이동 평균을 내보면, 사건
발생의 비율이 크게 변하지 않았다는 것을 알 수 있다. 차이를 좀 확연히 보기
위해서 Window를 `2`로 바꿔보면 아래처럼 조금 더 꺾이는 그래프가 된다.

![](/attachments/silrok/silrok-visualbuilder-pl-moving-2.png)
{.dropshadow}

이제 이 값을 이용해서, 사건(또는 사건의 수)이 아닌 서비스 품질에 집중할
때 봐야 할 곡선을 하나 더 추가해 넣었다.


## 개별 사건, 네트워크 경보와 다른 사건의 관계

앞서 살펴본 내용은 대체로, 동일한 데이터를 두고 그것을 있는 그대로, 또는
수식을 적용하여 성격을 들어내게 하는 방식에 대해 다뤘다. 이번에는 조금
다른 관점인데, 이 (Panel Options에서 설정한) 관심 데이터 외의 자료를
함께 표출하여 서로 다른 데이터 또는 지표 간의 관계에 대해서 분석할 수
있는 방법을 설명하려 한다.

Annotations 탭에 가보면, 빈 화면에 버튼이 하나 보이는데, 그 버튼을 눌러
Annotation을 추가하면 아래와 같은 설정을 할 수 있게 된다.

![](/attachments/silrok/silrok-visualbuilder-30-annotations.png)
{.dropshadow}

내용은 단순한데, 어느 인덱스에셔 어떤 질의를 사용하여 값을 가져올 것인지,
그리고 그것을 어떻게 표현할 것인지를 정하는 것이다.

위의 예를 보면, `ticket-*` 인덱스에서 값을 가져오고 있고, 이 때 참조할
시간 값은 `@timestamp`를 사용한다는 설정과, 가져올 때 사용할 질의를
`title:/.*igrat.*/`와 같이 Regex를 써서 설정하였고, `title` 값을 이용해서
개별 데이터에 대한 값을 표현할 방식을 설정하고(포인터를 올렸을 때 등장)
`Bomb`라는 이름의 아이콘을 사용하도록 설정하고 있다. 설명이 길다. 보자.

![](/attachments/silrok/silrok-visualbuilder-pl-annotations.png)
{.dropshadow}

위의 그림에서 보면, 앞서 설명한 방식으로 세 개의 Annotation을 설정한
상태인데, 각각 불, 종, 폭탄의 아이콘을 사용하여 표현하는 부가정보가
수직선으로 시간축 위에 표시되고 있는 것을 볼 수 있다.

이와 같은 방식으로, 서로 다른 지표 사이의 관계를 함께 그려봄으로써,
여러 구성요소의 사건을 하나의 시각으로 표현하고 분석하는 것이 가능해진
샘이다.

나의 관찰 대상이 조금 모호해서 설명이 딱 와닿지 않으니 다른 예를 들면,
가령, 시스템 메모리 상태나 WAS의 Heap 사용량 등을 그래프로 표기하고,
WAS나 Application에서 OOME 등의 메모리 관련 로그를 함께 표시했다고
가정하면, 시스템 메모리, WAS 메모리 사용현황, 장애 현황 등을 한 눈에
시각적으로, 상호관계를 유추할 수 있는 형식으로 표현할 수 있는 것이다.

# 보너스! Group By로 묶어 보기

앞서 설명한 사건의 수, 가입자의 수 등을 한 눈에 보는 것도 좋은데...
그 지점의 사건이 각각 어떤 가입자에게서 발생했는지도 보고 싶지 않은가?
이런 경우에는 아래와 같이, Data를 설정할 때 Group By 값을 설정해주는
방법이 있다.

![](/attachments/silrok/silrok-visualbuilder-40-group-by.png)
{.dropshadow}

이렇게, 묶을 기준을 `accountId`로 해주면, 막대그래프를 가입자별 막대의
적층 형태로 보여준다. 물론, 묶고 싶은 기준이 다르다면 그 기준을 따르면
된다.

---

이렇게, 다양한 소스에서 수집된 이벤트를 함께 볼 수 있는 방법에 대한
정리를 하였다. 그리 복잡하지 않은 설정이지만, 조금만 신경을 써주면,
현상을 바로 보는데 많은 도움을 줄 수 있는 기술/기능이다.

숨차서, 다음 얘기는 다음 날에...




[모니터링은 경보가 아니라 해석]:{{< relref "/blog/cloud-computing/2017-11-23-monitoring-is-not-alert-but-analytics.md" >}}
[Kibana Heat Map으로 3차원으로 펼쳐 보기]:{{< relref "/blog/cloud-computing/2017-11-24-3dimensional-view-with-heat-map.md" >}}

[Elastic Stack 6.0 설치하기]:{{< relref "/blog/cloud-computing/2017-11-22-install-elastic-stack-6.0.md" >}}
