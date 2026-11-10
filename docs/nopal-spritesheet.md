# Spritesheet local do Nopal

O arquivo recebido está em `assets/characters/nopal/Nopal, pistoleiro cacto em pixel art.png`
(não havia um arquivo chamado `spritesheet.png`). O original permanece intacto:
1261 × 1247, PNG RGBA com alpha real. Seu SHA-256 está em `atlas.js` e é conferido
pelo teste. Não há remoção por cor: preto, couro, chapéu e contornos escuros são
preservados. Somente amostras com alpha ≤ 16 são descartadas como ruído quase invisível.

Os 16 recortes foram inspecionados individualmente. As margens e as posições
das solas variam: dividir a imagem simplesmente em quatro partes iguais ou
redimensionar cada silhueta separadamente causaria deslocamentos e mudanças de escala.
`tools/build_nopal_atlas.ps1` registra recortes, eixos do corpo, solas e ombros
por quadro. Todos usam a mesma escala 0,225, sem interpolação, células de 96 × 96
e âncora dos pés em (40,72). No mundo, a sola continua em y=22 em relação à origem
do jogador; o personagem tem aproximadamente 57–61 pixels de altura.

Arquivos derivados em `assets/characters/nopal/`:

- `atlas.png`: os 16 quadros completos alinhados, para inspeção.
- `body.png` e `arms.png`: camadas complementares do corpo e braço/revólver.
- `atlas.js`: metadados em script clássico local, sem `fetch` nem exigência de servidor.

O braço é separado por máscaras de coordenadas, preservando a aba do chapéu
e a chama do disparo. A camada gira em um Canvas reutilizado com resolução
nativa, a partir do ombro. Depois é composta em coordenadas inteiras, com
`imageSmoothingEnabled=false`. O espelhamento só aplica escala horizontal -1.
O revólver e o clarão já fazem parte da imagem; o desenho procedural dessas
duas peças é suprimido somente quando o atlas do Nopal está disponível.
As outras armas continuam usando o compositor de armas existente, com o
revólver do PNG removido da camada do corpo.

`js/nopal_sprite.js` carrega as duas camadas locais e só as ativa depois de ambas
terem carregado com as dimensões esperadas. Durante o carregamento, na falha de
qualquer imagem ou na ausência dos metadados, `CactusHero` mantém o Nopal antigo.
Rosa, Bento e Íris continuam com sua arte procedural atual.

Repouso usa a primeira linha, caminhada frontal a segunda e caminhada de costas
a quarta. `visualBack` conserva a última direção vertical ao parar ou mover na
horizontal. A caminhada usa `visualStride`, o mesmo relógio por distância que o
jogo já tinha. Ao parar de costas, o quadro é estático porque não existe repouso
de costas no original. O evento real de `showWeaponAttack()` registra
`nopalShotAt` e `nopalShotAngle` somente para o revólver do Nopal e somente após
encontrar um alvo. Ele aciona mira, disparo, recuo e recuperação durante 0,32 s.
Ataques de outras armas não reiniciam essa sequência. Um novo disparo pode
reiniciá-la quando a velocidade de ataque é muito alta.

Toda animação da partida usa `game.time` e congela em pausa, melhorias, quiz e
derrota. O desenho não altera entidades, RNG ou combate. A origem, hitbox de
raio 15, velocidade 205, atributos, armas, projéteis e dano permanecem iguais.

## Verificação e prévia

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/build_nopal_atlas.ps1
node tools/check_nopal_sprite.cjs
node tools/check_player_sprite.cjs
node tools/check_character_art.cjs
node tools/check_roster_bosses.cjs
node tools/check_enemy_sprites.cjs
node tools/generate_nopal_preview.cjs
```

Abra `tools/nopal-preview.generated.html` diretamente no navegador. Espaço
alterna animação/pausa; `?angles=1` exibe mira, outras armas e o elenco;
`?fallback=1` força a falha dos PNGs. O preview usa o código real do jogo e
um disparo real. Sua validação de pixels verifica as 16 solas em y=71 e
margens livres, e a pausa verifica o relógio da simulação.

`tools/capture_nopal_preview.ps1` usa o Chrome instalado no Windows para gerar
`tools/nopal-frames.png`, `tools/nopal-angles.png` e `tools/nopal-fallback.png`,
verificando `data-nopal-check="pass"` nas três páginas. Essas capturas foram
inspecionadas visualmente em escala real e 3×. Os testes de regressão comparam
900 quadros de combate e mais 120 quadros com as oito armas sobrepostas,
incluindo evoluções; os três novos campos visuais são excluídos da comparação
de mecânicas, assim como os metadados visuais anteriores.

## Limitações da arte

- Não há tiro nem repouso animado de costas. O disparo usa a terceira linha
  frontal, com espelhamento e braço orientado à mira; ao terminar, retorna à
  direção de caminhada. O repouso de costas mantém um quadro da quarta linha.
- A origem gerada por IA já contém variações de pose e detalhes entre quadros.
  O atlas corrige âncoras, escala e recortes, preservando essas diferenças da arte.
- As verificações locais não medem FPS com hordas nem substituem playtest
  prolongado em dispositivos móveis.
