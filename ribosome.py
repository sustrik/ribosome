#!/usr/bin/env python

from __future__ import print_function

#
# Copyright (c) 2015 Ali Zaidi  All rights reserved.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"),
# to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom
# the Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
# THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
# IN THE SOFTWARE.
#

####################
# Helper functions #
####################

def __line__():
    """Return the line number from which this functions got called.
    http://stackoverflow.com/q/6810999"""
    import inspect
    frame = inspect.stack()[1][0]
    return inspect.getframeinfo(frame).lineno


#################
# Prologue code #
#################

PROLOGUE_LINE = __line__()
PROLOGUE = """#!/usr/bin/env python

#
# The initial part of this file belongs to the ribosome project.
#
# Copyright (c) 2015 Ali Zaidi  All rights reserved.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"),
# to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom
# the Software is furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
# THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
# IN THE SOFTWARE.
#

from __future__ import print_function, division

import sys
import re


class Block:
    # Block represents a rectangular area of text.

    def __init__(self, s):
        self.text = ['']
        self.width = 0
        if len(s) > 0:
            self.text = s.splitlines()
            self.width = max(map(lambda x: len(x), self.text))

    # Weld the supplied block to the right of this block
    def add_right(self, block):
        for i, l in enumerate(block.text):
            try:
                self.text[i] += ' ' * (self.width - len(self.text[i])) + l
            except:
                self.text.append((' ' * self.width) + l)
        self.width += block.width

    # Weld the supplied block to the bottom of this block
    def add_bottom(self, block):
        self.text += block.text
        self.width = max([self.width, block.width])

    # Trim the whitespace from the block
    def trim(self):
        top = bottom = left = right = -1
        for i, l in enumerate(self.text):
            if not l.strip() == '':
                # line is not empty
                if top == -1: top = i
                bottom = i
                ls = len(l) - len(l.lstrip())
                left = ls if left == -1 else min([left, ls])
                rs = len(l.rstrip())
                right = rs if right == -1 else max([right, rs])
        if bottom == -1:
            # empty block
            self.text = ['']
            self.width = 0
            return
        # Strip off the top and bottom whitespace.
        self.text = self.text[top:bottom+1]
        # Strip off the whitespace on the left and on the right.
        self.text = [l.rstrip()[left:right+1] for l in self.text]
        # Adjust the overall width of the block.
        self.width = max([len(l) for l in self.text])
        
    def write(self, out, tabsize):
        for l in self.text:
            # If required, replace the initial whitespace by tabs.
            if tabsize > 0:
                ws = len(l) - len(l.lstrip())
                l = '\t' * (ws // tabsize) + ' ' * (ws % tabsize) + l.lstrip()
            # Write an individual line to the output file.
            out.write(l + '\\n')

    # Returns offset of the last line in block
    def last_offset(self):
        if len(self.text) == 0: return 0
        return len(self.text[-1]) - len(self.text[-1].lstrip())

    # Size of a tab. If set to zero, tabs are not generated.
    _tabsize = 0

    # The output file, or, alternatively, stdout.
    outisafile = False
    out = sys.stdout

    # This is ribosome call stack. At each level there is a list of
    # text blocks generated up to that point.
    stack = [[]]

    # Redirects output to the specified file.
    @staticmethod
    def output(filename):
        Block.close()
        Block.outisafile = True
        Block.out = open(filename, "w")
    
    # Redirects output to the specified file.
    # New stuff is added to the existing content of the file.
    @staticmethod
    def append(filename):
        Block.close()
        Block.outisafile = True
        Block.out = open(filename, "a")

    # Redirect output to the stdout.
    @staticmethod
    def stdout():
        Block.close()
        Block.outisafile = False
        Block.out = sys.stdout

    # Sets the size of the tab
    @staticmethod
    def tabsize(size):
        Block._tabsize = size

    # Flush the data to the currently open file and close it.
    @staticmethod
    def close():
        for b in Block.stack[-1]:
            b.write(Block.out, Block._tabsize)
        Block.stack = [[]]
        if Block.outisafile: Block.out.close()

    # Adds one . line from the DNA file.
    @staticmethod
    def add(line, bind):

        # If there is no previous line, add one.
        if(len(Block.stack[-1]) == 0):
            Block.stack[-1].append(Block(''))

        # In this block we will accumulate the expanded line.
        block = Block.stack[-1][-1]

        # Traverse the line and convert it into a block.
        i = 0
        while True:
            j = re.search(r'[@&][1-9]?\{', line[i:])
            j = len(line) if j == None else j.start()+i

            # Process constant blocks of text.
            if i != j:
                block.add_right(Block(line[i:j]))

            if len(line) == j: break

            # Process an embedded expression
            i = j
            j += 1
            level = 0
            if line[j] in [str(x) for x in range(1, 10)]:
                level = int(line[j])
                j += 1
            # Find corresponding }.
            par = 0
            while True:
                if line[j] == '{':
                    par += 1
                elif line[j] == '}':
                    par -= 1
                if par == 0: break
                j += 1
                if j >= len(line):
                    raise Exception('Unmatched {')
       
            # Expression of higher indirection levels are simply brought
            # down by one level.
            if level > 0:
                if line[i+1] == '1':
                    block.add_right(Block('@' + line[(i+2):(j+1)]))
                else:
                    ll = list(line)
                    ll[i+1] = str(int(ll[i+1]) - 1)
                    line = ''.join(ll)
                    block.add_right(Block(line[i:(j+1)]))
                i = j + 1
                continue
            # We are at the lowest level of embeddedness so we have to
            # evaluate the embedded expression straight away.
            idx = i+2 if level == 0 else i+3
            expr = line[idx:j]
            Block.stack.append([])
            val = eval(expr, bind)
            top = Block.stack.pop()
            if len(top) == 0:
                val = Block(str(val))
            else:
                val = Block("")
                for b in top:
                    val.add_bottom(b)
            if line[i] == '@': val.trim()
            block.add_right(val)
            i = j + 1
    
    # Adds newline followed by one . line from the DNA file.
    @staticmethod
    def dot(line, bind):
        Block.stack[-1].append(Block(''))
        Block.add(line, bind)

    # Adds newline followed by leading whitespaces copied from the previous line
    # and one line from the DNA file.
    @staticmethod
    def align(line, bind):
        if len(Block.stack[-1]) == 0:
            n = 0
        else:
            n = Block.stack[-1][-1].last_offset()
        Block.stack[-1].append(Block(''))
        Block.add(' ' * n, None)
        Block.add(line, bind)

    # Report an error that happened when executing RNA file.
    @staticmethod
    def rethrow(e, rnafile, linemap):
        import traceback
        exc = traceback.format_exc()
        ls = exc.splitlines()[1:-1]
        for i, l in enumerate(ls):
            l = l.strip()
            if l.startswith('File "<%s>"' % rnafile):
                num = int(l.split(',')[1].replace('line', ''))
                for j, m in enumerate(linemap):
                    if m[0] == None or m[0] > num: break
                j -= 1
                num = num - linemap[j][0] + linemap[j][2]
                ts = l/split(',')
                l = ', '.join(['File "<%s>"' % linemap[j][1], 
                               'line %d' % num, 
                               ts[-1]])
                print(l)
        sys.exit(1)

            
# Escape sequence for @
at = '@'

# Escape sequence for &
amp = '&'

# Escape sequence for /
slash = '/'
    

"""

import os
import sys
import argparse
import re

# Set up the arguments parser.
parser = argparse.ArgumentParser(
    prog="ribosome code generator, version 1.17",
    usage="%(prog)s [options] <dna_file> [-- <arguments-to-dna>*]")
parser.add_argument('dna', type=argparse.FileType('r'))
parser.add_argument('--rna', action='store_true')

# Pwd
__dir__ = os.path.dirname(os.path.realpath(__file__))

# Given that we can 'require' other DNA files, we need to keep a stack of
# open DNA files. We also keep the name of the file and the line number to
# be able to report errors. We'll also keep track of the directory the DNA file
# is in to be able to correctly expand relative paths in /!include commands.
dnastack = [(None, 'ribosome.py', PROLOGUE_LINE + 1, __dir__)]

# Handle to output stream
rna = None

# Line counter
rnaln = 1

# Lines
linemap = []

# DNA helper functions
def dnaerror(s):
    print("%s:%s - %s" %(dnastack[-1][1], dnastack[-1][2], s), file=sys.stderr)

# Generate new line(s) into the RNA file.
def rnawrite(s):
    global rnaln
    global dnastack
    linemap.append([rnaln, dnastack[-1][1], dnastack[-1][2]])
    rna.write(s)
    rnaln += len(s.splitlines())

args, unknown = parser.parse_known_args()

# Handle the CLI arguments.
if args.rna:
    rna = sys.stdout

else:
    name, ext = os.path.splitext(args.dna.name)
    rnafile = name + '.rna'
    rna = open(rnafile, 'w')

# Generate RNA Prologue code
rnawrite(PROLOGUE)
if not args.rna:
    rnawrite('try:\n')

# Process the DNA file.
dirname = os.path.dirname(os.path.realpath(args.dna.name))
dnastack.append([args.dna, args.dna.name, 0, dirname])

while True:

    # Get the next line. Unwind the include stack as necessary.
    line = None
    while True:
        line = dnastack[-1][0].readline()
        if line != '': break
        dnastack.pop()[0].close()
        if len(dnastack) == 1: break

    if line == '': break

    # we are counting lines so we can report line numbers in errors
    dnastack[-1][2] += 1


    # @alixedi - Now that we are doing this in Python, we must have some way
    # of dealing with indentation - for instance, this does not work:
    # for i in [1, 2, 3]:
    # .    @{i}
    # Neither does this work:
    # for i in [1, 2, 3]:
    #     .@{i}
    # I want to be able to support the former.

    # Lets save the left and right spaces, if any
    lspace = line.replace(line.lstrip(), '')
    # Add 4 spaces to accommodate our try except clause if not rna
    if not args.rna:
        lspace = lspace + ' ' * 4
    rspace = line.replace(line.rstrip(), '')
    # followed by stripping the line
    line = line.strip()

    # All Python lines are copies to the RNA file verbatim
    if len(line) == 0 or not line[0] in ['.']:
        rnawrite(lspace + line + rspace)
        continue

    # Removes dot from the beginning of the line and 
    # trailing $ sign, if present.
    line = line[1:]

    if len(line) > 0:
        if line[-1] == '$': line = line[0:-1]

    # Make sure there are no tabs in the line
    if not line.find('\t') == -1:
        dnaerror('tab found in the line, replace it by space')

    # Find first two non-whitespace which can possibly form a command.
    try:
        firsttwo = line.lstrip()[0:2]
    except:
        firsttwo = None

    # /+ means that the line is appended to the previous line.
    if firsttwo == '/+':
        rnawrite('''%sBlock.add('%s', locals())%s''' % (lspace, line.lstrip()[2:], rspace))

    # /= means that the lines is aligned with the previous line.
    elif firsttwo == '/=':
        rnawrite('''%sBlock.align('%s', locals())%s''' % (lspace, line.lstrip()[2:], rspace))

    # /! means a command follows.
    elif firsttwo == '/!':
        line = line.lstrip()[2:]
        match = re.match(r'^[0-9A-Za-z_]+', line)
        if match == None:
            dnaerror('/! should be followed by an identifier')
        command = match.group(0)

        # A subset of commands is simply translated to corresponding
        # commands in the RNA file.
        if command in ['output', 'append', 'stdout', 'tabsize']:
            rnawrite('%sBlock.%s%s' % (lspace, line, rspace))
            continue

        # The argument string will be added at the end of each integration of
        # the following loop, except for the last one.
        if command == 'separate':
            identity = lambda x: x
            separator = eval('identity(%s)' % line[8:])
            cname = "____separate_%d____" % rnaln
            rnawrite('%s%s = True%s' % (lspace, cname, rspace))
            line = dnastack[-1][0].readline()
            dnastack[-1][2] += 1
            if line == None or line[0] == '.' \
                            or (not 'for' in line and not 'while' in line):
                dnaerror('"separate" command must be followed by a loop')
            rnawrite(lspace + line + rspace)
            rnawrite('%s    if %s:%s' % (lspace, cname, rspace))
            rnawrite('%s        %s = False%s' % (lspace, cname, rspace))
            rnawrite('%s    else:%s' % (lspace, rspace))
            rnawrite('%s        Block.add("%s", locals())%s' % (lspace, separator, rspace))
            continue

        # Open the file and put it on the top of the DNA stack. Relative paths
        # are expanded using the directory the parent DNA file resides in as
        # a starting point.
        if command == 'include':
            identity = lambda x: x
            filename = eval('identity(%s)' % line[7:])
            filename = os.path.join(dnastack[-1][3], filename)
            dirname = os.path.dirname(filename)
            dnastack.append([open(filename, 'r'), filename, 0, dirname])
            continue

        dnaerror('unknown command %s' % command)

    else:
        # There's no command in the line. Process it in the standard way.
        rnawrite("""%sBlock.dot(%s, locals())%s""" % (lspace, repr(line), rspace))

# Generate RNA epilogue code.
dnastack = [[None, 'ribosome', __line__() + 1]]
rna.write('\n')
if not args.rna:
    rna.write('except Exception as e:\n')
    rna.write('    LINEMAP = [\n')
    last = None
    for le in linemap:
        if (last == None) or \
           (le[1] != last[1]) or \
           ((le[0] - last[0]) != (le[2] - last[2])):
            rna.write('        [%s, "%s", %s],\n' % (le[0], le[1], le[2]))
            last = le
    rna.write('        [None]\n')
    rna.write('    ]\n')
    rna.write('    Block.rethrow(e, "%s", LINEMAP)' % rnafile)
    rna.write('\n')

rna.write("\n")
rna.write("Block.close()\n")

# Flush the RNA file.
rna.close()

if not args.rna:
    import subprocess
    # Execute the RNA file. Pass it any arguments not used by ribosome.
    result = subprocess.call([sys.executable, rnafile] + unknown)
    # Delete the RNA file.
    os.remove(rnafile)

    sys.exit(result)
