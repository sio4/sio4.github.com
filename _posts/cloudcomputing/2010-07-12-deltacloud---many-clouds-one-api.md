---
redirect_from: /blog/2010/07/12/deltacloud---many-clouds-one-api/
title: 클라우드 답기 위하여... Deltacloud - Many Clouds, One API
tags: DeltaCloud Redhat API Ruby-on-Rails Hybrid-Cloud 클라우드컴퓨팅
categories: ["cloudcomputing"]
date: 2010-07-12T10:32:13+09:00
modified: 2011-03-04T13:44:04+09:00
---
궁극적으로, [클라우드 컴퓨팅](http://en.wikipedia.org/wiki/Cloud_computing)이
사용자에게 제공하는 이득 중에서 가장 핵심적인 것이 사용자의 IT를 유연하게
만들어주는 것이다. 이 유연성은 아직 "신개념"이라 할 수 있는 클라우드 컴퓨팅을
기업 사용자를 대상으로 적용함에 있어서 풀기 힘든 문제 중 하나이기도 하다.

대부분의 안정화된 기업 전산 환경은 이미 어느 정도 예측 가능하며 지속적으로
발생하는 IT 수요와 부하를 가늠할 수 있기 때문에 클라우드 컴퓨팅이 가져다준다는
확장성이나 유연성, 이를 통한 비용 절감은 기대하기 어려울 수 있다. 이런
상황에서 여기서 소개하는 Deltacloud와 같은 유형의 관리 소프트웨어를 활용한
Hybrid Cloud 는 좋은 답이 될 수 있을 것이다.

> 일반적인 기업 전산환경과 클라우드 컴퓨팅
> 
> - 인터넷/IT 서비스가 중심이 아닌 경우, 사용자의 수가 변동적이지 않으며 IT 부하 역시 고정적이다.
> - 내부 자료에 대한 유출 예방이나 보안을 중요시 여기며, 퍼블릭 클라우드 서비스에 대한 신뢰는 아직 낮다.
> - 인프라 층에 대하여 가상화 기술 등을 이용한 시스템 통합 작업을 추진중이거나 계획중이다.
> - 사실, 통합할 자원이 그렇게 많지도 않다.
> - IT 활용 영역이 상대적으로 역동적이지 않다.

글을 쓰다보니 조금 짜맞추는 느낌도 없지 않네... 사실, IT 의존성이나 활용도가
높지 않은 비 IT 기업의 경우라면 큰 그림에서 IaaS나 PaaS가 아닌 SaaS를 고려하는
편이 오히려 맞을 수도 있을 것인데... 기회가 되면 이 부분도 정리해봐야겠다.

암튼, 주제로 넘어와서 레드햇이 지원하는 하이브리드 클라우트 관리 소프트웨어
프로젝트인 [Deltacloud](http://deltacloud.org)를 소개한다. 이 소프트웨어는,
EC2 등의 퍼블릭 클라우드 서비스와 [OpenNebula](http://opennebula.org) 등으로
구축한 내부 클라우드 팜을 하나로 통합하여 동일한 인터페이스로 관리할 수
있도록 해준다.

[Deltacloud \| Many Clouds. One API. No Problem.](http://deltacloud.org/)

> Start an instance on an internal cloud, then with the same code start another on EC2 or Rackspace. Deltacloud protects your apps from cloud API changes and incompatibilities, so you can concentrate on managing cloud instances the way you want.

![](/attachments/2010-07-12-deltacloud.png){:.fit}

내내야 첫 페이지의 설명인데, 조금 더 상세한 설명은...

> Deltacloud Core gives you:
> 
> - REST API (simple, any-platform access)
> - Support for all major cloud service providers
> - Backward compatibility across versions, providing long-term stability for scripts, tools and applications

> One level up, Deltacloud Aggregator provides a web UI in front of the Deltacloud API. With Deltacloud Aggregator, your users can:
> 
> - View image status and stats across clouds, all in one place
> - Migrate instances from one cloud to another
> - Manage images locally and provision them on any cloud

좋아보이나? 아직 자세히 문서를 읽어보거나 설치하여 시험해보지는 못했는데,
일단 개념적으로 봤을 때 작년에 진행했던 프로젝트(클라우드 컴퓨팅/가상화
인프라 관리 솔루션)의 밑그림과 거의 동일한 비젼을 가지고 있는 것으로 보인다.
반갑네!

관련된 글들을 몇 개 더 보자.

[Building Hybrid Clouds with OpenNebula and Deltacloud \| Virtualization Journal](http://virtualization.sys-con.com/node/1430079)

> OpenNebula has just released a Deltacloud adaptor to build Hybrid Clouds. A Hybrid Cloud is an extension of a Private Cloud to combine local resources with resources from one or several remote Cloud providers. The remote provider could be a commercial Cloud service or a partner private infrastructure running a different OpenNebula instance. Hybrid Cloud computing functionality enables the building of cloudbursting and cloud federation scenarios.

멋지지? 꽤나 지명도 있는 오픈소스 클라우드 컴퓨팅 관리 소프트웨어인
OpenNebula 프로젝트에서도 이 Deltacloud에 대한 지원을 제공하고 있다. 보기
좋은, 그리고 시사하는 바가 있는 오픈소스와 클라우드 컴퓨팅 생태계의 모습!

[Many Clouds, One API: Deltacloud](http://www.webresourcesdepot.com/many-clouds-one-api-deltacloud/)

> Deltacloud is a Ruby gem which removes the differences between APIs of various cloud service providers and offers a single API that can communicate with them.
>
> It is a simple and easy-to-use REST API which already supports Amazon EC2, GoGrid, Rackspace, OpenNebula, RimuHosting and more.

윗 글은 Deltacloud에 대한 소개가 되어있는 글인데,
이 글을 통하여 Deltacloud의 겉모습을 조금 더 들여다볼 수 있다. (아! 물론
Deltacloud 사이트의 문서 부분에도 유용하고 자세하며 읽으면서 재미를 느낄
수 있는 글들이 많다.)

Deltacloud는 일본에서 만들어진 프로그래밍 언어이면서
[Rails](http://rubyonrails.org/) 프레임웍과 듀엣을 이루어 웹 관련 분야에서
상당한 인기를 얻고 있는 [Ruby](http://www.ruby-lang.org/)로 작성되어 있다.
또한, OS 플랫폼이나 프로그래밍 언어에 관계없이 쉽게 연결하여 사용할 수 있는
[ReST](http://en.wikipedia.org/wiki/Representational_State_Transfer) API를
제공하고 있다고 하니, 이건 뭐, 개념부터 외부 구현까지 딱! 내 입맛에 맞춤이다.

[Watzmann.Blog - Deltacloud sings a new tune](http://watzmann.net/blog/2010/03/z-deltacloud-new-tune.html)

> A few weeks ago, I came across Sinatra, a minimalist Ruby web framework, much leaner, meaner and simpler than Rails — while it’s probably not a good fit for traditional database-backed web applications, it seemed like an ideal framework for Deltacloud Core.

Ruby하면 Rails가 아주 실과 바늘 같이 떠오르기 마련인데, 또 하나의 Ruby기반
웹 프레임웍인 [Sinatra](http://www.sinatrarb.com/)와 관련된 글이 하나 있어서
같이 소개한다. 이 사람의 의견에 따르면 전통적인 Database Application이 아닌
Deltacloud와 함께 이용하기에 안성맞춤이라고... 하네? Deltacloud의 입장에서
뿐만 아니라 Ruby 기반의 프레임웍으로써도 확인해볼 가치가 충분할 것 같다.

[Red Hat News \| Introducing&nbsp;Deltacloud](http://press.redhat.com/2009/09/03/introducing-deltacloud/)

> The goal is simple. To enable an ecosystem of developers, tools, scripts, and applications which can interoperate across the public and private clouds.
> 
> Today each infrastructure-as-a-service cloud presents a unique API that developers and ISVs need to write to in order to consume the cloud service. The deltacloud effort is creating a common, REST-based API, such that developers can write once and manage anywhere.

마지막 글은 Red Hat의 공식 발표. 작년 9월의 발표인데, Deltacloud의 방향성을
간단명료하게 소개하고 있다.

확인해 봐야겠고, 두고 봐야겠지만... 일단 응원하고 싶은 프로젝트다. 그런데
Red Hat의 가상화 관리 소프트웨어 프로젝트인 oVirt와는 어떤 관계가 있을까? 응?

