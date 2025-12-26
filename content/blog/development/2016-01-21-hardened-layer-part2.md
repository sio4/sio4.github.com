---
title: Hardened Layer, SoftLayer Custom Portal - Part 2
series: Hardened Layer
images: [/attachments/20160121-hl-v1-dashboard.png]
banner: /attachments/20160121-hl-v1-dashboard.png
tags: ["hardened-layer", "SoftLayer", "cloud-computing", "emberjs", "semantic-ui", "d3js"]
categories: ["development"]
date: Thu, 21 Jan 2016 01:35:31 +0900
---
이 글에서는, 앞서 작성한 Ember.js 기반의 Console App을 조금 다듬으면서
Console App의 방향을 다시 명확하게 잡고, 이 과정에서 Semantic UI를
적용하여 보다 보기 좋게 만드는 과정을 기록하였다. 또한, 시각적인 데이터
표현에 대하여 고민하여, 내 비용이 주로 어느 자원에 의하여 나가고 있는지
직관적으로 확인할 수 있도록 Billing 자료에 시각화를 적용해 보았다.
<!--more-->

![Hardened Layer Console: Dashboard](/attachments/20160121-hl-v1-dashboard.png "Hardened Layer Console: Dashboard")
{.fit .dropshadow}

앞선 [글][HardenedLayer-Part1]에서는 **Ruby on Rails를 이용하여 API App**을
만들고, API App이 제공하는 API를 이용하여 SoftLayer에 Deploy된 VM 등의
자원을 열람하는 기능을 제공하는 **Ember.js 기반의 Console App**을 간단하게
만들어 보았다.

Part 1에서는 주로 두 Application 간의 통신과 데이터에 집중하기 위하여,
실질적인 사용자 관점의 부분은 전혀 다루어지 못했다. 이번 글에서는 이 두
App을 조금씩 다듬어서, 사용자 관점에서 Console을 보다 사용하기 편하게
바꿔보고, 이 Console을 통하여 사용자가 시각적인 Insight를 얻을 수 있도록
하는 과정에 대하여 다루려고 한다.

> {{< series >}}
{.boxed}

[HardenedLayer-Part1]:{{< relref "/blog/development/2016-01-16-hardened-layer" >}}



# Console UI의 개선 방향

그 대상이 무엇이든, 개선의 시작은 "**너는 누구여야 하는가?**", "**너는
현재 누구인가?**" 그리고 "**너를 어떻게 바뀔 수 있는가**"에서 시작한다.

## Console Application은 무엇인가?

Cloud Computing 서비스의 Console Application은 우리가 Cloud 위에 뭔가를
던져 올리는 과정과, 이미 올려놓은 Instance 들의 상태를 파악하고 또한
그것들이 계속 잘 지내도록 관리하기 위한 관리도구이다. 그래서, 이 App은
다음과 같은 요구사항을 만족시켜야 한다.

* 잘 보여야 한다.
* 정확하게 보여줘야 한다.
* 동시에, 빠르게 반응해야 한다.
* 그 이상의 도움을 줘야 한다.

보통은, 자원들의 전반적인 모습을 잘 보여줘야 하며, 가끔은 개별적인
자원의 세세한 내용을 보여줄 수도 있어야 한다. 그리고 이와 함께, 각
자원이 연결되었을 때 나타나는 2차적인 모습도 잘 보여줘야 한다.
다시 말해서, 폭과 깊이를 갖추어야 하고, 가끔은 2차원, 3차원적인
데이터를 표현해야 할 수도 있다.

Console은 그 자체가 대상이 아니라 **대상을 투영한 일종의 상황판,
지도**와 같다. 따라서, 이를 통하여 관찰하고자 하는 대상의 상태나
속성을 있는 그대로 정확하게 보여줘야 한다. 데이터를 믿을 수 없다면
Console은 상황판이 아닌 게임판이 된다.

또한 Console은 우리가 **대상을 다루는 조종간**과 같은 역할을 한다.
우리가 방향전환을 원할 때, 생각의 속도만큼 빠르게 반응하여 원하는
시점에 동작이 일어나줘야 한다. Client 측의 속도도 중요하지만, 이를
위하여 Server 측 역시, 불필요하게 바빠서는 안되며 항상 사용자의
요청에 빠르게 대응하기 위하여 쉬고 있어야 한다.

정확하게 잘 보여주고 잘 동작하는 것은 매우 기본 기능이다. 이렇게
"기본적인 Console"이 아닌 "유용한 Console"이기 위해서는, **사용자를
좀 더 편하게 돕는 무언가**가 필요하다. 예를 들면, 앞으로의 자원 추이를
예측 가능하도록 해준다든지, 더 저렴하게 사용할 수 있는 방법을 안내해
준다든지, 이런 것들이 있어야 사용자에게 이쁨을 받을 수 있다.

이런 요구사항들은, 자동차로 치자면, 적당한 위치에 장착된 계기판이
정확한 속도와 남은 기름의 양을 보여주고, 내가 조향타를 돌리거나
브레이크를 밟으면 즉각적으로 반응하고, 또한 이와 함께 목적지까지
빠르게 갈 수 있는 길을 안내하거나 저렴한 주유소를 알려주는 등의
기능도 있어야 한다는 뜻이다. (너무나 당연하지 않은가?)

## Web Application은 어떻게 변하고 있는가?

과거, Client-Server 시대에서 Web Application 시대로 넘어오면서 Client를
늘 최신으로 유지하는 등의 관리적 노력을 '0'에 가깝게 줄이고, 모든 개발
투자를 Server-side에 집중할 수 있게 되었다. 그러나, 이 과정에서 Web이
가지는 장점을 수용하는 것에 치우치면서 본래 Client가 가져야 할 특성이
상당 부분 무시된 것이 사실이다.

Web은 특성 상, Page 단위로 데이터의 표출과 동작이 이루어지며, 각 Page는
서로 독립적으로 동작하게 된다. 또한, 이러한 페이지는 각 페이지가 표시되는
시점에 Server에게 Request를 보내고 받아지는 과정이 매번 일어나는 방식이
일반적이며, 이로 인한 Page 전환 시 일정 부분의 지연을 피할 수 없다.

Web의 치명적인 장점에서 벋어날 수 없었던 Web Application 개발자들은, 이런
태생적 한계를 극복하기 위하여, 동일 사용자가 여러 Page를 오가며 작업하는
과정을 동일한 Session에 묶어주기 위한 인증/Session 등의 관리를 적용하고
또한, 페이지 전환 속도나 응답속도 등의 개선을 위하여 다양한 각도로 Cache
기술을 활용하는 등, Web  Application을 쓸만하게 만들기 위한 여러 기술을
개발하고 적용해 왔다. 예를 들면, 다음과 같은 것들이다.

* Cookie와 WAS 기반의 Session 관리
* Web/WAS/DBMS Server 측의 Cache 기술
* Rich Internet Application이라고 불리는 Client 측의 변화
* Browser Cache나 Local DBMS를 활용하는 기술
* HTTP Protocol 자체의 개선
* Browser 측의 MVC Framework 개발

열거할 수도 없이 많은 기술들이 있겠지만, 내가 이 Console App에 적용하려고
하는 기술의 핵심은 Browser 측에서 동작하는 Javascript 기반 MVC Framework
기술이다.

## Web 기반의 Console App은 어떻게 만들어야 할까?

앞서 설명한 바와 같이, Console App의 기능 중, 중심이 되면서 사용자가 가장
많이 사용하게 되는 기능은 바로 계기판으로써의 역할이다. 얼마나 많은 자원이
생성되어 운영되고 있는지를 볼 수 있어야 하고, 개별 자원의 구성에 대한 상세
정보를 알 수 있어야 한다. 또한, 관리적인 측면에서 이들을 적절하게 분류하여
볼 수도 있어야 한다.

실제로 시스템의 운영 과정에서 **가장 많은 시간을 소비하는 일이 이러한 구성
정보를 포함한 자원의 상태를 파악하고 그 속에서 의미있는 정보를 끌어내는
일**이다. 이 때, 상당 부분의 데이터는 상당 기간 동안 혹은 영원히 변하지
않는 정적인 데이터이며, 시스템의 상태정보 등 일부 데이터는 순간적인 값만
의미를 갖는 동적인 데이터인 경우도 있다.  또한, 사용자가 어떤 조작을
지시하였을 때, 그 수행의 결과로 반환하는 값은 실시간성, 정확성과 함께
반응속도가 중요하기도 하다.

이렇게 혼합된 성격의 데이터들을 각각의 성격에 맞게 다뤄줄 수 있는 기술이
적용되어야 "정확하고 빠르게, 잘 동작하는 Console"이 될 수 있다.

### 반응속도와 데이터 다루기

앞서 설명한 바와 같이, Console에서 다뤄지는 데이터는 정적인 특성을 갖는
데이터가 대부분이다. 그러나, 이들을 보는 방식은 정적이지 않다. 필요에
따라, 목록을 보다가 상세화면을 보는 동작이 반복적으로 일어나기도 하고,
하나의 목록을 서로 다른 여려 항목을 기준으로 정렬하여 보기도 한다.
또한, 특정 속성을 갖는 데이터만 추려서 보거나 연관된 다른 데이터를 찾아
돌아다니기도 한다. 마치, Excel과 같은 Spreadsheet로 데이터를 다루는
모습과 유사하다.  
(실제로, Console이 이런 기능을 지원하지 않는다면 사용자는 아마도 전체
데이터를 Download하여 Excel 등의 도구로 보고자 할 것이다.)

만약, 위의 동작을 제공하기는 하지만, 그 동작이 Server 측에 의존하여
이루어진다면, 예를 들어, 정렬을 위해 특정 버튼을 눌렀을 때, 이것이
서버에 Request를 만들어내고, 서버에서는 데이터를 정렬값과 함께 다시
Query하고 그 결과를 다시 사용자에게 보내게 된다면 어떤 일이 발생할까?

* 최종적으로, Browser는 순서만 바뀐 동일 데이터를 한 번 더 받게 됨
* 중간의 Application 서버는 사용자의 클릭에 따라 매우 바쁘게 움직임
* 최종 DBMS 등도 역시 사용자와 Interaction하기 위해 바쁘게 움직임

이런 구조 속에서는 Server 측 부담도 커질 뿐만 아니라 사용자 응답속도를
보장하는 것은 불가능에 가까워진다.

그래서 Hardened Layer의 Console App은 Javascript 기반의 Client MVC
방식을 선택하였다.

### Javascript MVC Framework

MVC Framework이란, Application을 구조화하는 방법 중 하나로, 기존의
연관된 기능 또는 데이터 중심의 Module화와는 다르게 대상을 Model,
View, Control로 구조화하여 각각 데이터 관리, 화면 등의 표출, 그리고
데이터 처리 영역으로 나누어 개발하는 방법론이다. Ruby on Rails 등,
근래의 많은 Framework 들이 MVC 또는 이와 유사한 형태를 띄고 있다.

과거 Client-Server 모델에서는 대체로, Server 측에서 데이터 저장과
함께 DBMS의 Stored Procedure 등을 이용하여 일부 데이터 처리를 맡고
Client에서는 화면 표출과 업무 기능(Biz. Logic)를 담당하고 있었으나,
Web Application 시대로 넘어오면서 Client(Web Browser)는 View 만을
담당하고 거의 모든 데이터 처리를 Server 측에서 처리하고 있다.
이러한 역할 배치 구조에서 Framework은, Server 측에 Runtime 형태로
존재하게 된다.

반면에, Web Browser에 내장된 Javascript Engine에 서버로부터 내려받은
Runtime Code를 얹는 방식의 Framework인 Javascript MVC Framework은,
다시 Application의 구동 위치를 Client 측으로 돌려 놓았다.

그 결과, Web Application의 중앙집중식 App 배포/관리 특성을 유지한
채 Server 측 업무 부하를 줄이고 동시에 Client 측의 반응속도를 기존
Web Application에 비해 월등히 향상시킬 수 있다.

이러한 Application 구조 변화에 따른 각 기능의 수행 위치 변화를
정리하면 아래 표와 같다.

|          | C/S 구조 | Web App  | JS MVC F/W | JS MVC + RESTful DBMS |
|:--------:|:--------:|:--------:|:----------:|:---------------------:|
| 화면표출 | Client   | Browser  | Browser    | Browser               |
| 업무기능 | Client   | Svr/WAS  | Javascript | Javascript            |
| 자료 I/F | Server   | -        | Svr/WebApp | Svr/DBMS              |
| 자료보관 | Server   | Svr/DBMS | Svr/DBMS   | Svr/DBMS              |

앞서 말한 C/S 구조, Web Application, 그리고 Javascript MVC Framework
등의 추세와 함께, 근래에는 심지어 DBMS가 직접 REST 방식의 Interface를
제공하거나 이렇게 할 수 있는 방식의 Gateway 제품이 나오고 있기도 하다.

---

Web 기반 Console Application을 만들기 위해서는, 이러한 Application의
구조 변화나 그 속에 담긴 기술 특성을 반영하여 Console Application의
비기능적 요구사항을 충족시키는 것이 매우 중요하다.

Hardened Layer Prototype에서는, Google의 [AngularJS]와 함께 이 영역에서
큰 축을 이루고 있으며 현재까지 내가 경험해본 Javascript MVC 중 단연
으뜸인 [Ember.js]를 활용하여 Client 측 MVC를 적용하였으며, 이를 통하여
다음의 요구사항을 만족시켰다.

* 정적 데이터에 가까운 서버의 구성정보 등은 서버로부터 세션 초기에
  1회 읽어들인 후, 변경이 없는 한 다시 요청을 보내지 않는다.
* Object의 목록을 열람할 때, Filter 처리나 Order 처리 등을 별도의
  추가 요청 없이 Client에 구조화된 Model 기반으로 수행한다.
* 서버 목록, VLAN 목록 등 다른 분류의 데이터 목록 또는 상세로 View를
  전환하더라도 추가 요청이 발생하지 않아 View 전환에 따른 지연이
  발생하지 않는다.
* 각 Model 간 연관관계, 종속관계 등에 따라 부수적인 데이터를 동일
  화면에 표출할 수 있고, 연결고리를 통한 화면 이동이 가능하다.
* (아직 구현되지 않았지만) 데이터 편집 시에도 서버측 수정은 화면
  표출과는 별도로 Background로 수행된다.

[Ember.js]에 대한 자세한 얘기는 나중에 기회가 되면 다시 보기로 한다.




# UI 풍성하게 하기

[Ember.js]는 Client MVC 개발 모델을 제공하기는 하지만, 아쉽게도 UI를
아름답거나 사용하기 좋게 해주는 "꾸밈"은 어디에도 없다. 참 꾸밈없는
Framework이다.

그래서, 화면 표출의 다양함을 위해서는 다른 도구의 도움이 필요한데,
Semantic UI, EsTable, Moment.js 등, 이번 프로젝트에 적용한 몇가지
도구에 대하여 설명하려고 한다.

## Semantic UI 적용

[Semantic UI]는 Javascript 및 CSS로 구성된 UI 도구이다. [Semantic UI]는
Menu, Accordion, Button, Tab 등의 UI Widget과 잘 정돈된 Look&Feel을
제공하는데, 그 스타일이 큰 틀에서 나의 기호와 잘 맞아 떨어져서 지난
겨울부터 즐겨 사용하고 있다.

특히, Semantic UI는
[Ember Addon](https://github.com/Semantic-Org/Semantic-UI-Ember)을
제공하고 있어서 비교적 쉽게 Ember App에 Integration하는 것이 가능하다.
(단, 일부 기능은 Ember의 특성과 맞지 않는 부분이 있어서 현재는 제공되지
않으며, 날코딩 구현에 비해 구현 수준이 떨어지는 부분도 있다.)

Ember App에 [Semantic UI]를 적용하는 과정을 간단히 설명하면 다음과 같다.

```console
$ ember install semantic-ui-ember
version: 1.13.13
Installed packages for tooling via npm.
installing semantic-ui-ember
  install bower package semantic-ui
Installing browser packages via Bower...
  not-cached git://github.com/Semantic-Org/Semantic-UI.git#*
  resolved git://github.com/Semantic-Org/Semantic-UI.git#2.1.6
Installed browser packages via Bower.
Installed addon package.
$ 
```

위와 같이, `ember` 명령의 `install` 부명령을 이용하여 쉽게 Addon을
설치하는 것이 가능하다. 이 명령을 내리면, 위의 출력이 말해 주듯이,
내부적으로 `npm`, `bower` 등의 명령이 작용하여 원격의 Repository에
위치한 Addon Package를 내려받아 자동으로 설치해준다.

이렇게 설치된 Semantic UI는 아래와 같은 형식으로 사용하게 된다.

`app/templates/application.hbs`
{.block-title}

```handlebars
{% raw %}
{{#ui-sidebar class="inverted vertical menu"}}
    {{link-to 'Home' 'index' class='item'}}
    {{link-to 'Dashboard' 'dashboard' class='item'}}
    {{link-to 'Account' 'accounts' class='item'}}
    {{link-to 'Servers' 'servers' class='item'}}
    {{link-to 'Virtual Servers' 'virtual-servers' class='item'}}
    {{link-to 'Bare Metal' 'bare-metal-servers' class='item'}}
    {{link-to 'Image Template' 'image-templates' class='item'}}
    {{link-to 'Open Tickets' 'open-tickets' class='item'}}
    {{link-to 'Users' 'users' class='item'}}
    {{link-to 'Virtual Disks' 'virtual-disk-images' class='item'}}
    {{link-to 'VLANs' 'network-vlans' class='item'}}
{{/ui-sidebar}}

<div class="ui top fixed inverted small menu">
    <a class="launch icon item" onClick="$('.ui.sidebar').sidebar('toggle');"
        ><i class="content icon"></i></a>
    <a class="active red item">Hardened Layer</a>
    <a class="item">{{currentPath}}</a>
    <div class="right menu">
        <a class="ui item">Logout</a>
    </div>
</div>

<div class="ui grid pusher">
{{outlet}}
</div>
{% endraw %}
```

첫 단락은 Ember Addon을 이용하여 Component 방식으로 Sidebar를 구현한
것이고, 다음 단락은 단순히 Semantic UI의 일반적인 적용 방식으로
해당 `DIV`가 '상단(top)', '고정식(fixed)', '반전된 색상(inverted)'의
'작은(small)' Menu UI가 되도록 구성한 예이다.


## EsTable 작성

이게 참 안타까운 상황인데, [Semantic UI]는 아쉽게도 Table 형식의
데이터 표현이 가능한 Widget을 제공하지 않는다.  그래서 관련된
자료를 찾던 중, 내 입맛에 맞는 Tutorial을 바탕으로 하여 만들어낸
도구가 바로 EsTable이다.

다시 안타까운 것이, 이게 한 1년 전에 진행했던 건이다 보니, 개발
이력이 좀 헷갈린다! 이 부분에 대한 자세한 이야기 역시 다음 기회로
넘기고, 여기서는 일단 적용된 최종 Code만을 기록으로 남기려 한다.

먼저, 다음과 같이 Mixin을 만들어 준다. Mixin이란, 마치 Addon 처럼,
특정 Class에 섞어 넣어서, 해당 Class에 기능셋을 추가할 수 있게
해주는 Ember의 기능이라도 설명할 수 있다. (상속이 계층적, 단일
Root를 갖게 되어있는 것과 달리, Mixin은 말 그대로 수평적인 섞기라도
할 수 있다.)

```console
$ ember generate mixin EsTable
version: 1.13.13
installing mixin
  create app/mixins/es-table.js
installing mixin-test
  create tests/unit/mixins/es-table-test.js
$ 
```

이렇게 생성된 틀에, 다음과 같은 Code를 삽입하였다.

```ruby
import Ember from 'ember';

export default Ember.Mixin.create({
  esFilter: '',
  esFields: ['name', 'description'],
  esSorter: ['name', 'id'],

  filteredContent: function() {
    var filter = this.get('esFilter').toString();
    var fields = this.get('esFields');

    if (this.get('sortProperties') === null) {
      this.set('sortProperties', this.get('esSorter'));
    }

    try {
      var rx = new RegExp(filter, 'gi');
    } catch(err) {
      console.log("filter error: '" + filter + "'");
    }

    return this.filter(function(content) {
      if (Ember.isBlank(filter)) {
        return true;
      }

      for (var i = 0; i < fields.length; i++) {
        try {
          var data = content.get(fields[i]);
          if (data && data.match(rx)) {
            return true;
          }
        } catch(err) {
          console.log("Error: " + err + " on " + content + "/" + fields[i]);
        }
      }
      return false;
    });
  }.property('model.[]', 'esFilter'),

  total: function() {
    return this.get('model.length');
  }.property('model.[]'),

  actions: {
    sortBy: function(property) {
      var sorter = [property].concat(this.get('sortProperties').splice(0, 2));
      this.set('sortProperties', sorter);
      this.set('sortAscending', !this.get('sortAscending'));
    },

    select: function(target) {
      this.transitionToRoute(target.get('type'), target.id);
    },
  },
});
```

이 코드를 비롯한 [Ember.js]에 대한 자세한 이야기를 할 기회는 나중에
따로 마련하겠다.

## Moment.js

[Moment.js]는 날짜와 관련된 Formatting, 또는 보다 사용자 친화적인 표출.
예를 들어, 날짜 데이터의 출력을 "어제", "1달 전" 등과 같은 자연스러운
표현으로 바꿔주는 등의 기능을 해주는 Javascript Library이다.

요즘 웹 기반 서비스에서 유행하는 방식이지만, 내가 딱딱한 사람이어서,
또는 내 App이 딱딱한 App이어서, 저 "자연스러운" 표현을 딱히 좋아하지
않는다. 다만, 해당 Library가 제공하는 날짜 Formatting 기능을 위해
다음과 같이 Addon을 설치해준다.

```console
$ ember install ember-moment
version: 1.13.13
Installed packages for tooling via npm.
installing ember-moment
  install addon ember-cli-moment-shim
Installed packages for tooling via npm.
installing ember-cli-moment-shim
  install bower packages moment, moment-timezone
Installing browser packages via Bower...
  cached git://github.com/moment/moment.git#2.10.6
  not-cached git://github.com/moment/moment-timezone.git#>= 0.1.0
  resolved git://github.com/moment/moment-timezone.git#0.4.1
Installed browser packages via Bower.
Installed addon package.
Installed addon package.
$ 
```

보는 바와 같이, `ember-moment`를 설치하면 `ember-cli-moment-shim`,
`moment`, `moment-timezone` 등이 함께 설치된다.

사실은, 위의 Addon을 사용하기 전에 `ember-cli-dates`라는 것을 먼저
시험했었다. 아래와 같이, 거의 유사한 도구들을 설치하는데, 약간의
형식만 다르다.(`npm`인지 `bower`인지)

```console
$ ember install ember-cli-dates
version: 1.13.13
Installed packages for tooling via npm.
installing ember-cli-dates
  install bower package ember-cli-moment-shim
Installing browser packages via Bower...
  not-cached git://github.com/jasonmit/ember-cli-moment-shim.git#0.0.3
  resolved git://github.com/jasonmit/ember-cli-moment-shim.git#0.0.3
  not-cached git://github.com/moment/moment.git#>=2.7.0
  resolved git://github.com/moment/moment.git#2.10.6
Installed browser packages via Bower.
Installed addon package.
$ 
```

그런데 얼마 후, App에서 다음과 같은 Deprecation Warnning이 계속 발생하는
문제가 발생했는데 추적해본 결과, 이 Addon에서 발생한다는 것을 알게 되었다.

```console
DEPRECATION: Using Ember.Handlebars.makeBoundHelper is deprecated. Please refactor to using `Ember.Helper.helper`. [deprecation id: ember-htmlbars.handlebars-make-bound-helper]
```

그래서 이 Addon을 제거하고, 앞서 말한 바와 같이 동일 기능을 제공하는
`ember-moment`로 방향을 바꾸었다.

```console
$ npm uninstall ember-cli-dates --save-dev
npm WARN uninstall not installed in /home/sio4/tmp/x/hardened-layer-ui/node_modules: "ember-cli-dates"
$ bower uninstall ember-cli-moment-shim -D
bower uninstall     ember-cli-moment-shim
bower uninstall     moment
$ 
```

---
아래 화면은, 이상 설명한 Semantic UI를 이용한 Titlebar와 Sidebar,
그리고 EsTable을 이용한 자료 Table 등이 적용된 최종 UI이다.

![Hardened Layer Console: Servers](/attachments/20160116-hl-v1-servers.png "Hardened Layer Console: Servers")
{.fit .dropshadow}

화면 위쪽의 검은 줄은 Semantic UI의 `menu`이며, Menu 왼쪽의 버튼을
누르게 되면 Sidebar가 등장하는 구조다. 화면 중앙은 EsTable에 의한
정렬과 필터링이 가능한 Table이고 왼쪽 중앙의 풍선도움말 형태의
부가 정보는 Semantic UI의 `popup`을 사용했다. Table의 "Provision Date"
열에 표시된 날짜는 Moment.js를 사용해서 Format을 변환한 것이다.




# 시각화의 힘

데이터를 분석할 때, 배열이나 Table 형태로 표현된 숫자만 가지고는
그 데이터가 갖는 의미를 찾아내기 쉽지 않을 수 있다. 반면에, 적절한
시각화가 반영되면 보다 직관적으로 데이터 속에서 정보를 찾아낼 수
있게 된다.

Hardened Layer는 기본적으로 시스템의 제어를 위한 Application이지만,
운영 또는 관리를 하다 보면, 수치화된 데이터의 분석이 필요할 때가
있다. 예를 들자면 시스템 리소스 사용량 정보 등이 가장 일반적이지만,
우리의 대상이 Cloud이므로, 여기서는 Billing 데이터를 시각화하는
시도를 해보았다.

## D3

딱히 시각화 도구를 찍고 시작한 것은 아니지만 역시 이 시대를 주름잡는
Web Client 측 시각화 도구는 [D3.js]가 아닌가 한다.

D3.js는, Data-Driven Documents를 줄여 만든 이름으로, 말 그대로 각종
수치 데이터를 막대그래프, 파이, 꺾은선그래프 등으로 표현하거나,
연결 정보를 가진 데이터의 연관관계를 시각적으로 표현하는 등의 일을
할 수 있는 Javascript Library이다.

### 후보들

Ember와 함께 사용할 수 있는 시각화 도구를 찾다보니, 대부분의 인기있는
도구는 모두 D3.js를 기반으로 하는 경우가 많았다. 그 중, `ember-e3`,
`ember-cli-chart` 등을 간단히 시험해봤으나 원하는 결과를 얻기가 쉽지
않았다.

### 현재의 선택, `ember-c3`

그나마 구상했던 모습과 비슷한 결과를 얻을 수 있었던 것 중 하나가
`ember-c3` 인데, 이 Addon을 설치하고 사용하는 방식을 잠깐 보면
아래와 같다.

```console
$ ember install ember-c3
version: 1.13.13
Installed packages for tooling via npm.
installing ember-c3
  install bower package d3
Installing browser packages via Bower...
  not-cached git://github.com/mbostock/d3.git#*
  resolved git://github.com/mbostock/d3.git#3.5.12
Installed browser packages via Bower.
  install bower package c3
Installing browser packages via Bower...
  not-cached git://github.com/masayuki0812/c3.git#*
  resolved git://github.com/masayuki0812/c3.git#0.4.10
  not-cached git://github.com/mbostock/d3.git#<=3.5.0
  resolved git://github.com/mbostock/d3.git#3.5.0
  conflict Unable to find suitable version for d3
    1) d3 <=3.5.0
    2) d3 ~3.5.12
[?] Answer: 2
Installed browser packages via Bower.
Installed addon package.
$ 
```

`ember-c3`를 설치하게 되면, 위와 같이 D3 Library가 함께 설치된다.
이제, Chart를 표현할 바탕 리소스를 만들어 준다.

```console
$ ember generate resource dashboard
version: 1.13.13
installing model
  create app/models/dashboard.js
installing model-test
  create tests/unit/models/dashboard-test.js
$ 
```

```console
$ ember generate route dashboard
version: 1.13.13
installing route
  create app/routes/dashboard.js
  create app/templates/dashboard.hbs
updating router
  add route dashboard
installing route-test
  create tests/unit/routes/dashboard-test.js
$ ember generate controller dashboard
version: 1.13.13
installing controller
  create app/controllers/dashboard.js
installing controller-test
  create tests/unit/controllers/dashboard-test.js
$ 
```

이제, 각 파일을 아래와 같이 편집하여 실제로 Chart를 그려보았다.

먼저, 화면 구성은 아래와 같다. `DIV`로 화면 배치를 한 후, 그 안에
Ember Component 형태로 `c3-chart`를 불러준다.

`app/templates/dashboard.hbs`
{.block-title}

```handlebars
{% raw %}
<div class="full-width">
{{c3-chart data=data donut=donut}}

{{outlet}}
</div>
{% endraw %}
```

이 때, `data` 값을 지정하게 되는데, 이 부분은 다음과 같이 Ember의
Controller를 통하여 지정해주면 된다. (`donut` 값 등의 지정도 아래와
같다.)

`app/controllers/dashboard.js`
{.block-title}

```javascript
import Ember from 'ember';
import config from '../config/environment';

export default Ember.Controller.extend({
  data: function() {
    return {
      url: config.SL.host + '/' + config.SL.namespace + '/billing',
      mimeType: 'json',
      type: 'donut',
    };
  }.property('model.[]'),

  donut: {
    title: 'Billing Distribution',
  },
});
```

위의 코드에 의한 결과물은 아래 화면과 같다. 이 도넛형 그래프는
Deploy된 각 자원의 비용 분포를 시각적으로 표시하여, 각 자원 별로
전체 비용에 대한 비율을 표시해준다.

![Hardened Layer Console: Dashboard](/attachments/20160121-hl-v1-dashboard.png "Hardened Layer Console: Dashboard")
{.fit .dropshadow}


# 맺음말

이상으로, Hardened Layer Prototype의 두번째 이야기를 마친다. 또한,
이번 이야기가 Rails 기반 Prototype의 마지막이 될 수도 있을 것 같다.

이번 Prototype을 진행하면서 알게 된 것 중 하나가, 아쉽게도 Ruby
언어에 대한 API 지원은 Full 지원이 아닌 것 같다는 점이다. 또한,
지원하는 내용 중에도 일부는 해당 데이터를 대변하면서 속성값과
Method 즉, 제어 기능을 함께 제공하는 Class가 아닌 속성값만을 갖는
Hash 형태로 구성된 경우도 있었다.

전반적으로 보았을 때, 이 API 지원으로는 장기적인 개발을 진행할 수
없다는 것이 현재로써의 결론이다. 쾌속 개발에 탁월함이 있는 Rails의
힘을 등에 업으면, SoftLayer 전용 기능 뿐만 아니라, 다양한 부가
기능을 개발하기에 좋은 환경이 될 것이라 기대했었지만, API 지원의
미비함은 어쩔 수가 없다.

다시 시간이 좀 나면, 이제는 Python API 기반으로 현재의 Prototype
단계까지를 재현해보고, 더 나아가 기본적인 관리 기능을 제공할 수
있도록 해보려고 한다.

다음 이 시간까지...
안녕...




[Ember.js]:http://emberjs.com/
[AngularJS]:http://angularjs.com/
[Semantic UI]:http://semantic-ui.com/
[Moment.js]:http://momentjs.com/
[D3.js]:https://d3js.org/

