@echo off
chcp 65001 >nul
setlocal

set "SOURCE_DIR=%~dp0com.tino.webpExporter26"
set "EXTENSIONS_DIR=%APPDATA%\Adobe\CEP\extensions"
set "TARGET_DIR=%EXTENSIONS_DIR%\com.tino.webpExporter26"

if not exist "%SOURCE_DIR%" (
  echo 安装包不完整：找不到 com.tino.webpExporter26
  pause
  exit /b 1
)

if not exist "%EXTENSIONS_DIR%" mkdir "%EXTENSIONS_DIR%"
if exist "%TARGET_DIR%" move "%TARGET_DIR%" "%TARGET_DIR%.backup-%RANDOM%" >nul

xcopy "%SOURCE_DIR%" "%TARGET_DIR%\" /E /I /Y /Q >nul
if errorlevel 1 (
  echo 安装失败，请检查文件权限。
  pause
  exit /b 1
)

for %%V in (9 10 11 12 13 14) do reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1

echo.
echo Easy WebP 已安装。
echo 请完全退出并重新打开 After Effects。
echo 然后打开：窗口 → 扩展（旧版）→ Easy WebP
echo.
pause
