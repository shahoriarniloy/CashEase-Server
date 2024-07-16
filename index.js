const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
app.use(cookieParser());


const port = process.env.PORT || 5000;



const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    
  ],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dxgrzuk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  }
});




const logger = (req, res, next)=>{
  console.log('log:info',req.method, req.url);
  next();
}



const verifyToken = (req, res, next)=>
  {
    if(!req.headers.authorization){
      return res.status(401).send({message:'Unauthorized Access'})
    }
    const token = req.headers.authorization.split(' ')[1];

    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
      if(err){      
        return res.status(401).send({message:'Unauthorized Access'})

      }
    req.decoded=decoded;
    next();
    })
  }







async function run() {
  try {
    const database = client.db("mfs");
    const userCollection = database.collection("users");



    
    app.post('/jwt', async (req, res) => {
    const user = req.body;
     console.log(user);
     const token =jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
     res.cookie('token',token,{
      httpOnly:true,
      secure:false, 
    })
     .send({success:true})
    });
    



    app.post('/register', async (req, res) => {
      const user = req.body;
    
      const existingUserByEmail = await userCollection.findOne({ email: user.email });
      const existingUserByPhone = await userCollection.findOne({ phone: user.phone });
    
      if (existingUserByEmail || existingUserByPhone) {
        return res.send({ message: 'User already exists', insertedId: null });
      }
    
      const result = await userCollection.insertOne(user);
      res.json(result); 
    });
    
    

    app.post('/login', async (req, res) => {
      const { input, pin } = req.body;

      const query = { $or: [{ email: input }, { phone: input }] };
      const user = await userCollection.findOne(query);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isMatch = await bcrypt.compare(pin, user.pin);

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid PIN' });
      }

      res.status(200).json({ message: 'Login successful', user });
    });



    app.post('/logout', async (req, res) => {
      const token = req.cookies.token;
      if (token) {
          res.clearCookie('token').json({ success: true, message: 'Logged out successfully' });
      } else {
          res.status(400).json({ success: false, message: 'No token found' });
      }
  });
    
    
      
  


    app.get('/userrole', async (req, res) => {
      const userInput = req.query.input;
      console.log('user::::',userInput);
      
      try {
        const user = await userCollection.findOne({
          $or: [{ email: userInput }, { phone: userInput }],
        });
  
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
  
        const { role } = user;
        res.status(200).json({ role });
      } catch (error) {
        console.error('Error finding user:', error.message);
        res.status(500).json({ message: 'Server error' });
      }
    });












  
  

  } finally {
    
  }
}



run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('CashEase Server');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});