# 代码画物理 EP01：抛物线

Remotion + React + TypeScript，竖屏 1080x1920 / 30fps / 52 秒。

- 数据唯一来源：`episodes/ep01-paowuxian.json`
- 配色唯一来源：`src/theme.ts`
- 轨迹由 `src/physics.ts` 的 x(t)、y(t) 实时计算

## 常用命令

```bash
npm run studio   # 浏览器里预览、拖时间轴（带口播）
npm run verify   # 复算三组数字、分镜帧、盖章时机、颜色来源
npm run vo       # 重新生成 public/vo/*.wav（默认微软「云希」男声）
npm run dub      # 只换配音：口播合进无配音版画面，几秒完成
npm run stills   # 渲染关键帧到 out/frames/，加 --safe 叠加平台遮挡区
npm run render   # 重渲画面：成片、无配音版、封面、字幕全部输出到 out/
```

配音：
- 默认用 edge-tts 调微软在线语音，口播文字会发到微软服务器；装在 `.venv/`，走系统代理 `HTTPS_PROXY`
- 全片统一语速，默认 1.18 倍；改语速：`SPEED=1.1 npm run vo && npm run dub`（某镜放不下时脚本只给该镜提速并提示）
- 换音色：`VOICE=zh-CN-YunyangNeural npm run vo && npm run dub`
- 换回本地婷婷：`ENGINE=say npm run vo && npm run dub`
- 自己录音：把 6 段音频按镜号命名为 `public/vo/shot1.wav`…`shot6.wav`，再 `npm run dub`

本机 macOS 13 跑不了 Remotion 自带的 ffmpeg（需 macOS 15），所以 `render` 先出 JPEG 序列，再用 `ffmpeg-static` 编码和混音。
