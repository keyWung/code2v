#!/usr/bin/env bash
# 成片：Remotion 出 JPEG 序列 → ffmpeg-static 编码无配音版 → dub.sh 混入口播
# Remotion 自带的 ffmpeg 需要 macOS 15，这里绕开它
set -euo pipefail
cd "$(dirname "$0")/.."

FF=$(node -e 'import("ffmpeg-static").then((m) => console.log(m.default))')
NAME="EP05-电场线"
SEQ=out/seq
mkdir -p out

npx tsx scripts/verify.ts >/dev/null || { echo "自查未通过，先运行 npm run verify 看哪一项" >&2; exit 1; }

rm -rf "$SEQ"
npx remotion render EP05 "$SEQ" --sequence --image-format=jpeg --jpeg-quality=95 --props='{"voice":false}'

# 最后一镜必须逐帧一致
read -r FROM TO < <(node -e '
const e = require("./episodes/ep05-dianchangxian.json");
const [a, b] = e.shots[e.shots.length - 1].frames.split("-").map(Number);
console.log(a, b - 1);')
kinds=$(for i in $(seq "$FROM" "$TO"); do md5 -q "$SEQ/element-$(printf %04d "$i").jpeg"; done | sort -u | wc -l | tr -d ' ')
if [ "$kinds" != 1 ]; then
  echo "冻结段 $FROM-$TO 帧不一致（$kinds 种画面）" >&2
  exit 1
fi
echo "冻结段 $FROM-$TO 帧逐字节一致"

read -r FPS SECS < <(node -e '
const e = require("./episodes/ep05-dianchangxian.json");
console.log(e.format.fps, e.format.duration_seconds);')
"$FF" -y -loglevel error -framerate "$FPS" -pattern_type glob -i "$SEQ/*.jpeg" \
  -vf "scale=out_color_matrix=bt709:out_range=tv" -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:v libx264 -preset slow -tune animation -crf 18 -pix_fmt yuv420p -profile:v high \
  -t "$SECS" -movflags +faststart "out/$NAME-无配音.mp4"
rm -rf "$SEQ"

bash scripts/dub.sh

npx remotion still Cover out/cover.png
npx remotion still Cover34 out/cover-3x4.png
npx tsx scripts/make-srt.ts

ls -lh out/*.mp4 out/*.png out/*.srt
