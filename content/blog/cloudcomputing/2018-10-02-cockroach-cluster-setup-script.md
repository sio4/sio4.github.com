---
title: CockroachDB 클러스터 설치 스크립트
subtitle: ...라지만, 알고보면 쉘스크립트 작성 가이드
tags: ["howto", "script", "DBMS", "cloud-computing"]
categories: ["cloudcomputing"]
image: /assets/images/common/shell-on-the-beach.jpg
banner: /assets/images/common/shells-on-the-beach.jpg
date: 2018-10-02T16:30:00+0900
---
이번 글에서는 (특히 클라우드 컴퓨팅 환경에서) 여러 서버에 CockroachDB를
설치하고 그것을 묶어서 클러스터로 만드는 과정을 단순화하는 스크립트에
대해 정리하려고 한다. 내용은 CockroachDB Cluster의 구성에 초점을 맞추고
있지만, 여기서 다루는 개념과 방법은 소프트웨어의 원격 설치, 자동화된
배치를 준비함에 있어서 공통적으로 참고하거나 적용할 수 있을 것이다.


{: title="(c) Karunakar Rayker, https://www.flickr.com/photos/krayker/2117746551"}
![](/assets/images/common/shell-on-the-beach.jpg)


지난 세 편의 글을 통하여, 클라우드 컴퓨팅 환경의 장점에 힘입어 전지구적
서비스를 구축하려 할 때, 기존 SQL 데이터베이스의 친숙한 기능과 인터페이스를
유지한 채 전지구적 분산 배치 및 수평적 규모확장을 지원하는 DBMS를 제공하는
것을 목표로 하는 오픈소스 DBMS인 CockroachDB에 대하여 알아봤다. 특히, 두
번째 글인 [CockroachDB 클러스터 구성하기]에서는, 이 글에서 소개하려고 하는
스크립트를 이용하여 원격지의 관리용 서버에서 Cluster를 구성하는 세 대의
Node를 자동으로 설치하고 제어하는 과정에 대해 다뤘다. 이 글에서는, 그 때
활용했던 스크립트를 뜯어보면서, "소프트웨어 원격 설치" 또는 "클라우드
환경을 위한 자동 배치"에 대한 기본적인 개요를 짚어보려고 한다.


> CockroachDB 맛보기 묶음글은 다음과 같습니다. 

* [CockroachDB 안녕?]
* [CockroachDB 클러스터 구성하기]
* [CockroachDB Architecture]
* _CockroachDB 클러스터 설치 스크립트_
* [CockroachDB 클러스터 가용성 시험]


# 클라우드 컴퓨팅과 구성 자동화

{:toc .half.pull-right}
* TOC


클라우드 컴퓨팅 환경이 우리에게 주는 이익, 또는 특징 중 가장 두드러진 것을
몇 가지 고르라고 한다면, 나는 "자원의 일회용화[^1]"와 "구성 자동화[^2]"를
가장 먼저 고를 것 같다.
이 중, 사용 자동화는 어쩌면 자원의 일회용화에 따라오는 개념일 수 있다.
우리가 새 자원을 만드는 경우, 대부분은 그 이유가 "**사용량 증가에 대응하여
서비스 규모를 확장**"하는 경우이거나 "**새로운 버전을 배포하기 위한 대체
자원 생성**"하려는 경우일 것이다.
두 경우 모두, 표준 구성 상태의 새 자원을 서비스에 투입하기 위하여 내게
맞는 설정을 해주고 서비스 제공을 위해 필요한 소프트웨어를 구성하는 작업을
반복적으로 해줘야 한다. 또한, 그 과정에서 소요하는 시간이 바로 상황에 대한
대응시간이 된다.

[^1]: "자원의 일회용화": 기존의 IT 환경에서는 하드웨어와 소프트웨어 자원의
      활용이 구입과 소유를 바탕으로 했던 것과는 달리, 클라우드 컴퓨팅에서는
      "사용" 자체에 집중하여 필요할 때 일시 또는 임시 자원을 할당하여 사용하는
      것이 일반적이다. 마치, 내 머그컵을 들고 다니며 씻어가며 사용하는 것이
      아니라, 마시고 싶을 때 큰 컵이든 작은 컵이든 필요에 맞게 사용하는 것과
      비슷하다. (그러나 종이컵과는 달리, 환경을 위협하는 쓰레기는 발생하지
      않는다.

[^2]: 일회성 자원을 사용하다 보니, 종이컵처럼 단순한 것은 바로 사용할 수
      있지만 자동차를 빌렸다면 내 몸에 맞춰 의자와 핸들을 조정하고 필요한
      경우에는 네비게이션과 카시트를 설치하는 등의 추가 작업이 사용 전에
      필요하다. 컴퓨팅 자원을 빌리더라도 이처럼, 설정을 해주거나 필요한
      소프트웨어를 설치하는 등의 작업이 필요한데, 이를 자동화할 수 있다면
      편리할 뿐만 아니라 즉응성을 높일 수 있기 때문에 "운영 자동화"는 매우
      중요한 요소라 할 수 있다.

반복되는 작업이 있다면 당/연/히/ 자동화를 하는 것을 고려하게 된다.


## 자동화 효과

자동화는 여러가지 측면에서 매우 유용하다. 적절한 자동화 도구를 준비했고
이를 잘 활용할 수 있다면,

* 반복되는 일의 부담을 줄여주고
* 기계의 속도를 활용하여 작업 속도를 높여줄 뿐만 아니라,
* 손으로 작업할 때 발생할 수 있는 실수를 방지해준다.
* 또한, 자동화 방식을 검증(Validation)했다면, 대부분의 경우 개별 대상에
  대한 결과를 확인(Validation)하지 않고도 확신을 가질 수 있다!
  (아... 대상이 열 대만 넘어가도,... 이거 정말 중요하다)
 
기존 IT 환경에서도 자동화는 운영을 돕는 매우 중요한 요소였다. 그런데 특히
클라우드 환경에서 이에 대한 필요성이 강조되는 이유는, 기존의 환경은 한 번
구성한 서버를 손을 봐가며 또는 디스크나 메모리 등 부분적인 자원을 추가해
가며 지속해서 사용하는 경우가 대부분인 것에 반하여, 여기서는 자원 추가를
위해 새 자원, 규모 확장을 위해 새 자원, 새 버전의 배포를 위해 새 자원 등
아예 새롭게 태어나는 것이 매우 자연스러워졌다는 이유도 있다.



# 설치 과정 다시 보기

[CockroachDB 클러스터 구성하기]에서 이미 다뤘지만, 설치는 다음과 같은
단계로 진행된다.

1. 관리용 서버에서 사용자는 설치 스크립트를 구동한다.
1. 설치 스크립트는 자신이 실행된 기계에 Cockroach를 설치한다. 그리고,
   1. 설치된 Cockroach를 사용하여 Certification 파일을 만들어낸다.
   1. 방화벽 설정, `systemd` 설정 등의 기타 파일을 만들어낸다.
   1. 만들어진 파일과 패키지를 각각의 서버에 전송한다.
   1. 각 서버에게 후처리 스크립트 구동을 명령한다.
1. 각 서버에서는 후처리 스크립트가 구동된다.
   1. 필요한 경로를 구성하고 설치 준비를 한다.  
   1. 올려진 각 파일을 지정된 위치에 설치한다.


## 최초 설치

실제로 관리서버에서 스크립트를 구동했을 때 출력되는 내용은 다음과 같다.

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
install cockroach-v2.0.6.linux-amd64...
[sudo] password for azmin: 
Rule added
Rule added (v6)
Created symlink /etc/systemd/system/multi-user.target.wants/cockroach.service → /opt/cockroach/cockroach.service.
Created symlink /etc/systemd/system/cockroach.service → /opt/cockroach/cockroach.service.
Connection to store-1.int.seo01.mgmt closed.

install cockroach on store-2 (store-2.int.seo01.mgmt, 198.0.2.158)
<...>
```

맨 첫줄은 스크립트 실행이고, 그 다음 줄은 `tar` 명령으로 내려받은 패키지를
풀 때 출력되는 풀고 있는 파일 목록이다. 한 줄 띄우고, `store-1`이라는
서버에 대한 설치가 시작되며, 암호를 입력하는 부분은 `scp`를 이용하여 파일을
올릴 때 등장하는 부분이다. 그 뒤로 일곱 줄에 걸쳐 파일이 올라가는 상황이
표시되고, 다시 암호를 입력하는데, 이건 후처리 스크립트를 `ssh`를 이용해서
실행할 때 표시된 것이다. 그 뒤의 몇 줄은, 각각 `ufw` 설치 과정에서 Rule이
추가되었음을 나타내는 줄, `systemd` 설정에 의해 심볼릭 링크가 생성되는 과정
등이 출력되고 있다.


## 버전 업그레이드

어라? 그런데 10월 1일, 어제 새 버전이 나왔다. 그럼 올려야지. 그래서 동일한
스크립트를 다시 돌렸고, 아래 화면은 그 과정에서 출력된 내용이다.

{:.wrap}
```console
$ ./50.setup-cockroach-cluster.sh 
cockroach-v2.0.6.linux-amd64/cockroach

install cockroach on store-1 (store-1.int.seo01.mgmt, 198.0.2.166)
azmin@store-1.int.seo01.mgmt's password: 
cockroach                                     100%   54MB  12.0MB/s   00:04    
cockroach.service                             100%  524     1.1MB/s   00:00    
cockroach.ufw                                 100%  110   199.1KB/s   00:00    
node.key                                      100% 1679     3.3MB/s   00:00    
node.crt                                      100% 1196     2.3MB/s   00:00    
ca.crt                                        100% 1111     2.5MB/s   00:00    
51.setup-cockroach-node.sh                    100% 1302     2.7MB/s   00:00    
azmin@store-1.int.seo01.mgmt's password: 
install cockroach-v2.0.6.linux-amd64...
[sudo] password for azmin: 
- file /opt/cockroach/certs/ca.crt already exists. skip.
- file /opt/cockroach/certs/node.crt already exists. skip.
- file /opt/cockroach/certs/node.key already exists. skip.
install system files...
Skipping adding existing rule
Skipping adding existing rule (v6)
Connection to store-1.int.seo01.mgmt closed.

install cockroach on store-2 (store-2.int.seo01.mgmt, 198.0.2.158)
<...>
```

`scp`를 써서 파일 전송이 되는 모습, `ssh`를 이용해서 후처리 스크립트를
실행하는 모습 등, 거의 비슷한 내용이 출력되는 것을 확인할 수 있다. 다만,
이건 새로운 설치가 아니다 보니, 이미 존재하는 Certificaion을 건너뛴다는
출력과 이미 등록된 Rule을 건너뛴다는 출력이 보인다.

이렇게, **최초 설치에도, 버전 업그레이드에도 사용할 수 있는 스크립트**의
내용을 한 줄 한 줄 뜯어볼 차례다.

## 잠깐, 포인트 다시 보기

설치과정을 다루면서, 몇가지 설치 스크립트 및 `systemd`를 이용한 자동실행
설정 작성 시 고려해야 할 점에 대해 기록했었다. 정리해보면,

* Pipeline을 적극적으로 활용하여 불필요한 I/O 제거
* 소유권을 주의깊게 살펴서 보안 사고 예방
* 프로그램의 디렉터리 구조 및 실행위치에 대한 고려
* 시작, 중지, 재시작, 초기화 등 시그널 핸들링에 대한 고려
* 디렉터리 구조 설계 시 FHS에 대한 이해 및 고려
* 패키지 경로와 인스턴스 경로의 구분

뭐 이런 얘기들이었다. 다 설명하지는 않겠지만, 이 포인트를 고려해서
읽으면 조금 더 도움이 될 것 같다.


# CockroachDB 클러스터 설치 스크립트

앞서, 설치 스크립트 및 실행환경에 대해 고려해야 할 몇 가지를 얘기했다.
여기에 스크립트 작성 시 염두에 두어야 할 부분을 조금 더 붙이자면, 
먼저, 스크립트의 목적을 명확히 하여야 한다. 이건 단지 "설치" 이런 것이
아니라, 뭘 왜 설치하는지 등의 구체적인 부분이 포함된다. 또한, 작성할
스크립트를 어떤 환경에서 사용할 것인지, 어떤 조건에서 구동될 것인지 등도
고려해야 하며, 과연 어디서 어떤 부분을 실행하는 것이 효과적인지도
생각할 필요가 있다. 그리고...

{:.comment}
> 아... 아니다. 쓰다 보니 한도 끝도 없이 길어져서, 그냥 다 줄이고 바로
> 스크립트를 보는 것이 낫겠다. 왜케 말이 많은 것인가..!

## 설정, 그리고 옵션

스크립트의 맨 앞 부분에는 주로 설정이 놓인다. 쉘스크립트는 미리 변수를
선언해야 한다든지 하는 규칙은 없다. 다만, 스크립트 상단에 변수를 놓게
되면, 나중에 변수의 값을 바꾸고 싶을 때, 쉽게 찾아서 바꿀 수 있다.

또한, 작성 시점에 선별하기 어려울 수도 있지만, 나중에 변경이 가능할 것
같은 값들, 예를 들어 설치 위치나 소유자, 소프트웨어 버전 등의 값은 딱
한 번 쓰이더라도 변수로 만들어 놓는 것이 좋다.

{:.wrap}
```shell
#!/bin/bash
#
# setup script for cockroach cluster
# https://www.cockroachlabs.com/docs/stable/install-cockroachdb.html

set -e

# -- configurations
version="2.0.6"
os="linux"
arch="amd64"

arch_name="cockroach-v$version.$os-$arch"
archive="https://binaries.cockroachdb.com/$arch_name.tgz"

# -- get node list from /etc/hosts
nodes=`grep store- /etc/hosts`

# -- installation structure
data="/var/lib/cockroach"
root="/opt/cockroach"
bin="$root/cockroach"

```

맨 앞엔 "쉬방" 지나가고, 이게 무슨 스크립트인지 간단한 설명을 넣었다.
보통, 내 경우, "무슨"과 함께 "어떻게"도 함께 넣기도 하는데, "어떻게"
는 실행 방법 및 "다시 돌려도 안전한지"를 써놓기도 한다.

본문에는 `version`, `os`, `arch`를 비롯해서 `arch_name`, `nodes` 등
스크립트가 참조할 변수들을 설정하고 있고, 마지막으로 `data`, `root` 등
설치 경로를 설정하는 부분이 눈에 띈다.

그 사이에는 `set -e`라는 줄이 하나 뚝 떨어져 있는데, `set`은 (Ba)sh의
내장 명령으로 변수를 설정하거나 쉘의 옵션을 지정하는데 쓰인다. "왜?
옵션은 명령을 내릴 때 지정하는 거 아냐?" 그렇긴 하다. 그런데 매번
동일한 옵션을 줘야 하는 상황이라면 그걸 반복할 이유가 없거니와, 실행을
하는 사람이 그걸 알아야만 한다. 비효율적이다. 이렇게 스크립트 내에서
옵션을 지정할 수 있다는 것이 얼마나 편한 일인지...  
아무튼, 이 `-e` 옵션은, 앞으로 등장할 명령 중 Exit code가 0이 아닌 경우,
즉 실행이 실패한 경우에 스크립트의 실행을 멈추가 한다. "왜??" 선행
동작을 마무리하지 못한 채 스크립트가 끝까지 가버리면 그 명령이 정상적으로
실행되었을 것을 가정한 다른 명령이 이상동작을 할 수도 있고, 또는 사용자가
실행이 정상적으로 된 것으로 착각할 수도 있다.


다음의 경우를 보자.

{:.wrap}
```shell
#!/bin/bash

mkdir /tmp/my_directory
tar cvf /tmp/my_directory/backup.tar $HOME/important_things
rm -rf $HOME/important_things
```

(현실적인 예가 떠오르지 않아) 예는 좀 극단적이지만 문제 자체는 꽤나 흔한
경우이다. `/tmp`는 시스템을 사용하는 모든 사용자에게 쓰기 권한이 있는
곳인데, 만약 위의 스크립트를 실행했을 때, 이미 다른 사용자가 만든 "그의"
`my_directory`가 존재한다면 어떻게 될까? 맨 첫줄의 `mkdir`은 실패하지만
그 다음 두 줄은 실행을 멈추지 않는다. 따라서 뒤를 잇는 `tar`도 실패를
할 것이고, 다만 맨 마지막 `rm -rf` 명령만 정상적으로 수행될 것이다.
결과적으로, `important_things`를 잃어버리게 된다.

이런 문제를 피하는 일반적인 방법은 두 가지가 있는데, 그 중 하나는 조건
제어를 사용하는 것이다.

{:.wrap}
```shell
#!/bin/bash

mkdir /tmp/my_directory && \
tar cvf /tmp/my_directory/backup.tar $HOME/important_things && \
rm -rf $HOME/important_things
```

위와 같이, 각 명령을 `&&`로 엮어주면, 앞선 명령의 결과가 `true`인 경우,
즉 정상적으로 종료되었을 때에만 다음 명령이 실행되므로 안심할 수 있다.
흔한 예가,

```console
$ cd my_source
$ make && make install && make clean
<...>
```

과 같이, 명령행에서 몇 개의 연관된 명령을 연속으로 실행하는 것이다.
그러나 스크립트에서는, 그 길이가 길어지면 전체를 `&&`로 엮는 것은 너무
귀찮은 일일 뿐더러, 스크립트의 가독성도 현저히 떨어진다. 그래서 아래와
같이,

{:.wrap}
```shell
#!/bin/bash

set -e

mkdir /tmp/my_directory
tar cvf /tmp/my_directory/backup.tar $HOME/important_things
rm -rf $HOME/important_things
```

라고 명령을 해주면 깔끔하게, 단지 한 줄을 추가함으로써 오류를 만났을 때
나머지 부분의 실행을 멈추게 할 수 있다.



## 로컬 설치, 경로와 권한 설정

다시 스크립트로 돌아가보자. 이제 공식 보관소로부터 릴리즈된 패키지를
받아서 자신이 실행되는 기계에 CockroachDB를 설치하는 과정이 나온다.

{:.wrap}
```shell
# -- get cockroach package and install locally
sudo rm -rf /opt/$arch_name
wget -q -O - "$archive" | sudo tar -C /opt -zxv
sudo chown -R root.root /opt/$arch_name

sudo mkdir -p $root/certs
sudo mkdir -p $data
sudo chown -R $USER $root
sudo chown -R $USER $data
chmod 750 $root
chmod 750 $root/certs
chmod 750 $data

[ -e "$root/data" ] || ln -s $data $root/data
[ -h "$root/cockroach" ] && rm -f $root/cockroach
[ -e "$root/cockroach" ] && mv $root/cockroach $root/cockroach.old
ln -s /opt/$arch_name/cockroach $root/cockroach
```

첫번째 단락은 이미 지난번에 설명한 부분인데, `root` 권한으로 `tar`를
사용하게 되면 아카이브 내에 담긴 사용자 정보와 권한 정보가 그대로
유지되기 때문에, `chown` 명령을 이용해서 소유권을 바로잡는 부분이
들어있다. 이는, 어떤 불분명한 사용자의 UID와 `tar`로 불어낸 파일의
소유자가 우연히 맞아 떨어졌을 때, 그 불분명한 사용자가 그것을 악용할
가능성을 제거하는 것으로, 보안 관점에서 매우 중요한 부분이다.
자세한 설명은 "[CockroachDB 클러스터 구성하기]"의 "[Cockroach 내려받기]"를
참고하기 바란다.

[Cockroach 내려받기]:/blog/setup-cockroach-cluster/#cockroach-내려받기

중간 토막에는 필요로 하는 경로를 생성하는 부분이 있는데, `mkdir` 명령이
실행되는 부분을 보면 `-p` 옵션이 붙어있다. 이 옵션은 인수로 전달받은
경로를 부모(parent) 경로부터 차례 차례 만들어 가라는 뜻의 옵션인데,
한 가지 더 알아야 하는 부분은, 이 옵션을 사용하면 권한이 없어서 실패를
할 망정, 이미 디렉터리가 존재한다는 이유로 실패하지는 않는다는 점이다.
심지어, 일반 사용자가 `mkdir -p /etc` 해도 실패하지 않는다. 그래서,
"혹시나 있으면 말고..."인 경우에도 유용하게 사용할 수 있는데, 최초 설치가
아닌 업그레이드일 경우에도 "*없으면 만들고, 있으면 그냥 두고*" 이렇게.
편하게 사용할 수 있는 것이다.

마지막 단락은, 실행환경을 위한 인스턴스 디렉터리를 꾸미는 부분으로,
여기서는 조건 제어문을 활용하여 없는 없는 경우에만 링크를 건다든지,
링크인 경우엔 그냥 지우고 일반 파일인 경우엔 백업을 한다든지 하는
작업을 해주고 있다. 역시, 업그레이드를 편하게 하기 위한 부분이다.



## 구성에 필요한 파일 만들기

이제, 로컬 설치가 끝났다. 다음은 클러스터 구성에 필요한 이런 저런
파일들을 만들어줄 차례다.

{:.wrap}
```shell
# -- create certifications
mkdir -p keys
chmod 700 keys

if [ ! -e "keys/ca.key" ]; then
	$bin cert create-ca --certs-dir=$root/certs --ca-key=keys/ca.key
fi
if [ ! -e "$root/certs/ca.crt" ]; then
	$bin cert create-client root --certs-dir=$root/certs --ca-key=keys/ca.key
fi
```

위의 부분은, Cockroach가 Node 상호간 또는 Client와 통신을 할 때, SSL을
활용한 보안 연결을 사용할 수 있도록 Certification 파일을 생성하는 부분이다.
여기서는 클러스터가 공통으로 사용할 Signing을 위한 키와 상위 인증서,
그리고 사용자용 인증서를 만드록 있다. 이 부분 역시, 이미 해당 파일이 있는
경우에는 실행하지 않도록 하여 이미 구성된 설정이 있다면 그것을 유지할 수
있도록 하고 있다. (업그레이드나 스크립트를 반복하여 실행했을 때에 대한
대비)

인증서를 만들기 직전에 `mkdir -p ...` 부분이 있는데 `-p`에 대해 얘기했나?
했구나. 그럼 `mkdir`과 `chmod`를 합치는 방법에 대해서는 했나? 안 했구나.
위에서는, 디렉터리를 만들고 그것의 권한을 `700`로 바꿔주고 있는데, 실은,
`mkdir -p -m 700 keys` 같은 방식을 사용하면 위의 두 줄을 한 줄로 줄일 수
있다. 또한 `install -m 700 -d keys` 도 동일한 효과가 있다.

이제, 각 Node에 배포하기 위한 인증서를 담을 임시 디렉터리를 만들어주고,

```shell
# -- preparing files
mkdir -p certs
cp -a $root/certs/ca.crt certs
```

마지막으로 아래와 같이, 모든 Node에서 공통으로 사용할 `ufw`, 우분투 방화벽
설정을 만들어준다. (그나저나 우분투... 참 유니크하게 이름 잘 만들었다.)

{:.wrap}
```shell
cat > cockroach.ufw <<EOF
[CockroachDB]
title=CockroachDB
description=CockroachDB communication and administration
ports=26257,8080/tcp
EOF
```

위의 내용은 `ufw`에서 Application 별 방화벽 구성을 미리 설정하는 일종의
Profile 같은 것인데, 이것을 이용하여 우분투는 `iptables` 방화벽을 조금.
아주 쪼끔 더 쉽게 사용할 수 있게 해준다. (그런데 이걸 쓰면서 `iptables`를
있는 그대로 보면 완전 머리 아파짐)


## 각 Node에 Cockroach 설치하기

이제 각 Node에 설치를 할 때다.

### Join list 만들기

Cockroach Cluster는 이를 구성하는 각 Node에게 특별한 위상이 없는 대칭형
구조를 갖는다는 얘기는 전에 했다. 이렇게 중앙이 없는 경우, 서로간에 존재를
알고 통신을 하기 위한 채널이 필요한데, 어떤 경우에는 Multicast를 사용하는
경우도 있고, Local Network 내에서 자동탐지를 사용하는 경우도 있다. 그런데
Cockroach는 어떤 목표를 갖는다? 아! 글로벌! 전지구적 분산환경을 지원하는
DBMS가 Cockroach다. 전지구적으로 흩어진 기계들이 인터넷으로 통신하기
위해서는 자동탐지 또는 이와 유사하게 특정 네트워크에 한정된 통신을 사용하는
방식은 사용할 수 없다. 그래서... Cockroach는 서버 프로세스를 실행할 때,
친구들의 주소를 함께 전달해주는 방식을 쓴다. (좀... 보는 시각에 따라
까다로울 수 있는 부분이며, 이 부분은 조금 더 확인할 부분이 남아있는
부분이기도 하다.)

아무튼, 한 방에 설치하는 Cluster Node 들에게 상호 정보를 전달해주기 위해,
아래와 같은 스크립트를 사용해서 Cockroach가 이해할 수 있는 형식의 목록을
만들어준다.

{:.wrap}
```shell
# -- generate join list
clist=""

OIFS=$IFS
IFS=$'\n'
for node in $nodes; do
	addr=`echo $node |sed 's/\s/ /g' |cut -d' ' -f1`
	if [ "$clist" = "" ]; then
		clist="$addr:26257"
	else
		clist="$clist,$addr:26257"
	fi
done
```

이제, `clist`라는 변수에는 모든 Node를 `,`로 엮은 목록이 담겼다.


### 노드 전용 파일 만들기

앞서 만들었던 `ufw` 설정 파일이나 공용 인증서는 모든 Node가 공유하기
때문에 각각의 설치에 들어가기 전에 미리 만들어 놓았다. 그런데, 일부
파일은 각 Node에 따라 달리 만들어야 하는데...

먼저, 아래와 같은 방식으로, 개별 Node의 인증서를 만든다.

{:.wrap}
```shell
# -- install cockroach to nodes...
for node in $nodes; do
	addr=`echo $node |sed 's/\s/ /g' |cut -d' ' -f1`
	hostname=`echo $node |sed 's/\s/ /g' |cut -d' ' -f2`
	alias=`echo $node |sed 's/\s/ /g' |cut -d' ' -f3`
	echo
	echo "install cockroach on $alias ($hostname, $addr)"

	$bin cert create-node \
		localhost $hostname $alias $addr $LB_NAME $LB_ADDR \
		--certs-dir=certs --ca-key=keys/ca.key \
		--overwrite
```

`for` 블록의 첫 토막은 각 Node의 `addr`, `hostname`, `alias` 등을 찾는
부분인데, 이 정보는 그 다음 토막에서 인증서를 만들 때 사용된다.

다음은, 각 Node의 `systemd` 설정파일이다. 일반적으로는 이 설정 역시
공용의 것을 만들어 사용할 수 있다. 그러나 여기서는, `--host` 옵션을
이용하여 특정 주소(내부 닫힌 망)에 대해서만 listen하도록 구성하기
위해서 이렇게, Node 별로 각각의 설정을 만들어줬다. 만약, 이 값을 다른
방식으로 지정할 수 있는 깔끔한 방법이 있다면 대체 가능할 것 같다.

{:.wrap}
```shell
	cat > cockroach.service <<EOF
[Unit]
Description=cockroach database server
After=network.target
ConditionPathExists=!$root/cockroach_not_to_be_run

[Service]
WorkingDirectory=$root
ExecStart=$root/cockroach start --certs-dir=certs --store=path=data --host=$addr --join=$clist
ExecReload=/bin/kill -HUP \$MAINPID
KillMode=process
Restart=on-failure
RestartPreventExitStatus=255
Type=simple
User=azmin
Group=zees
SyslogFacility=local0

[Install]
WantedBy=multi-user.target
EOF
```


### 전송하고, 후처리 스크립트 실행하기

필요한 파일을 모두 만들었다면 이제 서버에 올릴 차례다. Cluster Node가
될 각각의 서버에 아래와 같이 `scp`를 사용하여 파일을 올려주고,
마지막으로 `ssh` 명령을 이용하여 스크립트를 실행한다.

{:.wrap}
```shell
	# -- install...
	scp -p -r \
		/opt/$arch_name \
		cockroach.service \
		cockroach.ufw \
		certs \
		51.setup-cockroach-node.sh \
		$hostname:~/
	ssh -t $hostname "bash 51.setup-cockroach-node.sh"
done
```

후처리 스크립트의 내용은 다시 보겠지만, 이 스크립트 내에는 `sudo` 같은,
사용자와의 상호작용(interaction)을 필요로 하는 부분이 들어있다. (물론,
`sudo`의 설정을 바꾸거나 자동응답하도록 구성할 수도 있는데, 이번에는
그런 방식을 사용하지 않았다. 아니, 내가 그걸 좀 좋아하지 않는다.)

그래서, `ssh` 명령을 내릴 때 `-t` 옵션을 주고 있는데, 이 옵션은
가상 터미널(psuedo-terminal, psuedo-tty, pty)을 강제로 붙이도록 해주는
옵션이다. 무슨 말인고 하면, 기본적으로 `ssh`를 통해 원격 로그인을 하게
되면, 사용자가 시스템과 대화할 수 있도록 가상 터미널이 생성되고 다시
그 아래 Shell이 붙게 된다. 그런데 `ssh` 명령행에 원격으로 실행할 명령을
주게 되면 이 PTY 생성 과정이 생략되게 되는데, 이렇게 되면 스크립트 실행
중 대화가 필요한 경우에 "PTY가 없어서 못하겠네~~" 하는 오류가 나게 된다.
그런데 이렇게 `-t` 옵션을 주면, PTY 생성을 강제하고 이를 통해서 명령이
실행되도록 하여, 상호 대화가 필요한 명령도 정상적으로 실행되도록 해주는
것이다.



## 청소하고 끝내기

이제 다 됐다. 아래와 같이, 임시를 만들었던 파일을 지워버리고 실행 끝!

{:.wrap}
```shell
# -- clean up
rm -rf certs cockroach.service cockroach.ufw
```

{:.comment}
> 뭐, 거창하게 시작했는데 별거 없네? 응?


# CockroachDB 클러스터, 후처리 스크립트

원격지에서 모든 작업을 제어하면 좋으련만... 이 아니라, 일은 원래 쉽게
해결할 수 있는 곳에서 하는 것이 최선이 아닐까? 파일을 올리고, 명령 하나를
원격에서 날리는 것은 간단하지만 원격지에서 여러 명령을 연속으로 날리려면...
좀 복잡하다.

그래서, 내가 주로 사용하는 방법은, Local 수행을 기준으로 스크립트를 작성한
후, 앞서 본 방법과 같이 해당 스크립트와 기타 필요로 하는 파일을 올려주고,
각각의 Node에서 직접 수행을 하도록 하는 방식이다.


## Node 설치, 경로와 권한 설정

앞서 본 스크립트 내용 중, 공식 보관소에서 패키지를 받아 로컬에 설치하는
과정이 있었다. 여기서는 공식 보관소에서 받지 않고 올려진 파일을 이용할
뿐, 완전히 동일한 과정을 거쳐 구조를 잡게 된다.

{:.wrap}
```shell
#!/bin/bash
#
# sub script for cockroach node

set -e

# -- configuration for cockroach node
host=`hostname -f`
addr=`hostname -i`
arch_name=`ls -d cockroach-v*`

[ "$arch_name" = "" ] && {
	echo "arch_name detection failed!" >&2
	exit 1
}

# -- installation structure
data="/var/lib/cockroach"
root="/opt/cockroach"
bin="$root/cockroach"
```

이 부분은 "[설정, 그리고 옵션](#설정-그리고-옵션)" 절에서 봤던 내용과 거의
동일한 부분인데, 단지 값을 받아오는 방식과 `host`, `addr` 같은 일부 추가된
변수가 있을 뿐이다.

그리고 가운데 토막처럼, 뭔가 값이 불충분할 때 오류를 뱉도록 하는 부분이
있는데, 중요한 변수를 정의했는데 이 조건을 만족하지 못하는 경우가 발생할
가능성이 있다면, 이렇게 검증하는 부분을 넣어주는 것이 좋다.

그 다음은, "[로컬 설치, 경로와 권한 설정](#로컬-설치-경로와-권한-설정)"과
동일한 부분으로, 단지 올려진 파일을 이용하여 설치를 처리하고 있다는 점이
다른 부분이다.

{:.wrap}
```shell
# -- install cockroach package and setup structure
echo "install $arch_name..."
sudo rm -rf /opt/$arch_name
sudo mv $arch_name /opt/
sudo chown -R root.root /opt/$arch_name

sudo mkdir -p $root/certs
sudo mkdir -p $data
sudo chown -R $USER $root
sudo chown -R $USER $data
chmod 750 $root
chmod 750 $root/certs
chmod 750 $data

[ -e "$root/data" ] || ln -s $data $root/data
[ -h "$root/cockroach" ] && rm -f $root/cockroach
[ -e "$root/cockroach" ] && mv $root/cockroach $root/cockroach.old
ln -s /opt/$arch_name/cockroach $root/cockroach
```

그리고, 아래와 같이 함께 올려진 인증서를 지정된 위치로 이동시킨다.
이 과정에서, 업그레이드의 경우를 대비하여 파일이 이미 존재한다면 그것을
보존하는 방식을 택했다. (이런 결정은, 각 소프트웨어나 구성 원칙에 따라
다양한 접근이 가능하다.)

{:.wrap}
```shell
for f in certs/*; do
	if [ -e "$root/$f" ]; then
		echo "- file $root/$f already exists. skip." >&2
	else
		mv $f $root/certs/
	fi
done
chmod 600 $root/certs/*
rm -rf certs
```

여기서 한 가지 의문이 드는 부분이 있을 수 있다. "아니, 그럼 아예 인증서를
여기서 만들지 왜 미리 만들어서 와?" 답이 간단한데, 인증서 Signing에 사용할
키를 Node가 될 서버에 올리기 싫어서... (보안, 보안, 보안, 아는 길도 보안)


## 방화벽 구성과 systemd 설정

이제 패키지 자체의 설치는 다 끝났다. 마지막으로, 시스템 환경을 조금
손봐야 하는데, 먼저 방화벽을 설정하였다.

{:.wrap}
```shell
echo "install system files..."
sudo mv -f cockroach.ufw /etc/ufw/applications.d/cockroach
sudo chown root.root /etc/ufw/applications.d/cockroach
sudo ufw allow from any to any app CockroachDB
```

위의 명령을 통해, Cockroach를 위한 `ufw` 설정파일을 `ufw`의 표준 경로에
넣어주고, (아... 내가 좋아라하는 `.d` 구조가 등장하는데 글이 길어지니
이번에는 생략) 소유권을 확실히 한 후 `ufw` 명령을 수행하여 방화벽을
오픈을 활성화했다. 여기서 `any-to-any`로 연 것은 쉽게 가려는 거고...
(보안 보안 떠들더니!) 여기서 쉽게 갈 수 있는 이유는 이미 Binding에
제한을 걸었기 때문이다. (아까 봤던 `--host` 옵션)

그리고 최종적으로,

{:.wrap}
```shell
mv -f cockroach.service $root/
sudo systemctl enable $root/cockroach.service
```

이렇게. `systemd` 설정을 활성화해주면 모든 작업이 끝났다.



---

간단히 쓸까... 관련된 주제를 끄집어다 붙여 세세하게 쓸까... 고민하다가,
그냥 이 정도 수준에서 정리한다. (대충 써도 기네... 길어...)


### 함께 읽기

CockroachDB 맛보기 묶음글은 다음과 같습니다.

* [CockroachDB 안녕?]
* [CockroachDB 클러스터 구성하기]
* [CockroachDB Architecture]
* _CockroachDB 클러스터 설치 스크립트_
* [CockroachDB 클러스터 가용성 시험]

[CockroachDB 안녕?]:{{< relref "/blog/cloudcomputing/2018-09-20-say-hello-to-cockroachdb.md" >}}
[CockroachDB 클러스터 구성하기]:{{< relref "/blog/cloudcomputing/2018-09-21-setup-cockroach-cluster.md" >}}
[CockroachDB Architecture]:{{< relref "/blog/cloudcomputing/2018-10-01-architecture-of-cockroachdb.md" >}}

