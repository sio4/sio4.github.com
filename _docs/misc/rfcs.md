---
title: RFC Memo - 외울 수는 없잖아
subtitle: 가끔 써서 자주 까먹는 유용한 규칙들
categories: misc
date: 2017-11-23T14:00:00+0900
last_modified_at: 2017-11-23T14:00:00+0900
---
RFC 문서에서 알아두면 좋은 키워드만 뽑아서 정리합니다. 외울 수도 없고,
그때 그때 찾아보기 귀찮은 것들

* TOC
{:toc}


# Network

## RFC 5737 - IPv4 Address Blocks Reserved for Documentation

* <https://tools.ietf.org/html/rfc5737>

RFC 5737에서는, 우리가 문서를 작성할 때 사용할 수 있는 IP 블록을 정의하고
있다. 많은 문서들이 예제를 기술할 때, 누군가에게 할당된 Public 주소를 쓸
수 없으니 그냥 단순하게 192.168.0.0/16, 10.0.0.0/8 등의 Private 대역을
사용하는 경우가 많지만 바람직하지 않다. (오해가 생기는 경우도 봤고...)

#### 3. Documentation Address Blocks

The blocks 192.0.2.0/24 (TEST-NET-1), 198.51.100.0/24 (TEST-NET-2),
and 203.0.113.0/24 (TEST-NET-3) are provided for use in
documentation.


