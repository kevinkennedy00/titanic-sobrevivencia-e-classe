# Auditoria estatística em Python

O notebook `notebooks/Titanic_Apresentacao_Final.ipynb` é a versão auditável da apresentação: ele exibe as tabelas, os cálculos e o gráfico de sobrevivência por classe sem exigir que o avaliador navegue pelo frontend.

Ele importa `app/api/app/analysis_core.py`, o mesmo motor Python usado pela API do site. Portanto, `train.csv` é a fonte única e os resultados do notebook e da apresentação são calculados pelas mesmas funções.

## Como executar no VS Code

1. Abra a pasta raiz do repositório no VS Code.
2. Instale as dependências do notebook: `pip install -r 01_analise/requirements-notebook.txt`.
3. Abra `01_analise/notebooks/Titanic_Apresentacao_Final.ipynb` e selecione o interpretador Python.
4. Execute **Run All**.

O notebook procura automaticamente o `train.csv` na raiz do projeto e valida os 891 registros antes de mostrar os resultados.

## Papel de cada camada

- `app/api/app/analysis_core.py`: leitura, validação e cálculos estatísticos compartilhados.
- `app/api/app/main.py`: rotas da API usadas pelo site.
- `notebooks/Titanic_Apresentacao_Final.ipynb`: tabelas, gráfico e explicações para inspeção acadêmica.
