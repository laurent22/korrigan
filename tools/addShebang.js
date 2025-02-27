const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../dist/index.js');

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
	process.exit(1);
  }

  if (!data.startsWith('#!/usr/bin/env node')) {
    const shebang = '#!/usr/bin/env node\n';
    const updatedData = shebang + data;

    fs.writeFile(filePath, updatedData, 'utf8', (err) => {
      if (err) {
        console.error('Error writing to file:', err);
		process.exit(1);
      } else {
        console.log('Shebang added successfully!');
      }
    });
  }
});
