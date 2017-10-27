# encoding: UTF-8
require 'rubygems'
require 'pp'
require 'bundler/setup'
require 'jekyll'
include Jekyll::Filters

options = Jekyll.configuration({})
site = Jekyll::Site.new(options)
site.read

task :default do
  puts "Jekyll Tasks"
  puts ""
  puts "  rake check                : display site configuration"
  puts "  rake todo                 : display TODO from articles"
  puts "  rake syntax               : build stylesheet for syntax highlighter"
  puts "  rake linkchecker          : linkchecker for local test site"
  puts "  rake post_refs            : generate '_post_references.md'"
  puts "  rake tags                 : build tag cloud and tag pages"
  puts "  rake categories           : build categories pages"
  puts "  rake serve                : run test server within development mode"
  puts "  rake serve[debug]         : run test server within debug mode"
  puts "  rake serve[production]    : run test server within production mode"
end

desc 'Check configuration'
task :check do
  pp options
end

desc 'Check TODO list'
task :todo do
  puts "Things to do ========================================================"
  puts `grep TODO blog/*/*/*`
end

# dark: base16.dark base16.monokai monokai monokai.sublime
# light: github base16 base16.solarized
desc 'Build stylesheet for syntax highlighter'
task :syntax do
  `bundle exec rougify style base16.dark > assets/syntax.css`
end

desc 'Check links'
task :linkchecker do
  exec 'linkchecker', '--ignore-url=.*glyphicons-halflings-regular.*', 'http://localhost:4000/'
end

task :serve, [:env] => [:tags, :categories, :post_refs] do |t, args|
  if args.env != nil then
    env=args.env
  else
    env='development'
  end
  sh "JEKYLL_ENV=#{env} bundle exec jekyll clean"
  sh "JEKYLL_ENV=#{env} bundle exec jekyll serve --watch --incremental --drafts"
end

task :post_refs do

  html = ''
  html << <<-HTML
---
---
  HTML
  site.collections['posts'].docs.each do |post|
    post_data = post.to_liquid
    path = post.path.sub(/.*_posts\//, "_posts/")
    html << <<-HTML
[#{post_data['title']}]:{% link #{path} %}
    HTML
  end

  File.open('__references.md', 'w+') do |file|
    file.puts html
  end
end

desc 'Generate tags page'
task :tags do
  puts "Generating tags..."
  #site.read

  ## clear existing files
  `mkdir -p tags`
  `for f in tags/*; do [ "$f" != "tags/index.html" ] && rm $f; done`
  `mkdir -p _includes`

  ## prefix for tags cloud
  cloud = ''
  cloud << <<-CLOUD
    <!-- do not edit directly. auto generated by rake:tags -->
		<div class="tagcloud">
  CLOUD

  ## calculate step for font size
  fsize_l = 2.4
  fsize_s = 0.8
  max_post_count = 7
  min_post_count = 2

  site.tags.sort.each do |tag, posts|
    current_post_count = posts.count
    if current_post_count > max_post_count
      max_post_count = current_post_count
    end
  end
  step = ((fsize_l - fsize_s) / (max_post_count - min_post_count)).round(2)
  puts "font step:#{step}, largest posts:#{max_post_count}"

  site.tags.sort_by{ |n, posts| -posts.count}.each do |tag, posts|
    puts "processing %5d %s..." % [posts.count, tag]
    slug = Jekyll::Utils.slugify(tag)
    if site.data['tags'][slug]
      data = site.data['tags'][slug]
      if data['ko']
        title = "#{data['ko']} (#{data['en']})"
        tagname = data['ko']
      else
        title = data['en']
        tagname = data['en']
      end
    else
      title = tag
      tagname = tag
    end

    ## header for <tag>.html
    html = ''
    html << <<-HTML
---
layout: page
title: "##{title}"
---
<!-- do not edit directly. this file was automatically generated by rake -->
{% assign category = page.name |remove: '.html' %}
<div class="category-description"><p>Postings tagged as "#{title}"</p></div>
<div class="wall-panel" id="blog-archives">
  <ul class="posts nodot">
HTML

    ## body for <tag>.html
    posts.each do |post|
      post_data = post.to_liquid
      html << <<-HTML
    <li><a href="#{post.url}">#{post_data['title']}</a>
      <span class="post-meta pull-right">
        <i class="fa fa-calendar"></i> #{post.date.strftime('%F')}
      </span>
    </li>
      HTML
    end

    ## footer for <tag>.html
    html << <<-HTML
  </ul>
</div>
    HTML
    
    File.open("tags/#{slug}.html", 'w+') do |file|
      file.puts html
    end

    ## entry item for tags.html, cloud.
    if posts.count < min_post_count
      next
    end

    font_size = fsize_s + (posts.count * step)
    cloud << <<-CLOUD
			<span class="tagdrop"><a href="/tags/#{slug}/"
				style="font-size: #{font_size}em; line-height:#{font_size}rem"
				title="Postings tagged #{title}">#{tagname}</a></span>
    CLOUD
  end

  ## postfix for tags cloud
  cloud << <<-CLOUD
		</div>
  CLOUD

  ### DISABLED
  File.open('_includes/tags.html', 'w+') do |file|
    file.puts cloud
  end
    
  puts 'Done.'
end


desc 'Generate category pages'
task :categories do
  puts "Generating categories..."
  #site.read

  `mkdir -p categories`
  `for f in categories/*; do [ "$f" != "categories/index.html" ] && rm $f; done`
  `mkdir -p _includes`

  site.data['categories'].each do |cat|
    cname = cat['name']
    fname = cat['id']
    puts "processing #{cname}/#{fname}..."

    html = ''
    html << <<-HTML
---
layout: page
title: "@#{cat['name']}"
---
<!-- do not edit directly. this file was automatically generated by rake -->
{% assign category = page.name |remove: '.html' %}
<div class="category-description"><p>#{cat['description']}</p></div>
<div class="wall-panel" id="blog-archives">
  <ul class="posts nodot">{%
  for post in site.categories[category] %}
    <li><a href="{{ post.url }}">{{ post.title }}</a>
      <span class="post-meta pull-right">
        <i class="fa fa-calendar"></i> {{ post.date |date: '%F' }}
      </span>
      <div class="post-tags text-muted">{%
    for tag in post.tags %}{%
      if site.data.tags[tag] %}{%
        if site.data.tags[tag].ko %}{%
          assign tagname = site.data.tags[tag].ko %}{%
        else %}{%
          assign tagname = site.data.tags[tag].en %}{%
        endif %}{%
      else %}{%
        assign tagname = tag %}{%
      endif %}
        <a class="tag-item" href="/tags/{{ tag |slugify }}/">{{ tagname }}</a>{%
    endfor %}
      </div>
    </li>{%
  endfor %}
  </ul>
</div>
HTML

    File.open("categories/#{fname}.html", 'w+') do |file|
      file.puts html
    end
  end
  puts 'Done.'
end
# vim: set ts=2 sw=2:
