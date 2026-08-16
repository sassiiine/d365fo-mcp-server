/**
 * Normalize content destined for a D365FO metadata XML file on disk so it
 * matches Microsoft's serialization convention: no UTF-8 BOM, CRLF line
 * endings, no trailing newline. Without this, tool-created files show up in
 * TFVC/Git as if every line had been modified. Only applied to custom-model
 * files the MCP server writes itself — never to OOB Microsoft files.
 */
export declare function normalizeD365Xml(content: string): string;
//# sourceMappingURL=d365XmlNormalizer.d.ts.map