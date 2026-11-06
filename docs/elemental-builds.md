# Builds elementais do Oeste

O sistema adiciona 12 melhorias elementais e exatamente quatro cartas de
sinergia. As oito armas, evoluções, XP, atributos iniciais e recompensas dos
baús continuam existentes. Sem talentos elementais, o combate não aplica
efeitos novos nem consome sorteios elementais.

## Árvores

Cada carta pode ser escolhida uma vez. A primeira etapa pode aparecer no nível
2; a segunda exige a primeira e nível 4; a terceira exige a segunda e nível 7.
O nível permite oferecer uma carta, mas nunca a concede automaticamente.

| Elemento | Etapa inicial | Etapa avançada | Maestria |
| --- | --- | --- | --- |
| Fogo | Pólvora Ardente | Brasa Persistente | Forja do Deserto |
| Gelo | Chumbo Frio | Geada Profunda | Inverno do Oeste |
| Eletricidade | Faísca de Cobre | Condutor de Cobre | Dínamo do Oeste |
| Veneno | Bala de Cascavel | Colônia Fúngica | Sangue de Cascavel |

| Efeito | Base | Avançado / maestria |
| --- | --- | --- |
| Fogo | Chance base 38%; 3 acúmulos; 3,5 s; 6 dano/s por acúmulo | 5 acúmulos, 5 s, 8 dano/s; maestria: chance 50%, 10 dano/s |
| Gelo | Chance base 32%; -25% velocidade por 2 s; 4 aplicações congelam por 0,5 s | -40%; 3 aplicações congelam por 1 s; maestria: chance 44%, lentidão por 3 s, congelamento por 1,3 s |
| Eletricidade | Chance base 24%; 8 dano no alvo + até 2 saltos de 150 px | 12 dano e até 3 saltos de 180 px; maestria: chance 34%, 16 dano |
| Veneno | Chance base 38%; 4 acúmulos; 5 s; 4 dano/s por acúmulo | 6 acúmulos; mortes propagam a 3 vizinhos em 95 px; maestria: chance 50%, 7 s, 6 dano/s |

Queimaduras e veneno causam dano em passos de 0,5 s. Reaplicações aumentam o
acúmulo até o limite e renovam a duração, preservando o próximo tick para não
duplicar ou adiar o dano. O atributo de dano do jogador escala esses efeitos.

Chefes sofrem só 15% de lentidão e congelam por 0,25 s. Após descongelar, têm
4 s de imunidade ao congelamento; inimigos comuns têm 2 s. Durante o gelo,
movimentação, contato ofensivo e novos disparos ficam bloqueados. Projéteis
inimigos já disparados e temporizadores de invocação dos chefes permanecem.

## Quatro sinergias, sempre escolhidas

Todas exigem nível 6 e as duas melhorias avançadas abaixo. Uma sinergia
elegível entra no sorteio de cartas com destaque próprio; adquiri-la exige
escolher a carta. Não existem combinações de Fogo + Gelo ou Eletricidade +
Veneno, nem concessão automática por armas, baús ou pré-requisitos completos.

| Sinergia | Melhorias exigidas | Efeito e limite |
| --- | --- | --- |
| Tempestade Infernal | Brasa Persistente + Condutor de Cobre | Raios em alvos queimando: 35% de chance de explosão, 18 dano em 72 px; até 6 vizinhos; intervalo 1,5 s por alvo |
| Combustão Tóxica | Brasa Persistente + Colônia Fúngica | Alvos queimando e contaminados: 40% de chance de explosão num acerto direto ou morte; 14 dano em 90 px, fogo e veneno em até 6 vizinhos; intervalo 2,4 s e até 2 gerações |
| Estilhaços Condutores | Geada Profunda + Condutor de Cobre | Raio em alvo congelado: fragmentos de 14 dano para até 4 vizinhos em 155 px; intervalo 1,1 s por alvo |
| Praga Cristalizada | Geada Profunda + Colônia Fúngica | +30% de todo dano recebido enquanto o alvo estiver simultaneamente congelado e envenenado; aplicado uma única vez por evento de dano |

Descargas geradas pelo elemento e acertos do Laço Elétrico podem ativar as
duas sinergias de eletricidade. O laço não ganha o elemento ou uma sinergia
automaticamente: o jogador ainda precisa das cartas exigidas.

## Integração e limites

- Projéteis usam sua identificação de arma; dinamite, meteoro, laço e espinhos
  passam a origem diretamente ao ponto central de dano.
- Chances básicas são multiplicadas por `1 / sqrt(qty)` em espingarda, chuva,
  espinhos, laço e meteoro. Dinamite, meteoro, espinhos e canhão solar têm ainda
  multiplicador 0,8 por seu alcance em área/perfuração.
- Cada inimigo tem intervalo mínimo de 0,28 s entre tentativas da mesma arma.
  Vários elementos podem aplicar nesse evento; várias armas podem combinar-se.
- Uma descarga elemental tem intervalo de 0,45 s por alvo; a mesma descarga
  nunca volta ao mesmo inimigo.
- Danos periódicos, fragmentos, descargas e explosões usam origem `element`.
  Ela não reaplica talentos nem dispara uma nova cascata de acertos.
- Há orçamento global de 12 ativações de descarga/reação/propagação por quadro.
  Explosões e propagação usam limites de alvos e a contaminação transmitida
  carrega uma geração, limitada a 2. Uma morte é resolvida uma única vez.
- Mortes secundárias são resolvidas antes de contabilizar mortos, garantindo
  abates, gemas e baú do chefe, inclusive em morte no último tick de veneno.
- Estados e efeitos usam o tempo da partida e congelam em todos os menus de
  pausa. Uma nova partida cria uma build vazia e descarta inimigos/efeitos.
- A build usa seu próprio gerador pseudoaleatório; efeitos visuais não sorteiam
  nada. Até 96 eventos visuais são mantidos por até 0,6 s, sem criar canvases
  por quadro. Cores, glifos, aros e fragmentos são desenhados em pixels sólidos.
- Números de dano secundário são somados em janelas de 0,3 s por inimigo e
  novos números elementais respeitam teto de 240 números ativos. O dano real
  é aplicado imediatamente, sem agregação ou redução; a limitação é só visual.
- Alvos mortos por uma reação são ignorados pelos disparos seguintes e pelos
  saltos restantes do laço, evitando gastar ataques em corpos sem vida.

## Arquivos e pontos de extensão

- `js/elements.js`: catálogo, pré-requisitos, seleção, estado, aplicação, ticks,
  resistência, sinergias e resolução de mortes. Valores de equilíbrio ficam
  nas definições e funções desse módulo; `limits` reúne os limites comuns.
- `js/element_visuals.js`: cartas, ícones, indicadores de build e sobreposições.
- `js/main.js`: inicialização por partida, origem dos acertos, velocidade e
  bloqueio de congelados, atualização, escolha de cartas e renderização.
- `tools/check_elements.cjs`: testes unitários e integração com o jogo real,
  usando Canvas simulado para lógica.
- `tools/element-preview.js`: fixtures isoladas para revisão no navegador.

Baús comuns continuam evoluindo armas/curando; baús de conhecimento continuam
concedendo XP e melhorias de arma. Níveis obtidos por essas recompensas abrem
o mesmo menu e respeitam os mesmos pré-requisitos elementais.

## Verificação

```
node tools/check_elements.cjs
node tools/check_player_sprite.cjs
node tools/check_player_sprite.cjs --preview --elements
```

O primeiro verifica elementos/sinergias separadamente, chefes, acúmulos,
expiração, probabilidades de salvas, intervalos, gerações, build completa,
baús, recompensas de mortes, menus, seleção e reinício. O segundo compara as
armas sem talentos com a versão anterior, preservando o balanceamento de
dinamite já autorizado; também verifica animações e ataques simultâneos.

O terceiro gera `tools/player-preview.generated.html` (descartável, ignorado
pelo Git). A página padrão mostra cartas; `?mode=world` mostra oito quadros
de efeitos; `?mode=play` executa 180 atualizações da build completa com as oito
armas, evoluções e um chefe no navegador real. Esses fixtures não entram no
jogo. As capturas de navegador não substituem playtest prolongado, testes em
dispositivos móveis reais ou medição de FPS com hordas extensas.
