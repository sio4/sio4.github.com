---
title: UART, OAuth2/SSO Provider
subtitle: Universal Authorizaion, Role and Team
tags: ["UART", "OAuth2", "single-sign-on", "authentication", "golang"]
repository: https://github.com/hyeoncheon/uart
lang: en-US
comments: true
social-share: true
translate: true
date: 2017-09-29T01:28:00+09:00
last_modified_at: 2017-10-07 23:50:00 +0900
---
UART is an Universal Authorizaion, Role and Team management service software.  
UART was developed to succeed my old SiSO project, the original SSO service
for Hyeoncheon Project. (which was developed with Ruby on Rails framework
with well known Devise, OmniAuth and other open source components.)


# It's UART

[![Build Status](https://travis-ci.org/hyeoncheon/uart.svg?branch=master)](https://travis-ci.org/hyeoncheon/uart){:.inline}
[![Go Report Card](https://goreportcard.com/badge/github.com/hyeoncheon/uart)](https://goreportcard.com/report/github.com/hyeoncheon/uart){:.inline}
[![Code Climate](https://codeclimate.com/github/hyeoncheon/uart/badges/gpa.svg)](https://codeclimate.com/github/hyeoncheon/uart){:.inline}
[![Coverage Status](https://coveralls.io/repos/github/hyeoncheon/uart/badge.svg?branch=master)](https://coveralls.io/github/hyeoncheon/uart?branch=master){:.inline}

UART is written in Go Language and also is built upon many open source
software modules including
[OSIN OAuth2 server library](https://github.com/RangelReale/osin)
and powered by open source
[Buffalo Go web development eco-system](https://github.com/gochigo/buffalo).

## Feature

The main features are below:

* Support sign on/in with social network accounts
  * currently Google, Facebook, and Github accounts are allowed.
* (Future Plan) Email address based local authentication will be added soon.
  * This will be used as One-Time-Password option for other authentication.
* Work as OAuth2 Provider to act as SSO authenticator for family projects.
* OAuth2 Client App management with optional role based authorization.
  * Role management per each apps.
* Support standard OAuth2 authorization process.
  * The format of Access Token is JWT(JSON Web Token).
  * Also provide `/userinfo` API endpoint.
* Member management and per App roles.

## Install

Installation of a program written in Go is quite. (especially if you already
installed go lang) This is an installation method for Ubuntu Linux but you
can easily adapt it to your OS.

### Requirement

I do not prepared pre-compiled version of the program so you need to build
it your self with `go` command. For this, you need to install go language.

#### Essential Build Environment

Before or after installation of Go, You need to install basic build tools
for native libraries. In Ubuntu Linux, simply execute the command below:

```console
$ sudo apt-get update
$ sudo apt-get install build-essential
$ 
```

Install `build-essential` is the easist way to prepare build environment.
The `build-essential` package itself have no executable files or binary for
build something but it provide a list of packages for build environment.

#### Install Golang

If you don;t have installed go compiler on your computer, you need to get
and install it. Currently I tested with Go version 1.8x but you can try
other higher version. But I cannot garrenty since Go is currently on the
development activly. :-)

Below is my typical method to install Go:

```console
$ sudo mkdir -p /opt/google
$ cd /opt/google/
$ wget -nv https://storage.googleapis.com/golang/go1.8.3.linux-amd64.tar.gz -O - |sudo tar zx
$ sudo mv go go-1.8.3
$ sudo ln -s go-1.8.3 go
$ cat >> ~/.bashrc <<EOF
> 
> ## GOLANG
> export GOPATH="\$HOME/go"
> export GOROOT="/opt/google/go"
> export PATH="\$PATH:\$GOPATH/bin:\$GOROOT/bin"
> 
> EOF
$ 
$ # source bashrc or restart the shell
$ mkdir $GOPATH
$ cd $GOPATH
$ 
```

#### Install Node.js with nvm

UART was built on top of Buffalo framework and some feature of it depends on
Node.js. If you do not have, below method will help you:

```console
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
$ 
$ # source bashrc or restart the shell
$ nvm --version
0.33.2
$ nvm ls-remote --lts |tail -2
        v6.11.1   (LTS: Boron)
        v6.11.2   (Latest LTS: Boron)
$ nvm install lts/boron
$ node --version
v6.11.2
$ npm --version
3.10.10
$ 
```

Quite simple. I usally using `nvm` for `node`, `rvm` for `ruby`, and so on.
Since this provide virtual, isolated execution environment, You can simply
preserve your existing version of languages concurrently if some other
program you newly installed requires different version of the language
and/or libraries.


### Install and Build UART

As same as other Go programs, installation of UART is very simple.
Just git it, get others, then build. Just one thing you need to
consider is, when build it, you need to run `buffalo build` instead of
`go build`. then buffalo does rest for you!

```console
$ mkdir -p $GOPATH/src/github.com/hyeoncheon
$ cd $GOPATH/src/github.com/hyeoncheon
$ git clone https://github.com/hyeoncheon/uart.git
$ cd uart
$ go get -t -v ./...
$ go get -u github.com/gobuffalo/buffalo/buffalo
$ # buffalo setup
$ npm install --no-progress
$ buffalo build --static
$ ls bin/uart
$ 
```

## Usage

TO BE CONTINUE

### Configure



### Run



## TODO



## Author

Yonghwan SO <https://github.com/sio4>

## Copyright (GNU General Public License v3.0)

Copyright 2016 Yonghwan SO

This program is free software; you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation; either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT
ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with
this program; if not, write to the Free Software Foundation, Inc., 51
Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA

