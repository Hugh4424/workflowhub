import {readFileSync,writeFileSync,realpathSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const text=v=>typeof v==='string'&&v.trim().length>0;
const digest=b=>createHash('sha256').update(b).digest('hex');
// These are lexical markers, not a semantic entailment or permission classifier.
const terms=[
  ['否定',/并非|不能|不得|不证明|不等于|不代表|没有|禁止|无法|\b(?:not|never|no)\b/giu],
  ['限定',/仅|只限|只证明|只核|限定|局部|止于|\b(?:only|limited)\b/giu],
  ['未执行',/未执行|未测|未验证|尚未|没有执行|\b(?:unknown|untested|not[ _-](?:tested|run|executed|observed))\b/giu],
  ['不能证明',/不能证明|不证明|不代表|does not prove|cannot prove/giu],
  ['待补证',/待补证|待核|待验证|需补|\b(?:pending|incomplete|unavailable)\b/giu],
];
export function classifyTokens(value){return terms.flatMap(([term_class,pattern])=>{const tokens=[...new Set(value.match(pattern)??[])];return tokens.length?[{term_class,tokens}]:[];});}
export function validateOverride(value,ref,quote){
  return value&&typeof value==='object'&&!Array.isArray(value)&&['ref','quote','reason','signer','expires_if'].every(k=>text(value[k]))&&value.ref===ref&&value.quote===quote;
}
function locate(source,quote,lines){
  const list=source.split('\n');
  if(lines!==undefined){
    const m=typeof lines==='string'&&lines.match(/^([1-9]\d*):([1-9]\d*)$/);if(!m||+m[1]>+m[2]||+m[2]>list.length)return null;
    const window=list.slice(+m[1]-1,+m[2]).join('\n');
    const found=locate(window,quote);if(!found)return null;
    return {text:window,start_line:+m[1],end_line:+m[2],method:'lines'};
  }
  // Longest common substring; tied source windows are unresolved, never first-win.
  let previous=new Uint32Array(quote.length+1),best=0,ends=[];
  for(let i=0;i<source.length;i++){
    const row=new Uint32Array(quote.length+1);
    for(let j=0;j<quote.length;j++)if(source[i]===quote[j]){
      row[j+1]=previous[j]+1;
      if(row[j+1]>best){best=row[j+1];ends=[i+1];}else if(row[j+1]===best)ends.push(i+1);
    }
    previous=row;
  }
  if(!best||!/[\p{L}\p{N}]/u.test(source.slice(ends[0]-best,ends[0])))return null;
  let json=false;try{JSON.parse(source);json=true;}catch{/* Plain text keeps its complete sentence context. */}
  const boundary=at=>{
    if(/[\n。！？!?；;]/u.test(source[at]))return true;
    if(!json||source[at]!=='"')return false;
    let escapes=0;for(let i=at-1;i>=0&&source[i]==='\\';i--)escapes++;
    return escapes%2===0;
  };
  const windows=new Map();
  for(const end of ends){let a=end-best,b=end;while(a>0&&!boundary(a-1))a--;while(b<source.length&&!boundary(b))b++;if(b<source.length&&!/[\n"]/.test(source[b]))b++;
    windows.set(a+':'+b,{text:source.slice(a,b),start_line:source.slice(0,a).split('\n').length,end_line:source.slice(0,b).split('\n').length,method:'longest-common-substring'});
  }
  return windows.size===1?[...windows.values()][0]:null;
}
export function checkQuotes(source,quotes,{ref,override}={}){
  const reasons=[],matched=[],windows=[];
  quotes.forEach((entry,quote_index)=>{
    const quote=typeof entry==='string'?entry:entry.quote,lines=typeof entry==='string'?undefined:entry.lines;
    const window=locate(source,quote,lines);
    if(!window){reasons.push({code:'E_SOURCE_WINDOW_UNRESOLVED',quote_index,message:'来源窗口无法唯一定位；请提供准确 --lines 起行:止行，未知不作允许'});return;}
    windows.push({quote_index,start_line:window.start_line,end_line:window.end_line,method:window.method});
    const quoteClasses=new Set(classifyTokens(quote).map(t=>t.term_class));
    const missing=classifyTokens(window.text).filter(t=>!quoteClasses.has(t.term_class));
    if(override!==undefined&&!validateOverride(override,ref,quote)){reasons.push({code:'E_OVERRIDE_INVALID',quote_index,message:'覆盖记录须含非空五字段并绑定本原件ref与逐字引用句'});}
    if(missing.length&&!validateOverride(override,ref,quote))for(const item of missing){matched.push({...item,quote_index});reasons.push({code:'E_QUOTE_CLASS_OMITTED',quote_index,term_class:item.term_class,message:'引用缺少来源窗口的整类限定标记'});}
  });
  return {ok:!reasons.length,verdict:reasons.length?'阻断':'允许',reasons,matched,windows};
}
export function runCli(argv=process.argv.slice(2),{output=process.stdout}={}){
  try{
    const values={},flags=['--source','--quote','--quotes','--override','--out','--lines','--expect-source-sha256'];
    for(let i=0;i<argv.length;i++){const k=argv[i];if(!flags.includes(k)||values[k]!==undefined||!text(argv[i+1])||argv[i+1].startsWith('--'))throw Error('Unknown, duplicate or missing argument');values[k]=argv[++i];}
    if(!text(values['--source'])||Number(values['--quote']!==undefined)+Number(values['--quotes']!==undefined)!==1||values['--quotes']&&values['--lines'])throw Error('Use --source and exactly one of --quote / --quotes; batch entries carry their own lines');
    if(values['--expect-source-sha256']!==undefined&&!/^[a-f0-9]{64}$/i.test(values['--expect-source-sha256']))throw Error('Expected source sha256 must be a 64-digit digest');
    const bytes=readFileSync(values['--source']),source=bytes.toString('utf8');
    const quotes=values['--quotes']?JSON.parse(readFileSync(values['--quotes'],'utf8')):[{quote:values['--quote'],...(values['--lines']?{lines:values['--lines']}:{})}];
    if(!Array.isArray(quotes)||!quotes.length||quotes.some(q=>!(text(q)||q&&typeof q==='object'&&text(q.quote))))throw Error('Explicit quotations must be a nonempty array of strings or {quote,lines?}');
    const override=values['--override']?JSON.parse(readFileSync(values['--override'],'utf8')):undefined;
    const result=checkQuotes(source,quotes,{ref:values['--source'],override});
    result.source={ref:values['--source'],sha256:digest(bytes),bytes:bytes.length};
    if(values['--expect-source-sha256']&&result.source.sha256!==values['--expect-source-sha256'].toLowerCase()){
      result.ok=false;result.verdict='阻断';result.reasons.push({code:'E_SOURCE_HASH_MISMATCH',message:'原始来源字节与调用者提供的摘要不符'});
    }
    const serialized=JSON.stringify(result)+'\n';if(values['--out'])writeFileSync(values['--out'],serialized,{flag:'wx'});output.write(serialized);return result.ok?0:2;
  }catch(error){output.write(JSON.stringify({ok:false,verdict:'工具异常',reasons:[{code:'E_QUOTE_TOOL_ERROR',message:error.message}],matched:[]})+'\n');return 1;}
}
if(process.argv[1]&&realpathSync(process.argv[1])===fileURLToPath(import.meta.url))process.exitCode=runCli();
