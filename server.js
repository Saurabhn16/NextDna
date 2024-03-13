const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer"); // Import multer
const path = require("path");
const app = express();

const cookieParser = require("cookie-parser");

const PORT = process.env.PORT || 3001;
app.use(cookieParser());
// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/auth_service", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Define user schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  profilePicture: String, // Add profile picture field to user schema
});
app.use(express.json());

app.use(express.urlencoded({extended:true}));

const User = mongoose.model("User", userSchema);

// Middleware to parse JSON bodies
app.use(express.json());
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Set the destination folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname); // Set the filename
  },
});

// Set up multer for handling file uploads
const upload = multer({ storage: storage });

// Function to generate a signature
function generateSignature(filename) {
  // Your signature generation logic goes here
  return `Signature for ${filename}`;
}

// Route for user authentication
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Generate JWT token
    const token = jwt.sign({ username: user.username }, "secretkey");

    // Set cookie with the JWT token
    res.cookie("token", token, { httpOnly: true }); // You can set other options as per your requirement

    // Redirect to the home page or send JSON response
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route for user registration with profile picture
app.post("/register", upload.single("profilePicture"), async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user with profile picture filename
    const newUser = new User({
      username,
      password: hashedPassword,
      profilePicture: req.file ? req.file.filename : null, // Save filename if file uploaded, otherwise null
    });
    await newUser.save();

    // Generate JWT token
    const token = jwt.sign({ username: newUser.username }, "secretkey");

    // Set cookie with the JWT token
    res.cookie("token", token, { httpOnly: true }); // You can set other options as per your requirement

    // Redirect to the home page or send JSON response
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

function generateSignature(username, filename) {
  // Your signature generation logic goes here
  return `${username}_${filename}`;
}

// Define Mongoose schema for artifacts
const artifactSchema = new mongoose.Schema({
  username: String,
  originalname: String,
  filename: String,
  mimetype: String,
  size: Number,
  signature: String, // Add signature field to store the generated signature
});

const Artifact = mongoose.model("Artifact", artifactSchema);

// Define Mongoose schema for documents
const documentSchema = new mongoose.Schema({
  username: String,
  title: String,
  content: String,
  filename: String,
  artifactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Artifact",
  },
  // Add artifactFilename field to store the filename of the linked artifact
});

const Document = mongoose.model("Document", documentSchema);
app.post("/upload", upload.single("artifact"), async (req, res) => {
  try {
    // Access uploaded file details from req.file
    const { originalname, filename, mimetype, size } = req.file;
    let username = "";

    // Get the token from the request cookies
    const token = req.cookies.token;

    if (token) {
      // Verify the JWT token
      const decoded = jwt.verify(token, "secretkey");
      if (decoded) {
        username = decoded.username;
      }
    }

    // Generate a signature for the artifact using the username and filename
    const signature = generateSignature(username, filename);

    // Save artifact details, signature, and username to MongoDB
    const artifact = new Artifact({
      username, // Include username
      originalname,
      filename,
      mimetype,
      size,
      signature,
    });
    console.log(artifact);
    await artifact.save();
    setTimeout(() => {
      res.redirect("/");
    }, 1000);
    // res.json({ originalname, filename, mimetype, size, signature });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route for creating documents and linking them to artifacts
app.post("/documents", async (req, res) => {
    try {
      const { title, content, filename, artifactId } = req.body;
  
      // Check if the artifact exists
      const artifact = await Artifact.findById(artifactId);
      if (!artifact) {
        return res.status(404).json({ error: "Artifact not found" });
      }
      console.log(artifact);
  
      let username = "";
  
      // Get the token from the request cookies
      const token = req.cookies.token;
  
      if (token) {
        // Verify the JWT token
        const decoded = jwt.verify(token, "secretkey");
        if (decoded) {
          username = decoded.username;
        }
      }
  
      // Create a new document and link it to the artifact
      const document = new Document({
        username,
        title,
        content,
        filename,
        artifactId,
        // Include the filename of the linked artifact
      });
      console.log(document);
      await document.save();
      setTimeout(() => {
        res.redirect("/");
      }, 1000);
      // res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
// Route to fetch all artifacts and their linked documents
app.get("/artifacts", async (req, res) => {
  try {
    // Find all artifacts
    const artifacts = await Artifact.find();

    // Iterate through each artifact and find its linked documents
    for (let artifact of artifacts) {
      // Find documents linked to the artifact
      const documents = await Document.find({ artifactId: artifact._id });

      // Assign the documents array to the artifact object
      artifact.documents = documents;
    }

    // Send the list of artifacts with linked documents as response
    res.json(artifacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route for getting documents linked to a specific artifact
app.get("/documents/:artifactId", async (req, res) => {
  try {
    const { artifactId } = req.params;

    // Find all documents linked to the artifact
    const documents = await Document.find({ artifactId });

    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to serve images associated with artifact IDs
app.get("/get_image/:artifactId", async (req, res) => {
  try {
    const { artifactId } = req.params;

    // Find the artifact by ID
    const artifact = await Artifact.findById(artifactId);

    // If artifact not found, return 404
    if (!artifact || !artifact.filename) {
      return res.status(404).json({ error: "Artifact image not found" });
    }

    // Set the content type header based on the artifact's mimetype
    res.set("Content-Type", artifact.mimetype);

    // Send the image file as a response
    res.sendFile(path.join(__dirname, "uploads", artifact.filename));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route for fetching documents uploaded by the current user
app.get("/mydocuments", async (req, res) => {
  try {
    let username = "";

    // Get the token from the request cookies
    const token = req.cookies.token;

    if (token) {
      // Verify the JWT token
      const decoded = jwt.verify(token, "secretkey");
      if (decoded) {
        username = decoded.username;
      }
    }

    // Find all documents uploaded by the current user
    const documents = await Document.find({ username });
    console.log(documents);
    res.json(documents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route for deleting a document
app.delete("/mydocument/:documentId", async (req, res) => {
    try {
      const { documentId } = req.params;
  
      // Find the document by ID and delete it
      await Document.findByIdAndDelete(documentId);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

// Route for editing a document
app.put("/mydocument/:documentId", async (req, res) => {
  try {
    const { documentId } = req.params;
    const { title, content } = req.body;
console.log(documentId);
    // Find the document by ID and update its title and content
    await Document.findByIdAndUpdate(documentId, { title, content });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Route handler for editing a document
app.post("/edit-document/:documentId", async (req, res) => {
    try {
        const { documentId } = req.params;
        const { title, content } = req.body;

        // Find the document by ID and update its title and content
        const updatedDocument = await Document.findByIdAndUpdate(documentId, { title, content }, { new: true });

        // Check if the document was found and updated
        if (!updatedDocument) {
            return res.status(404).json({ error: "Document not found" });
        }

        // If the document was successfully updated, send a success response
        res.json({ success: true, updatedDocument });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Set EJS as the view engine
app.set("view engine", "ejs");

// Specify the directory where your views are located
app.set("views", path.join(__dirname, "views"));

// Serve static files from the 'views' directory
app.use(express.static(path.join(__dirname, "views")));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.get("/", async (req, res) => {
  try {
    // Check if the user is authenticated
    let loggedIn = false;
    let username = "";

    // Get the token from the request cookies
    const token = req.cookies.token;

    if (token) {
      // Verify the JWT token
      const decoded = jwt.verify(token, "secretkey");
      if (decoded) {
        loggedIn = true;
        username = decoded.username;
      }
    }

    // Fetch documents and artifacts from the database
    const documents = await Document.find();
    const artifacts = await Artifact.find();

    res.render("index", { artifacts, documents, loggedIn, username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route for serving the login page
app.get("/login1", (req, res) => {
  // res.render('login');
  res.sendFile(path.join(__dirname, "views", "login.html"));
  //
});

// Route for serving the registration page
app.get("/register1", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "register.html"));
});

// Route for serving the upload artifact page
app.get("/upload1", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "upload.html"));
});

// Route for serving the uploaded document page
// Route for serving the uploaded document page
app.get('/documents1', (req, res) => {
  res.sendFile(path.join(__dirname, 'views','documents.html'));

});
app.get("/mydocuments1", async (req, res) => {
    try {
      // Check if the user is authenticated
      let loggedIn = false;
      let username = "";
  
      // Get the token from the request cookies
      const token = req.cookies.token;
  
      if (token) {
        // Verify the JWT token
        const decoded = jwt.verify(token, "secretkey");
        if (decoded) {
          loggedIn = true;
          username = decoded.username;
        }
      }
  
      // Fetch documents uploaded by the current user
      const documents = await Document.find({ username });
      console.log(documents);
      // Render the 'mydocument' EJS template and pass the documents data
      res.render("mydocument", { documents, loggedIn, username });
      
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal server error");
    }
  });
  
// Route for handling logout
app.get("/logout", (req, res) => {
  // Clear the token cookie
  res.clearCookie("token");

  // Redirect the user to the login page
  res.redirect("/login1");
});

app.listen(PORT, () => {
  console.log(`Auth Service is running on port ${PORT}`);
});
