---
title: SD Card 성능 시험
subtitle: 빠른 SD 카드를 갖고 싶다!
tags: [performance, IO, SD card, microSD, microSDXC, memory-card, dd]
categories: ["misc"]
date: 2017-10-31T18:34:00+0900
lastmod: 2025-12-20T23:26:50+09:00
---
Android 폰, 또는 DSLR에서 쓰기 위해 구입했던 SD Card에 대하여 진행한,
`dd`를 사용한 간이 읽기/쓰기 속도 시험. 워낙 메뉴얼 보기를 돌같이 하다
보니 처음에는 (오히려 복잡한) 무식한 방법을 썼었고, 오늘 새 microSD를
추가하는 김에 좀 다음었다. 다듬는 김에 문서도 좀 업데이트.
<!--more-->

결론은,

> * 빨라졌다고 해도, 별로 빠르지 않다.
> * SD Card Reader는 USB 3.0을 ~살 필요가 없다~ 이제는 살만 하다.


## Result

|Product                                         |READ   |WRITE  | Tested at  |
|------------------------------------------------|------:|------:|-----------:|
| SanDisk Extreme 256GB microSDXC I C10 U3 V30 A2| 86.26 | 67.71 | 2025-12-19 |
| KODAK 64GB microSDXC I C10 U3 V30 A1 (AliExpr) | 78.44 | 21.92 | 2025-11-10 |
| SanDisk Extreme PRO 256GB SDXC I C10 U3 V30    | 83.52 | 84.56 | 2018-12-12 |
| SanDisk Ultra 200GB microSDXC I C10 U1 A1      | 82.62 | 31.30 | 2018-12-11 |
| SanDisk Ultra Plus 128GB microSDXC I U1 V10 A1 | 75.90 | 32.97 |            |
| SanDisk Extream 64GB SDXC I U3                 | 54.00 | 34.73 |            |
| SanDisk 64GB SDXC I U1                         | 67.54 | 35.62 |            |
| Samsung 64GB SDXC I C10 U1                     | 44.46 | 13.21 |            |
| Samsung 32GB SDHC C10 U1                       | 51.47 | 34.13 |            |
| SanDisk 32GB SDHC Class 4 (D1)                 | 20.57 |  6.20 |            |
{.fit}

기록을 위한 문서니까 결과를 맨 앞에 넣었다. 시험 조건을 최대속도를 낼 수 있는
조건으로 하지 않은 탓도 있고, 또한 내 Laptop의 한계일 수도 있지만 생각보다
속도가 잘 나오지 않는다. 제품 구매 시 SPEC은 짱짱한데...

### SPEC

| Product                                               | READ     | WRITE    |
|-------------------------------------------------------|---------:|---------:|
| SanDisk Extreme 256GB microSDXC I C10 U3 V30 A2       | 190 MB/s | 130 MB/s |
| KODAK 64GB microSDXC I C10 U3 V30 A1 (AliExpress)     | 100 MB/s |  70 MB/s |
| SanDisk Extreme PRO 265GB SDXC I C10 U3 V30           | 200 MB/s | 140 MB/s |
| SanDisk Ultra 200GB microSDXC I C10 U1 A1             | 120 MB/s |   - MB/s |
| SanDisk Ultra Plus 128GB microSDXC I U1 V10 A1        | 100 MB/s |   - MB/s |
{.fit}

SPEC만 보면 아우~ 두 배는 빨라야 하는데...

### Details

| READ SPEED                     | 1st  | 2nd  | 3rd  | 4th  | 5th  | average |
|--------------------------------|-----:|-----:|-----:|-----:|-----:|--------:|
| SanDisk Extreme 256GB V30 U3 A2| 84.9 | 86.6 | 86.0 | 87.0 | 86.8 |   86.26 |
| KODAK SDXC U3 C10 V30 A1 SDR104| 78.0 | 78.9 | 78.3 | 78.3 | 78.7 |   78.44 |
| SanDisk Extreme PRO V30 U3 C10 | 82.6 | 83.9 | 83.5 | 83.4 | 84.2 |   83.52 |
| SanDisk Ultra 200GB 2018 Spain | 82.6 | 81.3 | 83.3 | 82.5 | 82.9 |   82.62 |
| SanDisk Ultra Plus 128GB       | 76.0 | 76.1 | 76.0 | 75.5 | 75.9 |   75.90 |
| SanDisk Extream 64GB SDXC I U3 | 54.0 | 54.0 | 54.0 | 54.0 | 54.0 |   54.00 |
| SanDisk 64GB SDXC I U1         | 67.4 | 67.6 | 67.6 | 67.6 | 67.5 |   67.54 |
| Samsung 64GB SDXC I C10 U1     | 44.9 | 44.8 | 44.3 | 44.3 | 44.1 |   44.46 |
| Samsung 32GB SDHC C10 U1       | 51.3 | 51.6 | 51.5 | -    | -    |   51.47 |
| SanDisk 32GB SDHC Class 4 (D1) | 20.6 | 20.6 | 20.5 | -    | -    |   20.57 |
{.fit}

| WRITE SPEED                    | 1st  | 2nd  | 3rd  | 4th  | 5th  | average |
|--------------------------------|-----:|-----:|-----:|-----:|-----:|--------:|
| SanDisk Extream 256GB V30 U3 A2| 65.7 | 68.1 | 67.0 | 68.7 | 69.0 |   67.71 |
| KODAK SDXC U3 C10 V30 A1 SDR104| 22.5 | 21.8 | 20.9 | 22.4 | 22.0 |   21.92 |
| SanDisk Extreme PRO V30 U3 C10 | 89.6 | 90.4 | 63.0 | 89.6 | 90.2 |   84.56 |
| SanDisk Ultra 200GB 2018 Spain | 28.1 | 32.7 | 31.9 | 31.8 | 32.0 |   31.30 |
| SanDisk Ultra Plus 128GB       | 34.4 | 30.0 | 31.1 | 36.1 | 33.3 |   32.97 |
| SanDisk Extream 64GB SDXC I U3 | 34.4 | 35.0 | 30.8 | 35.9 | 37.6 |   34.73 |
| SanDisk 64GB SDXC I U1         | 35.6 | 36.2 | 31.6 | 39.0 | 35.7 |   35.62 |
| Samsung 64GB SDXC I C10 U1     | (5.7)|  8.3 | 10.9 | 16.8 | 16.9 |   13.21 |
| Samsung 32GB SDHC C10 U1       | 42.9 | 45.4 | 23.1 | 19.3 | 40.0 |   34.13 |
| SanDisk 32GB SDHC Class 4 (D1) |  7.0 |  5.8 |  5.6 |  6.1 |  6.5 |    6.20 |
{.fit}



## Method

읽기 및 쓰기 성능시험에 사용한 명령어는 다음과 같다.

#### Read

```console
$ for i in 1 2 3 4 5; do LANG=C sudo dd if=/dev/mmcblk0 of=/dev/null bs=4M count=256 iflag=direct 2>&1 |tail -1; done
1073741824 bytes (1.1 GB, 1.0 GiB) copied, 12.7332 s, 84.3 MB/s
1073741824 bytes (1.1 GB, 1.0 GiB) copied, 12.4112 s, 86.5 MB/s
1073741824 bytes (1.1 GB, 1.0 GiB) copied, 12.4398 s, 86.3 MB/s
1073741824 bytes (1.1 GB, 1.0 GiB) copied, 12.4831 s, 86.0 MB/s
1073741824 bytes (1.1 GB, 1.0 GiB) copied, 12.592 s, 85.3 MB/s
$ 
$ echo "(84.3+86.5+86.3+86.0+85.3)/5" |bc -l
85.68000000000000000000
$ 
```

위의 결과는, 이미 오래 전에 시험을 했던 SanDisk Ultra 200GB 모델을 용도를
바꾸면서 한 번 더 시험한 것이다. 이전 방식과 새로운 방식으로 모두 해봤는데,
결과는 두 방식 모두, 그리고 이전 결과와도 거의 비슷하다.

아래는 이전에 사용하던 방식이다. 두 가지 차이가 있는데, 작은 것부터 말하면
이제는 `bs=4M count=256`를 쓰는데 반해 과거에는 `bs=4k count=262144`를 썼었다.
좀 더 짜잘한 I/O를 만들어서 빡세게 시험하려던 거였는데, 요즘 세상에 4KB가
표준이 될 수 있을까 싶어서 변경했다. 다른 하나는, 이게 더 중요한 건데,
과거에는 `echo 3 |sudo tee /proc/sys/vm/drop_caches`를 사용해서 시스템 캐시를
날려가며 시험했는데, 좀 무식하지 않을 수 없다. 그래서 이제는 동일한 효과를
`iflag=direct` 옵션으로 주고 있다. 이 flag는 입력에 한하여 Direct I/O를
사용하도록 강제하는 것인데, 이를 통해 OS Cache의 영향을 제거한 순수한 I/O
성능을 확인할 수 있다. (`direct` 외에도 `sync` 등의 옵션을 고려할 수도)


```console
$ for i in 1 2 3 4 5; do sync; echo 3 |sudo tee /proc/sys/vm/drop_caches >/dev/null; LANG=C sudo dd of=/dev/null if=/dev/mmcblk0 bs=4k count=262144 2>&1 |tail -1; done
1073741824 bytes (1.1 GB) copied, 14.1356 s, 76.0 MB/s
1073741824 bytes (1.1 GB) copied, 14.1099 s, 76.1 MB/s
1073741824 bytes (1.1 GB) copied, 14.1217 s, 76.0 MB/s
1073741824 bytes (1.1 GB) copied, 14.2261 s, 75.5 MB/s
1073741824 bytes (1.1 GB) copied, 14.1416 s, 75.9 MB/s
$ 
```

이 결과는 "SanDisk Ultra Plus 128GB microSDXC I C10 U1 V10 A1" 모델에 대해
예전에 시험했던 결과다.  (이번에 용도변경을 위해 시험해보니 제대로 동작하지
않는다. 좀 더 확인해보고 폐기처분해야 할 듯. 비싸게 샀는데... ㅠ.ㅠ)

#### Write


```console
$ for i in 1 2 3 4 5; do rm -f test; LANG=C sudo dd if=/dev/zero of=test bs=4M count=256 oflag=direct 2>&1 |tail -1; done
1073741824 bytes (1.1 GB, 1.0 GiB) copied, 42.0828 s, 25.5 MB/s
1073741824 bytes (1.1 GB, 1.0 GiB) copied, 39.9583 s, 26.9 MB/s
1073741824 bytes (1.1 GB, 1.0 GiB) copied, 41.8014 s, 25.7 MB/s
1073741824 bytes (1.1 GB, 1.0 GiB) copied, 40.0038 s, 26.8 MB/s
1073741824 bytes (1.1 GB, 1.0 GiB) copied, 42.1812 s, 25.5 MB/s
$ 
$ $ echo "(25.5+26.9+25.7+26.8+25.5)/5" |bc -l
26.08000000000000000000
$ 
```

읽기 시험에 비해, 쓰기 시험은 조금 까다로운 면에 있다. 기본적으로 디스크에
변형이 가해진다는 점이 가장 커서, 이미 파일시스템이 있고 사용중인 디스크에
대해서도 시험할 수 있도록 `of`를 파일로 지정해서 사용하고 있다.

사용된 옵션을 보면, 역시 `bs=4M`와 `count=256`을 사용해서 1GB를 쓰는 시험을
하고 있고, 이번에는 `iflag`가 아닌 `oflag=direct` 옵션을 주어 OS Cache의
도움을 제거했다. 만약 이 옵션을 제거한다면 결과가 다음과 유사하게 나온다.

```console
$ sudo dd if=/dev/zero of=test bs=4k count=262144 2>&1 |tail -1; time sync
1073741824 bytes (1.1 GB, 1.0 GiB) copied, 2.68704 s, 400 MB/s

real	0m39.834s
user	0m0.000s
sys	0m0.009s
$ 
```

위의 결과는 동일한 Disk에 대해 수행한 결과인데, 속도가 400 MB/s으로 찍혀있다.
이 말이 안되는 속도는, Application이 `write`를 했을 때 OS가 그것을 (실제
디스크 기록 없이) 껴안아주고 뒷일을 맡아주기 때문인데, 이렇게 되면 실제로
Disk에 물리적인 sync가 일어날 때 소요되는 시간을 알아야 한다. 그래서 `dd`
명령에 이어 `sync` 명령을 내림으로써 `sync`에 사용된 시간을 확인하고, 그
값을 실제 I/O 시간으로 간주하여 `1024 MB / real second`의 계산으로 속도를
구했었다.

```console
$ echo "1024 / 39.834" |bc -l
25.70668273334337500627
$ echo "1024 / (39.834 + 2.687)" |bc -l
24.08221819806683756261
$ 
```

계산을 하면 대략 위와 같은 값이 나오는데, `oflag=direct`를 준 변형된 명령의
결과와 비슷하게 나오지만 상황에 따라 오류가 낄 수 있다. (가령, 동작 중인
다른 application에서 I/O가 있었다든지...)

아무튼, 늘 좀 어설픈 시험이라 거시기했는데 이제 좀 더 깔끔해진 느낌? ㅎ
