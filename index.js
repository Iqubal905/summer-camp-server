const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()

const stripe = require('stripe')(process.env.PAYMENT_SECRET_Key)


console.log(process.env.PAYMENT_SECRET_Key);

const port = process.env.PORT || 5000;



app.use(cors());
app.use(express.json());



const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }

  const token = authorization.split(' ')[1];
 jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }

    req.decoded = decoded;
    next();
  })
}









const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f4mhroj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();




const instructorCollection = client.db("campDb").collection("instructor");
const userCollection = client.db("campDb").collection("users");

const bookedCollection = client.db("campDb").collection("booked");
const classCollection = client.db("campDb").collection("classes");
const paymentCollection = client.db("campDb").collection("payment");



app.post('/jwt', (req, res) =>{
  const user = req.body;

  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h'})

 res.send({ token })
})




app.get('/mybooked', verifyJWT, async(req, res) =>{
  const email = req.query.email;
  const query = {email: email};
  const result = await bookedCollection.find(query).sort({ timestampField: 1 }).toArray();
  res.send(result);
});



app.get('/users/admin/:email', async (req, res) => {
  const email = req.params.email;

  
  const query = { email: email }
  const user = await userCollection.findOne(query);
  const result = { admin: user?.role === 'Admin' }
  console.log(result);
  res.send(result);
})



app.get('/users/instructor/:email', async (req, res) => {
  const email = req.params.email;

  
  const query = { email: email }
  const user = await userCollection.findOne(query);
  const result = { Instructor: user?.role === 'Instructor' }
  console.log(result);
  res.send(result);
})






app.get('/users',  async (req, res) =>{
  const result = await userCollection.find().toArray()
  res.send(result)
})


app.patch('/users/admin/:id', async (req, res) => {
  const id =req.params.id;
  console.log(id);
  const filter = { _id: new ObjectId(id)};
  const updateDoc = {
    $set:{
      role: 'Admin'
    }
  }
  const result = await userCollection.updateOne(filter, updateDoc)
  res.send(result)
})



app.patch('/users/instructor/:id', async (req, res) => {
  const id =req.params.id;
  console.log(id);
  const filter = { _id: new ObjectId(id)};
  const updateDoc = {
    $set:{
      role: 'Instructor'
    }
  }
  const result = await userCollection.updateOne(filter, updateDoc)
  res.send(result)
})




app.patch('/myclass/status/:id', async (req, res) => {
  const id =req.params.id;
  console.log(id);
  const filter = { _id: new ObjectId(id)};
  const updateDoc = {
    $set:{
      status: 'Approve'
    }
  }
  const result = await classCollection.updateOne(filter, updateDoc)
  res.send(result)
})

app.patch('/myclass/denied/:id', async (req, res) => {
  const id =req.params.id;
  console.log(id);
  const filter = { _id: new ObjectId(id)};
  const updateDoc = {
    $set:{
      status: 'Denied'
    }
  }
  const result = await classCollection.updateOne(filter, updateDoc)
  res.send(result)
})

app.post('/users', async(req, res) =>{
  const user = req.body;
  const query = {email: user.email}
  const existingUser = await userCollection.findOne(query)
  console.log(existingUser);
  if(existingUser){
    return res.send({message: 'exist user'})
  }
  const result = await userCollection.insertOne(user)
  res.send(result)
 })


app.post('/class', async (req, res) =>{
  const newClass = req.body
  console.log(newClass);
  const result = await classCollection.insertOne(newClass)
  res.send(result)
})


app.post('/booked', async (req, res) =>{
  const newBooked = req.body
  console.log(newBooked);
  const result = await bookedCollection.insertOne(newBooked)
  res.send(result)
})




app.get('/myclass', async(req, res) =>{
  const result = await classCollection.find().sort({ enrollSeats: -1 }).toArray();
  res.send(result);
})



app.get('/instructor', async(req, res) =>{
    const result = await instructorCollection.find().sort({classesTaken: -1}).toArray();
    res.send(result);
})




app.post('/create-payment-intent', async (req, res) => {
  const { price } = req.body;
  console.log(price);
  console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  const amount = parseInt(price * 100);
  console.log(price, amount);
  const paymentIntent = await stripe.paymentIntents.create({
     amount: amount,
     currency: 'usd',
     payment_method_types: ['card']
  });

   res.send({
      clientSecret: paymentIntent.client_secret 
  })
})



// app.post('/payments', async (req, res) =>{
//   const newClass = req.body
//   console.log(newClass);
//   // const result = await classCollection.insertOne(newClass)
//   // res.send(result)
// })



app.post('/payments', async (req, res) => {
  const payment = req.body;
  // console.log(payment);
  const id = payment.id
  
const insertResult = await paymentCollection.insertOne(payment);
console.log(insertResult);

const query = {_id: id}

 const result = await bookedCollection.deleteOne(query);
 console.log(result);

 res.send( insertResult );
    
})



app.patch('/seatUpdate/:id', async (req, res) => {
  const id =req.params.id;
  
  console.log(id);
  const filter = { _id: new ObjectId(id)};
  console.log(filter);
  const updateDoc = {
     $inc:{
      availableSeats: -1,
      enrollSeats: +1
     } 
    } 
  const result = await classCollection.updateOne(filter, updateDoc)
  console.log(result);
  res.send(result)
})








app.get('/payment', async(req, res) =>{
 
  const result = await paymentCollection.find().toArray();
  res.send(result);
});




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);







app.get('/', (req, res) => {
    res.send('capm running')
})

app.listen(port, () => {
    console.log(`Capm is running  on port ${port}`);
})