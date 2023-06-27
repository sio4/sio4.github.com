---
redirect_from: /entry/what-is-codec-does-our-solution-support-mpeg/
title: "코덱이 뭐에요? (원래는: 우리 솔루션이 MPEG를 지원하나요?)"
tags: ["multimedia", "codec", "MPEG", "RTP"]
categories: ["tips-and-tricks"]
date: 2007-04-17T23:56:00+09:00
last_modified_at: 2010-07-05T09:41:40+09:00
---
싱숭생숭 어수선하다. 에라~ 일단 공부나 하자.

누군가로부터, 이런 질문을 받은 적이 있다. "우리 솔루션이 MPEG를 지원하나요?"

> 잠깐 딴소리. 이 질문을 받은 것이... 한달도 되지 않았는데 벌써 기억이
> 가물거린다. 그래서... 그때 그때 써놔야 한다. 누군가는 "그딴 거 천천히
> 하고 일이나 해" 라고 말한다 해도, 내가 이 시스템 삼총사(계관이, 개관이,
> 사랑이)를 다른 모든 일보다 먼저 끝내고 싶었던 이유가 거기에 있다. 열심히
> 일하면 뭐하는가? 지나면 그만인 것을... (그 때) 열심히 설명해줬으나 무슨
> 소용인가? 누군가 다시 물어본다면 또 다시 열변을 토해야 하는데... 이젠,
> "사랑이에게 물어보세요"라고 말할 수 있다. 잡설 그만!

MPEG란 무엇인가? 일단 약자가 나왔으니 풀어서 써야지. 예전에 학동들이랑
공부할 때 즐겨 쓰던 말, "약자는 세로로 써보자."

> **M** oving  
> **P** icture  
> **E** xpert  
> **G** roup

뭔소리여? "활동사진 한가닥 동아리"랄까? 동영상 분야에서 뭐 꽤나 뀌는
사람들의 모임. 근본적으로 MPEG라는 말은 그룹의 이름이다. 그러나, 흔히
MPEG라는 표현을 했을 때 그들을 지칭하는 것은 아니겠지. 보통 MPEG라는
표현의 일반적인 의미는 그들이 지정한 "동영상 표준"을 가리킨다. 흔히
얘기하는 MP3 등도 그런 표준의 일부.

그런데, MPEG라는 말은 "동영상 표준"이기는 한데, 두 가지 다른 의미로
사용되고 있다. 하나는, "코덱"으로써의 MPEG이고 다른 하나는 "컨테이너"로써의
MPEG이다. 오늘 하고자 하는 얘기는 바로 이 "코덱"과 "컨테이너"이다.

## 코덱이란 무엇인가?

코덱이란, 말하자면 문자이다. 알파벳, 한글 등과 같다고 생각하면 된다.
예를 들어, "개소리"를 떠올려보자. 그 느낌이 바로 원본 영상이라면, "멍멍멍",
"Bow Wow" 는 인코딩된 파일인 샘이다. 각각 한글과 영문이라는 코덱을
이용하여 인코딩 한 것이다. 물론, 엄밀히 말하자면 위의 예는 '디지타이징'
정도가 적당한 표현이겠다. 위의 예를 다시한번, "3멍", "Ba Wow" 과 같이
표현해보자. 앞의 "3멍"의 경우, 원본에 비하여 그 길이가 줄어있지만
"숫자에 대하여 뒤이은 음절을 그 숫자만큼 반목한다"라는 약속이 있다면,
해석을 거쳐 문자화(수치화; 디지타이징)된 원본을 그대로 복원해낼 수 있다.
(무손실 코덱) 또한, 뒤의 "Ba Wow"의 경우, 문자수는 크게 줄지 않았지만
쉽사리 원본과 비슷한 소리를 떠올릴 수 있다. (손실 코덱, 그러나 빠른 디코딩)

잠깐 용어를 정리해보면,

- 코덱 : 영상/음성을 디지털 신호로 표시하기 위한 약속된 기호, 또는 그 표기 방식
- 인코딩 : 비압축의 영상/음성을 규약에 의하여 해석 가능한 형태로 재기록하는 행위
- 디코딩 : 인코딩되어있는 영상/음성을 원 모습으로 되돌리기 위하여 해석하는 행위

MPEG라는 용어는 이런 관점에서, 영상을 위한 MPEG1 Video, MPEG2 Video,
MPEG4 Video, MPEG4 Part10 AVC (H.264)등의 영상 코덱을, 또는 음성을 위한
MPEG1 Audio, MPEG2 Audio, MPEG4 AAC 등의 음성 코덱을 싸잡아 부르는 것이거나
그 중 하나를 대충 부르는 것으로 받아들일 수 있다.

## 컨테이너란 무엇인가?

그럼 컨테이너란 무엇인가? 코덱이 글자라면 컨테이너는 종이이다. 또는 대나무
조각일 수도 있고, 심지어는 손바닥일 수도 있다. 무슨 소리냐면 종이가 글자를
가지런히 적어놓는 "글자의 그릇"이 되듯이, 인코딩된 결과물, 0과 1의 연속된
배열으로 이루어진 그것을 어딘가에 적당한 형태로 담아둬야 하는데, 그 그릇의
역할을 하는 것이 바로 미디어의 컨테이너이다.

MPEG라는 용어가 사용될 때, 위의 "코덱으로 해석하기" 보다 일반적인 것은 바로
"컨테이너로 해석하기"일것 같다. (이 경우, '시스템'이라는 표현이 좀 더 MPEG
스럽긴 하다. MPEG에는 PS라는 파일 저장용 그릇과 TS라는 전송용 그릇이 있다.)

## RTP란?

말 나온 김에, 그럼 RTP란 소리도 들리던데 그건? 뭐, 딱 이거다라고 하면
거짓말이겠지만, 지금의 문맥상에서 보면 RTP는 "4랑해"라고 적힌 종이를 담은
'봉투'라고나 할까? 연애편지 전문 봉투는 아니지만 어쨌든 연애편지를 담은
이 표준의 봉투는 우편배달부의 손을 거쳐 짝순이의 손에 전달된다. 영상물을
위한 전문 봉투는 아니지만 어쨌든 인코딩된 동영상을 담은 이 표준의 RTP라는
봉투는 네트워크를 거쳐 재생기에게 전달된다.

그 연애편지... 그냥 종이로 주면 안될까? 안돼~ 등기로 부치고 싶으니까!
RTP는 그렇다고 등기우편은 아니지만, 일련번호 등의 방법을 이용하여 중간에
빠진 편지가 없는지 검사하는 기능을 가지고 있다.

예전에, 일련번호가 붙어있는 위문/연애편지를 받던 고참이 생각나는군. 참
이상한건, 그 고참은 휴가나갈 때 휴가증을 두 개 챙긴다는 것. 날짜 긴거
하나, 짧은거 하나. 긴건 진짜 휴가증, 짧은건 애인 보고용. 결혼은 했으려나...

그니까 어쩌라고~ 우리 시스템은 MPEG를 지원한다고?

1. 우리 시스템은 '전송' 영역에서 동작하는 것으로, 코덱과는 무관하게 동작할 수 있다. 뭐, 원한다면 MPEG로 압축된 영상도 실어보낼 수 있으니 지원한다고 해야할까?

2. 우리 시스템은 고유의 전송 방식과 파일 형식을 갖는다. MPEG로 말하자면 PS와 TS에 해당하는 무언가가 따로 있는 샘. 그렇다면... 컨테이너로써의 MPEG는 지원하지 않는다고 말할 수 있을까?

3. 고객이 이미 MPEG 영상을 다수 가지고 있고, 이를 서비스하기 위하여 우리를 바라보고 있는 것이라면? 까짓거 MPEG를 우리 솔루션에 맞도록 변환해주면 되는거 아니냐고요~ 이런 과정/행위를 트랜스코딩이라고 하지.

결론적으로, 우리 시스템은 MPEG 기반 시스템은 아니다. 그러나, MPEG 원본에
대한 서비스를 처리할 수는 있다. 라고 주장하면 되나? 그렇게 주장하지
마시고... "이건 됩니까?" 라는 질문 말고 "이걸 원합니다."라는 요구를
들어보고, 요구에 합당한 답을 만들어 드리면 됩니다. 단답식의 답은...
오답일 수 있습니다.
