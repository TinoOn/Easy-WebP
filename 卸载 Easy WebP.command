#!/bin/bash
set -u

target_dir="$HOME/Library/Application Support/Adobe/CEP/extensions/com.tino.webpExporter26"
if [ ! -d "$target_dir" ]; then
  echo "没有找到已安装的 Easy WebP。"
  read -r -p "按回车键关闭…"
  exit 0
fi

trash_dir="$HOME/.Trash/com.tino.webpExporter26-$(date +%Y%m%d-%H%M%S)"
mv "$target_dir" "$trash_dir"
echo "Easy WebP 已移到废纸篓。"
echo "请重启 After Effects。"
read -r -p "按回车键关闭…"
