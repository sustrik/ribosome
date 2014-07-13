#!/bin/sh

# Run code generation.
../ribosome $1
if test ! $? = 0
then
    exit 1
fi

# Check whether the output matches expectation.
for var in "$@"
do
    if test ! $1 = $var
    then
        if test -n "$(diff $var $var.check)"
        then
            echo "Generated file $var differs from expected output:"
            echo "$(diff $var $var.check)"
            exit 1
        fi
    fi
done

