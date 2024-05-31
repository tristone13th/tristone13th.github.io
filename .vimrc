noremap j gj
noremap gj G
nmap k gk
nmap gh ^
noremap v V
noremap V v
nmap gl $
nmap Y y$
nmap m p
nmap <Up> <C-u>
nmap <Down> <C-d>
nmap W :w<CR>

" insert mode
imap jk <Esc>
imap JK <Esc>

" visual mode
vmap <Tab> >
vmap <S-Tab> <
vmap <Space> <Esc>

exmap tf obcommand editor:toggle-fold
" tried also nmap and noremap. 
map za :tf
