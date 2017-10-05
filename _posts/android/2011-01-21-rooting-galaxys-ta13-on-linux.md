---
redirect_from: /blog/2011/01/21/rooting-galaxys-ta13-on-linux/
title: 갤럭시S TA13, 리눅스 컴에서 루팅하기
tags: android galaxy-s rooting
categories: ["android"]
date: 2011-01-21T14:23:31+09:00
modified: 2011-01-21T14:26:55+09:00
---
깔끔한 앱 형식의 안드로이드 루팅 도구인 z4root가 TA13에서 동작하지 않는다.
아뿔싸! 그럼 역방향 USB 테더링도 루팅 없이는 안된다! 어쩌지? 다른 루팅도구를
찾아보다가 포기하고, 걍 `rageagainstthecage`를 써서 수동으로 루팅 진행.
좀 지루하긴 한데, 어쨌든 된다. 왜 이걸로 앱 만드신 분이 없으심?

과정은 다음과 같다.

```console
sio4@dot:~/soc$ adb push Superuser.apk /sdcard/
sio4@dot:~/soc$ adb push su /sdcard/
sio4@dot:~/soc$ adb push busybox /sdcard/
sio4@dot:~/soc$ adb push rageagainstthecage /sdcard/
sio4@dot:~/soc$ adb shell
$ cat /sdcard/rageagainstthecage > /skttmp/rageagainstthecage
$ chmod 755 /skttmp/rageagainstthecage
$ /skttmp/rageagainstthecage
[*] CVE-2010-EASY Android local root exploit (C) 2010 by 743C

[*] checking NPROC limit ...
[+] RLIMIT\_NPROC={2756, 2756}
[*] Searching for adb ...
[+] Found adb as PID 2341
[*] Spawning children. Dont type anything and wait for reset!
[*]
[*] If you like what we are doing you can send us PayPal money to
[*] 7-4-3-C@web.de so we can compensate time, effort and HW costs.
[*] If you are a company and feel like you profit from our work,
[*] we also accept donations > 1000 USD!
[*]
[*] adb connection will be reset. restart adb server on desktop and re-login.
$ sio4@dot:~/soc$ adb kill-server; adb shell
* daemon not running. starting it now on port 5037 *
* daemon started successfully *
#
# cd skttmp
# cat /sdcard/busybox > busybox
# chmod 755 busybox
# ./busybox sh
/skttmp # ./busybox mount /system -o remount,rw
/skttmp # ./busybox cp /sdcard/Superuser.apk /system/app/
/skttmp # ./busybox cp /sdcard/su /system/bin/
/skttmp # ./busybox cp /sdcard/busybox /system/bin/
/skttmp # chmod 4755 /system/bin/su
/skttmp # ./busybox mount /system -o remount,ro
/skttmp #
```

생략했지만, 실제로는 `adb shell`로 진입하여 `rageagainstthecage`를 여러 차례
외친 끝에야 루트 쉘을 얻을 수 있었다. 어쨌든, 이렇게 하여 /system에 루트 킷을
심는 작업을 마쳤다.

필요한 파일들, `rageagainstthecage`, `su`, `busybox` 등의 바이너리와
Superuser.apk 등은 SuperOneClick 패키지에서 가져왔다. 왜 SuperOneClick을
그냥 쓰지 손으로 그러냐고? PC의 OS가 리눅스다보니까... 이게 더 맘 편할 것
같아서... SOC도 리눅스에서 동작하는 것 같지만 단순히 일회성 작업을 위해서는
좀 성가신 작업이 필요할 것 같다.

현재 사용된 파일들의 버전은,

- `rageagainstthecage`
- `su` : 2.3.1-ef
- `busybox` : 1.17.2 (with most or full functions)
- Superuser.apk : 2.3.6.1

이렇다. 그나저나 계획은 언제 진행하누...

