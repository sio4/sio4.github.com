---
title: '{{ replace (index (split .File.ContentBaseName "-") 3) "-" " " | title }}'
subtitle:
tags: [{{ index (split .File.Dir "/") 1 }}]
categories: [{{ index (split .File.Dir "/") 1 }}]
images:
date: '{{ .Date }}'
draft: true
---
