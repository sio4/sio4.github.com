---
title: "CAOS #2 SoftLayer Object Storage 다루기"
tags: ["object-storage", "SoftLayer", "cloud-computing", "my-projects", "photo"]
categories: ["development"]
image: /attachments/20160428-caos/caos-200-album-list.png
date: 2016-09-05 23:56:00 +0900
---
이번 시리즈를 통해서 배운 것이 하나 있다면, 글을 쓰려거든 딱 그 주제
하나에만 집중해야 한다는 점이었다. 시작은 단지, SoftLayer Cloud와
Object Storage를 활용한 시험적인 Application을 소개하는 것이었는데,
시리즈에 담을 내용을 정하는 과정에서 욕심이 과했던 것 같다.

아무튼, 그 과했던 부분, Rails Application을 Bundler 기반으로 시작하고
또하나의 Cloud 서비스인 Mailgun을 통하여 메일을 발송하고, 이를 이용한
OTP를 구현하는 등의 부수적인 이야기를 담은
[CAOS #1 Rails 기반 환경 구성]에 이어, 이번에는 이 시리즈의 핵심주제인
SoftLayer의 Object Storage를 다루는 것에 대하여 기록하려고 한다.

여는 글을 비롯하여 이 시리즈의 글들은 다음의 순서를 참고하길 바라며,

* [CAOS, Cloud Album on Object Storage] -  *The Begining~!*  
* [CAOS #1 Rails 기반 환경 구성]
* CAOS #2 SoftLayer Object Storage 다루기 <--*현위치*
* [CAOS #3 Rails Application의 성능 분석]

그 중간 과정에서 만들어진 부수적인 기록도 관심이 있으면 참고하길 바란다.

* [SoftLayer Object Storage와 임시 URL]
* [SoftLayer Object Storage와 임시 URL #2] 

[SoftLayer Object Storage와 임시 URL]:{{< relref "/blog/development/2016-03-22-tempurl-for-softlayer-object-storage.md" >}}
[SoftLayer Object Storage와 임시 URL #2]:{{< relref "/blog/development/2016-03-31-tempurl-for-softlayer-object-storage-2.md" >}}

[CAOS, Cloud Album on Object Storage]:{{< relref "/blog/development/2016-04-28-cloud-album-on-object-storage.md" >}}
[CAOS #1 Rails 기반 환경 구성]:{{< relref "/blog/development/2016-07-07-rails-env-especially-for-caos.md" >}}
[CAOS #3 Rails Application의 성능 분석]:{{< relref "/blog/development/2016-09-06-rails-application-performance.md" >}}


---


# Object Storage {#preparing-object-storage}

이제는 새로울 것도 없는 **Object Storage**란 Cloud 시대를 대표하는 변화
중의 하나이다. 흔히들 Cloud Computing을, "*구름 위에 모든 것을 던져버리고
또한 그 속에서 일어나는 일은 잊어버려라*" 그리고 단지, "*그것이 거기에
있다는 것만 기억하라*"고 한다. (물론, 잊을 수 있기 위해서는 제공자를
믿어야 한다. :-)

Amazon Web Service의 S3, OpenStack의 Swift로 대표되는 Object Storage는
사용자의 Data를 Cloud 속에 넣어두고 필요할 때 정해진 방식에 따라 꺼내어
쓰는, 그리고 그것이 Cloud 내에서 안전하게 다루어지는 것은 서비스 제공자
몫으로 하는 방식의 데이터 저장 방식이다.


과거에는, 네트워크 상에 데이터를 저장하고 공유하기 위하여 NAS나 SAN 같은
데이터 저장 방식을 써왔다. 이들은 사용자에게 각각 File System 또는 Block
Storage 수준의 접근을 제공하며, 이에 상응하는 접근방식과 데이터를 다루는
방식을 필요로 했다. 이에 반하여 Object Storage는 그 이름에서 짐작할 수
있듯이, 데이터를 다루는 수준을 Object 즉, 파일 또는 그 조각 수준으로
정의하고 있으며, 그에 걸맞는 기존과는 다른 별도의 접근 방식을 제공한다.

최종적으로 사용자가 데이터에 접근하는 방식을 놓고 보면, Object Storage는
일반적인 Web Service와 닮아있으며, 이로 인하여 많은 사람들이 이것을
설명할 때 Web Hard에 비유하곤 한다. 어쩌면 이미 오래 전부터 사용되어 온
WebDAV, 또는 요즘 많이 사용되는 Dropbox나 Box.com 등의 서비스와도 맥이
통하는 부분이 있다. 

또 말이 길었는데, 이 글에서는 IBM의 Public Cloud 서비스이자 국내에서는
SK가 함께 서비스를 제공하는 SoftLayer 기반에서 Object Storage를 사용한
Application 개발의 예를 기록한다.



## SoftLayer API의 설치 {#install-softlayer-api}

SoftLayer Ruby API는 공식적으로 Gem 저장소를 통하여 제공이 되고 있다.
그러나 Object Storage API는 그렇지가 않으며, 다음과 같이 Github에서
바로 내려받아 설치하여야 한다.

```console
$ echo "gem 'softlayer_api'" >> Gemfile
$ echo "gem 'softlayer-object-storage', :git => 'https://github.com/hardenedlayer/softlayer-object-storage-ruby'" >> Gemfile
$ bundle install
Fetching https://github.com/hardenedlayer/softlayer-object-storage-ruby
Fetching gem metadata from https://rubygems.org/...........
Fetching version metadata from https://rubygems.org/...
Fetching dependency metadata from https://rubygems.org/..
Resolving dependencies...
<...>
Installing configparser 0.1.4
Using softlayer-object-storage 0.0.1 from https://github.com/hardenedlayer/softlayer-object-storage-ruby (at master@0069cd0)
Installing softlayer_api 3.2.1
Bundle complete! 14 Gemfile dependencies, 57 gems now installed.
Bundled gems are installed into ./vendor/bundle.
$ 
```

참고로, 이 글에서는 공식 저장소를 사용하지 않고 Fork한 나의 저장소를
사용하고 있다. (일부, 내 필요에 의해 추가한 기능이 제공된다.)

* 공식 API: <https://github.com/softlayer/softlayer-object-storage-ruby>
* 변형 API: <https://github.com/hardenedlayer/softlayer-object-storage-ruby>

{:#testing-softlayer-object-storage-api}
## SoftLayer Object Storage의 시험

설치된 패키지가 정상적으로 동작하는지 보기 위하여, 아래와 같은 시험코드를
만들었는데, 이 코드는 앞선 글 [SoftLayer Object Storage와 임시 URL]에서
사용한 코드를 손봐서 그대로 사용한 것이다.

```ruby
require 'test_helper'
require 'softlayer/object_storage'
require File.join(File.dirname(__FILE__), 'creds.rb')

class StorageObjectTest < ActiveSupport::TestCase
  def test_the_truth
    conn = SoftLayer::ObjectStorage::Connection.new(CREDS)
    r = conn.search()
    assert r[:count] > 0

    i = r[:items][0]
    cont = conn.container(i["container"])
    obj = cont.object(i["name"])

    puts 'temp url for object ----------------------'
    puts obj.temp_url(30)
    assert true
  end
end
```

시험은 다음과 같이, `bundle exec rake test` 명령을 사용하여 진행한다.

```console
$ bundle exec rake test test/backend/storage_object_test.rb
Running via Spring preloader in process 28381
Run options: --seed 43918

# Running:

temp url for object ----------------------
https://hkg02.objectstorage.softlayer.net:443/v1/AUTH_0000aaaa-00aa-00aa-00aa-00aa00aa00aa/caos/CM2016/check.jpg?temp_url_sig=00aa00aa00aa00aa00aa00aa00aa00aa00aa00aa&temp_url_expires=1458652517
.

Finished in 2.974607s, 0.3362 runs/s, 0.6724 assertions/s.

1 runs, 2 assertions, 0 failures, 0 errors, 0 skips
$ 
```

정상적으로 접속이 되고, 사용자가 사진을 내려받을 때 임시로 사용하게 될
URL을 가져오는 작업이 정상적으로 실행되었다. (Link된 앞선 글에서 확인할
수 있는 내용인데, 이 Temp URL 부분이 앞서 말한 내 필요에 의해 보강된
부분이다.)


## Album 만들기 {#setup-album-scaffold}

이제 실제 작업에 들어갈 차례이다. 아래와 같이, Album으로 사용될 모델을
Scaffolding 방식을 사용하여 만들어준다.

```console
$ bin/rails g scaffold album title username api_key network datacenter container user:references --no-javascripts --no-stylesheets
      invoke  active_record
      create    db/migrate/20160323155847_create_albums.rb
      create    app/models/album.rb
      invoke    test_unit
      create      test/models/album_test.rb
      create      test/fixtures/albums.yml
      invoke  resource_route
       route    resources :albums
      invoke  scaffold_controller
      create    app/controllers/albums_controller.rb
      invoke    erb
      create      app/views/albums
      create      app/views/albums/index.html.erb
      create      app/views/albums/edit.html.erb
      create      app/views/albums/show.html.erb
      create      app/views/albums/new.html.erb
      create      app/views/albums/_form.html.erb
      invoke    test_unit
      create      test/controllers/albums_controller_test.rb
      invoke    helper
      create      app/helpers/albums_helper.rb
      invoke      test_unit
      invoke    jbuilder
      create      app/views/albums/index.json.jbuilder
      create      app/views/albums/show.json.jbuilder
      invoke  assets
      invoke    coffee
      invoke    scss
$ bin/rake db:migrate
== 20160323155847 CreateAlbums: migrating =====================================
-- create_table(:albums)
   -> 0.0023s
== 20160323155847 CreateAlbums: migrated (0.0024s) ============================

$ 
```

그리고 아래와 같이, 앨범을 보여줄 때 그 앨범에 포함된 Object, 즉 사진의
목록을 가져오도록 Controller를 작성해준다.

```ruby
  def show
    conn = SoftLayer::ObjectStorage::Connection.new({
      username: @album.username,
      api_key: @album.api_key,
      network: @album.network.to_sym,
      datacenter: @album.datacenter.to_sym
    })
    cont = conn.container(@album.container)
    data = cont.search()

    @items = []
    data[:items].each do |item|
      if not item['content_type'].eql? 'application/directory'
        obj = cont.object(item['name'])
        item['bytes'] = obj.bytes
        item['last_modified'] = obj.last_modified
        item['etag'] = obj.etag
        item['src'] = obj.temp_url(30)
        item['filename'] = File.basename(item['name'])
        @items.push item
        debug "ITEM #{item}"
      end
    end
  end
```

이 때, 자동으로 Gem이 로딩되지 않는데, 다음과 같이 initializer를 추가하여
해결할 수 있다.

```diff
--- /dev/null
+++ b/config/initializers/preload.rb
@@ -0,0 +1 @@
+require 'softlayer/object_storage'
```

## 미리보기 만들기 {#generate-preview}

앨범 Application이라면 Album 보기에서 미리보기를 제공하지 않을 수 없다.
아래의 화면은 이번 작업의 최종 결과로, 사진을 적당한 크기로 줄이고
사진에 담긴 Exif 값을 이용하여 똑바로 보이도록 회전하여 미리보기 파일로
저장한 후 보여주고 있다.

![.dropshadow](/attachments/20160428-caos/caos-200-album-list.png)

다음과 같은 과정을 통하여 Album 페이지에 보여줄 미리보기를 만든다.

### 이미지 조작 Gem: rmagick vs. mini\_magick

이미지파일을 다루기 위해 리눅스에서 전통적으로 많이 사용되는 도구 중
하나는 단연, ImageMagick 이다. 그리고 이 ImageMagick를 Ruby에서 활용할
수 있도록 해주는 Gem은 `rmagick`가 가장 유명하다. 그러나, 여기서는 보다
빠른 이미지 전환을 위하여 `mini_magick`를 사용하였다.

```console
$ echo "gem 'mini_magick'" >> Gemfile
$ bundle install
<...>
Installing mini_magick 4.5.1
<...>
Bundle complete! 20 Gemfile dependencies, 64 gems now installed.
Bundled gems are installed into ./vendor/bundle.
$ 
```

이 주제에 흥미가 있다면 아래의 코드를 참고해 보는 것도 좋을 것 같다.

* <https://github.com/eahanson/imageproxy>
* <https://github.com/seattlerb/image_science>


### 미리보기 생성

다음의 Method는 미리보기를 보여주는 역할을 한다. 짧은 코드라서 Ruby를
모르더라도 쉽게 읽을 수 있을 것 같은데, 임시 파일명을 정의한 후에 그
파일(미리보기 파일)이 디스크에 실제로 있는지 검사하여 있을 경우에는 이
파일을 읽어들이고, 그렇지 않은 경우에는 Object Storage의 원본을 받아서
Resize와 Crop을 한 후에 미리보기로 저장하는 하는 일을 하도록 되어있다.
(물론, 새로 만든 미리보기를 다음을 위해 그 위치에 저장하는 일도 한다.)

```ruby
  def thumb
    obj = cont.object(params[:object])
    FileUtils.mkpath('tmp/thumbs')
    cache = "tmp/thumbs/#{obj.etag}-#{obj.escaped_name}"
    debug cache

    if cache && File.exists?(cache)
      debug "File exists: #{cache}. using it!"
      image = MiniMagick::Image.open(cache)
    else
      debug "Generate Thumb from #{obj.temp_url(30)}..."
      image = MiniMagick::Image.open(obj.temp_url(30))
      resize_with_crop(image, 200, 200)
      image.write(cache)
    end
    send_data image.to_blob, type: 'image/jpg', disposition: 'inline'
  end
```

위의 Method에서 사용된 `resize_with_crop`은 아래와 같은 `private` Method를
이용하고 있다. (<https://gist.github.com/maxivak/3924976> 에서 긁어온
코드를 기반으로 작성되었다.)

```ruby
    # https://gist.github.com/maxivak/3924976
    def resize_with_crop(img, w, h, options = {})
      gravity = options[:gravity] || :center
      w_original, h_original = [img[:width].to_f, img[:height].to_f]
      op_resize = ''
      if w_original * h < h_original * w
        op_resize = "#{w.to_i}x"
        w_result = w
        h_result = (h_original * w / w_original)
      else
        op_resize = "x#{h.to_i}"
        w_result = (w_original * h / h_original)
        h_result = h
      end

      w_offset, h_offset = crop_offsets_by_gravity(
        gravity, [w_result, h_result], [ w, h])

      img.combine_options do |i|
        i.resize(op_resize)
        i.gravity(gravity)
        i.crop "#{w.to_i}x#{h.to_i}+#{w_offset}+#{h_offset}!"
      end

      img
    end
```

아래의 부속함수도 한 몫을 한다.

```ruby
    GRAVITY_TYPES = [ :north_west, :north, :north_east, :east, :south_east, :south, :south_west, :west, :center ]
    def crop_offsets_by_gravity(
      gravity, original_dimensions, cropped_dimensions)
      raise(ArgumentError, "Gravity must be one of #{GRAVITY_TYPES.inspect}") unless GRAVITY_TYPES.include?(gravity.to_sym)
      raise(ArgumentError, "Original dimensions must be supplied as a [ width, height ] array") unless original_dimensions.kind_of?(Enumerable) && original_dimensions.size == 2
      raise(ArgumentError, "Cropped dimensions must be supplied as a [ width, height ] array") unless cropped_dimensions.kind_of?(Enumerable) && cropped_dimensions.size == 2

      original_width, original_height = original_dimensions
      cropped_width, cropped_height = cropped_dimensions

      vertical_offset = case gravity
        when :north_west, :north, :north_east
          then 0
        when :center, :east, :west
          then [ ((original_height - cropped_height) / 2.0).to_i, 0 ].max
        when :south_west, :south, :south_east
          then (original_height - cropped_height).to_i
      end

      horizontal_offset = case gravity
        when :north_west, :west, :south_west
          then 0
        when :center, :north, :south
          then [ ((original_width - cropped_width) / 2.0).to_i, 0 ].max
        when :north_east, :east, :south_east
          then (original_width - cropped_width).to_i
      end

      return [ horizontal_offset, vertical_offset ]
    end
```

이렇게 만들어진 Method는 아래와 같이 route를 잡아서 사용하게 된다.

```diff
--- a/config/routes.rb
+++ b/config/routes.rb
@@ -3,6 +3,9 @@ Rails.application.routes.draw do
   get '/logout', to: 'sessions#logout'
   resources :users
   resources :albums
+  get '/albums/:id/:object', to: 'albums#thumb', as: 'thumb',
+    constraints: { object: /.+/ }
+
   # The priority is based upon order of creation: first created -> highest prio
rity.
   # See how all your routes lay out with "rake routes".
 
```

위의 코드가 동작하는 로그를 보면, 아래와 같이 새로 미리보기를 만들거나...

```text
### DEBUG: Generate Thumb from https://hkg02.objectstorage.softlayer.net:443/v1/AUTH_00aa00aa-00aa-00aa-00aa-00aa00aa00aa/caos/CM2016/iaas-marketshare.jpg?temp_url_sig=e000020f07040500090c090e06090a001030d0d0&temp_url_expires=1459097817...
```

또는 이미 존재하는 미리보기 파일을 다시 사용하게 된다.

```text
### DEBUG: File exists: tmp/thumbs/a208008e00104b0a004509e0b40800a2-CM2016%2FCM2016.JPG. using it!
```

## Etag의 활용!

기능을 처음 구현할 때에는 "Cache가 있으면 되겠지" 막연히 생각했었는데,
실제로 동작하는 것을 보니 이 Cache의 적중을 확인하는 일 자체가 부하를
줄 수 있다는 것을 알게 되었다. (Cache 파일의 이름에 `Etag`를 사용하고
있었지만, 이 Etag 값을 매번 API Call을 통해 확인하도록 작성되었었다.)

`Etag`는 HTTP Protocol의 표준 Header 중 하나로, 해당 리소스의 변경
여부에 대한 정확한 식별을 가능하게 해주는 값이다.

일반적인 파일의 생을 보면, 같은 이름을 갖은 채로 그 내용이 계속해서
변하게 되듯이, 웹 상의 URI도 같은 URI를 유지한 채, 그 내용이 변경될 수
있다. 이 때, `Last-Modified` 같은 값으로도 간접적으로 내용의 변화를
추정할 수도 있지만, 보다 명확하게 파일의 내용에 대한 Fingerprint를
제공하는 값이 `Etag`이다.

말하자면, 우리가 일반적인 파일의 내용에 대한 무결성을 확인하기 위해
종종 `MD5SUM`이나 `SHA1SUM`을 이용하는 방식과 유사한 것을 Web에 옮겨둔
것인데, 실제로 Swift에서는 Object의 `MD5SUM` 값을 이용하여 `Etag`를
생성한다.

정확하게 Cache해라!
: Object Storage를 사용하여 Application을 작성할 때, 전송량과 불필요한
  API Call을 줄이기 위해서는 적절한 정보를 이용하여 판별이 가능하도록
  Caching하는 것이 필요하다!

아래와 같은 변경으로 이제, API Call을 하지 않도고 Cache의 변경 여부를
확인할 수 있게 되었다.


```diff
--- a/app/controllers/albums_controller.rb
+++ b/app/controllers/albums_controller.rb
@@ -28,15 +28,15 @@ class AlbumsController < ApplicationController
   end
 
   def thumb
-    obj = cont.object(params[:object])
     FileUtils.mkpath('tmp/thumbs')
-    cache = "tmp/thumbs/#{obj.etag}-#{obj.escaped_name}"
+    cache = "tmp/thumbs/#{params[:etag]}-#{params[:object]}"
     debug cache
 
     if cache && File.exists?(cache)
       debug "File exists: #{cache}. using it!"
       image = MiniMagick::Image.open(cache)
     else
+      obj = cont.object(URI.decode(params[:object]))
       debug "Generate Thumb from #{obj.temp_url(30)}..."
       image = MiniMagick::Image.open(obj.temp_url(30))
       resize_with_crop(image, 200, 200)
--- a/app/views/albums/show.html.erb
+++ b/app/views/albums/show.html.erb
@@ -9,7 +9,9 @@
     <% @items.each do |item| %>
     <div class="col-md-3">
       <div class="thumbnail">
-        <%= image_tag thumb_url(id: @album.id, object: item['object']) %>
+        <%= image_tag thumb_url(id: @album.id,
+                                etag: item['etag'],
+                                object: url_encode(item['object'])) %>
         <div class="caption">
           <%= item['filename'] %>
           <%= number_with_delimiter item['bytes'], delimiter: ',' %> bytes
--- a/config/routes.rb
+++ b/config/routes.rb
@@ -3,7 +3,7 @@ Rails.application.routes.draw do
   get '/logout', to: 'sessions#logout'
   resources :users
   resources :albums
-  get '/albums/:id/:object', to: 'albums#thumb', as: 'thumb',
+  get '/albums/:id/:etag/:object', to: 'albums#thumb', as: 'thumb',
     constraints: { object: /.+/ }
 
   # The priority is based upon order of creation: first created -> highest priority.
```

아... 길다...

Select의 구현 등, 재미있는 부분이 더 있었던 것 같은데, 그냥 줄인다.
자세한 내용이 궁금하다면 다음 URL을 참고하시기 바란다.

* <https://github.com/hardenedlayer/caos>

---


# 참고: 자료형

## Ruby 자료구조

`search()`가 반환하는 데이터의 구조

```ruby
{
  :count=>3,
  :total=>3,
  :items=> [{
    "container"=>"caos",
    "name"=>"M2016/check.jpg",
    "object"=>"M2016/check.jpg",
    "meta"=>{"event"=>"Meeting 2016"},
    "meta_event"=>"Meeting 2016",
    "content_type"=>"application/x-www-form-urlencoded",
    "type"=>"object"
  }, {
    "container"=>"caos",
    "name"=>"M2016",
    "object"=>"M2016",
    "meta"=>{},
    "content_type"=>"application/directory",
    "type"=>"object"
  }]
}
```

`Connection`:

```ruby
#<SoftLayer::ObjectStorage::Connection:0x00000006ac7a78
  @authuser="IBMOS000000-1:user",
  @authkey="00aa00aa00aa00aa00aa00aa00aa00aa00aa00aa00aa00aa00aa00aa00aa00aa",
  @auth_url="https://hkg02.objectstorage.softlayer.net/auth/v1.0",
  @retry_auth=true,
  @proxy_host=nil,
  @proxy_port=nil,
  @authok=true,
  @http={},
  @storagehost="hkg02.objectstorage.softlayer.net",
  @storagepath="/v1/AUTH_00aa00aa-00aa-00aa-00aa-00aa00aa00aa",
  @storageport=443,
  @storagescheme="https",
  @authtoken="AUTH_tk00bb00bb00bb00bb00bb00bb00bb00bb">
```

`Container`:

```ruby
#<SoftLayer::ObjectStorage::Container:0x00000006a676f0
  @connection=#<SoftLayer::ObjectStorage::Connection:0x00000006ac7a78 ...>,
  @name="caos",
  @metadata={
    :bytes=>20720,
    :count=>2,
    :metadata=>{},
    :container_read=>nil,
    :container_write=>nil
  }>
```

`StorageObject`:

```ruby
#<SoftLayer::ObjectStorage::StorageObject:0x00000006a61098
  @container=#<SoftLayer::ObjectStorage::Container:0x00000006a676f0 ...>,
  @containername="caos",
  @name="M2016/check.jpg",
  @make_path=false,
  @escaped_name="M2016%2Fcheck.jpg",
  @storagepath="caos/M2016%2Fcheck.jpg">
```

## HTTP/REST API 자료구조

Connection:

```console
$ curl -i -H "X-Auth-User: IBMOS000000-1:user" -H "X-Auth-Key: 00aa00aa00aa00aa00aa00aa00aa00aa00aa00aa00aa00aa00aa00aa00aa00aa" https://hkg02.objectstorage.softlayer.net/auth/v1.0
HTTP/1.1 200 OK
Content-Length: 1348
X-Auth-Token-Expires: 6019
X-Auth-Token: AUTH_tk00bb00bb00bb00bb00bb00bb00bb00bb
X-Storage-Token: AUTH_tk00bb00bb00bb00bb00bb00bb00bb00bb
X-Storage-Url: https://hkg02.objectstorage.softlayer.net/v1/AUTH_00aa00aa-00aa-00aa-00aa-00aa00aa00aa
Content-Type: application/json
X-Trans-Id: tx503060bd015045090038a-00560a3060
Date: Tue, 29 Mar 2016 08:31:28 GMT

{"clusters": {"lon02": "https://lon02.objectstorage.softlayer.net/auth/v1.0", "syd01": "https://syd01.objectstorage.softlayer.net/auth/v1.0", "mon01": "https://mon01.objectstorage.softlayer.net/auth/v1.0", "dal05": "https://dal05.objectstorage.softlayer.net/auth/v1.0", "ams01": "https://ams01.objectstorage.softlayer.net/auth/v1.0", "tor01": "https://tor01.objectstorage.softlayer.net/auth/v1.0", "hkg02": "https://hkg02.objectstorage.softlayer.net/auth/v1.0", "mex01": "https://mex01.objectstorage.softlayer.net/auth/v1.0", "par01": "https://par01.objectstorage.softlayer.net/auth/v1.0", "sjc01": "https://sjc01.objectstorage.softlayer.net/auth/v1.0", "mil01": "https://mil01.objectstorage.softlayer.net/auth/v1.0", "fra02": "https://fra02.objectstorage.softlayer.net/auth/v1.0", "sng01": "https://sng01.objectstorage.softlayer.net/auth/v1.0", "che01": "https://che01.objectstorage.softlayer.net/auth/v1.0", "sao01": "https://sao01.objectstorage.softlayer.net/auth/v1.0", "mel01": "https://mel01.objectstorage.softlayer.net/auth/v1.0", "tok02": "https://tok02.objectstorage.softlayer.net/auth/v1.0"}, "storage": {"default": "public", "public": "https://hkg02.objectstorage.softlayer.net/v1/AUTH_00aa00aa-00aa-00aa-00aa-00aa00aa00aa", "private": "https://hkg02.objectstorage.service.networklayer.com/v1/AUTH_00aa00aa-00aa-00aa-00aa-00aa00aa00aa"}}
$ 
```

Containers:

```console
$ curl -i -H "X-Auth-Token: AUTH_tk00bb00bb00bb00bb00bb00bb00bb00bb" https://hkg02.objectstorage.softlayer.net/v1/AUTH_00aa00aa-00aa-00aa-00aa-00aa00aa00aa
HTTP/1.1 200 OK
Content-Length: 5
X-Account-Meta-Nas-Id: 9951291
X-Account-Object-Count: 216
X-Account-Storage-Policy-Standard-Container-Count: 1
X-Timestamp: 1455261835.42166
X-Account-Meta-Cdn-Id: 77605
X-Account-Meta-Temp-Url-Key: 7d000d05f0f906000404
X-Account-Storage-Policy-Standard-Object-Count: 216
X-Account-Bytes-Used: 2184419091
X-Account-Container-Count: 1
Content-Type: text/plain; charset=utf-8
Accept-Ranges: bytes
X-Account-Storage-Policy-Standard-Bytes-Used: 2184419091
X-Trans-Id: tx0a0000ca0c0e40c090700-00560a30ba
Date: Tue, 29 Mar 2016 08:32:58 GMT

caos
$ 
```

Objects:

```console
$ curl -i -H "X-Auth-Token: AUTH_tk00bb00bb00bb00bb00bb00bb00bb00bb" https://hkg02.objectstorage.softlayer.net/v1/AUTH_00aa00aa-00aa-00aa-00aa-00aa00aa00aa/caos
HTTP/1.1 200 OK
Content-Length: 2808
X-Container-Object-Count: 216
Accept-Ranges: bytes
X-Storage-Policy: standard
X-Container-Bytes-Used: 2184419091
X-Timestamp: 1458488683.49562
Content-Type: text/plain; charset=utf-8
X-Trans-Id: tx43518729a0c94bd4a4a6c-0056fa3ddb
Date: Tue, 29 Mar 2016 08:33:31 GMT

DSC_2361.JPG
DSC_2362.JPG
DSC_2367.JPG
<...>
DSC_2787.JPG
DSC_2794.JPG
DSC_2800.JPG
$ 
```

Objects JSON:

```console
$ curl -i -H "X-Auth-Token: AUTH_tk00bb00bb00bb00bb00bb00bb00bb00bb" https://hkg02.objectstorage.softlayer.net/v1/AUTH_00aa00aa-00aa-00aa-00aa-00aa00aa00aa/caos -H "Accept: application/json"
HTTP/1.1 200 OK
Content-Length: 40725
X-Container-Object-Count: 216
Accept-Ranges: bytes
X-Storage-Policy: standard
X-Container-Bytes-Used: 2184419091
X-Timestamp: 1458488683.49562
Content-Type: application/json; charset=utf-8
X-Trans-Id: tx4472e8d531ce4f72912f9-0056fa4072
Date: Tue, 29 Mar 2016 08:44:34 GMT

[
   {
      "content_type" : "application/x-www-form-urlencoded",
      "hash" : "cf93b87dc130fbbe581ff80beb27a21f",
      "last_modified" : "2016-03-29T05:02:50.316780",
      "name" : "DSC_2361.JPG",
      "bytes" : 9489650
   },
   {
      "content_type" : "application/x-www-form-urlencoded",
      "hash" : "8ab55e50252c5c979c73e390ceb940da",
      "last_modified" : "2016-03-29T05:11:30.491620",
      "name" : "DSC_2362.JPG",
      "bytes" : 12908274
   },
   {
      "name" : "DSC_2800.JPG",
      "bytes" : 10559058,
      "content_type" : "application/x-www-form-urlencoded",
      "hash" : "e3577896d7907445b0b4c60e3571dcba",
      "last_modified" : "2016-03-29T04:46:33.867930"
   }
]
$ 
```


# 외부연결

* <https://github.com/hardenedlayer/softlayer-object-storage-ruby>
* <https://github.com/hardenedlayer/caos>
* <https://github.com/softlayer/softlayer-object-storage-backup>

