---
redirect_from: /entry/io-debugging/
title: I/O Debugging
tags: ["debugging", "Linux", "performance"]
categories: ["tips-and-tricks"]
date: 2012-06-12T12:30:49+09:00
lastmod: 2012-06-12T12:30:49+09:00
---
맨날 리눅스 리눅스 하면서도, 참 아는 게 없다. 어쩌면 Technician 수준.
I/O가 마구 치솟는데, 누가 그러는지를 모른다. iotop을 떠올리는데도 한참
시간이 걸렸다. 체득되어있지 않은 게지. iotop을 쓰려고 보니 설치되어
있지 않았다. 준비되어 있지 않은 것이고, ㅎㅎ 시간을 꼭 내서 Admin's
Tool을 만들어둬야...
<!--more-->

암튼, 다음과 같은 방법으로 대충 바쁜 놈을 잡을 수는 있다. 그런데
정량적으로 뽑기는 거의 불가능한 듯.

```console
# sysctl -w vm.block_dump=1; sleep 3; sysctl -w vm.block_dump=0
# dmesg | more
```

암튼, 좀 부끄러운...

