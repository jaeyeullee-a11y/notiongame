# Services

게임 외부 연동(VOC 저장, 플레이 이벤트 로그)을 위한 서비스 계층입니다.

MVP 계획:

- `vocService` — 종료 화면 VOC 제출
- `playLogService` — 세션 이벤트 버퍼링/저장

현재는 디렉터리만 준비되어 있으며, feature flag(`VITE_ENABLE_VOC_SUBMIT`, `VITE_ENABLE_PLAY_LOG`)로 활성화할 예정입니다.
