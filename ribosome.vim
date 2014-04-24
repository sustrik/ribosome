
if exists("b:current_syntax")
  finish
endif

syn match dot	    "^\..*$"

highlight dot ctermfg=DarkBlue guifg=DarkBlue

let b:current_syntax = "ribosome"
