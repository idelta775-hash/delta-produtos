/* © 2026 DELTA Studio — public free estimator. No network or third-party scripts. */
(function () {
"use strict";
const form=document.getElementById("freeRoiForm");
const error=document.getElementById("roiError");
const BRL=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});
const HOURS=new Intl.NumberFormat("pt-BR",{maximumFractionDigits:2});
const defs={tasks:600,minutes:6,automated:55,effective:60,hourly:35};
function number(name,max) {
 const control=form.elements.namedItem(name);
 const val=control.value.trim();
 if(!val)throw new RangeError("Preencha o campo: "+name+".");
 const n=Number(val);
 if(!Number.isFinite(n)||n<0||n>max)throw new RangeError("Valor fora do limite em: "+name+".");
 return n;
}
function clearOutput(){
 for(const id of ["economicMonthly","manualHours","automatedHours","effectiveHours","economicAnnual"])
  document.getElementById(id).textContent="—";
}
function update(){
 try {
  const tasks=number("tasks",1000000);
  const mins=number("minutes",1440);
  const automated=number("automated",100)/100;
  const effective=number("effective",100)/100;
  const hourly=number("hourly",100000);
  const manual=tasks*mins/60;
  const autoHours=manual*automated;
  const realized=autoHours*effective;
  const monthly=realized*hourly;
  const annual=monthly*12;
  if(![manual,autoHours,realized,monthly,annual].every(Number.isFinite))throw new RangeError("Estimativa fora dos limites.");
  const put=(id,txt)=>{document.getElementById(id).textContent=txt;};
  put("manualHours",HOURS.format(manual)+" h/mês");
  put("automatedHours",HOURS.format(autoHours)+" h/mês");
  put("effectiveHours",HOURS.format(realized)+" h/mês");
  put("economicMonthly",BRL.format(monthly));
  put("economicAnnual",BRL.format(annual));
  error.hidden=true;error.textContent="";
 } catch(e) {
  clearOutput();error.hidden=false;error.textContent=e.message||"Verifique os valores informados.";
 }
}
form.addEventListener("input",update);
document.getElementById("roiExample").addEventListener("click",()=>{
 for(const [name,n] of Object.entries(defs))form.elements.namedItem(name).value=String(n);
 update();
});
document.getElementById("roiZero").addEventListener("click",()=>{
 form.elements.namedItem("automated").value="0";update();
});
update();
})();
