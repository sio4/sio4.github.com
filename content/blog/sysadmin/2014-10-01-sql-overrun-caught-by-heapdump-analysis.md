---
title: Heapdump 분석 사례 - SQL 폭주
subtitle: Eclipse MAT과 Heapdump를 이용한 OOM 분석
tags: [JVM, heapdump, MAT, out of memory, Oracle, PreparedStatement]
categories: [system administration]
banner: /attachments/sql-overrun-caught-by-heapdump-analysis-culprit.jpg
date: 2014-10-01T02:28:00+09:00
---

JVM을 사용하는 웹서비스에서 OOM(Out of Memory) Exception이 발행해 서비스
불가상태가 된 상황에서 JVM Heapdump를 받아 OOM 발생 원인을 분석한 사례에 대한
이야기이다. 안타깝게도 스크린샷을 충분히 확보하지 못해 내용이 좀 부실하다.
어쨌든, JVM 기반 WAS 장애 시 Heapdump를 이용하여 OOM의 원인을 찾는 과정에
대한 간략한 예시로써 작성한다.

> 이 글은 블로그를 새롭게 정비하는 과정에서, 오래전에 공개적으로 운영했던
> 개인 Wiki에 작성했던 글을 이전해온 것입니다.
> 
> 생각해보면, SQL 문에 대한 Validation을 수행하는 것은 Enterprise 환경 뿐만
> 아니라 DBMS를 백엔드로 한 Application 개발에서는 너무도 당연한 일이어서
> 이런 문제가 있었다는 것이 좀 안타깝습니다. 한편, 시간에 쫓기는 실무환경이
> 여전하다면 아직도 이런 일들이 벌어지고 있지는 않을까 하는 생각도 드네요.
> :-)
{.boxed}


## 개요

Weblogic을 WAS로 사용하는 웹서비스 중 하나에서 OOME가 발생했고, 서비스가 전면
불가한 상황이 되었다. 서비스 복구를 위해 WAS를 재시작해야 했으나, 시간이 조금
더 걸리겠으나 원인 분석을 위해 재시작 전에 JVM Heapdump를 받아 분석을 시도했다.

## 분석 과정

1. 메모리 분석 도구로 Leak Point를 찾아
1. 해당 부분의 Memory 내부 상태(Class, Instance, Variables 등) 정보를 추적
   (추적의 상세 내용은 좀 길어지므로 다음 기회에)

### 도구

* Eclipse Memory Analyzer (MAT) http://www.eclipse.org/mat/
   * SAP, IBM 이 기여하고 있는 Eclipse 기반의 JVM 분석도구
   * Standalone 형태의 배포를 받으면 쉽게 사용 가능
   * 근래에는 JVM 관련 분석을 할 때에는 이것만 쓰고 있음

> MAT 강추!!!  
> MAT을 사용해보지 않은 사람은 있어도 한 번만 쓴 사람은 없다!
{.comment}

## 간략한 분석 과정 및 결과

* Heap 사용량 정보를 이용하여 (비정상적으로) 많은 메모리를 사용하는 Object 선별
* 전체 WAS Heap 영역 994.4MB 중 922.3MB, **92.7%를 하나의 Object가 사용**
   * 해당 Object는 SQL Query의 결과를 저장하는 `ResultSet` Object임.
   * `ResultSet`은 내부적으로 DBMS가 Return한 Row를 담고 있고,
     각각의 Row Object는 다시 Colume 정보를 담은 Object를 거느리고 있음.
   * 문제의 `ResultSet`는 545K개의 Row Object를 가지고 있는데, 그 개수가 너무
     많아 OOM을 유발함.
* 문제의 `ResultSet` Object는 **연계된 SQL Statement 정보를 담은 Object**와
  연결되어 있음.
   * 이 SQL Statement를 추적하면 어떤 SQL문의 결과인지 추적이 가능
* 해당 SQL문 자체는 복잡한 것이 아니었으나, 문제는 마지막의 조건절에 있었음
   * 이 SQL문은 **Bind 변수를 사용하는 `PreparedStatement`**
   * Statement 내용 상, 1개의 매개변수 필요
* 문제의 SQL 문은 특이점이 없으므로 전달된 bind 변수 확인 필요
   * 해당 Object의 Child 중에는 `parameterList` Object가 있으며, bind 변수는
     이곳에 담겨있음 (String의 Array)
   * 문제의 **`parameterList`는 길이가 `0` 이었음!**
   * 결과적으로, `WHERE` 절 없는 `SELECT` 수행!!!
* Oracle에서, Prepared Statement가 Bind 변수 없이 실행되는 경우,
  **SQL 문은 Error 없이 수행되나, 예상 불가능한 결과가 나올 수 있다고 함**.

![범인](/attachments/sql-overrun-caught-by-heapdump-analysis-culprit.jpg)


## 해결 방안

* Application에서 SQL 문 실행에 앞서 Parameter에 대한 Assertion/Validation 수행
   * Null 허용 여부: 꼭 필요한 값인지
   * 잘못된 타입: 가령, 숫자여야 하는 자리에 문자가 온 경우
   * 유효한 값: 월, 시, 분처럼 모든 정수가 아닌 특정 범위가 정해진 경우
   * SQL 실행 Validation은 DB 무결성 및 보안 관점에서도 중요한 것이므로
     반드시 적용해야 함
* 일반적인 개발 과정에서,
   * UI 상의 조건 설정을 믿고 백엔드를 느슨하게 구성해서는 안됨
   * 순방향 사고 습관은 Edge를 놓치기 쉬움. Edge 케이스에 대한 Unit Test 필수
* 부가적인 접근 (안전장치일 수 있으나, 원천적인 해결방법은 아님)
   * `LIMIT` 설정 또는 Pagination 처리로 SQL 수행 자체의 결과 용량 제한
   * Fetch Size를 조절하여 한 번에 모든 결과를 가져오지 않도록 처리

