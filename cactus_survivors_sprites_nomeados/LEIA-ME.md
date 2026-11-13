# Cactus Survivors — Sprites nomeados

Este pacote contém 9 spritesheets de novos conceitos visuais: 7 inimigos e 2 chefes. São artes de conceito geradas nesta conversa, não sprites oficialmente integrados no jogo.

## Como usar

1. Extraia o ZIP na RAIZ do repositório (a mesma pasta de `index.html`). A estrutura `assets/enemies/` e `assets/bosses/` será criada. Nenhum arquivo original é sobrescrito.
2. Abra o Codex na raiz do repositório, forneça o prompt `PROMPT_CODEX.txt` e peça para ele integrar as imagens.
3. Confira visualmente todos os frames, pois imagens geradas podem ter pequenos artefatos, poses inadequadas e necessidade de limpeza/alinhamento.

Cada pasta possui:
- `spritesheet.png`: 8 direções x 8 colunas de frames, 1280 x 1280, frames 160 x 160;
- `walk.png`: 8 linhas x 4 colunas, 640 x 1280;
- `attack.png`: 8 linhas x 4 colunas, 640 x 1280;
- `atlas.json`: metadados para o Codex/loader.

Direções, por linha (0-7): baixo, baixo-esquerda, esquerda, cima-esquerda, cima, cima-direita, direita, baixo-direita. Os 4 primeiros quadros são caminhada, os 4 últimos ataque.

Importante: o repositório atual tem seis tipos comuns (`bandit`, `runner`, `gunslinger`, `brute`, `gravedigger`, `armored`) e quatro chefes (`boss`, `iron_colonel`, `storm_widow`, `grave_keeper`). Os NOVE novos conceitos visuais NÃO são versões fiéis dos dez inimigos existentes, portanto não renomeie ou sobrescreva os IDs existentes sem decidir um mapeamento e adaptar código/ataques.
