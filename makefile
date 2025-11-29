
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

