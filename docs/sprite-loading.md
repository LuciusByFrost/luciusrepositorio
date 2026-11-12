# Carregamento dos personagens

A entrada principal é `index.html`; a entrada histórica `luciusrepositorio/index.html` redireciona para ela. Os scripts clássicos funcionam por arquivo local e HTTP.

`js/hero_sprite.js` carrega as folhas separadas de caminhada e ataque usando URLs relativas ao script. Os quatro módulos de personagens compartilham o compositor. Dimensões incorretas ou erro de carregamento ativam o fallback procedural; `NopalSprite.status()` e os equivalentes dos outros personagens informam URLs/dimensões/estado.

Não há dependência de braços separados ou máscaras. A prévia e a seleção usam os mesmos módulos da partida. Os scripts e PNGs usam revisão de cache atualizada.

Veja [integração e testes](hero-sprites.md).
