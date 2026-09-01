@echo off
chcp 65001 >nul
setlocal

set "TARGET_DIR=%APPDATA%\Adobe\CEP\extensions\com.tino.webpExporter26"
set "BACKUP_DIR=%USERPROFILE%\Desktop\com.tino.webpExporter26-backup-%RANDOM%"

if not exist "%TARGET_DIR%" (
  echo 没有找到已安装的 Easy WebP。
  pause
  exit /b 0
)

move "%TARGET_DIR%" "%BACKUP_DIR%" >nul
echo Easy WebP 已移到桌面备份目录：
echo %BACKUP_DIR%
echo 请重启 After Effects。
pause
