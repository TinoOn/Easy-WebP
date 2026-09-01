#!/bin/bash
set -u

script_dir="$(cd "$(dirname "$0")" && pwd)"
source_dir="$script_dir/com.tino.webpExporter26"
extensions_dir="$HOME/Library/Application Support/Adobe/CEP/extensions"
target_dir="$extensions_dir/com.tino.webpExporter26"

if [ ! -d "$source_dir" ]; then
  echo "安装包不完整：找不到 com.tino.webpExporter26"
  read -r -p "按回车键关闭…"
  exit 1
fi

mkdir -p "$extensions_dir"
if [ -d "$target_dir" ]; then
  timestamp="$(date +%Y%m%d-%H%M%S)"
  mv "$target_dir" "$target_dir.backup-$timestamp"
fi

cp -R "$source_dir" "$target_dir"
chmod 755 "$target_dir/bin/macos-arm64/img2webp" "$target_dir/bin/macos-x64/img2webp"
xattr -dr com.apple.quarantine "$target_dir" 2>/dev/null || true

for csxs_version in 9 10 11 12 13 14; do
  defaults write "com.adobe.CSXS.$csxs_version" PlayerDebugMode 1 >/dev/null 2>&1 || true
done

echo ""
echo "Easy WebP 已安装。"
echo "请完全退出并重新打开 After Effects。"
echo "然后打开：窗口 → 扩展（旧版）→ Easy WebP"
echo ""
read -r -p "按回车键关闭…"
