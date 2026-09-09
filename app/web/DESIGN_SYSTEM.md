# Design system visual — Estatística - Titanic

## Autoridade e escopo

O manual `ref/design-system/DS-PRE-RAW-Estatistica-Onildo.html` é a autoridade visual do projeto. A implementação deve manter seus tokens, tipografia, proporções, estados e acessibilidade; a cópia local existe para auditoria e comparação.

## Tokens e tipografia

- Tokens vivem em `src/design-system.css`; não criar cores, sombras, raios ou durações isolados.
- Dark é o tema padrão. Light é alternativo, persistido em `localStorage`, com tokens próprios de superfície, texto, borda, sombra, grade e acentos de dados.
- Helvetica Onildo compõe títulos e corpo; Relative Onildo compõe dados, fórmulas, tabelas e metadados; Montserrat é apoio institucional. As fontes são locais em `public/design-system/fonts/`.
- Valores de dados usam a paleta `--ds-data-*` e nunca dependem apenas de cor ou forma.

## Primitivas canônicas

- `ds-navbar`: cabeçalho fixo com marca, contador de etapas, alternância de tema e linha de progresso.
- `ds-grid`: grade técnica de 48 px para fundos e seções editoriais.
- `ds-bg-radial-aurora`: aurora radial de baixa opacidade, somente decorativa.
- `ds-lines-container` / `ds-v-line`: linhas técnicas verticais de apoio, sem interação.
- `ds-scroll-progress` / `ds-scroll-progress-bar`: progresso global da leitura.
- `ds-modal-backdrop` / `ds-modal`: diálogo com foco inicial, foco contido, `Escape`, clique no backdrop e retorno ao acionador.
- `ds-button` / `ds-btn`: ação primária; variantes `--ghost`/`--secondary` e `--quiet`.
- `ds-card` e `ds-panel`: superfícies para métricas, tabelas, gráficos e conclusões, usando tokens de raio, borda e elevação.

As primitivas compartilham foco visível, SVG inline consistente e suporte a `prefers-reduced-motion`. O clique direito permanece disponível; a navegação da apresentação também aceita setas, espaço, Home/End, trilha lateral e botões.

## Dados, gráficos e exploração

- Todo gráfico tem `role="img"` e `aria-label` com os valores e categorias representados; tabelas mantêm `caption`, cabeçalhos e `scope` sem depender da visualização.
- O explorador abre em modal, consulta a API paginada (25 registros), mostra estado de carregamento e erro e oferece `Tentar novamente` sem fechar a janela.
- A paginação expõe `Anterior`/`Próxima`, página atual/total e estados desabilitados nos limites ou durante a carga.

## Ativos locais

- Fontes: `public/design-system/fonts/`.
- Marca Unifacisa: `public/design-system/institution/unifacisa.png`.
- Banner institucional: `public/design-system/institution/campus-banner.jpg`.
- Fotos de integrantes: caminhos locais `/team/`, preservados pelo volume de ativos da aplicação.

## Referências locais

- `ref_cards`: monumentalidade editorial, lettering outlined e ritmo de cards.
- `ref_dataset_academic`: grid, mono, tabelas, linhas técnicas e narrativa de pesquisa.
- `ref_dashboard`: visualização, barras, estados e interação com dados.
- `ref_academica`: contexto institucional, marca Unifacisa e tipografia de apoio.
