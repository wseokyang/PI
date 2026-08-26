import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(outputDir, 'PI-프로세스효율화-설명예시.svg');

const issueMeta = {
  B: { label: 'Bottleneck', color: '#DC2626', pale: '#FEE2E2' },
  D: { label: 'Delay', color: '#D97706', pale: '#FEF3C7' },
  W: { label: 'Waste', color: '#7C3AED', pale: '#EDE9FE' }
};

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function textLines(lines, x, y, size, weight, color, lineHeight, anchor) {
  const textAnchor = anchor || 'middle';
  const spans = lines.map((line, index) => {
    return '<tspan x="' + x + '" dy="' + (index === 0 ? 0 : lineHeight) + '">' + esc(line) + '</tspan>';
  }).join('');
  return '<text x="' + x + '" y="' + y + '" text-anchor="' + textAnchor + '" font-size="' + size + '" font-weight="' + weight + '" fill="' + color + '">' + spans + '</text>';
}

function issueBadges(codes, x, y) {
  const parts = [];
  codes.forEach((code, index) => {
    const meta = issueMeta[code];
    const bx = x + index * 31;
    parts.push('<rect x="' + bx + '" y="' + y + '" width="25" height="25" rx="7" fill="' + meta.pale + '" stroke="' + meta.color + '" stroke-width="1.5" />');
    parts.push('<text x="' + (bx + 12.5) + '" y="' + (y + 18) + '" text-anchor="middle" font-size="14" font-weight="800" fill="' + meta.color + '">' + code + '</text>');
  });
  return parts.join('');
}

function asisNode(index, label, time, issues, y) {
  const x = 98;
  const w = 604;
  const h = 62;
  const parts = [];
  parts.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="13" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2" />');
  parts.push('<rect x="' + x + '" y="' + y + '" width="7" height="' + h + '" rx="3" fill="#F43F5E" />');
  parts.push('<circle cx="' + (x + 32) + '" cy="' + (y + 31) + '" r="17" fill="#FFF1F2" stroke="#F43F5E" />');
  parts.push('<text x="' + (x + 32) + '" y="' + (y + 38) + '" text-anchor="middle" font-size="17" font-weight="800" fill="#BE123C">' + index + '</text>');
  parts.push('<text x="' + (x + 62) + '" y="' + (y + 38) + '" font-size="20" font-weight="700" fill="#0F172A">' + esc(label) + '</text>');
  parts.push('<rect x="' + (x + 425) + '" y="' + (y + 17) + '" width="70" height="28" rx="8" fill="#F1F5F9" stroke="#94A3B8" />');
  parts.push('<text x="' + (x + 460) + '" y="' + (y + 37) + '" text-anchor="middle" font-size="15" font-weight="800" fill="#334155">' + esc(time) + '</text>');
  parts.push(issueBadges(issues, x + 510, y + 18));
  return parts.join('');
}

function tobeNode(index, labelLinesValue, time, y, system) {
  const x = 1218;
  const w = 604;
  const h = 76;
  const parts = [];
  parts.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="15" fill="#FFFFFF" stroke="#93C5FD" stroke-width="2" />');
  parts.push('<rect x="' + x + '" y="' + y + '" width="7" height="' + h + '" rx="3" fill="#2563EB" />');
  parts.push('<circle cx="' + (x + 34) + '" cy="' + (y + 38) + '" r="18" fill="#DBEAFE" stroke="#2563EB" />');
  parts.push('<text x="' + (x + 34) + '" y="' + (y + 45) + '" text-anchor="middle" font-size="17" font-weight="800" fill="#1D4ED8">' + index + '</text>');
  parts.push(textLines(labelLinesValue, x + 75, y + (labelLinesValue.length === 1 ? 47 : 31), 20, 700, '#0F172A', 23, 'start'));
  parts.push('<rect x="' + (x + 420) + '" y="' + (y + 13) + '" width="78" height="28" rx="8" fill="#ECFDF5" stroke="#10B981" />');
  parts.push('<text x="' + (x + 459) + '" y="' + (y + 33) + '" text-anchor="middle" font-size="15" font-weight="800" fill="#047857">' + esc(time) + '</text>');
  parts.push('<rect x="' + (x + 420) + '" y="' + (y + 45) + '" width="155" height="23" rx="7" fill="#EFF6FF" />');
  parts.push('<text x="' + (x + 497.5) + '" y="' + (y + 62) + '" text-anchor="middle" font-size="13" font-weight="700" fill="#1D4ED8">' + esc(system) + '</text>');
  return parts.join('');
}

function ecrsaRow(code, title, explanation, y) {
  const colors = {
    E: ['#FEE2E2', '#DC2626'],
    C: ['#DBEAFE', '#2563EB'],
    R: ['#E0E7FF', '#4F46E5'],
    S: ['#DCFCE7', '#16A34A'],
    A: ['#F3E8FF', '#9333EA']
  };
  const color = colors[code];
  const parts = [];
  parts.push('<rect x="808" y="' + y + '" width="310" height="63" rx="13" fill="#FFFFFF" stroke="#DDD6FE" stroke-width="2" />');
  parts.push('<rect x="824" y="' + (y + 13) + '" width="38" height="38" rx="10" fill="' + color[0] + '" stroke="' + color[1] + '" />');
  parts.push('<text x="843" y="' + (y + 39) + '" text-anchor="middle" font-size="21" font-weight="900" fill="' + color[1] + '">' + code + '</text>');
  parts.push('<text x="875" y="' + (y + 25) + '" font-size="17" font-weight="800" fill="#1E1B4B">' + esc(title) + '</text>');
  parts.push('<text x="875" y="' + (y + 48) + '" font-size="14" font-weight="600" fill="#475569">' + esc(explanation) + '</text>');
  return parts.join('');
}

function bottomCard(number, title, linesValue, x) {
  const y = 820;
  const w = 395;
  const h = 145;
  const parts = [];
  parts.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2" />');
  parts.push('<circle cx="' + (x + 38) + '" cy="' + (y + 38) + '" r="23" fill="#0F172A" />');
  parts.push('<text x="' + (x + 38) + '" y="' + (y + 47) + '" text-anchor="middle" font-size="22" font-weight="900" fill="#FFFFFF">' + number + '</text>');
  parts.push('<text x="' + (x + 75) + '" y="' + (y + 43) + '" font-size="22" font-weight="800" fill="#0F172A">' + esc(title) + '</text>');
  parts.push(textLines(linesValue, x + 28, y + 82, 17, 600, '#475569', 25, 'start'));
  return parts.join('');
}

function buildSvg() {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080" role="img" aria-labelledby="title desc">');
  lines.push('  <title id="title">AS-IS에서 TO-BE로 작성하는 방향 — 쉬운 회의실 예약 예시</title>');
  lines.push('  <desc id="desc">회의실 예약의 수작업 문의와 대기 과정을 ECRSA로 제거, 결합, 재배열, 단순화, 자동화해 70분에서 5분으로 줄이는 예시와 PI 문서 작성 원칙.</desc>');
  lines.push('  <defs>');
  lines.push('    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#64748B" /></marker>');
  lines.push('    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.08" /></filter>');
  lines.push("    <style>text{font-family:'Noto Sans KR','Noto Sans CJK KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif}.arrow{fill:none;stroke:#64748B;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}</style>");
  lines.push('  </defs>');
  lines.push('  <rect width="1920" height="1080" fill="#F8FAFC" />');
  lines.push('  <text x="58" y="52" font-size="34" font-weight="900" fill="#0F172A">AS-IS → TO-BE 프로세스 효율화, 이렇게 작성합니다</text>');
  lines.push('  <text x="60" y="83" font-size="18" font-weight="600" fill="#475569">쉬운 예시: 회의실 예약 · 시간은 설명을 위한 가정값이며 LT는 작업+대기시간입니다.</text>');

  lines.push('  <g filter="url(#shadow)">');
  lines.push('    <rect x="50" y="115" width="700" height="625" rx="22" fill="#FFF7F7" stroke="#FDA4AF" stroke-width="2" />');
  lines.push('    <rect x="775" y="115" width="370" height="625" rx="22" fill="#F5F3FF" stroke="#C4B5FD" stroke-width="2" />');
  lines.push('    <rect x="1170" y="115" width="700" height="625" rx="22" fill="#F0F7FF" stroke="#93C5FD" stroke-width="2" />');
  lines.push('  </g>');

  lines.push('  <rect x="72" y="135" width="220" height="45" rx="13" fill="#FFE4E6" />');
  lines.push('  <text x="182" y="165" text-anchor="middle" font-size="23" font-weight="900" fill="#BE123C">AS-IS · 실제 업무</text>');
  lines.push('  <text x="315" y="164" font-size="16" font-weight="700" fill="#64748B">“회의실 예약” 한 칸으로 쓰지 말고 실제 단계를 펼칩니다.</text>');

  lines.push(asisNode('1', '메신저로 빈 시간 문의', '3분', ['D', 'W'], 205));
  lines.push(asisNode('2', '담당자 확인·회신 대기', '30분', ['B', 'D'], 292));
  lines.push(asisNode('3', '충돌 시 다시 시간 조정', '15분', ['D', 'W'], 379));
  lines.push(asisNode('4', '담당자가 수기로 예약 등록', '10분', ['B', 'W'], 466));
  lines.push(asisNode('5', '신청자에게 결과 회신', '12분', ['D'], 553));
  for (const y of [267, 354, 441, 528]) {
    lines.push('  <line x1="400" y1="' + y + '" x2="400" y2="' + (y + 20) + '" class="arrow" marker-end="url(#arrow)" />');
  }
  lines.push('  <rect x="98" y="646" width="604" height="64" rx="16" fill="#FFE4E6" stroke="#FB7185" stroke-width="2" />');
  lines.push('  <text x="235" y="686" font-size="21" font-weight="800" fill="#9F1239">대표 LT 약 70분</text>');
  lines.push('  <text x="445" y="686" font-size="17" font-weight="700" fill="#475569">담당자 의존 · 대기 · 재입력</text>');

  lines.push('  <rect x="803" y="135" width="314" height="45" rx="13" fill="#EDE9FE" />');
  lines.push('  <text x="960" y="165" text-anchor="middle" font-size="23" font-weight="900" fill="#5B21B6">ECRSA로 바꾸기</text>');
  lines.push(ecrsaRow('E', '제거', '문의·회신·재입력 삭제', 204));
  lines.push(ecrsaRow('C', '결합', '확인·예약·알림 한 화면', 280));
  lines.push(ecrsaRow('R', '재배열', '충돌 검사를 선택 전에', 356));
  lines.push(ecrsaRow('S', '단순화', '입력항목·규칙 표준화', 432));
  lines.push(ecrsaRow('A', '자동화', '예약·알림 자동 처리', 508));
  lines.push('  <path d="M 840 610 C 900 650, 1020 650, 1080 610" fill="none" stroke="#7C3AED" stroke-width="4" marker-end="url(#arrow)" />');
  lines.push(textLines(['단계 이름만 바꾸는 것이 아니라', '불필요한 일을 실제로 줄입니다.'], 960, 662, 18, 800, '#5B21B6', 27));

  lines.push('  <rect x="1192" y="135" width="220" height="45" rx="13" fill="#DBEAFE" />');
  lines.push('  <text x="1302" y="165" text-anchor="middle" font-size="23" font-weight="900" fill="#1D4ED8">TO-BE · 개선 후</text>');
  lines.push('  <text x="1432" y="164" font-size="16" font-weight="700" fill="#64748B">사람은 선택하고, 시스템이 확인·등록·알림합니다.</text>');
  lines.push(tobeNode('1', ['예약 화면에서 빈 시간 확인'], '1분', 218, '사용자 직접'));
  lines.push(tobeNode('2', ['회의실·시간 직접 선택'], '1분', 326, '사용자 직접'));
  lines.push(tobeNode('3', ['시스템이 충돌 확인 후', '자동 예약'], '2분', 434, '시스템 자동'));
  lines.push(tobeNode('4', ['참석자에게 자동 알림'], '1분', 542, '시스템 자동'));
  for (const y of [294, 402, 510]) {
    lines.push('  <line x1="1520" y1="' + y + '" x2="1520" y2="' + (y + 26) + '" class="arrow" marker-end="url(#arrow)" />');
  }
  lines.push('  <rect x="1218" y="646" width="604" height="64" rx="16" fill="#DCFCE7" stroke="#22C55E" stroke-width="2" />');
  lines.push('  <text x="1325" y="686" font-size="21" font-weight="800" fill="#166534">대표 LT 약 5분</text>');
  lines.push('  <text x="1530" y="686" font-size="18" font-weight="900" fill="#047857">약 93% 단축</text>');
  lines.push('  <text x="1665" y="686" font-size="16" font-weight="700" fill="#475569">상태 즉시 확인</text>');

  lines.push('  <text x="60" y="790" font-size="27" font-weight="900" fill="#0F172A">현재 PI 문서도 같은 방향으로 작성합니다</text>');
  lines.push(bottomCard('1', 'AS-IS 펼치기', ['TO-BE 한 칸 이전의', '수작업·인계·대기를 2~3단계로'], 60));
  lines.push(bottomCard('2', '문제와 시간', ['B/D/W를 붙이고', '작업시간+대기시간을 측정'], 505));
  lines.push(bottomCard('3', 'ECRSA 연결', ['무엇을 제거·결합·재배열·', '단순화·자동화했는지 명시'], 950));
  lines.push(bottomCard('4', 'TO-BE와 KPI', ['개선 후 순서·담당·시스템과', '목표 LT·오류율을 같은 단위로'], 1395));
  for (const x of [455, 900, 1345]) {
    lines.push('  <line x1="' + x + '" y1="892" x2="' + (x + 38) + '" y2="892" class="arrow" marker-end="url(#arrow)" />');
  }
  lines.push('  <rect x="60" y="990" width="1770" height="61" rx="17" fill="#E0F2FE" stroke="#38BDF8" stroke-width="2" />');
  lines.push('  <text x="945" y="1028" text-anchor="middle" font-size="20" font-weight="800" fill="#075985">핵심: 파란 TO-BE 한 칸이 생기기 전의 여러 수작업을 펼치고 → 문제·시간을 보인 뒤 → ECRSA로 어떻게 줄였는지를 연결합니다.</text>');
  lines.push('  <text x="1860" y="1055" text-anchor="end" font-size="13" font-weight="600" fill="#64748B">설명용 가정 예시 · 실제 값은 인터뷰와 로그로 보정</text>');
  lines.push('</svg>');
  return lines.join('\n') + '\n';
}

fs.writeFileSync(svgPath, buildSvg(), 'utf8');
console.log('generated ' + svgPath);
