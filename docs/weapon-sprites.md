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

Os quatro personagens agora usam quadros completos com armas incorporadas. O atlas de armas carrega somente a folha compartilhada de armas, preservada para projéteis, habilidades e armas adquiridas. Durante o ataque incorporado, a arma e o clarão sobrepostos são suprimidos. Fora dele, uma arma adquirida diferente da inicial pode aparecer na mão livre.

Detalhes da substituição: [personagens completos](hero-sprites.md).

Verificação: `node tools/check_weapon_sprites.cjs`, `node tools/check_player_sprite.cjs` e `node tools/check_weapon_browser.cjs` (Chrome na porta 9227).
