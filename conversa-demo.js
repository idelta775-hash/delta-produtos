"use strict";
(() => {
 const $=id=>document.getElementById(id);
 const templates={
  welcome:(company,service)=>"Olá!\n\nVocê está falando com a equipe "+company+". Obrigado pelo contato. Podemos ajudar com "+service+". Conte o que precisa e vamos orientar os próximos passos.\n\n"+company,
  budget:(company,service)=>"Olá!\n\nPara preparar uma proposta de "+service+", precisamos confirmar escopo, valor, prazo e condições antes de assumir compromisso. Poderia detalhar sua necessidade?\n\n"+company,
  delay:(company,service)=>"Olá!\n\nPrecisamos avisar sobre um imprevisto no atendimento de "+service+". Lamentamos o transtorno. Vamos conferir os próximos passos e retornar com informações atualizadas, sem prometer prazos não confirmados.\n\n"+company
 };
 function trimmed(id,max){return $(id).value.trim().slice(0,max);}
 function content(){
  const company=trimmed("company",65),service=trimmed("service",100);
  if(!company||!service)return "";
  return templates[$("situation").value](company,service);
 }
 function render(){
  const msg=content();
  $("demoPreview").textContent=msg||"Preencha o nome do negócio e o serviço para visualizar um exemplo.";
  $("demoCopy").disabled=!msg;
 }
 for(const id of ["company","service","situation"]){$(id).addEventListener("input",render);$(id).addEventListener("change",render);}
 $("demoCopy").addEventListener("click",()=>{
  const msg=content();if(!msg)return;
  let copied=false;
  const a=document.createElement("textarea");a.value=msg;a.style.position="fixed";a.style.left="-9999px";
  document.body.append(a);a.focus();a.select();
  try{copied=!!document.execCommand("copy")}catch(_){}
  a.remove();
  if(copied){$("demoFeedback").textContent="Mensagem copiada. Revise e envie manualmente apenas em um contato permitido.";return;}
  $("demoFeedback").textContent="Cópia automática indisponível. Selecione o texto acima e copie manualmente.";
  if(navigator.clipboard?.writeText)navigator.clipboard.writeText(msg).then(()=>$("demoFeedback").textContent="Mensagem copiada. Revise antes de usar.",()=>{});
 });
 render();
})();