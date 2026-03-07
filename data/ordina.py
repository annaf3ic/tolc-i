import json

# Carica il file JSON
with open('data\matematica1.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Ordine desiderato degli ID (senza il prefisso "Q")
ordine_ids = [
    "60", "26", "18", "55", "08", "41", "39", "09", "25", "24",
    "56", "14", "29", "42", "51", "54", "38", "01", "20", "34",
    "23", "11", "32", "07", "05", "03", "13", "02", "40", "27",
    "33", "45", "06", "58", "35", "53", "21", "50", "28", "17",
    "22", "57", "12", "04", "49", "19", "47", "43", "48", "30",
    "36", "59", "31", "44", "15", "10", "37", "46", "16", "52"
]

# Crea un dizionario per accesso rapido alle domande
domande_dict = {q['id']: q for q in data['questions']}

# Costruisce la nuova lista nell'ordine desiderato
nuove_domande = []
for id_num in ordine_ids:
    id_str = f"Q{id_num}"  # Gli ID nel file sono del tipo "Q01", "Q02", ...
    if id_str in domande_dict:
        nuove_domande.append(domande_dict[id_str])
    else:
        print(f"Attenzione: ID {id_str} non trovato nel file JSON.")

# Sostituisce la lista originale
data['questions'] = nuove_domande

# Salva il file riordinato
with open('matematica1_riordinato.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Riordinamento completato. File salvato come 'matematica1_riordinato.json'.")