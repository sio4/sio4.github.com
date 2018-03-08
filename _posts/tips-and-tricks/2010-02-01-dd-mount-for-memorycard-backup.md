---
redirect_from: /entry/memorycard-backup-dd-mount/
title: 메모리카드 백업, dd, mount,...
tags: disk recovery
categories: ["tips-and-tricks"]
date: 2010-02-01T15:46:39+09:00
last_modified_at: 2010-07-02T09:43:05+09:00
---
디지털 카메라용 메모리카드에서 지워진 파일을 복구해야 할 일이 생겼다.
그런데 어쩌나? 이게 쉽게 끝나지 않네? 그래서 요 얼마 동안 별 짓을 다
해본다.

## dd 로 일단 백업 받아두기

디스크(또는 메모리카드)에 뭔가 손을 대기 전에 할 일 중 하나가 만약을
위하여 그 원본을 백업해두는 작업이다. 리눅스에서 가장 간단하게, 그리고
원초적으로 블록디바이스(디스크 등)를 백업할 수 있는 방법이 dd를 이용하여
말 그대로 디스크 이미지를 덤프해 두는 것이다.

```console
$ dd if=/dev/sdc of=cf-dump
```

이렇게 하면 디스크를 통 이미지로 저장할 수 있다. 이렇게 백업해둔 이미지는
반대 방향으로 덤프함으로써 리스토어가 가능하다.

그런데 잠깐, 이렇게 백업한 파일은 디스크의 이미지라서... 내용을 보기
위해서 마운트하려다보니 좀 이상하게 됐다. /dev/sdc에 대응하는 것이
cfcard-backup 인데 /dev/sdc1 등에 대응하는 것은 어떤 것인가? ㅋㅋ
해답은 다음과 같다.

```console
$ fdisk -ul cf-dump
You must set cylinders.
You can do this from the extra functions menu.
    
Disk cf-dump: 0 MB, 0 bytes
256 heads, 63 sectors/track, 0 cylinders, total 0 sectors
Units = sectors of 1 * 512 = 512 bytes
Disk identifier: 0x00000000

Device Boot Start End Blocks Id System
cf-dump1 * 63 15857855 7928896+ b W95 FAT32
Partition 1 has different physical/logical endings:
     phys=(983, 255, 63) logical=(983, 63, 63)
$
```

이렇게 fdisk 명령을 이용하여 첫번째 파티션이 시작되는 섹터의 위치를 찾을
수 있다. 이렇게 찾아진 섹터의 위치는 mount 명령을 내릴 때 offset 옵션을
이용하여 파티션 시작부분을 지정하기 위하여 사용된다.

```console
$ sudo mount -o offset=32256,ro cf-dump /mnt
[sudo] password for sio4: 
$ ls /mnt
dcim
$
```

이렇게, mount 명령에 offset 옵션을 주면 파일의 특정 위치를 건너뛰고 그
위치를 시작으로 하여 파티션/파일시스템 마운트를 진행할 수 있다. 참고로,
다음과 같이 파일, 또는 위치의 정체를 확인할 수 있다.

```console
$ dd if=cf-dump of=part1 skip=63 count=5
5+0 레코드 들어옴
5+0 레코드 나감
2560 바이트 (2.6 kB) 복사됨, 0.0229217 초, 112 kB/초
$ file cf-dump
cf-dump: x86 boot sector; partition 1: ID=0xb, active, starthead 1, startsector 63, 15857793 sectors, code offset 0x0
$ file part1 
part1: x86 boot sector, code offset 0x58, OEM-ID "MSDOS5.0", sectors/cluster 8, Media descriptor 0xf8, heads 255, hidden sectors 63, sectors 15857793 (volumes > 32 MB) , FAT (32 bit), sectors/FAT 15456, serial number 0xe81c0e2d, unlabeled
$
```

위와 같이, cf-dump 파일은 디스크 이미지이고 추출된 part1은 FAT32
파일시스템으로 포맷된 파티션이다.

## FAT 파일시스템의 복구

FAT 파일시스템에서 파일 목록은 FAT(File Allocation Table) 라고 불리는
지정된 영역에 파일의 목록을 유지/관리하고 있는데, 파일을 지우게 되면
실제의 파일 데이터는 유지한 채, FAT의 파일 목록에서 파일 이름의 첫번째
글짜를 원래의 글자에서 '?'로 바꾸게 된다... 라고 소시쩍에... 한 십 수년
전에 배웠던 것 같다 :-)

그 당시, PCTools 등의 유틸리티를 이용하면 FAT를 직접 편집할 수 있었고,
그렇게 해서 파일을 살리는 작업이 그리 어렵지 않았었던 것 같다. 그런데
이게 웬일? 오히려 십 수년의 발전에도 불구하고! 어찌 FAT를 편집할 수 있는
프로그램을 찾기가 쉽지가 않네...

## 파일 복구

몇몇 파일 목구 유틸리티를 찾아서 설치하고, 시도해봤지만 일부는 파일을
찾아만 주고 실제로 살리려면 돈내고 사라는 경우도 있었고, 비공식적인
경로로 구한 파일은 엉뚱한 유틸리티이고... ㅋㅋ

결국, 뒤지고 뒤지다가... 국산인 Final Data를 사용하여 파일을 건졌다. 휴~

어디 리눅스용 FAT 편집 프로그램 없을까?

