---
title: Apache Tomcat 조금 잘 설치하기
subtitle: CATALINA_HOME 과 CATALINA_BASE
tags: [Apache Tomcat, web-application-server, makefile, out-of-memory, error-handling, proper-way, CATALINA_HOME, CATALINA_BASE]
categories: ["system-administration"]
date: 2015-02-25T20:51:00+09:00
---

![](/logos/tomcat.png)
{.float-end .ms-4 .p-3 .bg-light}

물론, 대충 Apache Site에서 내려받은 것을 풀고 거기에 내 war 파일만 추가해도
잘 돌아가는 훌륭한 Tomcat이다. 하지만, 되는 거 말고 맞는 거!

프로그램에 알고리즘과 데이터구조가 따로 존재하듯이, 연습 경기가 아닌 실 운영
환경에서는 제공자에 의해 배포(또는 판매)되는 프로그램과 그것을 사용하는
사용자 영역의 것을 구조적으로 분리하는 것이 꼭 필요하다. (그렇다면 연습
경기도 실전과 같이 그렇게...)

아무튼, 내가 갑자기 왜 이걸 쓰고 있는지는 모르겠는데, 가장 대표적인 오픈소스
Java Servlet Container인 Apache Tomcat은 아래와 비슷한 방식으로 설치하는 것이
좋다.

> 이 글은 블로그를 새롭게 정비하는 과정에서, 오래전에 공개적으로 운영했던
> 개인 Wiki에 작성했던 글을 이전해온 것입니다.
> 
> 이미 성숙할대로 성숙했다고 할 수 있는 Tomcat 이야기인데다가, 내 전문
> 분야도 아니고, 또 요즘도 많이 쓰나? 하는 생각에 그냥 버릴까 했는데,
> 혹시나 해서 찾아보니 아직도 `CATALINA_BASE == CATALINA_HOME` 이라고
> 이야기하는 글도 보이고 해서 그냥 살리기로 했어요. :-)
{.boxed}

## `CATALINA_HOME` vs. `CATALINA_BASE`

### 배포본의 집, `CATALINA_HOME`

기왕 Java Servlet Container이니, Java 스럽게 표현하자면, `CATALINA_HOME`은
Tomcat의 Class라고 보면 될 것 같다. Apache Tomcat 특정 버전의 본체이며,
구현체이다. 이곳에는 https://tomcat.apache.org/ 에서 내려받은 Tomcat 배포본의
파일을 있는 그대로 풀어놓으면 된다. 즉, 이건 Tomcat 소프트웨어의 집이다.

FHS 에 따라, 이런 류의 것들은 `/opt/` 아래에 둔다. `/opt/apache/tomcat` 또는
`/opt/apache-tomcat` 등, 어느 것이 더 마음에 드는지는 사용자의 선택. 나는
일반적으로 앞의 것을 더 선호하지만 상황에 따라 뒤의 것을 사용할 때도 있다.

### 런타임 전진기지, `CATALINA_BASE`

`CATALINA_HOME`이 Class 라면 `CATALINA_BASE`는 Instance이다. 하나의 Class가
"구현"되면 이것이 프로그램 상에서 필요에 따라/필요한 만큼 여러 Instance로
만들어져 "사용"되듯이, 한 벌 설치된 `CATALINA_HOME`은 여러 용도/서비스를 위한
독립적인 `CATALINA_BASE` 들 간에 공유되어 사용할 수 있다. 즉, 이건 Tomcat을
이용하여 배치될 각각의 서비스가 사용할 전진기지이다.

이 둘을 분리하는 것이 단지 공유 환경을 위한 것은 아니다. 그보다 중요한 것은,
"제공 받은" HOME과 "내 관리 하의" BASE를 분리함으로써, 제공받은 파일(Tomcat의
구성요소들)과 내 WAR 및 실행 중 발생한 Log 등을 원천적으로 분리할 수 있고,
이런 구조 덕에 백업, 업그레이드/패치, 배포 등의 대응도 보다 편해진다.

아무튼!

## `CATALINA_BASE`의 구성

아래 Makefile은 내가 `CATALINA_BASE` 구성을 편하게 하기 위해 사용하는 것이다.

이 내용은 이미 `CATALINA_HOME`에 원하는 버전의 Apache Tomcat이 바닐라로
설치되어있다는 가정 하에 서비스 배포를 위한 `CATALINA_BASE`를 입맛에 맞게
구성하는 내용이며, BASE를 구성함과 동시에 내가 즐겨 사용하는 이런 저런
구성들을 함께 설정하고 있다. (각 부분에 대한 설명은 아래에...)

`tomcat.mk`
{.block-title}

```makefile
CATALINA_HOME=/opt/apache-tomcat
CATALINA_BASE=$(shell pwd)
JAVA_HOME=/opt/ibm-java

PID_FILE=temp/tomcat.pid


define setenv
### environment for catalina

umask 002

custom_flags=""

JAVA_HOME=$(JAVA_HOME)
CATALINA_HOME=$(CATALINA_HOME)
CATALINA_BASE=$(CATALINA_BASE)
CATALINA_OUT="$$CATALINA_BASE/logs/catalina.out"
CATALINA_PID="$$CATALINA_BASE/$(PID_FILE)"

cat_opts="$$cat_opts -Xms64m -Xmx64m -XX:MaxPermSize=64m"
cat_opts="$$cat_opts -XX:+HeapDumpOnOutOfMemoryError -verbose:gc"
cat_opts="$$cat_opts -XX:OnOutOfMemoryError=\"$$CATALINA_BASE/bin/on-oom.sh\""
cat_opts="$$cata_opts -XX:OnError=\"$$CATALINA_BASE/bin/on-error.sh\""
CATALINA_OPTS="$$cat_opts $$custom_flags"

echo "### local environment..."
echo "Using CATALINA_HOME: $$CATALINA_HOME"
echo "Using CATALINA_BASE: $$CATALINA_BASE"
echo "Using CATALINA_OPTS: $$CATALINA_OPTS"
echo "Using     JAVA_HOME: $$JAVA_HOME"
echo "Using     JAVA_OPTS: $$JAVA_OPTS"
echo ""
endef
export setenv


define init
#!/bin/bash

cat_home=$(CATALINA_HOME)
cat_base=$(CATALINA_BASE)

cmd=$$1
if [ "$$cmd" = "startup" ]; then
	su - wwexec -c "CATALINA_BASE=$$cat_base $$cat_home/bin/$$cmd.sh"
elif [ "$$cmd" = "shutdown" ]; then
	su - wwexec -c "CATALINA_BASE=$$cat_base $$cat_home/bin/$$cmd.sh"
else
	echo "usage: $$0 startup|shutdown"
fi

endef
export init


define on_oom
#!/bin/bash

export PATH="$(JAVA_HOME)/bin:/bin:/sbin:/usr/bin:/usr/sbin"

cat_base=$(CATALINA_BASE)
date_now=`date "+%Y-%m-%d %H:%M:%S"`
log=$$cat_base/logs/fatal-error.log

pid=`cat $$cat_base/$(PID_FILE)`
jstack_log=`jstack -F $$pid 2>&1`
ps_log=`ps -p $$pid -o pid,pcpu,pmem,start,cputime,stat,wchan:14,args`

echo "$$jstack_log" >> $$log
echo "$$jstack_log"
echo "$$ps_log" >> $$log
echo "$$ps_log"

endef
export on_oom


define gitignore
/logs/
/temp/
/work/
endef
export gitignore


default:
	## CATALINA_HOME: $(CATALINA_HOME)
	## CATALINA_BASE: $(CATALINA_BASE)
	##     JAVA_HOME: $(JAVA_HOME)

install:
	mkdir -p bin
	mkdir -p lib
	mkdir -p logs
	mkdir -p temp
	mkdir -p webapps
	mkdir -p work
	cp -a $(CATALINA_HOME)/conf/ conf/
	mkdir -p conf/Catalina/localhost/
	cp -a $(CATALINA_HOME)/webapps/manager/META-INF/context.xml \
		$(CATALINA_BASE)/conf/Catalina/localhost/manager.xml
	sed -i 's,^<Context,<Context docBase="$${catalina.home}/webapps/manager"\n\t\t,' $(CATALINA_BASE)/conf/Catalina/localhost/manager.xml
	echo "$$setenv" > bin/setenv.sh
	echo "$$init" > bin/init.sh
	echo "$$on_oom" > bin/on-oom.sh
	echo "$$on_oom" > bin/on-error.sh
	chmod 750 bin/init.sh
	chmod 755 bin/on-oom.sh
	chmod 755 bin/on-error.sh
	chown superhero.service logs
	chown superhero.service temp
	chown superhero.service work
	chown superhero.service webapps
	chmod 2775 logs
	chmod 2775 temp
	chmod 2775 work
	chmod 2775 webapps
	echo "$$gitignore" > .gitignore
	git init
	git add .
	git commit -m "instance initialized."

distclean:
	rm -rf bin lib logs temp webapps work conf .git .gitignore


start:
	##### starting tomcat server...
	sudo bin/init.sh startup

stop:
	##### shutdown tomcat server...
	sudo bin/init.sh shutdown

restart: stop start
```


### 각 부분의 설명

그냥 넘어가기 서운하니까 몇가지 추가 설명.

#### 설치 과정에서 사용할 변수

```makefile
CATALINA_HOME=/opt/apache-tomcat
CATALINA_BASE=$(shell pwd)
JAVA_HOME=/opt/ibm-java

PID_FILE=temp/tomcat.pid
```

이건 뭐 구태여 설명할 필요는 없을 것 같은데, 위의 내용은 make가 돌아갈 때
참조하기 위한 변수 선언이다.

한가지 첨언하자면, Tomcat을 내려받아 tar.gz을 풀면 `apache-tomcat-X.Y.Z`와
같은 형식으로 버전이 포함된 디렉터리에 그 내용이 풀린다. 그런데 이렇게
디렉터리 이름에 버전을 포함하고 있는 경우, 버전업 관리하기가 귀찮아지고 환경
구성이 성가시게 될 수가 있다. 그래서 `/opt` 밑 또는 `/opt/apache/` 밑에는
버전을 포함한 원본 그대로의 배포본을 풀어놓고 특정 버전에 의존적인 상황에서만
사용하고, 설치된 여러 버전 중에서 주로 사용할 "현재버전"을
`/opt/apache-tomcat`으로 심볼릭 링크를 걸어둔 상태에서 일반적인 모든 설정은
이 심볼릭 링크를 대상으로 해준다. (이 과정은 `root`로 진행하여 WAS 관리자나
다른 일반 사용자가 수정할 수 없는 형태로 둔다.)

#### 실행 환경변수

```makefile
define setenv
### environment for catalina

umask 002

custom_flags=""

JAVA_HOME=$(JAVA_HOME)
CATALINA_HOME=$(CATALINA_HOME)
CATALINA_BASE=$(CATALINA_BASE)
CATALINA_OUT="$$CATALINA_BASE/logs/catalina.out"
CATALINA_PID="$$CATALINA_BASE/$(PID_FILE)"

cat_opts="$$cat_opts -Xms64m -Xmx64m -XX:MaxPermSize=64m"
cat_opts="$$cat_opts -XX:+HeapDumpOnOutOfMemoryError -verbose:gc"
cat_opts="$$cat_opts -XX:OnOutOfMemoryError=\"$$CATALINA_BASE/bin/on-oom.sh\""
cat_opts="$$cata_opts -XX:OnError=\"$$CATALINA_BASE/bin/on-error.sh\""
CATALINA_OPTS="$$cat_opts $$custom_flags"

echo "### local environment..."
echo "Using CATALINA_HOME: $$CATALINA_HOME"
echo "Using CATALINA_BASE: $$CATALINA_BASE"
echo "Using CATALINA_OPTS: $$CATALINA_OPTS"
echo "Using     JAVA_HOME: $$JAVA_HOME"
echo "Using     JAVA_OPTS: $$JAVA_OPTS"
echo ""
endef
export setenv
```

위 블록은 `setenv`라는 변수를 선언하는 단계이다. (이렇게 선언된 변수가 어떻게
사용되는지는 맨 뒷부분에 설명된다.) 대충 보이는 것처럼, 이 내용은 대체로
`bash` 문법이며 Makefile 내에서 사용되는 것을 고려한 부분이 일부 보인다.
(`$$` 같은 거)

이 부분은 나중에 Tomcat을 실행할 때 사용할 환경변수를 설정하는 과정에 대한
준비이며, 그 내용(`define`과 `endef`로 쌓인 부분)은 나중에 `bin/setenv.sh`로
저장될 것이다. (참고로, 이 파일은 Catalina가 실행될 때 읽어질 파일이다.)

여기서 미리 살짝 보고 넘어가자면, 다음의 세 가지 부분이 내 선호 설정의 핵심.

`-XX:+HeapDumpOnOutOfMemoryError`
: JavaVM에서 OOM(Out of Memory Exception)이 발생했을 때 자동으로 HeapDump를
  생성하라는 뜻. HeapDump가 있어야 왜 OOM이 발생했는지 원인을 찾을 수 있는데,
  이걸 매번 수동으로 잡을 수는 없다. 특히, 서비스 연속성을 생각하면 사람이
  개입하는데 소요되는 시간을 줄여야 한다.
{.help}

`-XX:OnOutOfMemoryError="$CATALINA_BASE/bin/on-oom.sh"`
: OOM이 발생했을 때 후속조치를 위해 실행할 명령을 `On` 형태로 지정해주는 옵션.
  참고로, 여기서 지정하고 있는 `on-oom.sh`도 이 Makefile을 통해 만들어진다.
{.help}

`-XX:OnError="$CATALINA_BASE/bin/on-error.sh"`
: 비슷하게, 기타 오류가 발생했을 때 실행할 스크립트를 지정해준다. 문제 상황에서
  사람의 개입을 줄이고 서비스 연속성을 높이기 위한 조치.
{.help}

#### 실행 스크립트

서비스 실행과 중지를 조금 간편하게 하기 위한 스크립트. 여기서 중요한 부분은
`su - wwexec -c ...` 방식으로, 설령 이 스크립트를 `root`가 실행하더라도 그
실행 권한 범위를 `wwexec`라는 서비스 전용 계정으로 한정한다는 점이다.
그렇다고 이 계정이 WAS 관리자가 사용할 계정도 아니다. 각각의 WAS 관리자는
자신의 고유 계정을 사용하고, 서비스 전용 계정은 서비스를 동작시키는데만
사용한다. (위의 환경변수 설정 중 `umask`를 `002`로 지정하는 것도 이것과
관련된 것)

```makefile
define init
#!/bin/bash

cat_home=$(CATALINA_HOME)
cat_base=$(CATALINA_BASE)

cmd=$$1
if [ "$$cmd" = "startup" ]; then
	su - wwexec -c "CATALINA_BASE=$$cat_base $$cat_home/bin/$$cmd.sh"
elif [ "$$cmd" = "shutdown" ]; then
	su - wwexec -c "CATALINA_BASE=$$cat_base $$cat_home/bin/$$cmd.sh"
else
	echo "usage: $$0 startup|shutdown"
fi

endef
export init
```

#### Out of Memory 처리기

앞서 이야기한 것처럼, Error가 발생하거나 OOM이 발생하면 사람의 개입 없이
그 순간의 장애상황을 파악하기 위한 기록을 하거나 장애 후속조치로 서비스
재시작 등을 시도할 필요가 있다. 아래 `define` 블록은 이 때 사용할 스크립트를
만드는 부분이다. (약식 버전으로, 실제 환경에서는 조금 더 세밀한 기능을
추가할 수 있다.)

```makefile
define on_oom
#!/bin/bash

export PATH="$(JAVA_HOME)/bin:/bin:/sbin:/usr/bin:/usr/sbin"

cat_base=$(CATALINA_BASE)
date_now=`date "+%Y-%m-%d %H:%M:%S"`
log=$$cat_base/logs/fatal-error.log

pid=`cat $$cat_base/$(PID_FILE)`
jstack_log=`jstack -F $$pid 2>&1`
ps_log=`ps -p $$pid -o pid,pcpu,pmem,start,cputime,stat,wchan:14,args`

echo "$$jstack_log" >> $$log
echo "$$jstack_log"
echo "$$ps_log" >> $$log
echo "$$ps_log"

endef
export on_oom
```

#### gitignore

뜬금없이 갑자기 gitignore? 뒤에 답이 나온다.

```makefile
define gitignore
/logs/
/temp/
/work/
endef
export gitignore
```

#### `default` rule

이제야 진짜 Makefile이 나오는구나. Makefile을 만들 때, 항상 첫 룰은 `default`
등의 이름으로 make 가 사용할 환경변수를 출력하거나 rule 설명을 해주는 구문을
넣는다. 이는 실수로 `make` 명령을 내렸을 때 엉뚱한 일이 벌어지는 것을 막는
이유도 있고, 동시에 환경을 파악하고 일을 시작하는 것이 좋기 때문이기도 하다.

```makefile
default:
	## CATALINA_HOME: $(CATALINA_HOME)
	## CATALINA_BASE: $(CATALINA_BASE)
	##     JAVA_HOME: $(JAVA_HOME)
```

#### `install` rule

진짜 본체는 여기에. 이건 내용이 단순하니까 긴 설명은 필요 없을 것 같다. 필요한
디렉터리를 만들고, `CATALINA_HOME`으로부터 기본 설정으로 배포된 실행시간에
필요한 파일들을 복사해오고, 일부 기능을 enable 시키고, 그리고 위에서 길게
준비한 각종 파일, 즉 `setenv.sh`, `init.sh`, `on-oom.sh` 등을 만들고, 각각을
적절한 owner.group에 넣어준 다음 마지막으로 디렉터리 전체를 git을 이용해서
박제해버린다.

```makefile
install:
	mkdir -p bin
	mkdir -p lib
	mkdir -p logs
	mkdir -p temp
	mkdir -p webapps
	mkdir -p work
	cp -a $(CATALINA_HOME)/conf/ conf/
	mkdir -p conf/Catalina/localhost/
	cp -a $(CATALINA_HOME)/webapps/manager/META-INF/context.xml \
		$(CATALINA_BASE)/conf/Catalina/localhost/manager.xml
	sed -i 's,^<Context,<Context docBase="$${catalina.home}/webapps/manager"\n\t\t,' $(CATALINA_BASE)/conf/Catalina/localhost/manager.xml
	echo "$$setenv" > bin/setenv.sh
	echo "$$init" > bin/init.sh
	echo "$$on_oom" > bin/on-oom.sh
	echo "$$on_oom" > bin/on-error.sh
	chmod 750 bin/init.sh
	chmod 755 bin/on-oom.sh
	chmod 755 bin/on-error.sh
	chown superhero.service logs
	chown superhero.service temp
	chown superhero.service work
	chown superhero.service webapps
	chmod 2775 logs
	chmod 2775 temp
	chmod 2775 work
	chmod 2775 webapps
	echo "$$gitignore" > .gitignore
	git init
	git add .
	git commit -m "instance initialized."
```

왜 여기서 git이 나오냐... 하면, 서비스 배포 상태를 local git으로 관리하면서
(git 서버 구성은 옵션) 만약의 상황에서 rollback을 쉽게하기 위해서.

아... 누군가는 "CI/CD 쓰면 되지 무슨 소리냐"라고 할 수도 있는데, 뭐, 상황에
따라 다르다고나 할까? 한 가지 방식만 고집할 필요도 없을 뿐더러, 삽질로 충분한
서비스에 굴삭기 가져올 필요 없는 경우도 많거든. ㅎㅎ


#### 기타 규칙들

뭐, 이건 딱히 설명 안해도 될 내용들인데... `start`, `stop`, `restart` 규칙은
저 `sudo bin/init.sh ...` 명령마저도 치기 싫을 때 `make start` 식으로 짧게
쓰려고 넣어둔 거고, 그 앞의 `distclean`은 `CATALINA_BASE`를 날리는 목적.
뭐 그럴 일이 있다고... Tutorial도 아니고... 라는 생각은 들지만 이게 내 성격.

> Make 무지 좋아해 응?

```makefile
distclean:
	rm -rf bin lib logs temp webapps work conf .git .gitignore


start:
	##### starting tomcat server...
	sudo bin/init.sh startup

stop:
	##### shutdown tomcat server...
	sudo bin/init.sh shutdown

restart: stop start

```


## 보너스

원래 하려던 이야기는 사실 `CATALINA_HOME`은 `CATALINA_BASE`가 아니다! 뭐 이런
이야기였는데 쓰다보니 구성 이야기로 빠진 거고, 구성 이야기를 하는 김에 조금 더.

### 기본 제공되는 관리자 App 설정

Tomcat과 함께 배포되는 기본 관리자 인터페이스는 다음과 같이 설정하여 보다
안전하게 사용할 수 있다.

#### Manager App 활성화

먼저, 위의 Makefile을 이용하여 인스턴스를 구성하게 되면 별도로 manager app을
배포하지 않고도 `CATALINA_HOME`의 앱을 사용할 수 있도록 구성된다. 손으로
구성하는 경우라면 아래 경로에 다음과 같은 내용의 파일을 만들어주면 된다.

`conf/Catalina/localhost/manager.xml`
{.block-title}

```xml
<Context docBase="${catalina.home}/webapps/manager"
		antiResourceLocking="false" privileged="true" >
</Context>
```

#### Manager 접근 설정

기본 구성에서는 어떤 사용자도 활성화 되어있지 않다. 아래와 같이, 사용자 설정
파일을 수정하여 줌으로써, 웹 화면으로 접근 가능한 사용자 계정을 만들 수 있다.

`conf/tomcat-user.xml`
{.block-title}

```xml
<tomcat-users xmlns="http://tomcat.apache.org/xml"
		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
		xsi:schemaLocation="http://tomcat.apache.org/xml tomcat-users.xsd"
		version="1.0">
	<user rolename="manager-gui"/>
	<user username="admin" password="p4ssw0rd" roles="manager-gui"/>
</tomcat-users>
```

위의 내용을 반영하고 http://hostname/manager 로 접근하면, HTTP 인증방식의
인증 창이 뜨게 되며, 위에서 설정한 username과 password로 관리 화면이 열리게
된다.

#### Manager 접근 암호의 암호화

그러나, 위의 설정은 좀 위험하다. 해당 파일의 권한을 잘 관리한다고 하더라도,
암호가 평문으로 저장되어 있다는 위험은 사라지지 않는다. Tomcat은 이를 위한
보완 기능을 제공하는데,

먼저 아래와 같이, 함께 제공되는 스크립트를 활용하여 Hash 처리된 암호를
만들어낸다. 이 때, sha-1, md5, sha-256 등의 방식을 사용할 수 있다.

```console
$ $CATALINA_HOME/bin/digest.sh -a sha-1 p4ssw0rd
p4ssw0rd:ad3b59......
```

이렇게 만들어진 Hash로 이미 설정한 사용자의 password 부분을 대체해준다.

`conf/tomcat-user.xml`
{.block-title}

```xml
<tomcat-users xmlns="http://tomcat.apache.org/xml"
		xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
		xsi:schemaLocation="http://tomcat.apache.org/xml tomcat-users.xsd"
		version="1.0">
	<user rolename="manager-gui"/>
	<user username="admin" password="ad3b59......" roles="manager-gui"/>
</tomcat-users>
```

마지막으로, Tomcat으로 하여금, 사용자가 입력한 암호를 어떻게 다룰지 알 수
있도록 해줘야 하는데, 원래 아래와 같이 단순하게 설정되어 있는 부분을,

`conf/server.xml`
{.block-title}

```xml
<Realm className="org.apache.catalina.realm.UserDatabaseRealm"
	resourceName="UserDatabase"/>
```

다음과 같이 한 줄을 추가하여 sha-1 방식의 Hash된 암호를 사용하고 있음을
알려준다.

`conf/server.xml`
{.block-title}

```xml
<Realm className="org.apache.catalina.realm.UserDatabaseRealm"
	digest="sha-1"
	resourceName="UserDatabase"/>
```

이제 서버를 다시 시작하고 나면, 사용자 입장에서는 동일하게 암호를 입력하여 로그인할 수 있다.
