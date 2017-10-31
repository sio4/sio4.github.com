---
title: IBM Bluemix IaaS ISO 부팅
subtitle: Cloud Z, IBM IaaS에서 ISO를 사용하여 VSI 부팅하기
categories: cloudz
date: 2017-10-31T11:50:00+0900
---
클라우드컴퓨팅 환경에서 가상 인스턴스를 만들 때, 일반적으로는 제공자가
제공하는 표준 이미지나 사용자가 미리 만들어 놓은 사용자 이미지를 이용하여
인스턴스를 만드는 것이 일반적이다. 그러나 가끔은 제3자 소프트웨어의 설치
또는 그와 유사한 형태의 작업을 위해 기존 환경에서와 유사하게 ISO 이미지로
부팅해야 할 상황이 발생할 수 있다.
Cloud Z, IBM Bluemix IaaS (aka SoftLayer) 에서는 다음과 같은 절차를 통하여
ISO를 사용하여 VSI를 부팅하는 것이 가능하다.

> 이 가이드는 클라우드컴퓨팅 서비스 제공자의 공식 가이드가 아닙니다.
> 클라우드 서비스 제공자나 저는 이 글의 내용을 보장하지 않으며, 이 기능과
> 절차는 제공자 사정에 의해 변경될 수 있습니다.



## 개요

IBM Bluemix에서는 다음과 같은 조건으로 ISO를 이용한 부팅을 지원한다.

* 사용자는 Public ISO나 Private ISO 이미지를 이용하여 VSI 등을 부팅할 수 있음
* 모든 사용자가 이용할 수 있는 Public ISO는 IBM이 직접 구성하여 올리며,
  사용자는 Public ISO를 구성할 수 없음
* 사용자는 자신의 책임 하에 직접 Private ISO를 올려 사용할 수 있음
* 사용자가 등록한 ISO 이미지는 Public으로 전환할 수 없음

ISO로 부팅하기 위해서는 ISO 이미지 올리기, ISO 이미지 가져오기, ISO 이미지로
부팅하기 순으로 진행할 수 있다. 이미지를 올리고 가져오는 단계는 Private ISO에
한정된 것이며, 한 번 1, 2 단계를 거쳐 올려진 이미지는 여러 차례에 걸쳐 사용할
수 있다.


## ISO 이미지 올리기

Bluemix IaaS의 ISO 부팅은 IBM이 공식적으로 지원하는 Public ISO나 사용자에
의해 사전 등록된 Private ISO 이미지를 기반으로 진행된다. 사용자의 Private
ISO를 등록하기 위해서는, 먼저 Bluemix IaaS의 Legacy Object Storage에 ISO를
업로드해야 한다.

Control Portal의 "Storage / Object Storage"를 선택한 후, API Type이 Swift인
Object Storage Account를 선택한다. 아래 그림에서는 맨 위 항목에 해당한다.
(Object Storage 계정이 없다면 만들어야 한다.)

![](/attachments/bmx/iso-boot-iso-upload-01-account.png){:.bordered.dropshadow}

계정을 선택한 후에 아래와 같이, 지역별 클러스터 목록을 만나게 되는데, 사용할
데이터센터/POD에 가까운 클러스터를 선택해준다. (예: Seoul 1)

![](/attachments/bmx/iso-boot-iso-upload-02-cluster.png){:.bordered.dropshadow}

클러스터를 선택하여 들어가면 아래와 같은 화면이 보인다. 여기서 "Add Container"
버튼을 이용하여 원하는 이름으로 ISO가 올라갈 영역을 만든다. (예: isos)

![](/attachments/bmx/iso-boot-iso-upload-03-container.png){:.bordered.dropshadow}

컨테이너가 생성되고 화면이 갱신되면 "Add File" 명령을 이용하여 사용자 PC에
담겨있는 ISO 파일을 업로드할 수 있다. 업로드가 완료되면 다음 화면과 같이,
그 목록을 확인할 수 있다.

![](/attachments/bmx/iso-boot-iso-upload-04-image.png){:.bordered.dropshadow}

파일이 정상적으로 업로드되었다면 다음 단계로 넘어간다.


## ISO 이미지 가져오기

사용자의 ISO 파일을 Object Storage에 올렸다면 이제 그 이미지를 클라우드
관리시스템이 인식할 수 있도록 등록을 해주어야 한다. 아래 화면은, Control
Portal에서 Device 메뉴 아래의 Manage, Images 메뉴를 선택했을 때의 화면이다.
아직 등록한 파일이 없다면 리스트에 아무것도 보이지 않는다.

![](/attachments/bmx/iso-boot-image-template-01-list.png){:.bordered.dropshadow}

화면의 탭 영역에 위치한 "Import Image"를 클릭하면 아래와 같이, 등록하고자
하는 이미지를 지정할 수 있는 화면이 나타난다. 이 화면에서 Account, Cluster,
그리고 Container를 차례로 선택해주면 그 아래 Image File을 선택할 수 있는
영역이 활성화된다. 이 목록에서 이전 단계에 등록한 ISO 파일을 선택한 후,
오른쪽 상단의 이름 부분을 작성해주고, 마지막으로 맨 아래 "Import" 버튼을
누르면 모든 절차가 마무리 된다. (이 때 지정하는 이름은 향후 해당 ISO를
사용하기 위하여 선택할 때 사용된다.)

![](/attachments/bmx/iso-boot-image-template-02-import.png){:.bordered.dropshadow}

이제 이전 화면인 이미지 템플릿 목록으로 돌아갔을 때, 아래와 같이 한 줄이
(더) 추가된 것을 볼 수 있다.

![](/attachments/bmx/iso-boot-image-template-03-result.png){:.bordered.dropshadow}

이제 이미지를 등록했고 사용가능한 상태가 되었으니, 다음 단계로 넘어간다.



## ISO 이미지로 부팅하기

마지막 단계는 등록한 ISO 이미지를 이용하여 VSI를 가동하는 단계이다. 이미
만들어진 VSI가 있다면 해당 페이지로 넘어간다. (Control Portal의 Devices
메뉴에서 원하는 VSI를 클릭하면 아래와 같은 페이지가 나타난다.)

![](/attachments/bmx/iso-boot-from-image-01-action.png){:.bordered.dropshadow}

화면에서 보는 바와 같이, 오른쪽 상단의 "Action" 메뉴를 클릭하면 중간에
"Boot From Image"라는 메뉴를 찾을 수 있다. 이 메뉴를 선택하면 아래와 같이,
부팅을 준비하는 화면으로 넘어간다.

![](/attachments/bmx/iso-boot-from-image-02-images.png){:.bordered.dropshadow}

위의 화면에서 Device Name 부분이 정확하게 내가 원하는 VSI를 가리키고 있는지
확인하고, 아래의 이미지 목록에서 이전 단계에서 등록한 ISO 이미지 옆에 있는
"Boot From This Image"를 선택해주면 된다. (전 단계에서 지정한 이름)

Public ISO를 사용하려는 경우에는 목록 상단의 "Private Images" 부분을
클릭하여 "Public Images"를 선택해주면 IBM이 제공하는 Public ISO 이미지가
목록에 표시된다.

주의
: ISO가 자동화된 경우가 아니라면, VSI의 원격 KVM 기능을 이용하여 접속을
  해야 ISO로 부팅한 화면에 접근하여 필요한 제어를 할 수 있다.


이상의 과정을 통하여 사용자는 자신이 원하는 ISO 이미지로 클라우드 인스턴스를
기동하여 원하는 작업을 수행할 수 있다.


