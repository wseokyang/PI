# PI Process Improvement Models

불량 현상 접수부터 Closed Loop 구축까지의 AS-IS/TO-BE 프로세스를 BPMN 2.0과 순서도로 정리한 저장소입니다.

## 주요 파일

- `순서도-AS-IS.bpmn`: AS-IS 가설 BPMN
- `순서도-AS-IS.png`, `순서도-AS-IS.svg`: 시간과 Bottleneck/Delay/Waste가 표시된 AS-IS 순서도
- `순서도-TO-BE.bpmn`: 현재 TO-BE BPMN
- `순서도-TO-BE.png`, `순서도-TO-BE.svg`: TO-BE 미리보기
- `ECRSA-개선효과.md`, `ECRSA-개선효과.csv`: 항목별 ECRSA 적용과 시간 단축 가정
- `순서도-AS-IS-가정.md`: AS-IS 역추정 근거와 현장 검증 질문

## 표기

- PI 문제: `B` Bottleneck, `D` Delay, `W` Waste
- ECRSA: `E` Eliminate, `C` Combine, `R` Rearrange, `S` Simplify, `A` Automate
- LT: 작업시간과 대기시간을 포함한 Lead Time

## 시간값 주의사항

표시된 시간은 현장 인터뷰와 시스템 로그가 없는 상태에서 작성한 **실측 전 가정값**입니다.

- 1일은 8 업무시간으로 환산했습니다.
- I01~I13은 대표 1건 또는 1회 기준입니다.
- I14 모니터링은 회차당, I15 이상점 감지는 이상 후보 건당 기준입니다.
- 공통 Connector, Schema, Module 등 표준 자산을 보유한 반복 적용 단계로 가정했습니다.
- 병렬 단계, 선택 경로, 재작업 횟수에 따라 실제 End-to-End 시간은 달라집니다.

실제 활용 전 담당자 인터뷰, 로그 분석, 리드타임 및 재작업률 측정을 통해 값을 보정해야 합니다.

## BPMN 열기

`.bpmn` 파일은 bpmn.io 또는 Camunda Modeler 등 BPMN 2.0 호환 도구에서 열 수 있습니다.
