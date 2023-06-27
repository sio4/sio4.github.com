---
title: Jekyll로 Github Pages에 블로깅하기, Re!oaded
tags: ["Jekyll", "Github", "Github-Pages", "blogging", "Disqus", "social-network"]
categories: ["productivity"]
image: /attachments/20150808-ghp-reloaded-1.png
date: 2015-08-08 23:04:33+09:00
---
몇 주 전
"[블로그, Tistory로부터 Github Pages로 이주]({% post_url productivity/2015-07-24-migration-from-tistory %}){:.reference}"라는
글을 통해서, "**어떤 방식으로 Tistory로부터 Github Pages로 이사를
했는지**"를 중심으로 기록을 남긴 바 있다. 이번에는 내 글들의 새
터를 "**좀더 블로그답게 정비한**" 이야기이다.

따지자면 5년 전에 적었던 
"[Jekyll로 github에 블로깅하기]({% post_url misc/2010-05-27-blogging-on-github-with-jekyll %}){:.reference}"의
2탄인 샘이고, 얼마 전, 좀 대충 적은 듯 한
"[Setup Jekyll for Github Pages]({% post_url misc/2015-07-23-setup-jekyll-for-github-page %}){:.reference}"와
함께 읽으면 Github Pages를 이용한 블로깅을 새로 시작하는 사람들에게는
그럭 저럭 읽어볼만한 "시작하기+@ Guide"가 될 수 있을 것이다.

## Social Network 연동

Posting한 글에 대한 소셜 연동은 예전에 Addthis를 이용하여 이미 해둔
상태이다. 그런데 그게 장단이 있는데... Addthis는 다음과 같은 특성이
있다.

* 공유 숫자를 포함하여 표시할 경우, 그 숫자가 Addthis를 통한 숫자인
  듯 하다. 버튼을 누르고 최종적으로 Posting을 하지 않았는데 숫자가
  올라갔던 경험이 있다. (사실 정확히는 모르겠다.)
* Official 버전의 소셜 버튼/Plugin이 제공하는 서비스 특유의 기능
  사용이 어렵다. (예를 들어, 이미 공유한 것은 했다고 표시한다든지...)
* 각 서비스의 Icon을 내 입맞에 맞는 것으로 바꿔 쓸 수 있어서 분위기
  설정이 편하다.

그래서 새롭게 정돈을 하면서, 앞단 공유버튼을
[Facebook](https://developers.facebook.com/docs/plugins/like-button){:.ext},
[Twitter](https://dev.twitter.com/web/tweet-button){:.ext},
그리고
[Google+](https://developers.google.com/+/web/share/){:.ext}가
제공하는 공식 버튼으로 바꿨다.
([Pocket](https://getpocket.com/publisher/button){:.ext}과
[Delicious](https://delicious.com/tools){:.ext}를
더 붙이고 싶은데, 공식 제공하는 버튼이 좀 후져서 뺐다. :-)

![](/attachments/20150808-ghp-reloaded-1.png){:.fit.dropshadow}

Icon 구성 등이 편한 AddThis에게도 미련이 남아, 예전에 쓰던 AddThis
버튼은, Custom Image를 쓰던 부분을 FontAwesome 글꼴로 대신한 후, 각
서비스가 제공하는 JSON API를 이용하여 공유된 Count를 받아 표시하도록
수정하여, 아래와 같이 Post 하단에 유지하였다.

![](/attachments/20150808-ghp-reloaded-3.png){:.fit.dropshadow}

위에서 볼 수 있듯이, Prev/Next 버튼을 Post 하단에 두고 있는데, 이
부분은 Liquid Template의 `page.previous`, `page.next`를 이용하여
처리하고 있다.

## Code 참조하기

다음 그림은 페이지 중간에 Code를 넣는 경우인데, 글 본문에 코드를
직접 넣는 것을 (문서의 완결성 차원에서) 선호하지만 경우에 따라
Github의 코드를 그대로 따와야 할 때가 있다. 이 때 사용할 수 있는
서비스가
[Gist-It](http://gist-it.appspot.com/){:.ext}이다.
이 서비스를 이용하면, 아래와 같이 나름 깔끔하게 Github에 위치한
파일을 바로 끓어다 붙일 수 있다.

![](/attachments/20150808-ghp-reloaded-2.png){:.fit.dropshadow}

물론 이 내용은, Github Pages를 사용할 때 만나는 제한점을 피할 때
필요한 방법이라기 보다는 Github에서 Hosting되는 Code를 참조하기
위한 일반적인 방법이긴 하다.

## Github Pages, 자질구레 빈 곳 채우기

Github Pages에서 아쉬운 것 중 하나가, 보통의 블로그에서는 보편적인
기능이고 Jekyll 역시 지원하는 기능이지만, Github Pages의 제한에
의해 사용할 수 없는 **관련된 글들을 함께 보는 기능**이다.
(Github Pages에서는 `site.related_posts`를 사용하면, jekyll의
기본값인 "Most Recent"를 반환하게 된다. `lsi` 옵션을 사용할 수
없기 때문인데, 관련 내용은
[여기](https://help.github.com/articles/using-jekyll-with-pages/#configuration-overrides){:.ext}를
참고)

아래의 내용은, `site.related_posts` 대신에 Post의 Tag를 참고하여
동일한 Tag를 가진 포스트를 표시하도록 해본 것이다. 그런데 중복
처리 등의 세세한 조작을 하지 않고 날짜 비교 등도 하지 않는 바람에,
이렇게 좀 지저분한 (중복도 있고, 오래된 글들도 나오고) 결과가
나오긴 한다.
하지만, 단지 최근 문서를 관련 문서라고 보여주는 것 보다야...

![](/attachments/20150808-ghp-reloaded-4.png){:.fit.dropshadow}

다음은 "**댓글**"인데, 정적 특성의 Github Pages는 동적인 댓글의
수용이 아얘 불가능한 구조이다. 이 것을 해결해줄 수 있는 서비스가
[Disqus](https://disqus.com/){:.ext}이다. (뭐, 사실 내 블로그는
댓글이 거의 없는... 뭐랄까 악플보다 무서운 무플의 사이트이긴
하다. ㅋㅋㅋ)

이 서비스는 Mail이든 Facebook/Twitter 등의 소셜네크워크 기반이든
일단 자신이 원하는 방식으로 로그인을 하면, 어느 곳에서나 일관된
모습으로 토론 참여를 할 수 있고, 그 중심이 관점에 따라 참여자일
수도, 사이트일 수도 있는 그런 서비스이다.

![](/attachments/20150808-ghp-reloaded-5.png){:.fit.dropshadow}

이와 유사한 것을 요즘은 Facebook을 통해 하는 경우가 많은데, 이에
대한 얘기는 다음에 기회가 되면...

마지막은 **RSS Feed**에 대한 것인데, 이건 Github Pages가 지원하지
않는다고 할 수는 없으나 좀 더 편리하게 사용하기 위한 것으로,
[Feedburner](https://feedburner.google.com/){:.ext}를
사용하여 제공하도록 설정하였다.

![](/attachments/20150808-ghp-reloaded-6.png){:.fit.dropshadow}


## 그리고 Github Pages 호환성 유지

이런 작업을 한참 하다가, 혹시 Github Pages의 변화가 있을 수도
있다는 생각이 들어서 `github-pages` gem의 업데이트를 해봤다.
`bundler`를 사용하므로 아래와 같이 간단하게 업데이트를 할 수
있다.

```console
$ bundle update
<...>
Installing minitest 5.8.0 (was 5.7.0)
Installing ethon 0.7.4
Installing typhoeus 0.7.2
Installing github-pages-health-check 0.3.2 (was 0.3.1)
Installing jekyll-gist 1.3.0 (was 1.2.1)
Installing jekyll-sass-converter 1.3.0 (was 1.2.0)
Installing redcarpet 3.3.2 (was 3.3.1) with native extensions
Installing jekyll-feed 0.3.1 (was 0.3.0)
Installing jemoji 0.5.0 (was 0.4.0)
Installing github-pages 39 (was 38)
<...>
Bundle updated!
$ 
```

새 버전이 적용된 것이 좀 있고, 완전히 새롭게 설치되는 `ethon`와
`typhoeus`는 `libcurl` Wrapper라고 하니, 뭔가 다른 Website와 엮을
수 있는 기능이 있나보다. 

이렇게, Github Pages에서 제공되는 기능에 대해 조금 더 검토해보면,
조금 더 편하게 쓰고 제대로 쓸 수 있을 것 같다.


아직 좀 모자람이 있지만, 이제 그럭저럭 쓸만한 모습을 갖춰가는 것
같다.

