---
title: "Docker: Getting Started with Docker"
subtitle: Docker 시작하기
tags: Docker Container cloud-computing
categories: ["cloudcomputing"]
image: /assets/logos/docker-horizontal.800.png
banner: /assets/logos/docker-horizontal.800.png
date: 2018-02-08T10:00:00+0900
---
예상하지 못했던 여유가 생겨서, 미루고 또 미뤘던 주제를 하나 정리하려고 한다.
이미 많은 사람들에게 친숙한 기술용어가 되어버린 Container, 그리고 그 시대를
이끌고 있는 대표주자인 [Docker]가 그것인데, 이번 글에서는 [Docker]의 개념에
대하여 대충 정리하고, 다음 글에서는 Ubuntu 환경에서 [Docker]를 설치하여 맛을
보는 과정을 짧게 정리하려고 한다.

![](/assets/logos/docker-horizontal.800.png)

지구의 Computing 환경은 가상화의 시대를 지나 그것을 기반으로 한 IaaS 중심의
Cloud Computing 시대로의 진화를 끝냈고, 또 하나의 Cloud Computing 접근 방식인
PaaS는 _"나는 내 일을 할테니 너는 '내' 떡을 썰어라"_ 라는 개념에 더욱 집중하여
사용자로 하여금 _"이제 Platform을 줄테니 IaaS의 I, 즉 Infrastructure를 완전히
잊어라"_ 고 말하고 있다. 하지만 여러가지 이유로 PaaS가 주는 개발/구동 환경만을
이용해서 내 일을 완전히 끝내기가 쉽지 않은 경우가 있는데, 이 어중간한
상황으로부터 사용자와 제공자를 동시에 구해주는 기술 중 하나가 바로 Container
라는 기술이다.
(뭐, 관점이 하나 뿐이겠냐마는...)


{:.boxed}
> 이 묶음글은 아직 몇 회까지 쓸지 정하지 못했다. 조금 써보고,...
> 
> * _Docker: Getting Started with Docker_
> * [Docker: Installation and Test Drive]
> * [Docker: 나의 첫 Docker Image]
> * ['쓸만한' Docker Image 만들기 - Part 1]
> * ['쓸만한' Docker Image 만들기 - Part 2]



## 클라우드 혁신

20세기 말의 닷컴 열풍으로 대변되는 웹과 인터넷을 기반으로 한 산업 변화를
거치면서, 우리는 [Web API]를 중심으로 그와 연계된 다양한 "향상된 웹 기반
기술"을 갖게 되었다. 이와 비슷한 시기에 발전한, 시대를 대표하는 주류 기술
중에는 "서버 가상화 기술"도 있는데, **이 두 기술, "향상된 웹 기반 기술"과
"서버 가상화 기술"이 만나면서 Cloud Computing 시대를 열었다.**
(웹 기반 기술, 가상화 기술과 함께 Open Source 운동이 Cloud Computing의 제
3 원소라고 생각한다.)

이렇게 혁신이라는 것은, 갑작스럽게 새로운 무언가가 우리 앞에 "_뚝!_" 하고
떨어지는 것이 아니라, 이미 우리 옆에서 계속 꿈틀거리던 (어쩌면 하찮게 여기던)
조각들이 "_딱!_" 하고 결합되면서 새로운 의미를 "_떡!_" 하니 갖게 되는
것이라고 생각한다.

장안의 화재 [Docker] 역시, 어느 날 하늘에서 뚝! 하고 떨어진 황금 복숭아는
아니다. 이미 오래 전부터 존재했던,

* `chroot` 처럼, 하나의 서버 내에서 특정 프로세스를 고립시키는 격리 기술[^1]
* 오픈소스 혁명으로부터 출발한 `debian`의 `apt`, `ruby`의 `gem` 등의 각양
  각색의 Software Repository 열풍[^2]
* ISV로 하여금 Software 출시와 배포를 쉽게 해주는 (Virtual) Software
  Appliance 형태의 출시 방식[^3]
* 심지어는 선캄브리아기부터 쓰이던 `make` 같은 절차 기술 언어[^4]

등의 조각들이 직접적으로 사용되든, 개념적으로 차용되든 함께 어울어지면서,
그리고 인터넷에 기반한 Cloud Computing이라는 바닷 바람을 만나면서 빛을 본
것이다.




# Docker? Container?

Docker는 Software의 출시 또는 Service 제공을 위한 기반환경을 "기술 가능한
형태"로 체계화하여 관리할 수 있도록 해주는 Container 관리 제품의 이름이다.
Docker에 대해 얘기하기 위해서는 먼저 Container에 대해 정리할 필요가 있겠다.


## Container

Container는 개별 Software의 실행에 필요한 실행환경을 독립적으로 운용할
수 있도록 **기반환경 또는 다른 실행환경과의 간섭을 막고 실행의 독립성을
확보해주는 운영체계 수준의 격리 기술**을 말한다.  
운영체계를 기반으로 만들어진 대부분의 Software는 그 실행을 위하여 OS와
그 Software가 사용하는 동적 Library 등에 대하여 의존성을 갖는다. 즉,
Software의 실행을 위해서는 기반 OS와 Library를 포함하여 이 Software가
필요로 하는 파일 등으로 구성된 실행환경이 필요하다는 뜻이다.
이 때, 하나의 시스템 위에서 둘 이상의 Software를 동시에 실행하려고 한다면
각각이 요구하는 조건을 모두 만족시켜야 하며, 경우에 따라서는 그 조건들
사이에서 충돌이 발생할 수 있다.

![](/attachments/docker/without-confirm.png){:.half.pull-right}

극단적인 예를 들어, Software A와 B가 동일한 Library를 사용하지만 서로
다른 버전을 필요로 한다면 두 Software가 같은 시스템 위에서 동작하게 만드는
것은 운영체계 구성에서 조금 복잡한 꼼수가 필요하게 된다. 그렇게 꼼수로
무장한 시스템은 배포와 관리가 복잡해질 수 밖에 없다.
또한, 이렇게 복잡도가 증가한 환경을 운영하다 보면, 실수가 발생할 가능성이
높아지며, 그러한 실수는 A와 B의 안정적인 운영에 큰 방해가 된다. 그리고
그 두 Software의 운영 주체가 다를 경우, 그 관계 속에서 기술 영역을 넘어선
또다른 문제가 발생하는 것도 예상할 수 있다.  
이런 상황이라면 가장 효율적인 해결책은 두 Software를 위한 시스템을 각각
준비하는 것인데, 만약 이것을 서버의 분리로 해결하려고 한다면 비용이 크게
증가하게 된다.
Container 기술은, 이와 유사한 조건에서 여전히 하나의 Hardware 서버를 함께
사용하되, 각각의 Software가 동작하는 환경을 운영체계 수준에서 격리된
각각의 공간으로 분리, 격리하여 제공하는 것을 가능하게 한다.


## Docker

[Docker]는 Software의 출시 또는 서비스 제공을 위한 기반환경을 "기술 가능한
형태"로 체계화하여 **서비스 배치는 물론, 그 생명주기 관리를 편리하게 만드는
Linux 기반 Container 제품의 이름**이면서, 동시에 이것을 제공하는 회사의
이름이다.  
사실, 이 글을 처음 쓰기 시작했던 2015년에는 오픈소스 프로젝트명이었던 것
같은데 그 동안 세상이 변한 것 같다.[^5] 그리고 지금은 Linux 뿐만 아니라
Windows 위에서도 동작한다고 한다.

아... 그런데 설명이 살짝 이상하다. "Container"라는 단어는, 위의 설명도
그렇고 시스템 영역에 가까이 있는 사람들에게는 나름 익숙한 인프라 성격의
용어인데, Docker에 대한 설명은 뭔가 상당히 Software 개발스럽다. 뭘까?
바로 이 설명이 (그리고 이 제품 자체가) 최근 컴퓨팅 세상이 변하고 있는
방향을 반영하고 있다고 볼 수 있을 것 같다.  
Container 기술 자체는, 격리된 실행환경을 제공하기 위한 인프라 기술이긴
하지만, Docker는 이미 그 이름에서 향기를 품고 있듯이, 그 목적부터
**Software 또는 Service의 빠르고 효율적인 Shipping**에 강하게 집중하고
있다. 때문에 Docker는, 근간이 되는 격리 기술을 넘어 Container와 Image,
네트워크와 서비스, 보안 등 Software의 배포와 생명 주기를 관리할 수 있는
다양한 주변 기능에 초점이 맞추어져 있다고 할 수 있다.  
또한, 그 배경에는 _DevOps_로 표현되는, 개발과 운영, Application과
Infrastructure를 서로 다른 입장에서 협업하는 평행선으로 생각하지 않고
서비스를 중심으로 하나가 되어 유기적으로 호흡하는 _꼬임선_으로 정의하는
움직임과, 인프라 구성을 포함하여 서비스에 관련된 모든 것을 Software적인
시각에서 "**기술할 수 있는 방식**"으로 풀어내는 최근의
**[Infrastructure as Code]**라는 시각이 반영된 것으로 풀이할 수도 있다.


## 그래서, Virtual Machine과 뭐가 달라?

Container를 설명하면서, "격리", "독립", "기반환경", "하나의 시스템 위에서"
등의 단어와 구문을 사용했다. 가만 보니, 어디서 많이 들어본 설명인데,
서버 가상화를 얘기할 때 우리가 많이 사용하는 단어들이다. 그렇다면 가상화와
Container는 뭐가 다를까?

서버 가상화의 개념은, 실존하지 않는 가상의 기계, Virtual Machine을 만들어서
이 VM이 물리서버의 실제 자원을 가상화 계층 위에서 간접적으로, 그러나 마치
그렇게 추상화된 자원이 정말 존재하는 것처럼 활용할 수 있도록 해주는 기술이다.
이 기술을 통하여 만들어지는 결과물은 "_가상의 기계_"이며, 그 기계 안에는
완전히 독립적인 운영체계가 자신이 사실은 허공에 떠 있는지도 모른 채
동작하도록 해주는 것이다. (물론, 요즘의 향상된 가상화 방식을 지원하는
운영체계는 자신이 실제 기계 위에서 동작하는지, VM 위에서 동작하는지 알기는
한다.)

반면에 Container는, 물리서버 (또는 가상서버) 위에 설치된 운영체계가 다시
그 안에서 운영체계가 제공하는 실행환경 격리 기술을 이용하여 제한된 접근영역
안에서 실행의 독립성을 보장할 수 있도록 공간을 격리시켜주는 기술이다.
이 기술을 통하여 만들어지는 결과물은 "_격리 공간_"이며, 이 격리 공간 안에서
실행되는 Software는 그 공간에 갇히게 되어, Host 영역을 포함한 외부에 대한
접근이 차단되게 된다.  

여기서, 격리 또는 분리를 일으키는 위치가 중요한데, 가상화가 "기계"를 완전히
새롭게 만들어내는 것과는 달리, Container는 단지 "공간"을 따로 할당해준다는
차이가 매우 크다.

그래서,

* 서버 가상화와는 달리 Container는, Host 운영체계의 Kernel을 공유하게
  되며, 하나의 기계 안에서는 동일한 Architecture/운영체계용으로 만들어진
  Software만 기동시킬 수 있다.
* 서버 가상화는 운영체계를 포함한 전체 Stack을 개별적으로 사용하지만,
  Container는 그 Container가 담고 있는 Software가 필요로 하는 파일만
  자신의 공간에 담으면 충분하다.

이러한 특징으로 인하여 Container는,

* 이미 기동중인 Host 운영체계에서 자신의 Software만 실행하면 되기 때문에
  "부팅시간"이라는 것이 필요없고 매우 빠르게 서비스를 시작할 수 있다.
* 운영체계의 Kernel 뿐만 아니라 기본 서비스나 사용하지 않는 유틸리티 등을
  이미지에 담을 필요가 없기 때문에 Disk 사용량을 매우 작게 유지할 수 있다.
* 메모리 역시, Kernel 및 기반 서비스에서 차지하는 부분을 완전히 공유하기
  때문에 저사양의 하드웨어나 VM에서도 많은 수의 Container를 띄울 수 있다.

말하자면,  
리조트에서 주방, 침실, 거실, 수영장 등이 딸려있고 독립적인 난방을 할 수
있는 독채 팬션을 빌리는 것이 VM 이라면, Container는 침대 하나, 화장실
하나로 구성된 원룸형 호텔 방을 빌리는 것이라고 할 수 있다. (수영장과
식당은 공용 공간에 마련되어 있다.) VM이 럭셔리하긴 한데... 지불해야 할
비용이 좀 비쌀 것이고, 호텔 방은 상대적으로 저렴하지만 정말 필요한 것만
딱! 갖추고 있는 것이다. 어쨌든 내가 혼자서 편하게 쉴 수 있는 방은 있다.

### 그림으로 비교하기

아래 Stack 형식으로 표현된 그림을 통해, 앞서 설명한 구성 단위나 기술
요소 등을 살펴볼 수 있다.

![](/attachments/docker/container-concept.png)

그림의 왼쪽 Stack은 서버 가상화 기술을 이용하여 두 개의 Application A와
B를 서비스하는 모양을 나타낸 것이고, 오른쪽 Stack은 Container 기술을
이용하여 A와 C라는 Application을 서비스하는 모양을 나타낸 것이다.

여기서 푸른색 상자가 각각 VM이 포함하고 있는 요소와 Container가 포함하는
요소인데, 시각적으로 표현한 바와 같이, Container에는 VM에는 포함되어 있는
운영체계가 빠져있다. 대신, "Host Operating System #1"로 표시한 Host의
운영체계가 그 역할을 제공해준다. 또한, 가상화에서는 OS #1, OS #2로 표현한
바와 같이, 서로 다른 운영체계 또는 운영체계 버전을 함께 활용할 수 있는
것과는 달리, Container에서는 Host 운영체계의 영향 하에서만 Application이
기동될 수 있다. (따라서, Application B는 Container에서는 실행이 불가능하다)



---

사실, 개인적으로 이런 격리 환경을 매우 좋아한다. 한참 Embedded 제품을
개발하던 시절에는 아직 EOS 되지 않고 남아있는 제품의 유지보수를 위해
철지난 개발환경을 사용 가능한 형태로 보존하기 위해서 `chroot`를 사용했었고,
역시 `chroot`를 활용한 Tomcat 기반의 Web Application 구동을 위한 Jail과
Jail 관리와 배포 자동화를 위한 환경을 수제품으로 만들어 Production 환경에
적용했던 적도 있었다. (지금도 그대로 있으려나?)

뒤늦게나마, 제대로 만들어진 공산품 Container를 만나서 참 반갑다!  
반갑다 Docker!

다음 글에서는 Ubuntu에 Docker를 설치하기 시험운전을 하는 과정에 대하여
살펴보려고 한다.



### 함께 읽기

이 묶음글은 아직 몇 회까지 쓸지 정하지 못했다.

* _Docker: Getting Started with Docker_
* [Docker: Installation and Test Drive]
* [Docker: 나의 첫 Docker Image]
* ['쓸만한' Docker Image 만들기 - Part 1]
* ['쓸만한' Docker Image 만들기 - Part 2]

['쓸만한' Docker Image 만들기 - Part 2]:{% link _posts/cloudcomputing/2018-02-20-build-usable-docker-image-part2.md %}
['쓸만한' Docker Image 만들기 - Part 1]:{% link _posts/cloudcomputing/2018-02-19-build-usable-docker-image-part1.md %}
[Docker: 나의 첫 Docker Image]:{% link _posts/cloudcomputing/2018-02-14-build-my-first-docker-image.md %}
[Docker: Installation and Test Drive]:{% link _posts/cloudcomputing/2018-02-08-docker-installation-and-test-drive.md %}
[Docker: Getting Started with Docker]:{% link _posts/cloudcomputing/2018-02-08-getting-started-with-docker.md %}


[^5]: 지금 시점에서 이 동네의 변화를 살펴보니, 이제 Docker는 더 이상 Open
      Source 프로젝트가 아닌 것 같다. Docker라는 TM은 상용 서비스를 제공하는
      회사의 제품명/회사명이 되었고, 이들은 Docker의 Enterprise Edition 및
      Community Edition을 제공한다. 또한, Docker의 Codebase는 [MobyProject]
      라는 이름의 프로젝트로 전환된 것 같다.
      (Github에서 Hosting되던 docker/docker로 들어갔더니 [Moby Repository]로
      뛴다.)

[^1]: Docker가 사용하는 Container 기술은 기본적으로 "독립적 실행환경"을
      가볍게 제공한다는 개념에서 출발한다. 

[^2]: 인터넷이 폭넓게 사용되고 동시에 오픈소스의 활용이 광범위해지면서,
      인터넷을 기반으로 Software를 배포하고 배포를 자동화하는 기술이 매우
      널리 쓰이고 있다.  Ruby Gem, Python PIP, Redhat의 Yum, Debian의 Apt 등.

[^3]: 개인적으로 점점 더 많은 Software Vendor가 Virtual Appliance를 사용하는
      것이 가상화 시대의 정점이 될 것이라고 예상했었다. 세상은 내 생각보다
      더 빠르게 변하고, 조금 변형된 모습으로 그 시대가 오고 있는 것 같다.

[^4]: 가상화 기술과 함께 기존에 딱딱하게 여기던 것들을 모두 Software화 하는
      흐름 속에서, 결국 모든 것이 Programmable한, Programmatic한 방향으로
      변하고 있다. 그 중 한 축이 바로 "라면 요리법" 같은 "절차 기술 언어"의
      사용이다. (절차 기술 언어라는 말은 내가 급조한 말인데, 우리가 자동화
      하고싶은 일련의 절차를 상황과 조건 등에 따라 적절한 동작을 할 수 있도록
      서술할 수 있도록 해주는 방식을 통칭해서 표현해봤다.)


[Web API]:https://en.wikipedia.org/wiki/Web_API
[Docker]:https://www.docker.com
[Docker CE Repository]:https://github.com/docker/docker-ce
[Mobyproject]:https://mobyproject.org/
[Moby Repository]:https://github.com/moby/moby
[Infrastructure as Code]:https://en.wikipedia.org/wiki/Infrastructure_as_Code
