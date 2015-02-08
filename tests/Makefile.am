
%.sh: %.dna ../ribosome.rb runtest.dna
	../ribosome.rb runtest.dna $* > $@
	chmod +x $@

TESTS = \
    embedded.sh\
    precise.sh \
    dollar.sh \
    functions.sh \
    concatenation.sh \
    separate.sh \
    nested.sh \
    escape.sh \
    tabs.sh

