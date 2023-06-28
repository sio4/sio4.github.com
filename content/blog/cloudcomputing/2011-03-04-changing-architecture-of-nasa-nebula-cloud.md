---
redirect_from: /entry/new-cloud-core-of-nasa-nebula/
title: NASA Nebula Cloud의 아키텍쳐 변경
tags: ["cloud-computing", "Eucalyptus", "NASA", "OpenStack", "rules-of-action"]
categories: ["cloudcomputing"]
date: 2011-03-04T13:14:52+09:00
last_modified_at: 2011-03-04T13:14:52+09:00
---
NASA Nebula Cloud의 아키텍쳐에 관한 뒤늦은 소식.

몰랐었는데, 한동안 클라우드컴퓨팅이 내 머리속에서 떠나있었나보다. 갑자기
먹먹하다. 심지어는 잘 알던 부분들도 생각이 안난다!
ㅋ 역시, "난 이런 사람이다"라고 생각한다고 해서 그 사람이 그런 사람인 것은
아닌가보다. 어쩌면, 내가 뼈속까지 리눅스 사람, 오픈소스 사람이... 지금은
아닐지도 모른다는 무서운 생각마져 든다! ㅋ 잡설 접고,

우연히 어떤 자료를 적다가... NASA Nebula가 ONE(OpenNebula) 기반이었던가
Eucalyptus 기반이었던가 헷갈려서, NASA Nebula 페이지의 Archtecture 그림을
보러 갔다. 엥? 그림이 어디있지? 그러다가 구글링을 통해서 미쳐 인지하지
못했던 뉴스를 접했다. "_NASA가 Eucalyptus의 반쯤 닫힌 구조에 문제점을 느끼고
아예 그들 고유의 Nova라는 것을 만들었다_"는... 그리고 "그것을 오픈하고,
지금은 OpenStack에 요소로 들어가 있다"는... 소식의 요약은 이렇다.

[NASA's Nebula cloud descends on Washington • The Register](http://www.theregister.co.uk/2010/04/28/nebula_goes_to_goddard/)

> You can think of Nebula as a version of Amazon's Elastic Compute Cloud (EC2) and Simple Storage Service (S3) that's used only within the federal government, a service that provides on-demand access to scalable processing and storage resources. It's based on Eucalyptus, the open source cloud platform that's bundled with the latest version of Ubuntu. Eucalyptus. Karmic Koala. You get the picture.

> Nebula runs Eucalyptus using Linux and the XEN and KVM open source hypervisors. It also makes use of MySQL and the open source RabbitMQ messaging system, used to communicate between virtual machines and to push information down to end user browsers, according to Rabbit Technologies CEO Alexis Richardson. Richardson's outfit was recently [purchased](http://www.theregister.co.uk/2010/04/13/springsource_buys_open_source_rabbit/) by VMware's SpringSource division.

이랬었는데...

[Nasa, Nebula and OpenStack « adventures in cloud computing](http://cloud.blechnum.net/?p=81)

> [NASA](http://www.nasa.gov/) are in the process of replacing [Eucalyptus](http://www.eucalyptus.com/) with their own [Nebula](http://nebula.nasa.gov/), which is pure open source under the [Apache 2.0 licence](http://www.apache.org/licenses/LICENSE-2.0.html) and part of the [OpenStack](http://www.openstack.org/) cloud framework.&nbsp; I gather that main problem was that Eucalyptus didn’t scale enough for the size of some the projects NASA were considering, but the fact that Eucalyptus was not pure open source has been the subject of some discussion by the open source community.

스케일링에 문제가 있는것도 맞지만, 핵심적으로다가 Eucalyptus가 순수
오픈소스가 아니어서... 뭔가 손을 보는데 한계가 있다는.

[OpenStack, Nebula, and Eucalyptus - What's the Deal? - tobym's posterous](http://tobym.posterous.com/openstack-nebula-and-eucalyptus-whats-the-dea)

> For these reasons, the Nebula team pivoted and wrote their entire cloud fabric controller from scratch using C, C++, Python, and Redis, and called it Nova. Nova is now the Compute portion of OpenStack, comparable to Amazon EC2. Around the same time, Rackspace decided to open-source their cloud computing software in a bid to [commoditize the complement](http://www.joelonsoftware.com/articles/StrategyLetterV.html); their business is "fanatical support", so opening the software stack for cloud services lets them compete with that approach. Rackspace's Cloud Files, a.k.a CloudFS, a.k.a. Swift is now the Storage portion of OpenStack, comparable to Amazon S3.

그래서 맨바닥에 삽질 좀 했고, Nova라는 녀석을 만들어서,...

[NASA drops Ubuntu's Koala food for (real) open source • The Register](http://www.theregister.co.uk/2010/07/20/why_nasa_is_dropping_eucalyptus_from_its_nebula_cloud/)

> NASA is [dropping Eucalyptus](http://www.theregister.co.uk/2010/07/19/nasa_rackspace_openstack/) from its Nebula infrastructure cloud not only because its engineers believe the open source platform can't achieve the sort of scale they require, but also because it isn't entirely open source.

> NASA chief technology officer Chris Kemp tells _The Reg_ that as his engineers attempted to contribute additional Eucalyptus code to improve its ability to scale, they were unable to do so because some of the platform's code is open and some isn't. Their attempted contributions conflicted with code that was only available in a partially closed version of platform maintained by Eucalyptus Systems Inc., the commercial outfit run by the project's founders.

결국, NASA가 선택한 소프트웨어는 **단순히 자신의 용도, 규모를 수용하느냐
마느냐에 의한 것이 아니고 얼마나 열려있는지, 그래서 뭔가 자체적인 수정,
제어, 이런 사용자의 자유도 문제가 해결 가능한 플랫폼**이었다는 것!
(오픈소스의 의미는 단순히 비용절약, 철학적 문제 뿐만이 아니라 이런 자유도에
있다! 종속되지 않고 정말 원하는 일을 할 수 있는...)

**소프트웨어 선택의 우선 고려사항은, 최소한/특히나 그것이 단순한 일반
사용자용, 사무용 제품이 아닐수록, 개방성과 변경 가능성, 발전 가능성,
유연성과 기민성을 가질 수 있는 오픈소스인지 아닌지가 엄청! 중요하다는 결론!**


