# 帮信及关联犯罪官方案例检索与比较

零依赖 Node.js 静态生成器。它读取 `data/cases.json`，生成可直接加入现有网站 `/research/cybercrime-cases/` 路径的公开文件。页面在 JavaScript 关闭时仍显示完整案例；JavaScript 只增强筛选与至多三案比较。

## 本地命令

需要 Node.js 20 或更高版本。

```sh
npm test
npm run build
```

只有 Node.js、没有 npm 命令时，直接运行：

```sh
node --test tests/build.test.mjs tests/logic.test.mjs
node scripts/build.mjs
```

构建结果位于 `dist/research/cybercrime-cases/`，包括 HTML、CSS、JavaScript、JSON、CSV 和方法页。也可通过 `CASES_INPUT` 与 `OUTPUT_DIR` 环境变量对受控夹具执行构建。

## 发布说明

本仓库只负责生成待发布静态文件，不表示这些文件已经上线。发布时应将构建目录完整复制到目标站点对应路径，并在上线前核对 13 个案例、两个官方来源、下载文件与页面内容一致。

## 公开源码包与复现

```sh
node scripts/package-public.mjs
```

脚本从自身所在项目读取逐文件白名单，导出至 `audit/public-repository/`。该目录中的 `manifest.sha256` 记录每个导出源码文件的 SHA-256（不包含清单自身）。重复运行会覆盖白名单中的旧副本；若输出目录含额外文件、目录、符号链接或硬链接则停止，不自动删除。脚本不读取环境变量来扩展范围，不包含实验记录、审计资料、浏览器状态、凭据、Git 历史或其他工作区文件。新增源码文件后需审阅并更新脚本中的白名单。

在导出目录中运行 `npm test` 和 `npm run build` 即可复现静态页面，无需安装第三方依赖或调用付费 API。公开源码包准备完成不代表 GitHub 仓库已经创建或代码已经上传。实际发布源码前应核对清单，只上传导出目录中的源码和清单；不要上传随后生成的 `dist/` 或 `audit/`。

## 纠错方式

发现问题时，请向资料维护方提供案例 ID、字段名、官方来源链接、小节及段落定位，以及建议修改内容；没有原文依据的事实不予补全。也可修改 `data/cases.json` 后提供补丁，附相同证据说明。修订时同步更新数据版本、更新时间和 `CHANGELOG.md`，重新运行测试与构建，核对 HTML、JSON、CSV 内容一致；最后重新生成公开源码包。GitHub 仓库实际公开并开放 Issues 后，可通过该仓库提交同样的纠错材料。本说明不表示律师已审阅数据或承担本专题作者身份。
