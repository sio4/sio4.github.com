---
redirect_from: /blog/2010/07/08/emc-to-acquire-greenplum/
title: "EMC, 데이터 분석 전문업체 그린플럼 인수"
tags: DBMS EMC Greenplum PostgreSQL cloud-computing
categories: ["cloudcomputing"]
date: 2010-07-08T10:10:29+09:00
modified: 2011-03-04T13:50:02+09:00
---
이미 오래 전에 가상화 분야의 선두업체인 VMWare를 인수한 바 있는 EMC가 이번엔
대용량 자료 분석 전문업체인 [그린 플럼](http://www.greenplum.com/)을
인수한다고 한다. 이미 주류로 돌아서고 있는 클라우드 컴퓨팅이라는 패러다임의
변화에 공격적으로 대응하는 모습.

[IDG - World Best Tech Portal](http://www.idg.co.kr/newscenter/common/newCommonView.do?newsId=62057&parentCategoryCode=0100&categoryCode=0000&searchBase=DATE&listCount=10&pageNum=1&viewBase=ITC)

> EMC가 데이터 분석 전문업체 그린플럼을 인수한다. 인수 조건은 공개되지 않았으며, EMC는 그린플럼의 데이터 웨어하우징 기술을 이용해 새로운 사업부를 구성할 계획인 것으로 알려졌다.

![](/attachments/2010-07-08-greenplum.png){:.fit}

그린플럼은 MPP, Massively Parallel Processing을 지원하는 Data Warehousing,
DBMS 솔루션 등을 중심으로 기업 환경을 위한 대규모 자료 분석 플랫폼을
제공하는 회사이다. 이 회사의 핵심 상품인 Greenplum DB는 대표적인 오픈소스
DBMS의 하나인 PostgreSQL을 기반으로 하여 MPP를 위한 병렬처리 기능을 확장시킨
제품이다.

기존의 DBMS가 단일 기계에 모든 자료를 집중시키는데 반하여 이 병렬DB는 자료를
여러 기계에 수평적으로 분산시킴으로써 자료처리 성능을 향상시키고 단일
DBMS에서 처리할 수 있는 자료의 규모를 거대하게, 그리고 쉽게 확장시킬 수 있는
장점을 갖는다. (일반적으로 자료 안정성과 장애회피를 위하여 많이 활용되는
DBMS 클러스터/복제와는 전혀 다른 개념이다.)

세상이 점점 복잡해지고 소비자 중심 경제로 바뀜으로 인하여 기업이 다루어야
하는 자료의 양이 엄청나게 증가하는 현실 속에서, 그리고 단순한 자료의 활용이
아닌 자료로부터 유용한 정보를 얼마나 유효하게, 빠르게, 쉽게 뽑아내는지가
기업 활동의 중요한 요소가 되어가면서 이러한 대용량 자료 처리 능력의 중요성은
점점 증가하고 있으니... 충분한 가치를 지닌 솔루션, 기업임에는 틀림이 없는 것
같다.

[Greenplum: Open Source Data Warehouse](http://www.datawarehousesolution.net/greenplum-open-source-data-warehouse/Data_Warehouse_for_Beginners)

> In 2005, Greenplum released an enterprise-level massively parallel processing (MPP) version of PostgreSQL called Greenplum Database. Greenplum Database is the industry’s first massively parallel processing (MPP) database server based on open-source technology. It is explicitly designed to support business intelligence (BI) applications and large, multi-terabyte data warehouses.

[Greenplum Single-Node Edition — sometimes free is a real cool price \| DBMS2 -- DataBase Management System Services](http://www.dbms2.com/2009/10/19/greenplum-free-single-node-edition/)

> For example, comparing PostgreSQL-based Greenplum with PostgreSQL itself, Greenplum offers:
> 
> - The ability to scale out queries across all cores in your box (and no, pgpool is not a serious alternative)
> - Storage alternatives such as columnar (I am told that EnterpriseDB recently stopped funding a project for a PostgreSQL columnar option)

이번 인수합병에 관한 공식 발표:

[EMC to Acquire Greenplum](http://www.emc.com/about/news/press/2010/20100706-01.htm "[http://www.emc.com/about/news/press/2010/20100706-01.htm]로 이동합니다.")

암튼, 세상이... 점점 어려워지네... 힘들어...

