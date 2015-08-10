---
redirect_from: /blog/2011/12/27/kpartx-create-device-mappings-for-partitions/
title: Kpartx, Create device mappings for partitions
tags: Disk Recovery
date: 2011-12-27T12:36:17+09:00
modified: 2011-12-27T12:36:17+09:00
---
재밌는 프로그램이네. 예전에는 통짜 Disk Image를 loopback으로 마운트하기
위해 partition 시작 위치 찾고 어쩌고... 그랬었던 기억인데, 이 물건이
그런 문제를 참 쉽게 풀어준다. 어디서 얼마나 호환되는지 시험은 안해봤지만,
간단한 시험에는 성공. 괜찮네.

> Kpartx can be used to set up device mappings for the partitions of any  
> partitioned block device. It is part of the Linux multipath-tools.

쓸 일이 있어서 간단히 시험해봤는데,

{% highlight console %}
$ sudo kpartx -v -a sdb.img
add map loop0p1 (252:1): 0 7856128 linear /dev/loop0 8192
$ sudo mount -o ro /dev/mapper/loop0p1 /mnt
$
{% endhighlight %}

잘 동작한다. 애용해야겠다.

