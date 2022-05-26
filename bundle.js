const k=/\{{(.*?)}}/g,f=/{{\/(?<block_close>.*?)}}|{{#else}}|{{#(?<block_start>.*?) (?<block_value>.*?)}}/gms;function u(r){const t=[];let e=r,i,s=0;for(;(i=k.exec(e))!=null&&i;){const o=i.index,d=i.index+i[0].length,c={type:"var",content:i[0],var:i[1],index:o,index_end:s+d},n=e.substring(0,c.index);k.test(n)?t.push({title:"before_block",content:u(n),type:"list",index:s,index_end:s+n.length}):t.push({title:"before_block",content:n,type:"string",index:s,index_end:s+n.length}),c.index=s+o,t.push(c),s=d+s,e=e.substring(d)||""}return t.sort((o,d)=>o.index-d.index),t.push({title:"before_block",content:e,type:"string",index:s,index_end:s+e?.length}),t}function y(r){const t=[],e=[];let i,s=[];function o(c,n){const a={index:n.index,length:n[0].length,type:c,condition:n.groups?.block_value};e.push(a)}const d=r.matchAll(new RegExp(f,"g"));for(const c of d){const n=c.groups?.block_start?c.groups?.block_start:c.groups?.block_close?"ifclose":"else";switch(n){case"if":i?s.push(c):(i=c,o(n,c));break;case"elseif":s.length==0&&o(n,c);break;case"else":s.length==0&&o(n,c);break;case"ifclose":s.length==0?o(n,c):s.pop();break;default:break}}if(e.sort((c,n)=>c.index-n.index),e.length==2&&e[0].type=="if"&&e[1].type=="ifclose"){const c=r.substring(e[0].index+e[0].length,e[1].index).trim();return t.push({type:"if",condition:new Function("data",`return !!(${e[0].condition})`)??void 0,content:h(c),str_condition:e[0].condition}),t}s=[];for(const c of e)switch(c.type){case"if":s.length==0&&s.push(c);break;case"elseif":if(s.length==1){const n=s.pop();if(n){const l=r.substring(n.index+n.length,c.index).trim();t.push({type:n.type,condition:new Function("data",`return !!(${n.condition})`)??void 0,content:h(l),str_condition:n.condition})}}s.push(c);break;case"else":if(s.length==1){const n=s.pop();if(n){const l=r.substring(n.index+n.length,c.index).trim();t.push({type:n.type,condition:n.condition?new Function("data",`return !!(${n.condition})`):void 0,content:h(l),str_condition:n.condition})}s.push(c)}break;case"ifclose":if(s.length==1){const n=s.pop();if(n){const l=n.type=="if"?r.substring(n.index+n.length,c.index+c.length):r.substring(n.index+n.length,c.index).trim();t.push({type:n.type,condition:n.condition?new Function("data",`return !!(${n.condition})`):void 0,content:h(l),str_condition:n.condition})}}break;default:break}return t}function h(r){const t=[],e=[];let i=r;const s=r.matchAll(new RegExp(f,"g"));let o,d,c=[];for(const l of s){const a=l.groups;if(a?.block_start&&!o){o=l;continue}if(a?.block_start&&a?.block_start!=="elseif"){c.push(l);continue}if(a?.block_close&&c.length>0){c.pop();continue}if(a?.block_close&&o&&c.length==0){d=l;continue}}if(o&&d)switch(o.groups?.block_start){case"if":{const l=r.substring(o?.index,d?.index+d.length+o?.length);t.push({block_start:o.groups?.block_start,block_value:o.groups?.block_startblock_value,block_content:y(l),index:o?.index,index_end:d?.index+d.length+o?.length});break}case"each":{const l=r.substring(o?.index+o[0].length,d.index);t.push({block_start:o.groups?.block_start,block_value:o.groups?.block_value,block_content:h(l),index:o?.index,index_end:d.index+d?.length+o[0].length})}}for(let l=0;l<t.length;l++){const a=t[l],m=i.substring(0,a.index);if(e.push({title:"before_var",content:u(m),type:"list"}),e.push({title:"block",content:a,type:a.block_start=="each"?"each":"block"}),i=i.substring(a.index_end-1),f.test(i)){e.push({title:"block",content:h(i),type:"item"});continue}l===t.length-1&&e.push({title:"after_var",content:u(i),type:"list"})}return t.length===0&&e.push({title:"content",content:u(i),type:"list"}),{title:"list",childs:e,type:"items"}}const w=/[&<>'"]/g,b={};function _(r,t){b[r]=t}const v={"<":"&lt;",">":"&gt;","&":"&amp;","'":"&#39;",'"':"&#34;"};function E(r){let t="",e=r,i;for(;i=w.exec(e);)t+=e.slice(0,i.index),t+=v[i[0]],e=e.slice(i.index+1);return t+e}const g={escape:!0};class S{options;compiled;data;render_cache;constructor(t,e=g){this.template=t,this.options=g,this.render_cache={},this.options=e,this.compiled=typeof t=="string"?h(t):t}stringCache(t){const e=t.split(" "),i=e[0],s=e[1];return this.render_cache[t]=b[i]?()=>b[i](this.data[s]):()=>{const o=this.data[t];return this.options.escape&&typeof o=="string"?E(o):o}}renderString(t){return this.render_cache[t.var]?.()??this.stringCache(t.var)()}renderBlock(t){switch(t.block_start){case"if":{for(let e=0;e<t.block_content.length;e++){const i=t.block_content[e];switch(i.condition){case void 0:return this.render(i.content);default:if(i.condition.apply(this.data))return this.render(i.content);break}}return""}default:throw new Error("Unknown block type: "+t.block_start)}}renderForeach(t){let e="";const i=this.data,s=t.block_value=="this"?this.data:this.data[t.block_value];for(let o=0;o<s.length;o++)this.data=s[o],e+=this.render(t.block_content);return this.data=i,e}render(t){let e="";switch(t.type){case"block":e+=this.renderBlock(t.content);break;case"each":e+=this.renderForeach(t.content);break;case"string":e+=t.content;break;case"var":e+=this.renderString(t);break;case"list":for(const i of t.content)e+=this.render(i);break;case"items":for(const i of t.childs)e+=this.render(i);break;case"item":e+=this.render(t.content);break;default:e+=t.content;break}return e}start(t){return this.data=t,this.render(this.compiled)}template}function x(r,t=g){const e=new S(r,t);return e.start.bind(e)}const p=new Map;function I(r,t,e){if(p.has(r))return p.get(r)(t);const i=x(e);return p.set(r,i),i(t)}_("JSON",r=>JSON.stringify(r));_("raw",r=>r);export{I as renderTemplate,x as compile,_ as registerHelper};
