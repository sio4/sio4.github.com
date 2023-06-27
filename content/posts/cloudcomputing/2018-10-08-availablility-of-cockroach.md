---
title: CockroachDB 클러스터 가용성 시험
subtitle: CockroachDB는 가용성 확보를 위해 어떻게 동작하는지?
tags: DBMS high-availability cloud-computing
categories: ["cloudcomputing"]
image: /assets/images/common/red-five-standing-by.jpg
banner: /assets/images/common/red-five-standing-by.jpg
date: 2018-10-08T13:00:00+0900
---
CockroachDB는 Range라는 일종의 Sharding 기법을 도입하여 사용자의 데이터를
복제하고 그 가용성을 관리함으로써 전지구적 분산 복제 DBMS의 가용성을
보장하고 있다. 이 글에서는 네 개의 Node로 구성된 클러스트를 예로 하여
Node 장애 상황에서 Cockroach가 어떻게 반응하고, 또한 어디까지 가용성을
보장해주는지 시험한 결과를 정리한다.


{:.comment}
> 묶음글을 쓸 때, 보통은 각각의 글을 어떤 주제로 할지, 그리고 전체 묶음글을
> 몇 편으로 엮을지 미리 생각하곤 했지만 지난 번 Docker에 대한 글은 그 끝을
> 예측하기 어려워 열린 상태로 목록을 채워나갔다. 그 관성으로, 이번 묶음글도
> 시작은 열린 목록으로 시작했는데 네 번째 글을 쓰는 시점에 이번 글을 포함한
> 목록을 "미리" 확정했었다. 그런데...  
> 어제 거의 하루 종일 가용성 시험을 하면서, "내가 왜 이걸 목록에 넣었을까..."
> ㅠ.ㅠ 아무튼, 부족하나마 시험을 끝냈고 그 과정을 정리한다.


{:.boxed}
> CockroachDB 맛보기 묶음글은 다음과 같습니다.
>
> * [CockroachDB 안녕?]
> * [CockroachDB 클러스터 구성하기]
> * [CockroachDB Architecture]
> * [CockroachDB 클러스터 설치 스크립트]
> * _CockroachDB 클러스터 가용성 시험_



# DBMS의 가용성

{:toc .half.pull-right}
* TOC

컴퓨터가 무엇인지 설명할 때, 나는 주로 "A-D 프랙탈"이라는 표현을 쓴다.
A는 Algorithm에서 따왔고, D는 Data Structure, 자료구조에서 따왔다. 이게
다시 확장되면 프로그램 로직과 변수가 되고, 다시 CPU와 메모리, 서버와
스토리지, 그리고 Application과 DBMS가 된다. 컴퓨터 시스템에서 이 둘의
경중을 따지는 것은 불가능하겠지만, 조금 유연하게 본다면 좀 느린 로직이라도
계산이 가능하다면 치명적인 문제가 되지는 않으나, 자료 자체가 잘못된 값을
가지고 있다면 매우 치명적인 결과가 된다. 또, 계산을 잘못했다면 다시
로직을 짜서 다시 계산할 수 있지만, 자료가 잘못됐다면 그것을 정정하는 것은
불가능할 수도 있다.

장애가 발생했을 때, 계산을 담당하는 부분은 얼마나 빨리 다시 계산이 가능한,
서비스 가능한 상태로 돌아오는지가 제일 중요한 부분이지만 **데이터베이스는
서비스 복구 속도와 함께 장애로 인한 데이터 유실이 없어야 한다**는 조건이
붙기 때문에 클러스터를 만들거나 가용성을 보장하는 것이 간단한 문제가 아니다.

이번 실험에서는, 일일이 데이터 무결성을 검사하지는 않았지만, 장애 상황을
만났을 때 CockroachDB가 데이터 보호를 위한 어떤 동작을 취하는지, 주로
Cockroach Architecture 탐구의 연장선 위헤서 관찰해봤다.


# Test #1 - Blacknode Down!

이미, 앞선 글 "[CockroachDB Architecture]"에서 CockroachDB는 Range라 부르는
데이터 저장 단위를 기본단위로 하여 데이터 복제 및 가용성 관리가 이루어진다는
것을 알아봤다. 그래서 첫 번째 시험에서는 **장애가 발생했을 때, 어떤 방식으로
Replica, 즉 Range의 복사본이 재배치되는지**를 확인하는 것에 중점을 뒀다.

조금 더 부연하자면, 로직을 담당하는 부분의 클러스터 구성은 "부하의 분배"에
중점을 두게 되며, 부하에 대한 1/N 개념으로 Node의 수를 계산하게 된다. 즉,
사용자가 세 배가 되면 Node를 세 배 늘리는 것으로 방어가 가능하고, 세 대의
Node 중 두 대가 사용할 수 없는 상태가 된다면 남은 한 대가 (조금 느리더라도)
세 배로 많은 일을 해주면 된다. 그런데 CockroachDB 처럼 분산/복제 개념을
갖는 DBMS 등은 데이터의 무결성 보장을 위해 보통 세 벌로 복제해둔 데이터
중 하나가 날아가면 재빨리 또다른 복제본을 만들어 다시 세 벌의 상태로
만들어두는 것이 중요한 포인트가 된다. 반대로, 두 벌이 사라진 상태라면
홀로 남은 복제본은 "혹시 나만 살아 남은 것이 아니라 내가 고립된 건가?"의
상황과 "나마저 죽으면..." 이라는 문제를 만나게 된다. (기계라서...)


## 환경과 시험의 진행

아무튼, 시험은 다음과 같은 단순한 방법으로 진행했다.

"[CockroachDB 클러스터 구성하기]"에서 만들어둔 세 대의 클러스터에 한 대를
더 더한 네 개의 Node로 구성된 클러스터에 데이터를 조금 부어 넣었고,
(이 과정은 "[CockroachDB Architecture]"에서 다뤘다.) 이 상태에서 Node
하나를 강제로 죽여봤다. 그리고 CockroachDB가 기본적으로 제공하는 모니터링
화면을 통해 동작 상태를 확인하고, 동시에 CLI Client로 접속해서 정상적으로
사용할 수 있는지 확인했다. (CLI 시험은 꼭 필요한 경우가 아니면 설명을
생략했으며, 생략된 부분은 잘 된다고 보면 된다.)


{:.wrap}
```console
^CNote: a second interrupt will skip graceful shutdown and terminate forcefully initiating graceful shutdown of server
^C*
* ERROR: received signal 'interrupt' during shutdown, initiating hard shutdown - node may take longer to restart & clients may need to wait for leases to expire
*
Failed running "start"
$ 
```

위와 같이, `systemd`를 사용하지 않고 임시로 명령행에서 실행해둔 4번 Node를
두 번 연속으로 `^C`늘 날려서 강제 종료 시켰다.


## 한 개의 Node가 죽었을 때의 반응

예상되는 반응은, 서비스 가용성을 보장하기 위해 즉각적으로 데이터에 대한
복제를 시작하는 것이다.

![](/attachments/cockroachdb/ha/crdb-one-node-down-01-node-suspected.png){:.dropshadow.boxed}

일단, 노란 불이 켜졌다. 한 대의 Node가 수상하다고 한다. 그리고 90 전체
117개의 Range 중, 90개의 Range가 복제 대상으로 지정됐다. 그런데... 나중에
다시 보겠지만, 이 시점에 복제는 일어나지 않았다. 조급하게 화면을 주시하던
중, 한 5 분이 지나니,

![](/attachments/cockroachdb/ha/crdb-one-node-down-02-node-dead.png){:.dropshadow.boxed}

이렇게, 수상한 Node를 죽은 것으로 간주했고, 복제 대상의 수가 13개 줄었다.
으잉?

![](/attachments/cockroachdb/ha/crdb-one-node-down-03-balanced.png){:.dropshadow.boxed}

그리고 결국엔 한 대가 죽고 세 대가 남은 상황에서 복제 대상 Range의 수가
0이 되었다. 복제가 다 끝나고, 안전한 상태가 되었다는 의미이다.

이 Overview의 뒤에서는 무슨 일이 있었을까? Cockroach는 위와 같은 Node
장애 상황에서 무슨 행동을 했을까?

{:.comment}
> 아... 문서를 먼저 뒤져보고 뭘 알고 시험을 해야 하는데, 귀찮아서...
> 건방지게 "가설과 검증" 방식으로 일종의 Blackbox 시험을 했다. ㅠ.ㅠ


### 느린 사망 선고

이 시험을 통해 발견한 CockroachDB의 행동양식 첫 번째는 "**느린 사망 선고**"
였다.  아래 그래프에서 특이점이 등장한 시점은 약 05:58:10 정도. 아마 이 때,
Node를 죽인 모양이다. (시간을 재면서 할 걸...)

![](/attachments/cockroachdb/ha/crdb-one-node-down-11-ranges.png){:.dropshadow.boxed}

뒤에 깔려있는 진한 파란색 선은 전체 Range의 수량이고, 잠깐 내려왔다가 다시
올라가는 빨간 선은 Leaseholder의 수량이다. 이 때, Node가 죽으면서 그 Node가
갖고 있던 Leaseholder 갯수가 순간(?)적으로 합계에서 제외되었을 것이다.

아무튼, 중요한 선은 분홍색 선인 "Under-replicated", 복제 대상의 수량인데,
사건 직후 90, 아까 봤던 그 숫자로 올라가더니 줄지 않은 채 한 5분을 버티고
있다! 헉! 5초도 아니고 5분!

왜일까? 예상되는 이유는 다음과 같다.

Cockroach는 이전 글에서도 여러 차례 얘기한 것처럼 전지구적 규모의 분산을
지원하고자 하는 DBMS이다. 그런데, 한국에 있는 Node와 바르셀로나!에 있는
Node 사이의 Heartbeat에 대한 누락 허용치가 같은 망에 구성된 Node 간의
허용치와 같을 수는 없는 노릇이다. 어차피, 두 대는 살아있는 상태고 서비스가
가능하다면, 하나가 잠깐 연락두절된 것에 대해 민감하게 반응할 필요가 없다.
왜냐하면, 그 반응은 데이터 복제 등의 무거운 작업이 될테니 반응했을 때
비용이 꽤 클 수 있다. 돈 얘기 하는 건 아니고 감당해야 할 전반적인 것 말이다.

"그렇다고 5분이나?"라는 의문이 들지만 그것도 이해 가능한 수준이라는 생각이
든다. 5분이면 뭐랄까, 가상머신이 재부팅을 하고 서비스를 올리기에 충분한
시간이다.  만약, 이 환경이 실제 운영환경이고, 글로벌하게 서비스를 하는
중이어서 딱히 심야 시간 등, 사용자가 없는 시간으로 Downtime을 잡아 DBMS
버전업이나 시스템 점검을 계획할 수 없는 상황이라고 가정해보자. 이런
조건에서 서비스를 지속하면서 점검을 진행하기 위해, 각 Node 들을 롤링
재부팅하는 상황이라면, 그래서 한 대를 재부팅 했는데 그 사이에 가용성을
확보하겠다고 데이터 복제가 일어나버린다면? 글쎄...
5분이라는 긴 대기 시간은, **중단을 허용하지 않는 서비스를 운영하고 있다는
가정 하에 내 시각에는 매우 적절한 설계**라고 생각한다.

{:.keypoint}
Cockroach 가용성의 특징 #1 - 느린 사망 선고
: CockroachDB는 느린 사망 선고 방식을 채택함으로써 전지구적 클러스터의
  각 Node를 잇는 네트워크의 품질 저하, 또는 Rolling Upgrade 같은 상황에서
  불필요한 데이터 복제가 일어나는 것을 막는다.

오... 전혀 예상하지 못했던 멋진 모습이다!

{:.comment}
> 응, 이거 소설이다.  시험 결과는 사실에 근거하고 있으나, 그런 결과가
> 나오는 이유에 대한 부분은 전적으로 나의 희망사항을 바탕으로 한
> 가정이다.

어쨌든 5분이 지나면서 복제 대상이 줄고 있다는 것은 복제가 일어났음을
뜻한다. 아래 그래프는 각 Store 별 Replica의 수를 나타내는데, 현재의
구성은 Node 당 한 개의 Store를 갖도록 구성했으므로 이 수가 바로 Node
별 Replica의 수와 동일하다.

![](/attachments/cockroachdb/ha/crdb-one-node-down-12-replicas.png){:.dropshadow.boxed}

이렇게, 옅은 파란색 선이 끊긴 상태에서, 그 높이와 같은 양의 Replica가
나머지 세 Node에 분산되어 늘어나고 있고, 약 3분이 지난 시점에는 모든
복제가 끝나게 된다.

이 때, 자세히 보면 알겠지만, 사건 전에는 각 선의 높이가 서로 달랐다.
아래 그림처럼,

![](/attachments/cockroachdb/ha/crdb-one-node-down-95-replica-bef.png){:.dropshadow.boxed}

사건 발생 직전에는 각각 84, 90, 87, 90 등 서로 다른 수의 Replica를
보유하고 있었는데, 사망 선고 이후 재분배가 끝난 시점에는 아래와 같이,

![](/attachments/cockroachdb/ha/crdb-one-node-down-96-replica-aft.png){:.dropshadow.boxed}

모든 Node가 동일하게 117이라는 숫자를 보이고 있다. 117이 뭐더라? 아!
아까 전체 Range의 수가 117이었지. 결국, 모든 Node가 모든 Range를 다
가지고 있다는 뜻이다. 말인 즉, 세 벌의 복사본을 갖는 기본설정인 상태의
클러스터에 세 개의 Node가 있기 때문에 하나의 Range에 대한 복사본이 서로
다른 Node에 세 벌 저장되기 위해서는 모든 Node가 동원되어야 하는 것이다.
(연한 파랑 선의 90이라는 숫자는 무시. 이건 해당 Node가 마지막으로 남긴
값이 표시되고 있을 뿐이다.)

{:.keypoint}
Cockroach 가용성의 특징 #2 - 세 개의 Replica
: 각 Range를 세 개의 서로 다른 Node에 복제하여 저장함으로써, 그 중
  하나의 Node에 장애가 발생하더라도 살아남은 두 대(Major)가 합심하여
  데이터에 이상이 없음을 보증한다.

그럼 이렇게, 5분을 기다리는 동안 정말 아무 일도 일어나지 않은 것일까?
그건 아니다. 왜냐하면 일은 해야 하니까.


### 빠른 Lease 재배치

비교하게 좋게, 앞서 봤던 "복제해야 할 Range의 수"가 표시된 그래프를
다시 가져왔다.

![](/attachments/cockroachdb/ha/crdb-one-node-down-11-ranges.png){:.dropshadow.boxed}

그리고 다음은 각 Store(Node) 별 Leaseholders의 수를 나타내는 그래프다.

![](/attachments/cockroachdb/ha/crdb-one-node-down-13-leaseholders.png){:.dropshadow.boxed}

딱 보이듯이, 05:58:10이 막 지난 시점에, 이미 Leaseholder는 살아남은 세
Node에 분배가 끝났음을 알 수 있다. "[CockroachDB Architecture]"에서
설명했듯이, 모든 Range I/O는 Leaseholder를 통해서 이루어진다. 즉,
Leaseholder가 없으면 그 Range는 읽고 쓸 수 없다는 뜻이다. 이렇게 어떤
Node가 Suspected 상태가 되었을 때, **곧바로 다른 Node에 있는 Replica가
해당 Range의 Leaseholder 자리를 채가기 때문에 이 5분의 기다려주는
시간에도 서비스는 정상적으로 처리**될 수 있다.

{:.keypoint}
Cockroach 가용성의 특징 #3 - 빠른 Lease 재배치
: 통신이 두절된 Node가 발견되면, 재빨리 Leaseholder를 재배치하여
  데이터 복제의 유보와는 별개로 서비스가 가능한 상태로 만든다.

{:.comment}
> 아... 시간이 05:58로 표기되니 내가 밤을 샜거나 새벽형 인간이 것 같지만
> 전혀 아니다. 난 아침잠형 인간. 출근만 아니라면 최대한 늦게 일어난다.
> 저 시간은 실제로 14:58 쯤 되는데, 이 Cockroach의 모니터링 UI는 시간을
> UTC로 표기하네... 설정이 있는지 나중에 봐야겠다.



## 집 나간 Node가 돌아올 때: 포스의 균형

별다른 이상한 점 없이, Node 유실에 따른 Cluster의 동작에 대해 확인했다.
이제, 다시 Node가 돌아올 때에 Cockroach가 반응하는 모습을 보자.

{:.comment}
> 아... 구태여 "포스의 균형" 운운할 얘기는 아닌데... 아무튼,

Node가 돌아온 것은 이미 정상적인 서비스를 하던 Cluster에게 "사건"은 아니다.
그래서 아래 그래프처럼, 전체 클러스터의 Range, Leaseholder 등은 요동치지
않고 평화를 유지한다.

![](/attachments/cockroachdb/ha/crdb-one-node-rejoin-11-range.png){:.dropshadow.boxed}

그러나 내부적으로는, 일꾼이 하나 더 생긴 것(또는 돌아온 것)을 반가워하며
"잘 놀고 왔어? 여기 일" 하면서 일을 넘긴다. 위에서 데이터 자체의 복제와
Leaseholder라는 임무를 봤듯이, 두 가지 "일"이 넘어가게 되는데,
먼저 데이터 복제를 보면,

### 데이터 재배치

![](/attachments/cockroachdb/ha/crdb-one-node-rejoin-12-replicas.png){:.dropshadow.boxed}

위 그래프의 연한 파란색 선을 보면 시작 부분부터 90의 높이를 가지고 있는
것을 볼 수 있다. 이는, 앞서 봤듯이 이 Node가 죽을 때 90 개의 Replica를
가지고 있는 상태였기 때문인데, 그 시점부터 약 6~7분 간 서서히 증가해서
살아남았던 세 개의 Node와 균형을 맞춰간다.

장애 직후, Replica의 수를 맞추기 위한 복제가 이루어질 때에는 세 대의
Node가 2~3분 만에 복제를 끝냈다.  그런데 이번에는 두 배가 넘는 시간이
걸린다.  또, 시작 부분을 자세히 보면 일시적으로 값이 떨어지기도 하는데,
예상하기로, 처음 문제가 생겼을 때에는 남은 Node가 정상적인 데이터를
보유하고 있고 그것을 단순히 흩뿌리면 그만인 상태였다.  하지만 지금은
다시 돌아온 Node의 데이터 중에는 새로 복제할 필요 없이 재사용이 가능한
Replica도 있을 것이고, 또는 그 사이에 갱신이 되어 이제는 무효한 데이터도
섞여 있을 것이다.  그러니, 지금은 단순 복제가 아닌 데이터 정합성 검사를
동반한 판단이 들어가야 한다.  또한, 어떤 Range를 돌아온 Node와 나눌지,
어떤 Range를 이미 맞춰놓은 세트로 유지할지도 결정해야 한다.  이렇게
문제의 Node가 돌아오는 순간, 어떤 Range는 유효한 Replica를 모두 네 개
보유한 상태가 되므로 그 중 하나는 지워야 할 것이고, 그 지우기로 정한
Replica가 돌아온 Node에 있는 경우, 저렇게 값이 떨어지는 현상이 발생할
것이다.

{:.keypoint}
Cockroach 가용성의 특징 #4 - 적절히 속아내기
: 장애 복구 시, 돌아온 Node가 보유한 Replica도 활용하여 최소한의
  비용으로 데이터 재배치를 진행한다.

### 부하 재배치

이제 관점을 Leaseholder라는 기능으로 돌려보자. 데이터와는 달리, 이건
무형의 역할이며, 클러스터에서 분리되면 유지될 수 없는 "직책"이다. 각
Node는 자신이 보유한 Range에 대해서는 언제는 Leaseholder가 될 수 있는
조건을 갖추는데, 앞선 Replica 재배치가 끝난 Range는 그 상태에 따라
Leaseholder 선출을 거듭할 것이다. 결과적으로,

![](/attachments/cockroachdb/ha/crdb-one-node-rejoin-13-leaseholders.png){:.dropshadow.boxed}

위의 그래프와 같이, 0에서 시작하여 Replica 재배치와 보조를 맞추면서
돌아온 Node에게도 임무를 늘려 주고 있는 것을 확인할 수 있다.

{:.keypoint}
Cockroach 가용성의 특징 #5 - Leaseholder 재배치
: 안정적인 재배치가 완료된 Range에 대해, Leaseholder 또한 다시 배치되어
  Range I/O에 대한 부하도 자동으로 균형을 잡아준다.

첫번째 시험은 재미있게 잘 끝났다. 다음은 네 개 중 두 개의 Node가 죽은
상황을 만들어보자!



# Test #2 - Two Nodes Down!

> Red five standing by!

![](/assets/images/common/red-five-standing-by.jpg){:.dropshadow}

데쓰스타를 공격하기 위해 Red Team을 비롯해서 수 많은 전투기와 폭격기가
출격했지만, 작전을 성공으로 이끈 건 루크 스카이워커의 포스를 이용한
한 방이었다. 폭격기들이 나가 떨어지고 다른 전투기가 다 쓰러지더라도,
어쨌든 성공이다. 첫번째 시험을 시작하면서 얘기했듯이, 기능 역할은
최후의 하나가 남아도 의미가 있다.

그런데 데이터를 맡은 경우는 조금 다르다. 이번 시험은, 흔하게 발생하는
상황은 아니지만, 클러스터를 이루는 총 네 대의 Node 중 두 개의 Node가
추락한 상태를 가정해 봤다.


## 환경과 시험의 진행

앞서, 네 Node 중 하나가 죽은 상황을 이미 시뮬레이션 한 상태이다. 이
상태에서, 남은 Node 중 하나를 더 죽이고, 살아남은 환경은 어떻게
반응하는지 살펴봤다.

```console
$ sudo systemctl stop cockroach.service
$ 
```

## 두 번째 Node가 죽었을 때의 반응

이제 두 Node만 살아있는 상태에서 클러스터의 상태를 봤다.

![](/attachments/cockroachdb/ha/crdb-two-node-down-01-node-suspected.png){:.dropshadow.boxed}

음, 첫 번째 Node가 죽었을 때와 마찬가지로 이번에 죽은 Node도 Suspected
상태가 되었다. (그런데 왜 전체 Range 수가 올라가지?)

![](/attachments/cockroachdb/ha/crdb-two-node-down-02-node-dead.png){:.dropshadow.boxed}

그리고 역시 5분을 넘기게 되면, 위와 같이 사망 선고가 내려진다. (이제
다시 전체 Range 수가 정상으로 돌아왔다.)

그리고 한참을, 약 30분 정도 Range에 대한 복제가 일어나는지 살펴봤다.
(사실, 이건 CockroachDB 설치 초기에 이미 30분이 아니라 30 시간 넘게
기다려본 경험이 있다. :-) 그런데...

### 복제 불가

![](/attachments/cockroachdb/ha/crdb-two-node-down-11-range.png){:.dropshadow.boxed}

끝끝내 복제는 일어나지 않았다.  위의 그래프를 보면, 08:05 정도에 복제
대상이 40 정도 발생한 것을 보면 이 때 첫 번째 Node가 죽었다는 것과,
08:10이 조금 지나서 Replica의 재배치가 끝났다는 것을 알 수 있다.

이 시점부터, 모든 Node 들은 동일하게 117개의 Range에 대한 117개의
Replica를 동일하게 보유하고 있었을 것이다. 그리고 다시 15분이 지난
08:25 정도에 두 번째 Node가 사라지면서, 전체 Range가 모두 Replica가
부족한 상태에 빠지게 된다. (Under-replicated의 수가 전체 Range 수와
같다)

위 그래프에는 조금 특이한 부분이 두 부분 있는데, 하나는 첫 번째 Node가
죽었을 때 왜 5분여에 걸쳐 빨간선, Leaseholder의 수가 전체 Range 수에
미치지 못하는지이고, 다른 하나는 두 번째 Node가 죽었을 때 왜 이번에는
Leaseholder의 수가 튀는지이다. (통계 구간 내 Leaseholder의 합계 방식의
계산 오류일 가능성이 있을 것 같은데, 이건 다음 기회에...)

아무튼, 이 상태에서 아래 그래프와 같이, 더이상 Replica는 증가하지 않는다.

![](/attachments/cockroachdb/ha/crdb-two-node-down-12-replicas.png){:.dropshadow.boxed}

하지만 Leaseholder는 조금 다른 문제이므로, 어쨌든 남아있는 Node 중
다시 선출을 하였다는 것을 아래 그래프에서 볼 수 있다. (어라? 정말?
여기서 시험이 살짝 꼬이기 시작한다. 이 얘기는 나중에 하고, 아무튼,)

![](/attachments/cockroachdb/ha/crdb-two-node-down-13-leaseholders.png){:.dropshadow.boxed}

이때, 정확히 어떤 실패인지는 모르겠지만 뭔가에 대한 실패의 기록이
지속적으로 발생하고, (아마 Node 간 Heartbeat의 문제 아닌가 싶다.)

![](/attachments/cockroachdb/ha/crdb-two-node-down-21-failures.png){:.dropshadow.boxed}

복제 대기열도 복제 수행이 불가능한 수량으로 꽉 찼다.

![](/attachments/cockroachdb/ha/crdb-two-node-down-22-repl-queue.png){:.dropshadow.boxed}

첫 번째 시험과 같이, 복제가 정상적으로 이루어지게 되면, 아래와 같이
노란색 Pending Action 그래프나 Replica를 지웠거나 만든 그래프가
나타나게 되는 것과는 다른 결과다.

![](/attachments/cockroachdb/ha/crdb-one-node-down-21-repl-queue.png){:.dropshadow.boxed}

"음, 이제 Split Brain 상황이니 동작을 멈추겠지?" 라고 생각하며
CLI를 꺼내 들었다.

{:.wrap}
```console
$ ./cockroach ... sql -e 'select count(*) from compute_resource'
+--------+
| count  |
+--------+
| 509541 |
+--------+
(1 row)
$ 
```

으잉???

> 짝수 구성에서 Node 반이 날아갔는데 돌아가?  
> 세 Node 구성에서 둘 죽은 거랑 결과가 같아야 하는 거 아냐?



# 둘만 남았어! 그런데 돌아가!

아... 맨붕. 황당하다! Node 둘이 죽었는데 여전히 Query가 성공하다니!

짝수 Node로 구성된 클러스터는 N-1의 효과 밖에 없다는 게 나의 오랜
고정관념이었고, 지금 이 구성은 네 개의 Node로 되어 있으니 결국, 세
개의 Node로 구성된 경우와 동일하게 Node 하나만 죽는 것을 허용할
것이라고, 둘이 죽으면 남은 Node 들은 과반수의 Majority를 가질 수
없다고 생각했었다. 가만, 그러고보니 두 번째 Node가 죽었을 때
Leaseholder 선출이 정상적으로 됐네?

{:.warn}
해결되지 않은 의문 #1
: 개별 Range의 Raft Leader 선출은 어떻게 진행되나? 정족수를 채우지
  못한 Range도 Leader 선출 및 Leaseholder 설정이 가능한가?

어쩌면, 위의 시험은 순차적으로 Node를 죽였기 때문에, 이미 세 Node
상태가 되었을 때 Replica 재배치가 끝난 상태라서 가능한 것일 수도
있을 것 같다. 무슨 말이냐면, CockroachDB는 Node 수준에서 모든 Node가
동일 한 위상을 갖는 대칭형 구조를 이루고 있으며 (그래서 Node 자체의
수량은 크게 문제가 되지 않으며), 데이터에 대한 클러스터로써의 지휘
관리는 Range 수준에서 개별 Range 별 Leaseholder 선출을 통해 이루어진다.
따라서, Replica의 수가 3인 상태에서, **Range 별 Replica가 두 개 이상
남은 상태라면 해당 Range에 대한 Raft Leader 선출은 가능할 수도 있을 것
같다**는 생각을 하게 되었다.

그렇다면 미처 Replica 재배치가 끝나기 전에 남아있던 Node가 하나 더
사라지는 상황에 대해서는 조금 더 자세히 봐야 답을 찾을 수 있겠다.

아무튼, 긴 시간 동안 헤매며 돌아간 길을 먼저 정리한다.



## 몇 가지 가설

{:.comment}
> 여기서부터 하라는 공부는 안 하고 굳은 땅에 삽질을 시작했다.


### 가설 #1 - 하... "Graceful" 하게 죽인 게 문제였네...

> 아... 두 Node를 내릴 때, `systemd`에게 `stop`을 지시하거나 `^C`를
> 써서 살며시 내려놨더니, 지들끼리 "우리 Split Brain 아니야~" 말을
> 맞췄네. 맞췄어!  
> 그럼 그냥 콱! 죽여봐야지!

그래서 `kill -9`로 콱 죽여봤다. 그런데 결과는 동일하더라. ㅠ.ㅠ


### 가설 #2 - 한 번에 죽였어야지!

> 한 번에 죽여야 지들끼리 말을 못하지...  

{:.wrap}
```console
$ ./cockroach ... sql -e 'select count(*) from compute_resource'
+--------+
| count  |
+--------+
| 509541 |
+--------+
(1 row)
$ 
```

그러나 결과는, 역시 동일하게 `SELECT count(*)...` 질의는 성공했다.
이게 함정이었는데, 여기서 생각을 조금 더 했어야 했다.

> 아... 혹시 이게 Raft가 동작하는 레벨이 Range니까... 그렇다면?

좀 돌아오긴 했지만, 어쨌든 힌트는 찾았다.


### 가설 #3 - 골고루 펴놓고 한 번에!

> Replica가 충분히 분산됐을 때 한 번에 죽여야 하네... 그거네...

아직 핵심을 짚지는 못했지만, 어쨌든 많이 다가왔다.
그래서, 다음과 같은 마지막 시험을 진행했다.



# Test #3 - Range를 부탁해

이렇게, 겉도는 시험을 몇 번 지속하느라고 시간을 꽤 소모하고 나서, 답에
조금 가까이 다가갈 수 있었다.

앞선 글 "[CockroachDB Architecture]"에서 CockroachDB는 대칭형 Node 구조,
그리고 계층형 기능 구조를 갖는다는 것을 이야기했다. 이 계층 구조 상에서
옆(다른 Node)을 의식하고 분산된 데이터를 처리하는 계층은 Distribution
계층과 Replication 계층이었다. 이 중, Replication 계층은 Range를 세 벌의
Replica로 복제하여 여러 Node에 분산 저장하는 일을 관장하고, Distribution
계층은 Range의 Leaseholder와 소통하는 역할을 담당했다. 결국, Client의
질의에 답을 하지 못한다는 말은 Leaseholder가 없거나 Leaseholder가 그
일을 수행하지 못할 때이다.

그럼, 그런 상황을 만들어보자.


## 두 Node가 동시에 죽었을 때의 반응

일단, 모든 Node를 살려서 전체적으로 Replica의 배치가 잘 되도록 유도하고,
두 Node를 동시에 죽여봤다.

![](/attachments/cockroachdb/ha/crdb-two-node-at-once-01-node-suspected-1.png){:.dropshadow.boxed}

먼저 죽은 두 Node가 Suspected 상태에 빠졌고 Under-Replicated 상태인
Range가 39개 생겨났다. 그런데, 그 옆에 29라는, 지금까지는 보지 못했던
다른 값이 하나 더 있다. 이 값들은 시간이 흐르면서 살짝 변하더니,

![](/attachments/cockroachdb/ha/crdb-two-node-at-once-03-node-dead.png){:.dropshadow.boxed}

최종적으로 Node의 사망 선고가 내려지면서 위와 같은 값이 되었다.

> 아하... Unavailable Ranges가 있다는 말이지? 이번엔 진짜 내 질의에 답하지
> 못하겠네! ㅋㅋㅋ

(사실, 앞선 몇 번의 가설 시험에서도 이와 비슷한 상황까지는 갔었다.
단지, 단서를 잡지 못했던 것)

그리고 이 상황에서, 100%는 아닌데 가끔은 다음과 같은 상황도 발생했다.

![](/attachments/cockroachdb/ha/crdb-two-node-at-once-05-connection.png){:.dropshadow.boxed}

관리화면에 접속하지 못하거나,

![](/attachments/cockroachdb/ha/crdb-two-node-at-once-06-loading.png){:.dropshadow.boxed}

값을 읽어오지 못하는 상황. 이건 DBMS가 정상적으로 동작하지 못한다는
증거다! 라고... 생각하며, CLI를 다시 꺼냈다.



## Range와 Replica의 고려 - Take #1

먼저, Node를 죽이기 전에, 7개의 Range를 가지고 있는 Table의 Range 및
Replica 배치 상태를 확인했다. 아래와 같이, 1번, 2번, 3번, 4번 노드에
빠짐없이 배치가 되어있고, Leaseholder도 그러했다.

```console
$ ./cockroach ... sql -e 'show experimental_ranges from table compute_resource'
+----------------+----------------+----------+----------+--------------+
|   Start Key    |    End Key     | Range ID | Replicas | Lease Holder |
+----------------+----------------+----------+----------+--------------+
| NULL           | /38658...92994 |       90 | {1,2,3}  |            2 |
| /38658...92994 | /38659...41697 |      121 | {1,2,3}  |            2 |
| /38659...41697 | /38659...70372 |      122 | {1,2,4}  |            1 |
| /38659...70372 | /38660...95043 |      123 | {1,3,4}  |            4 |
| /38660...95043 | /38660...23716 |      124 | {1,2,3}  |            3 |
| /38660...23716 | /38772...75553 |      109 | {1,2,3}  |            3 |
| /38772...75553 | NULL           |      110 | {1,2,3}  |            1 |
+----------------+----------------+----------+----------+--------------+
(7 rows)
$ 
```

이 상태에서 2번 Node와 4번 Node를 죽였을 때, 다음과 같은 정보를 얻을
수 있었다. Replica의 배치는 손 쓸 겨를이 없었으니 그대로이고, 단지
Leaseholder의 배치만 바뀌었다. 특히, 122번 Range는 살아남은 Replica가
하나 밖에 없는 상태가 되었다.

```console
$ ./cockroach ... sql -e 'show experimental_ranges from table compute_resource'
+----------------+----------------+----------+----------+--------------+
|   Start Key    |    End Key     | Range ID | Replicas | Lease Holder |
+----------------+----------------+----------+----------+--------------+
| NULL           | /38658...92994 |       90 | {1,2,3}  |            3 |
| /38658...92994 | /38659...41697 |      121 | {1,2,3}  |            1 |
| /38659...41697 | /38659...70372 |      122 | {1,2,4}  |            1 |
| /38659...70372 | /38660...95043 |      123 | {1,3,4}  |            3 |
| /38660...95043 | /38660...23716 |      124 | {1,2,3}  |            3 |
| /38660...23716 | /38772...75553 |      109 | {1,2,3}  |            3 |
| /38772...75553 | NULL           |      110 | {1,2,3}  |            1 |
+----------------+----------------+----------+----------+--------------+
(7 rows)
$ 
```

"아하! 이번엔 좀 명확하다." 하며, 가볍게 명령을 날렸다.

{:.wrap}
```console
$ ./cockroach ... sql -e 'select count(*) from compute_resource'
+--------+
| count  |
+--------+
| 509541 |
+--------+
(1 row)
$ 
```

아 정말 이럴거야?

궁지에 몰리면, 0 아니면 1로 딱 떨어지는 세상을 사는 엔지니어임에도
뭔가 미신을 믿기 시작하는 경우가 있다. (그런 증상을 보이는 사람에게
인정 사정 없이 한 마디 하는 나지만) 나도 그럴 때가 있는...

> 혹시 `count(*)`는 Table Access를 안 하고도 메타 정보에서 답을 얻나?

황당한 얘기지만, 어떤 DBMS에게는 사실일지도... 아무튼, 좀 더 확실히
Table에 접근한다는 증거를 뽑아보자.

{:.wrap}
```console
$ ./cockroach ... sql -e 'select name from compute_resource' |wc -l
509542
$ 
```

미치겠다. 실제로 `SELECT`가 동작한다! Node 수준이 아닌 Range 수준에서
정족수를 채우지 못한 Range를 확인했음에도!

어디, 이번에는 지난 글에서 했던 방식으로 데이터 `INSERT`도 해봤는데...
화면은 생략하지만, 어쨌든 겁나 많은, 36000 건의 데이터가 쑥~ 쑥~ 잘
들어간다!

{:.wrap}
```console
$ ./cockroach ... sql -e 'select count(*) from compute_resource'
+--------+
| count  |
+--------+
| 545541 |
+--------+
(1 row)
$ 
```

심지어는, 있지도 않은 Node 2번에 Replica 할당까지 해가며 Range도 하나
더 만들어졌다...

```console
$ ./cockroach ... sql -e 'show experimental_ranges from table compute_resource'
+----------------+----------------+----------+----------+--------------+
|   Start Key    |    End Key     | Range ID | Replicas | Lease Holder |
+----------------+----------------+----------+----------+--------------+
| NULL           | /38658...92994 |       90 | {1,2,3}  |            3 |
| /38658...92994 | /38659...41697 |      121 | {1,2,3}  |            1 |
| /38659...41697 | /38659...70372 |      122 | {1,2,4}  |            1 |
| /38659...70372 | /38660...95043 |      123 | {1,3,4}  |            3 |
| /38660...95043 | /38660...23716 |      124 | {1,2,3}  |            3 |
| /38660...23716 | /38772...75553 |      109 | {1,2,3}  |            3 |
| /38772...75553 | /38772...64739 |      110 | {1,2,3}  |            1 |
| /38772...64739 | NULL           |      221 | {1,2,3}  |            1 |
+----------------+----------------+----------+----------+--------------+
(8 rows)
$ 
```

이쯤 되면... 울어야 하나, 아니면 Cockroach 좋다고 웃어야 하나...



## Range와 Replica의 고려 - Take #2

{:.comment}
> 이쯤 했을 때, 아니 사실은 아까부터, 그만 하고 집에 갔으면 좋겠다는
> 생각과 함께, 이제는 어떤 웹앱을 만들겠다고 이 DBMS를 설치했는지도
> 잊어버린 이 바보스러움을 규탄하기 시작했다.
> 그러나 벌린 일을 그냥 주어담을 수도 없고...

새로운 가설과 시험방법을 써보기로 했다. 가설은, 혹시 `SELECT`가 되는
건 이게 READONLY 작업이기 때문인 것이 아닐까? 데이터에 변경을 가하지
않으므로 Replica가 하나 뿐이더라도 큰 문제가 없는...

{:.warn}
해결되지 않은 의문 #2
: READONLY라고 해서 Replica 하나만 가진 Range가 답을 해버린다면,
  혹시 이게 Majority를 갖는 Replica 들과의 Network 단절 상황일 때
  이 홀로 남은 Replica에게 답을 받은 Client는 그것을 믿어도 될까?

그럼 왜 `INSERT`는 된걸까? 그건 혹시, 앞선 시험의 상태에서 살아있는
Node가 1번과 3번이었고, 하필, `INSERT`를 받을 최외각 Range의 Replica가
2번을 제외한 과반수 1번, 3번에 위치해있기 때문이 아닐까?

그래서 Take #2는 다음과 같이 진행했다. (Take #2라고 그냥 썼지만 실은
한 #5 또는 #6 쯤 되는 것 같다.)

* 먼저, 골고루 Range가 퍼지도록 유도하는 한 편,
* 무엇보다도 마지막 Range가 정족수를 잃기를 바랬다.
* 그리고나서 정족수를 채운 Range에 있는 데이터에 `UPDATE`를 해보고,
* 정족수를 채우지 못한 Range에 있는 데이터에도 동일한 `UPDATE`를 해보는 것

이것이 이번 시험이다.



### 조건 만들기

운이 좋았다. 각 Node에 골고루 퍼진, 그리고 마지막 Range가 2번, 4번에
걸쳐 있는 상태를 얻었다. (사실, 마지막 Range에 대한 부분은 내가 어떤
Node를 죽이느냐에 따라 조절할 수 있는데, 2번, 4번이 죽이기 편해서...)

```console
$ ./cockroach ... sql -e 'show experimental_ranges from table compute_resource'
+----------------+----------------+----------+----------+--------------+
|   Start Key    |    End Key     | Range ID | Replicas | Lease Holder |
+----------------+----------------+----------+----------+--------------+
| NULL           | /38658...92994 |       90 | {1,2,4}  |            1 |
| /38658...92994 | /38659...41697 |      121 | {1,2,3}  |            2 |
| /38659...41697 | /38659...70372 |      122 | {2,3,4}  |            3 |
| /38659...70372 | /38660...95043 |      123 | {2,3,4}  |            4 |
| /38660...95043 | /38660...23716 |      124 | {1,3,4}  |            4 |
| /38660...23716 | /38772...75553 |      109 | {1,3,4}  |            3 |
| /38772...75553 | /38772...64739 |      110 | {1,2,4}  |            1 |
| /38772...64739 | NULL           |      221 | {2,3,4}  |            2 |
+----------------+----------------+----------+----------+--------------+
(8 rows)
$ 
```

그리고, 두 Node를 죽인 후, 아래와 같은 상태가 되었다.

```console
$ ./cockroach ... sql -e 'show experimental_ranges from table compute_resource'
+----------------+----------------+----------+----------+--------------+
|   Start Key    |    End Key     | Range ID | Replicas | Lease Holder |
+----------------+----------------+----------+----------+--------------+
| NULL           | /38658...92994 |       90 | {1,2,4}  |            1 |
| /38658...92994 | /38659...41697 |      121 | {1,2,3}  |            1 |
| /38659...41697 | /38659...70372 |      122 | {2,3,4}  |            3 |
| /38659...70372 | /38660...95043 |      123 | {2,3,4}  |            3 |
| /38660...95043 | /38660...23716 |      124 | {1,3,4}  |            1 |
| /38660...23716 | /38772...75553 |      109 | {1,3,4}  |            3 |
| /38772...75553 | /38772...64739 |      110 | {1,2,4}  |            1 |
| /38772...64739 | NULL           |      221 | {2,3,4}  |            3 |
+----------------+----------------+----------+----------+--------------+
(8 rows)
$ 
```

### 적당한 레코드를 찾아 고쳐보기

먼저, Range 두 개를 찾았다. 하나는 109번 Range인데, 이건 아직 살아있는
Node인 1번, 3번에 Replica가 있고, 나머지 한 Replica는 4번 Node에 있는
Range이다. 다른 하나는 마지막 Range이면서 Replica 중 살아있는 Node에
있는 Replica가 하나 뿐인 Range라서, 뭔가 쓰기 작업을 하면 실패할 것으로
기대하는 221번 Range다.

살짝 다른 얘기인데, 앞에서 남아있는 Node 만으로는 정족수를 채우지 못하는
Range에 대한 Leaseholder 재선출은 어떻게 될까 의문을 가졌었고, 이에
대하여 Node 수준이 아닌 Replica 수준에서 정족수 관리를 한다면 가능할
수도 있겠다는 생각을 했었다. 그런데 위의 표를 보면, 살아남은 Replica가
하나 뿐인 Range 중에서, 90번, 122번, 110번의 경우는 이미 Leaseholder가
각각 1, 3, 1번이었으니 재선출이 필요한 상황이 아니었지만, 123번과 221번
Range는 살아남은 Replica가 자기 자신 뿐인 상태에서 새롭게 Leaseholder가
됐다. 이게 어떻게 가능한 걸까?

아무튼 다시 시험으로 돌아와서, 정족수를 만족하여 쓰기 작업을 진행했을
때 정상적으로 수행될 수 있을 것으로 예상하는 109번 Range에서 마지막
레코드를 찾아서 `UPDATE`를 해봤다.


{:.wrap}
```console
$ ./cockroach ... sql -e 'select id,name from compute_resource where id < 387723163815575553' |tail -1
387723163798962177	test 19860
$ ./cockroach ... sql -e "update compute_resource set name='update 1' where id = 387723163798962177"
UPDATE 1
$ ./cockroach ... sql -e 'select id,name from compute_resource where id < 387723163815575553' |tail -1
387723163798962177	update 1
$ 
```

음, 이건 이제 이상하지도 않다. Node 두 개가 죽은 상태에서, 어쨌든
Range 단위의 정족수를 채우고 있는 Range는 `UPDATE`가 잘 되는 것이
맞다라고 일단 생각해보자.

{:.keypoint}
Cockroach 가용성의 특징 #6 - Range 별 가용성
: CockroachDB는 Node 단위가 아닌 Range 단위로 가용성을 관리하게 되며,
  동일 Cluster 또는 동일한 Table 내에 가용하지 않은 Range가 있더라도,
  가용한 Range에 대해서는 READ는 물론 WRITE 작업도 정상적으로 처리된다.

그럼 아닌 경우도 봐야하니, 정족수를 채우지 못하고 있는 221번 Range의
마지막 레코드를 찾아서 동일한 변경을 해보자.

{:.wrap}
```console
$ ./cockroach ... sql -e 'select id,name from compute_resource' |tail -1
388599867835973635	test 36000
$ ./cockroach ... sql -e "update compute_resource set name='update in range 221' where id = 388599867835973635"
^C
$ ./cockroach ... sql -e 'select id,name from compute_resource' |tail -1
^C
$ 
```

음, `UPDATE`가 먹지 않는다. 질의를 날리고 한 10분 기다렸는데 답이
없다. 그런데 TIMEOUT이나 오류가 나야 Application을 짤 것이 아닌가?
이게 뭐지? 또다른 의문...

{:.warn}
해결되지 않은 의문 #3
: 질의에 응답할 수 없는 상황이면 답을 하지 않는 것이 옳은가? 그럼
  Application은 알아서 Timeout을 잡고 또는 Connection에 대한 Timeout을
  설정하여 답이 없으면 오류메시지 없이 로직을 잡아야 하는가?

그리고 또 한 가지 이상한 점은, (앞선 시험에서도 비슷한 경우를 만난 적이
있는데) 이렇게 `UPDATE` 등을 날려서 한 번 응답을 받지 못하면 그 다음
어떤 질의를 해도, 저렇게 원래 잘 되던 `SELECT`를 날려도 답을 받지
못한다. 하...

아무튼, 다시, 그럼 이 상황이 전체 DBMS가 얼은 것인지, 또는 저 현상이
앞서 잘 동작하던 Range에도 어떤 영향을 주는지 알아야겠다.


### 한 번 더 해보기

잘 동작하던 109번 Range에 다시 `UPDATE`를 날려보자.

{:.wrap}
```console
$ ./cockroach ... sql -e 'select id,name from compute_resource where id < 387723163815575553' |tail -1
387723163798962177	update 1
$ ./cockroach ... sql -e "update compute_resource set name='update in range 109 again' where id = 387723163798962177"
UPDATE 1
$ ./cockroach ... sql -e 'select id,name from compute_resource where id < 387723163815575553' |tail -1
387723163798962177	update in range 109 again
$ 
```

역시 이번에도 성공이다. 그런데...

```console
$ ./cockroach ... sql -e "select count(*) from compute_resource"
^C
$ 
```

정족수를 채우지 못한 Range에 WRITE 작업을 시켜서 이 Range가 얼어버리고
나니, 이제 원래는 너무 잘 되던, 전체 Range에 대한 READ 작업에도 이
얼음성이 영향을 주게 되었다.

> 아... `count(*)`로 질의해도 Table 읽는 거 맞네... ㅋㅋㅋㅋ

그리고 여전히, 동일한 `count(*)`를 얼지 않은 Range에 대해서만 던지면
정상적으로 잘 읽어진다.

{:.wrap}
```console
$ ./cockroach ... sql -e "select count(*) from compute_resource where id > 386608513179123716 and id < 387723163815575553"
+-------+
| count |
+-------+
| 63154 |
+-------+
(1 row)
$ 
```


## 시험 뒤에는 뒷정리 부탁합니다

명확하지는 않았지만, 동작 양상은 파악이 되었다. 이쯤 하고, 생각이
밤새 머리 속에서 숙성되기를 바라면서, 뒷정리를 했다.

죽였던 Node들을 다시 살리고, 혹시나 다시, 아까 `UPDATE` 했던 레코드가
잘 보존되어 있는지 읽어봤다.

{:.wrap}
```console
$ ./cockroach ... sql -e 'select id,name from compute_resource where id < 387723163815575553' |tail -1
387723163798962177	update in range 109 again
$ 
```

Node를 모두 살리고, 복구가 완료된 시점에도 업데이트 상태를 잘 유지하고 있다.

그런데! 그런데 이건 뭐냐?

{:.wrap}
```console
$ ./cockroach ... sql -e 'select id,name from compute_resource' |tail -1
388599867835973635	update in range 221
$ 
```

아니다, 전혀 의도하지 않았고, 예견하거나 가정하고 읽어본 게 아니다.
그냥 읽어봤다. 그런데 왜... 여기에 이 값이 들어있는 것인가? 이 요청은
응답을 받지 못했는데, 그럼 실패한 것 아니었나? 언제 이 `UPDATE`가
완료된 건가?!





# 정리: CockroachDB Cluster의 가용성

완전하지는 않으나, 위와 같이 네 개의 Node로 구성된 Cluster에 대해 Node
하나가 죽었을 때, 두 개가 죽었을 때, 그리고 두 개의 Node가 동시에 죽었을
때 등의 여러 경우에 대한 가용성 시험을 해봤다. 이를 통하여 다음과 같은
몇 가지 CockroachDB Cluster의 특징적인 부분을 찾을 수 있었다.

* "느린 사망 선고"를 통해 일시적인 통신 두절, 또는 Rolling Update 등의
  상황에서는 불필요한 데이터 복제를 일으키지 않고 유연하게 대처한다.
* "Range 별 가용성 관리"를 통하여 Node 장애 상황에서 데이터를 안전하게
  보관하기 위하여 노력하며, 복구 시에는 기존 Replica와 새로운 Replica
  생성을 조합하여 최소한의 노력으로 최적의 상태를 만들어낸다. 또한,
  일부 Range가 가용하지 않더라도, 가용한 Range에 대해서는 서비스 상태를
  유지한다.
* "빠른 Leaseholder 재배치"를 통해 서비스의 가용성은 항상 최선의 상태를
  유지하며, 복구 시에도 다시 Leaseholder를 배치하여 전체 Cluster의 I/O
  부하의 균형을 유지한다.

실제의 상황에서 Node 두 개가 동시에 죽는 경우는 확율적으로 높지 않은
현상이다. 또는, 반대로 말하면 이런 상황이 쉽게 발생하지 않도록 환경을
구성하는 것이 엔지니어의 일이다. 또한, 이 실험 결과는 하나의 Node가
죽었을 때, 어떻게 해야 전체 서비스가 심각한 상황에 빠지지 않도록 할
수 있는지를 말해주고 있다.

어쨌든, 실험을 통해 CockroachDB의 특징적인 부분, 또는 CockroachDB
Cluster를 구성할 때 유의해야 할 부분이 어떤 것인지 찾아낼 수 있었다.
실무적인 차원에서는 조금 다른 유의사항 목록을 뽑아볼 수 있겠지만,
흥미로운 점에 초점을 맞춰보니 다음의 두 가지 주제가 떠오른다.


## Node가 아닌 Range

CockroachDB는 대칭형 Node 구조를 갖추고 있으며, Node 수준만 놓고 보면
직접적으로 가용성을 위한 어떤 행동을 하지 않는다. (어찌 Node를 떼어놓고
남은 부분을 얘기하겠냐마는, 이건 개념적인 이야기) CockroachDB는 계층
구조의 설계 속에 가용성에 대한 부분이 녹아져 있으며, 상위의 SQL 계층
등은 대칭 구조 속에서 기능적 부하분산 구조로 동작하게 되며, Distribution
및 Replication 계층에서 분산 Cluster의 특징을 Range 단위로 처리하게
된다.

Range 단위로 Cluster 처리를 하는 특징으로 인하여, Cluster의 가용성을
계산할 때, Node의 수량은 큰 의미가 없다. 단지, Node의 수량은 "서로
다른 Node에 Replica를 분산 저장"할 수 있는 수만 맞추어 줄 수 있으면
되는 단순한 계산을 따르게 되며, 말 그대로 Cluster로써의 "죽음 허용치"는
Range 수준의 복제 기준을 따르게 된다. 이는, 과반수 규칙을 만족시키기
위해 늘 홀수 개의 Node 수를 유지해야 하는, 즉 3, 5, 7... 등의 수량으로
Node 증설을 해야 하는 제한을 갖지 않게 해주며, Node의 수량은 단지
부하의 분산, 데이터의 분산만 고려하면 되는 간결함을 유지할 수 있게
해준다.


## Raft Consensus Algorithm

아... 단순하게 Cluster를 설계하고 관리하기 위해서 모든 것을 알 필요는
없을 것이다. 단지 특성을 정확하게 파악하고 그것을 이용해서 적절한
구성을 해줄 수 있다면 Cluster 관리자로써의 역할은 충분하다고 생각한다.

다만, Cockroach의 동작 방식을 정확히 이해하기 위해서는 이
"[Raft Consensus Algorithm]"에 대한 이해가 있다면 큰 도움이 될 것 같다.
(나도 읽어보지 않았지만) "[Wikipedia 문서]"도 도움이 될 것이다. 난,
빠른 이해를 돕기 위해 구성된 "The Secret Lives of Data"의,
"Understandable Distributed Consensus"라는 부제가 붙은 "[Raft]"라는
프리젠테이션을 봤는데, Raft의 이해에 많은 도움이 되었다.

[Raft Consensus Algorithm]:https://raft.github.io/
[Wikipedia 문서]:https://en.wikipedia.org/wiki/Raft_(computer_science)
[Raft]:http://thesecretlivesofdata.com/raft/

사실, 이 프리젠테이션은 기존에 Docker의 클러스터 구조를 보면서 참고했던
문서인데, 그 때에는 Leader Election(여기서는 Leaseholder를 선출하는
과정과 연관됨)에 관심을 두고 보다 보니 놓쳤던 부분이 있었다. 그런데
이번에, "내 이해가 잘못된 것인가?"하고 다시 열어봤더니, Raft 구성에서
Log Replication을 통해 데이터 동기화를 이루어내는 부분에 대해 자세히
설명되어 있다는 것을 알게 되었고, 이를 통하여 "**아... 그렇다면 내
시험의 이상한 결과가 어느 정도 설명이 되는구나...**" 하고, 조금 더
이해를 높일 수 있었다. (동시에 "난 아직 갈 길이 멀었구나..." 하는
자괴감도...)



# 해결되지 않은 의문

어쨌든, 아직도 해결되지 않은 의문:

문서를 좀 읽어본 후에 시험을 시도했다면, 또는 지금이라도 다시 문서를
찾아본다면 풀릴 수 있을 것도 같다. 아무튼, 현재까지의 시험 결과를
두고 생각해보면, 다음과 같은 의문이 있다.

1. Range가 Leaseholder를 선출할 때, Cluster를 구성하는 전체 Node의
   수를 고려한다면, Replica가 하나만 남은 Range에 대해서는 Leaseholder
   선출 자체가 불가능해야 할 것 같지만, 실제로는 하나의 Replica만
   살아남은 Range의 Leaseholder도 바뀐다. 이게 정상적인 동작인가?
   또는 그래도 되는 것인가?
1. 네트워크 분리 상황에서, 정족수를 채운 Leaseholder A와 채우지 못한
   상태이나 자신의 Replica로부터 읽을 수 있는 상황인 Leaseholder B가
   있을 때, 어떤 Client C가 B에게 `SELECT` 요청을 했을 때 자신에게
   과반 이상의 Vote이 없는 상황에서 답을 해도 무방한가?
   혹은, Client 입장에서 그 값을 믿어도 되는가?
1. 위의 Leaseholder B가 Write 시도를 하였으나 정족수 조건을 만족하지
   못해 Commit 불가 상황에 빠졌을 때, 아예 응답을 하지 않는 것이
   적절한가?

공식 페이지인 [Raft Consensus Algorithm]에서는 사용자가 상황을 조정할
수 있는 Animation이 제공되며, 다섯 개의 Node로 구성된 환경에서 Node를
죽였을 때, 전체 클러스터의 Leader Election이 어떻게 작동하는지를
시뮬레이션해볼 수 있도록 되어있다. 첫 번째 의문에 대하여, Node를 차례로
죽여서 두 개만 남기면 끝끝내 Leader는 선출되지 않는다. 그런데 왜
Cockroach는 Leaseholder를 선출해낼까?

두 번째 의문의 상황은 네트워크 단절 상황에서 충분히 가능한 시나리오인데
이 상황에서 Client는 어떤 행동양식을 갖추어야 할까? 또는, 어떻게 자신이
이런 환경에 처한 것을 파악할 수 있을까? Readonly 상태로 서비스를 유지하는
것이 옳을까 아니면 서비스를 닫아야 할까? 만약 이게 쇼핑몰 등, 사용자와
거래가 일어나는 시스템이라면... 어쩌면 중앙에서는 제고가 바닥났을지도
모를 상황에서 제고가 있다고 표현해야 할까?

세 번째 의문은 아마도 위의 상황에서 "몰라, 일단 팔아"라고 했을 때
일어날 수 있다. 판매이력 또는 주문 Table도 같은 상황에 처했다면 이제
Lock이 걸려버릴 것이다. Commit이 되지 않았으니 실거래까지 연결되지는
않겠지만... 이런 상황에서 사용자는 샀다고 생각하겠나 반대겠나?
이제 응답도 받을 수 없는데...
그래서 그냥 포기하고 다른 상점에서 물건을 샀더니... 얼마 후 네트워크가
복원되고 미루었던 Log에 대한 Commit이 일어나면서 "성공적으로 구매가
완료되었어요"라고 메일이 온다면?

아이고... 복잡하다. (물론, DBMS 수준에서의 Transaction 처리도 있고,
Application 수준에서도 유사한 처리를 했겠지만...)
더 길어지면 글의 주체 밖의 이야기가 될 것 같다. 이 글에서는 그냥,
"아직 풀리지 않은 의문"이 남았다는 정로도 마무리한다.

---

상황이 예상과 달리 복잡해져서 꽤 재밌긴 하다. 그런데 어렵네...
다시 시간이 되면, 실제로 Network 분리 상황을 만들어서 시험을 해봐야
겠다.



---

[공식 문서]:https://www.cockroachlabs.com/docs/stable/architecture/overview.html
[Docker Swarm의 고가용성]:{% link _posts/cloudcomputing/2018-03-15-high-availability-of-docker-swarm.md %}


### 함께 읽기

CockroachDB 맛보기 묶음글은 다음과 같습니다.

* [CockroachDB 안녕?]
* [CockroachDB 클러스터 구성하기]
* [CockroachDB Architecture]
* [CockroachDB 클러스터 설치 스크립트]
* _CockroachDB 클러스터 가용성 시험_

[CockroachDB 안녕?]:{% link _posts/cloudcomputing/2018-09-20-say-hello-to-cockroachdb.md %}
[CockroachDB 클러스터 구성하기]:{% link _posts/cloudcomputing/2018-09-21-setup-cockroach-cluster.md %}
[CockroachDB Architecture]:{% link _posts/cloudcomputing/2018-10-01-architecture-of-cockroachdb.md %}
[CockroachDB 클러스터 설치 스크립트]:{% link _posts/cloudcomputing/2018-10-02-cockroach-cluster-setup-script.md %}
[CockroachDB 클러스터 가용성 시험]:{% link _posts/cloudcomputing/2018-10-08-availablility-of-cockroach.md %}
