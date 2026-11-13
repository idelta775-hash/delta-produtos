"use strict";
(() => {
  const MAX_BYTES = 2 * 1024 * 1024, MAX_ROWS = 10000, MAX_COLS = 25;
  const VERSION = "INSIGHT_STUDIO_V0.1";
  const el = id => document.getElementById(id);
  let loaded = null, report = null;
  const money = v => Number.isFinite(v) ? v.toLocaleString("pt-BR", {maximumFractionDigits: 2}) : "—";
  const node = (tag, cls, value) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (value !== undefined && value !== null) n.textContent = String(value);
    return n;
  };
  function detectSep(src) {
    let inQ = false, counts = {",": 0, ";": 0, "\t": 0};
    for (let i = 0; i < Math.min(src.length, 4000); i++) {
      const ch = src[i];
      if (ch === '"') {
        if (inQ && src[i+1] === '"') {i++; continue;}
        inQ = !inQ;
      } else if (!inQ && (ch === "\n" || ch === "\r")) {break;}
      else if (!inQ && Object.prototype.hasOwnProperty.call(counts, ch)) counts[ch]++;
    }
    const entries = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    if (entries[0][1] === 0) throw new Error("Não foi encontrado um delimitador CSV válido.");
    return entries[0][0];
  }
  function parseCSV(src) {
    if (typeof src !== "string" || !src.trim()) throw new Error("Arquivo vazio.");
    if (new Blob([src]).size > MAX_BYTES) throw new Error("Arquivo acima de 2 MB.");
    const s = src.replace(/^\uFEFF/, "");
    const sep = detectSep(s), all = [];
    let row=[], cell="", quoted=false;
    function finishRow() {
      row.push(cell);
      if (row.some(v => v.trim() !== "")) all.push(row);
      row=[]; cell="";
      if (all.length > MAX_ROWS+1) throw new Error("Limite de 10 mil linhas excedido.");
    }
    for (let i=0; i<s.length; i++) {
      const c=s[i];
      if (c === '"') {
        if (quoted && s[i+1] === '"') {cell+='"';i++;}
        else if (quoted) quoted=false;
        else if (!cell.trim()) quoted=true;
        else cell+=c;
      } else if (!quoted && c===sep) {row.push(cell); cell="";}
      else if (!quoted && (c==="\n" || c==="\r")) {
        if (c==="\r" && s[i+1]==="\n") i++;
        finishRow();
      } else cell+=c;
    }
    if (quoted) throw new Error("CSV malformado: aspas sem fechamento.");
    if (cell.length || row.length) finishRow();
    if (all.length < 2) throw new Error("CSV precisa conter cabeçalho e ao menos 1 linha.");
    const headers=all.shift().map(x=>x.trim());
    if (!headers.every(Boolean)) throw new Error("Cabeçalhos vazios não são aceitos.");
    if (headers.length > MAX_COLS) throw new Error("Limite de 25 colunas excedido.");
    const identities=headers.map(x=>x.toLowerCase());
    if (new Set(identities).size !== identities.length) throw new Error("Cabeçalhos duplicados.");
    let ragged=0;const ragged_rows=[];
    const data=all.map((r,i) => {
      if (r.length > headers.length) throw new Error("Registro "+(i+2)+": mais campos do que o cabeçalho.");
      if (r.length !== headers.length) {ragged++;ragged_rows.push(i+2);}
      return headers.map((_,j)=> String(r[j] ?? "").trim());
    });
    return {headers, data, delimiter:sep==="\t"?"TAB":sep, ragged,ragged_rows};
  }
  function parseNum(v) {
    if (typeof v!=="string") return null;
    let s=v.trim().replace(/\u00a0/g,"").replace(/\s/g,"");
    if (!s) return null;
    const negative=s.startsWith("(") && s.endsWith(")");
    if (negative) s=s.slice(1,-1);
    s=s.replace(/^R\$/i,"").replace(/[€$]/g,"");
    if (!/^[+-]?[0-9.,]+$/.test(s)) return null;
    const lastComma=s.lastIndexOf(","),lastDot=s.lastIndexOf(".");
    if (lastComma>=0 && lastDot>=0) {
      s=lastComma>lastDot?s.replace(/\./g,"").replace(",","."):s.replace(/,/g,"");
    } else if (lastComma>=0) {
      const p=s.split(",");
      s=p.length>2 ? p.join("") : p[0]+"."+p[1];
    } else if ((s.match(/\./g)||[]).length>1 || /^[+-]?\d{1,3}\.\d{3}$/.test(s)) {
      s=s.replace(/\./g,"");
    }
    const n=Number(s);
    return Number.isFinite(n)?(negative?-n:n):null;
  }
  function quantile(sorted,p) {
    if (!sorted.length) return null;
    const pos=(sorted.length-1)*p,lo=Math.floor(pos),hi=Math.ceil(pos);
    return sorted[lo]+(sorted[hi]-sorted[lo])*(pos-lo);
  }
  function pickColumns(parsed) {
    const {headers,data}=parsed;
    const aliases=/^(valor|total|pre[cç]o|amount|quantidade|receita|faturamento|custo|despesa|saldo)$/i;
    const numeric=headers.findIndex(h=>aliases.test(h))!==-1?
      headers.findIndex(h=>aliases.test(h)):
      headers.findIndex((_,j)=>data.filter(r=>parseNum(r[j])!==null).length >= Math.max(2,Math.ceil(data.length*.65)));
    const category=headers.findIndex(h=>/^(categoria|category|tipo|status|canal|loja|produto|equipe|origem)$/i.test(h));
    return {numeric:numeric>=0?numeric:-1,category:category>=0?category:-1};
  }
  function compute(parsed,numIndex,catIndex) {
    const {data,headers}=parsed,issue=[],seen=new Set(),columnMissing=Array(headers.length).fill(0);
    let empties=0,duplicates=0,invalidNumeric=0, outliers=0;
    const numbers=[];
    data.forEach((r,idx)=>{
      if(parsed.ragged_rows.includes(idx+2))issue.push({row:idx+2,type:"LINHA INCOMPLETA",detail:"Menos campos que o cabeçalho."});
      const fingerprint=JSON.stringify(r);
      if(seen.has(fingerprint)){duplicates++;issue.push({row:idx+2,type:"DUPLICADA",detail:"Registro idêntico a outro registro."});}
      else seen.add(fingerprint);
      r.forEach((v,j)=>{
        if(!v){empties++;columnMissing[j]++; if(issue.length<250)
            issue.push({row:idx+2,type:"VAZIO",detail:"Campo sem conteúdo: "+headers[j]});}
      });
      if(numIndex>=0&&r[numIndex]){
        const n=parseNum(r[numIndex]);
        if(n===null){invalidNumeric++;issue.push({row:idx+2,type:"VALOR INVÁLIDO",detail:"Não foi possível interpretar a coluna "+headers[numIndex]});}
        else numbers.push({row:idx+2,value:n});
      }
    });
    const sorted=numbers.map(x=>x.value).sort((a,b)=>a-b);
    let bounds=null;
    if(sorted.length>=8){
      const q1=quantile(sorted,.25),q3=quantile(sorted,.75),iqr=q3-q1;
      if(iqr>0){
        bounds={min:q1-1.5*iqr,max:q3+1.5*iqr};
        numbers.forEach(x=>{
          if(x.value<bounds.min||x.value>bounds.max){
            outliers++;issue.push({row:x.row,type:"VALOR INCOMUM",detail:"Fora da faixa IQR exploratória (coluna "+headers[numIndex]+")"});
          }
        });
      }
    }
    const categories=new Map();
    if(catIndex>=0) for(const row of data){
      const k=row[catIndex]||"(vazio)";
      categories.set(k,(categories.get(k)||0)+1);
    }
    const score = Math.max(0,Math.round(100*(1-(
      .70*empties/(Math.max(1,data.length*headers.length))+
      .20*duplicates/Math.max(1,data.length)+
      .10*invalidNumeric/Math.max(1,data.length)))));
    return {rows:data.length,cols:headers.length,missing:empties,missing_by_column:columnMissing,
      duplicates,invalid_numeric:invalidNumeric,outliers,score,issues:issue,irregular_rows:parsed.ragged,
      bounds, numeric_column:numIndex>=0?headers[numIndex]:null,
      category_column:catIndex>=0?headers[catIndex]:null,
      categories:[...categories.entries()].sort((a,b)=>b[1]-a[1]).slice(0,8)};
  }
  async function digest(bytes) {
    try {
      if (!crypto?.subtle) return "Indisponível no contexto deste navegador";
      const hash = await crypto.subtle.digest("SHA-256", bytes);
      return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,"0")).join("");
    } catch (_) {return "Indisponível no contexto deste navegador";}
  }
  function selectFill(select,headers,current) {
    select.replaceChildren(new Option("Nenhuma", "-1"));
    headers.forEach((h,i)=>select.append(new Option(h,String(i))));
    select.value=String(current);
    select.disabled=false;
  }
  function renderPreview() {
    const table=el("preview"),thead=table.querySelector("thead"),tbody=table.querySelector("tbody");
    thead.replaceChildren();tbody.replaceChildren();
    const tr=node("tr");
    loaded.parsed.headers.forEach(h=>tr.append(node("th",null,h)));
    thead.append(tr);
    loaded.parsed.data.slice(0,6).forEach(r=>{
      const line=node("tr");r.forEach(value=>line.append(node("td",null,value||"—")));tbody.append(line);
    });
  }
  function render() {
    if(!loaded) return;
    const parsed=loaded.parsed,numIndex=Number(el("numeric").value),catIndex=Number(el("category").value);
    report=compute(parsed,numIndex,catIndex);
    el("filename").textContent=loaded.name;
    el("timestamp").textContent=loaded.timestamp;
    el("sample-badge").textContent=loaded.demo?"DADOS FICTÍCIOS":"ARQUIVO LOCAL";
    el("m-rows").textContent=money(report.rows);
    el("m-empty").textContent=money(report.missing);
    el("m-duplicates").textContent=money(report.duplicates);
    el("m-outliers").textContent=money(report.outliers);
    el("quality").textContent=report.score+"/100";
    el("quality-bar").style.width=report.score+"%";
    el("quality-note").textContent="Índice heurístico de completude e consistência, não certificação ou veredito sobre o negócio. "+report.invalid_numeric+" valores numéricos não interpretados.";
    el("digest").textContent=loaded.sha256;
    const bars=el("bars");bars.replaceChildren();
    if(!report.categories.length){bars.append(node("p","empty-state","Escolha uma coluna de agrupamento."));}
    else {
      const total=Math.max(...report.categories.map(x=>x[1]));
      for(const [label,count] of report.categories){
        const wrap=node("div","chartrow"),head=node("div","cat"),track=node("div","track"),fill=node("div","fill");
        head.append(node("span",null,label),node("span",null,count));
        fill.style.width=(count*100/total).toFixed(1)+"%";
        track.append(fill);wrap.append(head,track);bars.append(wrap);
      }
    }
    const body=el("findings");body.replaceChildren();
    const prioritized=report.issues.filter(x=>x.type!=="VAZIO");
    const others=report.issues.filter(x=>x.type==="VAZIO");
    const list=[...prioritized,...others].slice(0,100);
    el("findings-count").textContent=report.issues.length+" ocorrências"+(report.issues.length>100?" · primeiras 100":"");
    if(!list.length){const tr=node("tr");const td=node("td",null,"Nenhuma inconsistência detectada pelos critérios disponíveis.");td.colSpan=3;tr.append(td);body.append(tr);}
    else for(const item of list){
      const tr=node("tr");tr.append(node("td",null,item.row),node("td",null,item.type),node("td",null,item.detail));body.append(tr);
    }
    renderPreview();el("export").disabled=false;el("export-html").disabled=false;
  }
  async function loadCSV(name,raw,bytes,isDemo=false) {
    const parsed=parseCSV(raw);
    const suggestions=pickColumns(parsed);
    const hash=await digest(bytes);
    loaded={name,parsed,sha256:hash,demo:isDemo,timestamp:new Date().toLocaleString("pt-BR")};
    selectFill(el("numeric"),parsed.headers,suggestions.numeric);
    selectFill(el("category"),parsed.headers,suggestions.category);
    render();
  }
  function demoSource() {
    const rows=[["data","pedido","categoria","canal","valor","responsavel"]];
    for(let i=1;i<=42;i++){
      const day=String(1+i%27).padStart(2,"0");
      const category=["Eletrônicos","Casa","Moda","Papelaria"][i%4];
      const amount=(54+(i%8)*13.75).toFixed(2).replace(".",",");
      rows.push(["2026-10-"+day,"P"+String(i).padStart(3,"0"),category,
                  i%3===0?"Site":"Balcão",amount,i%7===0?"":"Equipe A"]);
    }
    rows[18]=[...rows[8]];
    rows[22][4]="8900,00";rows[29][4]="VALOR?";rows[35][5]="";
    return rows.map(r=>r.map(s=>/[;"\n\r]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s).join(";")).join("\r\n")+"\r\n";
  }
  function htmlEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function exportFriendly() {
    if(!loaded||!report)return;
    const safe=htmlEscape,r=report;
    const list=r.issues.slice(0,80).map(x=>
      '<tr><td>'+safe(x.row)+'</td><td>'+safe(x.type)+'</td><td>'+safe(x.detail)+'</td></tr>').join('');
    const cats=r.categories.map(x=>'<li>'+safe(x[0])+': '+safe(x[1])+' registros</li>').join('');
    const css='body{font:15px/1.6 Arial,sans-serif;color:#15303a;margin:30px auto;max-width:950px;padding:0 18px}h1{font-size:30px}' +
      '.badge{color:#146c5e;font-weight:bold}.cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px}' +
      '.card{background:#eaf6f3;padding:14px;border-radius:9px}.card strong{display:block;font-size:29px}' +
      'table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #c4d7d7;text-align:left}' +
      'th{background:#e9f3f3}.warning{background:#fff5e7;padding:16px;border-left:4px solid #d2a752}' +
      'code{overflow-wrap:anywhere}footer{border-top:1px solid #ccc;margin-top:28px;padding-top:15px;color:#667}' +
      '@media print{body{margin:0;max-width:none}}';
    const parts=[
      '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">',
      '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;">',
      '<title>Relatório de auditoria DELTA</title><style>',css,'</style></head><body>',
      '<div class="badge">DELTA INSIGHT STUDIO • RELATÓRIO LOCAL',
      loaded.demo?' • DADOS FICTÍCIOS':'','</div><h1>Diagnóstico de qualidade de dados</h1>',
      '<p>Gerado em ',safe(new Date().toLocaleString("pt-BR")),
      '<br>Arquivo: ',safe(loaded.name),'<br>SHA-256: <code>',safe(loaded.sha256),'</code></p>',
      '<div class="cards"><div class="card">Registros<strong>',safe(r.rows),'</strong></div>',
      '<div class="card">Vazios<strong>',safe(r.missing),'</strong></div>',
      '<div class="card">Duplicados<strong>',safe(r.duplicates),'</strong></div>',
      '<div class="card">Valores incomuns<strong>',safe(r.outliers),'</strong></div></div>',
      '<h2>Resumo</h2><p>Índice heurístico: <b>',safe(r.score),'/100</b>. ',
      'Valores não interpretados: ',safe(r.invalid_numeric),'. Linhas incompletas: ',safe(r.irregular_rows),'.</p>',
      '<h2>Grupos por categoria</h2><ul>',cats||'<li>Não selecionada</li>','</ul>',
      '<h2>Ocorrências para revisão</h2><table><thead><tr><th>Registro</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody>',
      list||'<tr><td colspan="3">Nenhuma ocorrência detectada pelos critérios utilizados</td></tr>','</tbody></table>',
      r.issues.length>80?'<p>Exibidas somente as primeiras 80 ocorrências.</p>':'',
      '<h2>Limitações</h2><div class="warning">Triagem exploratória: não é certificação, auditoria contábil nem ',
      'prova de fraude. O índice não mede lucro. Outliers por IQR (1,5 intervalo interquartil) exigem revisão humana.',
      ' Os registros completos não estão neste relatório.</div>',
      '<footer>Material demonstrativo V0.1. Para imprimir ou salvar como PDF use Ctrl+P.</footer></body></html>'
    ];
    const blob=new Blob([parts.join('')],{type:'text/html;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download='DELTA_RELATORIO_'+(loaded.demo?'DEMO':'LOCAL')+'.html';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  function downloadReport() {
    if(!loaded||!report)return;
    const clean={
      schema:VERSION,generated_utc:new Date().toISOString(),data_source:loaded.demo?"SYNTHETIC_DEMO":"CLIENT_SUPPLIED_LOCAL",
      source_file:loaded.demo?"dados_ficticios.csv":loaded.name,
      file_sha256:loaded.sha256,
      exported_raw_rows:false,personal_data_disclosed_in_report:false,
      methodology:{duplicate:"Linha integral identica apos trim",missing:"Celulas em branco",
        outliers:"1.5 * IQR nas colunas numericas interpretadas; exploratorio",
        quality:"100 * (1 - 0.70 * fracao_celulas_vazias - 0.20 * fracao_linhas_duplicadas - 0.10 * fracao_valores_invalidos)"},
      summary:Object.fromEntries(Object.entries(report).filter(([k])=>k!=="issues")),
      findings_by_row:report.issues.slice(0,500).map(x=>({row:x.row,type:x.type})),
      limitations:["Nao prova fraude, conformidade ou lucro","Hash nao atesta veracidade","Revisao humana necessaria"]
    };
    const blob=new Blob([JSON.stringify(clean,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download="DELTA_DIAGNOSTICO_"+(loaded.demo?"DEMO":"LOCAL")+".json";
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  }
  el("file").addEventListener("change",async ev=>{
    const file=ev.target.files[0];if(!file)return;
    if(file.size>MAX_BYTES){alert("O limite de importação é 2 MB.");ev.target.value="";return;}
    try{
      const bytes=await file.arrayBuffer();
      await loadCSV(file.name,new TextDecoder("utf-8",{fatal:true}).decode(bytes),bytes);
    }catch(e){alert("Importação cancelada: "+e.message);}
    ev.target.value="";
  });
  el("demo").addEventListener("click",async ()=>{
    try{
      const raw=demoSource();const bytes=new TextEncoder().encode(raw);
      await loadCSV("Dados fictícios — Loja Exemplo.csv",raw,bytes.buffer,true);
      el("auditoria").scrollIntoView({behavior:"smooth"});
    }catch(e){alert("Falha na demonstração: "+e.message);}
  });
  el("numeric").addEventListener("change",render);
  el("category").addEventListener("change",render);
  el("export").addEventListener("click",downloadReport);
  el("export-html").addEventListener("click",exportFriendly);
  el("copy-brief").addEventListener("click",async ()=>{
    const message="Gostaria de solicitar um orçamento para um painel de auditoria de dados CSV, com diagnóstico de duplicidades, valores ausentes e relatórios verificáveis. Preciso alinhar escopo, fonte dos dados, prazo, valor, privacidade e critérios de aceite.";
    try{
      await navigator.clipboard.writeText(message);el("copy-status").textContent="Texto copiado. Envie pelo canal comercial de sua preferência.";
    }catch(_){el("copy-status").textContent=message;}
  });
  window.DeltaInsightTest={parseCSV,parseNum,compute,demoSource}; // local deterministic test hook; no data exfiltration
})();