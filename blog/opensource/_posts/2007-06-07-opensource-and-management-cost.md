---
title: 공개소프트웨어, 그리고 관리비용
tags: 관리비용 구글 오픈소스
date: 2007-06-07T10:53:13+09:00
modified: 2008-03-09T01:43:18+09:00
---
어제 함께 일하는 사람이 말하기를, 윈도가 관리비용이 싸기 때문에 회사들이
리눅스를 피하고 윈도 서버로 전향하려는 움직임이 있다고 한다. 그리고 정말
윈도가 관리하기 더 편하다고 주장했다. :-)

그 사람이 양쪽 모두에 정통한 사람이 아니었으므로 그 말을 귀담아 들을
필요성을 전혀 느끼지 못했을 뿐더러 길게 이야기할 필요성 또한 느끼지 못했다.
그런데, 사실은, 그런 정황과 필요성을 떠나서 그런 주장에 대하여 정량적으로
반박할 수 있는 근거를 내가 갖추고 있지 못했다는 생각이 든다. 다음 기사를
읽으면서 말이다.

[Google Online Security Blog: Web Server Software and Malware](http://googleonlinesecurity.blogspot.com/2007/06/web-server-software-and-malware.html)

> The figure on the left shows the distribution of all Apache, IIS, and nginx webservers by country. Apache has the largest share, even though there is noticeable variation between countries. The figure on the right shows the distribution, by country, of webserver software of servers either distributing malware or hosting browser exploits. It is very interesting to see that in China and South Korea, a malicious server is much more likely to be running IIS than Apache.
> 
> We suspect that the causes for IIS featuring more prominently in these countries could be due to a combination of factors: first, automatic updates have not been enabled due to software piracy (piracy statistics from NationMaster, and BSA), and second, some security patches are not available for pirated copies of Microsoft operating systems. For instance the patch for a commonly seen ADODB.Stream exploit is not available to pirated copies of Windows operating systems.

말인 즉, MS의 IIS와 오픈소스 제품인 Apache 의 웹서버 시장 점유율을 보면
국가에 따라서 주목할만한 차이는 찾아볼 수 없었으나, 보안 취약성의 분포를
보면 중국과 남한의 결과가 재미있다는... :-(
이 두 나라에서는 아파치 서버에 비하여 IIS를 사용하는 서버의 취약성이
두드러지게 나타나는데, 이는 보안 패치 적용이 어려운 해적판 소프트웨어를
사용하고 있기 때문일 것으로 추측할 수 있다는 말이다.

아리송. 그래서 관리비용이 싼 것일까? 잘은 모르겠으나, 일반 사용자는 몰라도
회사에서 서버로 활용하는 기계에 대하여 이런 결과를 이끌어낼 만큼 해적판의
사용이 많을 것이라고는 생각하지 않는다. (나의 환상인가? :-) 그것 보다는,

> 윈도와 그 위에서 동작하는 상용 프로그램은 튼튼해. 돈을 받은 회사가
> 보장하고 있으므로 안전하고 관리하기도 편하다구.

> 관리도 어렵고 문제 생기면 하소연할 곳도 없는 리눅스나 오픈소스
> 따위와는 다르다구.

라는, 안일한 고정관념의 부산물이 아닐까?
