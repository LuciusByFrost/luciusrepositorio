# Forasteiros e novos chefes

> Atualização: nove visuais agora usam PNGs. Consulte [integração atual](enemy-png-integration.md). As descrições procedurais abaixo documentam o fallback preservado e os sistemas de combate.

Os seis inimigos comuns e quatro chefes agora compartilham o módulo de arte
procedural `js/enemy_sprites.js`. Veja [redesign dos oponentes](enemy-pixel-art.md)
para camadas, animações, fases, avisos corrigidos, limites e previews dos dez tipos.

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
compartilha um compositor, com geometria própria para cada personagem e camadas
pré-renderizadas em cache. Pré-visualizações usam a mesma arte e arma da partida,
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

`js/bosses.js` concentra perfis, rotação, movimento, ataques e avisos dos três
novos encontros. `js/enemy_sprites.js` concentra a arte e as animações dos dez
oponentes. `js/main.js` mantém a IA original dos demais inimigos e do Xerife,
integra os encontros e contabiliza mortes/recompensas.

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

## Redesign visual dos forasteiros

Nopal usa copa angular assimétrica, poncho puído com costuras, coldre, esporas
e bandana vermelha. Rosa tem ombros largos, postura avançada, copa terracota
inclinada, bandana azul-petróleo e cartucheira diagonal. Bento é baixo e largo,
com óculos grandes sobre o rosto, botas reforçadas, luvas, dinamites e bolsa
de couro independente. Íris tem corpo esguio, casaco dividido, aba levantada,
bandana violeta longa e bobina de cobre com núcleo ciano.

As superfícies continuam em 64×64, com origem local (32,40). Materiais comuns
passam pelas paletas existentes; a geometria não é redimensionada. Cada camada
tem uma versão de impacto sem reamostragem. Piscar e dano também fecham as
lentes dos óculos de Bento. Sua bolsa oscila separadamente dos óculos.

Perfis visuais determinam frequência de respiração, amplitude da passada,
inclinação, piscadas e reação do chapéu. A passada continua vinculada à
distância percorrida, sem alterar velocidade ou hitbox. Ataques continuam
acionados pelos eventos de armas existentes. O ponto de montagem é compartilhado
entre braço e arma; uma ligação pixelada segue a mira e o recuo, e a mão em
cache é desenhada sobre a empunhadura. Não há canvases novos por quadro.

Os cartões mostram nome, título, função e arma inicial, com a mesma renderização
da partida. Teclado, clique e toque conservam os manipuladores existentes.

Verificação adicional: `node tools/check_character_art.cjs` inspeciona os
retângulos reais do cache, limites, silhuetas e 576 combinações de poses, com
quatro direções de alcance. O teste de sprites também percorre todos os
personagens com as oito armas e ambos os sentidos, verificando pureza e cache.

Após `node tools/check_player_sprite.cjs --preview --roster`, abra
`tools/player-preview.generated.html?mode=characters` para comparar os cinco
estados em tamanho real e 2×. O modo padrão continua sendo o menu animado e
jogável. A captura `tools/characters-comparison.png` usa essa mesma renderização,
sem arte externa. `tools/characters-mobile.png` registra o menu estreito.

Os testes garantem simulação preservada e ausência de alocações de canvas
por quadro; não substituem medição de FPS ou playtest em celulares físicos.

### Grade de pixels e rasterização das armas

A comparação com `HEAD` mostrou que as camadas dos corpos já eram retângulos
inteiros em cache. O caminho das armas, porém, desenhava retângulos diretamente
sob rotação livre no contexto de apresentação e conservava escalas de 1,1× e
1,12×. Desativar interpolação de imagens não evita antialiasing de retângulos
vetoriais girados; ampliar esse desenho também não mantém uma grade uniforme.

As escalas fracionárias foram removidas. A arte procedural de cada arma, sua
mão e seus efeitos são pintados em coordenadas inteiras numa superfície de
96×96. Outra superfície de mesma resolução recebe esse bitmap com rotação por
vizinho mais próximo, com margem transparente. Só então o resultado é composto
sem rotação no contexto de apresentação. As duas superfícies são reutilizadas;
não há leitura de pixels nem criação de canvas no caminho de animação.

As silhuetas próprias foram preservadas. Ombros e flancos têm degraus de pixels,
o volume da pele usa blocos de luz interrompidos e o braço tem cotovelo angular,
com contorno pintado antes do preenchimento. Acessórios e perfis de animação
continuam ativos. A escala dos previews é inteira.

Após gerar o preview, abra `tools/player-preview.generated.html?mode=pixels`.
Esse modo usa Canvas real, verifica que a rotação de uma fonte opaca não cria
alpha intermediário e compara o personagem inteiro em 1× com cada bloco de
pixels das versões 2× e 4×. São 978 verificações, cobrindo quatro personagens,
oito armas, cinco ângulos e dois sentidos. Também exige amostras não vazias,
para detectar enquadramento incorreto. A prancha mantém tamanho fixo de
1200×800, independente da janela usada para inspeção.

O acabamento dos quatro personagens usa rampas de quatro tons de pele por
personagem. Tons muito próximos foram agrupados; luz e sombra formam blocos
deliberados. Contornos dos olhos e braços foram reforçados, mantendo roupas,
armas, equipamentos e as quatro silhuetas. A pele do braço que acompanha a
mira usa a mesma rampa das camadas em cache.

### Proporções articuladas

O desenho foi reconstruído em cabeça, pescoço, tronco vestido, cintura e pernas
separadas. Nopal tem poncho diagonal rasgado e colete exposto; Rosa usa jaqueta
curta com ombros largos e base de combate aberta; Bento tem avental curto,
suspensórios e bolso de ferramentas; Íris tem cintura estreita, pernas longas
e duas abas separadas de casaco. A cabeça é mais larga que a cintura nos quatro.
Só o braço livre vem da camada de corpo; o outro acompanha a arma, evitando
um terceiro braço sobreposto. A origem, sola e colisão continuam iguais.

`tools/characters-before-shapes.png` registra o desenho anterior;
`tools/characters-new-silhouettes.png` mostra as novas proporções com o mesmo
renderizador real. Tanto o `index.html` da raiz quanto o da subpasta
`luciusrepositorio` carregam agora os mesmos arquivos atualizados do jogo.
A versão anterior da subpasta foi preservada em `tools/legacy-game-backup/`.

### Expressões, sincronização e conferência final

Os quatro têm uma expressão de ataque diferente do repouso: Nopal estreita os
olhos e firma a mandíbula, Rosa mostra os dentes, Bento sorri com reflexos
deslocados nas lentes e Íris levanta a sobrancelha com um sorriso discreto.
O deslocamento do corpo durante o ataque é específico: recuo curto de Nopal,
recuo mais forte de Rosa, avanço de arremesso de Bento e impulso ágil de Íris.
Esses movimentos dependem do temporizador de ataque existente.

O menu passa um único instante visual para corpo, braço e arma. O teste real
no navegador compara cada preview com o personagem da partida no mesmo
instante; os quatro devem coincidir pixel a pixel. As outras verificações
comparam 1× com 2× e 4×, incluindo as oito armas em diagonais e nos dois sentidos.
O teste Node também dispara as armas iniciais e aplica dano pela API real,
confirmando que os eventos acionam as expressões corretas.

Os cartões permitem duas linhas para função e título. O modo `?mode=mobile`
do preview mostra o menu em uma área de 360×740. A captura final está em
`tools/characters-definitive.png`, com cinco estados dos quatro personagens,
e `tools/characters-mobile.png` registra o menu estreito. Não há imagens
externas na arte do jogo; essas capturas são apenas artefatos de inspeção.

As duas cópias do jogo têm os mesmos 13 arquivos de execução. Os comandos de
teste continuam sendo executados a partir da pasta principal; testes de elenco
e arte também foram executados na subpasta usando as ferramentas da raiz.
Não foram feitos commit, push ou publicação. FPS em celulares físicos e
playtest prolongado continuam fora da validação automatizada.
