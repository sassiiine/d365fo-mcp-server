// src/agent/main.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { promises as fs2 } from "node:fs";

// src/agent/writeObject.ts
import { promises as fs } from "node:fs";
import { dirname, join, resolve } from "node:path";

// src/agent/aotFolders.ts
var AOT_FOLDERS = {
  class: "AxClass",
  table: "AxTable",
  form: "AxForm",
  enum: "AxEnum",
  query: "AxQuery",
  view: "AxView",
  edt: "AxEdt",
  map: "AxMap",
  report: "AxReport",
  menu: "AxMenu",
  service: "AxService",
  "service-group": "AxServiceGroup",
  "data-entity": "AxDataEntityView",
  "menu-item-display": "AxMenuItemDisplay",
  "menu-item-action": "AxMenuItemAction",
  "menu-item-output": "AxMenuItemOutput",
  "security-privilege": "AxSecurityPrivilege",
  "security-duty": "AxSecurityDuty",
  "security-role": "AxSecurityRole",
  "table-extension": "AxTableExtension",
  "class-extension": "AxClass",
  "form-extension": "AxFormExtension",
  "enum-extension": "AxEnumExtension",
  "edt-extension": "AxEdtExtension",
  "menu-extension": "AxMenuExtension",
  "menu-item-display-extension": "AxMenuItemDisplayExtension",
  "menu-item-action-extension": "AxMenuItemActionExtension",
  "menu-item-output-extension": "AxMenuItemOutputExtension",
  "security-duty-extension": "AxSecurityDutyExtension",
  "security-role-extension": "AxSecurityRoleExtension",
  "data-entity-extension": "AxDataEntityViewExtension"
};
function aotFolder(objectType) {
  return AOT_FOLDERS[objectType.toLowerCase()] ?? null;
}

// src/agent/writeObject.ts
function normalizeMetadataXml(content) {
  return content.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n").replace(/\s+$/, "");
}
function resolveObjectPath(req) {
  const folder = aotFolder(req.objectType);
  if (!folder) throw new Error(`Unknown object type '${req.objectType}'.`);
  const packages = req.packagePath || process.env.D365FO_PACKAGE_PATH;
  if (!packages) {
    throw new Error(
      "No packages root. Pass packagePath, or set D365FO_PACKAGE_PATH to the PackagesLocalDirectory for this machine."
    );
  }
  return resolve(join(packages, req.modelName, req.modelName, folder, `${req.objectName}.xml`));
}
async function addToProject(projectPath, filePath) {
  let xml;
  try {
    xml = await fs.readFile(projectPath, "utf8");
  } catch {
    return false;
  }
  if (xml.includes(filePath)) return true;
  const entry = `    <Content Include="${filePath}">\r
      <SubType>Content</SubType>\r
    </Content>\r
`;
  let updated;
  if (/<ItemGroup\s*\/>/.test(xml)) {
    updated = xml.replace(/<ItemGroup\s*\/>/, `<ItemGroup>\r
${entry}  </ItemGroup>`);
  } else if (/<ItemGroup>/.test(xml)) {
    updated = xml.replace(/<ItemGroup>/, `<ItemGroup>\r
${entry.trimEnd()}`);
  } else {
    updated = xml.replace(/<\/Project>/, `  <ItemGroup>\r
${entry}  </ItemGroup>\r
</Project>`);
  }
  if (updated === xml) return false;
  await fs.writeFile(projectPath, updated, "utf8");
  return true;
}
async function writeObject(req) {
  const warnings = [];
  if (!req.xmlContent?.trim()) {
    throw new Error(
      'xmlContent is required. This agent writes XML; it does not generate it - author the object on the hosted server with d365fo_file(action="generate").'
    );
  }
  const target = resolveObjectPath(req);
  if (!req.overwrite) {
    try {
      await fs.access(target);
      throw new Error(`${target} already exists. Pass overwrite:true to replace it.`);
    } catch (e) {
      if (e instanceof Error && !/ENOENT/.test(String(e.code ?? e.message))) throw e;
    }
  }
  await fs.mkdir(dirname(target), { recursive: true });
  const body = normalizeMetadataXml(req.xmlContent);
  await fs.writeFile(target, body, "utf8");
  let addedToProject = false;
  if (req.projectPath) {
    addedToProject = await addToProject(req.projectPath, target);
    if (!addedToProject) warnings.push(`Could not add the file to ${req.projectPath}; the model-level build is unaffected.`);
  } else {
    warnings.push("No projectPath given, so the object is on disk but not in a Visual Studio project.");
  }
  return { path: target, bytes: Buffer.byteLength(body, "utf8"), addedToProject, warnings };
}

// src/agent/main.ts
var VERSION = "1.0.0";
var OBJECT_TYPES = Object.keys(AOT_FOLDERS);
var TOOLS = [
  {
    name: "d365fo_file",
    description: 'Write an AOT object to this machine. action="create" (or "modify") with xmlContent authored by the hosted server. This agent does NOT generate XML \u2014 call d365fo_file(action="generate") on the hosted server first, then pass the XML here verbatim.',
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["create", "modify"], description: "Both write xmlContent to disk." },
        objectType: { type: "string", enum: OBJECT_TYPES },
        objectName: { type: "string" },
        modelName: { type: "string", description: "Target model. Defaults to D365FO_MODEL_NAME." },
        xmlContent: { type: "string", description: "Complete AOT XML, written verbatim. Required." },
        projectPath: { type: "string", description: "Absolute .rnrproj path to register the file in." },
        packagePath: { type: "string", description: "Packages root; defaults to D365FO_PACKAGE_PATH." },
        overwrite: { type: "boolean", description: "Replace an existing file." }
      },
      required: ["action", "objectType", "objectName", "xmlContent"]
    }
  },
  {
    name: "build_d365fo_project",
    description: "Compile a model with xppc. Returns the compiler output verbatim \u2014 diagnosis of the errors belongs to the hosted server, which has the index needed to explain them.",
    inputSchema: {
      type: "object",
      properties: {
        modelName: { type: "string", description: "Model to build. Defaults to D365FO_MODEL_NAME." },
        fullBuild: {
          type: "boolean",
          description: "Full recompile of the target model. Default false is INCREMENTAL, which only compiles changed elements and reports success without revisiting the rest \u2014 never call a task done on an incremental green."
        }
      }
    }
  },
  {
    name: "verify_d365fo_project",
    description: "Confirm objects exist on disk and report their size, so a write can be checked without a build.",
    inputSchema: {
      type: "object",
      properties: {
        objects: {
          type: "array",
          description: "Objects to check.",
          items: {
            type: "object",
            properties: { objectType: { type: "string" }, objectName: { type: "string" }, modelName: { type: "string" } },
            required: ["objectType", "objectName"]
          }
        }
      },
      required: ["objects"]
    }
  },
  {
    name: "get_workspace_info",
    description: "Report the paths and model this agent is configured with, and what it can and cannot do.",
    inputSchema: { type: "object", properties: {} }
  }
];
var text = (s, isError = false) => ({ content: [{ type: "text", text: s }], ...isError ? { isError: true } : {} });
async function runBuild(_modelName, _fullBuild) {
  return "Build is not available in the thin agent yet.\n\nUse the full package for builds until the compiler invocation is extracted:\n  npm i -g github:sassiiine/d365fo-mcp-server\nand run it with MCP_SERVER_MODE=write-only.\n\nWriting objects through this agent works and is unaffected.";
}
async function handle(name, args) {
  const model = args.modelName || process.env.D365FO_MODEL_NAME || "";
  switch (name) {
    case "d365fo_file": {
      if (!model) return text("No model. Pass modelName or set D365FO_MODEL_NAME.", true);
      const r = await writeObject({
        objectType: args.objectType,
        objectName: args.objectName,
        modelName: model,
        xmlContent: args.xmlContent,
        projectPath: args.projectPath,
        packagePath: args.packagePath,
        overwrite: Boolean(args.overwrite)
      });
      return text(
        `Wrote ${args.objectType} ${args.objectName} (${r.bytes} bytes)
Path: ${r.path}
Project: ${r.addedToProject ? "registered" : "not registered"}
` + (r.warnings.length ? `
${r.warnings.map((w) => `- ${w}`).join("\n")}
` : "") + `
Next: build_d365fo_project(modelName="${model}", fullBuild=true).`
      );
    }
    case "build_d365fo_project": {
      if (!model) return text("No model. Pass modelName or set D365FO_MODEL_NAME.", true);
      const full = Boolean(args.fullBuild);
      const log = await runBuild(model, full);
      const failed = /error|exit [1-9]/i.test(log);
      return text(
        `${failed ? "BUILD FAILED" : "Build finished"} \u2014 ${model}, ${full ? "FULL" : "incremental"}
` + (full ? "" : "\nIncremental: unchanged elements were not recompiled, so this proves nothing about the model as a whole. Re-run with fullBuild=true before calling the task done.\n") + `
${log.slice(-6e3)}`,
        failed
      );
    }
    case "verify_d365fo_project": {
      const objects = args.objects ?? [];
      const lines = [];
      for (const o of objects) {
        try {
          const p = resolveObjectPath({
            objectType: o.objectType,
            objectName: o.objectName,
            modelName: o.modelName || model
          });
          const st = await fs2.stat(p).catch(() => null);
          lines.push(st ? `OK      ${o.objectType} ${o.objectName} \u2014 ${st.size} bytes` : `MISSING ${o.objectType} ${o.objectName} \u2014 ${p}`);
        } catch (e) {
          lines.push(`ERROR   ${o.objectType} ${o.objectName} \u2014 ${e instanceof Error ? e.message : e}`);
        }
      }
      return text(lines.join("\n") || "No objects given.", lines.some((l) => l.startsWith("MISSING")));
    }
    case "get_workspace_info":
      return text(
        `D365FO thin agent v${VERSION}

Packages : ${process.env.D365FO_PACKAGE_PATH ?? "(unset)"}
Model    : ${process.env.D365FO_MODEL_NAME ?? "(unset)"}
Node     : ${process.version}

This agent writes files and runs xppc. It has no symbol index, no generator and no knowledge base \u2014 search, object info, generation and validation all live on the hosted server.`
      );
    default:
      return text(`Unknown tool '${name}'. This agent publishes: ${TOOLS.map((t) => t.name).join(", ")}.`, true);
  }
}
var server = new Server({ name: "d365fo-agent", version: VERSION }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    return await handle(req.params.name, req.params.arguments ?? {});
  } catch (e) {
    return text(`${e instanceof Error ? e.message : String(e)}`, true);
  }
});
await server.connect(new StdioServerTransport());
console.error(`[d365fo-agent] v${VERSION} ready \u2014 ${TOOLS.length} tools, write-only`);
