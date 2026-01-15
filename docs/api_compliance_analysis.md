# API Compliance Analysis: Current Implementation vs TGI.yaml

## Executive Summary

The current backend API implementation does **NOT** conform to the TGI.yaml OpenAPI specification. This is by design - the two APIs serve fundamentally different purposes:

| Aspect | TGI.yaml (IEEE 1685-2022) | Current Implementation |
|--------|---------------------------|------------------------|
| **Purpose** | Tool Generator Interface - standardized API for external generators to interact with IP-XACT Design Environments (DE) | RESTful CRUD API for a web-based register management application |
| **API Style** | RPC-style with action-based endpoints | RESTful with resource-based endpoints |
| **Server Role** | Design Environment hosts TGI at `/tgi/*` | Standalone backend service at `/api/*` |
| **Endpoint Pattern** | `/getRegisterFieldIDs`, `/setRegisterVolatility` | `/api/registers/:id/fields`, `PUT /api/registers/:id` |

---

## TGI.yaml Overview

The TGI (Tool Generator Interface) defined in IEEE 1685-2022 is a standardized API specification that:

1. **Enables external code generators** to read/write IP-XACT metadata from a Design Environment (DE)
2. **Uses RPC-style endpoints** - each endpoint performs a specific action
3. **Contains 600+ endpoints** covering:
   - VLNV registration/unregistration
   - Component, Bus, Abstractor, Design, Catalog management
   - Memory Maps, Address Blocks, Registers, Fields access
   - Generator invocation lifecycle (`/init`, `/end`)

### Key TGI Endpoint Categories

| Category | Example Endpoints |
|----------|-------------------|
| **VLNV Management** | `/registerVLNV`, `/unregisterVLNV`, `/getVLNV` |
| **ID Retrieval** | `/getComponentIDs`, `/getDesignIDs`, `/getCatalogIDs` |
| **Memory Structure** | `/getComponentMemoryMapIDs`, `/getMemoryMapAddressBlockIDs` |
| **Registers** | `/getAddressBlockRegisterIDs`, `/getRegisterFieldIDs`, `/getRegisterSize` |
| **Fields** | `/getRegisterFieldBitOffset`, `/getRegisterFieldBitWidth`, `/getRegisterFieldVolatility` |
| **Setters** | `/setRegisterVolatility`, `/setRegisterFieldAccess`, `/addAddressBlockRegister` |
| **Generator Lifecycle** | `/init`, `/end`, `/message` |

---

## Current Backend API

The current implementation is a standard RESTful API for a web application:

### Endpoints Summary

| Route | Method | Description |
|-------|--------|-------------|
| `/api/projects` | GET | List all projects |
| `/api/projects` | POST | Create a project |
| `/api/projects/:id` | GET | Get project with full hierarchy (includes memory maps/address blocks) |
| `/api/projects/:id` | PUT | Update project |
| `/api/projects/:id` | DELETE | Delete project |
| `/api/registers/address-block/:abId` | GET/POST | Registers by address block |
| `/api/registers/:id` | GET/PUT/DELETE | Single register operations |
| `/api/registers/:regId/fields` | GET/POST | Fields operations |
| `/api/registers/fields/:id` | PUT/DELETE | Field update/delete |
| `/api/address-blocks/:id` | PUT/DELETE | Address block update/delete |
| `/api/export/:projectId` | POST | Export project (IP-XACT, C Header, UVM RAL, HTML) |
| `/api/auth/*` | POST/GET | Authentication (placeholder) |

---

## TGI -> Current API Mapping (Partial)

The table below highlights the closest equivalents only for the register hierarchy. Most TGI endpoints have **no** direct implementation today.

| TGI Endpoint | TGI Purpose | Current API Equivalent | Notes |
|-------------|-------------|------------------------|-------|
| `/getComponentIDs` | List components | `/api/projects` (GET) | Projects use UUIDs, not VLNV. |
| `/getComponentMemoryMapIDs` | Memory map IDs for component | None | No memory-map CRUD route; only included in project detail. |
| `/getMemoryMapAddressBlockIDs` | Address block IDs for memory map | None | Address blocks are nested in project detail. |
| `/getAddressBlockRegisterIDs` | Register IDs for address block | `/api/registers/address-block/:abId` (GET) | Returns full register objects. |
| `/getRegisterFieldIDs` | Field IDs for register | `/api/registers/:regId/fields` (GET) | Returns full field objects. |
| `/addAddressBlockRegister` | Create register | `/api/registers/address-block/:abId` (POST) | Uses JSON payload instead of query params. |
| `/setRegisterVolatility` | Update register property | `/api/registers/:id` (PUT) | Resource update instead of per-attribute setter. |
| `/getXML` | Get XML by element ID | None | XML export is project-based only. |
| `/init`, `/end`, `/message` | Generator lifecycle | None | No generator lifecycle in backend. |

---

## Analysis: Why They Differ

### 1. Different Use Cases

- **TGI API**: Designed for machine-to-machine communication between EDA tools and code generators during design automation flows
- **Current API**: Designed for human interaction through a web UI for creating and editing register specifications

### 2. Different Data Flow

```
TGI Flow:
┌─────────────────┐      ┌─────────────────┐
│ External        │ ──── │ Design          │
│ Generator Tool  │ TGI  │ Environment     │
└─────────────────┘      └─────────────────┘

Current App Flow:
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ React Frontend  │ ──── │ Hono Backend    │ ──── │ PostgreSQL DB   │
│ (Web Browser)   │ REST │ API             │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### 3. Conceptual Differences

| Concept | TGI | Current App |
|---------|-----|-------------|
| **Projects** | Components identified by VLNV (Vendor/Library/Name/Version) | Projects with UUIDs and user ownership |
| **Hierarchy** | Component → MemoryMaps → AddressBlocks → Registers → Fields | Same structure but with simplified management |
| **Operations** | Fine-grained getters/setters per attribute | CRUD operations on whole resources |

---

## Recommendations

### Option 1: Keep Current API (Recommended for Web App)

The current RESTful API is appropriate for a web application. The TGI specification is meant for a different purpose (tool integration).

**Action**: Continue using current API for frontend-backend communication.

### Option 2: Add TGI-Compatible Layer (For Tool Integration)

If you want to support external generators accessing your data:

1. **Add TGI routes** at `/tgi/*` alongside existing `/api/*` routes
2. **Implement TGI endpoints** that map to your database operations
3. **Maintain both APIs** - REST for web UI, TGI for tool integration

### Option 3: Implement TGI Client

If you want to integrate with existing IP-XACT Design Environments:

1. Implement a TGI client that can connect to external DEs
2. Use TGI to import/export data from/to other tools

---

## Current TGI Compliance Status

| TGI Feature | Status | Notes |
|-------------|--------|-------|
| `/registerVLNV` | ❌ Not implemented | No VLNV management |
| `/getComponentIDs` | ❌ Not implemented | Uses project UUIDs instead |
| `/getComponentMemoryMapIDs` | ⚠️ Partial | Similar: `GET /api/projects/:id/memory-maps` |
| `/getMemoryMapAddressBlockIDs` | ⚠️ Partial | Similar: nested in `GET /api/projects/:id` |
| `/getAddressBlockRegisterIDs` | ⚠️ Partial | Similar: `GET /api/registers/address-block/:abId` |
| `/getRegisterFieldIDs` | ⚠️ Partial | Similar: `GET /api/registers/:regId/fields` |
| `/addAddressBlockRegister` | ⚠️ Partial | Similar: `POST /api/registers/address-block/:abId` |
| `/setRegisterVolatility` | ⚠️ Partial | Done via `PUT /api/registers/:id` |
| `/init`, `/end` | ❌ Not implemented | No generator lifecycle management |
| `/message` | ❌ Not implemented | No generator messaging |
| **IP-XACT XML Export** | ✅ Implemented | `POST /api/export/:projectId` with format="ipxact" |

---

## Conclusion

The current API is **not** TGI-compliant, but it doesn't need to be for its current purpose as a web application backend. The TGI specification in `TGI.yaml` serves as a reference for IP-XACT data structures and is correctly used for:

1. ✅ **Data modeling** - The database schema aligns with IP-XACT concepts (MemoryMaps, AddressBlocks, Registers, Fields)
2. ✅ **Export** - IP-XACT XML export follows the standard format
3. ❌ **API endpoints** - Not TGI-compliant (by design)

If TGI compliance becomes a requirement for tool interoperability, a separate TGI-compatible API layer should be implemented.
