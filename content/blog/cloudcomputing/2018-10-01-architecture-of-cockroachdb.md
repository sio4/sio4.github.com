---
title: CockroachDB Architecture
subtitle: CockroachDB의 구조 설계에 대한 짧은 이해
tags: ["DBMS", "cloud-computing", "Architecture"]
categories: ["cloudcomputing"]
image: /attachments/cockroachdb/arch/crdb-execution-flow.png
banner: /attachments/cockroachdb/arch/crdb-execution-flow.png
date: 2018-10-01T14:30:00+0900
---
원래는 진행했던 시험의 순서대로, CockroachDB 클러스터의 설치 스크립트에
대해 먼저 살펴보려고 했지만 글을 쓰면서 스스로에게 던지게 되는 질문은
"그래서 Cockroach가 어떻게 생긴 녀석인데?"라는 것이었다. 아! 알긴 안다.
바퀴벌레... 아주 징그럽게 생겼다. 그런데 이름은 징그럽지만 뭔가 정이
가는 이 CockroachDB도 징그럽게 생겼을까? 이 글은 CockroachDB의 생김에
대해, 지금까지 이해한 것을 정리한다. "지금까지"일 뿐이라서, 잘못된 점이
있을 수 있다는 것을 미리 밝힌다.

> CockroachDB 맛보기 묶음글은 다음과 같습니다.

* [CockroachDB 안녕?]
* [CockroachDB 클러스터 구성하기]
* _CockroachDB Architecture_
* [CockroachDB 클러스터 설치 스크립트]
* [CockroachDB 클러스터 가용성 시험]




# CockroachDB의 설계 지향점

어떤 것을 이해할 때, 그것이 향하는 방향을 이해하게 되면, 왜 그런 모양을
하고 있는지 보다 이해하기 쉬울 수 있다. 그래서, 먼저 CockroachDB가 어떤
배경에서 등장했는지, 어떤 지향점을 갖는지를 먼저 짚어본다.


## 21세기의 IT

{:toc .half.pull-right}
* TOC

21세기가 언제부터더라? 2000년? 2001년? 모르겠다. 좀 거창하게 제목줄을
써봤는데... IT의 역사나 그 변화 속도를 놓고 보면 여기에 "세기"를 가져다
붙이는 것은 좀 오버. 어쨌든, 2000년대에 들어서면서, 1990년대 후반부터
활발하게 진행된 **인터넷의 보편화와 오픈소스 운동의 확산을 토대로 삼아
개벽이라 할 만큼 큰 변화가 IT 영역에서 진행되고 있고, 그런 움직임들이
결합한 결정체가 바로 클라우드 컴퓨팅**이라고, 나는 생각한다.

인터넷의 보편화는 IT 산업은 물론이고 기존 산업의 시장까지도 국경이 더
이상 의미가 없는 시대를 열었고, 우리가 사용하는 많은 서비스들이 지구 상
어디에 기반을 두고 있는지도 모르는 (또는 느끼지 못하는) 경우가 허다하다.
그런 시대를 살다 보니, 이제 IT를 활용한 뭔가를 만들게 되면, 전지구적
시장과 그 규모를 생각하는 것이 매우 자연스럽다. 그런데, 그렇게 큰 꿈을
갖고 시작한 사업이라고 한 들, 처음부터 큰 돈을 쏟아 부을 수도 없고
반대로 사업확장에 대한 기대를 버릴 수도 없다. 결국, "**성장에 대한
유연한 대비**"가 더욱 중요해졌다.  (더하기, "속도감 있는 민첩성"도
생각해야 하고.)

기술 영역으로 시야를 돌려보면, 이러한 사업적 필요를 채우기 위해, 세계
각지에 흩어져 있는 사용자를 수용할 수 있는 분산기술, 성장과 함께 키워갈
수 있는 확장성, 그리고 그러한 조건에 잘 맞아 떨어지는 클라우드 컴퓨팅
서비스의 활용이 필수적이라는 뜻이 된다. 그리고... 이미 **컴퓨팅의 두 축인
"계산과 데이터" 중 계산 영역, 즉 프로그램 개발과 그것이 실행될 구동환경에
대해서는 이미 이러한 분산과 확장을 수용하기 위한 기술들이 충분히
성숙**했다는 것을 체감할 수 있다. 그런데 다른 한 축, 데이터 영역은 어떤가?

### 전통적 RDBMS와 신세대 NoSQL

NoSQL 등, 근래에 각광받고 있는 데이터 저장소 기술은 전지구적 분산 배치,
수평적 규모 확장 등 클라우드 컴퓨팅 환경과 잘 어울리는 획기적인 특성을
많이 갖추고 있으며, 많은 분야에서 활발하게 그 적용 범위를 넓혀가고 있다.
그러나 이러한 기술은 기존의 SQL, RDBMS가 제공하는 기능을 완전히 대체할
수 없으며, 업무 영역에 따라 적용이 거의 불가능에 가깝거나 Application을
거의 다시 작성하다 싶을 정도로 수정해야 할 수도 있다.

핵심적인 부분을 정리하자면,

{:.fit.styled}
|                    | RDBMS                   | NoSQL                        |
|--------------------|-------------------------|------------------------------|
| 트랜잭션의 지원    | 당연한 거 아님?         | 계산 영역에서 때워?          |
| 관계형 데이터 처리 | 완전 편리함             | 완전 어려움                  |
| 확장성             | 돈잔치                  | 선형 확장이 가능             |
| 전지구적 배치      | 돈잔치, 그럼에도 어려움 | 상대적으로 매우 용이함       |
| 장애극복           | 돈잔치, 쉽지 않음       | 복제를 통해 비교적 쉽게 구현 |
| 설계 유연성        | 상대적으로 딱딱함       | 유연함                       |

이렇게, 짜장면을 먹자니 매꼼 따뜻한 국물이 아쉽고, 짬뽕을 먹자니 달달한
짜장을 입술에 바르고 싶을 때, 우리는 너무 자연스럽게 짬짜면을 꿈꾸게 된다.


## 클라우드 컴퓨팅 시대의 DBMS

이 묶음글의 시작부터 몇 번 반복되는 이야기인데, 그들이 말하는 Cockroach의
존재 목적은 "SQL database for building global cloud services"이다. 전지구적
클라우드 서비스를 만들기 위한 SQL 데이터베이스. 바로, 짬짜면이라는 말.

**전통적인 RDBMS가 갖는 관계형 데이터 처리의 유용함과 사용자 경험을 유지한
채 NoSQL 또는 클라우드 컴퓨팅 환경이 제공하는 유연함과 수평 확장성을 함께
제공하는 RDBMS**를 만들기 위해, CockroachDB가 목표로 하는 아키텍쳐는 다음과
같은 특성을 지향하고 있다.

자동화된 운영
: 걱정 속에서 잠 못 이루는 운영자를 이해하고 있다. 확장, 분산처리, 복구
  등의 분산환경에서 골치 아플 수 있는 운영작업을 자동화하여 쉽게 운영할
  수 있게 한다.

데이터 일관성 및 가용성 보장
: 심지어 다양한 클라우드 제공자에 걸친, 전지구적 분산환경 속에서도 분산
  ACID 트랜잭션과 복제기술 등을 통해 데이터 일관성을 보장하고, 부분적인
  노드 장애 시에도 가용성을 보장한다.

표준 SQL 지원 및 유연한 스키마 관리
: PostgreSQL 문법 지원으로 추가 학습 없이 개발을 시작할 수 있으며,
  온라인 상태에서 스키마를 변경할 수 있도록 하여 민첩한 개발이 가능한
  환경을 제공한다.



# CockroachDB Architecture

이러한 목표를 이루기 위해, CockroachDB의 구조는 다섯 단계로 계층화된
형태로 이루어져 있으며, 각 계층은 상부 계층에 대해 Blackbox화된 인터페이스를
제공하고 있다고 한다.  CockroachDB의 구조를 이해하기 위해서는 이 다섯
계층과 여기서 사용되는 몇 가지 개념/용어에 대한 이해가 필요한데,
[공식 문서]는 각 용어에 대한 설명과 개념 설명을 앞서 기술하고, 그 뒤에
각 계층에 대한 설명을 상세하게 하고 있다.

하지만 이 글은, 각 계층에 대한 세부적인 이해 보다는 전반적인 구조에 대해
이해하는 것을 목적으로 하고 있으므로, 각각에 대한 설명보다는 특징적인 몇
가지 주제를 중심으로 설명하는 방식으로 기술하려 한다.  (사실, 아직 완전히
이해하지 못한 상태에서 쓰는 글이라서 상세히 설명할 수도 없고, 설명하고
있는 부분조차 잘못되었을 수 있다. 댓글을 통한 지적, 첨언, 토론, 언제든
환영한다.)


## 다섯 계층 둘러보기

CockroachDB는 기능적으로, 다음의 다섯 계층으로 이루어져 있다.

![](/attachments/cockroachdb/arch/crdb-layers.png)

Application 입장에서, CockroachDB Cluster는 단일 DBMS처럼 인식하게 되며,
Application은 맨 상위 계층인 "_SQL 계층_"과 대화하게 된다. SQL 계층을 통해
요청이 들어오게 되면, 이 요청은 Cockroach가 분산 처리를 위해 내부적으로
사용하는 Key-Value 방식에서 사용할 수 있도록 변환이 이루어지며, 이는 다시
하부의 "_Transaction 계층_", "_Distribution 계층_", "_Replication 계층_"
등을 거쳐 최종적으로 "_Storage 계층_"에 의해 각 Node의 디스크에
분산/복제되어 저장된다.

각각의 계층이 담당하는 기능은 다음과 같다.

SQL Layer
: 클라이언트의 표준 SQL 질의를 내부적으로 사용하는 KV 작업으로 변환한다.

Transaction Layer
: 요청 처리에 대한 ACID Transaction을 보장한다.

Distribution Layer
: 상위 계층에게는 데이터 저장소에 대한 추상화된 단일 인터페이스를 제공함과
  동시에, 실제 데이터가 분산되어 저장된 Range를 추적하고 분산처리를 수행한다.

Replication Layer
: KV 데이터의 묶음 단위인 Range를 세 개 이상의 Node에 복제하여 안전하게
  분산 저장하는 역할을 수행한다. 복제된 Range에 대한 Lease 관리를 위해
  Raft 알고리즘이 사용된다. (Raft 너 요즘 자주 나온다?)

Storage Layer
: 계층구조의 맨 아래에서 KV 데이터를 물리적으로 Disk에 쓰고 읽는 역할을
  수행한다. 이 때, CockroachDB는 RocksDB 방식을 사용한다.

음, 아직은 각 계층에 대해 더 간단하고 명쾌하게 설명하기가 힘들다. 하지만,
아래 설명할 Cockroach 구조의 특징적인 부분에 대해 조금 더 살펴보고,
마지막으로 구조 이해를 위해 시험했던 결과를 살펴보면 조금은 더 이해할 수
있을 것으로 기대한다.



## 하나의 클러스터

당연한 얘기인데, 사용자 입장에서는 전체 클러스터가 하나의 DBMS처럼 보이게
된다. CockroachDB에서 사용되는 "_Cluster_" 및 "_Node_"라는 용어는 일반적인
클러스터 구성에서 말하는 것과 다르지 않다.

하나의 Cluster는 최소 세 개 이상으로 구성되는 여러 개의 Node를 거느리게
되는데, 각 Node는 기능적으로 동등한 위상에 위치한다. Cluster 구조 속에서
특별한 역할과 기능을 전담하는 Node가 따로 구성되지 않으며, 모든 Node가
`cockroach` 프로세스를 공통적으로 구동하여 앞서 설명한 다섯 개의 계층
구조를 위한 기능을 동일하게 제공한다는 뜻이다.
(다음 절 "[대칭형 노드](#대칭형-노드)" 참고)

데이터 관점에서, 각 Node는 하나 이상의 "_Store_"를 담고 관리하게 되는데,
이 Store는 "[데이터의 분산/복제](#데이터의-분산복제)"에서 설명할 Range가
저장될 물리적 공간으로 이해할 수 있다.
CockroachDB의 저장소 구조는 Node 간 공유하는 부분이 없으며 각 Node는
(대체로 Local Disk를 사용하여) 배타적으로 접근하는 독립적인 저장공간을
갖게 된다. 이렇게 물리적으로 상호 배타적으로 구성된 저장소는 Replication
계층에 의한 복제를 통해 Node 장애에 대비한 가용성을 확보하게 되고, 또한
Distribution 계층에 의한 분산처리를 통해 논리적으로 하나처럼 동작하는
거대한 하나의 논리적 저장소를 확장 가능한 형태로 제공하게 된다.

{:.keypoint}
용어 정리: Cluster, Node, Store
: Cluster - 하나의 DBMS처럼 보이는 Node들의 집단  
  Node - `cockroach` 프로세스를 구동하며 Store를 소유하는 개별 기계  
  Store - 데이터가 저장되기 위한 물리적 공간으로, Node 종속적

이렇게 구성된 Cluster는, 하나의 DBMS 처럼 동작하면서 하부의 각 Node에
분산되어 저장되는 데이터의 무결성을 보장하기 위해 "_Transaction_"을
제공하고 "_Consistency_"를 보장한다.



## 대칭형 노드

전통적인 RDBMS Cluster를 포함하여, 데이터의 일관성을 제공해야 하는 저장소
서비스는 하나의 Master가 모든 쓰기 동작을 혼자서 수행하도록 설계하는 경우가
흔하다. 그러나 이 구조에서는 Master의 장애 시, 새로운 Master를 선출하고
Take-Over하는 과정에서 가용성을 보장하기가 어렵다. 또한, 모든 쓰기 요청이
하나의 기계에 몰리기 때문에 부하의 적절한 분산이 어려울 뿐만 아니라,
읽고 쓰는 경로가 다르다면 부하분산기(Load Balancer)를 적용하거나 또는
자체적인 방법으로 부하분산을 구현하는 것이 꽤나 복잡해질 수 있다.

CockroachDB는 이러한 **역할 기반 구조의 단점을 없애기 위해 대칭형 구조로
설계**되어 있다.  (내가 매우 좋아라 하는) 대칭형 구조란, Node 간 위상의
차이가 없으며 모든 Node가 동일한 기능을 제공하는 것을 말하는데,
이 구조에서는 Active 또는 Master라는 개념이 없으므로 자연스레 Take-Over라는
개념도 함께 사라지게 된다.
때문에, 단일 노드 장애 상황에서 Master 권한의 Take-Over에 의한 순간적인
(또는 수 분 이상이 걸릴 수도 있는) Downtime을 제거할 수 있다.
또, 클라이언트 입장에서는 어떤 Node에 접속하든 바로 서비스를 받을 수 있기
때문에, Application은 부하분산기가 점지해주는 임의의 Node와 바로 통신을
시작하면 되고, 부하분산기 입장에서는 모든 Node를 기능적으로 동등한 수평선
위에 놓고 다룰 수 있게 된다!

이러한 대칭구조 속에서, 클라이언트는 Cluster를 구성하는 임의의 Node에
접속을 하게 되는데, 이 접속이 이루어진 Node는 SQL 계층, Transaction 계층,
Distribution 계층이 담당하는 기능을 스스로 수행하게 되며, 실질적인
데이터 처리는 해당 데이터를 직접적으로 담당하는 Node에게 부탁하는 방식을
이용하여 요청에 대한 처리를 진행하게 된다.


## 데이터의 분산/복제

Distribution 계층과 그 아래에서는 실질적인 데이터의 저장과 복제, 그리고
사용자 요청에 대한 분산 처리 등을 담당하게 되는데, 이를 이해하기 위해서는
CockroachDB가 사용하는 저장 방식 및 개념에 대한 이해가 필요하다.

CockroachDB는 우리가 흔히 Table 형태로 이해하게 되는 RDBMS의 데이터를
내부적으로 Key-Value 형식으로 변환해 저장하게 된다. 이 때, **일련의
연관된 데이터를 모아둔 덩어리를 "_Range_"**라고 부르는데, 문서에서는
"정렬된 연속 자료의 모음"이라고 설명하고 있다. 현재까지의 이해만 놓고
보면 "정렬"의 기준이 조금 애매하긴 한데, 어쨌든 일종의 "자동화된
Sharding"으로 봐도 될 것 같다.

Store에 데이터를 저장하는 그릇의 기초 단위가 되는 **이 Range는, 동시에
Cockroach가 데이터 복제를 수행하는 기준**이 된다. 다시 말해서, Cockroach
클러스터에서 복제본 즉 "_Replica_"라고 하면 그것은 Range의 복제본을 말한다.

앞서, CockroachDB 클러스터의 모든 Node는 동일한 위상을 갖는다고 했다.
하지만 특정 순간을 놓고 보면 누군가는 데이터를 통제할 수 있어야 하고,
클라이언트의 요청에 의한 읽고 쓰는 작업을 처리해야 한다. CockroachDB는
이렇게 모든 Node가 동등한 위상과 기능을 갖는 대칭형으로 되어있는 대신,
이 복제된 Range 그룹 단위로 이러한 역할 또는 통제권 관리를 하게 되는데,
이 때 사용되는 개념이 "_Range Lease_"이다.

Range Lease는 일종의 토큰, 권한 증표 같은 역할을 하는데, 어떤 Range A가
세 개의 Replica A1, A2, A3으로 복제되어 있다고 할 때, 그 중 하나, 예를 들어
A2는 특정 시점에 그 Range에 대한 Lease를 같게 된다. 이렇게 Lease를 갖고
있는 Replica를 "_Leaseholder_"라고 부르는데, **Leaseholder는 해당 Range에
대한 모든 읽기 및 쓰기 요청을 처리**하게 된다.

{:.keypoint}
용어 정리: Range, Replica, Range Lease와 Leaseholder
: Range - CockroachDB가 내부적으로 KV 데이터를 저장하는 묶음 단위  
  Replica - 최소 3 Node에 걸처 복제되어 저장되는 Range의 복사본  
  Range Lease - 특정 Range에 대한 모든 읽고 쓰는 요청을 받기 위한 권한 토큰  
  Leaseholder - Range Lease를 갖고 있는 Replica  

Range Lease 관리를 위해 CockroachDB는 Raft Concensus Algorithm을
사용하는데, 이 부분은 가용성 시험에 대한 글에서 다시 다루려고 한다.

{:.info}
잠깐, 이 Raft. 어디서 봤는데?
: 그렇다. Docker에 관함 묶음글 중, "[Docker Swarm의 고가용성]"을 보면,
  Docker Swarm이 사용하는 유사한 구조의 대칭형 Cluster 방식에서 바로
  이 Raft Algorithm이 사용되고 있다.



### 복제 구조 자세히 보기

이해를 돕기 위해,
이 Range를 기본 단위로 하는 복제 구조를 그림으로 그려보면 다음과 같다.

![](/attachments/cockroachdb/arch/crdb-blocks.png)

위의 그림은 각각 두 개의 Store를 거느린 세 개의 Node로 구성된 Cluster를
표현한 것인데, 각 Node의 입장에서는 각각 다섯 개의 Range를 담고 있는
형태다.

{:.info}
참고
: 위의 예에서는 Cluster가 딱 세 개의 Node로 구성되었기 때문에, 3 개의
  복제본을 가질 경우, 모든 Node는 동일한 수의 Range를 갖게 된다.
  Node의 수가 네 개 이상이라면 각 Node가 갖는 Range의 수는 Node 별로
  달라질 수 있다.

이것을 Range의 입장에서 보면, 빨간색, 녹색, 파란색 등으로 표현된 총 다섯
개의 Range는 세 Node에 걸쳐 복제되어 동일한 데이터가 Cluster 안에 세 벌의
Replica 형태로 존재하게 되며, 그 중 하나는 각 Range에 대한 Lease를 획득한
상태가 된다. 이 Leaseholder를 특별히 조금 진한 색으로 표현했는데, 맨 왼쪽
Node는 빨간색 Range와 파란색 Range에 대한 Leaseholder를 담고 있으며,
맨 오른쪽 Node는 보라색 Range의 Leaseholder를 담고 있다.

위의 구성에서 만약 가운데 Node가 어떤 이유로든 Cluster에서 단절된다면,

![](/attachments/cockroachdb/arch/crdb-blocks-2.png)

위와 같이 원래 가운데 Node에 위치한 Replica가 보유하고 있던 Lease는
다른 Node의 동일 Range의 Replica가 가져가게 된다.  네 개 이상의 Node가
존재하는 상황에서 이렇게 하나의 Node가 사라지게 되면, 이로 인하여
Replica의 갯수가 줄어든 Range에 대한 복제가 일어나게 되는데, 위와 같이
살아남은 Node의 갯수가 두 개 뿐이라면 "복제가 필요한 상태"로 남게
된다.



# 시험으로 확실히 하기

문서만 읽어봐서는 잘 이해가 되지 않는다. 역시, 시험이 최고.


## 왜, 어떤 시험을 했나?

그래서, 간략하게 시험을 해봤다. 시험의 목적은 각 계층이 어떤 식으로
동작하는지 확인하는 것과, 실제로 내가 Table을 만들고 데이터를 넣었을
때 Range는 어떻게 만들어지고 어떻게 복제가 일어나는지 등에 대해서
확인하는 것이다. (아, 아니 아니, 물론 각 계층이 어떻게 동작하는지는
코드를 봐야 알겠지만, 여기서 알고 싶었던 것은 대칭형 분산구조 하에서
하나의 클라이언트 접속에 대해 각 노드가 어떻게 반응하는지 궁금했다는
말이다.)


### 시험 환경

시험에 사용한 환경은, "[CockroachDB 클러스터 구성하기]"에서 만들어둔
3-Node Cluster에 추가로 하나의 노드를 더한, 총 네 개의 Node로 이루어진
Cluster를 활용했고, 각각의 Node는 한 개의 Store를 갖도록 구성했다.
처음에 만들었던 세 개의 Node는 약 25GB의 Store를 가지고 있지만 새로
추가한 노드는 약 90GB의 디스크를 장착하고 있다. (이 시험에서 큰 의미는
없다.)

이 Cluster에 데이터를 밀어 넣을 클라이언트는 별도로 준비하지 않았고,
새로 추가한 Node에서 `cockroach` 프로그램이 제공하는 CLI를 사용했다.
참고로, `cockroach sql`과 같이, 부 명령으로 `sql`을 주면 동일한
바이너리가 서버가 아닌 클라이언트로 동작한다. (아... 설치가 간단해도
너무 간단해서... :-)


### 시험 내용

시험은 미리 시험에 사용할 Table을 만들어놓은 상태에서, 다음과 같은
절차로 진행했다.

1. CLI Client로 1번 Node에 접속
2. `INSERT INTO...` 문을 사용하여 데이터 8만 건 입력
3. 접속을 끊고 5분 간 대기
4. 2번, 3번, 여분 Node에 대하여 1~3 반복

간단히 말해서, Cluster를 구성하는 각 노드에 순서대로 접속해서 동일한
양의 데이터 입력을 해본 것이다.

이 전체 과정을 1번 수행하는데 약 40분이 소요되었는데 (시험한 테이블에
따라 조금 다르긴 했음) 과정 중 손을 쉬게 하기 위해서 다음과 같은
스크립트를 사용했다. (그리고 위의 단계에 대해 조금 더 명확하게 보여줄
수 있을 것 같아 여기에 적어둔다.)

```shell
start=0
for n in store-1 store-3 store-2 spare; do
	for i in `seq 1 80000`; do
		n=$(( $i + $start))
		echo "INSERT INTO resource VALUES ($n, 1,'test $i');"
	done | ./cockroach --certs-dir=certs --host=$n sql -d cloud
	sleep 300
	start=$(( $start + 80000 ))
done
```

"[CockroachDB 안녕?]"에서 보았던 것처럼, CockroachDB는 자체적으로 모니터링
콘솔을 제공하며 시스템 상황을 볼 수 있게 되어있으므로 클라이언트에서는
처리시간 측정 등의 확인작업을 따로 하지는 않았다.



## 결과 #1: Table과 Range 살펴보기

위의 작업을 수 차례 진행한 후... 어떻게 되었을까?

먼저, `compute_resource`라는 이름의 Table에는 32만 건, `resource`라는
이름의 Table에는 96만 건의 데이터가 입력되었다.

```console
root@spare:26257/cloud> select count(*) from compute_resource;
+--------+
| count  |
+--------+
| 325541 |
+--------+
(1 row)

Time: 900.52188ms

root@spare:26257/cloud> select count(*) from resource;
+--------+
| count  |
+--------+
| 960000 |
+--------+
(1 row)

Time: 1.058265112s

root@spare:26257/cloud> 
```

보는 바와 같이, `resource` Table이 약 세 배 많은 건 수를 가지고 있다.
이 상태에서, 각 테이블에 대한 Range 정보를 확인해보면 다음과 같다.

```console
root@spare:26257/cloud> show experimental_ranges from table resource;
+-----------+---------+----------+----------+--------------+
| Start Key | End Key | Range ID | Replicas | Lease Holder |
+-----------+---------+----------+----------+--------------+
| NULL      | NULL    |       55 | {1,2,4}  |            2 |
+-----------+---------+----------+----------+--------------+
(1 row)

Time: 76.885458ms

root@spare:26257/cloud> show experimental_ranges from table compute_resource;
+--------------+--------------+----------+----------+--------------+
|  Start Key   |   End Key    | Range ID | Replicas | Lease Holder |
+--------------+--------------+----------+----------+--------------+
| NULL         | /3865...2994 |       90 | {1,2,4}  |            2 |
| /3865...2994 | /3865...1697 |      121 | {1,2,4}  |            2 |
| /3865...1697 | /3865...0372 |      122 | {1,2,4}  |            2 |
| /3865...0372 | /3866...5043 |      123 | {1,2,4}  |            2 |
| /3866...5043 | NULL         |      124 | {1,2,4}  |            4 |
+--------------+--------------+----------+----------+--------------+
(5 rows)

Time: 37.295246ms

root@spare:26257/cloud> 
```

직관적으로 읽을 수 있을텐데, 먼저 `resource` Table은 55번 ID가 할당된
Range가 하나 만들어졌는데 1, 2, 4번 Node에 하나씩 Replica가 만들어져
있고 이 Range 그룹의 Leaseholder는 2번 Node에 있다. 두 번째 명령의
결과를 보면 `compute_resource`라는 이름의 Table에는 90, 121, 122, 123,
124번 ID를 갖는 총 다섯개의 Range가 만들어졌는데, 모두 동일하게 1, 2,
4번 Node에 Replica가 생성되었고 역시 Leaseholder는 거의 2번에 있고
마지막 Range의 Leaseholder만 4번 노드에 만들어져 있다.

어라? 일단 Table의 건 수는 Range를 쪼개는데 영향이 없는 것처럼 보인다.
사실은, 두 번째로 시험한 Table인 `resouce`는 건 수와 Range 나누기에
대한 연관관계를 확인하고 싶어서였다. 왜냐하면, 


```console
root@spare:26257/cloud> select count(*) from compute_resource where id < 3865...2994;
+-------+
| count |
+-------+
| 69556 |
+-------+
(1 row)

Time: 274.032411ms

root@spare:26257/cloud> select count(*) from compute_resource where id > 3865...2994 and id < 3865...1697;
+-------+
| count |
+-------+
| 63101 |
+-------+
(1 row)

Time: 187.666954ms

root@spare:26257/cloud> select count(*) from compute_resource where id > 3865...1697;
+-------+
| count |
+-------+
| 64882 |
+-------+
(1 row)

Time: 192.826821ms

root@spare:26257/cloud> 
```

첫 번째 시험을 한 후, 각 Range 별로 몇 건의 데이터가 들어가 있는지 확인했을
때, 위와 같이 약 6만4천 건... 뭔가 익숙한 숫자 아닌가? 아무튼, 이 정도의
수량이 들어있다는 것을 발견한 것이다. 뭐 그런데 맨 첫 번째 Range는 6만9천
건이 들어있기는 하다. 연관이 있는 거야 없는 거야... 그래서 두 번째 시험은
Field 수가 작은 Table을 만들어서 진행했던 것인데, 96만 건이 모두 한 Range에
들어가 버린... 그런 결과를 보게 됐다. 그럼 정말 문서에 나와있는 것처럼
Range는 64MiB 이하로 관리되며 그 크기 때문에 쪼갰나?

모니터링 콘솔에서 관련된 정보를 찾아보자!

![](/attachments/cockroachdb/arch/crdb-arch-10-databases.png){:.dropshadow.bordered}

어허... 이건 더 미궁일세... 첫 번째 시험에서 사용했던 14개의 INTEGER, STRING,
TEXT 등의 데이터 유형을 혼합한 Table은 다섯 개의 Range로 쪼개졌지만, 그래봐야
그 크기는 합쳐서 51.6 MiB에 지나지 않는다! 그런데 이건 또 뭔가? 96만 건이 한
통으로 묶인 `resource` Table은 그 크기가 64.8 MiB라고? 혹시나 하고 Node의
Store로 지정한 디렉터리에 들어가서 살펴봤지만 단서를 찾지는 못했다.

뭐, 단순하게 생각하면 보통, "크기제한과 인덱스제한 중 먼저 만난 것을 기준으로
쪼갠다" 뭐 이런 규칙이 있을 것 같은데... 일단 넘어가야겠다.


{:.keypoint}
정리 #1 - Range 나누기
: Table에 데이터가 충분히 쌓이면 Cockroach는 자동화된 방식으로 Range를
  나누어 관리한다. 언제 어떻게 쪼개는지는 아직 미궁!



## 결과 #2: 대칭구조 맞나?

Range에 대한 의문점은 나중에 기회가 되면 다시 보기로 하고, 이제 기능적인
부분에 대해 살펴보려고 한다.

앞서, CockroachDB는 대칭형 구조를 갖고 있기 때문에 Client 입장에서는 어느
노드에 붙든 원하는 Query를 마음껏 날리고 답을 받을 수 있다고 했다. 음,
이미 진행한 시험의 방식이 그러했고, 오류 없이 동작했으니 맞는 말인 것
같다. 하지만 데이터를 좀 봐야 하지 않을까?

### 최전선, SQL 계층

Client가 CockroachDB와 접하는 면은 SQL 계층이다. 모든 질의는 SQL 계층에서
KV Operation으로 변환된다는 이야기를 이미 했다. 어디, 보자.

![](/attachments/cockroachdb/arch/crdb-arch-21-sql-query.png){:.dropshadow.bordered}

오... 이 그림은, 모니터링 화면의 Overview에서 따온 것인데, Overview 화면은
이 두 그래프를 맨 위에 배치해두었다. 당연히 중요한 것이기 때문인데...

일단, 실행했던 스크립트를 떠올리며 그림을 잠깐 설명하면, 14:30부터 시작하는
네 개의 봉우리는 각각 1, 2, 3번 노드와 새로 추가한 4번 노드에 붙어서 작업한
상황을 나타내고 있다. 첫번째 그래프는 초당 처리된 SQL 질의의 수를 시계열로
늘어놓은 것인데, 1, 3, 4번의 경우 초당 약 180~190 건 정도, 그리고 2번의
경우는 예외적으로 초당 약 220건 정도를 처리한 것으로 나타난다.

두 번째 그래프는 99%의 질의를 대상으로 하는 Latency를 표시하고 있는데,
위의 그래프와는 달리 이 그래프는 Node별로 다른 색으로 표시되기 때문에
실제로 SQL을 처리한 Node가 어느 Node인지 식별이 가능하다.  오호라! 정말
순서대로, 각각 **Client가 직접 접속했던 1, 2, 3, 4번의 Node가 직접 SQL을
처리**하고 있음을 알 수 있다.

99%에 대한 Latency는 조금 튀는 부분이 그려지기 때문에 최선의 정보이기는
하나, 경향을 보기에 편하지는 않았다. 그래서, 90%의 질의에 대한 Latency를
표시한 그래프를 추가로 살펴봤다.

![](/attachments/cockroachdb/arch/crdb-arch-22-sql-latency.png){:.dropshadow.bordered}

음, 이 그래프가 Node 간 차이를 살펴보기에는 조금 더 적합한 것 같다.
눈에 띄는 부분이 두 가지 있는데, 먼저 2번 Node에 접속한 경우, 바꿔
말해서 2번 Node가 `INSERT`를 처리한 경우, Latency가 작게 나왔다.
아무래도, 2번 Node가 현재 상대하는 Leaseholder를 갖고 있으므로 Range
처리에 유리한 점이 있는 것 같다.  
다른 한 가지 특이한 점은, 4번 Node가 처리를 맡은 경우이다. 이 경우,
Latency가 꽤나 크게 나타나는데... 단일 코어인 이 Node의 사양이 듀얼
코어의 다른 Node에 비해 떨어지기 때문이 아닌가... 짐작해본다.

그런데 한 가지 의문점! 그럼 왜 해당 Range에 대한 Replica를 가지고 있지도
않은 3번 Node는 그나마 Replica가 있는 1번 Node와 동일한 속도를 보일까?
문서의 설명에 의하면, CockroachDB는 "**동기식 복제**" 방식을 사용하고
있어서, Commit이 인정되기 위해서는(ACK를 해주려면) 모든 복제본에 쓰기
작업이 완료되어야 한다고 하는데... ("쓸게"가 아니라 "썼어") 3번 Node는
상대적으로 모든 쓰기 작업이 끝났음을 확인하는데 불리한 것 아닌가?

이를 해석하기 위해, 이 `INSERT` 요청이 처리되는 과정을 상기해볼 필요가
있다. 아래 처리 과정은 최초의 요청을 1번 Node가 받았건 3번 Node나 2번
Node가 받았건 동일하게 진행될 것이다.

1. 요청을 받은 N번 Node는 Leaseholder인 2번 Node에게 Write 요청
2. Leaseholder인 2번 노드는 자신의 Store에게 쓰기를 지시하고,
3. 복제본을 소유한 1번과 4번에게 쓰기를 지시
4. Leaseholder는 자기 자신, 1번, 4번 Node로부터 쓰기에 대한 ACK를 받고,
5. 마지막으로 요청을 받았던 N번 Node에게 요청에 대한 ACK 전송.

분산 계층 구조 상, 어떤 Node가 시작점이 되든 위의 과정을 동일하게 거치게
되므로 N을 1로 바꾸나 3으로 바꾸나, 경로와 결과는 동일하다.

조금 더 얘기하자면, 중요한 부분은 1번 단계의 Leaseholder에 대한 부분인데,
SQL 요청을 받은 Node는 SQL 계층 및 Transaction 계층에서 요청을 처리함에
있어서, 자신이 그 요청에 대한 Replica를 가지고 있는지 아닌지에 대한 판단을
할 수 없으며 단지 해당 Range의 Leaseholder가 있는 Node에 분산처리 요청을
던질 뿐이다. 이는 각 계층이 Blackbox로 계층화되어 있고, 또한 모든 I/O를
Leaseholder를 통해 처리하는 설계이기 때문이며, 위의 결과는 그러한
동작방식을 잘 보여준다. (이 부분은
"[Distribution 계층과 Transaction 계층](#distribution-계층과-transaction-계층)"
에서 다시 확인)

{:.keypoint}
정리 #2 - 대칭형 노드
: 내 데이터가 어디에 있든, 내가 어느 Node에 접속하든, Cockroach는 나의
  요청을 받아주고 처리해준다.


### Leaseholder의 수고

어? 제목을 잘못 달았네? 이거 제대로 된 제목은 "해석할 수 없는 그래프"다.
아래 그래프는 질의를 받고 회답하기까지 걸린 지연시간을 나타내는 Execution
Latency인데... 원문 설명은 "The 90th percentile of latency between query
requests and responses over a 1 minute period. Values are displayed
individually for each node."라고 되어있다. 그런데 여기서 "query requests"는
뭐지? 그리고 밑줄을 그어둔 것 처럼, 요청이 처리되는 동안 2번 Node는 응답
속도가 빨라진다. 그리고 나머지는 산을 그리는데... 응답 지연이 0.3초나
있다고? 그리고 이들은 실제 작업에 따른 경향성이 없다! 이건 좀 알아볼 문제.

![](/attachments/cockroachdb/arch/crdb-arch-23-sql-execution-latency.png){:.dropshadow.bordered}

## 결과 #3: 다섯 계층의 상호작용

앞선 결과에서 확인한 바와 같이, 큰 틀에서 CockroachDB는 내가 어느 Node에
접속하든 내 요청을 받아주고, 데이터가 늘어나면 내부적으로 데이터를 적절히
나누어 저장해주는 것을 확인할 수 있었다. 조금 더 들어가서, 이번에는 다섯
계층 구조가 이 과정에서 어떻게 상호작용을 일으키는지 간접적으로 살펴보려
한다.

이미 SQL 계층의 대칭형 동작은 살펴봤고, 나머지 네 계층의 동작에 대한
이해를 도울 힌트가 있을지... 모니터링 화면을 살펴봤다. 다행히, Cockroach의
모니터링은 각 계층의 상황에 대한 일부 지표를 제공한다.


### Storage 계층, Range와 Replica

아래 그래프는 물리적 저장과 연관되어 Storage 계층에서 발생하는 Log 및
Command에 대한 Commit 지연을 표시하는 그래프다. 이를 통해, 네 번의 `INSERT`
작업에 대하여 각 Node의 Storage 계층이 어떻게 반응하는지 확인할 수 있었다.

![](/attachments/cockroachdb/arch/crdb-arch-31-storage-commit-latency.png){:.dropshadow.bordered}

결과에서 볼 수 있듯, 네 번의 요청이 발생할 때마다, 각각 진한 파랑, 노랑,
연한 파랑으로 표시된 1번, 2번 그리고 3번 Node의 Storage 계층은 눌린 선을
보여주고 있다. (왜 작업이 있을 때 Latency가 줄어들고 그 외의 구간에서는
긴 Latency를 보여주는지 해석이 되지 않지만 어쨌든) 이 그래프를 통해,
Replica를 가진 Node들은 최초의 요청이 어느 Node에게 내려졌든 동일하게
반응하고 있음을 볼 수 있다.

{:.keypoint}
정리 #3 - 데이터의 분산 저장
: Storage 계층은 `INSERT` 작업과 동시에 세 개의 Node에서 반응하고 있고,
  이는 Range 저장과 Replication이 동시에 일어나고 있음을 반영하여
  보여주고 있는 것이다.


### Replication 계층

앞서, Replica의 물리적인 I/O를 처리하는 Storage 계층의 동작 상황 확인을
통하여 이미 간접적으로 실시간 복제가 동작하는 모습을 확인할 수 있었다.
추가로, 이번엔 Replication 계층에 대한 지표를 조금 더 보려고 하는데,
지표와 그래프를 보니 이건 나중에 다시 볼 필요가 있어 보인다.

Replication 계층에서는 아래와 같이, 전체 Range 및 Lease의 수량에 대한
지표와 Store 당 Replica의 분포 상황, Leaseholder의 분포 등에 대한 지표
등을 제공하는데,

![](/attachments/cockroachdb/arch/crdb-arch-41-replication-ranges.png){:.dropshadow.bordered}

시험 과정 동안 Range의 수는 일정하게 유지되는 반면, Leaseholder의 수가
작은 값이나마 요동치는 것을 볼 수 있었다. 그 외에도, Leaders, Leaders
without Lease 등의 지표가 보이는데, 이건 Raft에 의해 Lease가 이동하는
모습에 대해 조금 더 살펴봐야 완전한 이해가 가능할 것으로 생각한다.

더 많은 지표가 있지만 생략하고, Replication 계층에서는 다음의 지표가
시험의 패턴과 맞물려 움직이는 것을 발견할 수 있었다.

![](/attachments/cockroachdb/arch/crdb-arch-44-replication-quiescence.png){:.dropshadow.bordered}

"Replica Quiescense"라는 이름의 지표인데,... 아... 이게 무슨 뜻인지...
문자 그대로 해석하면 "복제본 중지"라고 할 수 있을 것 같은데, `INSERT`가
진행되는 동안 그 값이 살짝 줄어든다. 값을 잠깐 보면,

* 앞선 그래프에서 총 Range가 88개, Leaseholder가 83개
* 비슷한 시점에, 전체 Replica가 258개 (엉? 264도 아니고 249도 아니고??)
* 아무튼, `INSERT` 진행 중, Quisecent는 Replicas - 3 정도

아... 해석이 잘 안 된다. 그냥... 뭔가 Replica에 대한 Lock이 걸리는 것이
아닐까(변경 중이니 읽어가지 말라는?) 생각해 보는데, 이건 조금 깊이 살펴야
알 수 있을 것 같다. (모르는 거 붙들고 있지 말고 넘어가자)


### Distribution 계층과 Transaction 계층

Store 계층은 Replication 계층 아래에서 물리적인 저장을 책임지고 있고,
Replication 계층 위에는 Distribution 계층이 위치하여 분산되어 있는
Range를 찾아가며 필요한 Leaseholder에게 I/O 요청을 뿌려주게 된다. 이 때,
Distribution 계층은 gRPC를 사용하게 되는데, 이번 시험 중에는 어떤 일이
일어났을까?

![](/attachments/cockroachdb/arch/crdb-arch-51-distribution-rpcs.png){:.dropshadow.bordered}

오! 이거 뭔가 있어보이는 그래프를 발견했다.

일단 파란색으로 표현된 그래프는 RPC를 던진 수량을 나타내는데, 평상시에 약
40 정도의 값이 깔려있다. 그리고 1번 Node에 `INSERT`를 날렸던 시점인 첫번째
봉우리는 약 250 정도로, 베이스 값인 40을 빼면 210 정도의 RPC를 날린 것 같다.
이 때 SQL 처리량이 초당 약 190 정도였으니 명확하진 않으나 비슷한 값을 보이고
있고, 최소한 유사한 양상을 보이는 것을 알 수 있다.

특이한 부분은 노란색으로 표현된 "Local Fast-path"인데, 두 번째 봉우리, 즉
2번 Node에 `INSERT`를 날렸던 시점에는 전체 RPC 중 증가분에 해당하는 높이가
모드 Local Fast-path임을 알 수 있다. 결국, Distribution 계층이 Range의
Leaseholder에게 요청을 날릴 때, 그것이 같은 기계에 있으니 이것을 "Local"로
칭한 것으로 보이고, 이 때 처리 속도가 눈에 띄게 증가하는 것을 볼 수 있다.
"[최전선, SQL 계층](#최전선-sql-계층)"에서 확인했던 Leaseholder가 있는
Node에 접속했을 때 처리속도가 빨라지는 결과가 왜 발생하는지 좀 더 선명하게
보여주고 있는 것이다.

또, Transaction 계층에서는,

![](/attachments/cockroachdb/arch/crdb-arch-52-distribution-kv-transactions.png){:.dropshadow.bordered}

이렇게 SQL 계층과 같은 모양의 값을 보여주는 "Fast-path Committed" 그래프를
볼 수 있었다. (그런데 여기에도 "Fast-path"가 없는 지표가 따로 있으니...
그럼 Local이 아닌 분산 Transaction도 있다는 얘기. 일단은 패스)

이 때, Transaction의 수행시간을 표현하는 그래프를 보면,

![](/attachments/cockroachdb/arch/crdb-arch-53-distribution-kv-tx-duration.png){:.dropshadow.bordered}

다른 Latency 그래프와 유사하게 "바쁠 때 눌린" 모양의 그래프를 확인할 수
있었다. Transaction 처리를 요청받은 Node가 직접 수행한다는 것을 나타내듯,
각 요청 시점 별로 해당 요청을 받은 Node의 그래프가 눌려 있는 것을 볼 수
있었다.

{:.keypoint}
정리 #4 - 직접 처리와 원격 요청
: SQL 계층부터 Transaction 계층까지는 요청을 받은 Node가 직접 기능을
  수행하지만, 분산된 Range를 이해하고 있는 Distribution 계층에 이르면
  각 Range를 담당할 Leaseholder에게 KV 요청이 분산되어 처리된다.


## 정리

CockroachDB Architecture를 간단히 훑어보았고, 이해를 높이기 위해 간단한
시험을 통해 SQL 질의에 Cockroach가 반응하는 모습을 확인해봤다. 정리하면,
기능적으로 다음과 같은 흐름이 일어나는 것을 확인할 수 있었다.

![](/attachments/cockroachdb/arch/crdb-execution-flow.png)

앞서 설명한 부분이지만, 다시 요약하면,

1. 접속이 일어난 Node는 해당 Node 내에서 SQL, Transaction, Distribution
   계층에서 수행하는 기능을 모두 수행하게 된다.
2. 분산 처리의 시점이 되는 Distribution 계층은 해당 Range Leaseholder가
   위치한 Node의 Replication 계층에게 KV 동작 수행을 요청하고,
3. 다시 요청을 받은 Replication 계층은 해당 Range의 Replica를 보유한
   Node 들에게 I/O 처리를 부탁하게 된다.
   
단일 요청 또는 단일 접속 기준으로 위와 같은 흐름을 보이게 되며, Client
수가 많아진다면 Cluster 앞단에 구성된 부하분산 방식에 따라 위의 그림이
서로 다른 기점으로 다시 그려져 여러 장 겹쳐진 것을 상상해보면 그것이
바로 다중 사용자 환경에서 Cockroach가 동작하는 모습이 되겠다.

---

오호라... 뭔가 어렵다. 그런데 시험을 통해 확인한 전체적인 흐름을 한 장에
그려놓고 보니 뭔가 깔끔하다는 느낌을 받게 된다. ... Cockroach에 대한
기대가 조금 더 커지지 않나? 그리고 이 모습... 뭔가 "타의 귀감"이 되는
모습이 아닌가?!



[공식 문서]:https://www.cockroachlabs.com/docs/stable/architecture/overview.html
[Docker Swarm의 고가용성]:{{< relref "/blog/cloudcomputing/2018-03-15-high-availability-of-docker-swarm.md" >}}


### 함께 읽기

CockroachDB 맛보기 묶음글은 다음과 같습니다.

* [CockroachDB 안녕?]
* [CockroachDB 클러스터 구성하기]
* _CockroachDB Architecture_
* [CockroachDB 클러스터 설치 스크립트]
* [CockroachDB 클러스터 가용성 시험]

[CockroachDB 안녕?]:{{< relref "/blog/cloudcomputing/2018-09-20-say-hello-to-cockroachdb.md" >}}
[CockroachDB 클러스터 구성하기]:{{< relref "/blog/cloudcomputing/2018-09-21-setup-cockroach-cluster.md" >}}
[CockroachDB Architecture]:{{< relref "/blog/cloudcomputing/2018-10-01-architecture-of-cockroachdb.md" >}}
[CockroachDB 클러스터 설치 스크립트]:{{< relref "/blog/cloudcomputing/2018-10-02-cockroach-cluster-setup-script.md" >}}
[CockroachDB 클러스터 가용성 시험]:{{< relref "/blog/cloudcomputing/2018-10-08-availablility-of-cockroach.md" >}}
