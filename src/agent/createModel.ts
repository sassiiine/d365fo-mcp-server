/**
 * Create a D365FO model: descriptor, AOT skeleton, Visual Studio project, and
 * the link that makes PackagesLocalDirectory see it.
 *
 * This was a PowerShell script the customer had to run by hand, which is a poor
 * reason to leave a step outside the agent - the work is directories and two XML
 * templates, none of it the hosted product. Making it a tool means an agent that
 * finds the target model missing can create it and carry on.
 *
 * Two layouts are supported, because only one of them is universal:
 *   * metadata in a git repo, junctioned into PackagesLocalDirectory (how this
 *     VM is set up, and how anyone versioning their X++ works);
 *   * metadata directly under PackagesLocalDirectory (the plain install).
 * The repo layout is used when a repo root is given or detected, otherwise the
 * model is created in place. Guessing wrong would put a customer's model
 * somewhere their source control never sees.
 */
import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

export interface CreateModelRequest {
  modelName: string;
  /** Metadata repo root (contains Metadata\ and Projects\). Omit for in-place. */
  repoRoot?: string;
  /** PackagesLocalDirectory; defaults to D365FO_PACKAGE_PATH. */
  packagesPath?: string;
  description?: string;
  publisher?: string;
  /** AOT layer. 14 (USR) is customer code; Microsoft ships at 0. */
  layer?: number;
  /** Modules the model may reference. Without these, standard EDTs do not resolve. */
  moduleReferences?: string[];
}

export interface CreateModelResult {
  modelName: string;
  modelId: number;
  metadataPath: string;
  projectPath: string;
  linkedFrom?: string;
  created: string[];
  warnings: string[];
}

/**
 * Minimum references for a model whose tables bind standard EDTs.
 *
 * ApplicationPlatform and ApplicationFoundation carry Name/AmountMST/TransDate
 * and friends; omit them and every field bound to one fails to compile with an
 * error that names the EDT rather than the missing reference.
 */
const DEFAULT_MODULES = [
  'ApplicationCommon',
  'ApplicationFoundation',
  'ApplicationPlatform',
  'ApplicationSuite',
  'Currency',
  'Directory',
];

/** AOT folders worth pre-creating; the write path creates others on demand. */
const SKELETON = ['AxClass', 'AxTable', 'AxForm', 'AxEnum', 'AxEdt', 'AxMenuItemDisplay', 'AxQuery', 'AxView'];

/**
 * A stable model id derived from the name.
 *
 * Stable so re-running for the same name cannot collide with itself, and inside
 * the custom range so it cannot collide with a Microsoft model.
 */
export function modelIdFor(modelName: string): number {
  const h = createHash('sha256').update(modelName).digest();
  return 896_000_000 + (h.readUInt32BE(0) % 900_000);
}

export function buildDescriptorXml(req: Required<Pick<CreateModelRequest, 'modelName'>> & {
  modelId: number; description: string; publisher: string; layer: number; modules: string[];
}): string {
  const refs = req.modules.map(m => `\t\t<d2p1:string>${m}</d2p1:string>`).join('\r\n');
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<AxModelInfo xmlns:i="http://www.w3.org/2001/XMLSchema-instance">',
    '\t<AppliedUpdates xmlns:d2p1="http://schemas.microsoft.com/2003/10/Serialization/Arrays" />',
    '\t<Customization>Allow</Customization>',
    `\t<Description>${req.description}</Description>`,
    `\t<DisplayName>${req.modelName}</DisplayName>`,
    `\t<Id>${req.modelId}</Id>`,
    '\t<InternalsVisibleTo xmlns:d2p1="http://schemas.microsoft.com/2003/10/Serialization/Arrays" />',
    `\t<Layer>${req.layer}</Layer>`,
    '\t<Locked>false</Locked>',
    `\t<ModelModule>${req.modelName}</ModelModule>`,
    '\t<ModelReferences xmlns:d2p1="http://schemas.microsoft.com/2003/10/Serialization/Arrays" i:nil="true" />',
    '\t<ModuleReferences xmlns:d2p1="http://schemas.microsoft.com/2003/10/Serialization/Arrays">',
    refs,
    '\t</ModuleReferences>',
    `\t<Name>${req.modelName}</Name>`,
    `\t<Publisher>${req.publisher}</Publisher>`,
    '\t<VersionBuild>0</VersionBuild>',
    '\t<VersionMajor>1</VersionMajor>',
    '\t<VersionMinor>0</VersionMinor>',
    '\t<VersionRevision>0</VersionRevision>',
    '</AxModelInfo>',
  ].join('\r\n');
}

export function buildProjectXml(modelName: string, guid: string): string {
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<Project ToolsVersion="14.0" DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">',
    '  <PropertyGroup>',
    "    <Configuration Condition=\" '$(Configuration)' == '' \">Debug</Configuration>",
    "    <Platform Condition=\" '$(Platform)' == '' \">AnyCPU</Platform>",
    "    <BuildTasksDirectory Condition=\" '$(BuildTasksDirectory)' == ''\">$(MSBuildProgramFiles32)\\MSBuild\\Microsoft\\Dynamics\\AX</BuildTasksDirectory>",
    `    <Model>${modelName}</Model>`,
    '    <TargetFrameworkVersion>v4.6</TargetFrameworkVersion>',
    '    <OutputPath>bin</OutputPath>',
    '    <SchemaVersion>2.0</SchemaVersion>',
    '    <GenerateCrossReferences>True</GenerateCrossReferences>',
    '    <RunAppCheckerRules>False</RunAppCheckerRules>',
    '    <DeployOnline>False</DeployOnline>',
    `    <ProjectGuid>${guid}</ProjectGuid>`,
    `    <Name>${modelName}</Name>`,
    `    <RootNamespace>${modelName}</RootNamespace>`,
    '  </PropertyGroup>',
    "  <PropertyGroup Condition=\"'$(Configuration)|$(Platform)' == 'Debug|AnyCPU'\">",
    '    <Configuration>Debug</Configuration>',
    '    <DBSyncInBuild>True</DBSyncInBuild>',
    '  </PropertyGroup>',
    '  <ItemGroup />',
    '  <Import Project="$(BuildTasksDirectory)\\Microsoft.Dynamics.Framework.Tools.BuildTasks.targets" />',
    '</Project>',
  ].join('\r\n');
}

const exists = (p: string) => fs.access(p).then(() => true, () => false);

export async function createModel(req: CreateModelRequest): Promise<CreateModelResult> {
  const name = req.modelName?.trim();
  if (!name) throw new Error('modelName is required.');
  // A model name becomes a folder, a namespace and an assembly name.
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name)) {
    throw new Error(`'${name}' is not a valid model name — letters, digits and underscores, starting with a letter.`);
  }

  const packages = req.packagesPath || process.env.D365FO_PACKAGE_PATH;
  if (!packages) throw new Error('No packages root. Pass packagesPath or set D365FO_PACKAGE_PATH.');

  const link = join(packages, name);
  if (await exists(link)) {
    throw new Error(`${link} already exists — a model called '${name}' is already visible to the AOS.`);
  }

  const created: string[] = [];
  const warnings: string[] = [];

  // Where metadata physically lives. In the repo layout it sits under the repo
  // and is linked in; otherwise it is created where the AOS already looks.
  const useRepo = Boolean(req.repoRoot);
  const metadataRoot = useRepo ? join(req.repoRoot!, 'Metadata', name) : link;
  const modelRoot = join(metadataRoot, name);
  const projectDir = useRepo
    ? join(req.repoRoot!, 'Projects', name, name)
    : join(metadataRoot, 'Projects');

  await fs.mkdir(join(metadataRoot, 'Descriptor'), { recursive: true });
  await fs.mkdir(projectDir, { recursive: true });
  for (const f of SKELETON) await fs.mkdir(join(modelRoot, f), { recursive: true });
  created.push(metadataRoot, projectDir);

  const modelId = modelIdFor(name);
  const descriptor = buildDescriptorXml({
    modelName: name,
    modelId,
    description: req.description ?? `${name} model`,
    publisher: req.publisher ?? 'Custom',
    layer: req.layer ?? 14,
    modules: req.moduleReferences?.length ? req.moduleReferences : DEFAULT_MODULES,
  });
  // Metadata XML is UTF-8 WITH BOM; without it the compiler reports unicode
  // substitution characters. (The MCP client config is the opposite — see
  // docs/customer-onboarding.md.)
  const descriptorPath = join(metadataRoot, 'Descriptor', `${name}.xml`);
  await fs.writeFile(descriptorPath, '﻿' + descriptor, 'utf8');
  created.push(descriptorPath);

  const guid = `{${createHash('sha1').update(name).digest('hex').slice(0, 8).toUpperCase()}-0000-0000-0000-000000000000}`;
  const projectPath = join(projectDir, `${name}.rnrproj`);
  await fs.writeFile(projectPath, '﻿' + buildProjectXml(name, guid), 'utf8');
  created.push(projectPath);

  let linkedFrom: string | undefined;
  if (useRepo) {
    // A junction, not a symlink: symlink creation needs elevation or Developer
    // Mode on Windows, junctions do not, and the AOS reads both identically.
    try {
      await fs.symlink(metadataRoot, link, 'junction');
      linkedFrom = link;
      created.push(link);
    } catch (e) {
      warnings.push(
        `Created the model under ${metadataRoot} but could not link it into ${packages} ` +
        `(${e instanceof Error ? e.message : e}). The compiler will not see it until that link exists.`,
      );
    }
  }

  return { modelName: name, modelId, metadataPath: modelRoot, projectPath, linkedFrom, created, warnings };
}
