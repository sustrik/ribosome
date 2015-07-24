
CHECKS := $(wildcard *.check)
PORTS  := python2 python3 ruby node

all: $(PORTS)

$(PORTS): %: %-premsg $(CHECKS:%.check=%-%) %-postmsg


%-premsg:
	@echo "Running $* tests."

%-postmsg:
	@echo

%-python2:
	@./runtest.sh python2 py $*

%-python3:
	@./runtest.sh python3 py $*
	
%-ruby:
	@./runtest.sh ruby rb $*

%-node:
	@./runtest.sh node js $*

clean:
	rm -f *.out *.log
