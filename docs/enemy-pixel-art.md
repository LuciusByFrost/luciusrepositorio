# Inimigos e chefes em pixel art

> Atualização: nove visuais agora usam PNGs. Consulte [integração atual](enemy-png-integration.md). As descrições procedurais abaixo documentam o fallback preservado e os sistemas de combate.

O redesign usa a versão local atual e preserva os quatro personagens jogáveis.
Toda a arte dos oponentes é procedural, sem imagens externas, curvas vetoriais,
gradientes internos ou escalas fracionárias. Os pixels têm a mesma densidade dos
personagens; os chefes são maiores por geometria própria, sem ampliar o pixel.

## Desenhos

| Tipo | Silhueta e equipamento |
| --- | --- |
| Bandido | Chapéu marrom gasto, postura curvada, couro sujo, bandana ferrugem, roupa rasgada e coldre. |
| Corredor | Corpo estreito, pernas compridas, chapéu fino e lenço laranja que acompanha a corrida rápida. |
| Pistoleiro | Casaco azul escuro com abas, cartucheira, chapéu estreito e revólver apontado conforme a mira real. |
| Brutamontes | Ombros largos, braços grossos, couro danificado, rosto marcado, manoplas e botas pesadas. |
| Coveiro | Roupa púrpura rasgada, rosto pálido, olhos violetas, chapéu quebrado e pá enferrujada. |
| Encouraçado | Capacete fechado, pequenas aberturas luminosas, peitoral, ombreiras, bronze e botas rígidas. |
| Xerife Corrupto | Grande chapéu negro, casaco carmesim, abas rasgadas, estrela corrompida, cartuchos e revólver pesado. |
| Coronel Ferrugem | Armadura maciça com placas e rebites, chapéu militar, núcleo quente e canhão com aros de latão. |
| Viúva da Tempestade | Silhueta alta e estreita, casaco azul-violeta, chapéu da meia-noite, circuitos de cobre e cajado elétrico. |
| Coveiro do Breu | Rosto esquelético, grande casaco de agente funerário, caixão preso às costas e pá monumental. |

## Camadas e animação

`js/enemy_sprites.js` cria 54 camadas em superfícies de 128×128, com origem em
(64,88). Corpo, cabeça, botas, equipamento, abas traseiras e detalhes da segunda
fase são compostos em coordenadas inteiras. O retângulo ocupado de cada camada
é calculado na criação: o desenho copia apenas essa área e ignora camadas vazias.
Não há criação de canvas nem leitura de pixels durante os quadros do jogo.

Uma `WeakMap` guarda exclusivamente posições anteriores, mira, eventos de tiro,
preparação e transição de fase. Esses dados não são anexados aos inimigos e não
participam de colisões, dano, sorte ou IA. `newGame` limpa o estado visual.

- Repouso: respiração discreta e postura própria.
- Movimento: passada baseada na animação existente, condicionada ao deslocamento
  real. Só o pé suspenso sobe; a sola apoiada mantém sua altura.
- Corredor: ciclo mais rápido, pernas longas e lenço oscilante.
- Brutamontes e armaduras: passada mais lenta, apoio largo e peso no tronco.
- Tiros: o evento real de criação de projéteis aciona recuo e clarão curto.
  Os leques do Coronel mantêm o canhão voltado ao eixo central, mesmo com morteiros
  pendentes. A rotação usa o rasterizador nativo existente dos personagens,
  reutilizado sem modificar a arte dos personagens jogáveis.
- Preparação: usa cooldowns e avisos já existentes; não cria ataques novos.
- Dano: deslocamento curto de cabeça/tronco, glints e faíscas nas armaduras.
- Derrota: sete fragmentos determinísticos de roupa, couro e osso; no máximo 64
  efeitos simultâneos, com duração de 0,45 s e sem consumir números aleatórios.

As animações e os efeitos usam o tempo da partida. Pausar não avança movimentos,
transições, recuo ou fragmentos. Congelamento interrompe a passada e a oscilação
do equipamento sem interferir nas regras elementais existentes.

## Fase enfurecida

O limiar permanece estritamente abaixo de 50% de vida. A transição emite uma
marca clara de pixels por 0,32 s, uma vez por passagem do limiar. A aparência
enfurecida continua ativa depois do clarão:

- Xerife: olhos vermelhos mais claros, casaco com marcas carmesins e estrela pulsante.
- Coronel: rachaduras quentes, núcleo exposto e pequenos pontos de calor.
- Viúva: olhos e circuitos ciano mais intensos, com descargas pixeladas na roupa.
- Coveiro do Breu: ossos expostos, marcas violetas e fragmentos sobrenaturais sutis.

## Avisos corrigidos, sem mudanças de combate

Havia duas divergências visuais na versão local anterior:

1. O aviso do canhão era uma faixa estreita, mas o disparo já era um leque.
   Agora cada trajetória é mostrada com a origem atual do chefe, alvo registrado,
   três ou cinco raios e abertura total de 0,48 rad. O raio visual do projétil é 5;
   o alcance indicado é 245×4 = 980, conforme velocidade e vida existentes.
   O leque elétrico usa abertura de 0,95 rad e alcance de 205×4 = 820.
2. O aviso da investida terminava no ponto de mira, a até 230 unidades, mas a
   velocidade/duração existentes limitam o deslocamento a 185×0,85 = 157,25.
   A faixa agora indica esse máximo na direção real da investida, incluindo a
   tampa frontal e a tolerância de contato de 2 pixels além do raio do chefe.
   Lentidão e congelamento podem reduzir o deslocamento efetivo; o aviso representa
   o máximo possível, sem alterar velocidade, duração ou lógica de contato.

Artilharia é laranja, investida é vermelha, eletricidade é ciano e invocação é
violeta. Morteiros conservam raio 48 e raios elétricos conservam raio 34.
Sepulturas usam um glifo de túmulo, distinguindo invocação de dano em área.
Não foram alterados alvos, temporizadores, projéteis, limites ou cálculos de dano.

## Verificação e previews

Execute na raiz:

```sh
node tools/check_enemy_sprites.cjs
node tools/check_roster_bosses.cjs
node tools/check_elements.cjs
node tools/check_chests.cjs
node tools/check_character_art.cjs
node tools/check_player_sprite.cjs
node tools/check_player_sprite.cjs --preview --roster
```

Para auditar também a simulação anterior à tarefa, a cópia local temporária
`tools/enemy-baseline.generated.js` foi preservada e pode ser usada com:

```sh
node tools/check_enemy_sprites.cjs tools/enemy-baseline.generated.js
```

Essa comparação verifica 2.400 quadros com os seis tipos comuns, os quatro
chefes, oito armas evoluídas, passagem do limiar de fúria e morte/recompensa.
As verificações de arte cobrem limites das camadas, pixels inteiros, dez
silhuetas geometricamente distintas, tiros reais, pausa, pureza do desenho,
ausência de novos canvases e correspondência dos avisos com os projéteis.

Abra `tools/player-preview.generated.html` com:

- `?mode=enemies`: os dez desenhos reais em escala de jogo e 2×; os chefes
  aparecem normais em 1× e enfurecidos em 2×.
- `?mode=enemy-pixels`: 300 verificações em Canvas real, comparando o resultado
  em 1× com cada bloco de pixels em 2×/4×, nos dois sentidos e em cinco estados.
  Também mede o desenho de 70 inimigos por quadro em 30 quadros.
- `?mode=bosses`: encontros reais com os avisos e as fases enfurecidas.
- `?mode=pixels`: conserva as 978 verificações dos personagens jogáveis.

As capturas de comparação e avisos são artefatos de inspeção, nunca assets
carregados pelo jogo. A medição de renderização no Chrome headless é indicativa;
não mede o custo completo de simulação, terreno, efeitos e interface, nem substitui
medição de FPS em celulares físicos ou playtest prolongado.

Na conferência final, o Chrome headless registrou 300 verificações de pixels
aprovadas e 8,24 ms por quadro para desenhar somente os 70 inimigos. Os testes
de elenco/chefes (256), elementos (1.177), baús (689) e personagens jogáveis
(576 poses e 978 verificações no navegador) também passaram. As duas cópias
possuem os mesmos 14 arquivos de execução. Os renderizadores antigos de inimigos
sem uso foram removidos de `main.js`, deixando uma única implementação visual.
