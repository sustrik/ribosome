RIBOSOME
=======

A simple and generic code generation tool.

It allows you to generate code in any language based on rules written in Ruby
and data supplied in JSON or XML format.

Installation
-----------

Ribosome is a single Ruby script, thus you'll need only Ruby installed.

However, if you are going to use JSON input, you'll additionally have to
instal 'json' gem ("sudo gem install json").

Command line
-----------

The generator is 'ribosome.rb'. It takes two arguments. The rule file,
also known as DNA file and the data file in JSON/XML format:

```
$ ruby ribosome.rb foo.dna foo.json
```

Example
------

Generator in 'example-errors' subdirectory generates C code. Specifically, it
turns a data file describing POSIX errors into 'errno.h' file and implementation
of standard strerror() function, stored in strerror.c file.

The input file looks like this:

```
{
    "EINVAL": "Invalid value",
    "EMFILE": "Too many open files",
    "EINTR": "Interrupted by a signal"
}
```

The file containing transformation rules (errors.dna) looks like this:

```
!output "errno.h"

errnum = 1
for i in $root
.#define @{i[0]} @{errnum}
    errnum += 1
end
.

!output "strerror.c"

.#include <errno.h>
.
.char *strerror(int errnum) {
.    switch(errnum) {
for i in $root
.    case @{i[0]}:
.        return "@{i[1]}";
end
.    default:
.        return "Unknown error";
.    }
.}
.
```

After running the code generation:

```
$ cd examples-errors
$ ruby ../ribosome.rb errors.dna errors.json
```

We get two output files.

'errno.h' looks like this:

```
#define EINTR 1
#define EINVAL 2
#define EMFILE 3
```
and 'strerror.c' file looks like this:

```
#include <errno.h>

char *strerror(int errnum) {
    switch(errnum) {
    case EINTR:
        return "Interrupted by a signal";
    case EINVAL:
        return "Invalid value";
    case EMFILE:
        return "Too many open files";
    default:
        return "Unknown error";
    }
}

```

DNA file syntax
-------------

DNA files are Ruby programs with some preprocessing applied.
Thus, following DNA will do exactly what you would expect it to do:

```
puts("Hello world!")
```

Additionally, line starting with a dot (.) are copied directly to the output.

```
.int main() {
.    return 0;
.}
```

By default, output is directed to stdout. Therefore, you can re-direct it using
classic UNIX pipes:

```
ruby ribosome.rb foo.dna foo.json > out.c
```

However, you can redirect the output to a specific file directly from
the DNA file:

```
!output "foo.c"
.int main() {
.    return 0;
.}
```

Note that all the lines starting with an exclamation mark (!) are ribosome
commands. We'll introduce more commands later on.

Also note that the argument of '!output' command is a Ruby expression.
Thus, you can do things like:

```
name = 'foo'
extension = 'c'
!output filename+'.'+extension
```

To re-direct the output back to stdout do the following:

```
!stdout
```

The most useful part of the ribosome syntax though is embedding Ruby expressions
directly into the output. The expressions should use "@{expr}" syntax:

```
name = 'Fred'
.Hello, @{name}!
```

If you want the output not to be generated into a new line, but rather let it
be appended to the last generated line, you can use plus sign (+) instead of
dot:

```
for i in 1..9
+   @{i}
end
.
```

The above program will produce following output:

```
123456789
```

As already mentioned, you specify an input file on the command line. The file
is supposed to contain data in either XML or JSON format. Ribosome expect either
'xml' or 'json' file extension and will parse the input accordingly. Resulting
tree will be accessible to your DNA script via $root variable. In case of JSON
it will contain JSON object as defined by json gem. In case of XML it will
contain root REXML::Element.

So, for example, following code will print out names and values in a JSON map:

```
for i in $root
.Name: @{i[0]}
.Value: @{i[1]}
end
```

Syntax highlighting
----------------

Given that DNA files contain two overlapping indentations, for good readability
it is crucial to highlight the lines starting with dot (.) in a different colour
than the rest of the program.

In the future, we intend to provide highlighting rules for the most common
editors. Any help in this area will be highly appreciated!

License
------

Ribosome is licensed under MIT/X11 license.

