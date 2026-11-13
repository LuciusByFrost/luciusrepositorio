# Novos sprites dos quatro personagens

> Estado atual: os ataques foram identificados pelo ZIP aprovado; a aprovação
> das caminhadas existentes ainda não pode ser comprovada neste workspace.
> Consulte [o relatório de integração](character-sprite-integration.md) para
> arquivos, hashes, validações atuais e pendências. As verificações de navegador
> descritas abaixo são registros anteriores, não resultados desta sessão.

As caminhadas foram encontradas em `C:/Users/user/Downloads`. Os quatro ataques foram conferidos novamente com `sprites_ataque_personagens.zip`, na raiz do projeto, extraído em uma pasta temporária. Os hashes SHA-256 dos quatro PNGs do ZIP são idênticos aos das folhas já instaladas. Os arquivos foram copiados para os caminhos ativos e os ataques normalizados e seus recortes foram reconstruídos, preservando as caminhadas e os demais ajustes locais. Não foi criada outra árvore de personagens.

| Personagem | Caminhada de origem | Ataque de origem | Altura corporal no jogo |
| --- | --- | --- | ---: |
| Nopal | `assets/characters/nopal/nopal_walk.png` — 1086×1448 | `assets/characters/nopal/nopal_attack.png` — 887×1774 | 60 |
| Rosa | `assets/characters/rosa/rosa_walk.png` — 1254×1254 | `assets/characters/rosa/rosa_attack.png` — 887×1774 | 62 |
| Bento | `assets/characters/bento/bento_walk.png` — 1269×1240 | `assets/characters/bento/bento_attack.png` — 887×1774 | 60 |
| Íris | `assets/characters/iris/iris_walk.png` — 1287×1222 | `assets/characters/iris/iris_attack.png` — 887×1774 | 64 |

## Recortes e normalização

`tools/measure_hero_sheets.ps1` identifica componentes conexos com alpha ≥16. As caminhadas contêm 48 figuras principais; os ataques, 32. A ordenação agrupa oito linhas e ordena os componentes pelo X dentro de cada linha, sem dividir a imagem em células de origem. Faíscas e laços desconectados próximos são atribuídos ao corpo mais próximo. Ruído isolado distante fica fora dos recortes. O alpha original é conservado dentro de cada recorte, incluindo a margem de dois pixels; os PNGs de origem permanecem intactos.

`tools/build_hero_atlases.ps1` gera, em cada pasta:

- `walk_normalized.<hash>.png`: 768×1024, seis colunas e oito linhas.
- `attack_normalized.<hash>.png`: 512×1024, quatro colunas e oito linhas.
- `atlas.js`: formato de script clássico existente, agora versão 2, com os dois estados separados, dimensões, hashes, recortes de origem, landmarks corporais, escalas, deslocamentos e mapa das linhas.

Os campos `walk.sourceSize` e `attack.sourceSize` registram explicitamente as dimensões reais das folhas.
Os ataques usam `[887,1774]` para os quatro personagens; as caminhadas usam as dimensões da tabela acima. A reconstrução parcial dos
ataques preserva os PNGs e todos os metadados de caminhada. Os testes também
conferem o apoio e o topo corporal após escala, com tolerância de meio pixel
pelo arredondamento, e a mudança de direção de caminhada durante o ataque.

A conferência do ZIP local passou também no Chrome: quatro personagens × oito
direções, caminhada, repouso, disparo real, movimento durante o ataque, retorno
e pausa, sem erros de assets ou execução. Os PNGs normalizados reconstruídos
são idênticos aos anteriores. A pasta temporária de extração e suas cópias de
segurança foram removidas após a validação; não havia outra folha antiga de
ataque sem uso nas pastas ativas. O ZIP original foi preservado.

As células derivadas têm 128×128, apoio em (64,88) e margem mínima verificada. A altura usa chapéu/orelhas até botas; o centro da cabeça fornece o eixo horizontal estável. Cyan do laço, clarões e extensão de armas/caudas não entram no cálculo da escala. Os deslocamentos de cada quadro alinham os pés; a reamostragem é nearest-neighbor. Nenhum par de recortes de origem se sobrepõe.

## Direções inspecionadas

O mapa dos corpos, confirmado visualmente em todas as oito folhas, é `[0,1,2,3,4,5,6,7]`: baixo, baixo-esquerda, esquerda, cima-esquerda, cima, cima-direita, direita, baixo-direita. Não há linha corporal ausente nem espelhamento automático. A orientação do corpo é distinta da trajetória desenhada da arma.

O ZIP atual corrige a orientação das ações verticais: os disparos frontais apontam para baixo, os traseiros para cima, e Rosa agora tem clarão traseiro visível. A dinamite do Bento aparece abaixo das botas no lançamento frontal e acima do chapéu no traseiro; o laço da Íris também ultrapassa o corpo. Essas extensões são preservadas no recorte, mas excluídas dos landmarks corporais. Armas laterais podem estar deslocadas em relação ao eixo do corpo, sem alterar a direção do disparo.

Não há estado incompleto que exija preservar um ataque antigo como fallback. As proporções internas/volume do Nopal ainda mudam entre as duas artes: a altura e o apoio estão normalizados, mas a caminhada é mais esguia que o ataque. Há pequenas diferenças de pose e textura nas demais folhas geradas.

Para reconstruir apenas os ataques, execute `powershell -NoProfile -ExecutionPolicy Bypass -File tools/build_hero_atlases.ps1 -States attack`. Essa opção mantém as caminhadas e seus metadados existentes. O cálculo corporal exige uma largura mínima de chapéu/botas nos ataques de Nopal, Rosa e Bento para excluir canos verticais e bombas da medição; os pixels da imagem não são removidos por esse filtro.

## Estados e combate

`js/hero_sprite.js` é o carregador/compositor compartilhado. Os quatro módulos individuais selecionam os respectivos atlas. Caminhada: seis quadros a 10 fps enquanto há movimento. Repouso: coluna 0 da última direção, sem ciclar. Ataque: quatro quadros a 12,5 fps, por 0,32 s, a partir de `showWeaponAttack()` da arma inicial; a dinamite usa o ângulo efetivo do lançamento. Armas secundárias não reiniciam a animação da arma incorporada. A mira do ataque é fixada pelo evento, enquanto a direção de movimento continua sendo atualizada para o retorno.

A posição continua sendo atualizada normalmente durante o ataque. Ao terminar, o compositor consulta o movimento atual e volta à caminhada ou ao repouso. O relógio vem da simulação e congela na pausa. Durante o ataque incorporado, não se desenha outra arma ou outro clarão sobre a figura. No repouso/caminhada, a arma inicial também não é duplicada; armas adquiridas diferentes continuam disponíveis na mão livre. Projéteis, arcos elétricos no mundo, explosões e efeitos de impacto continuam ativos.

Em erro de carregamento, o navegador mostra um marcador e um erro claro no console; o corpo procedural antigo não substitui a folha ausente. Braços separados, máscaras e corpos antigos não participam do caminho normal nem do atlas de armas. O atlas compartilhado de armas foi preservado para projéteis e armas independentes.

## Verificação e prévia

- `node tools/check_hero_sprites.cjs`: 320 quadros, dimensões/recortes/hashes, corpo/apoio, estados, recuperação, combate real, movimento, pausa e desenho sem mutações.
- `node tools/check_player_sprite.cjs`: comparação com `HEAD`, 900 frames determinísticos, oito armas, dano/colisões, laço normal/evoluído, RNG, sobreposição de ataques e caches.
- `node tools/check_weapon_sprites.cjs`: 64 quadros de armas, pivôs/escala, equivalência de combate com PNGs carregados e fallback.
- `node tools/check_elements.cjs`, `check_chests.cjs`, `check_roster_bosses.cjs`, `check_enemy_sprites.cjs`, `check_enemy_xp.cjs`, `check_character_art.cjs`: regressões dos sistemas existentes.
- `powershell -NoProfile -ExecutionPolicy Bypass -File tools/verify_game_entrypoints.ps1`: Chrome, HTML e assets reais, quatro personagens × oito direções × seis quadros andando/quatro atacando, repouso, movimento durante o ataque, recuperação e pausa. O teste HTTP expõe uma API temporária somente na resposta do servidor de teste e usa passos determinísticos; o código de produção não ganha API de depuração. As entradas locais original e redirecionada também são carregadas sem instrumentação.

Abra [a prévia animada](../tools/hero-preview.html). Ela mostra os quatro personagens nas oito direções, com repouso, caminhada, ataque e transição. Espaço pausa. Captura: `tools/heroes-preview.generated.png`; seleção e partidas: `tools/heroes-*.generated.png`.

## Arquivos antigos excluídos

Todos os nomes abaixo são relativos a `assets/characters/<personagem>/`. Antes da remoção foi feita uma busca por caminho e nome em arquivos de código, HTML, CSS, documentação e geradores; o resultado está em `tools/retired-hero-assets.json`. Uma referência interna ao atlas de caminhada antigo foi removida junto com esse atlas; correspondências de `walk.png` dentro dos nomes novos são apenas substrings.

| Pasta | Arquivos excluídos |
| --- | --- |
| `nopal` | `Nopal, pistoleiro cacto em pixel art.png`, `arms.png`, `atlas.png`, `body.png`, `hands.png`, `nopal_walk_8dir.png`, `walk_atlas.js`, `walk_weaponless.png` |
| `rosa` | `arms.png`, `atlas.png`, `body.png`, `hands.png`, `spritesheet.png` |
| `bento` | `actions.png`, `spritesheet (2).png`, `walk.png`, `walk_8directions.png` |
| `iris` | `iris_spritesheet.png`, `weaponless.png` |

Os quatro `atlas.js` ativos foram atualizados. Os comandos antigos de geração/teste encaminham ao sistema novo, para não recriarem dependências obsoletas. Assets compartilhados, os oito originais novos e a subpasta histórica do usuário foram preservados. Nenhum commit ou push faz parte desta alteração.

A reconstrução completa usa nomes de PNG derivados de SHA-256 e atualiza as revisões de scripts no HTML. Veja [o rastreamento das duas entradas, antes/depois por personagem e evidências visuais](sprite-loading.md).
