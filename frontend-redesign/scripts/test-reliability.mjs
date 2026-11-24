/** Framework-free regression tests. Hook harness checks state/effect logic, not React scheduling. */
import assert from 'node:assert/strict';
import { evaluateTypescript } from './test-loader.mjs';
const {resolveScopeStatus}=evaluateTypescript(new URL('../src/app/scope.ts',import.meta.url),{context:{exports:{}},exports:['resolveScopeStatus']});
const partners=[{code:'DN'}];
assert.equal(resolveScopeStatus('admin','DN','loading',null),'loading');
assert.equal(resolveScopeStatus('admin','DN','error',null),'error');
assert.equal(resolveScopeStatus('admin','REMOVED','ready',partners),'loading');
assert.equal(resolveScopeStatus('admin','DN','ready',partners),'ready');
assert.equal(resolveScopeStatus('admin',null,'ready',partners),'ready');
assert.equal(resolveScopeStatus('partner',null,'loading',null),'ready');
console.log('PASS  Scope discovery gates every admin scope including removed saved codes');

// Deterministic fake hook runner: rerender until render-phase updates settle;
// execute effect cleanup before the next effect. Network promises resolve on demand.
const slots=[];let cursor=0,changed=false,effects=[],requests=[];
const equalDeps=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
const hooks={
 useState(initial){const i=cursor++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return [slots[i],next=>{const v=typeof next==='function'?next(slots[i]):next;if(!Object.is(v,slots[i])){slots[i]=v;changed=true;}}];},
 useCallback(fn,deps){const i=cursor++;if(!slots[i]||!equalDeps(slots[i].deps,deps))slots[i]={deps,fn};return slots[i].fn;},
 useEffect(fn,deps){const i=cursor++;if(!slots[i]||!equalDeps(slots[i].deps,deps))effects.push(()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};});},
};
const {useResource}=evaluateTypescript(new URL('../src/services/useResource.ts',import.meta.url),{context:{exports:{},AbortController,Error},imports:{react:hooks,'./api':{api:(path,{signal})=>new Promise((resolve,reject)=>requests.push({path,signal,resolve,reject}))}},exports:['useResource']});
function render(path){let result;for(let n=0;n<20;n++){cursor=0;changed=false;effects=[];result=useResource(path,{clearWhenDisabled:true});if(changed)continue;const pending=effects;effects=[];pending.forEach(run=>run());if(!changed)return result;}throw Error('render did not settle');}
const settle=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
assert.equal(render('/A').state,'loading');const a=requests.at(-1);a.resolve({id:'A-old'});await settle();assert.equal(render('/A').data.id,'A-old');
const retry=render('/A').retry;retry();assert.equal(render('/A').refreshing,true);assert.equal(render('/A').retry,retry);const refresh=requests.at(-1);refresh.reject(new Error('offline'));await settle();const failed=render('/A');assert.equal(failed.data.id,'A-old');assert.match(failed.refreshError,/offline/);
assert.equal(render('/B').state,'loading');const b=requests.at(-1);assert.equal(render('/A').state,'loading');assert.equal(b.signal.aborted,true);const newA=requests.at(-1);b.resolve({id:'B-late'});await settle();assert.equal(render('/A').state,'loading');newA.resolve({id:'A-new'});await settle();assert.equal(render('/A').data.id,'A-new');assert.equal(render(null).state,'loading');assert.equal(render('/A').state,'loading');
console.log('PASS  Same-query retry retains data; A→B→A and disabled→enabled never reuse stale snapshots');
