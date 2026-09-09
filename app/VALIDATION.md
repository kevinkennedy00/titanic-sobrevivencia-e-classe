# Validação de entrega — Titanic

Última validação: 09/09/2026.

## Interface

- [x] Abertura institucional de aproximadamente 2,8 s com foto do campus, logo UNIFACISA, ação de pular, exibição única por sessão e alternativa para movimento reduzido.
- [x] Hero editorial com título sem sobreposição, subtítulo, professor, disciplina, instituição e os cinco integrantes com foto e nome.
- [x] Pergunta de pesquisa movida para uma etapa própria, seguida de gráfico em escala comum de 0% a 100% e transição para a fala de Cauany.
- [x] Nova abertura verificada em 1280 × 720 e 375 × 812, sem rolagem horizontal ou corte no título.
- [x] Hero com identidade UNIFACISA, professor, disciplina, equipe e 891 passageiros.
- [x] Sequência de abertura + cinco atos: Cauany, Bruna, Samuel, Nikson e Kevin.
- [x] Gráfico de distribuição por classe com contagem e proporção.
- [x] Comparação geral 342 × 549.
- [x] Comparação por classe com 63,0%, 47,3%, 24,2% e diferença de 38,7 p.p.
- [x] Tabela de média, moda, mediana, desvio padrão e coeficiente de variação.
- [x] Fórmula aberta em diálogo com foco, `Escape`, retorno ao acionador e bloqueio de rolagem.
- [x] Explorador da base com 25 registros por página, limites, erro e retry.
- [x] Navegação por setas, Espaço, Home/End, trilha lateral e botões de seção.
- [x] Tema escuro canônico, tema claro persistido e `prefers-reduced-motion`.
- [x] Primeiro viewport verificado em desktop e viewport estreito responsivo.

## Dados e runtime

- [x] `npm run build` concluído com TypeScript e Vite.
- [x] Compilação Python da API concluída.
- [x] `docker compose config --quiet` concluído.
- [x] PostgreSQL, API e web em estado `healthy`.
- [x] `/api/health` retorna `UP`.
- [x] `/api/presentation` retorna cinco seções e seis métricas.
- [x] `/api/passengers` retorna 891 registros, primeira página e última página corretamente.
- [x] Fontes, logo e assets institucionais retornam HTTP 200 pelo web server.

## Operação local

- Web: `http://localhost:3011`
- API: `http://localhost:8086`
- PostgreSQL: `localhost:5440`
- Inicialização: `docker compose up --build -d`

O deploy público permanece fora desta etapa; as portas seguem limitadas ao computador local até a configuração de hospedagem.
