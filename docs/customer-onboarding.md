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

```powershell
powershell -ExecutionPolicy Bypass -File scripts\onboard-agent.ps1 -ApiKey <customer-key> -ModelName <their-model>
```

It checks Node 24+ (`node:sqlite` is core only from 24), locates
`AosService\PackagesLocalDirectory` by scanning volumes (the drive letter varies
by VM image), identifies custom models by AOT **layer** in the Descriptor XML
(Microsoft ships at layer 0; customer code sits at 14), probes the hosted server,
and writes an MCP client config registering both servers.

Then restart VS Code and confirm both appear in the MCP panel.

### Issuing the key

One key per customer, so it can be revoked without affecting anyone else. Today
there is a single shared key in Secret Manager (`d365fo-mcp-api-key`) — that is
fine for testing and **not** shippable. Per-customer keys with revocation are
the prerequisite for charging anyone.

## Current limitation: the endpoint is not public

Org policy `constraints/iam.allowedPolicyMemberDomains` (console name: **Domain
restricted sharing**) forbids granting `allUsers` the `run.invoker` role, so
Cloud Run rejects callers from outside the Workspace domain *before* the API key
is ever checked. A customer cannot connect at all.

Until that is lifted, onboarding requires `-WithIdentityToken`, which mints a
Google identity token valid for about an hour. That is a testing crutch, not a
customer path.

The fix is an org-level grant of **Organization Policy Administrator**
(`roles/orgpolicy.policyAdmin`) to someone who can then override Domain
restricted sharing for the `dynamics-mcp` project (Allow All). Project Owner is
not sufficient — the policy outranks IAM roles. The alternative, if the
exception is refused, is an external Application Load Balancer in front of the
service (~$18/month for the forwarding rule), which holds `run.invoker` as an
in-domain identity.

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
