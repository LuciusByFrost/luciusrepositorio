# Correção dos membros após a integração das armas

Os originais inspecionados possuem silhuetas completas. Não foi identificado
um quadro original com braço, perna, bota, chapéu ou cauda cortado que exigisse
troca por outra direção. As pernas sobrepostas em poses laterais pertencem
à própria pose; não se deve inventar outra perna para torná-las simétricas.

## Causas confirmadas

1. `tools/build_weapon_atlas.ps1` apagava pixels em retângulos por direção,
   classificando cores como arma ou corpo. Mãos, calças, botas e contornos
   escuros de Nopal/Íris também eram removidos. Os derivados danificados eram
   `assets/characters/nopal/walk_weaponless.png` e
   `assets/characters/iris/weaponless.png`, cada um com 32 quadros.
2. `body.png` de Nopal/Rosa não é uma figura completa isoladamente: a camada
   `arms.png` também contém mão, antebraço e, em algumas poses de ataque, pixels
   próximos do rosto. Suprimir a camada inteira para trocar o revólver/serrada
   deixava lacunas. O substituto procedural também não partia da mão nativa.
3. O braço procedural era omitido quando a arma apontava para cima. Agora as
   camadas nativas são restauradas na ordem apropriada, inclusive por trás do
   corpo. O fallback procedural também desenha a extensão no passe traseiro.

Os `clearRect()` encontrados limpam apenas canvases auxiliares de arma, e
usam `save/restore` nas transformações. Não foi encontrado recorte destrutivo
do personagem via `globalCompositeOperation`. O clip dos cartões de seleção
fica isolado em `save/restore`; não é responsável pelos buracos nas imagens.

## Correção

`tools/build_character_limbs.ps1` é chamado pelo normalizador de armas e pode
ser executado sozinho. As duas caminhadas são copiadas integralmente dos
originais e os derivados não recebem mais máscaras por cor. Os 64 recortes
mantêm suas dimensões, deslocamentos e base dos pés; não se corta a sola para
centralizar um quadro.

O mesmo construtor cria `hands.png` nas pastas existentes de Nopal e Rosa,
restaurando as partes anatômicas das camadas antigas. O compositor usa a mão
nativa como apoio e coloca essa camada à frente/atrás do corpo conforme a
direção. Arma e corpo compartilham a escala da apresentação; os tamanhos de
arma em unidades do jogo não foram alterados.

Nas folhas fundidas, preservar a figura completa também preserva sua arma.
O renderizador suprime outra cópia dessa mesma arma. Nopal continua trocando
da caminhada completa para a animação de tiro em camadas e retorna à direção
conservada. Íris mantém seu chicote incorporado e as descargas reais. Outras
armas adquiridas são apresentadas na mão oposta à arma inicial incorporada.

Para substituir a arma inicial por toda a nova arte direcional sem perda de
anatomia, faltam versões **sem arma ou com camadas independentes** destas folhas:

- `assets/characters/nopal/nopal_walk_8dir.png`: 32 quadros.
- `assets/characters/iris/iris_spritesheet.png`: 32 quadros.

Isso é uma limitação de separação de camadas, não um pedido para refazer
membros cortados nos originais. O fallback completo evita alterações
destrutivas enquanto essas versões não existem.

## Verificação

`tools/check_character_limbs.ps1` compara 1573538 pixels de cada caminhada
com o original, verifica os 64 recortes contra os espaços reais das folhas,
as âncoras, e cabeça/pernas/solas de 32 poses em camadas. Nenhum dos originais
é alterado. Os testes existentes de Nopal, Rosa, Bento e Íris também passaram.

`tools/check_weapon_browser.cjs` percorre 256 combinações de personagem/arma/
direção, mais 480 poses de repouso, quatro quadros de caminhada e fases de
ataque/recuperação nas oito direções. Usa eventos reais de combate e movimento,
confere escala 1x/2x, seleção real e entradas file:// e HTTP. As capturas
`tools/weapons-selection.generated.png` e `tools/weapons-characters.generated.png`
permitem revisar os membros completos. Não mede FPS com hordas nem substitui
teste prolongado em celular.
