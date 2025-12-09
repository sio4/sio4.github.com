
default:
	# rules:
	#	check
	#		linkcheck

check: linkcheck

linkcheck:
	# check 404s
	muffet \
		--include='http://localhost.*' \
		--exclude='.*fn:[0-9]+' \
		http://localhost:1313/

install-muffet:
	go install github.com/raviqqe/muffet/v2@latest

relref:
	hugo list all \
		|cut -d, -f1,3 \
		|sed 's;^content/\([^,]*\),\(.*\);[\2]:{{< relref "/\1" >}};' \
		> relref.md
