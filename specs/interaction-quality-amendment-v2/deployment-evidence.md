# Multica 部署回读证据

记录时间：2026-07-22。这里只保存只读回验结果，不把 Multica 规则写入 WorkflowHub
运行代码。

## Agent instructions

| Agent | Skill 绑定 | instructions SHA-256 |
| --- | --- | --- |
| 工头 | 无 Stage Skill | `ac5f671c7e38ad4f582494eed5e5a9f4c55c22d6038ce8fabb3327b82aee57e7` |
| Decision Maker | make-decision | `b7c79906be558db1e0139b15b97f0c35f607fb9737748ab9e540d59b2b7fb99f` |
| Spec Builder | build-spec | `93e8fd1dc12df6fadfed2ebc360b14dbf2f728f3ab974a1276865e73ebddaaed` |
| Plan Builder | build-plan | `bd5751e3c9e586bedc35390f4ca28bd6e446cbddda8865a085b3d69781231d42` |
| Code Builder | build-code | `15fec0a5d41d3493cf2ea4ac366635aa7877d8fb891baa40a7d6eb112b6c1832` |
| Coder | build-code | `745b7812c0b9aebda5c0504ac815879d4e9ffeecfdd67894a6d7bf930cbf27a9` |
| Code Verifier | verify-code | `890f131b255f718fbd427ba94f57eface19c8e1673cdc6d7c9b0284bf52f2a49` |

回读确认：工头不绑定 Stage Skill；五个 Stage Agent 只绑定对应 Skill；Coder 绑定
`build-code` 并只执行 Phase 部分。没有更改任何 Agent 的 model、provider、runtime、
thinking level 或 Skill ID。

工头在最后一次静默唤醒修正后已重新回读；上表使用的是该线上现行版本的哈希。

## WorkflowHub Skill

| Skill | Skill ID | 线上/本地 SHA-256 | 一致 |
| --- | --- | --- | --- |
| make-decision | `49296e6d-75a8-4ea7-a7d7-35a7249b0b35` | `d274162a33a46c4633ef4276c29d29c9c9b9a411db7e6f1974dde8bacb196457` | 是 |
| build-spec | `286c2378-134b-419e-be11-0de219e50107` | `c4b5fbab840b5f0ff4fda26415914410f31f47031bebad38865808a0bc7d9030` | 是 |
| build-plan | `3911d665-5dda-4db6-9ca8-4bec233cb23f` | `087c3bcc7b78f42589f030ca41413bd4a54d6557e4467400ff06c432c033c968` | 是 |
| build-code | `49433dcf-987d-4899-ab22-efc86a314266` | `bcfc4213e99b5d41da0fa82db7b6ca637dfa2137fc6187db18eb80e9a5e3678a` | 是 |
| verify-code | `f486dfd5-d626-43d9-924c-b2b13fc4e239` | `004328ea400ed464830a8454675d6db7508460c0809a2e6b6c00514ee9f3ce8e` | 是 |

五个 Skill 均为原位覆盖，ID 与 Agent 绑定不变。
