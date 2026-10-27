# Regras de gamificação do Ask.IA

> Card: **[BACK] Regras de gamificação: XP, ofensiva e conquistas**
> Escopo desta entrega: a **versão mínima** do card — contador de perguntas respondidas + dias seguidos de uso.
> Fora do escopo (conforme o card): loja, ranking e medalha animada.

## 1. O que está implementado

### Pergunta respondida
Cada pergunta que o aluno faz no Ask IA **e recebe resposta** conta como 1. O backend só grava a pergunta junto com a resposta, na mesma transação, então pergunta que falhou não conta. O contador é o total de todos os tempos.

### Dia de uso
Um dia conta como "dia de uso" se o aluno fez **pelo menos uma** destas ações nele:

- fez uma pergunta ao Ask IA (e recebeu resposta);
- registrou uma sessão de estudo.

### Dias seguidos (ofensiva)
Quantos dias de uso consecutivos, contando para trás:

| Situação | Resultado |
|---|---|
| Usou hoje | A sequência termina hoje (ex.: hoje, ontem e anteontem = 3). |
| Ainda não usou hoje, mas usou ontem | A sequência termina ontem. O dia de hoje ainda não acabou, então não quebra. |
| Não usou nem hoje nem ontem | 0. Passar um dia inteiro sem usar zera a sequência. |
| Falta um dia no meio | A contagem para no buraco. |

**Sem limite máximo:** 45 dias seguidos valem 45. (Antes o cálculo parava em 30.)

### Fuso horário
O "dia" do aluno é o dia em **Brasília** (`app.ia.fuso`, a mesma configuração do limite diário de perguntas). O banco guarda a hora no fuso do servidor (UTC no Docker), então o backend converte antes de comparar. Assim, uma pergunta feita às 22h30 em Salvador conta no dia de Salvador, e não no dia seguinte.

### Uma definição só
A ofensiva mostrada no Painel, no Progresso e no Ask IA (`GET /api/progresso`) usa **a mesma regra** do endpoint novo. Antes ela contava só sessões de estudo.

## 2. Endpoint

`GET /api/gamificacao` (exige login; cada usuário vê só os próprios números)

```json
{
  "perguntasRespondidas": 12,
  "diasSeguidos": 3,
  "usouHoje": true
}
```

Tudo é calculado na hora a partir do que já está gravado. Não há tabela nova nem número guardado que possa ficar desatualizado.

## 3. Proposta para depois da versão mínima (NÃO implementada — a equipe decide)

### XP — quanto vale cada ação (sugestão)

| Ação | XP |
|---|---|
| Pergunta respondida no Ask IA | +10 |
| Sessão de estudo registrada | +20 |
| Tópico concluído | +15 |
| Manter a sequência (por dia de uso) | +5 |

### Conquistas (sugestão)
Todas podem ser calculadas só com os dois números que já existem, sem dado novo:

| Conquista | Regra |
|---|---|
| Primeira pergunta | 1 pergunta respondida |
| Curioso | 10 perguntas respondidas |
| Constante | 7 dias seguidos |
| Imparável | 30 dias seguidos |

Se a equipe aprovar, o próximo passo é um `GET /api/conquistas` que devolve quais já foram desbloqueadas.
