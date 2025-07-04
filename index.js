const express = require('express');
const fs = require('fs');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/generate', (req, res) => {
  const { name, package: pkg, code } = req.body;
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
      console.error(stderr);
      return res.status(500).send("Build failed");
    }
    const aixPath = path.join(extFolder, 'build', `${name}.aix`);
    res.download(aixPath);
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));
