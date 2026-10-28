#!/usr/bin/env bash
# 把 public/vo 的七段口播按镜头时间混成一条音轨，合进无配音版画面
# 视频轨直接复制不重新编码，换配音只需 npm run vo && npm run dub
set -euo pipefail
cd "$(dirname "$0")/.."

FF=$(node -e 'import("ffmpeg-static").then((m) => console.log(m.default))')
NAME="EP02-钱学森弹道"
[ -f "out/$NAME-无配音.mp4" ] || { echo "缺少 out/$NAME-无配音.mp4，先运行 npm run render" >&2; exit 1; }
[ -f public/vo/shot1.wav ] || bash scripts/make-vo.sh

# 每镜口播在本镜开头 +4 帧进入
read -r SECS DELAYS < <(node -e '
const e = require("./episodes/ep02-qianxuesen.json");
const d = e.shots.map((s) => Math.round(((Number(s.frames.split("-")[0]) + 4) / e.format.fps) * 1000));
console.log(e.format.duration_seconds, d.join(","));')
IFS=, read -ra D <<< "$DELAYS"
inputs=()
filters=""
labels=""
for i in "${!D[@]}"; do
  inputs+=(-i "public/vo/shot$((i + 1)).wav")
  filters+="[$i]adelay=delays=${D[$i]}:all=1[a$i];"
  labels+="[a$i]"
done
"$FF" -y -loglevel error "${inputs[@]}" \
  -filter_complex "${filters}${labels}amix=inputs=${#D[@]}:normalize=0,apad=whole_dur=$SECS,loudnorm=I=-16:TP=-1.5:LRA=11[out]" \
  -map "[out]" -ar 48000 -c:a aac -b:a 192k -t "$SECS" out/vo.m4a

"$FF" -y -loglevel error -i "out/$NAME-无配音.mp4" -i out/vo.m4a -map 0:v -map 1:a -c copy -t "$SECS" \
  -movflags +faststart "out/$NAME.mp4"
rm -f out/vo.m4a
ls -lh "out/$NAME.mp4"
