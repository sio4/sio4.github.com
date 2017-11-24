---
title: Kibana Heat Map으로 3차원으로 펼쳐 보기
subtitle: Elastic Stack을 활용해서 서비스 이벤트 해석하기
tags: monitoring analytics elastic-stack cloud-computing
categories: ["cloudcomputing"]
image: /attachments/silrok/silrok-dashboard-current.png
date: 2017-11-24T18:10:00+0900
---
"[모니터링은 경보가 아니라 해석]"에서 들었던 기존 모니터링의 문제점 중
하나는 시계열 데이터를 효과적으로 다루지 못한다는 점이었다. 이 문제는,
데이터를 단순히 시간순으로 배열하는 것으로 그치는 문제와, 시간을 단순히
1차원으로만 본다는 점을 포함한다. 특히, 시간은 바라보는 기준이 될 뿐
우리가 관심을 갖는 것은 주기성과 리듬을 갖는 인간활동과 연관된 것이기
때문에 과거의 기록을 바탕으로 미래를 예측하기 위해서는 시간과 사건을
입체적으로 바라보는 것이 필요하다.

기업활동이든 개인이든 하루의 흐름, 주간, 월간, 연간 등의 리듬을 갖는
인간활동과 인간활동의 부속물인 서비스, 그리고 그것을 이루는 시스템은
그 활동 주기에 따른 리듬을 타게 된다. 이 글에서 확인하고자 하는 것은,
우리의 관심대상을 이 리듬에 맞춰 바라보는 것이다.

![](/attachments/silrok/silrok-heatmap-00-rhythm.png){:.bordered}

뭔가... 리듬이 보이나?

{:.boxed}
> 이 묶음글은 아래와 같이 3+1 개의 글로 이루어져 있으니, 관련된 부분을
> 함께 참고하면 좋을 것 같다.
> 
> * [모니터링은 경보가 아니라 해석]
> * [Kibana Visual Builder로 이벤트 묶어 보기]
> * _Kibana Heat Map으로 3차원으로 펼쳐 보기_
> * 환경구성 과정은 "[Elastic Stack 6.0 설치하기]"에서

# 큰 그림

앞선 글 [Kibana Visual Builder로 이벤트 묶어 보기]에서는 현재 Prototype으로
사용중인 대시보드의 상단에 위치한 사건 상관관계에 대한 부분을 살펴봤고,
이번 글에서는 그 아래에 위치한 Weekly Distribution 과 Hourly Distribution
부분에 해당하는 입체적 분석 부분에 대하여 살펴보려고 한다.

![](/attachments/silrok/silrok-dashboard-current.png){:.bordered}



# Kibana, Heat Map

머릿말에 등장하는 이 그림,

![](/attachments/silrok/silrok-heatmap-00-rhythm.png){:.bordered}

어렴풋하긴 하지만, 뭔가 물결이 보인다. 그리고 그 물결이 주 단위의 주기를
갖는 것이 아닌가 하는 생각도 하게 된다. 이것을 명확히 하기 위해서는 저
막대가 14개(12시간 당 한 막대이므로) 단위로 주기를 타는지 확인하면 되는데,
그것을 세어보는 것은 좀 답답하다.

일단 답을 보자.

![](/attachments/silrok/silrok-heatmap-00-weekly.png){:.bordered}

위의 그래프는 Heat Map이라 불리는, 2차원 배열의 기준값 위에 관심값을
색으로, 입체화하는 그래프인데(나는 3차원으로 보이는데 나만 그런가??),
앞에서 시간축을 중심으로 플로팅한 것에 비해 주기성을 보다 선명하게
확인할 수가 있다.

Y축의 숫자는 요일을 뜻하는데, 1은 월요일, 7은 일요일에 해당하며 나머지는
생각하는 그대로다. 내용을 해석해보면 우리의 관심을 받고 있는 그 사건은
대부분 월요일부터 금요일 중에, 즉 일반적인 근무일 동안에 발생하는 것을
알 수 있다. 주간 주기성이 명확하게 확인되는 샘이다.

같은 방식으로, 요일 대신 시간대 별 분석을 해보면 그 결과가 아래와 같다.

![](/attachments/silrok/silrok-heatmap-00-hourly.png){:.bordered}

역시 대부분의 사건은 오전 9시 이후, 그리고 점심시간인 12시 경에 살짝
주춤했다가 오후 7시 경까지 집중적으로 발생하는 것을 어렴풋하게나마
확인할 수 있으며, 간혹 22시 무렵에도 발생하는 것을 확인할 수 있다.
특히, 새벽 2시부터 6시 사이에는 활동이 거의 없으며, 연휴 기간이었던
5월 첫 주와 10월 첫 주에도 데이터가 거의 없다는 것도 확인할 수 있다.

이제, 해석 말고, 이 그림을 어떻게 그리는지에 대해 이야기할 차례다.


## Kibana, Visualize, Heat Map

Kibana의 Visualize 메뉴에 보면, Heat Map을 생성할 수 있는 메뉴가 있다.
이 메뉴를 선택하면 아래와 비슷한 모습을 (설정 내용은 제외하고) 볼 수
있다. 다른 Visualize 기능과 마찬가지로, 왼쪽에는 설정을 할 수 있는
입력들이 위치해 있고, 오른쪽으로는 그 결과에 대한 Preview를 볼 수 있다.

![](/attachments/silrok/silrok-heatmap-10-preview.png){:.bordered}

이 Heat Map의 설정은 Metrics와 Buckets로 나누어 이루어지는데, Metrics는
표현하고자 하는 값을 정의하는 부분이다. 우리는 사건의 빈도, 즉 숫자를
보고 싶기 때문에 아래와 같이 `Count` Aggregation을 사용하게 된다.

![](/attachments/silrok/silrok-heatmap-11-metrics.png){:.bordered}

Heat Map에 있어서 중요한 부분은 Bucket의 설정인데, Bucket은 X 축과
Y 축으로 구분되어 설정하도록 되어있다. 그림을 보면,

![](/attachments/silrok/silrok-heatmap-21-bucket-terms.png){:.bordered}

위의 내용은 `Terms`라는 Aggregation을 사용하는 예인데, Y 축을 이룰 값을
특정 항목, 여기서는 `WeekDay`라는 Field를 가져다 쓰도록 설정하고 있다.
요일이 7개가 있기 때문에 크기를 7개로 맞췄고, 자료 기준이 아닌 요일을
기준으로 정렬하기 위하여 Order를 맞춰줬다. 뭔가 불편하다. 또, 요일이
아닌 시간처럼, 만약 2 시간 간격으로 표시하고 싶다거나 할 때 이것을
지정할 수도 없다.

이런 경우, 아래와 같이 Aggregation을 `Histogram`으로 변경하면,

![](/attachments/silrok/silrok-heatmap-22-bucket-histogram.png){:.bordered}

간격(Interval)을 지정할 수 있으며 별도의 순서 지정 없이 Field를 기준으로
값을 배열하게 된다. 이렇게, 필요에 따라 Aggregation 방식을 바꾸면 용도에
맞는 방식을 찾을 수 있을 것 같다.

다음은 X 축을 지정할 차례인데, 이건 단순하게 시간을 이용할 것이기 때문에
아래와 같이 `Date Histogram`을 Aggregation으로 지정하고 `@timestamp` 값을
이용하도록 했다. 그리고 간격 설정은 주간(`Weekly`)으로 맞춰서 각 줄이
한 주를 의미하도록 지정했다.

![](/attachments/silrok/silrok-heatmap-23-bucket-x-date.png){:.bordered}

마지막으로 설정할 부분은 Options 부분인데, 이 곳에서는 주로 화면 구성
등에 대한 설정을 하게 된다.

![](/attachments/silrok/silrok-heatmap-30-options.png){:.bordered}

Legend를 어디어 둘 것인지 등이 있는데, 내가 관심을 두는 부분은
Color Schema와 Color Scale 부분이다.  이 값은, 보는 대상과 사람이
인지하는 느낌에 따라 값을 달리 할 수 있는데, 관심대상이 그다지 반가운
것이 아니라서 부정적인 의미를 갖는 붉은 계열을 선택했고 눈에 잘 띄게
하기 위해 백색-적색이 아닌 황색-적색으로 설정했다.

또, 경우에 따라 값의 변화 폭이 선형이 아닌 경우가 있는데, 이 때에는
Log나 Square Root 등을 이용하여 변화 정도를 조정할 수 있다. 또한,
점진적 색의 변화량을 조정하여 차이를 명확하게 들어나도록 했다.

별도의 설명 없이 써내려가기는 했지만, 사실 위에 등장하는 `WeekDay`나
`HourOfDay` 등은 원래의 인덱스에 들어있는 값이 아니다. 이 인덱스에
들어있는 자료는 단지 시간값을 가지고 있으며, 그 값을 그냥 이용할 수
없어서 계산에 의해 저 두 값을 만들어낸 것이다.



# Scripted Fields

어떻게 사용자가 원본 데이터에 없는 데이터를 자동으로 만들어낼까?

경우에 따라서는 Logstash 등을 이용하여 인덱스에 값을 넣을 때, 미리 값을
만들어 넣을 수가 있다. 그러나 이 경우는 데이터의 크기가 커진다는 점을
비롯해서, 이미 인덱스에 없는 값을 다시 넣주어야 한다는 점 등의 문제가
있다.  이런 경우, 유용하게 사용할 수 있는 기능이 바로 Scripted Field이다.

Scripted Field란, 실제로 인덱스에 존재하는 값이 아니지만 개별 문서의
값이나 조건을 이용하여 실시간으로 만들어내는 값이다.

Management 메뉴를 통해서 인덱스 관리 화면으로 가면, 아래와 같이
Scripted Field를 새로 작성하거나 이미 작성된 내용을 보고 수정할 수
있는 화면을 찾을 수 있다.

![](/attachments/silrok/silrok-scripted-field-00-list.png){:.bordered}

## Script 작성

목록에서 `WeekDay`를 선택하여 편집 화면으로 넘어가면 아래와 같은 화면을
만나게 된다.

![](/attachments/silrok/silrok-scripted-field-11-weekday.png){:.bordered}

먼저, Script를 작성할 언어나 출력될 값 등을 정하게 되고, 맨 아래 Script
부분에 적절한 Script를 작성해 넣으면 완성이 된다.

```java
ZonedDateTime.ofInstant(
	Instant.ofEpochMilli(
		doc["@timestamp"].value.getMillis()
	),
	ZoneId.of("+09:00")
).getDayOfWeek().getValue()
```

뭔가 복잡한데... 원래는 아래와 같이 작성했었다.

```java
doc["@timestamp"].value.dayOfWeek
```

깔끔, 간결하고 좋다. 그런데 문제는, Elasticsearch에서는 시간 데이터를
UTC로 보관하게 되며, Kibana는 이것을 알아서 사용자의 Browser 시간대에
맞춰 보여준다. 그러나 위와 같이, 2차적인 값을 만들어낸 경우, 이 값은
UTC를 기준으로 만들어질 뿐만 아니라 더 이상 시간 데이터가 아닌 숫자가
되어버리기 때문에 사용자가 느끼는 요일과는 다른 요일이 등장한다!

이 문제를 회피하기 위해, 현재 적용된 Script는 Java의 `ZonedDataTime`
클래스를 활용하여 데이터에서 뽑아낸 UTC 시간을 나의 시간대에 맞도록
`+09:00` 해준 후에, 이 값을 기준으로 요일을 뽑아냈다.
이 때, `getDayOfWeek()` 메서드는 문자열로 된 요일값을, `SUNDAY` 처럼,
돌려주기 때문에 Sorting 가능한 값을 얻기 위해 추가로 `getValue()`를
호출하여 숫자로 된 요일을 뽑아냈다.

같은 방식으로, 시간대 정보는 다음의 함수로 구한다.

```java
ZonedDateTime.ofInstant(
	Instant.ofEpochMilli(
		doc["@timestamp"].value.getMillis()
	),
	ZoneId.of("+09:00")
).getHour()
```

Hour의 경우, 이미 숫자이기 때문에 별도의 변환은 필요없다. 그런데,
이렇게 Script를 작성하다 보면... 한 방에 완전한 것을 만들기는 쉽지
않을 수 있다. 물론, Elasticsearch에게 손수 질의를 날려가며 할 수도
있지만 귀찮은 일이다. 이런 상황을 쉽게 해결해주기 위해, (예전에는
없던) Dev Tools 기능이 제공되고 있다!

![](/attachments/silrok/silrok-scripted-field-dev-tool.png){:.bordered}

Dev Tools는, 위와 같이, 두 개의 패널로 구성되어 있는데, 왼쪽 패널에
질의를 만들어 넣고 녹색의 실행 버튼을 눌러주면, 알아서 Elasticsearch에
질의를 날리고 그 결과를 오른쪽 패널에, 위의 그림과 같이, 보여주게 된다.
이렇게, 결과를 확인해가며 비교적 쉽게 Script를 작성할 수 있다.

---
모니터링 데이터를 제대로 분석하고 해석해내기 위해서는, 지난 글과 이번
글에서 다룬 시계열 데이터의 상관관계 분석이나 다차원 분석 외에도 할
일이 많다. 그리고 이 두 개의 글도, 그 시작일 뿐, 모든 영역을 다루지는
않는다.

그러나, 이것을 시작으로 하여, 나의 애증의 대상에 대한 이해를 꽤나,
그냥 데이터만 보는 것에 비해 월등히, 높일 수가 있었다!

-- 끝



### 함께 읽기

이 3+1 묶음글은 아래와 같다.

* [모니터링은 경보가 아니라 해석]
* [Kibana Visual Builder로 이벤트 묶어 보기]
* _Kibana Heat Map으로 3차원으로 펼쳐 보기_

그리고 그 환경의 준비는

* [Elastic Stack 6.0 설치하기]

에 정리해 두었다.


[모니터링은 경보가 아니라 해석]:{% link _posts/cloudcomputing/2017-11-23-monitoring-is-not-alert-but-analytics.md %}
[Kibana Visual Builder로 이벤트 묶어 보기]:{% link _posts/cloudcomputing/2017-11-24-aggregate-events-with-visual-builder.md %}

[Elastic Stack 6.0 설치하기]:{% link _posts/cloudcomputing/2017-11-22-install-elastic-stack-6.0.md %}
