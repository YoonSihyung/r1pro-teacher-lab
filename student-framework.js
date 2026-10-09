"use strict";
(function(){
  const el=function(id){return document.getElementById(id);};
  const press=function(attr,value){document.querySelectorAll("["+attr+"]").forEach(function(b){b.setAttribute("aria-pressed",String(b.getAttribute(attr)===value));});};
  document.querySelectorAll("[data-scope]").forEach(function(button){button.addEventListener("click",function(){
    const local=button.dataset.scope==="local"; press("data-scope",button.dataset.scope);
    ["body-base","body-torso","body-left"].forEach(function(id){el(id).classList.toggle("held",local);});
    el("scope-label").textContent=local?"제어 범위 제한 · 예: 오른팔 7 + gripper 1":"전신 · 23차원 action";
    el("scope-title").textContent=local?"움직이지 않는 부위도 실제로 유지하고 관측합니다.":"모든 제어 부위의 상태·속도를 관측합니다.";
    el("scope-description").textContent=local?"이 예에서는 base·torso·왼팔을 hold controller가 유지하고 오른팔과 gripper만 학습합니다. Hold한 부위의 위치와 속도도 gate에서 검사합니다. 단순히 action 채널을 무시한다고 자세가 유지되지는 않습니다.":"Base의 목표 대비 위치·방향과 이동 속도, torso·양팔의 joint 위치/속도, gripper와 controller 상태를 포함합니다. 접근 코드도 이를 학습에서 다룬 범위로 준비합니다.";
    el("scope-extra").textContent=local?"선택 가능한 대안입니다. 도달 범위를 검증해 부족하면 torso 제어를 추가합니다. Teacher와 student를 동일한 mask로 학습하며, 이미 학습한 전신 teacher의 action을 임의로 잘라 distillation하지 않습니다.":"세계 좌표의 base 위치를 매번 똑같이 맞출 필요는 없습니다. 목표와의 상대 관계와 관측 가능한 로봇 상태를 맞춥니다. 전신 움직임에 따른 카메라 시점 변화도 학습에 포함합니다.";
  });});
  document.querySelectorAll("[data-view]").forEach(function(button){button.addEventListener("click",function(){
    const teacher=button.dataset.view==="teacher";press("data-view",button.dataset.view);
    el("privilege").hidden=!teacher;
    el("runtime-policy-label").textContent=teacher?"PRIVILEGED STATE TEACHER":"VISUAL STUDENT";
    el("runtime-policy-title").textContent=teacher?"정답 상태로 정밀 행동 학습":"정렬 → 잡기 / 놓기";
    el("runtime-policy-input").innerHTML=teacher?"정답 상태 + robot·goal<br>동일한 action 계약":"영상·proprio·goal·이력<br>추정값은 선택 입력";
    document.querySelector(".policy").classList.toggle("teacher",teacher);
    el("runtime-caption").textContent=teacher?"Teacher는 정답 상태를 보지만, 시작 상태는 센서 추정으로 동작한 코드·gate에서 나옵니다. 그래서 student 배포 때 생길 접근 오차를 teacher 학습에도 포함합니다. 학습용 정답 terminal과 실행용 센서 exit는 별개입니다.":"Student뿐 아니라 CODE·GATE·EXIT까지 실행 경로 전체가 deployable 관측만 사용합니다. Goal은 상위 요청과 센서에서 해석한 목표입니다. 정답 물체 world pose를 goal 필드에 숨겨 넣지 않습니다.";
  });});
  const cases={
    clear:{route:"GATE → STUDENT",title:"작은 잔여 오차는 student가 보며 보정합니다.",text:"로봇 자세·속도가 준비됐고 대상도 잘 보입니다. 추정 중심만 믿고 바로 닫지 않고, 마지막 상대 정렬을 영상 피드백으로 조정합니다.",rx:38,ry:28,x:307,y:139},
    noisy:{route:"GATE → 재관측 / 접근 후보 변경",title:"추정 중심이 맞아 보여도 바로 시작하지 않습니다.",text:"추정 품질이 검증 기준을 벗어나면 시점을 바꾸거나 다른 접근 후보를 선택합니다. Gate가 실제 오차를 확실히 안다는 뜻은 아닙니다. 잘못 통과한 사례를 수집해 기준과 policy 학습 범위를 함께 개선합니다.",rx:157,ry:76,x:423,y:144},
    hidden:{route:"GATE → TRACKING 복구",title:"대상이 가려졌다면 먼저 다시 봅니다.",text:"관측이 모호해 서로 다른 행동을 구분할 수 없다면, 같은 시작 pose를 만드는 것으로 해결되지 않습니다. 재관측·이력으로 정보를 확보합니다. 복구하지 못하면 재시도 제한에 따라 실패를 반환합니다.",rx:174,ry:82,x:337,y:147}
  };
  document.querySelectorAll("[data-case]").forEach(function(button){button.addEventListener("click",function(){
    const c=cases[button.dataset.case];press("data-case",button.dataset.case);
    el("case-route").textContent=c.route;el("case-title").textContent=c.title;el("case-description").textContent=c.text;
    el("estimate-area").setAttribute("rx",c.rx);el("estimate-area").setAttribute("ry",c.ry);
    el("actual-object").setAttribute("cx",c.x);el("actual-object").setAttribute("cy",c.y);
    el("actual-object").setAttribute("opacity",button.dataset.case==="hidden"?"0.25":"1");
  });});
})();
