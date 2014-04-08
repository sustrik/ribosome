
if exists("b:current_syntax")
  finish
endif

syn match dot	    "^\..*$"
syn match plus	    "^+.*$"
syn match command	"^\!.*$"

highlight link dot      Identifier
highlight link plus     Identifier
highlight link command  Constant

let b:current_syntax = "ribosome"
