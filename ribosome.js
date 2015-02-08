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

var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;


function addslashes(str) {
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}



function usage() {
    process.stderr.write("usage: meta [options] <dna-file> <args-passed-to-dna-script>\n");
    process.exit(1);
}

function dnaerror(s) {
    process.stderr.write(dnastack.last()[1] + ":" + dnastack.last()[2] + " - " + s + "\n");
    process.exit(1);
}


function rnawrite(s) {
    linemap.push([rnaln, dnastack.last()[1], dnastack.last()[2]]);
    if (rnaopt) {
        process.stdout.write(s);
    } else {
        fs.appendFileSync(rnafile, s);
    }
    var m = s.match(/\n/g);
    rnaln += m == null ? 0 : m.length;
}

if (process.argv.length < 3) {
    usage();
}

var rnaopt;
var dnafile;
if (process.argv[2] == "--rna") {
    if (process.argv.length < 4) {
        usage();
    }

    rnaopt = true;
    dnafile = process.argv[3];

} else {
    rnaopt = false;
    dnafile = process.argv[2];
}

var dnastack = [
    [null, prefix + "/lib/node_modules/proteinjs/rna_prologue.js", 0, prefix + "/lib/node_modules/proteinjs/"]
];

if (!rnaopt) {
    if (dnafile.slice(-4) == ".dna") {
        rnafile = dnafile.slice(0, -4) + ".rna";
    } else {
        rnafile = dnafile + ".rna";
    }
}
rnaln = 1;
linemap = [];

var PROLOGUE = fs.readFileSync(prefix + "/lib/node_modules/proteinjs/rna_prologue.js", "utf8");

rnawrite(PROLOGUE);
rnawrite('\n\n//-------------Begin-------------\n\n');

if (!rnaopt) {
    rnawrite('try {\n');
}


var dirname = path.normalize(path.dirname(dnafile));
var file;
try {
    file = fs.readFileSync(dnafile, "utf8");
} catch (e) {
    process.stderr.write("The file \n'" + dnafile + "'\n doesn't exist.");
    process.exit(1);
}

dnastack.push([file.split("\n"), dnafile, 0, dirname]);

while (dnastack.length > 1) {

    var line = dnastack.last()[0][0];
    dnastack.last()[0].shift();
    dnastack.last()[2] ++;

    if (dnastack.last()[0].length == 0) {
        dnastack.pop();
    }


    if ((line.length == 0) || (line[0] != ".")) {
        rnawrite(line + '\n');
        continue;
    }

    line = line.slice(1);

    if (line.slice(-1) == "$") {
        line = line.slice(0, -1);
    }

    if (line.indexOf("\t") != -1) {
        dnaerror("tab found in the line, replace it by space");
    }

    var firsttwo = line.trim().slice(0, 2);

    if (firsttwo == "/+") {
        rnawrite("ribosome.add('" + addslashes((line + 'w').trim().slice(2, -1)) + "',function(_expr){return eval(_expr);});\n");
        continue;
    }

    if (firsttwo == "/=") {
        rnawrite("ribosome.align('" + addslashes((line + 'w').trim().slice(2, -1)) + "',function(_expr){return eval(_expr);});\n");
        continue;
    }

    if (firsttwo == "/!") {
        line = (line + 'w').trim().slice(2, -1);
        var match = line.match(/^[0-9A-Za-z_]+/);
        if (match == null) {
            dnaerror("/! should be followed by an identifier");
        }

        var command = match[0];

        if (["output", "append", "stdout", "tabsize"].indexOf(command) >= 0) {
            rnawrite("ribosome." + line + "\n");
            continue;
        }

        if (command == "separate") {
            var separator = line.match(/["'].*["']/);
            if (separator == null) {
                dnaerror("Bad command syntax");
            }
            separator = separator[0].slice(1, -1);
            var cname = "___separate_" + rnaln + "___";
            rnawrite("var " + cname + " = true;\n");
            line = dnastack.last()[0][0];
            dnastack.last()[0].shift();
            dnastack.last()[2] += 1;
            if (line == null || line[0] == "." ||
                (!line.indexOf("while") && !line.indexOf("for"))) {
                dnaerror("'sepearate' command must be folloed by a loop.");
            }

            rnawrite(line);
            rnawrite("\nif(" + cname + ") {\n")
            rnawrite("    " + cname + " = false;\n")
            rnawrite("} else {\n")
            rnawrite("    ribosome.add('" + addslashes(separator) + "',function(_expr){return eval(_expr);});\n")
            rnawrite("}\n")
            continue;

        }
        if (command == "include") {
            var filename = line.match(/["'].*["']/);
            if (filename == null) {
                dnaerror("Bad command syntax");
            }
            filename = filename[0].slice(1, -1).trim();
            filename = path.normalize(path.join(dnastack.last()[3], filename));
            var dirname = path.dirname(filename);

            var file;
            try {
                file = fs.readFileSync(filename, "utf8");
            } catch (e) {
                dnaerror("File doesn't exist.");
            }
            dnastack.push([file.split("\n"), filename, 0, dirname]);
            continue;
        }

        dnaerror("Unknown command " + command);

    }

    rnawrite('ribosome.dot("' + addslashes(line) + '",function(_expr){return eval(_expr);})\n');
}


if (!rnaopt) {
    fs.appendFileSync(rnafile, "}catch(e){\n");

    fs.appendFileSync(rnafile, "var LINEMAP = [\n");
    var last = null;
    linemap.forEach(function(le) {
        if (last == null || le[1] != last[1] || le[0] - last[0] != le[2] - last[2]) {
            fs.appendFileSync(rnafile, "[" +
                le[0] + ",'" + addslashes(le[1]) + "'," + le[2] + "],\n");
            last = le;
        }
    });

    fs.appendFileSync(rnafile, "        [null]\n");
    fs.appendFileSync(rnafile, "    ];\n");
    fs.appendFileSync(rnafile, "ribosome.rethrow(e, '" + addslashes(rnafile) + "', LINEMAP);\n");


    fs.appendFileSync(rnafile, "}\n");

}

if (rnaopt) {
    process.stdout.write("ribosome.close();\n\n");
} else {
    fs.appendFileSync(rnafile, "ribosome.close();\n\n");
}

if (!rnaopt) {

    exec("node " + rnafile + " " + process.argv.slice(3).join(' '), function(error, stdout, stderr) {
        process.stdout.write(stdout);
        process.stderr.write(stderr);
        fs.unlinkSync(rnafile);
    });
}

