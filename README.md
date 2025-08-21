# Company Logos CLI

A CLI tool for adding company logo components to your React projects.

## Installation

```bash
npx company-logos add vercel --tsx
```

## Usage

### Add a single component
```bash
npx company-logos add vercel --tsx
npx company-logos add next --jsx
```

### Add multiple components
```bash
npx company-logos add vercel next github --tsx
```

### Add all available components
```bash
npx company-logos add --all --tsx
```

### List available components
```bash
npx company-logos available
```

### List components in your project
```bash
npx company-logos list
```

## Flags

- `--tsx` - Create TypeScript JSX components
- `--jsx` - Create JavaScript JSX components  
- `--force, -f` - Overwrite existing files
- `--all, -a` - Add all available components

## Troubleshooting

### Permission Denied Errors

If you get permission denied errors:

1. **Make sure you're in your project directory**
   ```bash
   cd your-project
   npx company-logos add vercel --tsx
   ```

2. **Check directory permissions**
   ```bash
   ls -la
   # Make sure you can write to the current directory
   ```

3. **Try with explicit permissions** (if needed)
   ```bash
   sudo npx company-logos add vercel --tsx
   ```

### Common Issues

- **"Cannot write to directory"**: Run from your project root where you have write permissions
- **"Component not found"**: Use `npx company-logos available` to see available components
- **"Network error"**: The CLI fetches components from GitHub, check your internet connection

## Generated Structure

```
your-project/
├── components/
│   └── logos/
│       ├── vercel.tsx
│       └── next.tsx
└── logos.json (tracking file)
```

## Component Usage

```tsx
import VercelLogo from './components/logos/vercel';

function App() {
  return (
    <div>
      <VercelLogo width={32} height={32} className="logo" />
    </div>
  );
}
```
