---
title: Ember CLI 환경 구성하기
image: /attachments/20151209-embercli-npm-nodejs.png
tags: Ember.js Node.js 
categories: ["development"]
date: 2015-12-09 11:16:25+09:00
---
이 글은 NVM, Node Version Manager를 사용하여 Ubuntu 15.04 환경에서 Node.js와
npm 환경을 간단하게 구성하는 과정을 정리한 글이며, 궁극적으로 npm을 이용하여
Ember-CLI 환경을 구성하고 Ember.js 프로젝트를 진행할 수 있는 환경을 완성하는
과정의 기록이다.

![](/attachments/20151209-embercli-npm-nodejs.png){:.fit.dropshadow}

## 시대의 변화와 나의 목표

지난 겨울, 오랜만에 개발이 끼어있는 프로젝트를 진행했다. 이 과정에서 **Client
영역의 역할을 강화**하고, 동시에 **Backend를 API Service 형태로 표준화**하여
향후 **"조각난 단위 서비스"의 조합으로 "통합 운영관리 환경"을 구성**할 수 있는
기반을 만들고자 했고 이를 위한 표준 Client 요소로 Ember.js를 선택했다.

이 과정에서 다음과 같은 개념, Paradigm을 결합/정제하여 사용했는데, 이 구성에
대한 내용은 다음에 기회가 되면 정리를 하려고 한다.

* Backend as a Service API
* API-First Design
* Client-side MVC
* Micro-Service Architecture

### Ember, Ember-CLI 그리고 Node.js

[Ember.js](http://emberjs.com/)는
홈페이지에 "A framework for creating *ambitious* web applications"라는
표어를 걸고 있다. 말 그대로 Web Application을 개발하기 위한 프레임워크다.
다만, 기존에 익숙한 "프레임워크" 개념과 대비되는 내용은, 이것이 Server 측에
Runtime과 함께 구성되는 형태의 것이 아니라 **Client 측에서 동작하는 MVC
모델을 제공**한다는 점이다. 즉, 서버로부터 App을 Download한 후 Ember.js
App이 동작하게 되면, App 내부에 존재하는 Adapter에 의해 Server가 제공하는
Data를 내려받아 App 내부의 Model로 재구성한 후, 각종 Control에 의해
Client 측에서 업무를 수행하게 되는 것이다. 물론, 보존되어야 하는 결과는
다시 Adapter를 통해 Server 측으로 전송/저장된다.

[Ember-CLI](http://ember-cli.com/)는
이러한 **Ember.js Application을 쉽게 구성할 수 있도록 돕는 개발환경**이다.
개인적인 경험으로 보면, 이런 유형의 개발환경은 Ruby on Rails가 처음이었던
것 같은데, Rails에 대한 경험이 있다면 Ember-CLI의 역할을 쉽게 이해할 수
있을 것 같다.

RoR 프로젝트를 시작할 때 `rails new`와 같은 명령을 이용하여 App Skeleton을
쉽게 구성하고, 역시 `rails generate` 명령을 이용하여 Model, Controller,
그리고 View의 기본 골격을 표준 코드와 함께 만들어낼 수 있었다.  
Ember-CLI 역시, 이와 유사하게 Ember App을 시작하기 위한 골격을 만들어주고,
App 안에서 Model, Controller 등 구성요소를 쉽게 생성할 수 있도록 도와준다.
RoR과 차이가 있다면 Ember-CLI는 간단한 시험용 Web Server가 내장되어 있을
뿐, 별도의 Runtime이 제공되지 않는다.

앞서 잠깐 얘기한 바와 같이, Ember는 최종적으로 만들어진 App이 Client 쪽에
Download가 된 후 Javascript가 지원되는 Browser 위에서 구동되기 때문에,
Server 측에서는 단지 Static한 파일을 제공할 뿐, 별도의 Runtime이라는 것이
존재하지 않는 것이다.

[npm](https://www.npmjs.com)은
**Node.js에 포함되어 있는 패키지 관리도구**이다. 이름을 풀면, Node.js
Package Manger 쯤 될 것 같은데, 홈페이지 머릿글에는 "npm is the package
manager for A,B,C,D,... javascript." 라고 표현하고 있다. 어쩌면 Node.js의
기세를 알려주는 부분인데, 2015년 12월 8일 오늘의 설명은 213,112개의
패키지를 제공한다고 한다.  
20만 패키지 중의 하나인 Ember-CLI는 Node.js 기반으로 동작하는 도구로,
바로 이 npm을 통하여 설치를 하게 된다.

[Node.js](https://nodejs.org)는
뭐 말이 필요없을 것 같다.

> Node.js® is a JavaScript runtime built on Chrome's V8 JavaScript engine.
> Node.js uses an event-driven, non-blocking I/O model that makes it
> lightweight and efficient. Node.js' package ecosystem, npm, is the
> largest ecosystem of open source libraries in the world.

아무튼, Node.js는 **Javascript가 바로 지금 IT의 화두로 다시 떠오르는 현상의
일등공신**이며, 일단 이 글에서는 Ember-CLI를 동작하기 위한 기반환경이다.

[NVM](https://github.com/creationix/nvm)은
Node.js Version Manager를 줄인 이름으로, Ember.js, Ember-CLI, 또는 Node.js
환경구성을 위한 필수요소는 아니다. 단지, RedHat, Ubuntu 등의 OS 제공자에
의해 OS와 함께 배포되는 (아마도 오래된) 버전이 아닌 Node.js가 직접 제공하는
최신버전 또는 공식버전을 OS의 패키지 관리체계와 독립적으로 설치하고 활용하기
위한 도구이다.

Node.js 환경을 구성하는 방식은 여러가지가 있는데, 간략하게 보았을 때, 각각
다음과 같은 특성을 갖고 있다.

{:.fit.styled}
| 방식 | 버전 | 장점 |
|:-----|:-----|:-----|
| OS 표준 패키지 사용 | OS 제공자가 정한 버전 | 설치가 간단하고 익숙함 |
| NodeSource Node.js Binary Distributions | 최신 버전 | 역시 익숙함 |
| NodeSource Docker Images | 최신 버전 | 쉽게 Docker와 연계 |
| Node.js Version Manager | 다양한 버전 | 동시에 다양한 버전 활용 |

필요에 따라, NVM외에도 다음의 추가 옵션을 고민해볼 수 있다.

* [NodeSource Node.js Binary Distributions](https://github.com/nodesource/distributions)
* [NodeSource Docker Images](https://github.com/nodesource/docker-node)
* [ansible-nodejs-role](https://github.com/nodesource/ansible-nodejs-role)

길었는데, 이제 실제의 설치과정이다.



## Ember-CLI 환경 구성

Ember-CLI의 설치는 다음과 같은 순서로 진행된다.

1. nvm 설치
1. nvm을 통하여 Node.js 설치 (npm이 함께 제공됨)
1. npm을 통하여 Ember-CLI 설치

### 기본 환경 준비

먼저, 다음과 같은 명령으로 기본적인 Build가 가능한 환경을 구성해준다.

{% highlight console %}
$ sudo apt-get install build-essential libssl-dev
{% endhighlight %}


### nvm의 설치

nvm은 github repository를 통하여 설치스크립트를 내려받아 실행하는 형태로
설치가 진행되며, 설치 과정에서 repository cloning을 하는 구조로 되어있다.

다음과 같은 명령으로, 최신 버전의 nvm을 설치해준다.

{% highlight console %}
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.29.0/install.sh | bash
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  7731  100  7731    0     0  25393      0 --:--:-- --:--:-- --:--:-- 25430
=> Downloading nvm from git to '/home/sio4/.nvm'
=> Cloning into '/home/sio4/.nvm'...
remote: Counting objects: 4168, done.
remote: Compressing objects: 100% (23/23), done.
remote: Total 4168 (delta 10), reused 0 (delta 0), pack-reused 4145
Receiving objects: 100% (4168/4168), 1.05 MiB | 226.00 KiB/s, done.
Resolving deltas: 100% (2418/2418), done.
Checking connectivity... done.
* (detached from v0.29.0)
  master

=> Appending source string to /home/sio4/.bashrc
=> Close and reopen your terminal to start using nvm
$ 
{% endhighlight %}

위와 같이, `curl` 명령으로 내려받은 스크립트를 실행시키면, 실행시킨 사용자
**Home아래의 `.nvm` 경로에 repository cloning**이 이루어진다.

설치된 내용을 확인해보면 다음과 같다.

{% highlight console %}
$ nvm --version
0.29.0
$ du -sh .nvm
2.2M	.nvm
$ nvm version-remote node
v5.1.1
$ nvm ls-remote node|tail -5
         v4.2.2
         v4.2.3
         v5.0.0
         v5.1.0
         v5.1.1
$ 
{% endhighlight %}

맨 처음의 `--version` 옵션으로 설치된 `nvm` 명령의 버전확인이 가능하다.
두 번째 명령으로 확인한 바와 같이, 이 패키지가 시스템에 차지하는
footprint는 약 2MB 정도이다.  
세 번째 명령과 네 번째 명령으로, 원격 저장소에서 제공하는 Node.js의
최신 버전과 제공하는 모든 버전을 각각 확인할 수 있다.

추가로, 위의 설치과정의 맨 끝을 보면, `.bashrc`에 뭔가 추가했다는 내용이
나온다. 그 내용은 아래와 같으며, `nvm` 환경 초기화를 위한 구문이다.

{% highlight bash %}
export NVM_DIR="/home/sio4/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"  # This loads nvm
{% endhighlight %}


### `node.js`의 설치

이제 `node.js`를 설치할 차례이다. 다음과 같이, 원하는 버전을 인수로 주고
`install` 부명령을 사용하게 되면 해당 버전의 `node.js`를 설치할 수 있다.

{% highlight console %}
$ nvm install v4.0.0
Downloading https://nodejs.org/dist/v4.0.0/node-v4.0.0-linux-x64.tar.xz...
######################################################################## 100.0%
WARNING: checksums are currently disabled for node.js v4.0 and later
Now using node v4.0.0 (npm v2.14.2)
$ nvm version
v4.0.0
$ nvm ls
->       v4.0.0
         system
node -> stable (-> v4.0.0) (default)
stable -> 4.0 (-> v4.0.0) (default)
iojs -> N/A (default)
$ 
{% endhighlight %}

설치 과정은 위와 같이, **바이너리 버전을 공식 사이트로부터 내려받아서
풀어주는** 행태로 진행된다.

앞서 `ls-remote` 부명령이 원격지의 제공 가능한 모든 버전을 보여준 것과 같이,
`ls` 부명령은 현재 시스템에 설치된 사용 가능한 모든 버전의 목록을 보여준다.
여기서 `system`은 시스템에 설치된 OS 제공자의 버전을 말하며 앞에 화살표가
붙은 `v4.0.0`은 `nvm`에 의해 설치한 버전이며 현재 선택된 버전임을 뜻한다.

이제 실제의 명령을 실행해서 적용된 버전을 확인해보자.

{% highlight console %}
$ node --version
v4.0.0
$ npm --version
2.14.2
$ which node
/home/sio4/.nvm/versions/node/v4.0.0/bin/node
$ which npm
/home/sio4/.nvm/versions/node/v4.0.0/bin/npm
$ 
{% endhighlight %}

이렇게, `node` 명령을 실행했을 때, 원했던 바와 같이 4.0 버전이 실행되는 것을
볼 수 있고, `npm` 역시 같이 사용 가능한 상태로 있음을 볼 수 있다. 또한,
`which` 명령을 이용하여 어떤 경로의 실행파일이 실행되는지도 확인이 가능하다.

### `ember-cli`의 설치, 맛보기 (따라하지 말자)

`npm install` 명령을 사용하여 다음과 같이 `ember-cli`를 설치할 수 있다.
이 작업은 `nvm`과는 별개의 `npm` 세상의 기능이다.  아래와 같은 명령을
수행하여 패키지를 설치하게 되면, **현재경로 아래**에 `node_modules` 라는
이름의 경로가 생성되고 이 안에 `ember-cli`가 설치된다.

{% highlight console %}
$ npm install ember-cli
npm WARN deprecated lodash-node@2.4.1: This package is no longer maintained. See its readme for upgrade details.
npm WARN deprecated lodash@2.4.2: lodash@<3.0.0 is no longer maintained. Upgrade to lodash@^3.0.0
npm WARN deprecated lodash-node@3.10.1: This package is no longer maintained. See its readme for upgrade details.
npm WARN deprecated lodash@2.3.0: lodash@<3.0.0 is no longer maintained. Upgrade to lodash@^3.0.0
ember-cli@1.13.13 node_modules/ember-cli
├── ember-cli-is-package-missing@1.0.0
├── ember-cli-path-utils@1.0.0
├── ember-cli-test-info@1.0.0
├── ember-cli-string-utils@1.0.0
├── ember-cli-get-dependency-depth@1.0.0
<...>
$ 
{% endhighlight %}

설치 후, 디스크 사용량을 보면 아래와 같다.

{% highlight console %}
$ du -sh ~/.nvm ~/.npm node_modules
43M	/home/sio4/.nvm
42M	/home/sio4/.npm
143M	node_modules
$ 
{% endhighlight %}

위에서 보는 바와 같이, `~/.nvm`에는 `nvm` 자체와 내려받은 버전의 `node.js`가
차지하는 용량 만큼이 사용되며, `~/.npm`은 `npm`에 의해 내려받아진 패키지가
사용하는 만큼 크기가 증가한다. 최종적으로, 내려받아진 패키지는 사용 가능한
형태로 풀려서 `node_modules`에 저장되게 된다.

문제는, 이렇게 설치된 `ember-cli` 패키지는 현재의 프로젝트, 현재 경로에
고립되게 되며 Ember-CLI의 특성과는 다른 구성이 된다. (`ember-cli` 명령은
프로젝트 내부에서도 자주 실행되지만, 그에 앞서 프로젝트 자체를 생성하는
용도가 매우 크기 때문에...)

### Global 옵션으로 `ember-cli` 설치

다음과 같이, `npm install` 명령을 `-g` 옵션과 함께 실행해주면 패키지의
**설치 Scope을 "프로젝트"에서 "Global"로** 옮겨가게 할 수 있다.
즉, 설치되는 파일의 저장 위치가 현재 경로로부터 Node.js 설치 Tree 아래로
옮겨가게 되고 특정 프로젝트에 종속적인 것이 아닌 시스템(nvm 개념 하에서는
특정 버전) 전역에서 사용 가능하도록 설치를 할 수 있게 된다. (output이
길지만 기록을 위해...)

{% highlight console %}
$ npm -g install ember-cli
npm WARN deprecated lodash-node@2.4.1: This package is no longer maintained. See its readme for upgrade details.
npm WARN deprecated lodash-node@3.10.1: This package is no longer maintained. See its readme for upgrade details.
/home/sio4/.nvm/versions/node/v4.0.0/bin/ember -> /home/sio4/.nvm/versions/node/v4.0.0/lib/node_modules/ember-cli/bin/ember
ember-cli@1.13.13 /home/sio4/.nvm/versions/node/v4.0.0/lib/node_modules/ember-cli
├── ember-cli-is-package-missing@1.0.0
├── ember-cli-path-utils@1.0.0
├── ember-cli-test-info@1.0.0
├── ember-cli-string-utils@1.0.0
├── ember-cli-get-dependency-depth@1.0.0
├── clean-base-url@1.0.0
├── ember-cli-normalize-entity-name@1.0.0
├── silent-error@1.0.0
├── amd-name-resolver@0.0.2
├── fs-monitor-stack@1.1.0
├── escape-string-regexp@1.0.3
├── pleasant-progress@1.1.0
├── is-git-url@0.2.3
├── isbinaryfile@2.0.4
├── ember-cli-copy-dereference@1.0.0
├── broccoli-source@1.1.0
├── exists-sync@0.0.3
├── promise-map-series@0.2.2
├── diff@1.4.0
├── node-modules-path@1.0.1
├── broccoli-viz@2.0.1
├── through@2.3.8
├── bower-endpoint-parser@0.2.2
├── walk-sync@0.1.3
├── broccoli-merge-trees@1.0.0
├── inflection@1.8.0
├── node-uuid@1.4.7
├── exit@0.1.2
├── broccoli-sane-watcher@1.1.4 (broccoli-slow-trees@1.1.0)
├── symlink-or-copy@1.0.1 (copy-dereference@1.0.0)
├── temp@0.8.1 (rimraf@2.2.8)
├── debug@2.2.0 (ms@0.7.1)
├── nopt@3.0.6 (abbrev@1.0.7)
├── http-proxy@1.12.0 (eventemitter3@1.1.1, requires-port@0.0.1)
├── findup@0.1.5 (commander@2.1.0, colors@0.6.2)
├── semver@4.3.6
├── chalk@1.1.0 (supports-color@2.0.0, ansi-styles@2.1.0, has-ansi@2.0.0, strip-ansi@3.0.0)
├── glob@5.0.13 (path-is-absolute@1.0.0, inherits@2.0.1, once@1.3.3, inflight@1.0.4)
├── readline2@0.1.1 (mute-stream@0.0.4, strip-ansi@2.0.1)
├── morgan@1.6.1 (on-headers@1.0.1, basic-auth@1.0.3, depd@1.0.1, on-finished@2.3.0)
├── rsvp@3.1.0
├── findup-sync@0.2.1 (glob@4.3.5)
├── minimatch@2.0.10 (brace-expansion@1.1.2)
├── broccoli-kitchen-sink-helpers@0.2.9 (mkdirp@0.5.1)
├── resolve@1.1.6
├── git-repo-info@1.1.2
├── portfinder@0.4.0 (async@0.9.0, mkdirp@0.5.1)
├── configstore@1.2.1 (os-tmpdir@1.0.1, object-assign@3.0.0, graceful-fs@4.1.2, uuid@2.0.1, osenv@0.1.3, xdg-basedir@2.0.0, write-file-atomic@1.1.4, mkdirp@0.5.1)
├── cpr@0.4.2 (graceful-fs@4.1.2, mkdirp@0.5.1, rimraf@2.4.4)
├── sane@1.3.0 (watch@0.10.0, minimist@1.2.0, exec-sh@0.2.0, walker@1.0.7, minimatch@0.2.14, fb-watchman@1.6.0)
├── compression@1.6.0 (bytes@2.1.0, on-headers@1.0.1, vary@1.1.0, compressible@2.0.6, accepts@1.3.0)
├── broccoli-funnel@1.0.1 (array-equal@1.0.0, blank-object@1.0.1, path-posix@1.0.0, fs-tree-diff@0.3.1, fast-ordered-set@1.0.2, walk-sync@0.2.6, mkdirp@0.5.1, rimraf@2.4.4)
├── broccoli-plugin@1.2.1 (rimraf@2.4.4)
├── fs-extra@0.22.1 (jsonfile@2.2.3, graceful-fs@4.1.2, rimraf@2.4.4)
├── broccoli-config-replace@1.1.0 (broccoli-kitchen-sink-helpers@0.3.1, fs-extra@0.24.0)
├── yam@0.0.18 (lodash.merge@3.3.2, fs-extra@0.16.5)
├── broccoli-config-loader@1.0.0 (broccoli-caching-writer@2.2.1)
├── express@4.13.3 (escape-html@1.0.2, merge-descriptors@1.0.0, array-flatten@1.1.1, cookie@0.1.3, utils-merge@1.0.0, cookie-signature@1.0.6, parseurl@1.3.0, methods@1.1.1, fresh@0.3.0, range-parser@1.0.3, vary@1.0.1, path-to-regexp@0.1.7, content-type@1.0.1, etag@1.7.0, content-disposition@0.5.0, serve-static@1.10.0, depd@1.0.1, on-finished@2.3.0, qs@4.0.0, finalhandler@0.4.0, proxy-addr@1.0.9, send@0.13.0, accepts@1.2.13, type-is@1.6.10)
├── ember-cli-preprocess-registry@1.1.0 (process-relative-require@1.0.0, broccoli-clean-css@0.2.0)
├── quick-temp@0.1.3 (mktemp@0.3.5, rimraf@2.2.8, underscore.string@2.3.3)
├── tiny-lr@0.2.0 (parseurl@1.3.0, qs@5.1.0, livereload-js@2.2.2, faye-websocket@0.10.0, body-parser@1.14.1)
├── merge-defaults@0.2.1 (lodash@2.4.2)
├── ember-router-generator@1.1.1 (recast@0.9.18)
├── markdown-it@4.3.0 (uc.micro@1.0.0, linkify-it@1.2.0, mdurl@1.0.1, entities@1.1.1, argparse@1.0.3)
├── lodash@3.10.1
├── bower-config@0.6.1 (osenv@0.0.3, graceful-fs@2.0.3, optimist@0.6.1, mout@0.9.1)
├── broccoli@0.16.8 (broccoli-slow-trees@1.1.0, copy-dereference@1.0.0, mime@1.3.4, commander@2.9.0, rimraf@2.4.4, connect@3.4.0, handlebars@3.0.3)
├── core-object@0.0.2 (lodash-node@2.4.1)
├── broccoli-sourcemap-concat@2.0.2 (mkdirp@0.5.1, broccoli-caching-writer@2.2.1, lodash.uniq@3.2.2, fast-sourcemap-concat@0.2.6, lodash-node@2.4.1)
├── inquirer@0.5.1 (mute-stream@0.0.4, async@0.8.0, chalk@0.4.0, lodash@2.4.2, cli-color@0.3.3)
├── markdown-it-terminal@0.0.2 (ansi-styles@2.1.0, cli-table@0.3.1, cardinal@0.5.0, lodash-node@3.10.1)
├── leek@0.0.18
├── testem@0.9.11 (styled_string@0.0.1, did_it_work@0.0.6, growl@1.8.1, printf@0.2.3, fileset@0.2.1, charm@1.0.0, xmldom@0.1.19, commander@2.9.0, mustache@2.2.0, async@1.5.0, mkdirp@0.5.1, rimraf@2.4.4, backbone@1.2.3, cross-spawn-async@2.1.1, tap-parser@1.2.2, consolidate@0.13.1, js-yaml@3.4.6, fireworm@0.6.6, npmlog@1.2.1, socket.io-pure@1.3.11)
├── broccoli-babel-transpiler@5.5.0 (clone@0.2.0, json-stable-stringify@1.0.0, broccoli-persistent-filter@1.1.6, babel-core@5.8.34)
├── npm@2.14.10
└── bower@1.7.0
$ 
{% endhighlight %}

설치가 끝면 `list` 명령으로 원하는 패키지가 의존성 관계에 있는 다른 패키지와
함께 설치된 계층 구조를 확인할 수 있다.  눈여겨 볼 부분은, 설치 위치가 현재
구동 중인 Node.js 버전 아래인 `~/.nvm/versions/node/v4.0.0/lib` 라는 점이다.

{% highlight console %}
$ npm -g list
/home/sio4/.nvm/versions/node/v4.0.0/lib
├─┬ ember-cli@1.13.13
│ ├── amd-name-resolver@0.0.2
│ ├─┬ bower@1.7.0
│ │ ├── abbrev@1.0.7
│ │ ├── archy@1.0.0
│ │ ├─┬ bower-config@1.3.0
<...>
$ 
{% endhighlight %}

각 경로 별 사용량은 아래와 같다. (현재경로에 설치되는 것은 없다.)

{% highlight console %}
$ du -sh ~/.nvm ~/.npm 
185M	/home/sio4/.nvm
42M	/home/sio4/.npm
$ 
{% endhighlight %}

또하나 확인할 부분은, 설치 중 출력의 맨 윗부분에 있는 다음 줄이다.

{% highlight console %}
/home/sio4/.nvm/versions/node/v4.0.0/bin/ember -> /home/sio4/.nvm/versions/node/v4.0.0/lib/node_modules/ember-cli/bin/ember
{% endhighlight %}

이 줄이 설명하고 있는 내용은, `ember-cli` 패키지에서 제공하는 `ember`라는
명령어가 Node.js 버전의 `bin` 안으로 Link되었다는 점이다. 이 과정을 통해서
**이제 사용자는 `ember` 명령을 Direct로 실행할 수 있게 되었다.**  
오예! 그럼 드디어 Ember를 시작할 차례?



## Ember-CLI로 Ember App 시작하기

앞서 얘기했듯이, Ember-CLI의 사용 방식과 개발 흐름은 RoR의 그것과 유사하다.
다음과 같이 `new` 부명령을 이용하여 **Application의 Skeleton**을 만들 수 있다.

{% highlight console %}
$ ember new hardened-layer --skip-git 
version: 1.13.13
Could not find watchman, falling back to NodeWatcher for file system events.
Visit http://www.ember-cli.com/user-guide/#watchman for more info.
installing app
  create .bowerrc
  create .editorconfig
  create .ember-cli
  create .jshintrc
  create .travis.yml
  create .watchmanconfig
  create README.md
  create app/app.js
  create app/components/.gitkeep
  create app/controllers/.gitkeep
  create app/helpers/.gitkeep
  create app/index.html
  create app/models/.gitkeep
  create app/router.js
  create app/routes/.gitkeep
  create app/styles/app.css
  create app/templates/application.hbs
  create app/templates/components/.gitkeep
  create bower.json
  create config/environment.js
  create ember-cli-build.js
  create .gitignore
  create package.json
  create public/crossdomain.xml
  create public/robots.txt
  create testem.json
  create tests/.jshintrc
  create tests/helpers/destroy-app.js
  create tests/helpers/module-for-acceptance.js
  create tests/helpers/resolver.js
  create tests/helpers/start-app.js
  create tests/index.html
  create tests/integration/.gitkeep
  create tests/test-helper.js
  create tests/unit/.gitkeep
  create vendor/.gitkeep
Installed packages for tooling via npm.
Installed browser packages via Bower.
$ 
{% endhighlight %}

명령행을 보면 `--skip-git` 옵션을 준 것을 볼 수 있는데, Ember-CLI는 App을
만들자마자 App Tree 전체를 Git로 관리하도록 구성해버린다. 이게 편할 수도
있겠지만 나는 직접 버전 관리를 하는 것을 좋아하기 때문에 이 과정을 Skip할
수 있도록 했다.

출력의 마지막 두 줄을 보면, npm과 Bower를 이용하여 패키지 설치를 한다는
구문이 있다. Ember-CLI는 App 구성에 필요한 다양한 Node.js 패키지와
Bower로 관리되는 Javascript 요소들을 함께 설치해준다.

설치된 모습을 보면,

{% highlight console %}
$ ls -F
README.md   bower_components/   node_modules/  testem.json
app/        config/             package.json   tests/
bower.json  ember-cli-build.js  public/        vendor/
$ du -sh *
4.0K	README.md
52K	app
4.0K	bower.json
14M	bower_components
8.0K	config
4.0K	ember-cli-build.js
218M	node_modules
4.0K	package.json
12K	public
4.0K	testem.json
44K	tests
4.0K	vendor
$ 
{% endhighlight %}

이렇게 `bower_components`와 `node_modules`가 부풀어 있는 것을 볼 수 있고,
그 안에 아래와 같은 다양한 패키지가 설치된 것을 확인할 수 있다.

{% highlight console %}
$ ls node_modules
broccoli-asset-rev/                    ember-cli-inject-live-reload/
ember-cli/                             ember-cli-qunit/
ember-cli-app-version/                 ember-cli-release/
<...>
$ ls bower_components
ember/                  ember-load-initializers/    jquery/
ember-cli-shims/        ember-qunit/                loader.js/
ember-cli-test-loader/  ember-qunit-notifications/  qunit/
<...>
$ 
{% endhighlight %}

마지막으로, 구성한 App을 시험해본다. Ember-CLI는 `serve` 부명령을 이용해서
개발 과정에서 시험용으로 사용할 수 있는 내장 Web Server를 구동할 수 있다.

{% highlight console %}
$ ember serve
version: 1.13.13
Could not find watchman, falling back to NodeWatcher for file system events.
Visit http://www.ember-cli.com/user-guide/#watchman for more info.
Livereload server on http://localhost:49152
Serving on http://localhost:4200/

Build successful - 4329ms.

Slowest Trees                                 | Total               
----------------------------------------------+---------------------
ConcatWithMaps: Concat: Vendor                | 3300ms              

Slowest Trees (cumulative)                    | Total (avg)         
----------------------------------------------+---------------------
ConcatWithMaps: Concat: Vendor (1)            | 3300ms              
Babel (6)                                     | 527ms (87 ms)       

^C$
{% endhighlight %}

위의 출력을 보면, 4200 포트를 이용하여 서비스를 제공하면서, Livereload를
위한 포트가 함께 열리는 것을 확인할 수 있다. 또한, 이 App을 빌드하는
과정에 소요된 시간 정보를 사용자에게 알려줘서 개발 과정에서 도움이 될
수 있도록 하고 있다.

이제 Web Browser를 이용하여 위의 `http://localhost:4200/`로 접속해보자.

![](/attachments/20151209-ember-browser.png){:.fit.dropshadow}

> 떳다!

화면 아래쪽에 표시된
[Ember Inspector](https://addons.mozilla.org/ko/firefox/addon/ember-inspector/?src=userprofile)
부분은 별도로 구성한 Firefox Addon 이니까 나타나지 않더라도 실망하지
않아도 된다. (그러나 이게 있으면 개발이 휠씬 편해질테니, 필수로 설치하길
바란다.)

끝.




## 참고

### 참고 1: 링크로 구성하기

앞서 얘기했던 프로젝트 단위의 설치를 할 경우, `install` 부명령 대신 `link`
부명령을 사용하게 되면 프로젝트 경로 아래의 `node_modules`는 실제 패키지가
아닌 중앙에 설치된 패키지의 link로 채워지게 된다. (동일한 패키지를 여러
프로젝트에서 사용한다면 이런 방식으로 용량을 아낄 수 있다.)

{% highlight console %}
$ mkdir project-a
$ cd project-a
$ npm link ember-cli
<...>
$ ls -l node_modules
합계 4
lrwxrwxrwx 1 sio4 61 12월  8 13:12 ember-cli -> ../../../.nvm/versions/node/v4.0.0/lib/node_modules/ember-cli
$ 
{% endhighlight %}

이런 상황에서 각 경로의 사용량을 확인해보면, 위의 Global 설치와 유사한 것을
확인할 수 있다.

{% highlight console %}
$ du  -sh ~/.nvm ~/.npm node_modules/
185M	/home/sio4/.nvm
45M	/home/sio4/.npm
12K	node_modules/
$ 
{% endhighlight %}


### 참고 2: 디렉터리 내용 보기

Global 모드나, Link 모드로 설정된 경우, 각 경로에는 아래와 같은 형태로
파일들이 저장되어 있음을 확인할 수 있다.

* npm 경로: 내려받은 패키지 파일
* nvm 아래 버전 경로: 패키지의 실행 가능한 설치본

설명보다 명령의 결과가 깔끔하다.

{% highlight console %}
$ ls ~/.npm/ember-cli/1.13.13/
package  package.tgz
$ ls ~/.nvm/versions/node/v4.0.0/lib/node_modules/ember-cli/
ADDON_HOOKS.md      CONTRIBUTING.md  TRANSITION.md  blueprints  node_modules
ARCHITECTURE.md     LICENSE.md       appveyor.yml   dev         package.json
CHANGELOG.md        README.md        assets         docs        tests
CODE_OF_CONDUCT.md  RELEASE.md       bin            lib
$ ls ~/.nvm/versions/node/v4.0.0/lib/node_modules/ember-cli/node_modules/
amd-name-resolver                findup-sync
bower                            fs-extra
bower-config                     fs-monitor-stack
<...>
$ 
{% endhighlight %}



### 참고 3: 사용할 버전 고르기

`nvm`를 이용한 설치의 특성 중 하나는, 이것이 단순히 하나의 환경을 위한
패키지 관리가 아니라 다양한 환경을 위한 **실행 버전 관리**라는 점이다.

모든 설치가 끝났음에도 불구하고 새롭게 쉘을 열어주면, 그 창에서 다시
`node`를 실행하면 OS 제공자에 의해 설치된 `system` 버전이 실행되게 되는
것을 알게 될 것이다.

{% highlight console %}
$ node --version
v0.10.25
$ nvm ls
         v4.0.0
->       system
node -> stable (-> v4.0.0) (default)
stable -> 4.0 (-> v4.0.0) (default)
iojs -> N/A (default)
$ 
{% endhighlight %}

위와 같이, `node --version` 명령으로 확인해보면 새 세션에서는 시스템에
기본 설치된 것이 작동하게 된다. `nvm ls` 명령으로 확인해보면 역시,
`system` 버전이 선택되어 있는 것을 볼 수 있다. 이 상태라면, 아래와 같이
`use` 부명령을 사용하여 이 세션에서 사용할 `node.js` 버전을 고를 수 있다.

{% highlight console %}
$ nvm use v4.0.0
Now using node v4.0.0 (npm v2.14.2)
$ nvm ls
->       v4.0.0
         system
node -> stable (-> v4.0.0) (default)
stable -> 4.0 (-> v4.0.0) (default)
iojs -> N/A (default)
$ node --version
v4.0.0
$ npm --version
2.14.2
$ 
{% endhighlight %}

간단하지만 성가신 일이다. 이런 상황에서 새 세션에 대하여 기본적으로 사용할
버전을 지정하려면 `alias` 부명령을 사용하면 된다.


기본값 설정 전 상태

{% highlight console %}
$ nvm ls
         v4.0.0
->       system
node -> stable (-> v4.0.0) (default)
stable -> 4.0 (-> v4.0.0) (default)
iojs -> N/A (default)
$ 
{% endhighlight %}

현재 존재하는 alias 확인

{% highlight console %}
$ nvm alias
node -> stable (-> v4.0.0) (default)
stable -> 4.0 (-> v4.0.0) (default)
iojs -> N/A (default)
$ 
{% endhighlight %}

새로운 alias 생성 및 확인

{% highlight console %}
$ nvm alias default node
default -> node (-> v4.0.0)
$ nvm alias
default -> node (-> v4.0.0)
node -> stable (-> v4.0.0) (default)
stable -> 4.0 (-> v4.0.0) (default)
iojs -> N/A (default)
$ 
{% endhighlight %}

그리고 새 쉘 세션을 시작했을 때의 결과

{% highlight console %}
$ nvm ls
->       v4.0.0
         system
default -> node (-> v4.0.0)
node -> stable (-> v4.0.0) (default)
stable -> 4.0 (-> v4.0.0) (default)
iojs -> N/A (default)
$ 
{% endhighlight %}


### 참고 4: Ubuntu의 기본 node.js는 명령어가 `node`가 아닌 `nodejs`

Ubuntu는 Debian을 기반으로 하는 배포본인데, Debian 자체가 워낙 거인이다.
이미 `node`라는 이름의 패키지가 있기 때문에 Node.js의 명령어 이름은
원래 패키지 이름을 따라 `nodejs` 인데... 이게, Node.js의 명령어가
`node`임을 가정하고 제작된 다른 패키지들에게 혼선을 준다.

다음과 같은 명령을 통하여 `node`라는 명령을 내렸을 때 Node.js가 실행되도록
해줄 수 있다.

{% highlight console %}
$ sudo update-alternatives --install /usr/bin/node node /usr/bin/nodejs 99
update-alternatives: using /usr/bin/nodejs to provide /usr/bin/node (node) in auto mode
$ 
{% endhighlight %}


정말 끝!
