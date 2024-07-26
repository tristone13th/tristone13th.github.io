noremap m p
noremap p N
exmap save obcommand editor:save-file
nmap W :save
exmap grep obcommand global-search:open
nmap G :grep
exmap jump obcommand switcher:open
nmap J :jump
exmap files obcommand file-explorer:open
nmap T :files
exmap lint obcommand obsidian-linter:lint-file
nmap F :lint
noremap j gj
noremap k gk
noremap Y y$
noremap v V
noremap V v
noremap <S-Tab> <<
noremap K J
map N :nohl
noremap gh ^
noremap gl $
noremap gj G
noremap <Up> <C-u>
noremap <Down> <C-d>
set clipboard=unnamed
unmap <C-c>
 
" insert mode
imap jk <Esc>
imap JK <Esc>

" visual mode
vmap <Tab> >
vmap <S-Tab> <
vmap <Space> <Esc>
vmap <C-m> gcc<Esc>

set tabstop=4 shiftwidth=4

exmap tf obcommand editor:toggle-fold
map za :tf
