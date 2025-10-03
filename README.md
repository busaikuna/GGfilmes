# Site de Filmes e Jogos

Um site interativo que combina filmes e jogos, permitindo aos usuários explorar conteúdos de forma intuitiva e organizada. O objetivo é criar uma experiência em que filmes inspiram jogos e jogos inspiram filmes.

## Funcionalidades

- Sugestões de filmes e jogos baseadas em destaque e categorias.
- Conteúdos em destaque para facilitar a descoberta de novidades.
- Categorias organizadas para navegação rápida.
- Busca de filmes e jogos específicos.
- Futuramente: sistema de contas de usuário com perfis e favoritos.
- Possível integração com APIs externas para informações atualizadas.

## Tecnologias

- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js com Express.js
- Banco de dados: SQLite (desenvolvimento) e PostgreSQL (produção)
- Estrutura pensada para ser responsiva e escalável.

## Como rodar

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/nome-do-projeto.git
cd nome-do-projeto
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

4. Abra o navegador em:

```bash
http://localhost:3000
```

## Estrutura do projeto

- `/public` → arquivos estáticos (CSS, JS, imagens)
- `/views` → templates HTML
- `/routes` → rotas do Express
- `/db` → banco de dados SQLite (ou PostgreSQL em produção)

## Próximos passos

- Implementar sistema de contas de usuário com login e favoritos
- Integração com APIs externas para sugestões de filmes e jogos
- Melhorias na interface e experiência do usuário
- Adicionar recomendações personalizadas e notificações

