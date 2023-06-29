---
redirect_from:
- /entry/telnet-protocol-support-on-web-browser/
- /200/
title: 웹브라우져에서 telnet 프로토콜을 처리하려면
tags: ["network", "Ongsung", "protocol", "Python"]
categories: ["tips-and-tricks"]
date: 2009-09-15T03:51:57+09:00
last_modified_at: 2009-09-28T08:50:38+09:00
---
예전엔 기본이었던것 같은데, 이젠 설정을 따로 해야 하는 것이 되어버렸다.
telnet://localhost 이런거 말이다. 그것도 꽤 복잡해졌다.

![](/attachments/2009-09-15-missing-handler.png)

요즘 진행하고 있는 프로젝트 중 하나에서 이 기능을 사용한다. 그래서 간만에
들여다봤다.

## IE7, 활성화하기와 프로그램 지정하기

IE7에서는 레지스트리 설정
([enable-telnet-ie7.reg](/attachments/enable-telnet-ie7.reg))을
통하여 telnet 프로토콜 처리를 활성화할 수 있다.
활성화가 되면 기본 처리기인 windows 내장 telnet 프로그램과 연결된다.
그런데 이 기본 telnet 프로그램이라는 것이 그다지 이쁜 녀석은 아니라서
뭔가 다른 설정으로 들 바꿔 쓰게 되는데, 그 작업 역시 레지스트리 설정을
이용하여 할 수 있다.
([telnet-handler-putty.reg](/attachments/telnet-handler-putty.reg)는
Windows용 공개소프트웨어 터미널 에뮬레이터인 putty를 예로 하였다.
다시 원래대로 돌리려면
[telnet-handler-default.reg](/attachments/telnet-handler-default.reg)를
사용한다.)

## FF3, 프로토콜 처리기 설정하기

이게... 좀 복잡해졌다. 예전엔 about:config 에서 끝났던 것 같은데...
아무튼, 깔끔한 방법이 없다.

첫번째로 사용 가능한 방법은, 먼저 about:config로 가서(브라우져의 Locationcw
입력 부분에 이렇게 써넣으라는 얘기) "protocol" 등으로 필터링을 해본다.
그러면 몇몇 보기가 나오는데, 그와 유사하게
"network.protocol-handler.app.telnet"라는 문자열 키를 하나 만들고 저장한다.
(이상한 일인데, 여기서 값으로 뭔가를 입력하는 것이 무의미하다. 어떤 의미에서
무의미한지 궁금하다면 telnet을 처리하기를 원하는 프로그램을 이 곳에 써
넣어보면 된다.)

그리고 이런 식으로 시험해본다.

![](/attachments/2009-09-15-telnet-protocol.png)

(프로토콜 처리기로 지정한 것이 있다면) 지정한 프로그램이 뜨기를 기대했건만,

![](/attachments/2009-09-15-after-setup.png)

그런데 이게 왠 대화상자? 헨들러를 지정했음에도 다시 어떤 것을 쓰겠냐고
묻는다. 그래서 "아... 어떤건지는 알겠는데 계속 쓸건지를 묻나?" 하고
"...기억합니다."에 표시하고 "확인"을 누르면 아무런 동작도 이루어지지
않았다. 그래서,

![](/attachments/2009-09-15-select-manually.png)

이렇게, 대화상자에서 "실행 프로그램 선택"을 이용하여 아까 입력한 그
프로그램을 다시 지정하면 이번엔 정상적으로, 그리고 반복적으로 해당
프로그램을 외부 프로토콜 처리기로 쓸 수 있게 된다.

좀 이상하지만 더 깊이 따지지는 않겠음.

그런데 어떤 프로그램을 지정할 것인가? 다음의 python 스크립트는 이를 위한
예이다.

```python
#!/usr/bin/python

import sys
import os

try:
    url = sys.argv[1]
    argument = url.split('/')[2].split('@').pop().replace(':', ' ')
except:
    print "url parsing error."
    quit()

command = "xterm -e telnet %s" % argument
os.system(command)
```

파일 받기: [telnet-url.py](/attachments/telnet-url.py)

어쨌든, 이렇게 하면 IE7과 FF3에서 telnet://localhost 링크를 사용할 수
있게 된다.

