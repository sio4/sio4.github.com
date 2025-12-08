---
title: 정말 우분투는 Xen을 버리는 것일까?
tags: ["Ubuntu", "Xen"]
categories: ["virtualization"]
date: 2009-03-04T09:43:40+09:00
lastmod: 2009-03-04T10:08:33+09:00
---
공식 발표가 있었는지는 모르겠으나 여기 저기의 얘기들은 그렇단다. 약간
고민스러운 부분이 있다. 우분투에 이어 레드햇도 이미 kvm으로의 길을
발표한 상태이고(쿰라넷을 인수했을 정도인데 뭐) 다른 배포본들도 비슷한
길을 가능성이 높아보인다. 역시 대세는 kvm 인데, 왜 이제와서 Xen을
바라보고 있는 것이야? 해법은? libvirt?  
<!--more-->
  
아래 링크는 우분투 포럼에 올라온 어느 개발자의 글.  
  
[Xen in 8.10 - Ubuntu Forums](http://ubuntuforums.org/showthread.php?t=950636#6)

> Re: Xen in 8.10  
> The normal kernels support Xen domU functionality. We do not and will not have a dom0 kernel in 8.10.  
> \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
> William Grant  
> Ubuntu Developer  

[Xen in 8.10 - Page 2 - Ubuntu Forums](http://ubuntuforums.org/showthread.php?t=950636&page=2#12)

> Canonical apparently doesn't wish to support Xen, so it's up to the community to have it working. The amount of work involved in porting the Xen patches from older kernels isn't exactly small! You could use a Hardy dom0 kernel, perhaps, but Ubuntu 8.10 is not intended to be a dom0 without custom kernels. I believe that Debian is making a similar decision for Lenny.  
>   
> I use kqemu on my hardware that doesn't support KVM. With DKMS it's particularly easy to install kqemu now.  
> \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_  
> William Grant  
> Ubuntu Developer그리고 이건 블로그의 글.  

[Ubuntu and KVM Virtualization: Understanding the Long-Term Direction « All About Ubuntu](http://allaboutubuntu.wordpress.com/2008/02/27/ubuntu-and-kvm-virtualization-understanding-the-long-term-direction/)

> The next major production release of Ubuntu — version 8.04 LTS, codenamed Hardy Heron — will ship with KVM as its virtualization package. This choice is surprising to those of us who have been watching the Xen virtualization package become the darling of Virtual Machine world. So let’s try to make sense out of the KVM virtual machine and this recent choice by Ubuntu.

