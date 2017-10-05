---
redirect_from: /blog/2015/07/23/setup-jekyll-for-github-page/
title: Setup Jekyll for Github Pages
tags: Jekyll Github howto
categories: ["misc"]
date: 2015-07-23 15:07:00+09:00
---
너무 쉽다. Jekyll Local 환경 만들기

<https://help.github.com/articles/using-jekyll-with-pages/>

## 미리 준비하기

Jekyll은 Ruby를 기반으로 하고 있어서, 다음과 같은 소프트웨어의 설치를
미리 해주어야 한다.

```console
$ sudo apt-get install ruby
$ sudo apt-get install ruby-dev
$ sudo apt-get install build-essential
$ sudo apt-get install nodejs
$ sudo apt-get install zlib1g-dev
$ sudo gem install bundler --no-ri --no-rdoc
```

2, 3번 줄은 Native Extension을 포함하는 gem을 설치하기 위해 필수 항목이다.
`bundle` 명령을 이용한 gem 의존성 관리를 위해 bundler 역시 설치되어야 한다.

## Jekyll 환경 구성하기

과거에는 `jekyll` gem을 설치하고, 그 외의 필요한 gem 들은 개별로 설치를
해줬다. 그런데 이제는 그냥 쉽게, `github-pages` gem 하나가 나머지 의존성
관리를 해준다.

```console
$ cat > Gemfile <<EOF
source 'https://rubygems.org'
gem 'github-pages'
EOF
$ bundle install
Fetching gem metadata from https://rubygems.org/............
Fetching version metadata from https://rubygems.org/...
Fetching dependency metadata from https://rubygems.org/..
Resolving dependencies...
Installing RedCloth 4.2.9 with native extensions
Installing i18n 0.7.0
Installing json 1.8.3 with native extensions
Installing minitest 5.7.0
Installing thread_safe 0.3.5
Installing tzinfo 1.2.2
Installing activesupport 4.2.3
Installing blankslate 2.1.2.4
Installing hitimes 1.2.2 with native extensions
Installing timers 4.0.1
Installing celluloid 0.16.0
Installing fast-stemmer 1.0.2 with native extensions
Installing classifier-reborn 2.0.3
Installing coffee-script-source 1.9.1.1
Installing execjs 2.5.2
Installing coffee-script 2.4.1
Installing colorator 0.1
Installing ffi 1.9.10 with native extensions
Installing gemoji 2.1.0
Installing net-dns 0.8.0
Installing public_suffix 1.5.1
Installing github-pages-health-check 0.3.1
Installing jekyll-coffeescript 1.0.1
Installing jekyll-gist 1.2.1
Installing jekyll-paginate 1.1.0
Installing sass 3.4.16
Installing jekyll-sass-converter 1.2.0
Installing rb-fsevent 0.9.5
Installing rb-inotify 0.9.5
Installing listen 2.10.1
Installing jekyll-watch 1.2.1
Installing kramdown 1.5.0
Installing liquid 2.6.2
Installing mercenary 0.3.5
Installing posix-spawn 0.3.11 with native extensions
Installing yajl-ruby 1.2.1 with native extensions
Installing pygments.rb 0.6.3
Installing redcarpet 3.3.1 with native extensions
Installing safe_yaml 1.0.4
Installing parslet 1.5.0
Installing toml 0.1.2
Installing jekyll 2.4.0
Installing jekyll-feed 0.3.0
Installing mini_portile 0.6.2
Installing nokogiri 1.6.6.2 with native extensions
Installing html-pipeline 1.9.0
Installing jekyll-mentions 0.2.1
Installing jekyll-redirect-from 0.8.0
Installing jekyll-sitemap 0.8.1
Installing jemoji 0.4.0
Installing maruku 0.7.0
Installing rdiscount 2.1.7 with native extensions
Installing terminal-table 1.5.2
Installing github-pages 38
Using bundler 1.10.5
Bundle complete! 1 Gemfile dependency, 55 gems now installed.
Use `bundle show [gemname]` to see where a bundled gem is installed.
Post-install message from html-pipeline:
-------------------------------------------------
Thank you for installing html-pipeline!
You must bundle Filter gem dependencies.
See html-pipeline README.md for more details.
https://github.com/jch/html-pipeline#dependencies
-------------------------------------------------
$ 
```

간단! 끝!

