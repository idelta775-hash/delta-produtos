"use strict";
(() => {
const $ = id => document.getElementById(id);
function val(id){
 const e=$(id),s=e.value.trim().replace(/\s+/g," ");
 if(!s || s.length>e.maxLength)throw Error("Preencha todos os campos sem ultrapassar o limite.");
 return s;
}
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node}
$("scriptForm").addEventListener("submit",event=>{
 event.preventDefault();
 try{
 const product=val("product"),problem=val("problem"),benefit=val("benefit"),
       proof=val("proof"),cta=val("cta");
 if(!$("rights").checked)throw Error("Confirme que as cenas e os sons usados serão autorizados.");
 if(!$("truth").checked)throw Error("Confirme que as alegações serão verificáveis.");
 const scenes=[
  {time:"00–03s",title:"Gancho",voice:"Uma pergunta para considerar: "+problem+".",film:"Grave uma introdução real no ambiente de uso."},
  {time:"03–08s",title:"Contexto",voice:"Vamos observar "+product+" sem exagerar nas características.",film:"Mostre a unidade verdadeira e identifique a oferta."},
  {time:"08–17s",title:"Demonstração",voice:"Observe esta característica: "+benefit+".",film:proof+"."},
  {time:"17–24s",title:"Conferência",voice:"Verifique limites, medidas, compatibilidade e condições atuais.",film:"Mostre apenas informações cuja origem você pode comprovar."},
  {time:"24–30s",title:"Próximo passo",voice:cta+".",film:"Finalize com instrução clara e informações da oferta legítima."}
 ];
 const place=$("scenes");place.replaceChildren();
 scenes.forEach(s=>{
  const block=el("div","demo-scene");
  block.append(el("strong","",s.time+" · "+s.title),el("p","",s.voice),el("small","","FILMAR: "+s.film));
  place.append(block);
 });
 $("output").hidden=false;$("status").hidden=true;$("status").classList.remove("error");
 }catch(err){
 $("output").hidden=true;$("status").hidden=false;$("status").classList.add("error");
 $("status").textContent=err.message;
 }
});
})();