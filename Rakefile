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

task :serve, [:env] => [:tags, :categories] do |t, args|
  if args.env != nil then
    env=args.env
  else
    env='development'
  end
  `rm -rf _site`
  sh "JEKYLL_ENV=#{env} bundle exec jekyll serve --watch"
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
  m_count = 7
  l_count = 2
  site.tags.sort.each do |tag, posts|
    c_count = posts.count
    if c_count > m_count
      m_count = c_count
    end
  end
  step = ((1.6 - 0.6) / m_count).round(2)
  puts "STEP: #{step} / #{m_count} = #{m_count * step} + 0.6"

  site.tags.sort.each do |tag, posts|
    puts "processing %5d %s..." % [posts.count, tag]

    ## header for <tag>.html
    html = ''
    html << <<-HTML
---
layout: page
title: Postings tagged as "#{tag}"
---
<ul class="posts">
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
    if posts.count < l_count
      next
    end

    s = posts.count
    font_size = 0.6 + (s * step)
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
  <ul class="posts">
  {% for post in site.categories.[category] %}
    <li>» <span class="meta">{{ post.date |date: '%F %T' }}</span>
      <a href="{{ post.url }}">{{ post.title }}</a>
      <div class="post-tags tar">
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
