# encoding: UTF-8

desc 'Generate tags page'
task :tags do
  puts "Generating tags..."
  require 'rubygems'
  require 'jekyll'
  include Jekyll::Filters
  
  options = Jekyll.configuration({})
  site = Jekyll::Site.new(options)
  site.read_posts('')

  `rm -rf tags; mkdir tags`
  `mkdir -p _includes`

  cloud = ''
  cloud << <<-CLOUD
  <div class="cloud tac">
  CLOUD

  ## step for font size
  m_count = 7
  site.tags.sort.each do |tag, posts|
    c_count = posts.count
    if c_count > m_count
      m_count = c_count
    end
  end
  step = ((2 - 0.6) / m_count).round(1)

  site.tags.sort.each do |tag, posts|

    s = posts.count
    font_size = 0.6 + (s * step)
    cloud << <<-CLOUD
    <a href="/tags/#{tag}.html" title="Postings tagged #{tag}"
        style="font-size: #{font_size}em; line-height:#{font_size}em"
       >#{tag}</a>
    CLOUD

    html = ''
    html << <<-HTML
---
layout: page
title: Postings tagged as "#{tag}"
---
<h1 class="underline">Postings tagged as "#{tag}"</h1>

<ul class="posts">
HTML

    posts.each do |post|
      post_data = post.to_liquid
      html << <<-HTML
 <li>» <span class="meta">#{post_data['published'].strftime('%F %T')}</span>
   <a href="#{post.url}">#{post_data['title']}</a>
 </li>
      HTML
    end

    html << <<-HTML
</ul>
    HTML
    
    File.open("tags/#{tag}.html", 'w+') do |file|
      file.puts html
    end
  end

  cloud << <<-CLOUD
  </div>
  CLOUD

  File.open('_includes/tags.html', 'w+') do |file|
    file.puts cloud
  end
    
  puts 'Done.'
end

task :categories do
  puts "Generating categories..."
  require 'rubygems'
  require 'jekyll'
  include Jekyll::Filters

  options = Jekyll.configuration({})
  site = Jekyll::Site.new(options)
  site.read_posts('')

  `rm -rf categories; mkdir categories`
  `mkdir -p _includes`

  cloud = ''
  cloud << <<-CLOUD
  <div class="cloud">
  <ul class="posts categories">
  CLOUD

  site.categories.sort.each do |category, posts|
    cloud << <<-CLOUD
    <li><a href="/categories/#{category}.html"
      title="Postings on #{category.capitalize}">#{category.capitalize}</a>
      - #{posts.count}</li>
    CLOUD

    html = ''
    html << <<-HTML
---
layout: page
title: Postings on "#{category.capitalize}"
---
<h1 class="underline">Postings on "#{category.capitalize}"</h1>

<ul class="posts">
HTML

    posts.each do |post|
      post_data = post.to_liquid
      html << <<-HTML
 <li>» <span class="meta">#{post_data['published'].strftime('%F %T')}</span>
   <a href="#{post.url}">#{post_data['title']}</a>
 </li>
      HTML
    end

    html << <<-HTML
</ul>
    HTML

    File.open("categories/#{category}.html", 'w+') do |file|
      file.puts html
    end
  end

  cloud << <<-CLOUD
  </ul>
  </div>
  CLOUD

  File.open('_includes/categories.html', 'w+') do |file|
    file.puts cloud
  end

  puts 'Done.'
end
