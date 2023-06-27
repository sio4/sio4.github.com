#!/usr/bin/python

import sys
import os

try:
	url = sys.argv[1]
	argument = url.split('/')[2].split('@').pop().replace(':', ' ')
except:
	print "url parsing error."
	quit()

command = "xterm -e telnet %s" % argument
os.system(command)
