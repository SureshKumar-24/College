const express = require("express");
const app = express();
const server = require("http").createServer(app);
const socketConnection = require("./App/services/socket");
const io = socketConnection.setupSocketConnection(server);
const bodyParser = require("body-parser");
const path = require("path");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();
require("./App/database/mongo_connection")();

const Register = require("./App/routes/admin_route");
const University = require("./App/routes/university_route");
const Studylevel = require("./App/routes/studylevel_route");
const Student = require("./App/routes/student_route");
const Staff = require("./App/routes/staff_route");
const News = require("./App/routes/news_route");
const Event = require("./App/routes/event_route");
const Role = require("./App/routes/role_route");
const Announcement = require("./App/routes/annouce_route");
const Workshop = require("./App/routes/workshop_route");
const Notify = require("./App/routes/notify_route");

const Job = require("./App/routes/job_route");
const Resource = require("./App/routes/resource_route");
const Document = require("./App/routes/assignmentAndCategory");
const Query = require("./App/routes/query_route");
const Subject = require("./App/routes/semester_route");
const Assigments = require("./App/routes/assignment");
const Exam = require("./App/routes/examEnrollment");
const Payment = require("./App/routes/payment_route");

const Idea = require("./App/routes/idea_route");
//Model
const NewsModel = require("./App/model/news_model");
const EventModel = require("./App/model/event_model");
const AnnouncementModel = require("./App/model/annouce_model");
const WorkshopModel = require("./App/model/workshop_model");
const User = require("./App/model/student_model");
const Chat = require("./App/model/chat_model");

const cron = require("cron");
const { Server } = require("http");

app
  .use(cors())
  .use("/", express.static(path.join(__dirname, "Image")))
  .set("views", path.join(__dirname, "views"))
  .set("view engine", "ejs")
  .use(bodyParser.urlencoded({ extended: false }))
  .use(bodyParser.json())
  .use(morgan("dev"));

app
  .use(Register)
  .use(University)
  .use(Studylevel)
  .use(Student)
  .use(Staff)
  .use(News)
  .use(Event)
  .use(Role)
  .use(Announcement)
  .use(Workshop)
  .use(Notify)
  .use(Job)
  .use(Resource)
  .use(Query)
  .use(Document)
  .use(Subject)
  .use(Assigments)
  .use(Exam)
  .use(Payment)
  .use(Idea);


server.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running at port ${process.env.PORT || 3000}`);
});
