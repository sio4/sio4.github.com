---
title: Cloud App에서 PaperTrail 사용하기
tags: ["logging", "monitoring", "cloud-computing"]
categories: ["cloudcomputing"]
image: /attachments/papertrail/ptrail-101-concept.jpg
banner: /attachments/papertrail/ptrail-101-concept.jpg
date: 2016-09-07 15:00:00 +0900
---
존재하지 않는 서버의 로그를 보려면 어떻게 해야 할까? 간단하다. 로그를
서버가 아닌 다른 곳에 저장해서 보면 된다. 더이상 서버가 존재하지 않는
클라우드컴퓨팅 환경에서 로그를 기록하고, 그 이상의 일을 하기 위해서,
다시 또다른 클라우드 서비스를 활용할 수 있는데, 그 중 하나가
Papertrail이다. (Part #2)


앞선 글 "[PaperTrail, Cloud에서는 Cloud 로그를!]"에서는 이렇게 "각종
로그를 서버가 아닌 다른 곳에 저장해서 보는" 기능을 제공하는
Papertrail이라는 서비스의 개요를 살펴봤다.  서비스 모델을 간단히
되집어보면, 아래 그림과 같이 일련의 로그를 하나의 지점에서 관리할 수
있도록 묶어주고, 그것을 바탕으로 검색과 경보 등을 포함하여 다양한 후속
작업을 할 수 있는 길을 제공하는 서비스이다.

![](/attachments/papertrail/ptrail-101-concept.jpg)

이번 글은, Cloud 위에 구성된 CAOS 앱에 이 서비스를 붙이는 과정을
기록하려고 한다. 실제로 Papertrail을 살펴보고 사용한 이유는, 앞선
연재의 (들어나지 않는) 주제인 "Cloud 환경을 고려한 서비스 개발"에서
고려할 사항 중 하나로써 로그 중앙화를 소개하기 위한 것이었다.

### Cloud Application 시리즈

* [CAOS, Cloud Album on Object Storage]
* [CAOS #1 Rails 기반 환경 구성]
* [CAOS #2 SoftLayer Object Storage 다루기]
* [CAOS #3 Rails Application의 성능 분석]

[PaperTrail, Cloud에서는 Cloud 로그를!]:{{< relref "/blog/cloudcomputing/2016-09-07-cloud-log-papertrail.md" >}}
[CAOS, Cloud Album on Object Storage]:{{< relref "/blog/development/2016-04-28-cloud-album-on-object-storage.md" >}}
[CAOS #1 Rails 기반 환경 구성]:{{< relref "/blog/development/2016-07-07-rails-env-especially-for-caos.md" >}}
[CAOS #2 SoftLayer Object Storage 다루기]:{{< relref "/blog/development/2016-09-05-softlayer-object-storage-and-caos.md" >}}
[CAOS #3 Rails Application의 성능 분석]:{{< relref "/blog/development/2016-09-06-rails-application-performance.md" >}}

# 로그 모으기

Papertail은 도움말 페이지에 몇가지 입력 방식에 대하여 설명하고 있지만,
기본적으로는 Syslog 프로토콜을 이용한 입력을 기반으로 한다. 통신 방식
자체는 동일하지만 설정에 있어서 약간의 차이가 있는데, 여기서는 시스템
Syslog에 필요한 설정을 추가하는 방식과 Application의 비표준 파일을
읽어서 쏴주는 방식에 대하여 정리한다. (다른 입력방식도 이 두 가지
방식에서 크게 벋어나지 않는다.)

## 시스템 Syslog 모으기

리눅스 시스템에서 널리 쓰이고 있는 rsyslog는 원격지의 syslog 서버에게
로그를 쏘아주는 기능을 가지고 있다. (뭐, syslog는 다 그렇다.) 이제,
어디로 쏴야하는지만 알면 되는데, Papertrail은 다음과 같이 설정페이지의
Log Destinations에서 설정을 할 수 있도록 하고 있다.

![.dropshadow](/attachments/papertrail/ptrail-405-destinations.png)

Destination은 `hostname:port` 형태로 제공되는데, Destination 당 서버와
Port를 달리하여 여러 Destination을 구성할 수 있다.

### Rsyslog 설정

Papertrail은 표준 syslog 프로토콜을 사용하고 있어서, Syslog에 익숙한
사용자라면 간단히 설정을 할 수 있다. 아래와 같이, 설정파일에 모든 로그를
원격 호스트에 Copy하도록 설정하면 끝이다.

```console
$ cat <<EOF |sudo tee /etc/rsyslog.conf
> 
> # papertrail
> *.*    @logs0.papertrailapp.com:40000
> EOF

# papertrail
*.*    @logs0.papertrailapp.com:40000
$ 
```

이제 서비스를 다시 시작하면 Papertrail로 로그가 날라가게 된다.

```console
$ sudo service rsyslog restart
$ 
```

## Application 로그 모으기

Papertrail은 개발 언어에 따른 Library나 API를 별도로 제공하지 않는다.
대신, `remote-syslog`라는 패키지를 자체적으로 배포하고 있으며, 이것을
설치하고 설정해주면 모든 파일 기반의 로그를 수집할 수 있다.

```console
$ wget https://github.com/papertrail/remote_syslog2/releases/download/v0.17-beta-pkgs/remote-syslog2_0.17_amd64.deb
$ sudo dpkg -i remote-syslog2_0.17_amd64.deb 
Selecting previously unselected package remote-syslog2.
(Reading database ... 73174 files and directories currently installed.)
Preparing to unpack remote-syslog2_0.17_amd64.deb ...
Unpacking remote-syslog2 (0.17) ...
Setting up remote-syslog2 (0.17) ...
insserv: warning: script 'K01apf' missing LSB tags and overrides
insserv: warning: script 'apf' missing LSB tags and overrides
Processing triggers for systemd (229-4ubuntu5) ...
Processing triggers for ureadahead (0.100.0-19) ...
$ 
```

설정파일은 아래와 같이, YML 형태로 작성된다.

파일: `/etc/log_files.yml`

```yml
files:
  - /var/www/apps/caos/log/production.log
  - /var/log/nginx/access.log
  - /var/log/nginx/error.log
destination:
  host: logs0.papertrailapp.com
  port: 40000
  protocol: tls
exclude_patterns:
  - don't log on me
```

직관적으로 이해할 수 있겠지만, 수집하기를 원하는 파일을 하나씩 적어주고,
destination 정보를 설정해주면 된다. 이 예에서는, Nginx의 로그와 App의
로그를 잡아주었다.

[여기](http://help.papertrailapp.com/kb/configuration/configuring-centralized-logging-from-ruby-on-rails-apps/)에서 Ruby 환경의 Papertrail 사용에 대한
보다 상세한 내용을 확인할 수 있다.

아무튼, 이제 설정이 마무리되었으면 다음과 같이 데몬을 시작한다.

```console
superhero@caos:~$ sudo service remote_syslog start
superhero@caos:~$ sudo service remote_syslog status
● remote_syslog.service - LSB: Start and Stop
   Loaded: loaded (/etc/init.d/remote_syslog; bad; vendor preset: enabled)
   Active: active (running) since Sun 2016-05-15 07:57:35 UTC; 2s ago
     Docs: man:systemd-sysv-generator(8)
  Process: 16144 ExecStart=/etc/init.d/remote_syslog start (code=exited, status=
    Tasks: 10 (limit: 512)
   CGroup: /system.slice/remote_syslog.service
           └─16150 remote_syslog -c /etc/log_files.yml --pid-file=/var/run/remot

May 15 07:57:35 caos.example.com systemd[1]: Starting LSB: Start and Stop...
May 15 07:57:35 caos.example.com remote_syslog[16144]: Starting remote_syslog
May 15 07:57:35 caos.example.com systemd[1]: Started LSB: Start and Stop.
superhero@caos:~$ 
```

끝!




# 모아둔 로그 사용하기

## 통합 검색

지난 글에서 보았던 것과 같이, 모든 시스템의 로그를 한 번에 보거나 개별
서버의 로그만 보거나, 또는 아래 그림과 같이 특정 문자열로 검색을 하여
로그를 찾아볼 수 있다. 그리고 경보의 발생은, 이러한 검색을 바탕으로 한다.

![.dropshadow](/attachments/papertrail/ptrail-210-filtered.png)

## 경보! 상황발생!

아래의 그림은, "Album #4"라는 이름의 검색(Search)에 Slack 메시지 방식의
경보(Alert)를 붙인 것이다. 경보 상세를 보면, 1회라도 사건이 발생하면 매
1분 간격으로 한국시간 기준의 메시지를 발송하겠다고 정의하고 있다. 또한,
Slack에 메시지를 보내는 URL을 정의하고 있다. (이 부분은 좀 더 설명이
필요하지만, 우리의 주제는 아니니까 생략)

![.dropshadow](/attachments/papertrail/ptrail-321-alert-edit.png)

이번에는 Application 개발자가 명시적으로 경보를 발생시킬 수 있도록
사전에 정의된 경보를 만들어봤다. 단순히, `ALERT`라는 문자열이 보이면
위의 경보와 비슷한 방식으로 메시지를 보내개 한 것인데, 아래 화면은
이렇게 두 가지 검색에 대한 경보가 Slack 앱에 수신된 모습이다.

![.dropshadow](/attachments/papertrail/ptrail-slack-alert.png)

이렇게 되면, 개발자는 자신이 경보를 받고 싶은 로그를 생성할 때,
의도적으로 ALERT이라는 문자열을 추가하여 경보를 받도록 프로그래밍을
할 수 있다.


쓸만하다!
