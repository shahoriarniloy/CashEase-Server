const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();

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






async function run() {
  try {
    const database = client.db("mfs");
    const userCollection = database.collection("users");
    

    app.post('/register',async (req,res)=>{
      const user =req.body;
      

      
      const existingUserByEmail = await userCollection.findOne({ email: user.email });
      console.log('email',existingUserByEmail);

      const existingUserByPhone = await userCollection.findOne({ phone: user.phone });
      console.log('phone',existingUserByPhone);

      
      if (existingUserByEmail || existingUserByPhone) {
        return res.send({ message: 'User already exists', insertedId: null });
      }
      
      const result = await userCollection.insertOne(user);
      res.send(result);
      
    })
    

    app.post('/login', async (req, res) => {
      const { input, pin } = req.body;

      // Find user by email or phone
      const query = { $or: [{ email: input }, { phone: input }] };
      const user = await userCollection.findOne(query);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Compare hashed PIN with input PIN
      const isMatch = await bcrypt.compare(pin, user.pin);

      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid PIN' });
      }

      // Successful login
      res.status(200).json({ message: 'Login successful', user });
    });

    
      
  


    app.get('/users',  async(req,res)=>{
      console.log(req.headers);
      const users = userCollection.find();
      const result = await users.toArray();
      res.send(result);
    })

   












  
  

  } finally {
    
  }
}



run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('MedicoDirect Server');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
