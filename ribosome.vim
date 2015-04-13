" For CommonView to be able to set the correct syntax, the following entries must be added
" to your ~/.vimrc file:
" au BufNewFile,BufReadPre *.py.dna :let b:ribosome_syntax = "python"
" au BufNewFile,BufReadPre *.js.dna :let b:ribosome_syntax = "javascript"
" au BufNewFile,BufReadPre *.rb.dna :let b:ribosome_syntax = "ruby"
" au BufNewFile,BufRead *.dna setf ribosome
"
" If you want to set a default syntax type for *.dna files, add also the following, e.g. for 
" python:
" let g:ribosome_default_syntax = "python"

function! CommonView ()
    unlet b:current_syntax
    set syntax=off
    if exists("b:ribosome_syntax")
        let &syntax=b:ribosome_syntax
    elseif exists("g:ribosome_default_syntax")
        let &syntax=g:ribosome_default_syntax
    else
        set syntax=on
    endif
    syn match dot /^\s*\..*$/
    highlight dot ctermfg=Blue guifg=Blue
    let b:current_syntax = "ribosome-common"
endfunction

function! OutputView()
    unlet b:current_syntax
    set syntax=off
    syn match nondot /^\s*[^\.].*$/
    highlight nondot ctermfg=Grey guifg=Grey
    if b:current_output != "none"
        execute 'syntax include @CSYN syntax/' . b:current_output . '.vim'
        syntax region cSnip matchgroup=Snip start=/^\s*\./ end=/$/ keepend contains=@CSYN
        highlight Snip ctermfg=Grey guifg=Grey
    else
        syn match dot /^\s*\..*$/
        if &background == "dark"
            highlight dot ctermfg=White guifg=White
        else
            highlight dot ctermfg=Black guifg=Black
        endif
    endif
    let b:current_syntax = "ribosome-output"
endfunction

function! SetCurrentOutput(s)
    let b:current_output = a:s
    call OutputView()
endfunction

map <F3> :call CommonView()<CR>
map <F4> :call OutputView()<CR>

inoremap @ @{}<Esc>i

command! -nargs=1 O call SetCurrentOutput(<f-args>)

let b:current_syntax = ""
let b:current_output = "none"
call CommonView()
