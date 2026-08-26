import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ecrsaMeta,
  improvementMetrics,
  formatHours,
  reductionPercent
} from './ecrsa_data.mjs';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(outputDir, '순서도-TO-BE.bpmn');

const improvementInfo = {
  PIC: { item: 'I01', name: '제품 정보 확인' },
  PRA: { item: 'I02', name: '공정 분석 (Commonality)' },
  DPL: { item: 'I03', name: 'Data Pipeline 설계' },
  DBD: { item: 'I04', name: 'DB 설계' },
  DEV: { item: 'I05', name: '개발 환경 및 도구 설정' },
  OUT: { item: 'I06', name: '이상치 제거' },
  LBL: { item: 'I07', name: 'Label 생성' },
  DQC: { item: 'I08', name: 'Data 품질확인' },
  TDS: { item: 'I09', name: 'AI Training Data Set 구축' },
  DLG: { item: 'I10', name: 'Detect logic 설계' },
  MDA: { item: 'I11', name: '모델 구조 설계 및 구현' },
  MTR: { item: 'I12', name: '모델 학습' },
  CIM: { item: 'I13', name: '코드 개선' },
  MON: { item: 'I14', name: '모니터링 실행' },
  ANO: { item: 'I15', name: '이상점 감지' }
};

const lanes = [
  { id: 'Lane_Defect_Definition', name: '불량 분석 및 과제 정의', y: 100, h: 200, fill: '#FFFFFF' },
  { id: 'Lane_Defect_Factor_Analysis', name: '불량 협의 인자 분석', y: 300, h: 200, fill: '#F8FAFC' },
  { id: 'Lane_Production_Data', name: '양산 데이터 확보', y: 500, h: 200, fill: '#FFFFFF' },
  { id: 'Lane_AI_Environment_Preprocessing', name: 'AI 구축 환경 준비 데이터 전처리', y: 700, h: 300, fill: '#F8FAFC' },
  { id: 'Lane_AI_Model_Development', name: 'AI 모델 설계 및 개발', y: 1000, h: 260, fill: '#FFFFFF' },
  { id: 'Lane_Monitoring_Optimization', name: '모니터링 및 이상감지 최적화', y: 1260, h: 220, fill: '#F8FAFC' }
];

function improvedName(code) {
  const info = improvementInfo[code];
  const metric = improvementMetrics[code];
  return info.item + ' ' + info.name + '\n[' + metric.ecrsa.join('/') + ' · ' + formatHours(metric.asisHours) + '→' + formatHours(metric.tobeHours) + ']';
}

function task(id, name, lane, x, y, w, h, code) {
  return {
    id,
    kind: 'task',
    name: code ? improvedName(code) : name,
    baseName: name,
    lane,
    x,
    y,
    w,
    h,
    code: code || null
  };
}

function gateway(id, kind, name, lane, x, y, w, h, direction, label, defaultFlow) {
  return { id, kind, name, lane, x, y, w, h, direction, label, defaultFlow: defaultFlow || null };
}

const nodes = [
  { id: 'StartEvent_Process', kind: 'startEvent', name: '시작', lane: 'Lane_Defect_Definition', x: 180, y: 182, w: 36, h: 36 },
  task('Task_Defect_Receipt', '불량 현상 접수', 'Lane_Defect_Definition', 250, 160, 170, 80),
  task('Task_Product_Info_Check', '제품 정보 확인', 'Lane_Defect_Definition', 480, 150, 230, 100, 'PIC'),
  gateway('Gateway_Product_Info_Result', 'exclusiveGateway', '제품 정보 충분?', 'Lane_Defect_Definition', 760, 175, 60, 60, 'Diverging', { x: 725, y: 242, w: 130, h: 22 }, 'Flow_Product_Info_Insufficient'),

  task('Task_Physical_Analysis', '실물 분석 (eFA, pFA)', 'Lane_Defect_Factor_Analysis', 300, 360, 180, 80),
  gateway('Gateway_Process_Analysis_Merge', 'exclusiveGateway', '공정 분석 진입 합류', 'Lane_Defect_Factor_Analysis', 530, 370, 60, 60, 'Converging', { x: 500, y: 436, w: 120, h: 22 }),
  task('Task_Process_Analysis', '공정 분석 (Commonality)', 'Lane_Defect_Factor_Analysis', 640, 350, 250, 100, 'PRA'),

  task('Task_Data_Acquisition', 'Data 확보 및 검증', 'Lane_Production_Data', 300, 560, 170, 80),
  task('Task_Data_Pipeline', 'Data Pipeline 설계', 'Lane_Production_Data', 540, 550, 230, 100, 'DPL'),
  task('Task_DB_Design', 'DB 설계', 'Lane_Production_Data', 830, 550, 220, 100, 'DBD'),

  task('Task_AI_Feasibility', 'AI 적용 타당성 검토', 'Lane_AI_Environment_Preprocessing', 300, 810, 170, 80),
  gateway('Gateway_Environment_Merge', 'exclusiveGateway', '환경 설정 진입 합류', 'Lane_AI_Environment_Preprocessing', 520, 820, 60, 60, 'Converging', { x: 480, y: 785, w: 140, h: 22 }),
  task('Task_Development_Environment', '개발 환경 및 도구 설정', 'Lane_AI_Environment_Preprocessing', 610, 800, 230, 100, 'DEV'),
  gateway('Gateway_Preprocessing_Fork', 'parallelGateway', '전처리 병렬 분기', 'Lane_AI_Environment_Preprocessing', 890, 820, 60, 60, 'Diverging', { x: 855, y: 886, w: 130, h: 22 }),
  task('Task_Outlier_Removal', '이상치 제거', 'Lane_AI_Environment_Preprocessing', 980, 720, 220, 90, 'OUT'),
  task('Task_Label_Generation', 'Label 생성', 'Lane_AI_Environment_Preprocessing', 980, 880, 220, 90, 'LBL'),
  gateway('Gateway_Preprocessing_Join', 'parallelGateway', '전처리 병렬 합류', 'Lane_AI_Environment_Preprocessing', 1250, 820, 60, 60, 'Converging', { x: 1215, y: 886, w: 130, h: 22 }),
  task('Task_Data_Quality_Check', 'Data 품질확인', 'Lane_AI_Environment_Preprocessing', 1340, 800, 220, 100, 'DQC'),
  gateway('Gateway_Data_Quality_Result', 'exclusiveGateway', '품질 기준 충족?', 'Lane_AI_Environment_Preprocessing', 1610, 820, 60, 60, 'Diverging', { x: 1575, y: 886, w: 130, h: 22 }, 'Flow_Data_Quality_Rework'),
  task('Task_Training_Dataset', 'AI Training Data Set 구축', 'Lane_AI_Environment_Preprocessing', 1720, 800, 250, 100, 'TDS'),

  task('Task_Model_Selection', '이상 감지 모델 선정', 'Lane_AI_Model_Development', 300, 1090, 170, 80),
  task('Task_Detect_Logic', 'Detect logic 설계', 'Lane_AI_Model_Development', 540, 1080, 220, 100, 'DLG'),
  task('Task_Model_Architecture', '모델 구조 설계 및 구현', 'Lane_AI_Model_Development', 810, 1080, 230, 100, 'MDA'),
  task('Task_Model_Training', '모델 학습', 'Lane_AI_Model_Development', 1100, 1080, 220, 100, 'MTR'),
  task('Task_Test_Environment', '테스트 환경 및 도구 구성', 'Lane_AI_Model_Development', 1380, 1090, 190, 80),
  gateway('Gateway_Function_Merge', 'exclusiveGateway', '기능검증 진입 합류', 'Lane_AI_Model_Development', 1610, 1105, 50, 50, 'Converging', { x: 1575, y: 1068, w: 120, h: 22 }),
  task('Task_Function_Validation', '기능검증 수행', 'Lane_AI_Model_Development', 1690, 1090, 190, 80),
  gateway('Gateway_Function_Result', 'exclusiveGateway', '기능 기준 충족?', 'Lane_AI_Model_Development', 1920, 1100, 60, 60, 'Diverging', { x: 1885, y: 1166, w: 130, h: 22 }, 'Flow_Function_Rework'),
  task('Task_Code_Improvement', '코드 개선', 'Lane_AI_Model_Development', 2030, 1080, 220, 100, 'CIM'),
  task('Task_Parameter_Optimization', 'Parameter 최적화', 'Lane_AI_Model_Development', 2300, 1090, 190, 80),

  task('Task_Monitoring', '모니터링 실행', 'Lane_Monitoring_Optimization', 300, 1320, 230, 100, 'MON'),
  task('Task_Anomaly_Detection', '이상점 감지', 'Lane_Monitoring_Optimization', 590, 1320, 230, 100, 'ANO'),
  task('Task_Defect_Conformity', '불량 정합성 확인', 'Lane_Monitoring_Optimization', 880, 1330, 190, 80),
  task('Task_Closed_Loop', 'Closed Loop 구축', 'Lane_Monitoring_Optimization', 1120, 1330, 190, 80),
  { id: 'EndEvent_Process', kind: 'endEvent', name: '종료', lane: 'Lane_Monitoring_Optimization', x: 1370, y: 1352, w: 36, h: 36 }
];

const edges = [
  { id: 'Flow_Start_To_Receipt', source: 'StartEvent_Process', target: 'Task_Defect_Receipt', points: [[216, 200], [250, 200]] },
  { id: 'Flow_Receipt_To_Product_Info', source: 'Task_Defect_Receipt', target: 'Task_Product_Info_Check', points: [[420, 200], [480, 200]] },
  { id: 'Flow_Product_Info_To_Result', source: 'Task_Product_Info_Check', target: 'Gateway_Product_Info_Result', points: [[710, 200], [760, 205]] },
  { id: 'Flow_Product_Info_Insufficient', name: '추가 분석 필요', source: 'Gateway_Product_Info_Result', target: 'Task_Physical_Analysis', points: [[790, 235], [790, 280], [390, 280], [390, 360]], label: { x: 435, y: 258, w: 112, h: 20 } },
  { id: 'Flow_Product_Info_Sufficient', name: '정보 충분', source: 'Gateway_Product_Info_Result', target: 'Gateway_Process_Analysis_Merge', condition: 'productInfoSufficient == true', points: [[820, 205], [900, 205], [900, 340], [560, 340], [560, 370]], label: { x: 790, y: 318, w: 75, h: 20 } },
  { id: 'Flow_Physical_To_Process_Merge', source: 'Task_Physical_Analysis', target: 'Gateway_Process_Analysis_Merge', points: [[480, 400], [530, 400]] },
  { id: 'Flow_Process_Merge_To_Analysis', source: 'Gateway_Process_Analysis_Merge', target: 'Task_Process_Analysis', points: [[590, 400], [640, 400]] },
  { id: 'Flow_Process_To_Data', source: 'Task_Process_Analysis', target: 'Task_Data_Acquisition', points: [[765, 450], [765, 480], [385, 480], [385, 560]] },
  { id: 'Flow_Data_To_Pipeline', source: 'Task_Data_Acquisition', target: 'Task_Data_Pipeline', points: [[470, 600], [540, 600]] },
  { id: 'Flow_Pipeline_To_DB', source: 'Task_Data_Pipeline', target: 'Task_DB_Design', points: [[770, 600], [830, 600]] },
  { id: 'Flow_DB_To_Feasibility', source: 'Task_DB_Design', target: 'Task_AI_Feasibility', points: [[940, 650], [940, 680], [385, 680], [385, 810]] },
  { id: 'Flow_Feasibility_To_Environment_Merge', source: 'Task_AI_Feasibility', target: 'Gateway_Environment_Merge', points: [[470, 850], [520, 850]] },
  { id: 'Flow_Environment_Merge_To_Development', source: 'Gateway_Environment_Merge', target: 'Task_Development_Environment', points: [[580, 850], [610, 850]] },
  { id: 'Flow_Development_To_Fork', source: 'Task_Development_Environment', target: 'Gateway_Preprocessing_Fork', points: [[840, 850], [890, 850]] },
  { id: 'Flow_Fork_To_Outlier', source: 'Gateway_Preprocessing_Fork', target: 'Task_Outlier_Removal', points: [[920, 820], [920, 765], [980, 765]] },
  { id: 'Flow_Fork_To_Label', source: 'Gateway_Preprocessing_Fork', target: 'Task_Label_Generation', points: [[920, 880], [920, 925], [980, 925]] },
  { id: 'Flow_Outlier_To_Join', source: 'Task_Outlier_Removal', target: 'Gateway_Preprocessing_Join', points: [[1200, 765], [1265, 835]] },
  { id: 'Flow_Label_To_Join', source: 'Task_Label_Generation', target: 'Gateway_Preprocessing_Join', points: [[1200, 925], [1265, 865]] },
  { id: 'Flow_Join_To_Data_Quality', source: 'Gateway_Preprocessing_Join', target: 'Task_Data_Quality_Check', points: [[1310, 850], [1340, 850]] },
  { id: 'Flow_Data_Quality_To_Result', source: 'Task_Data_Quality_Check', target: 'Gateway_Data_Quality_Result', points: [[1560, 850], [1610, 850]] },
  { id: 'Flow_Data_Quality_Rework', name: '미달 / 재작업', source: 'Gateway_Data_Quality_Result', target: 'Gateway_Environment_Merge', points: [[1640, 820], [1640, 710], [550, 710], [550, 820]], label: { x: 1130, y: 688, w: 112, h: 20 } },
  { id: 'Flow_Data_Quality_Approved', name: '적합', source: 'Gateway_Data_Quality_Result', target: 'Task_Training_Dataset', condition: 'dataQualityApproved == true', points: [[1670, 850], [1720, 850]], label: { x: 1677, y: 825, w: 38, h: 20 } },
  { id: 'Flow_Training_To_Model_Selection', source: 'Task_Training_Dataset', target: 'Task_Model_Selection', points: [[1845, 900], [1845, 980], [385, 980], [385, 1090]] },
  { id: 'Flow_Model_Selection_To_Detect', source: 'Task_Model_Selection', target: 'Task_Detect_Logic', points: [[470, 1130], [540, 1130]] },
  { id: 'Flow_Detect_To_Architecture', source: 'Task_Detect_Logic', target: 'Task_Model_Architecture', points: [[760, 1130], [810, 1130]] },
  { id: 'Flow_Architecture_To_Training', source: 'Task_Model_Architecture', target: 'Task_Model_Training', points: [[1040, 1130], [1100, 1130]] },
  { id: 'Flow_Model_Training_To_Test', source: 'Task_Model_Training', target: 'Task_Test_Environment', points: [[1320, 1130], [1380, 1130]] },
  { id: 'Flow_Test_To_Function_Merge', source: 'Task_Test_Environment', target: 'Gateway_Function_Merge', points: [[1570, 1130], [1610, 1130]] },
  { id: 'Flow_Function_Merge_To_Validation', source: 'Gateway_Function_Merge', target: 'Task_Function_Validation', points: [[1660, 1130], [1690, 1130]] },
  { id: 'Flow_Function_Validation_To_Result', source: 'Task_Function_Validation', target: 'Gateway_Function_Result', points: [[1880, 1130], [1920, 1130]] },
  { id: 'Flow_Function_Rework', name: '개선 필요', source: 'Gateway_Function_Result', target: 'Task_Code_Improvement', points: [[1980, 1130], [2030, 1130]], label: { x: 1983, y: 1105, w: 72, h: 20 } },
  { id: 'Flow_Code_To_Parameter', source: 'Task_Code_Improvement', target: 'Task_Parameter_Optimization', points: [[2250, 1130], [2300, 1130]] },
  { id: 'Flow_Parameter_To_Function_Merge', source: 'Task_Parameter_Optimization', target: 'Gateway_Function_Merge', points: [[2490, 1130], [2550, 1130], [2550, 1020], [1635, 1020], [1635, 1105]] },
  { id: 'Flow_Function_Approved', name: '검증 완료', source: 'Gateway_Function_Result', target: 'Task_Monitoring', condition: 'functionApproved == true', points: [[1950, 1160], [1950, 1240], [415, 1240], [415, 1320]], label: { x: 1380, y: 1218, w: 72, h: 20 } },
  { id: 'Flow_Monitoring_To_Anomaly', source: 'Task_Monitoring', target: 'Task_Anomaly_Detection', points: [[530, 1370], [590, 1370]] },
  { id: 'Flow_Anomaly_To_Conformity', source: 'Task_Anomaly_Detection', target: 'Task_Defect_Conformity', points: [[820, 1370], [880, 1370]] },
  { id: 'Flow_Conformity_To_Closed', source: 'Task_Defect_Conformity', target: 'Task_Closed_Loop', points: [[1070, 1370], [1120, 1370]] },
  { id: 'Flow_Closed_To_End', source: 'Task_Closed_Loop', target: 'EndEvent_Process', points: [[1310, 1370], [1370, 1370]] }
];

const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));

function addReference(map, key, value) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
}

const incoming = new Map();
const outgoing = new Map();
for (const edge of edges) {
  addReference(outgoing, edge.source, edge.id);
  addReference(incoming, edge.target, edge.id);
}

function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function xmlAttribute(value) {
  return xmlEscape(value).replaceAll('\n', '&#10;');
}

function emitReferences(lines, nodeId, indent) {
  for (const id of incoming.get(nodeId) || []) lines.push(indent + '<bpmn:incoming>' + id + '</bpmn:incoming>');
  for (const id of outgoing.get(nodeId) || []) lines.push(indent + '<bpmn:outgoing>' + id + '</bpmn:outgoing>');
}

function improvedDocumentation(code) {
  const info = improvementInfo[code];
  const metric = improvementMetrics[code];
  const ecrsa = metric.ecrsa.map((item) => item + '(' + ecrsaMeta[item].ko + ')').join(', ');
  const basis = code === 'MON' ? '모니터링 1회 기준' : code === 'ANO' ? '이상 후보 1건 기준' : '대표 1건 또는 1회 기준';
  return 'PI-ID: ' + info.item + '. ECRSA: ' + ecrsa + '. ' + basis + ' 추정 Lead Time(작업+대기): AS-IS ' + formatHours(metric.asisHours) + ' → TO-BE ' + formatHours(metric.tobeHours) + ', 약 ' + reductionPercent(metric.asisHours, metric.tobeHours) + '% 단축. 개선 내용: ' + metric.improvement + '. 실측 전 가설값이며 1일=8 업무시간으로 환산한다.';
}

function emitNode(lines, node) {
  const tagByKind = {
    startEvent: 'startEvent',
    endEvent: 'endEvent',
    task: 'task',
    exclusiveGateway: 'exclusiveGateway',
    parallelGateway: 'parallelGateway'
  };
  const tag = tagByKind[node.kind];
  let attributes = ' id="' + node.id + '"';
  if (node.name) attributes += ' name="' + xmlAttribute(node.name) + '"';
  if (node.direction) attributes += ' gatewayDirection="' + node.direction + '"';
  if (node.defaultFlow) attributes += ' default="' + node.defaultFlow + '"';
  lines.push('    <bpmn:' + tag + attributes + '>');
  if (node.code) lines.push('      <bpmn:documentation>' + xmlEscape(improvedDocumentation(node.code)) + '</bpmn:documentation>');
  emitReferences(lines, node.id, '      ');
  lines.push('    </bpmn:' + tag + '>');
}

function emitFlow(lines, edge) {
  let attributes = ' id="' + edge.id + '"';
  if (edge.name) attributes += ' name="' + xmlAttribute(edge.name) + '"';
  attributes += ' sourceRef="' + edge.source + '" targetRef="' + edge.target + '"';
  if (edge.condition) {
    lines.push('    <bpmn:sequenceFlow' + attributes + '>');
    lines.push('      <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">' + xmlEscape(edge.condition) + '</bpmn:conditionExpression>');
    lines.push('    </bpmn:sequenceFlow>');
  } else {
    lines.push('    <bpmn:sequenceFlow' + attributes + ' />');
  }
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
  lines.push('                  id="Definitions_TOBE_Defect_AI_ClosedLoop"');
  lines.push('                  targetNamespace="https://example.com/bpmn/tobe-defect-ai-closed-loop"');
  lines.push('                  exporter="OpenAI Codex"');
  lines.push('                  exporterVersion="1.0">');
  lines.push('  <bpmn:process id="Process_TOBE_Defect_AI_ClosedLoop" name="TO-BE: 불량 분석 ~ Closed Loop 구축" isExecutable="false">');
  lines.push('    <bpmn:documentation>순서도.png의 현재 TO-BE 흐름을 BPMN 2.0으로 구조화했다. 원본 파란색 15개 개선 항목에는 ECRSA와 AS-IS·TO-BE 추정 Lead Time을 기록했다. 시간은 실측 전 가설이며 흰색 비개선 단계는 미산정이다. BPMN 토큰 의미를 명확히 하기 위해 작업과 판단, XOR merge/diverge, Parallel fork/join을 분리했다.</bpmn:documentation>');
  lines.push('    <bpmn:laneSet id="LaneSet_TOBE_Main">');
  for (const lane of lanes) {
    lines.push('      <bpmn:lane id="' + lane.id + '" name="' + xmlAttribute(lane.name) + '">');
    for (const node of nodes.filter((item) => item.lane === lane.id)) {
      lines.push('        <bpmn:flowNodeRef>' + node.id + '</bpmn:flowNodeRef>');
    }
    lines.push('      </bpmn:lane>');
  }
  lines.push('    </bpmn:laneSet>');
  for (const node of nodes) emitNode(lines, node);
  for (const edge of edges) emitFlow(lines, edge);
  lines.push('    <bpmn:textAnnotation id="TextAnnotation_TOBE_Legend">');
  lines.push('      <bpmn:text>TO-BE / ECRSA / 추정 LT');
  lines.push('E 제거 · C 결합 · R 재배열 · S 단순화 · A 자동화');
  lines.push('LT = 작업+대기시간, 1일=8h, 실측 전 가설');
  lines.push('I01~I13 대표 1건/1회 · I14 모니터링 회차당 · I15 이상 후보 건당');
  lines.push('흰색 비개선 단계 시간은 미산정</bpmn:text>');
  lines.push('    </bpmn:textAnnotation>');
  lines.push('  </bpmn:process>');
  lines.push('  <bpmn:collaboration id="Collaboration_TOBE_Defect_AI_ClosedLoop">');
  lines.push('    <bpmn:participant id="Participant_TOBE_Main" name="TO-BE 프로세스" processRef="Process_TOBE_Defect_AI_ClosedLoop" />');
  lines.push('  </bpmn:collaboration>');
  lines.push('  <bpmndi:BPMNDiagram id="BPMNDiagram_TOBE_Defect_AI_ClosedLoop">');
  lines.push('    <bpmndi:BPMNPlane id="BPMNPlane_TOBE_Defect_AI_ClosedLoop" bpmnElement="Collaboration_TOBE_Defect_AI_ClosedLoop">');
  lines.push('      <bpmndi:BPMNShape id="Participant_TOBE_Main_di" bpmnElement="Participant_TOBE_Main" isHorizontal="true">');
  lines.push('        <dc:Bounds x="60" y="100" width="2530" height="1380" />');
  lines.push('      </bpmndi:BPMNShape>');
  for (const lane of lanes) {
    lines.push('      <bpmndi:BPMNShape id="' + lane.id + '_di" bpmnElement="' + lane.id + '" isHorizontal="true" bioc:fill="' + lane.fill + '" bioc:stroke="#94A3B8">');
    lines.push('        <dc:Bounds x="90" y="' + lane.y + '" width="2500" height="' + lane.h + '" />');
    lines.push('      </bpmndi:BPMNShape>');
  }
  for (const node of nodes) {
    let attributes = ' id="' + node.id + '_di" bpmnElement="' + node.id + '"';
    if (node.kind === 'exclusiveGateway') attributes += ' isMarkerVisible="false"';
    if (node.code) attributes += ' bioc:fill="#DDEBF7" bioc:stroke="#2563EB"';
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
  }
  lines.push('      <bpmndi:BPMNShape id="TextAnnotation_TOBE_Legend_di" bpmnElement="TextAnnotation_TOBE_Legend">');
  lines.push('        <dc:Bounds x="1020" y="125" width="1180" height="135" />');
  lines.push('      </bpmndi:BPMNShape>');
  for (const edge of edges) {
    lines.push('      <bpmndi:BPMNEdge id="' + edge.id + '_di" bpmnElement="' + edge.id + '">');
    for (const point of edge.points) lines.push('        <di:waypoint x="' + point[0] + '" y="' + point[1] + '" />');
    if (edge.label) {
      lines.push('        <bpmndi:BPMNLabel>');
      lines.push('          <dc:Bounds x="' + edge.label.x + '" y="' + edge.label.y + '" width="' + edge.label.w + '" height="' + edge.label.h + '" />');
      lines.push('        </bpmndi:BPMNLabel>');
    }
    lines.push('      </bpmndi:BPMNEdge>');
  }
  lines.push('    </bpmndi:BPMNPlane>');
  lines.push('  </bpmndi:BPMNDiagram>');
  lines.push('</bpmn:definitions>');
  return lines.join('\n') + '\n';
}

fs.writeFileSync(outputPath, buildBpmn(), 'utf8');
console.log('generated ' + outputPath);
