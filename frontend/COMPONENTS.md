# UI Component Library Documentation

> **Location:** `frontend/src/components/ui/`  
> **Last Updated:** January 30, 2026

## Table of Contents

- [Design System](#design-system)
- [Core Components](#core-components)
  - [Button](#button)
  - [Card System](#card-system)
  - [Input](#input)
  - [Label](#label)
  - [Select](#select)
  - [Textarea](#textarea)
  - [Checkbox](#checkbox)
  - [Badge](#badge)
  - [Alert](#alert)
  - [Dialog](#dialog)
  - [Table System](#table-system)
  - [Tabs](#tabs)
  - [Separator](#separator)
- [Composite Components](#composite-components)
- [Usage Guidelines](#usage-guidelines)

---

## Design System

### Colors

**Primary (Blue)**
- `blue-50` to `blue-900` - Primary actions, links, focus states
- Chart color: `#3B82F6`

**Secondary (Gray)**
- `gray-50` to `gray-900` - Text, borders, backgrounds
- Body background: `bg-gray-50`

**Status Colors**
- **Success/Active:** `green-50`, `green-700`, `green-800` (#10B981)
- **Error/Destructive:** `red-50`, `red-600`, `red-700`, `red-800` (#EF4444)
- **Warning/Pending:** `amber-50`, `amber-700`, `orange-100`, `orange-800` (#F59E0B)
- **Info:** `sky-50`, `sky-700`, `cyan-500` (#06B6D4)
- **Neutral:** `slate-50`, `slate-600`, `slate-700`

**Role Colors**
- **Superadmin:** `purple-100`, `purple-800` (#8B5CF6)
- **Admin:** `blue-100`, `blue-800`
- **Management:** `orange-100`, `orange-800`
- **Lecturer:** `green-100`, `green-800`

### Typography

#### Font Families

**Primary Font Stack:**
- **Family:** `'Inter', 'Segoe UI', Arial, sans-serif`
- **Usage:** Sidebar navigation and headings
- **Weights:** 400 (regular), 600 (semibold)
- **Letter Spacing:** 0.01em
- **Location:** Applied via inline styles in [`Sidebar.jsx`](src/components/Sidebar.jsx)

**Default System Font:**
- **Family:** `font-sans` (Tailwind default - system UI fonts)
- **Applied to:** Body and general UI elements
- **Location:** [`index.css`](src/index.css#L7) - `@apply font-sans`

#### Font Sizes (Text Classes)

**Button Sizes:**
- `text-sm` - Small & Medium buttons (default) - 0.875rem
- `text-base` - Large buttons - 1rem
- `text-lg` - Extra-large buttons - 1.125rem
- `text-xs` - Badge/chip text - 0.75rem

**Component Typography:**
- `text-xs` - Badges, small labels, helper text (0.75rem)
- `text-sm` - Buttons, inputs, body text, table cells (0.875rem)
- `text-base` - Large buttons, paragraphs (1rem)
- `text-lg` - Card titles, section headers (1.125rem)
- `text-xl` - Dialog titles, subsection headings (1.25rem)
- `text-2xl` to `text-4xl` - Page headings (responsive, 1.5rem - 2.25rem)

**Font Weights:**
- `font-normal` / `400` - Regular body text
- `font-medium` / `500` - Labels, emphasized text, buttons
- `font-semibold` / `600` - Card titles, section headings
- `font-bold` / `700` - Page titles, primary headings

### Spacing & Borders

**Border Radius**
- `rounded-lg` - Standard (buttons, inputs, cards)
- `rounded-xl` - Medium elevation (stats, notifications)
- `rounded-2xl` - Large cards, dialogs
- `rounded-3xl` - Profile headers
- `rounded-full` - Badges, avatars

**Shadows**
- `shadow-sm` - Subtle (buttons, inputs)
- `shadow-md` - Hover states
- `shadow-lg` - Cards, popovers
- `shadow-xl` - Dialogs
- `shadow-2xl` - High-priority modals

---

## Core Components

### Button

**File:** [`src/components/ui/Button.jsx`](src/components/ui/Button.jsx)

A versatile button component with multiple variants and sizes.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'outline' \| 'destructive' \| 'ghost' \| 'secondary'` | `'primary'` | Visual style variant |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disable button interaction |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `onClick` | `function` | - | Click handler |
| `className` | `string` | `''` | Additional CSS classes |

#### Variants

- **`primary`** - Blue gradient, white text, for main actions
- **`outline`** - Gray border, white background, for secondary actions
- **`destructive`** - Red gradient, white text, for delete/cancel actions
- **`ghost`** - Transparent background, hover highlight
- **`secondary`** - Gray background, for tertiary actions

#### Usage

```jsx
import Button from '@/components/ui/Button';

// Primary action
<Button variant="primary" size="md" onClick={handleSubmit}>
  Save Changes
</Button>

// Destructive action
<Button variant="destructive" size="sm" onClick={handleDelete}>
  Delete
</Button>

// Secondary action
<Button variant="outline" disabled={isLoading}>
  Cancel
</Button>
```

---

### Card System

**File:** [`src/components/ui/Card.jsx`](src/components/ui/Card.jsx)

A flexible card container system with header, content, and footer sections.

#### Components

- `Card` - Main container
- `CardHeader` - Top section with border
- `CardTitle` - Heading (default h3, configurable)
- `CardDescription` - Subtitle/description text
- `CardContent` - Main content area

#### Props

**Card**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |

**CardTitle**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | `string` | `'h3'` | HTML element type |
| `className` | `string` | `''` | Additional CSS classes |

#### Usage

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

<Card>
  <CardHeader>
    <CardTitle>Profile Information</CardTitle>
    <CardDescription>Update your personal details</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Your content here */}
  </CardContent>
</Card>
```

---

### Input

**File:** [`src/components/ui/Input.jsx`](src/components/ui/Input.jsx)

A styled text input with validation states and autofill handling.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `string` | `'text'` | HTML input type |
| `invalid` | `boolean` | `false` | Show error state (red border) |
| `disabled` | `boolean` | `false` | Disable input |
| `readOnly` | `boolean` | `false` | Make input read-only |
| `className` | `string` | `''` | Additional CSS classes |

#### Features

- ✅ Autofill styling (white background, black text)
- ✅ Focus states (blue ring)
- ✅ Error states (red border/ring)
- ✅ Date picker customization
- ✅ Number spinner handling

#### Usage

```jsx
import Input from '@/components/ui/Input';

// Text input
<Input 
  type="text" 
  placeholder="Enter your name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// Email with validation
<Input 
  type="email" 
  invalid={!!errors.email}
  aria-invalid={!!errors.email}
  aria-describedby="email-error"
/>

// Date input
<Input 
  type="date" 
  value={selectedDate}
  onChange={(e) => setSelectedDate(e.target.value)}
/>
```

---

### Label

**File:** [`src/components/ui/Label.jsx`](src/components/ui/Label.jsx)

An accessible form label with screen reader support.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `srOnly` | `boolean` | `false` | Visually hide label (screen readers only) |
| `disabled` | `boolean` | `false` | Show disabled state |
| `required` | `boolean` | `false` | Mark as required field |
| `className` | `string` | `''` | Additional CSS classes |

#### Usage

```jsx
import Label from '@/components/ui/Label';
import Input from '@/components/ui/Input';

<div>
  <Label htmlFor="email" required>Email Address</Label>
  <Input id="email" type="email" />
</div>

// Screen reader only label
<Label htmlFor="search" srOnly>Search</Label>
<Input id="search" placeholder="Search..." />
```

---

### Select

**File:** [`src/components/ui/Select.jsx`](src/components/ui/Select.jsx)

A custom dropdown select with keyboard navigation and accessibility.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Selected value |
| `onValueChange` | `function` | - | Change handler |
| `placeholder` | `string` | `'Select'` | Placeholder text |
| `disabled` | `boolean` | `false` | Disable select |
| `className` | `string` | `''` | Container classes |
| `buttonClassName` | `string` | `''` | Trigger button classes |
| `dropdownClassName` | `string` | `''` | Dropdown classes |

#### Keyboard Support

- `↓ / ↑` - Navigate options
- `Enter / Space` - Select option
- `Escape` - Close dropdown
- `Home / End` - First/last option

#### Usage

```jsx
import Select from '@/components/ui/Select';
import { SelectItem } from '@/components/ui/Select';

<Select 
  value={role} 
  onValueChange={setRole}
  placeholder="Select role"
>
  <SelectItem value="admin">Admin</SelectItem>
  <SelectItem value="lecturer">Lecturer</SelectItem>
  <SelectItem value="management">Management</SelectItem>
</Select>
```

---

### Textarea

**File:** [`src/components/ui/Textarea.jsx`](src/components/ui/Textarea.jsx)

A multi-line text input with custom styling.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `rows` | `number` | - | Number of visible rows |

#### Usage

```jsx
import Textarea from '@/components/ui/Textarea';

<Textarea 
  placeholder="Enter your message..."
  rows={4}
  value={message}
  onChange={(e) => setMessage(e.target.value)}
/>
```

---

### Checkbox

**File:** [`src/components/ui/Checkbox.jsx`](src/components/ui/Checkbox.jsx)

A styled checkbox with indeterminate state support.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean \| 'indeterminate'` | - | Checked state |
| `onCheckedChange` | `function` | - | Change handler (receives boolean) |
| `indeterminate` | `boolean` | `false` | Show indeterminate state |
| `disabled` | `boolean` | `false` | Disable checkbox |
| `className` | `string` | `''` | Additional CSS classes |

#### Usage

```jsx
import { Checkbox } from '@/components/ui/Checkbox';

// Basic checkbox
<Checkbox 
  id="terms"
  checked={accepted}
  onCheckedChange={setAccepted}
/>

// Indeterminate (select all)
<Checkbox 
  checked={selectedCount === totalCount ? true : selectedCount > 0 ? 'indeterminate' : false}
  onCheckedChange={handleSelectAll}
/>
```

---

### Badge

**File:** [`src/components/ui/Badge.jsx`](src/components/ui/Badge.jsx)

A small label for status, roles, or categories.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | See variants below | `'default'` | Visual style |
| `as` | `string` | `'span'` | HTML element type |
| `className` | `string` | `''` | Additional CSS classes |

#### Variants

- **`default`** - Green (success, active)
- **`destructive`** - Red (errors, rejected)
- **`secondary`** - Gray (neutral)
- **`outline`** - Orange (warnings)
- **`superadmin`** - Purple
- **`admin`** - Blue
- **`management`** - Orange
- **`lecturer`** - Green
- **`course`** - Light blue with border

#### Usage

```jsx
import Badge from '@/components/ui/Badge';

<Badge variant="default">Active</Badge>
<Badge variant="admin">Admin</Badge>
<Badge variant="destructive">Rejected</Badge>
```

---

### Alert

**File:** [`src/components/ui/Alert.jsx`](src/components/ui/Alert.jsx)

An informational message box.

#### Components

- `Alert` - Container
- `AlertDescription` - Description text

#### Props

**Alert**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `role` | `string` | `'status'` | ARIA role |
| `className` | `string` | `''` | Additional CSS classes |

#### Usage

```jsx
import { Alert, AlertDescription } from '@/components/ui/Alert';

<Alert>
  <AlertDescription>
    Your profile has been updated successfully.
  </AlertDescription>
</Alert>
```

---

### Dialog

**File:** [`src/components/ui/Dialog.jsx`](src/components/ui/Dialog.jsx)

A modal dialog with backdrop and accessibility features.

#### Components

- `Dialog` - Root component
- `DialogContent` - Content container
- `DialogHeader` - Header section
- `DialogTitle` - Title heading
- `DialogDescription` - Description text

#### Props

**Dialog**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | - | Controls dialog visibility |
| `onOpenChange` | `function` | - | Callback when open state changes |

#### Features

- ✅ Portal rendering (outside DOM tree)
- ✅ Backdrop click to close
- ✅ Escape key to close
- ✅ Body scroll lock
- ✅ Focus trap
- ✅ ARIA attributes

#### Usage

```jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';

function MyModal() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Dialog</Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

### Table System

**File:** [`src/components/ui/Table.jsx`](src/components/ui/Table.jsx)

A responsive table component system.

#### Components

- `Table` - Main table element
- `TableHeader` - `<thead>` wrapper
- `TableBody` - `<tbody>` wrapper
- `TableRow` - Table row with hover state
- `TableHead` - Header cell
- `TableCell` - Body cell

#### Usage

```jsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {users.map((user) => (
      <TableRow key={user.id}>
        <TableCell>{user.name}</TableCell>
        <TableCell>{user.email}</TableCell>
        <TableCell>{user.role}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### Tabs

**File:** [`src/components/ui/Tabs.jsx`](src/components/ui/Tabs.jsx)

A tabbed interface with keyboard navigation.

#### Components

- `Tabs` - Root container
- `TabsList` - Tab buttons container
- `TabsTrigger` - Individual tab button
- `TabsContent` - Tab panel content

#### Props

**Tabs**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Active tab value |
| `onValueChange` | `function` | - | Tab change handler |
| `orientation` | `'auto' \| 'horizontal' \| 'vertical'` | `'auto'` | Layout direction |

#### Keyboard Support

- `←/→` - Navigate tabs (horizontal)
- `↑/↓` - Navigate tabs (vertical)
- `Home` - First tab
- `End` - Last tab

#### Usage

```jsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="profile">Profile</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
    <TabsTrigger value="security">Security</TabsTrigger>
  </TabsList>
  
  <TabsContent value="profile">
    {/* Profile content */}
  </TabsContent>
  <TabsContent value="settings">
    {/* Settings content */}
  </TabsContent>
  <TabsContent value="security">
    {/* Security content */}
  </TabsContent>
</Tabs>
```

---

### Separator

**File:** [`src/components/ui/Separator.jsx`](src/components/ui/Separator.jsx)

A visual divider between sections.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Direction |
| `decorative` | `boolean` | `true` | If true, no ARIA role |
| `className` | `string` | `''` | Additional CSS classes |

#### Usage

```jsx
import { Separator } from '@/components/ui/Separator';

<div>
  <p>Section 1</p>
  <Separator />
  <p>Section 2</p>
</div>

// Vertical
<div className="flex gap-4">
  <span>Item 1</span>
  <Separator orientation="vertical" />
  <span>Item 2</span>
</div>
```

---

## Composite Components

### ConfirmDeleteDialog

**File:** [`src/components/ConfirmDeleteDialog.jsx`](src/components/ConfirmDeleteDialog.jsx)

Pre-built confirmation dialog for delete operations.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Dialog visibility |
| `onOpenChange` | `function` | Close handler |
| `itemName` | `string` | Name of item being deleted |
| `onConfirm` | `function` | Confirm action handler |
| `loading` | `boolean` | Show loading state |

#### Usage

```jsx
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog';

<ConfirmDeleteDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  itemName={lecturer.name}
  onConfirm={handleDelete}
  loading={isDeleting}
/>
```

---

### ErrorDialog

**File:** [`src/components/ErrorDialog.jsx`](src/components/ErrorDialog.jsx)

Standardized error display dialog.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Dialog visibility |
| `onOpenChange` | `function` | Close handler |
| `error` | `string` | Error message to display |

#### Usage

```jsx
import ErrorDialog from '@/components/ErrorDialog';

<ErrorDialog
  open={!!error}
  onOpenChange={() => setError(null)}
  error={error}
/>
```

---

## Layout Components

### DashboardLayout

**File:** [`src/components/DashboardLayout.jsx`](src/components/DashboardLayout.jsx)

Main layout wrapper that handles authentication state, sidebar navigation, and responsive mobile menu.

#### Features

- ✅ Authentication checking with loading state
- ✅ Automatic login redirect for unauthenticated users
- ✅ First-login onboarding redirect for lecturers
- ✅ Responsive sidebar (desktop: persistent, mobile: drawer)
- ✅ Mobile menu toggle
- ✅ Integration with authentication store

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Page content to render in main area |

#### Usage

```jsx
import { DashboardLayout } from '@/components/DashboardLayout';

function AdminPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Your page content */}
      </div>
    </DashboardLayout>
  );
}
```

#### Structure

```jsx
<DashboardLayout>
  {/* Renders: */}
  <div className="flex h-screen">
    <Sidebar /> {/* Desktop: always visible, Mobile: drawer */}
    <main className="flex-1 overflow-auto">
      {children} {/* Your page content */}
    </main>
  </div>
</DashboardLayout>
```

---

### Sidebar

**File:** [`src/components/Sidebar.jsx`](src/components/Sidebar.jsx)

Role-based navigation menu with collapsible sections and user profile display.

#### Features

- ✅ Role-based navigation items (superadmin, admin, management, lecturer)
- ✅ Active route highlighting
- ✅ Collapsible/expandable sidebar (desktop)
- ✅ Mobile responsive (full-screen overlay)
- ✅ Category grouping with icons
- ✅ User profile section with avatar
- ✅ Logout functionality

#### Navigation Items by Role

**Superadmin:**
- Dashboard, User Management

**Admin:**
- Dashboard, Home, Recruitment, Lecturer Management, Course Management, Course Mapping, Classes, Contract Generation, Profile

**Management:**
- Dashboard, Home, Contracts, Profile

**Lecturer:**
- Dashboard, Contracts, Onboarding, Profile

#### Custom Styles

```javascript
// Sidebar fonts
const sidebarFont = {
  fontFamily: `'Inter', 'Segoe UI', Arial, sans-serif`,
  fontSize: '18px',
  fontWeight: 400,
  letterSpacing: '0.01em'
};
```

#### Usage

```jsx
import { Sidebar } from '@/components/Sidebar';

// Used automatically in DashboardLayout
<Sidebar />
```

---

### LoginForm

**File:** [`src/components/LoginForm.jsx`](src/components/LoginForm.jsx)

Full-page authentication UI with email/password login and forgot password flow.

#### Features

- ✅ Email validation (@cadt.edu.kh domain)
- ✅ Password visibility toggle
- ✅ Field-level error messages
- ✅ Loading states during authentication
- ✅ Forgot password modal
- ✅ Decorative animated background (desktop)
- ✅ Responsive design (mobile-friendly)
- ✅ Auto-redirect after successful login

#### Form Validation

- Email: Required, must match `*@cadt.edu.kh` pattern
- Password: Required, minimum length enforced
- Client-side validation before API call

#### Usage

```jsx
import LoginForm from '@/components/LoginForm';

// Renders automatically when user is not authenticated
<LoginForm />
```

#### Styling

- Desktop: Split layout (welcome section + login form)
- Mobile: Single column with centered form
- Animated gradient background with floating shapes (desktop only)

---

## Additional Composite Components

### AssignCoursesDialog

**File:** [`src/components/AssignCoursesDialog.jsx`](src/components/AssignCoursesDialog.jsx)

Modal for bulk course assignment with search and select-all functionality.

#### Features

- ✅ Search courses by name or code
- ✅ Select all / Deselect all
- ✅ Checkbox list with course details
- ✅ Real-time filtering
- ✅ Scrollable course list

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Dialog visibility |
| `onOpenChange` | `function` | Close handler |
| `availableCourses` | `array` | List of course objects |
| `selectedCourses` | `array` | Array of selected course codes |
| `onToggleCourse` | `function` | Toggle course selection |
| `onSave` | `function` | Save button handler |
| `onCancel` | `function` | Cancel button handler |
| `className` | `string` | Class name for context |

#### Usage

```jsx
import AssignCoursesDialog from '@/components/AssignCoursesDialog';

<AssignCoursesDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  availableCourses={courses}
  selectedCourses={selectedCodes}
  onToggleCourse={handleToggle}
  onSave={handleSave}
  onCancel={() => setIsOpen(false)}
  className="CS101"
/>
```

---

### CreateLecturerModal

**File:** [`src/components/CreateLecturerModal.jsx`](src/components/CreateLecturerModal.jsx)

Modal for creating new lecturer accounts with candidate suggestion.

#### Features

- ✅ Auto-suggest from accepted candidates
- ✅ Email validation (@cadt.edu.kh)
- ✅ English-only name validation
- ✅ Title and gender selection
- ✅ Success state with password display
- ✅ Copy password to clipboard
- ✅ Create from existing candidate data

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Modal visibility |
| `onClose` | `function` | Close handler |
| `onLecturerCreated` | `function` | Success callback |

#### Form Fields

- Full Name (English only, required)
- Email (@cadt.edu.kh, required)
- Title (Dr., Prof., Mr., Ms., Mrs.)
- Gender (Male, Female, Other)
- Position (required)

#### Usage

```jsx
import CreateLecturerModal from '@/components/CreateLecturerModal';

<CreateLecturerModal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  onLecturerCreated={handleRefresh}
/>
```

---

### CreateUserModal

**File:** [`src/components/CreateUserModal.jsx`](src/components/CreateUserModal.jsx)

Modal for creating admin or management users.

#### Features

- ✅ Role selection (admin, management)
- ✅ Department selection
- ✅ Email validation
- ✅ Auto-generated password display
- ✅ Copy credentials to clipboard
- ✅ Success confirmation

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Modal visibility |
| `onClose` | `function` | Close handler |
| `onUserCreated` | `function` | Success callback |

#### Form Fields

- Full Name (required)
- Email (@cadt.edu.kh, required)
- Role (admin or management, required)
- Department (Computer Science, Digital Business, Foundation, Telecommunications and Network)

#### Usage

```jsx
import CreateUserModal from '@/components/CreateUserModal';

<CreateUserModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onUserCreated={refreshUserList}
/>
```

---

### InfiniteScrollSentinel

**File:** [`src/components/InfiniteScrollSentinel.jsx`](src/components/InfiniteScrollSentinel.jsx)

Intersection observer sentinel for infinite scroll pagination.

#### Features

- ✅ Loading indicator
- ✅ "No more items" message
- ✅ Ref-based intersection detection

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `sentinelRef` | `ref` | React ref for intersection observer |
| `loading` | `boolean` | Show loading state |
| `hasMore` | `boolean` | Whether more items exist |

#### Usage

```jsx
import InfiniteScrollSentinel from '@/components/InfiniteScrollSentinel';
import { useRef, useEffect } from 'react';

function InfiniteList() {
  const sentinelRef = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMore();
      }
    });
    
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    
    return () => observer.disconnect();
  }, [hasMore, loading]);
  
  return (
    <div>
      {items.map(item => <div key={item.id}>{item.name}</div>)}
      <InfiniteScrollSentinel
        sentinelRef={sentinelRef}
        loading={loading}
        hasMore={hasMore}
      />
    </div>
  );
}
```

---

### RequireRole

**File:** [`src/components/RequireRole.jsx`](src/components/RequireRole.jsx)

Route guard component for role-based access control.

#### Features

- ✅ Role-based route protection
- ✅ Automatic redirect to role's home page if unauthorized
- ✅ Lecturer onboarding status check
- ✅ Loading state during auth verification
- ✅ Integration with authentication store

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `allowed` | `string[]` | Array of allowed role names |
| `children` | `ReactNode` | Protected content |

#### Usage

```jsx
import RequireRole from '@/components/RequireRole';

// Protect admin-only route
<Route path="/admin" element={
  <RequireRole allowed={['admin']}>
    <AdminDashboard />
  </RequireRole>
} />

// Allow multiple roles
<Route path="/contracts" element={
  <RequireRole allowed={['admin', 'management']}>
    <ContractsPage />
  </RequireRole>
} />
```

#### Role Redirects

- **superadmin** → `/superadmin`
- **admin** → `/admin`
- **management** → `/management`
- **lecturer** → `/lecturer` (or `/onboarding` if incomplete)

---

## Feature-Specific Components

### Admin Components (`/admin/`)

**Recruitment:**
- `AcceptCandidateModal` - Accept candidate with lecturer account creation
- `AddCandidateForm` - Multi-step candidate registration form
- `CandidateCard` - Candidate display with status badges
- `RecruitmentStats` - Statistics cards for recruitment metrics

**Lecturer Management:**
- `CoursesPopover` - Display assigned courses in popover
- `LecturerCard` - Lecturer profile card with actions

**Course Mapping:**
- `AvailabilityPopover` - Show lecturer availability
- `MappingTable` - Course-lecturer assignment table

**Classes:**
- `ClassCard` - Class information card
- `FilterBar` - Multi-filter for classes

**Contract Generation:**
- `ContractPreview` - PDF preview before generation
- `GenerationForm` - Contract creation form

**Admin Home:**
- `StatCard` - Animated dashboard statistics
- `TrendsChart` - Line/bar charts for trends
- `RealTimeStatusBar` - System health indicators
- `PerformanceMetrics` - KPI gauges

### Lecturer Components (`/lecturer/`)

**Dashboard:**
- `StatCard` - Lecturer-specific statistics
- `WeeklySchedule` - Calendar view of classes
- `ContractsList` - Recent contracts table

**Profile:**
- `Avatar` - Gradient avatar with initials
- `StatusBadge` - Active/inactive status
- `SectionHeader` - Profile section headers
- `InfoRow` - Label-value pairs

**Contracts:**
- `ContractCard` - Contract summary card
- `SignatureCanvas` - Digital signature input
- `PDFViewer` - Contract document viewer

**Onboarding:**
- `StepIndicator` - Progress steps
- `PersonalInfoForm` - Personal details step
- `DocumentUpload` - File upload component
- `ReviewStep` - Final review before submission

### Management Components (`/management/`)

**Dashboard:**
- `StatCard` - Management metrics
- `PendingContracts` - Contracts awaiting signature
- `ActivityFeed` - Recent activities

**Contracts:**
- `ContractFilters` - Filter by status/date
- `SignaturePanel` - Management signature interface
- `ContractDetails` - Full contract information

---

## Styling Patterns Reference

### Gradient Patterns

**Primary Gradients (Blue)**
```jsx
// Buttons
className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"

// Large buttons with extended range
className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"

// Backgrounds
className="bg-gradient-to-br from-blue-500/30 via-blue-600/20 to-blue-800/30"
```

**Destructive Gradients (Red)**
```jsx
className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
```

**Success Gradients (Green)**
```jsx
className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
```

**Warning Gradients (Orange/Amber)**
```jsx
className="bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200"
```

**Neutral Gradients (Gray)**
```jsx
// Secondary buttons
className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300"

// Background overlays
className="bg-gradient-to-r from-white via-gray-50 to-white"
```

**Gradient Shadows**
```jsx
// Colored shadows matching gradient
className="shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
className="shadow-lg shadow-red-500/30 hover:shadow-xl"
className="shadow-lg shadow-emerald-500/30 hover:shadow-xl"
```

---

### Animation Classes

**Custom Animations (defined in `index.css`)**

**Pulse Slow:**
```css
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}

.animate-pulse-slow {
  animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

Usage:
```jsx
<div className="animate-pulse-slow">Loading...</div>
```

**Slide In Right:**
```css
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification {
  animation: slideInRight 0.3s ease-out;
}
```

**Tailwind Built-in Animations:**
```jsx
// Spin (loading spinners)
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />

// Pulse (loading states)
<div className="animate-pulse bg-gray-200 rounded h-4 w-32" />

// Bounce
<div className="animate-bounce">↓</div>

// Ping (notification dots)
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
```

**Framer Motion Animations (used in dashboard components):**
```jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

---

### Custom CSS Utility Classes

**Defined in `index.css`:**

**Card Utilities:**
```css
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden;
  transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out;
}

.card:hover {
  @apply shadow-md;
  transform: translateY(-1px);
}
```

Usage:
```jsx
<div className="card p-6">Card content</div>
```

**Button Utilities:**
```css
.btn-primary {
  @apply bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800;
}

.btn-secondary {
  @apply bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300;
}
```

**Performance Utilities:**
```css
/* Defer rendering of offscreen content */
.defer-render {
  content-visibility: auto;
  contain-intrinsic-size: 800px;
}
```

Usage:
```jsx
<div className="defer-render">
  {/* Heavy content that can be deferred */}
</div>
```

**Notification Utilities:**
```css
.notification {
  @apply fixed top-4 right-4 z-50 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4;
  animation: slideInRight 0.3s ease-out;
}
```

**Scrollbar Styling:**
```css
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  @apply bg-gray-100 rounded-full;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-300 rounded-full hover:bg-gray-400;
}
```

**Focus States:**
```css
*:focus-visible {
  outline: 2px solid theme('colors.blue.500');
  outline-offset: 2px;
}
```

**Interactive Element Transitions:**
```css
button, a, input, textarea, select {
  transition: all 0.2s ease-in-out;
}
```

**Input Autofill Styling:**
```css
input:-webkit-autofill,
textarea:-webkit-autofill,
select:-webkit-autofill {
  -webkit-text-fill-color: #000 !important;
  transition: background-color 5000s ease-in-out 0s;
  @apply border-blue-300;
}
```

**Text Selection:**
```css
::selection {
  @apply bg-blue-100 text-blue-900;
}
```

---

### Common Class Combinations

**Responsive Grid Layouts:**
```jsx
// Standard responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" />

// Dashboard stats grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6" />

// Auto-fit columns
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" />
```

**Flex Layouts:**
```jsx
// Space between with vertical center
<div className="flex items-center justify-between" />

// Centered content
<div className="flex items-center justify-center min-h-screen" />

// Responsive flex direction
<div className="flex flex-col sm:flex-row gap-4" />
```

**Interactive States:**
```jsx
// Hover + focus + active
<button className="bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:bg-blue-800" />

// Disabled state
<button className="disabled:opacity-50 disabled:cursor-not-allowed" />

// Group hover (parent hover affects child)
<div className="group">
  <div className="group-hover:bg-blue-600" />
</div>
```

**Spacing Utilities:**
```jsx
// Form field spacing
<div className="space-y-4"> {/* Vertical spacing between children */}

// Content padding (responsive)
<div className="p-4 sm:p-6 lg:p-8" />

// Section margins
<section className="mb-6 sm:mb-8 lg:mb-12" />
```

**Typography Combinations:**
```jsx
// Page heading
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2" />

// Section title
<h2 className="text-lg font-semibold text-gray-900" />

// Body text
<p className="text-sm text-gray-600" />

// Helper text
<span className="text-xs text-gray-500" />
```

---

## Usage Guidelines

### 1. Component Composition

Build complex UIs by composing simple components:

```jsx
// Good
<Card>
  <CardHeader>
    <CardTitle>User Profile</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={name} onChange={handleNameChange} />
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </Select>
      </div>
    </div>
  </CardContent>
</Card>
```

### 2. Accessibility

Always include proper labels and ARIA attributes:

```jsx
// Good
<Label htmlFor="email">Email</Label>
<Input 
  id="email" 
  type="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : undefined}
/>
{errors.email && <span id="email-error" className="text-red-600 text-sm">{errors.email}</span>}
```

### 3. Variants Over Custom Styles

Use built-in variants instead of overriding with className:

```jsx
// Good
<Button variant="destructive">Delete</Button>

// Avoid (unless necessary)
<Button className="bg-red-600 hover:bg-red-700">Delete</Button>
```

### 4. Consistent Spacing

Use Tailwind spacing utilities consistently:

- `space-y-4` / `gap-4` - Between form fields
- `p-6` - Card/dialog padding
- `mb-4` / `mb-6` - Section spacing

### 5. Responsive Design

Components are mobile-first. Add responsive classes as needed:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards */}
</div>
```

### 6. Error States

Handle errors consistently across forms:

```jsx
const [errors, setErrors] = useState({});

<Input 
  invalid={!!errors.fieldName}
  aria-invalid={!!errors.fieldName}
/>
{errors.fieldName && (
  <p className="text-sm text-red-600 mt-1">{errors.fieldName}</p>
)}
```

### 7. Loading States

Disable interactive elements during async operations:

```jsx
<Button disabled={isLoading}>
  {isLoading ? 'Saving...' : 'Save'}
</Button>
```

---

## Common Patterns

### Form Field Group

```jsx
<div className="space-y-2">
  <Label htmlFor="field-id" required>Field Label</Label>
  <Input 
    id="field-id" 
    invalid={!!errors.field}
    {...register('field')}
  />
  {errors.field && (
    <p className="text-sm text-red-600">{errors.field.message}</p>
  )}
</div>
```

### Modal with Form

```jsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Form fields */}
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
```

### Data Table with Actions

```jsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map((item) => (
      <TableRow key={item.id}>
        <TableCell>{item.name}</TableCell>
        <TableCell>{item.email}</TableCell>
        <TableCell>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">Edit</Button>
            <Button size="sm" variant="destructive">Delete</Button>
          </div>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## Best Practices

### ✅ Do

- Use semantic HTML elements
- Include ARIA attributes for accessibility
- Handle keyboard navigation
- Provide visual feedback for interactions
- Use built-in variants when available
- Keep component files focused and single-purpose
- Forward refs for compound components
- Test with keyboard-only navigation

### ❌ Avoid

- Inline styles (use Tailwind classes)
- Duplicating component logic
- Missing accessibility attributes
- Hardcoded colors (use design tokens)
- Deep prop drilling (use composition)
- Overly complex components (split into smaller ones)

---

## Contributing

When adding new components:

1. Place in `src/components/ui/`
2. Use React.forwardRef for DOM components
3. Support className prop for extensibility
4. Include displayName for debugging
5. Document props and usage examples
6. Test keyboard navigation
7. Ensure ARIA compliance
8. Add to this documentation

---

## Related Files

- **Global Styles:** [`src/index.css`](src/index.css)
- **Tailwind Config:** [`tailwind.config.js`](tailwind.config.js)
- **Color Utilities:** [`src/utils/chartHelpers.js`](src/utils/chartHelpers.js)
- **Type Definitions:** See individual component files for prop types

---

**Need help?** Reference existing page implementations in `src/pages/` for real-world usage examples.
