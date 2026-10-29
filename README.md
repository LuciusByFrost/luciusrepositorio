# Cactus Survivors: O Último Cacto do Oeste

Jogo de sobrevivência 2D feito com HTML, CSS e JavaScript puro. Não usa bibliotecas, imagens externas ou servidor.

## Como iniciar

Abra `index.html` diretamente em um navegador moderno. Os scripts são clássicos e locais para permitir o uso por `file://`. O áudio sintetizado começa após a primeira interação, conforme as regras do navegador.

## Controles

- **WASD** ou **setas**: mover.
- **E**: interagir com um Baú do Conhecimento próximo.
- **1–4** ou clique/toque: responder à pergunta; **ESC** fecha o painel sem consumir a pergunta.
- **ESC**: pausar/continuar a partida.
- **1–3**, **Espaço** ou clique: escolher uma melhoria ao subir de nível.
- **Celular**: direcional virtual e botão de interação contextual.

Os ataques são automáticos. Movimente-se para posicionar o cacto, desviar e recolher gemas.

## Sistemas

- Baús do Conhecimento aparecem em locais livres perto da área explorada. Aproxime-se e pressione **E** (ou toque no botão); a partida inteira pausa enquanto responde.
- Banco de 60 perguntas originais de redes, organizado em seis categorias e três níveis. As perguntas avançadas são liberadas gradualmente e não se repetem na partida enquanto houver opções elegíveis.
- Resposta correta concede experiência extra e pode aprimorar uma arma; a recompensa aumenta conforme a dificuldade. Resposta errada mostra a alternativa correta e uma explicação, sem penalidade. Cada baú só pode ser respondido uma vez.
- As perguntas abordam conceitos introdutórios gerais alinhados aos temas de Networking Basics, fundamentos de redes e Packet Tracer. Este material é independente, não é oficial nem certificado pela Cisco.
- Oito armas automáticas com níveis, padrões próprios, upgrades e evoluções via baús comuns.
- Hordas por estágio, sete arquétipos de inimigos e o chefe Xerife Corrupto com projéteis e mudança de fase.
- Experiência, seleção de três melhorias, sorte, atributos, gemas, cenário procedural e sprites em Canvas.
- Pausa completa durante escolhas, recorde e opção de som guardados em `localStorage`.

## Arquivos principais

- `js/main.js`: jogo, renderização, entrada e integração da interface.
- `js/network_questions.js`: banco de perguntas e recompensas por dificuldade.
- `js/knowledge_chests.js`: seleção de perguntas e estado de uso/resposta dos baús.
- `knowledge.css`: botão contextual de interação em telas touch.

## Limitações atuais

- As opções limitam-se a alternar efeitos sonoros; não há trilha musical.
- O cenário é uma arena procedural extensa, sem transição entre mapas ou prédios exploráveis.
- As evoluções de armas são concedidas por baús comuns quando os requisitos de nível são atendidos.
- Sprites e cenários são desenhados por código; não há spritesheets ou animação quadro a quadro.

## Expansões recomendadas

Adicionar mais chefes e padrões, itens passivos que habilitem evoluções, biomas exploráveis, opções de acessibilidade e uma trilha original opcional.
