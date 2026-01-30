# UI Components

This directory contains reusable, accessible UI components built with React and Tailwind CSS.

## Quick Reference

| Component | File | Purpose |
|-----------|------|---------|
| Button | `Button.jsx` | Primary interactive element with variants |
| Card | `Card.jsx` | Content container with header/body sections |
| Input | `Input.jsx` | Text input with validation states |
| Label | `Label.jsx` | Accessible form labels |
| Select | `Select.jsx` | Custom dropdown with keyboard nav |
| Textarea | `Textarea.jsx` | Multi-line text input |
| Checkbox | `Checkbox.jsx` | Checkbox with indeterminate support |
| Badge | `Badge.jsx` | Status/role indicators |
| Alert | `Alert.jsx` | Informational messages |
| Dialog | `Dialog.jsx` | Modal dialogs with backdrop |
| Table | `Table.jsx` | Data table components |
| Tabs | `Tabs.jsx` | Tabbed interface |
| Separator | `Separator.jsx` | Visual dividers |

## Installation

All components are already included in this project. Import as needed:

```jsx
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
```

## Design Principles

1. **Accessible by default** - All components include ARIA attributes and keyboard support
2. **Composable** - Build complex UIs from simple building blocks
3. **Customizable** - Accept className props for extensions
4. **Consistent** - Follow design system colors and spacing
5. **Responsive** - Mobile-first design patterns

## Common Imports

```jsx
// Forms
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';

// Layout
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';

// Feedback
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import Badge from '@/components/ui/Badge';

// Data Display
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
```

## Example: Complete Form

```jsx
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Select from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

function UserForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create User</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="lecturer">Lecturer</SelectItem>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button type="submit" variant="primary">Create</Button>
            <Button type="button" variant="outline">Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

## Documentation

See [`../../COMPONENTS.md`](../../COMPONENTS.md) for complete documentation including:
- Detailed prop tables
- All variants and sizes
- Accessibility features
- Usage examples
- Best practices

## Maintenance

When modifying components:
- ✅ Maintain backward compatibility
- ✅ Update prop types/documentation
- ✅ Test keyboard navigation
- ✅ Verify ARIA compliance
- ✅ Check responsive behavior
- ✅ Update this README if adding new components
