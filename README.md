# Runway Defense

웹 기반 2D 타워 디펜스 MVP. 스타트업의 Runway(생명력)와 Budget(재화)으로 10웨이브를 방어하고, 종료 후 VOC·플레이 로그를 수집하는 시연용 게임입니다.

## Tech Stack

| Layer       | Choice                   |
| ----------- | ------------------------ |
| Runtime     | Node.js 20+              |
| Bundler     | Vite 8                   |
| Language    | TypeScript (strict)      |
| Game engine | Phaser 4                 |
| Quality     | ESLint, Prettier, Vitest |
| CI          | GitHub Actions           |

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

브라우저에서 `http://localhost:5173` 을 열어 플레이합니다.

## MVP Features

- 단일 경로 맵 (Customer Inbox → Product Core) + 배치 슬롯 10개
- 타워 6종: Developer / Designer / PM / Sales / AI Agent / Founder
- 적 5종: Bug / Urgent Request / Scope Creep / Churn Risk / Enterprise Client
- 웨이브 1–10 수동 시작, 보스전, Runway/Budget 경제
- 설치·업그레이드(최대 3)·판매(70% 환급)
- HUD, 1x/2x, 일시정지, 튜토리얼, 승/패 결과 + VOC 제출
- 플레이 이벤트 로그·VOC localStorage 저장

## Scripts

| Command                | Description              |
| ---------------------- | ------------------------ |
| `npm run dev`          | Vite 개발 서버           |
| `npm run build`        | 타입체크 + 프로덕션 빌드 |
| `npm run preview`      | 빌드 결과 미리보기       |
| `npm run lint`         | ESLint                   |
| `npm run format`       | Prettier 포맷            |
| `npm run format:check` | Prettier 검사            |
| `npm run typecheck`    | `tsc --noEmit`           |
| `npm test`             | Vitest 단위 테스트       |

## Project Structure

```text
src/
  config/       # 환경 변수·앱 설정
  data/         # 타워·적·웨이브·맵 데이터
  game/
    runtime/    # 전투·경제·웨이브 시뮬레이션
    scenes/     # Phaser PlayScene
    systems/    # 타깃팅 등 순수 로직
    ui/         # 타이틀/HUD/결과/VOC 셸
  services/     # VOC / 플레이 로그 / 튜토리얼
  styles/
  types/
  main.ts
```

## Environment Variables

| Variable                 | Default          | Description |
| ------------------------ | ---------------- | ----------- |
| `VITE_APP_TITLE`         | `Runway Defense` | 앱 타이틀   |
| `VITE_ENABLE_VOC_SUBMIT` | `true`           | VOC 제출    |
| `VITE_ENABLE_PLAY_LOG`   | `true`           | 플레이 로그 |

`.env` 는 git에 커밋되지 않습니다.

## Contributing

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```
