---
title: Hardened Layer, SoftLayer Custom Portal - Part 1
image: /attachments/20160116-hl-v1-servers.png
banner: /attachments/20160116-hl-v1-servers.png
tags: SoftLayer 클라우드컴퓨팅 Ember.js Ruby-on-Rails API As-a-Service Hardened-Layer
categories: ["development"]
date: Sat, 16 Jan 2016 02:55:00 +0900
---
SoftLayer API에 대하여 파악하고 그 한계나 사용 가능성 등에 대하여 검증하기
위한 목적으로 작은 프로젝트 하나를 진행해 봤다.  이름하여, Hardened Layer.

내 목적에 맞춰 Custom Portal을 작성하면서, 그 쓸모에 따라 **SoftLayer를 좀
더 보강한다는 의미로 "Hardened Layer"**라는 이름을 붙여봤지만 현재는 단순한
자원 Browsing 기능을 중심으로 하고 있어서 전혀 Hardening을 한 것은 없다.
다만, **기반 Data를 더 잘 이해하고 다룰 수 있게 된다면 그것이 Hardening의
시작**이 될 것이라는 정도로 의미를 둔다. :-)

Prototype 개발 목표는 다음과 같다.

* SoftLayer API의 구성을 이해한다.
* SoftLayer의 다양한 API 특성, 한계, 용도를 확인한다.
* SoftLayer API에서 제공하는 Dataset의 특성을 파악한다.
* SoftLayer API를 사용한 개발의 방향성을 찾아낸다.

{:.block-title}
Hardened Layer: Console - Virtual Servers

![](/attachments/20160116-hl-v1-servers.png){:.fit.downshadow}

## Hardened Layer 시리즈
{:.no_toc}

* Hardened Layer, SoftLayer Custom Portal - Part 1
* [Hardened Layer, SoftLayer Custom Portal - Part 2][HardenedLayer-Part2]

[HardenedLayer-Part2]:{% post_url development/2016-01-21-hardened-layer-part2 %}


## 목차
{:.no_toc}

* ToC
{:toc}

# 설계

이번 Prototype의 목표는 단순한 API 검증이므로 설계라고 할만한 것을 딱히
정하는 것이 의미가 없을 것 같다. 다만, 최종 목적을 조금이라도 반영해야
검증의 방향이 맞게 잡힐 것이므로 간단한 수준에서 방향성을 잡았다.

궁극적으로, Hardened Layer의 설계 방향은 다음과 같이 요약할 수 있다.

* Backend와 Frontend를 분리 개발하여 **1-Backend + N-Frontend** 구조를 갖춘다.
* Backend은 아래면에 SoftLayer I/F를 깔고 **윗면은 API 형태**로 개발한다.
* Backend는 원칙적으로 **Data를 소유하지 않고**, 필요 시 최소화하여 소유한다.
* 기본 Frontend는 **Console Application** 특성에 맞춰 개발한다.
* 기본 Frontend는 Browser 기반의 **Client MVC 개념**을 적용한다.

## 구조 설계

Hardened Layer는 앞서 말한 바와 같이, 자체 UI가 존재하지 않는 Server-side의
**API App**과 이것이 제공하는 API를 바탕으로 Client MVC 형태로 동작하는
**Console App**의 쌍으로 기본 구조를 설계하였다.

API App이 담당하는 기능은 SoftLayer API의 Response를 내 용도나 기준에
맞도록 재구성한 후 표준화된 REST/JSON API의 Endpoint를 제공하여, 이 표준을
따르는 API Request에 응답하는 역할을 한다.  Console App은 API 호출을
통하여 전달받은 Data를 Browser 내에서 Model화, 이 Model을 바탕으로 하여
각종 View를 제공하는 역할을 담당한다.

API App을 중심으로, 두 Module이 동작하는 방식은 아래와 같다.

```
Hardened Console->Hardened Layer: 계정정보 요청
Hardened Layer-->SoftLayer: 계정정보 요청 (SL API)
SoftLayer-->SoftLayer: 내부 작업
SoftLayer-->Hardened Layer: 계정정보 반환 (SL API)
Hardened Layer-->SoftLayer: 이미지 정보 요청 (SL API)
SoftLayer-->SoftLayer: 내부 작업
SoftLayer-->Hardened Layer: 이미지 정보 반환 (SL API)
Hardened Layer-->SoftLayer: VM 정보 요청 (SL API)
SoftLayer-->SoftLayer: 내부 작업
SoftLayer-->Hardened Layer: VM 정보 반환 (SL API)
Hardened Layer-->Hardened Layer: 정보 조합 (계정+이미지+VM)
Hardened Layer->Hardened Console: 조합된 정보 반환
Hardened Console->Hardened Console: Model화, View 제공
```
{:.diagram.tac.fit}

## API App 설계 기준

API Backend 방식으로 개발을 진행할 때, 우리가 얻을 수 있는 가장 큰 장점은
**One Source**로써의 API를 잘 개발했을 때, 그 위에 다양한 응용을 올릴 수
려 **Multi Use**할 수 있다는 점과, 초기 개발이나 유지보수를 하는 과정에서
각 모듈을 독립적인 진도로 개발할 수 있는 **개발 생산성**을 들 수 있다.
이러한, One Source Multi Use를 실현하고 생산성을 높이기 위하여 가장 중요한
기반은 잘 설계된 API일 것 이다.

이런 배경 하에서, 이번 프로젝트는 방향설정을 위한 Prototype이므로 필요에
따라 설계를 바꿔가면서 단계별 진도를 나갈 것이다. 일단, 다음과 같이 아주
기본적인 정의만 가지고 시작한다.

* API App의 첫번째 시험 버전은 Rails로 개발한다.
* Hardened Layer API의 통신계층은 REST 방식 하나만 제공한다.
* Hardened Layer API는 자료계층은 JSON-API 방식을 따른다.
* 단, 당장은 최종 설계가 아니므로 유연하게 자료계층을 시험한다.

## Console App 설계 기준

Console App은 두 가지 의미로 Prototype의 실험을 하려고 한다. 하나는,
단순 API Client로써 API의 동작확인 및 전달된 데이터가 사용하기 쉽게 잘
구조화된 것인지를 점검하는 것이고 다른 하나는 UI에서 가져갈 수 있는
기능의 범위가 어떻게 될 것인지를 사용성 관점에서 시험해보는 것이다.

일단, 다음과 같은 내용으로 출발점을 삼고자 한다.

* Hardened Layer Console의 개념 모델은 말 그대로 Console Application이다.
* Hardened Layer Console은 Ember.js를 이용한 MVC 형태로 개발된다.
* 제공되는 기능은 기본적인 CRUD의 구현과 조작 기능을 바탕으로 하되,
* 분석 개념을 가미한 확장된 View 제공의 시험에도 비중을 둔다.

뭐, 제대로 된 프로젝트도 아닌데,... 일단 짜자!

## 구현 순서

이제 앞서 설정한 기준에 맞춰 API App을 중심으로 한 연결 구조와 데이터
구조의 검증을 위한 기본 구조의 구현을 할 차례이다.

구현의 순서는 API App의 기본 구현을 먼저 완료한 후, Console App을
진행하는 것으로 하였다.  단순히 순차적으로 적을 수 밖에 없는 글의 한계
때문이 아니라, 앞서 말한 API Backend 방식을 채용함으로써 얻어지는 개발
독립성에 의한 효과라고 생각한다. 물론, 아주 작은 규모의 Prototype일
뿐이라는 한계 때문에 그 효과를 눈에 띄게 확인하기는 힘들다.
(반복되는 이야기지만, 이와 관련된 이야기를 뒤에서 잠깐 더 언급하려고
한다.)

# API App, Middle Man의 구성

SoftLayer API Endpoint와 Hardened Layer Console 사이에 놓일 API App은
Rails Application으로 개발하였다.  당연히, SoftLayer Ruby API로 개발이
진행되며 이 API의 특성에 대하여 파악하는 것을 겸한다.

먼저, 다음과 같이 Rails App의 뼈대를 만드는 것으로부터 시작한다.

## 뼈대 준비

다음과 같이, `rails new` 명령으로 뼈대를 만들어 준다. 이번 Prototype은
일종의 API Gateway로써 API 연동만을 고려할 뿐, 별도의 DBMS를 사용하지
않을 예정이므로 DB 관련 설정은 신경쓰지 않는다. 또한 Bundle은 Project
내부에 별도로 구성할 것이기 때문에 초기 생성에서는 생략하도록 지시한다.

```console
$ rails new hardened-layer --skip-bundle
      create  
      create  README.rdoc
      create  Rakefile
      <...>
      create  vendor/assets/javascripts/.keep
      create  vendor/assets/stylesheets
      create  vendor/assets/stylesheets/.keep
$ 
```

이제, 뼈대 안으로 들어가서, bundle 명령을 내려준다. 단, 번들된 Gem들이
시스템 전역 위치에 설치되지 않고 프로젝트 내부에 위치하도록 `--path`
옵션을 추가해 주었다. (Bundle되는 Gem의 상세한 내용도 기록으로 남기기
위하여, 긴 Output을 생략하지 않고 남겼다.)

```console
$ cd hardened-layer
$ bundle install --path vendor/bundle
Fetching gem metadata from https://rubygems.org/............
Fetching version metadata from https://rubygems.org/...
Fetching dependency metadata from https://rubygems.org/..
Resolving dependencies....
Installing rake 10.4.2
Installing i18n 0.7.0
Installing json 1.8.3 with native extensions
Installing minitest 5.8.3
Installing thread_safe 0.3.5
Installing tzinfo 1.2.2
Installing activesupport 4.2.5
Installing builder 3.2.2
Installing erubis 2.7.0
Installing mini_portile2 2.0.0
Installing nokogiri 1.6.7 with native extensions
Installing rails-deprecated_sanitizer 1.0.3
Installing rails-dom-testing 1.0.7
Installing loofah 2.0.3
Installing rails-html-sanitizer 1.0.2
Installing actionview 4.2.5
Installing rack 1.6.4
Installing rack-test 0.6.3
Installing actionpack 4.2.5
Installing globalid 0.3.6
Installing activejob 4.2.5
Installing mime-types 2.99
Installing mail 2.6.3
Installing actionmailer 4.2.5
Installing activemodel 4.2.5
Installing arel 6.0.3
Installing activerecord 4.2.5
Installing debug_inspector 0.0.2 with native extensions
Installing binding_of_caller 0.7.2 with native extensions
Using bundler 1.10.6
Installing byebug 8.2.1 with native extensions
Installing coffee-script-source 1.10.0
Installing execjs 2.6.0
Installing coffee-script 2.4.1
Installing thor 0.19.1
Installing railties 4.2.5
Installing coffee-rails 4.1.0
Installing concurrent-ruby 1.0.0
Installing multi_json 1.11.2
Installing jbuilder 2.3.2
Installing jquery-rails 4.0.5
Installing sprockets 3.5.2
Installing sprockets-rails 2.3.3
Installing rails 4.2.5
Installing rdoc 4.2.0
Installing sass 3.4.20
Installing tilt 2.0.1
Installing sass-rails 5.0.4
Installing sdoc 0.4.1
Installing spring 1.5.0
Installing sqlite3 1.3.11 with native extensions
Installing turbolinks 2.5.3
Installing uglifier 2.7.2
Installing web-console 2.2.1
Bundle complete! 12 Gemfile dependencies, 54 gems now installed.
Bundled gems are installed into ./vendor/bundle.
$ 
```

이제, Git Repository를 구성하고 나면, 코딩을 시작할 준비가 끝난다.

```console
$ echo "/vendor/bundle" >> .gitignore
$ git init
$ git add .
$ git commit -m "rails new and bundle install"
```


## 준비하기: SoftLayer 연동을 위한 준비

앞서 살짝 언급한 바와 같이, 이 Prototype은 Rails의 Model과 View를 사용하지
않으며 단순히 **Controller만 사용하여 API Gateway 형태로 개발**하게 된다.

이 단계에서는 `/api/v1/accounts`와 같은 형식의 URL로 REST 서비스를 제공하기
위하여 모든 Endpoint가 공통으로 사용하게 될 `login` 등의 Method를 담은
`ApiController`와 이 Class를 상속하여 Account 및 연계 정보를 제공하게 될
`AccountsController`를 작성한다.

아래와 같이, `generate`(`g`) 명령을 이용하여 Controller의 틀을 만든다.

```console
$ rails g controller api/api --no-javascripts --no-stylesheets
      create  app/controllers/api/api_controller.rb
      invoke  erb
      create    app/views/api/api
      invoke  test_unit
      create    test/controllers/api/api_controller_test.rb
      invoke  helper
      create    app/helpers/api/api_helper.rb
      invoke    test_unit
      invoke  assets
      invoke    coffee
      invoke    scss
$ rails g controller api/v1/accounts --no-javascripts --no-stylesheets
      create  app/controllers/api/v1/accounts_controller.rb
      invoke  erb
      create    app/views/api/v1/accounts
      <...>
      invoke  assets
      invoke    coffee
      invoke    scss
$ 
```

VCS 상에서 자동생성된 부분과 수정한 부분을 구분하기 위하여, 자동생성된
부분을 먼저 Commit해준다. (이건 나의 VSC 사용 습관일 뿐이므로 중요한
것은 아니고...)

```console
$ git add app/controllers/api/
$ git add app/helpers/api/
$ git add test/controllers/api/
$ git commit -m "g controllers for api"
```

### SoftLayer Ruby API Gem 추가

SoftLayer Ruby API를 사용하기 위하여, 해당 Gem을 Project에 추가해준다.
해당 Gem은 표준 Repository에 존재하므로 단순히 아래와 같이 Gemfile에
대당 항목을 추가해주고, bundle 명령만 내려주면 된다.

```console
$ echo -e "\n\ngem 'softlayer_api'" >> Gemfile
$ bundle 
Fetching gem metadata from https://rubygems.org/............
Fetching version metadata from https://rubygems.org/...
Fetching dependency metadata from https://rubygems.org/..
Resolving dependencies...
<...>
Installing configparser 0.1.4
Installing softlayer_api 3.2.0
Bundle complete! 13 Gemfile dependencies, 56 gems now installed.
Bundled gems are installed into ./vendor/bundle.
$ 
```

### SoftLayer 인증 설정

다음은 SoftLayer 인증에 대한 부분이다.  이 프로젝트가 실제로 사용하기
위한 것이라면 인증/권한에 대한 별도의 설계를 진행하여, 세션을 기반으로
적합한 권한이 할당되도록 인증 설계를 하는 것이 맞을 것이다. 다만,
여기서는 단순히 API를 검증하는 것이 목적이므로 API App의 설정을 통하여
단순하게 인증처리를 하려고 한다.

먼저, SoftLayer 인증을 포함하여 Application 설정을 담을 파일을 생성하고,
기동 시점에 그 파일을 읽어들일 수 있도록 `initializer`를 설정한다.

```console
$ cat > config/application.yml.template <<EOF
SL_USER: "@SL_USER@"
SL_API_KEY: "@SL_KEY@"
EOF
$ cat >> .gitignore <<EOF

/config/application.yml
EOF
$ cat > config/initializers/environment.rb <<EOF
Rails.application.config.before_configuration do
  env_file = File.join(Rails.root, 'config', 'application.yml')
  YAML.load(File.open(env_file)).each do |key, value|
    ENV[key.to_s] = value
  end if File.exists?(env_file)
end
EOF
$ 
```

이제, Template 파일을 복사하여 `config/application.yml` 파일을 만들고
`SL_USER`와 `SL_API_KEY`의 값을 SoftLayer에 등록된 사용자의 것으로
설정해주면 된다.

이제 Controller 본체를 구현할 차례이다.



## API Controller 작성

아래와 같이, `ApiController`를 작성한다. 이 Controller는 앞으로 작성될 여러
API Endpoint가 상속하게 될 Class로, `login`을 `before_action`으로 설정하여
모든 Endpoint Request가 `login` 과정을 먼저 거친 후에 각 Handler의 기능이
동작하도록 설정했다.

{:.block-title}
`/app/controllers/api/api_controller.rb`

```ruby
class Api::ApiController < ActionController::Base
  before_action :login

  private
  def login
    user = ENV['SL_USER']
    pass = ENV['SL_API_KEY']
    @client = SoftLayer::Client.new(username: user, api_key: pass)
    @account = SoftLayer::Account.account_for_client(@client)

    response.headers['Access-Control-Allow-Origin'] = '*'
  end

  def h_from obj
    # get :@softlayer_hash and convert string keys to symbol keys
    h = obj.instance_variable_get(:@softlayer_hash)
    h.inject({}){|memo,(k,v)| memo[k.to_sym] = v; memo}
  end

  def ha_from objs
    ha = Array.new
    objs.each do |obj|
      ha.push(h_from(obj))
    end
    return ha
  end
end
```

추가로 작성한 `h_from`, `ha_from`은 각각 Hash From, Hash Array From을 줄여
만든 이름인데, 이것은 SoftLayer의 API가 반환하는 값들을 우리가 다루기 편한
자료형으로 변환해주기 위한 부속 메소드이다.

> 현 시점에서, SoftLayer Ruby API는 아직 완성상태라고 할 수가 없을 것
> 같다. 공식 API 문서나 Python 등의 API와 비교했을 때, 상당 부분의 Class가
> 누락되어 있으며 그 대신, 누락된 Class에 해당하는 데이터는 Class가 아닌
> Hash나 Hash의 Array 형태로 제공되고 있다.

다음은 Account 정보를 제공할 `accounts` Endpoint의 작성이다. 아래와 같이,
앞서 만든 `ApiController`를 상속하고, `before_action`으로 설정된 `login`에
의해 이미 설정된 변수인 `@account`로부터 account의 일반 정보를 세팅하고,
다시 `@account`의 `servers` 메소드와 `image_templates` 메소드를 이용하여
각각이 제공하는 서버 목록과 이미지 템플릿 목록을 얻어와서 우리의 API 패턴에
맞게 반환할 데이터를 완성하도록 구성하였다.

{:.block-title}
`/app/controllers/api/v1/accounts_controller.rb`
```ruby
class Api::V1::AccountsController < Api::ApiController

  # GET /accounts.json
  def index
    account = h_from(@account)
    account[:servers] = ha_from(@account.servers)
    account[:image_templates] = ha_from(@account.image_templates)
    @accounts = [account]
  end
end
```

이렇게 구성된 데이터는, `@accounts`에 담겼다가, 아래와 같이 JSON Builder에
의하여 Formatting된 후에 Client에게 전달되게 된다.

{:.block-title}
`/app/views/api/v1/accounts/index.json.jbuilder`

```ruby
json.array!(@accounts) do |account|
  json.extract! account, :id, :companyName, :email, :servers, :image_templates
  json.url api_v1_account_url(account[:id], format: :json)
end
```

마지막으로, 이렇게 구성한 Endpoint를 Route 정보에 추가해준다. 아래와 같은
namespace 설정으로, REST API의 URL은 `/api/v1/RESOURCE` 형식을 갖게 되고,
별도의 MIME 설정이 없는 경우에 반환될 Format을 JSON으로 지정한다.

```diff
--- a/config/routes.rb
+++ b/config/routes.rb
@@ -1,4 +1,11 @@
 Rails.application.routes.draw do
+
+  namespace :api, defaults: {format: 'json'} do
+    namespace :v1 do
+      resources :accounts
+    end
+  end
+
   # The priority is based upon order of creation: first created -> highest priority.
   # See how all your routes lay out with "rake routes".
 
```

여기까지 구현된 상태에서 반환하는 데이터를 잠깐 보면, 아래와 같은 모양이다.
실제로는 `servers`와 `image_templates`는 그 내용이 통째로 들어오게 되는데,
아래의 예시는 JSON의 Structure만 파악하기 위해서 `id`만 남기고 다른 모든
값들을 지웠다.

```json
[
   {
      "id" : 999113,
      "companyName" : "Example Co",
      "email" : "james.bond@example.com",
      "servers" : [
         { "id" : 999456 },
         { "id" : 999012 }
      ],
      "image_templates" : [
         { "id" : 999017 }
      ],
      "url" : "http://localhost:3000/api/v1/accounts/999113"
   }
]
```

위의 Format은 Rails의 매우 전형적인 Output이며, 이 데이터가 이미 Account의
배열이라는 것을 안다는 가정에서는 문제가 되지 않는 구조이다. 반대로 말하면,
이것이 Account의 배열이라는 것을 모른다면 그 정체를 알 수 없다는 뜻이 된다.

REST와 JSON의 쌍의 효용성에 의해 이들의 사용이 늘어나면서 개별 Framework
중심의, 또는 일반적인 차원에서의 표준화 시도 역시 활발해지고 있다. 물론,
JSON 자체는 유연함에서 나오는 힘이 있기 때문에 강제적인 무언가가 있을 수는
없지만, 상호운용성이나 자체적인 표준화의 어려움을 피하려면 이들을 참조하는
것도 좋은 방법일 것 같다.

* [JSON:API](http://jsonapi.org/)
* [JSON API Specification](http://jsonapi.org/format/)
* [Ember Data의 RESTAdapter에서 사용하는 JSON STRUCTURE](http://emberjs.com/api/data/classes/DS.RESTAdapter.html#toc_json-structure)
* [Ember 2.0의 Sideloading을 포함한 JSON-API Adapter](https://guides.emberjs.com/v2.2.0/models/customizing-serializers/#toc_sideloaded-data)
* [Ember 1.0의 Sideloading을 포함한 REST Adapter](https://guides.emberjs.com/v1.10.0/models/the-rest-adapter/#toc_sideloaded-relationships)

참고로, 다음은 JSON API Spec을 따르는 JSON의 예이다.
(위의 예제에서 따왔다.)

```json
{
  "data": [{
    "type": "articles",
    "id": "1",
    "attributes": {
      "title": "JSON API paints my bikeshed!"
    },
    "links": {
      "self": "http://example.com/articles/1"
    },
    "relationships": {
      "comments": {
        "data": [
          { "type": "comments", "id": "5" },
          { "type": "comments", "id": "12" }
        ]
      }
    }
  }],
  "included": [{
    "type": "comments",
    "id": "5",
    "attributes": {
      "body": "First!"
    },
    "links": {
      "self": "http://example.com/comments/5"
    }
  }, {
    "type": "comments",
    "id": "12",
    "attributes": {
      "body": "I like XML better"
    },
    "links": {
      "self": "http://example.com/comments/12"
    }
  }]
}
```

기본 JSON Object는 `data`, `errors`, `meta` 등의 Top-Level Member를 하나
이상 포함하도록 하고 있고, 이와 함께 `jsonapi`, `links`, `included` 등을
활용하여 보다 상세하고 구조화된 형태로 데이터를 전달할 수 있도록 하고 있다.

또한, 위와 같이 함께 포함되어 전달되는 연계 Object가 존재하는 경우,
주 Object 내에 `relationships`를 사용하여 연계 구조를 정의하게 된다.

궁극적으로, Hardened Layer는 JSON-API를 따르는 것을 목표로 하고 있지만,
당장은 SoftLayer API의 응답으로부터 이러한 형식을 얻어내기 위해서는
더 많은 작업이 필요하게 되므로 일단은 구현을 쉽게 하는 방향으로 진행하려고
한다.

## JSON 형식 변경

이 절에서는, 비록 JSON-API 형태는 아니지만 **Ember가 데이터 처리를 보다 쉽게
처리할 수 있도록** Ember의 REST Adapter가 이해할 수 있는 형태 수준으로 응답을
변환하려고 한다.

앞선 절에서 설명한 Contoller 등을 아래와 같이 바꿔 보았다. (부수적으로,
연계 정보의 종류가 더 추가되었다.)

{:.block-title}
`/app/controllers/api/v1/accounts_controller.rb`

```ruby
class Api::V1::AccountsController < Api::ApiController

  # GET /accounts.json
  def index
    account = h_from(@account)
    account[:imageTemplates] = ha_from(@account.image_templates)
    account[:bareMetalServers] = ha_from(@account.bare_metal_servers)
    account[:virtualServers] = ha_from(@account.virtual_servers)
    account[:virtualDiskImages] = ha_from(@account.virtual_disk_images)
    account[:users] = ha_from(@account.users)
    account[:openTickets] = ha_from(@account.open_tickets)
    account[:servers] = ha_from(@account.servers)
    @data = { :accounts => [account] }
  end
end
```

이렇게, 먼저 최종적으로 JSON을 Build하는 과정에서 사라지게 될 `@data`라는
변수를 넣어 Hash의 Nested 구조를 더 깊게 조정하였고,

{:.block-title}
`/app/views/api/v1/accounts/index.json.jbuilder`

```ruby
json.extract! @data, :accounts
```

JSON을 만드는 과정에서는 `@data` 안에서 `:accounts`를 뽑아내는 구성으로
전환하였다. 이제 그 결과는 아래와 같은 형식을 띄게 되며, Sideloading을
제외하고는 Ember의 REST Adapter가 이해할 수 있는, Object 또는 Object의
Array에 이름을 붙여주는 형식을 띄게 된다. (일단, 최상위의 것만 보자 :-)

```json
{
   "accounts" : [
      {
         "brandId" : 99988,
         "id" : 999113,
         "users" : [
            { "id" : 999003 },
            { "id" : 999741 },
            { "id" : 999767 }
         ],
         "servers" : [
            { "id" : 999276 },
            { "id" : 99969963 },
            { "id" : 99907465 },
            { "id" : 99963151 }
         ],
         "bareMetalServers" : [
            { "id" : 999276 }
         ],
         "virtualServers" : [
            { "id" : 99969963 },
            { "id" : 99907465 },
            { "id" : 99963151 }
         ],
         "imageTemplates" : [
            { "id" : 999017 }
         ],
         "virtualDiskImages" : [
            { "id" : 99905251 },
            { "id" : 99905253 }
         ],
         "openTickets" : [
            { "id" : 99925317 },
            { "id" : 99925929 }
         ],
      }
   ]
}
```

API App은 이상으로 기본적인 구현을 끝냈다. 다시 강조하자면, 이상의 과정 중,
UI를 직접적으로 고려하는 부분은 전혀 없으며 단지 API의 응답 Format에만
집중하였다. 이처럼, Console App의 개발이 전혀 진행되지 않은 상태에서도
독립적인 개발이 가능하다.

예전에, Stack Overflow의 Facebook Post에 달았던 내 짧은 댓글이 동일 Post의
댓글 중 가장 많은 "좋아요"를 받은 적이 있었다. (ㅋㅋ) 나는 이 결과에 대하여,
"Backend as an API", "Backend as a Service API"와 같은 움직임의 핵심이
어쩌면 상당 부분은 개발 생산성과 개발구조의 변화와 맥을 함께하기 때문일
수도 있을 것이라고 생각한다.

![](/attachments/20160116-backend-as-an-api.png){:.half.centered.dropshadow}

> "Backend as an API" 는 단지 좋은 Architecture일 뿐만 아니라 개발팀 구조에도
> 좋다.
> 
> 이 방식을 사용함으로써, Backend 개발자와 Frontend 개발자는 서로에게 의존하지
> 않고 각각 논리와 데이터, UX에 집중할 수 있다.





# Console App, Frontend의 구성

Frontend는 Ember.js를 이용하여 작성했다. NVM을 이용한 Ember.js 개발의 손쉬운
환경구성에 대한 상세 내용은 얼마 전에 작성했던
[Ember CLI 환경 구성하기]({% post_url development/2015-12-09-preparing-ember-environment %})
에서 참고하기 바란다.

여기서는 다음과 같은 환경이 사용되었다.

```console
$ ember --version
version: 1.13.13
Could not find watchman, falling back to NodeWatcher for file system events.
Visit http://www.ember-cli.com/user-guide/#watchman for more info.
node: 4.2.3
npm: 2.14.10
os: linux x64
$ 
```

## 뼈대의 작성

먼저, 아래와 같은 명령으로 뼈대를 작성해준다. Project 이름과 다른 폴더명을
사용하기 위해 `--directory` 옵션을 사용했고, `--skip-git` 옵션으로 Git을
자동으로 설정하는 것을 피했다.

```console
$ ember new hardened-layer --skip-git --directory hardened-layer-ui
version: 1.13.13
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
```

틀이 작성되었다면 아래와 같이 Adapter 및 Serializer를 만들어준다. Ember에서
Backend API의 특성을 반형하여 연동 관련 특성을 Customize를 할 수 있는 지점이
바로 이 두 곳이다.

```console
$ ember generate adapter softlayer
version: 1.13.13
installing adapter
  create app/adapters/softlayer.js
installing adapter-test
  create tests/unit/adapters/softlayer-test.js
$ ember generate serializer softlayer
version: 1.13.13
installing serializer
  create app/serializers/softlayer.js
installing serializer-test
  create tests/unit/serializers/softlayer-test.js
$ 
```

다음으로, Account Object를 다루기 위한 Resource(Model, Route, Template)와
Account Object에 대한 세부 Customizing을 위한 Adapter/Serializer를
만들어준다.

```console
$ ember generate resource accounts
version: 1.13.13
installing model
  create app/models/acount.js
installing model-test
  create tests/unit/models/acount-test.js
installing route
  create app/routes/acounts.js
  create app/templates/acounts.hbs
updating router
  add route Acounts
installing route-test
  create tests/unit/routes/acounts-test.js
$ ember generate adapter account
version: 1.13.13
installing adapter
  create app/adapters/account.js
installing adapter-test
  create tests/unit/adapters/account-test.js
$ ember generate serializer account
version: 1.13.13
installing serializer
  create app/serializers/account.js
installing serializer-test
  create tests/unit/serializers/account-test.js
$ 
```

동일한 방식으로 Server Object에 대한 것들도 만들어준다.

```console
$ ember generate resource servers
$ ember generate adapter server
$ ember generate serializer server
$ 
```

이제, 만들어진 두 리소스와 기본 Adapter/Serializer를 수정하여 실제로
API App과 통신할 수 있도록 구성해보자.

## Backend 연동: Adapter 및 Serializer의 작성

Ember Application의 구성요소 중, Backend의 REST API 등을 통하여 **데이터
연동을 관장하는 부분이 Adapter와 Serializer**다.  (즉, MVC Framework의
'M' 영역에 해당하는 부분이다.)

Hardened Layer의 Console App에서는 API App과의 통신을 위하며, Ember가
기본으로 제공하는 `RESTAdapter` 및 `RESTSerializer`를 사용하여 이 부분을
작성한다.

조금 적절하지 않은 이름을 붙이고 말았는데, HL API App과 통신하는 역할을
하는 Adapter와 Serializer에 각각 `SoftLayerAdapter`, `SoftLayerSerializer`
라는 이름을 붙여버렸다. 이 두 Class 정의는 앞으로 설명할 두 파일에
위치하는데, Class 이름은 파일의 이름으로부터 자동 생성된다.

### API 기본 Adapter와 Serializer 

`SoftLayerAdapter`를 정의하는 `app/adapters/softlayer.js` 파일은 다음과
같은 모습니다. 이 파일은 `RESTAdapter`를 상속하여 `SoftLayerAdapter`를
정의하고 있다.  `RESTAdapter`는 REST 방식으로 서비스를 하는 Backend로부터
Object를 받을 수 있는 기본적인 속성과 방법을 갖추고 있다. 여기서는,
우리의 Backend가 어디에 있는지를 알려주기 위하여 아래와 같이 `host`와
`namespace` 설정을 Override 해준다.

{:.block-title}
`/app/adapters/softlayer.js`

```javascript
import DS from 'ember-data';
import config from '../config/environment';

export default DS.RESTAdapter.extend({
  host: config.SL.host,
  namespace: config.SL.namespace,

  init: function() {
    this._super();
    console.log('SoftLayerAdapter: ' + config.SL.host + '...');
  }
});
```

설정을 위해 사용하고 있는 `config.SL.*`은 `config/environment.js` 아래에
담아두었다. 참고로, `init()`를 Override하는 것은 단순히 이 Adapter가
사용되는 것을 Logging하기 위함일 뿐이다.

```diff
--- a/config/environment.js
+++ b/config/environment.js
@@ -13,6 +13,15 @@ module.exports = function(environment) {
       }
     },
 
+    SL: {
+      host: 'http://localhost:4200',
+      namespace: 'mock/jsonapi',
+    },
+
+    contentSecurityPolicy: {
+      'connect-src': "'self' localhost:3000",
+    },
+
     APP: {
       // Here you can pass flags/options to your application instance
       // when it is created
```

위의 Diff에서 추가된 두 블록 중에서 위의 `SL` 부분은 Backend URL 작성에
사용될 부분을 설정하는 부분이고, `contentSecurityPolicy` 부분은 Web의
Cross-Domain 보안과 관련된 부분으로, API가 동작하고 있는 localhost의
3000번 Port로부터 서비스되는 내용을 안전한 것으로 여기고 사용하겠다는
것을 정의하는 것이다.

`SoftLayerSerializer`는 아직 수정할 내용이 없다. 일단 아래와 같이 별도의
Override를 하지 않은 채, `RESTSerializer`를 상속하는 자동생성된 상태를
그대로 유지한다.

{:.block-title}
`/app/serializers/softlayer.js`

```javascript
import DS from 'ember-data';

export default DS.RESTSerializer.extend({
});
```

### Resource Adapter와 Serializer

이제 개별 Resource에 대한 Adapter/Serializer를 정의할 차례이다. 먼저,
`AccountAdapter`는 아래와 같이 `SoftLayerAdapter`를 상속하도록 설정하는
정도로 충분하다.

Adapter와 Serializer는 모두 Data의 주고 받는 과정을 담당하게 되는데,
Serializer가 보다 Data 자체에 치중해 있다면 Adapter는 전송에 대한 부분에
치중하게 된다. 따라서, 서로 다른 Resource가 동일한 Backend에서 제공되고
Endpoint URL 등의 표준화가 정상적이라면 Adapter는 Resource 별로 달라질
부분이 거의 없다.

{:.block-title}
`/app/adapters/account.js`

```javascript
import SoftLayerAdapter from './softlayer';

export default SoftLayerAdapter.extend({
});
```

다음은 `AccountSerializer`를 손볼 차례이다. Backend로부터 넘겨받은 JSON
형식의 데이터를 다시 Object로 변환하는 과정은 `Serializer`에서 제공하는
각종 `normalize` Method나 `attrs` 속성을 이용하여 환경에 맞도록 정의할
수 있다.

앞서 제작한 API App의 JSON 응답은, JSON-API의 표준형식도 아니고, Ember
REST 방식의 표준형식도 아니다. 자세히 설명하지는 않았지만 SoftLayer에서
반환하는 데이터의 형태를 거의 수정하지 않고 그대로 사용하기 위해서 매우
단순한 Embedded 된 형식의 JSON을 사용하고 있다. 즉, 다음 JSON의 예와
같이, 주 Object에 딸린 부속 Object들은 주 Object 내에 뭍혀있는 모습으로
되어있다.

```json
{
  "bicycle" : {
    "id" : 894,
    "handle" : "strong handle",
    "wheels" : [{
      "id" : 29384,
      "position" : "front",
      "tire" : {
        "id" : 8329384,
        "type" : "strong rubber",
        "width" : 52
      }
    }, {
      "id" : 29784,
      "position" : "rear",
      "tire" : {
        "id" : 3847283,
        "type" : "strong rubber",
        "width" : 52
      }
    }]
  }
}
```

보는 바와 같이, `bicycle`이라는 Object 안에 `wheels`라는 Object의 배열이
살고 있고, 개별 `wheel` 안에는 다시 `tire`가 살고 있다. 명확한 Key/Value
관계가 성립하지 않고 Object의 특성에 따라 Key가 변화하는 이런 유형의
JSON 데이터는 사실, 정규화된 방식으로 Parsing하는 것이 쉽지 않다.

이런 유형의 데이터는 그래서, 조금 복잡한 Normalize 설정을 필요로 하는데,
이 문제를 조금 쉽게 풀어주기 위해서 Ember는 `EmbeddedRecordsMixin`을
기본으로 제공하고 있다. 우리의 경우에는, 다음과 같은 방식으로 Account
Object 안에 담겨있는 Server, Image Template 등을 개별 Object로 뽑아낼 수
있게 돕고 있다.

{:.block-title}
`/app/serializers/account.js`

```javascript
import SoftLayerSerializer from './softlayer';

export default SoftLayerSerializer.extend(DS.EmbeddedRecordsMixin, {
  attrs: {
    servers: { embedded: 'always' },
    imageTemplates: { embedded: 'always' },
  }
});
```

`AccountSerializer`는 `SoftLayerSerializer`를 상속받는 것으로 끝나지 않고,
거기에 `EmbeddedRecordsMixin`을 섞어주고, 다시 `attrs` 속성을 Override하여
Account Object 안에 어떤 Object가 포함되어 있으며 Account Object와 함께
풀어줘야 하는지를 Mixin에게 알려주고 있다.

### Resource Model

이렇게 추출된 각 Resource 들은 Account와 연결성을 갖게 되는데, Ember 내의
Model에 대한 Relationship은 `app/models` 아래에 위치한 파일들에서 설정할
수 있다. 다음 내용과 같이, Account Model의 자체 속성과 연결관계에 있는
다른 Model 간의 관계를 정의할 수 있다.

{:.block-title}
`/app/models/account.js`

```javascript
import DS from 'ember-data'; 

export default DS.Model.extend({
  companyName: DS.attr('string'),
  email: DS.attr('string'),
  createData: DS.attr('date'),
  modifyDate: DS.attr('date'),
  state: DS.attr('string'),
  isReseller: DS.attr('boolean'),

  servers: DS.hasMany('server', {async: true}),
  imageTemplates: DS.hasMany('imageTemplate', {async: true}),
});
```

이제, 뒷단의 서버와 적합한 방법으로 통신을 하고, 서버로부터 원하는 데이터를
전달받아 재구성하여 Model을 만들어내는 단계에 대한 구현이 끝났다.



## Console 구성: Route, Router, Template

이제 Client 측에 자리를 잡은 Model을 표현할 View를 정의할 차례이다.
Application은 그것이 다루는 데이터와 작업을 잘 담아낼 수 있도록, 다양한
View를 제공하게 된다. 웹기반의 Application에서는 이 다양한 View를
각각 Hierarchy가 반영된 URL과 매칭하여 사용하는 것이 일반적이다.

### Route 정의

Ember에서는 **각 URL을 어떤 데이터셋, 화면, Controller와 연계하여야
하는지**, 반대로 말하면 어떤 상황에 맞는 화면과 데이터, Controller가
어떤 것인지를 Router와 Route를 통하여 정의한다.

먼저, 다음과 같이 View에게 `model`을 선사할 Route를 만들어준다. Route는,
표현을 바꿔보면 Application이 제공하는 각 화면이라고 볼 수 있다. App의
각 화면은 열람하기, 자세히보기, 수정하기, 주문하기 등, 각 화면에 따라
필요로 하는 데이터와 기능이 달라지게 된다. Route는 이것들을 각 상황에
맞게 Mapping하여 제공하는 역할을 한다고 이해할 수 있다.

아래와 같이 Accounts라는 Route를 만들어준다. 이 Route는 Account List를 볼
때 어떤 `model` 즉, 데이터를 준비해야하는지가 핵심업무이며, 아래와 같이
`model`을 정의해주면 된다. (아주 기본적인 상황인데, `store`에서 `account`인
모든 것을 찾아서 넘겨주게 설정한 것이다.)

{:.block-title}
`/app/routes/accounts.js`

```javascript
import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    return this.store.findAll('account');
  }
});
```

Server에 대한 Route는 아래와 같은데, 위의 내용과 좀 다른 형태를 띄고 있다.
아래처럼 난데없이 모든 Account를 찾더니, 모든 Server를 넘긴다.

{:.block-title}
`/app/routes/servers.js`

```javascript
import Ember from 'ember';

export default Ember.Route.extend({
  model: function() {
    this.store.findAll('account');
    return this.store.all('server');
  }
});
```

동작하는 원리는 다음과 같다.

1. 모든 Account 로딩 --> Store가 비어있으면 새롭게 데이터를 받아옴
2. 새로 Account를 받는 과정에서 Embedded된 Server 정도보 채워짐
3. 이미 채워진 Store에서 Server 정보를 Request 없이 읽어들임

이렇게 작성한 이유는, Server에 대한 별도의 API Endpoint를 아직 만들지
않았기 때문이다. 향후, CRUD 등, 기능요소가 추가된 정상적인 Console을
만들게 된다면 개별 Object에 대한 제어 Endpoint는 분명히 필요해진다.
다만, 현재는 Prototype 단계이므로 검증에 필요하지 않은 세부/반복적인
부분은 제거하여 개발하고 있으며, 또한 Console App의 특성 상, 초기에
한 번 채운 Store를 Client 측에 두고 Session 동안 추가 Request가 가급적
발생하지 않도록 하는 것이 좋다고 판단하고 있는 것도 작용하였다.

### Router 설정

만들어진 Route는 Router에 등록되어야 Application이 인식하여 URL에 맞춰
호출해줄 수 있게 된다. 아래와 같이, 작성한 Route 두 개를 추가해준다.

```diff
--- a/app/router.js
+++ b/app/router.js
@@ -6,6 +6,8 @@ const Router = Ember.Router.extend({
 });
 
 Router.map(function() {
+  this.route('accounts');
+  this.route('servers');
 });
 
 export default Router;
```

아직, 열람만 가능한 간략한 Application이다 보니, Application의 복잡도가
반영되어질 Router의 구성 역시 아직은 매우 단순하다.

### Template의 작성

이제 진짜 화면에 보이는 것을 만들 차례이다. 이 부분은 직관적으로 쉽게
인식할 수 있는 부분이므로 자세한 얘기가 필요하지 않을 것 같다.

쉽게 유추가 가능하지만, 그나마 이해가 필요한 부분은 아래 세 파일의 관계에
대한 부분이다. Ember App은 맨 바닥에 `application.hbs`가 정의한 Template이
깔리게 되고, Route hierarchy에 따라 `outlet`에 화면조각을 끼워가는 구조로
구성된다. 표현하자면,

* [ APP [ Accounts [ Account ] ] ]
* [ APP [ Servers ] ]

등의 방식으로 조합된다는 뜻이다.

먼저, Application 틀을 구성하는 `application.hbs`이다.

{:.block-title}
`/app/templates/application.hbs`

```handlebars
{% raw %}
<h2 id="title">Hardened Layer</h2>

<div id="category-list" class="ui menu" style="float:left; margin: 0 1em">
  <ul style="padding: 0">
    <li>{{link-to 'Home' 'index'}}</li>
    <li>{{link-to 'Account' 'accounts'}}</li>
    <li>{{link-to 'Servers' 'servers'}}</li>
    <li>{{link-to 'Image Template' 'image-templates'}}</li>
  </ul>
</div>

<div id="main-panel" class="ui panel">
{{outlet}}
</div>
{% endraw %}
```

이 화면은

* `H2` Tag를 사용한 제목 부분
* Menu의 역할로써 Route 별로 만들어질 Link를 담은 `DIV` 부분
* 마지막으로 앞서 설명한 화면조각이 끼워질 위치, `outlet` 부분

등으로 구성되어 있다.

{:.block-title}
`/app/templates/accounts.hbs`

```handlebars
{% raw %}
<ul>
{{#each account in model}}
<li>
{{account.companyName}}
(contact: {{account.email}})
</li>
{{else}}
<li>No accounts found.</li>
{{/each}}
</ul>

{{outlet}}
{% endraw %}
```

Account 목록을 볼 때 사용될 위의 Template은 `#each` 구문에 의해 Loop를
돌면서 각 Account의 화사명과 이메일 정보를 표현하도록 작성되었다.
이 화면조각은, `application.hbs`의 `outlet`에 삽입되어 표출되게 된다.


### 스크린샷!

아직 SoftLayer의 API나 Dataset을 이해하지 못하는 상태에서, 기본이 되는
Account 정보를 기점으로 어떤 연계정보가 더 존재하는지 쫓아가는 과정을
반복하면서, 현재는 다음과 같은 Object를 더 추가한 상태다

* Compute 자원: virtual-server, bare-metal-server
* 보조 Object: virtual-disk-image, image-template
* Embeded Object: network-component, datacenter, block-device, network-vlan
* 관리 Object: open-ticket, user

이들을 추가한 상태에서 실제로 동작하는 화면 몇개를 보면 다음과 같다.

![](/attachments/20160116-hl-ui-servers.png){:.fit.dropshadow}

![](/attachments/20160116-hl-ui-images.png){:.fit.dropshadow}


# 지나간 시도들

API App을 구성하는 과정에서, Hardened Layer API의 응답 형식을 JSON API
규역 또는 Ember 표준의 Sideloading을 지원하는 방식으로 변경해보려는
시도를 몇 가지 해보았다.

문제는, SoftLayer의 응답이 Server Object에 Data Center 정보나 Network
Interface의 정보가 들어있는 등, Embedded 형식으로 되어있기 때문에, 응답
형식을 JSON API에 맞추기 위해서는 Reference ID에 대한 세팅을 별도로
해줘야 하는 등의 문제가 있었다.

이것이 Production을 위한 개발이고 장기적으로 본다면 점차 사실상의 표준으로
자리잡아가는 JSON API의 지원을 미리 반영하는 편이 옳겠지만 당장은 노력과
결과의 I/O 비율을 가늠하기 어렵다.

일단, 지나간 시도를 기록으로 남기고, 향후에 프로젝트를 다시 진행하게 되면
이 부분에 대한 고민을 더 하는 것으로 하려고 한다.

## Sideloading을 포함한 REST 방식

API App의 응답 형태를 조절하여 Ember 표준 RESTSerializer가 이해할 수 있는
Sideloaded Object를 지원하도록 해보려는 시도를 해보았다.

이 과정에서 사용된 `AccountsController`와 `JSON Builder`는 다음과 같다.

{:.block-title}
AccountsController
```ruby
class Api::V1::AccountsController < Api::ApiController
  def index
    account = h_from(@account)
    @servers = ha_from(@account.servers)

    account[:servers] = Array.new
    @servers.each do |server|
      account[:servers].push(server[:id])
    end

    @data = {
      :accounts => [account],
      :servers => ha_from(@account.servers)
    }
  end
end
```

{:.block-title}
JSON Builder
```ruby
json.extract! @data, :accounts, :servers
```

위의 내용을 보면, 서버 Hash의 Array인 `@servers`를 돌면서 ID를 추출하고,
그것을 `account` Hash에 추가하여 데이터 구조를 만들었다.

이 Controller와 JSON Builder에 의한 결과는 아래와 같다.

{:.block-title}
JSON output
```json
{
   "accounts" : [
      {
         "id" : 999113,
         "servers" : [
            14999465,
            14999233,
            14999151
         ],
      }
   ],
   "servers" : [
      {
         "id" : 14999465,
         "blockDevices" : [
            { "id" : 18699973 },
            { "id" : 18699925 }
         ],
         "datacenter" : { "id" : 999604 },
         "networkVlans" : [
            { "id" : 1999741 },
            { "id" : 1999739 }
         ],
      },
      {
         "id" : 14999233,
         "networkVlans" : [
            { "id" : 1999741 },
            { "id" : 1999739 }
         ],
         "datacenter" : { "id" : 999604 },
         "blockDevices" : [
            { "id" : 18399975 },
            { "id" : 18399979 }
         ],
      }
   ]
}
```

구조적으로 문제가 없으며 정상적으로 해석 가능한 구조로 만들어졌다. 다만,
문제는 여전히 Server Object 안에 Embedded된 Object들이 많이 있다는 점,
그리고 그것을 자동으로 식별하여 구조화하는 노력이 추가로 필요하다는 점이
남아있었던 시도이다.


## JSON API 방식

이 방식의 코드는 Repository를 뒤지면 나올 것 같은데, 미리 정리해둔 것이
없어서 그나마 남아있는 Mockup Data에서 그 출력만 기록으로 남긴다.

```json
{
   "data" : [
      {
         "type" : "accounts",
         "id" : 998113,
         "attributes" : {
            "email" : "james.bond@example.com",
            "companyName" : "Example Co"
         },
         "relationships" : {
            "servers" : {
               "data" : [
                  {
                     "type" : "servers",
                     "id" : 99407465
                  },
                  {
                     "type" : "servers",
                     "id" : 99159233
                  },
                  {
                     "type" : "servers",
                     "id" : 99363151
                  }
               ]
            }
         },
         "links" : {
            "url" : "http://localhost:3000/api/v1/accounts/998113"
         }
      }
   ],
   "included" : [
      {
         "type" : "server",
         "id" : 99407465,
         "attributes" : {
            "domain" : "example.com",
            "hostname" : "test-dev-image",
            "maxMemory" : 1024,
            "maxCpu" : 1
         }
      },
      {
         "type" : "server",
         "id" : 99159233,
         "attributes" : {
            "domain" : "example.com",
            "hostname" : "test-dev-mongo02",
            "maxMemory" : 1024,
            "maxCpu" : 1
         }
      },
      {
         "type" : "server",
         "id" : 99363151,
         "attributes" : {
            "domain" : "example.com",
            "hostname" : "test-dev-teststorage",
            "maxMemory" : 1024,
            "maxCpu" : 1
         }
      }
   ]
}
```

# 다음 이야기...

여기까지, SoftLayer API의 검증과 활용성을 높일 수 있는 점을 찾기 위한
Prototyping에 대한 초기 개발 내용을 정리하여 보았다.

시간을 내어, 다음에는 아래와 같은 내용을 추가로 정리해보려고 한다.

* Semantic UI 및 보조도구를 활용하여 Console을 좀 보기 좋게 만들기
* Billing 자료를 따로 시각화하여 분석에 도움이 되는 정보로 만들기

* 단위 서비스/업무 차원의 모니터링 통합을 할 수 있는 방안 찾기
* 자동화를 위한 Engine App 개발하기

* 그리고 Python으로 API 언어 전환하기

이번 글은, 실제로 Prototype을 개발했던 기간보다 더 긴 시간을 이 글의
정리하는 데 사용했다. 부디, 미래의 나 또는 누군가에게는 남는 장사였으면
좋겠다.


