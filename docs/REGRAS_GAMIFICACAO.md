# Regras de gamificação do Ask.IA

> Card: **[BACK] Regras de gamificação: XP, ofensiva e conquistas**
> Escopo desta entrega: contador de perguntas respondidas, dias seguidos de uso, XP (§3 abaixo,
> agora implementado) e conquistas (`GET /api/conquistas`, agora implementado).
> Ainda fora do escopo: loja, ranking e medalha animada — não há sistema de "gasto" de pontos
> definido pelo time, então não dá pra montar uma loja sem essa definição primeiro.

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

## 2. Endpoints

`GET /api/gamificacao` (exige login; cada usuário vê só os próprios números)

```json
{
  "perguntasRespondidas": 12,
  "diasSeguidos": 3,
  "usouHoje": true,
  "xp": 245
}
```

`GET /api/conquistas` (exige login)

```json
[
  { "id": "primeira-pergunta", "nome": "Primeira pergunta", "descricao": "Faça sua primeira pergunta ao Ask IA.", "desbloqueada": true },
  { "id": "curioso", "nome": "Curioso", "descricao": "Faça 10 perguntas ao Ask IA.", "desbloqueada": true },
  { "id": "constante", "nome": "Constante", "descricao": "Mantenha 7 dias seguidos de uso.", "desbloqueada": false },
  { "id": "imparavel", "nome": "Imparável", "descricao": "Mantenha 30 dias seguidos de uso.", "desbloqueada": false }
]
```

Tudo é calculado na hora a partir do que já está gravado. Não há tabela nova nem número guardado que possa ficar desatualizado.

## 3. XP — quanto vale cada ação

| Ação | XP |
|---|---|
| Pergunta respondida no Ask IA | +10 |
| Sessão de estudo registrada | +20 |
| Tópico concluído | +15 |
| Cada dia de uso (histórico, não só a sequência atual) | +5 |

O XP nunca diminui: mesmo que a ofensiva (dias seguidos) quebre, o XP acumulado de todo o histórico continua valendo. `GamificacaoService.resumo()` calcula isso multiplicando cada contagem (perguntas, sessões, tópicos concluídos, dias de uso distintos) pelo peso da tabela acima.

## 4. Conquistas

| Conquista | Regra |
|---|---|
| Primeira pergunta | 1 pergunta respondida |
| Curioso | 10 perguntas respondidas |
| Constante | 7 dias seguidos |
| Imparável | 30 dias seguidos |

## 5. Loja (ainda não implementada)

Precisa de uma decisão do time antes de existir: o que dá pra "comprar" com XP, e se XP deve ser
gasto (e então deixar de servir pra medir progresso total) ou se a loja usa uma moeda separada.
Sem essa definição, não há o que construir aqui além de uma vitrine vazia.
