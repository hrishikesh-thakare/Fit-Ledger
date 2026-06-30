const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Pattern 1: { color: theme.colors.xyz, ...theme.typography.abc
  // Needs to become: { ...theme.typography.abc, color: theme.colors.xyz
  const pattern1 = /\{\s*color:\s*(theme\.colors\.[a-zA-Z]+),\s*(\.\.\.theme\.typography\.[a-zA-Z]+)/g;
  if (content.match(pattern1)) {
    content = content.replace(pattern1, '{ $2, color: $1');
    changed = true;
  }

  // Pattern 2: style={{ color: theme.colors.xyz, ...theme.typography.abc
  // Needs to become: style={{ ...theme.typography.abc, color: theme.colors.xyz
  const pattern2 = /style=\{\{\s*color:\s*(theme\.colors\.[a-zA-Z]+),\s*(\.\.\.theme\.typography\.[a-zA-Z]+)/g;
  if (content.match(pattern2)) {
    content = content.replace(pattern2, 'style={{ $2, color: $1');
    changed = true;
  }

  // Handle specific manual issues in dashboard/page.tsx:
  // e.g. `<Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.colors.primary, ...theme.typography.cardTitle }}>`
  // The general pattern2 regex above handles `style={{ color: theme.colors.xyz, ...theme.typography.abc`
  
  if (changed) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log(`Swapped typography/color order in: ${path.relative(__dirname, file)}`);
  }
});

console.log(`\nSuccess! Swapped style priorities in ${changedFiles} files.`);
