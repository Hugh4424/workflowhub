'use strict';
const SCENARIOS=new Set(['success','empty','error','permission','partial','unknown']);
const C11_STATES=new Set(['unselected','ready','pending','success','duplicate','empty','error','permission','partial','unknown','recovered']);
function initialState(){return {phase:'unselected',id:null,name:null,version:null,attempt:0,scenario:null};}
function transition(state,action){
  const blocked=['pending','unknown','partial'].includes(state.phase);
  if(action.type==='select' && !blocked && typeof action.id==='string' && action.id && typeof action.name==='string' && action.name && typeof action.version==='string' && action.version) return {phase:'ready',id:action.id,name:action.name,version:action.version,attempt:0,scenario:null};
  if(action.type==='reset' && !blocked) return initialState();
  if(action.type==='submit' && !blocked && state.id){
    if(state.phase==='success' && action.scenario==='duplicate') return {...state,phase:'duplicate'};
    if(state.phase!=='ready' || !SCENARIOS.has(action.scenario)) return state;
    return {...state,phase:'pending',attempt:state.attempt+1,scenario:action.scenario};
  }
  if(action.type==='resolve' && state.phase==='pending') return {...state,phase:state.scenario};
  if(action.type==='recover' && ['unknown','partial'].includes(state.phase)) return {...state,phase:'recovered'};
  return state;
}
// 数据→选项纯函数：只读传入数据，不读 DOM、网络或存储；同一输入恒得同一结果。
// 返回 {ok,reason,options}；四种坏数据各有互不相同的原因，且都不产出可选项。
function C11_queryOptions(data){
  if(data===null||data===undefined) return {ok:false,reason:'没有查询数据文件：页面没有载入经验候选数据。',options:[]};
  if(typeof data!=='object') return {ok:false,reason:'查询数据格式坏：数据不是对象，页面不能生成候选。',options:[]};
  if(!Array.isArray(data.samples)) return {ok:false,reason:'查询数据格式坏：samples 不是数组，页面不能生成候选。',options:[]};
  if(data.samples.length===0) return {ok:false,reason:'查询数据为空：这次查询没有返回任何经验候选。',options:[]};
  const options=[];
  for(let i=0;i<data.samples.length;i+=1){
    const item=data.samples[i];
    if(!item || typeof item!=='object' || typeof item.id!=='string' || !item.id){
      return {ok:false,reason:'查询数据缺标识：第 '+(i+1)+' 条记录没有候选标识，页面不生成候选。',options:[]};
    }
    if(typeof item.name!=='string' || !item.name){
      return {ok:false,reason:'查询数据缺名称：第 '+(i+1)+' 条记录没有可显示名称，页面不生成候选。',options:[]};
    }
    const kind=typeof item.kind==='string'?item.kind:'';
    const location=typeof item.source_location==='string'?item.source_location:'';
    options.push({
      id:item.id,
      name:item.name,
      kind:kind,
      source_file:typeof item.source_file==='string'?item.source_file:'',
      source_location:location,
      community:typeof item.community==='string'?item.community:'',
      summary:typeof item.summary==='string'&&item.summary?item.summary:item.name,
      yaml_text:typeof item.yaml_text==='string'?item.yaml_text:'',
      canonical_content:item.canonical_content===undefined?null:item.canonical_content,
      version:(kind||'经验候选')+(location?' '+location:''),
    });
  }
  return {ok:true,reason:'',options:options};
}
if(typeof window!=='undefined') window.C11_queryOptions=C11_queryOptions;
if(typeof module!=='undefined' && module.exports) module.exports={initialState,transition,C11_queryOptions};
if(typeof document!=='undefined'){
  let state=initialState();
  const $=id=>document.getElementById(id);
  const result=$('demo-result'), pick=$('demo-use-sample'), send=$('demo-confirm'), recover=$('demo-recover'), reset=$('demo-reset'), scenario=$('demo-scenario');
  const optionRoot=$('sample-options'), liveRegion=$('sample-announcement'), title=$('sample-title'), version=$('sample-version'), versionId=$('sample-version-id'), description=$('sample-description'), yamlCode=document.querySelector('#yaml-content code'), canonicalCode=document.querySelector('#canonical-content code'), ruleFields=$('rule-fields');
  const labels={unselected:'请选择并使用一条经验候选。',ready:'候选已选。核对来源后可确认。',pending:'候选正在处理，请稍候。',success:'确认完成。没有发送请求，也没有保存快照。',duplicate:'重复确认沿用同一次选择。没有新增保存。',empty:'没有可显示的结果。真实目录未读取。',error:'处理失败。这是本地构造的结果，不是服务返回。',permission:'操作被拒绝。这不是实际权限判定。',partial:'结果部分可见，读回未完成。请继续核对。',unknown:'结果未知。请保留本次选择并继续核对。',recovered:'已完成本地核对。未发生服务端读回或保存。'};
  const rawData=(typeof window!=='undefined')?window.C11_QUERY_DATA:undefined;
  const loadError=(typeof window!=='undefined' && typeof window.C11_QUERY_DATA_ERROR==='string')?window.C11_QUERY_DATA_ERROR:'';
  const built=C11_queryOptions(rawData===undefined?null:rawData);
  const reason=built.ok?'':(loadError||built.reason);
  // 「哪条被选中」只有一个来源 selectedId：列表高亮、详情区、选择动作都读它。
  let selectedId=built.ok?built.options[0].id:null;
  let announcedPhase=null;
  function optionById(id){
    if(!built.ok) return null;
    return built.options.find(item=>item.id===id)||null;
  }
  function currentOption(){return optionById(selectedId);}
  function renderOptions(){
    optionRoot.replaceChildren();
    built.options.forEach(item=>{
      const label=document.createElement('label');
      label.className='sample-option';
      const input=document.createElement('input');
      input.type='radio'; input.name='local-sample'; input.value=item.id; input.checked=item.id===selectedId;
      const body=document.createElement('span');
      const sampleName=document.createElement('strong'); sampleName.textContent=item.name;
      const sampleKind=document.createElement('span'); sampleKind.className='sample-version'; sampleKind.textContent=(item.kind||'经验候选')+(item.source_location?' · '+item.source_location:'');
      const summary=document.createElement('p'); summary.className='sample-summary'; summary.textContent=item.summary;
      body.append(sampleName,sampleKind,summary);
      label.append(input,body);
      optionRoot.append(label);
    });
  }
  function renderDetails(){
    const item=currentOption();
    ruleFields.replaceChildren();
    if(!item){
      title.textContent=built.ok?'尚未选择候选':(reason||'没有可用的经验候选');
      description.textContent=built.ok?'从上方列表选择一条经验候选。':(reason||'');
      version.textContent='未载入';
      versionId.textContent='未载入';
      yamlCode.textContent='';
      canonicalCode.textContent='';
      return;
    }
    title.textContent=item.name;
    description.textContent=item.summary;
    version.textContent=item.kind||'未载入';
    versionId.textContent=item.id;
    const fields=[['类型',item.kind||'未载入'],['来源文件',item.source_file||'未载入'],['位置',item.source_location||'未标注'],['社区',item.community||'未标注'],['候选标识',item.id]];
    fields.forEach(field=>{
      const row=document.createElement('div');
      const dt=document.createElement('dt'); dt.textContent=field[0];
      const dd=document.createElement('dd'); dd.textContent=field[1];
      row.append(dt,dd); ruleFields.append(row);
    });
    yamlCode.textContent=item.yaml_text||'';
    canonicalCode.textContent=item.canonical_content?JSON.stringify(item.canonical_content,null,2):'';
  }
  // 列表高亮与详情区都从这里刷新，避免两处各自判断选中项。
  function syncSelection(){
    document.querySelectorAll('input[name="local-sample"]').forEach(el=>{el.checked=selectedId!==null && el.value===selectedId;});
    renderDetails();
  }
  function selectCandidate(id,announceChange){
    selectedId=(built.ok && optionById(id))?id:null;
    syncSelection();
    if(announceChange) announce(currentOption());
  }
  function render(){
    const locked=['pending','unknown','partial'].includes(state.phase);
    $('demo-confirm-panel').setAttribute('aria-busy',String(state.phase==='pending'));
    result.textContent=labels[state.phase]; result.dataset.state=state.phase;
    const preview=state.id?null:currentOption();
    const identity=state.id?(state.name+' · '+state.version):(preview?preview.name+'（预览，未选用）':'尚未选择候选');
    $('demo-confirm-identity').textContent=identity; $('demo-result-identity').textContent=identity;
    pick.disabled=!built.ok||locked||!selectedId; scenario.disabled=locked || state.phase!=='ready';
    send.disabled=!(state.phase==='ready'||state.phase==='success');
    send.textContent=state.phase==='success'?'再次确认候选':'确认候选';
    recover.hidden=!['unknown','partial'].includes(state.phase); reset.disabled=locked;
    document.querySelectorAll('input[name="local-sample"]').forEach(el=>{el.disabled=locked;});
    if(state.phase!==announcedPhase){announcedPhase=state.phase;liveRegion.textContent=labels[state.phase];}
  }
  function announce(item){
    liveRegion.textContent=item
      ? '经验候选已切换：'+item.name+'，'+item.kind+'，来源 '+item.source_file+(item.source_location?' '+item.source_location:'')+'。'
      : (built.ok?'尚未选择候选。':(reason||'没有可用的经验候选。'));
  }
  if(built.ok){
    renderOptions();
    syncSelection();
    liveRegion.textContent='经验候选已准备：'+built.options.length+' 条，来自查询数据文件。';
  }else{
    optionRoot.replaceChildren();
    renderDetails();
    liveRegion.textContent=reason;
  }
  pick.addEventListener('click',()=>{
    if(!built.ok){result.textContent=reason;return;}
    const option=optionById(selectedId);
    if(!option){result.textContent='尚未选择经验候选，请先在列表中选择一条。';return;}
    state=transition(state,{type:'select',id:option.id,name:option.name,version:option.version});render();
  });
  send.addEventListener('click',()=>{
    state=transition(state,{type:'submit',scenario:state.phase==='success'?'duplicate':scenario.value});render();
    if(state.phase==='pending') setTimeout(()=>{state=transition(state,{type:'resolve'});render();},150);
  });
  recover.addEventListener('click',()=>{state=transition(state,{type:'recover'});render();});
  reset.addEventListener('click',()=>{
    state=transition(state,{type:'reset'});
    selectCandidate(null,false);
    render();
    announce(currentOption());
  });
  document.querySelectorAll('input[name="local-sample"]').forEach(el=>el.addEventListener('change',()=>{
    if(!['pending','unknown','partial'].includes(state.phase)){
      selectCandidate(el.value,false);
      state=initialState();
      render();
      announce(currentOption());
    }
  }));
  // 只读 URL 状态入口（给 P3 重载后复现状态）：只按 ?state=<状态名> 驱动既有状态机，
  // 不承载业务数据；业务数据仍只来自查询数据文件；无该参数时保持默认打开行为。
  function urlStateName(){
    if(typeof location==='undefined'||!location.search) return null;
    const name=new URLSearchParams(location.search).get('state');
    return name&&C11_STATES.has(name)?name:null;
  }
  function driveUrlState(name){
    if(!built.ok||!name||name==='unselected') return;
    const first=built.options[0];
    state=transition(state,{type:'select',id:first.id,name:first.name,version:first.version});
    if(name==='ready') return;
    if(name==='pending'){state=transition(state,{type:'submit',scenario:'success'});return;}
    const scenarioFor={success:'success',duplicate:'success',empty:'empty',error:'error',permission:'permission',partial:'partial',unknown:'unknown',recovered:'partial'}[name];
    state=transition(state,{type:'submit',scenario:scenarioFor});
    state=transition(state,{type:'resolve'});
    if(name==='duplicate') state=transition(state,{type:'submit',scenario:'duplicate'});
    if(name==='recovered') state=transition(state,{type:'recover'});
  }
  driveUrlState(urlStateName());
  announcedPhase=state.phase;
  render();
}
