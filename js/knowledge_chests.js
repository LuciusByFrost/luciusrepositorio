/* Estado e seleção do Baú do Conhecimento; não depende da simulação do jogo. */
(() => {
  'use strict';
  const bank = window.NETWORK_QUESTION_BANK;
  const rank = {Fácil:1, Médio:2, Difícil:3};
  const randomItem = items => items[Math.floor(Math.random()*items.length)];
  window.KnowledgeChestSystem = {
    create(x,y,id){return{id,x,y,bob:0,glow:0,opening:0,opened:false,used:false,quiz:null}},
    nearest(chests,player,radius=46){let best=null,bestD=radius;for(const chest of chests){if(chest.used||chest.opened)continue;const d=Math.hypot(chest.x-player.x,chest.y-player.y);if(d<=bestD){best=chest;bestD=d}}return best},
    chooseQuestion(stage,level,usedIds){let max=stage>=6&&level>=8?3:stage>=3&&level>=4?2:1;let eligible=bank.filter(q=>rank[q.difficulty]<=max&&!usedIds.has(q.id));if(!eligible.length){usedIds.clear();eligible=bank.filter(q=>rank[q.difficulty]<=max)}const source=randomItem(eligible);if(!source)return null;const question={...source,options:source.options.slice()};for(let i=question.options.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[question.options[i],question.options[j]]=[question.options[j],question.options[i]];if(question.correct===i)question.correct=j;else if(question.correct===j)question.correct=i}return question},
    open(chest,stage,level,usedIds){if(!chest||chest.used||chest.opened)return null;if(!chest.quiz){const question=this.chooseQuestion(stage,level,usedIds);if(!question)return null;usedIds.add(question.id);chest.quiz={question,answered:false,selected:-1,correct:false,rewardApplied:false}}chest.quiz.panelOpen=true;return chest.quiz},
    answer(quiz,index){if(!quiz||quiz.answered||index<0||index>3)return false;quiz.selected=index;quiz.correct=index===quiz.question.correct;quiz.answered=true;quiz.panelOpen=true;return true},
    close(chest){if(!chest||!chest.quiz)return;if(chest.quiz.answered){chest.used=true;chest.opened=chest.quiz.correct;chest.panelOpen=false}else chest.quiz.panelOpen=false}
  };
})();
