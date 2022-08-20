---
title: "CAOS #1 Rails 기반 환경 구성"
image: /assets/logos/mailgun-status.png
banner: /assets/logos/mailgun-banner.png
tags: cloud-computing ruby-on-rails Mailgun my-projects
categories: ["development"]
date: 2016-07-07 02:51:00 +0900
---
지난번, "[CAOS, Cloud Album on Object Storage]"라는 제목의 글을 통해서
Cloud Computing 영역의 서비스를 다각도로 활용하여 간단한 "Photo Album"
서비스를 구성해본 경험에 대하여 운을 뗐다.  이 글은 그 "CAOS 시리즈"의
본편 첫 번째 이야기로, 기존에 내가 즐겨 해왔던 방식과는 조금 다르게
Rails App의 골력을 만드는 과정을 기록하려고 한다.

여는 글을 비롯하여 이 시리즈의 글들은 다음의 순서를 참고하길 바라며,

* [CAOS, Cloud Album on Object Storage] -  *The Begining~!*
* CAOS #1 Rails 기반 환경 구성 <-- *현위치*
* [CAOS #2 SoftLayer Object Storage 다루기]
* [CAOS #3 Rails Application의 성능 분석]

그 중간 과정에서 만들어진 부수적인 기록도 관심이 있으면 참고하길 바란다.

* [SoftLayer Object Storage와 임시 URL]
* [SoftLayer Object Storage와 임시 URL #2]

[SoftLayer Object Storage와 임시 URL]:{% post_url development/2016-03-22-tempurl-for-softlayer-object-storage %}
[SoftLayer Object Storage와 임시 URL #2]:{% post_url development/2016-03-31-tempurl-for-softlayer-object-storage-2 %}

[CAOS, Cloud Album on Object Storage]:{% post_url development/2016-04-28-cloud-album-on-object-storage %}
[CAOS #2 SoftLayer Object Storage 다루기]:{% post_url development/2016-09-05-softlayer-object-storage-and-caos %}
[CAOS #3 Rails Application의 성능 분석]:{% post_url development/2016-09-06-rails-application-performance %}


시작에 앞서, 요즘의 내 다른 글들과 같이, 이 글 역시 지루하고 긴 글이
될 것 같다. 게다가, 이번 글에서는 다루고자 하는 내용이 좀 많으면서,
각 부분의 연관관계가 다소 느슨한 편이어서 읽기에 지루하기만 한 것이
아니라 불편한 느낌이 들지도 모르겠다.

아무튼, 다음과 같은 내용을 각 단에서 다루고 있으니, 필요에 따라서
관련된 부분을 참고하면 될 것 같다.

* Bundler를 사용하여 Rails 환경을 구성하는 방법
* Web Application의 사용자 인증을 위해 OTP를 사용하는 방법
* 메일기반 OTP 구현을 위해 Mailgun 서비스를 구성했던 이야기
* 마지막으로, 깔끔한 Web UI를 위해 Bootstrap을 Rails App에 붙인 이야기

---

* TOC
{:toc .half.pull-right}



{:#start-your-rails-engine}
# Start Your Rails Engine!

근래의, Hardened Layer의 개발 과정을 담았던
[Hardened Layer, SoftLayer Custom Portal - Part 1]를 비롯하여, 그동안
Ruby on Rails를 이용한 개발 과정에 대한 설명은 이곳 생각저장소나 얼마
전까지 주로 이용했던 [MEMO.T.C]에 자주 정리했었다.

오늘은, Rails App을 시작하기 위해 시스템 전역 구성으로 `rails` 명령을
설치하고, 설치된 버전의 특성과 방식에 의존하여 Skeleton의 구성을 했던
과거의 방식에서 벋어나서, 시스템에는 Bundler만 설치된 상태에서 그것을
활용하여 최신버전의 `rails` 명령을 받는 것을 시작으로 Rails App의
Skeleton을 작성하는 방식에 대하여 얘기하려고 한다.

이 방식을 통하여 얻을 수 있는 이점은 다음과 같다.

* Rails Gem을 "시스템 전역 설치"로 설치할 필요가 없다.
* Bundler 기반으로 최신의 `rails` Gem을 설치할 수 있고,
* 이것을 이용하여 (아마도) 조금 더 정제된 Skeleton을 얻을 수 있다.

물론, 시스템 전역 `rails`를 이용하여 뼈대를 잡는 경우라고 하여도 개발
중간에 Gem Update를 해준 상황이라면, 실행시점을 기준으로는 큰 차이가
있는 것은 아니다.

[Hardened Layer, SoftLayer Custom Portal - Part 1]:{% post_url development/2016-01-16-hardened-layer %}
[MEMO.T.C]:http://sio4.wikidot.com



{:#bundling-rails}
## Bundler로 Rails 땡기기

아예 시스템에 Rails가 없는 상태에서, 다음과 같이 Application의 뼈대가
될 디렉터리를 만들고 그 안에서 `bundle` 명령을 실행하여 Rails 환경을
만들어 준다.

```console
$ mkdir caos
$ cd caos
/caos$ bundle init
Writing new Gemfile to /home/sio4/git/_cloudapps/caos/Gemfile
/caos$ echo 'gem "rails"' >> Gemfile
/caos$ bundle install --path vendor/bundle
Fetching gem metadata from https://rubygems.org/...........
Fetching version metadata from https://rubygems.org/...
Fetching dependency metadata from https://rubygems.org/..
Resolving dependencies...
Installing rake 11.1.1
Installing i18n 0.7.0
Installing json 1.8.3 with native extensions
<...>
Installing rails 4.2.6
Bundle complete! 1 Gemfile dependency, 34 gems now installed.
Bundled gems are installed into ./vendor/bundle.
/caos$ 
```

위의 과정을 거치면 `caos`라는 이름의 디렉터리 안에 `rails`를 포함한
Rails 환경 구성을 위한 기본 Gem들이 모두 bundle되게 된다. 위 예시에
포함되어있는 출력을 보면 짐작할 수 있겠지만, 요약하자면 아래와 같다:

* `bundle init` 명령으로 기본 `Gemfile` 생성
* `Gemfile`에 `rails` 항목 추가
* `bundle install` 명령으로 현재 경로 아래에 관련 Gem들을 번들


{:#build-rails-app-skeleton}
## Rails App 골격 만들기

이제, 번들된 `rails` 명령을 이용하여 Application의 골격을 만들 차례다.

```console
/caos$ bundle exec rails new . -f
       exist  
      create  README.rdoc
      create  Rakefile
<...>
         run  bundle install
<...>
Installing debug_inspector 0.0.2 with native extensions
Installing byebug 8.2.2 with native extensions
Installing coffee-script-source 1.10.0
Installing execjs 2.6.0
Installing multi_json 1.11.2
Installing sass 3.4.21
Installing tilt 2.0.2
Installing spring 1.6.4
Installing sqlite3 1.3.11 with native extensions
Installing rdoc 4.2.2
Installing binding_of_caller 0.7.2 with native extensions
Installing coffee-script 2.4.1
Installing uglifier 2.7.2
Installing sdoc 0.4.1
Installing jbuilder 2.4.1
Installing coffee-rails 4.1.1
Installing jquery-rails 4.1.1
Installing sass-rails 5.0.4
Installing web-console 2.3.0
Installing turbolinks 2.5.3
Bundle complete! 12 Gemfile dependencies, 54 gems now installed.
Bundled gems are installed into ./vendor/bundle.
<...>
         run  bundle exec spring binstub --all
* bin/rake: spring inserted
* bin/rails: spring inserted
/caos$ 
```

위의 예제처럼, `rails new` 명령을 수행할 때 인수로 '.'을 주게 되면
별도의 디렉터리를 만드는 대신 현재 디렉터리 내에 Application 뼈대를
만들게 된다. `-f` 옵션을 추가하게 되면 이미 디렉터리 내에 존재하는
`Gemfile`을 Rails의 새로운 파일로 덮어쓰게 된다. (`bundle init`를
통해 만들어진 그 파일 말이다. :-)

음, 뭔가 깔끔하지 않아?

---



{:#user-and-authentication}
# 사용자와 인증

App에 따라 다를 수 있지만, 일반적인 Application의 공통적인 부분 중
하나가 바로 사용자와 인증, Session 관리에 대한 부분이다. 이 글에서
새롭게 시도해보려는 부분은 바로 이 인증 구조를 OTP 즉, One Time
Password 방식으로 전환해보는 것이다.

대부분의 서비스에서 OTP를 사용하는 일반적인 이유는 실시간 본인확인을
통하여 보안을 강화하는 것이지만, 여기서는 조금 다른 이유로 접근을
해보았다. 바로, OTP가 다음과 같은 조건을 만족시킨다는 점에 주목한
것이다.

* OTP는 즉석에서 만들내는 일회용 암호로 사용자를 인증한다는 의미이다.
* 그래서 사용자가 Login을 시도했을 때, 실시간으로 암호를 만들어낸다.
* 따라서, 사용자가 암호를 외울 필요가 없고, 그리고...
* 시스템 역시, 암호를 외우지 않는다.
* 즉, **DBMS/LDAP 등에 암호를 저장해둘 필요가 없다!!!**

{:.point}
One-Time-Password!
: OTP를 쓰는 사용자는 물론, 시스템도 암호를 잊을 수 있다.
: 본인인증도 본인인증이지만, 암호를 털릴 일도 없고...

"저장되지 않는 암호". 즉, DBMS 같은 영구저장소를 배제하는 App을 만들
때, 이 OTP가 한 몫을 하는 것이다. (물론 이 때, OTP 값을 저장하거나
기억할 필요가 있는데, CAOS에서는 이 일회용 암호의 임시저장소로 로컬
sqlite3를 사용하였다.)



{:#scaffolding-user-and-session}
## 기초공사

(이 문서에서 암호를 어떤 시각으로 보든,) 우리가 Application을 개발할
때, 여기서 사용되는 암호를 어떻게 DBMS에 저장할 것인지를 고민해야
한다. 너무 당연한 애기이니 길게 쓸 필요가 없는데, 암호라는 것은 원래
그런 거지.

아무튼, Rails는 이러한 용도로 사용하기 편리한 암호화 기능을 제공하고
있는데, 이 기능은 아래와 같이 `bcrypt` Gem을 활성화하고 설치한 후에
간단하게 사용할 수 있다.

```console
$ sed -i "s/# gem 'bcrypt/gem 'bcrypt/" Gemfile
$ bundle install
<...>
Installing bcrypt 3.1.11 with native extensions
<...>
Bundle complete! 15 Gemfile dependencies, 58 gems now installed.
Bundled gems are installed into ./vendor/bundle.
$ 
```

일단 이 Gem이 활성화되고 나면 Scaffolding을 할 때 `digest` Type으로
ActiveRecord의 Field를 만들 수 있게 된다. 아래와 같이, 사용자 정보를
저장하기 위한 `User`와 접속 관리를 위한 `Session`을 만들어준다.
(주의할 점은, 이 `digest`를 사용하는 Field의 이름은 `password`로
고정되어 있다.)

{:.wrap}
```console
$ bundle exec rails g scaffold user mail:uniq name comment:text password:digest password_at:datetime perms:text --no-javascripts --no-stylesheets
<...>
$ bundle exec rails g scaffold session user:references login_at:datetime logout_at:datetime --no-javascripts --no-stylesheets
$ bin/rake db:migrate
$ 
```

{:#implement-session-details}
## 상세 구현

위의 과정에서 만들어진 기반을 다듬어서 사용자가 OTP로 로그인할 수 있는
기능을 구현하였다. 자세한 내용은 
[Commit 48de71](https://github.com/hardenedlayer/caos/commit/48de71ca3eb52fea83bbb5cbd3820206be99992b)을
참고하고, 여기서는 주요 내용만 간단히 기술한다.

먼저, 인증처리를 하는 부분이다. 아래에 설명하겠지만, 여차저차하여
사용자가 OTP를 획득했고, 그것을 이용하여 로그인을 시도하게 되면,
Application은 아래의 코드를 이용하여 사용자의 인증과 세션의 생성을
처리하게 된다. (`SessionController`의 일부이다.)

여기서 User 모델의 인스턴스로부터 실행되는 `authenticate` 메서드가
등장하는데, 이 메서드는 앞서 말한 `bcrypt`에 의해 제공되는 암호비교
함수이다. 이 메서드가 실행되면, 앞서 `digest` 형식으로 만들어진 암호
Field의 값과 사용자가 지금 입력한 암호(인수)를 비교하여 일치여부를
쉽게 확인할 수 있다.


```ruby
def create
  @user = User.find(session[:user_id])
  debug "#{params[:password]}"
  if @user && @user.authenticate(params[:password])
    @session = @user.sessions.new(session_params)
    @session.login_at = Time.now
  else
    debug "Oops! login failed!"
    flash[:error] = t(:invalid_password)
    return redirect_to new_session_path
  end
  
  @session.save
  session[:session] = @session.id
  redirect_to @user, notice: t(:hello_nice_to_see_you)
end
```

그렇다면 사용자에게 전달되는 OTP는 어떻게 무작위로 만들 수 있을까?
다음 코드는 영문자와 숫자를 혼합한 8자리 암호를 자동으로 생성하는
메서드다.

```ruby
def update_password
  # http://stackoverflow.com/a/88341/1111002
  @user.password = [*('a'..'z'),*('0'..'9')].shuffle[0,8].join
  @user.password_at = Time.now
  debug "PASSWORD -------------------------- #{@user.password}"
end
```

## Session

잊기 전에 토막으로,  
일단 사용자의 세션이 맺어졌다면, 그 세션의 유효성을 관리해야 한다.
아래와 같이 `session_store.rb` 파일을 편집하여 세션 정보를 어디에
저장할지 등의 방법과 유효 시간 등을 설정할 수 있다. (아래의 경우,
Cookie 대신 Active Record를 사용하도록 하고, 세션 유지 시간을
6시간으로 설정하는 것인데, 실제 App에서는 Cookie를 그냥 사용하고
있다.)

```diff
--- a/config/initializers/session_store.rb
+++ b/config/initializers/session_store.rb
@@ -1,3 +1,6 @@
 # Be sure to restart your server when you modify this file.
 
-Rails.application.config.session_store :cookie_store, key: '_caos_session'
+Rails.application.config.session_store :active_record_store, {
+  key: '_caos_session',
+  expire_after: 6.hours,
+}
```

---



{:#mailgun}
# Mailgun!

서비스를 만들다 보면 서비스의 사용자에게 다양한 알람 서비스를 제공할
필요가 있는데, 이 때 SMTP 서버를 직접 구성해서 운영하려고 하면, 대충
다음과 같은 고민을 만날 수 있다.

* 메일서버를 직접 운영해야 되나? 이건 내 사업의 심지가 아니다.
* 이 서버가 스팸 유통경로가 되지 않도록 깨끗하게 유지하는 것도 일이다.
* (빌린 IP라면) 이미 스패머 블랙리스트에 등록된 IP일 수도 있다!

아무튼, 귀찮은 일이 많다. 난 그냥 웹 기반 사진앨범을 만드느 중인데
왜 메일서버까지 신경써야 하는가!

이런 고민을 하는 개발자나 회사를 위해, Rackspace가 제공하는 클라우드
시대의 메일발송 서비스가 있는데, 그 이름이 Mailgun이다.

![](/assets/logos/mailgun-home.png){:.fit.dropshadow}

{:#mailgun-intro}
## Mailgun 시작하기

Mailgun은 표준 SMTP 방식과 전용 API를 사용하는 두 가지 사용 방식을
제공하는데, 사용자의 구미에 맞게 사용하면 된다. 대체로, 대부분의
개발 언어나 환경이 SMTP를 이용한 메일발송 기능을 제공하기 때문에
이것에 익숙하다면 서비스를 붙이는 것은 간단하게 될 것이다.

서비스에 가입하면 기본적으로 Sandbox 도메인이 제공되며, 사용자가
서비스에 사용하기 위한 도메인을 가지고 있다면 아래와 같이 사용자의
도메인을 이용한 구성을 할 수 있다.

구성이 되면, IP, SMTP Hostname, Postmaster 계정과 암호, API를 위한
정보 등이 자동으로 또는 사용자의 선택에 의해 만들어지며, 도메인에
대한 Confirmation 과정을 거쳐 Active 상태가 되면 바로 사용할 수 있다.

![](/assets/logos/mailgun-domain.png){:.fit.dropshadow}

구성이 되었으면 시험을 해보자. 아래 예시를 보면,

{:.wrap}
```console
$ curl -s --user 'api:key-784e12345678901234567890' \
>  https://api.mailgun.net/v3/sbox.mailgun.org/messages \
>  -F from='Mailgun Sandbox <postmaster@sbox.mailgun.org>' \
>  -F to='Me <yonghwan@example.com>' \
>  -F subject='Hello Yonghwan!' \
>  -F text='You just sent an email with Mailgun!'
{
  "id": "<20160323.93576.51041.AC04337D@sbox.mailgun.org>",
  "message": "Queued. Thank you."
}
$ 
```

이렇게, Web API를 통하여 발송 시험을 할 수 있다.



## Setup Mailgun Gem

Mailgun을 사용하는 방식은 앞서 이야기한 바와 같이, 전용 API를 사용한
방식과 일반적인 SMTP 방식으로 메일을 발송하는 방식이 있다. 각각,
특성과 장단점이 있겠지만, 이번에는 보다 일반적이고 Rails에서 제공하는
기능을 이용하기 위하여 SMTP를 기반으로 한 ActionMailer를 이용하는
것으로 하였다.

만약, API 방식으로 개발을 한다면 Mailgun의 [Official Ruby Gem] 등을
이용하여 개발을 할 수 있다. 장단점을 확인해보지는 못했지만,
[Mailgunner]라는 3rd-Party도 있으니 참고.

* [HOWTO send email with Rails and Mailgun]

추가로, Action Mailer를 비롯하여 다양한 방식으로 Rails App에서 메일을
발송하는 방식에 대해 다루고 있는 [Sending Emails in Rails Applications]나
Action Mailer에 대한 표준 문서인 [Action Mailer Basics] 등을 참고하면
도움이 될 것 같다.
만약, 멋진 Heroku를 사용한다면 [Mailgun - Heroku Dev Center]도 참고가
될 것이다.


[Official Ruby Gem]:https://github.com/mailgun/mailgun-ruby
[Mailgunner]:https://github.com/timcraft/mailgunner
[HOWTO send email with Rails and Mailgun]:http://readysteadycode.com/howto-send-email-with-rails-and-mailgun

[Action Mailer Basics]:http://guides.rubyonrails.org/action_mailer_basics.html
[Sending Emails in Rails Applications]:https://launchschool.com/blog/handling-emails-in-rails
[Mailgun - Heroku Dev Center]:https://devcenter.heroku.com/articles/mailgun

## Setup Action Mailer

여기서는 SMTP 방식과 Action Mailer를 사용하는 것으로 방향을 잡았으니,
아래와 같이 Action Mailer 구성을 했다. 먼저, `rails` 명령으로 메일러의
뼈대를 잡는다.

```console
$ bin/rails g mailer notification_mailer otp_notification
      create  app/mailers/notification_mailer.rb
      create  app/mailers/application_mailer.rb
      invoke  erb
      create    app/views/notification_mailer
      create    app/views/layouts/mailer.text.erb
      create    app/views/layouts/mailer.html.erb
      create    app/views/notification_mailer/otp_notification.text.erb
      create    app/views/notification_mailer/otp_notification.html.erb
      invoke  test_unit
      create    test/mailers/notification_mailer_test.rb
      create    test/mailers/previews/notification_mailer_preview.rb
$ 
```

참고:
[Commit bde504](https://github.com/hardenedlayer/caos/commit/bde504cd4c6d733bf76eaa06d5f2c46368f459e4)

이제, 아래와 같은 변경을 통하여, 원하는 위치에서 메일러가 호출되게
구성한다.

```diff
--- a/app/controllers/users_controller.rb
+++ b/app/controllers/users_controller.rb
@@ -26,6 +26,7 @@ class UsersController < ApplicationController
     # http://stackoverflow.com/a/88341/1111002
     @user.password = [*('a'..'z'),*('0'..'9')].shuffle[0,8].join
     @user.password_at = Time.now
+    NotificationMailer.otp_notification(@user).deliver_now
     debug "PASSWORD -------------------------- #{@user.password}"
   end

```

그리고 발송되는 메일의 틀도 잡아주고,

```diff
--- /dev/null
+++ b/app/mailers/application_mailer.rb
@@ -0,0 +1,4 @@
+class ApplicationMailer < ActionMailer::Base
+  default from: Figaro.env.mail_from
+  layout 'mailer'
+end
--- /dev/null
+++ b/app/mailers/notification_mailer.rb
@@ -0,0 +1,12 @@
+class NotificationMailer < ApplicationMailer
+
+  # Subject can be set in your I18n file at config/locales/en.yml
+  # with the following lookup:
+  #
+  #   en.notification_mailer.otp_notification.subject
+  #
+  def otp_notification user
+    @user = user
+    mail to: @user.mail
+  end
+end
```

미리보기를 위한 구성도 한다.

```diff
--- a/test/mailers/previews/notification_mailer_preview.rb
+++ b/test/mailers/previews/notification_mailer_preview.rb
@@ -3,7 +3,7 @@ class NotificationMailerPreview < ActionMailer::Preview
 
   # Preview this email at http://localhost:3000/rails/mailers/notification_mailer/otp_notification
   def otp_notification
-    NotificationMailer.otp_notification
+    NotificationMailer.otp_notification(User.first)
   end
 
 end
```

참고:
[Commit fe707a](https://github.com/hardenedlayer/caos/commit/fe707a35a5d268eddc71ca9f07978fd8a8e60467)



이제, 해당 기능이 동작할 때, 아래와 같이 메일 발송의 로그가 찍히는 것을
확인할 수 있다.

{:.wrap}
```console
Started POST "/users" for 127.0.0.1 at 2016-03-23 23:24:25 +0900
Processing by UsersController#create as HTML
  Parameters: {"utf8"=>"✓", "authenticity_token"=>"Erihuf9pGrLX8iNTYXbXPjx1B1QmoJ9y0Nqzrx1v5mlVXNLHqhSFp0/LAbmGPZ3yxKLQE1B2vLvlSgI5oSqsQQ==", "user"=>{"mail"=>"scinix@gmail.com"}, "commit"=>"등록"}
  User Load (0.2ms)  SELECT  "users".* FROM "users" WHERE "users"."mail" = ? LIMIT 1  [["mail", "scinix@gmail.com"]]
  Rendered notification_mailer/otp_notification.html.erb within layouts/mailer (0.6ms)
  Rendered notification_mailer/otp_notification.text.erb within layouts/mailer (0.4ms)

NotificationMailer#otp_notification: processed outbound mail in 9.2ms

Sent mail to scinix@gmail.com (6375.9ms)
Date: Wed, 23 Mar 2016 23:24:25 +0900
From: mailer@example.com
To: me@example.com
Message-ID: <56f2a719d6f6b_3a632f1b59c44192@silver.mail>
Subject: =?UTF-8?Q?CAOS:_OTP_=EC=95=8C=EB=A6=BC?=
Mime-Version: 1.0
Content-Type: multipart/alternative;
 boundary="--==_mimepart_56f2a719d6022_3a632f1b59c4402b";
 charset=UTF-8
Content-Transfer-Encoding: 7bit


----==_mimepart_56f2a719d6022_3a632f1b59c4402b
Content-Type: text/plain;
 charset=UTF-8
Content-Transfer-Encoding: base64

Q0FPUzogT1RQIOyVjOumvAoK7JWI64WV7ZWY7IS47JqUIHNjaW5peOuLmCEK
CuydtOuyiCDslZTtmLjripQgJ3FkaWtlenhoJyDsnoXri4jri6QuCgo=

----==_mimepart_56f2a719d6022_3a632f1b59c4402b
Content-Type: text/html;
 charset=UTF-8
Content-Transfer-Encoding: quoted-printable

<html>
  <body>
  생략
  </body>
</html>

----==_mimepart_56f2a719d6022_3a632f1b59c4402b--

Redirected to http://localhost:3000/users/1
Completed 302 Found in 6487ms (ActiveRecord: 17.5ms)
```

이렇게 발송된 메일은, 아래와 같이 발송 로그를 확인할 수도 있고,

![](/assets/logos/mailgun-logs.png){:.fit.dropshadow}

발송 통계를 볼 수도 있으며,

![](/assets/logos/mailgun-status.png){:.fit.dropshadow}

오고 가는 메일의 규모 등을 확인할 수도 있다.

![](/assets/logos/mailgun-tracking.png){:.fit.dropshadow}


---



{:#figaro}
# 하나 더! Figaro - Site 설정

간단한 In-House App이 아니라 배포 가능한 Application을 만드는 경우엔
각 사이트마다 다르게 설정되어야 하는 부분을 별도의 설정으로 만들어 담을
수 있다면 참 편리한 일이다. 메일 발송을 위한 API 설정도 이런 "Site 별
설정"에 속하게 되는데, 이 절에는 이런 App과 분리된 설정을 쉽게 할 수
있도록 지원하기 위해 태어난, [Figaro]라는 것을 써보려고 한다.

[Figaro]는 저장소에 설명되어 있듯이, Heroku에서 쉽게 이용할 수 있고
App의 설정을 안전하게 분리하여 다룰 수 있으며, [Twelve-Factor App]
사상에 기반하여 개발되어졌다.

[Figaro]:https://github.com/laserlemon/figaro
[Twelve-Factor App]:http://12factor.net/

Figaro를 설정하는 것은 아래와 같다.

```console
$ echo -e "\n# Tweakers\ngem 'figaro'" >> Gemfile
$ bundle install
<...>
Installing figaro 1.1.1
<...>
Bundle complete! 17 Gemfile dependencies, 60 gems now installed.
Bundled gems are installed into ./vendor/bundle.
$ 
```

위와 같이, `Gemfile`에 항목을 추가하고 Bundling 해주면 기반 준비는 다
된 샘이다. Figaro의 경우, 설치를 마친 후에, 아래와 같이 설치 명령을
내려주면, 이 기능을 활용하기 위한 파일 생성 등의 작업을 자동으로
진행해준다.

```console
$ bundle exec figaro install
      create  config/application.yml
      append  .gitignore
$ vi config/application.yml.dist
$ 
```

이제, Application 전용의 설정은 아래와 같이 `config/application.yml`
파일 내에서 처리할 수 있다.

```yml
# Add configuration values here, as shown below.
# vim: set ts=2 sw=2 expandtab:

# for SMTP mailer:
mail_from: "sender@example.com"
smtp_server: "smtp.example.com"
smtp_port: 587
smtp_domain: "smtp.example.com"
smtp_user: "postmaster@smtp.example.com"
smtp_pass: "488ab0000000000000000000000b95e260"

# Override for Production
production:
  mail_from: "sender@example.com"
```

```diff
--- a/config/application.rb
+++ b/config/application.rb
@@ -22,5 +22,17 @@ module Caos
 
     # Do not swallow errors in after_commit/after_rollback callbacks.
     config.active_record.raise_in_transactional_callbacks = true
+
+    # Mailer
+    #
+    config.action_mailer.delivery_method = :smtp
+    config.action_mailer.smtp_settings = {
+      :authentication => :plain,
+      :address => ENV["smtp_server"],
+      :port => ENV["smtp_port"],
+      :domain => ENV["smtp_domain"],
+      :user_name => ENV["smtp_user"],
+      :password => ENV["smtp_pass"]
+    }
   end
 end
```

자세한 변경 내용은
[Commit cefd27](https://github.com/hardenedlayer/caos/commit/cefd27d34183885e1d0f9d0eb3f27e455f330b36)
에서 찾을 수 있다.




# 하나 더! i18n Helper

먼저, `ApplicationController`에 다음의 메서드를 `before_action`으로
지정하여 사용자 브라우져의 설정에 따라 Locale을 설정할 수 있도록
하였다. 이 코드는 완전한 것은 아니어서, 만약 사용자가 지원되는
Locale(현재는 en과 ko)이 아닌 것으로 들어왔을 때에는 문제가 발생할
가능성이 있으며 브라우져 설정 외에 수동설정 등을 지원하지 않는다.

```ruby
def set_locale
  locale = request.env['HTTP_ACCEPT_LANGUAGE'].scan(/^[a-z]{2}/).first
  I18n.locale = locale || I18n.default_locale
  debug "locale set to '#{I18n.locale}'"
end
```

[Commit fe707a](https://github.com/hardenedlayer/caos/commit/fe707a35a5d268eddc71ca9f07978fd8a8e60467)

```diff
--- a/app/controllers/sessions_controller.rb
+++ b/app/controllers/sessions_controller.rb
@@ -28,14 +28,14 @@ class SessionsController < ApplicationController
       @session.login_at = Time.now
     else
       debug "Oops! login failed!"
-      flash[:error] = t(:invalid_password)
+      flash[:error] = 'i18n.auth.invalid_password'
       return redirect_to new_session_path
     end
 
```

```diff
--- a/app/views/layouts/application.html.erb
+++ b/app/views/layouts/application.html.erb
@@ -9,11 +9,11 @@
 <body>
 
 <% if current_session %>
-  <%= link_to t(:logout), logout_url %>
+  <%= link_to t('i18n.auth.logout'), logout_url %>
 <% end %>
 
-<p id="notice"><%= notice %></p>
-<p id="error"><%= flash[:error] %></p>
+<p id="notice"><%= t notice %></p>
+<p id="error"><%= t flash[:error] %></p>
 
 <%= yield %>
 
```

```diff
--- /dev/null
+++ b/app/helpers/i18n_helper.rb
@@ -0,0 +1,11 @@
+module I18nHelper
+  def translate(key, options={})
+    super(key, options.merge(raise: true))
+  rescue I18n::MissingTranslationData
+    puts "\e[31m### LOCALE: #{I18n.locale}, #{key}, #{options}\e[0m"
+    if key
+      key.split('.')[2..10].join(' ').split('_').join(' ').capitalize
+    end
+  end
+  alias :t :translate
+end
```

```diff
--- a/config/locales/en.yml
+++ b/config/locales/en.yml
@@ -1,8 +1,17 @@
 # Locale for English
+# vim: set ts=2 sw=2 expandtab:
 
 en:
-  notification_mailer:
-    otp_notification:
-      subject: "CAOS: OTP Notification"
-      greeting: "Hi, %{name}!"
-      body: "Your Password is '%{password}'"
+  i18n:
+    notification_mailer:
+      otp_notification:
+        subject: "CAOS: OTP Notification"
+        greeting: "Hi, %{name}!"
+        body: "Your Password is '%{password}'"
```

뭐, 대충 봐도 어떤 변화가 있는지 보이니까, 설명은 생략한다.



# Bootstrap first

이 길었던 글의 마지막은 Bootstrap에 대한 것이다. Bootstrap은 설명이 필요
없을 것 같은데, 웹의 표준화된 깔끔 UI의 대표주자라고나 할까? 그 동안
사용하지 않았었는데, 기왕에 시험적인 프로젝트이니 이것을 살짝 적용하여
맛을 봤다.

## 설치

Rails 세상에서 Bootstrap을 제공하는 방식은 다양하지만, 여기서는
`bootstrap-sass` Gem을 사용하는 방식을 써봤다. 아래와 같이 Gem 설정을
해주고,

```console
$ echo "gem 'bootstrap-sass'" >> Gemfile
$ bundle install
<...>
Installing autoprefixer-rails 6.3.4
Installing bootstrap-sass 3.3.6
<...>
Bundle complete! 18 Gemfile dependencies, 62 gems now installed.
Bundled gems are installed into ./vendor/bundle.
$ 
```

```diff
--- a/app/assets/javascripts/application.js
+++ b/app/assets/javascripts/application.js
@@ -14,3 +14,4 @@
 //= require jquery_ujs
 //= require turbolinks
 //= require_tree .
+//= require bootstrap-sprockets
--- a/app/assets/stylesheets/application.scss
+++ b/app/assets/stylesheets/application.scss
@@ -9,7 +9,6 @@
  * compiled file so the styles you add here take precedence over styles defined in any styles
  * defined in the other CSS/SCSS files in this directory. It is generally better to create a new
  * file per style scope.
- *
- *= require_tree .
- *= require_self
  */
+@import "bootstrap-sprockets";
+@import "bootstrap";
```

```diff
--- a/app/assets/stylesheets/application.scss
+++ b/app/assets/stylesheets/application.scss
@@ -10,5 +10,10 @@
  * defined in the other CSS/SCSS files in this directory. It is generally better to create a new
  * file per style scope.
  */
+@import "bootstrap-variables";
+
 @import "bootstrap-sprockets";
 @import "bootstrap";
+
+@import "sticky-footer";
+@import "bootstrap-overrides";
```

```scss
$footer-height:		60px;

html { position: relative; min-height: 100%; }
body { margin-bottom: $footer-height * 1.5; }
.footer {
	position: absolute;
	bottom: 0;
	width: 100%;
	height: $footer-height;
	background-color: $navbar-default-bg;
	border-top: 1px solid $navbar-default-border;
	color: $navbar-default-color;
	padding-top: 0.4rem;
	font-size: 0.9em;
}

body > .container,
body > .container-fluid { padding-top: $navbar-height * 1.2; }
```

이렇게 살짝 고쳐주면 일단 동작하는 것을 볼 수 있다.
(스크린샷은 이미 봤으니 생략)


## Form

Bootstrap Form을 사용하기 위해서는 아래처럼 별도의 Gem을 설치하여
사용할 수 있다.


```console
$ echo "gem 'bootstrap_form'" >> Gemfile
$ bundle install
<...>
Installing bootstrap_form 2.3.0
<...>
Bundle complete! 19 Gemfile dependencies, 63 gems now installed.
Bundled gems are installed into ./vendor/bundle.
$ 
```

```diff
--- a/app/views/users/_new.html.erb
+++ b/app/views/users/_new.html.erb
@@ -1,4 +1,4 @@
-<%= form_for(@user) do |f| %>
+<%= bootstrap_form_for(@user) do |f| %>
   <% if @user.errors.any? %>
     <div id="error_explanation">
       <h2><%= pluralize(@user.errors.count, "error") %> prohibited this user from being saved:</h2>
@@ -11,13 +11,8 @@
     </div>
   <% end %>
 
-  <div class="field">
-    <%= f.label :mail %><br>
-    <%= f.text_field :mail %>
-  </div>
-  <div class="actions">
-    <%= f.submit %>
-  </div>
+  <%= f.email_field :mail, icon: 'envelope' %>
+  <%= f.submit t('i18n.auth.login'), class: "btn btn-primary btn-block" %>
 <% end %>
 
 <%= @id %>
```

```diff
--- a/app/views/sessions/_new.html.erb
+++ b/app/views/sessions/_new.html.erb
@@ -1,14 +1,14 @@
-<%= form_for(@session) do |f| %>
-  <div class="field">
-    <%= f.label :user_id %><br>
-    <%= text_field_tag 'mail', @user.mail %>
+<%= bootstrap_form_for(@session) do |f| %>
+  <div class="form-group has-feedback">
+    <%= f.label :user_id, class: 'control-label' %>
+    <%= text_field_tag 'mail', @user.mail, class: 'form-control' %>
+    <span class="glyphicon glyphicon-envelope form-control-feedback"></span>
   </div>
-  <div class="field">
-    <%= f.label 'Password' %><br>
-    <%= text_field_tag 'password' %>
+  <div class="form-group has-feedback">
+    <%= f.label 'Password', class: 'control-label' %>
+    <%= password_field_tag 'password', '', class: 'form-control' %>
+    <span class="glyphicon glyphicon-lock form-control-feedback"></span>
   </div>
   <%= f.hidden_field :user_id %>
-  <div class="actions">
-    <%= f.submit %>
-  </div>
+  <%= f.submit t('i18n.auth.login'), class: "btn btn-primary btn-block" %>
 <% end %>
```

위와 같이, 보다 직관적으로 보이는 몇가지 수정을 통하여, 효과적으로
Form을 다룰 수 있게 되었다.

이 글의 목적 상, 세밀한 부분은 생략하려고 한다. 궁금한 점이 더 있다면
아래 URL을 참고하는 것이 좋겠다.



* <http://getbootstrap.com/css/>
* <http://getbootstrap.com/components/>
* <http://bootstrap-live-customizer.com/>

* <https://github.com/bootstrap-ruby/rails-bootstrap-forms>
* <https://github.com/bokmann/font-awesome-rails>


---

휴~  
하나의 글에서 너무 다양한 주제를 다루다 보니, 그리고 바쁘다는 핑계로
글을 전혀 쓰지 못하고 많은 날이 지나다 보니 아주 엉망인 글이 되어버렸다.

지친 글은 여기서 일단 접고, 다음에는 좀 더 주제에 접근하여,
[CAOS #2 SoftLayer Object Storage 다루기]를 보려고 한다.


긴 글, 쓰기에도 애썼고, 읽기에도 고생 많으셨습니다~!



# 외부연결

* <https://github.com/hardenedlayer/softlayer-object-storage-ruby>
* <https://github.com/hardenedlayer/caos>
* <https://github.com/softlayer/softlayer-object-storage-backup>

