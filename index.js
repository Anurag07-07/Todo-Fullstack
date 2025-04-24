const express = require('express')
const jwt = require('jsonwebtoken')
const { default: mongoose } = require('mongoose')
const { UserModel, TodoModel } = require('./db')
const bcrypt = require('bcrypt')
const {z} = require('zod')
const dotenv = require('dotenv')
const app = express()
dotenv.config()

const PORT = process.env.PORT || 8000
const JWT_SECRET = "TodoApp"


const dbConnect = async()=>{
  try {
    await mongoose.connect(process.env.MONGO_DB)
    console.log(`Database Connected`);
  } catch (error) {
    console.log(`There is Some Issue in Connection`);
    console.log(error);
  }
}

dbConnect()

//Middleware
app.use(express.json())

app.get('/',(req,res)=>{
  res.sendFile(__dirname+'/public/signup.html')
})

app.get('/signin-dashboard',(req,res)=>{
  res.sendFile(__dirname+'/public/signin.html')
})

async function todoopenauth(req,res,next) {
  const token = req.headers.token
  
  try {
    const data = jwt.verify(token,JWT_SECRET)
    const userId = data.id
    const check = await UserModel.find({
      userId
    })

    if (check) {
      req.userId = data.id
      next()
    }
  } catch (error) {
    res.status(403).json({
      message:error,
    })
  }
}

app.get('/todo-dashboard',todoopenauth,(req,res)=>{
  res.sendFile(__dirname+'/public/todo.html')
})

app.post('/signup',async(req,res)=>{

  //Password Validation with Zod
  const requiredBody = z.object({
    email:z.string().min(10).max(30).email(),
    password:z.string().min(7).max(20).regex(/[A-Z]/).regex(/[a-z]/).regex(/[^A-Za-z0-9]/).regex(/\d/), // ^A-Za-z0-9 this is for Symbol and /\d/ this is for Number
    username:z.string().min(6).max(20).regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/)
  })

  const parsedDatawithSuccess = requiredBody.safeParse(req.body)

  if (!parsedDatawithSuccess.success) {
    res.status(403).json({
      message:"Invalid Data",
      error:parsedDatawithSuccess.error
    })
  }else{

  const {email,password,username} = req.body

  const hashPassword = await bcrypt.hash(password,5)

   try {
   await UserModel.create({
     email,
     password:hashPassword,
     username
   })

   res.status(200).json({
     message: `${username} Signed Up`
   })
 } catch (error) {
  res.status(403).json({
    message:"Data is not Stored in Database"
  })
 }
}
})

app.post('/signin',async(req,res)=>{
  //Create A token For User Present in the database

  const requiredBody = z.object({
    username:z.string().min(6).max(20).regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/),
    password:z.string().min(7).max(20).regex(/[A-Z]/).regex(/[a-z]/).regex(/[^A-Za-z0-9]/).regex(/\d/), // ^A-Za-z0-9 this is for number and /\d/ this is for symbol
  })

  const parsedDatawithSuccess = requiredBody.safeParse(req.body)

  if (!parsedDatawithSuccess.success) {
    res.status(403).json({
      message:"Invalid Data",
      error:parsedDatawithSuccess.error
    })
  }

  else {


  const {username,password} = req.body
  try {
      const data = await UserModel.findOne({
      username,
    })

    if (!data) {
      res.status(403).json({
        message:"User Not Found"
      })
      return
    }

    const matchPassword =  bcrypt.compare(password,data.password)

    if (matchPassword) {
      const token = jwt.sign({
        id:data._id.toString()
      },JWT_SECRET)

      res.status(200).json({
        message:`Token is Generated`,
        token
      })
    }
  } catch (error) {
    res.status(404).json({
      message:"Token Not Generated",
      error,
    })
  }
}
})

app.post('/todo',todoopenauth,async(req,res)=>{
  const userId = req.userId
  const {title,done} = req.body

  try {
    //Create a Todo in database
    await TodoModel.create({
      title,
      done,
      userId
    })

    res.status(200).json({
      message:"Todo Store in Database"
    })
  } catch (error) {
    res.status(403).json({
      message:error
    })
  }
})

app.get('/todos',todoopenauth,async(req,res)=>{
  const userId = req.userId
  try {
    const response = await TodoModel.find({
      userId
   })
   if (response) {
      res.status(200).json({
        response
      })
   }else{
    res.status(403).json({
      message:"Some Problem in Sending"
    })
   }    
  } catch (error) {
    res.status(404).json({
      message:error
    })
  }
})

//Before no slash in front of todos
//After slash in front of todos
app.delete('/todos/:id',todoopenauth,async(req,res)=>{
  const id = req.params.id
  try {
    //we have to send only id not object remind that
    await TodoModel.findByIdAndDelete(id)

    res.status(200).json({
      message:"Todo Deleted Succesfully"
    })
  } catch (error) {
    res.status(403).json({
      message:`Something Went Wrong`
    })    
  }
})

app.listen(PORT,()=>{
  console.log(`Server Run at PORT ${PORT}`);
})