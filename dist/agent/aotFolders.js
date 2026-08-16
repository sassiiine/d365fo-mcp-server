/**
 * AOT object type -> metadata folder name.
 *
 * Extracted so the thin agent can resolve a write target without importing
 * objectFileLookup, which pulls in the config manager and the package resolver.
 * The agent is deliberately allowed to know only this.
 */
export const AOT_FOLDERS = {
    class: 'AxClass',
    table: 'AxTable',
    form: 'AxForm',
    enum: 'AxEnum',
    query: 'AxQuery',
    view: 'AxView',
    edt: 'AxEdt',
    map: 'AxMap',
    report: 'AxReport',
    menu: 'AxMenu',
    service: 'AxService',
    'service-group': 'AxServiceGroup',
    'data-entity': 'AxDataEntityView',
    'menu-item-display': 'AxMenuItemDisplay',
    'menu-item-action': 'AxMenuItemAction',
    'menu-item-output': 'AxMenuItemOutput',
    'security-privilege': 'AxSecurityPrivilege',
    'security-duty': 'AxSecurityDuty',
    'security-role': 'AxSecurityRole',
    'table-extension': 'AxTableExtension',
    'class-extension': 'AxClass',
    'form-extension': 'AxFormExtension',
    'enum-extension': 'AxEnumExtension',
    'edt-extension': 'AxEdtExtension',
    'menu-extension': 'AxMenuExtension',
    'menu-item-display-extension': 'AxMenuItemDisplayExtension',
    'menu-item-action-extension': 'AxMenuItemActionExtension',
    'menu-item-output-extension': 'AxMenuItemOutputExtension',
    'security-duty-extension': 'AxSecurityDutyExtension',
    'security-role-extension': 'AxSecurityRoleExtension',
    'data-entity-extension': 'AxDataEntityViewExtension',
};
/** Folder for an object type, or null when the type is unknown. */
export function aotFolder(objectType) {
    return AOT_FOLDERS[objectType.toLowerCase()] ?? null;
}
//# sourceMappingURL=aotFolders.js.map