# Accounter - Easy Account Switcher

## 소개 (Introduction)

Accounter는 웹 사이트의 쿠키, 세션 스토리지, 로컬 스토리지의 데이터를 쉽게 변경하여 다양한 계정 정보를 전환할 수 있게 해주는 크롬 확장 프로그램입니다. 이 도구는 웹 개발자, QA 테스터, 그리고 여러 계정을 자주 전환해야 하는 사용자에게 유용합니다.

Accounter is a Chrome extension that allows you to easily switch between different account information by manipulating cookie, session storage, and local storage data. This tool is useful for web developers, QA testers, and users who need to frequently switch between multiple accounts.

## 주요 기능 (Key Features)

### 한국어
- **사이트 등록**: 도메인별로 사이트를 등록하고 필요한 스토리지 타입(쿠키, 세션, 로컬)과 키를 설정할 수 있습니다.
- **계정 정보 저장**: 현재 페이지의 스토리지 값을 기반으로 계정 정보를 저장합니다.
- **빠른 계정 전환**: 저장된 계정 정보를 클릭 한 번으로 현재 페이지에 적용할 수 있습니다.
- **계정 정보 새로고침**: 현재 페이지의 최신 스토리지 값으로 저장된 계정 정보를 업데이트할 수 있습니다.
- **직관적인 인터페이스**: 사용하기 쉬운 UI로 계정 관리가 간편합니다.

### English
- **Site Registration**: Register sites by domain and configure the required storage types (cookie, session, local) and keys.
- **Account Information Storage**: Save account information based on the current page's storage values.
- **Quick Account Switching**: Apply saved account information to the current page with a single click.
- **Account Information Refresh**: Update saved account information with the latest storage values from the current page.
- **Intuitive Interface**: Easy-to-use UI for simple account management.

## 설치 방법 (Installation)

### 한국어
1. 이 저장소를 클론하거나 다운로드합니다.
2. Chrome 브라우저에서 `chrome://extensions/`로 이동합니다.
3. 우측 상단의 '개발자 모드'를 활성화합니다.
4. '압축해제된 확장 프로그램을 로드합니다' 버튼을 클릭합니다.
5. 다운로드한 폴더를 선택합니다.

### English
1. Clone or download this repository.
2. Navigate to `chrome://extensions/` in your Chrome browser.
3. Enable 'Developer mode' in the top right corner.
4. Click 'Load unpacked' button.
5. Select the downloaded folder.

## 사용 방법 (Usage)

### 한국어
1. **사이트 등록**:
   - 등록하려는 웹 사이트에 접속합니다.
   - Accounter 확장 프로그램 아이콘을 클릭합니다.
   - '등록' 탭을 선택하고 사이트 이름을 입력합니다.
   - 필요한 스토리지 타입(세션, 쿠키, 로컬)과 키를 선택합니다.
   - '저장' 버튼을 클릭합니다.

2. **계정 등록**:
   - 등록된 사이트에 접속하고 로그인합니다.
   - Accounter 확장 프로그램 아이콘을 클릭합니다.
   - '등록' 탭을 선택하고 계정 ID를 입력합니다.
   - '저장' 버튼을 클릭하면 현재 스토리지 값이 자동으로 저장됩니다.

3. **계정 전환**:
   - 등록된 사이트에 접속합니다.
   - Accounter 확장 프로그램 아이콘을 클릭합니다.
   - '보관함' 탭에서 전환하려는 계정을 클릭합니다.
   - 저장된 스토리지 값이 현재 페이지에 적용됩니다.

4. **계정 정보 새로고침**:
   - 등록된 사이트에 접속합니다.
   - Accounter 확장 프로그램 아이콘을 클릭합니다.
   - '보관함' 탭에서 계정 옆의 새로고침 아이콘을 클릭합니다.
   - 현재 페이지의 스토리지 값으로 계정 정보가 업데이트됩니다.

### English
1. **Site Registration**:
   - Visit the website you want to register.
   - Click on the Accounter extension icon.
   - Select the 'Register' tab and enter a site name.
   - Select the required storage types (session, cookie, local) and keys.
   - Click the 'Save' button.

2. **Account Registration**:
   - Visit a registered site and log in.
   - Click on the Accounter extension icon.
   - Select the 'Register' tab and enter an account ID.
   - Click the 'Save' button, and the current storage values will be automatically saved.

3. **Account Switching**:
   - Visit a registered site.
   - Click on the Accounter extension icon.
   - In the 'Archive' tab, click on the account you want to switch to.
   - The saved storage values will be applied to the current page.

4. **Account Information Refresh**:
   - Visit a registered site.
   - Click on the Accounter extension icon.
   - In the 'Archive' tab, click on the refresh icon next to an account.
   - The account information will be updated with the current page's storage values.

## 주의사항 (Notes)

### 한국어
- 이 확장 프로그램은 개발 및 테스트 목적으로 만들어졌습니다.
- 민감한 계정 정보를 저장할 때는 주의하세요. 모든 데이터는 로컬에 저장됩니다.
- 일부 웹 사이트는 추가적인 보안 조치가 있어 이 확장 프로그램으로 계정 전환이 불가능할 수 있습니다.

### English
- This extension is created for development and testing purposes.
- Be cautious when storing sensitive account information. All data is stored locally.
- Some websites may have additional security measures that prevent account switching with this extension.

## 라이센스 (License)

이 프로젝트는 MIT 라이센스 하에 있습니다.

This project is licensed under the MIT License.
