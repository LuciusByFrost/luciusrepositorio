# Cactus Survivors: O Último Cacto do Oeste

Os seis inimigos comuns e os quatro chefes têm pixel art própria, animações em
camadas e aparências enfurecidas. Veja [arte dos oponentes, avisos e previews](docs/enemy-pixel-art.md).

Jogo de sobrevivência 2D feito com HTML, CSS e JavaScript puro. Não usa bibliotecas, imagens externas ou servidor.

Agora possui **quatro árvores elementais** (Fogo, Gelo, Eletricidade e Veneno),
com três melhorias cada, e **quatro sinergias selecionáveis**: Tempestade Infernal,
Combustão Tóxica, Estilhaços Condutores e Praga Cristalizada. As cartas entram
progressivamente no menu de nível conforme os pré-requisitos; completar os
requisitos não ativa uma sinergia automaticamente.

As oito armas podem aplicar vários elementos na mesma build. Acúmulos,
intervalos, resistência dos chefes e propagação são limitados. Os indicadores
no topo mostram os elementos e sinergias adquiridos. Veja as árvores, valores,
arquitetura e testes em [Builds elementais](docs/elemental-builds.md).

Verificação do sistema: `node tools/check_elements.cjs`.

**Jogar** agora abre uma seleção com quatro forasteiros: Nopal (revólver),
Rosa da Serrada (espingarda), Bento Pavio-Curto (dinamite) e Íris do Trovão
(laço elétrico). Use **1–4/setas** ou clique/toque; confirme com **Enter/Espaço**
ou **Partir**. O personagem inicial permanece disponível e todos mantêm acesso
às armas, evoluções e builds elementais.

A rotação de chefes mantém o Xerife Corrupto e acrescenta Coronel Ferrugem,
Viúva da Tempestade e Coveiro do Breu, com arte, ataques avisados e fases próprias.
Veja [personagens, chefes e testes](docs/characters-and-bosses.md).

Verificação: `node tools/check_roster_bosses.cjs`.

Os baús comum, de chefe e de conhecimento têm visuais próprios e agora dão
**XP que cresce 25% por nível**: `base × 1,25^(nível − 1)`, arredondado.
Um baú comum vale 12 XP no nível 1, 89 no nível 10 e 833 no nível 20;
espólios de chefe dão mais, e respostas corretas recebem bônus conforme a
pergunta. Evoluções/tônicos continuam, e cada nível ganho gera uma escolha.
Veja [recompensas dos baús](docs/chests.md). Teste: `node tools/check_chests.cjs`.

## Como iniciar

Abra `index.html` diretamente em um navegador moderno. Os scripts são clássicos e locais para permitir o uso por `file://`. O áudio sintetizado começa após a primeira interação, conforme as regras do navegador.

Use o arquivo na raiz **`luciusbyfroty/index.html`**, junto de `assets/` e `js/`.
A antiga entrada `luciusrepositorio/index.html` agora encaminha para ele. Se usar
Live Server ou outro servidor local, abra a pasta `luciusbyfroty` como raiz do
servidor. Após atualizar uma aba já aberta, use **Ctrl+F5**.

Os sprites PNG do Nopal, Rosa e Bento aparecem na seleção e na partida. Veja a
[correção das entradas e a verificação no navegador](docs/sprite-loading.md).

## Controles

- **WASD** ou **setas**: mover.
- **E**: interagir com um Baú do Conhecimento próximo.
- **1–4** ou clique/toque: responder à pergunta; **ESC** fecha o painel sem consumir a pergunta.
- **ESC**: pausar/continuar a partida.
- **1–3**, **Espaço** ou clique: escolher uma melhoria ao subir de nível.
- **Celular**: direcional virtual e botão de interação contextual.

Os ataques são automáticos. Movimente-se para posicionar o cacto, desviar e recolher gemas.

## Sistemas

- Baús do Conhecimento aparecem em locais livres perto da área explorada. Aproxime-se e pressione **E** (ou toque no botão); a partida inteira pausa enquanto responde.
- Banco de 60 perguntas originais de redes, organizado em seis categorias e três níveis. As perguntas avançadas são liberadas gradualmente e não se repetem na partida enquanto houver opções elegíveis.
- Resposta correta concede experiência extra e pode aprimorar uma arma; a recompensa aumenta conforme a dificuldade. Resposta errada mostra a alternativa correta e uma explicação, sem penalidade. Cada baú só pode ser respondido uma vez.
- As perguntas abordam conceitos introdutórios gerais alinhados aos temas de Networking Basics, fundamentos de redes e Packet Tracer. Este material é independente, não é oficial nem certificado pela Cisco.
- Oito armas automáticas com níveis, padrões próprios, upgrades e evoluções via baús comuns.
- Hordas por estágio, sete arquétipos de inimigos e o chefe Xerife Corrupto com projéteis e mudança de fase.
- Experiência, seleção de três melhorias, sorte, atributos, gemas, cenário procedural e sprites em Canvas.
- Pausa completa durante escolhas, recorde e opção de som guardados em `localStorage`.

## Arquivos principais

- `js/main.js`: jogo, renderização, entrada e integração da interface.
- `js/network_questions.js`: banco de perguntas e recompensas por dificuldade.
- `js/knowledge_chests.js`: seleção de perguntas e estado de uso/resposta dos baús.
- `knowledge.css`: botão contextual de interação em telas touch.

## Limitações atuais

- As opções limitam-se a alternar efeitos sonoros; não há trilha musical.
- O cenário é uma arena procedural extensa, sem transição entre mapas ou prédios exploráveis.
- As evoluções de armas são concedidas por baús comuns quando os requisitos de nível são atendidos.
- Cenários e Íris usam arte procedural; Nopal, Rosa e Bento usam spritesheets locais com fallback procedural.

## Expansões recomendadas

Adicionar mais chefes e padrões, itens passivos que habilitem evoluções, biomas exploráveis, opções de acessibilidade e uma trilha original opcional.

## Nopal: spritesheet local

Nopal usa agora o PNG local normalizado em 16 quadros, com pés alinhados, alpha
real, braço/revólver separado para mira e fallback para a arte anterior. Os outros
forasteiros mantêm a arte atual. Veja [integração, prévia e verificações do Nopal](docs/nopal-spritesheet.md).

A seção abaixo descreve a arte procedural preservada como fallback.

Rosa agora é uma pistoleira réptil do deserto, com spritesheet local, pés
alinhados e disparo ligado ao tiro real da espingarda. Ela reutiliza a estrutura
do Nopal. Veja [integração, prévia e verificações da Rosa](docs/rosa-spritesheet.md).

Bento usa agora uma folha de ações e outra de caminhada em **oito direções**.
Ao parar, conserva a orientação; o arremesso acompanha o lançamento real da
dinamite. Os originais foram preservados. Veja [arquivos, recortes e verificações
do Bento](docs/bento-spritesheet.md). Não há PNG da Íris na pasta dela, e sua
aparência atual continua funcionando.

## Protagonista: cacto pistoleiro

`js/player_sprite.js` compõe pixel art original em camadas de Canvas auxiliares
de 64×64 pixels, criadas uma única vez. Não há PNGs ou dependências externas.
A silhueta mantém aproximadamente a altura anterior (60 pixels), com corpo
verde-escuro com sombras oliva, espinhos, cicatriz, chapéu largo gasto, poncho
recortado, bandana vermelha, botas e coldre vazio. As laterais escalonadas e
braços curtos reforçam o cartoon moderado; olhos estreitos e sobrancelhas
inclinadas mantêm uma expressão séria.

O caminho ativo continua sendo `installDetailedSprites()` → `drawPlayerNight()`
→ `CactusHero.draw()`, seguido de uma única chamada a `drawHeldWeapon()`.
Os desenhos antigos inativos não são chamados por esse caminho.
Sombra, botas, braços, corpo/cinto, poncho, expressão, bandana, chapéu e efeitos
são compostos separadamente. `bake()` é o ponto de substituição futura por
recortes de spritesheets, mantendo âncora e poses.

`visualStride` avança pela distância comandada de caminhada, sem alterar o
deslocamento; parado, as botas repousam. Respiração, chapéu e tecido usam o
tempo da partida e congelam em pausa. Piscadas duram cerca de 140 ms a cada
4,7 segundos; ataque e dano têm prioridade sobre elas. Ataque e dano aproveitam
os temporizadores existentes: braço/arma recuam, o chapéu reage ao disparo e o
rosto reage ao impacto. A compressão de dano dura cerca de 110 ms e utiliza
variantes em cache que removem duas linhas de pixels, sem escala fracionária.
A arma acompanha a mesma pose, com a mão posicionada no lado da mira, e mantém
o ângulo de mira existente. O revólver teve apenas sua escala visual reduzida
para melhorar a leitura dos acessórios. Não há animação de morte no
jogo original; o desenho continua sob a tela de fim de jogo.

A origem do jogador e a hitbox circular de raio 15 permanecem inalteradas.
Chapéu, botas e arma são extensões visuais, não áreas extras de colisão.

Verificação reproduzível: `node tools/check_player_sprite.cjs`. Compara 900
quadros determinísticos com `HEAD:js/main.js`, as oito armas e dano; verifica
poses, piscadas, recuperação da compressão, reação do chapéu, orientações,
hitbox, ausência de mutações durante desenho e reutilização
dos canvases. O Canvas desse teste é simulado, portanto ele não mede FPS nem
qualidade visual. `node tools/check_player_sprite.cjs --preview` também gera
`tools/player-preview.generated.html`, uma prévia descartável para inspeção no
navegador com o renderizador real e poses em escala normal e ampliada.

Foram verificadas sintaxe JavaScript, equivalência de simulação e poses estáticas
no Chrome headless. Fluidez durante uma partida interativa, comportamento em
celular e FPS com hordas ainda exigem validação manual. Melhorias futuras do
protagonista: atlas PNG opcional e animação própria de morte.

O revólver usa uma camada própria em cache (`CactusHero.drawRevolver()`), com
aço escurecido, tambor com sulcos, guarda-mato de latão e cabo de madeira.
Mantém a escala visual e a extremidade do cano usadas pelo efeito de disparo.
Os desenhos-base das outras armas foram preservados; suas animações estão
descritas abaixo.

A densidade dos cactos decorativos durante a partida é controlada por
`MAP_CACTUS_THRESHOLD` em `js/main.js`. O limite 0,98 mantém aproximadamente
um terço dos cactos anteriores (redução de 66,6% em uma amostra de 40.000
células), preservando arbustos e as posições dos cactos restantes. Os cactos
decorativos do menu não foram alterados.

## Dinamite e terreno

- Dinamite: dano base 70 (antes 45), raio base 110 pixels (antes 74), mantendo
  recarga de 4,2 segundos, velocidade e tempo de detonação. Evolução continua
  multiplicando o raio por 1,35 e melhorias de área continuam cumulativas.
- O jogador agora inicializa `area: 1`. Antes, o multiplicador indefinido
  produzia um raio inválido e impedia acertos da explosão; o multiplicador
  também é usado pelo meteoro e pela melhoria Pavio Longo.
- Terreno noturno com variações discretas de cor e uma estrada sinuosa com
  sulcos de carroça. `drawDustTrail()` usa coordenadas do mundo e grade de
  quatro pixels; a estrada é inteiramente decorativa, sem colisão ou bônus.
  A densidade reduzida dos cactos foi preservada.

O teste `node tools/check_player_sprite.cjs` aplica o novo balanceamento da
dinamite à referência antes de comparar os 900 quadros, para detectar mudanças
não relacionadas. Também testa separadamente dano, recarga, limites da explosão,
melhoria de área e evolução. Use `--preview --map` para gerar uma prévia do mapa.
O terreno foi inspecionado no Chrome headless; FPS em partida não foi medido.

## Animação do Laço Elétrico

O laço na mão gira e alterna fios luminosos, expandindo durante o ataque.
Cada alvo realmente atingido registra um arco visual entre as posições do
lançador e do alvo. Descargas em zigue-zague aparecem em sequência, com núcleo
claro, borda azul, aro de impacto e pequenas faíscas. A evolução usa azul-violeta
e oscilações mais largas. Não são usados filtros de desfoque.

Os arcos duram 0,36 segundo e usam o tempo da partida, congelando na pausa.
O pequeno intervalo entre saltos é exclusivamente visual: o dano continua
imediato, com os mesmos alvos, alcance, recarga e quantidade de saltos.
Os efeitos usam posições registradas, sobrevivem à remoção do inimigo e têm
limite de 64 arcos simultâneos. O desenho não consome números aleatórios do
combate e não modifica entidades.

Os testes comparam o laço normal e evoluído com a lógica anterior, incluindo
ordem dos alvos, dano, sequência aleatória, pausa e descarte dos arcos.
`node tools/check_player_sprite.cjs --preview --lasso` gera uma pose de inspeção
com três inimigos. A aparência foi inspecionada no Chrome headless; fluidez
interativa e FPS ainda precisam de verificação manual.

## Animações das oito armas

`js/weapon_visuals.js` centraliza poses, projéteis, impactos e efeitos de armas.
`js/main.js` mantém a lógica do combate e registra somente metadados visuais
nos projéteis (`visualWeapon`, `visualBorn`) e eventos em `weaponFx`.

| Arma | Animação |
| --- | --- |
| Revólver | Recuo, movimento do cão/tambor, clarão variável, fumaça e estojo ejetado. |
| Espingarda | Recuo mais forte, movimento da telha, clarão largo, fumaça e cartucho ejetado. |
| Dinamite | Faíscas no pavio, gesto de lançamento, giro e arco visual de voo, sombra e explosão com onda expansiva e fumaça. |
| Cacto Giratório | Espinhos visíveis orbitando no mesmo raio e ângulo usados pelo ataque, com rotação, rastros e faíscas nos acertos. |
| Laço Elétrico | Giro do laço, descarga entre os alvos, aros de impacto e dissipação. |
| Chuva de Balas | Movimento do mecanismo, clarão, projéteis com rastros e pulso circular no disparo. |
| Meteoro de Ouro | Núcleo flutuante na mão, marcação do raio, meteoro em queda com cauda e onda de impacto. |
| Canhão Sol Dourado | Núcleo pulsante, recuo, clarão de energia, projétil com cauda luminosa e faíscas nos acertos. |

Toda animação da partida usa o tempo de simulação, respeitando a pausa. O voo
arqueado da dinamite altera apenas o desenho; suas coordenadas e o instante de
detonação permanecem iguais. A queda do meteoro acompanha o temporizador real
do ataque. O clarão da arma acompanha sua transformação, sem duplicar o cano.

Efeitos adicionais não utilizam `Math.random`, não aplicam dano e não alteram
alvos, velocidade, recarga ou colisões. São limitados a 96 eventos, duram até
0,6 segundo e são descartados na atualização. O desenho usa pixels sólidos,
sem filtros de desfoque e sem criar novos canvases por quadro.

O verificador também executa 120 quadros com as oito armas simultâneas,
normais e evoluídas, comparando combate e sequência aleatória com a referência.
Confere desenho sem mutações, pausa, limpeza e limite de efeitos. As versões
normal/evoluída conservam as diferenças de balanceamento já existentes.

Para inspecionar: `node tools/check_player_sprite.cjs --preview --weapons`.
Abra `tools/player-preview.generated.html` e use **Animar / pausar**. A galeria
usa `tools/weapon-preview.js`, que não é carregado pelo jogo. Ela foi conferida
no Chrome headless em poses estáticas e com animação habilitada, sem erros
reportados. FPS de uma partida interativa com hordas ainda não foi medido.
