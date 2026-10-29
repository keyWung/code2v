#!/usr/bin/env bash
# 逐镜生成口播，全片统一语速：某镜放不下就报错，不单独提速（EP01 镜 5 单独提速后语速前后不一）
#   默认：微软在线语音「云希」（edge-tts，口播文字会发到微软服务器）
#   换音色：VOICE=zh-CN-YunyangNeural bash scripts/make-vo.sh
#   换语速：SPEED=1.1 bash scripts/make-vo.sh
#   本地婷婷：ENGINE=say bash scripts/make-vo.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/vo

FF=$(node -e 'import("ffmpeg-static").then((m) => console.log(m.default))')
ENGINE=${ENGINE:-edge}
if [ "$ENGINE" = edge ]; then
  VOICE=${VOICE:-zh-CN-YunxiNeural}
  EDGE=.venv/bin/edge-tts
  [ -x "$EDGE" ] || { python3 -m venv .venv && .venv/bin/pip install -q edge-tts; }
else
  VOICE=${VOICE:-Tingting}
fi
SPEED=${SPEED:-1.18}
# 口播在本镜开头 +4 帧进入，最后一个字说完后至少留 0.25 秒
LEAD=0.133
TAIL=0.25

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

# 文件末尾常带近 1 秒静音，按最后一个字结束的时间判断放不放得下
speech_end() {
  "$FF" -nostdin -hide_banner -i "$1" -af silencedetect=noise=-40dB:d=0.25 -f null - </dev/null 2>&1 |
    awk -v total="$(afinfo "$1" </dev/null | awk '/estimated duration/ { print $3 }')" \
      '/silence_start/ { s = $NF; e = "" } /silence_end/ { e = $5 } END { print (s != "" && (e == "" || e >= total - 0.05) ? s : total) }'
}

over=0
while IFS=$'\t' read -r shot secs text; do
  out="public/vo/shot$shot.wav"
  speak "$SPEED" "$text" "$out"
  end=$(speech_end "$out")
  max=$(awk -v s="$secs" -v l="$LEAD" -v t="$TAIL" 'BEGIN { printf "%.2f", s - l - t }')
  if awk -v e="$end" -v m="$max" 'BEGIN { exit !(e <= m) }'; then fits=ok; else fits="放不下：请精简 JSON 里镜 $shot 的口播"; over=1; fi
  printf 'shot%s  说完 %5.2fs / 可用 %5.2fs  %s ×%s  %s\n' "$shot" "$end" "$max" "$VOICE" "$SPEED" "$fits"
done < <(node -e '
const e = require("./episodes/ep05-dianchangxian.json");
// 只改念法：9.0×10^5 念成“9.0乘10的5次方”，1/4 念成“4分之1”
const say = (t) => t.replace(/(\d+(?:\.\d+)?)×10\^(-?\d+)/g, "$1乘10的$2次方").replace(/(\d+)\/(\d+)/g, "$2分之$1");
for (const s of e.shots) {
  const [a, b] = s.frames.split("-").map(Number);
  console.log([s.shot, (b - a) / e.format.fps, say(s["口播"])].join("\t"));
}')
exit $over
