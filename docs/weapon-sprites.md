# Armas em oito direções

Original preservado: `assets/weapons/weapons_8directions.png`, PNG RGBA
**1254 × 1254**, 1194206 pixels com alpha zero e 377766 com alpha parcial.
`assets/weapons/atlas.js` registra SHA-256, 64 recortes medidos, pivôs e bocas
dos canos. Não há config.json no sistema de assets do projeto.

As linhas são revolver, shotgun, dynamite, thorns, lasso, rain, meteor e solar.
As colunas são direita, baixo/direita, baixo, baixo/esquerda, esquerda,
cima/esquerda, cima e cima/direita. Os limites inspecionados são colunas
0/180/330/475/620/785/940/1090/1254 e linhas
0/178/320/478/614/777/905/1060/1254; a divisão uniforme cortaria algumas peças.
Os recortes encerram pixels com alpha >16, mantendo a transparência original
dentro deles. Empunhaduras foram marcadas por arma/vista; dinamite e meteoro
usam o centro do corpo sólido, excluindo pavio/chama; cactos usam seu centro.

O tamanho de exibição está separado dos recortes, em `worldSize`, medido em
unidades do jogo (o personagem tem aproximadamente 60 de altura):

| Arma | Extensão visual máxima |
| --- | ---: |
| Revólver | 16 |
| Serrada | 23 |
| Dinamite | 16 |
| Cacto | 18 |
| Chicote, incluindo extensão | 24 |
| Chuva de Balas | 21 |
| Meteoro, incluindo chama | 28 |
| Canhão solar | 26 |

O antigo multiplicador fixo por pixel de origem produzia armas grandes demais.
Agora cada arma divide seu tamanho visual por uma referência única: a maior
extensão entre os oito recortes sem margens. As oito direções compartilham
essa conversão, preservando proporções e encurtamento nas diagonais. Não há
normalização pela largura de cada vista. Dobrar a resolução da fonte produz
as mesmas dimensões finais e os mesmos pivôs no jogo.

`draw()` não aplica escala de apresentação. A seleção chama o mesmo desenho
de personagem e arma dentro de um único `ctx.scale()` de 1 ou 2, já existente
em `drawCharacterPreview()`. A investigação não encontrou duplicação dessa
transformação. Recuo e ativação deslocam a arma, sem mudar seu tamanho. O cabo
continua ancorado à mão; a posição do clarão usa a transformação arredondada
do recorte desenhado. As origens físicas dos projéteis continuam no combate.

O Canvas recebe destinos inteiros e `imageSmoothingEnabled=false`, sem rotação
ou espelhamento adicional. São direções, nunca quadros de uma sequência.

`js/weapon_sprites.js` reutiliza `createAtlasHeroSprite()`, agora com caminho
base e nomes de imagens configuráveis. As URLs derivam do script e preservam
a revisão, funcionando em file:// e HTTP. Arte nova e corpos derivados só
entram juntos após todas as imagens carregarem nas dimensões esperadas;
loading/erro restauram as armas e corpos anteriores.

Revólver, serrada, Chuva de Balas, solar e laço usam o ângulo real registrado
no combate, o ponto de montagem da mão existente e histerese de seis graus
nas fronteiras entre vistas. O cache de direção é visual, em WeakMap, fora
das entidades do jogo. Armas apontando para cima são desenhadas antes do corpo;
as demais vêm depois. O recuo responde aos temporizadores reais. Há um único
clarão, na boca medida do cano; o desenho antigo de arma/clarão é suprimido.
Cartuchos, impactos, energia, partículas e descargas permanecem complementares.
O chicote avança e pulsa durante a ativação real; as correntes mantêm os alvos
e os pontos de origem existentes.

Nopal e Rosa usam `body.png` com uma camada nativa adicional `hands.png`, que
restaura mão, antebraço e pixels anatômicos removidos pela separação antiga.
O cano e o clarão antigos não são redesenhados integralmente. A mão e a arma
compartilham o apoio do quadro original; o braço procedural não substitui
o membro nativo. A camada da mão vem antes ou depois do corpo conforme a mira.
Os quadros de ataque ainda conservam a prioridade de tiro do Nopal.

Os dois nomes de derivados abaixo foram mantidos por compatibilidade com o
carregador, mas agora contêm cópias completas dos originais, sem apagar pixels:

- `assets/characters/nopal/walk_weaponless.png`
- `assets/characters/iris/weaponless.png`

As antigas máscaras por cor também apagavam contornos e membros, e foram
removidas. Na caminhada do Nopal e nas poses da Íris, a arma fundida à arte
é preservada; não se sobrepõe outra cópia da mesma arma. A troca para as ações
em camadas do Nopal continua usando o novo revólver. Outras armas adquiridas
usam a mão oposta quando a arma inicial já está incorporada ao quadro.
Para substituir integralmente a arma nas duas folhas achatadas, serão
necessárias versões sem arma/camadas separadas. O fallback completo atual
preserva os membros e as oito vistas, sem alterar o combate. Bento
mantém a dinamite incorporada ao gesto; a nova dinamite aparece apenas no
projétil arremessado. Cacto e meteoro aparecem somente nos objetos orbitais e
na queda, evitando cópias extras na mão.

`WeaponVisuals.projectile()` mantém o arco de altura da bomba e usa a velocidade
para orientar a imagem, com faísca de pavio. Os cactos acompanham a tangente
das órbitas existentes. O meteoro usa a direção de sua trajetória visual;
a chama já está na imagem, substituindo a chama procedural anterior. Avisos,
explosões e ondas de impacto permanecem. Balas e energia solar continuam no
renderizador de projéteis, pois a folha contém armas, não esses projéteis.

## Verificações

- Regenerar: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/build_weapon_atlas.ps1`.
- Restaurar anatomia sem recalcular armas: `powershell -NoProfile -ExecutionPolicy Bypass -File tools/build_character_limbs.ps1`.
- `powershell -NoProfile -ExecutionPolicy Bypass -File tools/check_character_limbs.ps1`:
  igualdade de todos os pixels dos dois originais de caminhada, 64 recortes,
  âncoras e preservação de cabeça/pernas/solas em 32 poses em camadas.
- `node tools/check_weapon_sprites.cjs`: hash/alpha, 64 recortes/pivôs,
  direções/histerese, destinos inteiros, ausência de segunda rotação, fallback,
  tamanhos em unidades do jogo, conversão comum às oito vistas, invariância ao
  dobrar a resolução de origem, empunhadura/clarão alinhados aos pixels finais,
  comparação de 180 quadros com as oito armas normais/evoluídas entre imagens
  carregadas e fallback, e desenho sem mutações do jogo.
- `node tools/check_weapon_browser.cjs 9228`: Chrome iniciado com depuração
  remota nessa porta; entradas file:// da raiz e redirecionamento, HTTP,
  quatro personagens × oito armas × oito direções (256 casos), disparos reais,
  movimento, trocas, comparação de tamanho entre repouso/ataque e apresentação
  1x/2x, seleção real dos quatro personagens, origens físicas dos projéteis,
  ausência de camadas antigas de arma, erros de console/rede
  e capturas `tools/weapons-*.generated.png`. A API de teste é adicionada apenas
  pelo servidor temporário, no fechamento da função do jogo.
- Passaram também verificações existentes de personagens, XP, elementos,
  baús, chefes e regressão geral de combate.

## Limitações visuais e teste manual

As vistas geradas têm diferenças de proporção e pose; o encaixe aproxima
oito ângulos, sem inventar posições intermediárias. As duas folhas achatadas
mantêm suas armas autorais no fallback completo, pois não têm camadas
independentes. Não foram medidos FPS com hordas nem uso prolongado em celular.

Abra `index.html`, atualize com Ctrl+F5, escolha um personagem e caminhe com
WASD/setas. Os ataques são automáticos. Adquira outras armas nas melhorias
para conferir as trocas e observe os avisos do meteoro, órbitas e projéteis.
