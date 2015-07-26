#!/bin/sh
set -e

TOOL=$1
EXT=$2
TEST=$3

LOGFILE=$TEST.$TOOL.log
OUTFILE=$TEST.$TOOL.out

$TOOL ../ribosome.$EXT $TEST.$EXT.dna >$OUTFILE

if diff $OUTFILE $TEST.check >$LOGFILE; then
	env echo -en "[\033[92mOK\033[0m] "
	rm $LOGFILE $OUTFILE
else
	env echo -en "[\033[91mFAIL\033[0m ($LOGFILE)] "
fi
