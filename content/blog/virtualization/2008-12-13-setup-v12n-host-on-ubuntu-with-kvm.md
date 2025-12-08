---
redirect_from:
- /entry/setup-virtualization-environment-on-ubuntu10-with-kvm/
- /177/
title: 우분투 8.10에서 kvm을 이용한 가상 호스트 설정
tags: ["kvm", "virtualization", "howto", "Ubuntu"]
categories: ["virtualization"]
date: 2008-12-13T23:41:38+09:00
lastmod: 2010-07-02T21:44:55+09:00
---
## 개요

가물가물한 기억인데, kvm과의 첫 만남은 아마도 2007년 늦은 봄 정도였던 것
같다. 그 무렵이 드디어! kvm이 메인스트림 커널에 포함되고 그것을 기반으로
한 배포본이 등장하기 시작했던 무렵이기 때문이다.
(요즘 가끔씩 깜짝 놀라기도 하는데, 되돌아보니 근 몇 년간 배포본에서 지원하지
않는 최신의 뭔가를 스스로 노력해서 써본 기억이 없다! 이럴수가!)

이런 저런 정황으로 봤을 때, 앞으로 리눅스 기반 가상화의 중심에 자리 잡을
것으로 예상했던 kvm의 첫 느낌은, (애써 감추려고 노력했지만) 사실 실망이었다.
너무 느리고 까다롭고... 하지만, 신생아라는 점을 고려하면, 그냥
"와~ 추카추카~ 이쁘네~~~ 잘키워~" 하고 호응해줄 수 밖에!

그로부터 채 1 년도 지나기 전에, kvm을 프로젝트에서 개발 플랫폼으로써 활용할
수 있었다는 것이, 기쁘지 않을 수 없다. :-) 그래서, 이번에는 내부 업무
시스템에 kvm을 적용해보기로 맘먹었다. (말이 길었는데,) 이 글은 그 과정에
대한 기록이다.

## 설치 및 설정 - 기본 설정

한 두 번도 아닌데, kvm은 설치할 때 마다 새로운 느낌이 있다. 아직 활발히
성장하고 있는 중이어서일까? 어쨌든, 이번 설치의 플랫폼은 우분투 8.10이다.
먼저, 다음 명령을 사용하여 kvm 관련 패키지를 설치했다.

```console
$ sudo apt-get install ubuntu-virt-server
```

8.10 버전부터 새로 추가된 ubuntu-virt-server 패키지는 kvm, libvirt-bin,
openssh-server 등의 세 패키지를 잡고 있는 가상화 서버 구성을 위한
메타패키지이다. 이와 함께 추가된 ubuntu-virt-mgmt 패키지는 virt-manager,
python-vm-builder, virt-viewer 등의 관리용 패키지를 잡고 있는
메타 패키지인데, 이 번 작업 내용에는 포함되지 않았다. (현재 랩탑에서
사용중인 7.10 버전에서는 지원되지 않아서 일단 관련된 작업 및 시험은
보류했다.)

네트워킹 등의 일부 기능은 적절한 권한이 있어야 사용할 수 있다. 다음 명령을
이용하여 사용자를 libvirtd 그룹에 추가시켜준다. (물론, 다시 로그인을 해야
변경된 그룹 권한이 적용된다.)

```console
$ sudo adduser `id -un` libvirtd
```

위의 과정이 정상적으로 수행되었다면, 다음과 같은 방식으로 작동 여부를
확인할 수 있다.

```console
$ virsh -c qemu:///system list
Connecting to uri: qemu:///system
Id Name State
----------------------------------
$
```

## 가상머신 설치하기 - 가상 콘솔

이런! 가상머신을 설치하려고 보니 어쩔 수 없이 최소한의 클라이언트 기능을
설치할 수 밖에 없겠네... 애초의 계획은 클라이언트는 완전히 독립된 기계에서
운용하고 서버는 말 그대로 "가상화 기반"으로써만 활용하는 것이었다. 그런데...
랩탑 환경을 지금 바꾸기는 좀 무리가 있고 일단은 서버에 최소한의 관리 환경을
설치하도록 한다.

다음과 같은 방식으로 가상 콘솔 프로그램인 virt-viewer를 설치한다.

```console
$ sudo apt-get install virt-viewer
[...]
다음 새 꾸러미를 설치할 것입니다:
  defoma fontconfig fontconfig-config hicolor-icon-theme libatk1.0-0
  libatk1.0-data libcairo2 libcups2 libdatrie0 libdrm2 libfontconfig1
  libfontenc1 libfreetype6 libgl1-mesa-glx libglu1-mesa libgtk-vnc-1.0-0
  libgtk2.0-0 libgtk2.0-bin libgtk2.0-common libgtkglext1 libice6 libjpeg62
  libpango1.0-0 libpango1.0-common libpixman-1-0 libpng12-0 libsm6
  libthai-data libthai0 libtiff4 libxcb-render-util0 libxcb-render0
  libxcomposite1 libxcursor1 libxdamage1 libxfixes3 libxfont1 libxft2 libxi6
  libxinerama1 libxmu6 libxrandr2 libxrender1 libxt6 libxxf86vm1 ttf-dejavu
  ttf-dejavu-core ttf-dejavu-extra virt-viewer x-ttcidfont-conf
  xfonts-encodings xfonts-utils
[...]
$ 
```

virt-viewer는 말 그대로 가상머신 뷰어이다. 이 프로그램을 통하여 가상머신의
가상 콘솔에 접속할 수 있고, OS 설치 등의 현장에서만 실행할 수 있는 작업을
진행할 수 있다.

이것으로 준비는 거의 끝난 것 같다.

## 가상머신 설치하기 - 가상머신 생성

virt-install 이나 우분투 고유의 python-vm-builder (예전의 ubuntu-vm-builder)
등의, 설치 전용 유틸리티를 활용하여 생성과 동시에 설치를 진행하는 방식도
있고, 또는 virt-manager에서 적절한 생성을 마친 후, 가상머신을 기동시키고
설치를 진행할 수도 있다. 예전에는 virt-manager 방식이나 virt-install 방식을
시도해봤었는데, virt-manager 방식의 경우, 설치 속도 문제로 고생을 좀 했던
기억이 있다. virt-install의 경우, 설치 후 재부팅이 필요한 환경 등에서 좀
모자라다는 느낌을 받았었던 것 같은데 역시 기억이 살짝 희미해져 있다. 더욱
중요한 것은, virt-install의 경우, 여러 디스크를 붙이고 싶은 경우 등의 상세한
작업을 할 수 없었던 것으로 기억한다. 그래서 이번에는 다른 방식을 도입해
보았다.

이름하여 가상머신 생성기. genxml.sh라는 스크립트를 급조했다. 처음에는 조금
보편적인 설정이 가능하도록 하려다가, 시간도 없고. 또한 그렇게 까지 할
필요성을 느끼지도 못해서 내 스타일의 가상머신을 만들어내는 정도로 목표
수준을 낮췄다. 다음은 스크립트의 내용이다.

```bash
#!/bin/sh

VM_ROOT=/box/vms

vm_name=mercury
vm_mem=1024
vm_cpu=2
vm_mac=`echo "52:54:00$(hexdump -e '/1 ":%02x"' -n 3 /dev/urandom)"`

echo -n "name of vm: "; read vm_name
vm_home=$VM_ROOT/$vm_name
mkdir -p $vm_home

echo -n "size of ram: "; read vm_mem
echo -n "number of cpus: "; read vm_cpu
echo -n "path of cdrom: "; read vm_cdrom
echo -n "disk size of sys: "; read size
qemu-img create $vm_home/$vm_name-sys.qcow2 -f qcow2 ${size}G
echo -n "disk size of tmp: "; read size
qemu-img create $vm_home/$vm_name-tmp.qcow2 -f qcow2 ${size}G
echo -n "disk size of opt: "; read size
qemu-img create $vm_home/$vm_name-opt.qcow2 -f qcow2 ${size}G

cat < $vm_name.xml >>EOF
<domain type="kvm">
  <name>$vm_name</name>
  <uuid>`uuidgen`</uuid>
  <memory>$(( $vm_mem * 1024 ))</memory>
  <currentmemory>$(( $vm_mem * 1024 ))</currentmemory>
  <vcpu>$vm_cpu</vcpu>
  <os>
    <type>hvm</type>
    <boot dev="hd"/>
  </os>
  </boot>
  <features>
    <acpi/>
  </features>
  <clock offset="utc" />
  <on_poweroff>destroy</on_poweroff>
  <on_reboot>restart</on_reboot>
  <on_crash>destroy</on_crash>
  <devices>
    <emulator>/usr/bin/kvm</emulator>
    <disk type="file" device="disk">
      <source file="/$vm_home/$vm_name-sys.qcow2"/>
      <target dev="hda" bus="ide"/>
    </disk>
    <disk type="file" device="disk">
      <source file="/$vm_home/$vm_name-tmp.qcow2"/>
      <target dev="hdb" bus="ide"/>
    </disk>
    <disk type="file" device="disk">
      <source file="/$vm_home/$vm_name-opt.qcow2"/>
      <target dev="hdd" bus="ide"/>
    </disk>
    <disk type="file" device="cdrom">
      <source file="/$vm_cdrom"/>
      <target dev="hdc" bus="ide"/>
    </disk>
    <interface type="network">
      <mac address="$vm_mac"/>
      <source network="default"/>
    </interface>
    <input bus="ps2" type="mouse"/>
    <graphics type="vnc" port="-1" listen="127.0.0.1"/>
  </devices>
</domain>
EOF
```

이 스크립트를 이용하면 디스크 세 개를 달고 있는 가상머신 설정을 단숨에
만들어낼 수 있고 해당 디스크 이미지 역시 스크립트 내부에서 만들어낸다.
가상머신이 생성되는 위치는 스크립트 내부에 지정되어 있으며, 가상머신
이름을 이용한 디렉토리 안에 관련된 디스크 파일을 모아두는 방식으로 되어있다.
다만, 가상머신의 설정이 담긴 xml은 스크립트를 실행한 현재디렉토리에
떨어지게 되며, 다음 명령을 이용하여 이 xml 파일을 읽어들여 가상머신
설정을 완료하도록 할 수 있다.

```console
$ ./genxml.sh
name of vm: u810si
size of ram: 512
number of cpus: 2
path of cdrom: /box/isos/ubuntu-8.10-server-i386.iso
disk size of sys: 6
Formatting '/box/vms/u810si/u810si-sys.qcow2', fmt=qcow2, size=6291456 kB
disk size of tmp: 1
Formatting '/box/vms/u810si/u810si-tmp.qcow2', fmt=qcow2, size=1048576 kB
disk size of opt: 2
Formatting '/box/vms/u810si/u810si-opt.qcow2', fmt=qcow2, size=2097152 kB
$ virsh -c qemu:///system define u810si.xml
```

이렇게, 우분투 8.10 서버용 i386 버전을 위한 가상머신 설정과 디스크 준비를
끝냈고, 마지막으로 virsh 쉘의 define 명령을 이용하여 만들어진 설정을
적용하였다. 이제 생성된 가상머신을 실행해보자.

```console
$ virsh -c qemu:///system start u810si
Connecting to uri: qemu:///system

$ virt-viewer -c qemu:///system u810si
```

어라? 부팅에 실패했다! 왜냐하면, 기본 부팅 설정이 'hd' 즉, 하드디스크로
되어있기 때문. xml 파일을 열어서 다음의 내용을 수정해주고 다시 define
명령을 내려줘야 cdrom으로의 부팅이 가능하다. (그런데 왜 hd를 기본값으로
했을까? cdrom으로 바꿀까?)


```diff
9c9
< <boot dev="hd">
---
> <boot dev="cdrom">
```

어쨌든, cdrom으로 부팅을 하도록 설정하고, define 명령을 내려주고, 다시
start 명령을 내린 후 접속을 해보면 설치 화면이 떠 있는 것을 볼 수 있다.
이후의 과정은 일반적인 설치 과정이며, 최종적으로 재부팅. 어라? 그러면
다시 CD로 부팅할 줄 알았은데 그렇지가 않다. 그냥 부팅 오류가 발생했네?
이유는 모르겠지만 어차피 다시 부팅 설정을 바꿨어야 했으므로, 다음의
방식으로 설정을 바꿔주고 다시 시작해보자.

```console
$ virsh -c qemu:///system destroy u810si
$ vi u810si.xml (boot 부분 편집)
$ virsh -c qemu:///system define u810si.xml
$ virsh -c qemu:///system start u810si
```

휴, 이제 설치가 모두 끝났다.

아참, 이렇게 재부팅 하기 직전의 상태를 백업해 두는 것도 좋겠네.

## 가상머신 복제

이렇게 생성, 설정 및 설치를 마친 후, 늘 그렇듯이 설치 원본의 백업 및 복제
방안 마련에 들어간다. 백업은 간단한게, xml 파일과 디스크 이미지 파일을
tar 명령으로 묶어서 저장해두면 그 뿐. 그럼 복제는? 다음의 방식을 도입해봤다.

먼저, 간단한 스크립트를 하나 짰다. 이름은 copyvm.sh.

```bash
#!/bin/sh

src_vm=$1
dst_vm=$2

["$src_vm" = "" -o "$dst_vm" = ""] && {
        echo "usage: copyvm.sh src dst"
        exit 1
}

[! -d "$src_vm"] && { echo "source vm is not exist. abort!"; exit 1; }
[-e "$dst_vm"] && { echo "destination vm is already exist. abort!"; exit 1; }

vm_mac=`echo "52:54:00$(hexdump -e '/1 ":%02x"' -n 3 /dev/urandom)"`
vm_uuid=`uuidgen`

cp -a $src_vm $dst_vm
cd $dst_vm
rename "s/$src_vm/$dst_vm/" *
sed -i "s/$src_vm/$dst_vm/g" $dst_vm.xml
sed -i "s,<uuid>.*</uuid>,<uuid>$vm_uuid</uuid>," $dst_vm.xml
sed -i "s,<mac address=".*/">,<mac address="$vm_mac">," $dst_vm.xml

ls
cat $dst_vm.xml
```

내용은 간단하다. 인수 두 개를 받아서 첫 번째 인수로 받은 기존 VM을 두
번째 인수로 받은 이름의 새 VM으로 복사하고 설정 차원에서 중복되어서는
안되는 값만 바꿔주는 것이다.(MAC 주소와 UUID) 물론, OS 내부의 설정은
아직 변경하지 못한다. 불가능할 것 같지는 않은데... 현재로써는 복제 원본과
복제된 가상머신의 hostname, sshkey 등의 값이 같다는 한계가 있지만, 어쨌든
쓸만은 하다. 또한 복제 원본을 위한 템플릿 작업을 조금 한다면 더 좋겠지.

```console
$ copyvm.sh u810si rails
```

이제 우분투 8.10 서버 i386 버전 기반의 rails 환경 복제 완료. 프로비저닝
시간? 한 10초?

새로운 가상머신을 시작시킨 후, 다음의 명령으로 필요한 추가 패키지를
설치해줬다.

```console
$ sudo apt-get install vim
$ sudo apt-get install subversion
$ sudo apt-get install rails
$ sudo apt-get install rubygems
```

## 마치기

푸하하... 여기까지, 우분투 8.10 최신버전을 기반으로 한 가상 인프라 구축의
초기 단계와 가상머신 생성 및 복제 과정을 정리해봤다.

