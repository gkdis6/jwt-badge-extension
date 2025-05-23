# JWT Badge Extension

## 설명

JWT를 디코드하고 만료까지 남은 시간을 크롬 배지로 표시하는 MV3 확장 프로그램입니다.

## 주요 기능

- JWT 디코딩
- JWT 만료 시간 배지 표시
- 옵션 페이지를 통한 설정 변경
- 지정된 쿠키를 구독하여 JWT 자동 업데이트
- 네트워크 요청 헤더에서 JWT를 감지하여 자동 업데이트 (DevTools 패널 활성화 시)

## 다국어 지원 (Internationalization)

이 확장 프로그램은 다국어를 지원합니다.

- **지원 언어**:
    - 영어 (English)
    - 한국어 (Korean)
- **언어 변경 방법**:
    - 확장 프로그램의 옵션 페이지로 이동합니다.
    - 'Language' (또는 현재 설정된 언어의 '언어') 드롭다운 메뉴에서 원하는 언어를 선택합니다.
    - 변경 사항은 즉시 적용되어 확장 프로그램 UI(팝업, 옵션 페이지, 개발자 도구 패널)에 반영됩니다.
- **새로운 언어 추가 방법**:
    1. `src/_locales/` 디렉토리 내에 새로운 언어 코드(예: `ja` 일본어)로 디렉토리를 생성합니다.
    2. 해당 디렉토리 안에 `messages.json` 파일을 만들고, `src/_locales/en/messages.json` 파일을 참고하여 모든 메시지 키에 대한 번역을 추가합니다.
    3. `src/utils/i18n.ts` 파일 내의 `SUPPORTED_LANGS` 배열에 새로운 언어 코드를 추가합니다.
    4. `src/options.html` 파일의 언어 선택 드롭다운 메뉴에 새로운 언어 옵션을 추가합니다.

## 설치

1. 저장소를 클론하거나 다운로드합니다.
   ```bash
   git clone https://github.com/user/jwt-badge-extension.git
   ```
2. 종속성을 설치합니다.
   ```bash
   npm install
   ```
3. 프로젝트를 빌드합니다.
   ```bash
   npm run build
   ```
4. Chrome 브라우저에서 `chrome://extensions`로 이동합니다.
5. '압축해제된 확장 프로그램을 로드합니다.' 버튼을 클릭하고 `dist` 디렉터리를 선택합니다.

## 사용 방법

- **확장 프로그램 아이콘 클릭 (팝업 창)**:
    - **JWT 직접 입력**: 텍스트 영역에 JWT 문자열을 직접 붙여넣고 'Decode (수동 붙여넣기용)' 버튼을 클릭하면 해당 토큰을 디코딩하여 페이로드 정보와 만료까지 남은 시간을 보여줍니다. 이 정보는 확장 프로그램 배지에도 반영됩니다.
    - **쿠키에서 가져오기**:
        - '쿠키 이름' 입력 필드에 가져올 쿠키의 이름을 입력합니다 (예: `access_token`, `jwt_token`).
        - 'Fetch from Cookie' 버튼을 클릭하면 현재 활성화된 탭의 URL 기준으로 해당 이름의 쿠키 값을 가져와 디코딩하고, 결과를 표시하며 배지를 업데이트합니다.
        - 팝업이 열릴 때, 이전에 사용했거나 옵션 페이지의 '헤더 이름 목록' 첫 번째 값을 기반으로 쿠키 이름을 자동으로 채우고, 해당 쿠키가 존재하면 자동으로 가져오기를 시도합니다.
- **옵션 페이지 설정**:
    - **헤더 이름 목록**: DevTools 패널이 활성화된 상태에서, 웹사이트가 주고받는 **HTTP 요청/응답의 헤더** 중 여기에 사용자가 입력한 이름과 일치하는 헤더가 있는지 확인합니다. 해당 헤더의 값에 JWT가 포함되어 있으면, 이를 지속적으로 감지하여 자동으로 토큰 정보를 업데이트하고 배지에 표시합니다. (예: `Authorization`, `X-Access-Token`). (기본값: `authorization`, `x-access-token`, `x-jwt`, `token`) 한 줄에 하나의 **HTTP 헤더 이름**을 입력합니다.
    - **Authorization 헤더는 Bearer 스킴만 허용**: 이 옵션이 활성화된 경우, '헤더 이름 목록'에 `authorization` (또는 유사한 이름)이 포함되어 있고 해당 헤더가 감지되면, `Bearer` 스킴을 사용하는 JWT만 유효한 토큰으로 간주합니다. (기본값: 활성화)
    - **JWT 형식 쿠키 자동 감시**: 이 옵션이 활성화되면, 브라우저에 저장된 **모든 쿠키의 변경 사항**을 지속적으로 감시합니다. 특정 쿠키의 **이름을 지정하는 것이 아니라**, 어떤 쿠키든 그 **값**이 JWT 형식(예: `xxxxx.yyyyy.zzzzz`처럼 세 부분으로 구성된 문자열)과 일치하면, 해당 쿠키 값을 자동으로 가져와 토큰 정보를 업데이트하고 배지에 표시합니다. (기본값: 활성화)
- **Chrome DevTools 연동**:
    - Chrome DevTools를 열고 'JWT Inspector' 패널을 선택하면, 현재 탭의 네트워크 요청을 실시간으로 감시합니다.
    - 위 '헤더 이름 목록' 옵션에 따라, 지정된 HTTP 헤더에서 JWT가 발견될 때마다 토큰 정보가 자동으로 업데이트되어 패널에 표시되고, 확장 프로그램 배지에도 반영됩니다.

## 라이선스

[MIT](LICENSE)
