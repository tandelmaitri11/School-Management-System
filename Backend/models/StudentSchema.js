const mongoose = require("mongoose")

const studentSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String
    },
    class:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Class"
    },
    rollNumber:{
        type:String
    },
    admissionDate:{
        type:Date
    },
    status:{
        type:String,
        enum:["Active","Inactive"],
        default:"Active"
    },
},{timestamps:true});

export default mongoose.model("Student",studentSchema)