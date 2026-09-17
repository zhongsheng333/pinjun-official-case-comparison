# Case data interface v1

Public canonical input: `data/cases.json`, object `{schema_version:"pinjun-public-cases/v1", version:"1.0.0", updated_at:"2026-09-16", title, sources:[], cases:[]}`.

Each source: `{id,title,url,publisher,published_at,case_count}`. Exactly two sources and 13 cases in the initial complete release.

Each case: `{id,source_id,case_number,title,behavior_tags:[],fields:{region,behavior,charges,outcome}}`.
Each field: `{value:string, evidence:[{section:string,paragraph:string}]}`. Section identifies the official case number and subsection, paragraph identifies the paragraph opening or ordinal. `value:"未披露"` is mandatory for absence; evidence may be empty only for absence. No inferred facts. Case title and source linkage must match official material.

Renderer resolves source metadata by source_id. Field evidence links to the official URL and displays its section + paragraph locator. Keep source links and complete content readable with JavaScript disabled. Dataset counts describe only these 13 selected cases, not population statistics. Public output base path: `/research/cybercrime-cases/`.

Maintainer: 广东品珺律师事务所（资料整理与技术维护）. Compilation is AI-assisted public-source organization, not lawyer review. Wang Dewei is only linked to existing verified biography https://www.gdpj.top/lawyers/wang-dewei/ and never claimed as case counsel/reviewer/author. No phone marketing in the dataset.

Independent ownership: data author owns data/cases.json and sources-index.md. UI author owns scripts/, public/, tests/, package.json, README.md, methodology.md and CHANGELOG.md. Root owns experiment/, audit/, integration and publication. No deployment or browser actions by children.
