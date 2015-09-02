---
title: Jekyll Build Performance - Part I
tags: Jekyll Liquid 성능 블로깅 Github-Pages
image: /attachments/20150811-jekyll-perf-1.png
date: 2015-08-11 04:14:32+09:00
---
나의 "생각저장소"를 이곳 [Github Pages](https://pages.github.com/){:.ext}로 옮긴 이후, 몇 개의 더 글을 쓰면서 본격적으로 [Jekyll](http://jekyllrb.com/){:.ext}, [Markdown](http://daringfireball.net/projects/markdown/){:.ext}, 그리고 [Liquid](http://liquidmarkup.org/){:.ext} 이용한 정적 블로깅을 조금 더 경험해 봤다.  
그 후 쓰게 된 이 글은, Jekyll의 성능에 대한 이야기이다.

## 성능에 관심을 갖다

5년 전 쯤, 서너개의 글을 가지고 시험해봤던 시절에는, 말 그대로 몇 개의
시험적인 포스팅을 이용해서 Markdown 기반으로 글을 쓰는 재미를 느껴봤을
뿐이었다. 조금 기술자스럽게 말을 하자면, 서비스에 대한 기본적인 PoC를
한 것.

그리고 얼마 전,
"[블로그, Tistory로부터 Github Pages로 이주]({% post_url 2015-07-24-migration-from-tistory %}){:.reference}"에
정리했던 것과 같이 내 블로그의 모든 글들을 이 쪽으로 완전히 이사하였고,
다시
"[Jekyll로 Github Pages에 블로깅하기, Re!oaded]({% post_url 2015-08-08-blogging-on-github-pages-reloaded %}){:.reference}"에서
소개한 블로그 답게 살 붙이는 작업을 몇 일 동한 틈틈히 진행하면서 글도
몇 개 더 써봤는데... 그러고 나니, **Jekyll의 Build 속도 문제**가 슬슬
거슬리기 시작했다.

> Jekyll의 Build 속도 문제가 슬슬 거슬리기 시작했다.

### 성능의 이해

Jekyll의 동작 방식을 간단히 말하자면, Markdown 또는 Textile Markup으로
작성된 "**내용 중심의 글**"을 Liquid Markup으로 작성된 "**형식 중심의
Template**" 으로 씌워내는 방식으로 실제로 Service될 HTML을 만들어내게
된다.  바꿔 말하면, 최종적으로 웹에 표출할 때 필요한 HTML 파일의 골격이
되는 "틀"(또는 웹 문서 Template, Jekyll의 용어로 Layout)을 미리 HTML과
Liquid 문법을 혼합하여 작성해놓으면, 그 이후에 Markdown으로 작성된 실
내용을 그 틀 안에 부어 넣어 최종적인 HTML로 완성해내는 것이다.

이 때, 성능 문제가 발생하는 것은,

* Jekyll이 Site를 빌드할 때, 새로 추가된 파일만 HTML로 변환해 내는 것이
  아니라 전체 글을 모두 다시 빌드함. (찾아보니, 이것을 막기 위한 방법이
  있는 것도 같다.)
* 그리고 이 과정에서 Liquid Markup을 사용하여 자동화한 것들 역시 모두
  다시 계산됨.(Index Page, 관련글 보기 등)

등의 까닭이다.

## 성능. 얼마나? 어디에서?

글을 쓸 때 마다, 또는 Layout(Template)을 수정할 때마다 늘어만 가는
빌드 시간을 처음에는 대소롭지 않게 여겼다. 그런데 그 시간이 수 초에서
10초 이상으로 늘어나는 것을 본 순간, 뭔가 "이건 아니다..." 라는 생각이
들었다.

> 글을 쓸 때마다 수십초? 이건 좀 아닌데...?

그래서 재봤다. 어디서, 얼마나 걸리나?

Jekyll이 Profiling을 지원하는지 확인하려다가, 그냥 간단하고 무식하게
Template을 고쳐보는 방식으로 시험을 해봤다. 아래 표는, 내가 사용하는
Nested 구조의 여러 Layout에서 시간이 걸릴 법한 여러 Markup을 일단
모두 제거한 후, 하나씩 다시 살려가며 137개의 글을 처리하는 시간을
_대략_ 측정한 결과이다.

#### Site

HTML의 Meta Tag를 포함하여 전체 페이지 배치를 다루는 Layout 이다.

{:.styled.fit}
| 기능         | 측정값 | 차이 |
|:------------:|:------:|:----:|
| 없음         |   3.4  |  0.0 |
| 메타생성     |   3.7  |  0.3 |

다른 Layout을 포함하여 모든 기능요소를 끄고 137개의 글을 처리하는데
걸린 시간은 3.4초였으며, `HEAD` 부분에 위치할 `TITLE`, `META` 등의
자동생성만 켰을 때 3.7초 정도의 "_참을만한_" 성능을 얻을 수 있었다.

#### Sidebar

페이지 오른쪽에 표시되는 일종의 Site Navigation을 담당하는 부분이다.

{:.styled.fit}
| 기능          | 측정값 | 차이 |
|:-------------:|:------:|:----:|
| 정적파일 포함 |   3.8  |  0.1 |
| 카테고리 생성 |   6.3  |  2.5 |
| 프로젝트 생성 |   6.8  |  0.5 |
| 최신목록 생성 |   8.2  |  1.4 |

Site Layout을 원래대로 한 후에 Sidebar를 구성하는 자동화 요소를
추가하면서 측정한 결과인데, 카테고리 목록 자동생성 및 최신목록
생성에 소모되는 시간이 각각 2.5초, 1.4초로 다소 길게 나왔다.

이 부분은 좀 낭비요소가 있는 것이, Sidebar의 내용은 모든 글에 대하여
동일한 내용을 담는 부분으로, 특정 시점을 기준으로 단 한번만 생성해도
되는 내용이다. 그러나, 이것이 매 페이지마다 반복 계산되면서 4.4초의
시간을 낭비하고 있다고 볼 수 있다.

참고로, 카테고리 자동생성을 위하여 내가 사용한 코드는 아래와 같다.

{% highlight liquid %}
{% raw %}
{% assign categories = site.categories |sort %}
<ul class="categories">
{% for category in categories %}
  {% assign cat_name = category |first %}
  {% if cat_name == 'blog' %}
    {% continue %}
  {% endif %}
  {% assign cat_size = category |last |size %}

  {% comment %}
    {% assign posts = category |last %}
    {% for pp in posts %}
      ({{ pp.title }})
    {% endfor %}
  {% endcomment %}

  {% assign post = category |last |first %}
  {% assign cat_display = post.display %}
  {% if cat_display == null %}
    {% assign cat_display = cat_name %}
  {% endif %}
  <li><a href="/categories/{{ cat_name }}.html"
         title="Postings on {{ cat_name }}">{{ cat_display }}</a>
    <span class="meta">» {{ cat_size }}</span>
  </li>
  {% endfor %}
</ul>
{% endraw %}
{% endhighlight %}

#### Post

실제 글의 내용을 담고, 그 글과 관련된 Meta성 데이터(Tag 등) 및 관련
글의 목록, 다음/이전 글로 이동하기 위한 링크 등을 자동화한 Layout이다.

{:.styled.fit}
| 기능          | 측정값 | 차이 |
|:-------------:|:------:|:----:|
| 정적파일 포함 |   8.3  |  0.1 |
| 작성날짜 표시 |   8.3  |  0.0 |
| 테그 표시     |   8.4  |  0.1 |
| 앞/뒤 연결    |   8.6  |  0.2 |
| 관련목록 생성 |  12.7  |  4.1 |

이 부분에서 매우 많은 시간이 소요되는 부분이 발견되었는데, 현재 글의
Tag를 기반으로 하여 동일한 Tag를 갖는 모든 글들의 목록을 (중복하여)
뽑아내는, "관련목록 자동생성" 과정에서 단일 요소로써는 가장 긴 시간인
4.1초의 시간을 사용하고 있었다.

참고로, Github Pages가 `site.recent_posts`를 위한 `lsi` 옵션을 지원하지
않기 때문에, 다음의 급조된 이중 `for loop` 코드를 이용하여 Tag 기반
관련목록을 만들고 있다.

{% highlight liquid %}
{% raw %}
<ul class="posts">
{% for t in page.tags %}
  {% for p in site.tags.[t] %}
    {% if page.path != p.path %}
      <li><span class="meta">{{ p.date |date: '%F' }}</span><a
        href="{{ p.url }}">{{ p.title }}</a>
        <span class="meta">&raquo; {{t}}</span>
      </li>
    {% endif %}
  {% endfor %}
{% endfor %}
</ul>
{% endraw %}
{% endhighlight %}

### 정리

위의 시간 구성을 통합하여 다시 정리하면 아래 표와 같다.

{:.styled.fit}
| 기능 |  측정값  | 차이 | 기본 | +관련글 | +프로젝트 | +최신글 | +프로젝트 |
|:----:|:--------:|:----:|:----:|:-------:|:---------:|:-------:|:---------:|
| 없음          |  3.4 | 0.0 | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> |
| 메타생성      |  3.7 | 0.3 | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> |
|---------------|------|-----|------|------|------|------|------|
| 정적파일 포함 |  3.8 | 0.1 | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> |
| 카테고리 생성 |  6.3 | 2.5 |      |      |      |      | <i class="icon check"></i> |
| 프로젝트 생성 |  6.8 | 0.5 |      |      | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> |
| 최신목록 생성 |  8.2 | 1.4 |      |      |      | <i class="icon check"></i> | <i class="icon check"></i> |
|---------------|------|-----|------|------|------|------|------|
| 정적파일 포함 |  8.3 | 0.1 | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> |
| 작성날짜 표시 |  8.3 | 0.0 | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> |
| 테그 표시     |  8.4 | 0.1 | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> |
| 앞/뒤 연결    |  8.6 | 0.2 | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> |
| 관련목록 생성 | 12.7 | 4.1 |      | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> | <i class="icon check"></i> |
|---------------|------|-----|------|------|------|------|------|
|               |      |     | _4.2_ | **8.3** | **8.8** | 10.2 | 12.7 |
|---------------|------|-----|------|------|------|------|------|

현재, 전체 기능을 살린 상태에서 137개의 글에 대한 HTML을 생성하는데
총 12.7초가 걸리고 있다.(심지어, 어떨 때에는 20초씩 걸리기도 한다.)

여기서 만약, 카테고리와 최신목록, 그리고 프로젝트 목록의 자동생성을
1회로 줄이고 이것을 "정적파일 포함" 방식으로 변경한다면 약 4.4초를
줄인 8.3초 정도로 Build 시간을 단축할 수 있을 것 같다.  
또한, 추가로 관련목록을 생성하는 부분을 미리 생성한 Tag 목록으로
대체할 수 있다면 다시 4초를 줄여서 4.2초 대에 Build를 끝낼 수 있다는
계산이 된다.

> 과도하게 소모되는 8초를 잡아라!

어떻게 잡을 것인가? 그 이야기는 다음 회에...


