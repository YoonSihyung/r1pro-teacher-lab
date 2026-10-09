'use strict';
const el=id=>document.getElementById(id);
function updateState(){
 const skill=el('skill-select').value,reset=document.querySelector('input[name="reset"]:checked').value,result=el('rollout-result').value,p=Number(el('rollout-progress').value)/100;
 const place=skill==='place',valid=reset==='snapshot'||(!place&&reset==='full');
 let x=place?220:165,y=place?90:199,held=place,ontop=false,success=false;
 if(!valid){x=165;y=reset==='broken'?269:199;held=false;}
 else if(place){
  const destination=result==='wrong'?165:425;
  x=220+(destination-220)*Math.min(1,p/0.8);y=90+109*Math.min(1,p/0.8);held=p<0.88;
  if(p>=0.88){if(result==='drop'){x=295;y=269;}ontop=result==='correct';success=ontop&&!held;}
 }else{
  held=p>=0.3;x=165;y=199-100*Math.max(0,(p-0.3)/0.7);
  if(result==='drop'&&p>=0.75){held=false;y=269;x=270;}
  success=held;
 }
 let gx=x,gy=y-22;
 if(!valid){gx=220;gy=65;}
 else if(place&&!held){gy=110;gx=x+45;}
 else if(!place&&!held){gx=165;gy=55+122*Math.min(1,p/0.3);if(result==='drop'&&p>=0.75){gx=260;gy=100;}}
 el('object-marker').setAttribute('transform','translate('+x+' '+y+')');
 const spread=held?23:35;
 el('gripper-jaws').setAttribute('d','M'+(gx-spread)+' '+(gy-25)+' H'+(gx+spread)+' M'+(gx-spread)+' '+(gy-25)+' V'+(gy+35)+' M'+(gx+spread)+' '+(gy-25)+' V'+(gy+35));
 el('eef-point').setAttribute('cx',gx);el('eef-point').setAttribute('cy',gy-25);
 el('gripper-text').setAttribute('x',Math.max(20,gx-40));el('gripper-text').setAttribute('y',Math.max(20,gy-42));
 el('grasp-label').setAttribute('x',Math.min(440,x+35));el('grasp-label').setAttribute('y',y);el('grasp-label').textContent=held?'grasp 유효':'';
 el('state-path').setAttribute('d',place?'M220 90 Q330 70 425 199':'M165 199 V99');
 el('progress-label').textContent=Math.round(p*100)+'%';
 el('state-title').textContent=(place?'place_on':'pick')+(p===0?' 시작 상태':' 실행 중 / 결과 상태');
 const pre=el('precondition');pre.classList.toggle('invalid',!valid);
 pre.textContent=valid?(place?'시작 전제조건 충족: 지정한 물체를 잡은 상태입니다.':'시작 전제조건 충족: 대상 물체가 지지면 위에 있고, 아직 잡지 않았습니다.'):(reset==='broken'?'복원 실패 예: 손 위치가 맞아도 grasp 관계가 없어 물체가 떨어졌습니다. RL episode 시작 전에 복원을 점검합니다.':'place_on 전제조건 미충족: 아직 물체를 잡지 않았습니다. 전체 시작 상태에서는 pick까지 먼저 해결해야 합니다.');
 el('rollout-progress').disabled=!valid;el('to-end').disabled=!valid;el('rollout-result').disabled=!valid;
 const set=(id,text,yes)=>{el(id).textContent=text;el(id).className=yes?'yes':'no';};
 set('grasp-value',held?'참':'거짓',held);set('ontop-value',ontop?'참':'거짓',ontop);set('success-value',success?'성공':'아직 아님',success);
 el('state-explanation').textContent=!valid?'이 상태는 선택한 skill의 정상 시작 상태가 아닙니다. 그림의 진행을 멈추고 reset 문제를 먼저 해결합니다.':success?(place?'지정한 지지면 위에 물체가 있고 grasp가 해제되었습니다. 이 개념도의 place_on 성공 조건을 만족합니다.':'목표 물체를 실제로 잡았습니다. 이 개념도의 pick 성공 조건을 만족합니다.'):(place?(held?'물체를 손에 든 채 이동 중입니다. 목표 근처에 있다는 것만으로 놓기 완료는 아닙니다.':result==='wrong'?'물체는 놓았지만 다른 지지면입니다. 지정한 목표 조건은 거짓입니다.':'물체를 떨어뜨렸습니다. grasp 해제만으로는 place_on 성공이 아닙니다.'):'손이 물체에 접근 중이거나 grasp에 실패했습니다. 대상 물체를 실제로 잡았는지 검사합니다.');
 // Other support is a placement-only example.
 el('rollout-result').options[1].disabled=!place;
}
function backToStart(){el('rollout-progress').value='0';updateState();}
el('skill-select').addEventListener('change',()=>{el('rollout-result').value='correct';backToStart();});
document.querySelectorAll('input[name="reset"]').forEach(input=>input.addEventListener('change',backToStart));
el('rollout-progress').addEventListener('input',updateState);el('rollout-result').addEventListener('change',updateState);
el('to-end').addEventListener('click',()=>{el('rollout-progress').value='100';updateState();});
el('reset-demo').addEventListener('click',backToStart);updateState();
