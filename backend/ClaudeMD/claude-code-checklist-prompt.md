# EXTEND CMMS: Checklist System for Preventive Maintenance

## CONTEXT
Existing stack: React (Vite) + Node/Express + PostgreSQL + Prisma + JWT.
Existing models: User, Client, Equipment, EquipmentType, Maintenance, MaintenanceKit, SparePart, InventoryMovement.
**Rule: zero breaking changes. Backward compatible only.**

---

## 1. PRISMA SCHEMA — ADD ONLY

```prisma
model ChecklistTemplate {
  id              String   @id @default(cuid())
  name            String
  equipmentTypeId String   @map("equipment_type_id")
  version         Int      @default(1)
  isActive        Boolean  @default(true) @map("is_active")
  items           Json     // ChecklistItem[]
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  equipmentType      EquipmentType       @relation(fields: [equipmentTypeId], references: [id])
  equipmentChecklists EquipmentChecklist[]

  @@map("checklist_templates")
}

model EquipmentChecklist {
  id                 String @id @default(cuid())
  equipmentId        String @unique @map("equipment_id")
  checklistTemplateId String @map("checklist_template_id")

  equipment         Equipment         @relation(fields: [equipmentId], references: [id])
  checklistTemplate ChecklistTemplate @relation(fields: [checklistTemplateId], references: [id])

  @@map("equipment_checklists")
}

model MaintenanceChecklist {
  id               String    @id @default(cuid())
  maintenanceId    String    @unique @map("maintenance_id")
  templateSnapshot Json      @map("template_snapshot")
  answers          Json      @default("{}")
  status           ChecklistStatus @default(IN_PROGRESS)
  startedAt        DateTime  @default(now()) @map("started_at")
  completedAt      DateTime? @map("completed_at")

  maintenance Maintenance @relation(fields: [maintenanceId], references: [id])

  @@map("maintenance_checklists")
}

enum ChecklistStatus {
  IN_PROGRESS
  COMPLETED
}
```

**Also add** to existing `EquipmentType`: `checklistTemplates ChecklistTemplate[]`
**Also add** to existing `Equipment`: `equipmentChecklist EquipmentChecklist?`
**Also add** to existing `Maintenance`: `checklist MaintenanceChecklist?`

### Item JSON shape (TypeScript reference only, not a model):
```ts
type ChecklistItem = {
  id: string        // nanoid, stable across versions
  label: string
  type: 'boolean' | 'number' | 'text'
  required?: boolean
  unit?: string     // e.g. "V", "bar"
}
```

---

## 2. BACKEND — NEW MODULE `src/modules/checklists/`

Follow existing module pattern: `router.ts / service.ts / controller.ts`.

### 2a. Endpoints

```
# Templates CRUD
POST   /api/v1/checklists/templates          [ADMIN]
GET    /api/v1/checklists/templates          ?equipmentTypeId=
GET    /api/v1/checklists/templates/:id
PUT    /api/v1/checklists/templates/:id      [ADMIN] → bump version, keep old if in-use
DELETE /api/v1/checklists/templates/:id      [ADMIN] → soft delete (isActive=false)

# Equipment ↔ Checklist association
POST   /api/v1/equipment/:id/checklist       [ADMIN] body: { checklistTemplateId }
GET    /api/v1/equipment/:id/checklist

# Maintenance checklist execution
GET    /api/v1/maintenance-checklists/:id
PATCH  /api/v1/maintenance-checklists/:id           body: { answers } → MERGE, not replace
POST   /api/v1/maintenance-checklists/:id/complete  → status=COMPLETED, completedAt=now()

# PDF
GET    /api/v1/maintenances/:id/pdf
```

### 2b. Business logic (service layer)

**On maintenance creation** (`maintenances.service.ts → createMaintenance`):
- If `type === PREVENTIVE`: query `EquipmentChecklist` for the equipment → if found, create `MaintenanceChecklist` with `templateSnapshot = template.items`, `status = IN_PROGRESS`
- Do this inside the existing Prisma transaction
- If no checklist assigned: proceed silently (no error)

**PATCH answers**: use `{ ...existing.answers, ...newAnswers }` merge strategy.

**Complete**: validate all `required` items in snapshot have answers. Return 400 with missing item ids if not.

**PDF** (`GET /maintenances/:id/pdf`):
- Use `pdf-lib` or `puppeteer` (prefer `pdf-lib` for serverless compatibility)
- Include: equipment name + serial, client name, technician name, scheduled date, maintenance type, observations, checklist items (label | value | ✓/✗ for required)
- Return as `application/pdf` with `Content-Disposition: attachment`

### 2c. Validation (Zod)

```ts
const checklistItemSchema = z.object({
  id:       z.string().min(1),
  label:    z.string().min(1),
  type:     z.enum(['boolean', 'number', 'text']),
  required: z.boolean().optional(),
  unit:     z.string().optional(),
})

const templateSchema = z.object({
  name:            z.string().min(2),
  equipmentTypeId: z.string().cuid(),
  items:           z.array(checklistItemSchema).min(1),
})
```

---

## 3. FRONTEND — NEW COMPONENTS

### 3a. Pages/routes to add

```
/admin/checklists              → ChecklistTemplatesPage
/equipment/:id                 → extend existing EquipmentDetailPage (add checklist section)
/maintenances/:id              → extend existing MaintenanceDetailPage (add ChecklistExecution)
```

### 3b. `ChecklistTemplatesPage`

- Table of templates with columns: name, equipment type, version, active, actions
- "New Template" button → opens `ChecklistTemplateForm` (modal or inline)
- `ChecklistTemplateForm`:
  - Fields: name, equipmentType (select)
  - Dynamic item list: add/remove/reorder items
  - Each item: label (text input), type (select: boolean/number/text), required (checkbox), unit (text, optional)
  - Submit → POST or PUT

### 3c. Equipment detail — checklist section

- Show current assigned checklist (name + version) or "No checklist assigned"
- Button to change: opens select modal with active templates filtered by equipment type
- On confirm → POST `/equipment/:id/checklist`

### 3d. `ChecklistExecution` component

Props: `maintenanceId`, `checklistId`, `readonly?: boolean`

Behavior:
- Fetch checklist from `GET /maintenance-checklists/:id`
- Render each item by type:
  - `boolean` → toggle/checkbox
  - `number` → number input (with unit label if present)
  - `text` → textarea
- **Auto-save**: debounce 1500ms on any change → PATCH answers
- Progress bar: `answered required items / total required items`
- "Save" button (manual) + "Complete" button
- On complete: confirm dialog → POST complete → show success, disable inputs
- If `status === COMPLETED` or `readonly`: render as read-only display

### 3e. Maintenance detail — integrate checklist

- If `maintenance.type === 'PREVENTIVE'` and `maintenance.checklist` exists → render `<ChecklistExecution />`
- Show checklist status badge: IN_PROGRESS (yellow) / COMPLETED (green)
- "Download PDF" button → `GET /maintenances/:id/pdf` → trigger download

### 3f. API client additions (add to existing api layer)

```ts
// checklists.api.ts
export const checklistsApi = {
  getTemplates:      (params?) => api.get('/checklists/templates', { params }),
  getTemplate:       (id) => api.get(`/checklists/templates/${id}`),
  createTemplate:    (data) => api.post('/checklists/templates', data),
  updateTemplate:    (id, data) => api.put(`/checklists/templates/${id}`, data),
  deleteTemplate:    (id) => api.delete(`/checklists/templates/${id}`),

  getEquipmentChecklist:  (equipmentId) => api.get(`/equipment/${equipmentId}/checklist`),
  assignChecklist:        (equipmentId, data) => api.post(`/equipment/${equipmentId}/checklist`, data),

  getMaintenanceChecklist: (id) => api.get(`/maintenance-checklists/${id}`),
  saveAnswers:             (id, answers) => api.patch(`/maintenance-checklists/${id}`, { answers }),
  completeChecklist:       (id) => api.post(`/maintenance-checklists/${id}/complete`),

  downloadPdf: (maintenanceId) =>
    api.get(`/maintenances/${maintenanceId}/pdf`, { responseType: 'blob' })
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `maintenance-${maintenanceId}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      }),
}
```

---

## 4. IMPLEMENTATION ORDER

1. `prisma/schema.prisma` → add models → `npx prisma migrate dev --name add_checklists`
2. `src/modules/checklists/` → templates CRUD + equipment association
3. Extend `maintenances.service.ts → createMaintenance` (add checklist creation in transaction)
4. `maintenance-checklists` endpoints (PATCH answers, POST complete)
5. PDF endpoint
6. Frontend: `checklistsApi.ts` + `ChecklistTemplatesPage` + `ChecklistExecution` component
7. Integrate into existing Equipment and Maintenance detail pages

---

## 5. CONSTRAINTS CHECKLIST

- [ ] No existing endpoint modified (only `createMaintenance` internal logic extended)
- [ ] No existing Prisma model field removed or renamed
- [ ] `MaintenanceChecklist.templateSnapshot` is immutable after creation
- [ ] PATCH answers always merges, never overwrites
- [ ] PDF lib must work without headless browser (prefer `pdf-lib`)
- [ ] All new routes behind `authenticate` middleware; admin-only routes use `requireRole('ADMIN')`
- [ ] Zod validation on all new inputs
