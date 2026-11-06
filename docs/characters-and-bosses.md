# Forasteiros e novos chefes

## Seleção de personagem

**Jogar** e **Enter** na tela inicial abrem a seleção antes de iniciar a partida.
Clique/toque num personagem ou use **1–4** e as **setas**; confirme em **Partir**,
**Enter** ou **Espaço**. **ESC** volta ao título. Na derrota, é possível tentar
novamente com o mesmo personagem ou abrir **Escolher personagem**.

| Personagem | Arma inicial | Identidade visual |
| --- | --- | --- |
| Nopal, O Último Cacto | Revólver do Deserto | Protagonista original, chapéu marrom e bandana vermelha |
| Rosa da Serrada | Espingarda Serrada | Chapéu terracota, bandana azul-petróleo, cartucheira e adorno no chapéu |
| Bento Pavio-Curto | Dinamite | Verde-oliva, óculos de mineiro, couro envelhecido e bolsa de explosivos |
| Íris do Trovão | Laço Elétrico | Verde azulado, chapéu da meia-noite, bandana violeta e bobina de cobre |

Todos começam com **100 de vida**, **205 de velocidade** e **hitbox circular de
raio 15**, sem talentos elementais automáticos. Somente a arma inicial escolhida
começa no nível 1; as outras começam no nível 0 e continuam disponíveis nas
melhorias, sob as regras anteriores. Evoluções, baús e árvores elementais
funcionam com os quatro personagens. A arma exibida em repouso é a inicial do
personagem, evitando um revólver visual não adquirido.

A última escolha é gravada no mesmo `localStorage` usado para som e recorde.
Uma identificação antiga/inválida retorna a Nopal. A partida nova sempre limpa
inimigos, ataques, talentos, efeitos e progresso da corrida anterior. Reiniciar
na pausa mantém o personagem escolhido. O direcional móvel fica oculto nos
menus, e suas entradas são limpas ao entrar na seleção ou iniciar uma corrida.

`js/characters.js` reúne catálogo, paletas, layout e cartões. `js/player_sprite.js`
reutiliza as mesmas animações para quatro variantes, com cores e acessórios
pré-renderizados em cache. Pré-visualizações usam a mesma arte e arma da partida,
sem modificar a simulação ou criar canvases por quadro.

## Rotação de chefes

A primeira luta continua sendo contra o **Xerife Corrupto**, com seu padrão
original. As próximas são **Coronel Ferrugem**, **Viúva da Tempestade** e
**Coveiro do Breu**; depois a sequência se repete. A rotação reinicia em cada
partida. O primeiro encontro continua em 65 segundos de onda, e o intervalo
seguinte e a pausa do relógio de onda durante lutas seguem as regras anteriores.

| Chefe | Padrão normal | Abaixo de 50% de vida |
| --- | --- | --- |
| Xerife Corrupto | Círculos de 10 balas e reforços | Segundo círculo de 8 balas; lógica original preservada |
| Coronel Ferrugem | Avança até média distância; canhão em leque após 0,7 s; morteiros de raio 48 após 0,95 s a cada segunda salva | Leque de 5 projéteis, morteiros em toda salva e intervalo menor |
| Viúva da Tempestade | Circula o jogador; marca três raios de raio 34, com avisos de 0,85–1,05 s | Troca o sentido de circulação, inclui leque elétrico e ataca mais rápido |
| Coveiro do Breu | Avisa uma investida por 0,85 s e avança em direção fixada; sepulturas avisadas por 1,05 s invocam coveiros | Investidas mais frequentes e três invocações blindadas |

As áreas e direções são registradas no aviso, permitindo sair delas. Ataques
resolvem uma única vez. Investidas não seguem o jogador após começar. Avisos
pendentes são cancelados quando o dono morre; projéteis já disparados continuam
seguindo as regras normais do jogo. O nome e o estado enfurecido aparecem na
barra de chefe, e cada chefe novo possui arte pixelada própria.

Os três novos chefes usam a resistência elemental de chefe: congelamento curto
de 0,25 s, janela de resistência e lentidão reduzida. Congelamento impede novas
ações e movimento; avisos já comprometidos continuam contando, assim como
projéteis já disparados. Pausa, melhorias, quiz e seleção interrompem toda a
simulação, incluindo esses avisos.

O limite anterior de 14 inimigos em lutas de chefe também se aplica às novas
invocações. O módulo limita avisos pendentes a 24 e não dispara novas salvas se
já houver 220 projéteis hostis. Recompensas permanecem uma gema de XP de chefe
e um baú por derrota. A morte por elementos também entrega esses prêmios.

`js/bosses.js` concentra perfis, rotação, movimento, ataques, avisos e arte dos
três novos encontros. `js/main.js` mantém a IA original dos demais inimigos e do
Xerife, integra os encontros e contabiliza mortes/recompensas.

## Verificação

```
node tools/check_roster_bosses.cjs
node tools/check_elements.cjs
node tools/check_player_sprite.cjs
node tools/check_player_sprite.cjs --preview --roster
```

`tools/game_fixture.cjs` permite testar o jogo real com Canvas simulado. As
verificações cobrem entradas de teclado/clique, arma inicial, evolução, estado
limpo, escolha persistida, layouts, cache, avisos, dano único, esquiva, fases,
pausa, congelamento, limites, rotação e recompensas. Cada novo personagem também
é simulado com a build elemental completa contra um dos chefes novos.

O último comando gera a prévia descartável `tools/player-preview.generated.html`.
Ela usa `tools/roster-preview.js`: o modo padrão permite navegar no menu e jogar;
`?mode=bosses` mostra os quatro chefes; `?mode=play` executa três simulações de
180 atualizações no navegador real, uma por personagem/chefe novo. Essas
ferramentas não são carregadas pelo `index.html` do jogo.

Capturas e simulações não substituem playtest prolongado para ajustar a
dificuldade dos três encontros, testes em celulares reais ou medição de FPS.
