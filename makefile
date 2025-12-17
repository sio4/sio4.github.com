
default:
	# rules:
	#	check
	#	linkcheck	check broken link
	#	relref		generate relref.md
	#	all-urls	print all external urls

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
	HUGO_OUTPUTS_HOME=markdown hugo build
	mv public/index.md relref.md

all-urls:
	hugo list published \
		|sed 's/".*",20/,20/' \
		|cut -d, -f8 \
		|grep -v ^permalink \
		|sed 's/^/[ ] /' \
