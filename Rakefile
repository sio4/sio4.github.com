# encoding: UTF-8
require 'rubygems'
require 'pp'
require 'bundler/setup'
require 'jekyll'
include Jekyll::Filters

options = Jekyll.configuration({})
site = Jekyll::Site.new(options)

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
  `linkchecker http://localhost:4000/`
end

task :serve, [:env] => [:tags, :categories, :post_refs] do |t, args|
  if args.env != nil then
    env=args.env
  else
    env='development'
  end
  `rm -rf _site`
  sh "JEKYLL_ENV=#{env} bundle exec jekyll serve --watch"
end

task :post_refs do
  site.read

  html = ''
  html << <<-HTML
---
---
  HTML
  site.collections['posts'].docs.each do |post|
    post_data = post.to_liquid
    html << <<-HTML
[#{post_data['title']}]:{% post_url #{File.basename(post.path, ".md")} %}
    HTML
  end

  File.open('_post_references.md', 'w+') do |file|
    file.puts html
  end
end

desc 'Generate tags page'
task :tags do
  puts "Generating tags..."
  site.read

  ## clear existing files
  `rm -rf tags; mkdir tags`
  `mkdir -p _includes`

  ## prefix for tags cloud
  cloud = ''
  cloud << <<-CLOUD
		<div class="cloud tac">
  CLOUD

  ## calculate step for font size
  fsize_l = 1.6
  fsize_s = 0.7
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

  site.tags.sort.each do |tag, posts|
    puts "processing %5d %s..." % [posts.count, tag]

    ## header for <tag>.html
    html = ''
    html << <<-HTML
---
layout: page
title: Postings tagged as "#{tag}"
---
<ul class="items">
HTML

    ## body for <tag>.html
    posts.each do |post|
      post_data = post.to_liquid
      html << <<-HTML
 <li>» <span class="meta">#{post.date.strftime('%F %T')}</span>
   <a href="#{post.url}">#{post_data['title']}</a>
 </li>
      HTML
    end

    ## footer for <tag>.html
    html << <<-HTML
</ul>
    HTML
    
    File.open("tags/#{tag}.html", 'w+') do |file|
      file.puts html
    end

    ## entry item for tags.html, cloud.
    if posts.count < min_post_count
      next
    end

    font_size = fsize_s + (posts.count * step)
    cloud << <<-CLOUD
			<span class="nw"><a href="/tags/#{tag}.html"
				style="font-size: #{font_size}em; line-height:#{font_size}rem"
				title="Postings tagged #{tag}">#{tag}</a></span>
    CLOUD
  end

  ## postfix for tags cloud
  cloud << <<-CLOUD
		</div>
  CLOUD

  File.open('_includes/tags.html', 'w+') do |file|
    file.puts cloud
  end
    
  puts 'Done.'
end


desc 'Generate category pages'
task :categories do
  puts "Generating categories..."
  site.read

  `rm -rf categories; mkdir categories`
  `mkdir -p _includes`

  site.data['categories'].each do |cat|
    cname = cat['name']
    fname = cat['id']
    puts "processing #{cname}/#{fname}..."

    html = ''
    html << <<-HTML
---
layout: page
title: "#{cat['name']}"
---
{% assign category = page.name |remove: '.html' %}
<div class="category-description"><p>#{cat['description']}</p><p></p></div>
<div class="wall-panel" id="blog-posts">
  <ul class="items">
  {% for post in site.categories[category] %}
    <li><i class="fa fa-file-o heading"></i>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <span class="meta">{{ post.date |date: '%F %T' }}</span>
      <div class="tags tar">
      {% for tag in post.tags %}<a class="tag-item" href="/tags/{{ tag }}.html"
        title="View posts tagged with &quot;{{ tag }}&quot;">{{ tag }}</a>
      {% endfor %}
      </div>
    </li>
  {% endfor %}
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
