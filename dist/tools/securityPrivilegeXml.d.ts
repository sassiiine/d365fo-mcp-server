/**
 * Shared builder for AxSecurityPrivilege XML.
 *
 * createD365File.ts and generateD365Xml.ts each expose a mirrored
 * XmlTemplateGenerator class; both delegate here so the two cannot drift
 * (the privilege template previously had to be patched twice by hand).
 *
 * Element order matches the Microsoft metadata serializer, verified against
 * real shipped privileges in
 *   ApplicationCommon\AxSecurityPrivilege\AgentFeedEntity{Maintain,View}.xml:
 *   • AxSecurityDataEntityPermission children:  Grant, Name, Fields, Methods
 *     (Grant FIRST — unlike AxSecurityEntryPointReference, which is Name-first)
 *   • <Grant> CRUD elements are alphabetical:   Correct, Create, Delete, Read, Update
 *
 * properties.label         – label id (default: @TODO:LabelId)
 * properties.targetObject  – ObjectName of the target menu item (optional)
 * properties.objectType    – MenuItemDisplay | MenuItemAction | MenuItemOutput (default: MenuItemDisplay)
 * properties.accessLevel   – 'view' | 'maintain' | 'read' (default: 'view' = Read only)
 * properties.dataEntity    – Name of the data entity to grant permissions on (optional)
 */
export declare function buildAxSecurityPrivilegeXml(name: string, properties?: Record<string, any>): string;
//# sourceMappingURL=securityPrivilegeXml.d.ts.map