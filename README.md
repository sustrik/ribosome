RIBOSOME
=======

A simple generic code generation tool.

## In fifty words

1. You write standard Ruby scripts.
2. However, lines starting with a dot (.) go straight to the output file.
3. To expand Ruby expressions within dot-style lines use @{expr} construct.
4. Support for reading input data from JSON or XML file is provided.

## Example

```
.#include <stdio.h>
.
.int main() {
for i in 1..10
.    printf("@{11-i}!\n");
end
.    printf("Go!\n");
.    return 0;
.}
```

The script above produces the following output:

```
#include <stdio.h>

int main() {
    printf("10!\n");
    printf("9!\n");
    printf("8!\n");
    printf("7!\n");
    printf("6!\n");
    printf("5!\n");
    printf("4!\n");
    printf("3!\n");
    printf("2!\n");
    printf("1!\n");
    printf("Go!\n");
    return 0;
}
```

## Installation

Ribosome is a single Ruby script, thus all you need is to install Ruby
beforehand.

However, if you are going to use JSON input, you'll additionally have to
instal 'json' gem.

## Command line

The generator is called 'ribosome'. It takes two arguments. The script file,
also known as DNA file, and the data file in JSON/XML format:

```
$ ribosome foo.dna bar.json
```

If not needed, the data file may be ommitted.

## Documentation

DNA file is a standard Ruby program (except for the lines starting with
a dot). Therefore it is possible to just take your existing Ruby program
and run it with ribosome:

```
ribosome foo.rb
```

### Simple output

Lines starting with a dot (.) are copied directly to the output:

```
for i in 1..2
.Test!
end
```

The above script produces the following output:

```
Test!
Test!
```

Lines starting with a dot can be terminated by $ sign. The sign is optional,
unless there's a whitespace at the end of the line. In such case the $ sign
must be used to ensure that the whitespace cannot be overlooked easily.

```
.Hello!    $
```

### Redirecting output

By default, the output is directed to stdout. Therefore, you can re-direct it
using classic UNIX pipes:

```
ribosome test.dna > test.txt
```

However, you can redirect the output to a specific file directly from
the DNA file. Use 'output' function in Ruby to accomplish the task:

```
output("test.txt")
.Test!
```

To redirect the output back to stdout use 'stdout' function in Ruby:

```
output("test.txt")
.This line goes to the file!
stdout()
.This line goes to the console!
```

### Embedded expressions

Often, you need to insert a computed value to the output. You can do so by
embedding Ruby expressions to dot-style lines:

```
name = 'Fred'
.Hello, @{name}!
```
With straight Ruby functions, the return value is taken, converted into string
and written to the output.

However, if the enbedded expression produces any ribosome output itself,
it is inserted into the output file instead of the return value:

```
def greet(name)
.printf ("Hello, @{name}!\n");
end

.int main () {
.    @{greet("Alice")}
.    @{greet("Bob")}
.    return 0;
.}
```

### Input files

Code generators typically need rich structured input instead of simple
command line parameters.

Ribosome supports both JSON and XML input files. It distinguishes beween the
two based on the file extensions. Thus, JSON input files should have .json
extension and XML imput files should have .xml extension.

Imagine a JSON file that contains names of different errors:

```
 ["EINVAL", "EMFILE", "EINTR"]
```

Following DNA script will convert it into a C header file:

```
errnum = 1
for i in root
.#define @{i} @{errnum}
    errnum += 1
end
```

Note that the root of the input JSON is available as JSON object (JSON class is
defined by 'json' gem) called 'root'.

While JSON is nice and concise, in the case where you need to supply whole
blocks of code in the input file, XML fares better:

```
<root>
    <function name="foo">
    printf ("foo");
    printf ("\n");
    </end>
    <function name="bar">
    printf ("bar");
    printf ("\n");
    </end>
</root>
```

The script can access the root of the XML input as REXML::Element object
called 'root':

```
root.elements.each("function") do |m|
.void @{m.attributes["name"]}() {
.    @{m.texts.join}
.}
.
end
```

### Line concatenation

Typically, each dot-style is translated into a line in the output file.
Sometimes, however, you may want to generate complex stuff into a single
line in the output file. In such cases you can append the line directly
to the previous line. Use /+ operator to achieve such behaviour:

```
.Hello $
for i in ["Alice", "Bob", "Carol"]
.   /+@{i} $
end
./+!
```

Note that all the whitespace preceding /+ operator is silently ignored.

### Separators

One often occuring problem with code generation is to place separators between
the items of a list. Ribosome provides /! operator to help with the problem.
The line with the operator must precede Ruby loop (for, while, each or similar).
Any whitespace preceding the operator is silently ignored. Any text following
the operator is used as a separator:

```
.Hello $
./!, $
for i in ["Alice", "Bob", "Carol"]
.   /+@{i}
end
./+!
```

### Strict embedded expressions

You may have noticed that embedded expressions trim any whitespace from the
text to output. To keep the whitespace intact, use &{} instead of @{}:

```
s = " 2 "
.1@{s}3
.a&{s}3
```

The above script produces following output:

```
123
1 2 3
```

### Nested embedded expressions

Producing output that is a DNA file itself can be tricky. The main problem is
that you would have to use a lot of escape sequences. To solve that, ribosome
provides a tool called nested embedded expressions.

The embedded expressions that have been introduced so far are embedded
expressions of first level. They can be written either as @{} and &{} or,
alternatively, as @1{} and &1{}. During compilation the expression is evaluated
and the result is written to the output.

Embedded expressions of second level are written @2{} and &2{}. During
compilation they are replaced by embedded expressions of first level. Similarly,
embedded expressions of the third level are replaced by embedded expressions
of second level. Et c.

Consider, for exmaple, this script:

```
.name = "Alice"
..Hello, @2{name}!
```

It compiles to this script:

```
name = "Alice"
.Hello, @1{name}!
```

Which, in turn, is compiled to:

```
Hello, Alice!
```

### Escape functions

In the rare cases when you need to generate a sequence of characters that
accidentally matches a ribosome operator, you'll can use predefined escape
functions. For example:

```
.123@{atbrace}456
```

Results in:

```
123@{456
```

Following escape functions are supplied:

    atbrace() => @{
    atnbrace(N) => @N{    (where N is a digit)
    ampbrace() => &{
    ampnbrace(N) => &N{   (where N is a digit)
    slashplus() => /+
    slashbang() => /!

### Advanced layout management

TODO

##Syntax highlighting

Given that DNA files contain two overlapping indentations, for good readability
it is crucial to highlight the lines starting with dot (.) in a different
colour.

Currently supported highlighters:

    ribosome.vim

In the future, we intend to provide highlighting rules for the most common
editors. Any help in this area will be highly appreciated!

## Ribosome's TODO list

1. Handling of TABs

##License

Ribosome is licensed under MIT/X11 license.

