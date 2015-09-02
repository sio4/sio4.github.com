---
redirect_from: /blog/2015/07/24/migration-from-tistory/
title: 블로그, Tistory로부터 Github Pages로 이주
tags: 블로깅 Github Ember.js Semantic-UI Markdown
image: /attachments/2015-07-24-migration-from-tistory.jpg
date: 2015-07-24 12:23:21+09:00
---
얼마 전에
[Ember.js](http://emberjs.com/)와
[Semantic-UI](http://semantic-ui.com/)를
사용한 프로젝트를 진행하고 나서, 발표 초기에 얼마간 맛보기로만 사용해본
후 방치해오던
[Github Pages](https://pages.github.com/)를
다시 사용하는 것이 어떨까... 하는 생각을 하게 됐다. 그래서, 일단 2007년부터
2012년까지 사용하다가 역시 방치하고 있었던 Tistory의 글들을 여기로 옮겨왔다.  
이 글은, 옮기기로 결정한 이유와 옮긴 과정, 그리고 그로 인한 변화를 담고 있다.
![](/attachments/2015-07-24-migration-from-tistory.jpg){:.fit.dropshadow}

## 왜 Github Pages로 옮겼는가?

결국, "왜 옮겼는가?"는 **Github Pages가 갖는 특징**이 뭔지 생각해보는 것으로
대신할 수 있을 것 같다. 다른 이들도 Github Pages를 쓴다면, 비슷한 이유일
것이다.

1. Github Pages는 자유롭다. 페이지를 만드는 것도 평범한 HTML파일을 그대로
   사용할 수도 있고, [Jekyll](http://jekyllrb.com/)을 이용하여 보다 쉽게,
   프로그래머답게 Content를 작성할 수 있다.
1. HTML을 직접 작성하는 대신 Markup을 사용할 수 있다. (Jekyll을 사용하여)
   [Textile](https://en.wikipedia.org/wiki/Textile_%28markup_language%29)도
   가능하고 [Markdown](https://en.wikipedia.org/wiki/Markdown)도 가능하다.
1. Javascript도 딱 필요한 만큼 사용할 수 있다. (서비스 제공자가 더하거나
   빼지 않는다.) 그래서 불필요하게 무거워지거나 더러워지지 않고, 또한
   Ember.js 등을 이용한 동적인 페이지 작성도 가능하다.
1. [Github](http://github.com)를 사용하는 개발자라면, 자신의 프로젝트 별
   페이지를 자신의 홈페이지와 연결하여 사용할 수 있다. 하나의 포인트 안에
   개발자/개발팀의 모든 것을 넣을 수 있는 것이다.

결론: 개발자에게는 이렇게 훌륭한 웹서비스가 더 없을 것 같다!

그러나 단점도 있다.

1. API 등을 이용한 원격 블로깅이 불가능하다. 모든 Publishing은 Git을
   이용하여 이루어진다. (전에는
   [MovableType](https://en.wikipedia.org/wiki/Movable_Type) API를
   사용하여 편리하게 사용했었는데...)
1. 하지만 Git/Github를 바로 이용한 원격관리용 App 등은 존재한다.
   다시, 하지만, 아직 쓸만한 것을 찾지는 못했다. :-(
1. 보통의 Wiki(내 경우는 [Wikidot](http://wikidot.com))에서 얻을 수 있는
   Page 간의 Hierarchy 관리 등 향상된 기능을 사용할 수는 없는 것 같다.
   이 부분은 좀 더 고민을 해서 방법을 찾아보려고 한다.

아무튼, (특히 소프트웨어) 엔지니어의 외부 기억장치로써, 견줄 곳이 없다.

### 비교

가장 두드러진 특징은 위와 같다. 구색을 맟추어 다른 도구들과 비교를 하자면,
보통의 블로그에 비해 "보다 (엔지니어용) 문서답다"는 장점을 얻으면서
API를 통한 원격 포스팅 등, 범용적인 활용에 제한을 갖게 되며, Wikidot을
비롯한 Wiki 시스템에 비하자면 "큰 자유"를 얻고 "체계"를 버리는 샘이 된다.  
체계와 자유. 갈등은 있으나, 일단은 간다.

{:.styled.fit}
|      | Github Pages   | 블로그 #1      | 블로그 #2      | Wiki           |
|:----:|:--------------:|:--------------:|:--------------:|:--------------:|
| 어디 | Github Pages   | Tistory        | Tumblr         | Wikidot        |
| API  | Git            | Movable Type   | (?)            | Wikidot API    |
| 작성 | Markdown,Textile | WYSIWYG, Markdown | Markdown  | Wikidot Style  |

뭔가 더 많은데, 지금은 여기까지만.

## Tistory에서 Github로 옮기기

일단 옮기기로 마음을 굳혔다면, 그 다음은 방법의 고민이다. 쉽게 가야지.
그러나, 이사라는 것이... 쉬는 것은 아니라서 방법의 고민이 오히려, 옮기는
결정보다 더 어려웠다.

### 방식 고민

확인해보니 Tistory에 게시된 글의 수가 한 200개 정도가 된다. 그 중에는
버릴 것도 있을테니 손으로 한땀 한땀 옮기려고 생각했으나... 역시 엄두가
나지 않는다.

이런 고민이 나만의 것은 아닐 것 같아서 찾아보니, Jekyll로 기존 게시물을
옮겨주는 다양한 도구가 있더라. 눈에 들어왔던 것이 Movable Type 게시물을
Jekyll/Markdown으로 변환해주는 도구.
그런데 이게 Input Type이 내겐 맞지 않다. 내 기대는, 이것이 Movable
Type으로부터의 변환이므로 그냥 온라인으로 API를 통해서 게시물을 받아오는
구조일 것으로 예상했으나, 현실은 Backup으로부터 변환하는 구조. 그런데
Tistory는 자체적인 방식의 Backup을 제공하고 있었다.

어허... 이를 어쩌나... 그래서,

> 고민할 시간에 그냥 하나 만들었다.

### 이전 도구

Tistory의 백업은 XML 구조로 되어있다. 그나마 다행이지 않은가? 그래서
**XML을 파싱하여 Markdown으로 변환하는 도구**를 Ruby를 이용하여 만들었다.

결과물은, 다음과 같은 방식으로 돌아간다.

1. XML을 읽어서 XML Object로 저장
1. XML로부터 Post 들을 찾아내어, 모든 Post에 대하여
   1. Post의 Title, Content, Category, Tag 등을 찾아낸다.
   1. Content의 HTML을 Markdown으로 변환하는 등의 작업을 한다.
   1. Tistory 스타일의 Image Embedded 방식을 Markdown 방식으로 바꾼다.
   1. 찾아낸 정보를 이용하여 Post 파일을 만들고, 내용을 채운다.
   1. 해당 Post에 붙어있는 Attachment를 구분하여 따로 저장한다.

핵심적인 부분은, [nokogiri](http://www.nokogiri.org/)를 사용하여 XML을
처리하였고, [reverse_markdown](https://github.com/xijo/reverse_markdown)을
사용하여 HTML2Markdown의 역변환을 하였다.

조금 애먹었던 부분은, Tistory의 Image를 Embedding하는 문법이 좀 특이하여
이것을 자동으로 변환하는 것이 좀 지저분했고, 일부는 포기했다. (희한한
것이, 문법이 하나가 아니었다. 두번째 문법이 등장했을 때 바로 포기했지만,
지금 구현한 수준에서도 그럭저럭 쓸만한 변환이 된다.)

Project의 위치는 <https://github.com/sio4/tistojek> 이고, 이름이 TistoJek,
즉 Tistory to Jekyll 이다. 프로젝트 내에 몇 개의 파일이 있으나 필요한
Gem을 Bundle로 관리하기 위한 Gemfile 등이고, 실제의 변환 도구는
`tistojek.rb` 하나이다. 아래는 그것의 Full Source이다.

<script src="http://gist-it.appspot.com/github/sio4/tistojek/blob/master/tistojek.rb"></script>

### 옮기지 않은 것들

일부 게시물은 아마도 Draft 상태였을 것 같다. (변환도구에서 Post의 상태를
확인하지 않았다. 구테여) 그리고 그냥 Scrap 수준의 것들도 있고.  그래서
많이 버렸는데, 200여개의 게시물이 130개로 줄었네.

핵심적으로 빠진 부분은, Backlink/TrackBack 등은 지원할 수 없었고,
Comment는 그 체계를 [Disqus](https://disqus.com/)로 바꿀 것이기 때문에
일단 버렸다. :-(

## 옮긴 이후

### Github Pages의 변화

Github Page를 처음 사용했을 때와 많이 바뀐 것 같다. 일단 가장 중요한 것이,
Local Jekyll 환경을 쉽게 관리할 수 있도록 gem이 지원되고 있고, 기본
Markdown Processor도 [Karmdown](http://kramdown.gettalong.org/)으로 바뀌어
있었다.

또한 Jekyll의 버전이 올라가면서... 일부 기능이 예전과 같이 동작하지 않는
것을 확인했고, 그 부분에 대한 수정(\_layout 등의)도 함께 진행했다.

### 내가 바뀌어야 하는 것

(요즘은 쓰고있지 않았지만) Firefox의 Remote Blogging Addon을 더이상
쓸 수 없게 되었다. 그리고... 이제 VIM과 Git으로 글을 쓰게 되었다.
이게 좀 제한적인 것으로 보이는데, 실은 현재도 대부분의 기술 문서를
VIM으로 Local 작성 먼저(작업과 병행하여) 하고 있기 때문에 오히려
작업 단계를 줄여줄 것 같다.

아직도 (아마도 한동안) 고민인 부분은, "그럼 Wikidot의 훌륭한 문서관리
Platform을 버릴 것인가?"인데, 쉽지 않은 선택일 것 같다.  
방향성으로 보면, Github Pages가 훨씬 매력적이지만, 서비스 받는 것과
내가 직접 해야 하는 것의 차이부터 시작하여...

얼마간, 틈틈이, Wikidot이 내게 주는 혜택이 뭔지 생각해보고, 여기서 수용
가능한 것과 내가 포기할 수 있는 것이 적절한 수준으로 나올지... 봐야겠다.

> 어쨌든, 그냥 블로그보다는 개운함!!! :-)


