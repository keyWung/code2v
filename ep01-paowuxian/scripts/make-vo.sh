#!/usr/bin/env bash
# 逐镜生成口播，全片统一语速；某镜放不下时只给该镜提速并提示
#   默认：微软在线语音「云希」（edge-tts，口播文字会发到微软服务器）
#   换音色：VOICE=zh-CN-YunyangNeural bash scripts/make-vo.sh
#   换语速：SPEED=1.1 bash scripts/make-vo.sh
#   本地婷婷：ENGINE=say bash scripts/make-vo.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/vo

ENGINE=${ENGINE:-edge}
if [ "$ENGINE" = edge ]; then
  VOICE=${VOICE:-zh-CN-YunxiNeural}
  EDGE=.venv/bin/edge-tts
  [ -x "$EDGE" ] || { python3 -m venv .venv && .venv/bin/pip install -q edge-tts; }
else
  VOICE=${VOICE:-Tingting}
fi
SPEED=${SPEED:-1.18}
MAX_SPEED=1.5

# speak <语速倍数> <文本> <输出 wav>
speak() {
  if [ "$ENGINE" = edge ]; then
    local mp3="${3%.wav}.mp3" try
    # edge-tts 不读代理环境变量，需显式传入；连接偶尔被重置，重试几次
    for try in 1 2 3 4; do
      "$EDGE" ${HTTPS_PROXY:+--proxy "$HTTPS_PROXY"} --voice "$VOICE" \
        --rate="$(awk -v f="$1" 'BEGIN { printf "%+d%%", int((f - 1) * 100 + 0.999) }')" \
        --text "$2" --write-media "$mp3" </dev/null 2>"$mp3.log" && break
      if [ "$try" = 4 ]; then
        echo "连不上微软语音服务（检查网络和代理）：$(tail -1 "$mp3.log")" >&2
        rm -f "$mp3" "$mp3.log"
        return 1
      fi
      sleep 3
    done
    afconvert -f WAVE -d LEI16@24000 "$mp3" "$3"
    rm -f "$mp3" "$mp3.log"
  else
    say -v "$VOICE" -r "$(awk -v f="$1" 'BEGIN { printf "%d", 200 * f }')" -o "$3" --data-format=LEI16@24000 "$2" </dev/null
  fi
}

node -e '
const e = require("./episodes/ep01-paowuxian.json");
for (const s of e.shots) {
  const [a, b] = s.frames.split("-").map(Number);
  console.log([s.shot, (b - a) / e.format.fps, s["口播"]].join("\t"));
}' | while IFS=$'\t' read -r shot secs text; do
  out="public/vo/shot$shot.wav"
  max=$(awk -v s="$secs" 'BEGIN { print s - 0.45 }')
  speed=$SPEED
  for _ in 1 2 3 4 5; do
    speak "$speed" "$text" "$out"
    dur=$(afinfo "$out" </dev/null | awk '/estimated duration/ { print $3 }')
    awk -v d="$dur" -v m="$max" 'BEGIN { exit !(d <= m) }' && break
    speed=$(awk -v f="$speed" -v d="$dur" -v m="$max" -v cap="$MAX_SPEED" 'BEGIN { n = f * d / m * 1.04; print (n > cap ? cap : n) }')
  done
  fits=$(awk -v d="$dur" -v m="$max" -v f="$speed" -v s="$SPEED" 'BEGIN { print (d > m ? "超时" : f > s ? "ok（超出统一语速，可精简台词）" : "ok") }')
  printf 'shot%s  %5.2fs / %ss  %s  语速×%.2f  %s\n' "$shot" "$dur" "$secs" "$VOICE" "$speed" "$fits"
done
