---
title: Python Virtual(Isolated) Environments
tags: ["Python", "isolation", "setup"]
categories: ["development"]
date: Tue, 26 Jan 2016 14:11:55 +0900
---
계단 하나 하나를 그냥 뛰어넘지 못하는 성격 탓에, 정작 쓰려던 글을 뒤로
미루고 먼저 써 내려가고 있는 이 글은, Bundler가 Ruby 세계에 제공하는
것과 유사한 기능을 Python 세계에 제공해주는 `virtualenv`와 `pyvenv`로
줄여 부르는 Python Virtual Environments에 대한 이야기이다.

[Bundler]는 Ruby 언어로 작성된 개별 프로젝트의 패키지 의존성을 Gemfile에
기술하여 독립적으로 관리/보존함으로써, 개발자와 운영자에게 아래와 같은
(구식 개발자가 느끼기에) 엄청난 혜택을 주는 도구이다.
([Bundler 한국어 페이지])

Bundler는

* 프로젝트를 진행하는 **여러 개발자들이 동일한 환경 구성을 쉽게** 할 수
  있도록 도와주며,
* 이렇게 개발된 프로젝트가 운영모드로 전환되었을 때, **운영환경 역시
  동일하게 구성**하여 그 실행을 보장하고,
* 단순히 패키지를 관리하는 차원을 넘어 독립적인 실행환경을 제공함으로써
  **동일 시스템에서 여러 서비스가 각각의 환경을 기반으로 서비스**될 수
  있게 해주고,
* 같은 원리로, 개발자가 현재버전의 의존성을 유지하면서 그 버전에 대한
  **유지보수 진행과 동시에** 새로운 의존성을 갖는 **신규 버전의 개발을
  병행**할 수도 있게 해준다.

요즘 대부분의 (짜잘한) 개발을 Ruby로 진행하다보니 좀 엉뚱한 서론을 쓰고
말았는데, 오늘의 주제인 [virtualenv]와 [pyvenv]는 이와 같은 혜택을 Python
개발자에게 선사하는 예쁜 도구이다. (이미 Bundler와 virtualenv 모두,
2000년대 말에 등장한 것들인데 이제야...)

참고로, 조금 각도가 다르기는 한데, Node.js 진영에서도 `nvm`을 이용한
Node.js의 실행 버전 관리, Python의 PIP, Ruby의 Gem과 같은 `npm`을 통한
패키지 관리 등을 제공하는데, 이에 대한 이야기는 얼마 전에
"[Ember CLI 환경 구성하기]"에서 간접적으로 잠깐 다루었다.

이렇게, 근래의 개발환경, 개발언어에게 있어서, 실행버전관리와 패키지
관리, 그리고 프로젝트 별 패키지 의존성 관리는 너무 당연한 것이 되었다.




# 독립실행환경 준비하기

현재, 독립실행환경을 구성할 수 있는 다양한 옵션이 있다. 대표적인 것이
`virtualenv`와 Python 3의 `pyvenv`이며, 이 둘은 서로 배타적인 것이
아니어서, 동일 시스템에 두 가지 기능을 모두 준비해 두는 것이 가능하다.

각각의 준비 방식은 다음과 같다.


## `virtualenv`의 설치

Python 2.x 버전 시절에는 `virtualenv`라는 이름의 3rd-Party 패키지를
이용하여 독립실행환경을 구성할 수 있다. 이 패키지는 PIP를 이용하여
설치할 수 있으며, 그 과정은 아래와 같다.

```console
$ sudo apt-get install python3-pip
Reading package lists... Done
Building dependency tree       
Reading state information... Done
The following extra packages will be installed:
  libexpat1-dev libpython3-dev libpython3.4-dev python3-colorama python3-dev
  python3-distlib python3-setuptools python3-wheel python3.4-dev
The following NEW packages will be installed:
  libexpat1-dev libpython3-dev libpython3.4-dev python3-colorama python3-dev
  python3-distlib python3-pip python3-setuptools python3-wheel python3.4-dev
0 upgraded, 10 newly installed, 0 to remove and 1 not upgraded.
Need to get 23.7 MB of archives.
After this operation, 40.0 MB of additional disk space will be used.
<...>
$ 
```

Ubuntu 리눅스에서는 위의 방식으로 이미 패키지 형태로 제공되는 Python 3용
PIP를 설치할 수 있다. 그리고 `python3-virtualenv`라는 이름으로 `virtualenv`
패키지도 제공한다.

근래의 나는, PIP와 같이 각 개발 플랫폼에서 자체 패키징 시스템으로 제공되는
환경에서는 그 패키지 관리도구를 이용하는 것을, 그리고 가능하다면 System
Global 설치가 아닌 User Local 설치를 하는 것을 원칙으로 하고 있다.

그래서, `virtualenv`는 PIP로 설치하는 것으로 해보았다.

```console
$ pip3 install virtualenv
Downloading/unpacking virtualenv
  Downloading virtualenv-14.0.0-py2.py3-none-any.whl (1.8MB): 1.8MB downloaded
Installing collected packages: virtualenv
Successfully installed virtualenv
Cleaning up...
$ 
```

위와 같은 방식으로 `virtualenv`를 설치하고 나면, 사용자의 `$HOME` 아래에
다음과 같은 내용이 설치된다.

```console
$ tree .local/
.local/
├── bin
│   ├── virtualenv
│   └── virtualenv-3.5
├── lib
│   └── python3.4
│       └── site-packages
│           ├── __pycache__
│           │   └── virtualenv.cpython-34.pyc
│           ├── virtualenv-14.0.1.dist-info
│           │   ├── DESCRIPTION.rst
│           │   ├── METADATA
│           │   ├── RECORD
│           │   ├── WHEEL
│           │   ├── entry_points.txt
│           │   ├── metadata.json
│           │   └── top_level.txt
│           ├── virtualenv.py
│           └── virtualenv_support
│               ├── __init__.py
│               ├── __pycache__
│               │   └── __init__.cpython-34.pyc
│               ├── argparse-1.4.0-py2.py3-none-any.whl
│               ├── pip-8.0.2-py2.py3-none-any.whl
│               ├── setuptools-19.4-py2.py3-none-any.whl
│               └── wheel-0.26.0-py2.py3-none-any.whl
└── share
<...>
$ 
```

일반적인 UNIX FSHS의 틀이 `/usr` 또는 `/usr/local` 등의 위치가 아닌
`$HOME/.local`에 있는, 사용자 Local 구조 안에, Python Site Package가
설치된 것이다. 이 파일들은 PIP의 관리 하에 있어서 `pip uninstall`
명령으로 지울 수도 있다.

나중에 다시 얘기하겠지만, 일단 `virtualenv_support` 아래의 네 개의
Wheel이 있다는 것을 주목하여 볼 필요가 있다.


## `pyvenv`의 설치

앞서 얘기한 것과 같이, Python 2.x 버전과 3.x 버전을 모두 지원하는
`virtualenv`는 Python의 공식 모듈이 아닌 3rd-Party 도구이다. 이와는
대조적으로, `pyvenv`는 Python 3.x가 공식적으로 제공하는 독립실행환경
구성 도구라서 PIP 등을 통한 별도의 설치 없이 사용할 수 있다.

Ubuntu 리눅스와 이의 기반이 되는 Debian 리눅스는 각각의 사용 관점,
또는 구성 관점에서의 독립성에 기반하여 패키지를 세분화하는 것으로
정책을 삼고 있어서, 이 모듈 역시 Python 주 패키지가 아닌 별도의
패키지를 통하여 제공하고 있다.

아래의 명령을 이용하여 이 `python3-venv` 패키지를 설치할 수 있다.

```console
$ sudo apt-get install python3-venv
Reading package lists... Done
Building dependency tree
Reading state information... Done
The following extra packages will be installed:
  python-chardet-whl python-colorama-whl python-distlib-whl
  python-html5lib-whl python-pip-whl python-requests-whl python-setuptools-whl
  python-six-whl python-urllib3-whl python3.4-venv
The following NEW packages will be installed:
  python-chardet-whl python-colorama-whl python-distlib-whl
  python-html5lib-whl python-pip-whl python-requests-whl python-setuptools-whl
  python-six-whl python-urllib3-whl python3-venv python3.4-venv
0 upgraded, 11 newly installed, 0 to remove and 0 not upgraded.
Need to get 1,078 kB of archives.
After this operation, 1,511 kB of additional disk space will be used.
<...>
$ 
```




# 독립실행환경에서 작업하기

이제 설치된 가상환경, 독립실행환경을 사용하는 방법을 간단하게 보려고
한다. 이후의 부분은 앞서 설치한 두 가지 방식이 거의 동일한 모양으로
동작한다. ([pyvenv]에서 설명하고 있듯이, `pyvenv`가 앞서 개발된
`virtualenv`의 방식을 대부분 차용한 결과이다.)


## 독립실행환경 만들기

Python 3의 공식 지원방식인 `pyvenv`는 다음과 같은 방식으로 환경구성을
하게 된다.

```console
$ pyvenv pyvenv
$ 
$ du -sh pyvenv
3.5M	pyvenv
$ ls pyvenv
bin  include  lib  lib64  pyvenv.cfg
$ ls -l pyvenv/bin/
total 32
-rw-r--r-- 1 sio4 sio4 2154 Jan 22 23:23 activate
-rw-r--r-- 1 sio4 sio4 1270 Jan 22 23:23 activate.csh
-rw-r--r-- 1 sio4 sio4 2406 Jan 22 23:23 activate.fish
-rwxrwxr-x 1 sio4 sio4  269 Jan 22 23:23 easy_install
-rwxrwxr-x 1 sio4 sio4  269 Jan 22 23:23 easy_install-3.4
-rwxrwxr-x 1 sio4 sio4  241 Jan 22 23:23 pip
-rwxrwxr-x 1 sio4 sio4  241 Jan 22 23:23 pip3
-rwxrwxr-x 1 sio4 sio4  241 Jan 22 23:23 pip3.4
lrwxrwxrwx 1 sio4 sio4    9 Jan 22 23:23 python -> python3.4
lrwxrwxrwx 1 sio4 sio4    9 Jan 22 23:23 python3 -> python3.4
lrwxrwxrwx 1 sio4 sio4   18 Jan 22 23:23 python3.4 -> /usr/bin/python3.4
$ 
```

맨 처음 명령어는 환경을 구성하는 명령이다. `pyvenv` 라는 명령어를 쓰고
있는데, `python3 -m venv` 같은 방식으로도 사용할 수 있다. (손가락이
심심하다면...)

이렇게 구성된 환경의 크기를 보니, 약 3.5MB의 공간을 사용하고 있고, 그
안에 `bin`, `include`, `lib` 등의 표준경로와 함께 `pyvenv.cfg` 파일이
생성된 것을 볼 수 있다.

`bin` 디렉터리의 내부를 보니, 몇몇 activation script 등과 함께
`setuptools`의 `easy_install`, `pip` 등의 명령어가 함께 생성된 것을
확인할 수 있고, `python3.4` Binary가 시스템 Binary에 링크된 형태로
제공되는 것을 볼 수 있다.


다음은, `virtualenv`를 사용하여 가상환경을 구성하는 예시이다.

```console
$ virtualenv -p python3 venv
Already using interpreter /usr/bin/python3
Using base prefix '/usr'
New python executable in /home/sio4/tmp/venv/bin/python3
Also creating executable in /home/sio4/tmp/venv/bin/python
Installing setuptools, pip, wheel...done.
$ 
$ du -sh venv
15M	venv
$ ls venv
bin  include  lib
$ ls -l venv/bin/
total 4040
-rw-rw-r-- 1 sio4 sio4    2080 Jan 22 23:21 activate
-rw-rw-r-- 1 sio4 sio4    1038 Jan 22 23:21 activate.csh
-rw-rw-r-- 1 sio4 sio4    2236 Jan 22 23:21 activate.fish
-rw-rw-r-- 1 sio4 sio4    1137 Jan 22 23:21 activate_this.py
-rwxrwxr-x 1 sio4 sio4     266 Jan 22 23:21 easy_install
-rwxrwxr-x 1 sio4 sio4     266 Jan 22 23:21 easy_install-3.4
-rwxrwxr-x 1 sio4 sio4     238 Jan 22 23:21 pip
-rwxrwxr-x 1 sio4 sio4     238 Jan 22 23:21 pip3
-rwxrwxr-x 1 sio4 sio4     238 Jan 22 23:21 pip3.4
lrwxrwxrwx 1 sio4 sio4       7 Jan 22 23:21 python -> python3
-rwxrwxr-x 1 sio4 sio4    2355 Jan 22 23:21 python-config
-rwxrwxr-x 1 sio4 sio4 4091712 Jan 22 23:21 python3
lrwxrwxrwx 1 sio4 sio4       7 Jan 22 23:21 python3.4 -> python3
-rwxrwxr-x 1 sio4 sio4     245 Jan 22 23:21 wheel
$ 
```

먼저, `virtualenv` 명령에게 `-p` 옵션으로 Interpreter를 지정해 주었더니
"이미 그거 쓸건데?"라는 메시지를 추가로 내뱉고 있으며, 그 외에도 뭔가
자세한 출력을 하는 것이 조금 다르다.

`pyvenv`의 경우와 다른 부분은 점과 Python Binary가 Link가 아닌 Copy
형태로 와 있다는 점이다. (이게 좀 애매한 부분인데, `lib/python3.4`
아래의 파일들도 완전히 복사된 것이라면 모르겠지만 Binary만 딸랑 복사된
것이 어떤 의미가 있을지?  아직은 잘 모르겠다.)

이 방식에서도 역시 `easy_install`, `pip` 등의 유틸리티가 함께 설치된
것을 볼 수 있다. (이 방식에서는 `wheel`이 추가로 설치되었다.)
딱 하니 알 수 있겠지만, 이들 도구는 모두 Python 추가 모듈, 패키지를
관리하는 유틸리티이며, 앞서 주목했던 `virtualenv_support` 아래에
함께 설치된 wheel 들의 내용과 일치한다.

```console
$ pyvenv/bin/pip list
pip (1.5.6)
setuptools (12.2)
$ venv/bin/pip list
pip (8.0.0)
setuptools (19.4)
wheel (0.26.0)
$ 
$ pyvenv/bin/pip -V
pip 1.5.6 from /home/sio4/tmp/pyvenv/lib/python3.4/site-packages (python 3.4)
$ venv/bin/pip -V
pip 8.0.0 from /home/sio4/tmp/venv/lib/python3.4/site-packages (python 3.4)
$ 
```

위와 같이, 두 방식으로 구성한 가상환경에는 `pip`, `setuptools` 등의
패키지가 설치된 것을 확인할 수 있다.  두 방식 사이의 차이는 `pyvenv`에
의해 구성된 환경이 보다 낮은 버전의 패키지로 구성되었다는 점인데,
이 부분은 아마도 Debian/Ubuntu 패키지의 영향을 받은 부분인 것 같긴
한데... 더 파지는 않으려고 한다. :-)


## 독립실행환경 활성화

독립실행환경의 영향 아래에서 작업하기 위해서는 이 환경을 활성화하는
과정을 거쳐야 한다. 물론, 위에서 본 몇 개의 예외 같이 명령을 수행할
때 전체 PATH를 줘서 실행할 수도 있지만 작업 편의를 위한 것으로
생각할 수 있다.

### Activate, Deactivate

가상환경을 설치하면 `bin` 경로 아래에 `activate`라는 이름의 스크립트가
만들어지는데, 이것을 `source`해주면 가상환경에 맞는 환경이 설정된다.
또한, 가상환경에서 빠져나와 시스템 Global의 영향 아래로 돌아가려면
`deactivate` 명령을 내려주면 된다. (이것은 `source` 할 스크립트가
아니며, 그냥 치면 된다.)

실제로 동작하는 예를 보면 아래와 같다.
아래와 같다.

```console
$ pip -V
pip 1.5.6 from /usr/lib/python2.7/dist-packages (python 2.7)
$ source pyvenv/bin/activate
(pyvenv) $ pip -V
pip 1.5.6 from /home/sio4/tmp/pyvenv/lib/python3.4/site-packages (python 3.4)
(pyvenv) $ deactivate 
$ source venv/bin/activate
(venv) $ pip -V
pip 8.0.0 from /home/sio4/tmp/venv/lib/python3.4/site-packages (python 3.4)
(venv) $ deactivate 
$ 
```

위의 내용은, 동일한 `pip -V` 명령을 환경을 바꿔가며 내린 결과이다.
맨 처음의 경우는 시스템에 설치된 pip가 반응을 하고 있고, `pyvenv`를
Activate한 후에는 그 안의 pip가 응답을 주고 있으며 같은 방식으로
`virtualenv`로 구성한 `venv`를 활성화하였을 때에도 정상적으로 동작하고
있음을 알 수 있다.

---

사실, 이 글은 작성 계획을 세운 적이 없었다. 단지, SoftLayer Python
API와 Custom Portal을 시험하기 위한 환경을 구성하던 중, 그 과정에서
복잡하게 더럽혀질 시스템을 걱정하다 보니... 기록으로 남기지 않을
수 없었을 뿐.

다음 이야기는 Python Web Framework을 선택하는 과정의 고민들을 "또
부수적으로" 적어 보려고 한다. 그리고 난 후에, 본격적으로 SoftLayer
API 시험에 들어가겠다.


[Ember CLI 환경 구성하기]:{{< relref "/blog/development/2015-12-09-preparing-ember-environment.md" >}}
[virtualenv]:https://virtualenv.pypa.io/
[pyvenv]:https://www.python.org/dev/peps/pep-0405/
[Bundler]:http://bundler.io/
[Bundler 한국어 페이지]:http://ruby-korea.github.io/bundler-site/

[How Bundler Works: A History of Ruby Dependency Management]:http://www.cloudcity.io/blog/2015/07/10/how-bundler-works-a-history-of-ruby-dependency-management/

