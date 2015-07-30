# encoding: UTF-8

desc 'Generate tags page'
task :tags do
  puts "Generating tags..."
  require 'rubygems'
  require 'jekyll'
  include Jekyll::Filters
  
  options = Jekyll.configuration({})
  site = Jekyll::Site.new(options)
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
    <span class="nw"><a href="/tags/#{tag}.html" title="Postings tagged #{tag}"
        style="font-size: #{font_size}em; line-height:#{font_size}rem"
       >#{tag}</a></span>
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

  puts "processing #{site.categories}..."
  site.categories.sort.each do |category, posts|
    cat_name = posts.first.to_liquid['category']
    cat_file = category.split.join('-')
    puts "processing #{category} (#{cat_name}/#{cat_file})..."

    cloud << <<-CLOUD
    <li><a href="/categories/#{cat_name}.html"
      title="Postings on #{cat_name}">#{cat_name}</a>
      <span class="post-count">» #{posts.count}</span></li>
    CLOUD

    html = ''
    html << <<-HTML
---
layout: page
title: Postings on "#{cat_name}"
---
<ul class="posts">
HTML

    posts.each do |post|
      post_data = post.to_liquid
      html << <<-HTML
 <li>» <span class="meta">#{post.date.strftime('%F %T')}</span>
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
