# Entradas do jogo e carregamento dos sprites

A investigação encontrou duas entradas reais do jogo:

- `index.html`, na raiz: já incluía os atlas PNG e os módulos de Nopal e Rosa.
- `luciusrepositorio/index.html`: carregava cópias antigas de `js/player_sprite.js`
  e `js/main.js`, sem qualquer atlas ou módulo dos novos sprites. O README dessa
  subpasta ainda orientava a abrir essa cópia antiga.

Não foi possível identificar a URL da aba que o usuário tinha aberta pelos
argumentos dos processos do navegador. A segunda entrada antiga foi confirmada
nos arquivos e explica a divergência entre abrir as duas cópias do jogo.

Agora a entrada da subpasta encaminha para `../index.html`, preservando os
parâmetros e o fragmento. Seu HTML anterior foi preservado em
`tools/legacy-game-backup/pre-sprite-entrypoint.html`. Os demais arquivos dessa
cópia foram mantidos. A entrada principal usa uma revisão nova dos scripts,
metadados e URLs dos PNGs para invalidar caches da integração anterior.

## Imagens encontradas

Os dois originais estão presentes, ambos com 1261 × 1247 pixels e alpha real:

- Nopal: `assets/characters/nopal/Nopal, pistoleiro cacto em pixel art.png`.
- Rosa: `assets/characters/rosa/spritesheet.png`.

Não foi encontrado `spritesheet.png.png`. O nome original do Nopal é diferente
de `spritesheet.png`, mas está registrado corretamente nos metadados e no
normalizador. **Nenhum PNG está faltando.**

O jogo usa os derivados `body.png` e `arms.png` de cada personagem, ambos com
384 × 384 pixels. `atlas.js` contém os 16 recortes de 96 × 96, pivôs dos pés,
escala e hash do original. Os hashes e o alinhamento já validado foram
preservados. Não foi necessário alterar a arte ou remover cores do PNG.

Os caminhos são resolvidos a partir da URL do módulo em `js/`, chegando a
`assets/characters/nopal/` e `assets/characters/rosa/` na mesma raiz do jogo.
Isso funciona por arquivo local e por servidor local, inclusive após entrar
pelo HTML da subpasta. Se o servidor expuser somente a subpasta antiga, a
página orienta a iniciar o servidor na raiz, sem criar um ciclo de redireção.

## Fluxo de desenho confirmado

`installDetailedSprites()` chama `drawPlayerNight()` e `drawHeldWeapon()`.
`drawPlayerNight()` usa `CactusHero.draw()`, que tenta primeiro o módulo PNG
correspondente ao ID `nopal` ou `rosa`. Quando esse módulo desenha com sucesso,
o compositor retorna imediatamente. A arte procedural só é usada enquanto
as duas camadas não estiverem prontas, se falharem ou se faltarem metadados.

`drawHeldWeapon()` suprime o revólver do Nopal ou a espingarda da Rosa quando
o próprio PNG já os contém. As outras armas e os personagens Bento e Íris
mantêm seus caminhos atuais. Pixel smoothing permanece desativado, e a
animação da partida usa o relógio da simulação, inclusive na pausa.

Para diagnóstico no console, `NopalSprite.status()` e `RosaSprite.status()`
retornam o estado, as URLs resolvidas e as dimensões carregadas. Falhas e
dimensões incorretas também são registradas no console, com o caminho exato.

## Verificação sobre o jogo real

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File tools/verify_game_entrypoints.ps1
node tools/check_nopal_sprite.cjs
node tools/check_rosa_sprite.cjs
node tools/check_player_sprite.cjs
```

O primeiro comando abre o Chrome com os HTMLs reais; não gera nem injeta uma
cópia do jogo. Usa Enter/1/2 e WASD para abrir a seleção e iniciar partidas.
Registra chamadas reais dos renderizadores PNG, quadros de caminhada frontal
e de costas, e eventos reais de revólver/espingarda. Também confere que a pausa
interrompe o relógio visual. Os mesmos caminhos são verificados por `file://`
e por HTTP local, incluindo o redirecionamento da entrada antiga.

As capturas ficam em `tools/sprites-root-*.png` e
`tools/sprites-nested-*.png`. A seleção mostra os novos Nopal e Rosa ao lado
dos personagens procedurais preservados.

## Abrir a versão corrigida

Abra `C:\Users\user\Downloads\Documents\luciusbyfroty\index.html`.
Se uma aba antiga já estiver aberta, recarregue com Ctrl+F5.
