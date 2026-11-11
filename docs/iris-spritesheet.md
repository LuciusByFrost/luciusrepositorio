# Íris do Trovão: caminhada em oito direções

Identificador: `iris`; arma inicial: `lasso`. O original permanece intacto em
`assets/characters/iris/iris_spritesheet.png`: PNG 887 × 1774, com 947009 pixels
totalmente transparentes e 626242 com alpha parcial.

`assets/characters/iris/atlas.js` registra 32 recortes e âncoras individuais dos
pés, hash do original, dimensões esperadas e escala única 0,30 (altura visual
aproximada de 56–63 pixels). Não há config.json no sistema de personagens.
Os limites verticais inspecionados são 0, 247, 456, 668, 889, 1106, 1325, 1552
e 1774: dividir a altura igualmente cortaria a primeira linha e contaminaria
alguns quadros seguintes. Os recortes incluem os pixels com alpha acima de 16;
o desenho preserva o alpha original, inclusive dentro das margens recortadas.
A faixa inferior dos pés define o centro horizontal individual; a base de
todos os quadros fica em y=22 relativo ao jogador. Chapéu, cauda e chicote
permanecem visuais; o raio de colisão continua 15.

As linhas são baixo, baixo/esquerda, esquerda, cima/esquerda, cima,
cima/direita, direita e baixo/direita. Nenhuma vista é espelhada. A caminhada
avança quatro quadros a 8 fps por `dt` da simulação, independente da velocidade
do personagem. Ao parar, fixa a coluna zero da última direção e reinicia o
relógio de caminhada. Pausa congela a simulação. A seleção usa a vista de baixo,
coluna zero. O Canvas usa coordenadas inteiras e suavização desativada.

`js/iris_sprite.js` reutiliza o carregador compartilhado com validação das
dimensões. O fallback procedural só aparece durante loading ou erro. A folha
nunca representa ataque: o chicote e bracelete vêm do PNG; a arma procedural
na mão é suprimida para não duplicá-los. Descargas, impactos, alvos, atributos,
outras armas, sinergias e progressão mantêm seus sistemas existentes.

Para regenerar metadados: `powershell -NoProfile -ExecutionPolicy Bypass -File
tools/build_iris_atlas.ps1`. Verificação: `node tools/check_iris_sprite.cjs`.
O teste compara também 180 quadros determinísticos da Íris com todas as armas,
normais/evoluídas, removendo apenas os campos visuais na comparação.

`node tools/check_iris_browser.cjs 9228` usa Chrome já iniciado com depuração
remota nessa porta. Testa a entrada real por file://, retrato, seleção, início,
os 32 quadros em movimento, oito repousos estáveis, ataque real e pausa;
confere erros de console/runtime/rede e gera capturas `tools/iris-*.generated.png`.
Inspeção automatizada não mede FPS com hordas, uso prolongado ou celular.

Abra `index.html`, atualize com Ctrl+F5, pressione Enter, 4 e Enter. Caminhe
com WASD/setas, combinando duas teclas para as diagonais. Solte para conferir
o repouso; os ataques são automáticos. ESC pausa e retoma.
