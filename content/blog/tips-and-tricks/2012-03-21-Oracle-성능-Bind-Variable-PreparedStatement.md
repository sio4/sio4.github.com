---
redirect_from: /entry/oracle-performance-bind-variable-preparedstatement/
title: Oracle 성능, Bind Variable, PreparedStatement
tags: ["DBMS", "Oracle", "performance"]
categories: ["tips-and-tricks"]
date: 2012-03-21T13:12:53+09:00
lastmod: 2012-03-21T13:13:07+09:00
---
매번 볼 때 마다 까먹으니깐 일단 기록.
<!--more-->

한참 옛날 이야기지만, 어떤 여성 포털에 당시 일하던 회사에서 서버를
납품한 적이 있었다. LVS로 엮은 웹서버가 한 다섯 대 정도 있었고,
DB서버가 8way 였던가? 한 대 들어갔다. 웹 개발 회사에서 납품한 PHP기반의
웹서비스가 돌아가기 위한 환경이었는데, 웹서버는 놀고 있는데 DB 서버의
Load가 50까지 차 올라갔다. (물론, 사이트가 꽤 떴었고, 사용자의 폭발적
증가가 근원적 문제였다. 문제 아닌가? 암튼,)

결국, 여기 저기 파해쳐본 결과, 일단 PHP로 개발된 웹 Application이 수준
이하였던 것이 가장 큰 이유였고, (세션 관리의 부재, 과다한 DB Query 발생
등등) 그 다음은 사용하는 SQL문이 Bind Variable을 사용하지 않는 RAW
Statement(어떤 전문 용어가 있는지는 모르겠다.)였다는 것.

일단, PHP의 세션 기능을 이용하도록 Application을 수정하고, DBMS 연동을
위한 shared code를 만들어 사용하게 했고, SQL문을 Bind Variable을
사용하도록 수정했다.

말할 것도 없지만, 결과는 엄청난 Load 감소.

이 과정에서 문제는... DBA들은 문제가 해결되기 전까지 그냥... 시종 일관,
DB에는 문제가 없다는 말만 반복했다는 아픈 기억. 그렇지... SQL 문법
오류도 없고 그냥 부하가 많았던 거였지... ㅎ

세월도 흐르고, 장소도 다르지만, 이 오래된 문제는 지금도 있는 듯. 역시,
일단 서버 성능 문제가 부각되겠지만... 암튼, 용어를 기억해두려고.

> - Bind Variable, PreparedStatement  
> - 임시 방편으로, `init{SID}.ora` 파일에서 `CURSOR_SHARING=FORCE` 설정  
> - DSS나 QUERY REWRITE를 사용할 때에는 사용하지 말라고 함.

```sql
prompt
prompt * SQL문 parsing time 구하기
prompt
SELECT NAME, VALUE 
FROM V$SYSSTAT
WHERE NAME = 'parse time cpu'
	or NAME = 'parse time elapsed'
	or NAME like 'parse count%';
```

뭐 일단, 여기까지.

