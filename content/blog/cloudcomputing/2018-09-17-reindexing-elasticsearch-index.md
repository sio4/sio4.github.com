---
title: Elasticsearch 다시 Indexing하기
subtitle: 왜 혼자 바뀌고 그래!
tags: ["elastic-stack", "tips"]
categories: ["cloudcomputing"]
image: /attachments/es-misc/reindex-2.png
date: 2018-09-17T15:40:00+0900
---
내가 하고싶어서 한 것이 아니다. 그냥 가만히 두고 싶은 시스템인데... 어쩌다
일이 꼬여서 한참 전에 구성해 두었던 Elastic Stack 기반의 분석시스템을 좀
손보게 됐고, 이 글은 그 과정 중 일부를 기록으로 남기는 것이다.  
애초에 괜히 건드렸다... 싶기도 하고, 뭐, 그러면서 하나 더 배우는 거지...

{:.boxed}
> 지난 봄, 나름 활발하게 Docker 관련 글을 써 올리다가, 한동안 쉬었다.
> 생각지도 못했던 가족여행을 두 번이나, 그것도 해외로 다녀오면서 좀
> 바빴었고, 글을 쓸 틈도, 주제도 갖지 못했었다. 사실, 다음 글은...
> 지난 8월을 거의 통째로 다녀온 "바르셀로마의 휴일"이라 명명한
> 스페인-이탈리아 여행에 대한 글이 될 줄 알았는데...  
> 난데없이 Elasticsearch라니... :-(


한참 전에, 우리 사업이 고객과 환경 관점에서 어떻게 흘러가는지를 알고싶다는
생각으로(또는, 누군가는 알아야 하지 않을까 하는 생각으로) 어떻게 하면 고객과
사업환경의 변화를 추적할 수 있을까 고민하던 때가 있었다. 그 고민의 결과로
만들어둔 시스템이 바로 "장애 데이터와 고객 문의 데이터"에 대한 분석을 제공하는
분석환경이었다.  
이 환경은 고객의 문의나 내부에서 문제가 발생했을 때 자동으로 만들어지는
Ticket을 검색 가능한 형태로 보관하고, 여러가지 지표를 이용하여 이것의 변화
추의를 분석하면 뭔가 통찰력을 얻을 수 있지 않을까... 하는 시도를 담고 있는데...

현재는 시스템을 건드리지 않고 지난 3년 간 모아진 데이터를 이리 저리 보면서
변화에 대해 고민하는 정도로 사용하고 있었다. 그러던 중, 사건이 발생했다.



# 사건의 발단

사건의 시작은 아주 뜻하지 않은 곳에서 다가왔다.

이 환경을 올려둔 Cloud 환경의 변화가 있어서, VSI(Virtual Server Instance)를
옮겨야 하는 상황이 발생했고, Cloud가 그런 것이니 그냥 간단하게 생각하고
VSI를 다시 시작했다. 그런데... 내 시스템은 다시 올라오지 않았다. 자세한
이야기는 기회가 되면 하기로 하고, 결과적으로 다음과 같은 일들이 지나갔다.

* 설치한지 몇 년이 지난 VSI가 올라오지 않는 이유가 Grub과 관련된 문제였으므로
  Grub을 비롯한 주요 Package를 업그레이드했다.
* 업그레이드하는 과정에서 Elastic Stack의 패키지들이 같이 업그레이드 됐다.
  (이런... 다짜고짜 자동으로 올리는 것은 내 스타일이 아닌데... 내가 그랬어...)
* 업그레이드가 끝나니 Elastic Stack이 보다 멋진 모습을 보여주기에 기뻐했다.

* 그런데... 몇일 후, 더 이상 데이터가 쌓이지 않는 다는 것을 발견!!!

Logstash 로그를 보니 다음과 같은 로그가 쌓이고 있더라...

{:.wrap}
```
[2018-09-17T11:17:49,067][WARN ][logstash.outputs.elasticsearch] Could not index event to Elasticsearch. {:status=>400, :action=>["index", {:_id=>"65511479", :_index=>"ticket-2018.09", :_type=>"doc", :_routing=>nil}, #<LogStash::Event:0x9e27d6b>], :response=>{"index"=>{"_index"=>"ticket-2018.09", "_type"=>"doc", "_id"=>"65511479", "status"=>400, "error"=>{"type"=>"illegal_argument_exception", "reason"=>"Rejecting mapping update to [ticket-2018.09] as the final mapping would have more than 1 type: [ticket, doc]"}}}}
```

뭐래는 거지?

뭘 알아야 알아듣겠는데 통 모르겠다. 확실한 건 `type`이 하나 이상이라는 것,
그리고 `ticket`, `doc` 이 둘이 둘이면 안된다는 뜻인 것 같다. 그리고 그 위에
`_type`이라는 것의 값이 `doc`으로 되어있으니... 뭔가 연관이 있을 것도 같다.
(아... 아무리 찍기 총정리를 잘하고 "결과"를 찍어 보았지만 "그래서 내가 뭘
해야 하는데?"에 대한 답은 보이지 않는다.



# 문제에 접근하기

그냥 넘어가고 싶은 마음이 굴뚝같지만 그래도 한 번 봐야지 속이 풀리지 않을까?
하긴, 다른 누군가가 사용하는 시스템도 아니고 나만 그냥 잊어버리면 끝나는
시스템인데 그냥 덮고 가지?... 하는 마음을 접고 문제에 다가서 보기로 한다.

## 1단계: 현재의 모습 보기

그래서, 일단 현재의 데이터를 봤다.

```json
{
  "_index": "ticket-2018.09",
  "_type": "ticket",
  "_id": "65322421",
  "_source": {
    "type": "ticket",
    "@timestamp": "2018-09-13T08:20:36.000Z",
    "received_at": "2018-09-13T08:20:41.453Z",
    "@version": "1",
    "host": "192.0.2.116",
    "id": 65322421
  }
}
```

원본 데이터는 아니고, 좀 줄여서 보면 위와 같다. 여기서 `_source` 부분에
`type`이라는 녀석이 나오고, 그 위에 `_type`이라는 애가 나오는데 아래쪽의
`_source` 안의 것은 내가 데이터를 주입하는 Application 내에서 만든 것이니
아마 윗쪽의 `_type`이 뭔가 의심스럽다. (어쨌든 둘 다 값이 `ticket`이다.)

이게 문제가 있다면 문제가 없는 것은 어떤 모습일까?


## 2단계: 대비되는 부분 찾기

과거의 것을 "문제가 있다"라고 치부해버렸지만, 사실 그것도 지금까지 아무런
문제가 없이 잘 돌던 것! 어쨌든, 지금 새롭게 설치되어 버린 버전에서는 이
모양이 문제라고 하니... 그럼 새 버전은 데이터를 어떻게 다루고 싶어하는 건지
알아야 하겠다. 이렇게, 차이를 찾아가는 것이 두 번째 단계.

"정상적인 데이터"를 찾기 위해, Test용으로 만든 Index에 데이터를 쏴 넣어봤다.
물론 안 들어갈 수도 있지만, 문제의 지점이 외부가 아닌 Elasticsearch 내부라면
아마 먹힐 것이다. (어디서부터 접근하는지가 삽질의 깊이와 넓이를 좌우할텐데,
그래서 찍기 총정리가 유용하다.)

```json
{
  "_index": "tesket-2018.09",
  "_type": "doc",
  "_id": "wJVP5WUB1AKq6LiYfVVn",
  "_source": {
    "type": "tesket",
    "@timestamp": "2018-09-17T01:58:00.000Z",
    "received_at": "2018-09-17T02:15:16.207Z",
    "@version": "1",
    "host": "192.0.2.1"
    "id": 65509805
  }
}
```

새롭게 들어간 데이터를 보니, 역시나... `_source` 내의 `type`은 내가 지정한
값을 그대로 가지고 있는데, `_type`의 값이 내가 지정한 값이 아닌 지가
마음대로 정한 듯한 `doc`이다!

아하! 이게 `doc`이고 싶은데 이미 기존에 들어와있는 값들이 `ticket`이니...
"같은 Index에 `doc`과 `ticket`이 같이 살 수 없다!"고 외쳤던 것 같다.



# 해결하기

이제 문제지점을 찾았으니 해결을 할 차례. 해결도 역시 길을 잘 잡아야 하는데,
대충 생각했을 때 두 가지 방법이 있을 것 같다.


## 방법 1: 내 뜻대로 하겠어!

아마도, Logstash 설정에서 `_type` 값을 내가 원하는 값으로 지정해주면 이
문제는 해결이 될 것 같다. 그리고 이게 가장 간단한 방법일 것 같다. 그런데
혹시, 입력을 내가 조절할 수 없는 환경이 생긴다면 어쩌지? 그리고 이 `_type`
이라는 것이 내 의도대로 하는 것이 바른 방향일까?

잘 모르겠다. 확신이 없다. 기반의 개념과 원리, 그리고 그 아래에 깔린 철학을
모르고 접근하는 것은 조금 위험하다. 그리고 좀... 아 모르겠다.


## 방법 2: 당신 뜻대로...

잠깐 갈등을 했지만 일단 이번 건은, Elasticsearch를 조금 더 배울 수 있는 길로
가는 것으로 결정했다. 그래서 조금 찾아보니... 버전업 후 달라진 내용에 대한
글을 찾을 수 있었지만 읽기가 왜 이렇게 귀찮니... (아마도 달라진 점을 이해하기
위해서는 과거를 알아야 하는데, 과거도 모른다는 부담이 작용한 것 같다.)

암튼, 결과적으로 내가 선택한 방법은, 기존 Index에서 해당 값을 모조리 다
바꿔주는 것이었다. 그런데, 새롭게 들어오는 값에 대하여 값 충돌이 있어서
받아줄 수가 없는데... 이미 있는 문서의 값들을 그 자리에서 하나씩 바꾸는 것이
가당키나 하겠나? 값이 중복되는 것을 허용하지 않는다는데???

그래서 찾아보니, 아래와 같은 방식으로 기존 Index를 소스로 하여 새로운 Index를
만들어내는 것이 가능하다고 한다. 해보자. (아래의 예는, 시험삼아 하나의
Index를 잡아서 해본 것이다.)

{:.wrap}
```console
$ curl -X POST "localhost:9200/_reindex" -H 'Content-Type: application/json' -d'
{
  "source": {
    "index": "ticket-2018.08"
  },
  "dest": {
    "index": "ticket"
  },
  "script": {
    "lang": "painless",
    "inline": "ctx._index = \"ticket-\" + (ctx._index.substring(\"ticket-\".length(), ctx._index.length())) + \"-1\""
  }
}
'
{"took":1069,"timed_out":false,"total":4783,"updated":0,"created":4783,"deleted":0,"batches":5,"version_conflicts":0,"noops":0,"retries":{"bulk":0,"search":0},"throttled_millis":0,"requests_per_second":-1.0,"throttled_until_millis":0,"failures":[]}$ 
```

참고로, 이 방식은 아래 문서를 참고했다.

* [Reindex API](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-reindex.html)


오호라... 봐라. `took`는 걸린 시간일 것이고 `total`은 처리한 건 수겠지. 뭔가
했다! 한 번 보자. 아마 지 의도대로 원하는 값을 넣어서 뭔가 했겠지!

![](/attachments/es-misc/reindex-1.png){:.border.dropshadow}

오! 역시 했다! 그런데 어라? 뭔가 의도했던 것과는 다르다.
`ticket-2018.08-1`이라는 이름으로 새롭게 Index를 만들긴 했는데, 여전히
`_type`의 값은 원본과 동일한 `ticket`이다!  지가 원하는 것으로 바꿨을 줄
알았는데... 어떻게 된 일인지...


### 조금 더 생각하기

어디 생각을 조금 더 해보자...

아! 그렇지! 이건 내가 첫번째 방법으로 얘기했던 것과 크게 다르지가 않다.
"내 뜻대로"인 것이지. 이미 원본 Index에 해당 값이 있으니, 이게 내가 억지로
만든 것이든 지가 알아서 만든 것이든, 이미 있는 값인 이상 Elasticsearch가
자신의 의도로, 내 허락 없이, 그 값을 바꿀 수는 없는 노릇. 결과적으로 난
새롭게 Index를 만들었을 뿐, 내 뜻을 살려 해버린 것.

그러면, 어떻게 "내 뜻을 존중하는 너"에게 "당신의 뜻대로..." 움직이게 할
수 있을까?


### 내가 너의 방식을 존중하마

"당신의 뜻대로"를 "내가" 실천할 수 있는 쉬운 방법은 내 뜻을 그 뜻으로
바꾸는 것이다. 일단 말은 쉽다.

실천은?

{:.wrap}
```console
$ curl -X POST "localhost:9200/_reindex" -H 'Content-Type: application/json' -d'
{
  "source": {
    "index": "ticket-2018.08"
  },
  "dest": {
    "index": "ticket"
  },
  "script": {
    "lang": "painless",
    "inline": "ctx._type = \"doc\"; ctx._index = \"ticket-\" + (ctx._index.substring(\"ticket-\".length(), ctx._index.length())) + \"-2\""
  }
}
'
<...>
$ 
```

위와 같이, "원래는 Elasticsearch의 의도였던 것"을 내 script에 담아서 내
명령을 존중하는 Elasticsearch에게 던져줬다. "`_type`을 `doc`으로 지정해줘"
이렇게... 그 결과는,

![](/attachments/es-misc/reindex-2.png){:.border.dropshadow}

이렇게, 나머지는 원본 Index와 동일한 Field와 값을 갖지만 별도로 지정한
`_type`은 새로운 값으로 변경된 새 Index를 만들어냈다. 이제 전체적으로 이
작업을 수행하기만 하면, 내가 목표로 했던 작업을 마무리 지을 수 있다.


## 최종 작업

이제, 전체 Index, `ticket-*`를 참고하여 아래와 같이 새 Index를 만들어준다.

{:.wrap}
```console
$ curl -X POST "localhost:9200/_reindex" -H 'Content-Type: application/json' -d'
{
  "source": {
    "index": "ticket-*"
  },
  "dest": {
    "index": "ticket"
  },
  "script": {
    "lang": "painless",
    "inline": "ctx._type = \"doc\"; ctx._index = \"ticket-\" + (ctx._index.substring(\"ticket-\".length(), ctx._index.length())) + \"-1\""
  }
}
'
<...>
$ 
```

그리고 기존 Index를 모두 지우고,

{:.wrap}
```console
$ for y in 2014 2015 2016 2017 2018; do
>   for m in 01 02 03 04 05 06 07 08 09 10 11 12; do
>     curl -XDELETE localhost:9200/ticket-$y.$m
>   done
> done
<...>
$ 
```

새 임시 Index로부터 다시 원래의 이름으로 Index를 만들어준다. (뭐, Index의
이름이 딱히 중요한 것은 아니니 구테여 하지 않아도 되는 작업이긴 하다.)

{:.wrap}
```console
$ curl -X POST "localhost:9200/_reindex" -H 'Content-Type: application/json' -d'
{
  "source": {
    "index": "ticket-*-1"
  },
  "dest": {
    "index": "ticket"
  },
  "script": {
    "lang": "painless",
    "inline": "ctx._index = \"ticket-\" + (ctx._index.substring(\"ticket-\".length(), ctx._index.length()-2))"
  }
}
'
<...>
$ 
```

아! 그리고 임시 Index를 같은 방식으로 지우는 것을 잊어서는 안 된다.
같은 Index 형식이기 때문에, `ticket-*`로 지정한 세트에 이 임시 값이
포함될 것이기 때문.

---

이제, 새 버전에 맞는 새로운 Index 세트를 갖게 되었다.


{:.boxed}
이 글은 [Elastic Stack](/tags/elastic-stack/) 묶음글의 외전입니다~!



