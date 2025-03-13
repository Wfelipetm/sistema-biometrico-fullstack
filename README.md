# Biometria.py

## Visão Geral
Este projeto oferece uma interface gráfica e de linha de comando para registro e identificação de impressões digitais usando a biblioteca NBioBSP COM.

## Pré-requisitos
- [Python 3.x](https://www.python.org/downloads/)
- [pip (instalador de pacotes Python)](https://packaging.python.org/en/latest/tutorials/installing-packages/)
- [Interop.NBioBSPCOMLib.dll](https://suporte.fingertech.com.br/portal-do-desenvolvedor/)

## Clonar o Repositório
Para clonar o repositório, execute o seguinte comando:
```sh
git clone https://github.com/Wfelipetm/Biometria.git
cd Biometria

```

## Instalar Dependências
Para instalar as dependências necessárias, execute:
```bash
pip install -r requirements.txt
```



## Listar Métodos
Para ver a lista de métodos disponíveis em m_NBio_Bsp, execute:
```python
for n in dir(m_NBio_Bsp):
        print(n)
```
Para ver a lista de métodos disponíveis em m_NBio_Bsp.IndexSearch, execute:
```python
for n in dir(m_NBio_Bsp.IndexSearch):
        print(n)
```

Funcionalidades
- Registrar Funcionario: Registre um novo Funcionario com sua impressão digital.
- Identificar Funcionario: Identifique um Funcionario com base em sua impressão digital.
- Registrar o ponto: Bata o ponto de entrada e de saida dos funcionarios



## Registro de Logs
Logs são gerados para fornecer informações sobre as operações e quaisquer erros encontrados. Os logs são exibidos no console.

## Tratamento de Erros
As mensagens de erro são registradas e exibidas ao usuário em caso de problemas durante as operações.

## Licença
Este projeto está licenciado sob a Licença MIT. Veja o arquivo LICENSE para mais detalhes.
