# Estatística – Titanic

Projeto de análise estatística descritiva do arquivo `train.csv` (891 passageiros e 12 colunas), com notebook, gráficos em Python, guia de apresentação e apresentação final no Canva.

## Organização

- `train.csv`: base principal, mantida na raiz para que os notebooks continuem abrindo com o caminho padrão.
- `01_analise/notebooks/`: notebooks de análise e apresentação.
- `01_analise/scripts/`: scripts Python de cálculo e geração de gráficos.
- `02_referencias/`: listas, material do professor, tabela normal, imagens do enunciado e registros da conversa.
- `03_documentacao/`: mapas, notas e relatórios da revisão; versões antigas ficam em `versoes_anteriores/`.
- `04_dados_auxiliares/`: arquivos auxiliares do conjunto Titanic (`test.csv`, `gender_submission.csv` e `titanic.zip`).
- `05_pacotes_arquivo/`: pacotes de entrega e cópias de segurança preservados.
- `graficos_titanic/`: gráficos complementares produzidos em Python.
- `graficos_final/`: gráfico usado na apresentação final.
- `outputs/`: entregáveis atuais, incluindo o guia revisado em PDF e DOCX.
- `work/` e `tmp/`: arquivos de trabalho e verificações intermediárias.

## Versão para apresentação

- Guia revisado: `outputs/Guia_Aula_Apresentacao_Estatistica_Titanic.pdf`.
- Canva final: design `DAHUo-Y5arw`, com 12 slides.
- Ordem de fala: Cauany → Bruna → Samuel → Nikson → Kevin.
- Gráficos na apresentação: distribuição por classe (slide 5), sobrevivência geral (slide 7) e taxa por classe (slide 9). As medidas permanecem em tabelas.

Para executar os notebooks ou scripts, abra o projeto com a raiz como diretório de trabalho. Isso mantém `train.csv`, `graficos_titanic/` e `graficos_final/` nos caminhos esperados pelos arquivos de análise.

## Aplicação interativa

A aplicação web fica em `app/` e transforma a apresentação em uma experiência navegável, com dados reais, gráficos, fórmulas, metodologia consultável, tema dark/light e explorador paginado da base.

O frontend segue exclusivamente o manual local [DS-PRE-RAW-Estatistica-Onildo.html](app/web/ref/design-system/DS-PRE-RAW-Estatistica-Onildo.html). As decisões de tokens, tipografia, componentes, movimento e origem dos ativos estão registradas em [DESIGN_SYSTEM.md](app/web/DESIGN_SYSTEM.md).

A checklist de cobertura visual, dados, runtime e operação está em [app/VALIDATION.md](app/VALIDATION.md).

A auditoria final, com os achados e as correções verificadas, está em [app/AUDITORIA_FINAL.md](app/AUDITORIA_FINAL.md).

### Execução local

1. Confirme que o Docker Desktop está aberto.
2. Na raiz do projeto, execute `docker compose up --build -d`.
3. Abra `http://localhost:3011`.

Serviços locais reservados:

- Interface: `http://localhost:3011`
- API: `http://localhost:8086`
- Health check: `http://localhost:8086/api/health`
- PostgreSQL: `localhost:5440`

No primeiro início, a API importa os 891 registros de `train.csv` e calcula as métricas usadas na apresentação. O arquivo `.env` é apenas local; para outro computador, copie `.env.example` para `.env` antes de iniciar a pilha.

Os três serviços usam reinício automático enquanto o Docker Desktop estiver em execução. Para conferir se continuam disponíveis, use `docker compose ps`; todos devem aparecer como `healthy`. Nesta etapa as portas estão limitadas ao próprio computador, de propósito. O acesso público será habilitado apenas no futuro deploy.
