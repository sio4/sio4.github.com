---
title: Nginx로 Git HTTP 서비스하기
subtitle: 사내 활용을 위한 중앙 Git 서버 구성
tags: [Nginx, Git, HTTP, tips and tricks]
categories: [tips and tricks]
date: 2015-02-06T10:28:00+09:00
---

![](/attachments/serving-git-with-nginx.png)
{.float-start .me-3 .bg-light .p-3}

Git의 매력에 빠져 절/친/ Subversion을 따돌림 시킨 지 꽤 오랜 시간이 지났음에도,
서버 측 Git 저장소 설정은 이번이 처음이다. 뭐,
[Github](https://github.com/sio4),
[Bitbucket](https://bitbucket.com/sio4)
등의 개인들이 무료로 사용할 수 있는 훌륭한 저장소 서비스 겸 "Social 개발"
커뮤니티가 있다 보니, 그 필요성을 느끼지 못했던 것이 사실.
{.clearfix}


## 저장소 설정하기

먼저, 사용할/서비스할 저장소를 만들어야 하는데, 두 가지 주의할 점이 있다.
먼저, `git init`로 저장소를 생성할 때, --bare 옵션을 사용하여 `git init`
명령이 기본적으로 생성해내는 작업 공간이 아닌 전용 저장소(Bare Repository)으로
만들어야 한다. 그리고 그 저장소에 대하여 http.receivepack 옵션을 줘서,
HTTP를 통한 push가 가능하도록 설정해야 clone 과 push가 둘 다 가능해진다.

일반적인 작업 공간의 경우, 프로젝트 명과 같은 이름의 디렉터리(작업 공간)
아래에 Git 자료 보관을 위한 디렉터리가 위치하는 구조여서 `project/.git`과
같은 구조가 되지만, 전용 저장소의 경우 `project.git` 와 같은 이름을 주로
사용하며, 이것이 `.git` 과 대등한 역할이라고 볼 수 있다.

`gitle-new-repo.sh`
{.block-title}

```bash
#!/bin/bash

umask 002
repo=$1
repo_base=/var/git

[ "$repo" = "" ] && { echo "usage: $0 new_repo_name"; exit; }

git --bare init $repo_base/$repo.git && \
cd $repo_base/$repo.git && \
git config --local --add http.receivepack true && \
git config --local --list
```


## Nginx의 설정

일단, 인증 처리는 Basic Auth를 사용하도록 설정했다. 암호 파일의 작성은
일반적인 `.htpasswd` 파일의 그 형식 그대로.

그리고 FastGCI 설정을 통하여 Git Core와 통신을 하게 되는데, Ubuntu에서
기본적으로 fcgiwrap 패키지를 설치하게 되면 Unix Socket을 사용하도록 구성되어
있다. FastCGI를 위한 환경변수 세팅은 아래와 같이 해주면 된다. 복잡할 것이
없는데,

주의할 점은 `include fastcgi_params`의 위치이다. 이 파일 안에는 FastCGI의
동작을 위한 다양한 변수가 선언되어 있는데, 같은 변수가 두 번 설정될 경우,
첫 번째 값을 따르는 것 같다. (보통은 뒤의 것이 앞의 것을 바꿔치는 것 아닌가?)
여기서 설정한 `SCRIPT_FILENAME` 등을 살리기 위해, 그보다 앞에 include가 오면
안된다.

`git-http.site`
{.block-title}

```nginx
server {
  ...
	# git via nginx	------------------------------------------------------
	location ~ /git(/.*) {
		auth_basic "";
		auth_basic_user_file /var/git/.htpasswd;
		fastcgi_pass	unix:/var/run/fcgiwrap.socket;
		fastcgi_param SCRIPT_FILENAME /usr/lib/git-core/git-http-backend;
		fastcgi_param GIT_HTTP_EXPORT_ALL	"";
		fastcgi_param GIT_PROJECT_ROOT		/var/git;
		fastcgi_param PATH_INFO			$1;
		include fastcgi_params;
	}
	...
}
```


## 정리

위의 두 단계 및 각각의 스크립트나 설정 파일을 보면 어떤 구조로 서비스가 되는지
쉽게 이해할 수 있을 듯. 생각보다 쉽다. 그리고 우둔한 HTTP이기 때문에 활용
방식도 간단하고 (이제 막 설정을 마친 시점이지만) 매우 만족스럽다.

다른 얘기인데, 아직 우리 회사의 개발자들은 Subversion을 선호하는 것 같다.
제품/기능의 비교에 의한 선호이기 보다는 기존 소스 트리가 거기에 있어서, 또는
"변화"에 대한 막연한 두려움이 앞서 있었을 것이다. 하긴, 보수적인 그들의 오래된
CVS, 무려 CVS 기반의 소스들을 Subversion으로 옮겨준 것이 불과 2년 전의 일이다.
이제 사내에서 활용 가능한 Git Base를 만들었으니... 이걸 어떻게 확산을 할까나?
ㅎㅎㅎ
