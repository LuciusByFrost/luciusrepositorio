# Carregamento dos personagens

A entrada é `index.html` na raiz de `luciusbyfroty`. O arquivo histórico
`luciusrepositorio/index.html` redireciona para ela, preservando query e hash.
O navegador do usuário não expôs sua aba/endereço durante a inspeção; ambas
as entradas são verificadas em Chrome por HTTP e arquivo local.

O caminho efetivo é:

`index.html` → `js/hero_sprite.js` → `assets/characters/<id>/atlas.js` +
`js/<id>_sprite.js` → `js/player_sprite.js` (`CactusHero.draw`) →
`createDirectionalHeroSprite.draw` → PNG normalizado indicado em `atlas.images`.

`js/main.js` chama esse mesmo caminho na seleção e na partida. Cada personagem
usa suas próprias folhas completas, sem sobrepor o corpo/braços antigos.
Não há PNG incorporado em base64 nos módulos de produção.

## Origem e arquivos efetivamente desenhados

Antes, os quatro módulos requisitavam `walk_normalized.png` e
`attack_normalized.png`, com a revisão fixa `?v=attack-zip-2`. Trocar a folha de
origem não alterava esses endereços. Falhas de carregamento também permitiam
desenhar a arte procedural antiga silenciosamente.

Agora, em `assets/characters/<id>/`:

| Personagem / pasta | Originais usados na geração | Caminhada carregada | Ataque carregado |
| --- | --- | --- | --- |
| Nopal / `nopal` | `nopal_walk.png` 1086×1448; `nopal_attack.png` 887×1774 | `walk_normalized.a4fb4440c330.png` | `attack_normalized.0003ac273af9.png` |
| Rosa / `rosa` | `rosa_walk.png` 1254×1254; `rosa_attack.png` 887×1774 | `walk_normalized.9ad7d5bb0cbc.png` | `attack_normalized.446e4ea69dd3.png` |
| Bento / `bento` | `bento_walk.png` 1269×1240; `bento_attack.png` 887×1774 | `walk_normalized.03e876f08190.png` | `attack_normalized.ee7eeb309c31.png` |
| Íris / `iris` | `iris_walk.png` 1287×1222; `iris_attack.png` 887×1774 | `walk_normalized.70fa75440cd0.png` | `attack_normalized.b2fe103f0428.png` |

As caminhadas coincidem por SHA-256 com os arquivos de Downloads. Os ataques
coincidem com o ZIP da raiz; os ataques avulsos mais antigos em Downloads são
diferentes e foram preservados fora do projeto. Os oito originais corretos
já estavam instalados; a correção afeta a geração, as URLs e o fallback,
sem inventar outra arte para os personagens.

## Geração, cache e diagnóstico

`powershell -NoProfile -ExecutionPolicy Bypass -File tools/build_hero_atlases.ps1`
mede novamente os 48 quadros de caminhada (6×8) e 32 de ataque (4×8), ajusta
margens e âncoras individuais, e grava oito PNGs com SHA-256 no nome e os quatro
`atlas.js`. Origem, dimensões reais, hash original e hash do PNG gerado ficam nos
metadados. A escala corporal e os pés têm apoio comum em cada personagem.

Ao finalizar, o gerador chama `node tools/version_game_assets.cjs`, que atualiza
as revisões dos scripts e estilos no HTML principal e na prévia conforme seus
bytes atuais. Alterações manuais em scripts exigem executar esse comando.

`NopalSprite.status()` e os equivalentes retornam URLs efetivas, dimensões,
origem, hashes e erros de cada folha. Erros mostram `console.error` com URL e
dimensão esperada. A chegada de outra imagem não apaga o erro da folha que
falhou. Durante carregamento/erro aparece um marcador, sem desenhar o corpo
procedural antigo nem seus braços/armas por cima do marcador.

O código de armas, projéteis, mãos e efeitos compartilhados foi preservado.
As oito imagens normalizadas de nome fixo são removidas após conferir que
nenhum carregador ou atlas ativo ainda depende delas. Os PNGs de origem continuam
necessários para reconstrução e comparação visual.

## Evidências

- `node tools/check_sprite_loading.cjs`: cache, URLs, erro persistente, dimensões,
  diagnóstico, recuperação e ausência de corpo antigo em caso de falha.
- `node tools/check_hero_sprites.cjs`: hashes dos oito originais e oito PNGs
  carregados, 320 recortes, margens, escala, pés, oito direções e transições.
- `tools/check_heroes_browser.cjs`: Chrome com cache desativado e recarregamento
  completo; seleção, partidas dos quatro personagens e as duas entradas.
- [Origem × renderização](../tools/heroes-source-comparison.generated.png): cada
  personagem, caminhada e ataque, lado a lado nas oito direções. Os recortes
  originais aparecem à esquerda e o renderizador real à direita.
- `tools/hero-loading.generated.json`: entrada, scripts, URLs e hashes das oito
  imagens que chegaram a `drawImage`, sem depender apenas do nome da origem.
- `tools/heroes-selection.generated.png`, `tools/heroes-<id>-game.generated.png`
  e `tools/heroes-<id>-attack.generated.png`: capturas da seleção e partida.

Veja [integração e testes](hero-sprites.md).
