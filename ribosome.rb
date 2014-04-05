#
# Copyright (c) 2014 Martin Sustrik  All rights reserved.
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

# Parse the command line arguments.
if(ARGV.size() != 2)
    puts("usage: ribosome <dna-file> <input-file>")
    exit()
end
dnafile = ARGV[0]
inputfile = ARGV[1]
if(inputfile[-4..-1] == ".xml")
    type = "x"
elsif(inputfile[-5..-1] == ".json")
    type = "j"
else
    $stderr.puts("input file must be either .json or .xml")
    exit()
end
if(dnafile[-4..-1] == ".dna")
    rnafile = dnafile[0..-5] + ".rna.rb"
else
    rnafile = dnafile + ".rna.rb"
end

# Open the files for the dna-to-rna translation step.
dna = File.open(dnafile, "r")
rna = File.open(rnafile, "w")

# Initialise the root object.
if(type == 'j')
    rna.write("require 'rubygems'\n")
    rna.write("require 'json'\n")
    rna.write("$root = JSON.parse(File.read('")
    rna.write(inputfile)
    rna.write("'))\n");
end
if(type == 'x')
    rna.write("require 'rexml/document'\n")
    rna.write("$root = REXML::Document.new(File.new('")
    rna.write(inputfile)
    rna.write("')).root\n")
end

# Initial output channel is stdout.
rna.write("$____out____ = $stdout\n")

# Process the DNA file.
ln = 0
while(line = dna.gets())
    line = line.lstrip()
    ln += 1

    # Lines starting with ! are ribosome commands.
    if(line[0] == ?!)
        words = line.split(/\s+/)

        # !output redirects the output to a different file.
        if(words[0] == '!output')
            if(words.size() != 2)
                $stderr.puts("#{dnafile}:#{ln} - command '!output' requires one argument, found #{words.size() - 1}")
                exit()
            end
            rna.write("$____out____ = File.open(")
            rna.write(words[1])
            rna.write(", 'w')\n")
            next
        end

        # !stdout redirects the output to stdout.
        if(words[0] == '!stdout')
            if(words.size() != 1)
                $stderr.puts("#{dnafile}:#{ln} - command '!stdout' requires no arguments, found #{words.size() - 1}")
                exit()
            end
            rna.write("$____out____ = $stdout\n")
            next
        end

        # Invalid command.
        $stderr.puts("#{dnafile}:#{ln} - invalid command '#{words[0]}'")
        exit()
    end

    # Lines starting with . need more processing.
    if(line[0] == ?.)
        newline = true
        rna.write('$____out____.write("')
        i = 1
        while(i < line.size() - 1)

            # Characters ' and \ have to be escaped.
            if(line[i] == ?")
                rna.write('\\"')
                i += 1
                next
            end
            if(line[i] == ?\\)
                rna.write('\\\\')
                i += 1
                next
            end

            # Common character.
            if(line[i] != ?@)
                rna.write(line[i].chr())
                i += 1
                next
            end

            # Operator @.
            i += 1

            # @ at the end of line means that newline should not be added.
            if(i == line.size() - 1)
                newline = false
                i += 1
                next
            end

            # @@ is an escape sequence and should be replaced by @.
            if(line[i] == ?@)
                rna.write('@')
                i += 1
                next
            end

            # Otherwise it's a ruby expression to evaluate.
            # The expression is terminated by another @.
            rna.write('" + (')
            loop do
                if(i == line.size() - 1)
                    $stderr.puts("#{dnafile}:#{ln} - embedded expression is not terminated")
                    exit()
                end
                if(line[i] == ?@)
                    i += 1
                    break
                end
                rna.write(line[i].chr())
                i += 1
            end
            rna.write(').to_s() + "')
        end
        if(newline)
            rna.write('\\n')
        end
        rna.write("\")\n")
        next
    end

    # Other lines are copied to the RNA file verbatim.
    rna.write(line)

end

# Flush the output file.
rna.write("$____out____.close()\n")

# Flush the RNA file.
rna.close()
dna.close()

# Execute the RNA file.
require(rnafile)

# Delete the RNA file.
# File.delete(rnafile)

