---
type: page
title: SD Card 속도 시험
subtitle: 빠른 SD 카드를 갖고 싶다!
categories: ["misc"]
date: 2017-10-31T18:34:00+0900
---
Android 폰, 또는 카메라에서 쓰기 위해 구입했던 SD Card에 대하여 진행한,
`dd`를 사용한 간이 읽기/쓰기 속도 시험
<!--more-->

결론은,

* 빨라졌다고 해도, 별로 빠르지 않다.
* SD Card Reader는 USB 3.0을 살 필요가 없다.


## Result

|Product                         |READ   |WRITE  |
|--------------------------------|------:|------:|
| KODAK SDXC U3 C10 V30 A1 SDR104| 78.44 | 21.92 |
| SanDisk Extreme PRO V30 U3 C10 | 83.52 | 84.56 |
| SanDisk Ultra 200GB 2018 Spain | 82.62 | 31.30 |
| SanDisk Ultra Plus 128GB       | 75.90 | 32.97 |
| SanDisk Extream 64GB SDXC I U3 | 54.00 | 34.73 |
| SanDisk 64GB SDXC I U1         | 67.54 | 35.62 |
| Samsung 64GB SDXC I C10 U1     | 44.46 | 13.21 |
| Samsung 32GB SDHC C10 U1       | 51.47 | 34.13 |
| SanDisk 32GB SDHC Class 4 (D1) | 20.57 |  6.20 |


### Details

| READ SPEED                     | 1st  | 2nd  | 3rd  | 4th  | 5th  | average |
|--------------------------------|------|------|------|------|------|---------|
| KODAK SDXC U3 C10 V30 A1 SDR104| 78.0 | 78.9 | 78.3 | 78.3 | 78.7 |   78.44 |
| SanDisk Extreme PRO V30 U3 C10 | 82.6 | 83.9 | 83.5 | 83.4 | 84.2 |   83.52 |
| SanDisk Ultra 200GB 2018 Spain | 82.6 | 81.3 | 83.3 | 82.5 | 82.9 |   82.62 |
| SanDisk Ultra Plus 128GB       | 76.0 | 76.1 | 76.0 | 75.5 | 75.9 |   75.90 |
| SanDisk Extream 64GB SDXC I U3 | 54.0 | 54.0 | 54.0 | 54.0 | 54.0 |   54.00 |
| SanDisk 64GB SDXC I U1         | 67.4 | 67.6 | 67.6 | 67.6 | 67.5 |   67.54 |
| Samsung 64GB SDXC I C10 U1     | 44.9 | 44.8 | 44.3 | 44.3 | 44.1 |   44.46 |
| Samsung 32GB SDHC C10 U1       | 51.3 | 51.6 | 51.5 | -    | -    |   51.47 |
| SanDisk 32GB SDHC Class 4 (D1) | 20.6 | 20.6 | 20.5 | -    | -    |   20.57 |

| WRITE SPEED                    | 1st  | 2nd  | 3rd  | 4th  | 5th  | average |
|--------------------------------|------|------|------|------|------|---------|
| KODAK SDXC U3 C10 V30 A1 SDR104| 22.5 | 21.8 | 20.9 | 22.4 | 22.0 |   21.92 |
| SanDisk Extreme PRO V30 U3 C10 | 89.6 | 90.4 | 63.0 | 89.6 | 90.2 |   84.56 |
| SanDisk Ultra 200GB 2018 Spain | 28.1 | 32.7 | 31.9 | 31.8 | 32.0 |   31.30 |
| SanDisk Ultra Plus 128GB       | 34.4 | 30.0 | 31.1 | 36.1 | 33.3 |   32.97 |
| SanDisk Extream 64GB SDXC I U3 | 34.4 | 35.0 | 30.8 | 35.9 | 37.6 |   34.73 |
| SanDisk 64GB SDXC I U1         | 35.6 | 36.2 | 31.6 | 39.0 | 35.7 |   35.62 |
| Samsung 64GB SDXC I C10 U1     | (5.7)|  8.3 | 10.9 | 16.8 | 16.9 |   13.21 |
| Samsung 32GB SDHC C10 U1       | 42.9 | 45.4 | 23.1 | 19.3 | 40.0 |   34.13 |
| SanDisk 32GB SDHC Class 4 (D1) |  7.0 |  5.8 |  5.6 |  6.1 |  6.5 |    6.20 |



## Method

Case of "SanDisk Ultra Plus 128GB"

#### Read

Just use reported value

```console
$ for i in 1 2 3 4 5; do sync; echo 3 |sudo tee /proc/sys/vm/drop_caches >/dev/null; LANG=C sudo dd of=/dev/null if=/dev/mmcblk0p1 bs=4k count=262144 2>&1 |tail -1; done
1073741824 bytes (1.1 GB) copied, 14.1356 s, 76.0 MB/s
1073741824 bytes (1.1 GB) copied, 14.1099 s, 76.1 MB/s
1073741824 bytes (1.1 GB) copied, 14.1217 s, 76.0 MB/s
1073741824 bytes (1.1 GB) copied, 14.2261 s, 75.5 MB/s
1073741824 bytes (1.1 GB) copied, 14.1416 s, 75.9 MB/s
$ 
```

#### Write

Use calculated value `1024 MB / real second`

```console
$ for i in 1 2 3 4 5; do echo 3 |sudo tee /proc/sys/vm/drop_caches >/dev/null; rm -f test; LANG=C sudo dd if=/dev/zero of=test bs=4k count=262144 2>&1 |tail -1; time sync; done
1073741824 bytes (1.1 GB) copied, 3.81721 s, 281 MB/s

real	0m29.797s
user	0m0.000s
sys	0m0.108s
1073741824 bytes (1.1 GB) copied, 3.6045 s, 298 MB/s

real	0m34.130s
user	0m0.000s
sys	0m0.104s
1073741824 bytes (1.1 GB) copied, 3.87892 s, 277 MB/s

real	0m32.932s
user	0m0.000s
sys	0m0.132s
1073741824 bytes (1.1 GB) copied, 3.82729 s, 281 MB/s

real	0m28.385s
user	0m0.000s
sys	0m0.124s
1073741824 bytes (1.1 GB) copied, 3.83282 s, 280 MB/s

real	0m30.742s
user	0m0.000s
sys	0m0.148s
$ 
```

```
1024 / 29.797
34.36587575930462798268
```
