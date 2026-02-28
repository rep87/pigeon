# 오늘도 모이 난사 중 — CONTEXT.md

## 게임 개요
- 게임명: 오늘도 모이 난사 중 (가칭)
- 장르: 탑다운 2D 웨이브 슈팅(뱀서라이크형 서바이벌)
- 컨셉: 비둘기를 죽이지 않고 모이를 주입으로 포만감을 채워서 따봉을 획득하는 게임
- 플랫폼: 모바일 웹 (HTML5), 추후 Unity 이식
- 해상도: 세로 9:16 모바일 기준

## 핵심 게임플레이
- 플레이어: WASD/화살표 이동, 자동 타겟팅 발사(가장 가까운 비둘기)
- 비둘기: 포만감 게이지 보유, 모이 적중 시 포만감 증가, 100%가 되면 따봉 드랍 후 퇴장
- 따봉: 경험치+재화. 누적 시 레벨업 발생
- 피로도: 화면의 비둘기 밀집도에 따라 증가/감소, 증가량에 따라 공속 일시 감소, 100%에서 발사 정지
- 레벨업: 1레벨 무기 계열 선택, 2~9레벨 옵션 1개, 10/20레벨은 진화/2차 진화 반영
- 스테이지: S1~S5 후 보스 웨이브, 각 스테이지 목표 따봉 달성 시 진입

## 비둘기 종류
- 1001: 무던한 비둘기 (회색, 기본 패턴)
- 1002: ADHD 비둘기 (주황, 랜덤 방향 전환)
- 1003: 편식 비둘기 (파랑, 플레이어 도주)
- 1004: 진상 비둘기 (보라, 돌진)
- 1005: 눈치 비둘기 (노랑, 시간 초과 시 이탈)
- 1006: 엄마 비둘기 (분홍, 높은 보상/보스와 유사 특성)
- 1101: 아기 비둘기 보스 (황금, HP 50000, 특수 패턴)

## 스프라이트 파일명 규칙
- 형식: `pigeon_{ID}_{action}.png`
- action 종류: `walk`, `eat`, `full`
- 시트 구조: 2행 8열 (좌→우 4프레임 + 2행 4프레임)
- 예시: `pigeon_1001_walk.png`, `pigeon_1001_eat.png`, `pigeon_1001_full.png`
- 경로: `/assets/pigeon/{ID}/`
- 파일이 없으면 원형 fallback 유지

## 무기 계열 (챕터1)
- 매운맛: 공속 위주 강화 + 일정 데미지 보정
- 짠맛: 공격력 위주 강화
- 단맛: 어그로 범위 및 모이 획득 속도 보정 중심
- 10레벨 자동 진화, 20레벨 2차 진화

## 아이템
- 박카스: 공속 +30% (5초)
- 커피: 이동속도 +30% (5초)
- 에너지드링크: 적중 판정 범위(포만도 획득) +50% (5초)
- 원자 모이 폭탄: 일반 몹 포만도 Max, 보스 HP 비율 고정 데미지(현재 1%)

## 폴더 구조
- `index.html`: 게임 화면 골격, CSS, 오버레이 UI, `src/game.js` 모듈 로딩
- `pigeon_sprite_reference.html`: 기존 단일 스프라이트 테스트용 페이지
- `sprite_reference.html`: 디버깅용 스프라이트 참조 페이지
- `config/animals.json`: 비둘기 타입 수치 및 스프라이트 설정
- `config/stages.json`: 스테이지/보스 웨이브/시간 제한/목표 수치
- `config/weapons.json`: 플레이어 기본값, 무기 계열 배율, 업그레이드 수치
- `config/items.json`: 아이템 메타/드랍률/효과 수치
- `assets/bg/background.png`: 배경 이미지
- `assets/ui/boom.webp`: 원자 모이 폭탄 이펙트용 UI 이미지
- `assets/pigeon/{1001..1101}/`: 비둘기 스프라이트 폴더
- `assets/player/`: 플레이어 스프라이트 예정 폴더 (현재 `player_sprite.png`는 미존재, fallback 사용)
- `src/game.js`: 메인 루프, 상태머신, 랜더링, 충돌/드랍/레벨/보스/UI 갱신
- `src/wave.js`, `src/pigeon.js`, `src/weapon.js`, `src/item.js`, `src/player.js`, `src/ui.js`: 각각 config만 fetch해 노출(현재 비즈니스 로직은 game.js에 집중)
- `test-results/` 및 `.playwright-check.png`, `.tmpcheck.png`: 최근 실행 점검 산출물(선택적)

## 파일별 역할
- `index.html`: 게임 캔버스/오버레이/버튼/입력 요소 생성 및 `type="module"`로 `src/game.js` 실행
- `src/game.js`: 단일 오케스트레이터. 로딩된 config 기반으로 게임 상태 계산, 스폰/이동/공격/피로도/레벨/드랍/아이템/보스/판정/렌더링 수행
- `src/wave.js`: `config/stages.json` 로더
- `src/pigeon.js`: `config/animals.json` 로더
- `src/weapon.js`: `config/weapons.json` 로더
- `src/item.js`: `config/items.json` 로더
- `src/player.js`: 내부적으로 `weapons.json`을 읽는 플레이어/무기 용 로더
- `src/ui.js`: `stages.json`, `items.json` 로더(현재 game.js가 실제 UI 상태도 직접 처리)
- `config/animals.json`: 비둘기 타입별 hp/속도/행동/스프라이트/드랍 배율
- `config/stages.json`: S1~S5 타임/목표/스폰/보스웨이브 설정
- `config/weapons.json`: 공격/이동/피로도/무기계열 업그레이드 수치
- `config/items.json`: 아이템 드랍 확률, 유효시간, 효과 배율
- `assets/...`: 그래픽 자산 루트. `1001`은 멀티스프라이트(walk/eat/full), 다른 ID는 단일 원형 fallback 대상

## config JSON 구조
- `animals.json`: `kinds` 맵의 각 타입별 `code, hp, speed, radius, reward, behavior, sprite, dropMultiplier, meta, animation`
  - `sprite`: 문자열(단일 경로) 또는 `{walk,eat,full}` 객체
  - `animation`: 상태별(`walk/eat/full`) 프레임/재생 속도 정의
  - `meta`: `cols, rows, sec, sw, sh, bottom` 표시/스케일 보조값
- `stages.json`: `stages` 배열(`id,time,targetThumb,dropMultiplier,spawn`) + `bossWave`(`timeLimit,hp,damage,reduction,dirs,dirDotReq`)
- `weapons.json`: `player(baseFireInterval, baseMoveSpeed, autoRange, viewZoom, levels, fatigue)` + `weaponFamilies`(spicy/salty/sweet) + `upgrades`
- `items.json`: `drop(item,atom,duration,bossItem,bossAtom)` + `items`(bac/cof/eng/atomic)별 배율/아이콘/드랍 보정값

## 현재 개발 상태
- 구현됨: config 분리 구조, 모듈 방식 fetch 로딩, 기본/웨이브/보스 진행, 자동 타겟팅 사격, 피로도 기반 발사 감쇠, 레벨업 카드, 무기 진화, 아이템 드랍+버프, 1001 멀티스프라이트 연동(walk/eat/full), 보스 UI/패턴, 디버그 패널, 게임 오버/결과 플로우
- 일부 미구현/미완성: 영구 저장(진행/세팅), 모바일 터치 입력 최적화, 사운드 시스템, 오디오/리소스 로딩 실패 대체 UX, 세션별 설정 메뉴, 완전한 아티팩트 정리
- 주의: 현재 `src/game.js`에 상태/로직이 집중되어 있어 향후 Unity 이식 시 핵심 동작분기 분리(refactor)가 유리

## 새 세션 시작 시 주의사항
- 항상 이 파일을 먼저 읽고 작업을 시작
- 수치 조정은 `config/*.json` 우선 수정
- 스프라이트 추가/교체 시 파일명 규칙(`pigeon_{ID}_{action}.png`) 준수
- 스프라이트가 없는 경우 원형 fallback 유지 규칙은 삭제하지 말 것
- 현재 `balance.json`은 존재하지 않음. `balance.json` 이름 지시가 있으면 `config/*.json`을 우선 점검
- `game.js`에서 스프라이트 경로/로딩 실패 로직이 핵심이므로 자산 교체 시 `assets/pigeon/{ID}` 경로 일치 필수
- `assets/player/player_sprite.png`는 현재 누락 상태(미구현 스프라이트)로, 없으면 캐릭터 fallback으로 동작
- `index.html` 직접 실행은 CORS 이슈 가능성이 있어 로컬 서버(http.server 등)로 검증
- 배포/공유 시 경로 참조가 상대경로(`./`) 기준인지 확인
