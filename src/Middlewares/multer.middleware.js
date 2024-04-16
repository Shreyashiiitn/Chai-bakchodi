import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
       // This can also be removed
      cb(null, file.originalname)  // file.orginaname
    }
  })
  
export const upload = multer({ storage: storage })