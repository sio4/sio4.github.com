---
redirect_from: /blog/2007/05/21/the-power-of-code-review/
title: '"The Power of Code Review"'
tags: 형상관리 개발 협업 코드리뷰
categories: ["development"]
date: 2007-05-21T14:15:45+09:00
modified: 2010-07-02T18:59:11+09:00
---
코드리뷰에 대한 좋은 글이 있어서 인용한다. 그런데, 한 문장도 빼놓기가
아까운게... 잔뜩 인용해버렸다. :-)

[BSBlog » Blog Archive » The Power of Code Review](http://benjamin.smedbergs.us/blog/2007-04-10/the-power-of-code-review/)

> For the most part, reviewers are not responsible for ensuring correct
> code function: unit tests are much better suited to that task.
> What reviewers are responsible for is much more “social”, and typically
> does not require a detailed line-by-line analysis of the code to perform
> a review. In many cases, important parts of the review process should
> happen before a coder starts working on a patch, or after APIs are
> designed but before implementation.
>
> There are some important side effects of the review process that are
> also beneficial:
> 
> - More than one person knows every piece of code. Many Mozilla modules
>   have grown a buddy system where two people know the code intimately.
>   This is very helpful because it means that a single person going
>   on vacation doesn’t imperil a release or schedule.
> - Reviewing is mentoring. New hackers who are not familiar with a
>   project can be guided and improved through code review. Initiall,
>   this requires additional effort and patience from the reviewer.
>   Code from inexperienced hackers deserves a much more detailed review.
> - A public review log is a great historical resource for new and
>   experienced hackers alike. Following CVS blame and log back to bug
>   numbers can give lots of valuable historical information.
> 
> There can’t really be general guidelines on how much time to spend
> reviewing. Some experienced hackers may spend up to 50% of their time
> doing reviews (I typically spend two days a week doing design and code
> reviews and various planning tasks). This can be hard, because coding
> feels much more productive than reviewing.

나의 지론, 휴가가고 싶으면 잘 하란 말이다.

