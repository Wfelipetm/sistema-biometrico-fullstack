from datetime import datetime, time
import pytest

# Simula a lógica antiga fielmente (data_entrada montada com data_atual)
def simular_registro_saida_antiga(ultimo_ponto, data_atual_para_saida, hora_saida):
    hora_entrada = ultimo_ponto[1]
    data_entrada = datetime.combine(data_atual_para_saida, hora_entrada)  # <- BUG: usa data_atual (dia da saída)
    data_saida = datetime.combine(data_atual_para_saida, hora_saida)
    intervalo = data_saida - data_entrada
    horas = intervalo.total_seconds() / 3600
    return data_entrada, data_saida, horas

@pytest.mark.xfail(reason="Função antiga com bug: data_entrada incorreta gera intervalo negativo")
def test_saida_24h_bug():
    """
    Cenário real com bug da função antiga:
    Entrada em 18/05/2025 às 08:10
    Saída em 19/05/2025 às 08:00
    A função antiga erroneamente monta entrada com data de saída → intervalo dá negativo
    """

    ultimo_ponto = (
        1,
        time(8, 10, 0),                          # hora_entrada
        None,
        datetime(2025, 5, 18, 8, 10, 0)          # data_hora original de entrada
    )

    data_atual_para_saida = datetime(2025, 5, 19).date()
    hora_saida = time(8, 0, 0)

    data_entrada, data_saida, horas = simular_registro_saida_antiga(ultimo_ponto, data_atual_para_saida, hora_saida)

    print("\n--- TESTE DE LÓGICA ANTIGA ---")
    print(f"Data de entrada (BUGADA): {data_entrada}")
    print(f"Data de saída:            {data_saida}")
    print(f"Intervalo calculado:      {horas:.2f} horas")
    print("------------------------------")

    # Aqui forçamos o erro proposital para provar que a função antiga está incorreta
    assert horas > 0, (
        f"--X--> A função antiga montou entrada posterior à saída! Intervalo inválido: {horas:.2f}h"
    )
