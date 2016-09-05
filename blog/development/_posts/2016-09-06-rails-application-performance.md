---
title: "CAOS #3 Rails Application의 성능 분석"
tags: Ruby Ruby-on-Rails Profiling 성능
image: /attachments/20160428-caos/caos-performance.png
banner: /attachments/20160428-caos/caos-performance.png
date: 2016-09-06 03:00:00 +0900
---
대부분의 프로그램은 여러 개로 나누어진 Routine(그것을 함수, Method,
뭐라 부르든)의 집합이며, 동시에 이것들의 반복되는 상호 호출의 결과이다.
따라서 전체 소프트웨어의 실행 시간은 이 단위 Routine이 소모하는 시간의
합이며, 그 중에는 분명히 절대적/상대적으로 "혼자 바쁜" 또는 "혼자 느린"
누군가가 있게 마련이다. 어느 집합이든 통하는 얘기다.

바로 이 전체를 느리게 만드는데 큰 공을 세운 지점을 찾아내어 개선의 주요
Point로 삼을 수 있도록 돕는 행위를 소프트웨어 공학에서는 Profiling이라고
부른다.

![](/attachments/20160428-caos/caos-performance.png){:.fit.dropshadow}

C 프로그래머로 살던 시절에는, 업무 영역의 특징도 있거니와 Profiling
자체에 대한 개인적인 호기심도 있어서 꽤 재미나게 Profiling을 하곤
했었지만, 근래에 와서는 "그런 것이 있었나?" 거의 잊고 살고 있었다.
그런데 우연히, Cloud 환경의 Web Album을 만든다더니 결과적으로 Ruby/Rails
환경의 Profiling까지 해보게 되었는데, 이 시리즈의 마지막 글은 바로 이
Rails의 Profiling에 대한 이야기이다.

여는 글을 비롯하여 이 시리즈의 글들은 다음의 순서를 참고하길 바라며,

* [CAOS, Cloud Album on Object Storage] -  *The Begining~!*  
* [CAOS #1 Rails 기반 환경 구성]
* [CAOS #2 SoftLayer Object Storage 다루기]
* CAOS #3 Rails Application의 성능 분석 <--*현위치*

그 중간 과정에서 만들어진 부수적인 기록도 관심이 있으면 참고하길 바란다.

* [SoftLayer Object Storage와 임시 URL]
* [SoftLayer Object Storage와 임시 URL #2] 

[SoftLayer Object Storage와 임시 URL]:{% post_url 2016-03-22-tempurl-for-softlayer-object-storage %}
[SoftLayer Object Storage와 임시 URL #2]:{% post_url 2016-03-31-tempurl-for-softlayer-object-storage-2 %}

[CAOS, Cloud Album on Object Storage]:{% post_url 2016-04-28-cloud-album-on-object-storage %}
[CAOS #1 Rails 기반 환경 구성]:{% post_url 2016-07-07-rails-env-especially-for-caos %}
[CAOS #2 SoftLayer Object Storage 다루기]:{% post_url 2016-09-05-softlayer-object-storage-and-caos %}

아! 사실 이 글은, 본 시리즈보다 부수적인 기록 중 하나인
[SoftLayer Object Storage와 임시 URL #2]와
엮인 글이다. 함께 참고하면 좋을 것 같다.


---


{:#so-slow}
# 느려! 너무 느려!

* TOC
{:toc .half.pull-right}

SoftLayer를 처음 접하면서부터 안타깝게 느끼는 부분 중 하나가 API의
부실함이다 보니, 이 성능문제를 처음 만났을 때에는 "역시 부실하군!"
하고 넘어갈 판이었다. 그런데 내 성격이 또 그렇지는 못하지? 정확하게
판단을 해야 덮을 수가 있으니 일이 점점 커져간다!

{:#install-softlayer-api}
## Timing!

별도의 도구 없이, 간편하게 약식 Profiling을 하고자 할 때, 많이 쓰이는
방식은 바로 Timing Print이다. 자신의 코드 상의 각 지점에 시간을 재는
루틴을 추가하여 각 단계의 차를 구하고 화면이나 로그에 찍어보는 것이다.

대충, 아래와 같은 식으로 사용하게 되는데, 아래의 예에서 숫자로 된
부분은 각각 전체 프로그램의 진행 시간과 단위 부분의 시간을 표시하도록
기능을 추가해본 것이다.

```
### Timing:  0.000000s/ 0.000000s for just before connection...
### Timing:  0.610005s/ 0.610005s for connected! container...

### Timing:  1.872474s/ 1.262469s for about to getting object...
### Timing:  1.872521s/ 0.000047s for just before connection...
### Timing:  2.625202s/ 0.752680s for connected! container...
### Timing:  4.035913s/ 1.410711s for object! bytes...
### Timing:  4.623212s/ 0.587299s for object! modified...
### Timing:  4.623272s/ 0.000060s for object! etag...
### Timing:  4.623288s/ 0.000016s for object! temp_url...

### Timing:  5.279788s/ 0.656499s for about to getting object...
### Timing:  5.279823s/ 0.000035s for just before connection...
### Timing:  5.955398s/ 0.675575s for connected! container...
### Timing:  7.136822s/ 1.181424s for object! bytes...
### Timing:  7.748384s/ 0.611563s for object! modified...
### Timing:  7.748433s/ 0.000048s for object! etag...
### Timing:  7.748452s/ 0.000019s for object! temp_url...
```

이 방식의 한계는, 자신이 작성하는 부분에 대해서는 그나마 정확한
계산이 가능하지만 남이 작성한 library를 이용할 때에는 그 내부 사정을
전혀 알 길이 없다는 점이다. 또한, I/O 소모 시간 등, 주변요소에 의한
영향을 평가하기도 쉽지 않다.

이러한 한계를 넘어, 프로그램의 세부적인 곳까지 뒤져서 세부적인 자료을
얻게 해주는 것이 파로 Profiler의 역할인데, Ruby의 세계에는 [ruby-prof]
라는 도구가 있었다!

[ruby-prof]:https://github.com/ruby-prof/ruby-prof

# Ruby-Prof

## 준비

ruby-prof를 Rails Application 분석을 위해 사용하기 위해서는 다음과
같이 먼저 Gem을 등록해준다.

```
$ echo "gem 'ruby-prof'" >> Gemfile
$ bundle install
<...>
Installing ruby-prof 0.15.9 with native extensions
<...>
Bundle complete! 22 Gemfile dependencies, 66 gems now installed.
Bundled gems are installed into ./vendor/bundle.
$ 
```

## 단순한 사용

그리고 다음과 같이 원하는 부분에 Profiling 설정을 해주면 해당 구간이
종료될 때 Profiling 정보를 출력하게 된다.

```ruby
# profile the code
RubyProf.start
# ... code to profile ...
result = RubyProf.stop

# print a flat profile to text
printer = RubyProf::FlatPrinter.new(result)
printer.print(STDOUT)
```

또는

```ruby
# profile the code
result = RubyProf.profile do
  # ... code to profile ...
end

# print a graph profile to text
printer = RubyProf::GraphPrinter.new(result)
printer.print(STDOUT, {})
```

결과의 예는 다음과 같다.

```
### Timing:  0.910453s/ 0.910453s for got connection and container!
### Timing:  1.523795s/ 0.613342s for ok, done!
Measure Mode: wall_time
Thread ID: 70039105450160
Fiber ID: 70038806698340
Total: 1.543857
Sort by: self_time

 %self      total      self      wait     child     calls  name
 40.44      0.624     0.624     0.000     0.000        3   OpenSSL::SSL::SSLSocket#connect
 27.94      0.431     0.431     0.000     0.000        7   <Class::IO>#select
 16.94      0.322     0.262     0.060     0.000        3   TCPSocket#initialize
  7.64      0.125     0.118     0.000     0.007       13   OpenSSL::SSL::SSLSocket#sysread_nonblock
<...>
 %self      total      self      wait     child     calls  name
  0.73      0.596     0.004     0.592     0.000        1   Kernel#sleep
  0.00      0.000     0.000     0.000     0.000        1   Array#-
  0.00      0.000     0.000     0.000     0.000        1   Mutex#synchronize
  0.00      0.000     0.000     0.000     0.000        1   Symbol#to_proc
  0.00      0.596     0.000     0.000     0.596        1   Puma::ThreadPool::Reaper#start!
<...>
 %self      total      self      wait     child     calls  name
  9.40      0.592     0.056     0.536     0.000        1   Kernel#sleep
  0.00      0.000     0.000     0.000     0.000        1   Mutex#synchronize
  0.00      0.592     0.000     0.000     0.592        1   Puma::ThreadPool::AutoTrim#start!
```

아... 뭔가 좋으면서도 좀 모자라다... 예전에 쓰던 Valgrind 나 뭐
그런 도구로 Callee Map 그리던 시절 생각도 나고 뭐...

그런에 아래 방식은, 비교적 직관적인 분석이 가능한 결과를 보여준다.

## Full App Profiling

Rails App 분석을 위한 방식인데,
[README](https://github.com/ruby-prof/ruby-prof#profiling-rails)에
기술된 방식을 따라 해보면, App 호출에 대하여 HTML Page를 생성해주는
방식으로 보다 쉽게 분석이 가능하도록 해준다.

설정은 아래와 같고,

```diff
--- a/config.ru
+++ b/config.ru
@@ -2,3 +2,4 @@
 
 require ::File.expand_path('../config/environment', __FILE__)
 run Rails.application
+use Rack::RubyProf, path: 'tmp/profile'
```

결과는 다음과 같은 파일로 만들어진다.


```
$ ls -l tmp/profile
<...>
-rw-rw-r-- 1 sio4 sio4   56819  3월 30 13:01 albums-1-call_stack.html
-rw-rw-r-- 1 sio4 sio4    1083  3월 30 13:01 albums-1-flat.txt
-rw-rw-r-- 1 sio4 sio4  613006  3월 30 13:01 albums-1-graph.html
-rw-rw-r-- 1 sio4 sio4  125094  3월 30 13:01 albums-1-graph.txt
<...>
$ 
```

그 결과를 보면 아래처럼 Callee Map 비슷한 것을 만들어준다. :-)

![](/attachments/20160428-caos/caos-pf-21-callstack-1.png){:.fit.dropshadow}

위 그림은 성능문제가 있는 상태에서 Call을 분석한 것인데, 단일 요청에
대한 처리량 중에서 `#show`의 비중이 99.37에 달하며 `Hash#each`에 의한
부분이 그 중 70% 이상으로 가장 높은 것을 볼 수 있다. 이 `each` 루프의
안으로 들어가보면, `get_info`를 12번 호출하면서 그 안의 모든 Callee들이
12번 이상 씩 호출된 것을 확인할 수 있다.

반면에, 개선된 상태인 아래 그림을 보면,

![](/attachments/20160428-caos/caos-pf-23-callstack-2.png){:.fit.dropshadow}

`#show`의 비중이 약 72%로 줄었을 뿐만 아니라, `#set_container`나
`#objects_detail` 등의 비중이 오히려 `Hash#each`보다 높은 것을 볼
수 있다. (아니, 반대로 이 녀석의 비중이 줄어든 것이지)

이 루프의 안쪽을 자세히 보면 그 이유를 알 수 있는데, `get_info`를
포함하여 그 내부의 것들의 호출 회수가 1회로 줄어든 것을 알 수 있다.

아래의 두 표는 이 호출 관계를 표 형태로 보여주는 것이며, 각 블록은
맨 위의 루틴의 내부 Callee들을 소요시간 순으로 정렬하여 보여주고 있으며,
그 내용은 위의 Map과 같다.

![](/attachments/20160428-caos/caos-pf-22-graph-1.png){:.fit.dropshadow}
![](/attachments/20160428-caos/caos-pf-24-graph-2.png){:.fit.dropshadow}


# 그래서 뭐가 변했다고?

그건 앞선 글
[SoftLayer Object Storage와 임시 URL #2]에서
정리를 해 뒀고, 이 글은 그 분석 과정만 담은 거라고~


---

좀... 쫓기듯이 이번 시리즈를 마무리한다.

다음에 기회가 되면, 다른 각도에서 다시 Cloud 시대의 Application에
대해 얘기할 수 있었으면 좋겠다. :-)


