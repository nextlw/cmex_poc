import csv
from datetime import datetime, timedelta
import os


# Obter dias úteis (segunda a sexta) de março de 2025
def get_working_days(year, month):
    days = []
    day = 1
    while True:
        try:
            date = datetime(year, month, day)
            if date.weekday() < 5:  # 0-4 são segunda a sexta
                days.append(date)
            day += 1
        except ValueError:
            break
    return days


# Usando o ano correto: 2025
working_days = get_working_days(2025, 3)


# Função para determinar o tipo de tarefa com base na descrição
def determine_task_type(description):
    description = description.lower()
    if any(kw in description for kw in ["protótipo", "layout", "ui", "ux"]):
        return "UX"
    elif any(kw in description for kw in ["documentação", "organizar arquivo"]):
        return "DOCUMENTAÇÃO"
    elif any(
        kw in description for kw in ["planning", "refinamento", "criação de tasks"]
    ):
        return "REUNIÃO"
    else:
        return "DESENVOLVIMENTO"


# Ler as tarefas
tasks = []
with open("buscador_inteligente/scripts/task_mar.csv", "r") as f:
    reader = csv.reader(f, delimiter=";")
    next(reader)  # Pular a linha 'data (1)'
    headers = next(reader)
    for row in reader:
        if len(row) >= 5:  # Garantir que há dados suficientes
            task_id = row[0]
            description = row[1]
            assigned_to = row[2]
            hours = float(row[3])
            created_date_str = row[4]

            # Mantendo o ano como 2025 (não precisamos substituir)
            created_date = datetime.strptime(created_date_str, "%d/%m/%Y %H:%M:%S")

            tasks.append(
                {
                    "id": task_id,
                    "description": description,
                    "assigned_to": assigned_to,
                    "hours": hours,
                    "created_date": created_date,
                    "type": determine_task_type(description),
                }
            )

# Ordenar tarefas por data de criação
tasks.sort(key=lambda x: x["created_date"])

# Distribuir as horas pelas dias úteis
distributed_hours = []
total_allocated_hours = 0
today = datetime(2025, 3, 25)  # Considerando até 25 de março de 2025

for task in tasks:
    remaining_hours = task["hours"]

    # Encontrar dias úteis após a data de criação da tarefa
    eligible_days = [
        day for day in working_days if day >= task["created_date"] and day <= today
    ]

    while remaining_hours > 0 and eligible_days:
        for day in eligible_days:
            # Verificar se já temos horas alocadas para este dia
            day_str = day.strftime("%d/%m/%Y")
            existing_hours = sum(
                item["hours"] for item in distributed_hours if item["day"] == day_str
            )

            # Determinar quanto pode ser alocado hoje (máximo 8 horas por dia)
            available_hours = max(0, 8 - existing_hours)

            if available_hours > 0:
                hours_to_allocate = min(remaining_hours, available_hours)

                distributed_hours.append(
                    {
                        "day": day_str,
                        "hours": hours_to_allocate,
                        "task_id": task["id"],
                        "id_pbi": "",  # ID PBI (vazio)
                        "description": task["description"],
                        "assigned_to": task["assigned_to"],
                        "type": task["type"],
                    }
                )

                remaining_hours -= hours_to_allocate
                total_allocated_hours += hours_to_allocate

                if remaining_hours <= 0:
                    break

        # Se ainda tem horas não alocadas, consideramos como hora extra no último dia útil
        if remaining_hours > 0:
            last_day = eligible_days[-1].strftime("%d/%m/%Y")

            distributed_hours.append(
                {
                    "day": last_day,
                    "hours": remaining_hours,
                    "task_id": task["id"],
                    "id_pbi": "",  # ID PBI (vazio)
                    "description": task["description"] + " (HORA EXTRA)",
                    "assigned_to": task["assigned_to"],
                    "type": task["type"],
                }
            )

            total_allocated_hours += remaining_hours
            break

# Ordenar por dia
distributed_hours.sort(key=lambda x: datetime.strptime(x["day"], "%d/%m/%Y"))


# Formatar as horas no formato HH:MM
def format_hours(hours):
    hours_int = int(hours)
    minutes = int((hours - hours_int) * 60)
    return f"{hours_int:02d}:{minutes:02d}"


# Criar diretório para resultado se não existir
os.makedirs("buscador_inteligente/scripts/resultado", exist_ok=True)

# Obter cabeçalhos do arquivo original para manter exatamente as mesmas colunas
with open("buscador_inteligente/scripts/planilhahoras.csv", "r") as f:
    reader = csv.reader(f, delimiter=";")
    original_headers = next(reader)

# Escrever o novo CSV no formato de planilhahoras.csv
with open(
    "buscador_inteligente/scripts/resultado/horas_marco_2025.csv", "w", newline=""
) as f:
    writer = csv.writer(f, delimiter=";")
    writer.writerow(original_headers)

    for item in distributed_hours:
        formatted_hours = format_hours(item["hours"])
        row_data = [
            item["day"],
            formatted_hours,
            item["task_id"],
            item.get("id_pbi", ""),  # ID PBI (vazio)
            item["description"],
            item["assigned_to"],
            item["type"],
            "LEAD",  # Projeto correto
        ]

        # Garantir que temos o mesmo número de colunas que o cabeçalho original
        while len(row_data) < len(original_headers):
            row_data.append("")

        writer.writerow(row_data)

# Calcular total de dias úteis e horas disponíveis
total_working_days = len([day for day in working_days if day <= today])
total_hours_available = total_working_days * 8

print(
    f"Arquivo criado com sucesso: buscador_inteligente/scripts/resultado/horas_marco_2025.csv"
)
print(f"Total de horas alocadas: {total_allocated_hours}")
print(f"Total de dias úteis em março/2025 até dia 25: {total_working_days}")
print(f"Total de horas disponíveis no período: {total_hours_available}")
