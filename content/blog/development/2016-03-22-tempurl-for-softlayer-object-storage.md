---
title: SoftLayer Object Storage와 임시 URL
tags: ["SoftLayer", "object-storage", "cloud-computing", "API", "Ruby", "swift", "Github"]
categories: ["development"]
image: /attachments/20160322-sl-objs-002.png
date: 2016-03-22 12:12 +09:00
---
잠깐 짬을 내서, 지난 주말에 SoftLayer의 Object Storage를 활용하는 개발의
시험을 해보려고 했다. 그런데 이 Object Storage 내에 저장된 비공개 자료를
임시 URL을 사용하여 URL을 알려줄 특정인에 한정하여 공유하는 부분에서 딱!
하고 막혀 버렸다. 이번 글은, 이 막힘을 푸는 과정을 두 가지 주제로 기록해
보려고 한다.

딱히 끊어서 기술하지는 않았지만, 다루려고 하는 주제는 다음과 같다.

1. SoftLayer의 Object Storage를 활용하여 임시공유 만들기
1. Github에서 공개소프트웨어에 기여하는 방식

{:#the-beginning}
# 사건의 발단

곧 자세히 말할 기회가 있을 것 같은데 개요만 말하자면, 간단하게 생활코딩(?)
격의 App을 하나 짜려고 했던 것이 일의 시작이다. 이렇게 길어질 줄 알았다면
그냥 손으로 했어야 하는 일이지만 한 번이라도 반복될 가능성이 있는 일이라면
수작업을 하기 보다 자동화를 해야 속이 풀리는 나라서...

이 얘기는 다음 기회에 하고, 어쨌든 SoftLayer의 Object Storage에 저장된
파일을 사용기한의 제한이 있는 임시 URL을 사용하여 특정인에게만 공유하는
기능을 활용하려고 했다.(있는 기능이다.) 그런데...

{:.point}
API가 없다!
: 뭐야! 모든 기능의 API가 모든 언어에 동일하게 지원된다며!!!

직접적인 API로 풀지 못한다면 주변의 것들을 조합해보려고 다양하게 자료를
찾아봤더니, 대부분의 자료는 Swift 또는 Swift CLI를 활용하여 SoftLayer의
Object Storage를 사용하는 방법에 대한 글이었다. (SoftLayer가 OpenStack
기반이라는 얘기를 간혹 듣지만, 사실은 Object Storage가 유일하게 Swift를
기반으로 한, OpenStack과 관련이 있는 부분이다.)

그러나 나는, Program을 쓰고 있는 중이고, 이에 맞는 해법을 원한다!

---

{:#using-temp-url}
### 참고: 임시 URL의 사용(사용자 포탈)

사용자 포탈에서는 아래와 같이 공유하고자 하는 파일을 선택하여 "조치"를
해주면 임시 URL을 생성할 수 있다.

![](/attachments/20160322-sl-objs-002.png){:.fit.dropshadow}

임시 공유의 유효기간을 설정하고 확인을 눌러주면,

![](/attachments/20160322-sl-objs-003.png){:.fit.dropshadow}

아래와 같이 파일에 접근할 수 있는 URL이 만들어진다.

![](/attachments/20160322-sl-objs-004.png){:.fit.dropshadow}

내가 원하는 것은, 이 URL에 들어가는 암호화된 부분(공유 URL이 정상적인
것인지 판별하기 위한 부분)을 API를 통하여 계산해 내는 것이다.



{:#solution}
# 찾은 해답

다양하게 검색을 해봐도 자료를 찾을 수 없는 상황에서 고객포탈에서 지원을
요청했더니, 돌아오는 답이 StackOverflow에 글을 올리라고 한다. (그것이
개발/API와 관련된 공식 지원채널이라는데... 좀 어이가 없다.)

아무튼, 한 편으로 StackOverflow에
[글][How can I generate TempURL for object on Object Storage of SoftLayer]을
올리는 한 편, 계속해서 인터넷을 검색을 하여
[Managing SoftLayer Object Storage Through REST APIs]라는 글의 중간에서
힌트를 얻게 되었다. 바로, `curl`을 사용하여 Container를 관리하는 것을
보여주는 부분이었는데, HTTP Response Header에 `X-Account-Meta-Temp-Url-Key`
라는 값이 보인 것이다! (대부분의 문서는 `swift` 명령을 이용하여 이 값을
설정하는 과정만 나와 있었고, 이 값을 구하는 방법이 명시적으로 설명된
자료는 아직 찾지 못했다.)

그래서, 이 Header 값을 API에 활용할 수 있는 길이 있을까 하는 생각으로,
SoftLayer Object Storage의 공식 Ruby API Repository인
[softlayer/softlayer-object-storage-ruby]의 코드들을 살펴보았고, 수정할
포인트를 찾게 되었다!



{:#code-contribution}
# 코드 기여

SoftLayer의 API는 Github를 통하여 소스를 공개하고 있어서, 원한다면
사용자가 코드를 직접 보고, 고치고, 기여할 수 있는 환경을 제공하고
있다. 공식 API를 개선하여 TempURL을 생성하는 코드를 추가하기 위하여
먼저 SoftLayer의 저장소를 Fork하는 것부터 시작하게 된다.

저장소의 Fork는 Github에서 버튼 클릭을 통하여 쉽게 할 수 있다. 이번
작업의 경우, 나는 [softlayer/softlayer-object-storage-ruby]를 Fork
하여 [내 복사본][My Fork]을 만들었다.


{:#preparing-development-env}
## 클론하여 개발환경 꾸미기

일단 Fork가 되었다면 다음과 같이 내 개발 Laptop에 저장소의 작업사본을
복제할 수 있다. 아래와 같이, 복제와 Bundle된 gem의 설치를 진행한다.

```console
$ git clone https://sio4@github.com/c12g/softlayer-object-storage-ruby.git
Cloning into 'softlayer-object-storage-ruby'...
remote: Counting objects: 71, done.
remote: Total 71 (delta 0), reused 0 (delta 0), pack-reused 71
Unpacking objects: 100% (71/71), done.
Checking connectivity... done.
$ cd softlayer-object-storage-ruby/
$ bundle install --path vendor/bundle
Fetching gem metadata from http://rubygems.org/...........
Fetching version metadata from http://rubygems.org/..
Resolving dependencies...
Installing diff-lcs 1.2.5
Installing rspec-support 3.4.1
Using softlayer-object-storage 0.0.1 from source at `.`
Using bundler 1.11.2
Installing rspec-core 3.4.4
Installing rspec-expectations 3.4.0
Installing rspec-mocks 3.4.1
Installing rspec 3.4.0
Bundle complete! 2 Gemfile dependencies, 8 gems now installed.
Bundled gems are installed into ./vendor/bundle.
$ 
```

이제 TDD 개발을 위한 RSpec을 주로 하여 번들 Gem의 설치가 완료되었고,
개발을 시작할 준비가 되었다.


## RSpec, Behaviour Driven Development for Ruby.

RSpec은 Ruby 개발 과정에서 단위 테스트를 돕는 도구로, 정의해둔 Routine을
실행하고 결과의 성공과 실패에 대하여 보고해주는 도구다. 혼자서 개발하는
경우에도 결과물의 품질을 일정하게 유지하기 위하여 유용하게 사용되지만
특히 여러 사람이 함께 작업하는 경우에는 더욱 중요한 부분이다.

특히, 전체 코드를 이해하지 못하는 개발자가 부분적인 기여를 하는 경우, 그
결과가 다른 곳에 영향을 미치지 않는다고 확신하기 어려울 수 있는데, 이 때
해당 프로젝트가 Test 도구를 지원한다면 가정 먼저 이 Test Case를 실행하여
현재 코드에 문제가 없는지, 향후 내 작업이 진행된 후에 영향을 주는 부분이
없는지 검증하는 것이 좋다.

일단 돌려보자.

```console
$ bundle exec rspec
/home/sio4/git/team.c12g/softlayer-object-storage-ruby/spec/spec_helper.rb:6:in `require': cannot load such file -- /home/sio4/git/team.c12g/softlayer-object-storage-ruby/spec/sl-storage.creds.rb (LoadError)
	from /home/sio4/git/team.c12g/softlayer-object-storage-ruby/spec/spec_helper.rb:6:in `<top (required)>'
<...>
$ 
```

어이쿠! 저장소에서 내려받은 직후임에도 바로 오류가 났다. 오류 내용을 보니
실제의 Test Case가 실패한 것은 아니고, 파일이 없단다. 이게 무슨 일인가?

코드를 열어보니 존재하지 않는 파일을 참조하고 있다. 이 상황에서 짐작할
수 있듯이, Backend와 상호 통신하는 Application이다 보니 먼저 신임정보의
설정이 필요한 것이 당연한데, 그것을 담아두는 파일이 저장소에 없어서
생긴 일이다. 신임정보를 담은 파일이니 없는 것은 당연하지만 다음 두 가지가
아쉽낟.

1. 이런 경우, 일반적으로 `sl-storage.creds.rb.dist` 같은 형식으로 예시가
   되는 파일을 함께 제공하는 편이 좋다.
1. Test Case를 돌리기 위한 사전준비에 대하여 문서화가 되어있으면 좋은데
   문서화가 너무 빈약하다.

약간의 실망을 뒤로 하고, 코드를 열어보니 다음과 같은 설정이 필요함을
알게 되었다.

{:.block-title}
`/spec/sl-storage.creds.rb`

```ruby
CREDS = {
  username: 'ACCNT123456-3:sio4',
  api_key: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
  network: :public,
  datacenter: :hkg02
}
```
(위의 값들은 형식을 유지하여 가상으로 입력한 예시이다.)

다시 돌여보자.

```console
$ bundle exec rspec
..FFFFFFF
An error occurred in an `after(:context)` hook.
  RuntimeError: let declaration `sl_storage` accessed in an `after(:context)` hook at:
  /home/sio4/git/team.c12g/softlayer-object-storage-ruby/spec/basic_spec.rb:9:in `block (2 levels) in <top (required)>'

<...>
$ 
```

이런, 위에서 보듯이 2개의 성공(맨 첫 줄에 '.'으로 찍힌)과 7개의 실패('F')가
발생했다. 이 Test Case에 의미를 두고 작업하는 것은 불가능할 것 같고, 일단
나를 위한 RSpec을 하나 작성하는 것으로 개발을 시작한다.

{:.block-title}
`/spec/tempurl_spec.rb`

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

위의 RSpec은 하나의 Test Case를 담고 있다. 내용은, Connection을 만들고
그 Connection을 이용하여 Object Storage에 들어있는 맨 첫번째 Object를
얻어 그것의 임시 URL을 생성해내는 것이다. 코드를 보면 대략 이해가 될
것이라고 생각하며, 당연한 얘기지만 이미 하나 이상의 Container와 Object가
존재한다는 것을 가정하고 만들어진 Test Case이다.

RSpec만 만들었을 뿐, 아무런 코드 수정도 하지 않은 현재 상태에서 Test를
진행하면, 아래와 같이 실패 메시지를 확인할 수 있다.

```console
$ bundle exec rspec spec/tempurl_spec.rb 
F

Failures:

  1) SoftLayer::ObjectStorage should generate TempURL for first object
     Failure/Error: expect(system("wget -q \"#{obj.temp_url(30)}\" -O /dev/null")).to eq(true)

     NoMethodError:
       undefined method `temp_url' for #<SoftLayer::ObjectStorage::StorageObject:0x00000001d58238>
     # ./spec/tempurl_spec.rb:15:in `block (2 levels) in <top (required)>'

Finished in 1.27 seconds (files took 0.1081 seconds to load)
1 example, 1 failure

Failed examples:

rspec ./spec/tempurl_spec.rb:8 # SoftLayer::ObjectStorage should generate TempURL for first object

$ 
```

앞서 보았듯이 'F'로 실패가 하나 있음을 알려주고 있으며, 그 내용이 어떤
Test Case이며 무슨 오류가 발생했는지를 실행시간 등과 함께 보여주고 있다.

이제 위의 Test Case가 성공이 되도록, 다시 말해서 현재는 없는 Method인
`temp_url`을 만들어주고 `wget` 명령의 결과가 `true`가 되도록 적절하게
코드를 수정할 차례이다.


{:#writing-codes}
## 코드 작성

이번 개선은 연결을 관장하는 `connection.rb` 파일과 개별 Object를 다루는
`storage_object.rb` 파일에서 이루어졌다. 먼저, `connection.rb` 파일의
변경 내용은 다음과 같다.

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
@@ -103,6 +106,10 @@ module SoftLayer
         get_info[:count]
       end
 
+      def temp_url_key
+        get_info[:temp_url_key]
+      end
+
       def containers(limit = nil, marker = nil)
         begin
           response = SoftLayer::Swift::Client.get_account(storageurl, self.authtoken, marker, limit)
```

보는 바와 같이, HTTP Header로부터 `x-account-meta-temp-url-key` 헤더를
추출하는 코드가 가운데 추가되었으며, 이 값을 참조할 수 있도록 Method와
Accessor를 추가하였다.

다음은 이 값을 이용하여 실제의 임시 URL을 만드는 부분인데, Method 하나가
통째로 추가된 형태다.

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

이 새로 추가된 Method는 기존에 존재하는 속성값과 위에서 새로 추가한
`temp_url_key` 값을 이용하여 Hash를 만들어내고, 이것을 이용하여 임시
접근을 위한 URL을 생성하도록 구성되어 있다.

{:#rspec-again}
## 다시 RSpec

이제 다시 Test Case를 돌려보자.

```console
$ bundle exec rspec spec/tempurl_spec.rb 
.

Finished in 3.07 seconds (files took 0.08408 seconds to load)
1 example, 0 failures

$ 
```

이제 깔끔하게, 점('.') 하나로 끝났다!

이렇게 작성이 완료된 코드는 [내 복사본][My Fork]에 Commit을 하였고,
그것을 기반으로 원래의 저장소에 [Pull Request]를 보냈다. 이제, 해당
프로젝트의 관리자가 이 Request를 받아준다면, 공식적으로 사용할 수
있는 코드가 되는 것이고 그렇지 않다면... 할 수 없지 뭐. :-)

---

{:#i-am-sorry-softlayer}
# 아쉬움

여담인데, 이번 과정을 거치면서 참 아쉬운 것이, SoftLayer의 고객지원에
대한 경험이다. 공식적인 채널을 통한 질문을 커뮤니티로 돌리는 것도 조금
안타까운 부분이지만, 말 그대로 General Question이라고 분류를 한다면
이해할 수도 있는 부분이긴 하다.

![](/attachments/20160322-sl-objs-001.png){:.fit.dropshadow}

그렇지만 74 followers, 175 questions의 빈약한 [Tag, SoftLayer]에 대하여,
SO에서의 모든 활동이 이 하나의 Tag에 집중되어있는, 전문적인 답변을 하는
인력을 고용하고 있다면 사실상 Official한 지원이라고 볼 수도 있을 것
같은데...

![](/attachments/20160322-sl-objs-006.png){:.fit.dropshadow}

너무 쉽게 찾을 수 있는 틀에 밖힌 답변은 그렇다고 치더라도 커뮤니티에서
내는 목소리의 수준이 이렇다니...

![](/attachments/20160322-sl-objs-005.png){:.fit.dropshadow}

참 답답하네... ㅎㅎ


[Using SoftLayer Object Storage to backup or transfer data in IBM Cloud OpenStack Services]:https://open.ibmcloud.com/documentation/backup-using-object-storage.html
[Managing SoftLayer Object Storage Through REST APIs]:http://sldn.softlayer.com/blog/waelriac/Managing-SoftLayer-Object-Storage-Through-REST-APIs
[My Fork]:https://github.com/c12g/softlayer-object-storage-ruby
[softlayer/softLayer-object-storage-ruby]:https://github.com/softlayer/softlayer-object-storage-ruby
[Pull Request]:https://github.com/softlayer/softlayer-object-storage-ruby/pull/10
[How can I generate TempURL for object on Object Storage of SoftLayer]:http://stackoverflow.com/questions/36122222/how-can-i-generate-tempurl-for-object-on-object-storage-of-softlayer
[Tag, SoftLayer]:http://stackoverflow.com/questions/tagged/softlayer
