/*

  Copyright (c) 2014-2015 Contributors as noted in AUTHORS file.

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"),
  to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense,
  and/or sell copies of the Software, and to permit persons to whom
  the Software is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included
  in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
  IN THE SOFTWARE.

*/

//Small changes to Basic classes to make life easier.
Array.prototype.last = function() {
    return this[this.length - 1];
}

function Ribosome() {

    var fs = require('fs');

    function Block(s) {
        var self = this;
        this.text = [];
        this.width = 0;

        if (s != null) {
            this.text = s.split('\n');
            this.text.forEach(function(line) {
                self.width = Math.max(self.width, line.length);
            });
        }

        this.add_right = function(block) {
            var i = 0;
            var self = this;
            block.text.forEach(function(line) {
                if (self.text.length > i) {
                    self.text[i] = self.text[i] +
                        Array(self.width - self.text[i].length + 1).join(' ') + line;
                } else {
                    self.text[i] = Array(self.width + 1).join(' ') + line;
                }
                i++;
            });
            this.width += block.width;

        };

        this.add_bottom = function(block) {
            this.text = this.text.concat(block.text);
            this.width = Math.max(this.width, block.width);

        };


        this.trim = function() {

            var top = -1;
            var bottom = -1;
            var left = -1;
            var right = -1;

            this.text.forEach(function(line, index) {

                if (line.trim() != '') {
                    if (top == -1) {
                        top = index;
                    }
                    bottom = index;
                    if (left == -1) {
                        left = line.length - (line + 'W').trim().length + 1;
                    } else {
                        left = Math.min(left, line.length - (line + 'W').trim().length + 1);
                    }
                    if (right == -1) {
                        right = ('W' + line).trim().length - 1;
                    } else {
                        right = Math.max(right, ('W' + line).trim().length - 1);
                    }

                }

            });

            if (bottom == -1) {
                this.text = [];
                this.width = 0;
                return;
            }

            this.text = this.text.slice(top, bottom + 1);

            this.text.forEach(function(line, index, array) {
                array[index] = line.slice(left, right);
            });

            this.width = right - left;

        };

        this.write = function(out, outisafile, tabsize) {
            this.text.forEach(function(line) {

                if (tabsize > 0) {
                    var ws = line.length - (line + 'w').trim().length + 1;
                    var line = Array(Math.floor(ws / tabsize) + 1).join('\t') +
                        Array((ws % tabsize) + 1).join(' ') + (line + 'W').trim().slice(0, -1);
                }
                if (outisafile == true) {
                    fs.appendFileSync(out, line);
                    fs.appendFileSync(out, '\n');
                } else {
                    out.write(line);
                    out.write('\n');
                }
            });

        };

        this.last_offset = function() {
            if (this.text.length == 0) {
                return 0;
            } else {
                var last = this.text[this.text.length - 1];
                return last.length - (last + "w").trim().length + 1;
            }
        };

    }

    var tabsize = 0;

    var outisafile = false;
    var out = process.stdout;
    var append_flag = false;

    var stack = [
        []
    ];


    this.output = output;

    function output(filename) {
        close();
        outisafile = true;
        append_flag = false;
        out = filename;
    };

    this.append = append;

    function append(filename) {
        close();
        outisafile = true;
        append_flag = true;
        out = filename;
    };

    this.stdout = stdout;

    function stdout() {
        close();
        outisafile = false;
        out = process.stdout;
    };



    this.tabsize = change_tabsize;

    function change_tabsize(size) {
        tabsize = size;
    };

    this.close = close;

    function close() {
        if (append_flag == false && typeof out === "string") {
            if (fs.existsSync(out)) {
                fs.unlinkSync(out);
            }
        }
        stack.last().forEach(function(b) {
            b.write(out, outisafile, tabsize);
        });
        stack = [
            []
        ];
    }

    this.add = add;

    function add(line, leval) {

        if (stack.last().length == 0) {
            stack.last().push(new Block(''));
        }

        var block = stack.last().last();

        var i = 0;

        while (true) {
            var j = line.substr(i).search(/[@&][1-9]?\{/);
            if (j == -1) {
                j = line.length;
            } else {
                j += i;
            }

            if (i != j) {
                block.add_right(new Block(line.slice(i, j)));
            }
            if (j == line.length) {
                break;
            }

            i = j;
            j++;

            var level = parseInt(line.charAt(j), 10);
            if (isNaN(level)) {
                level = 0;
            } else {
                j++;
            }

            var par = 0;

            while (true) {
                if (line.charAt(j) == '{') {
                    par++;
                } else {
                    if (line.charAt(j) == '}') {
                        par--;
                    }
                }

                if (par == 0) {
                    break;
                }
                j++;

                if (j >= line.length) {
                    process.stderr.write('SyntaxError: Unmatched {');
                }
            }

            if (level > 0) {
                if (line.charAt(i + 1) == '1') {
                    block.add_right(new Block('@' + line.slice(i + 2, j + 1)));
                } else {
                    line = line.slice(0, i + 1) + (parseInt(line.charAt(i + 1)) - 1) + line.slice(i + 2);
                    block.add_right(new Block(line.slice(i, j + 1)));
                }
                i = j + 1;
                continue;
            }

            //TODO level can only be zero here.
            var expr = line.slice((level == 0) ? i + 2 : i + 3, j);

            stack.push([]);
            var val = leval(expr);
            var top = stack.pop();
            if (top.length == 0) {
                val = new Block(val.toString());
            } else {
                val = new Block('');
                top.forEach(function(b) {
                    val.add_bottom(b);
                });
            }

            if (line.charAt(i) == '@') {
                val.trim();
            }
            block.add_right(val);
            i = j + 1;

        }



    }

    this.dot = dot;

    function dot(line, leval) {
        stack.last().push(new Block(''));
        add(line, leval);
    }

    this.align = align;

    function align(line, leval) {
        var n;
        if (stack.last().length == 0) {
            n = 0;
        } else {
            n = stack.last().last().last_offset();
        }

        stack.last().push(new Block(''));

        add(Array(n + 1).join(' '));
        add(line, leval);
    }


    this.rethrow = rethrow;

    function rethrow(e, rnafile, linemap) {

        var msg = e.stack.split("\n");
        for (var i = 1; i < msg.length; i++) {
            if (msg[i].indexOf(".rna:") != -1) {
                var lindexes = msg[i].split(":");
                var rrow = parseInt(lindexes[lindexes.length - 1]);
                var column = parseInt(lindexes[lindexes.length - 2]);
                var rcolumn = 0;
                var filename;
                for (var j = 0; j < linemap.length - 1; j++) {
                    if (linemap[j][0] <= column) {
                        rcolumn = column - linemap[j][0] + 1;
                        filename = linemap[j][1];
                    } else {
                        break;
                    }
                }
                msg[i] = msg[i].replace(/\(.*\)$/, "(" + filename + ":" + rcolumn + ":" + rrow + ")");
            }
        }
        msg.forEach(function(item) {
            process.stderr.write(item);
            process.stderr.write("\n");
        });

        process.exit(1);
    }

}

var ribosome = new Ribosome();

function at() {
    return '@';
}

function amp() {
    return '&';
}

function slash() {
    return '/';
}

///////////////////////////////////////////////////////////////////////
/*
The code that belongs to the protein project ends at this point of the      
RNA file and so does the associated license. What follows is the code        
generated from the DNA file.                                                 
*/
///////////////////////////////////////////////////////////////////////
