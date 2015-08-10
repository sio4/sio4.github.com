---
redirect_from: /blog/2011/08/22/cloudfoundry-getting-started/
title: CloudFoundry, Getting Started
tags: 클라우드컴퓨팅 CloudFoundry 개발 PaaS Ubuntu
date: 2011-08-22T17:01:43+09:00
modified: 2011-08-22T17:06:06+09:00
---
CloudFoundry 맛보기. 이 정도로 사실, 맛을 볼 수는 없겠으나 일단 시간과 능력의
부족으로 Getting Started Guide를 따라해보는 수준으로 정리, 간만에 신세계
구경도 하고 짧게 나마 포스팅도 한다.

먼저, <http://www.cloudfoundry.com> 에서 계정 신청을 해야하는데, 몇일 전에
CloudFoundry와 Ubuntu와의 뭔가 끈끈한 관계에 대한 글을 읽고 자극을 받아서
한 번 신청해봤는데, 오늘 메일함을 보니 계정 생성 메일이 와있었다.
(초대형식으로 가입된다는 이야기)

## 준비하기

특이한 점이, 웹 인터페이스가 없는 것 같다. 비슷한 서비스인
[heroku](http://www.keroku.com) 의 경우에는 기본적인 정보 열람 등이 가능한
웹 인터페이스가 있는데, CloudFoundry는 그게 없다. 아마도 현재는 Beta
상태이므로 상용 서비스가 시작되는 시점에는 뭔가 포털이 생기지 않을까?
아무튼, command line 모드 클라이언트인 vmc를 설치해야 한다.

vmc는 ruby gem 형태로 배포되는데, 다음과 같이 설치가 가능하다.
(물론 리눅스 이야기, 그리고 ruby 설치 등은 생략)

{% highlight console %}
sio4@silver:~$ gem install --user-install --no-rdoc --no-ri vmc
Successfully installed json_pure-1.5.3
Successfully installed rubyzip2-2.0.1
Successfully installed highline-1.6.2
Successfully installed terminal-table-1.4.2
Successfully installed vmc-0.3.12
5 gems installed
sio4@silver:~$
{% endhighlight %}{:.dark}

## 시작하기

이제 CloudFoundry에 로그인을 해야한다. 그런데 특이한 점은 CloudFoundry의
독특한 성격. 즉, 배포와 사용이 가능한 "Open PaaS"라는 점 때문에 어디로
로그인할 것인지 "target"을 정하는 과정이 있다는 점이 특이하다.

{% highlight console %}
sio4@silver:~$ vmc target api.cloudfoundry.com
Succesfully targeted to [http://api.cloudfoundry.com]

sio4@silver:~$ vmc login
Email: nobody@example.com
Password: ****************
Successfully logged into [http://api.cloudfoundry.com]

sio4@silver:~$ vmc passwd
Changing password for 'nobody@example.com'
New Password: *********
Verify Password: *********

Successfully changed password

sio4@silver:~$
{% endhighlight %}{:.dark}

첫번째 로그인이라서 암호도 바꿔줬다. (가입 완료 메일에 임시 비번이 딸려온다.)

## 개발하기

이제 간단하게 어플리케이션을 하나 개발(?)해볼 차례.

{% highlight console %}
sio4@silver:~$ mkdir app_name
sio4@silver:~$ cd app_name/
sio4@silver:~/app_name$ cat > app_name.rb << EOF
> require 'sinatra'
> get '/' do
>   "Placeholder"
> end
> EOF
sio4@silver:~/app_name$ vmc push
Would you like to deploy from the current directory? [Yn]:
Application Name: app_name
Application Deployed URL: 'app_name.cloudfoundry.com'?
Detected a Sinatra Application, is this correct? [Yn]:
Memory Reservation [Default:128M] (64M, 128M, 256M, 512M, 1G or 2G)
Creating Application: OK
Would you like to bind any services to 'app_name'? [yN]:
Uploading Application:
  Checking for available resources: OK
  Packing application: OK
  Uploading (0K): OK
Push Status: OK
Staging Application: OK
Starting Application: OK

sio4@silver:~/app_name$
{% endhighlight %}{:.dark}

크핫! 이제 http://app_name.cloudfoundry.com 에 접속해보면, 짜잔~ 한 줄 뜬다.
:-( 어쨌든 정상 작동!

![CF](/attachments/2011-08-22-cloudfoundry.png){:.fit.dropshadow}

이야~~ 멋지지 않아? "준비하시고~", "시~", "작!" 하면 딱 뜨는데...
왜 클라우드를 안써? 아니, 왜 가상화만 생각해? 이게 궁극의 클라우드 아닌감?
**게다가 CloudFoundry의 멋진 "Open PaaS" 정책**은 (자세히 살펴보지는 않았지만)
데이터 유출의 걱정도 없이 **Private PaaS의 구축을 쉽게 해줄 것** 같은 느낌.
이거 좀 파봐야겠는데...

아하... 이럴 땐 여건에게 핑계를!!

참고로, 정보 보기

{% highlight console %}
sio4@silver:~$ vmc info

VMware's Cloud Application Platform
For support visit http://support.cloudfoundry.com

Target:   http://api.cloudfoundry.com (v0.999)
Client:   v0.3.12

User:     nobody@example.com
Usage:    Memory   (128.0M of 2.0G total)
          Services (0 of 16 total)
          Apps     (1 of 20 total)

sio4@silver:~$
{% endhighlight %}{:.dark}

앱 스무개라... 음... 좋네~ ㅋ

