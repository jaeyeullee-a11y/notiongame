# Runway Defense

웹 기반 2D 타워 디펜스 MVP. 스타트업의 Runway(생명력)와 Budget(재화)으로 10웨이브를 방어하고, 종료 후 VOC·플레이 로그를 수집하는 시연용 게임입니다.

> 현재 상태: **프로젝트 초기 세팅 / 환경설정만 완료**. 게임 플레이 로직은 아직 구현되지 않았습니다.

## Tech Stack

| Layer       | Choice                              |
| ----------- | ----------------------------------- |
| Runtime     | Node.js 20+                         |
| Bundler     | Vite 8                              |
| Language    | TypeScript (strict)                 |
| Game engine | Phaser 4 (의존성만 설치, 씬 미연결) |
| Quality     | ESLint, Prettier, Vitest            |
| CI          | GitHub Actions                      |

## Quick Start

```bash
# 1) 의존성 설치
npm install

# 2) 환경 변수
cp .env.example .env

# 3) 개발 서버
npm run dev
```

브라우저에서 `http://localhost:5173` 을 열면 부트스트랩 셸 화면이 표시됩니다.

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
  data/         # 타워·적·웨이브·맵 데이터 (추후)
  game/         # Phaser 씬·시스템·엔티티 (추후)
  services/     # VOC / 플레이 로그 서비스 (추후)
  styles/       # 글로벌 스타일
  types/        # 공유 도메인 타입
  main.ts       # 앱 엔트리 (부트스트랩 셸만)
```

## Environment Variables

`.env.example` 을 참고하세요.

| Variable                 | Default          | Description             |
| ------------------------ | ---------------- | ----------------------- |
| `VITE_APP_TITLE`         | `Runway Defense` | 앱 타이틀               |
| `VITE_APP_ENV`           | `development`    | 환경 식별자             |
| `VITE_DEV_PORT`          | `5173`           | 개발 서버 포트          |
| `VITE_ENABLE_VOC_SUBMIT` | `false`          | VOC 제출 기능 플래그    |
| `VITE_ENABLE_PLAY_LOG`   | `false`          | 플레이 로그 기능 플래그 |
| `VITE_API_BASE_URL`      | _(empty)_        | 향후 API 베이스 URL     |

`.env` 는 git에 커밋되지 않습니다.

## Product Scope (from spec)

- 단일 맵 / 단일 경로, 웨이브 10 + 보스
- 타워 6종: Developer, Designer, PM, Sales, AI Agent, Founder
- 적 5종: Bug, Urgent Request, Scope Creep, Churn Risk, Enterprise Client
- 자원: Runway(시작 20), Budget(시작 350)
- 종료 화면 VOC + 플레이 이벤트 로그

## Next Steps (not in this PR)

1. Phaser 부트 씬·타이틀·플레이 씬 골격
2. 맵 경로 / 배치 슬롯 데이터
3. 웨이브·적·타워 데이터 스키마 및 샘플
4. 전투·경제·HUD 코어 루프
5. VOC / 플레이 로그 서비스 연동

## Contributing

PR 전에 아래를 통과시켜 주세요.

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

Issue / PR 템플릿은 `.github/` 에 있습니다.
