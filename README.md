# Mary's Kitchen

Beta pública, mobile-first, para encomenda e gestão semanal de refeições vegetarianas no Porto.

## Funcionalidades

- Kit flexível de cinco refeições por 30 €, com entrega incluída no Porto.
- Limite semanal configurável, inicialmente de 100 doses.
- Entrega ou recolha, pagamentos por MB WAY, transferência ou dinheiro.
- Registo de alergias, alterações e observações.
- Painel protegido para gerir ementa, fotografias, encomendas, pagamentos e produção.
- Exportação CSV das encomendas.

## Publicação na Netlify

O projeto é uma aplicação Next.js. A Netlify usa `netlify.toml` e o comando `npm run build:netlify`.

Antes de abrir o painel de gestão, definir na Netlify:

- `ADMIN_PASSWORD`: palavra-passe temporária do administrador.
- `ADMIN_SESSION_SECRET`: valor aleatório longo usado para assinar sessões.

As encomendas, a ementa e as fotografias ficam guardadas em Netlify Blobs. Não existem chaves de base de dados para configurar nesta versão de teste.

## Desenvolvimento

```bash
npm install
npm run build:netlify
```

As decisões funcionais atuais estão em `marys-kitchen-decisoes-mvp.txt`.
