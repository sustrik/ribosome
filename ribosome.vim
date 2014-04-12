
if exists("b:current_syntax")
  finish
endif

syn match dot	    "^\..*$"

highlight link dot      Identifier

let b:current_syntax = "ribosome"
