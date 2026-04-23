const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueName = uuidv4() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

// Filtro de archivos
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Tipo de archivo no permitido"));
        }
    }
});

// Servir HTML
app.use(express.static("public"));

// Ruta principal
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

// 📌 AQUÍ VA EL DEBUG (bien puesto)
app.post("/upload", upload.single("archivo"), (req, res) => {

    console.log("=== NUEVA SOLICITUD ===");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    try {
        const { tramite, alumno, grupo, correo } = req.body;

        if (!req.file) {
            return res.send("Error: No se subió archivo");
        }

        const token = uuidv4().slice(0, 8);

        const nuevaSolicitud = {
            tramite,
            alumno,
            grupo,
            correo,
            archivo: req.file.filename,
            token,
            fecha: new Date()
        };

        let data = [];

        if (fs.existsSync("data.json")) {
            data = JSON.parse(fs.readFileSync("data.json"));
        }

        data.push(nuevaSolicitud);
        fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

        res.send(`
            <h2>Solicitud enviada correctamente</h2>
            <p><strong>Folio:</strong> ${token}</p>
            <p>Guarde este folio para seguimiento.</p>
            <a href="/">Volver</a>
        `);

    } catch (error) {
        console.error(error);
        res.send("Ocurrió un error al procesar la solicitud");
    }
});

// Panel admin
app.get("/admin", (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync("data.json"));
        res.json(data);
    } catch {
        res.json([]);
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log("Servidor corriendo en http://localhost:" + PORT);
});