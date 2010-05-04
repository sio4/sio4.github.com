
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
  <div class="cloud">
  CLOUD

  site.categories.sort.each do |category, posts|

    s = posts.count
    font_size = 0.6 + (s * 0.2)
    cloud << <<-CLOUD
    <a href="/tags/#{category}.html" title="Postings tagged #{category}"
        style="font-size: #{font_size}em; line-height:#{font_size}em"
       >#{category}</a>
    CLOUD

    html = ''
    html << <<-HTML
---
layout: page
title: Postings tagged as "#{category}"
---
<h1>Postings tagged as "#{category}"</h1>

<ul class="posts">
HTML

    posts.each do |post|
      post_data = post.to_liquid
      html << <<-HTML
 <li>» <span class="meta-data">#{post.date}</span>
   <a href="#{post.url}">#{post_data['title']}</a>
 </li>
      HTML
    end

    html << <<-HTML
</ul>
    HTML
    
    File.open("tags/#{category}.html", 'w+') do |file|
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
