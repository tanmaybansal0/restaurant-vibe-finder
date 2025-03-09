const fs = require('fs');
const path = require('path');

// Create necessary directories
const dirs = ['services', 'public', 'routes', 'cache', 'cache/venue-data', 'cache/vibe-analysis'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating ${dir} directory...`);
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`${dir} directory created.`);
  } else {
    console.log(`${dir} directory already exists.`);
  }
});

// Write HTML file to public directory
if (fs.existsSync('./index-html.txt')) {
  console.log('Copying index.html from template...');
  const htmlContent = fs.readFileSync('./index-html.txt', 'utf8');
  fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), htmlContent);
} else {
  console.log('Creating default index.html...');
  // Create a simple placeholder HTML file
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vibe Match</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
  <div class="container my-5">
    <h1 class="text-center">Vibe Match</h1>
    <p class="text-center">Find your perfect venue based on vibe!</p>
  </div>
</body>
</html>`;
  fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), htmlContent);
}

console.log('Setup complete! You can now run your application with "node app.js"');
console.log('\nIMPORTANT: Before running, make sure to set up your .env file with:');
console.log('- YELP_API_KEY (required)');
console.log('- LLM_PROVIDER (openai or anthropic)');
console.log('- OPENAI_API_KEY or ANTHROPIC_API_KEY (depending on your LLM choice)');