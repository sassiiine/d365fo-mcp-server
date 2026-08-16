/**
 * properties.serviceClass / properties.class  — X++ class holding the operation
 *                                               methods. Defaults to the service name.
 * properties.externalName                     — defaults to the service name.
 * properties.namespace                        — SOAP namespace (rarely needed).
 * properties.description                      — label id or free text.
 * properties.operations                       — ["lookup"] or
 *                                               [{ name?, method?, enableIdempotence?,
 *                                                  subscriberAccessLevelRead? }]
 */
export declare function buildAxServiceXml(serviceName: string, properties?: Record<string, any>): string;
/**
 * properties.autoDeploy   — Yes publishes the group at /api/services without a
 *                           manual deployment step.
 * properties.description  — label id or free text.
 * properties.services     — ["MyService"] or [{ name?, service? }]
 */
export declare function buildAxServiceGroupXml(groupName: string, properties?: Record<string, any>): string;
//# sourceMappingURL=serviceXml.d.ts.map