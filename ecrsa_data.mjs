export const ecrsaMeta = {
  E: { label: 'Eliminate', ko: '제거' },
  C: { label: 'Combine', ko: '결합' },
  R: { label: 'Rearrange', ko: '재배열' },
  S: { label: 'Simplify', ko: '단순화' },
  A: { label: 'Automate', ko: '자동화' }
};

export const improvementMetrics = {
  PIC: {
    asisHours: 6, tobeHours: 0.5, ecrsa: ['C', 'S', 'A'],
    improvement: '접수 항목을 표준화하고 PLM·MES 정보를 통합 조회해 재요청과 수기 대조를 축소'
  },
  PRA: {
    asisHours: 24, tobeHours: 8, ecrsa: ['C', 'S', 'A'],
    improvement: '공통 Key와 분석 Template을 표준화하고 Commonality 집계·비교를 자동화'
  },
  DPL: {
    asisHours: 32, tobeHours: 12, ecrsa: ['E', 'C', 'R', 'A'],
    improvement: '추출 요청·메일 전달을 제거하고 수집을 앞단으로 재배열해 소스 결합·형식 변환을 자동화'
  },
  DBD: {
    asisHours: 24, tobeHours: 8, ecrsa: ['C', 'S', 'A'],
    improvement: '분산 파일을 중앙 DB로 결합하고 스키마·Key·단위를 표준화'
  },
  DEV: {
    asisHours: 8, tobeHours: 0.5, ecrsa: ['E', 'S', 'A'],
    improvement: '개인별 설치와 이메일 코드 공유를 제거하고 서버·code-server 환경을 표준 제공'
  },
  OUT: {
    asisHours: 12, tobeHours: 3, ecrsa: ['E', 'S', 'A'],
    improvement: '반복 수작업 정제를 제거하고 이상치 기준을 규칙화해 재사용 가능한 Pipeline으로 자동 적용'
  },
  LBL: {
    asisHours: 40, tobeHours: 16, ecrsa: ['C', 'S', 'A'],
    improvement: '판정 정보와 원천 데이터를 연결하고 Label 체계·도구를 표준화해 보조 자동화'
  },
  DQC: {
    asisHours: 12, tobeHours: 2, ecrsa: ['E', 'S', 'A'],
    improvement: '표본 점검과 수기 보고를 제거하고 품질 규칙 검사·리포트를 자동화'
  },
  TDS: {
    asisHours: 8, tobeHours: 1, ecrsa: ['E', 'C', 'A'],
    improvement: '최신 파일 탐색·복사를 제거하고 정제·Label 데이터를 결합해 Dataset 분할·버전을 자동 생성'
  },
  DLG: {
    asisHours: 24, tobeHours: 8, ecrsa: ['C', 'S', 'A'],
    improvement: '전문가 규칙을 설정형 Logic으로 결합·단순화하고 과거 Data 검증을 자동화'
  },
  MDA: {
    asisHours: 80, tobeHours: 40, ecrsa: ['E', 'C', 'S'],
    improvement: '중복 Prototype을 제거하고 공통 Module·Repository·Interface로 결합·표준화'
  },
  MTR: {
    asisHours: 40, tobeHours: 16, ecrsa: ['E', 'R', 'A'],
    improvement: '불필요한 전체 재학습을 제거하고 실험을 재배열·병렬화해 학습 Pipeline·실험 추적을 자동화'
  },
  CIM: {
    asisHours: 16, tobeHours: 4, ecrsa: ['E', 'C', 'A'],
    improvement: '메일 사본과 수동 병합을 제거하고 Git·Issue·자동 회귀검증으로 통합'
  },
  MON: {
    asisHours: 4, tobeHours: 0.25, ecrsa: ['E', 'R', 'A'],
    improvement: '수동 Export·실행을 제거하고 주기 작업을 상시 Monitoring·자동 알림으로 재배열'
  },
  ANO: {
    asisHours: 2, tobeHours: 0.083, ecrsa: ['E', 'C', 'S', 'A'],
    improvement: '육안 재확인·QMS 재입력을 제거하고 탐지 결과와 공정 이력을 결합해 기준·알림을 표준 자동화'
  }
};

export const stepDurations = {
  PIC: [3, 1, 2],
  PRA: [8, 8, 8],
  DPL: [16, 4, 12],
  DBD: [2, 12, 10],
  DEV: [3, 1, 4],
  OUT: [3, 5, 4],
  LBL: [16, 16, 8],
  DQC: [4, 6, 2],
  TDS: [2, 3, 3],
  DLG: [8, 8, 8],
  MDA: [8, 48, 24],
  MTR: [12, 20, 8],
  CIM: [2, 8, 6],
  MON: [1, 2, 1],
  ANO: [0.5, 1.25, 0.25]
};

export function formatHours(hours) {
  if (hours < 1) return String(Math.round(hours * 60)) + '분';
  return Number.isInteger(hours) ? String(hours) + 'h' : String(hours) + 'h';
}

export function reductionPercent(asisHours, tobeHours) {
  return Math.round((1 - tobeHours / asisHours) * 100);
}
