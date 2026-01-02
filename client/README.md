# Nexo Frontend - React + TypeScript

Frontend da aplicação Nexo, desenvolvido com React, TypeScript e Vite.

## 🚀 Tecnologias

- **React 19** - Biblioteca para construção de interfaces
- **TypeScript** - Superset tipado de JavaScript
- **Vite** - Build tool e dev server rápido
- **ESLint** - Linting e padronização de código

## 📁 Estrutura do Projeto

```
client/
├── public/              # Arquivos estáticos públicos
├── src/
│   ├── assets/          # Imagens, fontes e outros assets
│   ├── components/      # Componentes reutilizáveis
│   │   └── Button/      # Exemplo de componente
│   ├── contexts/        # Contextos React (estado global)
│   ├── hooks/           # Hooks customizados
│   ├── pages/           # Páginas/views da aplicação
│   │   └── Home/        # Página inicial
│   ├── services/        # Serviços e integrações (API, etc.)
│   ├── styles/          # Estilos globais e variáveis CSS
│   ├── types/           # Tipos e interfaces TypeScript
│   ├── utils/           # Funções utilitárias
│   ├── App.tsx          # Componente raiz
│   ├── App.css          # Estilos do App
│   ├── main.tsx         # Ponto de entrada
│   └── index.css        # Estilos globais
├── .env.example         # Exemplo de variáveis de ambiente
├── eslint.config.js     # Configuração do ESLint
├── tsconfig.json        # Configuração do TypeScript
├── tsconfig.app.json    # Config TS para a aplicação
├── tsconfig.node.json   # Config TS para Node (Vite)
├── vite.config.ts       # Configuração do Vite
└── package.json         # Dependências e scripts
```

## 📦 Instalação

```bash
# Navegue até a pasta client
cd client

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

## 🔧 Scripts Disponíveis

```bash
# Inicia o servidor de desenvolvimento
npm run dev

# Cria build de produção
npm run build

# Visualiza o build de produção localmente
npm run preview

# Executa o linter
npm run lint
```

## 🏗️ Convenções de Código

### Componentes

- Cada componente em sua própria pasta dentro de `components/`
- Use arquivos `index.ts` para exportações limpas
- Prefira CSS Modules para estilos isolados
- Documente props com JSDoc

```tsx
// components/Button/Button.tsx
export interface ButtonProps {
  /** Descrição da prop */
  variant?: 'primary' | 'secondary';
}

export function Button({ variant = 'primary' }: ButtonProps) {
  // ...
}
```

### Hooks Customizados

- Prefixe com `use` (convenção React)
- Coloque em `hooks/` e exporte via `hooks/index.ts`

### Serviços

- API client centralizado em `services/api.ts`
- Serviços específicos em arquivos separados

### Tipos

- Interfaces globais em `types/index.ts`
- Tipos específicos de features em arquivos dedicados

## 🌐 Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `VITE_API_URL` | URL base da API backend | `http://localhost:3000/api` |
| `VITE_APP_ENV` | Ambiente da aplicação | `development` |

> **Nota:** Todas as variáveis devem começar com `VITE_` para serem acessíveis no código.

## 📚 Recursos Úteis

- [Documentação React](https://react.dev)
- [Documentação Vite](https://vite.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [ESLint](https://eslint.org/)
