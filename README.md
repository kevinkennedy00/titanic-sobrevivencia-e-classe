# Titanic — Sobrevivência e Classe

> Projeto acadêmico de Estatística Descritiva sobre a associação entre classe de passagem e sobrevivência na base **Titanic — Machine Learning from Disaster**.

## Acesse a apresentação

### [Abrir a apresentação publicada no Vercel](https://titanic-sobrevivencia-e-classe.vercel.app/)

Esta é a forma recomendada de avaliar o trabalho. Ela reúne o roteiro da apresentação, gráficos interativos, cálculos técnicos, filtros dos registros e a leitura contextualizada dos resultados.

## Outras formas de avaliar o projeto

| Opção | Quando usar | O que é possível verificar |
|---|---|---|
| [Apresentação no Vercel](https://titanic-sobrevivencia-e-classe.vercel.app/) | Para ver o projeto pronto | Narrativa, gráficos, modais técnicos, explorador de passageiros e filtros |
| [Notebook de auditoria](01_analise/notebooks/Titanic_Apresentacao_Final.ipynb) | Para conferir a análise em Python | Tabelas, fórmulas, validações e gráfico sem abrir o frontend |
| Execução local com Docker | Para rodar a apresentação sem depender do site publicado | Frontend e API completos em `http://127.0.0.1:3011/` |
| [API de dados](https://titanic-presentation-api-xrhxn6whyq-rj.a.run.app/docs) | Para inspecionar a origem dos dados do frontend | Rotas, métricas calculadas e filtros da base |

## Como executar o notebook no VS Code

Essa é a melhor alternativa para quem deseja analisar apenas o código e os cálculos Python.

1. Clone este repositório e abra a pasta raiz no VS Code.
2. Instale as dependências:

   ```bash
   pip install -r 01_analise/requirements-notebook.txt
   ```

3. Abra [Titanic_Apresentacao_Final.ipynb](01_analise/notebooks/Titanic_Apresentacao_Final.ipynb).
4. Selecione um interpretador Python e clique em **Run All**.

O notebook usa `train.csv` como fonte e importa o mesmo motor estatístico usado pela API. Portanto, os resultados visualizados no notebook e no site vêm das mesmas funções Python.

### Abrir no Google Colab

Depois de abrir o notebook no Colab, execute esta célula antes de **Run All**:

```python
!git clone https://github.com/kevinkennedy00/titanic-sobrevivencia-e-classe.git
%cd titanic-sobrevivencia-e-classe
!pip install -r 01_analise/requirements-notebook.txt
```

Em seguida, abra `01_analise/notebooks/Titanic_Apresentacao_Final.ipynb` dentro da pasta clonada e execute todas as células.

## Como executar a apresentação localmente

Pré-requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e iniciado.

Na primeira execução, com internet disponível, abra um terminal na raiz do projeto e rode:

```bash
docker compose build
```

Depois, basta dar dois cliques em `iniciar-titanic.bat`. O navegador abrirá em:

```text
http://127.0.0.1:3011/
```

Após as imagens Docker já estarem preparadas, a execução local funciona sem internet. Links externos, o QR Code e a versão do Vercel naturalmente exigem conexão.

## Como o projeto está organizado

```text
train.csv                         Fonte única: 891 registros e 12 colunas
app/api/app/analysis_core.py      Validação e cálculos estatísticos compartilhados
app/api/app/main.py               API FastAPI usada pelo frontend
01_analise/notebooks/             Notebook auditável com tabelas e gráfico
app/web/                          Interface da apresentação
docker-compose.yml                Execução local sem banco de dados
```

O projeto não usa banco de dados: os dados são lidos diretamente de `train.csv`. Isso torna a entrega reproduzível, reduz dependências e mantém os cálculos auditáveis.

## O que é calculado

- Medidas de posição: média, moda e mediana de `Survived` e `Pclass`.
- Medidas de dispersão: desvio padrão populacional (`ddof = 0`) e coeficiente de variação.
- Taxas de sobrevivência dentro de cada classe.
- Recortes descritivos por sexo, idade disponível e classe.

As análises são descritivas: apontam padrões observados na base, sem afirmar causalidade isolada.

## Fonte dos dados

[Kaggle — Titanic: Machine Learning from Disaster](https://www.kaggle.com/competitions/titanic/data), arquivo `train.csv`.
