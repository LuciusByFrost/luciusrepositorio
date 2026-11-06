# Baús: tesouros e XP por nível

Todos os baús agora concedem XP além das recompensas de arma/tônico já
existentes. Baús de conhecimento continuam exigindo resposta correta.

```
XP = arredondar(base × 1,25 ^ (nível do jogador − 1))
```

O crescimento é de **25% por nível**, calculado na coleta ou na resposta,
sem congelar o prêmio no nível em que o baú apareceu.

| Nível | Baú comum, base 12 | Espólio de chefe, base 30 | Conhecimento, exemplo de questão com base original 8 |
| --- | --- | --- | --- |
| 1 | 12 | 30 | 16 |
| 5 | 29 | 73 | 39 |
| 10 | 89 | 224 | 119 |
| 20 | 833 | 2.082 | 1.110 |

A base do conhecimento é **duas vezes** o XP original da pergunta, preservando
as diferenças de dificuldade. Antes de sortear uma pergunta, a indicação no
mapa mostra a faixa de XP do banco; depois, o painel mostra o valor exato.
Resposta errada não dá XP, melhoria ou evolução.

## Aparência e interação

- Comum: madeira envelhecida, ferragens de bronze e fecho dourado.
- Chefe: metal escuro, ferragens de ouro e emblema no tampo.
- Conhecimento: madeira azul-petróleo, selo luminoso e marca de pergunta.
- Tampa separada, faíscas discretas, abertura e indicação flutuante do XP.
- Aproximação mostra o prêmio previsto; **E** só interage com conhecimento.
  Os outros dois tipos continuam sendo recolhidos por contato.

O prêmio de chefe é identificado na criação do baú, inclusive nos três novos
chefes. O XP só entra na coleta; a gema de chefe e os demais drops permanecem.
Evoluções continuam elegíveis a partir do nível de arma 3; quando não há uma
evolução elegível, o baú mantém tônico e melhoria de arma. Com todas as armas
no máximo, ainda concede tônico e XP. As oito evoluções têm nome no aviso.

## Progressão e proteção contra duplicação

Cada baú registra `rewardClaimed`, `rewardLevel` e `rewardXP`. O quiz usa
`rewardApplied` e também registra o nível/XP concedidos. Abrir ou responder
novamente o mesmo objeto não repete o prêmio.

XP restante é preservado e cada nível ganho gera exatamente uma escolha de
melhoria. Múltiplos níveis são enfileirados. No quiz, as escolhas aparecem
somente depois de fechar o resultado. Sinergias continuam dependendo da carta
selecionada e dos pré-requisitos; nunca são dadas automaticamente pelo baú.

O XP de gemas e a fórmula de custo dos níveis não foram alterados. Valores de
baú são inteiros e limitados tecnicamente a `Number.MAX_SAFE_INTEGER`, evitando
infinito/NaN em níveis artificiais extremos.

## Arquivos e testes

- `js/chests.js`: balanceamento, fórmula, classificação, modelos em cache e
  animações. `balance` reúne crescimento e bases ajustáveis.
- `js/main.js`: XP, fila de escolhas, prêmios, identificação dos drops de chefe,
  painel do quiz e chamada da renderização.
- `js/knowledge_chests.js`: identificação e interação exclusiva do conhecimento.
- `tools/check_chests.cjs`: fórmula até nível 100, limites numéricos, níveis
  múltiplos, duplicação, respostas, reabertura, evoluções, chefes, cache, pausa
  e reinício, com o jogo real e Canvas simulado.

```
node tools/check_chests.cjs
node tools/check_elements.cjs
node tools/check_roster_bosses.cjs
node tools/check_player_sprite.cjs
node tools/check_player_sprite.cjs --preview --chests
```

A prévia gerada em `tools/player-preview.generated.html` usa
`tools/chest-preview.js`, que não entra no jogo. O modo padrão compara os três
baús fechados/abrindo; `?mode=quiz` mostra o prêmio da pergunta; `?mode=play`
verifica coleta, chefe, resposta e níveis múltiplos no navegador real.

O coeficiente de 1,25 é um balanceamento inicial; seu impacto em corridas longas
e FPS com hordas ainda exige playtest.
