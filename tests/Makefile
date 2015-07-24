
CHECKS = $(wildcard *.check)

all: $(CHECKS:%.check=run-%) clean

run-%: %.sh
	@echo -n "Testing $*..."
	@./$*.sh>$*.log && echo "\033[92mOK\033[0m" || echo "\033[91mFAIL\033[0m"
	@cat $*.log

%.sh: %.rb.dna %.js.dna %.py.dna ../ribosome.rb ../ribosome.js ../ribosome.py runtest.dna
	@../ribosome.rb runtest.dna $* > $@
	@chmod +x $@

clean:
	@rm -f $(CHECKS:.check=.sh) *.out *.log
