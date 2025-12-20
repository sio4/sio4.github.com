---
type: page
title: Linux 활용 팁
subtitle: 가끔 써서 자주 까먹는 유용한 명령들
categories: ["misc"]
draft: true
date: 2017-10-31T22:00:00+0900
last_modified_at: 2017-10-31T22:00:00+0900
---
기억력의 한계를 느끼며, 그렇다고 한 편의 글이 될 수 없는 짤막한 기록들.


# Terminal

터미널 작업 시 유용한 명령들


## Turn off buffering in pipe

<http://unix.stackexchange.com/a/25378/29292>

Another way to skin this cat is to use the `stdbuf` program, which is
part of the GNU Coreutils (FreeBSD also has its own one).

```console
$ stdbuf -i0 -o0 -e0 command
```

This turns off buffering completely for input, output and error.
For some applications, line buffering may be more suitable for
performance reasons:

```console
$ stdbuf -oL -eL command
```

Note that it only works for stdio buffering (printf(), fputs()...)
for dynamically linked applications, and only if that application
doesn't otherwise adjust the buffering of its standard streams by
itself, though that should cover most applications.



# Commands & Tools

가끔 쓰는 명령들, 도구들

## Transcoding, Cutting, Cropping Video

### Transcoding

오래된 형식이거나, 원본의 크기가 지나치게 클 때 H.264로 압축하여 보관하고자
한다면... (AAC 오디오 128kbps, H264 2Mbps의 예)

```console
$ ffmpeg -i in.avi -c:a aac -ab 128 -strict -2 -c:v h264 -b:v 2M  out.mp4
```

### Cutting

길게 녹화된 영상을 적당한 길이로 자르려면... (시간은 초 또는 hh:mm:ss 형식을
사용할 수 있음)

```console
$ ffmpeg -i in.wmv -c:v h264 -b:v 1m -c:a mp3 -ss 00:00:05 -to 90 out.mp4
```

### Cropping

불필요하게 넓게 잡힌 영상을 적당한 크기로 자르려면... `crop=w:h:x:y` 형식으로
사용

```console
$ ffmpeg -i in.mp4 -filter:v "crop=1280:620:0:40" -c:a aac -ab 128 -strict -2 -c:v h264 -b:v 3M -to 00:00:50 out.mp4
```


# for Scripts






