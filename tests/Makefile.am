
%.sh: %.dna ../ribosome runtest.dna
	../ribosome runtest.dna $* > $@
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

