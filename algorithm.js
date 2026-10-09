"use strict";
(function(){
const el=function(id){return document.getElementById(id);},ns="http://www.w3.org/2000/svg";
function node(id,owner,file,title,sub,x,y,kind,body,input,output,next){return{id:id,owner:owner,file:file,title:title,sub:sub,x:x,y:y,kind:kind||"runtime",body:body,input:input,output:output,next:next};}
function decision(id,owner,file,title,x,y,body,input,output,next){return node(id,owner,file,title,"",x,y,"decision",body,input,output,next);}
function edge(from,to,path,label,x,y,kind){return{from:from,to:to,path:path,label:label||"",x:x,y:y,kind:kind||"control"};}
const graphs={
deploy:{
 title:"Student 배포: 준비하고, 보면서 조작하고, 확인합니다.",
 caption:"왼쪽 열에서 시작해 화살표를 따라갑니다. 가운데는 영상 기반 조작 반복, 오른쪽은 성공 확인과 마무리입니다.",
 columns:["코드로 시작 준비","Student의 정밀 제어","센서로 확인 · 마무리"],
 boundary:"배포 경로 전체가 센서 관측을 사용합니다. Base·torso·반대 팔은 정밀 구간에서 유지하고, 학생 policy가 마지막 정렬부터 잡기/놓기를 담당합니다.",
 nodes:[
 node("entry",["executor"],"pick_up_from.py / place_on.py","Skill 요청 → 실행기","executor.py가 공통 단계 관리",80,110,"runtime","기존 skill 진입점이 target·support·사용할 팔을 전달합니다. 공통 executor를 시작하고 해당 student checkpoint를 선택합니다.","상위 skill 요청 · 배포 manifest","SkillSpec · 공통 실행기 · 초기 상태","observe.py로 센서 관측을 받습니다."),
 node("observe",["observe"],"observe.py","센서 관측 · 대상 추정","RGB / proprio / tracking / 이력",80,240,"runtime","기존 관측 adapter와 perception을 호출합니다. 대상과 손의 관계, 로봇 상태, 관측 품질을 공통 관측으로 묶습니다.","실기 센서 · 사용 가능한 goal","SkillObservation · student용 센서 입력","code_motion.py가 추정된 목표를 기준으로 접근합니다."),
 node("prepare",["motion"],"code_motion.py","접근 · 전신 자세 준비","Base · torso · 팔 / 감속",80,370,"runtime","팔이 정렬·파지·lift를 수행할 여유가 있는 자세를 만듭니다. 물체의 정확한 위치를 보장하는 것이 아니라 추정 목표 주변으로 접근합니다.","추정 대상/지지면 · 로봇 상태 · SkillSpec","접근 명령 · 준비 상태 보고","시작 조건을 검사합니다. 접근·감속 중 관측은 계속 갱신합니다."),
 decision("ready",["motion","executor"],"code_motion.py + executor.py","시작 준비됨?",80,480,"코드 이동 파일이 자세·속도·도달 가능성·관측 품질을 검사하고 실행기가 전환합니다. 정답 pose 일치를 요구하지 않습니다.","센서 관측 · 시작 규격","READY 또는 재관측/재계획 요청","예: policy 시작. 아니오: 관측·준비 반복. 제한 초과: 실패."),
 node("policy",["policy"],"policy.py","Student 행동 계산","마지막 정렬 · 잡기 / 놓기",440,110,"runtime","영상·proprio·goal·이력으로 사용하는 팔과 gripper의 행동을 생성합니다. 정확한 물체 수치를 몰라도 관측 가능한 잔여 오차를 보정하도록 학습합니다.","Student 센서 입력 · checkpoint","PolicyAction","executor가 같은 action 규격으로 명령을 전송합니다."),
 node("command",["executor"],"executor.py + robot adapter","명령 전송 · 로봇 step","팔 명령 + 나머지 부위 hold",440,240,"runtime","실행기가 제한·정규화·단위 변환을 적용한 뒤 공통 adapter로 명령을 보냅니다. 사용하지 않는 부위는 실제 hold controller로 유지합니다.","PolicyAction · 현재 로봇/controller 상태","실제 전송 명령 · 갱신된 센서","observe.py가 다음 관측을 정리합니다."),
 node("nextobs",["observe"],"observe.py","다음 관측 · 상태 추정","파지 / 놓기 · 관측 품질",440,370,"runtime","로봇이 움직인 뒤 영상·proprio·이력을 갱신합니다. 파지·놓기 상태를 센서로 추정하고 다음 policy 입력도 만듭니다.","이동 후 센서 · tracking 이력","새 관측 · 성공 판단용 추정","executor.py가 종료 조건을 확인합니다."),
 decision("success",["executor","observe"],"executor.py","성공 조건 유지?",800,355,"센서 기반 파지/놓기 추정이 종료 규격과 유지 시간을 만족하는지 판단합니다. Simulator 성공 predicate는 읽지 않습니다.","observe.py의 상태 추정 · ExitSpec","다음 정밀 행동 또는 마무리 전환","아니오: 새 관측으로 policy 반복. 관측 불량은 재관측, 제한 초과는 실패."),
 node("finish",["motion"],"code_motion.py","마무리 이동","추가 lift · 이동 / 후퇴",800,500,"runtime","현재 관측과 파지 추정으로 다음 이동을 계획합니다. Pick 후 추가 lift·이동, place_on 후 후퇴를 수행합니다.","현재 로봇·추정 파지 상태","마무리 명령 · 완료 상태","마무리까지 완료하면 실행기가 결과를 반환합니다."),
 node("result",["executor"],"executor.py","결과 반환","SkillResult → 다음 상위 동작",800,630,"artifact","실행 상태, 실패 이유, policy 버전, 최종 센서 추정을 반환합니다. 성공은 실행기의 센서 판단이며 정답 기반 성능 평가는 별도입니다.","전체 단계의 실행 기록","SkillResult · 상위 코드가 이어 쓸 상태","다음 skill 요청을 처리합니다."),
 node("failed",["executor"],"executor.py","Timeout / 복구 실패","어느 단계든 제한 초과 시 종료",80,650,"artifact","시작 준비·정밀 조작·마무리에 재시도와 시간 제한을 적용합니다. 이 상자는 모든 단계에 적용되는 공통 실패 경로입니다.","Timeout · 관측 상실 · 복구 불가","FAILED · 원인 · 실행 기록","상위 코드에 실패를 반환합니다.")
 ],
 edges:[
 edge("entry","observe","M200 188 V240"),
 edge("observe","prepare","M200 318 V370"),
 edge("prepare","ready","M200 448 V480"),
 edge("ready","policy","M320 535 H390 V150 H440","예",368,521),
 edge("ready","observe","M80 535 H35 V280 H80","아니오 · 재관측",76,345),
 edge("ready","failed","M200 590 V650","제한 초과",252,620),
 edge("policy","command","M560 188 V240","행동",589,218),
 edge("command","nextobs","M560 318 V370","새 센서",596,349),
 edge("nextobs","success","M680 410 H800","추정",737,397,"data"),
 edge("success","finish","M920 465 V500","예",942,488),
 edge("success","policy","M1040 410 H1090 V78 H560 V110","아니오 · 다음 관측으로 반복",821,69),
 edge("finish","result","M920 578 V630")
 ]
},
teacher:{
 title:"Teacher RL: 같은 준비 코드 + privileged actor + replay 업데이트",
 caption:"가운데는 환경 상호작용, 오른쪽은 데이터 저장과 주기적인 learner 업데이트입니다. 점선은 데이터·가중치 전달입니다.",
 columns:["실험 시작 · 공통 준비","Teacher 상호작용","정답 정보 · RL learner"],
 boundary:"Teacher는 정답 상태를 받지만 접근·gate·실행용 종료 판단은 같은 센서 기반 코드를 사용합니다. HIL 교정 뒤 실제 전송한 행동을 replay에 저장합니다. 학습용 정답 terminal과 실행기 판단은 별도입니다.",
 nodes:[
 node("run",["run","config"],"run.py / config.yaml","Teacher 실험 시작","Skill · 데이터 · 환경 설정",80,110,"training","실험 설정을 읽고 simulator·데이터·teacher를 연결합니다. 환경과 모델의 시작 순서를 관리합니다.","작업 모드 · 실험 설정","학습 환경 · teacher · 기록 경로","data.py에서 reset 데이터와 replay를 준비합니다."),
 node("bank",["data"],"data.py","Reset 데이터 준비","원본 / 실제 handoff 참조",80,240,"training","원본 데모의 label·snapshot 또는 실제 코드 접근에서 만든 handoff bank를 읽습니다. 원본 데이터는 수정하지 않습니다.","원본 reader · 데이터 index · handoff bank","Reset 후보 · 복원에 필요한 센서/controller 이력","env.py가 선택한 상태로 reset합니다."),
 node("reset",["env"],"env.py","환경 reset","장면 · 로봇 · 합법 관측 이력",80,370,"training","Simulator 상태와 controller·tracking·센서 이력을 복원하거나 다시 구성합니다. 정답으로 runtime perception 기억을 채우지 않습니다.","Reset 후보 · 실험 설정","환경 상태 · 실행용 센서 관측","공통 실행기로 접근하거나 복원한 handoff의 시작 조건을 검사합니다."),
 node("prepare",["executor","motion","observe"],"executor.py / code_motion.py","공통 접근 · READY 검사","센서 추정으로 준비",80,500,"runtime","원본 장면에서는 같은 접근 코드를 실행합니다. Handoff 복원에서는 실제 저장한 문맥을 복원한 뒤 READY를 확인합니다. 준비 실패도 기록합니다.","센서 관측 · SkillSpec","정밀 policy를 시작할 실제 상태","READY면 teacher 행동을 계산합니다. 미달이면 복구·재준비 또는 실패."),
 node("actor",["teacher"],"teacher.py","State actor 행동","Gaussian actor + privileged 상태",440,110,"training","환경에서 받은 정답 상태와 로봇·goal로 행동을 계산합니다. Teacher adapter를 공통 실행기에 주입하며 실행 코드가 oracle을 읽지는 않습니다.","env.py의 privileged 상태 · robot/goal","Teacher 제안 행동","같은 명령 변환·제한을 통과해 환경에 적용합니다."),
 node("step",["env","executor"],"env.py + executor.py","교정 적용 · 환경 step","실행 행동 · reward · 다음 상태",440,240,"training","필요하면 사람 교정을 적용하고 같은 action adapter로 전송합니다. 다음 관측과 reward, terminated/truncated를 만들고 실제 전송 행동을 기록합니다.","Teacher 행동 또는 HIL 교정","(s, a_exec, r, s') · 센서 관측 · 종료 flag","Replay에 전이를 저장하며 episode 종료 여부를 확인합니다."),
 decision("terminal",["env"],"env.py","Episode 종료?",440,355,"학습용 정답 성공·실패와 timeout을 구분합니다. Terminal과 truncation은 critic bootstrap 처리에서 구분합니다.","학습 상태 · reward · 종료 기준","종료 flag · 마지막 transition","아니오: 다음 teacher 행동. 예: 다음 reset. 실행용 성공 판단과는 별도."),
 node("truth",["env"],"env.py","Privileged 상태 제공","정답 물체 · 지지면 · 파지 상태",800,110,"truth","Simulator 정답을 teacher actor·critic·reward·별도 evaluator에만 제공합니다. 접근 코드·gate·student 입력에는 넣지 않습니다.","Simulator의 현재/다음 정답 상태","Teacher 상태 · critic 입력 · 평가 정보","Actor 행동과 learner 업데이트에 사용합니다."),
 node("human",["teacher"],"teacher.py · Human override","필요할 때 사람 교정","같은 정밀 action 규격",800,240,"truth","정밀 구간의 잘못된 행동을 사람이 교정합니다. Base·torso 이동이 필요한 복구는 팔 action 교정과 구분하고 다시 준비합니다.","사람 입력 · 현재 action 규격","교정된 전송 후보 행동","env/executor의 공통 제한·adapter를 거쳐 실행합니다."),
 node("replay",["data"],"data.py","Replay에 전이 저장","실행 행동 · 개입 flag · 종료 flag",800,370,"training","데모와 online 전이, 사람 교정을 저장합니다. 제안 행동 대신 교정·제한 적용 후 실제 전송한 행동을 기록합니다.","환경 step의 실제 transition","학습 batch · 재시작 데이터","설정한 주기에 batch를 learner로 전달합니다."),
 node("update",["teacher"],"teacher.py","Actor / critic 업데이트","SAC / RLPD 계열 · 주기적 학습",800,500,"training","Replay batch로 Q critic과 Gaussian actor를 업데이트합니다. 선택적 BC 초기화와 HIL을 결합하고 actor 가중치를 다시 rollout에 전달합니다.","Replay batch · privileged critic 상태","새 actor/critic 가중치 · 학습 지표","학습은 계속 반복하고 설정 주기에 checkpoint를 저장합니다."),
 node("checkpoint",["teacher"],"teacher.py","Teacher checkpoint","Pick / Place_on 각각 저장",800,630,"artifact","Actor·critic·정규화·설정·버전을 저장합니다. 이후 student 데이터 수집과 학습 재시작에 사용합니다.","학습 가중치 · 실험 규격","Teacher checkpoint","Student distillation 단계에서 actor를 불러옵니다."),
 node("fail",["env","executor"],"env.py / executor.py","준비 실패도 기록","Reset · gate · 복구 실패",80,650,"artifact","Gate를 통과한 episode만 성공률의 분모로 삼지 않습니다. 전체 준비 실패와 환경·사람 비용도 별도 기록합니다.","시작 준비 실패 · 복구 실패","실험 기록 · 전체 평가 분모","다른 reset을 선택하거나 오류를 수정합니다.")
 ],
 edges:[
 edge("run","bank","M200 188 V240"),
 edge("bank","reset","M200 318 V370","Reset 후보",245,349,"data"),
 edge("reset","prepare","M200 448 V500"),
 edge("prepare","actor","M320 540 H390 V150 H440","READY",369,523),
 edge("prepare","fail","M200 578 V650","복구 불가",245,620),
 edge("actor","step","M560 188 V240","제안 행동",614,219),
 edge("step","terminal","M560 318 V355"),
 edge("terminal","actor","M680 410 H720 V150 H680","아니오",700,397),
 edge("terminal","reset","M440 410 H320","예 · reset",382,397),
 edge("truth","actor","M800 150 H680","정답 상태",740,137,"truth"),
 edge("truth","update","M1040 150 H1090 V540 H1040","Critic 상태",1060,464,"truth"),
 edge("human","step","M800 265 H680","HIL 교정",742,253,"truth"),
 edge("step","replay","M680 300 H755 V410 H800","실제 전이",726,337,"data"),
 edge("replay","update","M920 448 V500","Batch",947,483,"data"),
 edge("update","actor","M800 540 H745 V80 H560 V110","갱신된 actor 가중치",750,69,"data"),
 edge("update","checkpoint","M920 578 V630","주기적 저장",969,608,"data")
 ]
},
distill:{
 title:"Student 학습: 행동 모방 → 직접 rollout → teacher 교정",
 caption:"Teacher 관측을 student 입력에 복사하지 않습니다. 정답 상태는 교정 행동을 질의할 때 학습용 teacher에게만 줍니다.",
 columns:["Teacher 데이터 수집","Student 학습 · 검증","방문 상태 교정 · export"],
 boundary:"Student에는 센서 관측 o만 제공합니다. 학습용 정답 상태 s는 teacher 행동 생성·교정에만 씁니다. 같은 실행기로 student를 직접 검증하고, 보이지 않는 정보는 재관측·이력으로 보완합니다.",
 nodes:[
 node("run",["run","config"],"run.py / config.yaml","Student 실험 시작","Teacher 고정 · 공통 실행 설정",80,110,"training","Teacher checkpoint와 공통 action 규격을 불러옵니다. 관측·학습·교정·평가 설정을 읽고 학습 작업을 연결합니다.","실험 설정 · teacher checkpoint","수집·학습·검증 환경","같은 코드 접근에서 teacher rollout을 수집합니다."),
 node("teacherroll",["env","teacher","executor"],"env.py + teacher.py","Teacher rollout 수집","같은 센서 기반 준비 코드",80,240,"training","코드 접근·gate는 센서 추정을 사용합니다. Teacher만 privileged 정보를 받고 행동합니다. 원본 데모도 관측/action 규격을 검증해 연결합니다.","공통 실행 환경 · teacher actor","연속 센서 관측 o · teacher 행동 aT","data.py가 student dataset을 만듭니다."),
 node("pairs",["data"],"data.py","Student 학습 데이터","센서 o ↔ teacher 행동 aT",80,370,"training","영상·proprio·goal·이력과 teacher 행동을 연결합니다. 정밀 skill 경계를 넘겨 섞지 않고 정답 상태는 student loader에서 제외합니다.","Teacher rollout · 검증한 원본 구간","StudentInput · 행동 label","student.py의 BC/distillation batch로 전달합니다."),
 node("model",["policy"],"policy.py","Student 모델 생성","영상 · proprio · goal · 이력",440,110,"runtime","학습과 배포에서 같은 student 모델 정의를 사용합니다. 모델 로딩·추론 경계는 유지하고 ACT·DP·flow 비교도 이 파일에서 관리합니다.","모델 설정 · action 계약","학습 가능한 visual student 모델","student.py가 teacher 행동 label로 업데이트합니다."),
 node("bc",["student"],"student.py","BC / distillation 업데이트","o에서 aT를 재현",440,240,"training","센서 관측으로 teacher 행동을 재현하도록 student를 학습합니다. Student 입력에 privileged 상태를 넣지 않습니다.","policy.py의 모델 · (o, aT) batch","갱신된 student 가중치","Student가 직접 공통 실행기에서 rollout합니다."),
 node("rollout",["student","env","executor"],"student.py + env.py","Student 직접 rollout","같은 Code → policy → Code",440,370,"training","학습한 student를 실제로 움직여 관측·행동·실패를 수집합니다. 시작 코드와 gate는 그대로 쓰고 student 행동이 만든 추가 오차를 확인합니다.","Student checkpoint · 공통 실행 환경","방문한 센서 관측 · 궤적 · 검증 결과","추가 교정이 필요한지 검증 기준으로 결정합니다."),
 decision("more",["student"],"student.py","추가 교정 필요?",440,480,"검증 결과와 학습 계획으로 DAgger 교정 여부를 결정합니다. 실패 지점뿐 아니라 student가 방문한 상태에 expert 행동을 질의할 수 있습니다.","Student rollout · validation 지표","교정 반복 또는 export","예: 방문 상태에서 teacher 질의. 아니오: 검증 기준 충족 후 export."),
 node("truth",["env"],"env.py","방문 상태의 정답","학습용 teacher 질의에만",800,240,"truth","Student가 방문한 시뮬레이터 상태의 정답을 읽습니다. 이 값은 student나 공통 접근 코드 입력이 아니라 teacher 질의용입니다.","시뮬레이션에서 방문한 상태","Teacher용 privileged 상태","teacher.py가 해당 상태의 교정 행동을 계산합니다."),
 node("query",["teacher"],"teacher.py","방문 상태에 Teacher 질의","Expert 교정 행동 aT",800,370,"truth","Teacher가 복구 가능한 상태인지 확인한 뒤 행동 label을 계산합니다. 모호한 관측은 재관측이 필요하며 teacher도 실패하는 상태를 무조건 label하지 않습니다.","방문 상태의 정답 · robot/goal","교정 행동 label · 유효성","data.py에 대응하는 센서 관측과 함께 추가합니다."),
 node("append",["data"],"data.py","교정 데이터 추가","방문한 o ↔ 새 aT",800,500,"training","Student가 실제로 만든 상태 분포를 dataset에 추가합니다. 분석용 정답을 저장하더라도 student loader는 허용된 입력만 반환합니다.","방문 센서 관측 · teacher 교정 행동","증강된 student dataset","다음 BC/distillation 업데이트로 반복합니다."),
 node("export",["student"],"student.py","배포 bundle export","모델 + 실행 규격 함께",440,650,"training","검증된 student와 관측/action/정규화/시작·종료 조건을 묶어 export합니다. 학습 디렉토리 설정을 배포 코드가 직접 읽지 않게 합니다.","검증된 가중치 · 실행 규격","배포 manifest · student checkpoints","배포에서 policy.py가 이 bundle을 로딩합니다."),
 node("bundle",["student","policy"],"pick.pt / place_on.pt","배포에 전달할 파일","manifest.json 함께 전달",800,650,"artifact","Student checkpoint와 실행에 필요한 설정만 가져갑니다. 접근 코드는 재사용하되 실기 sensor/controller backend는 별도 검증합니다.","Student export 결과","실행용 배포 bundle","Student 배포 그림의 policy.py에서 사용합니다.")
 ],
 edges:[
 edge("run","teacherroll","M200 188 V240"),
 edge("teacherroll","pairs","M200 318 V370","o, aT",239,347,"data"),
 edge("model","bc","M560 188 V240","모델",585,219,"data"),
 edge("pairs","bc","M320 410 H390 V280 H440","(o, aT)",362,397,"data"),
 edge("bc","rollout","M560 318 V370"),
 edge("rollout","more","M560 448 V480"),
 edge("rollout","truth","M680 410 H725 V280 H800","학습용 방문 상태",749,337,"truth"),
 edge("more","query","M680 535 H755 V410 H800","예",706,523),
 edge("truth","query","M920 318 V370","sGT",947,347,"truth"),
 edge("query","append","M920 448 V500","교정 label",968,482,"data"),
 edge("append","bc","M1040 540 H1090 V210 H655 V240","다음 반복 · 추가 dataset",887,201,"data"),
 edge("more","export","M560 590 V650","아니오 · 검증 기준 충족",672,620),
 edge("export","bundle","M680 690 H800","Export",741,677,"data")
 ]
}
};
let current="deploy",selected="";
function svgEl(tag,attrs,text){const e=document.createElementNS(ns,tag);Object.entries(attrs||{}).forEach(function(pair){e.setAttribute(pair[0],String(pair[1]));});if(text!==undefined)e.textContent=text;return e;}
function inspect(id){const graph=graphs[current],n=graph.nodes.find(function(x){return x.id===id;});if(!n)return;selected=id;
 el("algorithm-node-file").textContent=n.file;el("algorithm-node-title").textContent=n.title;el("algorithm-node-body").textContent=n.body;el("algorithm-node-input").textContent=n.input;el("algorithm-node-output").textContent=n.output;el("algorithm-node-next").textContent=n.next;
 el("algorithm-file-buttons").replaceChildren();n.owner.forEach(function(key){const b=document.createElement("button");b.className="owner-button";b.type="button";b.textContent=window.r1proDesign.getFile(key).name+" 설명";b.addEventListener("click",function(){window.r1proDesign.openFile(key);});el("algorithm-file-buttons").append(b);});
 document.querySelectorAll("[data-alg-node]").forEach(function(g){const active=g.dataset.algNode===id;g.classList.toggle("selected",active);g.setAttribute("aria-pressed",String(active));});
 document.querySelectorAll("[data-alg-edge]").forEach(function(p){p.classList.toggle("active",p.dataset.from===id||p.dataset.to===id);});
}
function render(){const graph=graphs[current],svg=el("algorithm-svg");svg.replaceChildren();svg.setAttribute("viewBox","0 0 1120 750");svg.setAttribute("aria-label",graph.title);
 const title=svgEl("title",{},graph.title);const desc=svgEl("desc",{},"상자는 파일의 처리, 마름모는 판단, 실선 화살표는 제어 흐름입니다. 도형을 선택하면 아래에서 역할과 전달 데이터를 확인할 수 있습니다.");svg.append(title,desc);
 const defs=svgEl("defs");["control","data","truth"].forEach(function(kind){const marker=svgEl("marker",{id:"alg-arrow-"+kind,viewBox:"0 0 10 10",refX:9,refY:5,markerWidth:7,markerHeight:7,orient:"auto-start-reverse"});marker.append(svgEl("path",{d:"M 0 0 L 10 5 L 0 10 z",fill:kind==="truth"?"#b68030":kind==="data"?"#5284b7":"#668b80"}));defs.append(marker);});svg.append(defs);
 [200,560,920].forEach(function(x,i){svg.append(svgEl("text",{x:x,y:43,"text-anchor":"middle",class:"column-title"},graph.columns[i]));});
 graph.edges.forEach(function(e,i){const p=svgEl("path",{d:e.path,class:"edge "+e.kind,"marker-end":"url(#alg-arrow-"+e.kind+")","data-alg-edge":i,"data-from":e.from,"data-to":e.to});svg.append(p);if(e.label)svg.append(svgEl("text",{x:e.x,y:e.y,"text-anchor":"middle",class:"edge-label "+e.kind},e.label));});
 graph.nodes.forEach(function(n){const g=svgEl("g",{class:"node "+n.kind,tabindex:0,role:"button","aria-pressed":"false","aria-label":n.file+" · "+n.title,"data-alg-node":n.id});
 if(n.kind==="decision"){g.append(svgEl("polygon",{points:(n.x+120)+","+n.y+" "+(n.x+240)+","+(n.y+55)+" "+(n.x+120)+","+(n.y+110)+" "+n.x+","+(n.y+55),class:"surface"}));g.append(svgEl("text",{x:n.x+120,y:n.y+48,"text-anchor":"middle",class:"decision-title"},n.title));g.append(svgEl("text",{x:n.x+120,y:n.y+71,"text-anchor":"middle",class:"decision-file"},n.file));}
 else{g.append(svgEl("rect",{x:n.x,y:n.y,width:240,height:78,rx:11,class:"surface"}));g.append(svgEl("text",{x:n.x+120,y:n.y+20,"text-anchor":"middle",class:"node-file"},n.file));g.append(svgEl("text",{x:n.x+120,y:n.y+44,"text-anchor":"middle",class:"node-title"},n.title));g.append(svgEl("text",{x:n.x+120,y:n.y+64,"text-anchor":"middle",class:"node-sub"},n.sub));}
 g.addEventListener("click",function(){inspect(n.id);});g.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();inspect(n.id);}});svg.append(g);
 });
 el("algorithm-title").textContent=graph.title;el("algorithm-caption").textContent=graph.caption;el("algorithm-boundary").textContent=graph.boundary;el("algorithm-boundary").className="algorithm-boundary"+(current==="deploy"?"":" training");
 document.querySelectorAll("[data-alg-mode]").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.algMode===current));});inspect(graph.nodes[0].id);
}
document.querySelectorAll("[data-alg-mode]").forEach(function(b){b.addEventListener("click",function(){current=b.dataset.algMode;render();});});
document.querySelectorAll("[data-alg-file]").forEach(function(b){b.addEventListener("click",function(){window.r1proDesign.openFile(b.dataset.algFile);});});
render();
})();
