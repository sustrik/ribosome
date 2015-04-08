
function! CommonView ()
    unlet b:current_syntax
    syn match dot "^\..*$"
    syn match nondot "^[^\.].*$"
    highlight nondot ctermfg=Black guifg=Black
    highlight dot ctermfg=Blue guifg=Blue
    let b:current_syntax = "ribosome-common"
endfunction

function! RubyView ()
    unlet b:current_syntax
    set syntax=off
    set syntax=ruby
    syn match dot "^\..*$"
    highlight dot ctermfg=Grey guifg=Grey
    let b:current_syntax = "ribosome-ruby"
endfunction

function! OutputView()
    unlet b:current_syntax
    if b:current_output != "none"
        execute 'syntax include @CSYN syntax/' . b:current_output . '.vim'
        syntax region cSnip matchgroup=Snip start=/^\./ end=/$/ keepend contains=@CSYN
        highlight Snip ctermfg=Grey guifg=Grey
    else
        syn match dot "^\..*$"
        highlight dot ctermfg=Black guifg=Black
    endif
    syn match nondot "^[^\.].*$"
    highlight nondot ctermfg=Grey guifg=Grey
    let b:current_syntax = "ribosome-output"
endfunction

function! SetCurrentOutput(s)
    let b:current_output = a:s
    call OutputView()
endfunction

map <F2> :call CommonView()<CR>
map <F3> :call RubyView()<CR>
map <F4> :call OutputView()<CR>

command! -nargs=1 O call SetCurrentOutput(<f-args>)

let b:current_syntax = ""
let b:current_output = "none"
call CommonView()

