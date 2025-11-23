---
title: SoftLayer Object Storage와 임시 URL - Part 2
tags: ["SoftLayer", "object-storage", "cloud-computing", "API", "Ruby", "swift", "Github", "RSpec"]
categories: ["development"]
image: /assets/logos/hardenedlayer.png
banner: /assets/logos/hardenedlayer-banner.png
date: 2016-03-31 13:00:00 +09:00
---
한 10일 전에 SoftLayer의 Object Storage를 사용하면서 Temp URL을 사용하기
위한 수정을 더한 Custom 버전에 대하여 기록했었다. 그런데 언제나 급하게
간 길은 옳은 길이 아닐 수 있어서 왔던 길을 다시 걸어야 할 때가 있다.
지금이 그 상황이다.

![](/assets/logos/hardenedlayer.png){:.fit.dropshadow}

{:#review}
# 다시보기

간단한 예제 Application을 개발하면서 Object Storage API의 활용성을 검토하던
중, 나름 중요하게 사용할 수 있는 기능 하나가 동작하지 않는 것을 발견하고
그것에 대한 API 수정을 하는 과정을 [SoftLayer Object Storage와 임시 URL]에
담아 두었다.

[SoftLayer Object Storage와 임시 URL]:{% post_url development/2016-03-22-tempurl-for-softlayer-object-storage %}

그 내용을 간단히 집고 넘어가면 다음과 같다.


{:#temp_url_key-via-connection}
## Connection 과정에서 TEMP\_URL\_KEY 획득

Temp URL은 Private하게 저장된 Object를 일반인이 제한된 기간 동안 인증없이
접근하기 위하여 제공되는, 특별한 Hash를 적용한 URL이다. 이 Hash는 내부적
Key 값을 적용하여 생성되며 이 키와 제한기간을 알아야 Hash의 평가가
가능해진다.

아래 코드는 Object Storage사용을 위해 서비스 인증을 거치는 과정으로,
`Connection`이라는 클래스로 관리되는 부분이다. 아래 수정 내용과 같이,
HTTP 응답 헤더에서 해당하는 값(X-ACCOUNT-META-TEMP-URL-KEY)을 추출하여
이 값을 `@temp_url_key`라는 변수에 저장하도록 하였다.

```diff
--- a/lib/softlayer/object_storage/connection.rb
+++ b/lib/softlayer/object_storage/connection.rb
@@ -46,6 +46,8 @@ module SoftLayer
       # Instance variable that is set when authorization succeeds
       attr_accessor :authok
 
+      attr_accessor :temp_url_key
+
       # Optional proxy variables
       attr_reader :proxy_host
       attr_reader :proxy_port
@@ -89,7 +91,8 @@ module SoftLayer
           response = SoftLayer::Swift::Client.head_account(storageurl, self.authtoken)
           @bytes = response["x-account-bytes-used"].to_i
           @count = response["x-account-container-count"].to_i
-          {:bytes => @bytes, :count => @count}
+          @temp_url_key = response["x-account-meta-temp-url-key"]
+          {:bytes => @bytes, :count => @count, :temp_url_key => @temp_url_key}
         rescue SoftLayer::Swift::ClientException => e
           raise SoftLayer::ObjectStorage::Exception::InvalidResponse, "Unable to obtain account size" unless (e.status.to_s == "204")
         end
```

코드의 관련 부분을 살펴보다가, 위에서 보는 것처럼 Bytes Used, Container Count
등을 가져오는 부분을 그대로 참조하여 만든 것이다.

또한, 아래와 같이 `StorageObject` 클래스에서 이 값을 이용하여 HexDigest를
만드는 코드를 추가하여 실질적인 URL 계산을 하도록 하였다.

```diff
--- a/lib/softlayer/object_storage/storage_object.rb
+++ b/lib/softlayer/object_storage/storage_object.rb
@@ -355,6 +355,19 @@ module SoftLayer
           container.cdn_urls.map {|k,v| v += "/#{escaped_name}"}
         )
       end
+
+      # Get URL for temporary public access.
+      #
+      def temp_url(min)
+        expires = (Time.now.getutc + 60 * min).to_i
+        path = "#{container.connection.storagepath}/#{container.name}/#{name}"
+        body = "GET\n#{expires}\n#{path}"
+        sig = OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha1'),
+                                      container.connection.temp_url_key,
+                                      body)
+        path = "#{container.connection.storageurl}/#{container.name}/#{name}"
+        "#{path}?temp_url_sig=#{sig}&temp_url_expires=#{expires}"
+      end
       
       # Copy this object to a new location (optionally in a new container)
       #
```

마지막으로, 아래와 같은 RSpec 파일을 만들어서 자동화된 시험이 가능하도록
설정을 한 것으로 마무리를 지었었다.

```ruby
require File.dirname(__FILE__) + '/spec_helper'

RSpec.describe SoftLayer::ObjectStorage do
  let(:conn) {
    SoftLayer::ObjectStorage::Connection.new(CREDS)
  }

  it "should generate TempURL for first object" do
    r = conn.search()
    expect(r[:count]).not_to eq(0)

    i = r[:items][0]
    cont = conn.container(i["container"])
    obj = cont.object(i["name"])
    expect(system("wget -q \"#{obj.temp_url(30)}\" -O /dev/null")).to eq(true)
  end
end
```



{:#oops}
# 으악!

RSpec 시험은 잘 통과했던 코드지만 실제로 활용하려고 보니 문제가 심각했다!


{:#temp_url_key-without-object-instance}
## Object를 부르지 않고 Temp URL 얻기

문제의 시작은 내가 구현했던 방식에서 온다. 앞서 본 바와 같이 이 URL은
Object에 종속적인 것이기 때문에 자연스럽게 `StorageObject` 클래스에
구현을 했었다. 사람의 머리로, "Straightforward" 방식으로 구현한 것이다.

{:.point}
직관적 판단, 직선적 구현!
: 코드를 읽기 편하게 하기 위해서는 직선적인 구현이 좋다.
: 그러나, Loop와 연관된 구현을 할 때에도 그럴까?!


그런데 다루려는 Object가 많아지다 보니, 수많은 Object를 모두 불러와서
메서드를 각각의 인스턴스에서 호출하려다 보니, HTTP Request가 매우
크게 증가하는 것이다. 당연히 Application의 성능이 현저하게 떨어진다.

그래서 아래와 같이, Object의 이름을 더 받아서 Temp URL을 생성해주는
메서드를 `Container` 클래스에 구현해 주었다.

```diff
--- a/lib/softlayer/object_storage/container.rb
+++ b/lib/softlayer/object_storage/container.rb
@@ -272,6 +272,23 @@ module SoftLayer
         end
       end
 
+      # Returns Temp Url for given object.
+      #
+      def object_temp_url(objectname, min)
+        begin
+          expires = (Time.now.getutc + 60 * min).to_i
+          path = "#{self.connection.storagepath}/#{self.name}/#{objectname}"
+          body = "GET\n#{expires}\n#{path}"
+          sig = OpenSSL::HMAC.hexdigest(OpenSSL::Digest.new('sha1'),
+                                        self.connection.temp_url_key,
+                                        body)
+          path = "#{self.connection.storageurl}/#{self.name}/#{objectname}"
+          "#{path}?temp_url_sig=#{sig}&temp_url_expires=#{expires}"
+        rescue
+          nil
+        end
+      end
+
       # Creates a new SoftLayer::ObjectStorage::StorageObject in the current co
ntainer.
       #
       # If an object with the specified name exists in the current container, that object will be returned.  Otherwise,
```

이제, Object의 이름을 알고 있다면 각각의 Object에 대한 인스턴스를 생성하지
않고도 Temp URL을 생성해줄 수 있다. 이제, 아래와 같은 RSpec 시험을 하나 더
추가하여, 새로운 API를 통한 Temp URL 생성도 시험해보았다.

```ruby
it "should generate TempURL for first object without get Object" do
  r = conn.search()
  expect(r[:count]).not_to eq(0)

  i = r[:items][0]
  cont = conn.container(i["container"])
  turl = cont.object_temp_url(i["name"], 30)
  expect(system("wget -q \"#{turl}\" -O /dev/null")).to eq(true)
end
```


{:#caching-key-value}
## KEY 값 보존하기

이제 Object 인스턴스를 생성하지 않고도, 다시말해서 Object에 대한 수많은 HTTP
요청을 보내지 않고도 Temp URL의 생성이 가능해졌다. 그런데 여전히 느리다!
("왜 이렇게 느린가?"를 추적한 이야기는 이 다음에 포스팅될 글에 적고 있다.
:-)

아... 여기서 직감을 이용한 개발의 한계가 나타난다. 우리가 코드를 한 줄
한 줄 써내려 갈 때, 부분을 보고 가정을 하거나 짐작을 하는 것이 얼마나
위험한 것인지, 그리고 사람의 논리와 구현의 논리는 어떻게 다른 것인지...

{:#current-implementation}
### 현재의 구현: 내가 뭘 한거지?

시작은 아주 간단했다. 이미 존재하는 코드를 보니, 아래와 같이 작성이 되어
있었고, 내용이 아주 간단하다. 기본적으로 `Connection` 클래스에는
`SoftLayer::Swift::Client` 클래스의 `head_account`라는 메서드를 호출하여
그 회신으로부터 Header 값을 뽑아내어 변수에 저장하는 `get_info`라는
메서드가 구현되어 있고, 다시 이 메서드를 호출하여 Hash로 반환되는 각각의
값을 반환하는 메서드의 구현이 있었다. (아래의 `bytes` 및 `count`)

```ruby
def get_info
  begin
    raise SoftLayer::ObjectStorage::Exception::AuthenticationException, "Not authenticated" unless self.authok?
    response = SoftLayer::Swift::Client.head_account(storageurl, self.authtoken)
    @bytes = response["x-account-bytes-used"].to_i
    @count = response["x-account-container-count"].to_i
    {:bytes => @bytes, :count => @count, :temp_url_key => @temp_url_key}
  rescue SoftLayer::Swift::ClientException => e
    raise SoftLayer::ObjectStorage::Exception::InvalidResponse, "Unable to obtain account size" unless (e.status.to_s == "204")
  end
end

def bytes
  get_info[:bytes]
end

def count
  get_info[:count]
end
```

그래서 나는, 아주 간단하게 아래와 같이 Header 값 하나를 더 뽑고 그것을 읽을
메서드를 하나 더 추가하는 방식으로 간단히 조작을 했던 것인데...

```ruby
def get_info
  begin
    raise SoftLayer::ObjectStorage::Exception::AuthenticationException, "Not authenticated" unless self.authok?
    response = SoftLayer::Swift::Client.head_account(storageurl, self.authtoken)
    @bytes = response["x-account-bytes-used"].to_i
    @count = response["x-account-container-count"].to_i
    @temp_url_key = response["x-account-meta-temp-url-key"]
    {:bytes => @bytes, :count => @count, :temp_url_key => @temp_url_key}
  rescue SoftLayer::Swift::ClientException => e
    raise SoftLayer::ObjectStorage::Exception::InvalidResponse, "Unable to obtain account size" unless (e.status.to_s == "204")
  end
end

def temp_url_key
  get_info[:temp_url_key]
end
```

### 함정

문제는 이 `temp_rul_key` 메서드를 호출하게 되면, 내부적으로 변수를 참조하는
것이 아니라 `get_info`를 부르게 되고, 이 메서드는 정말 `get`을 매번 하는
녀석이었던 것이다. (메서드 이름이 동사로 되어있으니 뭐, 그럴만도 하다.)

그런데 이렇게 되면, 매번 이 메서드를 호출할 때 마다 HTTP HEAD 요청이
발생하게 되므로 이 역시 과도한 API 호출을 유도하는 구조인 것이다. 그래서
아래와 같이, 이 값을 변수에 저장하고 변수가 비어있을 때에만 `get_info`가
실행되도록 수정하였다.  말하자면 Cache를 적용하는 것이다.

```diff
--- a/lib/softlayer/object_storage/connection.rb
+++ b/lib/softlayer/object_storage/connection.rb
@@ -107,7 +107,7 @@ module SoftLayer
       end
 
       def temp_url_key
-        get_info[:temp_url_key]
+        @temp_url_key ||= get_info[:temp_url_key]
       end
 
       def containers(limit = nil, marker = nil)
```

이렇게 변경된 API를 사용할 때의 속도에 대한 검증을 위해서, 아래와 같은
시험을 RSpec에 추가하였다.

```ruby
it "should get temp_url_key from connection." do
  r = conn.search()
  started = Time.now
  (1..40).each do
    conn.temp_url_key
  end
  spent = Time.now - started
  expect(spent < 2.0)
end
```

이제 일단 문제는 해결이 되었다. 40번이 아닌 그 이상의 호출을 반복해도,
그 시간이 2초 이상 걸리지 않는다. (처음, 10여 개의 Object의 Temp URL을
가져오기 위해서 7초 정도가 걸리던 것이, 이제는 보통 1초 안에 끝난다.)

{:.point}
인터넷 기반 개발, 느린 장치의 고려
: 다루는 장치가 느리다면 Cache에 대한 고려는 필수이다.
: 느린 Disk를 위해 Cache와 Buffer가 있듯이,
: Network 기만 API 역시 Cache에 대한 고려가 필요하다.


### 다른 구현

이게 더 원초적인 문제인데, 다시 정리해보면 다음과 같다.

Swift는 HTTP 응답에 이런 저련 `X-` Header를 추가하여 자원에 대한 부가
정보를 전달하는 구조로 되어있다. 이들 값은, 해당 자원의 변화를 반영하여
변하게 되는 것이 당연하지만, 실제의 응용에 있어서는 그 변화를 어느 정도
예측할 수도 있고 또는 성능을 위해 동기화 부분을 어느 정도 양보하기도
하는 것은 자연스러운 일이다.

아래의 코드는 `Container` 클래스의 메타데이터를 다루는 메서드인데, 앞서
살펴보았던 `get_info`와 완전히 유사하다. (차이가 있다면, 동사형 이름이
아닌 명사형 이름을 사용하고 있는, 메서드 형식의 Accessor(?)라고 볼 수
있을 것 같다.)

```ruby
def container_metadata
  @metadata ||= (
    response = SoftLayer::Swift::Client.head_container(self.connection.storageurl, self.connection.authtoken, escaped_name)
    resphash = {}
    response.to_hash.select { |k,v| k.match(/^x-container-meta/) }.each { |x| resphash[x[0]] = x[1].to_s }
    {:bytes => response["x-container-bytes-used"].to_i, :count => response["x-container-object-count"].to_i, :metadata => resphash, :container_read => response["x-container-read"], :container_write => response["x-container-write"]}
  )
end
```
기본적으로 완전히 동일한 구조이지만, `@metadata`라는 Cache 변수를 사용해
이미 값이 있을 경우에는 추가의 HTTP 요청을 하지 않는 구조라는 점이 크게
다르다. (반대로, Exception 처리가 없는 것이 좀 그렇긴 하다?)

아... 기능 구현의 Coverage 문제를 떠나서... 완성도도 낮구나...

# 방향 전환

내 성급한 Pull Request가 받아들여지지 않고 있었던 것은 어쩌면 다행이다.
그 코드는 실전에서 활용할 수 없는 것이었으니까. 그러나, PR이나 Issue에
대한 반응이 없는 것은 좀 당황스러운 일이고, 이제 코드의 수준도 대충
파악이 되어버렸으니...

개발자가 이 API Set만 믿고 일을 추진하기에는 한계가 있어 보인다. 그래서
아예, Contribute 용으로 내 계정 아래에 땄던 Fork를 별도의 Organization을
만들어 넘겼다.

당분간은, [HardenedLayer]의 강화된 API Set을 사용해야 할 것 같다. 이
강화 프로젝트의 위치는 아래와 같다. 혹시 SoftLayer Object Storage 등을
사용하여 개발할 일이 있다면, 참고하시라.

* [HardenedLayer]
* [HardenedLayer/softlayer-object-storage-ruby]


[HardenedLayer]:https://github.com/hardenedlayer
[HardenedLayer/softlayer-object-storage-ruby]:https://github.com/hardenedlayer/softlayer-object-storage-ruby

![](/assets/logos/hardenedlayer.png){:.fit.dropshadow}


