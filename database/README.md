# Sistema de Controle Biométrico

## Visão Geral

Este banco de dados PostgreSQL foi projetado para um sistema de controle de ponto biométrico. O sistema gerencia funcionários, registros de ponto, cálculo de horas trabalhadas, férias e a estrutura organizacional da instituição.

## Estrutura do Banco de Dados

### Tabelas Principais

1. **funcionarios**: Armazena informações dos funcionários
   - Dados pessoais (nome, CPF, email, telefone)
   - Dados profissionais (cargo, matrícula, data de admissão)
   - Escala de trabalho (8h, 12h, 12x36, etc.)
   - ID biométrico para identificação no sistema

2. **registros_ponto**: Registra as entradas e saídas dos funcionários
   - Horários de entrada e saída
   - Cálculos automáticos de horas trabalhadas, extras e descontos
   - Vinculação com funcionário e unidade

3. **ferias**: Controla os períodos de férias dos funcionários
   - Data de início e fim
   - Vinculação com o funcionário

4. **unidades**: Representa os locais de trabalho
   - Nome e localização
   - Vinculação com secretaria

5. **secretarias**: Representa as secretarias/departamentos da organização
   - Nome e sigla

6. **usuarios**: Gerencia os usuários do sistema
   - Credenciais de acesso (email e senha)
   - Nível de acesso (admin ou gestor)

### Tipos Personalizados

- **tipo_escala_enum**: Define os tipos de escala de trabalho suportados
  - Valores: '8h', '12h', '16h', '24h', '12x36', '24x72', '32h', '20h'

### Funções Automatizadas

O banco de dados inclui várias funções que automatizam cálculos e padronizações:

1. **calcular_horas_desconto()**: Calcula automaticamente horas extras ou descontos com base na jornada esperada
   - Considera diferentes tipos de escala
   - Aplica pausa para almoço quando apropriado
   - Calcula saldo de horas (positivo ou negativo)

2. **calcular_horas_normais()**: Calcula as horas normais trabalhadas

3. **Funções de padronização**: Convertem textos para maiúsculas
   - padronizar_nome_maiusculo()
   - padronizar_cargo_maiusculo()
   - uppercase_nome_unidade()
   - uppercase_localizacao_unidade()

## Relacionamentos

- Funcionários pertencem a Unidades
- Unidades pertencem a Secretarias
- Registros de ponto estão vinculados a Funcionários e Unidades
- Férias estão vinculadas a Funcionários

## Funcionalidades Principais

1. **Registro biométrico**: Captura de entrada e saída via identificação biométrica
2. **Cálculo automático de horas**: Processamento de horas normais, extras e descontos
3. **Gestão de escalas**: Suporte a diferentes tipos de jornada de trabalho
4. **Controle de férias**: Gerenciamento de períodos de férias dos funcionários
5. **Hierarquia organizacional**: Estrutura de secretarias e unidades

## Observações Técnicas

- O banco utiliza triggers para automatizar cálculos e padronizações
- Existem índices para otimizar consultas frequentes
- Constraints garantem a integridade dos dados
- Relacionamentos são gerenciados por chaves estrangeiras com regras de cascata


