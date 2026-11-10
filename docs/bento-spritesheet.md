# Bento: ações e caminhada em oito direções

Foram encontrados e preservados estes originais:

| Arquivo | Dimensões | Organização |
| --- | --- | --- |
| `assets/characters/bento/spritesheet (2).png` | 1261 × 1247 | 4 colunas × 4 linhas de ações |
| `assets/characters/bento/walk_8directions.png` | 887 × 1774 | 4 colunas × 8 direções |

O arquivo de ações veio com o sufixo `(2)`; não foi necessário renomeá-lo.
Ambos são PNG RGBA com alpha real. Não há imagem na pasta
`assets/characters/iris`, portanto a aparência atual da Íris foi mantida.

## Normalização

`tools/build_bento_atlas.ps1` registra os 48 recortes e âncoras inspecionados,
incluindo cauda, chapéu, bolsa e braços estendidos. Gera:

- `assets/characters/bento/actions.png`: 384 × 384, 16 quadros.
- `assets/characters/bento/walk.png`: 384 × 768, 32 quadros.
- `assets/characters/bento/atlas.js`: recortes, pivôs, escalas, dimensões e hashes.

As células têm 96 × 96 pixels, com pivô em (40,72), e a sola visível é fixada
na linha 71. Cada folha tem uma escala única, sem redimensionar poses
individualmente: ações 0,225 e caminhada 0,315. A diferença compensa a resolução
dos originais e mantém a altura em torno de 60 pixels. A amostragem é por
vizinho mais próximo, sem deformação, com correção vertical final da sola.
Só pixels com alpha ≤ 16 são descartados; cores escuras não são removidas.

O dinamite já solto que aparece na terceira linha, segundo quadro, é removido
do atlas de ações por coordenadas. O projétil verdadeiro continua no desenho
existente do jogo, evitando uma segunda bomba que voaria numa direção fixa.
Os PNGs originais e os atlas anteriores do Nopal/Rosa não são alterados.

## Direção, repouso e lançamento

`js/bento_sprite.js` reutiliza `createAtlasHeroSprite()` para carregamento local,
validação de dimensões, status e fallback. O compositor compartilhado foi
estendido para aceitar folhas de tamanhos distintos e poses próprias.
Se alguma folha ainda não estiver pronta ou falhar, a arte procedural do Bento
continua disponível. Nopal e Rosa mantêm seus módulos e artes existentes.

O movimento registra `visualDirection` somente para Bento:

| Linha | Direção |
| --- | --- |
| 1 | Baixo |
| 2 | Baixo/esquerda |
| 3 | Esquerda |
| 4 | Cima/esquerda |
| 5 | Cima |
| 6 | Cima/direita |
| 7 | Direita |
| 8 | Baixo/direita |

A direção vem do vetor de entrada, inclusive do controle virtual, e não da
mira. Todas as oito vistas são autorais: a caminhada não usa espelhamento.
O avanço dos quatro quadros usa `visualStride`, por distância de caminhada.
Ao parar, conserva a última direção e fixa o primeiro quadro daquela linha,
sem usar o tempo para continuar caminhando. Como a folha direcional não inclui
repousos próprios, esses quadros ficam estáticos. Na seleção e antes do primeiro
movimento, Bento usa a primeira linha animada da folha de ações.

A preparação usa os últimos 0,12 s da recarga real. Quando `fireWeapon()`
realmente cria o projétil, registra `bentoThrowAt` e o mesmo ângulo `a` utilizado
na velocidade da bomba, incluindo o sorteio original quando não há alvo.
A soltura usa imediatamente o quadro 9; finalização e recuperação vêm em
seguida, por 0,34 s no total. Não há atraso de criação do projétil para acompanhar
uma animação. Durante esse gesto, a arte frontal se orienta horizontalmente
pelo ângulo do lançamento; ao terminar, volta à direção de movimento conservada.

O desenho procedural da dinamite na mão é suprimido quando a nova arte está
ativa. Outras armas adquiridas continuam no compositor existente e usam a
folha direcional, cujas mãos não seguram uma bomba. Atributos, hitbox circular
de raio 15, velocidade 205, dano 70, recarga 4,2 s, trajetória, RNG e explosão
permanecem iguais. Todo avanço usa a simulação e congela em pausa, melhorias,
quiz e derrota; o desenho não altera entidades e mantém smoothing desativado.

## Verificações e inspeção no navegador

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/build_bento_atlas.ps1
node tools/check_bento_sprite.cjs
node tools/check_nopal_sprite.cjs
node tools/check_rosa_sprite.cjs
node tools/check_player_sprite.cjs
node tools/check_roster_bosses.cjs
node tools/check_character_art.cjs
powershell -NoProfile -ExecutionPolicy Bypass -File tools/verify_game_entrypoints.ps1
```

O teste do Bento confere hashes, 48 recortes/solas, oito direções, repouso
estático, loading/fallback, ataque com e sem alvo, outras armas, pausa e ausência
de mutações no desenho. Compara também 180 quadros com as oito armas, normais
e evoluídas, contra a mesma lógica anterior sem os novos campos visuais.
A regressão existente compara outros 900 quadros e verifica as oito armas.

A verificação do Chrome usa os `index.html` reais, por arquivo local e HTTP,
sem criar uma cópia do jogo. Abre a seleção, inicia partidas pelos controles,
anda nas oito direções e verifica que cada repouso conserva direção e quadro.
Confere preparação pela recarga e os três quadros após o lançamento real.
Nopal e Rosa também são conferidos novamente. Capturas:

- `tools/sprites-root-selection.png`: elenco com Bento novo e Íris atual.
- `tools/bento-directions.png`: montagem dos quadros normalizados das oito
  caminhadas, oito repousos e quatro estados do arremesso. O projétil real não
  faz parte do atlas e aparece nas capturas da partida.
- `tools/sprites-root-bento-attack.png`: partida com a nova arte e dinamite.

## Arquivos alterados nesta integração

- Jogo: `index.html`, `js/main.js`, `js/player_sprite.js`, `js/nopal_sprite.js`
  e novo `js/bento_sprite.js`.
- Assets novos: `assets/characters/bento/actions.png`, `walk.png`, `atlas.js`.
- Ferramentas novas: `tools/build_bento_atlas.ps1`, `tools/check_bento_sprite.cjs`,
  `tools/make_bento_contact_sheet.ps1`.
- Ferramentas ajustadas: `tools/inspect_character_sheet.ps1`, `game_fixture.cjs`,
  `check_player_sprite.cjs`, `check_game_entrypoints.cjs`, `verify_game_entrypoints.ps1`
  e `.gitignore`.
- Documentação: `README.md` e este documento. Capturas de verificação em `tools/`.

Abra `C:\Users\user\Downloads\Documents\luciusbyfroty\index.html` e use **Ctrl+F5**
se a aba já estava aberta. A entrada antiga da subpasta continua encaminhando
para a raiz. FPS com hordas e testes prolongados em celular não foram medidos.

Limitações da arte: o arremesso foi fornecido em uma vista frontal/diagonal,
então esse gesto usa essa vista e seu espelhamento; o projétil mantém o ângulo
exato da lógica original. As oito vistas são usadas integralmente na caminhada
e nos quadros parados correspondentes.
