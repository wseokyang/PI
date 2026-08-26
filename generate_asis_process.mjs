import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ecrsaMeta,
  improvementMetrics,
  stepDurations,
  formatHours,
  reductionPercent
} from './ecrsa_data.mjs';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const bpmnPath = path.join(outputDir, '순서도-AS-IS.bpmn');
const svgPath = path.join(outputDir, '순서도-AS-IS.svg');
const notePath = path.join(outputDir, '순서도-AS-IS-가정.md');
const ecrsaReportPath = path.join(outputDir, 'ECRSA-개선효과.md');
const ecrsaCsvPath = path.join(outputDir, 'ECRSA-개선효과.csv');

const issueMeta = {
  B: { label: 'Bottleneck', color: '#DC2626', pale: '#FEE2E2' },
  D: { label: 'Delay', color: '#D97706', pale: '#FEF3C7' },
  W: { label: 'Waste', color: '#7C3AED', pale: '#EDE9FE' }
};

const subprocesses = [
  {
    code: 'PIC', item: 'I01', name: '제품 정보 확인',
    hypothesis: '제품·Lot 정보가 시스템과 문서에 흩어져 있고, 누락 정보 회신을 기다리는 상태',
    steps: [
      ['메일·전화로 제품/Lot 정보 요청', ['D']],
      ['PLM·MES·문서별 정보 개별 조회', ['B', 'W']],
      ['누락 정보 재요청·수기 대조', ['B', 'D', 'W']]
    ]
  },
  {
    code: 'PRA', item: 'I02', name: '공정 분석 (Commonality)',
    hypothesis: '데이터 추출·결합과 공통성 판단이 소수 분석자와 Excel 작업에 집중된 상태',
    steps: [
      ['공정·설비별 자료 추출 요청', ['D']],
      ['담당자별 Excel 수기 취합', ['B', 'W']],
      ['Excel 공통조건 비교', ['B', 'W']]
    ]
  },
  {
    code: 'DPL', item: 'I03', name: 'Data Pipeline 설계',
    hypothesis: '자동 연계 없이 요청·파일 전달·수동 변환 주기로 데이터를 모으는 상태',
    steps: [
      ['시스템별 CSV 개별 추출 요청', ['B', 'D']],
      ['이메일·공유폴더로 파일 전달', ['D', 'W']],
      ['포맷 수동 변환·병합', ['B', 'W']]
    ]
  },
  {
    code: 'DBD', item: 'I04', name: 'DB 설계',
    hypothesis: '표준 스키마와 버전 관리 없이 개인·부서별 파일을 반복 가공하는 상태',
    steps: [
      ['개인 PC·부서 폴더별 저장', ['W']],
      ['컬럼·키·단위를 개별 정의', ['B', 'W']],
      ['버전 확인·수동 Join·중복 제거', ['D', 'W']]
    ]
  },
  {
    code: 'DEV', item: 'I05', name: '개발 환경 및 도구 설정',
    hypothesis: '개인 PC마다 환경이 달라 설치·공유·재현 문제가 반복되는 상태',
    steps: [
      ['개인 PC에 Python·패키지 설치', ['D', 'W']],
      ['이메일·공유폴더로 파일·코드 공유', ['D', 'W']],
      ['버전 충돌 해결·재설치', ['B', 'D', 'W']]
    ]
  },
  {
    code: 'OUT', item: 'I06', name: '이상치 제거',
    hypothesis: '공통 기준과 처리 이력 없이 분석자 경험에 따라 정제를 반복하는 상태',
    steps: [
      ['담당자 경험으로 이상치 기준 정의', ['B']],
      ['Excel·로컬 스크립트 수작업 제거', ['W']],
      ['기준 차이로 반복 정제', ['D', 'W']]
    ]
  },
  {
    code: 'LBL', item: 'I07', name: 'Label 생성',
    hypothesis: '도메인 전문가 회신과 Excel 수기 입력에 라벨 품질과 일정이 종속된 상태',
    steps: [
      ['전문가에게 판정표·샘플 요청', ['B', 'D']],
      ['Excel 행 단위 Label 수기 입력', ['B', 'W']],
      ['불일치 협의·재라벨링', ['B', 'D', 'W']]
    ]
  },
  {
    code: 'DQC', item: 'I08', name: 'Data 품질확인',
    hypothesis: '검증 규칙과 자동 리포트가 없어 표본 점검과 재추출 요청을 반복하는 상태',
    steps: [
      ['건수·Null·중복 표본 점검', ['B', 'W']],
      ['오류 원인 확인·재추출 요청', ['B', 'D']],
      ['검증 결과 Excel 보고서 작성', ['D', 'W']]
    ]
  },
  {
    code: 'TDS', item: 'I09', name: 'AI Training Data Set 구축',
    hypothesis: '분산 파일을 수동 매칭·복사하고 파일명으로 버전을 구분하는 상태',
    steps: [
      ['최신 정제·Label 파일 탐색', ['B', 'D']],
      ['파일 수동 매칭·병합', ['B', 'W']],
      ['Train/Valid/Test 수동 분할·버전관리', ['B', 'D', 'W']]
    ]
  },
  {
    code: 'DLG', item: 'I10', name: 'Detect logic 설계',
    hypothesis: '숙련자의 암묵지와 수작업 threshold 조정에 탐지 로직이 의존하는 상태',
    steps: [
      ['숙련자 판정 규칙 인터뷰', ['B', 'D']],
      ['Threshold·조건문 하드코딩', ['B', 'W']],
      ['과거 로그 대조·회의 수정', ['B', 'D', 'W']]
    ]
  },
  {
    code: 'MDA', item: 'I11', name: '모델 구조 설계 및 구현',
    hypothesis: '공통 모듈과 협업 저장소 없이 예제 코드 복사와 중복 구현이 발생하는 상태',
    steps: [
      ['개인별 예제·Notebook 탐색', ['W']],
      ['과거 코드 복사·개별 구현', ['B', 'W']],
      ['수동 통합·충돌 수정', ['B', 'D', 'W']]
    ]
  },
  {
    code: 'MTR', item: 'I12', name: '모델 학습',
    hypothesis: '제한된 연산 자원과 수동 실험 기록 때문에 대기와 재학습이 반복되는 상태',
    steps: [
      ['GPU PC/서버 사용 순서 대기', ['B', 'D']],
      ['실험 순차 실행·Excel 기록', ['B', 'D', 'W']],
      ['실패·버전 차이로 전체 재학습', ['D', 'W']]
    ]
  },
  {
    code: 'CIM', item: 'I13', name: '코드 개선',
    hypothesis: '결함 추적·형상관리·자동 회귀검증 없이 파일 단위 수정과 병합을 반복하는 상태',
    steps: [
      ['테스트 실패 캡처·메일 전달', ['D', 'W']],
      ['개인 코드 사본 수정', ['B', 'D']],
      ['수정본 수동 병합·재검증', ['B', 'D', 'W']]
    ]
  },
  {
    code: 'MON', item: 'I14', name: '모니터링 실행',
    hypothesis: '실시간 연계 없이 담당자의 수동 실행 주기와 가용성에 모니터링이 종속된 상태',
    steps: [
      ['운영자가 주기별 수동 Export', ['B', 'D', 'W']],
      ['Batch/Notebook 수동 실행', ['B', 'D']],
      ['결과 Excel 취합·메일 공유', ['D', 'W']]
    ]
  },
  {
    code: 'ANO', item: 'I15', name: '이상점 감지',
    hypothesis: '고정 기준·육안 판독과 담당자 확인 대기로 탐지에서 조치까지 지연되는 상태',
    steps: [
      ['Chart·관리한계 육안 확인', ['B', 'W']],
      ['공정 담당자에게 전화·메일 확인', ['B', 'D']],
      ['이상 목록 Excel/QMS 재등록', ['D', 'W']]
    ]
  }
];

const subprocessByCode = Object.fromEntries(subprocesses.map((item) => [item.code, item]));

const lanes = [
  { id: 'Lane_Defect_Definition', name: '불량 분석 및 과제 정의', y: 100, h: 260, fill: '#FFFFFF' },
  { id: 'Lane_Defect_Factor_Analysis', name: '불량 협의 인자 분석', y: 360, h: 260, fill: '#F8FAFC' },
  { id: 'Lane_Production_Data', name: '양산 데이터 확보', y: 620, h: 260, fill: '#FFFFFF' },
  { id: 'Lane_AI_Environment_Preprocessing', name: 'AI 구축 환경 준비 데이터 전처리', y: 880, h: 480, fill: '#F8FAFC' },
  { id: 'Lane_AI_Model_Development', name: 'AI 모델 설계 및 개발', y: 1360, h: 300, fill: '#FFFFFF' },
  { id: 'Lane_Monitoring_Optimization', name: '모니터링 및 이상감지 최적화', y: 1660, h: 300, fill: '#F8FAFC' }
];

function subprocessNode(code, lane, x, y) {
  const item = subprocessByCode[code];
  return {
    id: 'SubProcess_ASIS_' + code,
    kind: 'subProcess',
    lane,
    name: item.item + ' ' + item.name + ' AS-IS',
    code,
    x,
    y,
    w: 580,
    h: 170
  };
}

const topNodes = [
  { id: 'StartEvent_Process', kind: 'startEvent', lane: 'Lane_Defect_Definition', name: '시작', x: 290, y: 212, w: 36, h: 36 },
  { id: 'Task_Defect_Receipt', kind: 'task', lane: 'Lane_Defect_Definition', name: '불량 현상 접수', x: 350, y: 190, w: 170, h: 80 },
  subprocessNode('PIC', 'Lane_Defect_Definition', 580, 145),
  {
    id: 'Gateway_Product_Info', kind: 'exclusiveGateway', lane: 'Lane_Defect_Definition',
    name: '제품 정보 확인 결과', direction: 'Diverging',
    documentation: 'AS-IS 확인 작업 뒤 정보 충분 여부를 판단한다. TO-BE 원본의 Yes/No 표기는 논리적 의미가 모호하여 정보 충분/추가 분석 필요로 해석했다.',
    x: 1230, y: 200, w: 60, h: 60,
    label: { x: 1190, y: 266, w: 140, h: 24 }
  },
  { id: 'Task_Physical_Analysis', kind: 'task', lane: 'Lane_Defect_Factor_Analysis', name: '실물 분석 (eFA, pFA)', x: 300, y: 450, w: 170, h: 80 },
  { id: 'Gateway_Process_Analysis_Merge', kind: 'exclusiveGateway', lane: 'Lane_Defect_Factor_Analysis', name: '공정 분석 진입 합류', direction: 'Converging', x: 520, y: 460, w: 60, h: 60, label: { x: 490, y: 526, w: 120, h: 22 } },
  subprocessNode('PRA', 'Lane_Defect_Factor_Analysis', 600, 405),
  { id: 'Task_Data_Acquisition', kind: 'task', lane: 'Lane_Production_Data', name: 'Data 확보 및 검증', x: 300, y: 710, w: 170, h: 80 },
  subprocessNode('DPL', 'Lane_Production_Data', 540, 665),
  subprocessNode('DBD', 'Lane_Production_Data', 1180, 665),
  { id: 'Task_AI_Feasibility', kind: 'task', lane: 'Lane_AI_Environment_Preprocessing', name: 'AI 적용 타당성 검토', x: 300, y: 1080, w: 170, h: 80 },
  { id: 'Gateway_Development_Environment_Merge', kind: 'exclusiveGateway', lane: 'Lane_AI_Environment_Preprocessing', name: '환경 설정 진입 합류', direction: 'Converging', x: 500, y: 1090, w: 60, h: 60, label: { x: 445, y: 1058, w: 110, h: 22 } },
  subprocessNode('DEV', 'Lane_AI_Environment_Preprocessing', 580, 1035),
  { id: 'Gateway_Preprocessing_Fork', kind: 'parallelGateway', lane: 'Lane_AI_Environment_Preprocessing', name: '전처리 병렬 분기', direction: 'Diverging', x: 1170, y: 1090, w: 60, h: 60, label: { x: 1136, y: 1154, w: 128, h: 22 } },
  subprocessNode('OUT', 'Lane_AI_Environment_Preprocessing', 1260, 900),
  subprocessNode('LBL', 'Lane_AI_Environment_Preprocessing', 1260, 1170),
  { id: 'Gateway_Preprocessing_Join', kind: 'parallelGateway', lane: 'Lane_AI_Environment_Preprocessing', name: '전처리 병렬 합류', direction: 'Converging', x: 1900, y: 1090, w: 60, h: 60, label: { x: 1866, y: 1154, w: 128, h: 22 } },
  subprocessNode('DQC', 'Lane_AI_Environment_Preprocessing', 1990, 1035),
  {
    id: 'Gateway_Data_Quality', kind: 'exclusiveGateway', lane: 'Lane_AI_Environment_Preprocessing',
    name: '품질 기준 충족?', direction: 'Diverging',
    documentation: '적합이면 학습 데이터셋 구축으로 진행하고, 미달이면 개발 환경 및 도구 설정 단계부터 재작업한다.',
    x: 2630, y: 1090, w: 60, h: 60,
    label: { x: 2600, y: 1154, w: 120, h: 22 }
  },
  subprocessNode('TDS', 'Lane_AI_Environment_Preprocessing', 2740, 1035),
  { id: 'Task_Model_Selection', kind: 'task', lane: 'Lane_AI_Model_Development', name: '이상 감지 모델 선정', x: 300, y: 1470, w: 170, h: 80 },
  subprocessNode('DLG', 'Lane_AI_Model_Development', 540, 1425),
  subprocessNode('MDA', 'Lane_AI_Model_Development', 1180, 1425),
  subprocessNode('MTR', 'Lane_AI_Model_Development', 1820, 1425),
  { id: 'Task_Test_Environment', kind: 'task', lane: 'Lane_AI_Model_Development', name: '테스트 환경 및 도구 구성', x: 2460, y: 1470, w: 170, h: 80 },
  { id: 'Gateway_Function_Merge', kind: 'exclusiveGateway', lane: 'Lane_AI_Model_Development', name: '기능검증 진입 합류', direction: 'Converging', x: 2650, y: 1485, w: 50, h: 50, label: { x: 2615, y: 1438, w: 120, h: 22 } },
  {
    id: 'Gateway_Function_Validation', kind: 'exclusiveGateway', lane: 'Lane_AI_Model_Development',
    name: '기능검증', direction: 'Diverging',
    documentation: '개선 필요 시 코드 개선과 Parameter 최적화 뒤 재검증하고, 검증 완료 시 모니터링으로 진행한다.',
    x: 2730, y: 1480, w: 60, h: 60,
    label: { x: 2720, y: 1544, w: 80, h: 22 }
  },
  subprocessNode('CIM', 'Lane_AI_Model_Development', 2840, 1425),
  { id: 'Task_Parameter_Optimization', kind: 'task', lane: 'Lane_AI_Model_Development', name: 'Parameter 최적화', x: 3480, y: 1470, w: 170, h: 80 },
  subprocessNode('MON', 'Lane_Monitoring_Optimization', 300, 1725),
  subprocessNode('ANO', 'Lane_Monitoring_Optimization', 940, 1725),
  { id: 'Task_Defect_Conformity', kind: 'task', lane: 'Lane_Monitoring_Optimization', name: '불량 정합성 확인', x: 1580, y: 1770, w: 180, h: 80 },
  { id: 'Task_Closed_Loop', kind: 'task', lane: 'Lane_Monitoring_Optimization', name: 'Closed Loop 구축', x: 1830, y: 1770, w: 180, h: 80 },
  { id: 'EndEvent_Process', kind: 'endEvent', lane: 'Lane_Monitoring_Optimization', name: '종료', x: 2080, y: 1792, w: 36, h: 36 }
];

const topEdges = [
  { id: 'Flow_Start_To_Receipt', source: 'StartEvent_Process', target: 'Task_Defect_Receipt', points: [[326, 230], [350, 230]] },
  { id: 'Flow_Receipt_To_ASIS_PIC', source: 'Task_Defect_Receipt', target: 'SubProcess_ASIS_PIC', points: [[520, 230], [580, 230]] },
  { id: 'Flow_ASIS_PIC_To_Product_Info', source: 'SubProcess_ASIS_PIC', target: 'Gateway_Product_Info', points: [[1160, 230], [1230, 230]] },
  { id: 'Flow_Product_Info_To_Physical', name: '추가 분석 필요', source: 'Gateway_Product_Info', target: 'Task_Physical_Analysis', points: [[1260, 260], [1260, 340], [385, 340], [385, 450]], label: { x: 430, y: 318, w: 112, h: 20 } },
  { id: 'Flow_Product_Info_To_Process_Merge', name: '정보 충분', source: 'Gateway_Product_Info', target: 'Gateway_Process_Analysis_Merge', points: [[1290, 230], [1330, 230], [1330, 440], [550, 440], [550, 460]], label: { x: 1120, y: 418, w: 78, h: 20 } },
  { id: 'Flow_Physical_To_Process_Merge', source: 'Task_Physical_Analysis', target: 'Gateway_Process_Analysis_Merge', points: [[470, 490], [520, 490]] },
  { id: 'Flow_Process_Merge_To_ASIS_PRA', source: 'Gateway_Process_Analysis_Merge', target: 'SubProcess_ASIS_PRA', points: [[580, 490], [600, 490]] },
  { id: 'Flow_ASIS_PRA_To_Data', source: 'SubProcess_ASIS_PRA', target: 'Task_Data_Acquisition', points: [[890, 575], [890, 600], [385, 600], [385, 710]] },
  { id: 'Flow_Data_To_ASIS_DPL', source: 'Task_Data_Acquisition', target: 'SubProcess_ASIS_DPL', points: [[470, 750], [540, 750]] },
  { id: 'Flow_ASIS_DPL_To_ASIS_DBD', source: 'SubProcess_ASIS_DPL', target: 'SubProcess_ASIS_DBD', points: [[1120, 750], [1180, 750]] },
  { id: 'Flow_ASIS_DBD_To_Feasibility', source: 'SubProcess_ASIS_DBD', target: 'Task_AI_Feasibility', points: [[1470, 835], [1470, 860], [385, 860], [385, 1080]] },
  { id: 'Flow_Feasibility_To_Environment_Merge', source: 'Task_AI_Feasibility', target: 'Gateway_Development_Environment_Merge', points: [[470, 1120], [500, 1120]] },
  { id: 'Flow_Environment_Merge_To_ASIS_DEV', source: 'Gateway_Development_Environment_Merge', target: 'SubProcess_ASIS_DEV', points: [[560, 1120], [580, 1120]] },
  { id: 'Flow_ASIS_DEV_To_Preprocess_Fork', source: 'SubProcess_ASIS_DEV', target: 'Gateway_Preprocessing_Fork', points: [[1160, 1120], [1170, 1120]] },
  { id: 'Flow_Preprocess_Fork_To_ASIS_OUT', source: 'Gateway_Preprocessing_Fork', target: 'SubProcess_ASIS_OUT', points: [[1200, 1090], [1200, 985], [1260, 985]] },
  { id: 'Flow_Preprocess_Fork_To_ASIS_LBL', source: 'Gateway_Preprocessing_Fork', target: 'SubProcess_ASIS_LBL', points: [[1200, 1150], [1200, 1255], [1260, 1255]] },
  { id: 'Flow_ASIS_OUT_To_Preprocess_Join', source: 'SubProcess_ASIS_OUT', target: 'Gateway_Preprocessing_Join', points: [[1840, 985], [1915, 1105]] },
  { id: 'Flow_ASIS_LBL_To_Preprocess_Join', source: 'SubProcess_ASIS_LBL', target: 'Gateway_Preprocessing_Join', points: [[1840, 1255], [1915, 1135]] },
  { id: 'Flow_Preprocess_Join_To_ASIS_DQC', source: 'Gateway_Preprocessing_Join', target: 'SubProcess_ASIS_DQC', points: [[1960, 1120], [1990, 1120]] },
  { id: 'Flow_ASIS_DQC_To_Data_Quality', source: 'SubProcess_ASIS_DQC', target: 'Gateway_Data_Quality', points: [[2570, 1120], [2630, 1120]] },
  { id: 'Flow_Data_Quality_Rework', name: '미달 / 재작업', source: 'Gateway_Data_Quality', target: 'Gateway_Development_Environment_Merge', style: 'rework', points: [[2660, 1090], [2660, 890], [530, 890], [530, 1090]], label: { x: 2140, y: 868, w: 112, h: 20 } },
  { id: 'Flow_Data_Quality_To_ASIS_TDS', name: '적합', source: 'Gateway_Data_Quality', target: 'SubProcess_ASIS_TDS', points: [[2690, 1120], [2740, 1120]], label: { x: 2698, y: 1095, w: 38, h: 20 } },
  { id: 'Flow_ASIS_TDS_To_Model_Selection', source: 'SubProcess_ASIS_TDS', target: 'Task_Model_Selection', points: [[3030, 1205], [3030, 1340], [385, 1340], [385, 1470]] },
  { id: 'Flow_Model_Selection_To_ASIS_DLG', source: 'Task_Model_Selection', target: 'SubProcess_ASIS_DLG', points: [[470, 1510], [540, 1510]] },
  { id: 'Flow_ASIS_DLG_To_ASIS_MDA', source: 'SubProcess_ASIS_DLG', target: 'SubProcess_ASIS_MDA', points: [[1120, 1510], [1180, 1510]] },
  { id: 'Flow_ASIS_MDA_To_ASIS_MTR', source: 'SubProcess_ASIS_MDA', target: 'SubProcess_ASIS_MTR', points: [[1760, 1510], [1820, 1510]] },
  { id: 'Flow_ASIS_MTR_To_Test_Environment', source: 'SubProcess_ASIS_MTR', target: 'Task_Test_Environment', points: [[2400, 1510], [2460, 1510]] },
  { id: 'Flow_Test_Environment_To_Function_Merge', source: 'Task_Test_Environment', target: 'Gateway_Function_Merge', points: [[2630, 1510], [2650, 1510]] },
  { id: 'Flow_Function_Merge_To_Validation', source: 'Gateway_Function_Merge', target: 'Gateway_Function_Validation', points: [[2700, 1510], [2730, 1510]] },
  { id: 'Flow_Function_To_ASIS_CIM', name: '개선 필요', source: 'Gateway_Function_Validation', target: 'SubProcess_ASIS_CIM', points: [[2790, 1510], [2840, 1510]], label: { x: 2790, y: 1485, w: 72, h: 20 } },
  { id: 'Flow_ASIS_CIM_To_Parameter', source: 'SubProcess_ASIS_CIM', target: 'Task_Parameter_Optimization', points: [[3420, 1510], [3480, 1510]] },
  { id: 'Flow_Parameter_To_Function_Merge', source: 'Task_Parameter_Optimization', target: 'Gateway_Function_Merge', style: 'rework', points: [[3650, 1510], [3740, 1510], [3740, 1380], [2675, 1380], [2675, 1485]] },
  { id: 'Flow_Function_To_ASIS_MON', name: '검증 완료', source: 'Gateway_Function_Validation', target: 'SubProcess_ASIS_MON', points: [[2760, 1540], [2760, 1640], [590, 1640], [590, 1725]], label: { x: 2200, y: 1618, w: 72, h: 20 } },
  { id: 'Flow_ASIS_MON_To_ASIS_ANO', source: 'SubProcess_ASIS_MON', target: 'SubProcess_ASIS_ANO', points: [[880, 1810], [940, 1810]] },
  { id: 'Flow_ASIS_ANO_To_Conformity', source: 'SubProcess_ASIS_ANO', target: 'Task_Defect_Conformity', points: [[1520, 1810], [1580, 1810]] },
  { id: 'Flow_Conformity_To_Closed_Loop', source: 'Task_Defect_Conformity', target: 'Task_Closed_Loop', points: [[1760, 1810], [1830, 1810]] },
  { id: 'Flow_Closed_Loop_To_End', source: 'Task_Closed_Loop', target: 'EndEvent_Process', points: [[2010, 1810], [2080, 1810]] }
];

const topNodeById = Object.fromEntries(topNodes.map((node) => [node.id, node]));

function addReference(map, key, value) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
}

function referenceMaps(edges) {
  const incoming = new Map();
  const outgoing = new Map();
  for (const edge of edges) {
    addReference(outgoing, edge.source, edge.id);
    addReference(incoming, edge.target, edge.id);
  }
  return { incoming, outgoing };
}

const topReferences = referenceMaps(topEdges);

function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function svgEscape(value) {
  return xmlEscape(value);
}

function issueTag(issues) {
  return '[' + issues.join('/') + ']';
}

function issueNames(issues) {
  return issues.map((code) => issueMeta[code].label).join(', ');
}

function emitFlowReferences(lines, nodeId, refs, indent) {
  for (const id of refs.incoming.get(nodeId) || []) {
    lines.push(indent + '<bpmn:incoming>' + id + '</bpmn:incoming>');
  }
  for (const id of refs.outgoing.get(nodeId) || []) {
    lines.push(indent + '<bpmn:outgoing>' + id + '</bpmn:outgoing>');
  }
}

const internalCache = new Map();

function internalModel(subprocessNodeValue) {
  if (internalCache.has(subprocessNodeValue.code)) return internalCache.get(subprocessNodeValue.code);
  const item = subprocessByCode[subprocessNodeValue.code];
  const nodes = [];
  const edges = [];
  const centerY = subprocessNodeValue.y + 104;
  nodes.push({
    id: 'Start_ASIS_' + item.code,
    kind: 'startEvent',
    x: subprocessNodeValue.x + 18,
    y: centerY - 12,
    w: 24,
    h: 24
  });
  const taskXs = [subprocessNodeValue.x + 62, subprocessNodeValue.x + 218, subprocessNodeValue.x + 374];
  item.steps.forEach((step, index) => {
    nodes.push({
      id: 'Task_ASIS_' + item.code + '_' + String(index + 1).padStart(2, '0'),
      kind: 'task',
      name: step[0],
      issues: step[1],
      durationHours: stepDurations[item.code][index],
      x: taskXs[index],
      y: subprocessNodeValue.y + 60,
      w: 140,
      h: 88
    });
  });
  nodes.push({
    id: 'End_ASIS_' + item.code,
    kind: 'endEvent',
    x: subprocessNodeValue.x + 534,
    y: centerY - 12,
    w: 24,
    h: 24
  });
  for (let index = 0; index < nodes.length - 1; index += 1) {
    edges.push({
      id: 'Flow_ASIS_' + item.code + '_' + String(index + 1).padStart(2, '0'),
      source: nodes[index].id,
      target: nodes[index + 1].id,
      points: [
        [nodes[index].x + nodes[index].w, centerY],
        [nodes[index + 1].x, centerY]
      ]
    });
  }
  const result = { nodes, edges, refs: referenceMaps(edges) };
  internalCache.set(subprocessNodeValue.code, result);
  return result;
}

function emitBasicNode(lines, node, indent) {
  const tagByKind = {
    startEvent: 'startEvent',
    endEvent: 'endEvent',
    task: 'task',
    exclusiveGateway: 'exclusiveGateway',
    parallelGateway: 'parallelGateway'
  };
  const tag = tagByKind[node.kind];
  let attributes = ' id="' + node.id + '"';
  if (node.name) attributes += ' name="' + xmlEscape(node.name) + '"';
  if (node.direction) attributes += ' gatewayDirection="' + node.direction + '"';
  lines.push(indent + '<bpmn:' + tag + attributes + '>');
  if (node.documentation) {
    lines.push(indent + '  <bpmn:documentation>' + xmlEscape(node.documentation) + '</bpmn:documentation>');
  }
  emitFlowReferences(lines, node.id, topReferences, indent + '  ');
  lines.push(indent + '</bpmn:' + tag + '>');
}

function emitSubprocess(lines, node, indent) {
  const item = subprocessByCode[node.code];
  const metric = improvementMetrics[node.code];
  const internal = internalModel(node);
  lines.push(indent + '<bpmn:subProcess id="' + node.id + '" name="' + xmlEscape(node.name) + '">');
  lines.push(indent + '  <bpmn:documentation>TO-BE 개선 대상 ' + item.item + ': ' + xmlEscape(item.name) + '. AS-IS 가설: ' + xmlEscape(item.hypothesis) + '. 가정 Lead Time: ' + formatHours(metric.asisHours) + ' → ' + formatHours(metric.tobeHours) + ' (' + reductionPercent(metric.asisHours, metric.tobeHours) + '% 단축). ECRSA: ' + metric.ecrsa.join('/') + '. 개선안: ' + xmlEscape(metric.improvement) + '.</bpmn:documentation>');
  emitFlowReferences(lines, node.id, topReferences, indent + '  ');
  for (const internalNode of internal.nodes) {
    if (internalNode.kind === 'task') {
      lines.push(indent + '  <bpmn:task id="' + internalNode.id + '" name="' + xmlEscape(internalNode.name + ' ' + issueTag(internalNode.issues) + ' · ' + formatHours(internalNode.durationHours)) + '">');
      lines.push(indent + '    <bpmn:documentation>PI 이슈: ' + issueNames(internalNode.issues) + '. 가정 Lead Time: ' + formatHours(internalNode.durationHours) + '. 현장 확인 전 AS-IS 가설 단계.</bpmn:documentation>');
      emitFlowReferences(lines, internalNode.id, internal.refs, indent + '    ');
      lines.push(indent + '  </bpmn:task>');
    } else {
      const tag = internalNode.kind === 'startEvent' ? 'startEvent' : 'endEvent';
      lines.push(indent + '  <bpmn:' + tag + ' id="' + internalNode.id + '">');
      emitFlowReferences(lines, internalNode.id, internal.refs, indent + '    ');
      lines.push(indent + '  </bpmn:' + tag + '>');
    }
  }
  for (const edge of internal.edges) {
    lines.push(indent + '  <bpmn:sequenceFlow id="' + edge.id + '" sourceRef="' + edge.source + '" targetRef="' + edge.target + '" />');
  }
  lines.push(indent + '</bpmn:subProcess>');
}

function buildBpmn() {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<bpmn:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"');
  lines.push('                  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"');
  lines.push('                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"');
  lines.push('                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"');
  lines.push('                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"');
  lines.push('                  xmlns:bioc="http://bpmn.io/schema/bpmn/biocolor/1.0"');
  lines.push('                  id="Definitions_ASIS_Defect_AI_ClosedLoop"');
  lines.push('                  targetNamespace="https://example.com/bpmn/asis-defect-ai-closed-loop"');
  lines.push('                  exporter="OpenAI Codex"');
  lines.push('                  exporterVersion="1.0">');
  lines.push('  <bpmn:process id="Process_ASIS_Defect_AI_ClosedLoop" name="AS-IS 가설: 불량 분석 ~ Closed Loop 구축" isExecutable="false">');
  lines.push('    <bpmn:documentation>순서도.png의 파란색 TO-BE 개선 대상 15개를 역산한 AS-IS 가설 모델이다. 시간은 1회 수행의 작업시간과 대기시간을 합산한 대표 Lead Time 가정치이며 1일은 8 업무시간으로 환산한다. 실제 현행 인터뷰, 시스템 로그, 리드타임 및 재작업률 측정으로 검증해야 한다. [B]=Bottleneck, [D]=Delay, [W]=Waste. ECRSA는 Eliminate, Combine, Rearrange, Simplify, Automate를 의미한다.</bpmn:documentation>');
  lines.push('    <bpmn:laneSet id="LaneSet_ASIS_Main">');
  for (const lane of lanes) {
    lines.push('      <bpmn:lane id="' + lane.id + '" name="' + xmlEscape(lane.name) + '">');
    for (const node of topNodes.filter((item) => item.lane === lane.id)) {
      lines.push('        <bpmn:flowNodeRef>' + node.id + '</bpmn:flowNodeRef>');
    }
    lines.push('      </bpmn:lane>');
  }
  lines.push('    </bpmn:laneSet>');
  for (const node of topNodes) {
    if (node.kind === 'subProcess') emitSubprocess(lines, node, '    ');
    else emitBasicNode(lines, node, '    ');
  }
  for (const edge of topEdges) {
    let attributes = ' id="' + edge.id + '"';
    if (edge.name) attributes += ' name="' + xmlEscape(edge.name) + '"';
    attributes += ' sourceRef="' + edge.source + '" targetRef="' + edge.target + '"';
    lines.push('    <bpmn:sequenceFlow' + attributes + ' />');
  }
  lines.push('    <bpmn:textAnnotation id="TextAnnotation_ASIS_Legend">');
  lines.push('      <bpmn:text>가정 기반 AS-IS');
  lines.push('[B] Bottleneck  [D] Delay  [W] Waste');
  lines.push('E 제거 · C 결합 · R 재배열 · S 단순화 · A 자동화');
  lines.push('LT = 작업 + 대기 Lead Time 가정치 · 1일=8h');
  lines.push('현장 인터뷰·시스템 로그·리드타임 측정으로 검증 필요</bpmn:text>');
  lines.push('    </bpmn:textAnnotation>');
  lines.push('  </bpmn:process>');
  lines.push('  <bpmn:collaboration id="Collaboration_ASIS_Defect_AI_ClosedLoop">');
  lines.push('    <bpmn:participant id="Participant_ASIS_Main" name="AS-IS 가설 프로세스" processRef="Process_ASIS_Defect_AI_ClosedLoop" />');
  lines.push('  </bpmn:collaboration>');
  lines.push('  <bpmndi:BPMNDiagram id="BPMNDiagram_ASIS_Defect_AI_ClosedLoop">');
  lines.push('    <bpmndi:BPMNPlane id="BPMNPlane_ASIS_Defect_AI_ClosedLoop" bpmnElement="Collaboration_ASIS_Defect_AI_ClosedLoop">');
  lines.push('      <bpmndi:BPMNShape id="Participant_ASIS_Main_di" bpmnElement="Participant_ASIS_Main" isHorizontal="true">');
  lines.push('        <dc:Bounds x="60" y="100" width="3900" height="1860" />');
  lines.push('      </bpmndi:BPMNShape>');
  for (const lane of lanes) {
    lines.push('      <bpmndi:BPMNShape id="' + lane.id + '_di" bpmnElement="' + lane.id + '" isHorizontal="true" bioc:fill="' + lane.fill + '" bioc:stroke="#94A3B8">');
    lines.push('        <dc:Bounds x="90" y="' + lane.y + '" width="3870" height="' + lane.h + '" />');
    lines.push('      </bpmndi:BPMNShape>');
  }
  for (const node of topNodes) {
    let attributes = ' id="' + node.id + '_di" bpmnElement="' + node.id + '"';
    if (node.kind === 'subProcess') attributes += ' isExpanded="true" bioc:fill="#EFF6FF" bioc:stroke="#2563EB"';
    if (node.kind === 'exclusiveGateway') attributes += ' isMarkerVisible="false"';
    lines.push('      <bpmndi:BPMNShape' + attributes + '>');
    lines.push('        <dc:Bounds x="' + node.x + '" y="' + node.y + '" width="' + node.w + '" height="' + node.h + '" />');
    if (node.label) {
      lines.push('        <bpmndi:BPMNLabel>');
      lines.push('          <dc:Bounds x="' + node.label.x + '" y="' + node.label.y + '" width="' + node.label.w + '" height="' + node.label.h + '" />');
      lines.push('        </bpmndi:BPMNLabel>');
    } else if (node.kind === 'startEvent' || node.kind === 'endEvent') {
      lines.push('        <bpmndi:BPMNLabel>');
      lines.push('          <dc:Bounds x="' + (node.x - 4) + '" y="' + (node.y + node.h + 4) + '" width="44" height="20" />');
      lines.push('        </bpmndi:BPMNLabel>');
    }
    lines.push('      </bpmndi:BPMNShape>');
    if (node.kind === 'subProcess') {
      const internal = internalModel(node);
      for (const internalNode of internal.nodes) {
        let colorAttributes = '';
        if (internalNode.kind === 'task') {
          const primary = internalNode.issues.includes('B') ? 'B' : internalNode.issues.includes('D') ? 'D' : 'W';
          colorAttributes = ' bioc:fill="' + issueMeta[primary].pale + '" bioc:stroke="' + issueMeta[primary].color + '"';
        }
        lines.push('      <bpmndi:BPMNShape id="' + internalNode.id + '_di" bpmnElement="' + internalNode.id + '"' + colorAttributes + '>');
        lines.push('        <dc:Bounds x="' + internalNode.x + '" y="' + internalNode.y + '" width="' + internalNode.w + '" height="' + internalNode.h + '" />');
        lines.push('      </bpmndi:BPMNShape>');
      }
    }
  }
  lines.push('      <bpmndi:BPMNShape id="TextAnnotation_ASIS_Legend_di" bpmnElement="TextAnnotation_ASIS_Legend">');
  lines.push('        <dc:Bounds x="2800" y="130" width="850" height="125" />');
  lines.push('      </bpmndi:BPMNShape>');
  for (const edge of topEdges) {
    lines.push('      <bpmndi:BPMNEdge id="' + edge.id + '_di" bpmnElement="' + edge.id + '">');
    for (const point of edge.points) {
      lines.push('        <di:waypoint x="' + point[0] + '" y="' + point[1] + '" />');
    }
    if (edge.label) {
      lines.push('        <bpmndi:BPMNLabel>');
      lines.push('          <dc:Bounds x="' + edge.label.x + '" y="' + edge.label.y + '" width="' + edge.label.w + '" height="' + edge.label.h + '" />');
      lines.push('        </bpmndi:BPMNLabel>');
    }
    lines.push('      </bpmndi:BPMNEdge>');
  }
  for (const node of topNodes.filter((item) => item.kind === 'subProcess')) {
    const internal = internalModel(node);
    for (const edge of internal.edges) {
      lines.push('      <bpmndi:BPMNEdge id="' + edge.id + '_di" bpmnElement="' + edge.id + '">');
      for (const point of edge.points) {
        lines.push('        <di:waypoint x="' + point[0] + '" y="' + point[1] + '" />');
      }
      lines.push('      </bpmndi:BPMNEdge>');
    }
  }
  lines.push('    </bpmndi:BPMNPlane>');
  lines.push('  </bpmndi:BPMNDiagram>');
  lines.push('</bpmn:definitions>');
  return lines.join('\n') + '\n';
}

function textLength(value) {
  return Array.from(value).length;
}

function shorten(value, max) {
  const chars = Array.from(value);
  if (chars.length <= max) return value;
  return chars.slice(0, Math.max(1, max - 1)).join('') + '…';
}

function wrapText(value, maxChars, maxLines) {
  const words = String(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? current + ' ' + word : word;
    if (textLength(candidate) <= maxChars) {
      current = candidate;
      continue;
    }
    if (current) {
      lines.push(current);
      current = '';
    }
    if (textLength(word) <= maxChars) {
      current = word;
    } else {
      const chars = Array.from(word);
      while (chars.length > maxChars) {
        lines.push(chars.splice(0, maxChars).join(''));
      }
      current = chars.join('');
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = shorten(kept[maxLines - 1] + lines.slice(maxLines).join(''), maxChars);
    return kept;
  }
  return lines;
}

function svgTextLines(lines, x, y, lineHeight, className, anchor) {
  const textAnchor = anchor || 'middle';
  const spans = lines.map((line, index) => '<tspan x="' + x + '" dy="' + (index === 0 ? 0 : lineHeight) + '">' + svgEscape(line) + '</tspan>').join('');
  return '<text x="' + x + '" y="' + y + '" text-anchor="' + textAnchor + '" class="' + className + '">' + spans + '</text>';
}

function svgPolyline(edge, marker) {
  const points = edge.points.map((point) => point.join(',')).join(' ');
  const className = edge.style === 'rework' ? 'flow rework' : 'flow';
  return '<polyline class="' + className + '" points="' + points + '" marker-end="url(#' + (marker || 'arrow') + ')" />';
}

function drawIssueBadges(issues, x, y) {
  const parts = [];
  issues.forEach((code, index) => {
    const meta = issueMeta[code];
    const bx = x + index * 22;
    parts.push('<rect x="' + bx + '" y="' + y + '" width="18" height="18" rx="5" fill="' + meta.pale + '" stroke="' + meta.color + '" />');
    parts.push('<text x="' + (bx + 9) + '" y="' + (y + 13) + '" text-anchor="middle" font-size="11" font-weight="700" fill="' + meta.color + '">' + code + '</text>');
  });
  return parts.join('');
}

function drawSubprocessSvg(node) {
  const item = subprocessByCode[node.code];
  const metric = improvementMetrics[node.code];
  const internal = internalModel(node);
  const parts = [];
  parts.push('<g id="svg_' + node.id + '">');
  parts.push('<rect x="' + node.x + '" y="' + node.y + '" width="' + node.w + '" height="' + node.h + '" rx="14" class="asis-cluster" />');
  parts.push('<text x="' + (node.x + 18) + '" y="' + (node.y + 27) + '" class="cluster-title">' + svgEscape(item.item + ' · TO-BE 대응: ' + item.name) + '</text>');
  for (const edge of internal.edges) parts.push(svgPolyline(edge));
  for (const internalNode of internal.nodes) {
    if (internalNode.kind === 'startEvent') {
      parts.push('<circle cx="' + (internalNode.x + 12) + '" cy="' + (internalNode.y + 12) + '" r="12" class="event-start" />');
    } else if (internalNode.kind === 'endEvent') {
      parts.push('<circle cx="' + (internalNode.x + 12) + '" cy="' + (internalNode.y + 12) + '" r="12" class="event-end" />');
      parts.push('<circle cx="' + (internalNode.x + 12) + '" cy="' + (internalNode.y + 12) + '" r="8" class="event-end-inner" />');
    } else {
      const primary = internalNode.issues.includes('B') ? 'B' : internalNode.issues.includes('D') ? 'D' : 'W';
      const meta = issueMeta[primary];
      parts.push('<rect x="' + internalNode.x + '" y="' + internalNode.y + '" width="' + internalNode.w + '" height="' + internalNode.h + '" rx="9" fill="#FFFFFF" stroke="#CBD5E1" />');
      parts.push('<rect x="' + internalNode.x + '" y="' + internalNode.y + '" width="6" height="' + internalNode.h + '" rx="3" fill="' + meta.color + '" />');
      const wrapped = wrapText(internalNode.name, 10, 3);
      parts.push(svgTextLines(wrapped, internalNode.x + internalNode.w / 2 + 3, internalNode.y + 23, 17, 'step-text'));
      parts.push('<rect x="' + (internalNode.x + 12) + '" y="' + (internalNode.y + internalNode.h - 23) + '" width="42" height="18" rx="5" fill="#F1F5F9" stroke="#94A3B8" />');
      parts.push('<text x="' + (internalNode.x + 33) + '" y="' + (internalNode.y + internalNode.h - 10) + '" text-anchor="middle" font-size="11" font-weight="700" fill="#334155">' + formatHours(internalNode.durationHours) + '</text>');
      parts.push(drawIssueBadges(internalNode.issues, internalNode.x + internalNode.w - 9 - internalNode.issues.length * 22, internalNode.y + internalNode.h - 23));
    }
  }
  const summary = '가정 LT ' + formatHours(metric.asisHours) + ' → ' + formatHours(metric.tobeHours) + ' · ' + metric.ecrsa.join('/') + ' · ' + reductionPercent(metric.asisHours, metric.tobeHours) + '%↓';
  parts.push('<text x="' + (node.x + node.w / 2) + '" y="' + (node.y + node.h - 5) + '" text-anchor="middle" font-size="12.5" font-weight="800" fill="#1D4ED8">' + svgEscape(summary) + '</text>');
  parts.push('</g>');
  return parts.join('');
}

function drawTopNodeSvg(node) {
  if (node.kind === 'subProcess') return drawSubprocessSvg(node);
  const parts = [];
  if (node.kind === 'task') {
    parts.push('<rect x="' + node.x + '" y="' + node.y + '" width="' + node.w + '" height="' + node.h + '" rx="10" class="normal-task" />');
    const wrapped = wrapText(node.name, 11, 3);
    parts.push(svgTextLines(wrapped, node.x + node.w / 2, node.y + 30, 21, 'normal-task-text'));
  } else if (node.kind === 'startEvent') {
    parts.push('<circle cx="' + (node.x + node.w / 2) + '" cy="' + (node.y + node.h / 2) + '" r="' + (node.w / 2) + '" class="event-start root-event" />');
    parts.push('<text x="' + (node.x + node.w / 2) + '" y="' + (node.y + node.h + 20) + '" text-anchor="middle" class="small-label">' + svgEscape(node.name) + '</text>');
  } else if (node.kind === 'endEvent') {
    parts.push('<circle cx="' + (node.x + node.w / 2) + '" cy="' + (node.y + node.h / 2) + '" r="' + (node.w / 2) + '" class="event-end root-event" />');
    parts.push('<circle cx="' + (node.x + node.w / 2) + '" cy="' + (node.y + node.h / 2) + '" r="' + (node.w / 2 - 5) + '" class="event-end-inner" />');
    parts.push('<text x="' + (node.x + node.w / 2) + '" y="' + (node.y + node.h + 20) + '" text-anchor="middle" class="small-label">' + svgEscape(node.name) + '</text>');
  } else {
    const cx = node.x + node.w / 2;
    const cy = node.y + node.h / 2;
    const points = [
      [cx, node.y],
      [node.x + node.w, cy],
      [cx, node.y + node.h],
      [node.x, cy]
    ].map((point) => point.join(',')).join(' ');
    parts.push('<polygon points="' + points + '" class="gateway" />');
    if (node.kind === 'parallelGateway') {
      parts.push('<line x1="' + (cx - 13) + '" y1="' + cy + '" x2="' + (cx + 13) + '" y2="' + cy + '" class="gateway-marker" />');
      parts.push('<line x1="' + cx + '" y1="' + (cy - 13) + '" x2="' + cx + '" y2="' + (cy + 13) + '" class="gateway-marker" />');
    }
    parts.push('<text x="' + (node.label.x + node.label.w / 2) + '" y="' + (node.label.y + 16) + '" text-anchor="middle" class="gateway-label">' + svgEscape(node.name) + '</text>');
  }
  return parts.join('');
}

function buildSvg() {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<svg xmlns="http://www.w3.org/2000/svg" width="4000" height="2020" viewBox="0 0 4000 2020" role="img" aria-labelledby="title desc">');
  lines.push('  <title id="title">AS-IS 프로세스 가설 — 불량 분석부터 Closed Loop 구축까지</title>');
  lines.push('  <desc id="desc">TO-BE 순서도의 파란색 개선 대상 15개에서 역산한 가정 기반 AS-IS 흐름. Bottleneck, Delay, Waste, ECRSA 적용항목과 AS-IS·TO-BE Lead Time을 표시한다.</desc>');
  lines.push('  <defs>');
  lines.push('    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#475569" /></marker>');
  lines.push('    <style>');
  lines.push("      text { font-family: 'Noto Sans KR', 'Noto Sans CJK KR', 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif; fill: #0F172A; }");
  lines.push('      .lane { stroke: #CBD5E1; stroke-width: 2; }');
  lines.push('      .lane-header { fill: #E5E7EB; stroke: #94A3B8; stroke-width: 2; }');
  lines.push('      .lane-title { font-size: 23px; font-weight: 700; }');
  lines.push('      .flow { fill: none; stroke: #475569; stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }');
  lines.push('      .flow.rework { stroke: #D97706; stroke-dasharray: 10 7; }');
  lines.push('      .asis-cluster { fill: #EFF6FF; stroke: #2563EB; stroke-width: 2.5; stroke-dasharray: 9 6; }');
  lines.push('      .cluster-title { font-size: 16px; font-weight: 700; fill: #1D4ED8; }');
  lines.push('      .normal-task { fill: #FFFFFF; stroke: #64748B; stroke-width: 2; }');
  lines.push('      .normal-task-text { font-size: 18px; font-weight: 600; }');
  lines.push('      .step-text { font-size: 14px; font-weight: 600; }');
  lines.push('      .gateway { fill: #FFFFFF; stroke: #475569; stroke-width: 2.5; }');
  lines.push('      .gateway-marker { stroke: #475569; stroke-width: 4; }');
  lines.push('      .gateway-label { font-size: 16px; font-weight: 700; }');
  lines.push('      .event-start { fill: #FFFFFF; stroke: #475569; stroke-width: 2; }');
  lines.push('      .event-end { fill: #FFFFFF; stroke: #0F172A; stroke-width: 3; }');
  lines.push('      .event-end-inner { fill: none; stroke: #0F172A; stroke-width: 2; }');
  lines.push('      .root-event { stroke-width: 3; }');
  lines.push('      .small-label { font-size: 14px; font-weight: 600; }');
  lines.push('      .edge-label { font-size: 14px; font-weight: 700; }');
  lines.push('    </style>');
  lines.push('  </defs>');
  lines.push('  <rect width="4000" height="2020" fill="#FFFFFF" />');
  lines.push('  <text x="40" y="46" font-size="32" font-weight="800">AS-IS 프로세스 가설 — 불량 분석부터 Closed Loop 구축까지</text>');
  lines.push('  <text x="40" y="76" font-size="17" fill="#475569">※ LT는 작업+대기시간을 포함한 1회 수행 대표 가정치이며 1일=8h입니다. 현장 인터뷰·로그·실측으로 보정해야 합니다.</text>');
  lines.push('  <rect x="2470" y="12" width="1460" height="76" rx="12" fill="#F8FAFC" stroke="#CBD5E1" />');
  lines.push('  <text x="2494" y="40" font-size="15" font-weight="700">PI:</text>');
  let legendX = 2535;
  for (const code of ['B', 'D', 'W']) {
    const meta = issueMeta[code];
    lines.push('  <rect x="' + legendX + '" y="25" width="18" height="18" rx="5" fill="' + meta.pale + '" stroke="' + meta.color + '" />');
    lines.push('  <text x="' + (legendX + 9) + '" y="38" text-anchor="middle" font-size="11" font-weight="800" fill="' + meta.color + '">' + code + '</text>');
    lines.push('  <text x="' + (legendX + 25) + '" y="39" font-size="13">' + meta.label + '</text>');
    legendX += code === 'B' ? 170 : 135;
  }
  lines.push('  <rect x="' + legendX + '" y="21" width="250" height="26" rx="7" fill="#EFF6FF" stroke="#2563EB" stroke-dasharray="7 5" />');
  lines.push('  <text x="' + (legendX + 125) + '" y="39" text-anchor="middle" font-size="13" font-weight="700" fill="#1D4ED8">파란 점선 = TO-BE 대응 묶음</text>');
  lines.push('  <text x="2494" y="69" font-size="14" font-weight="700">ECRSA:</text>');
  lines.push('  <text x="2560" y="69" font-size="13">E 제거 · C 결합 · R 재배열 · S 단순화 · A 자동화</text>');
  lines.push('  <text x="3250" y="69" font-size="13" font-weight="700" fill="#1D4ED8">표기: AS-IS LT → TO-BE LT · 적용코드 · 단축률</text>');
  for (const lane of lanes) {
    lines.push('  <rect x="40" y="' + lane.y + '" width="3920" height="' + lane.h + '" fill="' + lane.fill + '" class="lane" />');
    lines.push('  <rect x="40" y="' + lane.y + '" width="230" height="' + lane.h + '" class="lane-header" />');
    const wrapped = wrapText(lane.name, 9, 4);
    const startY = lane.y + lane.h / 2 - ((wrapped.length - 1) * 16);
    lines.push('  ' + svgTextLines(wrapped, 155, startY, 32, 'lane-title'));
  }
  for (const edge of topEdges) {
    lines.push('  ' + svgPolyline(edge));
  }
  for (const node of topNodes) {
    lines.push('  ' + drawTopNodeSvg(node));
  }
  for (const edge of topEdges.filter((item) => item.label)) {
    lines.push('  <rect x="' + edge.label.x + '" y="' + edge.label.y + '" width="' + edge.label.w + '" height="' + edge.label.h + '" rx="5" fill="#FFFFFF" fill-opacity="0.92" />');
    lines.push('  <text x="' + (edge.label.x + edge.label.w / 2) + '" y="' + (edge.label.y + 15) + '" text-anchor="middle" class="edge-label">' + svgEscape(edge.name) + '</text>');
  }
  lines.push('</svg>');
  return lines.join('\n') + '\n';
}

function buildNotes() {
  const lines = [];
  lines.push('# AS-IS 프로세스 가정');
  lines.push('');
  lines.push('이 문서는 순서도.png에서 파란색으로 표시된 15개 TO-BE 개선 대상을 기준으로, 효율화 이전 상태를 역산한 가설입니다. 실제 현행 프로세스는 담당자 인터뷰, 시스템 로그, 리드타임, 재작업률로 검증해야 합니다.');
  lines.push('');
  lines.push('PI 분류: **B = Bottleneck**, **D = Delay**, **W = Waste**');
  lines.push('');
  lines.push('시간은 1회 수행 시 작업시간과 대기시간을 합한 대표 Lead Time 가정치입니다. 반복 횟수, 병렬 수행, 재작업률에 따라 실제 End-to-End 시간은 달라집니다.');
  lines.push('');
  lines.push('| ID | TO-BE 개선 대상 | 가정한 AS-IS 상세 흐름과 시간 | AS-IS LT | 주요 가설 |');
  lines.push('|---|---|---|---:|---|');
  for (const item of subprocesses) {
    const metric = improvementMetrics[item.code];
    const steps = item.steps.map((step, index) => xmlEscape(step[0]) + ' [' + step[1].join('/') + ', ' + formatHours(stepDurations[item.code][index]) + ']').join(' → ');
    lines.push('| ' + item.item + ' | ' + item.name + ' | ' + steps + ' | ' + formatHours(metric.asisHours) + ' | ' + item.hypothesis + ' |');
  }
  lines.push('');
  lines.push('## 모델링 해석');
  lines.push('');
  lines.push('- 기존 6개 가로 행은 하나의 pool 안의 6개 swim lane으로 유지했습니다.');
  lines.push('- 파란색 TO-BE 항목은 I01~I15 expanded subprocess로 만들고, 내부에 AS-IS 수작업·대기·재작업 단계를 배치했습니다.');
  lines.push('- 제품 정보 확인은 정보 충분 여부를 명확한 exclusive gateway로 해석했습니다.');
  lines.push('- 이상치 제거와 Label 생성은 모두 수행되어야 하므로 parallel fork/join으로 표현했습니다.');
  lines.push('- Data 품질 미달은 개발 환경 및 도구 설정 단계로, 기능검증 개선 필요는 코드 개선과 Parameter 최적화 뒤 재검증으로 되돌렸습니다.');
  lines.push('- 시작·종료 이벤트는 BPMN 완결성을 위해 추가했습니다.');
  lines.push('');
  lines.push('## 현장 검증 질문');
  lines.push('');
  lines.push('1. 실제 사용 시스템과 파일 전달 채널은 무엇이며 동일 정보를 몇 번 재입력하는가?');
  lines.push('2. 각 인계·승인·전문가 회신의 평균 및 최장 대기시간은 얼마인가?');
  lines.push('3. 단계별 수작업 접점, 재작업률, 오류율은 얼마인가?');
  lines.push('4. 특정 담당자·GPU·서버에 작업이 집중되는 구간과 대기열은 어디인가?');
  lines.push('5. 코드·데이터·환경 버전 불일치로 재현이나 재학습에 실패한 빈도는 얼마인가?');
  lines.push('6. TO-BE 적용 전후 리드타임, 작업시간, 오류율, 재작업률을 어떤 KPI로 비교할 것인가?');
  return lines.join('\n') + '\n';
}

function buildEcrsaReport() {
  const lines = [];
  const projectItems = subprocesses.filter((item) => !['MON', 'ANO'].includes(item.code));
  const totals = projectItems.reduce((sum, item) => {
    const metric = improvementMetrics[item.code];
    sum.asis += metric.asisHours;
    sum.tobe += metric.tobeHours;
    return sum;
  }, { asis: 0, tobe: 0 });
  totals.asis -= Math.min(improvementMetrics.OUT.asisHours, improvementMetrics.LBL.asisHours);
  totals.tobe -= Math.min(improvementMetrics.OUT.tobeHours, improvementMetrics.LBL.tobeHours);
  const totalReduction = ((1 - totals.tobe / totals.asis) * 100).toFixed(1);
  lines.push('# ECRSA 개선효과 가정');
  lines.push('');
  lines.push('## 산정 기준');
  lines.push('');
  lines.push('- 대상: 순서도.png에서 파란색으로 표시된 15개 개선 항목');
  lines.push('- 단위: 1회 수행의 작업시간 + 대기시간을 합한 대표 Lead Time');
  lines.push('- 전제: 공통 Connector·Schema·Module 등 표준 자산을 보유한 반복 적용 단계이며, 최초 Platform 구축 투자시간은 제외');
  lines.push('- 주의: 실측 전 가정치이며, 병렬 단계·선택 경로·재작업 횟수 때문에 단순 합계는 실제 End-to-End 시간과 다를 수 있음');
  lines.push('');
  lines.push('참고용 I01~I13 대표 케이스 소계(이상치 제거/Label 생성 병렬=max, 재작업 0회): **' + formatHours(totals.asis) + ' → ' + formatHours(totals.tobe) + ' (약 ' + totalReduction + '% 단축)**');
  lines.push('');
  lines.push('I14 모니터링은 회차당, I15 이상점 감지는 이상 후보 건당 지표이므로 위 소계에서 제외했습니다. 이 소계 역시 흰색 비개선 단계가 빠진 참고값이며 전체 프로세스 Lead Time이 아닙니다.');
  lines.push('');
  lines.push('## ECRSA 코드');
  lines.push('');
  lines.push('| 코드 | 의미 | 적용 관점 |');
  lines.push('|---|---|---|');
  lines.push('| E | Eliminate / 제거 | 불필요한 입력·전달·중복·대기 제거 |');
  lines.push('| C | Combine / 결합 | 분산 정보·시스템·작업 통합 |');
  lines.push('| R | Rearrange / 재배열 | 순서 변경, 병렬화, 사후 대응의 상시화 |');
  lines.push('| S | Simplify / 단순화 | 기준·양식·환경·Interface 표준화 |');
  lines.push('| A | Automate / 자동화 | Pipeline, 검증, 학습, Monitoring 자동 실행 |');
  lines.push('');
  lines.push('## 항목별 개선효과');
  lines.push('');
  lines.push('| ID | TO-BE 항목 | 기준 | ECRSA | AS-IS LT | TO-BE LT | 단축 | 개선 내용 |');
  lines.push('|---|---|---|---|---:|---:|---:|---|');
  for (const item of subprocesses) {
    const metric = improvementMetrics[item.code];
    const basis = item.code === 'MON' ? '모니터링 1회' : item.code === 'ANO' ? '이상 후보 1건' : '대표 1건/1회';
    lines.push('| ' + item.item + ' | ' + item.name + ' | ' + basis + ' | ' + metric.ecrsa.join('/') + ' | ' + formatHours(metric.asisHours) + ' | ' + formatHours(metric.tobeHours) + ' | ' + reductionPercent(metric.asisHours, metric.tobeHours) + '% | ' + metric.improvement + ' |');
  }
  lines.push('');
  lines.push('## 실측 시 교체할 값');
  lines.push('');
  lines.push('- AS-IS: 평균/중앙/최장 Lead Time, 실제 작업시간, 대기시간, 재작업률');
  lines.push('- TO-BE: 자동 실행시간, 사용자 개입시간, 실패율, 재처리시간');
  lines.push('- 효과: 시간 단축률뿐 아니라 오류율, 재현성, 처리량, 담당자 의존도도 함께 비교');
  return lines.join('\n') + '\n';
}

function csvEscape(value) {
  const text = String(value);
  return /[",\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
}

function buildEcrsaCsv() {
  const rows = [[
    'ID', 'TO-BE 항목', '시간 기준', 'ECRSA 코드', 'ECRSA 의미',
    'AS-IS LT(h)', 'TO-BE LT(h)', '단축시간(h)', '단축률(%)', '개선 내용'
  ]];
  for (const item of subprocesses) {
    const metric = improvementMetrics[item.code];
    const basis = item.code === 'MON' ? '모니터링 1회' : item.code === 'ANO' ? '이상 후보 1건' : '대표 1건/1회';
    rows.push([
      item.item,
      item.name,
      basis,
      metric.ecrsa.join('/'),
      metric.ecrsa.map((code) => ecrsaMeta[code].ko).join('/'),
      metric.asisHours,
      metric.tobeHours,
      metric.asisHours - metric.tobeHours,
      reductionPercent(metric.asisHours, metric.tobeHours),
      metric.improvement
    ]);
  }
  return '\uFEFF' + rows.map((row) => row.map(csvEscape).join(',')).join('\n') + '\n';
}

fs.writeFileSync(bpmnPath, buildBpmn(), 'utf8');
fs.writeFileSync(svgPath, buildSvg(), 'utf8');
fs.writeFileSync(notePath, buildNotes(), 'utf8');
fs.writeFileSync(ecrsaReportPath, buildEcrsaReport(), 'utf8');
fs.writeFileSync(ecrsaCsvPath, buildEcrsaCsv(), 'utf8');

console.log('generated ' + bpmnPath);
console.log('generated ' + svgPath);
console.log('generated ' + notePath);
console.log('generated ' + ecrsaReportPath);
console.log('generated ' + ecrsaCsvPath);
