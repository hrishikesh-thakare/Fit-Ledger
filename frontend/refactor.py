import os
import re

src_dir = r"d:\Gym-App\Fit-Ledger\frontend\src"

for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Skip Profile, App.tsx, navigation, and theme files
            if "contexts\\ThemeContext" in path or "navigation\\index.tsx" in path or "theme\\index.ts" in path or "screens\\profile\\page.tsx" in path:
                continue
                
            if "import { theme }" not in content and "import theme " not in content:
                continue
                
            print(f"Processing {path}")
            
            # Replace import
            content = re.sub(
                r"import\s+\{\s*theme\s*\}\s+from\s+['\"](.*?)theme['\"]",
                r"import { useTheme } from '\1contexts/ThemeContext'",
                content
            )
            content = re.sub(
                r"import\s+theme\s+from\s+['\"](.*?)theme['\"]",
                r"import { useTheme } from '\1contexts/ThemeContext'",
                content
            )
            
            # Replace StyleSheet.create
            content = content.replace("const styles = StyleSheet.create({", "const getStyles = (theme: any) => StyleSheet.create({")
            
            # Insert hook into functional components
            # We look for export default function Name(props) {
            # or export function Name(props) {
            # or const Name = (props) => {
            
            def insert_hook(match):
                prefix = match.group(0)
                if "useTheme()" in content:
                    return prefix # already has it somewhere? just return
                return prefix + "\n  const { theme } = useTheme();\n  const styles = getStyles(theme);"
                
            content = re.sub(r"export default function \w+\([^)]*\)\s*\{", insert_hook, content)
            
            # For components like `const CustomAlert = () => {`
            if "export default function" not in content:
                content = re.sub(r"export (?:const|function) \w+\s*=?\s*\([^)]*\)\s*(?:=>\s*)?\{", insert_hook, content)
            
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
                
print("Done")
