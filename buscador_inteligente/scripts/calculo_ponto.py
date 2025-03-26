import csv
from datetime import datetime, time, timedelta
from collections import defaultdict


# Função para calcular horário de saída baseado no horário de entrada e total de horas
def calcular_horario_saida(hora_entrada, total_horas, tem_almoco=True):
    # Converter a string de entrada (ex: "08:00") para objeto datetime
    entrada_dt = datetime.strptime(hora_entrada, "%H:%M")

    # Se tem almoço (1 hora), adicionar ao cálculo
    if tem_almoco:
        total_horas += 1.0

    # Calcular horas e minutos do total de horas
    horas = int(total_horas)
    minutos = int((total_horas - horas) * 60)

    # Adicionar horas e minutos ao horário de entrada
    saida_dt = entrada_dt + timedelta(hours=horas, minutes=minutos)

    # Converter de volta para string no formato HH:MM
    return saida_dt.strftime("%H:%M")


# Ler o arquivo CSV e calcular total de horas por dia
total_horas_por_dia = defaultdict(float)

with open("buscador_inteligente/scripts/resultado/horas_marco_2025.csv", "r") as f:
    reader = csv.reader(f, delimiter=";")
    next(reader)  # Pular o cabeçalho

    for row in reader:
        if len(row) >= 2:
            data = row[0]
            horas_str = row[1]

            # Converter horas no formato "HH:MM" para float
            h, m = map(int, horas_str.split(":"))
            horas_float = h + m / 60

            # Adicionar ao total do dia
            total_horas_por_dia[data] += horas_float

# Adicionar horas de outros projetos conforme informado
# 10/03/2025: +6h de outro projeto
# 11/03/2025 e 12/03/2025: +1h de outro projeto
if "10/03/2025" in total_horas_por_dia:
    total_horas_por_dia["10/03/2025"] += 6.0

if "11/03/2025" in total_horas_por_dia:
    total_horas_por_dia["11/03/2025"] += 1.0

if "12/03/2025" in total_horas_por_dia:
    total_horas_por_dia["12/03/2025"] += 1.0

# Definir horários de entrada e calcular saídas
entradas_saidas = []

for data, total_horas in sorted(total_horas_por_dia.items()):
    # Definir horário de entrada
    # Dias com mais de 10 horas, começar às 8:00
    # Dias com menos de 6 horas, começar às 9:00
    # Demais dias, começar às 8:30
    if total_horas > 10:
        hora_entrada = "08:00"
    elif total_horas < 6:
        hora_entrada = "09:00"
    else:
        hora_entrada = "08:30"

    # Definir se tem almoço (para dias com mais de 6 horas)
    tem_almoco = total_horas > 6.0

    # Calcular hora de saída
    hora_saida = calcular_horario_saida(hora_entrada, total_horas, tem_almoco)

    # Armazenar na lista
    entradas_saidas.append(
        {
            "Data": data,
            "Entrada": hora_entrada,
            "Intervalo_Inicio": "12:00" if tem_almoco else "",
            "Intervalo_Fim": "13:00" if tem_almoco else "",
            "Saída": hora_saida,
            "Horas": f"{int(total_horas)}:{int((total_horas - int(total_horas)) * 60):02d}",
            "Total_Horas": total_horas,
        }
    )

# Escrever no arquivo CSV
with open(
    "buscador_inteligente/scripts/resultado/ponto_marco_2025.csv", "w", newline=""
) as f:
    writer = csv.writer(f, delimiter=";")
    writer.writerow(
        [
            "Data",
            "Entrada",
            "Início Intervalo",
            "Fim Intervalo",
            "Saída",
            "Horas Trabalhadas",
            "Observação",
        ]
    )

    for registro in entradas_saidas:
        observacao = ""
        if registro["Total_Horas"] > 8.0:
            observacao = f"Inclui {registro['Total_Horas'] - 8.0:.2f}h extra"

        writer.writerow(
            [
                registro["Data"],
                registro["Entrada"],
                registro["Intervalo_Inicio"],
                registro["Intervalo_Fim"],
                registro["Saída"],
                registro["Horas"],
                observacao,
            ]
        )

print(
    "Arquivo de ponto criado com sucesso: buscador_inteligente/scripts/resultado/ponto_marco_2025.csv"
)
print(f"Total de dias trabalhados: {len(entradas_saidas)}")
print("Resumo de horas trabalhadas por dia:")
for registro in entradas_saidas:
    intervalo = (
        f", Almoço: {registro['Intervalo_Inicio']} - {registro['Intervalo_Fim']}"
        if registro["Intervalo_Inicio"]
        else ""
    )
    print(
        f"{registro['Data']}: {registro['Horas']} horas (Entrada: {registro['Entrada']}{intervalo}, Saída: {registro['Saída']})"
    )
