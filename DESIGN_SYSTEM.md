# Shadcn UI Color Scheme & Component Usage

## Custom Rose/Pink Color Theme

This project uses a custom rose/pink color scheme configured through CSS variables.

### Color Variables

```css
:root {
  --primary: 347 89% 61%; /* Rose #FE3E69 */
  --primary-foreground: 0 0% 100%;

  --secondary: 330 81% 67%; /* Pink */
  --secondary-foreground: 0 0% 100%;

  --accent: 351 95% 71%; /* Light Rose */
  --accent-foreground: 0 0% 100%;

  --muted: 210 40% 96.1%; /* Light Gray */
  --muted-foreground: 215.4 16.3% 46.9%;

  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;

  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 347 89% 61%;
}
```

## Usage Examples

### Buttons

```jsx
import { Button } from "./components/ui/button";

// Primary button (rose color)
<Button variant="default">Click Me</Button>

// Secondary button (pink color)
<Button variant="secondary">Secondary Action</Button>

// Outline button
<Button variant="outline">Outline</Button>

// Ghost button (transparent)
<Button variant="ghost">Ghost</Button>

// Destructive button (red)
<Button variant="destructive">Delete</Button>

// Different sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">🔍</Button>
```

### Badges

```jsx
import { Badge } from "./components/ui/badge";

// Primary badge (rose)
<Badge variant="default">Admin</Badge>

// Secondary badge (pink)
<Badge variant="secondary">New</Badge>

// Outline badge
<Badge variant="outline">Beta</Badge>

// Destructive badge
<Badge variant="destructive">Error</Badge>
```

### Cards

```jsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Product Name</CardTitle>
    <CardDescription>Product description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Main content of the card</p>
  </CardContent>
  <CardFooter>
    <Button>Add to Cart</Button>
  </CardFooter>
</Card>;
```

### Inputs & Labels

```jsx
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter your email" />
</div>;
```

## Tailwind Class Conventions

Instead of hardcoded colors like `bg-[#FE3E69]`, use semantic color classes:

### ❌ Don't Use (Old Style)

```jsx
<button className="bg-[#FE3E69] hover:bg-[#ff2f5c] text-white">
  Click Me
</button>

<div className="text-gray-800 bg-gray-100">Content</div>
```

### ✅ Do Use (New Style)

```jsx
<Button variant="default">
  Click Me
</Button>

<div className="text-foreground bg-muted">Content</div>
```

## Common Color Classes

- **Text Colors:**
  - `text-primary` - Rose color
  - `text-secondary` - Pink color
  - `text-foreground` - Main text color (dark)
  - `text-muted-foreground` - Muted/secondary text (gray)

- **Background Colors:**
  - `bg-primary` - Rose background
  - `bg-secondary` - Pink background
  - `bg-background` - White background
  - `bg-muted` - Light gray background
  - `bg-card` - Card background

- **Border Colors:**
  - `border-border` - Default border color
  - `border-primary` - Rose border
  - `border-input` - Input border color

## Component Library

All shadcn components are located in `src/components/ui/`:

- `button.jsx` - Button component with variants
- `badge.jsx` - Badge component for labels
- `card.jsx` - Card container components
- `input.jsx` - Form input component
- `label.jsx` - Form label component

## Utility Function

Use the `cn()` utility from `src/lib/utils.js` to merge Tailwind classes:

```jsx
import { cn } from "../lib/utils";

<div
  className={cn(
    "base-classes",
    condition && "conditional-classes",
    className, // Allow custom className prop
  )}
>
  Content
</div>;
```

## Migration Guide

When updating existing components:

1. Replace `<button>` with `<Button variant="...">`
2. Replace hardcoded colors with semantic classes
3. Use `bg-primary` instead of `bg-[#FE3E69]` or `bg-rose-500`
4. Use `text-foreground` instead of `text-gray-800` or `text-black`
5. Use `bg-muted` instead of `bg-gray-50` or `bg-gray-100`
6. Wrap cards in `<Card>` component instead of custom divs

## Consistency Checklist

- [ ] All buttons use `<Button>` component
- [ ] All badges use `<Badge>` component
- [ ] No hardcoded hex colors (`#FE3E69`, `#ff2f5c`, etc.)
- [ ] No Tailwind color variants (`rose-500`, `gray-800`, etc.)
- [ ] Use semantic color classes (`primary`, `foreground`, `muted`, etc.)
- [ ] Cards wrapped in `<Card>` components
- [ ] Forms use `<Input>` and `<Label>` components
