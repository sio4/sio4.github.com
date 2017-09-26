---
title: CAOS, Cloud Album on Object Storage #1
tags: 클라우드컴퓨팅 SoftLayer 개인프로젝트 Object-Storage 사진
categories: ["development"]
image: /attachments/20160428-caos/caos-202-sel-2.png
banner: /attachments/20160428-caos/caos-202-sel-2.png
date: 2016-04-28 02:10:00 +0900
---
뜻하지 않던 파일 공유도 할 겸, SoftLayer의 Object Storage에 대한 API
시험도 할 겸 간단하게 Web Application을 하나 만들어봤다. 이름하여
**CAOS**. **Cloud Album on Object Storage**를 줄여 만든 이름이다.

뭐, 간단하게 짜투리시간 모아서 이틀만 투자하려고 했는데 생각만큼 시간도
나지 않았고, 진행하면서 만나게 된 크고 작은 문제가 도와주기도 하여 1박
2일 프로젝트가 아닌 2주 짜리 프로젝트가 되어버렸다. :-( 그리고 또 정리를
못한 채로 다시 2주 정도가 지나벼렸지만, 그 과정을 기록으로 남겨 훗날의
기억이 가물가물한 나를 포함한 다른 사람들이 참고할 수 있도록 하려고 한다.

그 과정에서 이미 만들어진 기록이 더 있으니 참고하기 바라며,

* [SoftLayer Object Storage와 임시 URL]
* [SoftLayer Object Storage와 임시 URL #2]

이 글에서는 프로젝트의 개요만 간략하게 기술하고 실제의 작업 과정에 대한
나머지 기록은 다음과 같은 3부작으로 나눠 기록하려고 한다. (내가 뭐,
스타워즈, 인디아나존스, 백 투 더 퓨쳐 같은 3부작 시리즈를 워낙에 좋아해서
이렇게 한 것은 아니다. 그냥 우연의 일치!)

* [CAOS #1 Rails 기반 환경 구성]
* [CAOS #2 SoftLayer Object Storage 다루기]
* [CAOS #3 Rails Application의 성능 분석]


참고로, 프로젝트는 <https://github.com/hardenedlayer/caos>에서 관리되고
있다.


[SoftLayer Object Storage와 임시 URL]:{% post_url development/2016-03-22-tempurl-for-softlayer-object-storage %}
[SoftLayer Object Storage와 임시 URL #2]:{% post_url development/2016-03-31-tempurl-for-softlayer-object-storage-2 %}
[CAOS #1 Rails 기반 환경 구성]:{% post_url development/2016-07-07-rails-env-especially-for-caos %}
[CAOS #2 SoftLayer Object Storage 다루기]:{% post_url development/2016-09-05-softlayer-object-storage-and-caos %}
[CAOS #3 Rails Application의 성능 분석]:{% post_url development/2016-09-06-rails-application-performance %}





# 어떤 것을 만들려고 하는가
{:.no_toc}

이번에 작성한 Application은 클라우드(Object Storage) 위에 저장되어있는
사진을 열람하고 내려받을 수 있도록 해주는 Application인데, 다음과 같은
요건으로 개발을 하였다.

### 기능 정의

* 사용자(Model: User)
  * 메일주소를 구분자로 사용
  * 로그인은 메일을 이용한 One-Time-Password 방식으로 진행(가입과정 없음)
* 앨범(Model: Album)
  * Object Storage 상의 Container와 1:1 매핑
  * Container 내의 모든 이미지 파일을 하나의 페이지에서 "앨범"으로 표시
* 선택(Model: Selection)
  * 사용자는 앨범에서 관심있는 사진을 골라서 가상으로 저장 (선택)
  * 선택은 독립적인 View로 관리됨

* 업무 흐름
  * 로그인한 사용자는 "새 앨범" 메뉴를 통하여 앨범 구성을 할 수 있다.
  * 구성된 앨범은 모든 사용자에게 공개된다.
  * 만들어진 앨범은 해당 사용자만 수정/삭제가 가능하다.
  * 비공개 앨범을 만들어 공유 그룹에게만 공유할 수도 있다. (미구현)
  * 사용자는 앨범을 열람할 수 있고, 개별 사진을 내려받을 수 있다.
  * 사용자는 원하는 사진들을 선택하여 따로 볼 수 있다.
  * 선택한 사진 묶음을 한 번에 내려받을 수 있다. (미구현)


### 개발환경과 방식

* Rails로 빠르게 작성한 Web Application
* 그래서 SoftLayer Object Storage API는 Ruby 버전을 사용
* API 방식의 서비스가 아닌 일반 Web Service로 개발

### 데이터 관리

* 기본적으로, 유지되어야 하는 모든 데이터는 Compute Instance에 저장하지
  않으며, Stateless 환경을 유지한다.
* 서비스되는 사진은 기본적으로 SoftLayer의 Object Storage에 저장한다.
* 자동생성되는 Thumbnail은 Compute Instance에 임시 저장한다.
* 사용자 정보와 앨범 정보, 가상의 선택 목록은 일단 Local DBMS에 저장한다.
  (현재는 클라우드 컴퓨팅의 특성이 반영되지 않은 부분)

### 클라우드 컴퓨팅 적용

* 이미 말한 바와 같이, Compute Instance에는 Stateless로 구현한다.
* 따라서, Compute Instance에 영구저장되는 데이터가 없다.
* 보존되어야 하는 정적 데이터는 Object Storage를 활용한다.
* 보존되어야 하는 동적 데이터는 DBaaS를 활용했으면 좋겠다만,
  * 당장은 구현환경의 제약이 있으니 Local/File 기반 DBMS를 활용한다.
  * 단일 Instance만 사용하는 것을 가정하여, DBMS의 변경이 일어날 때,
    그 복사본을 Object Storage에 복사/보관하는 것을 고려한다.
  * Instance가 재배포될 때, DBMS의 최종 버전을 Object Storage로부터
    자동 Deploy하는 것을 고려한다.
* 다시 만들어낼 수 있는 데이터는 언제든 자동으로 만들어지도록 구성한다.



# 예고편! - 어떤 것을 만들었나?

뭐, 동작하는 모습을 먼저 보면 이렇다.

사이트에 방문하면 처음 우리를 반기는 것은 반가움이 넘치는 인사와
메일주소로 당신을 밝히라는 창.

![](/attachments/20160428-caos/caos-001-home.png){:.fit.dropshadow}

메일 주소를 넣어주면 비로소 로그인 화면으로 넘어간다. 아래와 같이
일회용 암호(One-Time-Password)를 넣으라고 하는데,

![](/attachments/20160428-caos/caos-002-login.png){:.fit.dropshadow}

이 일회용 암호는 앞서 입력한 메일주소를 향해서 이미 발송이 된 상태.
MUA를 열어보면 아래와 같이 메일이 와 있다. 이제 저 자동생성된 암호를
넣고 로그인을 하면 된다.

![](/attachments/20160428-caos/caos-900-otp.png){:.fit.dropshadow}

인사성이 바른 CAOS는, 다시 인사를 한다. 지금은 앨범이 없는 상태라서
별 내용이 없다.

![](/attachments/20160428-caos/caos-003-welcome.png){:.fit.dropshadow}

새 앨범을 만들기 위해, 상단 메뉴의 "새 앨범"을 클릭해주면 아래와 같은
입력창이 나타나고, 적절히 내용을 채워주면 앨범이 생성된다.

![](/attachments/20160428-caos/caos-004-new-album-1.png){:.fit.dropshadow}

앨범이 생성되고 나면 바로 해당 앨범 페이지로 진입을 하는데,
아래 그림처럼, 아직 Thumbnail이 만들어지지 않은 부분은 공백으로
표시가 된다.

![](/attachments/20160428-caos/caos-100-new-album-2.png){:.fit.dropshadow}

다시 첫화면으로 이동하면 이제는 앨범이 하나 만들어져 있음을 알 수
있다.

![](/attachments/20160428-caos/caos-110-albums.png){:.fit.dropshadow}

다시 앨범을 클릭하여 앨범 페이지로 진입하면, 이제는 보이지 않던
Thumbnail도 만들어져 있는 것을 볼 수 있다. (물론, 이 과정은 시간이
소요되는 과정으로, 맨 처음 볼 때에는 많이 느리게... 만들어진다.)

![](/attachments/20160428-caos/caos-200-album-list.png){:.fit.dropshadow}

앨범을 구경하다가, 맘에 드는 사진이 있다면 사진 하단의 Checkbox를
선택해주는 과정을 반복하여 주고, 마지막에 맨 아래의 "선택으로 저장"
버튼을 눌러주면 선택된 사진의 묶음이 만들어진다.

![](/attachments/20160428-caos/caos-201-sel-1.png){:.fit.dropshadow}

이렇게, 원하는 사진만 따로 볼 수 있도록 되는 것이다.

![](/attachments/20160428-caos/caos-202-sel-2.png){:.fit.dropshadow}

다시 첫화면에 가보면, 이번에는 앨범과 함께 선택도 나타나는 것을 볼
수 있다.

![](/attachments/20160428-caos/caos-203-home.png){:.fit.dropshadow}





# 설치하기

중요한 얘기는 아닌데, 혹시라도 이 Application을 직접 사용해 보려면,
아래와 같은 방식으로 간단히 설치와 구동을 할 수 있다.

## 환경의 준비

이 Application은 Rails 기반의 Application이며, Git으로 관리가 되고
있다. 다음과 같은 Package 들을 설치하면 구동을 위한 기본 환경이
만들어진다.

```console
$ sudo apt-get install git git-man liberror-perl
$ sudo apt-get install ruby bundler
$ sudo apt-get install zlib1g-dev libsqlite3-dev
$ sudo apt-get install nodejs
```

마지막으로, 이 Application이 Thumbnail을 만들어낼 때 사용하는 도구인
ImageMagick를 설치해줘야 한다.

```console
$ sudo apt-get install imagemagick
```

## CAOS의 설치 및 실행

먼저, 다음과 같은 방식으로 저장소로부터 작업 사본을 받고, 필요한 Gem을
설치해준다. 그리고 마지막으로, 메일 발송을 위한 설정을
`config/application.yml` 파일에 해주어야 정상적으로 동작하게 된다.
(예시 파일을 복사하여 원하는 부분을 수정해주면 된다.)

```console
$ git clone https://github.com/hardenedlayer/caos.git
$ cd caos
$ bundle install --path vendor/bundle
$ cp config/application.yml.dist config/application.yml
$ vi config/application.yml
$ 
```

이제, DBMS 초기화 및 Asset 환경을 만들 차례이다. Production 환경으로
가정하였을 때, 아래와 같은 명령을 내려주면 된다.

```console
$ RAILS_ENV=production bin/rake db:migrate
$ RAILS_ENV=production bin/rake assets:precompile
```

그리고 Puma 서버를 띄우면 끝!

```console
$ bundle exec puma -e production
Puma starting in single mode...
* Version 3.2.0 (ruby 2.3.0-p0), codename: Spring Is A Heliocentric Viewpoint
* Min threads: 0, max threads: 16
* Environment: production
* Listening on tcp://0.0.0.0:9292
Use Ctrl-C to stop
```

Unix Socket을 사용하려면 아래와 같이 추가 옵션을 주면 된다.

```console
$ bundle exec puma -e production -b unix:///tmp/puma.caos.sock
Puma starting in single mode...
* Version 3.2.0 (ruby 2.3.0-p0), codename: Spring Is A Heliocentric Viewpoint
* Min threads: 0, max threads: 16
* Environment: production
* Listening on unix:///tmp/puma.caos.sock
Use Ctrl-C to stop
```

이렇게 짧은 과정을 Script로 작성하여 VM, VSI와 함께 배포한다면, 매우
간단하게 CAOS를 배포할 수 있게 된다.


---



아무튼, 개봉 박두!

* [CAOS #1 Rails 기반 환경 구성]
* [CAOS #2 SoftLayer Object Storage 다루기]
* [CAOS #3 Rails Application의 성능 분석]






# 외부연결

* <https://github.com/hardenedlayer/softlayer-object-storage-ruby>
* <https://github.com/hardenedlayer/caos>
* <https://github.com/softlayer/softlayer-object-storage-backup>

