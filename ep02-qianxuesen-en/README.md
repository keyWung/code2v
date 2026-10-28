# Physics in Code EP02：The Qian Xuesen Trajectory（英文版）

EP02《钱学森弹道》的英文版，从 `../ep02-qianxuesen` 复制出来单独维护，中文版没有改动。画面、分帧、物理示意、版式规则和中文版一致，只换了文字和配音。

- 数据唯一来源：`episodes/ep02-qianxuesen-en.json`（英文口播、字幕、章节名、盖章、发布文案）
- 配色唯一来源：`src/theme.ts`，色值与 EP01 完全一致（`npm run verify` 会比对）
- 配音：微软在线英文男声 Andrew（edge-tts），全片统一 1.10 倍速
- 英文盖章在 JSON 里用 `\n` 分好两行；字幕太长时在句号、冒号、逗号后断行
- 输出文件名：`out/EP02-QianXuesen-EN.mp4` 等

## 常用命令

```bash
npm run studio   # 浏览器里预览、拖时间轴（带口播）
npm run verify   # 自查清单：分镜帧、盖章时机、章节进度、遮挡区、事实边界、比喻小注、颜色来源、画面无残留中文
npm run vo       # 重新生成 public/vo/*.wav（默认微软英文男声 Andrew，全片统一 1.10 倍速）
npm run dub      # 只换配音：口播合进无配音版画面，几秒完成
npm run stills   # 渲染关键帧到 out/frames/，加 --safe 叠加平台遮挡区
npm run render   # 重渲画面：成片、无配音版、封面、字幕全部输出到 out/
```

## 沿用 EP01 踩过的坑

- **冻结段闪烁**：弹簧动画 40 帧后定格为精确的 1（`settle`），冻结段内不动画字号；`render` 每次都逐字节比对 2010–2159 帧，不一致就停下、不出片。
- **React key 不能重复**（EP02 新踩的）：地球经线起点都一样，曾用路径前缀当 key，React 会把上一帧的旧线留在页面上；每个渲染标签页画过的帧不同，冻结段就出现 4 种画面。列表的 key 一律用唯一编号。
- **语速前后不一**：`vo` 只用一个语速，按最后一个字说完的时间判断放不放得下；放不下就报错，请精简 JSON 口播，不会单独给某一镜提速。
- **macOS 13 跑不了 Remotion 自带 ffmpeg**：`render` 先出 JPEG 序列，再用 `ffmpeg-static` 编码和混音。
- **edge-tts 不走系统代理**：脚本显式传 `HTTPS_PROXY`，断线自动重试；口播文字会发到微软服务器。
- **渲染用的 Chrome 下载很慢**：Remotion 直连下载不走代理。已放在 `node_modules/.remotion/`；重装依赖后若卡住，用代理下载 `https://storage.googleapis.com/chrome-for-testing-public/157.0.8080.0/mac-x64/chrome-headless-shell-mac-x64.zip`，解压到 `node_modules/.remotion/chrome-headless-shell/mac-x64/`，并在上一级写 `VERSION` 文件，内容 `157.0.8080.0`。
- **遮挡区**：地球在 x=912 前淡出，雷达、落点、预测点、标签都在右侧互动栏和底部操作栏之外；`verify` 会逐点检查。
- **封面裁切**：9:16 封面的内容放在中间 1440 高的区域，主页裁成 3:4 时不会被切掉。
- **只留一份分集 JSON**：只读 `episodes/`，根目录不要放副本。
