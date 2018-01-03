---
title: "Calling All Logs! Graylog2 3편: 설정"
subtitle: 모든 로그를 한 곳에서 관리하고 분석하세요
tags: Graylog2 logging monitoring cloud-computing
categories: ["sysadmin"]
image: /attachments/graylog2/graylog-logo.png
banner: /attachments/graylog2/graylog-logo.png
date: 2017-10-13T10:00:00+09:00
---
오픈소스 로그 관리/분석 시스템인 [Graylog]는 앞선 글에서 간단히 살펴본 것과
같이, 로그 관리에 대한 핵심 기능을 모두 갖추고 있으며 편리한 사용자 환경을
제공하고 있다. 이 글에서는, 앞서 살펴본 사용자 관점의 사용성 외에, 이러한
기능 제공을 위한 부수적인 설정과 관리 편의 기능을 정리한다.

![](/attachments/graylog2/graylog-logo.png)

이 이야기는 설치, 맛보기, 추가설정, 그리고 자잘한 기록을 담은 네 편의
글로 이루어져 있다. 내용이 독립적이어서 순서에 큰 관계가 없으니 원하는
글부터 읽어도 된다. (마지막편은 읽을 것이 없어요)

{:.angle}
* [Calling All Logs! Graylog2 1편: 설치하기]
* [Calling All Logs! Graylog2 2편: 맛보기]
* _Calling All Logs! Graylog2 3편: 추가설정_
* [Calling All Logs! Graylog2 4편: 기록]

{:.boxed}
> 오픈소스 로그분석 시스템인 [Graylog]에 대한 문서는 [Graylog Docs]에서
> 찾을 수 있으며, [Graylog Github]에서 그 소스를 받아볼 수 있다.



## 추가 설정, 개요

* toc
{:toc .pull-right}

첫번째 글에서 살펴본 것처럼, Graylog는 MongoDB와 ElasticSearch를 백엔드로
하고 있다. ElasticSearch는 일종의 검색엔진이면서 데이터 저장소인데, 모든
저장소가 그렇듯이 데이터 저장소를 사용하다 보면, 데이터가 많이 쌓이면서
시스템이 급격하게 느려지는 현상이 발생할 수 있으므로 이를 적정한 수준으로
유지해줘야 하는 노력이 필요하며, 오래된 데이터를 별도 보관하거나 삭제해야
하는 등, "데이터 관리"라는 숙제가 떨어진다.

또한, 두번째 글에 등장하는 Slack을 통한 경보 전송이나 메일 발송 등의 기능을
사용하기 위해서는, 이러한 기능을 제공하는 통신 모듈을 설정해야 하며, 지도를
이용한 IP 주소의 지리적 시각화 역시 이를 위한 추가 설정을 필요로 한다.

위의 내용을 비롯하여 사용자 관리, 사용자가 만들어 넣은 규칙 등에 대한 백업,
클러스터 노드 건강 관리 등, 뒷쪽에 숨어있는 작업들이 관리자에게는 꽤 부담을
주는 작업으로 남을 수 있는데, Graylog는 이 중 상당 부분을 자신의 웹 화면을
통하여 훌륭하게 지원해주고 있다.



## 구성정보

먼저, 가장 기본이 되는 전체 구성정보이다.

화면 구성 상, 상단 메뉴바의 오른쪽에 위치한 "System/Overview" 메뉴를 통해,
아래와 같은 시스템 정보를 확인할 수 있다.
아래와 같이, Graylog 시스템 차원의 문제점, 현재 동작중인 작업, Graylog
클러스터 정보, ElasticSearch 클러스터 정보, 인덱서 문제 등을 확인할 수
있으며,

![](/attachments/graylog2/graylog-510-overview-1.png){:.dropshadow}

아래쪽으로 내려가보면, 시스템 시간 정보(로그 관리 시스템에서 시간은 매우
중요한 정보다.) 시스템 메시지 등의 정보도 확인이 가능하다.

![](/attachments/graylog2/graylog-510-overview-2.png){:.dropshadow}

그리고 설정 부분에는 아래와 같이 Plugins에 대한 항목이 등장하는데, 아래
보는 바와 같이, 이 시스템에는 Geo-Location Processor가 구성되어 있다.
(이 얘기는 다시 등장한다)

![](/attachments/graylog2/graylog-511-conf-plugins.png){:.dropshadow}

사실, 특별한 것은 없는 부분이긴 하다. :-)



## Mail 발송을 위한 설정

스트림에서 문제가 파악되면, 그것을 메일로 발송할 수 있도록 Receiver를
지정하는 과정에 대하여 두 번째 글에서 알아봤었다. 이 때, 메일이 실제로
쏴지기 위해서는 아래와 같이, SMTP 관련 설정이 되어 있어야 한다. 대체로
직관적으로 알 수 있는 부분인데, 아래 주석으로 처리된 부분은 인증에 대한
부분이다. 내 경우에는 `localhost`의 기능을 활용했기 때문에 별도의 인증을
하지는 않았다. 그러나 클라우드 환경이라면 서버 자체의 메일러를 이용하는
경우보다 외부의 메일 전송 서비스를 이용해야 하는 경우가 많이 발생한다.
이 때에는 아래의 설정을 이용하여 구성을 해줄 수 있다.

```config
# Email transport
transport_email_enabled = true
transport_email_hostname = 127.0.0.1
transport_email_port = 25
transport_email_use_auth = false
transport_email_use_tls = false
transport_email_use_ssl = false
#transport_email_auth_username = you@example.com
#transport_email_auth_password = secret
#transport_email_subject_prefix = [graylog]
#transport_email_from_email = graylog@example.com
```


## Slack 연동

많은 사람들에게 사랑받는 메시징 서비스 중의 하나인 Slack은 아래와 같이 별도의
Plugin을 설치하여야 사용할 수 있다. 배포되는 파일을 받아서, 패키지 설치 명령을
통해 설치해주면 간단하게 설정이 완료된다.

```console
$ wget https://github.com/Graylog2/graylog-plugin-slack/releases/download/2.2.1/graylog-plugin-slack-2.2.1.deb 
$ sudo dpkg -i graylog-plugin-slack-2.2.1.deb 
$ 
```


## GeoIP

GeoIP는 IP 정보를 지리적 위치와 Mapping하는 서비스 또는 그 데이터베이스를
의미한다. 아래와 같이, GeoIP Database 중, 무료로 제공되고 있는 City 정보를
받아서 적당한 위치에 넣는다.

```console
$ sudo mkdir /var/local/graylog
$ wget -nv http://geolite.maxmind.com/download/geoip/database/GeoLite2-City.mmdb.gz -O - |zcat |sudo tee /var/local/graylog/GeoLite2-City.mmdb >/dev/null
2016-08-12 13:26:33 URL:http://geolite.maxmind.com/download/geoip/database/GeoLite2-City.mmdb.gz [35671748/35671748] -> "-" [1]
$ 
```

위의 예에서는 `/var/local/graylog/GeoLite2-City.mmdb`를 그 설치 경로로
하고 있는데, 이제 아래의 설정으로 들어가서 그 경로를 지정해주면 구성이
완료된다.

`System / Configurations > Plugins > Geo-Location Processor`



## 노드 관리

Graylog 클러스터는 다량의 데이터를 처리하는 클러스터이며, 그만큼 메모리
사용량과 I/O 처리량에 대한 주의를 필요로 한다. Graylog는 아래와 같이,
각 노드의 현황을 관리할 수 있는 환경을 제공하며, 이 화면을 통하여 각
노드에 얼마나 많은 부하가 걸리고 있는지, 메모리 사용량에 부담은 없는지
등의 다양한 정보를 확인할 수 있다.

![](/attachments/graylog2/graylog-520-nodes.png){:.dropshadow}

좀더 자세한 정보를 보게 되면, 아래와 같이 상태정보 요약을 함께 볼 수
있으며 메모리, Heap 상태 외에도 처리량에 따른 Buffer의 상태에 대해서도
확인할 수 있다. (실제로 데이터가 밀려 들어오면, 저 그래프들이 쭉~ 쭉~
올라가는 것을 볼 수 있는데 아쉽게 샷이 없네.) I/O 의존성이 큰 만큼,
Disk Journal에 대해서도 친절하게 설명하고 있다.

![](/attachments/graylog2/graylog-521-nodes-details.png){:.dropshadow}




## 편리한 인덱스 관리

Graylog의 관리 기능 중, 어떤 면에서는 가장 중요한 부분이 바로 이 인덱스
관리 부분이다. 인덱스 관리 화면은 아래와 같다.

![](/attachments/graylog2/graylog-540-indices.png){:.dropshadow}

상단의 Settings 부분을 보면 자동화된 인덱스 관리를 위한 설정 부분을
확인할 수 있다. 현재 설정된 값을 보면, 시간을 기준으로 Rotation을 하도록
구성되어 있으며 그 주기가 1주라는 것, 그리고 20개를 보관할 수 있고 지난
인덱스는 삭제하도록 설정된 것을 볼 수 있다.

그림의 아래쪽에 취치한 `graylog_2`라는 이름이 붙은 부분을 보면 deflector
라고 라벨이 붙어있다. 이 인ㄷㄱ스가 현재 데이터가 쌓이고 있는 인덱스인데,
그 아래에 shard 상황에 대한 정보 현재의 구성과 함께 나온다. (S0 ~ S3)

화면을 더 내려보면 아래와 같은 부분이 나온다. (일부 이미지 중첩이 있으니
참고)

![](/attachments/graylog2/graylog-541-indices-old.png){:.dropshadow}

현재 데이터가 쌓이고 있는 `graylog_2` 의 바로 전 인덱스인 `graylog_1`이
아래에 보이는데, 설명을 보면 3일 전의 데이터를 담고 있다는 설명이 있다.
그리고 아래에는 이 인덱스를 닫거나 지울 수 있는 버튼이 나온다.

이 버튼은 각 인덱스의 상태에 따라 달라지는데, 맨 위의 활성 인덱스는
"안돼, 안돼"라고 써있고, 이미 닫혀있다는 라벨이 붙어있는 0번째 인덱스의
경우에는 "다시 열기" 버튼만 표시되어 있다.

이 화면을 제공함으로써, 우리는 생각보다 직관적이고 편리하게 인덱스를
관리할 수 있을 뿐만 아니라, 데이터 크기에 대한 감이 있다면 완전 자동화된
관리를 하도록 설정할 수도 있다.



## Role을 지원하는 사용자 관리

다음은 사용자 관리 부분인데, 이 부분에는 만족과 아쉬움이 공존한다. 일단
그림을 보면 아래와 같이, 여러 사용자를 등록하여 관리할 수 있도록 되어있다.
그리고 각각에 대하여 Role을 부여하여 별도의 권한을 줄 수 있는 구조가
마련되어 있다. (Role 관리 화면은 그냥 지웠지만 비슷한 모양으로 되어있다.)

![](/attachments/graylog2/graylog-550-users.png){:.dropshadow}

사용자를 찍어서 들어가보면 다음과 같은 상세 설정 화면을 만나게 된다.
이름 등의 기본정보 외에. 스트림에 대한 권한, 대시보드에 대한 권한 등을
설정할 수 있다. 이러한 세부 권한 설정을 통하여, 각 관리자의 성격과 권한에
맞는 기능 제공을 할 수 있다.

![](/attachments/graylog2/graylog-551-users-details.png){:.dropshadow}

나름 깔끔하고 정리가 잘 되어있으나 아쉬운 부분이 있다. 바로, 사용자에게
Role을 줄 수는 있으나 그룹으로 관리하거나, Tenant 개념을 적용할 수 없다는
점이다. 특히, Tenant 개념은, 단지 사용자에 걸려있는 부분이 아니라,
입력부터 출력에 이르는 전체 환경에 대한 구분이 필요한 부분인데, 이것이
지원되지 않는 것이 내가 이 멋진 도구를 내 로그관리 시스템 후보에서
제외시킨 이유이기도 하다. (아쉽다...)



### LDAP 연동

사용자 관리, 인증과 관련하여, 기업환경을 위해 제공되는 훌륭한 기능 중
하나가 바로 LDAP 연동 기능이다. AD를 비롯하여, 많은 기업들이 구성원의
인증 및 조직, 권한 관리를 LDAP 또는 그것을 기반한 시스템으로 하고 있다.
이런 이유로, 기존 LDAP과의 연동이 지원된다면, 별도의 사용자 관리를 하지
않아도 기업은 손쉽게 사용자 구성원의 인증과 권한 관리를 할 수 있다.

![](/attachments/graylog2/graylog-552-users-ldap.png){:.dropshadow}

운영하고 있는 LDAP이 없어서 연동시험을 해보지 못한 것은 아쉬운데...
위의 그림을 보면, 편리하게 사용자의 연결, 그룹관리, 인증 관리 등을 할
수 있을 것 같다.



## 쉽게 백업하거나 배포할 수 있는 팩

마지막으로 소개하려는 Graylog의 관리기능은 바로 Content Pack이라 불리는
기능이다. 이 기능은, 사용자가 설정한 다양한 것들. 입력, Extractor, 스트림
등의 것들을 파일 형태로 내려받거나, 이미 받아놓은 구성을 새 시스템에 올려
편리하게 새로운 환경을 구성할 수 있도록 해주는 기능이다.

![](/attachments/graylog2/graylog-560-content-pack.png){:.dropshadow}

위 와면의 Create 버튼은 일종의 설정 백업과 같은 역할을 할 수 있고, 왼쪽
아래의 Import 기능을 이용하여 새 설정을 올릴 수도 있다.

이렇게, 대부분의 기능을 웹에서 제어할 수 있도록 해놓았다는 점과, 이러한
백업/복구까지 지원되는 점들을 잘 활용하면, Graylog를 패키징하여 Software
Appliance화 하는 것이 꽤나 쉽게 가능할 것 같다.

음, 역시 다시 봐도 훌륭하다.


#### 다음 이야기...

{:.angle}
* [Calling All Logs! Graylog2 1편: 설치하기]
* [Calling All Logs! Graylog2 2편: 맛보기]
* _Calling All Logs! Graylog2 3편: 추가설정_
* [Calling All Logs! Graylog2 4편: 기록]


[Calling All Logs! Graylog2 1편: 설치하기]:{% link _posts/sysadmin/2017-10-11-calling-all-logs-graylog2-installation.md %}
[Calling All Logs! Graylog2 2편: 맛보기]:{% link _posts/sysadmin/2017-10-12-calling-all-logs-graylog2-overview.md %}
[Calling All Logs! Graylog2 3편: 추가설정]:{% link _posts/sysadmin/2017-10-13-calling-all-logs-graylog2-settings.md %}
[Calling All Logs! Graylog2 4편: 기록]:{% link _posts/sysadmin/2017-10-13-calling-all-logs-graylog2-memories.md %}

[Graylog]:https://www.graylog.org/
[Graylog Docs]:http://docs.graylog.org/
[Graylog Github]:https://github.com/Graylog2
