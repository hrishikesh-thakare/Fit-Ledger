const fs = require('fs');
const path = require('path');

const srcDir = 'd:\\Gym-App\\Fit-Ledger\\frontend\\src';

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            results.push(file);
        }
    });
    return results;
}

const files = walk(srcDir);

for (const file of files) {
    if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
    if (file.includes('contexts\\ThemeContext') || 
        file.includes('navigation\\index.tsx') || 
        file.includes('theme\\index.ts') || 
        file.includes('screens\\profile\\page.tsx')) {
        continue;
    }

    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('import { theme }') && !content.includes('import theme ')) {
        continue;
    }

    console.log("Processing " + file);

    // Replace import
    content = content.replace(/import\s+\{\s*theme\s*\}\s+from\s+['"](.*?)theme['"]/g, "import { useTheme } from '$1contexts/ThemeContext'");
    content = content.replace(/import\s+theme\s+from\s+['"](.*?)theme['"]/g, "import { useTheme } from '$1contexts/ThemeContext'");

    // Replace StyleSheet.create
    content = content.replace("const styles = StyleSheet.create({", "const getStyles = (theme: any) => StyleSheet.create({");

    // Insert hook
    const hookStr = "\n  const { theme } = useTheme();\n  const styles = getStyles(theme);";
    
    // Pattern 1: export default function Name(props) {
    let matched = false;
    content = content.replace(/export default function \w+\([^)]*\)\s*\{/g, (match) => {
        matched = true;
        if (content.includes("const { theme } = useTheme()")) return match;
        return match + hookStr;
    });

    if (!matched) {
        content = content.replace(/export (?:const|function) \w+\s*=?\s*\([^)]*\)\s*(?:=>\s*)?\{/g, (match) => {
            if (content.includes("const { theme } = useTheme()")) return match;
            return match + hookStr;
        });
    }

    fs.writeFileSync(file, content, 'utf8');
}
console.log("Done");
