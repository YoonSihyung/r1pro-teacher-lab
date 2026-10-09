'use strict';
const node=id=>document.getElementById(id);
const stages={
pick:[
['CODE / GoalResolver','어떤 물체를 어떤 손으로 잡을지 결정합니다.','대상 객체, 사용할 손, 형상에 맞는 grasp 기준점과 시작 규격을 선택합니다. Task 이름보다 대상·목표 역할을 실행기에 전달합니다.','대상이 존재하고 시작 후보가 도달 가능하며 접근 경로를 만들 수 있음','다른 후보·팔·경로 선택. 후보가 없으면 실패 반환.'],
['CODE / StartBuilder','물체 근처로 계획한 경로를 따라 접근합니다.','Base·torso와 반대 팔을 필요한 자세에 두고 pre-grasp 근처로 이동합니다. 마지막 접촉 직전은 아직 RL에 넘기지 않습니다.','접근 마지막 구간 도달 + 대상 상태가 유효함','경로·물체 pose를 다시 계산. 물체 이동 시 goal 갱신.'],
['CODE / StartBuilder','상대 pose와 정지 상태를 맞춥니다.','Grasp 기준점에 대한 손 pose를 맞추고 gripper를 엽니다. 감속하고 controller 목표를 동기화하며 실제 속도를 읽습니다.','위치·방향 오차, 속도와 robot 자세가 StartSpec 범위 내','감속·정렬을 계속하거나 다른 IK 후보로 재계획. 대기 상한 적용.'],
['GATE / ReadinessGate','조건이 유지됐을 때만 policy를 켭니다.','Pose·속도·gripper·도달 가능성·controller 조건을 동시에 검사합니다. 현재 실제 상태를 첫 관측으로 전달합니다.','모든 predicate가 검증한 stable window 동안 유지됨','표준화 단계로 반환. 제한 횟수 초과 시 실패.'],
['RL / π_pick · 학습 중 HIL','마지막 정렬과 잡기, 작은 lift를 실행합니다.','Privileged 상태와 goal로 정밀 행동을 만듭니다. 학습 중에는 사람이 막힌 구간의 행동을 교정하고 실제 실행 전이를 저장합니다.','올바른 물체 파지 + 작은 lift에서 안정성 확인','정밀 horizon 내 계속 시도. 학습 중 교정 가능 / 평가에서는 timeout 실패.'],
['EXIT / ExitChecker','닫힌 gripper보다 실제 파지를 확인합니다.','물체가 손을 따라 움직이고 안정적으로 유지되는지 검사합니다. 실제 물체↔손 transform과 종료 상태를 반환합니다.','Pick ExitSpec 만족 + 안정 유지','물체가 제자리에 있으면 새 접근 검토. 떨어지면 실제 상태에서 복구 판단.'],
['CODE / PostMove','실제 파지 자세에서 더 들고 이동합니다.','RL 종료 상태에서 다음 경로를 만들고 물체 유지를 감시합니다. 마무리가 완료되면 skill 성공을 반환합니다.','마무리 경로 완료 + 파지 유지 + 다음 동작 준비 완료','파지가 바뀌면 재관측·재계획. 실패를 place_on에 성공으로 넘기지 않음.']],
place:[
['CODE / GoalResolver','무엇을 어느 지지면에 놓을지 결정합니다.','잡고 있는 물체, 손, support와 placement goal을 읽습니다. 실제 pick 결과의 파지 transform으로 손목 시작 목표를 계산합니다.','올바른 파지 + 유효한 support·시작 후보','파지·목표 재확인. 가능한 후보가 없으면 실패.'],
['CODE / StartBuilder','물체를 유지하며 놓을 곳 근처로 이동합니다.','실제 물체↔손 자세로 이동 경로를 만들고 지지면 근처에서 감속합니다.','파지 유지 + 경로 완료 + support 상태 유효','파지 변화 시 목표 갱신. 막힌 경로는 재계획.'],
['CODE / StartBuilder','손목을 보정해 물체의 시작 pose를 맞춥니다.','Support에 대한 물체 pre-place pose를 맞추도록 손목 목표를 계산합니다. 흔들림·속도를 낮추고 controller 목표를 동기화합니다.','물체 상대 pose·속도·파지 조건이 StartSpec 범위 내','감속·정렬·파지 재확인. 불가능한 pose는 후보 변경.'],
['GATE / ReadinessGate','놓기 policy가 받을 조건을 검사합니다.','물체 pose, 안정적 파지, 낮은 속도, robot·controller 조건이 유지되면 π_place_on을 켭니다.','모든 시작 predicate가 stable window 동안 유지됨','표준화 단계로 반환하거나 제한 횟수 내 재계획.'],
['RL / π_place_on · 학습 중 HIL','접촉·해제·안정적으로 놓기를 수행합니다.','물체를 내려놓고 gripper를 해제합니다. 필요하면 물체를 흐트러뜨리지 않는 짧은 손 빼기까지 학습합니다.','해제 후 올바른 support에 안정적으로 남고 손의 간섭이 줄어듦','Horizon 내 시도 / 학습 중 국소 교정. 상태가 바뀌면 복구 판단.'],
['EXIT / ExitChecker','해제 후 물체가 안정적인지 확인합니다.','순간 접촉만으로 성공 판정하지 않습니다. Grasp 해제, 지지면 위 안정, 후퇴 가능한 상태를 확인합니다.','Place_on ExitSpec 만족 + 안정 유지','흔들리면 정밀 동작 유지. 떨어짐·잘못된 지지면·timeout은 실패.'],
['CODE / PostMove','실제 종료 손 pose에서 후퇴합니다.','현재 상태에서 경로를 계산하고 물체 안정을 감시합니다. 긴 후퇴를 완료하고 결과를 반환합니다.','후퇴 완료 + 놓인 물체의 안정 유지','후퇴 중 물체를 건드렸다면 전체 성공으로 계산하지 않고 재판정.']]
};
let selectedSkill='pick',selectedStage=0;
function render(){const s=stages[selectedSkill][selectedStage];document.querySelectorAll('[data-skill]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.skill===selectedSkill)));document.querySelectorAll('[data-stage]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.stage)===selectedStage)));['execution-owner','execution-title','execution-description','execution-condition','execution-failure'].forEach((id,i)=>node(id).textContent=s[i]);node('execution-count').textContent=(selectedSkill==='pick'?'Pick':'Place_on')+' · '+(selectedStage+1)+' / 7';node('previous-stage').disabled=selectedStage===0;node('next-stage').disabled=selectedStage===6;}
document.querySelectorAll('[data-skill]').forEach(b=>b.addEventListener('click',()=>{selectedSkill=b.dataset.skill;render();}));
document.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>{selectedStage=Number(b.dataset.stage);render();}));
node('previous-stage').addEventListener('click',()=>{if(selectedStage>0){selectedStage--;render();}});node('next-stage').addEventListener('click',()=>{if(selectedStage<6){selectedStage++;render();}});
const readiness={moving:['START_BUILDER → 감속·대기','Pose가 맞아도 속도가 높으면 policy를 켜지 않습니다. 감속하고 관측한 상태를 다시 확인합니다.'],unreachable:['GOAL_RESOLVER → 후보 변경·재계획','충돌 없이 만들 수 없다면 같은 pose를 강제하지 않습니다. 다른 grasp·placement 후보나 IK 해를 선택해 다시 준비합니다.'],ready:['READINESS_GATE → LOCAL POLICY','조건이 검증한 시간 동안 유지되면 현재 실제 관측을 policy에 전달합니다. 데모 snapshot으로 순간이동하지 않습니다.']};
document.querySelectorAll('[data-readiness]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-readiness]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));const r=readiness[b.dataset.readiness];node('readiness-route').textContent=r[0];node('readiness-description').textContent=r[1];}));render();
