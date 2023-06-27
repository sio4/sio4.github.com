---
title: 판타스틱 PaaS 서비스, Heroku 사용하기
tags: ["Heroku", "PaaS", "cloud-computing", "Git", "version-control", "ruby-on-rails"]
categories: ["cloudcomputing"]
image: /assets/logos/heroku-light.jpg
banner: /assets/logos/heroku-light.jpg
date: 2016-03-13 14:55 +09:00
---
첫인상이 중요한 것은 사람에게만 해당하는 것이 아닌 것 같다. "PaaS" 하면
가장 먼저 생각나는 Heroku의 첫 인상이 내겐 그랬다.  이 글은, 간만에
Heroku에 신규 App을 등록/배포하면서, 그 과정을 정리한 것으로 Heroku를
사용하기 위한 가장 기본적인 Workflow를 설명하고 있다.

![](/assets/logos/heroku-light.jpg){:.fit.dropshadow}

2009년에 [Heroku]를 처음 접했던 느낌을 정확하게 기억하지는 못하겠지만,
뭐랄까... "아! 이것이야말로 클라우드!?" 같은 생각을 했었던 것 같다.
그 순간의 느낌을 이런 자극적인 제목의 글로 남겼을 정도니...
[환상적! Ruby on Rails를 위한 PaaS 서비스!]

일찌기, 단순히 서버 가상화에 깊은 믿음(?)을 가지고 있던 내가, Amazon의
EC2와 같은 **IaaS 방식 중심으로 클라우드컴퓨팅이라는 개념을 접하면서
"뭔가 부족하다..." 라고 느꼈던 부분을 실감으로 채워준 서비스**가 바로
당시 Ruby on Rails App을 Hosting할 수 있었던 Heroku 였다.

오늘은, 한동안 사용하지 않던 Heroku에 새로 App을 올려보면서 그 과정을
기록으로 남기려 한다.

[Heroku]:https://heroku.com
[환상적! Ruby on Rails를 위한 PaaS 서비스!]:{% post_url cloudcomputing/2009-11-13-fantastic-paas-for-ruby-on-rails %}

* TOC
{:toc}

{:#install-toolbelt}
# Toolbelt 설치

Toolbelt라니... 내게는 생소한, 특이한 표현이다. 보통은 Toolchain이나
Toolkit 같은 용어를 많이 사용할텐데 용어 선정 자체가 Heroku의 범상치
않음을 보여주는 것 같다.

다음의 명령을 이용하면, Heroku 상에 새 App을 올리고 그 생명주기를
관리할 수 있는 CLI 도구인 Toolbelt(명령어는 `heroku`)를 설치할 수 있다.
(아! 당연히 요즘의 내 Laptop OS인 Ubuntu Linux의 경우이다.)

```console
$ wget -O- https://toolbelt.heroku.com/install-ubuntu.sh | sh
--2016-03-08 10:16:24--  https://toolbelt.heroku.com/install-ubuntu.sh
<...>
This script requires superuser access to install apt packages.
You will be prompted for your password by sudo.
[sudo] password for sio4: 
--2016-03-08 10:16:28--  https://toolbelt.heroku.com/apt/release.key
<...>
다음 새 패키지를 설치할 것입니다:
  heroku heroku-toolbelt
0개 업그레이드, 2개 새로 설치, 0개 제거 및 1개 업그레이드 안 함.
1,829 k바이트 아카이브를 받아야 합니다.
이 작업 후 0 바이트의 디스크 공간을 더 사용하게 됩니다.
<...>
$ 
```

위의 과정을 거치고 나면 heroku 저장소가 APT 소스로 추가되고 필요한
패키지 설치까지 진행된다.


{:#deploying-application}
# Application 배포

이제 실제로 내 Application을 heroku에 배포해볼 차례이다. 가물가물한
기억으로, 초기에는 Git을 이용한 배포가 유일한 방법이었던 것 같은데,
지금은 Web을 중심으로 하여, 예를 들면 Github에서 바로 배포하는 등의
기능이 제공되고 있기는 하다.

아직 사용해보지 않았지만 Github를 이용한 배포는 매우 편리하게 이용할
수 있을 것 같다. 단지 **저장소에 변경한 소스를 Commit하는 것 만으로
Application 재배포**가 된다면, "지속적인 개발" 모드에서 상당히 편한
방식이 될 것이다.

{:.point}
PaaS
: 개발, 배포, 운영 Life Cycle을 통합하여 Cycle로 단순화해줘야 PaaS!

아무튼, 일단 CLI를 이용한 배포를 이 글에서는 사용하기로 하였다.



{:#preparing-application-and-heroku-login}
## Application 준비와 Heroku Login

이제, 이미 만들어놓은 Application을 Heroku 배포하려고 한다. 새로운
Application을 만드는 경우라 하여도, 이하의 과정은 동일하게 적용할
수 있다.  이번에 배포하려고 하는 Application은 [현천] 프로젝트의
Single Sign-On 서비스인 [SiSO]이다.

참고로, 이 프로젝트는 이미 git을 이용하여 버전 관리를 하고 있으며
[Github]에 둥지를 틀고 있는데, **Heroku는 Git을 이용하여 배포를 하기
때문에 프로젝트의 VCS로 Git을 쓰고 있다면 아주 쉽게 적응**할 수 있다.

[현천]:https://github.com/hyeoncheon/
[SiSO]:https://github.com/hyeoncheon/siso/
[Github]:https://github.com/

### Heroku Login

Toolbelt가 설치된 상태라면, 다음과 같이 `heroku login` 명령을
수행하여 Heroku에 로그인해주어야 한다. 로그인을 하고 나면 이후에
내리는 모든 명령이 해당 계정의 권한 범위에서 수행된다.

```console
$ heroku login
heroku-cli: Installing Toolbelt v4... done
For more information on Toolbelt v4: https://github.com/heroku/heroku-cli
heroku-cli: Adding dependencies... done
heroku-cli: Installing core plugins... done
Enter your Heroku credentials.
Email: user@example.com
Password (typing will be hidden): 
Logged in as user@example.com
```

### Application 준비

이제 배포하고자 하는 Application의 작업본에, 이 Application이 어디로
배포되어야 하는지 설정해줘야 한다. 아래 다시 설명하겠지만 배포 진행은
`git push` 명령을 사용하게 되며, 지금 진행하는 작업은 push할 저장소를
설정해주는 단계이다.

```console
$ cd siso
$ heroku git:remote -a hc-siso
set git remote heroku to https://git.heroku.com/hc-siso.git
$ git remote -v
heroku	https://git.heroku.com/hc-siso.git (fetch)
heroku	https://git.heroku.com/hc-siso.git (push)
origin	https://sio4@github.com/hyeoncheon/siso.git (fetch)
origin	https://sio4@github.com/hyeoncheon/siso.git (push)
$ 
```

일반적으로 원격 저장소 지정은 `git remote` 명령을 사용하여 진행하지만
여기서는 `heroku` 명령의 `git:remote` 부명령을 사용하고 있다.
이 명령은 사용자가 원격 저장소의 URL을 직접 지정하지 않고 단지 Heroku
App 이름을 인수로 전달함으로써 자동으로 URL을 지정할 수 있도록 돕는
기능을 한다. (연결된 URL은 `git remote -v`로 확인할 수 있다.)

---

### 참고: `heroku` 명령

참고로, `heroku` 명령은 아래와 같은 형식으로 사용하게 된다.
`git`과 같은 VCS 명령, `rpm`, `gem` 등의 패키지 관리도구, `rails` 같은
개발도구들에서 많이 볼 수 있듯이, heroku 역시 하나의 명령어가 여러
부명령(sub command)을 함께 사용하는 형식으로 되어있는데, 특히나
관련 부명령들을 묶어서 "Topic"이라는 개념으로 관리하는 점도 재미있다.

```console
$ heroku
Usage: heroku COMMAND [--app APP] [command-specific-options]

Primary help topics, type "heroku help TOPIC" for more details:

  addons    #  manage add-on resources
  apps      #  manage apps (create, destroy)
  auth      #  authentication (login, logout)
  config    #  manage app config vars
  domains   #  manage domains
  logs      #  display logs for an app
  ps        #  manage dynos (dynos, workers)
  releases  #  manage app releases
  run       #  run one-off commands (console, rake)

Additional topics:

  2fa          #  manage two-factor authentication settings
  access       #  CLI to manage access in Heroku Applications
  buildpacks   #  manage the buildpack for an app
  certs        #  manage ssl endpoints for an app
  drains       #  display drains for an app
  features     #  manage optional features
  fork         #  clone an existing app
  git          #  manage local git repository for app
  help         #  list commands and display help
  keys         #  manage authentication keys
  labs         #  manage optional features
  local        #  run heroku app locally
  login        #  login with your Heroku credentials.
  logout       #  clear your local Heroku credentials
  maintenance  #  manage maintenance mode for an app
  members      #  manage membership in organization accounts
  orgs         #  manage organization accounts
  pg           # 
  pgbackups    #  manage backups of heroku postgresql databases
  pipelines    #  manage collections of apps in pipelines
  plugins      #  manage plugins to the heroku gem
  regions      #  list available regions
  spaces       #  manage heroku private spaces
  stack        #  manage the stack for an app
  status       #  status of the Heroku platform
  trusted-ips  #  
  twofactor    #  manage two-factor authentication settings
  update       #  update the heroku client
  version      #  display version

$ 
```

앞서 실행한 `git:remote`는 `git`이라는 Topic에 속한 것으로, 다음과 같은
명령을 제공한다.

```console
$ heroku help git
Additional commands, type "heroku help COMMAND" for more details:

  git:clone [DIRECTORY]  #  clones a heroku app to your local machine at DIRECTORY (defaults to app name)
  git:remote             #  adds a git remote to an app repo

$ 
```

개별 명령어에 대한 도움말은 아래와 같은 방식으로 얻을 수 있다.

```console
$ heroku help git:remote
Usage: heroku git:remote

adds a git remote to an app repo

 -a, --app APP       # the Heroku app to use
 -r, --remote REMOTE # the git remote to create
 --ssh-git           # use SSH git protocol

extra arguments will be passed to git remote add

Examples:

  $ heroku git:remote -a example set git remote heroku to https://git.heroku.com/example.git

$ 
```

`topic:command` 형식으로 사용되는 명령 외에도 맨 처음 만났던 `login`과
같이 Topic 없이 사용되는 명령들도 있다.

이상으로, 배포를 위한 "기초준비". 아... 이게 끝이 아니라서... 기초는
다 됐다.



{:#deploying-with-git}
## Git를 이용한 배포

이제 Heroku 실행환경에 Application을 밀어넣을 차례이다. 다음과 같이
`git push` 명령을 사용하여 밀어넣을 수 있다. (미리 말해두자면, 아래
명령은 잘못된 부분이 있다. 일단 단계만 보고 하나씩 다시 얘기하려고
한다.)

```console
$ git checkout current
Switched to branch 'current'
$ git push heroku master
Counting objects: 581, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (232/232), done.
Writing objects: 100% (581/581), 1.32 MiB | 487.00 KiB/s, done.
Total 581 (delta 302), reused 579 (delta 300)
remote: Compressing source files... done.
remote: Building source:
remote: 
remote: -----> Ruby app detected
remote: -----> Compiling Ruby/Rails
remote: -----> Using Ruby version: ruby-2.2.4
remote: -----> Installing dependencies using bundler 1.9.7
remote:        Running: bundle install --without development:test --path vendor/bundle --binstubs vendor/bundle/bin -j4 --deployment
<...>
remote:  !
remote:  !     Failed to install gems via Bundler.
remote:  !     
remote:  !     Detected sqlite3 gem which is not supported on Heroku.
remote:  !     https://devcenter.heroku.com/articles/sqlite3
remote:  !
remote: 
remote:  !     Push rejected, failed to compile Ruby app
remote: 
remote: Verifying deploy...
remote: 
remote: !	Push rejected to hc-siso.
remote: 
To https://git.heroku.com/hc-siso.git
 ! [remote rejected] master -> master (pre-receive hook declined)
error: failed to push some refs to 'https://git.heroku.com/hc-siso.git'
$ 
```

이렇게, 맨 처음 해준 일은 current라는 이름의 Branch를 `checkout`하는
것이다. 이 current라는 Branch는 시험과 검증이 완료된 최종 버전을
가리키는 것으로, 서비스의 신뢰성을 위하여 항상 깨끗하게 시험이 완료된
상태로 유지해야 한다.
모든 Git 저장소의 기본 Branch인 master는 우리가 저장소를 `clone`으로
떴을 때 기본으로 `checkout`되는 Branch로, 별도의 개발 Branch를 사용하여
개발을 진행하지 않는 상황이라면 항상 최신의 개발 상태를 반영하는 것이
일반적이다. (이 부분에 대해서도 할 말이 많지만 주제를 벋어나니 나중에
기회가 되면 집중하여 다루어 보겠다. TODO)

다음으로 `git push heroku master` 명령을 사용하여 내 앞에 있는 소스를
Heroku 환경으로 밀어 넣으면 배포가 끝나게 된다.

> 이상과 같이, 간단한 명령 몇 개로 배포과정이 모두 끝났다.
> 멋지지 않은가?

라고 말하고 싶었는데, 그렇게 간단하게 끝나지 않았다. (예전같으면,
"간단하게 끝나면 재미가 없지"라고 했을 것 같은데...)



{:#trouble-shooting}
# 문제해결

언제든, 문제의 해결은 문제를 파악하는 것으로부터 시작된다. 다행히,
위에서 보는 바와 같이 Heroku에 push를 할 때 발생하는 모든 과정과
오류 메시지는 사용자의 화면에 뿌려지게 된다. (상당한 부분을 생략해
버렸지만,) 위의 출력을 읽어보면 어떤 부분에 문제가 있었는지 확인이
가능하다.

참고로, 이런 오류 메시지는 다음과 같이 Heroku의 Web Console에서도
확인이 가능하다. (이 방식의 확인은 지나간 오류를 확인할 수도 있으니
특히나 자동배포 환경이라면 꼭 사용하게 될 기능이기도 하다.)

![](/attachments/heroku-siso-01-deploy-failed.png){:.fit.dropshadow}

뭔가 많은 것이 기다리고 있을 것 같은데, 하나씩 천천히 풀어봐야 할
것 같다.



{:#sqlite-is-not-supported-on-heroku}
## Heroku는 SQLite을 지원하지 않는다

위의 출력을 보면,

```
!     Failed to install gems via Bundler.
!     
!     Detected sqlite3 gem which is not supported on Heroku.
!     https://devcenter.heroku.com/articles/sqlite3
!
!     Push rejected, failed to compile Ruby app
```

라고 씌여있다. 뭐, 마지막 문구를 보면 Compile에 실패했고 그 결과로
밀어넣기가 거부되었다고 한다. 그리고 친절한 가운데 설명처럼,
Heroku가 지원하지 않는 sqlite3 gem이 발견되었기 때문이라고 한다.
([설명 페이지](https://devcenter.heroku.com/articles/sqlite3))

이 Application을 개발할 때, 특정 Database를 지정하여 `Gemfile`을
작성하지 않았으며, 기본 Database인 SQLite3로 유지했었다. 즉,
개발모드에서는 별도의 DBMS에 의존하지 않는 SQLite3를 사용하도록
하고, 실제의 Production 배포 시점에 DB관련 설정을 별도로 하도록
남겨둔 것이다.

이 App을 향후에 Github에서 바로 Heroku에 배포할 수 있도록 하려면
이 부분을 해결하고 넘어가야 한다. 그래서, Local의 개발환경에서는
계속해서 SQLite3를 사용하도록 하되 이것이 Heroku 환경에 배포하는
것을 방해하지 않도록, 다음과 같은 변경을 해주었다.

```diff
--- a/Gemfile
+++ b/Gemfile
@@ -6,7 +6,13 @@ gem 'rack', '1.4.5'
 # Bundle edge Rails instead:
 # gem 'rails', :git => 'git://github.com/rails/rails.git'
 
-gem 'sqlite3'
+group :development, :test do
+  gem 'sqlite3'
+end
+
+group :production do
+  gem 'pg'
+end
 
 gem 'json'
 
```

`Gemfile`을 고쳤다면, 다음과 같은 방식으로 `Gemfile.lock` 파일도
최신의 의존성이 반영되도록 해줘야 한다.  (아래의 `bundle lock` 명령은
.lock 파일을 최신의 `Gemfile`에 맞춰 Update하도록 하는 부명령이다.)

```console
$ vi Gemfile
$ bundle lock
Fetching gem metadata from https://rubygems.org/..........
Fetching version metadata from https://rubygems.org/...
Fetching dependency metadata from https://rubygems.org/..
Resolving dependencies...
Writing lockfile to /home/sio4/git/heroku/siso/Gemfile.lock
$ git add Gemfile Gemfile.lock
$ git commit -m "change database gem for heroku"
[current 15d341d] change database gem for heroku
 2 files changed, 12 insertions(+), 1 deletion(-)
$ 
```

이제, bundler가 실행될 때의 선택에 의해 `sqlite3`와 `pg`의 설치를
선택적으로 할 수 있게 되었다.

참고로, 위의 `push` 명령에 의해 동작한 hook의 출력 화면을 자세히 보면,
이미 Heroku는 이에 대한 대비가 되어있다. (뭐, Heroku 만의 특별한 것은
아니고 일반적인 이야기이긴 하다.)

{:.wrap}
```console
> Running: bundle install --without development:test --path vendor/bundle --binstubs vendor/bundle/bin -j4 --deployment
```

이제, Heroku에서 Bundling이 일어날 때, `sqlite3`의 설치는 제외되게 된다.

---

사실, 첫번째 배포 예제의 `git push` 명령은 잘 내려진 명령이 아니었다.
(부끄러운 일이지만, 뒤늦게 발견했다.) Git이 Push를 할 때 위에서와 같이,

```console
$ git push heroku master
```

형태로 명령을 내리게 되면, Git은 "Local 작업본의 master"를 "Remote
저장소 heroku의 master"에 올리게 된다. 그러나 우리는 별도의 배포를
위한 Branch인 current를 가지고 작업을 하고 있으므로, `git push`는
다음과 같은 형식으로 바뀌어야 한다.

```console
$ git push heroku current:master
```

또는, 현재 해당 Branch를 `checkout`하여 작업하는 중이므로,

```console
$ git push heroku HEAD:master
```

이렇게 해줘야, 원하는 Branch를 올릴 수 있다.



{:#could-net-connect-to-server}
## 존재하지 않는 데이터베이스에 접속하려 했음

Gemfile을 수정하여 `sqlite3`를 제외한 상태에서 `push`를 해줬다. 아래
출력에서 보는 바와 같이, Bundling은 31초 만에 정상적으로 끝난 것을
볼 수 있다. 그리고 그 다음으로 Database 설정이 진행되는데, 출력을
잘 살펴보면 Heroku의 방식을 짐작할 수 있다.

```console
$ git push heroku current:master
<...>
remote: -----> Installing dependencies using bundler 1.9.7
<...>
remote:        Bundle completed (31.77s)
remote:        Cleaning up the bundler cache.
remote: -----> Writing config/database.yml to read from DATABASE_URL
<...>
remote:        Connecting to database specified by DATABASE_URL
remote:        rake aborted!
remote:        PG::ConnectionBad: could not connect to server: Connection refused
remote:        Is the server running on host "127.0.0.1" and accepting
remote:        TCP/IP connections on port 5432?
<...>
remote:        Tasks: TOP => environment
remote:        (See full trace by running task with --trace)
remote:  !
remote:  !     Precompiling assets failed.
remote:  !     Attempted to access a nonexistent database:
remote:  !     https://devcenter.heroku.com/articles/pre-provision-database
remote:  !
remote: 
remote:  !     Push rejected, failed to compile Ruby app
<...>
$ 
```

먼저 주목할 부분은,

```
-----> Writing config/database.yml to read from DATABASE_URL
```

부분인데, 말그대로 Heroku가 Database 관련 설정을 직접 해주고 있다.
앞서 얘기했던,

> Production 배포 시점에 DB관련 설정을 별도로 하도록 남겨둔 것

에 해당하는 일을 알아서 해주고 있는 것이다. 글의 형식을 Tutorial이
아닌 Troubleshooting 형식으로 써내려가다 보니 오히려 설명하기 힘든
부분인데, 결론을 먼저 말하자면 Heroku App은 Addon 형식으로 DBMS를
붙여주게 되며, 이렇게 as-a-service로 제공되는 **DBMS에 대한 연결을
서비스 제공자가 알아서** 해주는 것이라고 볼 수 있다.

{:.point}
Cloud Computing
: 사용자가 많은 것을 잊을 수 있어야 Cloud Computing이다.
: 그러기 위해서 Cloud Computing은, 친절해야 한다.

문제가 발생한 지점에 주목하면,

```console
      PG::ConnectionBad: could not connect to server: Connection refused
      Is the server running on host "127.0.0.1" and accepting
      TCP/IP connections on port 5432?
<...>
!     Attempted to access a nonexistent database:
!     https://devcenter.heroku.com/articles/pre-provision-database
```

저수준의 로그를 보면 `localhost`의 5432번 Port로 Postgres 접속을
시도했으나 접속이 되지 않았음을 볼 수 있고, SQLite3의 경우에서와
같이 **친절한 설명**이 추가되어 있다.


문제의 근원은, App 배포 과정에서 DBMS에 접근하고 싶었지만 현재 설정된
DBMS가 없는 것이다. 실제로 App을 만들어주고 바로 배포를 시도했으니
있을리가 없다. (좀 애매한 부분이긴 한데)

그래서, Heroku에서는
"[Pre Provision Database](https://devcenter.heroku.com/articles/pre-provision-database)"라는
개념/설명을 해놓고 있는데, 압축해서 말하자면, 최초 App의 배포를 하기에
앞서 DBMS Addon을 미리 추가해 줘야 한다. 이 Addon 설정은 Web Console을
통해 추가해 줄 수도 있지만, 이 글에서는 `heroku` Toolbelt를 이용하여
추가해 주려고 한다.

```console
$ heroku addons:create heroku-postgresql
Creating postgresql-trapezoidal-38641... done, (free)
Adding postgresql-trapezoidal-38641 to hc-siso... done
Setting DATABASE_URL and restarting hc-siso... done, v3
Database has been created and is available
 ! This database is empty. If upgrading, you can transfer
 ! data from another database with pg:copy
Use `heroku addons:docs heroku-postgresql` to view documentation.
$ 
```

위와 같이, `addons:create` 부명령을 수행하여 Heroku에서 as-a-service로
제공하는 기본 DBMS인 PostgreSQL의 설정을 해줄 수 있다. 출력을 살펴보면,
배포 과정에서 등장했던 `DATABASE_URL`을 설정해주는 것을 볼 수 있다.
이 설정은 환경변수의 형태로 적용되는데, Heroku App이 구동할 때 참조할
환경변수를 Heroku에서는 설정변수(Config Vars)라는 형식으로 다루게 된다.
(이 부분은 아래에 다시 설명한다.)

이렇게 추가된 Addon은 Web Console을 통해서도 그 상태를 볼 수 있다.
(그림의 아래쪽)

![](/attachments/heroku-siso-02-pre-provision.png){:.fit.dropshadow}



{:#deployed-successfully}
## 드디어 배포 성공!

다시 동일한 방식으로 배포를 시도해보자.

```console
$ git push heroku current:master
Counting objects: 585, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (236/236), done.
Writing objects: 100% (585/585), 1.32 MiB | 453.00 KiB/s, done.
Total 585 (delta 305), reused 577 (delta 300)
remote: Compressing source files... done.
remote: Building source:
remote: 
remote: -----> Ruby app detected
remote: -----> Compiling Ruby/Rails
remote: -----> Using Ruby version: ruby-2.2.4
remote: -----> Installing dependencies using bundler 1.9.7
remote:        Running: bundle install --without development:test --path vendor/bundle --binstubs vendor/bundle/bin -j4 --deployment
<...>
remote:        Bundle completed (29.97s)
remote:        Cleaning up the bundler cache.
remote: -----> Writing config/database.yml to read from DATABASE_URL
remote: -----> Preparing app for Rails asset pipeline
remote:        Running: rake assets:precompile
<...>
remote:        Connecting to database specified by DATABASE_URL
remote:        Asset precompilation completed (9.78s)
remote: 
remote: ###### WARNING:
remote:        Injecting plugin 'rails_log_stdout'
remote: 
remote: ###### WARNING:
remote:        Injecting plugin 'rails3_serve_static_assets'
remote: 
remote: ###### WARNING:
remote:        Add 'rails_12factor' gem to your Gemfile to skip plugin injectio
remote: 
remote: ###### WARNING:
remote:        You have not declared a Ruby version in your Gemfile.
remote:        To set your Ruby version add this line to your Gemfile:
remote:        ruby '2.2.4'
remote:        # See https://devcenter.heroku.com/articles/ruby-versions for more information.
remote: 
remote: ###### WARNING:
remote:        No Procfile detected, using the default web server (webrick)
remote:        https://devcenter.heroku.com/articles/ruby-default-web-server
remote: 
remote: -----> Discovering process types
remote:        Procfile declares types     -> (none)
remote:        Default types for buildpack -> console, rake, web, worker
remote: 
remote: -----> Compressing...
remote:        Done: 30.7M
remote: -----> Launching...
remote:        Released v5
remote:        https://hc-siso.herokuapp.com/ deployed to Heroku
remote: 
remote: Verifying deploy.... done.
To https://git.heroku.com/hc-siso.git
 * [new branch]      current -> master
$ 
```

성공! 중간 중간 WARNING이 있지만, 일단 배포 자체에는 성공을 했다.

이 상태에서 App의 Resource 상태를 다시 보면 아래 그림과 같다. 이전에
본 화면에서는 비어있던 Dynos(Heroku가 Process, Computing을 다루는
개념/단위)에 web과 worker가 Free Dynos로 생성되어 있는 것을 볼 수 있다.

![](/attachments/heroku-siso-03-resources.png){:.fit.dropshadow}

그리고 Activity Feed에는 Build 및 Deploy가 성공적으로 된 것을 확인할
수 있다.

![](/attachments/heroku-siso-06-deployed.png){:.fit.dropshadow}



{:#css-isnt-precompiled}
## Assets Precompile!

배포는 별다른 오류없이 정상적으로 되었지만 실제로 페이지를 읽었을 때
다음과 같은 오류가 발생했다. 참고로, 원격지에서 실행되는 Log를 확인할
수 있도록, `heroku` 명령은 `logs`라는 부명령을 제공한다. 이 명령을
사용하면 최근의 로그를 보거나, 필요에 따라 `tail` 처럼 변하는 Log를
지켜볼 수 있는 옵션 `-t`를 제공한다.

```console
$ heroku logs
<...>
2016-03-08T02:17:50.526807+00:00 app[web.1]: Completed 500 Internal Server Error in 2ms
2016-03-08T02:17:50.531495+00:00 app[web.1]: 
2016-03-08T02:17:50.531507+00:00 app[web.1]: ActionView::Template::Error (theme-blacksky.css isn't precompiled):
2016-03-08T02:17:50.531507+00:00 app[web.1]:     3: <head>
2016-03-08T02:17:50.531538+00:00 app[web.1]:     4:   <title>SiSO</title>
2016-03-08T02:17:50.531539+00:00 app[web.1]:     5:   <%= stylesheet_link_tag    "application", :media => "all" %>
2016-03-08T02:17:50.531540+00:00 app[web.1]:     6:   <%= stylesheet_link_tag    "theme-blacksky", :media => "all" %>
2016-03-08T02:17:50.531541+00:00 app[web.1]:     7:   <%= javascript_include_tag "application" %>
2016-03-08T02:17:50.531541+00:00 app[web.1]:     8:   <%= csrf_meta_tags %>
2016-03-08T02:17:50.531542+00:00 app[web.1]:     9: </head>
2016-03-08T02:17:50.531543+00:00 app[web.1]:   app/views/layouts/application.html.erb:6:in `_app_views_layouts_application_html_erb__402967870787292913_69964236882700'
<...>
$ 
```

위의 로그의 내용을 보니 View를 만드는 과정에서 `theme-blacksky.css`의
Precompile된 버전을 찾지 못하여 발생했다는 것을 확인할 수 있다.

Rails 환경에서 개발을 해본 경험이 있다면 낯선 광경은 아니다. 이 문제에
대한 몇가지 해법이 있는데, 열거해 보자면 다음과 같다.

* 미리 Assets을 Precompile하여 Commit/Push하는 방법
  * 명확하게 파일을 올린다는 장점이 있으나 좀 산뜻하지는 않다.
  * 만약, 외부의 Application에서도 함께 참조하는 Asset에는 적합
* 배포 시 자동으로 Precompile이 될 수 있도록 설정하는 방법
  * 저장소를 깔끔하게 유지할 수 있다. 그러나, 잘해야 한다.

나는 다음과 같이 두 번째 방식으로 문제를 해결하려고 한다. 먼저 아래와
같은 변경을 해주고,

```diff
--- a/config/environments/production.rb
+++ b/config/environments/production.rb
@@ -47,6 +47,7 @@ Siso::Application.configure do

   # Precompile additional assets (application.js, application.css, and all non-JS/CSS are already added)
   # config.assets.precompile += %w( search.js )
+  config.assets.precompile += %w( *.js *.css )

   # Disable delivery errors, bad email addresses will be ignored
   # config.action_mailer.raise_delivery_errors = false

```

그 변경을 밀어넣는다.

```console
$ git add config/environments/production.rb
$ git commit -m "add precompile assets"
[current b16da94] add precompile assets
 1 file changed, 1 insertion(+)
$ git push heroku current:master
Counting objects: 5, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (5/5), done.
<...>
```

(이게, 원래 하고있던 과정에 대상을 추가한 것이라서, Log 상에는 표시가
나지 않는다. :-)



{:#undefined-table}
## 테이블이 없어요!

뭐, 순서가 뒤죽박죽이다 보니 어찌 이 단계에서 이런 오류가 떴다.
`PG` 입장에서는 `UndefinedTable`, `ActionView` 입장에서는 relation을 찾을
수 없다는 오류가 원인이다.

```
2016-03-08T02:36:31.729169+00:00 app[web.1]: Completed 500 Internal Server Error in 29ms
2016-03-08T02:36:31.731799+00:00 app[web.1]: 
2016-03-08T02:36:31.731815+00:00 app[web.1]: ActionView::Template::Error (PG::UndefinedTable: ERROR:  relation "sessions" does not exist
2016-03-08T02:36:31.731816+00:00 app[web.1]: LINE 5:              WHERE a.attrelid = '"sessions"'::regclass
2016-03-08T02:36:31.731817+00:00 app[web.1]:                                         ^
```

너무 당연한 얘기인데 이걸 왜 하지 않고 이 단계까지 오게 된 것일지?
"막고 품는" 배포의 문제를 볼 수 있었다.

아무튼, 이제 DB 설정을 해야 하는데, `rails`에서는 `rake db:migrate` 등의
명령으로 이 단계를 해주게 된다. Heroku에서는 이와 유사하게, 다음과 같은
방식으로 이 작업을 진행한다.

```console
$ heroku pg:reset DATABASE_URL --confirm hc-siso
Resetting DATABASE_URL... done
$ heroku run rake db:migrate
Running rake db:migrate on hc-siso... up, run.9817
Connecting to database specified by DATABASE_URL
Migrating to CreateGroups (20130103081505)
==  CreateGroups: migrating ===================================================
-- create_table(:groups)
   -> 0.0091s
==  CreateGroups: migrated (0.0092s) ==========================================

<...>
$ heroku run rake db:seed
Running rake db:seed on hc-siso... up, run.2548
Connecting to database specified by DATABASE_URL
$ 
```

위에서 보는 바와 같이, 기본적으로 Rails를 이용한 일반적인 개발과 거의
유사한 형태로 `pg:reset`, `run rake db:migrate`, `run rake db:seed` 등의
명령어를 수행하여 DB 설정을 해주고 App을 다시 시작해주면 이미 배포된
Application이 다시 시작되게 된다.

```console
$ heroku restart
Restarting dynos... done
$ 
```

이제 다시 접속을 해보자!



{:#it-works}
## IT WORKS!

이제 화면이 떴다!

![](/attachments/heroku-siso-10-running.png){:.fit.dropshadow}

다시, 위에서 활용했던 `heroku logs` 명령으로 로그를 보면,

```
2016-03-08T02:43:26.693600+00:00 app[web.1]: Started GET "/siso/" for 211.45.60.2 at 2016-03-08 02:43:26 +0000
2016-03-08T02:43:26.735819+00:00 app[web.1]: Processing by ServicesController#index as HTML
2016-03-08T02:43:26.745523+00:00 app[web.1]:   Rendered services/_authentications_tab.html.erb (0.5ms)
2016-03-08T02:43:26.746190+00:00 app[web.1]:   Rendered services/_applications_tab.html.erb (0.4ms)
2016-03-08T02:43:26.746310+00:00 app[web.1]:   Rendered services/index.html.erb within layouts/application (4.1ms)
2016-03-08T02:43:26.765530+00:00 app[web.1]: Completed 200 OK in 30ms (Views: 20.3ms | ActiveRecord: 8.9ms)
```

30ms의 실행시간을 들여서, 정상적으로 Request가 처리되었음을 확인할 수
있다.



{:#additional-configuration}
# 추가 설정

이상의 설정으로, 일단 Application의 기본적인 설정과 배포는 마무리가
되었다. 복잡한 기능이 없거나 외부 의존적인 부분이 없는 간단한 App은
이 정도의 설정으로 충분히 동작이 가능하다.
그러나, Application 구성의 복잡도가 적당히 증가되어 구동을 위한 환경
설정이 필요해지거나, **사용자의 배포 환경에 맞는 세부 설정이 필요한
경우** 또는 이러한 설정이 필요한 외부 Package를 사용하는 경우에는
별도의 변수 설정이 필요할 수 있다.
이 장에서는 이러한 실행환경의 구성에 대하여 확인하고 넘어가려고 한다.



{:#heroku-app-configuration}
## Heroku App 설정

`heroku` Toolbelt에는 `config`라는 부명령을 제공하고 있으며, 이것을
이용하여 실행환경을 확인하고 설정할 수 있다. 먼저, 다음과 같이 이미
설정된 내용을 확인할 수 있다.

{:.wrap}
```console
$ heroku config
=== hc-siso Config Vars
DATABASE_URL: postgres://aaaaaaaaaaaaaa:AAA_A1A1A1A1A1A-M1M1M1M1M1@ec2-00-00-00-00.compute-1.amazonaws.com:5432/a1a1a1a1a1a1a1
LANG:         en_US.UTF-8
RACK_ENV:     production
RAILS_ENV:    production
$ 
```

명령의 결과에서, 앞서 Addon으로 구성했던 DB에 대한 `DATABASE_URL`이
설정되어 있는 것과, App이 배포되면서 App의 특성에 맞게 설정된 다른
변수들의 내용을 볼 수 있다.  이 경우에는 Ruby on Rails App의 특성에
맞도록 설정된 `RACK_ENV`, `RAILS_ENV` 등의 환경이 설정되어 있음을
확인할 수 있다.

또, 지금 배포한 Application의 경우, Facebook이 API로 제공하는 OAuth2
인증 기능이 포함된 Application으로, 이 경우 Facebook API 접속을 위한
Key 등의 설정이 필요하다. 그 과정을 보면 아래와 같다.

```console
$ heroku config:set FACEBOOK_KEY=1010101010101010
Setting config vars and restarting hc-siso... done
FACEBOOK_KEY: 1010101010101010
$ 
$ heroku config:set FACEBOOK_SECRET=9876543210abcdef9876543210abcdef
Setting config vars and restarting hc-siso... done
FACEBOOK_SECRET: 9876543210abcdef9876543210abcdef
$ 
$ heroku config
=== hc-siso Config Vars
DATABASE_URL:    postgres://aaaaaaaaaaaaaa:AAA_A1A1A1A1A1A-M1M1M1M1M1@ec2-00-00-00-00.compute-1.amazonaws.com:5432/a1a1a1a1a1a1a1
FACEBOOK_KEY:    1010101010101010
FACEBOOK_SECRET: 9876543210abcdef9876543210abcdef
LANG:            en_US.UTF-8
RACK_ENV:        production
RAILS_ENV:       production
$ 
```

`heroku config:set` 명령을 사용해서 변수 설정을 해주고나면, 이 값은
다음번 Application 구동 시 환경변수로 깔리게 되고, Application에
영향을 주게 된다.

```console
$ heroku restart
Restarting dynos... done
$ 
```

이렇게 설정된 변수는 Rails App 안에서 다음과 같은 방식으로 그 값을
참조할 수 있다.

```ruby
ENV['FACEBOOK_KEY']
```

이제, Facebook과 연동이 가능해졌다. 다음 화면은 이 App에 대한 인증을
Facebook을 통하여 얻는 과정을 잡은 것이다.

![](/attachments/heroku-siso-11-facebook.png){:.fit.dropshadow}



{:#domain-configuration}
## Domain 설정하기

Heroku에 App을 올리게 되면, `app_name.herokuapp.com`과 같은 형식의
Domain이 자동으로 설정되고 이 주소를 사용하여 바로 접속할 수 있다.
그렇지만, 취미나 연습 수준의 App이 아니라 Brand를 가진 실 서비스를
위한 App이라면 이러한 주소를 사용하는 것은 적절하지 않을 수 있다.

Heroku는 사용자가 **자신의 Domain을 가져와서 서비스를 위한 주소로
적용**할 수 있도록 Domain 지정 기능을 제공하고 있으며, Toolbelt를
사용할 경우, 다음과 같은 방식으로 Domain 지정을 할 수 있다.

```console
$ heroku domains
=== hc-siso Heroku Domain
hc-siso.herokuapp.com

$ 
$ heroku domains:add siso.example.com
Adding siso.example.com to hc-siso... done
 ▸    WARNING: Configure your app's DNS provider to point to the DNS Target 
 ▸    hc-siso.herokuapp.com.
 ▸    For help, see https://devcenter.heroku.com/articles/custom-domains
$ 
$ heroku domains
=== hc-siso Heroku Domain
hc-siso.herokuapp.com

=== hc-siso Custom Domains
Domain Name    DNS Target
----------------  ---------------------
siso.example.com  hc-siso.herokuapp.com
$ 
```

위와 같이, `domains` 부명령을 이용하여 현재 지정된 Domain을 확인할 수
있고, 새로운 Domain을 지정할 수도 있다. 위와 같이, 이제 새로운 Domain이
설정되었기 때문에, 사용자의 DNS 서비스 설정에서 해당 Domain이 이 App의
HerokuApp 도메인을 바라보도록 `CNAME` 등을 이용하여 정상적으로 설정해
준다면 이 새로 할당한 이름을 이용하여 App에 접근할 수 있게 된다.

```console
$ host siso.example.com
siso.example.com is an alias for hc-siso.herokuapp.com.
hc-siso.herokuapp.com is an alias for us-east-1-a.route.herokuapp.com.
us-east-1-a.route.herokuapp.com has address 10.10.10.10
$ 
```

위의 주소추적에서 볼 수 있듯이, Cloud Computing Instance에 대한 접근은
자유롭게 흘러가는 구름 속의 물방울에 기어이 좌표(IP)를 붙이는 것이 아닌
논리적인 DNS의 연결고리를 통한 접근성으로 제공되어야 한다.

{:.point}
Service Address
: 흘러가는 구름 속의 무의미한 IP 주소가 아닌 논리적 DNS의 연결고리



{:#closing}
# 마무리

이상으로, Heroku에 App을 배포하는 과정에서 겪을 수 있는 문제를 중심으로
배포 과정을 정리해 봤다. 다양한 시행착오를 경험했으니...
다음에는 쉽게 가자!



{:#appendix-pricing-and-plan}
## 참고: 사용비용과 Plan

좀 다른 얘기인데, 지금 올린 이 App은 Free Dynos를 사용하여 무료로
서비스를 받는 것이다. 그래서 보면, 아래 그림에서 보는 바와 같이
하루 24시간 중 18시간만 사용할 수 있도록 제한되어 있다.

![](/attachments/heroku-siso-04-free-plan.png){:.fit.dropshadow}

공짜가 아닌 plan을 보면, 아래와 같이 Hobby, Standard, Performance 등의
plan이 존재하고 각각의 자원 규모에 따라 비용이 발생하게 된다.

![](/attachments/heroku-siso-05-plans.png){:.fit.dropshadow}

Professional로 분류되어 있는 Standard의 가장 저렴한 Plan은 비용이
월간 $25이며, 4년 TCO로 환산하면 $1,200. 우리 돈으로 환산하면 약
140여 만원에 달하는 금액이다. 1 Dyno의 성능이 어느정도 되는지 확인이
되어야 하겠지만, 기반 인프라 운영과 WAS 구성 등의 실행환경 운영을
완전히 제거할 수 있는 PaaS 서비스라는 점을 생각하면, 대충 TCO가
나올 것도 같다. :-)

---

끝!

![](/assets/logos/heroku-mark.png){:.fit.dropshadow}
