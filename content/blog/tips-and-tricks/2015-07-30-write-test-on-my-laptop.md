---
redirect_from: /blog/2015/07/30/write-test-on-my-laptop/
title: 처참한 디스크 쓰기 성능 시험
tags: ["disk", "recovery", "performance", "test", "TestDisk", "Ubuntu"]
categories: ["tips-and-tricks"]
image: /attachments/2015-07-30-testdisk.png
date: 2015-07-30 22:49:34+09:00
---
뭐, 낯 뜨거운 일이지만 IT를 생업으로 하고 있고, 십년이 넘도록 친구나
가족보다 컴퓨터와 보내는 시간이 훨씬 많았던 난데, 말이 안되는 실수를
했다. 업무용으로 사용하는 내 랩탑에서 SSD Disk에 대한 I/O 시험을,
Write 모드로 해버린 것! 이 글은 그 쌩고생에 대한 기록이면서, 동시에
이런 일을 당한 사람들에게 드리는 "해! 하지마!" 가이드이다.

혹시 손상된 것이 디스크가 아니라 메모리카드라면, 예전에 적었던
[메모리카드 백업, dd, mount,...]({% post_url tips-and-tricks/2010-02-01-dd-mount-for-memorycard-backup %})와
이미지 파일의 loopback 마운트를 쉽게 해주는 유틸리티인
[Kpartx, Create device mappings for partitions]({% post_url tips-and-tricks/2011-12-27-kpartx-create-device-mappings-for-partitions %})도
참고할만 하다.

## 사건의 발단: Disk에 구멍이 났다!

요즘 진행하는 일 중에 스토리지 성능시험이 필요한 일이 있다. 그렇다고
딱히 내 업무는 아니었는데, 아무튼 호기심 반 데이터확보 반으로 업무용
랩탑의 SSD 타입의 Disk에다 대놓고 Write 성능 시험을 하고 말았다.  
실수를 한 것을 느끼자 마자 시험을 중단시켰지만, 몇몇 명령어가 동작하지
않는 등,

> 디스크가 손상되었다!

는 것을, 쉽게 느낄 수... 있었다. ㅠ.ㅠ  
(Random writing 시험에 의해 불특정 파일의 부분 부분이 날라간 것이다.)

## 하지 말아야 할 것

사용중인 컴퓨터, 또는 업무용 서버에서는 다음과 같은 일을 해서는 안된다.
그리고 혹시라도 문제가 생겼더라도, 하지 않아야 하는 일들이 있다.

### 애시당초 하지 말았어야 하는 "쓰기 시험"

스토리지/Disk의 I/O는 CPU, Memory 등의 성능과 함께 전체 시스템의 성능을
정의하는 매우 중요한 요소이다. 특히, 그 중에서 쓰기는, 읽기에 비해서
일반적으로 낮은 성능을 보이기 때문에 중요한 시험 요소가 된다.

쓰기 시험의 방식은 다양할 수 있는데, 보통은 Block Device에 대해 직접
시험을 하게 된다. 이유는 단순한데, Filesystem을 거치는 Overhead의 영향을
피한다든지, 특히 (나처럼) 암호화가 적용된 Filesystem을 쓰는 경우에는
순수 Disk의 성능을 보기 위해서는 필수적인 것이다.

그러나 이미 사용중인, 다시 말해서 중요 데이터를 담고 있는 디스크에
대해서는 Block Device 수준의 Write I/O 시험을 해서는 안된다.
쓰기 시험이 불가피하다면 Filesystem의 영향을 감수하더라도 Filesystem
위에 시험용 거대 파일을 얹어서 그 파일에 대한 시험을 해야한다.

### (혹시나) 다시 부팅해보기

잘못된 Parameter로 시험이 시작되었음을 느끼고, 최대한 빨리 시험을
중단시켰지만 그 이후에 몇몇 명령어(구체적으로는 `git` 명령)가 동작하지
않는 등 심상치 않음을 알게 되었다.  
그런데 밤이 깊었기도 하고 급한 마음에, 시스템을 재부팅시키고 말았다.

이런! 실수다. 그나마 OS가 살아있고 제어권을 내가 가지고 있는 상태에서,

> 만약에 대한 백업을 먼저 수행했어야 한다.

물론, 시스템을 끄지 않았다고 하더라도 일부 명령어가 정상적이지 않은
상황에서는 백업을 위한 명령어가 정상적으로 되리라고 보기 어렵긴 하다.

### (실수로) 파티션 건드리기

모든 파일은 파일시스템 위에 있고, 파일시스템은 파티션에 의존적이다.
파티션이 없다면 파일시스템 자체에 접근이 불가능하므로 파일의 복구가
불가능할 뿐 아니라, 보통의 머리로는 자신의 파티션 구성을 외우고 있지
못할 것이므로 파티션을 다시 복구하기도 쉽지 않다. (파티션 정보를
외우고 있다면 재설정 만으로 복구할 수는 있다.)

이참에, 내 파티션 구성을 기록해놓아야겠다.

```console
$ sudo fdisk -l

Disk /dev/sda: 119.2 GiB, 128035676160 bytes, 250069680 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: dos
Disk identifier: 0x000d11df

Device     Boot    Start       End   Sectors   Size Id Type
/dev/sda1  *        2048  20973567  20971520    10G 83 Linux
/dev/sda2       20973568  39847935  18874368     9G 83 Linux
/dev/sda3       40001536 250069679 210068144 100.2G 83 Linux

Disk /dev/mapper/home_crypt: 100.2 GiB, 107552792576 bytes, 210064048 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disk /dev/mapper/sda2_crypt: 9 GiB, 9661579264 bytes, 18870272 sectors
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
$ 
```

## 해볼만 한 것

파일시스템 손상이든, 물리적 손상이든 문제가 생겼다면,

> 당황하지 말고,

다음과 같은 내용들을 시도해볼 수 있다.

### 일단, 이미지 떠놓기

복구 작업을 하다보면, 원하지 않게, 예기치 않게, 원본의 훼손이 발생할 수
있다. 그런 돌이킬 수 없는 상황을 막기 위해 (손상된 내용일 지언정) 백업이
있으면 좋겠다.

손상된 파일시스템이 크지 않다면, 또는 충분한 용량의 외장 Disk 등을 갖고
있다면 **일단은 Disk Volume의 이미지를 떠놓는 것**이 좋다.

리눅스에서 쉽게 이미지를 뜰 수 있는 방법은 `dd`를 사용하는 것이다.
이 Disk Dump 도구를 사용하면 Block Device, Partition 등을 Raw Level로
복제할 수 있으며, 다른 도구와 적절히 엮으면 네트워크 넘어 원격으로
복제를 넘길 수도 있다.

예를 들면, 다음과 같다. (이 예에서는 Block Device가 아닌 파일을 넘긴다.)

받아주는 서버 쪽에서 다음과 같이 명령을 주면, "`-l`" 옵션에 의해 5500
포트를 Listen하는 상태가 된다. 그리고 접속이 발생하여 데이터가 흘러
들어온다면, "`> /tmp/bash.dump`" 구문에 의해 "`/tmp/bash.dump`" 라는
파일에 그 내용이 저장된다.

```console
$ nc -l 5500 > /tmp/bash.dump
```

위와 같이 받는 쪽을 대기모드로 만들어두고,

그리고 보내는 쪽에서는 아래와 같이 파일을 날려 보낼 수 있다. (여기서는
단지 시험이므로 자기 자신에게 보내기로 한다.)

```console
$ dd if=/bin/bash |nc localhost 5500
2011+1 레코드 들어옴
2011+1 레코드 나감
1029720 바이트 (1.0 MB) 복사됨, 0.00960139 초, 107 MB/초
$ 
```

위의 명령은, dd 명령에게 "`if=`" 옵션으로 읽어들일 파일을 주어, 해당
파일을 읽어들이도록 한 후, 그 표준출력을 nc 명령에게 넘겨주고 있다.
또, nc 명열을 위와 같이 수행하면, 표준입력으로 들어오는 모든 내용을
있는 그대로 인수로 지정한 서버/포트에 쏘아주게 된다. (여기서는
위에서 미리 포트를 열어둔 `localhost`의 5500 포트)

이제 검산.

```console
sio4@silver:~$ md5sum /bin/bash /tmp/bash.dump 
f9ef659c9b42adda0ac18aa0f70945c0  /bin/bash
f9ef659c9b42adda0ac18aa0f70945c0  /tmp/bash.dump
$ 
```

두 파일의 md5sum 값이 같다. 정확하게 원격으로 백업된 것이다.

그럼 이제 본격적인 복구 모드!

### 복구디스크 사용하기

이런 상황에서, Ubuntu Linux의 LiveCD는 축복이다. Ubuntu Linux Desktop
버전의 경우, 이 CD나 USB로 부팅했을 때, 바로 설치를 진행하는 것도
가능하지만 기본적으로 "그냥 한 번 써보기" 모드가 지원된다.  
중요한 것은, 이 맛보기 모드에서도, Ubuntu 리눅스의 모든 기능을 사용할
수 있고, 필요하면 추가 Package를 설치할 수도 있다는 점이다.

과거의 나는, 이렇게 OS가 정상적이지 않은 시스템의 점검을 위해 전용의
경량 OS를 직접 구성하여 USB로 만들어 늘 가지고 다녔던 시절도 있었다.

### 파티션이 날라갔다면

만약, 파티션 Table에 손상이 있어서 정상적인 인식이 안되는 상황이라면
이를 복구하기 위한 Utility를 사용해볼 수 있다.

내 경우, 이번에는
[gpart](https://en.wikipedia.org/wiki/Gpart)(gpartd가 아님)와
[TestDisk](http://www.cgsecurity.org/wiki/TestDisk)를
시도해봤다.

`gpart`의 경우, 지원의 폭이 넓지 않으나, 위의  Wikipedia 페이지는
도움이 되는 내용이 있으니 참고하시기 바란다.

`TestDisk`는 최근의 파일시스템까지 지원하는 멋진 프로그램으로, 다음과
같은 일들을 할 수 있다.

* Fix partition table, recover deleted partition
* Recover FAT32 boot sector from its backup
* Rebuild FAT12/FAT16/FAT32 boot sector
* Fix FAT tables
* Rebuild NTFS boot sector
* Recover NTFS boot sector from its backup
* Fix MFT using MFT mirror
* Locate ext2/ext3/ext4 Backup SuperBlock
* Undelete files from FAT, exFAT, NTFS and ext2 filesystem
* Copy files from deleted FAT, exFAT, NTFS and ext2/ext3/ext4 partitions.

그리고 멋진 GPL 라이선스로 배포되고 있다!

### 파일을 지운 거라면

파일시스템의 문제가 아니라 파일을 잘못 지운 경우라면 (이 글의 주제와는
다른 얘기지만) 최신 버전이 2013년에 나온
[extundelete](http://extundelete.sourceforge.net/)를
참고하시기 바란다.

내 경우, 예전에 잘못 지운 디렉터리를 복구하려고 써본 기억이 있으나,
최종적으로 어떤 Utility를 사용했었는지 기억이 가물거리긴 한다.

## 내가 한 것

이렇게 글을 써내려가고 있으나 나는 이 상황에 잘 대처했을까? 글쎄...
쉽게 복구를 했다면 이렇게 글을 쓰고 있지 않을 수도 있다. ㅎㅎㅎ

### 다시 켜보기 -- 나 졸고 있었나보다

내 정신이 어떻게 된 것인지, 난 바보처럼 컴퓨터를 껐다가 켜는 실수를
범했다. 살아있는 컴퓨터라면 뭔가 시도할 수 있는 것이 많겠지만 이제
어떻게 할까?

물론, 어떤 면에서는, 더 이상의 I/O가 일어나지 않도록 본 전원은 빨리
끄고, 분리한 Disk를 다른 기계에 Read-Only로 붙여서 보는 것이 좋을
수도 있긴 하다. 하지만 난 그냥 껐을 뿐. ㅠ.ㅠ

### 나의 복구디스크!?

이렇게, 일단 꺼버린 컴퓨터는 커널에 손상을 입었는지, Grub bootloader
까지만 진행이 되고 부팅이 되지 않았다. 그래도 침착했어야 하는데...

앞서 잠깐 얘기한 "내 오래된 만능 디스크" Shijark에 대한 믿음을
기반으로, 가방에서 USB Stick를 하나 주섬 주섬 찾아서 부팅을 해봤다.
순조롭게 USB Stick에 설치된 Shijark이 부팅을 하고 있었다.
"이제 손 좀 봐야지..." 생각을 하기도 잠깐, 뭔가 또다른 이상함을 발견했다.

지금 지나가는 이 메시지는 Partition을 새로 만들고 그 위에 Filesystem
까지 만들고 있는 것...

> Oh! My God!!!

이건 그 만능의 Shijark이 아니라, Shijark을 바탕으로 만들었던 다른
녀석! 400대 정도의 Server에 OS를 일괄설치하기 위해 만들었던 자동
파티셔닝/자동 설치 Custom이었던 것이다!

우분투의 북구디스크 좋잖아! 왜 이걸 쓴거야!

이렇게 사건 첫날 밤은 깊어만 갔고, 더더욱 졸음은 몰려왔다.

### 파티션 살려보기

이제 파티션이 망가져 버렸으니... 파티션 복구를 시도했다. 먼저
`gpart` 출동~! 그러나 생각보다 결과는 그렇네...

![](/attachments/2015-07-30-gpart.png){:.fit.dropshadow}

보는 바와 같이, 아무 파티션도 잡아내지 못했다. 이건 지금 시점에서는
사용할 수 없는 도구가 되어버렸나보다. 그래서 다시, `TestDisk`로
시도!

![](/attachments/2015-07-30-testdisk.png){:.fit.dropshadow}

어? 뭔가 보인다! 보여!

지금 반전되어 있는 영역이, 그 값이 조금 이상하게 보이기는 하지만
바로 나의 잃어버린 데이터가 들어있는 영역임에는 틀림이 없다.
값이 이상하게 보이는 이유는 아마도, 내가 `LUKS` 방식의 암호화
디스크를 사용하고 있어서인지, 손상에 의한 것인지는 정확히 모르겠다.

아무튼, 파티션의 시작위치인 2489/250/2는 정확하게 얻을 수 있었다.

> 야호!

이렇게, Ubuntu Linux의 Live 모드에서 파티션을 복구했고, 문제의 LUKS
파티션을 마운트하고 네트워크 백업을 했다. 약 90GB의 데이터를 서버에
넘기는 것으로 1차 백업 완료.

### 마무리

`rsync`를 이용하여 전체 데이터를 옮기고 보니, I/O Error로 넘어가지
않는 데이터가 있더라. 일단 목록을 저장하고, OS 설치를 깔끔히 다시
했다. 그리고 데이터 점검을 해봤으나...

보이는 파일의 상당 부분이 손상된 상태라는 것을 알게 되었다.
천공카드 꼴이랄까?

지금은, 그나마 남은 흔적을 바탕으로 최대한 많은 데이터를 살리기
위해 노력하고 있는 중이며, 이렇게 반성의 시간을 갖고 글로 남겨,
나중에 같은 실수를 또 하게 된다면...   
이제 슬기롭게 극복할 수 있기를 빈다!
