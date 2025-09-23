const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');

function removeBlenderFiles(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeBlenderFiles(fullPath);
    } else {
      if (entry.name.endsWith('.blend') || entry.name.endsWith('.blend1')) {
        try {
          fs.unlinkSync(fullPath);
          console.log('Removed', fullPath);
        } catch (err) {
          console.error('Failed to remove', fullPath, err);
        }
      }
    }
  }
}

removeBlenderFiles(distDir);
console.log('clean-dist finished');
