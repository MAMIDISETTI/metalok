const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "goodreads.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

// Register API
app.post("/register/", async (request, response) => {
  const { first_name, last_name, email, password } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `
  SELECT 
    * 
  FROM 
    user 
  WHERE 
    email = '${email}'`;
  let dbuser = await db.get(selectUserQuery);
  if (dbuser == undefined) {
    const createUserQuery = `
  INSERT INTO
    user (username, name, password, gender, location)
  VALUES
    (
      '${first_name}',
      '${last_name}',
      '${email}',
      '${hashedPassword}', 
    );`;
    await db.run(createUserQuery);
    response.send("User created successfully");
  } else {
    response.status(400);
    response.send("user already exist");
  }
});

// Login API

app.post("/login/", async (req, res) => {
  const { email, password } = req.body;
  const selectUserQuery = `
    SELECT * FROM user WHERE 
    email ='${email}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    res.status(400);
  } else {
    const isPassword = await bcrypt.compare(password, dbUser.password);
    if (isPassword === true) {
      const payload = { email: email };
      const jwtToken = jwt.sign(payload, "Mykey");
      res.send(jwtToken);
      res.send("Login successful");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  }
});

// Create template

app.post("/template", async (request, response) => {
  const templateDetails = request.body;
  const { template_name, subject, body } = templateDetails;
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (authHeader === undefined) {
    response.status(401);
    response.send("Invalid jwtToken");
  } else {
    jwt.verify(jwtToken, "Mykey", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid access token");
      } else {
        const addTemplates = `
                INSERT INTO 
                user (template_name,subject,body)
                VALUES 
                (
                    '${template_name}',
                    '${subject}',
                    '${body}'
                )`;
        const result = await db.all(addTemplates);
        response.send(result);
      }
    });
  }
});

// Get template

app.get("/template", async (request, response) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (authHeader === undefined) {
    response.status(401);
    response.send("Invalid jwtToken");
  } else {
    jwt.verify(jwtToken, "Mykey", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid access token");
      } else {
        const getTemplates = `
                SELECT * FROM user`;
        const result = await db.all(getTemplates);
        response.send(result);
      }
    });
  }
});

// GET Single Template

app.get("/template/:template_id", async (request, response) => {
  const { template_id } = request.params;
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (authHeader === undefined) {
    response.status(401);
    response.send("Invalid jwtToken");
  } else {
    jwt.verify(jwtToken, "Mykey", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid access token");
      } else {
        const getTemplates = `
                SELECT * FROM user
                WHERE template_id = ${template_id}`;
        const result = await db.get(getTemplates);
        response.send(result);
      }
    });
  }
});

// update template

app.put("/template/:template_id", async (request, response) => {
  const { template_id } = request.params;
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (authHeader === undefined) {
    response.status(401);
    response.send("Invalid jwtToken");
  } else {
    jwt.verify(jwtToken, "Mykey", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid access token");
      } else {
        const updateTemplates = `
        UPDATE user 
          SET 
          template_name = '${template_name}',
          subject = '${subject}',
          body = '${body}'
          WHERE 
            template_id= ${template_id}
                `;
        const result = await db.run(updateTemplates);
        response.send(result);
      }
    });
  }
});

// Delete template

app.delete("/template/:template_id", async (request, response) => {
  const { template_id } = request.params;
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (authHeader === undefined) {
    response.status(401);
    response.send("Invalid jwtToken");
  } else {
    jwt.verify(jwtToken, "Mykey", async (error, user) => {
      if (error) {
        response.status(401);
        response.send("Invalid access token");
      } else {
        const deleteTemplate = `
          DELETE FROM 
            user
          WHERE 
            template_id= ${template_id}
                `;
        const result = await db.run(deleteTemplate);
        response.send(result);
      }
    });
  }
});
