# Rosa: pistoleira réptil do deserto

`assets/characters/rosa/spritesheet.png` é o original recebido: **1261 × 1247**,
PNG RGBA com transparência real. A inspeção encontrou 1.069.701 pixels totalmente
transparentes, 501.146 com alpha parcial e 1.620 opacos. O original é preservado;
seu SHA-256 fica nos metadados e é verificado nos testes.

A integração reutiliza o normalizador e o compositor do Nopal. Os recortes e
as máscaras são próprios da Rosa: sua cauda, o casaco e os dois canos da
espingarda exigem limites diferentes. Os 16 quadros usam escala fixa **0,225**,
sem interpolação, em células de 96 × 96. A sola visível é alinhada na linha 71
de cada célula (pivô dos pés em 40,72), sem redimensionar cada pose. Um ajuste
de um pixel na vertical compensa solas finas que caem entre as amostras.
Esse ajuste também desloca o pivô da arma e fica registrado em `atlas.js`.

Arquivos derivados em `assets/characters/rosa/`:

- `atlas.png`: todos os quadros completos alinhados, para inspeção.
- `body.png`: corpo sem a arma da folha.
- `arms.png`: espingarda e mãos junto à arma, para rotação a partir da empunhadura.
- `atlas.js`: recortes, âncoras, máscaras poligonais, escala e hash do original.

Só pixels com alpha ≤ 16 são descartados como ruído quase invisível. Não há
chroma key: contornos e roupas escuras são preservados. Todos os canvases de
desenho usam `imageSmoothingEnabled=false`; o atlas é composto em tamanho
nativo, em coordenadas inteiras. A arma gira numa superfície reutilizada antes
da composição final. A esquerda usa espelhamento horizontal sem deformação.

`createAtlasHeroSprite()` em `js/nopal_sprite.js` agora é compartilhado; o
pequeno `js/rosa_sprite.js` configura a Rosa, seus PNGs e a espingarda. O Nopal
mantém a configuração e os assets anteriores. Bento e Íris continuam com arte
procedural. As duas camadas da Rosa precisam carregar com as dimensões corretas
antes de substituir sua arte. Durante o carregamento ou na falha de qualquer
imagem, a Rosa procedural permanece como fallback independente do Nopal.

O disparo real da espingarda registra `rosaShotAt` e `rosaShotAngle` em
`showWeaponAttack()`, uma vez por tiro, antes do laço dos cinco projéteis.
Sem alvo não há evento. O temporizador genérico de ataque, o revólver e outras
armas não acionam a terceira linha da Rosa. O compositor procedural da
espingarda e seu clarão são suprimidos quando a nova arte está pronta, evitando
uma segunda arma. Ao equipar outra arma, somente o corpo do PNG é usado e a
arma adquirida continua no compositor existente.

Repouso usa a primeira linha; caminhada frontal, a segunda; mira/disparo/recuo/
recuperação, a terceira; caminhada de costas, a quarta. As animações da partida
usam o tempo de simulação ou a distância de caminhada e congelam em pausa,
melhorias, quiz e derrota. Hitbox, origem, velocidade, dano, espalhamento,
quantidade de projéteis, recarga e regras de aquisição de armas não mudam.

## Verificação reproduzível

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/inspect_character_sheet.ps1 -Source assets/characters/rosa/spritesheet.png
powershell -NoProfile -ExecutionPolicy Bypass -File tools/build_nopal_atlas.ps1 -Character rosa
node tools/check_rosa_sprite.cjs
node tools/check_nopal_sprite.cjs
node tools/check_player_sprite.cjs
node tools/check_roster_bosses.cjs
node tools/check_character_art.cjs
node tools/generate_nopal_preview.cjs --rosa
powershell -NoProfile -ExecutionPolicy Bypass -File tools/capture_nopal_preview.ps1 -Character rosa
```

O nome antigo das ferramentas foi mantido por compatibilidade. Sem o argumento
de personagem, continuam preparando e verificando o Nopal.

Abra `tools/rosa-preview.generated.html` para a galeria em tamanho real e 3×.
Espaço alterna animação/pausa. `?angles=1` mostra direções, armas e o elenco;
`?fallback=1` força somente a falha dos PNGs da Rosa; `?gameplay=1` mostra a
partida com um alvo e tiro real. Nesse último modo, Espaço também inicia a
simulação real e WASD/setas usam os controles existentes.

As capturas `tools/rosa-frames.png`, `rosa-angles.png`, `rosa-fallback.png` e
`rosa-gameplay.png` foram inspecionadas no Chrome. A validação no navegador
confere as 16 solas e margens livres. Os testes cobrem tiro real/ausência de
alvo, troca de armas, fallback independente, pausa, desenho sem mutações e
equivalência do combate da Rosa com as oito armas por 180 quadros, normal e
evoluído. As regressões existentes também comparam 900 quadros de combate.

## Limitações

A folha não inclui tiro nem repouso animado de costas. Durante o tiro, a Rosa
usa a pose frontal, com arma orientada para o alvo; ao terminar, retorna à
direção anterior. O repouso de costas mantém um quadro da quarta linha.
Pequenas diferenças de detalhes entre poses pertencem à imagem original.
FPS com hordas e playtest prolongado em celulares não foram medidos.
