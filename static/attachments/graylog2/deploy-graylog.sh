#!/bin/bash

set -xe

ES_CONF=/etc/elasticsearch/elasticsearch.yml
GL_REPO=https://packages.graylog2.org/repo/packages
GL_RPKG=graylog-2.0-repository_latest.deb
GL_CONF=/etc/graylog/server/server.conf

#
#
# ----------------------------------------------------------------------------
install="sudo apt-get install -y"

#
# prerequirements
$install apt-transport-https openjdk-8-jre-headless uuid-runtime pwgen

#
# mongodb
$install mongodb-server

#
# elasticsearch
wget -qO - https://packages.elastic.co/GPG-KEY-elasticsearch \
	| sudo apt-key add -
echo "deb https://packages.elastic.co/elasticsearch/2.x/debian stable main" \
	| sudo tee -a /etc/apt/sources.list.d/elasticsearch-2.x.list
sudo apt-get update
$install elasticsearch

sudo cp -a $ES_CONF $ES_CONF.dist
sudo sed -i 's/.*cluster.name: .*/cluster.name: graylog/' $ES_CONF
sudo cat $ES_CONF |grep -v ^#

sudo systemctl daemon-reload
sudo systemctl enable elasticsearch.service
sudo systemctl restart elasticsearch.service
sudo systemctl status elasticsearch.service

#
# graylog
wget $GL_REPO/$GL_RPKG
sudo dpkg -i $GL_RPKG
sudo apt-get update

$install graylog-server

sudo cp -a $GL_CONF $GL_CONF.dist
spw=`pwgen -N 1 -s 96`
rpw=`echo -n 'p4ssw0rd' | shasum -a 256 |cut -d' ' -f1`
sudo sed -i "s/^password_secret.*/password_secret = $spw/" $GL_CONF
sudo sed -i "s/^root_password_sha2.*/root_password_sha2 = $rpw/" $GL_CONF
cat $GL_CONF |grep '^\(root_password\|password\)'

# addons
SL_REPO=https://github.com/Graylog2/graylog-plugin-slack/releases/download
SL_VERS=2.2.1
SL_DPKG=graylog-plugin-slack-$SL_VERS.deb
wget $SL_REPO/$SL_VERS/$SL_DPKG
sudo dpkg -i $SL_DPKG

NF_REPO=https://github.com/Graylog2/graylog-plugin-netflow/releases/download
NF_VERS=0.1.1
NF_DPKG=graylog-plugin-netflow-$NF_VERS.deb
wget $NF_REPO/$NF_VERS/$NF_DPKG
sudo dpkg -i $NF_DPKG



GDB_URL=http://geolite.maxmind.com/download/geoip/database/GeoLite2-City.mmdb.gz
GDB_FILE=/var/local/graylog/GeoLite2-City.mmdb
sudo mkdir /var/local/graylog
wget -nv $GDB_URL -O - |zcat |sudo tee $GDB_FILE >/dev/null

# starting
sudo systemctl daemon-reload
sudo systemctl enable graylog-server.service
sudo systemctl restart graylog-server.service
sudo systemctl status graylog-server.service

#
# nginx
$install nginx-extras

cat |sudo tee /etc/nginx/sites-available/graylog >/dev/null <<EOF
server {
  listen      80 default_server;
  listen      [::]:80 default_server ipv6only=on;
  server_name logger.example.com;

  location /api/ {
    proxy_set_header    Host \$http_host;
    proxy_set_header    X-Forwarded-Host \$host;
    proxy_set_header    X-Forwarded-Server \$host;
    proxy_set_header    X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_pass          http://127.0.0.1:12900/;
  }
  location / {
    proxy_set_header    Host \$http_host;
    proxy_set_header    X-Forwarded-Host \$host;
    proxy_set_header    X-Forwarded-Server \$host;
    proxy_set_header    X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header    X-Graylog-Server-URL http://logger.example.com/api;
    proxy_pass          http://127.0.0.1:9000;
  }
}
EOF

sudo rm /etc/nginx/sites-enabled/default
sudo ln -s ../sites-available/graylog /etc/nginx/sites-enabled/

sudo systemctl restart nginx.service
sudo systemctl status nginx.service

#
# firewall
cat |sudo tee /etc/ufw/applications.d/graylog >/dev/null <<EOF
[Graylog]
title=Graylog Inputs
description=Graylog Inputs
ports=5140/udp
EOF

cat |sudo tee -a /etc/ufw/before.rules >/dev/null <<EOF

# For Graylog's Syslog Input - START
*nat
:PREROUTING ACCEPT [0:0]
:POSTROUTING ACCEPT [0:0]
-F
-A PREROUTING -p udp -m udp --dport 514 -j REDIRECT --to-ports 5140
COMMIT
# For Graylog's Syslog Input - END
EOF

sudo ufw allow 'Nginx Full'
sudo ufw allow Graylog
sudo ufw disable && sudo ufw enable

