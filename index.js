// server.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const filesDir = path.join(__dirname, 'files');

app.get("/", (req, res) => {
  fs.readdir(filesDir, (err, files) => {
    if (err) return res.status(500).send("Failed to read tasks.");

    const tasks = files.map((file) => {
      const filePath = path.join(filesDir, file);
      const taskDescription = fs.readFileSync(filePath, 'utf8');
      const shortDescription = taskDescription.length > 60 ? taskDescription.substring(0, 60) + '...' : taskDescription;
      return { filename: file, description: shortDescription };
    });

    res.render("index", { tasks });
  });
});

app.post("/create", (req, res) => {
  const { title, description } = req.body;
  const safeTitle = title.split(" ").join("_");
  fs.writeFile(path.join(filesDir, `${safeTitle}.txt`), description, (err) => {
    if (err) return res.status(500).send("Error creating task file.");
    res.redirect("/");
  });
});

app.get("/files/:filename", (req, res) => {
  const filePath = path.join(filesDir, req.params.filename);
  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) return res.status(404).send("File not found.");
    res.render("show", { filename: req.params.filename, content });
  });
});

app.get("/edit/:filename", (req, res) => {
  const filePath = path.join(filesDir, req.params.filename);
  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) return res.status(404).send("File not found.");
    res.render("edit", { filename: req.params.filename, content });
  });
});

app.post("/update/:filename", (req, res) => {
  const oldFilename = req.params.filename;
  const { title, description } = req.body;
  const newFilename = title.split(" ").join("_") + ".txt";
  const oldPath = path.join(filesDir, oldFilename);
  const newPath = path.join(filesDir, newFilename);

  fs.rename(oldPath, newPath, (renameErr) => {
    if (renameErr && oldFilename !== newFilename) return res.status(500).send("Rename failed.");
    fs.writeFile(newPath, description, (err) => {
      if (err) return res.status(500).send("Update failed.");
      res.redirect("/");
    });
  });
});

app.post("/delete/:filename", (req, res) => {
  const filePath = path.join(filesDir, req.params.filename);
  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).send("Delete failed.");
    res.redirect("/");
  });
});

app.listen(3000, () => console.log("Server running on port 3000"));
