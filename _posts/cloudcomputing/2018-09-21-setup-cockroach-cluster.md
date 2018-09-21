---
title: CockroachDB 클러스터 구성하기
subtitle: '"바퀴벌레 연맹" 구성을 위한 배치/관리 반자동화하기'
tags: DBMS cloud-computing open-source
categories: ["cloudcomputing"]
image: /attachments/cockroachdb/cockroach-symbol.jpg
banner: /attachments/cockroachdb/cockroach-logo.jpg
date: 2018-09-21T17:20:00+0900
---
좀 번잡스러운 글이 될 것 같은데, 이번 글은 지난 글에 이어 CockroachDB를
수동/반자동으로 설치하는 과정에 대해 정리한다. 먼저 단일 노드에 대한
수동 설치 과정을 보면서, 노드 구성에 대하여 확인할 것이고, 그 다음에는
세 노드로 구성된 클러스터를 쉘스크립트를 사용하여 원격지에서 자동화하여
배치/관리하는 과정에 대해 정리할 것이다.


{:.boxed}
> CockroachDB 맛보기 묶음글은 다음과 같습니다.
>
> * [CockroachDB 안녕?]
> * _CockroachDB 클러스터 구성하기_


{:toc .half.pull-right}
* TOC

클라우드 컴퓨팅이 점차 보편화되고 성숙도가 증가하면서, 애플리케이션 또는
서비스를 만들고, 배치하고, 관리하는 과정 전반에 걸쳐 많은 변화가 일어나고
있다. 그 중 하나가 배치에 대한 자동화인데, 이는 서비스 규모 증가에 따른
수평 확장, 또는 수평 확장을 자동화하는데 있어서 필수적인 조건이 되어가고
있다.

이미 Chef나 Ansible 같은 구성 자동화 도구는 On-Premises 뿐만 아니라 여러
클라우드 환경을 대상으로 하여 사용자가 원하는 환경과 서비스 구조를 쉽게
구성하기 위해 널리 사용되고 있으며, Docker Swarm이나 Kubernetes 같은
Container 환경을 위한 전용 Orchestration 도구의 인기도 하늘을 찌르고 있다.
(아... 쓰다가 만 Docker 묶음글은 언제 다시 쓰나...)

그럼에도 불구하고, 그런 도구들을 잘 사용하기 위해서는 대상이 되는 환경
및 배치하고자 하는 소프트웨어의 구성에 대한 이해가 꼭 선행되어야 한다.
이 글에서는, 이런 관점에서 오늘의 대상 소프트웨어인 **CockroachDB가 어떤
구성을 갖는지 확인**하기 위해서 "단일 노드 설치"를 손으로 해볼 것이고,
그 다음에는 **이 이해를 바탕으로 자동구성 스크립트를 작성**하여, 세 대의
노드로 구성된 Cockroach 클러스터를 원격으로 구성하고 관리하는 과정에
대해서 정리한다. (대부분의 배치 자동화는 이 두 가지, 대상을 이해하고
그것을 자동화하는 방법을 찾는 것으로 이루어진다고 생각한다.)



# 단일 노드 설치 - "구성의 이해"

만약, Cockroach의 소스코드에도 관심이 있거나 기여를 고려하고 있다면,
소스 저장소에서 소스를 받아 빌드하는 것도 옵션이 될 것이다. 하지만
여기서는 공식 배포되는 바이너리를 내려받아서 이용하는 방법을 사용하여
설치를 진행하려고 한다. 또, 수동설치를 진행하는 과정 속에서, 나중에
자동화를 할 때 고려해야 할 포인트를 함께 짚어볼 것이다.

## Cockroach 내려받기

오늘을 기준으로 CockroachDB의 최신버전은 2.0.5이며, 홈페이지에서
내려받을 수 있는 URL을 확인할 수 있다. 아래와 같은 명령을 사용하여
배포되는 파일을 받아서 바로 풀어보겠다.

{:.wrap}
```console
$ wget -q -O - https://binaries.cockroachdb.com/cockroach-v2.0.5.linux-amd64.tgz |sudo tar -C /opt -zxv
cockroach-v2.0.5.linux-amd64/cockroach
$ 
```

보통은, 일단 `-O -` 옵션 없이 받은 후에, 그것을 다시 `tar` 명령을 이용해
푸는 방식을 많이 사용하겠지만, 위의 예에서는 향후 자동화 등을 고려하여
"받으면서 바로" 압축/묶음을 해제하는 방식을 사용하였다. 특히, 저장공간
제공이 박한 환경이라면 꽤 쓸모있는 방식이다.

`wget` 명령의 `-O` 옵션은 출력파일을 지정하는 옵션인데, 그 위에 파일명
대신 `-`를 넣으면 파일 대신 표준출력에 그 내용을 뿌리게 된다. (KISS,
Keep It Simple and Stupid 사상을 따르는 GNU/Linux 명령의 상당수는,
Pipeline 처리를 지원하기 위해 이와 같은 방식을 지원한다.) `tar` 명령의
`-C` 옵션은, `tar`가 일처리를 시작하기 전에 자신의 실행위치(Working
Directory)를 뒤따라오는 값으로 지정한 곳으로 옮기도록 해주며, 위의 경우,
`/opt`로 옮겨서 압축/묶음을 해제하게 된다.

{:.keypoint}
포인트 #1
: Pipeline을 사용해서 디스크 쓰기를 피하고 단번에 풀어낸다

위의 실행 결과로 출력된 `cockroach-v2.0.5.linux-amd64/cockroach`는
`tar`가 묶음을 풀면서 풀어 내는 파일의 경로명을 출력하는 것인데,...
앗! 그런데... 딸랑 파일 하나만 풀어내고 있다! 뭐지??? 아무튼,

{:.wrap}
```console
$ ls -l /opt/cockroach-v2.0.5.linux-amd64/
total 55084
-rwxr-xr-x 1 1002 1003 56404120 Aug 14 03:00 cockroach
$ 
```

풀린 파일 목록을 보니, `/opt/cockroach-v2.0.5.linux-amd64/` 아래에 56MB가
넘는 엄청 큰 파일 하나가 딸랑 만들어졌다. 그런데 소유자와 그룹이 숫자로
표기되어 있네?

`tar`를 이용해서 파일들을 묶으면, 파일의 내용 뿐만 아니라 소유권 정보와
퍼미션 정보를 함께 담게 된다. 반대로, 묶음을 풀어낼 때에는 소유권과
퍼미션을 저장하던 당시의 값으로 설정하려고 시도하게 되는데, 이 때 명령을
일반 사용자로 실행하는 경우에는 퍼미션만 유지될 뿐, 소유권은 명령을
수행한 사람으로 설정되게 된다. 하지만 이 명령을 `root`가 수행한 경우에는
`root`에게 소유권 변경 권한이 있기 때문에 원본의 소유권이 그대로 유지되게
된다.

이 경우는, UID `1002`와 GID `1003`을 보존하여 파일이 풀려있는데, 이렇게
실존하지 않는 UID를 갖는 경우, 별 것 아닌 것처럼 보이지만 큰 보안 위협이
될 수 있다. 예를 들어, 임시로 이 서버를 사용할 누군가를 위해 새로 계정을
만들어 줬는데, 하필 그 UID가 `1002`로 설정되었다면? 그렇다. 그 임시
사용자가 이 파일을 마음대로 바꿀 수 있게 되는 것이다.

{:.wrap}
```console
$ sudo chown root.root /opt/cockroach-v2.0.5.linux-amd64/cockroach
$ 
```

이제 `root`로 소유권을 가져왔으니, 일단 안심. 이런 부분은 배치를 자동화할
때 보안 관점에서 항상 주의해야 하는 부분이다.

{:.keypoint}
포인트 #2
: 시스템에 파일을 설치했다면 권한과 소유권을 주의 깊게 살피고 조정해야 한다.

{:.comment}
> 사실, 이런 부분을 다루는 설치문서를 본 적이 없는 것 같긴 하다.
> 심지어, 파일이 읽어지지 않는 것을 피하기 위해 "안전하게" 라면서 모든
> 파일과 디렉터리를 `777`로 설정하려는 사람들도 꽤 많이 보았다.
> 보안에 대한 최소한의 고려는 관리자로써 매우 기본적인 부분인데도 불구하고
> 많은 현장에서 이런 기본 원칙이 지켜지지 않는 것 같아 아쉽다.


## 설치/설정하기

어라? 그러고 보니 파일이 딸랑 하나라고? 그럼 뭘 설치하고 어떻게 설정하나?

과거의 전통적인 소프트웨어, `.../bin` 아래 바이너리가 있고, 일부 전용의
라이브러리가 `.../lib` 아래에 들어있고, `.../data` 등에는 locale 파일 등
기타 구동에 부속 파일들이 들어있고,... 이런 복잡한 구성에 익숙하다면 조금
당황스러운 장면이다.

나 역시, Go 언어에 관심을 갖고 Go로 만들어진 소프트웨어를 하나 둘 접하면서
조금 놀랐던 부분인데, 공유 라이브러리나 부속파일 없이, 딸랑 하나의 파일에
모든 것을 Embed 하여 배포하는 이 오묘한 방식... 아직 좀 낯설긴 하다.
아무튼, Cockroach는 이 파일 하나가 전부이다.


## 실행해보기

이제 잘 동작하는지, 시험 운전을 해볼 차례다.

먼저, 아까 파일을 풀어냈던 `/opt/....../cockroach`라는 긴 경로를 쳐서 명령을
수행했다. 공식 설치 문서는 이 파일을 `/usr/local/bin`에 둘 것을 권하고 있지만
나는 원칙적으로 이렇게 개별 배포되는 소프트웨어를 `/usr` 이나 `/usr/local`에
섞어 버리지 않는다. `/usr` 아래에는 OS Vendor가 제공한 패키지만,
`/usr/local`에는 내가 직접 빌드한 패키지만 위치할 수 있으며, ISV가 배포하는
것은 패키지 관리자를 이용하지 않는 이상, `/opt`를 벋어나게 하지 않는다.

{:.comment}
> 아... 설치문서에 쓰여있는 모든 것을 Vender Recommended라며 신봉하던 분들이
> 잠깐 떠올라서 아찔했다. 정신줄 잡고,

명령을 내려보자.

{:.wrap}
```console
$ /opt/cockroach-v2.0.5.linux-amd64/cockroach start --insecure --host=localhost
*
* WARNING: RUNNING IN INSECURE MODE!
* 
* - Your cluster is open for any client that can access localhost.
* - Any user, even root, can log in without providing a password.
* - Any user, connecting as root, can read or write any data in your cluster.
* - There is no network encryption nor authentication, and thus no confidentiality.
* 
* Check out how to secure your cluster: https://www.cockroachlabs.com/docs/v2.0/secure-a-cluster.html
*
CockroachDB node starting at 2018-09-20 13:32:37.83470346 +0000 UTC (took 1.1s)
build:               CCL v2.0.5 @ 2018/08/13 17:59:42 (go1.10)
admin:               http://localhost:8080
sql:                 postgresql://root@localhost:26257?sslmode=disable
logs:                /home/azmin/x/cockroach-data/logs
temp dir:            /home/azmin/x/cockroach-data/cockroach-temp774790777
external I/O path:   /home/azmin/x/cockroach-data/extern
store[0]:            path=/home/azmin/x/cockroach-data
status:              initialized new cluster
clusterID:           6e37ea42-72b0-41e9-be54-41b7745c76c0
nodeID:              1
```

주명령 뒤에 `start`라는 부명령을 내려주면, CockroachDB는 DBMS 인스턴스를
실행시킨다. `--insecure` 옵션은 통신구간 암호화나 인증을 생략하도록 하는
옵션으로, 실제 Production에서는 적절하지 않으나 시험 운전이므로 한 번 써봤다.

그 아래 출력에 궁금증이 생기는 부분이 몇 가지 나왔다. 예를 들면, 어떤
Address를 대상으로 Listen을 하는지, 어느 경로에 데이터나 로그를 저장하게
되는지, 등등... 어? 그런데 읽어보니, 좀 거슬리는 부분이 눈에 띈다.
바로, `logs`, `temp dir`, `store[0]` 등의 경로. 저 위치, `/home/azmin/x`는
내가 명령을 수행한 현재 수행 경로(CWD)이다. 아... 별도 옵션을 주지 않으면
데이터 파일 등은 CWD를 기준으로 만들어지는 거였어!

그럼 이제, 실행위치를 조심하던지 저 값들을 명시적으로 지정하는 옵션을
찾아봐야만 한다!

{:.keypoint}
포인트 #3
: 어떤 소프트웨어는, 그것이 어디에서 실행되었는지가 중요할 수 있다.
  파일시스템을 이용하는 소프트웨어라면, CWD에 대한 제약과 경로 지정 설정
  또는 옵션을 꼭 확인해야 한다. (물론, 점점 잊혀져 가는 "Daemon의 조건"도
  머리 속에 붙들어 놓고...)

일단 foreground로 실행 중인 엔진은 끄고 이어 나가자.

{:.wrap}
```console
^CNote: a second interrupt will skip graceful shutdown and terminate forcefully
initiating graceful shutdown of server
server drained and shutdown completed
*
* INFO: interrupted
*
Failed running "start"
$ 
```

무심코 `^C`를 눌렀는데, 위의 화면에서 첫번째 줄이 나온 채 아무 반응이
없더라. 그래서 읽어보니, "*또 한번 `^C`를 날리면 인정사정 없이 그냥 끌 게*"
뭐 이런 말이네... 아, 훌륭한 구조다. 인터럽트에 대한 시그널 핸들링은
보편적인 방법처럼 정상 종료로 만들었지만, 정말 죽이고 싶어서 `kill -9`를
따로 날릴 필요는 없어... 이런 말이었네.

+10점! 난 시그널처리를 깔끔하게 하는 소프트웨어를 좋아한다.
그리고 이런 사소해 보이는 곳에서, 그것을 만든 사람들이 어떤 사상과 견고함,
그리고 경험을 가지고 있는지를 옅볼 수 있다.

{:.keypoint}
포인트 #4
: `SIGINT`와 `SIGTERM` 등에 안전한 소프트웨어인지 알아야 한다.
  덤으로, 어떤 특별한 동작(예를 들어, 설정 다시 읽기나 Disk Flush하기)이
  지정된 시그널이 있는지 확인하면 더 좋다.


### 실행옵션 살펴보기

저장공간 설정이나 Listen 설정 등을 어떻게 하면 좋을지 알아봐야 할 것
같다. 방법 중 하나는 웹문서를 뒤지는 것이고, (급할 때에도 사용하기 편한)
다른 하나는 명령어에 내장된 도움말을 참고하는 것이다.

아래와 같이, 주명령 혹은 부명령을 포함한 상태에서 `--help` 옵션을 주어
명령을 수행하면 주명령의 일반 옵션 또는 해당 부명령의 특별 옵션을 확인할
수 있다.

{:.wrap}
```console
$ /opt/cockroach-v2.0.5.linux-amd64/cockroach start --help

Start a CockroachDB node, which will export data from one or more
storage devices, specified via --store flags.

If no cluster exists yet and this is the first node, no additional
flags are required. If the cluster already exists, and this node is
uninitialized, specify the --join flag to point to any healthy node
(or list of nodes) already part of the cluster.

Usage:
  cockroach start [flags]

<...>
```

그리고 CockroachDB는 근래에 유행하는 `help` 부명령도 지원한다. 옵션에
`--help`를 주는 것이 아니라, `cockroach help start` 처럼, `help`를
부명령으로 사용하고 그 인수로 알고 싶은 부명령을 주는 방식 말이다.

긴 출력은 생략하고, 확인해보니
`--certs-dir`, `--external-io-dir`, `--store`, `--temp-dir`, `--log-dir`
등과 같은 옵션이 있더라. 이 옵션들을 조합하면 원하는 구성을 할 수
있겠다.

그런데... 그냥 간단하게 `--root`, `--home`, 뭐 이런 게 없네... 나머지는
표준 구조에 맞춰 배열을 하고 `--root`로 지정한 경로를 Prefix로 쓰면
좋을텐데... 그럼 할 수 없이, `CWD`를 바꾸는 방식을 쓰는 것도 나쁘지
않은 선택이 될 것 같다.


## 구조 잡아보기

그럼, 앞서 살펴본 저장공간 사용 방식을 참고해서, 한 번 시험삼아 해보자.

{:.wrap}
```console
$ sudo mkdir -p /opt/cockroach
$ sudo mkdir -p /var/lib/cockroach
$ sudo ln -s /var/lib/cockroach /opt/cockroach/data
$ sudo ln -s /opt/cockroach-v2.0.5.linux-amd64/cockroach /opt/cockroach/
```

위의 명령들은 `/opt/cockroach` 라는 디렉터리를 만들고 이것을 Cockroach의
집으로 삼으려는 의도로 내려졌다. 먼저 `/opt/cockroach`를 만들고, 이와는
별도로 `/var/lib/cockroach`를 만들어줬다. 이 공간은 향후 데이터가 쌓일
공간이기 때문에 Static한 파일이 위치할 `/opt`가 아닌 `/var` 아래 만들어
줬고, 논리적인 접근이 쉽도록 집 안에 `data` 라는 이름으로 링크를 만들어
줬다. 마지막으로, 앞서 설치했던 바이너리를 이 안에 링크해줬다.

내가 이런 방식으로 작업할 때 들었던 질문이 몇 개 있다.

Q1: 왜 들어가보면 복잡한 `/var`에 데이터 경로를 만드나?
: UNIX 파일시스템의 설계 원칙을 보면, 변하는 데이터와 고정된 데이터를
  분리해서 다루고 있다. 마치, 프로그램이 코드와 변수로 나뉘듯이,
  파일시스템도 나누어 관리할 때 얻을 수 있는 잇점이 꽤 있다.

Q2: 왜 설치 경로인 `/opt/...-amd64`가 아닌 별도의 집을 짓나?
: `cockroach-v2.0.5.linux-amd64`라는 디렉터리 이름을 보면, 버전 등이
  함께 들어있다. 그런데 집은, 특정 버전이 살 공간이 아닌 그 소프트웨어와
  딸린 식구들이 살 공간이다. 버전별 배포본과 인스턴스를 구분하게 되면,
  나중에 소프트웨어가 업그레이드되거나 두 가지 버전을 동시에 수용해야
  할 때 유연하게 대응할 수 있다. 왜 두 버전을 동시에 수용하냐고? 가장
  흔한 경우는 업그레이드의 과도기를 생각하면 된다. 구테여 구버전의 백업을
  만들 필요가 없으며, 새 버전을 옆에 나란히 설치하면 된다.

하는 김에, 보안접속을 활성화하기 위해 인증서 생성도 해보자.


### 통신구간 암호화를 위한 인증성 생성

CockroachDB는 클러스터를 구성하는 노드 간 통신, 클라이언트와 노드 간
통신 등에서 SSL로 암호화된 통신을 지원하며, 이 때 사용하기 위한
자가서명 인증서를 만드는 기능을 제공하고 있다.

{:.wrap}
```console
$ mkdir $HOME/keys
$ mkdir /opt/cockroach/certs
$ 
```

위와 같이, 인증서에 서명을 할 열쇠를 보관할 디렉터리(`keys`)와 각 노드가
통신에 사용하기 위한 인증서를 담을 디렉터리(`.../certs`)를 만들었다.
그리고, 아래와 같이 전체적인 인증서 관리에 사용할 열쇠와 인증서를 만든다.

{:.wrap}
```console
$ /opt/cockroach/cockroach cert create-ca \
> --certs-dir=/opt/cockroach/certs --ca-key=$HOME/keys/ca.key
$ ls /opt/cockroach/certs
ca.crt
$ ls $HOME/keys
ca.key
$ 
```

위와 같이, 각 위치에 인증서와 열쇠가 만들어진 것을 확인할 수 있다.

만들어진 키와 인증서를 이용하여, 이번에는 클라이언트 통신에 사용할 열쇠를
만든다. 아래의 예에서는 `root`라는 이름의 사용자가 사용할 인증서를 만드는
것이다.

{:.wrap}
```console
$ /opt/cockroach/cockroach cert create-client root \
> --certs-dir=/opt/cockroach/certs --ca-key=$HOME/keys/ca.key
$ ls /opt/cockroach/certs
ca.crt  client.root.crt  client.root.key
$ 
```

참고로, 이 클라이언트 인증서와 키는 클라이언트로 사용될 기계에만 있으면
된다.

동일한 방법으로, 이번에는 노드가 자신을 증명하기 위해 사용할 인증서를
만든다.

{:.wrap}
```console
$ /opt/cockroach/cockroach cert create-node \
> localhost `hostname -s` `hostname -f` \
> --certs-dir=/opt/cockroach/certs --ca-key=$HOME/keys/ca.key
$ ls /opt/cockroach/certs
ca.crt  client.root.crt  client.root.key  node.crt  node.key
$ 
```

이상의 과정을 마치면, 최종적으로 다음과 같은 구조를 얻게 된다.

{:.wrap}
```console
$ tree /opt
/opt
├── cockroach
│   ├── certs
│   │   ├── ca.crt
│   │   ├── client.root.crt
│   │   ├── client.root.key
│   │   ├── node.crt
│   │   └── node.key
│   ├── cockroach -> /opt/cockroach-v2.0.5.linux-amd64/cockroach
│   └── data -> /var/lib/cockroach
└── cockroach-v2.0.5.linux-amd64
    └── cockroach

4 directories, 7 files
$ 
```

이제 다시 Cockroach를 띄워보자.

{:.wrap}
```console
$ cd /opt/cockroach
$ ./cockroach start --certs-dir=certs --host=localhost --store=path=data
CockroachDB node starting at 2018-09-18 04:30:24.867745826 +0000 UTC (took 0.8s)
build:               CCL v2.0.5 @ 2018/08/13 17:59:42 (go1.10)
admin:               https://localhost:8080
sql:                 postgresql://root@localhost:26257?sslcert=certs%2Fclient.root.crt&sslkey=certs%2Fclient.root.key&sslmode=verify-full&sslrootcert=certs%2Fca.crt
logs:                /opt/cockroach/data/logs
temp dir:            /opt/cockroach/data/cockroach-temp792387343
external I/O path:   /opt/cockroach/data/extern
store[0]:            path=/opt/cockroach/data
status:              restarted pre-existing node
clusterID:           1b3491e6-582d-4f68-a035-0c3caadac0dd
nodeID:              1
```

이제 각 공간이 내가 원하는 구조로 자리잡은 것을 볼 수 있다. 어래? 그런데
단지 `--store`만 지정했을 뿐인데 `logs`와 `temp`, `extern`이 함께 움직였다!
그렇다면 `cd`는 큰 의미는 없었겠다. 그리고 `store[0]`로 표시되는 저장공간을
보니, 이건 뭔가 복수의 설정이 가능할 것 같다. 좀 더 파봐야 할 부분이 생긴
것 같은데, 이건 일단 지나가자.


{:.comment}
> 어라? 잡담을 많이 해서 글이 너무 길어졌네?
> 그럼 잠깐 쉬었다가, 자동구성의 결과를 보는 것으로 이번 글은 정리를
> 하겠다. 그리고 다음 글에서는 스크립트 해설과 클러스터 동작 방식에
> 대해 좀 알아볼까 한다.


# 3 노드 클러스터 자동구성 - "자동구성의 이해"

자동구성이라기 보다는 한 방에 구성하기라는 편이 더 맞겠다.

## 한 방에 구성하기

최종적으로, 설치 과정은 아래와 같다.

{:.wrap}
```console
$ ./50.setup-cockroach-cluster.sh 
cockroach-v2.0.5.linux-amd64/cockroach

install cockroach on store-1 (store-1.int.seo01.mgmt, 198.0.2.166)
azmin@store-1.int.seo01.mgmt's password: 
cockroach                                     100%   54MB  12.1MB/s   00:04    
cockroach.service                             100%  510   946.2KB/s   00:00    
cockroach.ufw                                 100%  110   215.0KB/s   00:00    
node.key                                      100% 1679     3.0MB/s   00:00    
node.crt                                      100% 1196     1.4MB/s   00:00    
ca.crt                                        100% 1111     1.7MB/s   00:00    
51.setup-cockroach-node.sh                    100%  765     1.5MB/s   00:00    
azmin@store-1.int.seo01.mgmt's password: 
[sudo] password for azmin: 
Rule added
Rule added (v6)
Created symlink /etc/systemd/system/multi-user.target.wants/cockroach.service → /opt/cockroach/cockroach.service.
Created symlink /etc/systemd/system/cockroach.service → /opt/cockroach/cockroach.service.
Connection to store-1.int.seo01.mgmt closed.

install cockroach on store-2 (store-2.int.seo01.mgmt, 198.0.2.158)
<...>

install cockroach on store-3 (store-3.int.seo01.mgmt, 198.0.2.185)
<...>
$ 
```

`50.setup-cockroach-cluster.sh`라는 이름의 스트립트는 다음에 다루기로 하고,
일단 과정에 대해 간략하게 보면 다음과 같다.

1. 관리서버는 CockroachDB 최신버전을 한 번 내려받아 Local에 설치한다.
1. 이 Local 설치본을 이용하여 주 인증서, 관리자 인증서, 각 노드 별 인증서를
   만든다.
1. 추가로 `systemd` 스크립트, ufw 방화벽 설정 등을 만들고, 이것들을 인증서,
   Cockroach 바이너리 등과 함께 각 노드에 `scp`를 이용하여 전송한다.
   이 때, 후작업용 스크립트인 `51.setup-cockroach-node.sh`도 함께 전송한다.
1. 다시, `ssh`를 이용하여 미리 복사한 후처리 스크립트를 구동하여 노드 내부
   구성을 끝낸다.

참고로, 배치가 끝난 상태에서 각 노드의 구조와 상태는 다음과 같다. 앞서
살펴봤던 단일 노드의 구성을 그대로 만들어준 것이고, 단지 사용자를 위한
`client cert`가 빠져있다.

```console
$ tree /opt/
/opt/
└── cockroach
    ├── certs
    │   ├── ca.crt
    │   ├── node.crt
    │   └── node.key
    ├── cockroach
    ├── cockroach.service
    └── data -> /var/lib/cockroach

3 directories, 5 files
$ sudo ufw status
[sudo] password for azmin: 
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere                  
CockroachDB                ALLOW       Anywhere                  
OpenSSH (v6)               ALLOW       Anywhere (v6)             
CockroachDB (v6)           ALLOW       Anywhere (v6)             

$ sudo systemctl is-enabled --full cockroach
enabled
  /etc/systemd/system/cockroach.service
  /etc/systemd/system/multi-user.target.wants/cockroach.service
$ 
```

음! 이제 돌려보자.

## 실행해보기

관리서버에 만들어둔 "한 방" 스크립트로 각 노드에서 Cockroach를 시작해보자.

### Systemd 설정하기

원격으로 명령을 내리는 스크립트는 다음에 보고, `systemd` 설정은 아래와 같이
해봤다. (실은, 기존에 다른 곳에서 쓰던 것을 급하게 가져다 붙여봤다.)


{:.wrap}
```ini
[Unit]
Description=cockroach database server
After=network.target
ConditionPathExists=!/var/tmp/cockroach_not_to_be_run

[Service]
WorkingDirectory=/opt/cockroach
ExecStart=/opt/cockroach/cockroach start --certs-dir=certs --store=path=data --host=198.0.2.166 --join=198.0.2.166:26257,198.0.2.158:26257,198.0.2.185:26257
ExecReload=/bin/kill -INT 
KillMode=process
Restart=on-failure
RestartPreventExitStatus=255
Type=simple
User=azmin
Group=zees
SyslogFacility=local0

[Install]
WantedBy=multi-user.target
```

먼저, `Service` 섹션에 `WorkingDirectory`를 앞서 만든 Cockroach의 집으로
설정했다. 이제, 단일노드 수동설치 과정에서 `cd`를 먼저 하고나서 명령을
내렸던 것과 동일한 효과를 낼 수 있다. (뭐 이게 의미 있냐?)

그런데 위의 기술에는 잘못된 부분이 몇 개 있다.

`Unit` 섹션의 `ConditionPathExists`는, 특정 파일의 유무를 기준으로 하여
서비스 실행을 지속/중단할 수 있는 조건을 지정하는 것이다. 만약, 여기에
지정된 파일이 존재한다면 서비스 시작은 중단된다. (앞에 `!`가 붙어있어서
"있으면"이 아닌 "없으면"이 지속 조건이 되기 때문)

그런데, 그 경로가 `/var/tmp`이다. 이 경로는 재부팅 시 비워지는 휘발성
임시경로 `/tmp`와는 달리, 재부팅 후에도 보존되므로 재부팅 후에도 계속
남아있어야 하는 임시파일을 위한 경로로 효과적인 경로이기는 하다.
그럼 뭐가 문제인가? 바로 모든 사용자에게 쓰기권한이 있는 경로라는 점.
인상이 좋지 않은 손님이, 이곳에 저 파일을 만들게 되면, 아주 효과적으로
서비스를 알 수 없는 기동불가 상태에 빠뜨릴 수 있다. (왜 이렇게 썼냐고?
나쁜 예가 필요해서랄까...)

또 `Service` 섹션의 `ExecReload`를 `/bin/kill -INT`로 해뒀는데, 앞
부분에서 이 `SIGINT`가 "수고있으니 살며시 내려놔라"라는 뜻이라는 것을
확인했었다. 이 명령은 `ExecStop`에나 어울리는 명령이다. 같은 이유로,
`KillMode` 설정도 대상이 DBMS라는 점을 고려해서 수정되어야 한다.

참고로, 잠깐 Github의 소스를 뒤져보니, `refreshSignal`이라는 변수에
`syscall.SIGHUP`이 지정되어 있고, 그 줄 근처의 설명을 읽어보니
`SIGHUP`을 받으면 인증서를 다시 읽어들이고 로그를 Flushing한다고 한다.
자세한 얘기는
[관련 소스](https://github.com/cockroachdb/cockroach/blob/5a013c1a85157daaef3b947e3c85a164dfffa94c/pkg/util/sysutil/sysutil.go#L51)
참고. 그렇다면 `ExecReload`에는 `kill -INT` 대신 `kill -HUP`이 적당하겠다.

{:.keypoint}
포인트 #5
: `systemd` 설정을 만들 때에는 대상의 성격이나 작동방식을 고려해서
  적절한 명령을 사용해야 한다. 그렇지 않으면 뜻하지 않은 데이터 유실
  등을 만날 수 있다.

### 클러스터 시작하기

이 이야기는 일단 접고, 일단 클러스터의 노드들을 시작시켜봤다.

{:.wrap}
```console
$ ./50.cockroach-cluster.sh start
start cockroach on store-1 (store-1.int.seo01.mgmt, 198.0.2.166)
azmin@store-1.int.seo01.mgmt's password: 
[sudo] password for azmin: 
Connection to store-1.int.seo01.mgmt closed.
start cockroach on store-2 (store-2.int.seo01.mgmt, 198.0.2.158)
azmin@store-2.int.seo01.mgmt's password: 
[sudo] password for azmin: 
Connection to store-2.int.seo01.mgmt closed.
start cockroach on store-3 (store-3.int.seo01.mgmt, 198.0.2.185)
azmin@store-3.int.seo01.mgmt's password: 
[sudo] password for azmin: 
Connection to store-3.int.seo01.mgmt closed.
$ 
```

일단 명령은 잘 수행된 것 같으니, 상태를 확인해보자.

{:.wrap}
```console
$ ./50.cockroach-cluster.sh status
status cockroach on store-1 (store-1.int.seo01.mgmt, 198.0.2.166)
azmin@store-1.int.seo01.mgmt's password: 
[sudo] password for azmin: 
● cockroach.service - cockroach database server
   Loaded: loaded (/opt/cockroach/cockroach.service; enabled; vendor preset: enabled)
   Active: active (running) since Wed 2018-09-19 18:03:08 KST; 26s ago
 Main PID: 23032 (cockroach)
    Tasks: 12 (limit: 2355)
   CGroup: /system.slice/cockroach.service
           └─23032 /opt/cockroach/cockroach start --certs-dir=certs --store=path=data --host=198.0.2.166 --join=198.0.2.166:26257,198.0.2.158:26257,198.0.2.185:26257

Sep 19 18:03:08 store-1 systemd[1]: Started cockroach database server.
Connection to store-1.int.seo01.mgmt closed.
<...>
$ 
```

오호라... "Started..."라고 하니 반갑다. 그런데 30초 이상이 지난 후 다시
상태를 보면, ... 반갑다가 말았다. (그러고보니 저 로그, Cockroach가 내보낸
로그가 아니라 `systemd`가 내보낸 거다. 단지 프로세스가 잘 떴다는 뜻)

{:.wrap}
```console
$ ./50.cockroach-cluster.sh status
status cockroach on store-1 (store-1.int.seo01.mgmt, 198.0.2.166)
azmin@store-1.int.seo01.mgmt's password: 
[sudo] password for azmin: 
● cockroach.service - cockroach database server
   Loaded: loaded (/opt/cockroach/cockroach.service; enabled; vendor preset: enabled)
   Active: active (running) since Wed 2018-09-19 18:03:08 KST; 1min 25s ago
 Main PID: 23032 (cockroach)
    Tasks: 12 (limit: 2355)
   CGroup: /system.slice/cockroach.service
           └─23032 /opt/cockroach/cockroach start --certs-dir=certs --store=path=data --host=198.0.2.166 --join=198.0.2.166:26257,198.0.2.158:26257,198.0.2.185:26257

Sep 19 18:03:08 store-1 systemd[1]: Started cockroach database server.
Sep 19 18:03:38 store-1 cockroach[23032]: *
Sep 19 18:03:38 store-1 cockroach[23032]: * WARNING: The server appears to be unable to contact the other nodes in the cluster. Please try
Sep 19 18:03:38 store-1 cockroach[23032]: *
Sep 19 18:03:38 store-1 cockroach[23032]: * - starting the other nodes, if you haven't already
Sep 19 18:03:38 store-1 cockroach[23032]: * - double-checking that the '--join' and '--host' flags are set up correctly
Sep 19 18:03:38 store-1 cockroach[23032]: * - running the 'cockroach init' command if you are trying to initialize a new cluster
Sep 19 18:03:38 store-1 cockroach[23032]: *
Sep 19 18:03:38 store-1 cockroach[23032]: * If problems persist, please see https://www.cockroachlabs.com/docs/v2.0/cluster-setup-troubleshooting.html.
Sep 19 18:03:38 store-1 cockroach[23032]: *
Connection to store-1.int.seo01.mgmt closed.
<...>
```

노드를 시작할 때, `--join` 옵션을 주었으므로 자신이 통신해야 할 노드가 더
있음은 알고 있는 모양이다. 그런데 접속할 수 없다니 메시지가 좀 이상하다.
그런데, 그 아래 대처방법까지 설명하고 있는데,

* 다른 노드를 켜지 않았다면 켜세요
* 옵션 `--join`과 `--host`를 잘 줬는지 보세요
* 새로운 클러스터라면 `cockroach init`를 해주세요

모든 노드가 잘 구동되었고 `--join` 옵션을 사용하여 통신해야 할 친구들을
알려줬다고 하더라도, 이게 클러스터를 처음 만든 것이라면 명시적인 초기화가
필요하다는 것이다. (어떤 설계 원칙일지 궁금하고, 또 추가 노드를 만들었을
때 어떻게 동작하는지, 그리고 꼭 모든 노드가 `--join`에 열거되어야 하는지
등이 무지무지 궁금해진다!)


### 클러스터 초기화

어쨌든,  
초기화는 자체 규약에 의해 진행되는데, 아래와 같이...

{:.wrap}
```console
$ /opt/cockroach/cockroach init --certs-dir=/opt/cockroach/certs/ --host=store-1.int.seo01.mgmt
Cluster successfully initialized
$ 
```

이렇게 아무 서버나 하나 골라서 초기화 명령을 내려주면 된다.
초기화 명령을 실행한 후, 다시 상태를 보자.

{:.wrap}
```console
$ ./50.cockroach-cluster.sh status
status cockroach on store-1 (store-1.int.seo01.mgmt, 198.0.2.166)
azmin@store-1.int.seo01.mgmt's password: 
[sudo] password for azmin: 
● cockroach.service - cockroach database server
   Loaded: loaded (/opt/cockroach/cockroach.service; enabled; vendor preset: enabled)
   Active: active (running) since Wed 2018-09-19 18:03:08 KST; 3min 0s ago
 Main PID: 23032 (cockroach)
    Tasks: 14 (limit: 2355)
   CGroup: /system.slice/cockroach.service
           └─23032 /opt/cockroach/cockroach start --certs-dir=certs --store=path=data --host=198.0.2.166 --join=198.0.2.166:26257,198.0.2.158:26257,198.0.2.185:26257

Sep 19 18:05:45 store-1 cockroach[23032]: build:               CCL v2.0.5 @ 2018/08/13 17:59:42 (go1.10)
Sep 19 18:05:45 store-1 cockroach[23032]: admin:               https://198.0.2.166:8080
Sep 19 18:05:45 store-1 cockroach[23032]: sql:                 postgresql://root@198.0.2.166:26257?sslmode=verify-full&sslrootcert=certs%2Fca.crt
Sep 19 18:05:45 store-1 cockroach[23032]: logs:                /opt/cockroach/data/logs
Sep 19 18:05:45 store-1 cockroach[23032]: temp dir:            /opt/cockroach/data/cockroach-temp534956620
Sep 19 18:05:45 store-1 cockroach[23032]: external I/O path:   /opt/cockroach/data/extern
Sep 19 18:05:45 store-1 cockroach[23032]: store[0]:            path=/opt/cockroach/data
Sep 19 18:05:45 store-1 cockroach[23032]: status:              initialized new cluster
Sep 19 18:05:45 store-1 cockroach[23032]: clusterID:           8aa49023-709a-44f1-b1ab-e4bf1604fcc6
Sep 19 18:05:45 store-1 cockroach[23032]: nodeID:              1
Connection to store-1.int.seo01.mgmt closed.
<...>
$ 
```

조금 짤렸는데, 위와 같이 뭔가 정상적인 것으로 보이는 로그를 볼 수 있다.
(OS가 보는 프로세스 상태는 원래 정상이었고...)

이 과정의 전체 로그를 보면 아래와 같다. (syslog를 가져다가 조금 잘랐다.)

```console
09:03:08 systemd: Started cockroach database server.
09:03:38 cockroach: *
09:03:38 cockroach: * WARNING: The server appears to be unable to contact the other nodes in the cluster. Please try
09:03:38 cockroach: *
09:03:38 cockroach: * - starting the other nodes, if you haven't already
09:03:38 cockroach: * - double-checking that the '--join' and '--host' flags are set up correctly
09:03:38 cockroach: * - running the 'cockroach init' command if you are trying to initialize a new cluster
09:03:38 cockroach: *
09:03:38 cockroach: * If problems persist, please see https://www.cockroachlabs.com/docs/v2.0/cluster-setup-troubleshooting.html.
09:03:38 cockroach: *
09:05:45 cockroach: CockroachDB node starting at 2018-09-19 09:05:45.578489192 +0000 UTC (took 157.4s)
09:05:45 cockroach: build:               CCL v2.0.5 @ 2018/08/13 17:59:42 (go1.10)
09:05:45 cockroach: admin:               https://198.0.2.166:8080
09:05:45 cockroach: sql:                 postgresql://root@198.0.2.166:26257?sslmode=verify-full&sslrootcert=certs%2Fca.crt
09:05:45 cockroach: logs:                /opt/cockroach/data/logs
09:05:45 cockroach: temp dir:            /opt/cockroach/data/cockroach-temp534956620
09:05:45 cockroach: external I/O path:   /opt/cockroach/data/extern
09:05:45 cockroach: store[0]:            path=/opt/cockroach/data
09:05:45 cockroach: status:              initialized new cluster
09:05:45 cockroach: clusterID:           8aa49023-709a-44f1-b1ab-e4bf1604fcc6
09:05:45 cockroach: nodeID:              1
```

맨 윗줄은 `systemd`가 내보낸 로그인데, 자신의 입장에서 프로세스를 정상적으로
띄웠음을 표시하고 있다. 이 때 시간이 09시 03분 08초. 그리고 정확히 30초가
지난 후, Cockroach는 클러스터 구성이 정상적으로 완료되지 않았음을 표시하고
있다. 그리고 클러스터 초기화 명령이 내려진 5분 45초에는 노드가 시작되었다는
로그와 함께, 구성 정보를 출력하고 있다.


### 클러스터 내리기

이제 내려볼 차례. 같은 방식으로 모든 노드에게 거의 동시에 내리라는 명령을
보냈다.

{:.wrap}
```console
$ ./50.cockroach-cluster.sh stop
stop cockroach on store-1 (store-1.int.seo01.mgmt, 198.0.2.166)
azmin@store-1.int.seo01.mgmt's password: 
[sudo] password for azmin: 
Connection to store-1.int.seo01.mgmt closed.
stop cockroach on store-2 (store-2.int.seo01.mgmt, 198.0.2.158)
azmin@store-2.int.seo01.mgmt's password: 
[sudo] password for azmin: 
Connection to store-2.int.seo01.mgmt closed.
stop cockroach on store-3 (store-3.int.seo01.mgmt, 198.0.2.185)
azmin@store-3.int.seo01.mgmt's password: 
[sudo] password for azmin: 
Connection to store-3.int.seo01.mgmt closed.
$ 
```

특이한 부분은 앞의 두 대는 바로 응답을 해왔는데, 세 번째 노드는 응답을
하는데 좀 시간이 걸렸다. 무슨 일이 있었을까?

먼저, 빠르게 내려온 첫번째 기계의 로그를 봤더니,

{:.wrap}
```console
$ ./50.cockroach-cluster.sh status
status cockroach on store-1 (store-1.int.seo01.mgmt, 198.0.2.166)
azmin@store-1.int.seo01.mgmt's password: 
[sudo] password for azmin: 
● cockroach.service - cockroach database server
   Loaded: loaded (/opt/cockroach/cockroach.service; enabled; vendor preset: enabled)
   Active: inactive (dead) since Wed 2018-09-19 18:07:45 KST; 1min 44s ago
  Process: 23032 ExecStart=/opt/cockroach/cockroach start --certs-dir=certs --store=path=data --host=198.0.2.166 --join=198.0.2.166:26257,198.0.2.158:26257,198.0.2.185:26257 (code=exited, status=0/SUCCESS)
 Main PID: 23032 (code=exited, status=0/SUCCESS)

<...>
Sep 19 18:07:39 store-1 systemd[1]: Stopping cockroach database server...
Sep 19 18:07:39 store-1 cockroach[23032]: initiating graceful shutdown of server
Sep 19 18:07:45 store-1 cockroach[23032]: server drained and shutdown completed
Sep 19 18:07:45 store-1 systemd[1]: Stopped cockroach database server.
Connection to store-1.int.seo01.mgmt closed.
<...>
```

이렇게, `systemd`가 프로세스를 내리기 시작한 것이 39초이고, 그 순간
Cockroach 역시 깔끔하게 서버를 내리겠다는 로그를 내보냈다. 그리고 6초 후,
서버의 종료가 완료되었음이 로그로 표시되고, `systemd` 역시 정상적으로
내려왔다는 로그를 남겼다.

세 번째 기계는 어땠을까?

{:.wrap}
```console
$ ./50.cockroach-cluster.sh status
<...>
status cockroach on store-3 (store-3.int.seo01.mgmt, 198.0.2.185)
azmin@store-3.int.seo01.mgmt's password: 
[sudo] password for azmin: 
● cockroach.service - cockroach database server
   Loaded: loaded (/opt/cockroach/cockroach.service; enabled; vendor preset: enabled)
   Active: failed (Result: exit-code) since Wed 2018-09-19 18:08:56 KST; 39s ago
  Process: 13682 ExecStart=/opt/cockroach/cockroach start --certs-dir=certs --store=path=data --host=198.0.2.185 --join=198.0.2.166:26257,198.0.2.158:26257,198.0.2.185:26257 (code=exited, status=1/FAILURE)
 Main PID: 13682 (code=exited, status=1/FAILURE)

Sep 19 18:07:56 store-3 systemd[1]: Stopping cockroach database server...
Sep 19 18:07:56 store-3 cockroach[13682]: initiating graceful shutdown of server
Sep 19 18:08:56 store-3 cockroach[13682]: *
Sep 19 18:08:56 store-3 cockroach[13682]: * ERROR: time limit reached, initiating hard shutdown - node may take longer to restart & clients may need to wait for leases to expire
Sep 19 18:08:56 store-3 cockroach[13682]: *
Sep 19 18:08:56 store-3 cockroach[13682]: Failed running "start"
Sep 19 18:08:56 store-3 systemd[1]: cockroach.service: Main process exited, code=exited, status=1/FAILURE
Sep 19 18:08:56 store-3 systemd[1]: cockroach.service: Failed with result 'exit-code'.
Sep 19 18:08:56 store-3 systemd[1]: Stopped cockroach database server.
Connection to store-3.int.seo01.mgmt closed.
$ 
```

유사하게, 7분 56초에 `systemd`와 Cockroach가 동일한 로그를 내보냈지만,
그로부터 1분 후인 8분 56초에 Cockroach는 대기시간 초과로 인하여 "강하게"
서버를 내리겠다고 한다. 그리고 'Failed runnign "start"'라는 알 수 없는
로그를 남겼다. 이 때, `systemd`는 프로세스가 종료되었으나 정상 종료를
한 것은 아니라는 메시지를 남겼다.

음... Cockroach의 클러스터 구조와 가용성을 유지하는 방법에 대해 조금 더
알아봐야 이 부분에 대한 명쾌한 답을 찾을 수 있을 것 같다.



### 클러스터 다시 띄우기

어쨌든, 이미 초기화가 된 클러스터를 다시 동일한 방법으로 띄워보자.

{:.wrap}
```console
$ ./50.cockroach-cluster.sh start
<...>
$ ./50.cockroach-cluster.sh status
status cockroach on store-1 (store-1.int.seo01.mgmt, 198.0.2.166)
azmin@store-1.int.seo01.mgmt's password: 
[sudo] password for azmin: 
● cockroach.service - cockroach database server
   Loaded: loaded (/opt/cockroach/cockroach.service; enabled; vendor preset: enabled)
   Active: active (running) since Wed 2018-09-19 18:11:01 KST; 20s ago
 Main PID: 23783 (cockroach)
    Tasks: 13 (limit: 2355)
   CGroup: /system.slice/cockroach.service
           └─23783 /opt/cockroach/cockroach start --certs-dir=certs --store=path=data --host=198.0.2.166 --join=198.0.2.166:26257,198.0.2.158:26257,198.0.2.185:26257

Sep 19 18:11:08 store-1 cockroach[23783]: build:               CCL v2.0.5 @ 2018/08/13 17:59:42 (go1.10)
Sep 19 18:11:08 store-1 cockroach[23783]: admin:               https://198.0.2.166:8080
Sep 19 18:11:08 store-1 cockroach[23783]: sql:                 postgresql://root@198.0.2.166:26257?sslmode=verify-full&sslrootcert=certs%2Fca.crt
Sep 19 18:11:08 store-1 cockroach[23783]: logs:                /opt/cockroach/data/logs
Sep 19 18:11:08 store-1 cockroach[23783]: temp dir:            /opt/cockroach/data/cockroach-temp809211695
Sep 19 18:11:08 store-1 cockroach[23783]: external I/O path:   /opt/cockroach/data/extern
Sep 19 18:11:08 store-1 cockroach[23783]: store[0]:            path=/opt/cockroach/data
Sep 19 18:11:08 store-1 cockroach[23783]: status:              restarted pre-existing node
Sep 19 18:11:08 store-1 cockroach[23783]: clusterID:           8aa49023-709a-44f1-b1ab-e4bf1604fcc6
Sep 19 18:11:08 store-1 cockroach[23783]: nodeID:              1
Connection to store-1.int.seo01.mgmt closed.
<...>
$ 
```

음, 이번에는 지체없이 노드가 올라왔다. 전체 로그를 보면,

{:.wrap}
```console
11:01 systemd: Started cockroach database server.
11:08 cockroach: CockroachDB node starting at 2018-09-19 09:11:08.72272053 +0000 UTC (took 7.0s)
<...>
```

이렇게, `systemd`가 프로세스를 올린 것은 11분 1초, 그리고 노드가 시작된
것은 7초 후인 11분 8초. 아마, 그 8초 동안 다른 서버가 올라오는 것을
기다렸을 수도 있고... 무슨 일이 있었는지 궁금하지만, 어쨌든 이미 초기화가
된 클러스터는 부드럽게 잘 올라왔다.


---

뭐, 많은 부분을 생략했지만, 단일 노드에서 Cockroach가 어떻게 구성되고
실행되는지 알아봤고, 그 경험을 바탕으로 세 노드로 구성된 클러스터를
원격으로 배치하고 관리하는 과정에 대해 정리했다.

다음 글에서는, 원격 배치 및 관리에 사용된 스크립트에 대해 다시 집어보겠다.

---

### 함께 읽기

CockroachDB 맛보기 묶음글은 다음과 같습니다.

* [CockroachDB 안녕?]
* _CockroachDB 클러스터 구성하기_

[CockroachDB 안녕?]:{% link _posts/cloudcomputing/2018-09-20-say-hello-to-cockroachdb.md %}
[CockroachDB 클러스터 구성하기]:{% link _posts/cloudcomputing/2018-09-21-setup-cockroach-cluster.md %}
