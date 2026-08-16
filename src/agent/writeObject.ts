/**
 * Write an AOT object's XML to disk, and add it to a Visual Studio project.
 *
 * This is the WHOLE of what the thin agent does with metadata: put bytes the
 * hosted server produced into the right file. It cannot generate XML, and that
 * is the point - `d365fo_file(action="create")` in the full server can build XML
 * from `properties`, which means the full server carries the templates, the form
 * pattern library and the EDT resolution. Shipping that to a customer ships the
 * product. Here, xmlContent is required.
 */
import { promises as fs } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { aotFolder } from './aotFolders.js';

export interface WriteRequest {
  objectType: string;
  objectName: string;
  modelName: string;
  xmlContent: string;
  /** Packages root; defaults to D365FO_PACKAGE_PATH. */
  packagePath?: string;
  /** .rnrproj to register the file in. Optional - the build works at model level. */
  projectPath?: string;
  overwrite?: boolean;
}

export interface WriteResult {
  path: string;
  bytes: number;
  addedToProject: boolean;
  warnings: string[];
}

/**
 * D365FO metadata convention: CRLF line endings, no BOM, no trailing newline.
 *
 * Copied rather than imported from utils/d365XmlNormalizer so the agent bundle
 * does not reach back into the server tree. It is four lines, and the coupling
 * would cost more than the duplication - if it ever grows, share it deliberately.
 */
export function normalizeMetadataXml(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n').replace(/\s+$/, '');
}

/** Absolute path an object of this type/name/model belongs at. */
export function resolveObjectPath(req: Pick<WriteRequest, 'objectType' | 'objectName' | 'modelName' | 'packagePath'>): string {
  const folder = aotFolder(req.objectType);
  if (!folder) throw new Error(`Unknown object type '${req.objectType}'.`);
  const packages = req.packagePath || process.env.D365FO_PACKAGE_PATH;
  if (!packages) {
    throw new Error(
      'No packages root. Pass packagePath, or set D365FO_PACKAGE_PATH to the ' +
      'PackagesLocalDirectory for this machine.',
    );
  }
  // <packages>\<Model>\<Model>\<AxFolder>\<Name>.xml - the model name appears
  // twice because the package and the model share a name for custom models.
  return resolve(join(packages, req.modelName, req.modelName, folder, `${req.objectName}.xml`));
}

/**
 * Add a <Content Include="..."> entry to a .rnrproj, if not already present.
 *
 * Visual Studio will not show an object that is on disk but absent from the
 * project, and a developer who opens the solution then "helpfully" deletes the
 * orphan. Returns false when the project could not be updated, which is a
 * warning rather than a failure: the model-level build does not need it.
 */
async function addToProject(projectPath: string, filePath: string): Promise<boolean> {
  let xml: string;
  try {
    xml = await fs.readFile(projectPath, 'utf8');
  } catch {
    return false;
  }
  if (xml.includes(filePath)) return true; // already registered

  const entry = `    <Content Include="${filePath}">\r\n      <SubType>Content</SubType>\r\n    </Content>\r\n`;
  let updated: string;
  if (/<ItemGroup\s*\/>/.test(xml)) {
    // The scaffolded project starts with a self-closing, empty ItemGroup.
    updated = xml.replace(/<ItemGroup\s*\/>/, `<ItemGroup>\r\n${entry}  </ItemGroup>`);
  } else if (/<ItemGroup>/.test(xml)) {
    updated = xml.replace(/<ItemGroup>/, `<ItemGroup>\r\n${entry.trimEnd()}`);
  } else {
    updated = xml.replace(/<\/Project>/, `  <ItemGroup>\r\n${entry}  </ItemGroup>\r\n</Project>`);
  }
  if (updated === xml) return false;
  await fs.writeFile(projectPath, updated, 'utf8');
  return true;
}

export async function writeObject(req: WriteRequest): Promise<WriteResult> {
  const warnings: string[] = [];
  if (!req.xmlContent?.trim()) {
    throw new Error(
      'xmlContent is required. This agent writes XML; it does not generate it - ' +
      'author the object on the hosted server with d365fo_file(action="generate").',
    );
  }

  const target = resolveObjectPath(req);
  if (!req.overwrite) {
    try {
      await fs.access(target);
      throw new Error(`${target} already exists. Pass overwrite:true to replace it.`);
    } catch (e) {
      // ENOENT is the expected, wanted case; anything else is the throw above.
      if (e instanceof Error && !/ENOENT/.test(String((e as NodeJS.ErrnoException).code ?? e.message))) throw e;
    }
  }

  await fs.mkdir(dirname(target), { recursive: true });
  const body = normalizeMetadataXml(req.xmlContent);
  await fs.writeFile(target, body, 'utf8');

  let addedToProject = false;
  if (req.projectPath) {
    addedToProject = await addToProject(req.projectPath, target);
    if (!addedToProject) warnings.push(`Could not add the file to ${req.projectPath}; the model-level build is unaffected.`);
  } else {
    warnings.push('No projectPath given, so the object is on disk but not in a Visual Studio project.');
  }

  return { path: target, bytes: Buffer.byteLength(body, 'utf8'), addedToProject, warnings };
}
