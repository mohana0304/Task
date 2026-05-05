const express=require('express');
const app=express();
const db=require('./models');

app.use(express.json());
app.use('/employees',require("./routes/employeeRoutes"));
app.post("/departments", async (req, res) => {
  const dept = await db.Department.create(req.body);
  res.json(dept);
});
app.post("/profiles", async (req, res) => {
  const profile = await db.Profile.create(req.body);
  res.json(profile);
});
app.post("/projects", async (req, res) => {
  const project = await db.Project.create(req.body);
  res.json(project);
});
app.post("/assign-project", async (req, res) => {
  const { employeeId, projectId } = req.body;

  const emp = await db.Employee.findByPk(employeeId);
  const project = await db.Project.findByPk(projectId);

  await emp.addProject(project);

  res.json({ message: "Assigned" });
});

db.sequelize.sync()
.then(()=>{console.log("Databased synced");
})

app.listen(3007,()=>console.log("server running on the port 3007"));