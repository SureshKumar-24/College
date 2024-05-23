"use strict";

//Genrate Random id's based on document type

function generateId(prefix) {
  let title = prefix || "UNV";
  const randomDigits = Math.floor(1000 + Math.random() * 90000);
  const month = new Date().getMonth() + 1;
  let id = `${title}${randomDigits}${month}`;
  if (title === "UNV") {
    id = `UNIV123400`;
  }
  return id;
}
module.exports = generateId;
