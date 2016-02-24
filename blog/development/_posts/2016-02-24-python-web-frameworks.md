---
title: API Service를 위한 Python Web Frameworks 선정
tags: API Python Framework
date: 2016-02-24 11:26:29 +0900
---
일반적인 Web Application이 아닌 API Backend를 위한 Python Web Framework을
선정하기 위하여, 인기있는 Framework 몇 개를 비교해보았다. 이 글은, 이
비교 과정과 결과에 대한 기록이다.

6년 쯤 전, 간단한 In-House 관리시스템을 몇 개 만들 기회가 있었는데,
이미 고속 개발 도구로써 명성이 자자했지만 사용 경험이 없었던 Python
기반의 [Django]와 Ruby 기반의 [Ruby on Rails]를 활용하여 하나씩
프로젝트를 진행했었다.
정확한 이유는 기억나지 않지만, 먼저 진행되었던 시스템 백업 관리
콘솔은 Ruby on Rails로 작성하였었고 두 번째로 진행된 System 접근
통제 시스템은 Django로 작성했었다. 그렇게 두 개의 프로젝트를 진행한
후, 내 입맛에는 Rails가 보다 잘 어울린다는 느낌을 받았고 이후에
진행한 모든 프로젝트는 Rails를 사용했었다.

이번에 Hardened Layer Prototype을 진행하면서 SoftLayer의 Ruby API를
사용하는 Rails App을 만들어 보았으나, Ruby 언어용 API의 수준이 낮아
이 환경에서 개발을 지속하는 것은 의미가 없음을 알게 되었다. 그래서,
향후의 추가 Prototype은 Python 기반으로 작성하려고 하며 이를 위한
Framework을 다시 선정해보려고 한다.

Django가 나름 깨끗한 환경을 준다는 것은 이미 알고 있지만, API Backend의
특성을 반영하는 다른 Framework이 있을 것도 같아 간단한 조사를 하게
되었는데, 생각보다 살펴볼 내용이 많아 선정 자체에 시간을 좀 많이
사용해버렸다. 이어지는 내용은, 그 중에서 객관적인 자료들을 정리한
것이다.

### 관련글

* [Hardened Layer, SoftLayer Custom Portal - Part 1]
* [Hardened Layer, SoftLayer Custom Portal - Part 2]



# 써보지 않았으니 단순 비교

사용해보지 않은 후보를 놓고, 그 중에서 나의 목적에 맞는 도구를 찾는
것은 쉬운 일이 아니다. 가장 확실한 것은, 모든 후보를 사용해보고 그
중에서 가장 마음에 드는 것을 고르면 되겠지만 시간과 노력이 많이
들어가는 작업이 된다.

이런 상황에서 최소한 후보군을 좁혀줄 수 있는 기준이 있다면 좋겠는데,
여기서는 프로젝트 일반정보와 Community 통계의 두 가지 정보를 사용해봤다.

## 프로젝트 일반정보

프로젝트가 얼마나 무르익었는지, 또는 성격과 규모가 어느 정도인지를
정리하는 것이 첫번째로 진행한 일이다.

먼저, <https://wiki.python.org/moin/WebFrameworks>에서 Python
Community에 의해 정리된 자료를 시작점으로 하여 관심이 가는 프로젝트를
선별하였고, 이 자료를 기반으로 각 Framework의 홈페이지와 인터넷의
글들을 참고하여 다음과 같은 후보를 선정하였다.

{:.block-title}
Project Information

{:.fit.styled}
| Framework | Type        | Version | Python  | Footprint  |
|:----------|:-----------:|:-------:|:-------:|-----------:|
|Django     | Full Stack  | 1.9.1   | 3.x     | 40 MB      |
|TurboGears | Full Stack  | 2.3.7   | 3.x     | 10 MB      |
|web2py     | Full Stack  | 2.13.4  | 2.x     | -          |
|pyramid    | Full Stack  | 1.6     | 3.x     | 10 MB      |
|CherryPy   | Lightweight | 4.0.0   | 3.x     | 2.7 MB     |
|**Flask**  | Lightweight | 0.10.1  | 3.x     | 4.9 MB     |
|**bottle** | Lightweight | 0.12.9  | 3.x     | **0.5** MB |
|**pecan**  | Lightweight | 1.0.3   | 3.x     | 5.3 MB     |
|**falcon** | **for API** | 0.3.0   | 3.x     | **0.9** MB |
|hug        | **for API** | 1.9.9   | 3.x     | 1.2 MB     |
|pycnic     | **for API** | 0.0.5   | 3.x     | **0.1** MB |

먼저, Framework의 유형에 따라 Full Stack Framework와 Lightweight
Framework 또는 Minimal Framework로 분류되는 것들, 그리고 최근의
추세에 따른 API 전용의 Framework 등을 살펴보았다.
또한, 이들의 Version 및 Python 지원 버전을 확인하였고, 직접 설치를
진행하여 각각이 차지하는 용량(Footprint)을 확인하였다.

눈에 들어오는 것은, [Flask], [bottle], [pecan] 등의 "경량"을
특징으로 하는 것들이 있음을 알게 되었고, [falcon]과 같은 API
전용의 도구들도 꽤 존재한다는 것을 알게 되었다.

## Community 통계

내가 도구를 선택할 때 가장 중요하게 보는 요소 중 하나, 또는 **객관성을
보장할 수 있는 방법 중 하나는 Community 통계를 살펴보는 것**이다. 특히,
특정 언어나 제품 등에 국한되지 않는 포괄적인 Community를 참조하면
많은 도움이 되는데, 그 중 대표적인 것이 [Stack Overflow]와 [Github]의
통계이다.

Stack Overflow는 세계적으로 가장 활발하게 움직이고 있으며 영향력이
강한 개발자 Q&A Site이며 매우 뛰어난, 선별력 있는 게시판을 운영하고
있고 기반을 이루는 분류체계 등도 뛰어나서 유용하게 사용할 수 있는
Site이다. 아래 표의 "Followers"와 "Questions"은 각각 해당 주제를
위한 Tag를 Follow하는 사람의 수와 해당 Tag를 사용한 질문의 수를
정리한 것이다.(2016년 1월 중순의 값이다.) 우리는 이 수치를 통하여,
얼마나 많은 개발자가 이것을 이용하여 개발을 진행하고 있는지, 그리고
향후에 그것을 사용하면서 질문을 던질 일이 있을 때, 답변해줄 수 있는
사람이 얼마나 될지를 가늠할 수 있다.

Github는 가장 인기 있는 Social Development, Social Repository Site로,
오픈소스 프로그램의 보금자리 같은 곳이다. 다행스럽게, 내가 관심을
가졌던 모든 Framework는 이 곳에 자리를 펴고 살고 있었으며, 이를
통하여 다음의 통계를 얻을 수 있었다.

* Commits: 얼마나 활발하게 개발이 진행되어 왔는지
* Contributors: 얼마나 많은 개발자가 이 프로젝트에 참여하고 있는지
* Stars: 해당 프로젝트에 관심을 가진 사람은 얼마나 되는지
* Forks: 얼마나 많은 사람이 이것을 바탕으로 개발을 하고 있는지

자세한 수치는 아래 표를 참고하기 바란다.

{:.block-title}
Stack Overflow & Github Statistics

{:.fit.styled}
| Framework  |Followers|Questions |Commits|Contributors|Stars     |Forks     |
|:-----------|--------:|---------:|------:|-----------:|---------:|---------:|
|[Django]    |17,800   |111,400   |22,020 |1,071       |17,698    |7,194     |
|[TurboGears]|50       |104       |1,736  |19          |130       |28        |
|[web2py]    |**318**  |**1,500** |6,432  |114         |998       |531       |
|[pyramid]   |**535**  |**1,700** |8,778  |201         |**1,876** |636       |
|[CherryPy]  |157      |**987**   |2,748  |46          |83        |40        |
|**[Flask]** |**3,300**|**10,700**|2,363  |284         |**18,090**|**5,528** |
|**[bottle]**|196      |**940**   |1,570  |124         |**3,483** |**698**   |
|**[pecan]** |1        |1         |1,200  |30          |14        |9         |
|**[falcon]**|13       |17        |988    |58          |**2,447** |**291**   |
|[hug]       |-        |-         |723    |11          |919       |32        |
|[Pycnic]    |-        |-         |42     |4           |16        |6         |

가장 대표적인 Python Framework인 Django가 압도적인 질문과 참여자를
거느리고 있는 것은 당연한 일일 것이다. 내가 관심을 갖고 있는 **경량
또는 API용 Framework를 중심으로 보면, 단연 많은 질문과 관심별을
자랑하는 프로젝트는 [Flask]** 였다. 또한, **API 전용의 Framework인
[falcon]의 경우에도 그 사용처가 제한됨에도 불구하고 꽤나 많은
관심별과 Fork가 있는 것이 특징적**이었다. 조금 의아했던 부분은 OpenStack
프로젝트에 의해 선택받은 프로젝트인 [pecan]의 경우인데, 비교할 수 없는
수준으로 관심도가 떨어지는 것으로 나타나고 있다.

---
이렇게 두 가지 내용으로 보았을 때에는, 경량을 중심으로 봤을 때, Flask를
선택하는 것이 가장 타당해 보이며, API 전용으로 충분하다면 falcon에
주목해보는 것도 의미가 있어 보였다.


# 개발도구

어느 정도 좁혀진 범위에서, 보다 심층적인 분석을 해보았다. 그 첫번째는
개발에 편의를 위한 도구가 얼마나 제공되는지 여부이다.

Rails나 Django와 같은 쾌속개발환경의 특징 중 하나는, Scaffolding이라고
부르는 Application이나 Module의 틀을 쉽게 작성해주고 구조를 잡아주어,
**반복해서 일어나는 귀찮은 일들은 도구의 지원으로 빠르게 끝내고 개발자는
실질적인 업무 중심의 Coding에 집중**할 수 있게 해주는 도구를 제공한다는
점이다.

예를 들어, Django와 같은 경우는 다음과 같이, `django-admin`이라는
도구를 제공하여 개발자의 반복작업이나 작업을 쉽게 진행할 수 있게
돕고 있다.

```text
$ django-admin help

Type 'django-admin help <subcommand>' for help on a specific subcommand.

Available subcommands:

[django]
    check
    compilemessages
    createcachetable
    dbshell
    diffsettings
    dumpdata
    flush
    inspectdb
    loaddata
    makemessages
    makemigrations
    migrate
    runserver
    sendtestemail
    shell
    showmigrations
    sqlflush
    sqlmigrate
    sqlsequencereset
    squashmigrations
    startapp
    startproject
    test
    testserver
<...>
$ 
```

위의 `help`가 보여주는 보조명령의 이름에서 알 수 있듯이, 새로운
프로젝트를 시작하기 위한 Tree를 만들어준다든지(`startproject`,
`startapp`) DBMS 관련 작업을 돕거나(`dbshell`, `migrate`,...) 하는
작업을 손쉽게 할 수가 있다.

관심이 가는 몇 개의 프로젝트를 보면 아래와 같다.

## Pyramid (Pylon Project)

나름 유명세도 있고 관심도(질문, 관심별)도 높은 pyramid 프로젝트의
경우에는 아래와 같이 Scaffolding이나 구성확인 등을 돕는 도구가
제공되고 있었다.

```text
$ pcreate --help
Usage: pcreate [options] -s <scaffold> output_directory

Render Pyramid scaffolding to an output directory
<...>
$ prequest --help
Usage: prequest config_uri path_info [args/options]

Submit a HTTP request to a web application.
<...>
$ proutes --help
Usage: proutes config_uri

Print all URL dispatch routes used by a Pyramid application in the order in
which they are evaluated.
<...>
$ pserve --help
Usage: pserve config_uri [start|stop|restart|status] [var=value]

This command serves a web application that uses a PasteDeploy configuration
file for the server and application.
<...>
$ pshell --help
Usage: pshell config_uri

Open an interactive shell with a Pyramid app loaded.
<...>
$ ptweens --help
Usage: ptweens config_uri

Print all implicit and explicit tween objects used by a Pyramid application.
<...>
$ pviews --help
Usage: pviews config_uri url

Print, for a given URL, the views that might match.
<...>
$ 
```

## pecan

앞서 말한 바와 같이, OpenStack이 선택한 API용 Framework인 pecan의
경우에는 아래 정도의 옵션을 제공하는 간단한 scaffolding 도구가
들어있었다.

```text
$ pecan --help
usage: pecan [-h] [--version] command ...

positional arguments:
  command
    serve     Serves a Pecan web application
    shell     Open an interactive shell with the Pecan app loaded
    create    Creates the file layout for a new Pecan scaffolded project

optional arguments:
  -h, --help  show this help message and exit
  --version   show program's version number and exit
$ 
```

## falcon

API 전용 Framework이면서 속도에 대한 애착이 강한 듯 한 falcon의
경우는 특이하게도, benchmark 도구만 딸랑 들어있는 구성이었고,

```text
$ falcon-bench --help
usage: falcon-bench [-h]
                    [-b {bottle,falcon,falcon-ext,flask,pecan,werkzeug} [{bottle,falcon,falcon-ext,flask,pecan,werkzeug} ...]]
                    [-i ITERATIONS] [-t TRIALS] [-p {standard,verbose}]
                    [-o PROFILE_OUTPUT] [-m]

Falcon benchmark runner

optional arguments:
  -h, --help            show this help message and exit
  -b {bottle,falcon,falcon-ext,flask,pecan,werkzeug} [{bottle,falcon,falcon-ext,flask,pecan,werkzeug} ...], --benchmark {bottle,falcon,falcon-ext,flask,pecan,werkzeug} [{bottle,falcon,falcon-ext,flask,pecan,werkzeug} ...]
  -i ITERATIONS, --iterations ITERATIONS
  -t TRIALS, --trials TRIALS
  -p {standard,verbose}, --profile {standard,verbose}
  -o PROFILE_OUTPUT, --profile-output PROFILE_OUTPUT
  -m, --stat-memory
$ 
```

## bottle & hug

bottle, hug와 같이 개발용 서버만 제공하는 프로젝트도 있었다.

```text
$ bottle.py --help
Usage: bottle.py [options] package.module:app

Options:
  -h, --help            show this help message and exit
  --version             show version number.
  -b ADDRESS, --bind=ADDRESS
                        bind socket to ADDRESS.
  -s SERVER, --server=SERVER
                        use SERVER as backend.
  -p PLUGIN, --plugin=PLUGIN
                        install additional plugin/s.
  --debug               start server in debug mode.
  --reload              auto-reload on file changes.
$ 
```

```text
$ hug --help
usage: hug [-h] [-f FILE_NAME] [-m MODULE] [-p PORT] [-nd] [-v]

Hug API Development Server

optional arguments:
  -h, --help            show this help message and exit
  -f FILE_NAME, --file FILE_NAME
                        A Python file that contains a Hug API
  -m MODULE, --module MODULE
                        A Python module that contains a Hug API
  -p PORT, --port PORT  Port on which to run the Hug server
  -nd, --no-404-documentation
  -v, --version         show program's version number and exit
$ 
```

---
아무래도 도구와 관련해서는, Full Stack 또는 Lightweight라고는 해도
어느 정도 Application 개발을 염두에 두는 Framework의 경우가
강세를 보이고 있다.


# 개발 패턴, Hello World

여러 Framework을 대상으로 여기까지 진도를 나가는 것은 좀 무리가
있어 보이지만, 간단한 수준(Homepage에 나와있는 예제 수준)에서
개발 환경이나 방식을 살펴보려고 한다.

## pyramid

Pyramid의 경우에는 Scaffolding을 위한 도구를 제공하고 있어서 프로젝트를
구조화하여 구성하는 방식이 Framework의 특성을 제대로 반영한 개발 패턴일
것 같다. 그러나, Homepage에 기술되어 있는 바와 같이, 다음과 같은 간단한
코드 하나로도 서비스 기동은 가능했다.

{:.block-title}
예제 코드 - `hello.py`

```python
from wsgiref.simple_server import make_server
from pyramid.config import Configurator
from pyramid.response import Response


def hello_world(request):
    return Response('Hello %(name)s!' % request.matchdict)

if __name__ == '__main__':
    config = Configurator()
    config.add_route('hello', '/hello/{name}')
    config.add_view(hello_world, route_name='hello')
    app = config.make_wsgi_app()
    server = make_server('0.0.0.0', 8080, app)
    server.serve_forever()
```

이 코드를 다음과 같이 실행시키면 기본적인 Application의 동작을 확인할
수 있다.

이 예제만 놓고 보면, Route를 추가하고 View를 지정하는 방식 등이 조금
번거롭게 느껴지고 귀찮은 일이 많아 보인다. 아마도, 함께 제공되는 도구들의
도움을 받아야 뭔가 구조화된 개발이 가능할 것 같다.

{:.block-title}
실행

```text
$ python hello.py
127.0.0.1 - - [03/Feb/2016 12:16:56] "GET /hello/yonghwan HTTP/1.1" 200 15
127.0.0.1 - - [03/Feb/2016 12:17:02] "GET /hello/ HTTP/1.1" 404 159
127.0.0.1 - - [03/Feb/2016 12:17:04] "GET /hello HTTP/1.1" 404 158
<...>
$ 
```

Pyramid의 경우, 이렇게 간단한 시험으로 평가하는 것은 좀 무리가 있어
보이지만, 현재 시점에서 관심이 많이 가는 Framework이 아니라서 여기까지
확인하고 더 이상의 시험은 진행하지 않았다.


## Flask

Flask의 경우는 명령행 도구를 제공하고 있지 않으며 개발 문서를 살펴보지도
않았다. 단지, 홈페이지의 예제를 가지고 시험해본 결과는 아래와 같다.

{:.block-title}
예제 코드 - `hello.py`

```python
from flask import Flask
app = Flask(__name__)

@app.route("/")
def hello():
    return "Hello World!"

if __name__ == "__main__":
    app.run()
```

Root에 대한 Route 하나만 갖는 이 App을 실행해보면 아래와 같다.

{:.block-title}
실행

```text
$ python hello.py 
 * Running on http://127.0.0.1:5000/ (Press CTRL+C to quit)
127.0.0.1 - - [03/Feb/2016 12:07:23] "GET / HTTP/1.1" 200 -
<...>
$ 
```

시험은 단순하게 끝냈지만, 근래에 이 Framework을 사용한 프로젝트의 구성을
보았을 때의 느낌은, 이것 역시 구조화된 설계가 가능한 무언가를 제공하지
않을까 막연히 생각을 해보았다. 다만, 이것 역시, 당장 염두에 두는 제품이
아니어서 긴 시험은 생략했다.


## bottle

bottle 역시 도구를 제공하지 않는 Framework 중 하나이다. 아래와 같이
단순한 시험을 해봤다.

{:.block-title}
예제 코드 - `hello.py`

```python
from bottle import route, run, template

@route('/hello/<name>')
@route('/hello/')
def index(name = "world"):
    return template('<b>Hello {{name}}</b>!', name=name)

run(host='localhost', port=8080)
```

위의 코드는 홈페이지의 예제를 그대로 옮긴 후, 네 번째 줄을 더 추가하여
동일 Function에 Route를 하나 더 추가해보았다. (그리고 다섯 번째 줄의
`index` 함수에 대하여 인수의 기본값을 주었다.)

{:.block-title}
실행

```text
$ python hello.py 
Bottle v0.12.9 server starting up (using WSGIRefServer())...
Listening on http://localhost:8080/
Hit Ctrl-C to quit.

127.0.0.1 - - [03/Feb/2016 12:14:00] "GET /hello HTTP/1.1" 404 730
127.0.0.1 - - [03/Feb/2016 12:14:02] "GET /hello/ HTTP/1.1" 200 19
127.0.0.1 - - [03/Feb/2016 12:14:06] "GET /hello/yonghwan HTTP/1.1" 200 22
<...>
$ 
```

위의 로그에서 알 수 있듯이, PATH에서 '/'가 있고 없고의 영향을 받는
것을 알 수 있었고, 인수 없는 호출과 인수를 갖는 호출이 모두 정상적으로
실행되는 것도 확인하였다.

일단, Route를 추가하는 방식 자체는 괜찮아 보이지만, 예제만 놓고 보면,
Object 기반으로 동작하는 모습이 아니라는 점이 부족해 보인다.


## pecan

pecan은 간단한 수준의 유틸리티가 제공되는 Framework이다. 프로젝트 시작
과정을 문서에 따라 간단히 실행해보았으며, 다음과 같은 실행 후에 마치,
Rails의 시험 페이지와 유사한 화면을 만날 수 있었다.

{:.block-title}
프로젝트 구성

```text
$ pecan create hello
<...>
$ cd hello/
$ python setup.py develop
<...>
$ tree
.
├── MANIFEST.in
├── __pycache__
│   └── config.cpython-34.pyc
├── config.py
├── hello
│   ├── __init__.py
│   ├── __pycache__
│   │   └── __init__.cpython-34.pyc
│   ├── app.py
│   ├── controllers
│   │   ├── __init__.py
│   │   ├── __pycache__
│   │   │   ├── __init__.cpython-34.pyc
│   │   │   └── root.cpython-34.pyc
│   │   └── root.py
│   ├── model
│   │   ├── __init__.py
│   │   └── __pycache__
│   │       └── __init__.cpython-34.pyc
│   ├── templates
│   │   ├── error.html
│   │   ├── index.html
│   │   └── layout.html
│   └── tests
│       ├── __init__.py
│       ├── __pycache__
│       │   └── test_units.cpython-34.pyc
│       ├── config.py
│       ├── test_functional.py
│       └── test_units.py
├── hello.egg-info
│   ├── PKG-INFO
│   ├── SOURCES.txt
│   ├── dependency_links.txt
│   ├── not-zip-safe
│   ├── requires.txt
│   └── top_level.txt
├── public
│   ├── css
│   │   └── style.css
│   └── images
│       └── logo.png
├── setup.cfg
└── setup.py

14 directories, 30 files
$ pecan serve config.py 
Starting server in PID 2524
serving on 0.0.0.0:8080, view at http://127.0.0.1:8080
2016-02-03 12:49:08,688 [INFO    ] [pecan.commands.serve][MainThread] "GET / HTTP/1.1" 200 993
2016-02-03 12:49:08,810 [INFO    ] [pecan.commands.serve][MainThread] "GET /css/style.css HTTP/1.1" 200 569
2016-02-03 12:49:08,816 [WARNING ] [pecan.commands.serve][MainThread] "GET /javascript/shared.js HTTP/1.1" 404 411
2016-02-03 12:49:08,818 [INFO    ] [pecan.commands.serve][MainThread] "GET /images/logo.png HTTP/1.1" 200 20596
$ 
```

일단, 디렉터리 구조가 나름 친숙하다.

## falcon

falcon의 경우는 다음과 같이 홈페이지의 시험코드를 이용한 시험을 해보았다.

{:.block-title}
예제 코드 - `hello.py`

```python
import falcon
import json
 
class QuoteResource:
    def on_get(self, req, resp):
        """Handles GET requests"""
        quote = {
            'quote': 'Hello World.',
            'author': 'Anonymous'
        }
        resp.body = json.dumps(quote)
 
api = falcon.API()
api.add_route('/quote', QuoteResource())
```

위의 다른 Framework 예제와는 달리, Class를 Route에 할당하고 그 내부에
Method 별로 `GET`, `POST` 등을 처리할 수 있도록 처리하고 있는 부분이
일단 REST 방식을 고려하는 나로써는 눈에 들어온다.

`gunicorn`을 설치하여 기동해본 결과는 다음과 같다.

{:.block-title}
실행

```text
$ pip install gunicorn
Downloading/unpacking gunicorn
  Downloading gunicorn-19.4.5-py2.py3-none-any.whl (112kB): 112kB downloaded
Installing collected packages: gunicorn
Successfully installed gunicorn
Cleaning up...
$ gunicorn hello:api
[2016-02-03 12:22:29 +0900] [1712] [INFO] Starting gunicorn 19.4.5
[2016-02-03 12:22:29 +0900] [1712] [INFO] Listening at: http://127.0.0.1:8000 (1712)
[2016-02-03 12:22:29 +0900] [1712] [INFO] Using worker: sync
[2016-02-03 12:22:29 +0900] [1717] [INFO] Booting worker with pid: 1717
^C[2016-02-03 12:23:56 +0900] [1712] [INFO] Handling signal: int
[2016-02-03 12:23:56 +0900] [1717] [INFO] Worker exiting (pid: 1717)
[2016-02-03 12:23:56 +0900] [1712] [INFO] Shutting down: Master
$ 
```

---

프로젝트 개요, 커뮤니티 통계 등의 조건을 기준으로 관심이 가는 Framework
몇 개의 예제 코드를 구동해 보았다. 조금/많이 부족하지만, 넓게 열어놓고
입맛에 맞는 Framework을 고르는 작업은 이 정도로 마칠까 한다.

다음 기회에는, 이 중 조금 더 관심이 가는 pecan, Flask, falcon, bottle
등에 대하여 순서대로, 간택되는 녀석이 있을 때까지, 살펴볼까 한다.

> 끝!





# 참고

## 홈페이지와 Repository

{:.block-title}
Links

{:.fit.styled}
| Homepage     | Github Repository     | Stackoverflow Tag               |
|:-------------|:----------------------|:--------------------------------|
| [Django]     | [Django - github]     | [stackoverflow/django]          |
| [TurboGears] | [TurboGears - github] | [stackoverflow/turbogears]      |
| [web2py]     | [web2py - github]     | [stackoverflow/web2py]          |
| [pyramid]    | [pyramid - github]    | [stackoverflow/pyramid]         |
| [CherryPy]   | [CherryPy - github]   | [stackoverflow/cherrypy]        |
| [Flask]      | [Flask - github]      | [stackoverflow/flask]           |
| [bottle]     | [bottle - github]     | [stackoverflow/bottle]          |
| [pecan]      | [pecan - github]      | [stackoverflow/pecan]           |
| [falcon]     | [falcon - github]     | [stackoverflow/falconframework] |
| [hug]        | [hug - github]        |                                 |
| [pycnic]     | [pycnic - github]     |                                 |


## 설치 과정(설치 의존성)

### pycnic virtualenv

```text
$ virtualenv virtualenv-pycnic
Using base prefix '/usr'
New python executable in /opt/virtualenv-pycnic/bin/python3
Also creating executable in /opt/virtualenv-pycnic/bin/python
Installing setuptools, pip, wheel...done.
$ source virtualenv-pycnic/bin/activate
$ pip install pycnic
Collecting pycnic
Installing collected packages: pycnic
Successfully installed pycnic-0.0.5
$ 
```

### hug virtualenv

```text
$ virtualenv virtualenv-hug
Using base prefix '/usr'
New python executable in /opt/virtualenv-hug/bin/python3
Also creating executable in /opt/virtualenv-hug/bin/python
Installing setuptools, pip, wheel...done.
$ source virtualenv-hug/bin/activate
$ pip install hug
Collecting hug
Collecting falcon (from hug)
Collecting python-mimeparse (from falcon->hug)
Collecting six>=1.4.0 (from falcon->hug)
Installing collected packages: python-mimeparse, six, falcon, hug
Successfully installed falcon-0.3.0 hug-1.9.9 python-mimeparse-0.1.4 six-1.10.0
$ 
```

### falcon virtualenv
```text
$ virtualenv virtualenv-falcon
Using base prefix '/usr'
New python executable in /opt/virtualenv-falcon/bin/python3
Also creating executable in /opt/virtualenv-falcon/bin/python
Installing setuptools, pip, wheel...done.
$ source virtualenv-falcon/bin/activate
$ pip install falcon
Collecting falcon
Collecting python-mimeparse (from falcon)
Collecting six>=1.4.0 (from falcon)
Installing collected packages: python-mimeparse, six, falcon
Successfully installed falcon-0.3.0 python-mimeparse-0.1.4 six-1.10.0
$ 
```

### pecan virtualenv
```text
$ virtualenv virtualenv-pecan
Using base prefix '/usr'
New python executable in /opt/virtualenv-pecan/bin/python3
Also creating executable in /opt/virtualenv-pecan/bin/python
Installing setuptools, pip, wheel...done.
$ source virtualenv-pecan/bin/activate
$ pip install pecan
Collecting pecan
Collecting WebOb>=1.2dev (from pecan)
Collecting Mako>=0.4.0 (from pecan)
Collecting logutils>=0.3 (from pecan)
Collecting WebTest>=1.3.1 (from pecan)
Collecting six (from pecan)
Collecting MarkupSafe>=0.9.2 (from Mako>=0.4.0->pecan)
Collecting beautifulsoup4 (from WebTest>=1.3.1->pecan)
Collecting waitress>=0.8.5 (from WebTest>=1.3.1->pecan)
Installing collected packages: WebOb, MarkupSafe, Mako, logutils, beautifulsoup4, six, waitress, WebTest, pecan
Successfully installed Mako-1.0.3 MarkupSafe-0.23 WebOb-1.5.1 WebTest-2.0.20 beautifulsoup4-4.4.1 logutils-0.3.3 pecan-1.0.4 six-1.10.0 waitress-0.8.10
$ 
```

### bottle virtualenv
```text
$ virtualenv virtualenv-bottle
Using base prefix '/usr'
New python executable in /opt/virtualenv-bottle/bin/python3
Also creating executable in /opt/virtualenv-bottle/bin/python
Installing setuptools, pip, wheel...done.
$ source virtualenv-bottle/bin/activate
$ pip install bottle
Collecting bottle
Installing collected packages: bottle
Successfully installed bottle-0.12.9
$ 
```

### Flask virtualenv
```text
$ virtualenv virtualenv-Flask
Using base prefix '/usr'
New python executable in /opt/virtualenv-Flask/bin/python3
Also creating executable in /opt/virtualenv-Flask/bin/python
Installing setuptools, pip, wheel...done.
$ source virtualenv-Flask/bin/activate
$ pip install Flask
Collecting Flask
Collecting Werkzeug>=0.7 (from Flask)
Collecting Jinja2>=2.4 (from Flask)
Collecting itsdangerous>=0.21 (from Flask)
Collecting MarkupSafe (from Jinja2>=2.4->Flask)
Installing collected packages: Werkzeug, MarkupSafe, Jinja2, itsdangerous, Flask
Successfully installed Flask-0.10.1 Jinja2-2.8 MarkupSafe-0.23 Werkzeug-0.11.3 itsdangerous-0.24
$ 
```

### cherrypy virtualenv
```text
$ virtualenv virtualenv-cherrypy
Using base prefix '/usr'
New python executable in /opt/virtualenv-cherrypy/bin/python3
Also creating executable in /opt/virtualenv-cherrypy/bin/python
Installing setuptools, pip, wheel...done.
$ source virtualenv-cherrypy/bin/activate
$ pip install cherrypy
Collecting cherrypy
Installing collected packages: cherrypy
Successfully installed cherrypy-4.0.0
$ 
```

### pyramid virtualenv
```text
$ virtualenv virtualenv-pyramid
Using base prefix '/usr'
New python executable in /opt/virtualenv-pyramid/bin/python3
Also creating executable in /opt/virtualenv-pyramid/bin/python
Installing setuptools, pip, wheel...done.
$ source virtualenv-pyramid/bin/activate
$ pip install pyramid
Collecting pyramid
Collecting zope.deprecation>=3.5.0 (from pyramid)
Requirement already satisfied (use --upgrade to upgrade): setuptools in ./virtualenv-pyramid/lib/python3.4/site-packages (from pyramid)
Collecting zope.interface>=3.8.0 (from pyramid)
Collecting translationstring>=0.4 (from pyramid)
Collecting repoze.lru>=0.4 (from pyramid)
Collecting WebOb>=1.3.1 (from pyramid)
Collecting venusian>=1.0a3 (from pyramid)
Collecting PasteDeploy>=1.5.0 (from pyramid)
Installing collected packages: zope.deprecation, zope.interface, translationstring, repoze.lru, WebOb, venusian, PasteDeploy, pyramid
Successfully installed PasteDeploy-1.5.2 WebOb-1.5.1 pyramid-1.6 repoze.lru-0.6 translationstring-1.3 venusian-1.0 zope.deprecation-4.1.2 zope.interface-4.1.3
$ 
```

### django virtualenv
```text
$ virtualenv virtualenv-django
Using base prefix '/usr'
New python executable in /opt/virtualenv-django/bin/python3
Also creating executable in /opt/virtualenv-django/bin/python
Installing setuptools, pip, wheel...done.
$ source virtualenv-django/bin/activate
$ pip install django
Collecting django
Installing collected packages: django
Successfully installed django-1.9.1
$ 
```

### tg.devtools virtualenv
```text
$ virtualenv virtualenv-tg.devtools
Using base prefix '/usr'
New python executable in /opt/virtualenv-tg.devtools/bin/python3
Also creating executable in /opt/virtualenv-tg.devtools/bin/python
Installing setuptools, pip, wheel...done.
$ source virtualenv-tg.devtools/bin/activate
$ pip install tg.devtools
Collecting tg.devtools
Collecting WebTest<2.0 (from tg.devtools)
Collecting TurboGears2>=2.3.7 (from tg.devtools)
Collecting gearbox (from tg.devtools)
Collecting backlash>=0.0.7 (from tg.devtools)
Collecting WebOb (from WebTest<2.0->tg.devtools)
Collecting MarkupSafe (from TurboGears2>=2.3.7->tg.devtools)
Collecting repoze.lru (from TurboGears2>=2.3.7->tg.devtools)
Collecting crank<0.8,>=0.7.3 (from TurboGears2>=2.3.7->tg.devtools)
Collecting cliff>=1.14.0 (from gearbox->tg.devtools)
Collecting Tempita (from gearbox->tg.devtools)
Collecting PasteDeploy (from gearbox->tg.devtools)
Collecting cmd2>=0.6.7 (from cliff>=1.14.0->gearbox->tg.devtools)
Collecting pyparsing>=2.0.1 (from cliff>=1.14.0->gearbox->tg.devtools)
Collecting six>=1.9.0 (from cliff>=1.14.0->gearbox->tg.devtools)
Collecting PyYAML>=3.1.0 (from cliff>=1.14.0->gearbox->tg.devtools)
Collecting stevedore>=1.5.0 (from cliff>=1.14.0->gearbox->tg.devtools)
Collecting argparse (from cliff>=1.14.0->gearbox->tg.devtools)
Collecting PrettyTable<0.8,>=0.7 (from cliff>=1.14.0->gearbox->tg.devtools)
Collecting pbr<2.0,>=1.4 (from cliff>=1.14.0->gearbox->tg.devtools)
Collecting unicodecsv>=0.8.0 (from cliff>=1.14.0->gearbox->tg.devtools)
Installing collected packages: WebOb, WebTest, MarkupSafe, repoze.lru, crank, TurboGears2, pyparsing, cmd2, six, PyYAML, pbr, argparse, stevedore, PrettyTable, unicodecsv, cliff, Tempita, PasteDeploy, gearbox, backlash, tg.devtools
Successfully installed MarkupSafe-0.23 PasteDeploy-1.5.2 PrettyTable-0.7.2 PyYAML-3.11 Tempita-0.5.2 TurboGears2-2.3.7 WebOb-1.5.1 WebTest-1.4.3 argparse-1.4.0 backlash-0.1.1 cliff-1.15.0 cmd2-0.6.8 crank-0.7.3 gearbox-0.0.11 pbr-1.8.1 pyparsing-2.0.7 repoze.lru-0.6 six-1.10.0 stevedore-1.10.0 tg.devtools-2.3.7 unicodecsv-0.14.1
$ 
```



[Hardened Layer, SoftLayer Custom Portal - Part 1]:{% post_url 2016-01-16-hardened-layer %}
[Hardened Layer, SoftLayer Custom Portal - Part 2]:{% post_url 2016-01-21-hardened-layer-part2 %}
[Python Virtual Environments]:{% post_url 2016-01-26-python-virtualenv-and-venv %}

[Stack Overflow]:https://stackoverflow.com
[Github]:https://github.com
[Ruby on Rails]:https://rubyonrails.org

[Django]:https://www.djangoproject.com
[TurboGears]:http://www.turbogears.org/
[web2py]:http://www.web2py.com/
[pyramid]:https://trypyramid.com
[CherryPy]:http://www.cherrypy.org/
[Flask]:http://flask.pocoo.org
[bottle]:http://gottlepy.org
[pecan]:http://www.pecanpy.org
[falcon]:http://falconframework.org
[hug]:https://github.com/timothycrosley/hug
[pycnic]:http://pycnic.nullism.com/

[Django - github]:https://github.com/django/django
[TurboGears - github]:https://github.com/TurboGears/tg2
[web2py - github]:https://github.com/web2py/web2py
[pyramid - github]:https://github.com/Pylons/pyramid
[CherryPy - github]:https://github.com/cherrypy/cherrypy
[Flask - github]:https://github.com/mitsuhiko/flask
[bottle - github]:https://github.com/bottlepy/bottle
[pecan - github]:https://github.com/pecan/pecan
[falcon - github]:https://github.com/falconry/falcon
[hug - github]:https://github.com/timothycrosley/hug
[pycnic - github]:https://github.com/nullism/pycnic

[stackoverflow/django]:http://stackoverflow.com/questions/tagged/django
[stackoverflow/turbogears]:http://stackoverflow.com/questions/tagged/turbogears
[stackoverflow/web2py]:http://stackoverflow.com/questions/tagged/web2py
[stackoverflow/pyramid]:http://stackoverflow.com/questions/tagged/pyramid
[stackoverflow/cherrypy]:http://stackoverflow.com/questions/tagged/cherrypy
[stackoverflow/flask]:http://stackoverflow.com/questions/tagged/flask
[stackoverflow/bottle]:http://stackoverflow.com/questions/tagged/bottle
[stackoverflow/pecan]:http://stackoverflow.com/questions/tagged/pecan
[stackoverflow/falconframework]:http://stackoverflow.com/questions/tagged/falconframework


