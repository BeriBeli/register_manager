import { XMLBuilder } from "fast-xml-parser";

// IP-XACT 2022 namespace
const IPXACT_NS = "http://www.accellera.org/XMLSchema/IPXACT/1685-2022";
const XSI_NS = "http://www.w3.org/2001/XMLSchema-instance";

interface ProjectData {
  id: string;
  name: string;
  displayName?: string | null;
  description?: string | null;
  vlnv: {
    vendor: string;
    library: string;
    name: string;
    version: string;
  };
  memoryMaps: MemoryMapData[];
}

interface MemoryMapData {
  id: string;
  name: string;
  displayName?: string | null;
  description?: string | null;
  addressUnitBits: number;
  shared?: boolean | null;
  addressBlocks: AddressBlockData[];
}

interface AddressBlockData {
  id: string;
  name: string;
  displayName?: string | null;
  description?: string | null;
  baseAddress: string;
  range: string;
  width: number;
  usage: string;
  volatile?: boolean | null;
  registers: RegisterData[];
}

interface RegisterData {
  id: string;
  name: string;
  displayName?: string | null;
  description?: string | null;
  addressOffset: string;
  size: number;
  volatile?: boolean | null;
  fields: FieldData[];
}

interface FieldData {
  id: string;
  name: string;
  displayName?: string | null;
  description?: string | null;
  bitOffset: number;
  bitWidth: number;
  volatile?: boolean | null;
  access?: string | null;
  modifiedWriteValue?: string | null;
  readAction?: string | null;
  resets: ResetData[];
  enumeratedValues: EnumValueData[];
}

interface ResetData {
  value: string;
  mask?: string | null;
}

interface EnumValueData {
  name: string;
  displayName?: string | null;
  description?: string | null;
  value: string;
}

/**
 * Generate IP-XACT 2022 compliant XML from project data
 */
export function generateIpxactXml(project: ProjectData): string {
  const xmlObj = {
    "?xml": {
      "@_version": "1.0",
      "@_encoding": "UTF-8",
    },
    "ipxact:component": {
      "@_xmlns:ipxact": IPXACT_NS,
      "@_xmlns:xsi": XSI_NS,
      "ipxact:vendor": project.vlnv.vendor,
      "ipxact:library": project.vlnv.library,
      "ipxact:name": project.vlnv.name,
      "ipxact:version": project.vlnv.version,
      ...(project.displayName && { "ipxact:displayName": project.displayName }),
      ...(project.description && { "ipxact:description": project.description }),
      "ipxact:memoryMaps": {
        "ipxact:memoryMap": project.memoryMaps.map(buildMemoryMap),
      },
    },
  };

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    format: true,
    indentBy: "  ",
    suppressEmptyNode: true,
  });

  return builder.build(xmlObj);
}

function buildMemoryMap(mm: MemoryMapData) {
  return {
    "ipxact:name": mm.name,
    ...(mm.displayName && { "ipxact:displayName": mm.displayName }),
    ...(mm.description && { "ipxact:description": mm.description }),
    "ipxact:addressBlock": mm.addressBlocks.map(buildAddressBlock),
    "ipxact:addressUnitBits": mm.addressUnitBits,
    ...(mm.shared !== null && mm.shared !== undefined && { "ipxact:shared": mm.shared }),
  };
}

function buildAddressBlock(ab: AddressBlockData) {
  return {
    "ipxact:name": ab.name,
    ...(ab.displayName && { "ipxact:displayName": ab.displayName }),
    ...(ab.description && { "ipxact:description": ab.description }),
    "ipxact:baseAddress": ab.baseAddress,
    "ipxact:range": ab.range,
    "ipxact:width": ab.width,
    "ipxact:usage": ab.usage,
    ...(ab.volatile && { "ipxact:volatile": ab.volatile }),
    ...(ab.registers.length > 0 && {
      "ipxact:register": ab.registers.map(buildRegister),
    }),
  };
}

function buildRegister(reg: RegisterData) {
  return {
    "ipxact:name": reg.name,
    ...(reg.displayName && { "ipxact:displayName": reg.displayName }),
    ...(reg.description && { "ipxact:description": reg.description }),
    "ipxact:addressOffset": reg.addressOffset,
    "ipxact:size": reg.size,
    ...(reg.volatile && { "ipxact:volatile": reg.volatile }),
    ...(reg.fields.length > 0 && {
      "ipxact:field": reg.fields.map(buildField),
    }),
  };
}

function buildField(field: FieldData) {
  const fieldObj: Record<string, unknown> = {
    "ipxact:name": field.name,
    ...(field.displayName && { "ipxact:displayName": field.displayName }),
    ...(field.description && { "ipxact:description": field.description }),
    "ipxact:bitOffset": field.bitOffset,
    "ipxact:bitWidth": field.bitWidth,
    ...(field.volatile && { "ipxact:volatile": field.volatile }),
  };

  // Field access policy
  if (field.access) {
    fieldObj["ipxact:fieldAccessPolicies"] = {
      "ipxact:fieldAccessPolicy": {
        "ipxact:access": field.access,
        ...(field.modifiedWriteValue && {
          "ipxact:modifiedWriteValue": field.modifiedWriteValue,
        }),
        ...(field.readAction && { "ipxact:readAction": field.readAction }),
      },
    };
  }

  // Resets
  if (field.resets.length > 0) {
    fieldObj["ipxact:resets"] = {
      "ipxact:reset": field.resets.map((r) => ({
        "ipxact:value": r.value,
        ...(r.mask && { "ipxact:mask": r.mask }),
      })),
    };
  }

  // Enumerated values
  if (field.enumeratedValues.length > 0) {
    fieldObj["ipxact:enumeratedValues"] = {
      "ipxact:enumeratedValue": field.enumeratedValues.map((ev) => ({
        "ipxact:name": ev.name,
        ...(ev.displayName && { "ipxact:displayName": ev.displayName }),
        ...(ev.description && { "ipxact:description": ev.description }),
        "ipxact:value": ev.value,
      })),
    };
  }

  return fieldObj;
}
