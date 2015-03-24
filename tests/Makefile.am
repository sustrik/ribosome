
%.sh: %.rb.dna %.js.dna %.py.dna ../ribosome.rb ../ribosome.js ../ribosome.py runtest.dna
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
    tabs.sh \
    align.sh \
    trim.sh\
    include.sh

