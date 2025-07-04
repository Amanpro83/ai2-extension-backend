const express = require('express');
const fs = require('fs');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();

// ✅ CORS settings to allow your GitHub Pages frontend
const corsOptions = {
  origin: 'https://amanpro83.github.io',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.use(express.json());

app.post('/generate', (req, res) => {
  const { name, package: pkg, code } = req.body;

  if (!name || !pkg || !code) {
    return res.status(400).send("Missing required fields");
  }

  const extFolder = path.join(__dirname, 'generated', name);
  fs.mkdirSync(extFolder, { recursive: true });

  const javaCode = `
package ${pkg};

import com.google.appinventor.components.annotations.*;
import com.google.appinventor.components.runtime.*;

@DesignerComponent(
    version = 1,
    description = "Auto-generated Extension",
    category = ComponentCategory.EXTENSION,
    nonVisible = true,
    iconName = "")
@SimpleObject(external = true)
public class ${name} extends AndroidNonvisibleComponent {
    public ${name}(ComponentContainer container) {
        super(container.$form());
    }

    ${code}
}
`;

  const javaPath = path.join(extFolder, `${name}.java`);
  fs.writeFileSync(javaPath, javaCode);

  exec(`rush build ${javaPath}`, (err, stdout, stderr) => {
    if (err) {
      console.error('Rush Build Error:', stderr);
      return res.status(500).send("Build failed: " + stderr);
    }

    const aixPath = path.join(extFolder, 'build', `${name}.aix`);
    if (!fs.existsSync(aixPath)) {
      return res.status(500).send("AIX file not generated.");
    }

    res.download(aixPath);
  });
});

app.listen(3000, () => console.log('✅ Backend running on port 3000'));
