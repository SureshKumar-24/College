require("dotenv").config();
const socketIo = require("socket.io");
const User = require("../model/student_model");
const Chat = require("../model/chat_model");
const jwt = require("jsonwebtoken");
const s3 = require("../helper/upload_file");
const { Readable } = require("stream");

exports.setupSocketConnection = (server) => {
  const io = socketIo(server, { maxHttpBufferSize: 1e8 }); // set buffer size to the 100 mb

  /* socket connection start */

  const users = {}; //TO store the online users
  const offlinesMessages = {}; //Store message for user, which is offline

  io.on("connection", (socket) => {
    console.log(`A user ${socket.id} is connected`);

    // Get the auth token provided on handshake.
    const token = socket.handshake.query.token;
    console.log("Auth token", token);

    try {
      // Verify the token here
      jwt.verify(token, process.env.JWT_KEY);
      console.log("Token verification successful");
    } catch (error) {
      console.error("Authentication failed:", error.message);
      socket.disconnect(true);
    }

    //Add user id , receiver id and send previous chat to user
    socket.on("addUser", async (user, receiver) => {
      console.log(`User ${user} is online`);

      // add user to online list
      users[user] = socket.id;

      if (offlinesMessages[user]) {
        offlinesMessages[user].forEach((message) => {
          socket.to(users[user]).emit("receiveMessage", message);
        });
        delete offlinesMessages[user];
      }

      await User.findByIdAndUpdate(user, { $set: { isOnline: true } }); // Update student/user online status

      socket.broadcast.emit("onlineUsers", { userId: user });

      let userChat = await Chat.find({
        $or: [
          { senderId: user, receiverId: receiver },
          { senderId: receiver, receiverId: user },
        ],
      }).sort({ createdAt: -1 });

      io.to(users[user]).emit("pastChat", userChat); // TO send previous messages to the user
    });

    // Receive message and send to the targeted user
    socket.on("message", async (data) => {
      console.log(data, "Receive data packet");

      let isDelivered;
      let url = "";

      // send message to the targeted user
      if (users[data.to]) {
        let receiver = users[data.to];
        let sender = users[data.from];
        isDelivered = true;

        // if the data contain a image or file then upload to the s3 and get url in return
        if (data.file.buffer) {
          let upload = await uploadFunction(data.file);
          if (upload == "failed") {
            io.to(sender).to(receiver).emit("receiveMessage", "Fail to upload the file");
          }
          url = upload.Location;
        }

        console.log(`A ${data.msg || url} is from ${sender} to ${receiver} `);

        io.to(sender).to(receiver).emit("receiveMessage", `${data.msg} ${url}`);
      } else {
        // Store msg when reciever is not available by intializing the empty array if not already store some message
        isDelivered = false;
        if (!offlinesMessages[data.to]) {
          offlinesMessages[data.to] = [];
        }

        // if the data contain a image or file then upload to the s3 and get url in return and assign to url variable
        if (data.file.buffer) {
          let upload = await uploadFunction(data.file);
          if (upload == "failed") {
            io.to(users[data.from]).emit("receiveMessage", "Fail to upload the file");
          }
          url = upload.Location;
          console.log(url);
        }

        io.to(users[data.from]).emit("receiveMessage", `${data.msg} ${url}`);
        offlinesMessages[data.to].push(`${data.msg} ${url}`);

        console.log(`Offline messages : ${offlinesMessages}`);
        console.log(`User ${data.to} is offline , The message is stored for later delivery`);
      }

      try {
        let { from, to, msg, time } = data;

        // save message to the database
        await Chat.create({
          senderId: from,
          receiverId: to,
          message: msg,
          time: time,
          file: url,
          isDelivered,
        });
      } catch (err) {
        console.error("Error in sending a message", err);
      }
    });

    // Notify other user's when user is offline and update student/user status
    socket.on("disconnect", async () => {
      //find user which just go offline
      let offlineUser = Object.keys(users).find((userId) => users[userId] === socket.id);

      if (offlineUser) {
        console.log(`A user ${offlineUser} is disconnected`);
        //update the student/user status isOnline to false
        let updateUser = await User.findByIdAndUpdate(offlineUser, { $set: { isOnline: false } });
        if (updateUser) {
          // Emit a event to others that user go offline
          socket.emit("offlineUser", { userId: offlineUser });
          delete users[offlineUser]; //delete user from online users
        } else {
          console.log("Error updating the user status");
        }
      }
    });
  });

  return io;

  /* socket connection ends here */
};

/* function to upload the file to s3 bucket */
let uploadFunction = async (file) => {
  try {
    // initialize the new stream instance and push the buffer data to the variable
    let readableStream = new Readable();
    readableStream.push(file.buffer);
    readableStream.push(null);

    // intialize the params to upload on s3
    const params = {
      Bucket: "univ-connect-profile",
      Key: `userChat/${Date.now()}_${file?.originalname}`,
      Body: readableStream,
      ContentType: file.mimetype,
    };

    let uploadFile = await s3.upload(params).promise();

    // Through error if uploading failed
    if (!uploadFile) {
      console.log("Problem to upload the file to s3 bucket");
      return "failed";
    }

    return uploadFile;
  } catch (err) {
    console.log("Error in uploading the file to s3 bucket", err);
  }
};
