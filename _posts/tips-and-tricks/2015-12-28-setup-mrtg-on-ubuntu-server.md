---
title: "Howto: Ubuntu 서버에 MRTG 설치하기"
image: /attachments/20151228-mrtg-000.png
tags: MRTG network monitoring
categories: ["tips-and-tricks"]
date: Mon, 28 Dec 2015 12:34:51 +0900
---
지난 10월에 진행하던 BMT 중에 네트워크 성능 측정, 또는 사용량 확인을 위해
진행했던 MRTG 설치과정을 기록한다.

중간에 다른 일에 치중하는 바람에 기록이 완전하지 않다. 나중에 기회가 되면
다시 다듬기로 하고, 일단 기록으로 남긴다.

## MRTG 설치하기

다른 잘 정리된 모니터링 도구들과는 달리, MRTG는 그 자체로 사용자를 위한
포탈 비슷한 것을 제공하지 않는다. MRTG 자체는,

1. SNMP Protocol을 이용하여 Network Device 들의 사용량 정보 등을 수집하고,
1. 그것을 집계하여 통계를 구하고,
1. 그 결과물을 보기 좋게 그래프로 그려주는 것
1. (추가로 그것을 연결해줄 HTML을 만드는 것)

까지를 그 역할로 한다. 그 그래프를 사용자에게 어떻게 전달하는지는 운영자의
몫인데, UNIX의 KISS(Keep It Simple and Stupid) 철학과 닿아 있다고 할 수 있다.

그래서, 먼저 이것을 표출할 때 사용할 웹서버를 먼저 설치한다.

### 웹서버 설치

간단한 버전의 웹서버로 충분하지만, 여기서는 나중에 좀 더 많은 일을 할 수
있도록 NginX의 Extras 버전을 설치했다.

```console
$ sudo apt-get install nginx-extras
<...>
The following NEW packages will be installed:
  liblua5.1-0 libxslt1.1 nginx-common nginx-extras
0 upgraded, 4 newly installed, 0 to remove and 0 not upgraded.
Need to get 822 kB of archives.
After this operation, 2803 kB of additional disk space will be used.
<...>
$ 
```

### SNMP 설치

이 과정이 필수였던가? 아니었던 것 같은데, MRTG가 자체적으로 SNMP 프로토콜을
처리했었는지 아닌지 기억이 정확하지 않다. 아무튼, 독립적으로 SNMP 명령을
실행해서 그 결과를 확인할 필요가 있으므로 SNMP 도구를 설치한다.

```console
$ sudo apt-get install snmp
<...>
The following NEW packages will be installed:
  libperl5.20 libsensors4 libsnmp-base libsnmp30 snmp
0 upgraded, 5 newly installed, 0 to remove and 0 not upgraded.
Need to get 1180 kB of archives.
After this operation, 4722 kB of additional disk space will be used.
<...>
$ 
```

이렇게 설치를 하고 나면 `snmpwalk` 같은 명령을 사용할 수 있게 되는데, 아래
예로 든 것과 같이, 이 도구를 이용하면 목표로 하는 Device가 정상적으로 SNMP
응답을 하는지 확인한다든지, 또는 그 측정 값을 직접 Query하여 볼 수 있게 된다.

```console
$ snmpwalk -v 2c -c monitor 192.168.13.2 | head
iso.3.6.1.2.1.1.1.0 = STRING: "Alcatel-Lucent OS6860-24 8.1.1.627.R01 Service Release, April 21, 2015."
iso.3.6.1.2.1.1.2.0 = OID: iso.3.6.1.4.1.6486.801.1.1.2.1.11.1.1
iso.3.6.1.2.1.1.3.0 = Timeticks: (188152700) 21 days, 18:38:47.00
iso.3.6.1.2.1.1.4.0 = STRING: "Alcatel-Lucent, http://enterprise.alcatel-lucent.com"
iso.3.6.1.2.1.1.5.0 = STRING: "SW_HOS"
iso.3.6.1.2.1.1.6.0 = STRING: "Unknown"
iso.3.6.1.2.1.1.7.0 = INTEGER: 78
iso.3.6.1.2.1.1.9.1.2.1 = OID: iso.3.6.1.6.3.16.2.2.1
iso.3.6.1.2.1.1.9.1.2.2 = OID: iso.3.6.1.6.3.10.3.1.1
iso.3.6.1.2.1.1.9.1.2.3 = OID: iso.3.6.1.6.3.11.3.1.1
$ 
```

위의 예는 BMT에 사용했던 장비 중 하나인 Alcatel-Lucent의 L3 Switch에게
SNMP v2 질의를 던진 결과이다.

### MRTG 설치

이제 진짜다. MRTG의 설치 역시 간단하게 `apt-get` 명령을 이용하여 할 수 있다.
이 때 의존성에 의해 함께 설치되는 것들을 보면, MRTG가 무슨 일을 하는지 대충
할 수 있다.

```console
$ sudo apt-get install mrtg 
<...>
The following NEW packages will be installed:
  fontconfig-config fonts-dejavu-core libfontconfig1 libgd3
  libio-socket-inet6-perl libjbig0 libjpeg-turbo8 libjpeg8
  libsnmp-session-perl libsocket6-perl libtiff5 libvpx1 libxpm4 mrtg
0 upgraded, 14 newly installed, 0 to remove and 0 not upgraded.
Need to get 2699 kB of archives.
After this operation, 8793 kB of additional disk space will be used.
<...>
$ 
```

먼저, `libsnmp-session-perl`, `libsocket6-perl` 등을 함께 설치하고 있는데,
MRTG가 Perl로 작성된 녀석이기 때문이다. (잘 알겠지만, 과거에는 Perl이 시스템
관리자를 위한 가장 보편적인 도구였다.)  
이와 함께 `libtiff5`, `libxpm4`, `lbijpeg*`, `libgd3` 등을 설치하는데,
MRTG가 GD Library를 이용하여 그림을 그리고 있다는 것을 뜻한다. 그림에
들어가는 글씨는 `libfontconfig1` 등의 것들을 이용하여 가져온다는 것도
간접적으로 확인할 수 있다.

참고로, Debian Package의 정확한 의존성 관계는 다음과 같은 명령으로 확인이
가능하다.

```console
$ apt-cache showpkg mrtg |grep ^Dependencies -A1
Dependencies: 
2.17.4-2ubuntu2 - debconf (18 1.2.0) debconf-2.0 (0 (null)) libsnmp-session-perl (2 1.12) perl-modules (2 5.6.0) perl (0 (null)) libc6 (2 2.7) libgd3 (2 2.1.0~alpha~) mrtg-contrib (0 (null)) httpd (16 (null)) www-browser (0 (null)) mrtg:i386 (0 (null)) 
$ 
```



## MRTG 설정하기

MRTG의 기본 설정은 `/etc/mrtg.cfg` 파일에 담겨있다. 다음과 같은 명령으로
추가 설정을 포함하여 우리가 사용할 설정을 만들어준다.  추가되는 내용 중,
중요한 부분은 맨 아래의 Include 부분으로, 설정의 끝에서 `/etc/mrtg.d` 아래의
파일들을 `Include`하도록 하여 개별적인 설정을 별도의 파일로 보관할 수 있게
해주고 있다.

```console
$ echo |sudo tee -a /etc/mrtg.cfg <<EOF

Interval: 5
RunAsDaemon: Yes

PageFoot[^]: Contact  you have questions regarding this page
AddHead[^]: <link rev="made" href="mailto:mrtg@blabla.edu">
BodyTag[^]: <BODY LEFTMARGIN="1" TOPMARGIN="1">
Unscaled[^]: d
MaxBytes[_]: 12500000

Include: /etc/mrtg.d/*.cfg

EOF
$ 
```

위와 같은 Global 설정이 끝났다면, 개별 Device에 대한 설정을 추가해준다.

```console
$ sudo mkdir /etc/mrtg.d
$ sudo cfgmaker --output=/etc/mrtg.d/192.168.13.1.cfg monitor@192.168.13.1
--base: Get Device Info on monitor@192.168.13.1:
--base: Vendor Id: Unknown Vendor - 1.3.6.1.4.1.6486.801.1.1.2.1.11.1.1
--base: Populating confcache
--base: Get Interface Info
--base: Walking ifIndex
<...>
$ sudo cfgmaker --output=/etc/mrtg.d/192.168.13.2.cfg monitor@192.168.13.2
--base: Get Device Info on monitor@192.168.13.2:
--base: Vendor Id: Unknown Vendor - 1.3.6.1.4.1.6486.801.1.1.2.1.11.1.1
--base: Populating confcache
--base: Get Interface Info
--base: Walking ifIndex
<...>
```

맨 첫줄은 부속 설정들을 위한 디렉터리를 만들어주는 것이고, 그 뒤를 따르는
명령들은 각 장치(IP)에 대한 설정파일을 만드는 과정이다. 보는 바와 같이,
`cfgmaker`라는 명령을 사용하고 있는데, 이 명령은 MRTG가 제공하는 명령으로
Device로부터 SNMP 결과를 받아와서 각 포트들의 정보를 설정에 저장하는
일을 한다.

위의 예제에서는 두 장치에 대한 설정을 하였고, 각 장치에 대한 상세 정보를
사용하가 보기 편하게 하기 위해 아래와 같이 설정을 수정해 주었다.

```console
$ sudo sed -i '/MaxBytes/d' /etc/mrtg.d/192.168.13.1.cfg 
$ sudo sed -i '/MaxBytes/d' /etc/mrtg.d/192.168.13.2.cfg 
$ 
$ sudo sed -i 's,for 1\/1\/1 ,M1-MGT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/2 ,M2-MGT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/3 ,M3-MGT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/4 ,S1-MGT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/5 ,S2-MGT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/6 ,S3-MGT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/7 ,C1-MGT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/8 ,C2-MGT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/9 ,C3-MGT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/10 ,C4-MGT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/11 ,M1-GST,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/12 ,M2-GST,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/13 ,M3-GST,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/14 ,C1-GST,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/15 ,C2-GST,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/16 ,C3-GST,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/17 ,C4-GST,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/18 ,M1-EXT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/19 ,M2-EXT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/20 ,M3-EXT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/21 ,C1-EXT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/22 ,C2-EXT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/23 ,C3-EXT,' /etc/mrtg.d/192.168.13.2.cfg
$ sudo sed -i 's,for 1\/1\/24 ,C4-EXT,' /etc/mrtg.d/192.168.13.2.cfg
```

뭐, 길게 썼지만 내용은 별다를 게 없다. 자동으로 생성된 불필요한 설정을
제거하고, Port 번호로 되어있는 부분을 사람이 읽을 수 있는 의미있는 값으로
바꿔준 것이 전부다.

이제, MRTG의 결과가 저장될 경로를 만들고, 전체 정보를 한 눈에 보여줄
index 페이지를 만드는 과정이다. 역시, MRTG가 제공하는 `indexmaker`를
사용하면 현재의 구성정보를 바탕으로 index 페이지를 만들어준다.

```console
$ sudo mkdir /var/www/mrtg
$ sudo indexmaker --output=/var/www/mrtg/index.html /etc/mrtg.cfg
```

## 웹서버 설정

앞서 말한 바와 같이, MRTG는 데이터를 모아주고 그것으로부터 그림을 그리는
역할만 하게 된다. 이 결과를 웹으로 보고 싶다면, Web Server 설정을 추가로
해줘야 한다.  
아래 명령은, NginX의 설정을 하나 추가하여 MRTG의 결과를 8011 포트로 접속한
Client에게 보여주기 위한 설정이다. 명령의 흐름은,

1. site 설정 추가하기
1. site 설정 활성화하기
1. `nginx` 재시작하기
1. `nginx` 구동상태 확인하기

의 과정으로, 일반적인 NginX 설정 과정과 같다.

```console
$ echo |sudo tee /etc/nginx/sites-available/mrtg <<EOF
server {
	listen 8011 default_server;
	root /var/www/mrtg;
	index index.html;

	location / {
		try_files \$uri \$uri/ =404;
	}
}
EOF
$ sudo ln -s ../sites-available/mrtg /etc/nginx/sites-enabled
$ sudo service nginx restart
$ sudo service nginx status 
* nginx.service - A high performance web server and a reverse proxy server
   Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
   Active: active (running) since Wed 2015-09-30 13:44:38 KST; 3s ago
  Process: 12001 ExecStop=/sbin/start-stop-daemon --quiet --stop --retry QUIT/5 --pidfile /run/nginx.pid (code=exited, status=0/SUCCESS)
  Process: 12007 ExecStart=/usr/sbin/nginx -g daemon on; master_process on; (code=exited, status=0/SUCCESS)
  Process: 12004 ExecStartPre=/usr/sbin/nginx -t -q -g daemon on; master_process on; (code=exited, status=0/SUCCESS)
 Main PID: 12008 (nginx)
   CGroup: /system.slice/nginx.service
           |-12008 nginx: master process /usr/sbin/nginx -g daemon on; master...
           |-12009 nginx: worker process
           |-12010 nginx: worker process
           |-12011 nginx: worker process
           `-12012 nginx: worker process

Sep 30 13:44:38 station systemd[1]: Starting A high performance web server .....
Sep 30 13:44:38 station systemd[1]: Started A high performance web server a...r.
Hint: Some lines were ellipsized, use -l to show in full.
$ 
```

## 확인하기

웹서버에 접속을 했을 때, 아래와 같은 화면이 보이면 설치가 잘 된 것이다.
(아, 이게 일정한 시간간격을 두고 데이터를 수집하는 것이기 때문에, 조금 시간이
지나야 그래프가 정상적으로 나올 것이다.)

![](/attachments/20151228-mrtg-001.png){:.fit.dropshadow}

![](/attachments/20151228-mrtg-002.png){:.fit.dropshadow}

