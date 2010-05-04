
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

  site.categories.sort.each do |category, posts|
    html = ''
    html << <<-HTML
---
layout: page
title: Postings tagged as "#{category}"
---
h1. Postings tagged as "#{category}"

HTML

    posts.each do |post|
      post_data = post.to_liquid
      html << <<-HTML
 * "#{post_data['title']}":#{post.url}
      HTML
    end

    html << <<-HTML
    </ul>
    HTML
    
    File.open("tags/#{category}.textile", 'w+') do |file|
      file.puts html
    end
  end
  puts 'Done.'
end
