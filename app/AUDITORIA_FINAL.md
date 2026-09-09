# Auditoria final de entrega — Titanic

Data: 09/09/2026

## Resultado

**Pronto para execução local.** Nenhuma falha P0 ou P1 permaneceu aberta após a revisão de código, dados, containers e uso real da interface.

Persona validada: integrante do grupo apresentando para a turma, com pouco tempo para recuperar-se de uma navegação incorreta e com o professor podendo conferir os cálculos e os registros.

## Verificações realizadas

- Build de produção do frontend concluído (`TypeScript` + `Vite`).
- API, PostgreSQL e web saudáveis no Docker Compose; reinício configurado para manter a execução local.
- Dados confirmados: 891 registros, 342 sobreviventes, 549 não sobreviventes; taxas de 63,0%, 47,3% e 24,2% por classe.
- Contrato da API, paginação (incluindo último registro), limites inválidos e rotas inexistentes verificados.
- Interações ao vivo: trilha de etapas, setas, `Home`, `End`, troca de tema, cálculo em diálogo, `Escape`, retorno de foco, explorador paginado e fechamento do explorador.
- Interface em viewport estreito: sem rolagem horizontal; alvos de toque das etapas, fórmulas e navegação medem no mínimo 44 × 44 px.
- Recursos institucionais (fotos, logo e fontes locais) respondem pelo servidor web.

## Achados corrigidos nesta auditoria

| ID | Situação | Correção aplicada | Evidência de nova verificação |
| --- | --- | --- | --- |
| F1 | Corrigido | Setas agora continuam navegando mesmo após o foco cair em um botão; Espaço e Enter ainda ativam o controle focado. | Da etapa Bruna, `ArrowLeft` retornou para Cauany. |
| F2 | Corrigido | `Home` e `End` previnem a rolagem nativa antes de navegar. | `End` chegou a Kevin; `Home` retornou à abertura. |
| F3 | Corrigido | Explorador anuncia carregamento, erro e página carregada; a tabela expõe `aria-busy`. | A página 2 anunciou “Página 2 de 36 carregada”. |
| F4 | Corrigido | Controles compactos receberam área de toque mínima de 44 px sem mudar a aparência dos ícones. | Etapas: 44 × 44; fórmula: 127 × 44; próxima: 135 × 44. |
| F5 | Corrigido | A cor da interface do navegador acompanha o tema claro/escuro. | Claro: `#f5f7fa`; escuro: `#0d0f12`. |
| F6 | Corrigido | Requisições de páginas do Explorador passam a cancelar a anterior e ignorar respostas obsoletas. | O carregamento paginado foi repetido sem troca indevida de registros. |
| F7 | Corrigido | A tela de falha inicial possui agora uma ação direta de nova tentativa. | Controle incluído na tela de indisponibilidade da base. |

Uma revisão independente descartou duplicidade ou generalidade nos sete achados: cada correção corresponde a uma falha específica e verificável.

## Observações sobre automação da auditoria

O ambiente de navegação disponível permitiu interação, screenshots, árvore de acessibilidade e inspeção do DOM, mas não expõe leitura de console, inventário de rede, `Performance API` ou injeção dinâmica do axe-core. Por isso, a classificação formal da auditoria UX completa é **incompleta por limitação de instrumentação**, não por defeito conhecido na aplicação. As verificações técnicas, funcionais e de acessibilidade manual acima foram concluídas.

## Estado operacional

- Web: `http://localhost:3011`
- API: `http://localhost:8086`
- PostgreSQL: `localhost:5440`
- Inicialização: `docker compose up --build -d`

O deploy público continua deliberadamente fora do escopo: os serviços seguem restritos ao computador local até que a hospedagem seja autorizada e configurada.
