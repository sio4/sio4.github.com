---
title: CockroachDB 안녕?
subtitle: 바퀴벌레, 글로벌 서비스를 위한 SQL 데이터베이스
tags: ["DBMS", "cloud-computing", "open-source"]
categories: ["cloudcomputing"]
image: /attachments/cockroachdb/cockroach-symbol.jpg
banner: /attachments/cockroachdb/cockroach-logo.jpg
date: 2018-09-20T16:30:00+0900
---
"**The SQL database for building global cloud services**"라는, 뭔가 관심을
끌기 충분한 문장으로 자신을 설명하고 있는 CockroachDB라는 오픈소스 RDBMS를
우연한 경위로 알게 되었다. 이 글은, 이 CockroachDB Cluster를 구성하고 나서
그 겉을 둘러본 감상을 정리하려고 한다.


사실, 데이터베이스는 내 전문분야도 아닐 뿐더러 관심이 많은 영역도 아니기
때문에 이런 주제로 글을 쓰는 것은 좀 무리가 있긴 하다. ([DBMS] 태그를 보니
글이 딱 두 개 있다) 그럼에도 불구하고 글로 남기는 이유는, 이 과정이 딱히
DBMS에 관련된 것이라기 보다는 어쩌면 시스템 자동화 등, [클라우드 컴퓨팅],
[오픈소스] 등을 중심으로 완전히 재편되고 있는 근래의 IT 환경 변화에 대한
기록으로써랄까...

{:.ribbon}
> *그나저나 여행 다녀온 얘기는 언제 쓰나...*

{:.boxed}
> CockroachDB 맛보기 묶음글은 다음과 같습니다.
>
> * _CockroachDB 안녕?_
> * [CockroachDB 클러스터 구성하기]
> * [CockroachDB Architecture]
> * [CockroachDB 클러스터 설치 스크립트]
> * [CockroachDB 클러스터 가용성 시험]



# 왜 CockroachDB에 관심을 갖나?

원래 시작은, 심심풀이 겸 웹앱을 하나 만들려고 준비하다가, 얼마 전에 살짝
관심을 가졌으나 아직 만져보지 못했던 CockroachDB를 이번 기회에 써봐야지,
하고 마음을 먹게 됐는데, 이 CockroachDB를 설치해보느라 아직 원래 하려던
웹앱의 개발에는 손도 못 대고 있다.  
아무튼, 배보다 배꼽이 크다더니 딱 지금의 상황을 두고 하는 말인데, 계획에
없던 부분에서 시간을 조금 쓰고 있다. 잡설은 접고, 호구조사를 좀 했다.


## Cockroach = Cloud + Global

CockroachDB는 Cockroach Lab이라는 회사에서 만드는 오픈소스 RDBMS인데,
앞서 잠깐 말했던 것처럼 "**The SQL database for global cloud services**"를
모토로 하고 있는 DBMS 제품이다.

먼저 일반 정보:

* 홈페이지: <https://www.cockroachlabs.com/product/cockroachdb/>
* 회사 홈페이지: <https://www.cockroachlabs.com/>
* 문서: <https://www.cockroachlabs.com/docs/stable/>
* 블로그: <https://www.cockroachlabs.com/blog/>
* 저장소: <https://github.com/cockroachdb/cockroach/>


### 특징, 지향점

이제 겨우 설치를 마친 상태지만 홈페이지에서 강조하고 있는 부분을 중심으로
이 제품의 특징과 지향하는 방향을 유추해보자면, CockroachDB는 *스스로도
클라우드 컴퓨팅 환경과 그 바탕에 깔린 사상을 최대한 활용하고, 또한 이러한
환경 조건에서 구동될 애플리케이션을 효과적으로 개발, 운영할 수 있도록*
하는데 초점을 맞추고 있는 것 같다.

정리해보면,

* 클라우드 컴퓨팅 시대에 맞게, 자동화를 통하여 운영자의 일을 줄인다.
  (라고 썼지만 회사들은 운영자 인건비를 아예 빼려고 들겠지)
* 글로벌 서비스를 제공할 때 매우 큰 힘이 되도록, 전지구적인 스케일의
  클러스터 구성이 가능하다.
* 물론, 클러스터 구성을 통하여 데이터센터 내에서 고가용성, 내장애성을
  갖춘 DBMS를 구축하는 것을 포함한다.
* 고가용성, 내장애성, 데이터 무결성 등을 위한 복제, 발란싱, 스케일링,
  백업/복구 등의 자동화된 기능을 제공한다.
* 신세대 애플리케이션 개발을 편리하게 하기 위해 JSON 등을 지원하기도
  하면서, 동시에 이미 단단하게 굳어있는 SQL에 대한 경험을 살릴 수 있도록
  PostgreSQL 문법의 SQL을 지원한다.

음... 뭐랄까, 전통적인 SQL RDBMS의 친근함을 유지하되, 클라우드 시대와
함께 유행하고 있는 NoSQL 데이터베이스 등이 갖는 확장성과 유연성을 동시에
제공하려는 것이랄까... 어쨌든 눈에 딱 띄는 특징은 **특정 센터나 지역을
넘어 전지구적 수준에서 RDBMS 클러스터를 구성할 수 있다니!** 이 부분이
정말 매력적이다!


### 오픈소스, 커뮤니티 버전

CockroachDB는 기본적으로 오픈소스이다. (아... 요즘은 오픈소스가 아닌 것이
더 이상한 세상이 되었다. 격세지감) 동시에, Enterprise License를 제공하고
있는데, 일부 기능은 Enterprise License를 통해서만 제공된다.

비교표에 따르면, 커뮤니티 버전에서는 컨설팅/기술지원, 역할기반 접근제어
등이 지원되지 않는다는데, 이 둘은 소규모 서비스를 만드는 정도라고 한다면
커뮤니티 버전을 사용하더라도 크게 문제가 될 것 같지는 않다.  
또, 백업/복구의 분산처리를 지원하지 않는다고 하는데, 이런 훌륭한 기능을
아직 경험하지 못한 탓에 아쉬움이 어느 정도일지 감이 오지는 않는다.

라이선스에 따른 기능 비교표를 보면서 가장 아쉽게 느껴지는 부분은, 커뮤니티
버전에서는 Geo-Partitioning을 지원하지 않는다는 부분이다. 뭐, 내가
글로벌 서비스를 고려하고 있는 상황이 아니긴 하지만, 그래도 CockroachDB의
모토가 "The SQL database for global cloud services" 아니었나? 왜 모토가
Optional인 것인가?!


### 누가 이런 것을?

내 경우, 소프트웨어를 보면서 누가 만들었는지 확인하는 경우가 많지는 않다.
그런데 Cockroach의 경우, 뭔가 재미있는 생각이 들어서 도대체 어떤 인물들이
이걸 만들었나... 찾아봤는데, Spencer Kimbell, Peter Mattis, Ben Darnell
이렇게 세 명의 전직 Googler가 만든 회사라고 한다. (그들 이력을 보니,
Google Colossus, Gmail, Bigtable 등에 관여했던 인물들이라고 하는데, 더욱
재미있는 것은 앞의 둘은 UCB 출신인데 학교에 다니던 시절 GIMP/GTK에 깊게
관여했었던가 보다. :-)



# 바퀴벌레 겉보기

설치에 대한 얘기를 하려고 했는데, 그럼 글이 너무 길어질 것 같아, 순서를
좀 뒤집었다. 일단 설치된 모습을 보려고 하는데, 딱! 드는 생각. DBMS가 무슨
설치된 모습? 무슨 겉보기? 끌끌끌...

## 내장 모니터링 도구

근래에 발표되는 소프트웨어들의 특징 중 하나인 것 같은데, CockroachDB는
기본적인 상태 모니터링을 할 수 있는 모니터링 콘솔을 Built-in으로 제공한다.
아뿔싸... DBMS를 설치하고 겉모습을 얘기하게 될 줄이야...

{:.point}
대세는 모니터링
: 어째서... 요즘 발표되는 이런 저런 소프트웨어들은 자체적으로 모니터링
  콘솔을 제공하는 경우가 참 많다. 최소한, 모니터링 API는 기본이 되었다.


### Cluster Overview

웹브라우져로 관리포트에 접속하면 다음과 같은 화면을 만난다.

![](/attachments/cockroachdb/cockroach-10-overview-list.png)

화면을 보면, 왼쪽에는 네 개의 메뉴가 놓여져 있고, 중앙 화면에서는 용량과
Node 상태, 복제 상태 등을 보여준다.

이 클러스터는 총 세 대의 기계를 엮어 만든 것인데, 용량이 64.5GiB로 표시되는
것을 보면, 총 용량 25GB의 디스크를 갖은 세 대의 Node의 가용한 디스크 용량의
합과 같다. 어라? 총 용량이 64GB라면 복제를 고려했을 때 가용량은 32GB 나
21GB 정도가 맞지 않나? 이 부분은 조금 더 확인해봐야 할 것 같다. 기본으로
설정한 상태인데, 복제 설정이 되지 않은 것인지, 용량을 표시할 때 복제 여부와
무관하게 물리적인 용량을 보여주는 것인지...  
(아, 참고로 문서에서 아직 전체 아키텍쳐나 동작방식에 대한 설명 등을 찾지
못했다.)

그 아래로는 클러스터에 참여한 각 Node에 대한 정보를 보여주고 있다. 그런데
만약 Enterprise License를 구입했다면, 아래와 같이 List가 아닌 Map으로 볼
수도 있는데, 각 서버의 정보를 세계지도 위에 표시해주나보다.

![](/attachments/cockroachdb/cockroach-12-overview-map.png)

오... 이거 괜찮다! 글로벌 서비스를 한다면, 어느 지역에 리소스가 모자라지는
않는지, 시각적으로 볼 수 있다면 좋을텐데,... 라이선스를 살 수는 없으니
지도는 머리 속에 그리자.

참고로, `8080` 포트를 사용하는 웹기반의 모니터링 화면은 별도의 인증을
제공하지 않는다. 물론, 클러스터의 상태를 보는 것 외에 관리적인 행동이
불가능하긴 하지만, (발견하지 못한 건가?) 보안을 위해 Listen하는 IP에
대한 제어나 기타 방법으로 접근을 제한하는 것이 좋겠다. (내 경우,
내부망에 대해서만 포트를 열고 원격 접속은 터널링을 이용했다.)


### Metrics

Overview, Metrics, Databases, Jobs의 큰 메뉴 중에 두 번째 Metrics의 화면은
아래와 같다. 메뉴 이름은 Metrics인데, 들어가면 만나는 페이지의 제목은
Dashboard라고 되어있다. 뭐 어쨌든,

첫번째 Dashboard의 구성은 아래와 같다.

![](/attachments/cockroachdb/cockroach-20-metrics-overview.png)

화면의 맨 위에는 Graph, Dashboard, 그리고 시간을 선택할 수 있는 메뉴가
나오고, 화면 오른쪽에는 Cluster 요약정보와 이벤트 정보를 표시하고 있다.
중앙의 그래프는 각 Dashboard 마다 정해진 Metrics를 보여주는데, 맨 첫
페이지인 Overview에서는 SQL Queries, Service Latency, Replicas per Node,
Capacity의 네 가지 지표를 표시해준다. 각 지표 그래프 제목 옆의 (i)
부분에 마우스 포인터를 가져가면 팝업으로 각 지표의 설명을 볼 수 있다.

선택 메뉴의 Graph 부분은, 클러스터 전체에 대한 값을 볼 것인지, 개별
Node의 값을 따로 볼 것인지 선택할 수 있고, Dashboard 부분은 어떤 지표를
볼 것인지 Category 별로 선택할 수 있다. 마지막 시간 부분은 그래프에
표시할 기간을 10분, 1시간, 6시간, 12시간, 1일, 1주, 1개월 중에서 고를 수
있게 해주며, 좌/우 화살표를 이용해서 과거 조회가 가능하다. (Kibana 등과
같이 그래프를 긁어서 특정 기간을 확대하거나... 그런 것은 안 되네...)

![](/attachments/cockroachdb/cockroach-21-cluster-events.png)

위 화면은 오른쪽 화면의 "View All Events"를 클릭했을 때 나오는 화면인데
클러스터에서 발생한 모든 Event를 상세하게 보여준다.

어떤 특정 영역의 Metrics를 자세히 보고 싶다면 Dashboard 선택을 통해 뷰를
전환할 수 있는데, 지원하는 Dashboard는 아래와 같다.


Runtime Dashboard
: 전체 시스템의 기계적 동작 상황에 대한 지표  
  *Live Node Count,
  Memory Usage,
  Goroutine Count,
  GC Runs,
  GC Pause Time,
  CPU Time,
  Clock Offset 등*

SQL Dashboard
: SQL 접속과 통신량, 질의 수행 상태에 대한 지표   
  *SQL Connections,
  SQL Byte Traffic,
  SQL Queries,
  Active Distributed SQL Queries,
  Active Flows for Distributed SQL Queries,
  Service Latency: SQL, 99th percentile,
  Service Latency: SQL, 90th percentile,
  Service Latency: DistSQL, 99th percentile,
  Service Latency: DistSQL, 90th percentile,
  Execution Latency: 99th percentile,
  Execution Latency: 90th percentile,
  Transactions,
  Schema Changes 등*

Storage Dashboard
: 저장공관과 관련된 일반 지표
  Capacity,
  Live Bytes,
  Log Commit Latency: 99th Percentile,
  Command Commit Latency: 99th Percentile,
  RocksDB Read Amplification,
  RocksDB SSTables,
  File Descriptors,
  RocksDB Compactions/Flushes,
  Time Series Writes,
  Time Series Bytes Written 등

Replication Dashboard
: 데이터 복제 작업에 대한 지표
  Ranges,
  Replicas per Store,
  Leaseholders per Store,
  Logical Bytes per Store,
  Replica Quiescence,
  Range Operations,
  Snapshots 등

Distributed Dashboard
: 클러스터 구성 및 상호 작용에 대한 지표로 보이는데, 정확하지 않다.
  Batches,
  RPCs,
  RPC Errors,
  KV Transactions,
  KV Transaction Restarts,
  KV Transaction Durations: 99th percentile,
  KV Transaction Durations: 90th percentile,
  Node Heartbeat Latency: 99th percentile,
  Node Heartbeat Latency: 90th percentile 등
 

Queues Dashboard
: 각종 대기열에 대한 정보가 표시되는데, 아직 의미파악을 하지 못했다.
  Queue Processing Failures,
  Queue Processing Times,
  Replica GC Queue,
  Replication Queue,
  Split Queue,
  GC Queue,
  Raft Log Queue,
  Raft Snapshot Queue,
  Consistency Checker Queue,
  Time Series Maintenance Queue,
  Compaction Queue 등

Slow Requests Dashboard
: 느린(느리게 처리된) 요청에 대한 지표(인데, 로그는 어디 있을까...)
  Slow Distsender Requests,
  Slow Raft Proposals,
  Slow Lease Acquisitions,
  Slow Command Queue Entries 등

스크롤의 압박을 피하기 위해 각각의 화면은 맨 아래에 붙여 두었다. (이미
많이 쓸어 내렸다 아이가...)


### Databases

Metrics 다음은 Databases에 대한 정보를 표시하는 메뉴가 있다. 화면 구성은
아래와 같고, Tables에 대한 정보와 Grants에 대한 정보를 따로 볼 수 있다.

![](/attachments/cockroachdb/cockroach-31-databases-tables.png)

전체적으로 Database의 크기가 얼마인지, 테이블이 몇 개나 있는지 등에 대한
표가 표시되고, 테이블 이름을 클릭하게 되면 아래와 같이,

![](/attachments/cockroachdb/cockroach-32-databases-table.png)

선택한 테이블에 대한 상세 정보를 보여주게 된다. (이 경우는 `eventlog`라는
테이블을 선택한 경우) 테이블 상세 정보에는 테이블 스키마와 허용된 접근
정보가 표시된다.

보기를 Grants로 바꾸면, 아래와 같이 Database에 대한 접근 권한을 보여주는
화면을 볼 수 있다.

![](/attachments/cockroachdb/cockroach-33-databases-grants.png)



### Jobs

마지막 메뉴는 Jobs다. 무슨 잡을 어떻게 돌릴 수 있는지는 나중에 봐야
알겠지만, 아무튼 수행했거나 할 예정이거나 진행중인 작업은 여기에
표시된다.

![](/attachments/cockroachdb/cockroach-40-jobs.png)



### 기타: Node 정보

에구구 숨차다. 위의 메뉴에 직접 표시되어 있는 것들 외에도 특정 메뉴에
속해있지 않은 페이지가 몇 개 있다. (메뉴가 하일라이트 되지 않는 화면)

먼저, 맨 첫 화면, Overview에서 Node를 클릭해주면, 아래와 같은 개별 노드의
상세 정보를 확인할 수 있는 화면을 볼 수 있다.

![](/attachments/cockroachdb/cockroach-51-node-details.png)

이 화면에서 View Logs를 클릭하거나 Overview의 목록에서 Logs를 클릭하면
개별 Node의 로그를 확인할 수 있는데...

![](/attachments/cockroachdb/cockroach-52-node-logs-cluster.png)

클러스터 구성을 한 상태에서 이걸 봤더니, 위와 같이 아무것도 보여주지 않았다.
나름 민감한 정보라서인지... 좀 Verbose한 정보여서인지, 기본으로 설정한
클러스터 상태에서는 나타나지 않는다.  
반면에, 맨 처음 하나의 기계에 하나의 인스턴스를 올렸을 때에는 아래와 같이
로그를 확인할 수 있었다.

![](/attachments/cockroachdb/cockroach-52-node-logs-local.png)


---

아... 숨차다.

이 글은, 앞에서 생략했던 각각의 Dashboard 화면을 보는 것으로 마무리하려고
한다. 설치하는 과정과 설치 과정에서 만든 설치 스크립트에 대한 내용은 다음
글에서 다뤄보려고 한다.


### 참고자료 1: Links

* [CockroachDB](https://www.cockroachlabs.com/)
* [CockroachDB@Github](https://github.com/cockroachdb/cockroach)
* [CockroachDB Docs](https://www.cockroachlabs.com/docs/stable/)


### 참고자료 2: Dashboards

#### Runtime Dashboard

![](/attachments/cockroachdb/cockroach-22-metrics-runtime.png){:.bordered.dropshadow}

#### SQL Dashboard

![](/attachments/cockroachdb/cockroach-23-metrics-sql.png){:.bordered.dropshadow}

#### Storage Dashboard

![](/attachments/cockroachdb/cockroach-24-metrics-storage.png){:.bordered.dropshadow}

#### Replication Dashboard

![](/attachments/cockroachdb/cockroach-25-metrics-replication.png){:.bordered.dropshadow}

#### Distributed Dashboard

![](/attachments/cockroachdb/cockroach-26-metrics-distributed.png){:.bordered.dropshadow}

#### Queues Dashboard

![](/attachments/cockroachdb/cockroach-27-metrics-queues.png){:.bordered.dropshadow}

#### Slow Requests Dashboard

![](/attachments/cockroachdb/cockroach-28-metrics-slow-requests.png){:.bordered.dropshadow}


---

[DBMS]:/tags/dbms
[클라우드 컴퓨팅]:/tags/cloud-computing
[오픈소스]:/tags/open-source

### 함께 읽기

CockroachDB 맛보기 묶음글은 다음과 같습니다.

* _CockroachDB 안녕?_
* [CockroachDB 클러스터 구성하기]
* [CockroachDB Architecture]
* [CockroachDB 클러스터 설치 스크립트]
* [CockroachDB 클러스터 가용성 시험]

[CockroachDB 안녕?]:{% link _posts/cloudcomputing/2018-09-20-say-hello-to-cockroachdb.md %}
[CockroachDB 클러스터 구성하기]:{% link _posts/cloudcomputing/2018-09-21-setup-cockroach-cluster.md %}
[CockroachDB Architecture]:{% link _posts/cloudcomputing/2018-10-01-architecture-of-cockroachdb.md %}
[CockroachDB 클러스터 설치 스크립트]:{% link _posts/cloudcomputing/2018-10-02-cockroach-cluster-setup-script.md %}
[CockroachDB 클러스터 가용성 시험]:{% link _posts/cloudcomputing/2018-10-08-availablility-of-cockroach.md %}
