const fs = require('fs');
const { marked } = require('marked');

// Override function
const renderer = {
  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    return `<h${depth}>${'#'.repeat(depth)} ${text}</h${depth}>`;
  }
};
marked.use({ renderer });

function wrap(title, html) {
  const scripting = fs.readFileSync(__dirname + '/scripting.js', 'utf8');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: monospace;
      background: #1d1f21;
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1rem;
    }
    * { color: #c5c8c6; font-size: 12pt !important; }
    h1 { color: #cc6666; }
    h2 { color: #82bd68; }
    h3 { color: #81a2be; }
    p.link { margin: 2pt 0; }
    a {
      color: #81a4be;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  ${html}
  <script>
${scripting}
  </script>
</body>
</html>`;
}

function main() {
  const [, , inputPath, outputPath] = process.argv;

  if (!inputPath || !outputPath) {
    console.error('Usage: node bin/render-page.js <input-file> <output-file>');
    process.exit(1);
  }

  try {
    const title = inputPath.split('/').pop().replace('.md', '');
    const markdown = fs.readFileSync(inputPath, 'utf8');
    const html = marked.parse(markdown);
    fs.writeFileSync(outputPath, wrap(title, html), 'utf8');
  } catch (error) {
    console.error('Error rendering page:', error.message);
    process.exit(1);
  }
}

main();
