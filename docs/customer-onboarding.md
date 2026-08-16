# Customer onboarding

What a customer runs to connect their D365FO developer VM to the hosted MCP
server. This is the repeatable per-customer procedure; it should stay short
enough that a customer can do it unattended.

## What gets installed where

The product is split across two MCP servers that a single Copilot session talks
to at once:

| | Runs on | Publishes | Needs |
|---|---|---|---|
| **Cloud** | Cloud Run, `us-east5` | `search`, `get_object_info`, `get_knowledge`, `analyze_code`, `d365fo_file(action=generate)` | the Neon index |
| **Local agent** | customer VM | `d365fo_file(create/modify)`, `build_d365fo_project`, `verify_d365fo_project`, `undo_last_modification`, `get_workspace_info` | Windows, `xppc`, `PackagesLocalDirectory` |

The partition is `LOCAL_TOOLS` in `src/server/serverMode.ts`, enforced in two
places that cannot drift — the ListTools filter and the runtime call gate.

This is the commercial shape: the index and the generation rules never land on
the customer's disk. Their machine holds a file writer and a compiler. Verified
by probing the local agent's tool list — it must not contain `search` or
`get_knowledge`.

Do **not** send customers to `install.ps1`. That is the upstream standalone
installer: it builds the C# bridge, extracts metadata, and constructs a
multi-gigabyte local index — precisely the asset being sold as a service.

## The procedure

Install the agent — no git, no clone, no build:

```powershell
npm i -g https://raw.githubusercontent.com/sassiiine/d365fo-mcp-server/release/d365fo-mcp-1.11.0.tgz
```

NOT `npm i -g github:...`. A GLOBAL git install fails on Windows with
`CwdError: ENOENT: Cannot cd into .../node_modules/d365fo-mcp` (npm 11 cannot
create its own extraction target), and even when it gets that far it does not
install devDependencies, so the build step has no TypeScript. A LOCAL
`npm install --prefix` does work, which is exactly why this went unnoticed.
The tarball needs neither git nor a compiler.

Refresh the tarball on the `release` branch with `npm run build && npm pack`.

Then point it at the hosted server:

```powershell
d365fo-mcp onboard --api-key <customer-key>
```

The customer needs no Google account and no `gcloud`. Their API key is the only
credential.

No model argument is needed. The command detects the packages root by scanning
volumes (the drive letter varies by VM image) and lists the custom models it
finds by AOT layer; pinning one is optional because the assistant can be told
which model to use, or asked to create one with `create_d365fo_model`.

Nothing about the hosted half ships here: the index, the generation logic, the
validator and the knowledge stay on the server. What lands on the customer's
disk writes files and runs `xppc` — which has to be local, because that is where
`PackagesLocalDirectory` and the AOS are.

Then restart VS Code and confirm both appear in the MCP panel.

There are no PowerShell scripts left in this flow. Both that existed
(`setup-model.ps1`, `onboard-agent.ps1`) duplicated logic that now lives in
TypeScript — `create_d365fo_model` and `d365fo-mcp onboard` — and the duplication
was not theoretical: the script and the tool derived a model's `Id` differently,
so the same model name got a different Id depending on which one created it.

### Issuing the key

One key per customer, issued from the `tenancy.api_keys` table in Neon. Needs
`NEON_DATABASE_URL` in the environment.

```powershell
npm run keys -- issue "Contoso" --label "prod VM"
npm run keys -- list
npm run keys -- revoke "Contoso"
```

The key is printed **once** at issue time and cannot be recovered — only its
SHA-256 digest is stored, so a dump of the table does not let the reader call the
service. A customer who loses their key gets a new one and the old is revoked.

Revocation is an `UPDATE`, not a `DELETE`, so the row survives as a record of who
had access and when it ended. It takes effect within `API_KEY_CACHE_TTL_MS`
(default 60 s) on instances that are already warm — the store caches lookups so
auth does not cost a database round trip per MCP call.

The `API_KEY` environment variable still works as an **operator/root** key. It is
checked without touching the database, deliberately, so a Neon outage cannot lock
you out of the service you need in order to diagnose it. Customer keys fail closed
in that situation: a database error is never treated as a pass.

First-time setup of the table:

```powershell
npm run keys -- init
```

## How the endpoint is reachable without Google credentials

The service carries `run.googleapis.com/invoker-iam-disabled: 'true'` — Cloud
Run's **Security → Authentication → Allow public access** setting. That switches
the IAM invoker check *off* rather than granting `allUsers` the `run.invoker`
role.

The distinction is worth keeping in mind, because the two look identical from
the outside and only one of them works here. Granting `allUsers` is refused by
the org policy `constraints/iam.allowedPolicyMemberDomains` ("Domain restricted
sharing"), which limits IAM members to the Workspace customer ID — and no IAM
role, Owner included, overrides it. Disabling the check needs no IAM binding at
all, so the policy never applies. `gcloud run deploy --allow-unauthenticated`
takes the first route and fails; the console setting takes the second.

Consequence: `gcloud run services get-iam-policy` shows **no invoker bindings**
on a service that is fully public. Do not read that as "not exposed".

With the check off, the app's key middleware is the *only* thing between the
internet and the index. That is why keys are per customer and revocable rather
than one shared secret — see "Issuing the key" above.

## Verifying an onboarding worked

```powershell
powershell -ExecutionPolicy Bypass -File scripts\test-cloudrun.ps1
```

Checks health, that the API key is enforced (401 without it), the MCP handshake
reports `(read-only)`, a Neon-backed search returns matches, and that the cloud
authors AOT XML.

## Encoding traps

Two file formats in this flow disagree, and both fail confusingly:

* **MCP client config** must be UTF-8 **without** BOM. `Set-Content -Encoding
  utf8` under Windows PowerShell 5.1 writes a BOM, and JSON parsers reject it on
  the first character.
* **D365FO metadata XML** must be UTF-8 **with** BOM, or the compiler reports
  unicode substitution characters. `d365fo_file(action=create)` handles this;
  hand-writing the file from `action=generate` output does not.
