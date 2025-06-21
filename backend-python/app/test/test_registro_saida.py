# from datetime import datetime, time

# def simular_registro_saida(ultimo_ponto, data_saida, hora_saida):
#     # Simula a lógica do controller
#     hora_entrada_time = ultimo_ponto[1]
#     data_entrada = datetime.combine(ultimo_ponto[3].date(), hora_entrada_time)
#     saida = datetime.combine(data_saida, hora_saida)
#     intervalo = saida - data_entrada
#     horas = intervalo.total_seconds() / 3600

#     print(f"Entrada: {data_entrada}")
#     print(f"Saída:   {saida}")
#     print(f"Intervalo: {horas:.2f} horas")
#     # Não faz validação extra!

# # Exemplo de uso:
# ultimo_ponto = (1, time(8, 10, 0), None, datetime(2025, 5, 18, 8, 10, 0))
# simular_registro_saida(ultimo_ponto, datetime(2025, 5, 19).date(), time(8, 0, 0))


from datetime import datetime, time

def simular_registro_saida(ultimo_ponto, data_saida, hora_saida):
    hora_entrada_time = ultimo_ponto[1]
    data_entrada = datetime.combine(ultimo_ponto[3].date(), hora_entrada_time)
    saida = datetime.combine(data_saida, hora_saida)
    intervalo = saida - data_entrada
    horas = intervalo.total_seconds() / 3600
    return data_entrada, saida, horas

def test_saida_24h():
    # Entrada em 18/05/2025 às 08:10
    ultimo_ponto = (
        1,
        time(8, 10, 0),         # hora_entrada
        None,                   # hora_saida (ainda não registrada)
        datetime(2025, 5, 18, 8, 10, 0)  # data_hora (entrada no banco)
    )

    data_saida = datetime(2025, 5, 19).date()
    hora_saida = time(8, 0, 0)

    data_entrada, saida, horas = simular_registro_saida(ultimo_ponto, data_saida, hora_saida)

    assert data_entrada == datetime(2025, 5, 18, 8, 10, 0), f"Data de entrada errada: {data_entrada}"
    assert saida == datetime(2025, 5, 19, 8, 0, 0), f"Data de saída errada: {saida}"
    assert round(horas, 2) == 23.83, f"Intervalo de horas esperado: 23.83, obtido: {horas:.2f}"
