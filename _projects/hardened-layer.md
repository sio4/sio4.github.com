---
title: Hardened Layer
subtitle: A Sample Project for SoftLayer API Test
repository: https://github.com/c12g/hardened-layer-rails
lang: en-US
comments: true
social-share: true
translate: true
date: 2016-02-14T00:00:00+09:00
---
**Hardened Layer** is a custom portal for SoftLayer cloud service.

currently, It supports RESTful API for SoftLayer.  SoftLayer also provides
REST API but I think it is not a RESTful one. (It is just a Wrapped API of
XML-RPC API, I think.)

* Emger.js Console: <https://github.com/c12g/hardened-layer-ui>
* Rails API Backend: <https://github.com/c12g/hardened-layer-rails>

## Install and Configuration

1. Just clone it and setup rails/bundle.
1. Rename `/config/application.yml.template` to `/config/application.yml`
and edit it.
1. Run `bundle exec rails server` and go!

There is no Database setup because it just uses **SoftLayer's Ruby API**
as Backend and there is no local data yet. (but as you see, project name
is "Hardened Layer" so sometime later, I will add something special.

## Environment

It was developed with:

* Ruby 2.1.2p95 (2014-05-08), the version from Ubuntu 15.04.
* Rails 4.2.5, the version from current Gem repository.

## Limitations

* No Testcase provided.
* No Test site are available.

## Todo

- [ ] Simple UI with Ember.
- [ ] More browsing API support.
- [ ] Creation and Deletion support.
- [ ] Management support including reboot, shutdown,...
- [ ] Provides monitoring statistics for each VMs.
- [ ] Test on Heroku and other PaaS.

## Resources


## Special Thanks to

* My grand boss :-(

## License

Hardened Layer: A custom portal for SoftLayer cloud service.

Copyright (C) 2015,2016  Yonghwan SO

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

