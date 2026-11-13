"use strict";
(()=>{
const byId=id=>document.getElementById(id);
const labels={
 service:{express:"Diagnóstico de CSV",painel:"Painel de indicadores",automacao:"Automação e integração"},
 area:{vendas:"Vendas",estoque:"Estoque",operacoes:"Operações",atendimento:"Atendimento",outros:"Outro processo"},
 volume:{"1":"1 arquivo","2-5":"2 a 5 arquivos","6-20":"6 a 20 arquivos",mais:"Mais de 20 arquivos"},
 pain:{inconsistencias:"Dados duplicados, faltantes ou inconsistentes",consolidacao:"Consolidar planilhas",
       dashboard:"Indicadores mais claros",rotina:"Eliminar tarefas manuais recorrentes"}
};
const FIELDS=["service","area","volume","pain"];
function summary(){
 const chosen=Object.fromEntries(FIELDS.map(k=>[k,labels[k][byId(k).value]||"Não definido"]));
 return [
  "Olá, equipe DELTA. Gostaria de avaliar um orçamento para:",
  "",
  "Serviço: "+chosen.service,
  "Área: "+chosen.area,
  "Quantidade aproximada: "+chosen.volume,
  "Principal dificuldade: "+chosen.pain,
  "",
  "Gostaria de confirmar escopo, arquivos aceitos, prazo, custo e critérios de aceite.",
  "Não estou enviando dados confidenciais nesta mensagem."
 ].join("\n");
}
function render(){
 const message=summary();
 byId("brief").textContent=message;
 byId("email").href="mailto:suporte@deltamusic.com.br?subject="+encodeURIComponent("Orçamento DELTA Insight Studio")+
  "&body="+encodeURIComponent(message);
 byId("status").textContent="";
}
for(const field of FIELDS)byId(field).addEventListener("change",render);
document.querySelectorAll("button[data-service]").forEach(b=>b.addEventListener("click",()=>{
 const service=b.dataset.service;
 if(!Object.hasOwn(labels.service,service))return;
 byId("service").value=service;
 render();
 byId("orcamento").scrollIntoView({behavior:"smooth",block:"start"});
}));
byId("copy").addEventListener("click",async()=>{
 const message=summary();
 try{
  if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(message);
  else throw new Error("Clipboard unavailable");
  byId("status").textContent="Resumo copiado. Envie por um canal comercial autorizado.";
 }catch(_){
  const selection=window.getSelection(),range=document.createRange();
  range.selectNodeContents(byId("brief"));selection.removeAllRanges();selection.addRange(range);
  byId("status").textContent="O texto foi selecionado. Copie manualmente com Ctrl+C.";
 }
});
render();
})();